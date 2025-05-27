from rest_framework import serializers
from django.utils import timezone
from .models import Notice, NoticeReadStatus


class NoticeListSerializer(serializers.ModelSerializer):
    """공지사항 목록용 시리얼라이저"""
    
    author_name = serializers.CharField(source='author.username', read_only=True)
    notice_type_display = serializers.CharField(source='get_notice_type_display', read_only=True)
    priority_display = serializers.CharField(source='get_priority_display', read_only=True)
    is_read = serializers.SerializerMethodField()
    is_active = serializers.SerializerMethodField()
    
    class Meta:
        model = Notice
        fields = [
            'id', 'title', 'notice_type', 'notice_type_display',
            'priority', 'priority_display', 'author_name', 
            'is_published', 'is_pinned', 'view_count',
            'created_at', 'updated_at', 'start_date', 'end_date',
            'is_read', 'is_active'
        ]
    
    def get_is_read(self, obj):
        """사용자가 이 공지사항을 읽었는지 확인"""
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return NoticeReadStatus.objects.filter(
                user=request.user, 
                notice=obj
            ).exists()
        return False
    
    def get_is_active(self, obj):
        """공지사항이 현재 활성화되어 있는지 확인"""
        return obj.is_active()


class NoticeDetailSerializer(serializers.ModelSerializer):
    """공지사항 상세용 시리얼라이저"""
    
    author_name = serializers.CharField(source='author.username', read_only=True)
    notice_type_display = serializers.CharField(source='get_notice_type_display', read_only=True)
    priority_display = serializers.CharField(source='get_priority_display', read_only=True)
    is_read = serializers.SerializerMethodField()
    is_active = serializers.SerializerMethodField()
    attachment_url = serializers.SerializerMethodField()
    
    class Meta:
        model = Notice
        fields = [
            'id', 'title', 'content', 'notice_type', 'notice_type_display',
            'priority', 'priority_display', 'author_name', 
            'is_published', 'is_pinned', 'view_count',
            'attachment', 'attachment_url', 'start_date', 'end_date',
            'created_at', 'updated_at', 'is_read', 'is_active'
        ]
    
    def get_is_read(self, obj):
        """사용자가 이 공지사항을 읽었는지 확인"""
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return NoticeReadStatus.objects.filter(
                user=request.user, 
                notice=obj
            ).exists()
        return False
    
    def get_is_active(self, obj):
        """공지사항이 현재 활성화되어 있는지 확인"""
        return obj.is_active()
    
    def get_attachment_url(self, obj):
        """첨부파일 URL 반환"""
        if obj.attachment:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.attachment.url)
        return None


class NoticeCreateUpdateSerializer(serializers.ModelSerializer):
    """공지사항 생성/수정용 시리얼라이저"""
    
    class Meta:
        model = Notice
        fields = [
            'title', 'content', 'notice_type', 'priority',
            'is_published', 'is_pinned', 'attachment',
            'start_date', 'end_date'
        ]
    
    def validate_title(self, value):
        """제목 유효성 검사"""
        if len(value.strip()) < 5:
            raise serializers.ValidationError("제목은 최소 5자 이상이어야 합니다.")
        return value.strip()
    
    def validate_content(self, value):
        """내용 유효성 검사"""
        if len(value.strip()) < 10:
            raise serializers.ValidationError("내용은 최소 10자 이상이어야 합니다.")
        return value.strip()
    
    def validate(self, data):
        """전체 데이터 유효성 검사"""
        start_date = data.get('start_date')
        end_date = data.get('end_date')
        
        # 시작일과 종료일 검증
        if start_date and end_date:
            if start_date >= end_date:
                raise serializers.ValidationError({
                    'end_date': '종료일은 시작일보다 늦어야 합니다.'
                })
        
        # 과거 날짜 검증 (생성 시에만, 5분 여유시간 적용)
        now = timezone.now()
        
        if start_date:
            # 5분 여유시간 적용 (프론트엔드와 동일)
            from datetime import timedelta
            five_minutes_ago = now - timedelta(minutes=5)
            
            if start_date < five_minutes_ago:
                raise serializers.ValidationError({
                    'start_date': '시작일은 현재 시간보다 늦어야 합니다. (5분 여유시간 적용)'
                })
        
        return data


class NoticeAdminListSerializer(serializers.ModelSerializer):
    """관리자용 공지사항 목록 시리얼라이저 (content 포함)"""
    
    author_name = serializers.CharField(source='author.username', read_only=True)
    notice_type_display = serializers.CharField(source='get_notice_type_display', read_only=True)
    priority_display = serializers.CharField(source='get_priority_display', read_only=True)
    is_read = serializers.SerializerMethodField()
    is_active = serializers.SerializerMethodField()
    
    class Meta:
        model = Notice
        fields = [
            'id', 'title', 'content', 'notice_type', 'notice_type_display',
            'priority', 'priority_display', 'author_name', 
            'is_published', 'is_pinned', 'view_count',
            'created_at', 'updated_at', 'start_date', 'end_date',
            'is_read', 'is_active'
        ]
    
    def get_is_read(self, obj):
        """사용자가 이 공지사항을 읽었는지 확인"""
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return NoticeReadStatus.objects.filter(
                user=request.user, 
                notice=obj
            ).exists()
        return False
    
    def get_is_active(self, obj):
        """공지사항이 현재 활성화되어 있는지 확인"""
        return obj.is_active()


class NoticeReadStatusSerializer(serializers.ModelSerializer):
    """공지사항 읽음 상태 시리얼라이저"""
    
    notice_title = serializers.CharField(source='notice.title', read_only=True)
    user_name = serializers.CharField(source='user.username', read_only=True)
    
    class Meta:
        model = NoticeReadStatus
        fields = ['id', 'notice', 'notice_title', 'user_name', 'read_at']
        read_only_fields = ['user', 'read_at'] 