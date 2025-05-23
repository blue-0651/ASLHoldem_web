from django.contrib.auth.models import AbstractUser
from django.db import models
from django.core.validators import RegexValidator
import qrcode
from io import BytesIO
from django.core.files import File
import uuid

class User(AbstractUser):
    """
    사용자 모델 - Django의 기본 User 모델을 확장하여 추가 필드를 정의합니다.
    기본 필드(AbstractUser에서 상속): username, password, first_name, last_name, email, is_staff, is_active, is_superuser, date_joined, last_login
    """
    
    # 사용자 역할 선택 옵션
    ROLE_CHOICES = (
        ('ADMIN', '관리자'),           # 시스템 관리자 역할
        ('STORE_OWNER', '매장 관리자'),  # 매장 관리자 역할
        ('USER', '일반 사용자'),        # 일반 사용자 역할
    )
    
    # 전화번호 형식 검증을 위한 정규식 설정
    phone_regex = RegexValidator(
        regex=r'^\d{3}-\d{4}-\d{4}$',
        message="전화번호는 '010-1234-5678' 형식으로 입력해주세요."
    )
    
    # 사용자 역할 - 기본적으로 일반 사용자로 설정됨
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='USER')
    
    # 사용자 전화번호 - 중복 방지를 위해 unique=True 설정
    phone = models.CharField(validators=[phone_regex], max_length=13,  unique=True, null=False, blank=False)
    
    # 사용자 포인트
    points = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    
    # 사업자 등록증 파일
    business_registration = models.FileField(upload_to='business_registrations/', null=True, blank=True)
    
    # 은행 계좌 정보
    bank_account = models.CharField(max_length=100, null=True, blank=True)
    
    # 인증 여부 - 사용자 계정이 인증되었는지 여부
    is_verified = models.BooleanField(default=False)
    
    # 전화번호 (추가 필드) - 기존 phone 필드와 중복되는 것으로 보임
    phone_number = models.CharField(max_length=20, blank=True)
    
    # 매장 관리자 여부 - 매장 관리자 권한을 가진 사용자인지 여부
    is_store_owner = models.BooleanField(default=False)
    
    # QR 코드 이미지 - 생성된 QR 코드 이미지 파일 저장
    qr_code = models.ImageField(upload_to='qr_codes/', null=True, blank=True)
    
    # QR 코드 UUID - 고유한 식별자로 사용
    qr_code_uuid = models.UUIDField(default=uuid.uuid4, unique=True, editable=False)
    
    # 생성 시간
    created_at = models.DateTimeField(auto_now_add=True)
    
    # 수정 시간
    updated_at = models.DateTimeField(auto_now=True)
    
    # 생년월일
    birth_date = models.DateField(null=True, blank=True)
    
    # 성별
    GENDER_CHOICES = (
        ('M', '남성'),
        ('F', '여성'),
        ('O', '기타'),
    )
    gender = models.CharField(max_length=1, choices=GENDER_CHOICES, null=True, blank=True)
    
    class Meta:
        db_table = 'users'               # 데이터베이스 테이블 이름
        verbose_name = '사용자'           # 관리자 페이지에서 표시될 단수 이름
        verbose_name_plural = '사용자들'   # 관리자 페이지에서 표시될 복수 이름

    def __str__(self):
        """사용자 객체를 문자열로 표현할 때 사용자명 반환"""
        return self.username
        
    def generate_qr_code(self):
        """
        사용자 정보를 포함한 고유한 QR 코드를 생성합니다.
        QR 코드에는 사용자 ID와 UUID 정보가 포함됩니다.
        """
        if not self.qr_code:
            # QR 코드에 포함할 데이터 생성
            qr_data = f"user_id:{self.id},uuid:{self.qr_code_uuid}"
            
            # QR 코드 생성
            qr = qrcode.QRCode(
                version=1,
                error_correction=qrcode.constants.ERROR_CORRECT_L,
                box_size=10,
                border=4,
            )
            qr.add_data(qr_data)
            qr.make(fit=True)
            
            # QR 코드 이미지 생성
            img = qr.make_image(fill_color="black", back_color="white")
            
            # 이미지를 BytesIO로 변환
            buffer = BytesIO()
            img.save(buffer, format='PNG')
            
            # 파일 이름 생성
            filename = f'qr_code_{self.qr_code_uuid}.png'
            
            # 이미지 파일 저장
            self.qr_code.save(filename, File(buffer), save=False)
            self.save()
            
        return self.qr_code
        
    def save(self, *args, **kwargs):
        """
        사용자 저장 시 자동으로 QR 코드를 생성합니다.
        새로운 사용자가 생성될 때만 QR 코드를 생성합니다.
        """
        is_new = self._state.adding  # 새로운 객체인지 확인
        super().save(*args, **kwargs)  # 기본 저장 동작 수행
        if is_new:
            self.generate_qr_code()  # 새 사용자인 경우 QR 코드 생성 