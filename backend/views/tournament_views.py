from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from rest_framework.decorators import action
from django.db.models import Count, Sum
from django.db import connection
import datetime
from rest_framework.permissions import IsAdminUser

from tournaments.models import Tournament
from stores.models import Store
from tournaments.serializers import (
    TournamentSerializer,
    TournamentParticipantsCountSerializer, TournamentParticipantsResponseSerializer
)

class TournamentViewSet(viewsets.ModelViewSet):
    """
    토너먼트 관리를 위한 API 뷰셋
    """
    queryset = Tournament.objects.all()
    serializer_class = TournamentSerializer
    permission_classes = [permissions.AllowAny]
    
    def get_queryset(self):
        queryset = Tournament.objects.all()
        status_param = self.request.query_params.get('status', None)
        if status_param is not None:
            queryset = queryset.filter(status=status_param)
        return queryset
    
    def create(self, request, *args, **kwargs):
        """
        토너먼트를 생성합니다.
        """
        try:
            # 요청 데이터 디버깅 출력
            print("=== 토너먼트 생성 요청 ===")
            print(f"Content-Type: {request.content_type}")
            print(f"요청 데이터: {request.data}")
            print(f"POST 데이터: {request.POST}")
            print(f"FILES 데이터: {request.FILES}")
            
            # 데이터 검증
            serializer = self.get_serializer(data=request.data)
            if not serializer.is_valid():
                print(f"유효성 검사 오류: {serializer.errors}")
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            
            # 토너먼트 생성
            self.perform_create(serializer)
            headers = self.get_success_headers(serializer.data)
            print(f"생성된 토너먼트: {serializer.data}")
            
            return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)
        except Exception as e:
            print(f"토너먼트 생성 중 예외 발생: {str(e)}")
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)

    def retrieve(self, request, *args, **kwargs):
        return super().retrieve(request, *args, **kwargs)
        
    def update(self, request, *args, **kwargs):
        return super().update(request, *args, **kwargs)
        
    def partial_update(self, request, *args, **kwargs):
        return super().partial_update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        return super().destroy(request, *args, **kwargs)
    




    @action(detail=False, methods=['get'], permission_classes=[permissions.AllowAny])
    def all_info(self, request):
        """
        모든 토너먼트의 상세 정보를 반환합니다.
        응답에는 다음 정보가 포함됩니다:
        - 토너먼트 기본 정보
        - 참가자 수
        - 등록 정보

        파라미터:
        - status: 토너먼트 상태 (UPCOMING, ONGOING, COMPLETED, CANCELLED)
        - start_date: 시작 날짜 (YYYY-MM-DD)
        - end_date: 종료 날짜 (YYYY-MM-DD)
        - sort: 정렬 기준 (start_time, -start_time)
        """
        try:
            # 기본 쿼리셋
            tournaments = Tournament.objects.all()
            
            # 필터링 파라미터 처리
            status_param = request.query_params.get('status')
            if status_param:
                tournaments = tournaments.filter(status=status_param)
            
            start_date = request.query_params.get('start_date')
            if start_date:
                tournaments = tournaments.filter(start_time__date__gte=start_date)
            
            end_date = request.query_params.get('end_date')
            if end_date:
                tournaments = tournaments.filter(start_time__date__lte=end_date)
            
            # 정렬 파라미터 처리
            sort = request.query_params.get('sort')
            if sort:
                tournaments = tournaments.order_by(sort)
            
            results = []
            
            for tournament in tournaments:
                # 토너먼트 정보 구성
                tournament_info = {
                    'id': tournament.id,
                    'name': tournament.name,
                    'start_time': tournament.start_time,
                    'buy_in': tournament.buy_in,
                    'ticket_quantity': tournament.ticket_quantity,
                    'description': tournament.description,
                    'status': tournament.status,
                    'created_at': tournament.created_at,
                    'updated_at': tournament.updated_at,
                }
                
                results.append(tournament_info)
            
            return Response(results)
        except Exception as e:
            import traceback
            from rest_framework import status as rf_status
            print(f"토너먼트 상세 정보 API 오류: {str(e)}")
            print(traceback.format_exc())
            return Response({"error": str(e)}, status=rf_status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=False, methods=['get'], permission_classes=[permissions.AllowAny], url_path='dashboard/stats')
    def dashboard_stats(self, request):
        """
        대시보드에 표시할 주요 통계 정보를 반환합니다.
        - 총 토너먼트 수
        - 활성 매장 수
        """
        try:
            # 총 토너먼트 수 계산
            tournament_count = Tournament.objects.count()
            
            # 활성 매장 수 계산
            active_store_count = Store.objects.count()
            
            result = {
                'tournament_count': tournament_count,
                'active_store_count': active_store_count,
            }
            
            return Response(result)
        except Exception as e:
            import traceback
            from rest_framework import status as rf_status
            print(f"대시보드 통계 API 오류: {str(e)}")
            print(traceback.format_exc())
            return Response({"error": str(e)}, status=rf_status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=False, methods=['get'], permission_classes=[permissions.AllowAny], url_path='dashboard/player_mapping')
    def dashboard_player_mapping(self, request):
        """
        대시보드에 표시할 토너먼트 정보를 반환합니다.
        """
        try:
            # 토너먼트 ID 파라미터 처리
            tournament_id = request.query_params.get('tournament_id')
            
            # 토너먼트 ID가 없으면 가장 최신 토너먼트 선택
            if not tournament_id:
                tournament = Tournament.objects.filter(status='UPCOMING').order_by('start_time').first()
                if not tournament:
                    tournament = Tournament.objects.order_by('-created_at').first()
            else:
                tournament = Tournament.objects.get(id=tournament_id)
            
            if not tournament:
                from rest_framework import status as rf_status
                return Response({"error": "토너먼트를 찾을 수 없습니다."}, status=rf_status.HTTP_404_NOT_FOUND)
            
            result = {
                '토너먼트명': tournament.name,
                '토너먼트_시작시간': tournament.start_time,
                '총_좌석권_수량': tournament.ticket_quantity,
            }
            
            return Response(result)
        except Exception as e:
            import traceback
            from rest_framework import status as rf_status
            print(f"대시보드 플레이어 매핑 API 오류: {str(e)}")
            print(traceback.format_exc())
            return Response({"error": str(e)}, status=rf_status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=False, methods=['get'])
    def store_tournaments(self, request):
        """
        현재 로그인한 매장 관리자의 매장 토너먼트 목록을 반환합니다.
        본사에서 좌석권이 배분된 모든 토너먼트를 반환합니다 (allocated_quantity가 0이어도 포함).
        """
        try:
            from seats.models import TournamentTicketDistribution
            
            print("=== store_tournaments API 호출됨 ===")
            print(f"요청 사용자: {request.user}")
            print(f"인증 여부: {request.user.is_authenticated}")
            
            # 현재 로그인한 사용자 확인
            user = request.user
            if not user.is_authenticated:
                print("인증되지 않은 사용자")
                return Response({"error": "로그인이 필요합니다."}, 
                              status=status.HTTP_401_UNAUTHORIZED)
            
            # 매장 관리자 권한 확인
            print(f"사용자 속성: {dir(user)}")
            print(f"hasattr(user, 'stores'): {hasattr(user, 'stores')}")
            print(f"user.is_store_owner: {getattr(user, 'is_store_owner', False)}")
            
            # 사용자의 매장 정보 가져오기
            if hasattr(user, 'stores'):
                store = user.stores.first()
                print(f"user.stores.first(): {store}")
            else:
                store = None
                print("user.stores 속성이 없음")
            
            if not store:
                print("매장 관리자 권한 없음 - 매장이 없음")
                return Response({"error": "매장 관리자 권한이 없습니다."}, 
                              status=status.HTTP_403_FORBIDDEN)
            
            print(f"매장 정보: {store}")
            
            # Django ORM을 사용하여 토너먼트 목록 조회
            tournaments = Tournament.objects.filter(
                ticket_distributions__store=store
            ).select_related().prefetch_related(
                'ticket_distributions'
            ).distinct().order_by('-start_time')
            
            print(f"조회된 토너먼트 수: {tournaments.count()}")
            
            # 응답 데이터 구성
            response_data = []
            for tournament in tournaments:
                print(f"처리 중인 토너먼트: {tournament.name}")
                
                # 해당 매장의 배분 정보 조회
                distribution = tournament.ticket_distributions.filter(store=store).first()
                print(f"배분 정보: {distribution}")
                
                tournament_data = {
                    'id': tournament.id,
                    'name': tournament.name,
                    'start_time': tournament.start_time,
                    'buy_in': tournament.buy_in,
                    'ticket_quantity': tournament.ticket_quantity,
                    'description': tournament.description,
                    'status': tournament.status,
                    'created_at': tournament.created_at,
                    'updated_at': tournament.updated_at,
                }
                
                # 배분 정보 추가
                if distribution:
                    tournament_data.update({
                        'allocated_quantity': distribution.allocated_quantity,
                        'remaining_quantity': distribution.remaining_quantity,
                        'distribution_created_at': distribution.created_at
                    })
                else:
                    tournament_data.update({
                        'allocated_quantity': 0,
                        'remaining_quantity': 0,
                        'distribution_created_at': None
                    })
                
                response_data.append(tournament_data)
            
            print(f"최종 응답 데이터 수: {len(response_data)}")
            return Response(response_data)
            
        except Exception as e:
            print(f"매장 토너먼트 목록 조회 오류: {str(e)}")
            import traceback
            print(traceback.format_exc())
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=True, methods=['post'])
    def cancel_tournament(self, request, pk=None):
        """
        특정 토너먼트를 취소합니다.
        """
        try:
            # 토큰에서 사용자 정보 확인
            user = request.user
            if not user.is_authenticated:
                return Response({"error": "로그인이 필요합니다."}, 
                               status=status.HTTP_401_UNAUTHORIZED)
            
            # 사용자의 매장 정보 가져오기
            if hasattr(user, 'stores'):
                store = user.stores.first()
            else:
                store = None
            
            if not store:
                return Response({"error": "매장 관리자 권한이 없습니다."}, 
                               status=status.HTTP_403_FORBIDDEN)
            
            # 토너먼트 조회
            tournament = self.get_object()
            
            # 해당 매장에 이 토너먼트의 좌석권이 배분되어 있는지 확인
            from seats.models import TournamentTicketDistribution
            distribution = TournamentTicketDistribution.objects.filter(
                tournament=tournament,
                store=store
            ).first()
            
            if not distribution:
                return Response({"error": "이 토너먼트를 관리할 권한이 없습니다."}, 
                               status=status.HTTP_403_FORBIDDEN)
            
            # 토너먼트 상태가 취소 가능한지 확인
            if tournament.status != 'UPCOMING':
                return Response({"error": "예정된 토너먼트만 취소할 수 있습니다."}, 
                               status=status.HTTP_400_BAD_REQUEST)
            
            # 토너먼트 상태 변경
            tournament.status = 'CANCELLED'
            tournament.save()
            
            print(f"토너먼트 '{tournament.name}' 취소됨 - 매장: {store.name}")
            
            return Response({"message": f"토너먼트 '{tournament.name}'이(가) 취소되었습니다."})
        except Exception as e:
            print(f"토너먼트 취소 오류: {str(e)}")
            import traceback
            print(traceback.format_exc())
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)



    @action(detail=False, methods=['post'], url_path='create')
    def create_tournament(self, request):
        """
        토너먼트 생성 (POST /api/v1/tournaments/create)
        """
        try:
            serializer = self.get_serializer(data=request.data)
            if not serializer.is_valid():
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            self.perform_create(serializer)
            headers = self.get_success_headers(serializer.data)
            return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR) 