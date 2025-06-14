from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework import permissions
from drf_yasg.views import get_schema_view
from drf_yasg import openapi
from views.store_views import StoreViewSet, search_user_by_phone, register_player_to_tournament, grant_seat_ticket, get_user_ticket_status
from views.tournament_views import TournamentViewSet
from views.user_views import UserViewSet

schema_view = get_schema_view(
    openapi.Info(
        title="ASL Holdem API",
        default_version='v1',
        description="ASL Holdem 토너먼트 관리 시스템 API",
        terms_of_service="https://www.aslholdem.com/terms/",
        contact=openapi.Contact(email="contact@aslholdem.com"),
        license=openapi.License(name="BSD License"),
    ),
    public=True,
    permission_classes=(permissions.AllowAny,),
)

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/v1/accounts/', include('accounts.urls')),
    path('api/v1/tournaments/', include('tournaments.urls')),
    path('api/v1/stores/', include('stores.urls')),
    path('api/v1/notices/', include('notices.urls')),  # 공지사항 API 경로 추가
    path('api/v1/seats/', include('seats.urls')),  # 좌석권 API 경로 추가
    path('api/v1/banners/', include('banners.urls')),  # 배너 API 경로 추가

    # QR 코드 관련 API
    path('api/v1/user/my-qr-code/', UserViewSet.as_view({'get': 'get_my_qr_code'}), name='user_my_qr_code'),  # 내 QR 코드 조회
    path('api/v1/user/scan-qr-code/', UserViewSet.as_view({'post': 'scan_qr_code'}), name='user_scan_qr_code'),  # QR 코드 스캔

    path('api/v1/store/info/', StoreViewSet.as_view({'get': 'current_store', 'put': 'update_current_store'})),
    path('api/v1/store/debug/', StoreViewSet.as_view({'get': 'debug_user'})),
    path('api/v1/store/generate-qr/', StoreViewSet.as_view({'post': 'generate_qr_code'})),
    path('api/v1/store/search-user/', search_user_by_phone, name='search_user_by_phone'),  # 휴대폰 번호로 사용자 검색
    path('api/v1/store/register-player/', register_player_to_tournament, name='register_player_to_tournament'),  # 선수 등록
    path('api/v1/store/grant-ticket/', grant_seat_ticket, name='grant_seat_ticket'),  # 좌석권 지급
    path('api/v1/store/user-tickets/', get_user_ticket_status, name='get_user_ticket_status'),  # 사용자 좌석권 현황
    path('api/v1/store/tournaments/', TournamentViewSet.as_view({'get': 'store_tournaments'})),
    path('api/v1/store/tournaments/<int:pk>/cancel/', TournamentViewSet.as_view({'post': 'cancel_tournament'})),
    path('swagger/', schema_view.with_ui('swagger', cache_timeout=0), name='schema-swagger-ui'),
    path('redoc/', schema_view.with_ui('redoc', cache_timeout=0), name='schema-redoc'),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT) 