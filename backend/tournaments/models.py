from django.db import models
from django.conf import settings
from stores.models import Store

class Tournament(models.Model):
    STATUS_CHOICES = (
        ('UPCOMING', '예정'),
        ('ONGOING', '진행중'),
        ('COMPLETED', '완료'),
        ('CANCELLED', '취소'),
    )
    
    store = models.ForeignKey(Store, on_delete=models.CASCADE, related_name='tournaments')
    name = models.CharField(max_length=100, verbose_name='토너먼트명')
    start_time = models.DateTimeField(verbose_name='시작 시간')
    buy_in = models.DecimalField(max_digits=10, decimal_places=2, verbose_name='바이인')
    max_seats = models.IntegerField(verbose_name='좌석권 수량', default=100)
    description = models.TextField(verbose_name='토너먼트 설명', null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='UPCOMING')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'tournaments'
        verbose_name = '토너먼트'
        verbose_name_plural = '토너먼트들'
        
    def __str__(self):
        return f"{self.store.name} - {self.name}"

class TournamentRegistration(models.Model):
    tournament = models.ForeignKey(Tournament, on_delete=models.CASCADE, related_name='registrations')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='tournament_registrations')
    paid_amount = models.DecimalField(max_digits=10, decimal_places=2)
    registered_at = models.DateTimeField(auto_now_add=True)
    checked_in = models.BooleanField(default=False)
    checked_in_at = models.DateTimeField(null=True, blank=True)
    has_ticket = models.BooleanField(default=True, verbose_name='좌석권 보유 여부')
    
    class Meta:
        db_table = 'tournament_registrations'
        verbose_name = '토너먼트 등록'
        verbose_name_plural = '토너먼트 등록들'
        unique_together = ('tournament', 'user')
        
    def __str__(self):
        return f"{self.user.username} - {self.tournament.name}" 