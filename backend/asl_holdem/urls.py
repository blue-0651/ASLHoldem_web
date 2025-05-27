from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework import permissions
from drf_yasg.views import get_schema_view
from drf_yasg import openapi
from views.store_views import StoreViewSet
from views.tournament_views import TournamentViewSet

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

    path('api/v1/store/info/', StoreViewSet.as_view({'get': 'current_store', 'put': 'update_current_store'})),
    path('api/v1/store/generate-qr/', StoreViewSet.as_view({'post': 'generate_qr_code'})),
    path('api/v1/store/tournaments/', TournamentViewSet.as_view({'get': 'store_tournaments'})),
    path('api/v1/store/tournaments/<int:pk>/cancel/', TournamentViewSet.as_view({'post': 'cancel_tournament'})),
    path('swagger/', schema_view.with_ui('swagger', cache_timeout=0), name='schema-swagger-ui'),
    path('redoc/', schema_view.with_ui('redoc', cache_timeout=0), name='schema-redoc'),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT) 