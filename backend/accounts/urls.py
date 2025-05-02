from django.urls import path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from views.user_views import UserViewSet

urlpatterns = [
    path('token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
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
] 