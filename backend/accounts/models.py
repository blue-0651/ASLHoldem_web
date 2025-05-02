from django.contrib.auth.models import AbstractUser
from django.db import models
from django.core.validators import RegexValidator
import qrcode
from io import BytesIO
from django.core.files import File
import uuid

class User(AbstractUser):
    ROLE_CHOICES = (
        ('ADMIN', '관리자'),
        ('STORE_OWNER', '매장 관리자'),
        ('USER', '일반 사용자'),
    )
    
    phone_regex = RegexValidator(
        regex=r'^\d{3}-\d{4}-\d{4}$',
        message="전화번호는 '010-1234-5678' 형식으로 입력해주세요."
    )
    
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='USER')
    phone = models.CharField(validators=[phone_regex], max_length=13, unique=True, null=True, blank=True)
    points = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    business_registration = models.FileField(upload_to='business_registrations/', null=True, blank=True)
    bank_account = models.CharField(max_length=100, null=True, blank=True)
    is_verified = models.BooleanField(default=False)
    phone_number = models.CharField(max_length=20, blank=True)
    is_store_owner = models.BooleanField(default=False)
    qr_code = models.ImageField(upload_to='qr_codes/', null=True, blank=True)
    qr_code_uuid = models.UUIDField(default=uuid.uuid4, unique=True, editable=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'users'
        verbose_name = '사용자'
        verbose_name_plural = '사용자들'

    def __str__(self):
        return self.username
        
    def generate_qr_code(self):
        """
        사용자 정보를 포함한 고유한 QR 코드를 생성합니다.
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
        """
        is_new = self._state.adding
        super().save(*args, **kwargs)
        if is_new:
            self.generate_qr_code() 