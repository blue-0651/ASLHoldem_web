from django.urls import path, include
from rest_framework.routers import DefaultRouter
from views.tournament_views import TournamentViewSet
from views.store_views import StoreViewSet
from views.user_views import UserViewSet

router = DefaultRouter()
router.register(r'', TournamentViewSet, basename='tournament')
router.register(r'stores', StoreViewSet, basename='store')
router.register(r'users', UserViewSet, basename='user')

urlpatterns = [
    path('create/', TournamentViewSet.as_view({'post': 'create_tournament'}), name='tournament-create'),
    path('', include(router.urls)),
] 