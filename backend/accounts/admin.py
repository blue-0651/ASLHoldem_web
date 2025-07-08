from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.contrib.auth.forms import UserChangeForm, UserCreationForm
from django.utils.translation import gettext_lazy as _
from .models import User


class CustomUserCreationForm(UserCreationForm):
    """사용자 생성 폼"""
    class Meta:
        model = User
        fields = ('phone', 'email', 'nickname', 'role')


class CustomUserChangeForm(UserChangeForm):
    """사용자 수정 폼"""
    class Meta:
        model = User
        fields = '__all__'


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    """사용자 관리자 페이지 설정"""
    form = CustomUserChangeForm
    add_form = CustomUserCreationForm
    
    # 사용자 목록 페이지에서 표시할 필드들
    list_display = ('phone', 'nickname', 'email', 'role', 'is_active', 'is_verified', 'is_store_owner', 'date_joined')
    
    # 필터링 가능한 필드들
    list_filter = ('role', 'is_active', 'is_verified', 'is_store_owner', 'is_staff', 'is_superuser', 'date_joined')
    
    # 검색 가능한 필드들
    search_fields = ('phone', 'nickname', 'email', 'first_name', 'last_name')
    
    # 정렬 기준
    ordering = ('-date_joined',)
    
    # 사용자 수정 페이지의 필드 구성
    fieldsets = (
        (None, {'fields': ('phone', 'password')}),
        (_('개인정보'), {'fields': ('first_name', 'last_name', 'nickname', 'email', 'birth_date', 'gender')}),
        (_('권한'), {
            'fields': ('role', 'is_active', 'is_verified', 'is_store_owner', 'is_staff', 'is_superuser', 'groups', 'user_permissions'),
        }),
        (_('기타정보'), {'fields': ('points', 'business_registration', 'bank_account', 'phone_number')}),
        (_('QR코드'), {'fields': ('qr_code', 'qr_code_uuid')}),
        (_('중요한 날짜'), {'fields': ('last_login', 'date_joined')}),
    )
    
    # 사용자 생성 페이지의 필드 구성
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('phone', 'email', 'nickname', 'role', 'password1', 'password2'),
        }),
    )
    
    # 읽기 전용 필드들
    readonly_fields = ('date_joined', 'last_login', 'qr_code_uuid', 'created_at', 'updated_at')
    
    # 필터 수평 표시
    filter_horizontal = ('groups', 'user_permissions')
    
    # 사용자 목록에서 클릭 가능한 링크 필드들
    list_display_links = ('phone', 'nickname')
    
    # 페이지당 표시할 항목 수
    list_per_page = 25
    
    # 액션 버튼 위치
    actions_on_top = True
    actions_on_bottom = False
    
    def get_queryset(self, request):
        """쿼리셋 최적화"""
        qs = super().get_queryset(request)
        return qs.select_related().prefetch_related('groups', 'user_permissions')
    
    def save_model(self, request, obj, form, change):
        """모델 저장 시 추가 처리"""
        # 역할에 따른 권한 자동 설정
        if obj.role == 'ADMIN':
            obj.is_staff = True
            obj.is_superuser = True
        elif obj.role == 'STORE_OWNER':
            obj.is_store_owner = True
            obj.is_staff = True
            obj.is_superuser = False
        else:
            obj.is_store_owner = False
            obj.is_staff = False
            obj.is_superuser = False
        
        super().save_model(request, obj, form, change)
    
    def get_form(self, request, obj=None, **kwargs):
        """폼 커스터마이징"""
        form = super().get_form(request, obj, **kwargs)
        
        # 역할 필드 도움말 텍스트 추가
        if 'role' in form.base_fields:
            form.base_fields['role'].help_text = "사용자 역할을 선택하세요. 역할에 따라 권한이 자동으로 설정됩니다."
        
        return form


# User 모델에 대한 추가 관리자 액션들
@admin.action(description='선택한 사용자를 인증 상태로 변경')
def make_verified(modeladmin, request, queryset):
    """사용자를 인증 상태로 변경"""
    queryset.update(is_verified=True)


@admin.action(description='선택한 사용자를 비인증 상태로 변경')
def make_unverified(modeladmin, request, queryset):
    """사용자를 비인증 상태로 변경"""
    queryset.update(is_verified=False)


@admin.action(description='선택한 사용자를 활성화')
def make_active(modeladmin, request, queryset):
    """사용자를 활성화"""
    queryset.update(is_active=True)


@admin.action(description='선택한 사용자를 비활성화')
def make_inactive(modeladmin, request, queryset):
    """사용자를 비활성화"""
    queryset.update(is_active=False)


# 액션을 UserAdmin에 추가
UserAdmin.actions = [make_verified, make_unverified, make_active, make_inactive] 