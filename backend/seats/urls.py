from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import SeatTicketViewSet, SeatTicketTransactionViewSet
from views.distribution_views import TournamentTicketDistributionViewSet

router = DefaultRouter()
router.register(r'tickets', SeatTicketViewSet, basename='seat-ticket')
router.register(r'transactions', SeatTicketTransactionViewSet, basename='seat-ticket-transaction')
router.register(r'distributions', TournamentTicketDistributionViewSet, basename='tournament-ticket-distribution')

urlpatterns = [
    path('', include(router.urls)),
] 