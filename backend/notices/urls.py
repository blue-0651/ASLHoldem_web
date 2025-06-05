from django.urls import path
from views import notices_views

app_name = 'notices'

urlpatterns = [
    # 공지사항 목록 조회
    path('', notices_views.NoticeListView.as_view(), name='notice-list'),
    
    # 관리자용 공지사항 목록 조회 (모든 공지사항)
    path('admin/', notices_views.NoticeAdminListView.as_view(), name='notice-admin-list'),
    
    # 관리자용 공지사항 목록 조회 (단순 GET 방식, OPTIONS 방지)
    path('admin-simple/', notices_views.get_admin_notices_simple, name='notice-admin-simple'),
    
    # 공지사항 상세 조회
    path('<int:pk>/', notices_views.NoticeDetailView.as_view(), name='notice-detail'),
    
    # 공지사항 생성 (관리자만)
    path('create/', notices_views.NoticeCreateView.as_view(), name='notice-create'),
    
    # 공지사항 수정 (관리자만)
    path('<int:pk>/update/', notices_views.NoticeUpdateView.as_view(), name='notice-update'),
    
    # 공지사항 삭제 (관리자만)
    path('<int:pk>/delete/', notices_views.NoticeDeleteView.as_view(), name='notice-delete'),
    
    # 공지사항 읽음 표시
    path('<int:notice_id>/mark-read/', notices_views.mark_notice_as_read, name='mark-notice-read'),
    
    # 읽지 않은 공지사항 개수 조회
    path('unread-count/', notices_views.get_unread_notices_count, name='unread-notices-count'),
    
    # 내가 읽은 공지사항 목록
    path('my-read/', notices_views.get_my_read_notices, name='my-read-notices'),
] 