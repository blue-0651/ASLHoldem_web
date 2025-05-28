from django.db import models
from django.conf import settings
from stores.models import Store

class Tournament(models.Model):
    """
    토너먼트 정보를 저장하는 모델
    동일한 토너먼트가 여러 매장에서 개최될 수 있으므로 매장 정보는 등록 테이블에서 관리합니다.
    """
    
    # 토너먼트 상태 선택 옵션
    STATUS_CHOICES = (
        ('UPCOMING', '예정'),      # 아직 시작하지 않은 예정된 토너먼트
        ('ONGOING', '진행중'),     # 현재 진행 중인 토너먼트
        ('COMPLETED', '완료'),     # 종료된 토너먼트
        ('CANCELLED', '취소'),     # 취소된 토너먼트
    )
    
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
        """토너먼트 객체를 문자열로 표현할 때 토너먼트명 반환"""
        return self.name


class TournamentPlayer(models.Model):
    """
    토너먼트 참가 선수 정보를 저장하는 모델
    """
    
    # 토너먼트 (외래키)
    tournament = models.ForeignKey(Tournament, on_delete=models.CASCADE, verbose_name='토너먼트')
    
    # 사용자 (외래키)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, verbose_name='사용자')
    
    # 닉네임 (토너먼트에서 사용할 이름)
    nickname = models.CharField(max_length=50, verbose_name='닉네임')
    
    # 등록 시간
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='등록 시간')
    
    # 수정 시간
    updated_at = models.DateTimeField(auto_now=True, verbose_name='수정 시간')
    
    class Meta:
        db_table = 'tournament_players'
        verbose_name = '토너먼트 참가자'
        verbose_name_plural = '토너먼트 참가자들'
        unique_together = ('tournament', 'user')  # 같은 토너먼트에 같은 사용자는 한 번만 등록 가능
        
    def __str__(self):
        return f"{self.tournament.name} - {self.nickname}"


 