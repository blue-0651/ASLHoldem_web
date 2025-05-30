from django.db import models
from django.conf import settings
from django.core.validators import MinLengthValidator


class Notice(models.Model):
    """
    공지사항 모델
    전체 공지사항, 매장관리자 공지사항, 일반회원 공지사항을 구분하여 관리합니다.
    """
    
    # 공지사항 타입 선택 옵션
    NOTICE_TYPE_CHOICES = (
        ('GENERAL', '전체 공지사항'),          # 모든 사용자가 볼 수 있는 공지사항
        ('STORE_MANAGER', '매장관리자 공지사항'), # 매장관리자만 볼 수 있는 공지사항
        ('MEMBER_ONLY', '일반회원 공지사항'),    # 일반회원만 볼 수 있는 공지사항
    )
    
    # 중요도 선택 옵션
    PRIORITY_CHOICES = (
        ('LOW', '낮음'),
        ('NORMAL', '보통'),
        ('HIGH', '높음'),
        ('URGENT', '긴급'),
    )
    
    # 공지사항 제목 (최소 5자 이상)
    title = models.CharField(
        max_length=200, 
        validators=[MinLengthValidator(5)],
        help_text='공지사항 제목 (최소 5자 이상)'
    )
    
    # 공지사항 내용 (최소 10자 이상)
    content = models.TextField(
        validators=[MinLengthValidator(10)],
        help_text='공지사항 내용 (최소 10자 이상)'
    )
    
    # 공지사항 타입
    notice_type = models.CharField(
        max_length=20, 
        choices=NOTICE_TYPE_CHOICES, 
        default='GENERAL',
        help_text='공지사항 대상 구분'
    )
    
    # 중요도
    priority = models.CharField(
        max_length=10, 
        choices=PRIORITY_CHOICES, 
        default='NORMAL',
        help_text='공지사항 중요도'
    )
    
    # 작성자 (관리자만 작성 가능)
    author = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.CASCADE,
        related_name='notices',
        help_text='공지사항 작성자'
    )
    
    # 공개 여부
    is_published = models.BooleanField(
        default=True,
        help_text='공지사항 공개 여부'
    )
    
    # 상단 고정 여부
    is_pinned = models.BooleanField(
        default=False,
        help_text='상단 고정 여부'
    )
    
    # 표시 우선순위 (Z-ORDER)
    z_order = models.IntegerField(
        default=0,
        help_text='표시 우선순위 (숫자가 클수록 상단에 표시)'
    )
    
    # 조회수
    view_count = models.PositiveIntegerField(
        default=0,
        help_text='조회수'
    )
    
    # 첨부파일 (선택사항)
    attachment = models.FileField(
        upload_to='notice_attachments/',
        null=True,
        blank=True,
        help_text='첨부파일 (선택사항)'
    )
    
    # 공지 시작일 (선택사항)
    start_date = models.DateTimeField(
        null=True,
        blank=True,
        help_text='공지 시작일 (설정하지 않으면 작성일부터 공개)'
    )
    
    # 공지 종료일 (선택사항)
    end_date = models.DateTimeField(
        null=True,
        blank=True,
        help_text='공지 종료일 (설정하지 않으면 무기한 공개)'
    )
    
    # 공지 대상 회원 (비어있으면 전체 회원)
    target_users = models.ManyToManyField(
        settings.AUTH_USER_MODEL,
        blank=True,
        related_name='target_notices',
        help_text='공지 대상 회원(비어있으면 전체 회원)'
    )
    
    # 생성 시간
    created_at = models.DateTimeField(
        auto_now_add=True,
        help_text='생성 시간'
    )
    
    # 수정 시간
    updated_at = models.DateTimeField(
        auto_now=True,
        help_text='수정 시간'
    )
    
    class Meta:
        db_table = 'notices'
        verbose_name = '공지사항'
        verbose_name_plural = '공지사항들'
        ordering = ['-z_order', '-is_pinned', '-priority', '-created_at']  # Z-ORDER 우선, 고정글, 중요도 순, 최신순
        indexes = [
            models.Index(fields=['z_order', 'is_pinned']),
            models.Index(fields=['notice_type', 'is_published']),
            models.Index(fields=['is_pinned', 'priority']),
            models.Index(fields=['created_at']),
        ]
    
    def __str__(self):
        """공지사항 객체를 문자열로 표현"""
        return f"[{self.get_notice_type_display()}] {self.title}"
    
    def increment_view_count(self):
        """조회수 증가"""
        self.view_count += 1
        self.save(update_fields=['view_count'])
    
    def is_active(self):
        """현재 활성화된 공지사항인지 확인"""
        from django.utils import timezone
        now = timezone.now()
        
        # 공개되지 않은 공지사항은 비활성
        if not self.is_published:
            return False
        
        # 시작일이 설정되어 있고 아직 시작되지 않은 경우
        if self.start_date and now < self.start_date:
            return False
        
        # 종료일이 설정되어 있고 이미 종료된 경우
        if self.end_date and now > self.end_date:
            return False
        
        return True
    
    def can_view(self, user):
        """사용자가 이 공지사항을 볼 수 있는지 확인"""
        # 공지사항이 활성화되지 않은 경우
        if not self.is_active():
            return False
        
        # 전체 공지사항은 모든 사용자가 볼 수 있음
        if self.notice_type == 'GENERAL':
            return True
        
        # 매장관리자 공지사항은 매장관리자만 볼 수 있음
        if self.notice_type == 'STORE_MANAGER':
            if not user.is_authenticated:
                return False
            # is_store_owner 필드 또는 role이 STORE_OWNER인 경우
            return user.is_store_owner or (hasattr(user, 'role') and user.role == 'STORE_OWNER')
        
        # 일반회원 공지사항은 일반회원(매장관리자 제외)만 볼 수 있음
        if self.notice_type == 'MEMBER_ONLY':
            if not user.is_authenticated:
                return False
            # 매장관리자는 제외하고 일반회원만
            if user.is_store_owner or (hasattr(user, 'role') and user.role == 'STORE_OWNER'):
                return False
            # target_users가 비어있으면 전체 일반회원, 아니면 포함된 회원만
            if self.target_users.exists():
                return self.target_users.filter(pk=user.pk).exists()
            return True
        
        return False


class NoticeReadStatus(models.Model):
    """
    공지사항 읽음 상태 모델
    사용자가 어떤 공지사항을 읽었는지 추적합니다.
    """
    
    # 사용자
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='notice_read_statuses'
    )
    
    # 공지사항
    notice = models.ForeignKey(
        Notice,
        on_delete=models.CASCADE,
        related_name='read_statuses'
    )
    
    # 읽은 시간
    read_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'notice_read_statuses'
        verbose_name = '공지사항 읽음 상태'
        verbose_name_plural = '공지사항 읽음 상태들'
        unique_together = ['user', 'notice']  # 사용자당 공지사항 하나씩만 읽음 상태 저장
        indexes = [
            models.Index(fields=['user', 'notice']),
            models.Index(fields=['read_at']),
        ]
    
    def __str__(self):
        return f"{self.user} - {self.notice.title} (읽음: {self.read_at})"
