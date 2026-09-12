# -*- coding: utf-8 -*-
"""Поселения на карте: у каждого из четырёх игроков
своё место, занятые места видны всем.

Запуск:  python manage.py test game
"""
from django.contrib.auth.models import User
from django.test import TestCase
from rest_framework.test import APIClient
from .models import Settlement, Tribe, Tribesman
from .models import Settlement, Tribe


def igrok(username):
    u = User.objects.create_user(username=username, password='x')
    t = Tribe.objects.create(user=u, name='Племя ' + username)
    return u, t


class SettlementsApiTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.u1, self.t1 = igrok('ivan')
        self.u2, self.t2 = igrok('petr')

    def test_spisok_pust_poka_nikto_ne_osnoval(self):
        self.client.force_authenticate(self.u1)
        r = self.client.get('/api/settlements/')
        self.assertEqual(r.status_code, 200)
        self.assertEqual(r.json(), [])

    def test_osnovat_poselenie_na_svobodnom_meste(self):
        self.client.force_authenticate(self.u1)
        r = self.client.post('/api/settlements/claim/', {'slot': 2}, format='json')
        self.assertEqual(r.status_code, 201, r.content)
        self.assertEqual(Settlement.objects.get(tribe=self.t1).slot, 2)
        spisok = self.client.get('/api/settlements/').json()
        self.assertEqual(spisok, [{'slot': 2, 'owner_name': 'Племя ivan', 'is_mine': True}])

    def test_chuzhoe_poselenie_vidno_no_ne_moyo(self):
        Settlement.objects.create(tribe=self.t2, slot=4)
        self.client.force_authenticate(self.u1)
        spisok = self.client.get('/api/settlements/').json()
        self.assertEqual(spisok, [{'slot': 4, 'owner_name': 'Племя petr', 'is_mine': False}])

    def test_zanyatoe_mesto_zanyat_nelzya(self):
        Settlement.objects.create(tribe=self.t2, slot=1)
        self.client.force_authenticate(self.u1)
        r = self.client.post('/api/settlements/claim/', {'slot': 1}, format='json')
        self.assertEqual(r.status_code, 400)
        self.assertIn('занято', r.json()['error'].lower())
        self.assertFalse(Settlement.objects.filter(tribe=self.t1).exists())

    def test_vtoroe_poselenie_odnomu_igroku_nelzya(self):
        Settlement.objects.create(tribe=self.t1, slot=1)
        self.client.force_authenticate(self.u1)
        r = self.client.post('/api/settlements/claim/', {'slot': 3}, format='json')
        self.assertEqual(r.status_code, 400)
        self.assertEqual(Settlement.objects.filter(tribe=self.t1).count(), 1)

    def test_mesto_vne_chetyryoh_otklonyaetsya(self):
        self.client.force_authenticate(self.u1)
        for slot in (0, 5, 'abc', None):
            r = self.client.post('/api/settlements/claim/', {'slot': slot}, format='json')
            self.assertEqual(r.status_code, 400, slot)
        self.assertEqual(Settlement.objects.count(), 0)

    def test_chetvero_zanimayut_chetyre_mesta_a_pyatyi_ne_pomeshchaetsya(self):
        users = [igrok('p%d' % i) for i in range(4)]
        for i, (u, t) in enumerate(users, start=1):
            self.client.force_authenticate(u)
            r = self.client.post('/api/settlements/claim/', {'slot': i}, format='json')
            self.assertEqual(r.status_code, 201, r.content)
        self.client.force_authenticate(self.u1)
        r = self.client.post('/api/settlements/claim/', {'slot': 1}, format='json')
        self.assertEqual(r.status_code, 400)
        self.assertEqual(Settlement.objects.count(), 4)

    def test_dva_zaprosa_odnovremenno_na_odno_mesto_dayut_odno_poselenie(self):
        """Гонка: два игрока жмут одно место - в базе уникальность по slot."""
        from django.db import IntegrityError
        Settlement.objects.create(tribe=self.t1, slot=2)
        with self.assertRaises(IntegrityError):
            Settlement.objects.create(tribe=self.t2, slot=2)


