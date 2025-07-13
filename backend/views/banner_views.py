from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.exceptions import PermissionDenied, NotFound
from django.db.models import Q
from django.utils import timezone
from django.shortcuts import get_object_or_404
from datetime import datetime
import logging

from stores.models import Banner, Store
from stores.serializers import BannerSerializer
from django.contrib.auth import get_user_model

User = get_user_model()
logger = logging.getLogger(__name__)


class BannerViewSet(viewsets.ModelViewSet):
    """
    배너 관리를 위한 API ViewSet
    """
    queryset = Banner.objects.all()
    serializer_class = BannerSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        """
        배너 객체 조회 시 안전한 에러 처리
        """
        try:
            queryset = self.filter_queryset(self.get_queryset())
            lookup_url_kwarg = self.lookup_url_kwarg or self.lookup_field
            lookup_value = self.kwargs[lookup_url_kwarg]
            
            # 먼저 배너가 존재하는지 확인
            obj = get_object_or_404(queryset, **{self.lookup_field: lookup_value})
            
            # 권한 확인
            self.check_object_permissions(self.request, obj)
            return obj
        except Exception as e:
            logger.error(f"배너 조회 실패 (ID: {self.kwargs.get('pk', 'N/A')}): {str(e)}")
            raise NotFound(f"배너를 찾을 수 없습니다 (ID: {self.kwargs.get('pk', 'N/A')})")

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
        
        # 관리자가 아닌 경우 권한 제한
        user = self.request.user
        if not user.is_staff and not user.is_superuser:
            # 매장 관리자인 경우 자신의 매장 배너만 조회
            if hasattr(user, 'is_store_owner') and user.is_store_owner:
                store = Store.objects.filter(owner=user).first()
                if store:
                    queryset = queryset.filter(store=store)
                else:
                    # 매장이 없는 경우 빈 쿼리셋 반환
                    queryset = queryset.none()
            else:
                # 일반 사용자는 배너 관리 권한 없음
                queryset = queryset.none()
        
        return queryset

    def create(self, request, *args, **kwargs):
        """
        배너 생성 - 파일 업로드 권한 에러 처리 개선
        """
        try:
            # 기본 유효성 검사
            serializer = self.get_serializer(data=request.data)
            if not serializer.is_valid():
                logger.warning(f"배너 생성 유효성 검사 실패: {serializer.errors}")
                return Response(
                    {
                        "error": "입력 데이터가 유효하지 않습니다.",
                        "details": serializer.errors
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # 배너 생성 시도
            try:
                self.perform_create(serializer)
                headers = self.get_success_headers(serializer.data)
                logger.info(f"배너 생성 성공: {serializer.data.get('title', 'N/A')}")
                return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)
            
            except PermissionDenied as e:
                logger.warning(f"배너 생성 권한 에러: {str(e)}")
                return Response(
                    {
                        "error": str(e),
                        "error_type": "permission_denied"
                    },
                    status=status.HTTP_403_FORBIDDEN
                )
            
            except OSError as e:
                if "Permission denied" in str(e) or "권한" in str(e):
                    logger.error(f"파일 시스템 권한 에러: {str(e)}")
                    return Response(
                        {
                            "error": "파일 업로드 권한이 없습니다. 서버 관리자에게 문의하세요.",
                            "error_type": "file_permission_error",
                            "details": str(e)
                        },
                        status=status.HTTP_500_INTERNAL_SERVER_ERROR
                    )
                else:
                    logger.error(f"파일 시스템 에러: {str(e)}")
                    return Response(
                        {
                            "error": "파일 업로드 중 오류가 발생했습니다.",
                            "error_type": "file_system_error",
                            "details": str(e)
                        },
                        status=status.HTTP_500_INTERNAL_SERVER_ERROR
                    )
            
            except Exception as e:
                logger.error(f"배너 생성 중 예기치 않은 에러: {str(e)}")
                return Response(
                    {
                        "error": "배너 생성 중 오류가 발생했습니다.",
                        "error_type": "unexpected_error",
                        "details": str(e)
                    },
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
        
        except Exception as e:
            logger.error(f"배너 생성 API 전체 에러: {str(e)}")
            return Response(
                {
                    "error": "서버 오류가 발생했습니다.",
                    "error_type": "server_error"
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def perform_create(self, serializer):
        """
        배너 생성 시 매장 관리자 권한 확인 및 파일 업로드 에러 처리
        """
        try:
            user = self.request.user
            
            # 관리자는 모든 매장에 배너 생성 가능
            if user.is_staff or user.is_superuser:
                try:
                    serializer.save()
                    logger.info(f"관리자 '{user.username}'이 배너 생성: {serializer.validated_data.get('title', 'N/A')}")
                    return
                except OSError as e:
                    if "Permission denied" in str(e):
                        logger.error(f"파일 업로드 권한 에러: {str(e)}")
                        raise PermissionDenied(
                            "파일 업로드 권한이 없습니다. 서버 관리자에게 문의하세요. "
                            "media/banner_images/ 폴더의 권한을 확인해주세요."
                        )
                    else:
                        logger.error(f"파일 업로드 중 OS 에러: {str(e)}")
                        raise Exception(f"파일 업로드 중 오류가 발생했습니다: {str(e)}")
                except Exception as e:
                    logger.error(f"관리자 배너 생성 중 예기치 않은 에러: {str(e)}")
                    raise Exception(f"배너 생성 중 오류가 발생했습니다: {str(e)}")
            
            # 매장 관리자인 경우 자신의 매장으로 자동 설정
            if hasattr(user, 'is_store_owner') and user.is_store_owner:
                store = Store.objects.filter(owner=user).first()
                if store:
                    try:
                        serializer.save(store=store)
                        logger.info(f"매장 관리자 '{user.username}'이 매장 '{store.name}'에 배너 생성: {serializer.validated_data.get('title', 'N/A')}")
                        return
                    except OSError as e:
                        if "Permission denied" in str(e):
                            logger.error(f"매장 관리자 파일 업로드 권한 에러: {str(e)}")
                            raise PermissionDenied(
                                "파일 업로드 권한이 없습니다. 서버 관리자에게 문의하세요. "
                                "media/banner_images/ 폴더의 권한을 확인해주세요."
                            )
                        else:
                            logger.error(f"매장 관리자 파일 업로드 중 OS 에러: {str(e)}")
                            raise Exception(f"파일 업로드 중 오류가 발생했습니다: {str(e)}")
                    except Exception as e:
                        logger.error(f"매장 관리자 배너 생성 중 예기치 않은 에러: {str(e)}")
                        raise Exception(f"배너 생성 중 오류가 발생했습니다: {str(e)}")
                else:
                    logger.warning(f"매장 관리자 '{user.username}'에게 연결된 매장이 없음")
                    raise PermissionDenied("연결된 매장 정보가 없습니다.")
            else:
                logger.warning(f"일반 사용자 '{user.username}'이 배너 생성 시도")
                raise PermissionDenied("배너 생성 권한이 없습니다.")
        except PermissionDenied:
            # PermissionDenied는 그대로 re-raise
            raise
        except Exception as e:
            logger.error(f"배너 생성 실패 - 사용자: {user.username}, 에러: {str(e)}")
            # 일반적인 에러 메시지로 변환하여 500 에러 방지
            if "Permission denied" in str(e) or "권한" in str(e):
                raise PermissionDenied(str(e))
            else:
                raise Exception(f"배너 생성 중 오류가 발생했습니다: {str(e)}")

    def update(self, request, *args, **kwargs):
        """
        배너 수정 - 기존 이미지 유지 처리
        """
        try:
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
        except Exception as e:
            logger.error(f"배너 수정 실패 (ID: {kwargs.get('pk', 'N/A')}): {str(e)}")
            return Response(
                {"error": f"배너 수정 중 오류가 발생했습니다: {str(e)}"}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def perform_update(self, serializer):
        """
        배너 수정 시 권한 확인
        """
        try:
            user = self.request.user
            banner = self.get_object()
            
            # 관리자는 모든 배너 수정 가능
            if user.is_staff or user.is_superuser:
                serializer.save()
                return
            
            # 매장 관리자인 경우 자신의 매장 배너만 수정 가능
            if hasattr(user, 'is_store_owner') and user.is_store_owner:
                store = Store.objects.filter(owner=user).first()
                if store and banner.store != store:
                    raise PermissionDenied("다른 매장의 배너는 수정할 수 없습니다.")
            else:
                raise PermissionDenied("배너 수정 권한이 없습니다.")
            
            serializer.save()
        except Exception as e:
            logger.error(f"배너 수정 권한 확인 실패: {str(e)}")
            raise

    def perform_destroy(self, instance):
        """
        배너 삭제 시 권한 확인
        """
        try:
            user = self.request.user
            
            # 관리자는 모든 배너 삭제 가능
            if user.is_staff or user.is_superuser:
                instance.delete()
                return
            
            # 매장 관리자인 경우 자신의 매장 배너만 삭제 가능
            if hasattr(user, 'is_store_owner') and user.is_store_owner:
                store = Store.objects.filter(owner=user).first()
                if store and instance.store != store:
                    raise PermissionDenied("다른 매장의 배너는 삭제할 수 없습니다.")
            else:
                raise PermissionDenied("배너 삭제 권한이 없습니다.")
            
            instance.delete()
        except Exception as e:
            logger.error(f"배너 삭제 실패: {str(e)}")
            raise

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
            logger.error(f"활성 배너 조회 실패: {str(e)}")
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
            if not user.is_staff and not user.is_superuser:
                if hasattr(user, 'is_store_owner') and user.is_store_owner:
                    user_store = Store.objects.filter(owner=user).first()
                    if user_store and user_store.id != int(store_id):
                        raise PermissionDenied("다른 매장의 배너는 조회할 수 없습니다.")
                else:
                    raise PermissionDenied("배너 조회 권한이 없습니다.")
            
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
        except PermissionDenied:
            raise
        except Exception as e:
            logger.error(f"매장별 배너 조회 실패: {str(e)}")
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
            
            # 관리자는 모든 배너 조회 가능
            if user.is_staff or user.is_superuser:
                banners = Banner.objects.all().order_by('-created_at')
                serializer = self.get_serializer(banners, many=True)
                
                return Response({
                    'banners': serializer.data,
                    'total_count': banners.count(),
                    'active_count': banners.filter(is_active=True).count()
                })
            
            # 매장 관리자 권한 확인
            if not hasattr(user, 'is_store_owner') or not user.is_store_owner:
                raise PermissionDenied("매장 관리자 권한이 필요합니다.")
            
            # 사용자의 매장 조회
            store = Store.objects.filter(owner=user).first()
            if not store:
                raise PermissionDenied("연결된 매장 정보가 없습니다.")
            
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
        except PermissionDenied:
            raise
        except Exception as e:
            logger.error(f"내 배너 조회 실패: {str(e)}")
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
            
            # 관리자는 모든 배너 상태 변경 가능
            if not user.is_staff and not user.is_superuser:
                # 권한 확인
                if hasattr(user, 'is_store_owner') and user.is_store_owner:
                    store = Store.objects.filter(owner=user).first()
                    if store and banner.store != store:
                        raise PermissionDenied("다른 매장의 배너는 수정할 수 없습니다.")
                else:
                    raise PermissionDenied("배너 상태 변경 권한이 없습니다.")
            
            # 상태 토글
            banner.is_active = not banner.is_active
            banner.save()
            
            serializer = self.get_serializer(banner)
            return Response({
                'message': f"배너가 {'활성화' if banner.is_active else '비활성화'}되었습니다.",
                'banner': serializer.data
            })
        except PermissionDenied:
            raise
        except Exception as e:
            logger.error(f"배너 상태 토글 실패 (ID: {pk}): {str(e)}")
            return Response(
                {"error": f"배너 상태 변경 중 오류가 발생했습니다: {str(e)}"}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAdminUser])
    def set_as_main_tournament(self, request, pk=None):
        """
        특정 배너를 메인 토너먼트 배너로 설정 (메인에 표시되는 배너로 선택)
        관리자만 접근 가능
        """
        try:
            banner = self.get_object()
            
            # 해당 배너가 메인 토너먼트 배너가 아니라면 먼저 메인 토너먼트 배너로 설정
            if not banner.is_main_tournament:
                banner.is_main_tournament = True
                banner.save()
            
            # 기존 메인 선택 배너들을 모두 False로 변경
            Banner.objects.filter(is_main_selected=True).update(is_main_selected=False)
            
            # 선택된 배너를 메인 선택 배너로 설정
            banner.is_main_selected = True
            banner.save()
            
            serializer = self.get_serializer(banner)
            return Response({
                'message': f"'{banner.title}' 배너가 메인 토너먼트 배너로 설정되었습니다.",
                'banner': serializer.data
            })
        except Exception as e:
            logger.error(f"메인 토너먼트 배너 설정 실패 (ID: {pk}): {str(e)}")
            return Response(
                {"error": f"메인 토너먼트 배너 설정 중 오류가 발생했습니다: {str(e)}"}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=False, methods=['get'], permission_classes=[permissions.AllowAny])
    def main_tournament(self, request):
        """
        현재 메인으로 선택된 활성화된 배너 반환
        모든 사용자 접근 가능
        """
        try:
            now = timezone.now()
            main_tournament_banner = Banner.objects.filter(
                is_main_selected=True,
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
            logger.error(f"메인 토너먼트 배너 조회 실패: {str(e)}")
            return Response(
                {"error": f"메인 토너먼트 배너 조회 중 오류가 발생했습니다: {str(e)}"}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=False, methods=['get'], url_path='store_gallery', permission_classes=[AllowAny])
    def store_gallery_banners(self, request):
        """
        스토어 갤러리 배너 조회
        광고 페이지 인기 스토어 갤러리에 표시될 배너를 조회합니다.
        
        ⭐ 2025.01 새로 추가: 스토어 갤러리 배너 API
        - 광고 페이지(AslAd.jsx) 인기 스토어 갤러리 섹션용
        - 스토어 이미지 클릭 시 매장 상세화면으로 이동 지원
        - 매장 ID가 있는 배너는 상세화면, 없는 배너는 매장 검색 페이지로 이동
        
        ⚡ 특징:
        - 인증 불필요 (AllowAny 권한)
        - is_store_gallery=True로 설정된 배너만 반환
        - 현재 활성화된 배너만 조회 (is_active=True, 기간 내)
        - 생성일 기준 내림차순 정렬
        - 최대 8개까지 표시 (슬라이딩 갤러리 UI)
        """
        try:
            # 현재 날짜 기준 활성화된 스토어 갤러리 배너 조회
            today = timezone.now().date()
            banners = Banner.objects.filter(
                is_active=True,
                is_store_gallery=True,  # 스토어 갤러리 배너만
                start_date__lte=today,  # 시작일이 오늘 이전
                end_date__gte=today     # 종료일이 오늘 이후
            ).select_related('store').order_by('-created_at')[:8]  # 최대 8개
            
            # 배너 데이터 직렬화 (상세 정보 포함)
            banner_data = []
            for banner in banners:
                banner_info = {
                    'id': banner.id,
                    'title': banner.title,
                    'description': banner.description,
                    'image': banner.image.url if banner.image else None,
                    'store_id': banner.store.id if banner.store else None,
                    'store_name': banner.store.name if banner.store else None,
                    'is_active': banner.is_active,
                    'is_store_gallery': banner.is_store_gallery,
                    'start_date': banner.start_date.isoformat() if banner.start_date else None,
                    'end_date': banner.end_date.isoformat() if banner.end_date else None,
                    'created_at': banner.created_at.isoformat() if banner.created_at else None,
                }
                
                # 매장 정보 추가 (클릭 시 상세 페이지 이동용)
                if banner.store:
                    banner_info['store'] = {
                        'id': banner.store.id,
                        'name': banner.store.name,
                        'address': banner.store.address if hasattr(banner.store, 'address') else None
                    }
                
                banner_data.append(banner_info)
            
            return Response({
                'banners': banner_data,
                'count': len(banner_data),
                'message': f'스토어 갤러리 배너 {len(banner_data)}개를 조회했습니다.' if banner_data else '설정된 스토어 갤러리 배너가 없습니다.'
            })
            
        except Exception as e:
            logger.error(f"스토어 갤러리 배너 조회 실패: {str(e)}")
            return Response({
                'error': '스토어 갤러리 배너를 조회하는 중 오류가 발생했습니다.',
                'banners': []
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
