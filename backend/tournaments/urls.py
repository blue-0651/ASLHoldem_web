from django.urls import path, include
from rest_framework.routers import DefaultRouter
from views.tournament_views import TournamentViewSet
from views.registration_views import TournamentRegistrationViewSet
from views.store_views import StoreViewSet
from views.user_views import UserViewSet

router = DefaultRouter()
router.register(r'', TournamentViewSet, basename='tournament')
router.register(r'registrations', TournamentRegistrationViewSet, basename='registration')
router.register(r'stores', StoreViewSet, basename='store')
router.register(r'users', UserViewSet, basename='user')

urlpatterns = [
    path('', include(router.urls)),
] 