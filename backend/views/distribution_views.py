from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Q, Sum
from django.db import transaction
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter

from seats.models import TournamentTicketDistribution
from seats.serializers import (
    TournamentTicketDistributionSerializer,
    TournamentTicketDistributionCreateSerializer,
    TicketDistributeSerializer,
    TicketReturnSerializer
)
from tournaments.models import Tournament
from stores.models import Store


class TournamentTicketDistributionViewSet(viewsets.ModelViewSet):
    """토너먼트 좌석권 분배 관리 ViewSet"""
    queryset = TournamentTicketDistribution.objects.all()
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['tournament', 'store']
    search_fields = ['tournament__name', 'store__name', 'memo']
    ordering_fields = ['created_at', 'updated_at', 'allocated_quantity']
    ordering = ['-created_at']

    def get_serializer_class(self):
        if self.action == 'create':
            return TournamentTicketDistributionCreateSerializer
        return TournamentTicketDistributionSerializer

    def get_queryset(self):
        queryset = TournamentTicketDistribution.objects.select_related(
            'tournament', 'store'
        )
        
        # 토너먼트 필터링
        tournament_id = self.request.query_params.get('tournament_id')
        if tournament_id:
            queryset = queryset.filter(tournament_id=tournament_id)
        
        # 매장 필터링
        store_id = self.request.query_params.get('store_id')
        if store_id:
            queryset = queryset.filter(store_id=store_id)
        
        return queryset

    @action(detail=True, methods=['post'])
    def distribute_tickets(self, request, pk=None):
        """좌석권 배포"""
        distribution = self.get_object()
        serializer = TicketDistributeSerializer(data=request.data)
        
        if serializer.is_valid():
            quantity = serializer.validated_data['quantity']
            memo = serializer.validated_data.get('memo', '')
            
            try:
                with transaction.atomic():
                    result = distribution.distribute_tickets(quantity, memo)
                    distribution.refresh_from_db()
                    
                    return Response({
                        'success': True,
                        'message': f'{quantity}개 좌석권이 배포되었습니다.',
                        'data': TournamentTicketDistributionSerializer(distribution).data
                    })
            except ValueError as e:
                return Response({
                    'success': False,
                    'message': str(e)
                }, status=status.HTTP_400_BAD_REQUEST)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'])
    def return_tickets(self, request, pk=None):
        """좌석권 반환"""
        distribution = self.get_object()
        serializer = TicketReturnSerializer(data=request.data)
        
        if serializer.is_valid():
            quantity = serializer.validated_data['quantity']
            memo = serializer.validated_data.get('memo', '')
            
            try:
                with transaction.atomic():
                    result = distribution.return_tickets(quantity, memo)
                    distribution.refresh_from_db()
                    
                    return Response({
                        'success': True,
                        'message': f'{quantity}개 좌석권이 반환되었습니다.',
                        'data': TournamentTicketDistributionSerializer(distribution).data
                    })
            except ValueError as e:
                return Response({
                    'success': False,
                    'message': str(e)
                }, status=status.HTTP_400_BAD_REQUEST)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['get'])
    def summary_by_tournament(self, request):
        """토너먼트별 분배 요약"""
        tournament_id = request.query_params.get('tournament_id')
        
        if not tournament_id:
            return Response({
                'error': 'tournament_id 파라미터가 필요합니다.'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            tournament = Tournament.objects.get(id=tournament_id)
        except Tournament.DoesNotExist:
            return Response({
                'error': '토너먼트를 찾을 수 없습니다.'
            }, status=status.HTTP_404_NOT_FOUND)
        
        distributions = TournamentTicketDistribution.objects.filter(
            tournament=tournament
        ).select_related('store')
        
        summary = distributions.aggregate(
            total_allocated=Sum('allocated_quantity'),
            total_remaining=Sum('remaining_quantity'),
            total_distributed=Sum('distributed_quantity')
        )
        
        store_distributions = []
        for dist in distributions:
            store_distributions.append({
                'store_id': dist.store.id,
                'store_name': dist.store.name,
                'allocated_quantity': dist.allocated_quantity,
                'remaining_quantity': dist.remaining_quantity,
                'distributed_quantity': dist.distributed_quantity,
                'distribution_rate': round(
                    (dist.distributed_quantity / dist.allocated_quantity * 100) 
                    if dist.allocated_quantity > 0 else 0, 2
                )
            })
        
        return Response({
            'tournament': {
                'id': tournament.id,
                'name': tournament.name,
                'ticket_quantity': tournament.ticket_quantity
            },
            'summary': {
                'total_allocated': summary['total_allocated'] or 0,
                'total_remaining': summary['total_remaining'] or 0,
                'total_distributed': summary['total_distributed'] or 0,
                'unallocated': tournament.ticket_quantity - (summary['total_allocated'] or 0),
                'distribution_rate': round(
                    (summary['total_distributed'] / summary['total_allocated'] * 100)
                    if summary['total_allocated'] and summary['total_allocated'] > 0 else 0, 2
                )
            },
            'store_distributions': store_distributions
        })

    @action(detail=False, methods=['get'])
    def summary_by_store(self, request):
        """매장별 분배 요약"""
        store_id = request.query_params.get('store_id')
        
        if not store_id:
            return Response({
                'error': 'store_id 파라미터가 필요합니다.'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            store = Store.objects.get(id=store_id)
        except Store.DoesNotExist:
            return Response({
                'error': '매장을 찾을 수 없습니다.'
            }, status=status.HTTP_404_NOT_FOUND)
        
        distributions = TournamentTicketDistribution.objects.filter(
            store=store
        ).select_related('tournament')
        
        summary = distributions.aggregate(
            total_allocated=Sum('allocated_quantity'),
            total_remaining=Sum('remaining_quantity'),
            total_distributed=Sum('distributed_quantity')
        )
        
        tournament_distributions = []
        for dist in distributions:
            tournament_distributions.append({
                'tournament_id': dist.tournament.id,
                'tournament_name': dist.tournament.name,
                'allocated_quantity': dist.allocated_quantity,
                'remaining_quantity': dist.remaining_quantity,
                'distributed_quantity': dist.distributed_quantity,
                'distribution_rate': round(
                    (dist.distributed_quantity / dist.allocated_quantity * 100) 
                    if dist.allocated_quantity > 0 else 0, 2
                )
            })
        
        return Response({
            'store': {
                'id': store.id,
                'name': store.name
            },
            'summary': {
                'total_allocated': summary['total_allocated'] or 0,
                'total_remaining': summary['total_remaining'] or 0,
                'total_distributed': summary['total_distributed'] or 0,
                'distribution_rate': round(
                    (summary['total_distributed'] / summary['total_allocated'] * 100)
                    if summary['total_allocated'] and summary['total_allocated'] > 0 else 0, 2
                )
            },
            'tournament_distributions': tournament_distributions
        })

    @action(detail=False, methods=['get'])
    def overall_summary(self, request):
        """전체 분배 요약"""
        distributions = TournamentTicketDistribution.objects.all()
        
        summary = distributions.aggregate(
            total_allocated=Sum('allocated_quantity'),
            total_remaining=Sum('remaining_quantity'),
            total_distributed=Sum('distributed_quantity')
        )
        
        # 토너먼트별 요약
        tournament_summary = {}
        for dist in distributions.select_related('tournament'):
            tournament_id = dist.tournament.id
            if tournament_id not in tournament_summary:
                tournament_summary[tournament_id] = {
                    'tournament_name': dist.tournament.name,
                    'total_tickets': dist.tournament.ticket_quantity,
                    'allocated': 0,
                    'remaining': 0,
                    'distributed': 0,
                    'store_count': 0
                }
            
            tournament_summary[tournament_id]['allocated'] += dist.allocated_quantity
            tournament_summary[tournament_id]['remaining'] += dist.remaining_quantity
            tournament_summary[tournament_id]['distributed'] += dist.distributed_quantity
            tournament_summary[tournament_id]['store_count'] += 1
        
        # 매장별 요약
        store_summary = {}
        for dist in distributions.select_related('store'):
            store_id = dist.store.id
            if store_id not in store_summary:
                store_summary[store_id] = {
                    'store_name': dist.store.name,
                    'allocated': 0,
                    'remaining': 0,
                    'distributed': 0,
                    'tournament_count': 0
                }
            
            store_summary[store_id]['allocated'] += dist.allocated_quantity
            store_summary[store_id]['remaining'] += dist.remaining_quantity
            store_summary[store_id]['distributed'] += dist.distributed_quantity
            store_summary[store_id]['tournament_count'] += 1
        
        return Response({
            'overall_summary': {
                'total_allocated': summary['total_allocated'] or 0,
                'total_remaining': summary['total_remaining'] or 0,
                'total_distributed': summary['total_distributed'] or 0,
                'distribution_rate': round(
                    (summary['total_distributed'] / summary['total_allocated'] * 100)
                    if summary['total_allocated'] and summary['total_allocated'] > 0 else 0, 2
                ),
                'total_distributions': distributions.count()
            },
            'tournament_summary': list(tournament_summary.values()),
            'store_summary': list(store_summary.values())
        }) 