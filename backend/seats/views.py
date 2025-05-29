from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from rest_framework.decorators import action
from django.db.models import Q, Count, Sum
from django.utils import timezone
from django.db import transaction

from .models import SeatTicket, SeatTicketTransaction, UserSeatTicketSummary
from .serializers import (
    SeatTicketSerializer, SeatTicketTransactionSerializer, UserSeatTicketSummarySerializer,
    SeatTicketGrantSerializer, SeatTicketUseSerializer, UserTicketStatsSerializer,
    BulkTicketOperationSerializer
)
from tournaments.models import Tournament
from django.contrib.auth import get_user_model
from stores.models import Store

User = get_user_model()


class SeatTicketViewSet(viewsets.ModelViewSet):
    """
    좌석권 관리를 위한 API 뷰셋
    """
    queryset = SeatTicket.objects.all()
    serializer_class = SeatTicketSerializer
    permission_classes = [permissions.AllowAny]
    
    def get_queryset(self):
        """
        쿼리셋 필터링
        """
        queryset = SeatTicket.objects.all().select_related('tournament', 'user', 'store')
        
        # 토너먼트 ID로 필터링
        tournament_id = self.request.query_params.get('tournament_id')
        if tournament_id:
            queryset = queryset.filter(tournament_id=tournament_id)
        
        # 사용자 ID로 필터링
        user_id = self.request.query_params.get('user_id')
        if user_id:
            queryset = queryset.filter(user_id=user_id)
        
        # 매장 ID로 필터링
        store_id = self.request.query_params.get('store_id')
        if store_id:
            queryset = queryset.filter(store_id=store_id)
        
        # 좌석권 상태로 필터링
        status_param = self.request.query_params.get('status')
        if status_param:
            queryset = queryset.filter(status=status_param)
        
        # 좌석권 획득 방법으로 필터링
        source = self.request.query_params.get('source')
        if source:
            queryset = queryset.filter(source=source)
        
        # 유효한 좌석권만 필터링
        valid_only = self.request.query_params.get('valid_only')
        if valid_only and valid_only.lower() == 'true':
            queryset = queryset.filter(status='ACTIVE')
            # 만료 시간이 있는 경우 현재 시간보다 이후인 것만
            now = timezone.now()
            queryset = queryset.filter(Q(expires_at__isnull=True) | Q(expires_at__gt=now))
        
        return queryset.order_by('-created_at')
    
    @action(detail=False, methods=['post'], url_path='grant')
    def grant_tickets(self, request):
        """
        사용자에게 좌석권을 지급합니다.
        """
        try:
            serializer = SeatTicketGrantSerializer(data=request.data)
            if not serializer.is_valid():
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            
            data = serializer.validated_data
            
            # 사용자, 토너먼트, 매장 존재 확인
            try:
                user = User.objects.get(id=data['user_id'])
                tournament = Tournament.objects.get(id=data['tournament_id'])
                store = Store.objects.get(id=data['store_id'])
            except (User.DoesNotExist, Tournament.DoesNotExist):
                return Response({"error": "사용자 또는 토너먼트를 찾을 수 없습니다."}, 
                              status=status.HTTP_404_NOT_FOUND)
            except Store.DoesNotExist:
                return Response({"error": "매장을 찾을 수 없습니다."}, 
                              status=status.HTTP_404_NOT_FOUND)
            
            # 좌석권 생성
            created_tickets = []
            with transaction.atomic():
                for i in range(data['quantity']):
                    ticket = SeatTicket.objects.create(
                        tournament=tournament,
                        user=user,
                        store=store,
                        source=data['source'],
                        amount=data['amount'],
                        expires_at=data.get('expires_at'),
                        memo=data.get('memo', '')
                    )
                    created_tickets.append(ticket)
                    
                    # 거래 내역 생성
                    SeatTicketTransaction.objects.create(
                        seat_ticket=ticket,
                        transaction_type='GRANT',
                        quantity=1,
                        amount=data['amount'],
                        reason=f"좌석권 지급: {data.get('memo', '')}",
                        processed_by=request.user if request.user.is_authenticated else None
                    )
                
                # 요약 정보 업데이트
                summary, created = UserSeatTicketSummary.objects.get_or_create(
                    user=user,
                    tournament=tournament
                )
                summary.update_summary()
            
            # 생성된 좌석권 정보 반환
            ticket_serializer = SeatTicketSerializer(created_tickets, many=True)
            
            return Response({
                "message": f"{data['quantity']}개의 좌석권이 지급되었습니다.",
                "user_phone": user.phone,
                "tournament_name": tournament.name,
                "store_name": store.name,
                "granted_tickets": ticket_serializer.data
            })
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=False, methods=['post'], url_path='use')
    def use_ticket(self, request):
        """
        좌석권을 사용 처리합니다.
        """
        try:
            serializer = SeatTicketUseSerializer(data=request.data)
            if not serializer.is_valid():
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            
            data = serializer.validated_data
            
            try:
                ticket = SeatTicket.objects.get(ticket_id=data['ticket_id'])
            except SeatTicket.DoesNotExist:
                return Response({"error": "해당 좌석권을 찾을 수 없습니다."}, 
                              status=status.HTTP_404_NOT_FOUND)
            
            # 좌석권 유효성 확인
            if not ticket.is_valid():
                return Response({"error": "유효하지 않은 좌석권입니다."}, 
                              status=status.HTTP_400_BAD_REQUEST)
            
            # 좌석권 사용 처리
            with transaction.atomic():
                if ticket.use_ticket():
                    # 거래 내역 생성
                    SeatTicketTransaction.objects.create(
                        seat_ticket=ticket,
                        transaction_type='USE',
                        quantity=1,
                        amount=0,
                        reason=data.get('reason', '토너먼트 참가'),
                        processed_by=request.user if request.user.is_authenticated else None
                    )
                    
                    # 요약 정보 업데이트
                    try:
                        summary = UserSeatTicketSummary.objects.get(
                            user=ticket.user,
                            tournament=ticket.tournament
                        )
                        summary.update_summary()
                    except UserSeatTicketSummary.DoesNotExist:
                        pass
                    
                    ticket_serializer = SeatTicketSerializer(ticket)
                    return Response({
                        "message": "좌석권이 사용 처리되었습니다.",
                        "ticket": ticket_serializer.data
                    })
                else:
                    return Response({"error": "좌석권 사용에 실패했습니다."}, 
                                  status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=False, methods=['get'], url_path='user_stats')
    def get_user_ticket_stats(self, request):
        """
        사용자의 좌석권 통계를 조회합니다.
        """
        try:
            user_id = request.query_params.get('user_id')
            tournament_id = request.query_params.get('tournament_id')
            
            if not user_id:
                return Response({"error": "user_id 파라미터가 필요합니다."}, 
                              status=status.HTTP_400_BAD_REQUEST)
            
            try:
                user = User.objects.get(id=user_id)
            except User.DoesNotExist:
                return Response({"error": "사용자를 찾을 수 없습니다."}, 
                              status=status.HTTP_404_NOT_FOUND)
            
            # 기본 쿼리셋
            tickets_query = SeatTicket.objects.filter(user=user)
            
            # 특정 토너먼트로 필터링
            if tournament_id:
                tickets_query = tickets_query.filter(tournament_id=tournament_id)
            
            # 통계 계산
            stats = tickets_query.aggregate(
                total_tickets=Count('id'),
                active_tickets=Count('id', filter=Q(status='ACTIVE')),
                used_tickets=Count('id', filter=Q(status='USED')),
                expired_tickets=Count('id', filter=Q(status='EXPIRED')),
                cancelled_tickets=Count('id', filter=Q(status='CANCELLED')),
                total_amount=Sum('amount') or 0
            )
            
            # 토너먼트별 통계 (특정 토너먼트가 지정되지 않은 경우)
            tournament_stats = []
            if not tournament_id:
                tournament_summaries = UserSeatTicketSummary.objects.filter(user=user).select_related('tournament')
                for summary in tournament_summaries:
                    tournament_stats.append({
                        'tournament_id': summary.tournament.id,
                        'tournament_name': summary.tournament.name,
                        'tournament_start_time': summary.tournament.start_time,
                        'active_tickets': summary.active_tickets,
                        'used_tickets': summary.used_tickets,
                        'total_tickets': summary.total_tickets,
                        'last_updated': summary.last_updated
                    })
            
            result = {
                'user_id': user.id,
                'user_phone': user.phone,
                'user_nickname': user.nickname,
                'overall_stats': stats,
                'tournament_stats': tournament_stats
            }
            
            return Response(result)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=False, methods=['post'], url_path='bulk_operation')
    def bulk_ticket_operation(self, request):
        """
        대량 좌석권 작업을 수행합니다.
        """
        try:
            serializer = BulkTicketOperationSerializer(data=request.data)
            if not serializer.is_valid():
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            
            data = serializer.validated_data
            
            # 토너먼트 존재 확인
            try:
                tournament = Tournament.objects.get(id=data['tournament_id'])
            except Tournament.DoesNotExist:
                return Response({"error": "토너먼트를 찾을 수 없습니다."}, 
                              status=status.HTTP_404_NOT_FOUND)
            
            # 사용자들 존재 확인
            users = User.objects.filter(id__in=data['user_ids'])
            if users.count() != len(data['user_ids']):
                return Response({"error": "일부 사용자를 찾을 수 없습니다."}, 
                              status=status.HTTP_404_NOT_FOUND)
            
            results = []
            
            with transaction.atomic():
                for user in users:
                    if data['operation'] == 'grant':
                        # 기본 매장 가져오기 (첫 번째 매장 사용)
                        default_store = Store.objects.first()
                        if not default_store:
                            return Response({"error": "매장이 존재하지 않습니다."}, 
                                              status=status.HTTP_400_BAD_REQUEST)
                        
                        # 좌석권 지급
                        for i in range(data['quantity']):
                            ticket = SeatTicket.objects.create(
                                tournament=tournament,
                                user=user,
                                store=default_store,
                                source='ADMIN',
                                amount=0,
                                memo=data.get('reason', '')
                            )
                            
                            SeatTicketTransaction.objects.create(
                                seat_ticket=ticket,
                                transaction_type='GRANT',
                                quantity=1,
                                amount=0,
                                reason=data.get('reason', '대량 지급'),
                                processed_by=request.user if request.user.is_authenticated else None
                            )
                        
                        results.append({
                            'user_id': user.id,
                            'user_phone': user.phone,
                            'operation': 'granted',
                            'quantity': data['quantity']
                        })
                    
                    elif data['operation'] == 'cancel':
                        # 활성 좌석권 취소
                        active_tickets = SeatTicket.objects.filter(
                            user=user,
                            tournament=tournament,
                            status='ACTIVE'
                        )[:data['quantity']]
                        
                        cancelled_count = 0
                        for ticket in active_tickets:
                            ticket.status = 'CANCELLED'
                            ticket.save()
                            
                            SeatTicketTransaction.objects.create(
                                seat_ticket=ticket,
                                transaction_type='CANCEL',
                                quantity=1,
                                amount=0,
                                reason=data.get('reason', '대량 취소'),
                                processed_by=request.user if request.user.is_authenticated else None
                            )
                            cancelled_count += 1
                        
                        results.append({
                            'user_id': user.id,
                            'user_phone': user.phone,
                            'operation': 'cancelled',
                            'quantity': cancelled_count
                        })
                    
                    # 요약 정보 업데이트
                    summary, created = UserSeatTicketSummary.objects.get_or_create(
                        user=user,
                        tournament=tournament
                    )
                    summary.update_summary()
            
            return Response({
                "message": f"{data['operation']} 작업이 완료되었습니다.",
                "tournament_name": tournament.name,
                "results": results
            })
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=False, methods=['get'], url_path='tournament_summary')
    def get_tournament_ticket_summary(self, request):
        """
        토너먼트별 좌석권 현황 요약을 조회합니다.
        """
        try:
            tournament_id = request.query_params.get('tournament_id')
            if not tournament_id:
                return Response({"error": "tournament_id 파라미터가 필요합니다."}, 
                              status=status.HTTP_400_BAD_REQUEST)
            
            try:
                tournament = Tournament.objects.get(id=tournament_id)
            except Tournament.DoesNotExist:
                return Response({"error": "토너먼트를 찾을 수 없습니다."}, 
                              status=status.HTTP_404_NOT_FOUND)
            
            # 토너먼트 좌석권 통계
            ticket_stats = SeatTicket.objects.filter(tournament=tournament).aggregate(
                total_tickets=Count('id'),
                active_tickets=Count('id', filter=Q(status='ACTIVE')),
                used_tickets=Count('id', filter=Q(status='USED')),
                expired_tickets=Count('id', filter=Q(status='EXPIRED')),
                cancelled_tickets=Count('id', filter=Q(status='CANCELLED')),
                total_amount=Sum('amount') or 0
            )
            
            # 사용자별 좌석권 현황
            user_summaries = UserSeatTicketSummary.objects.filter(
                tournament=tournament
            ).select_related('user').order_by('-active_tickets')
            
            user_summary_data = UserSeatTicketSummarySerializer(user_summaries, many=True).data
            
            result = {
                'tournament_id': tournament.id,
                'tournament_name': tournament.name,
                'tournament_start_time': tournament.start_time,
                'tournament_ticket_quantity': tournament.ticket_quantity,
                'ticket_stats': ticket_stats,
                'user_summaries': user_summary_data
            }
            
            return Response(result)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class SeatTicketTransactionViewSet(viewsets.ReadOnlyModelViewSet):
    """
    좌석권 거래내역 조회를 위한 API 뷰셋
    """
    queryset = SeatTicketTransaction.objects.all()
    serializer_class = SeatTicketTransactionSerializer
    permission_classes = [permissions.AllowAny]
    
    def get_queryset(self):
        """
        쿼리셋 필터링
        """
        queryset = SeatTicketTransaction.objects.all().select_related(
            'seat_ticket', 'seat_ticket__user', 'seat_ticket__tournament', 'processed_by'
        )
        
        # 좌석권 ID로 필터링
        ticket_id = self.request.query_params.get('ticket_id')
        if ticket_id:
            queryset = queryset.filter(seat_ticket__ticket_id=ticket_id)
        
        # 사용자 ID로 필터링
        user_id = self.request.query_params.get('user_id')
        if user_id:
            queryset = queryset.filter(seat_ticket__user_id=user_id)
        
        # 토너먼트 ID로 필터링
        tournament_id = self.request.query_params.get('tournament_id')
        if tournament_id:
            queryset = queryset.filter(seat_ticket__tournament_id=tournament_id)
        
        # 거래 유형으로 필터링
        transaction_type = self.request.query_params.get('transaction_type')
        if transaction_type:
            queryset = queryset.filter(transaction_type=transaction_type)
        
        return queryset.order_by('-created_at') 