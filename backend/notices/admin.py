from django.contrib import admin
from django.utils.html import format_html
from django.urls import reverse
from django.utils.safestring import mark_safe
from .models import Notice, NoticeReadStatus


@admin.register(Notice)
class NoticeAdmin(admin.ModelAdmin):
    """공지사항 관리자 페이지 설정"""
    
    list_display = [
        'title', 
        'notice_type_display', 
        'priority_display', 
        'author', 
        'is_published', 
        'is_pinned', 
        'view_count',
        'created_at'
    ]
    
    list_filter = [
        'notice_type', 
        'priority', 
        'is_published', 
        'is_pinned', 
        'created_at',
        'author'
    ]
    
    search_fields = ['title', 'content', 'author__username']
    
    readonly_fields = ['view_count', 'created_at', 'updated_at']
    
    fieldsets = (
        ('기본 정보', {
            'fields': ('title', 'content', 'author')
        }),
        ('공지사항 설정', {
            'fields': ('notice_type', 'priority', 'is_published', 'is_pinned')
        }),
        ('첨부파일', {
            'fields': ('attachment',),
            'classes': ('collapse',)
        }),
        ('공개 기간 설정', {
            'fields': ('start_date', 'end_date'),
            'classes': ('collapse',),
            'description': '공개 기간을 설정하지 않으면 무기한 공개됩니다.'
        }),
        ('통계 정보', {
            'fields': ('view_count', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    list_per_page = 20
    
    ordering = ['-is_pinned', '-priority', '-created_at']
    
    def notice_type_display(self, obj):
        """공지사항 타입을 색상과 함께 표시"""
        colors = {
            'GENERAL': '#28a745',  # 초록색
            'MEMBER_ONLY': '#007bff',  # 파란색
        }
        color = colors.get(obj.notice_type, '#6c757d')
        return format_html(
            '<span style="color: {}; font-weight: bold;">{}</span>',
            color,
            obj.get_notice_type_display()
        )
    notice_type_display.short_description = '공지 타입'
    
    def priority_display(self, obj):
        """중요도를 색상과 함께 표시"""
        colors = {
            'LOW': '#6c757d',      # 회색
            'NORMAL': '#28a745',   # 초록색
            'HIGH': '#ffc107',     # 노란색
            'URGENT': '#dc3545',   # 빨간색
        }
        color = colors.get(obj.priority, '#6c757d')
        return format_html(
            '<span style="color: {}; font-weight: bold;">{}</span>',
            color,
            obj.get_priority_display()
        )
    priority_display.short_description = '중요도'
    
    def get_queryset(self, request):
        """쿼리셋 최적화"""
        return super().get_queryset(request).select_related('author')
    
    def save_model(self, request, obj, form, change):
        """공지사항 저장 시 작성자 자동 설정"""
        if not change:  # 새로 생성하는 경우
            obj.author = request.user
        super().save_model(request, obj, form, change)


@admin.register(NoticeReadStatus)
class NoticeReadStatusAdmin(admin.ModelAdmin):
    """공지사항 읽음 상태 관리자 페이지 설정"""
    
    list_display = ['user', 'notice_title', 'read_at']
    
    list_filter = ['read_at', 'notice__notice_type']
    
    search_fields = ['user__username', 'user__phone', 'notice__title']
    
    readonly_fields = ['user', 'notice', 'read_at']
    
    list_per_page = 50
    
    ordering = ['-read_at']
    
    def notice_title(self, obj):
        """공지사항 제목 표시"""
        return obj.notice.title
    notice_title.short_description = '공지사항'
    
    def get_queryset(self, request):
        """쿼리셋 최적화"""
        return super().get_queryset(request).select_related('user', 'notice')
    
    def has_add_permission(self, request):
        """읽음 상태는 직접 추가할 수 없음"""
        return False
    
    def has_change_permission(self, request, obj=None):
        """읽음 상태는 수정할 수 없음"""
        return False


# 관리자 페이지 제목 설정
admin.site.site_header = "ASL 홀덤 관리자"
admin.site.site_title = "ASL 홀덤"
admin.site.index_title = "관리자 대시보드"