class AuthApiTests(TestCase):
    """Вход через Google (django-allauth), часть 5: фронт узнаёт, кто вошёл."""

    def test_me_bez_vhoda(self):
        r = APIClient().get('/api/me/')
        self.assertEqual(r.status_code, 200)
        data = r.json()
        self.assertFalse(data['authenticated'])
        self.assertIn('google_configured', data)
        self.assertIn('login_url', data)
        self.assertIn('/accounts/google/login/', data['login_url'])

    def test_me_vydayot_kuku_csrftoken(self):
        """Фронт шлёт POST с X-CSRFToken из куки csrftoken - кука обязана прийти
        уже с первого запроса /api/me/ (живой вход 06.09: без неё 403 на POST)."""
        r = self.client.get('/api/me/')
        self.assertIn('csrftoken', r.cookies)
        self.assertTrue(r.cookies['csrftoken'].value)

    def test_me_s_vhodom(self):
        u, t = igrok('gosha')
        c = APIClient()
        c.force_authenticate(u)
        data = c.get('/api/me/').json()
        self.assertTrue(data['authenticated'])
        self.assertEqual(data['username'], 'gosha')
        self.assertEqual(data['tribe_name'], 'Племя gosha')
        self.assertIn('/accounts/logout/', data['logout_url'])

    def test_google_login_marshrut_podklyuchen(self):
        """allauth подключён: страница входа Google существует (без ключей она
        отвечает не 404, а ошибкой настройки или редиректом)."""
        r = self.client.get('/accounts/google/login/')
        self.assertNotEqual(r.status_code, 404)

    def test_vyhod_po_ssylke_rabotaet(self):
        u, t = igrok('vasya')
        self.client.force_login(u)
        self.assertTrue(self.client.get('/api/me/').json()['authenticated'])
        r = self.client.get('/accounts/logout/')
        self.assertIn(r.status_code, (200, 302))
        self.assertFalse(self.client.get('/api/me/').json()['authenticated'])

    def test_google_configured_zavisit_ot_klyuchey(self):
        """allauth кеширует настройки, override_settings его ломает - поэтому
        проверяем саму функцию на словарях, а /api/me/ - что берёт её значение."""
        from .views import google_nastroen
        self.assertFalse(google_nastroen({'google': {'APP': {'client_id': '', 'secret': ''}}}))
        self.assertFalse(google_nastroen({'google': {'APP': {'client_id': 'abc', 'secret': ''}}}))
        self.assertFalse(google_nastroen({}))
        self.assertTrue(google_nastroen({'google': {'APP': {'client_id': 'abc', 'secret': 'def'}}}))
        from django.conf import settings
        self.assertEqual(APIClient().get('/api/me/').json()['google_configured'],
                         google_nastroen(settings.SOCIALACCOUNT_PROVIDERS))


class EnvFileTests(TestCase):
    """Ключи Google читаются из backend/.env без сторонних библиотек."""

    def _fail(self, text):
        import tempfile, os
        fd, put = tempfile.mkstemp(suffix='.env')
        with os.fdopen(fd, 'w', encoding='utf-8') as fh:
            fh.write(text)
        return put

    def test_chitaet_klyuchi_i_kavychki_i_kommentarii(self):
        from travian_project.env import zagruzit_env
        put = self._fail('# ключи\nGOOGLE_CLIENT_ID=abc.apps\nGOOGLE_CLIENT_SECRET="GOCSPX-x y"\n\nFRONTEND_URL = http://localhost:5173\nмусор без равно\n')
        env = {}
        got = zagruzit_env(put, env)
        self.assertEqual(env, {'GOOGLE_CLIENT_ID': 'abc.apps', 'GOOGLE_CLIENT_SECRET': 'GOCSPX-x y',
                               'FRONTEND_URL': 'http://localhost:5173'})
        self.assertEqual(got, env)

    def test_ne_perezapisyvaet_uzhe_zadannoe(self):
        from travian_project.env import zagruzit_env
        put = self._fail('GOOGLE_CLIENT_ID=iz_faila\n')
        env = {'GOOGLE_CLIENT_ID': 'iz_compose'}
        zagruzit_env(put, env)
        self.assertEqual(env['GOOGLE_CLIENT_ID'], 'iz_compose')

    def test_net_faila_ne_padaet(self):
        from travian_project.env import zagruzit_env
        env = {}
        self.assertEqual(zagruzit_env('C:/net/takogo/.env', env), {})
        self.assertEqual(env, {})


