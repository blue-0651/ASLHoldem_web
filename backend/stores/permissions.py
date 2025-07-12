from rest_framework import permissions
from stores.models import Store


class IsAdminOrStoreOwner(permissions.BasePermission):
    """
    관리자 또는 매장 소유자만 접근 가능한 권한
    """
    
    def has_permission(self, request, view):
        """
        뷰 접근 권한 확인
        """
        # 인증된 사용자만 접근 가능
        if not request.user.is_authenticated:
            return False
        
        # 관리자는 모든 매장에 접근 가능
        if request.user.is_staff or request.user.is_superuser:
            return True
        
        # 매장 관리자는 자신의 매장에만 접근 가능
        if request.user.is_store_owner:
            return True
        
        return False
    
    def has_object_permission(self, request, view, obj):
        """
        객체 수준 권한 확인
        """
        # 관리자는 모든 매장에 접근 가능
        if request.user.is_staff or request.user.is_superuser:
            return True
        
        # 매장 관리자는 자신의 매장에만 접근 가능
        if request.user.is_store_owner and obj.owner == request.user:
            return True
        
        return False


class IsStoreOwner(permissions.BasePermission):
    """
    매장 소유자만 접근 가능한 권한
    """
    
    def has_permission(self, request, view):
        """
        뷰 접근 권한 확인
        """
        # 인증된 사용자만 접근 가능
        if not request.user.is_authenticated:
            return False
        
        # 매장 관리자 권한 확인
        if request.user.is_store_owner:
            return True
        
        return False
    
    def has_object_permission(self, request, view, obj):
        """
        객체 수준 권한 확인
        """
        # 매장 관리자는 자신의 매장에만 접근 가능
        if request.user.is_store_owner and obj.owner == request.user:
            return True
        
        return False


class IsAdminOnly(permissions.BasePermission):
    """
    관리자만 접근 가능한 권한
    """
    
    def has_permission(self, request, view):
        """
        뷰 접근 권한 확인
        """
        # 인증된 사용자만 접근 가능
        if not request.user.is_authenticated:
            return False
        
        # 관리자만 접근 가능
        if request.user.is_staff or request.user.is_superuser:
            return True
        
        return False 