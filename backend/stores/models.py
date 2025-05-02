from django.db import models
from django.conf import settings

class Store(models.Model):
    STATUS_CHOICES = (
        ('ACTIVE', '운영중'),
        ('INACTIVE', '휴업중'),
        ('CLOSED', '폐업'),
    )
    
    name = models.CharField(max_length=100, verbose_name='매장명')
    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='stores')
    address = models.CharField(max_length=200, verbose_name='주소')
    description = models.TextField(verbose_name='매장 설명')
    image = models.ImageField(upload_to='store_images/', verbose_name='매장 이미지')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='ACTIVE')
    latitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    longitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'stores'
        verbose_name = '매장'
        verbose_name_plural = '매장들'
        
    def __str__(self):
        return self.name

class Banner(models.Model):
    store = models.ForeignKey(Store, on_delete=models.CASCADE, related_name='banners')
    image = models.ImageField(upload_to='banner_images/', verbose_name='배너 이미지')
    title = models.CharField(max_length=100, verbose_name='배너 제목')
    description = models.TextField(verbose_name='배너 설명', null=True, blank=True)
    start_date = models.DateTimeField(verbose_name='시작일')
    end_date = models.DateTimeField(verbose_name='종료일')
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'banners'
        verbose_name = '배너'
        verbose_name_plural = '배너들'
        
    def __str__(self):
        return f"{self.store.name} - {self.title}" 