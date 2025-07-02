from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from django.db.models import Q
from django.utils import timezone
from datetime import datetime

from stores.models import Banner, Store
from stores.serializers import BannerSerializer
from django.contrib.auth import get_user_model

User = get_user_model()


class BannerViewSet(viewsets.ModelViewSet):
    """
    배너 관리를 위한 API ViewSet
    """
    queryset = Banner.objects.all()
    serializer_class = BannerSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """
        쿼리셋 필터링
        - 매장별 배너 조회
        - 활성 배너만 조회
        - 기간별 배너 조회
        """
        queryset = Banner.objects.select_related('store').order_by('-created_at')
        
        # 매장별 필터링
        store_id = self.request.query_params.get('store_id')
        if store_id:
            queryset = queryset.filter(store_id=store_id)
        
        # 활성 배너만 조회
        is_active = self.request.query_params.get('is_active')
        if is_active and is_active.lower() == 'true':
            queryset = queryset.filter(is_active=True)
        
        # 기간별 필터링
        start_date = self.request.query_params.get('start_date')
        end_date = self.request.query_params.get('end_date')
        
        if start_date:
            try:
                start_date = datetime.strptime(start_date, '%Y-%m-%d')
                queryset = queryset.filter(start_date__gte=start_date)
            except ValueError:
                pass
        
        if end_date:
            try:
                end_date = datetime.strptime(end_date, '%Y-%m-%d')
                queryset = queryset.filter(end_date__lte=end_date)
            except ValueError:
                pass
        
        # 매장 관리자인 경우 자신의 매장 배너만 조회
        user = self.request.user
        if hasattr(user, 'is_store_owner') and user.is_store_owner:
            store = Store.objects.filter(owner=user).first()
            if store:
                queryset = queryset.filter(store=store)
        
        return queryset

    def perform_create(self, serializer):
        """
        배너 생성 시 매장 관리자 권한 확인
        """
        user = self.request.user
        
        # 매장 관리자인 경우 자신의 매장으로 자동 설정
        if hasattr(user, 'is_store_owner') and user.is_store_owner:
            store = Store.objects.filter(owner=user).first()
            if store:
                serializer.save(store=store)
            else:
                raise PermissionError("연결된 매장 정보가 없습니다.")
        else:
            # 관리자인 경우 요청된 매장으로 설정
            serializer.save()

    def update(self, request, *args, **kwargs):
        """
        배너 수정 - 기존 이미지 유지 처리
        """
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        
        # 이미지 처리: 새 이미지가 없고 existing_image_url이 있으면 기존 이미지 유지
        if 'image' not in request.data and 'existing_image_url' in request.data:
            # 기존 이미지를 request.data에 추가 (mutable하게 만들기)
            request.data._mutable = True
            request.data['image'] = instance.image
            request.data._mutable = False
        
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)

        if getattr(instance, '_prefetched_objects_cache', None):
            instance._prefetched_objects_cache = {}

        return Response(serializer.data)

    def perform_update(self, serializer):
        """
        배너 수정 시 권한 확인
        """
        user = self.request.user
        banner = self.get_object()
        
        # 매장 관리자인 경우 자신의 매장 배너만 수정 가능
        if hasattr(user, 'is_store_owner') and user.is_store_owner:
            store = Store.objects.filter(owner=user).first()
            if store and banner.store != store:
                raise PermissionError("다른 매장의 배너는 수정할 수 없습니다.")
        
        serializer.save()

    def perform_destroy(self, instance):
        """
        배너 삭제 시 권한 확인
        """
        user = self.request.user
        
        # 매장 관리자인 경우 자신의 매장 배너만 삭제 가능
        if hasattr(user, 'is_store_owner') and user.is_store_owner:
            store = Store.objects.filter(owner=user).first()
            if store and instance.store != store:
                raise PermissionError("다른 매장의 배너는 삭제할 수 없습니다.")
        
        instance.delete()

    @action(detail=False, methods=['get'], permission_classes=[permissions.AllowAny])
    def active(self, request):
        """
        현재 활성화된 배너 목록 조회 (로그인 불필요)
        """
        try:
            now = timezone.now()
            active_banners = Banner.objects.filter(
                is_active=True,
                start_date__lte=now,
                end_date__gte=now
            ).select_related('store').order_by('-created_at')
            
            # 매장별 필터링 (선택사항)
            store_id = request.query_params.get('store_id')
            if store_id:
                active_banners = active_banners.filter(store_id=store_id)
            
            serializer = self.get_serializer(active_banners, many=True)
            return Response(serializer.data)
        except Exception as e:
            return Response(
                {"error": f"활성 배너 조회 중 오류가 발생했습니다: {str(e)}"}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=False, methods=['get'])
    def by_store(self, request):
        """
        매장별 배너 조회
        """
        try:
            store_id = request.query_params.get('store_id')
            if not store_id:
                return Response(
                    {"error": "store_id 파라미터가 필요합니다."}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            try:
                store = Store.objects.get(id=store_id)
            except Store.DoesNotExist:
                return Response(
                    {"error": "해당 매장을 찾을 수 없습니다."}, 
                    status=status.HTTP_404_NOT_FOUND
                )
            
            # 권한 확인 - 매장 관리자는 자신의 매장만 조회 가능
            user = request.user
            if hasattr(user, 'is_store_owner') and user.is_store_owner:
                user_store = Store.objects.filter(owner=user).first()
                if user_store and user_store.id != int(store_id):
                    return Response(
                        {"error": "다른 매장의 배너는 조회할 수 없습니다."}, 
                        status=status.HTTP_403_FORBIDDEN
                    )
            
            banners = Banner.objects.filter(store=store).order_by('-created_at')
            serializer = self.get_serializer(banners, many=True)
            
            return Response({
                'store_info': {
                    'id': store.id,
                    'name': store.name,
                    'address': store.address
                },
                'banners': serializer.data,
                'total_count': banners.count()
            })
        except Exception as e:
            return Response(
                {"error": f"매장별 배너 조회 중 오류가 발생했습니다: {str(e)}"}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=False, methods=['get'])
    def my_banners(self, request):
        """
        현재 로그인한 매장 관리자의 배너 목록 조회
        """
        try:
            user = request.user
            
            # 매장 관리자 권한 확인
            if not hasattr(user, 'is_store_owner') or not user.is_store_owner:
                return Response(
                    {"error": "매장 관리자 권한이 필요합니다."}, 
                    status=status.HTTP_403_FORBIDDEN
                )
            
            # 사용자의 매장 조회
            store = Store.objects.filter(owner=user).first()
            if not store:
                return Response(
                    {"error": "연결된 매장 정보가 없습니다."}, 
                    status=status.HTTP_404_NOT_FOUND
                )
            
            banners = Banner.objects.filter(store=store).order_by('-created_at')
            serializer = self.get_serializer(banners, many=True)
            
            return Response({
                'store_info': {
                    'id': store.id,
                    'name': store.name,
                    'address': store.address
                },
                'banners': serializer.data,
                'total_count': banners.count(),
                'active_count': banners.filter(is_active=True).count()
            })
        except Exception as e:
            return Response(
                {"error": f"내 배너 조회 중 오류가 발생했습니다: {str(e)}"}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=True, methods=['post'])
    def toggle_active(self, request, pk=None):
        """
        배너 활성화/비활성화 토글
        """
        try:
            banner = self.get_object()
            user = request.user
            
            # 권한 확인
            if hasattr(user, 'is_store_owner') and user.is_store_owner:
                store = Store.objects.filter(owner=user).first()
                if store and banner.store != store:
                    return Response(
                        {"error": "다른 매장의 배너는 수정할 수 없습니다."}, 
                        status=status.HTTP_403_FORBIDDEN
                    )
            
            # 상태 토글
            banner.is_active = not banner.is_active
            banner.save()
            
            serializer = self.get_serializer(banner)
            return Response({
                'message': f"배너가 {'활성화' if banner.is_active else '비활성화'}되었습니다.",
                'banner': serializer.data
            })
        except Exception as e:
            return Response(
                {"error": f"배너 상태 변경 중 오류가 발생했습니다: {str(e)}"}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAdminUser])
    def set_as_main_tournament(self, request, pk=None):
        """
        특정 배너를 메인 토너먼트 배너로 설정
        관리자만 접근 가능
        """
        try:
            banner = self.get_object()
            
            # 기존 메인 토너먼트 배너들을 모두 False로 변경
            Banner.objects.filter(is_main_tournament=True).update(is_main_tournament=False)
            
            # 선택된 배너를 메인 토너먼트 배너로 설정
            banner.is_main_tournament = True
            banner.save()
            
            serializer = self.get_serializer(banner)
            return Response({
                'message': f"'{banner.title}' 배너가 메인 토너먼트 배너로 설정되었습니다.",
                'banner': serializer.data
            })
        except Exception as e:
            return Response(
                {"error": f"메인 토너먼트 배너 설정 중 오류가 발생했습니다: {str(e)}"}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=False, methods=['get'], permission_classes=[permissions.AllowAny])
    def main_tournament(self, request):
        """
        현재 메인 토너먼트 배너로 설정된 활성화된 배너 반환
        모든 사용자 접근 가능
        """
        try:
            now = timezone.now()
            main_tournament_banner = Banner.objects.filter(
                is_main_tournament=True,
                is_active=True,
                start_date__lte=now,
                end_date__gte=now
            ).select_related('store').first()
            
            if not main_tournament_banner:
                return Response({
                    'message': '현재 설정된 메인 토너먼트 배너가 없습니다.',
                    'banner': None
                })
            
            serializer = self.get_serializer(main_tournament_banner)
            return Response({
                'message': '메인 토너먼트 배너를 성공적으로 조회했습니다.',
                'banner': serializer.data
            })
        except Exception as e:
            return Response(
                {"error": f"메인 토너먼트 배너 조회 중 오류가 발생했습니다: {str(e)}"}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=False, methods=['get'], permission_classes=[permissions.AllowAny], url_path='store-gallery')
    def store_gallery(self, request):
        """
        인기 스토어 갤러리용 배너 목록 조회
        모든 사용자 접근 가능 (로그인 불필요)
        """
        try:
            now = timezone.now()
            store_gallery_banners = Banner.objects.filter(
                is_store_gallery=True,
                is_active=True,
                start_date__lte=now,
                end_date__gte=now
            ).select_related('store').order_by('-created_at')
            
            # 최대 8개로 제한 (AslAd.jsx에서 사용)
            store_gallery_banners = store_gallery_banners[:8]
            
            serializer = self.get_serializer(store_gallery_banners, many=True)
            return Response({
                'message': '인기 스토어 갤러리 배너를 성공적으로 조회했습니다.',
                'banners': serializer.data,
                'total_count': store_gallery_banners.count()
            })
        except Exception as e:
            return Response(
                {"error": f"인기 스토어 갤러리 배너 조회 중 오류가 발생했습니다: {str(e)}"}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
