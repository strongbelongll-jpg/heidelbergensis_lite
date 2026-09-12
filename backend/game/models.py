from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone
import random

# Список имён для жителей
NAMES = [
    'Тот-кто-стоит-справа',
    'Тот-кто-стоит-слева',
    'Тот-кто-несет-копье',
    'Тот-кто-точит-камень',
    'Тот-кто-разжигает-уголь',
    'Тот-кто-берет-кость',
    'Тот-кто-смотрит-вдаль',
    'Тот-кто-слышит-воду',
    'Тот-кто-помнит-старое-стойбище',
    'Тот-кто-ходит-по-краю',
    'Тот-кто-идет-вторым',
    'Тот-кто-держит-шкуру',
    'Тот-кто-режет-жилы',
    'Тот-кто-выбивает-искру',
    'Тот-кто-закрывает-вход',
    'Тот-кто-выходит-первым',
    'Тот-кто-несет-детеныша',
    'Тот-кто-кормит-у-костра',
    'Тот-кто-собирает-коренья',
    'Тот-кто-знает-травы',
    'Тот-кто-ломает-орехи',
    'Тот-кто-убил-оленя',
    'Тот-кто-видел-медведя',
    'Тот-кто-убежал-от-саблезуба',
    'Тот-кто-спит-у-стены',
    'Тот-кто-встает-до-света',
    'Тот-кто-говорит-с-ветром',
    'Тот-кто-показывает-дорогу',
    'Тот-кто-чинит-дротик',
    'Тот-кто-связывает-ремни',
    'Тот-кто-вырывает-зубы',
    'Тот-кто-варит-жир',
    'Тот-кто-дует-на-огонь',
    'Тот-кто-бросает-первым',
    'Тот-кто-поднимает-тяжелое',
    'Тот-кто-лазает-по-скалам',
    'Тот-кто-находит-кремень',
    'Тот-кто-заживляет-раны',
    'Тот-кто-воет-по-ночам',
    'Тот-кто-уходит-и-не-возвращается'
]

class Tribe(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    name = models.CharField(max_length=100, default='Моё племя')
    
    # Ресурсы (только 3)
    food = models.IntegerField(default=50)
    wood = models.IntegerField(default=30)
    stone = models.IntegerField(default=20)
    
    # Население
    population = models.IntegerField(default=5)
    max_population = models.IntegerField(default=5)  # лимит от хижин
    
    # Уровень хижин (0 = нет, 1 = одна хижина и т.д.)
    hut_level = models.IntegerField(default=0)
    session = models.ForeignKey('GameSession', on_delete=models.SET_NULL, null=True, blank=True)
    
    def __str__(self):
        return self.name

    def process_tasks(self):
        """Проверяет всех жителей племени и начисляет ресурсы за завершённые задания"""
        
        # 1. Расход еды ОТКЛЮЧЁН — теперь через Celery (каждые 10 минут)
        # consumption = self.population * 0.5
        # self.food = max(0, self.food - consumption)

        # 2. Если еда кончилась — игрок проиграл
        if self.food <= 0:
            from .models import GameSession
            session = GameSession.objects.filter(is_active=True).first()
            if session:
                session.is_active = False
                session.save()
            self.delete()
            return

        now = timezone.now()

        # 3. ⭐ ПРИРОСТ НАСЕЛЕНИЯ (каждую минуту, 100% шанс)
        if now.second < 2:  # каждую минуту
            if self.population < self.max_population and self.food > 10:
                # 100% шанс — создаём жителя
                Tribesman.objects.create(
                    tribe=self,
                    name=random.choice(NAMES),
                    task='idle',
                    is_alive=True
                )
                self.population += 1
                self.food -= 10
                self.save()

        # 4. Обработка заданий жителей
        for tribesman in self.tribesmen.filter(is_alive=True).exclude(task='idle'):
            if tribesman.task_start_time:
                elapsed = (now - tribesman.task_start_time).total_seconds() / 60
                if elapsed >= tribesman.task_duration_minutes:
                    
                    # ⭐ СМЕРТНОСТЬ
                    death_chance = 0
                    if tribesman.task == 'hunting_10' or tribesman.task == 'hunting_5':
                        death_chance = 0.3
                    elif tribesman.task == 'wood_10' or tribesman.task == 'wood_2':
                        death_chance = 0.2
                    elif tribesman.task == 'stone_10' or tribesman.task == 'stone_2':
                        death_chance = 0.2
                    
                    if random.random() < death_chance:
                        tribesman.is_alive = False
                        tribesman.task = 'dead'
                        tribesman.save()
                        continue  # пропускаем начисление ресурсов
                    
                    # Начисляем ресурсы
                    if tribesman.task == 'hunting_10' or tribesman.task == 'hunting_5':
                        self.food += 20
                    elif tribesman.task == 'wood_10' or tribesman.task == 'wood_2':
                        self.wood += 15
                    elif tribesman.task == 'stone_10' or tribesman.task == 'stone_2':
                        self.stone += 10
                    
                    tribesman.task = 'idle'
                    tribesman.task_duration_minutes = None
                    tribesman.task_start_time = None
                    tribesman.save()
        
        # ⭐ СИНХРОНИЗАЦИЯ: population = реальное количество живых жителей
        self.population = self.tribesmen.filter(is_alive=True).count()
        self.save()

class Tribesman(models.Model):
    TASK_CHOICES = [
        ('idle', 'Свободен'),
        ('hunting_5', 'Охота (5 мин)'),
        ('hunting_10', 'Охота (10 мин)'),
        ('hunting_40', 'Охота (40 мин)'),
        ('wood_2', 'Сбор дерева (2 мин)'),
        ('wood_10', 'Сбор дерева (10 мин)'),
        ('stone_2', 'Сбор камней (2 мин)'),
        ('stone_10', 'Сбор камней (10 мин)'),
        ('building', 'Строительство хижины'),
        ('dead', 'Мёртв'),
    ]
    
    tribe = models.ForeignKey(Tribe, on_delete=models.CASCADE, related_name='tribesmen')
    name = models.CharField(max_length=100, default='Охотник')
    task = models.CharField(max_length=20, choices=TASK_CHOICES, default='idle')
    task_duration_minutes = models.IntegerField(null=True, blank=True)
    task_start_time = models.DateTimeField(null=True, blank=True)
    is_alive = models.BooleanField(default=True)
    
    def __str__(self):
        return f"{self.name} ({self.get_task_display()})"


class Settlement(models.Model):
    SLOTS = 4

    tribe = models.OneToOneField(Tribe, on_delete=models.CASCADE, related_name='settlement')
    slot = models.PositiveSmallIntegerField(unique=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['slot']

    def __str__(self):
        return f"Место {self.slot}: {self.tribe.name}"

class GameSession(models.Model):
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='created_sessions')
    started_at = models.DateTimeField(auto_now_add=True)
    ends_at = models.DateTimeField()
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return f"Сессия {self.id} ({'активна' if self.is_active else 'завершена'})"

    def is_expired(self):
        return timezone.now() > self.ends_at