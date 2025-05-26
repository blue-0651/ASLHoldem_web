import django_filters
from django.db.models import Q
from .models import Notice


class NoticeFilter(django_filters.FilterSet):
    """공지사항 필터링을 위한 필터셋"""
    
    # 공지사항 타입 필터
    notice_type = django_filters.ChoiceFilter(
        choices=Notice.NOTICE_TYPE_CHOICES,
        help_text='공지사항 타입으로 필터링'
    )
    
    # 중요도 필터
    priority = django_filters.ChoiceFilter(
        choices=Notice.PRIORITY_CHOICES,
        help_text='중요도로 필터링'
    )
    
    # 고정 공지사항 필터
    is_pinned = django_filters.BooleanFilter(
        help_text='고정 공지사항 여부로 필터링'
    )
    
    # 작성자 필터
    author = django_filters.CharFilter(
        field_name='author__username',
        lookup_expr='icontains',
        help_text='작성자 이름으로 필터링'
    )
    
    # 날짜 범위 필터
    created_after = django_filters.DateTimeFilter(
        field_name='created_at',
        lookup_expr='gte',
        help_text='지정된 날짜 이후에 작성된 공지사항'
    )
    
    created_before = django_filters.DateTimeFilter(
        field_name='created_at',
        lookup_expr='lte',
        help_text='지정된 날짜 이전에 작성된 공지사항'
    )
    
    # 제목 또는 내용 검색
    search = django_filters.CharFilter(
        method='filter_search',
        help_text='제목 또는 내용에서 검색'
    )
    
    class Meta:
        model = Notice
        fields = [
            'notice_type', 
            'priority', 
            'is_pinned', 
            'author', 
            'created_after', 
            'created_before',
            'search'
        ]
    
    def filter_search(self, queryset, name, value):
        """제목 또는 내용에서 검색"""
        if value:
            return queryset.filter(
                Q(title__icontains=value) | Q(content__icontains=value)
            )
        return queryset 