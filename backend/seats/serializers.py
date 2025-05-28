from rest_framework import serializers
from .models import SeatTicket, SeatTicketTransaction, UserSeatTicketSummary, TournamentTicketDistribution
from tournaments.models import Tournament
from django.contrib.auth import get_user_model
from tournaments.serializers import TournamentSerializer
from views.store_views import StoreSerializer

User = get_user_model()


class SeatTicketSerializer(serializers.ModelSerializer):
    """
    좌석권 정보를 위한 시리얼라이저
    """
    tournament_name = serializers.CharField(source='tournament.name', read_only=True)
    user_name = serializers.CharField(source='user.username', read_only=True)
    store_name = serializers.CharField(source='store.name', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    source_display = serializers.CharField(source='get_source_display', read_only=True)
    is_valid_ticket = serializers.SerializerMethodField()
    
    class Meta:
        model = SeatTicket
        fields = [
            'id', 'ticket_id', 'tournament', 'tournament_name', 'user', 'user_name',
            'store', 'store_name', 'status', 'status_display', 'source', 'source_display', 
            'amount', 'created_at', 'updated_at', 'memo', 'is_valid_ticket'
        ]
        read_only_fields = ['id', 'ticket_id', 'created_at', 'updated_at']
    
    def get_is_valid_ticket(self, obj):
        """좌석권이 유효한지 반환"""
        return obj.is_valid()


class SeatTicketTransactionSerializer(serializers.ModelSerializer):
    """
    좌석권 거래내역을 위한 시리얼라이저
    """
    seat_ticket_id = serializers.UUIDField(source='seat_ticket.ticket_id', read_only=True)
    user_phone = serializers.CharField(source='seat_ticket.user.phone', read_only=True)
    tournament_name = serializers.CharField(source='seat_ticket.tournament.name', read_only=True)
    transaction_type_display = serializers.CharField(source='get_transaction_type_display', read_only=True)
    processed_by_name = serializers.CharField(source='processed_by.phone', read_only=True)
    
    class Meta:
        model = SeatTicketTransaction
        fields = [
            'id', 'seat_ticket', 'seat_ticket_id', 'user_phone', 'tournament_name',
            'transaction_type', 'transaction_type_display', 'quantity', 'amount',
            'reason', 'processed_by', 'processed_by_name', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']


class UserSeatTicketSummarySerializer(serializers.ModelSerializer):
    """
    사용자 좌석권 요약을 위한 시리얼라이저
    """
    user_phone = serializers.CharField(source='user.phone', read_only=True)
    user_nickname = serializers.CharField(source='user.nickname', read_only=True)
    tournament_name = serializers.CharField(source='tournament.name', read_only=True)
    tournament_start_time = serializers.DateTimeField(source='tournament.start_time', read_only=True)
    
    class Meta:
        model = UserSeatTicketSummary
        fields = [
            'id', 'user', 'user_phone', 'user_nickname', 'tournament', 'tournament_name',
            'tournament_start_time', 'active_tickets', 'used_tickets', 'total_tickets',
            'last_updated'
        ]
        read_only_fields = ['id', 'last_updated']


class SeatTicketGrantSerializer(serializers.Serializer):
    """
    좌석권 지급을 위한 시리얼라이저
    """
    user_id = serializers.IntegerField(help_text="좌석권을 받을 사용자 ID")
    tournament_id = serializers.IntegerField(help_text="토너먼트 ID")
    quantity = serializers.IntegerField(min_value=1, max_value=100, default=1, help_text="지급할 좌석권 수량")
    source = serializers.ChoiceField(choices=SeatTicket.SOURCE_CHOICES, default='ADMIN', help_text="좌석권 획득 방법")
    amount = serializers.DecimalField(max_digits=10, decimal_places=2, default=0, help_text="좌석권 금액")
    memo = serializers.CharField(max_length=500, required=False, allow_blank=True, help_text="메모")
    expires_at = serializers.DateTimeField(required=False, allow_null=True, help_text="만료 시간 (선택사항)")


class SeatTicketUseSerializer(serializers.Serializer):
    """
    좌석권 사용을 위한 시리얼라이저
    """
    ticket_id = serializers.UUIDField(help_text="사용할 좌석권 ID")
    reason = serializers.CharField(max_length=500, required=False, allow_blank=True, help_text="사용 사유")


class UserTicketStatsSerializer(serializers.Serializer):
    """
    사용자 좌석권 통계를 위한 시리얼라이저
    """
    user_id = serializers.IntegerField(help_text="사용자 ID")
    tournament_id = serializers.IntegerField(required=False, allow_null=True, help_text="토너먼트 ID (선택사항)")


class BulkTicketOperationSerializer(serializers.Serializer):
    """
    대량 좌석권 작업을 위한 시리얼라이저
    """
    user_ids = serializers.ListField(
        child=serializers.IntegerField(),
        help_text="사용자 ID 목록"
    )
    tournament_id = serializers.IntegerField(help_text="토너먼트 ID")
    operation = serializers.ChoiceField(
        choices=[('grant', '지급'), ('cancel', '취소')],
        help_text="작업 유형"
    )
    quantity = serializers.IntegerField(min_value=1, default=1, help_text="좌석권 수량")
    reason = serializers.CharField(max_length=500, required=False, allow_blank=True, help_text="작업 사유")


class TournamentTicketDistributionSerializer(serializers.ModelSerializer):
    tournament_name = serializers.CharField(source='tournament.name', read_only=True)
    store_name = serializers.CharField(source='store.name', read_only=True)
    tournament_details = TournamentSerializer(source='tournament', read_only=True)
    store_details = StoreSerializer(source='store', read_only=True)

    class Meta:
        model = TournamentTicketDistribution
        fields = [
            'id', 'tournament', 'tournament_name', 'tournament_details',
            'store', 'store_name', 'store_details',
            'allocated_quantity', 'remaining_quantity', 'distributed_quantity',
            'memo', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def validate(self, data):
        """분배량 = 보유량 + 배포량 검증"""
        allocated = data.get('allocated_quantity', 0)
        remaining = data.get('remaining_quantity', 0)
        distributed = data.get('distributed_quantity', 0)
        
        if allocated != remaining + distributed:
            raise serializers.ValidationError(
                "분배량은 보유량과 배포량의 합과 같아야 합니다."
            )
        
        return data


class TournamentTicketDistributionCreateSerializer(serializers.ModelSerializer):
    """분배 생성용 serializer"""
    class Meta:
        model = TournamentTicketDistribution
        fields = [
            'tournament', 'store', 'allocated_quantity', 
            'remaining_quantity', 'distributed_quantity', 'memo'
        ]

    def validate(self, data):
        """분배량 = 보유량 + 배포량 검증"""
        allocated = data.get('allocated_quantity', 0)
        remaining = data.get('remaining_quantity', 0)
        distributed = data.get('distributed_quantity', 0)
        
        if allocated != remaining + distributed:
            raise serializers.ValidationError(
                "분배량은 보유량과 배포량의 합과 같아야 합니다."
            )
        
        # 중복 체크
        tournament = data.get('tournament')
        store = data.get('store')
        if tournament and store:
            if TournamentTicketDistribution.objects.filter(
                tournament=tournament, store=store
            ).exists():
                raise serializers.ValidationError(
                    "해당 토너먼트와 매장에 대한 분배 데이터가 이미 존재합니다."
                )
        
        return data


class TicketDistributeSerializer(serializers.Serializer):
    """좌석권 배포용 serializer"""
    quantity = serializers.IntegerField(min_value=1)
    memo = serializers.CharField(max_length=500, required=False, allow_blank=True)


class TicketReturnSerializer(serializers.Serializer):
    """좌석권 반환용 serializer"""
    quantity = serializers.IntegerField(min_value=1)
    memo = serializers.CharField(max_length=500, required=False, allow_blank=True) 