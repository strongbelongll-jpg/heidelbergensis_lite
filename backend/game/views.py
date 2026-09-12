from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth.models import User
from django.db import IntegrityError, transaction
from django.middleware.csrf import get_token
from django.utils import timezone
from datetime import timedelta
from django.core.cache import cache
from django.utils.decorators import method_decorator
import random

from django.conf import settings
from .models import Tribe, Tribesman, Settlement, GameSession, NAMES
from .serializers import TribeSerializer
from .decorators import tribe_required

NACHALNYE_ZHITELI = 5   # столько охотников получает новое племя


def google_nastroen(providers=None):
    if providers is None:
        providers = settings.SOCIALACCOUNT_PROVIDERS
    app = providers.get('google', {}).get('APP', {})
    return bool(app.get('client_id') and app.get('secret'))


def plemya_dlya(user):
    session = GameSession.objects.filter(is_active=True).first()
    tribe, created = Tribe.objects.get_or_create(
        user=user,
        defaults={
            'name': f'Племя {user.first_name or user.username}',
            'session': session,
        }
    )
    if created:
        for i in range(1, NACHALNYE_ZHITELI + 1):
            Tribesman.objects.create(tribe=tribe, name=random.choice(NAMES))
        
        if User.objects.count() == 1:
            GameSession.objects.filter(is_active=True).update(is_active=False)
            GameSession.objects.create(
                created_by=user,
                ends_at=timezone.now() + timedelta(hours=1)
            )
    return tribe


def tekushchiy_user(request):
    user = getattr(request, 'user', None)
    if user is not None and user.is_authenticated:
        return user
    if google_nastroen():
        return None
    return User.objects.first()


def tekushchee_plemya(request):
    user = tekushchiy_user(request)
    if not user:
        return None
    return plemya_dlya(user)


def net_polzovatelya():
    if google_nastroen():
        return Response({'error': 'Войдите через Google'}, status=status.HTTP_401_UNAUTHORIZED)
    return Response({'error': 'Пользователь не найден'}, status=status.HTTP_404_NOT_FOUND)


def zavershit_session(session):
    """Общая логика завершения сессии с подведением итогов и ПОЛНОЙ очисткой"""
    session.is_active = False
    session.save()
    
    # Сначала пробуем племена из сессии
    tribes = Tribe.objects.filter(session=session)
    # Если пусто — берём все племена (подстраховка)
    if not tribes.exists():
        tribes = Tribe.objects.all()
    
    results = [
        {
            'name': t.name,
            'population': t.population,
            'food': t.food,
            'wood': t.wood,
            'stone': t.stone,
            'total': t.population + t.food + t.wood + t.stone
        }
        for t in tribes
    ]
    
    winner = max(results, key=lambda x: x['total']) if results else None
    
    # ПОЛНАЯ ОЧИСТКА
    Settlement.objects.all().delete()
    tribes.delete()
    Tribesman.objects.all().delete()
    User.objects.all().delete()
    
    return results, winner


class MeView(APIView):
    def get(self, request):
        get_token(request)
        user = request.user if request.user.is_authenticated else None
        base = request.build_absolute_uri('/')[:-1]
        data = {
            'authenticated': user is not None,
            'google_configured': google_nastroen(),
            'login_url': base + '/accounts/google/login/?process=login',
            'logout_url': base + '/accounts/logout/',
        }
        if user is not None:
            tribe = plemya_dlya(user)
            data.update({'username': user.username, 'tribe_name': tribe.name})
        return Response(data)


class TribeDetailView(APIView):
    @method_decorator(tribe_required)
    def get(self, request):
        tribe = tekushchee_plemya(request)
        if tribe is None:
            if google_nastroen():
                return net_polzovatelya()
            return Response({'error': 'Нет пользователей'}, status=status.HTTP_404_NOT_FOUND)
        
        session = GameSession.objects.filter(is_active=True).first()
        if session and session.is_expired():
            results, winner = zavershit_session(session)
            return Response({
                'error': 'Сессия завершена!',
                'results': results,
                'winner': winner
            }, status=status.HTTP_403_FORBIDDEN)
        
        tribe.process_tasks()
        return Response(TribeSerializer(tribe).data)


def otpravit_zhitelya(request, task, minutes, kogo_net, kuda):
    tribe = tekushchee_plemya(request)
    if tribe is None:
        return net_polzovatelya()
    tribesman = Tribesman.objects.filter(tribe=tribe, task='idle', is_alive=True).first()
    if not tribesman:
        return Response({'error': kogo_net}, status=status.HTTP_400_BAD_REQUEST)
    tribesman.task = task
    tribesman.task_duration_minutes = minutes
    tribesman.task_start_time = timezone.now()
    tribesman.save()
    return Response({'message': f'{tribesman.name} отправился {kuda}!'})


class HuntView(APIView):
    @method_decorator(tribe_required)
    def post(self, request):
        return otpravit_zhitelya(request, 'hunting_5', 5, 'Нет свободных охотников', 'на охоту')


class GatherWoodView(APIView):
    @method_decorator(tribe_required)
    def post(self, request):
        return otpravit_zhitelya(request, 'wood_2', 2, 'Нет свободных жителей', 'собирать дерево')


class GatherStoneView(APIView):
    @method_decorator(tribe_required)
    def post(self, request):
        return otpravit_zhitelya(request, 'stone_2', 2, 'Нет свободных жителей', 'собирать камни')


