from django.db import models
from django.conf import settings

class Store(models.Model):
    """
    매장 정보를 저장하는 모델
    매장 이름, 주소, 상태 등 매장 관련 정보를 관리합니다.
    """
    
    # 매장 상태 선택 옵션
    STATUS_CHOICES = (
        ('ACTIVE', '운영중'),      # 현재 영업 중인 매장
        ('INACTIVE', '휴업중'),    # 일시적으로 영업을 중단한 매장
        ('CLOSED', '폐업'),       # 영구적으로 영업을 중단한 매장
    )
    
    # 매장 이름
    name = models.CharField(max_length=100, verbose_name='매장명')
    
    # 매장 소유자 - 사용자 모델과 연결
    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='stores')
    
    # 매장 주소
    address = models.CharField(max_length=200, verbose_name='주소')
    
    # 매장 설명
    description = models.TextField(verbose_name='매장 설명')
    
    # 매장 이미지
    image = models.ImageField(upload_to='store_images/', verbose_name='매장 이미지')
    
    # 매장 상태
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='ACTIVE')
    
    # 위도 - 지도 표시를 위한 위치 정보
    latitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    
    # 경도 - 지도 표시를 위한 위치 정보
    longitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    
    # 생성 시간
    created_at = models.DateTimeField(auto_now_add=True)
    
    # 수정 시간
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'stores'                # 데이터베이스 테이블 이름
        verbose_name = '매장'              # 관리자 페이지에서 표시될 단수 이름
        verbose_name_plural = '매장들'      # 관리자 페이지에서 표시될 복수 이름
        
    def __str__(self):
        """매장 객체를 문자열로 표현할 때 매장명 반환"""
        return self.name

class Banner(models.Model):
    """
    매장 배너 정보를 저장하는 모델
    매장 홍보, 이벤트 안내 등을 위한 배너 이미지와 정보를 관리합니다.
    """
    
    # 연결된 매장
    store = models.ForeignKey(Store, on_delete=models.CASCADE, related_name='banners')
    
    # 배너 이미지
    image = models.ImageField(upload_to='banner_images/', verbose_name='배너 이미지')
    
    # 배너 제목
    title = models.CharField(max_length=100, verbose_name='배너 제목')
    
    # 배너 설명
    description = models.TextField(verbose_name='배너 설명', null=True, blank=True)
    
    # 배너 표시 시작일
    start_date = models.DateTimeField(verbose_name='시작일')
    
    # 배너 표시 종료일
    end_date = models.DateTimeField(verbose_name='종료일')
    
    # 활성화 여부
    is_active = models.BooleanField(default=True)
    
    # 생성 시간
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'banners'               # 데이터베이스 테이블 이름
        verbose_name = '배너'              # 관리자 페이지에서 표시될 단수 이름
        verbose_name_plural = '배너들'      # 관리자 페이지에서 표시될 복수 이름
        
    def __str__(self):
        """배너 객체를 문자열로 표현할 때 매장명과 배너 제목 반환"""
        return f"{self.store.name} - {self.title}" 