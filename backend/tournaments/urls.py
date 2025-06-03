from django.urls import path, include
from rest_framework.routers import DefaultRouter
from views.tournament_views import TournamentViewSet, get_dashboard_stats_simple
from views.store_views import StoreViewSet
from views.user_views import UserViewSet

router = DefaultRouter()
router.register(r'', TournamentViewSet, basename='tournament')
router.register(r'stores', StoreViewSet, basename='store')
router.register(r'users', UserViewSet, basename='user')

urlpatterns = [
    path('create/', TournamentViewSet.as_view({'post': 'create_tournament'}), name='tournament-create'),
    
    # 대시보드 통계 조회 (단순 GET 방식, OPTIONS 방지)
    path('dashboard/stats-simple/', get_dashboard_stats_simple, name='dashboard-stats-simple'),
    
    path('', include(router.urls)),
] 