class BuildHutView(APIView):
    @method_decorator(tribe_required)
    def post(self, request):
        tribe = tekushchee_plemya(request)
        if tribe is None:
            return net_polzovatelya()
        if tribe.wood < 20 or tribe.stone < 10:
            return Response({'error': 'Не хватает ресурсов (нужно: 20 дерева, 10 камней)'},
                            status=status.HTTP_400_BAD_REQUEST)
        tribe.wood -= 20
        tribe.stone -= 10
        tribe.hut_level += 1
        tribe.max_population += 2
        tribe.save()
        return Response({
            'message': f'Хижина построена! Уровень: {tribe.hut_level}',
            'max_population': tribe.max_population,
        })


def opisat_poselenie(s, moyo_plemya):
    return {'slot': s.slot, 'owner_name': s.tribe.name,
            'is_mine': moyo_plemya is not None and s.tribe_id == moyo_plemya.id}


class SettlementListView(APIView):
    @method_decorator(tribe_required)
    def get(self, request):
        moyo = tekushchee_plemya(request)
        poseleniya = Settlement.objects.select_related('tribe').order_by('slot')
        return Response([opisat_poselenie(s, moyo) for s in poseleniya])


class SettlementClaimView(APIView):
    @method_decorator(tribe_required)
    def post(self, request):
        tribe = tekushchee_plemya(request)
        if tribe is None:
            return net_polzovatelya()
        try:
            slot = int(request.data.get('slot'))
        except (TypeError, ValueError):
            return Response({'error': 'Укажите номер места от 1 до %d' % Settlement.SLOTS},
                            status=status.HTTP_400_BAD_REQUEST)
        if not 1 <= slot <= Settlement.SLOTS:
            return Response({'error': 'Место должно быть от 1 до %d' % Settlement.SLOTS},
                            status=status.HTTP_400_BAD_REQUEST)
        if Settlement.objects.filter(tribe=tribe).exists():
            return Response({'error': 'У вашего племени уже есть поселение'},
                            status=status.HTTP_400_BAD_REQUEST)
        if Settlement.objects.filter(slot=slot).exists():
            return Response({'error': 'Это место уже занято другим племенем'},
                            status=status.HTTP_400_BAD_REQUEST)
        try:
            with transaction.atomic():
                s = Settlement.objects.create(tribe=tribe, slot=slot)
        except IntegrityError:
            return Response({'error': 'Это место уже занято другим племенем'},
                            status=status.HTTP_400_BAD_REQUEST)
        return Response({'message': f'Поселение основано на месте {slot}',
                         **opisat_poselenie(s, tribe)}, status=status.HTTP_201_CREATED)


class CanStartSessionView(APIView):
    @method_decorator(tribe_required)
    def get(self, request):
        user = request.user
        if not user.is_authenticated:
            return Response({'can_start': False, 'reason': 'Не авторизован'}, status=status.HTTP_401_UNAUTHORIZED)
        
        active_session = GameSession.objects.filter(is_active=True).first()
        if active_session:
            return Response({'can_start': False, 'reason': 'Уже есть активная сессия'})
        
        first_user = User.objects.order_by('date_joined').first()
        if user != first_user:
            return Response({'can_start': False, 'reason': 'Только первый пользователь может запустить игру'})
        
        return Response({'can_start': True})


class StartSessionView(APIView):
    @method_decorator(tribe_required)
    def post(self, request):
        user = request.user
        if not user.is_authenticated:
            return Response({'error': 'Не авторизован'}, status=status.HTTP_401_UNAUTHORIZED)
        
        first_user = User.objects.order_by('date_joined').first()
        if user != first_user:
            return Response({'error': 'Только первый пользователь может запустить игру'}, status=status.HTTP_403_FORBIDDEN)
        
        GameSession.objects.filter(is_active=True).update(is_active=False)
        
        session = GameSession.objects.create(
            created_by=user,
            ends_at=timezone.now() + timedelta(hours=1)
        )
        
        return Response({
            'session_id': session.id,
            'ends_at': session.ends_at,
            'message': 'Игровая сессия запущена на 1 час!'
        }, status=status.HTTP_201_CREATED)


class EndSessionView(APIView):
    @method_decorator(tribe_required)
    def post(self, request):
        user = request.user
        if not user.is_authenticated:
            return Response({'error': 'Не авторизован'}, status=status.HTTP_401_UNAUTHORIZED)
        
        session = GameSession.objects.filter(is_active=True).first()
        if not session:
            return Response({'error': 'Нет активной сессии'}, status=status.HTTP_404_NOT_FOUND)
        
        if session.created_by != user:
            return Response({'error': 'Только создатель сессии может завершить игру'}, status=status.HTTP_403_FORBIDDEN)
        
        results, winner = zavershit_session(session)
        
        return Response({
            'message': 'Сессия завершена!',
            'results': results,
            'winner': winner
        }, status=status.HTTP_200_OK)


class SessionStatusView(APIView):
    @method_decorator(tribe_required)
    def get(self, request):
        session = GameSession.objects.filter(is_active=True).first()
        if session:
            return Response({
                'active': True,
                'ends_at': session.ends_at,
                'created_by': session.created_by.username
            })
        return Response({'active': False})