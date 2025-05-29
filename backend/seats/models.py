from django.db import models
from django.conf import settings
from django.utils import timezone
from tournaments.models import Tournament
from stores.models import Store
import uuid


class SeatTicket(models.Model):
    """
    좌석권 정보를 저장하는 모델
    사용자가 특정 토너먼트에 대해 보유한 좌석권을 관리합니다.
    """
    
    # 좌석권 상태 선택 옵션
    STATUS_CHOICES = (
        ('ACTIVE', '활성'),        # 사용 가능한 좌석권
        ('USED', '사용됨'),        # 이미 사용된 좌석권
        ('EXPIRED', '만료됨'),     # 만료된 좌석권
        ('CANCELLED', '취소됨'),   # 취소된 좌석권
    )
    
    # 좌석권 획득 방법
    SOURCE_CHOICES = (
        ('PURCHASE', '구매'),      # 직접 구매한 좌석권
        ('REWARD', '보상'),        # 예선전 승리 등으로 획득한 좌석권
        ('GIFT', '선물'),          # 선물받은 좌석권
        ('ADMIN', '관리자 지급'),   # 관리자가 직접 지급한 좌석권
    )
    
    # 고유 식별자
    ticket_id = models.UUIDField(default=uuid.uuid4, unique=True, editable=False, verbose_name='좌석권 ID')
    
    # 연결된 토너먼트
    tournament = models.ForeignKey(Tournament, on_delete=models.CASCADE, related_name='seat_tickets')
    
    # 좌석권 소유자
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='seat_tickets')
    
    # 티켓을 준 매장
    store = models.ForeignKey(Store, on_delete=models.CASCADE, related_name='seat_tickets', verbose_name='매장', null=True, blank=True)
    
    # 좌석권 상태
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='ACTIVE')
    
    # 좌석권 획득 방법
    source = models.CharField(max_length=20, choices=SOURCE_CHOICES, default='PURCHASE')
    
    # 구매/획득 금액 (0일 수 있음)
    amount = models.DecimalField(max_digits=10, decimal_places=2, default=0, verbose_name='금액')
    
    # 사용 시간 (실제 토너먼트 참가 시)
    used_at = models.DateTimeField(null=True, blank=True, verbose_name='사용 시간')
    
    # 만료 시간 (설정된 경우)
    expires_at = models.DateTimeField(null=True, blank=True, verbose_name='만료 시간')
    
    # 생성 시간
    created_at = models.DateTimeField(auto_now_add=True)
    
    # 수정 시간
    updated_at = models.DateTimeField(auto_now=True)
    
    # 메모 (관리자용)
    memo = models.TextField(blank=True, null=True, verbose_name='메모')
    
    class Meta:
        db_table = 'seat_tickets'
        verbose_name = '좌석권'
        verbose_name_plural = '좌석권들'
        ordering = ['-created_at']
        
    def __str__(self):
        return f"{self.user.phone} - {self.tournament.name} 좌석권 ({self.get_status_display()})"
    
    def use_ticket(self):
        """좌석권을 사용 처리합니다."""
        if self.status == 'ACTIVE':
            self.status = 'USED'
            self.used_at = timezone.now()
            self.save()
            return True
        return False
    
    def is_valid(self):
        """좌석권이 유효한지 확인합니다."""
        if self.status != 'ACTIVE':
            return False
        if self.expires_at and timezone.now() > self.expires_at:
            self.status = 'EXPIRED'
            self.save()
            return False
        return True


class SeatTicketTransaction(models.Model):
    """
    좌석권 거래 내역을 저장하는 모델
    좌석권의 증감 내역을 추적합니다.
    """
    
    # 거래 유형
    TRANSACTION_TYPES = (
        ('GRANT', '지급'),         # 좌석권 지급
        ('USE', '사용'),           # 좌석권 사용
        ('EXPIRE', '만료'),        # 좌석권 만료
        ('CANCEL', '취소'),        # 좌석권 취소
        ('REFUND', '환불'),        # 좌석권 환불
    )
    
    # 연결된 좌석권
    seat_ticket = models.ForeignKey(SeatTicket, on_delete=models.CASCADE, related_name='transactions')
    
    # 거래 유형
    transaction_type = models.CharField(max_length=20, choices=TRANSACTION_TYPES)
    
    # 거래 수량 (보통 1, 음수일 수 있음)
    quantity = models.IntegerField(default=1)
    
    # 거래 금액
    amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    
    # 거래 사유
    reason = models.TextField(blank=True, null=True, verbose_name='거래 사유')
    
    # 처리자 (관리자 등)
    processed_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, 
                                   null=True, blank=True, related_name='processed_transactions')
    
    # 생성 시간
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'seat_ticket_transactions'
        verbose_name = '좌석권 거래내역'
        verbose_name_plural = '좌석권 거래내역들'
        ordering = ['-created_at']
        
    def __str__(self):
        return f"{self.seat_ticket.user.phone} - {self.get_transaction_type_display()} ({self.quantity}개)"


