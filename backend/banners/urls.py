from django.urls import path, include
from rest_framework.routers import DefaultRouter
from views.banner_views import BannerViewSet

router = DefaultRouter()
router.register(r'', BannerViewSet, basename='banner')

urlpatterns = [
    path('', include(router.urls)),
]
