Heidelbergensis — браузерная игра (Django + DRF + React)
Четыре племени на одной карте. Каждый игрок входит через Google, основывает
поселение на одном из четырёх мест и развивает его: охота, сбор дерева и камня,
постройка хижин. Игровая сессия длится 1 час, после чего подводятся итоги и
объявляется победитель. Занятые места видны всем.

Стек
Бэкенд: Django 4.2 + Django REST Framework

Фронтенд: React 18 (Vite) + axios

База данных: PostgreSQL 15

Фоновые задачи: Celery + Redis + django-celery-beat

Авторизация: Google OAuth (django-allauth)

GraphQL: Graphene-Django

Документация API: drf-spectacular (Swagger)

Запуск в Docker (основной способ)
bash
cp backend/.env.example .env
docker compose up -d --build
Игра: http://localhost:5173

API: http://localhost:8000/api/

Админка: http://localhost:8000/admin/

Swagger: http://localhost:8000/api/docs/

GraphQL: http://localhost:8000/graphql/

Миграции применяются автоматически. Суперпользователя создайте один раз:

bash
docker compose exec backend python manage.py createsuperuser
Сервисы в docker-compose
Сервис	Назначение
backend	Django + DRF
frontend	React (Vite)
db	PostgreSQL 15
redis	Брокер для Celery
celery	Фоновые задачи (списание еды)
celery-beat	Планировщик задач
Вход через Google
В Google Cloud Console создайте OAuth client ID типа Web application.

Authorized redirect URI: http://localhost:8000/accounts/google/login/callback/

Ключи положите в файл .env в корне проекта:

text
GOOGLE_CLIENT_ID=...apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=...
FRONTEND_URL=http://localhost:5173
Пока ключей нет, игра работает в демо-режиме от первого пользователя базы.

При первом входе игроку автоматически создаётся племя «Племя <имя>» с пятью охотниками.

 API
Метод	Адрес	Что делает
GET	/api/me/	кто вошёл
GET	/api/tribe/	моё племя: ресурсы, население, жители, hut_level
POST	/api/hunt/	отправить жителя на охоту (5 минут)
POST	/api/gather_wood/	на сбор дерева (2 минуты)
POST	/api/gather_stone/	на сбор камней (2 минуты)
POST	/api/build_hut/	построить хижину (20 дерева, 10 камней, +2 к лимиту)
GET	/api/settlements/	все поселения на карте
POST	/api/settlements/claim/	основать поселение {"slot": 1..4}
GET	/api/can_start/	может ли игрок запустить игру
POST	/api/start_session/	запустить игровую сессию (1 час)
GET	/api/session_status/	статус активной сессии
POST	/api/end_session/	завершить сессию (подвести итоги)
GET	/accounts/google/login/	вход через Google
GET	/accounts/logout/	выход
GET	/api/schema/	OpenAPI-схема
GET	/api/docs/	Swagger UI
POST	/graphql/	GraphQL-запрос
POST-запросы с сессией требуют заголовок X-CSRFToken — фронт делает это сам через axios.

Экраны
Welcome (WelcomeScreen.jsx) — стартовое окно с кнопкой «Войти».

Lobby (LobbyScreen.jsx) — окно с диспозицией и кнопкой «Начать».

Карта мира (WorldMap.jsx) — картинка public/map.png 1920×1080 в сцене 16:9, четыре места. Свободное — кнопка «Основать», чужое — имя племени, своё — «Моё поселение».

Поселение (Village.jsx) — поляна с костром village_bg.png, хижины hut.png по плану из huts.js (максимум 8).

Панель племени (TribePanel.jsx) — ресурсы, кнопка «Построить хижину», списки жителей.

Панель действий (GameControls.jsx) — статус сессии, таймер, кнопка «Завершить».

Кнопки действий (HuntButton.jsx, WoodButton.jsx, BottomRightPanel.jsx) — охота, сбор дерева и камней, панель погибших.

Окно результатов (ResultsScreen.jsx) — фон o4.jpg, список племён и количество жителей, кнопка «Выйти».

Игровая механика
Ресурсы: еда, дерево, камни.

Жители: охота (5 мин), сбор дерева (2 мин), сбор камней (2 мин).

Смертность: охота — 30%, сбор — 20%.

Прирост: каждую минуту новый житель, если есть еда и свободные места.

Расход еды: через Celery каждые 10 минут, независимо от игрока.

Сессия: 1 час, автоматическое завершение по таймеру или вручную.

Победитель: по сумме ресурсов и населения.

Собственный декоратор
В проекте используется собственный декоратор tribe_required (game/decorators.py),
который проверяет, что пользователь авторизован и у него есть племя. Он применяется
во всех вьюхах, где нужен доступ к племени.

Тесты
bash
docker compose exec backend python manage.py test game
28 тестов: модели, поселения, авторизация через Google, чтение .env, логика
текущего пользователя.

Структура
text
heidelbergensis_lite/
├── backend/
│   ├── game/                  # основное приложение
│   │   ├── models.py          # Tribe, Tribesman, Settlement, GameSession
│   │   ├── views.py           # API-вьюхи
│   │   ├── tasks.py           # Celery-задача deduct_food
│   │   ├── decorators.py      # tribe_required
│   │   ├── schema.py          # GraphQL-схема
│   │   └── tests.py           # 28 тестов
│   ├── travian_project/       # настройки, celery.py, env.py
│   └── requirements.txt
├── frontend/
│   └── src/
│       ├── App.jsx            # главный компонент
│       ├── WorldMap.jsx       # карта
│       ├── Village.jsx        # поселение
│       ├── TribePanel.jsx     # панель племени
│       ├── GameControls.jsx   # панель сессии
│       ├── ResultsScreen.jsx  # окно результатов
│       └── ...
├── docker-compose.yml
└── README.md
Лицензия
MIT