class UserSeatTicketSummary(models.Model):
    """
    사용자별 토너먼트별 좌석권 보유 현황 요약
    성능 최적화를 위한 집계 테이블
    """
    
    # 사용자
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='ticket_summaries')
    
    # 토너먼트
    tournament = models.ForeignKey(Tournament, on_delete=models.CASCADE, related_name='ticket_summaries')
    
    # 활성 좌석권 수
    active_tickets = models.IntegerField(default=0, verbose_name='활성 좌석권 수')
    
    # 사용된 좌석권 수
    used_tickets = models.IntegerField(default=0, verbose_name='사용된 좌석권 수')
    
    # 총 좌석권 수
    total_tickets = models.IntegerField(default=0, verbose_name='총 좌석권 수')
    
    # 마지막 업데이트 시간
    last_updated = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'user_seat_ticket_summaries'
        verbose_name = '사용자 좌석권 요약'
        verbose_name_plural = '사용자 좌석권 요약들'
        unique_together = ('user', 'tournament')
        
    def __str__(self):
        return f"{self.user.phone} - {self.tournament.name} (활성: {self.active_tickets}개)"
    
    def update_summary(self):
        """요약 정보를 업데이트합니다."""
        tickets = SeatTicket.objects.filter(user=self.user, tournament=self.tournament)
        self.active_tickets = tickets.filter(status='ACTIVE').count()
        self.used_tickets = tickets.filter(status='USED').count()
        self.total_tickets = tickets.count()
        self.save() 


class TournamentTicketDistribution(models.Model):
    """
    본사에서 각 매장에 토너먼트 좌석권을 분배하는 정보를 관리하는 모델
    토너먼트별로 각 매장에 할당된 좌석권 수량과 배포 현황을 추적합니다.
    """
    
    # 연결된 토너먼트
    tournament = models.ForeignKey(Tournament, on_delete=models.CASCADE, related_name='ticket_distributions', verbose_name='토너먼트')
    
    # 분배받은 매장
    store = models.ForeignKey(Store, on_delete=models.CASCADE, related_name='ticket_distributions', verbose_name='매장')
    
    # 본사에서 해당 매장에 분배한 좌석권 수량
    allocated_quantity = models.IntegerField(verbose_name='분배량', help_text='본사에서 매장에 분배한 좌석권 수량')
    
    # 현재 매장에서 보유하고 있는 좌석권 수량 (분배량 - 배포량)
    remaining_quantity = models.IntegerField(verbose_name='보유수량', help_text='매장에서 현재 보유하고 있는 좌석권 수량')
    
    # 매장에서 회원들에게 배포한 좌석권 수량
    distributed_quantity = models.IntegerField(default=0, verbose_name='배포수량', help_text='매장에서 회원들에게 배포한 좌석권 수량')
    
    # 분배 생성 시간
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='생성일자')
    
    # 수정 시간 (배포량 변경 등)
    updated_at = models.DateTimeField(auto_now=True, verbose_name='수정일자')
    
    # 메모 (관리자용)
    memo = models.TextField(blank=True, null=True, verbose_name='메모')
    
    class Meta:
        db_table = 'tournament_ticket_distributions'
        verbose_name = '토너먼트 좌석권 분배'
        verbose_name_plural = '토너먼트 좌석권 분배들'
        unique_together = ('tournament', 'store')  # 한 토너먼트에 대해 한 매장은 하나의 분배 기록만 가짐
        ordering = ['-created_at']
        
    def __str__(self):
        return f"{self.tournament.name} - {self.store.name} (분배: {self.allocated_quantity}개, 보유: {self.remaining_quantity}개)"
    
    def clean(self):
        """모델 유효성 검증"""
        from django.core.exceptions import ValidationError
        
        # 분배량은 0보다 커야 함
        if self.allocated_quantity <= 0:
            raise ValidationError({'allocated_quantity': '분배량은 0보다 커야 합니다.'})
        
        # 보유수량은 0 이상이어야 함
        if self.remaining_quantity < 0:
            raise ValidationError({'remaining_quantity': '보유수량은 0 이상이어야 합니다.'})
        
        # 배포수량은 0 이상이어야 함
        if self.distributed_quantity < 0:
            raise ValidationError({'distributed_quantity': '배포수량은 0 이상이어야 합니다.'})
        
        # 분배량 = 보유수량 + 배포수량
        if self.allocated_quantity != (self.remaining_quantity + self.distributed_quantity):
            raise ValidationError('분배량은 보유수량과 배포수량의 합과 같아야 합니다.')
        
        # 토너먼트의 전체 좌석권 수량을 초과하지 않는지 확인
        if hasattr(self, 'tournament') and self.tournament:
            # 같은 토너먼트의 다른 매장 분배량 합계 계산
            other_distributions = TournamentTicketDistribution.objects.filter(
                tournament=self.tournament
            ).exclude(pk=self.pk if self.pk else None)
            
            total_allocated = sum(dist.allocated_quantity for dist in other_distributions)
            total_allocated += self.allocated_quantity
            
            if total_allocated > self.tournament.ticket_quantity:
                raise ValidationError(
                    f'전체 분배량({total_allocated})이 토너먼트 좌석권 수량({self.tournament.ticket_quantity})을 초과할 수 없습니다.'
                )
    
    def save(self, *args, **kwargs):
        """저장 전 유효성 검증 실행"""
        self.full_clean()
        super().save(*args, **kwargs)
    
    def distribute_tickets(self, quantity):
        """
        매장에서 회원들에게 좌석권을 배포할 때 호출하는 메서드
        
        Args:
            quantity (int): 배포할 좌석권 수량
            
        Returns:
            bool: 배포 성공 여부
        """
        if quantity <= 0:
            return False
        
        if self.remaining_quantity < quantity:
            return False
        
        self.remaining_quantity -= quantity
        self.distributed_quantity += quantity
        self.save()
        return True
    
    def return_tickets(self, quantity):
        """
        배포된 좌석권을 다시 매장으로 반환할 때 호출하는 메서드
        
        Args:
            quantity (int): 반환할 좌석권 수량
            
        Returns:
            bool: 반환 성공 여부
        """
        if quantity <= 0:
            return False
        
        if self.distributed_quantity < quantity:
            return False
        
        self.distributed_quantity -= quantity
        self.remaining_quantity += quantity
        self.save()
        return True 