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

    def handle_exception(self, exc):
        """예외 처리를 개선하여 더 명확한 오류 메시지 제공"""
        from django.core.exceptions import ValidationError
        from rest_framework.views import exception_handler
        
        if isinstance(exc, ValidationError):
            # Django ValidationError를 DRF 형식으로 변환
            if hasattr(exc, 'error_dict'):
                # 필드별 오류인 경우
                errors = {}
                for field, error_list in exc.error_dict.items():
                    if field == '__all__':
                        # 전체 모델 검증 오류
                        error_message = ' '.join([str(e) for e in error_list])
                        return Response({
                            'success': False,
                            'error': error_message,
                            'error_type': 'validation_error'
                        }, status=status.HTTP_400_BAD_REQUEST)
                    else:
                        errors[field] = [str(e) for e in error_list]
                
                return Response({
                    'success': False,
                    'errors': errors,
                    'error_type': 'field_validation_error'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            elif hasattr(exc, 'error_list'):
                # 단순 오류 리스트인 경우
                error_message = ' '.join([str(e) for e in exc.error_list])
                return Response({
                    'success': False,
                    'error': error_message,
                    'error_type': 'validation_error'
                }, status=status.HTTP_400_BAD_REQUEST)
        
        # 기본 DRF 예외 처리로 위임
        return super().handle_exception(exc)

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
                    'store_id': store_id,
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
            'overall_summary': summary,
            'tournament_summary': list(tournament_summary.values()),
            'store_summary': list(store_summary.values())
        })

    @action(detail=False, methods=['post'])
    def bulk_create(self, request):
        """여러 매장에 한 번에 시트권 분배"""
        tournament_id = request.data.get('tournament_id')
        distributions_data = request.data.get('distributions', [])
        
        if not tournament_id:
            return Response({
                'error': 'tournament_id가 필요합니다.'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            tournament = Tournament.objects.get(id=tournament_id)
        except Tournament.DoesNotExist:
            return Response({
                'error': '토너먼트를 찾을 수 없습니다.'
            }, status=status.HTTP_404_NOT_FOUND)
        
        if not distributions_data:
            return Response({
                'error': '분배 데이터가 필요합니다.'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # distributions_data가 문자열인 경우 JSON 파싱
        if isinstance(distributions_data, str):
            try:
                import json
                distributions_data = json.loads(distributions_data)
            except json.JSONDecodeError:
                return Response({
                    'error': '분배 데이터 형식이 올바르지 않습니다.'
                }, status=status.HTTP_400_BAD_REQUEST)
        
        created_distributions = []
        updated_distributions = []
        errors = []
        
        with transaction.atomic():
            total_allocated = 0
            
            # 기존 분배 확인
            existing_distributions = TournamentTicketDistribution.objects.filter(
                tournament=tournament
            ).aggregate(
                total=Sum('allocated_quantity')
            )['total'] or 0
            
            for dist_data in distributions_data:
                try:
                    store = Store.objects.get(id=dist_data['store_id'])
                    allocated_quantity = int(dist_data['allocated_quantity'])
                    
                    # 수량이 0인 경우 건너뛰기
                    if allocated_quantity <= 0:
                        continue
                    
                    # 기존 분배가 있는지 확인
                    existing_distribution = TournamentTicketDistribution.objects.filter(
                        tournament=tournament, store=store
                    ).first()
                    
                    if existing_distribution:
                        # 기존 분배 업데이트
                        old_quantity = existing_distribution.allocated_quantity
                        quantity_diff = allocated_quantity - old_quantity
                        
                        # 토너먼트 전체 시트권 수량 초과 체크 (기존 수량 제외하고 계산)
                        if existing_distributions - old_quantity + total_allocated + allocated_quantity > tournament.ticket_quantity:
                            errors.append(f"전체 분배량이 토너먼트 시트권 수량({tournament.ticket_quantity})을 초과합니다.")
                            break
                        
                        existing_distribution.allocated_quantity = allocated_quantity
                        # 남은 수량도 비례적으로 조정 (배포된 수량은 유지)
                        remaining_adjustment = allocated_quantity - existing_distribution.distributed_quantity
                        existing_distribution.remaining_quantity = max(0, remaining_adjustment)
                        existing_distribution.memo = dist_data.get('memo', f'분배 업데이트 - {store.name} ({old_quantity} → {allocated_quantity})')
                        existing_distribution.save()
                        
                        updated_distributions.append(existing_distribution)
                        total_allocated += quantity_diff  # 차이만 추가
                    else:
                        # 새로운 분배 생성
                        total_allocated += allocated_quantity
                        
                        # 토너먼트 전체 시트권 수량 초과 체크
                        if existing_distributions + total_allocated > tournament.ticket_quantity:
                            errors.append(f"전체 분배량이 토너먼트 시트권 수량({tournament.ticket_quantity})을 초과합니다.")
                            break
                        
                        distribution = TournamentTicketDistribution.objects.create(
                            tournament=tournament,
                            store=store,
                            allocated_quantity=allocated_quantity,
                            remaining_quantity=allocated_quantity,  # 초기에는 전량 보유
                            distributed_quantity=0,  # 초기에는 배포 안됨
                            memo=dist_data.get('memo', f'새 분배 - {store.name}')
                        )
                        created_distributions.append(distribution)
                    
                except Store.DoesNotExist:
                    errors.append(f"매장 ID {dist_data['store_id']}를 찾을 수 없습니다.")
                except (ValueError, KeyError) as e:
                    errors.append(f"잘못된 데이터: {str(e)}")
        
        if errors:
            return Response({
                'success': False,
                'errors': errors,
                'processed_count': len(created_distributions) + len(updated_distributions)
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # 전체 결과 목록 생성
        all_distributions = created_distributions + updated_distributions
        
        # 메시지 작성
        new_count = len(created_distributions)
        updated_count = len(updated_distributions)
        
        message_parts = []
        if new_count > 0:
            message_parts.append(f"{new_count}개 매장에 새로 분배")
        if updated_count > 0:
            message_parts.append(f"{updated_count}개 매장 분배량 업데이트")
        
        message = "시트권 분배가 완료되었습니다: " + ", ".join(message_parts) if message_parts else "처리된 분배가 없습니다."
        
        serializer = TournamentTicketDistributionSerializer(all_distributions, many=True)
        return Response({
            'success': True,
            'message': message,
            'total_distributions': len(all_distributions),
            'new_distributions': new_count,
            'updated_distributions': updated_count,
            'created_distributions': serializer.data
        })

    @action(detail=False, methods=['get'])
    def available_stores(self, request):
        """토너먼트에 할당 가능한 매장 목록 조회"""
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
        
        # 이미 분배가 완료된 매장들
        allocated_store_ids = TournamentTicketDistribution.objects.filter(
            tournament=tournament
        ).values_list('store_id', flat=True)
        
        # 할당 가능한 매장들 (활성 상태이고 아직 분배되지 않은 매장)
        available_stores = Store.objects.filter(
            status='ACTIVE'
        ).exclude(
            id__in=allocated_store_ids
        ).order_by('name')
        
        # 이미 할당된 매장들
        allocated_stores = Store.objects.filter(
            id__in=allocated_store_ids
        ).order_by('name')
        
        from stores.serializers import StoreSerializer
        
        return Response({
            'tournament': {
                'id': tournament.id,
                'name': tournament.name,
                'ticket_quantity': tournament.ticket_quantity
            },
            'available_stores': StoreSerializer(available_stores, many=True).data,
            'allocated_stores': StoreSerializer(allocated_stores, many=True).data,
            'available_count': available_stores.count(),
            'allocated_count': allocated_stores.count()
        })

    @action(detail=False, methods=['post'])
    def auto_distribute(self, request):
        """토너먼트 시트권 자동 분배"""
        tournament_id = request.data.get('tournament_id')
        distribution_type = request.data.get('distribution_type', 'equal')  # 'equal' 또는 'weighted'
        
        if not tournament_id:
            return Response({
                'error': 'tournament_id가 필요합니다.'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            tournament = Tournament.objects.get(id=tournament_id)
        except Tournament.DoesNotExist:
            return Response({
                'error': '토너먼트를 찾을 수 없습니다.'
            }, status=status.HTTP_404_NOT_FOUND)
        
        # 기존 분배량 확인
        existing_allocated = TournamentTicketDistribution.objects.filter(
            tournament=tournament
        ).aggregate(
            total=Sum('allocated_quantity')
        )['total'] or 0
        
        remaining_tickets = tournament.ticket_quantity - existing_allocated
        
        if remaining_tickets <= 0:
            return Response({
                'error': '분배할 시트권이 남아있지 않습니다.'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        created_distributions = []
        
        with transaction.atomic():
            if distribution_type == 'equal':
                # 동일 수량 분배
                store_ids = request.data.get('store_ids', [])
                if not store_ids:
                    return Response({
                        'error': 'store_ids가 필요합니다.'
                    }, status=status.HTTP_400_BAD_REQUEST)
                
                # store_ids가 문자열인 경우 JSON 파싱
                if isinstance(store_ids, str):
                    try:
                        import json
                        store_ids = json.loads(store_ids)
                    except json.JSONDecodeError:
                        return Response({
                            'error': 'store_ids 형식이 올바르지 않습니다.'
                        }, status=status.HTTP_400_BAD_REQUEST)
                
                stores = Store.objects.filter(id__in=store_ids, status='ACTIVE')
                if not stores.exists():
                    return Response({
                        'error': '유효한 매장이 없습니다.'
                    }, status=status.HTTP_400_BAD_REQUEST)
                
                # 동일하게 분배 (나머지는 첫 번째 매장에 추가)
                per_store = remaining_tickets // stores.count()
                remainder = remaining_tickets % stores.count()
                
                for i, store in enumerate(stores):
                    allocated = per_store + (1 if i == 0 and remainder > 0 else 0)
                    if allocated > 0:
                        distribution = TournamentTicketDistribution.objects.create(
                            tournament=tournament,
                            store=store,
                            allocated_quantity=allocated,
                            remaining_quantity=allocated,
                            distributed_quantity=0,
                            memo=f'자동 분배 (동일 수량) - {allocated}개'
                        )
                        created_distributions.append(distribution)
            
            elif distribution_type == 'weighted':
                # 가중치 분배
                store_weights = request.data.get('store_weights', {})
                if not store_weights:
                    return Response({
                        'error': 'store_weights가 필요합니다.'
                    }, status=status.HTTP_400_BAD_REQUEST)
                
                # store_weights가 문자열인 경우 JSON 파싱
                if isinstance(store_weights, str):
                    try:
                        import json
                        store_weights = json.loads(store_weights)
                    except json.JSONDecodeError:
                        return Response({
                            'error': 'store_weights 형식이 올바르지 않습니다.'
                        }, status=status.HTTP_400_BAD_REQUEST)
                
                total_weight = sum(store_weights.values())
                if total_weight <= 0:
                    return Response({
                        'error': '가중치 합계가 0보다 커야 합니다.'
                    }, status=status.HTTP_400_BAD_REQUEST)
                
                allocated_total = 0
                for store_id, weight in store_weights.items():
                    try:
                        store = Store.objects.get(id=store_id, status='ACTIVE')
                        allocated = int((remaining_tickets * weight) / total_weight)
                        
                        if allocated > 0:
                            distribution = TournamentTicketDistribution.objects.create(
                                tournament=tournament,
                                store=store,
                                allocated_quantity=allocated,
                                remaining_quantity=allocated,
                                distributed_quantity=0,
                                memo=f'자동 분배 (가중치: {weight}) - {allocated}개'
                            )
                            created_distributions.append(distribution)
                            allocated_total += allocated
                    
                    except Store.DoesNotExist:
                        continue
                
                # 나머지 시트권이 있으면 첫 번째 매장에 추가
                if allocated_total < remaining_tickets and created_distributions:
                    first_dist = created_distributions[0]
                    remainder = remaining_tickets - allocated_total
                    first_dist.allocated_quantity += remainder
                    first_dist.remaining_quantity += remainder
                    first_dist.memo += f' (나머지 {remainder}개 추가)'
                    first_dist.save()
        
        serializer = TournamentTicketDistributionSerializer(created_distributions, many=True)
        return Response({
            'success': True,
            'message': f"{len(created_distributions)}개 매장에 자동 분배가 완료되었습니다.",
            'distribution_type': distribution_type,
            'total_distributed': sum(dist.allocated_quantity for dist in created_distributions),
            'created_distributions': serializer.data
        }) 