from rest_framework import generics, status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from django.db.models import Q
from django.utils import timezone
from notices.models import Notice, NoticeReadStatus
from notices.serializers import (
    NoticeListSerializer, 
    NoticeDetailSerializer, 
    NoticeCreateUpdateSerializer,
    NoticeAdminListSerializer,
    NoticeReadStatusSerializer
)
from notices.filters import NoticeFilter


class NoticeListView(generics.ListAPIView):
    """
    공지사항 목록 조회 API
    - 전체 공지사항: 모든 사용자가 조회 가능
    - 회원 전용 공지사항: 로그인한 사용자만 조회 가능
    """
    serializer_class = NoticeListSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_class = NoticeFilter
    search_fields = ['title', 'content']
    ordering_fields = ['created_at', 'view_count', 'priority']
    ordering = ['-is_pinned', '-priority', '-created_at']
    permission_classes = [permissions.AllowAny]
    
    def get_queryset(self):
        """사용자 권한에 따른 공지사항 필터링"""
        queryset = Notice.objects.select_related('author').filter(is_published=True)
        
        # 현재 활성화된 공지사항만 조회
        now = timezone.now()
        queryset = queryset.filter(
            Q(start_date__isnull=True) | Q(start_date__lte=now),
            Q(end_date__isnull=True) | Q(end_date__gte=now)
        )
        
        # 사용자 권한에 따른 필터링
        if self.request.user.is_authenticated:
            # 로그인한 사용자는 모든 공지사항 조회 가능
            return queryset
        else:
            # 비로그인 사용자는 전체 공지사항만 조회 가능
            return queryset.filter(notice_type='GENERAL')


class NoticeAdminListView(generics.ListAPIView):
    """
    관리자용 공지사항 목록 조회 API
    - 관리자만 접근 가능
    - 모든 공지사항 조회 (활성화 여부, 날짜 제한 무관)
    """
    serializer_class = NoticeAdminListSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_class = NoticeFilter
    search_fields = ['title', 'content']
    ordering_fields = ['created_at', 'view_count', 'priority']
    ordering = ['-is_pinned', '-priority', '-created_at']
    permission_classes = [permissions.IsAdminUser]
    
    def get_queryset(self):
        """관리자용 - 모든 공지사항 조회 (날짜 제한 없음)"""
        # 모든 공지사항 조회 (is_published=True인 것만)
        queryset = Notice.objects.select_related('author').filter(is_published=True)
        
        return queryset


class NoticeDetailView(generics.RetrieveAPIView):
    """
    공지사항 상세 조회 API
    - 조회 시 자동으로 조회수 증가
    - 로그인한 사용자의 경우 읽음 상태 자동 생성
    """
    serializer_class = NoticeDetailSerializer
    permission_classes = [permissions.AllowAny]
    
    def get_queryset(self):
        """사용자 권한에 따른 공지사항 필터링"""
        queryset = Notice.objects.select_related('author').filter(is_published=True)
        
        # 현재 활성화된 공지사항만 조회
        now = timezone.now()
        queryset = queryset.filter(
            Q(start_date__isnull=True) | Q(start_date__lte=now),
            Q(end_date__isnull=True) | Q(end_date__gte=now)
        )
        
        # 사용자 권한에 따른 필터링
        if self.request.user.is_authenticated:
            return queryset
        else:
            return queryset.filter(notice_type='GENERAL')
    
    def retrieve(self, request, *args, **kwargs):
        """공지사항 상세 조회 시 조회수 증가 및 읽음 상태 처리"""
        instance = self.get_object()
        
        # 조회수 증가
        instance.increment_view_count()
        
        # 로그인한 사용자의 경우 읽음 상태 생성
        if request.user.is_authenticated:
            NoticeReadStatus.objects.get_or_create(
                user=request.user,
                notice=instance
            )
        
        serializer = self.get_serializer(instance)
        return Response(serializer.data)