class TekushchiyIgrokTests(TestCase):
    """Пока входа нет (часть 5), API работает как раньше - на первом пользователе.
    Когда игрок вошёл, каждый видит СВОЁ племя, а не первое попавшееся."""

    def test_bez_vhoda_beryotsya_pervyi_polzovatel(self):
        """Демо-режим: ключей Google нет - игра идёт от первого пользователя.
        Ключи глушим явно: на машине разработчика они лежат в backend/.env."""
        from unittest import mock
        u1, t1 = igrok('first')
        igrok('second')
        with mock.patch('game.views.google_nastroen', return_value=False):
            r = APIClient().get('/api/tribe/')
        self.assertEqual(r.status_code, 200)
        self.assertEqual(r.json()['name'], 'Племя first')

    def test_voshedshiy_vidit_svoyo_plemya(self):
        igrok('first')
        u2, t2 = igrok('second')
        c = APIClient()
        c.force_authenticate(u2)
        self.assertEqual(c.get('/api/tribe/').json()['name'], 'Племя second')
        c.post('/api/settlements/claim/', {'slot': 3}, format='json')
        self.assertEqual(Settlement.objects.get(slot=3).tribe, t2)

    def test_novomu_igroku_sozdayotsya_plemya_s_zhitelyami(self):
        """Вошёл через Google впервые - племя и 5 жителей появляются сами,
        иначе новому игроку нечем играть (у заказчика жителей заводили руками)."""
        u = User.objects.create_user(username='novichok', password='x')
        c = APIClient()
        c.force_authenticate(u)
        r = c.get('/api/tribe/')
        self.assertEqual(r.status_code, 200)
        self.assertEqual(len(r.json()['tribesmen']), 5)
        self.assertEqual(Tribe.objects.get(user=u).tribesmen.count(), 5)
        c.get('/api/tribe/')
        self.assertEqual(Tribe.objects.get(user=u).tribesmen.count(), 5)  # не плодятся

    def test_poryadok_me_potom_tribe_tozhe_dayot_zhiteley(self):
        """Фронт первым зовёт /api/me/ - племя, рождённое там, обязано быть с жителями
        (блокер проверки части 5: рождалось пустым)."""
        u = User.objects.create_user(username='vova', password='x', first_name='Вова')
        c = APIClient()
        c.force_authenticate(u)
        me = c.get('/api/me/').json()
        self.assertEqual(me['tribe_name'], 'Племя Вова')
        r = c.get('/api/tribe/').json()
        self.assertEqual(len(r['tribesmen']), 5)
        self.assertEqual(r['name'], 'Племя Вова')

    def test_pri_nastroennom_google_anonim_ne_upravlyaet_chuzhim_plemenem(self):
        """Ключи Google заданы - невошедший не должен видеть и двигать племя первого
        игрока (блокер проверки части 5). Список поселений при этом виден всем."""
        from unittest import mock
        igrok('first')
        c = APIClient()
        with mock.patch('game.views.google_nastroen', return_value=True):
            self.assertEqual(c.get('/api/tribe/').status_code, 401)
            self.assertEqual(c.post('/api/hunt/').status_code, 401)
            self.assertEqual(c.post('/api/build_hut/').status_code, 401)
            r = c.post('/api/settlements/claim/', {'slot': 1}, format='json')
            self.assertEqual(r.status_code, 401)
            self.assertEqual(Settlement.objects.count(), 0)
            self.assertEqual(c.get('/api/settlements/').status_code, 200)
            self.assertIn('Google', c.get('/api/tribe/').json()['error'])

    def test_deystviya_idut_v_svoyo_plemya(self):
        igrok('first')
        u2, t2 = igrok('second')
        from .models import Tribesman
        Tribesman.objects.create(tribe=t2, name='Охотник')
        c = APIClient()
        c.force_authenticate(u2)
        r = c.post('/api/hunt/')
        self.assertEqual(r.status_code, 200, r.content)
        self.assertEqual(t2.tribesmen.get().task, 'hunting_5')

class ModelTests(TestCase):
    """Тесты для моделей Tribe, Tribesman, Settlement, GameSession"""

    def test_tribe_creation(self):
        user = User.objects.create_user(username='testuser', password='12345')
        tribe = Tribe.objects.create(user=user, name='Тестовое племя')
        
        self.assertEqual(tribe.name, 'Тестовое племя')
        self.assertEqual(tribe.food, 50)
        self.assertEqual(tribe.wood, 30)
        self.assertEqual(tribe.stone, 20)
        self.assertEqual(tribe.population, 5)
        self.assertEqual(tribe.max_population, 5)
        self.assertEqual(tribe.hut_level, 0)
        self.assertEqual(str(tribe), 'Тестовое племя')

    def test_tribesman_creation(self):
        user = User.objects.create_user(username='testuser2', password='12345')
        tribe = Tribe.objects.create(user=user, name='Племя для жителя')
        tribesman = Tribesman.objects.create(
            tribe=tribe,
            name='Тестовый житель',
            task='idle',
            is_alive=True
        )
        
        self.assertEqual(tribesman.name, 'Тестовый житель')
        self.assertEqual(tribesman.task, 'idle')
        self.assertTrue(tribesman.is_alive)
        self.assertEqual(str(tribesman), 'Тестовый житель (Свободен)')

    def test_tribesman_task_change(self):
        user = User.objects.create_user(username='testuser3', password='12345')
        tribe = Tribe.objects.create(user=user, name='Племя для задач')
        tribesman = Tribesman.objects.create(tribe=tribe, name='Охотник', task='idle', is_alive=True)
        
        tribesman.task = 'hunting_10'
        tribesman.task_duration_minutes = 10
        tribesman.save()
        
        self.assertEqual(tribesman.task, 'hunting_10')
        self.assertEqual(tribesman.task_duration_minutes, 10)

    def test_settlement_creation(self):
        user = User.objects.create_user(username='testuser4', password='12345')
        tribe = Tribe.objects.create(user=user, name='Племя для поселения')
        settlement = Settlement.objects.create(tribe=tribe, slot=1)
        
        self.assertEqual(settlement.slot, 1)
        self.assertEqual(str(settlement), f'Место 1: Племя для поселения')
        self.assertEqual(Settlement.SLOTS, 4)

    def test_settlement_unique_slot(self):
        user1 = User.objects.create_user(username='user_a', password='12345')
        user2 = User.objects.create_user(username='user_b', password='12345')
        tribe1 = Tribe.objects.create(user=user1, name='Племя A')
        tribe2 = Tribe.objects.create(user=user2, name='Племя B')
        
        Settlement.objects.create(tribe=tribe1, slot=1)
        
        with self.assertRaises(Exception):
            Settlement.objects.create(tribe=tribe2, slot=1)