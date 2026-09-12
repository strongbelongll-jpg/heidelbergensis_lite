from django.contrib import admin
from django.urls import path, include
from graphene_django.views import GraphQLView
from game.schema import schema
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView
from game.views import (TribeDetailView, HuntView, GatherWoodView, GatherStoneView, BuildHutView,
                        SettlementListView, SettlementClaimView, MeView, CanStartSessionView, StartSessionView, EndSessionView, SessionStatusView)

urlpatterns = [
    path('admin/', admin.site.urls),
    path('accounts/', include('allauth.urls')),                 # вход через Google, выход
    path('api/me/', MeView.as_view(), name='me'),               # кто вошёл
    path('api/tribe/', TribeDetailView.as_view(), name='tribe-detail'),      # <-- ЭТО ГЛАВНОЕ!
    path('api/hunt/', HuntView.as_view(), name='hunt'),
    path('api/gather_wood/', GatherWoodView.as_view(), name='gather_wood'),
    path('api/gather_stone/', GatherStoneView.as_view(), name='gather_stone'),
    path('api/build_hut/', BuildHutView.as_view(), name='build_hut'),
    path('api/settlements/', SettlementListView.as_view(), name='settlements'),          # карта: кто где
    path('api/settlements/claim/', SettlementClaimView.as_view(), name='settlement_claim'),  # основать
    path('api/can_start/', CanStartSessionView.as_view(), name='can_start'),
    path('api/start_session/', StartSessionView.as_view(), name='start_session'),
    path('api/end_session/', EndSessionView.as_view(), name='end_session'),
    path('api/session_status/', SessionStatusView.as_view(), name='session_status'),
    path('graphql/', GraphQLView.as_view(graphiql=True, schema=schema)),
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
]
