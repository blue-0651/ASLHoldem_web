from django.db import models
from django.conf import settings
from stores.models import Store

class Tournament(models.Model):
    """
    토너먼트 정보를 저장하는 모델
    매장에서 개최하는 토너먼트의 일정, 참가비, 좌석 수 등의 정보를 관리합니다.
    """
    
    # 토너먼트 상태 선택 옵션
    STATUS_CHOICES = (
        ('UPCOMING', '예정'),      # 아직 시작하지 않은 예정된 토너먼트
        ('ONGOING', '진행중'),     # 현재 진행 중인 토너먼트
        ('COMPLETED', '완료'),     # 종료된 토너먼트
        ('CANCELLED', '취소'),     # 취소된 토너먼트
    )
    
    # 연결된 매장
    store = models.ForeignKey(Store, on_delete=models.CASCADE, related_name='tournaments')
    
    # 토너먼트 이름
    name = models.CharField(max_length=100, verbose_name='토너먼트명')
    
    # 시작 시간
    start_time = models.DateTimeField(verbose_name='시작 시간')
    
    # 참가비 (바이인)
    buy_in = models.DecimalField(max_digits=10, decimal_places=2, verbose_name='바이인')
    
    # 좌석권 수량
    ticket_quantity = models.IntegerField(verbose_name='좌석권 수량', default=100)
    
    # 토너먼트 설명
    description = models.TextField(verbose_name='토너먼트 설명', null=True, blank=True)
    
    # 토너먼트 상태
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='UPCOMING')
    
    # 생성 시간
    created_at = models.DateTimeField(auto_now_add=True)
    
    # 수정 시간
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'tournaments'           # 데이터베이스 테이블 이름
        verbose_name = '토너먼트'           # 관리자 페이지에서 표시될 단수 이름
        verbose_name_plural = '토너먼트들'   # 관리자 페이지에서 표시될 복수 이름
        
    def __str__(self):
        """토너먼트 객체를 문자열로 표현할 때 매장명과 토너먼트명 반환"""
        return f"{self.store.name} - {self.name}"

class TournamentRegistration(models.Model):
    """
    토너먼트 등록 정보를 저장하는 모델
    사용자가 토너먼트에 등록한 정보, 체크인 상태, 결제 정보 등을 관리합니다.
    """
    
    # 연결된 토너먼트
    tournament = models.ForeignKey(Tournament, on_delete=models.CASCADE, related_name='registrations')
    
    # 등록한 사용자
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='tournament_registrations')
    
    # 지불한 금액
    paid_amount = models.DecimalField(max_digits=10, decimal_places=2)
    
    # 등록 시간
    registered_at = models.DateTimeField(auto_now_add=True)
    
    # 체크인 여부
    checked_in = models.BooleanField(default=False)
    
    # 체크인 시간
    checked_in_at = models.DateTimeField(null=True, blank=True)
    
    # 좌석권 보유 여부
    has_ticket = models.BooleanField(default=True, verbose_name='좌석권 보유 여부')
    
    class Meta:
        db_table = 'tournament_registrations'      # 데이터베이스 테이블 이름
        verbose_name = '토너먼트 등록'               # 관리자 페이지에서 표시될 단수 이름
        verbose_name_plural = '토너먼트 등록들'       # 관리자 페이지에서 표시될 복수 이름
        unique_together = ('tournament', 'user')   # 한 사용자가 같은 토너먼트에 중복 등록 방지
        
    def __str__(self):
        """토너먼트 등록 객체를 문자열로 표현할 때 사용자명과 토너먼트명 반환"""
        return f"{self.user.username} - {self.tournament.name}" 