class NoticeCreateView(generics.CreateAPIView):
    """
    공지사항 생성 API
    - 관리자만 생성 가능
    """
    serializer_class = NoticeCreateUpdateSerializer
    permission_classes = [permissions.IsAdminUser]
    
    def create(self, request, *args, **kwargs):
        """공지사항 생성"""
        # 권한 확인
        if not (request.user.is_staff or request.user.is_superuser):
            return Response(
                {'error': '관리자 권한이 필요합니다.'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        serializer = self.get_serializer(data=request.data)
        
        if serializer.is_valid():
            self.perform_create(serializer)
            headers = self.get_success_headers(serializer.data)
            return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)
        else:
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    def perform_create(self, serializer):
        """공지사항 생성 시 작성자 자동 설정"""
        serializer.save(author=self.request.user)


class NoticeUpdateView(generics.UpdateAPIView):
    """
    공지사항 수정 API
    - 관리자만 수정 가능
    """
    serializer_class = NoticeCreateUpdateSerializer
    permission_classes = [permissions.IsAdminUser]
    
    def get_queryset(self):
        return Notice.objects.all()
    
    def post(self, request, *args, **kwargs):
        """POST 요청에서 _method 필드를 확인하여 적절한 메서드로 라우팅"""
        # _method 필드 확인 (여러 위치에서 찾기)
        method = (
            request.data.get('_method') or 
            request.POST.get('_method') or 
            request.META.get('HTTP_X_HTTP_METHOD_OVERRIDE', '')
        ).upper()
        
        if method == 'PATCH':
            return self.patch(request, *args, **kwargs)
        elif method == 'PUT':
            return self.put(request, *args, **kwargs)
        else:
            return Response(
                {'error': f'_method 필드가 PATCH 또는 PUT이어야 합니다. 현재값: {method}'}, 
                status=status.HTTP_400_BAD_REQUEST
            )


class NoticeDeleteView(generics.DestroyAPIView):
    """
    공지사항 삭제 API
    - 관리자만 삭제 가능
    """
    permission_classes = [permissions.IsAdminUser]
    
    def get_queryset(self):
        return Notice.objects.all()
    
    def post(self, request, *args, **kwargs):
        """POST 요청에서 _method 필드를 확인하여 DELETE 메서드로 라우팅"""
        method = request.data.get('_method', '').upper()
        if method == 'DELETE':
            return self.delete(request, *args, **kwargs)
        else:
            return Response(
                {'error': f'_method 필드가 DELETE여야 합니다. 현재값: {method}'}, 
                status=status.HTTP_400_BAD_REQUEST
            )


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def mark_notice_as_read(request, notice_id):
    """
    공지사항을 읽음으로 표시하는 API
    """
    try:
        notice = Notice.objects.get(id=notice_id, is_published=True)
        
        # 사용자가 해당 공지사항을 볼 수 있는지 확인
        if not notice.can_view(request.user):
            return Response(
                {'error': '이 공지사항을 볼 권한이 없습니다.'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        # 읽음 상태 생성 또는 가져오기
        read_status, created = NoticeReadStatus.objects.get_or_create(
            user=request.user,
            notice=notice
        )
        
        if created:
            return Response(
                {'message': '공지사항을 읽음으로 표시했습니다.'}, 
                status=status.HTTP_201_CREATED
            )
        else:
            return Response(
                {'message': '이미 읽은 공지사항입니다.'}, 
                status=status.HTTP_200_OK
            )
            
    except Notice.DoesNotExist:
        return Response(
            {'error': '공지사항을 찾을 수 없습니다.'}, 
            status=status.HTTP_404_NOT_FOUND
        )


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def get_unread_notices_count(request):
    """
    읽지 않은 공지사항 개수 조회 API
    """
    # 사용자가 볼 수 있는 활성화된 공지사항
    now = timezone.now()
    available_notices = Notice.objects.filter(
        Q(is_published=True) &
        (Q(start_date__isnull=True) | Q(start_date__lte=now)) &
        (Q(end_date__isnull=True) | Q(end_date__gte=now))
    )
    
    # 사용자 권한에 따른 필터링
    if request.user.is_authenticated:
        # 로그인한 사용자는 모든 공지사항 조회 가능
        pass
    else:
        # 비로그인 사용자는 전체 공지사항만 조회 가능
        available_notices = available_notices.filter(notice_type='GENERAL')
    
    # 읽은 공지사항 ID 목록
    read_notice_ids = NoticeReadStatus.objects.filter(
        user=request.user
    ).values_list('notice_id', flat=True)
    
    # 읽지 않은 공지사항 개수
    unread_count = available_notices.exclude(id__in=read_notice_ids).count()
    
    return Response({'unread_count': unread_count})


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def get_my_read_notices(request):
    """
    내가 읽은 공지사항 목록 조회 API
    """
    read_statuses = NoticeReadStatus.objects.filter(
        user=request.user
    ).select_related('notice').order_by('-read_at')
    
    serializer = NoticeReadStatusSerializer(read_statuses, many=True)
    return Response(serializer.data) 