from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import SeatTicketViewSet, SeatTicketTransactionViewSet
from views.distribution_views import TournamentTicketDistributionViewSet
from seats.views import get_store_users_simple

router = DefaultRouter()
router.register(r'tickets', SeatTicketViewSet, basename='seat-ticket')
router.register(r'transactions', SeatTicketTransactionViewSet, basename='seat-ticket-transaction')
router.register(r'distributions', TournamentTicketDistributionViewSet, basename='tournament-ticket-distribution')

urlpatterns = [
    # 매장별 전체 사용자 조회 (단순 GET 방식, OPTIONS 방지)
    path('tickets/store-users-simple/', get_store_users_simple, name='store-users-simple'),
    
    path('', include(router.urls)),
] 