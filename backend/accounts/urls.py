from django.urls import path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from views.user_views import UserViewSet, StoreManagerTokenObtainPairView, UserTokenObtainPairView, AdminTokenObtainPairView

urlpatterns = [
    # 기존 토큰 URL (현재는 매장관리자용으로 사용)
    path('token/store/', StoreManagerTokenObtainPairView.as_view(), name='token_obtain_pair_store'),
    # 일반 사용자 토큰 URL
    path('token/user/', UserTokenObtainPairView.as_view(), name='token_obtain_pair_user'),
    # 관리자 토큰 URL
    path('token/admin/', AdminTokenObtainPairView.as_view(), name='token_obtain_pair_admin'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('users/', UserViewSet.as_view({'get': 'get_all_users', 'post': 'create_user'}), name='users_list'),
    path('users/get/', UserViewSet.as_view({'get': 'get_user', 'post': 'get_user'}), name='get_user_alt'),
    path('users/create_user/', UserViewSet.as_view({'post': 'create_user'}), name='create_user'),
    path('users/get_user/', UserViewSet.as_view({'post': 'get_user'}), name='get_user'),
    path('users/update_user/', UserViewSet.as_view({'post': 'update_user'}), name='update_user'),
    path('users/delete_user/', UserViewSet.as_view({'post': 'delete_user'}), name='delete_user'),
    path('users/get_all_users/', UserViewSet.as_view({'get': 'get_all_users'}), name='get_all_users'),
    path('users/get_user_stats/', UserViewSet.as_view({'get': 'get_user_stats'}), name='get_user_stats'),
    path('users/get_user_by_phone/', UserViewSet.as_view({'get': 'get_user_by_phone'}), name='get_user_by_phone'),
    path('users/check_phone/', UserViewSet.as_view({'get': 'check_phone'}), name='check_phone'),
    path('users/check_nickname/', UserViewSet.as_view({'get': 'check_nickname'}), name='check_nickname'),
    path('users/create_guest_user/', UserViewSet.as_view({'post': 'create_guest_user'}), name='create_guest_user'),
] 