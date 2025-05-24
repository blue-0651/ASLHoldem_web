from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from rest_framework.decorators import action
from django.db.models import Count, Sum
import datetime
from rest_framework.permissions import IsAdminUser

from tournaments.models import Tournament, TournamentRegistration
from stores.models import Store
from tournaments.serializers import (
    TournamentSerializer, TournamentRegistrationSerializer,
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
    
    @action(detail=False, methods=['post'])
    def my_tournaments(self, request):
        """
        현재 로그인한 사용자가 참가한 토너먼트 목록을 반환합니다.
        """
        user = request.user
        registrations = TournamentRegistration.objects.filter(user=user).select_related(
            'tournament', 'tournament__store'
        )
        serializer = TournamentRegistrationSerializer(registrations, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['post'])
    def participants_count(self, request):
        """
        특정 토너먼트에 참가한 사용자 수를 반환합니다.
        """
        serializer = TournamentParticipantsCountSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        tournament_name = serializer.validated_data['tournament_name']
        
        try:
            # 특정 이름의 토너먼트 찾기
            tournament = Tournament.objects.get(name=tournament_name)
            
            # 해당 토너먼트에 등록된 사용자 수 계산
            participant_count = TournamentRegistration.objects.filter(tournament=tournament).count()
            
            # 토너먼트 정보 및 참가자 수 반환
            result = {
                'tournament_id': tournament.id,
                'tournament_name': tournament.name,
                'start_time': tournament.start_time,
                'status': tournament.status,
                'max_seats': tournament.max_seats,  # 내부 필드 이름 사용
                'participant_count': participant_count,
                'remaining_tickets': tournament.max_seats - participant_count if tournament.max_seats else None
            }
            
            response_serializer = TournamentParticipantsResponseSerializer(result)
            return Response(response_serializer.data)
        except Tournament.DoesNotExist:
            return Response({"error": "해당 이름의 토너먼트를 찾을 수 없습니다."}, 
                           status=status.HTTP_404_NOT_FOUND)
        except Tournament.MultipleObjectsReturned:
            # 동일한 이름의 토너먼트가 여러 개 있을 경우
            tournaments = Tournament.objects.filter(name=tournament_name)
            results = []
            
            for tournament in tournaments:
                participant_count = TournamentRegistration.objects.filter(tournament=tournament).count()
                results.append({
                    'tournament_id': tournament.id,
                    'tournament_name': tournament.name,
                    'start_time': tournament.start_time,
                    'status': tournament.status,
                    'max_seats': tournament.max_seats,  # 내부 필드 이름 사용
                    'participant_count': participant_count,
                    'remaining_tickets': tournament.max_seats - participant_count if tournament.max_seats else None
                })
            
            return Response({"message": "동일한 이름의 토너먼트가 여러 개 있습니다.", "tournaments": results})

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
        - store_id: 매장 ID
        - start_date: 시작 날짜 (YYYY-MM-DD)
        - end_date: 종료 날짜 (YYYY-MM-DD)
        - sort: 정렬 기준 (start_time, participant_count, -start_time, -participant_count)
        """
        try:
            # 기본 쿼리셋
            tournaments = Tournament.objects.all().select_related('store')
            
            # 필터링 파라미터 처리
            status_param = request.query_params.get('status')
            if status_param:
                tournaments = tournaments.filter(status=status_param)
            
            store_id = request.query_params.get('store_id')
            if store_id:
                tournaments = tournaments.filter(store_id=store_id)
            
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
                # 참가자 수 계산
                participant_count = TournamentRegistration.objects.filter(tournament=tournament).count()
                
                # 등록 정보 조회
                registrations = TournamentRegistration.objects.filter(tournament=tournament).select_related('user')
                registration_info = [{
                    'user': reg.user.phone,
                    'nickname': reg.user.nickname,
                    'has_ticket': True,
                    'paid_amount': reg.paid_amount,
                    'checked_in': reg.checked_in,
                    'checked_in_at': reg.checked_in_at
                } for reg in registrations]
                
                # 토너먼트 정보 구성
                tournament_info = {
                    'id': tournament.id,
                    'store_name': tournament.store.name,
                    'name': tournament.name,
                    'start_time': tournament.start_time,
                    'buy_in': tournament.buy_in,
                    'ticket_quantity': tournament.ticket_quantity,
                    'description': tournament.description,
                    'status': tournament.status,
                    'created_at': tournament.created_at,
                    'updated_at': tournament.updated_at,
                    'participant_count': participant_count,
                    'remaining_tickets': tournament.ticket_quantity - participant_count if tournament.ticket_quantity else None,
                    'registrations': registration_info
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
        - 등록 선수 수
        - 좌석권 보유 수
        """
        try:
            # 총 토너먼트 수 계산
            tournament_count = Tournament.objects.count()
            
            # 활성 매장 수 계산 (토너먼트 개최 매장 수)
            active_store_count = Store.objects.filter(tournaments__isnull=False).distinct().count()
            
            # 등록 선수 수 계산 (중복 제거)
            player_count = TournamentRegistration.objects.values('user').distinct().count()
            
            # 좌석권 보유 수 - has_ticket 필드 사용 제거
            ticket_count = TournamentRegistration.objects.count()  # 모든 등록을 좌석권으로 간주
            
            result = {
                'tournament_count': tournament_count,
                'active_store_count': active_store_count,
                'player_count': player_count,
                'ticket_count': ticket_count
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
        대시보드에 표시할 선수별 좌석권 정보를 반환합니다.
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
            
            # 매장별 좌석권 현황 계산
            store_ticket_status = []
            stores = Store.objects.all()
            
            for store in stores:
                # has_ticket 필드 사용 제거
                registrations = TournamentRegistration.objects.filter(
                    tournament=tournament
                ).count()
                
                store_ticket_status.append({
                    '매장명': store.name,
                    '좌석권_수량': registrations,
                })
            
            # 선수별 좌석권 현황 계산
            player_ticket_status = []
            registrations = TournamentRegistration.objects.filter(
                tournament=tournament
            ).select_related('user')
            
            for reg in registrations:
                player_ticket_status.append({
                    'user': reg.user.phone,
                    'nickname': reg.user.nickname,
                    '매장명': "미지정",
                    '좌석권_보유': "있음",
                })
            
            # 배포된 좌석권 수량 계산 - has_ticket 필드 사용 제거
            distributed_tickets = TournamentRegistration.objects.filter(
                tournament=tournament
            ).count()  # 모든 등록을 배포된 좌석권으로 간주
            
            result = {
                '토너먼트명': tournament.name,
                '토너먼트_시작시간': tournament.start_time,
                '총_좌석권_수량': tournament.ticket_quantity,
                '배포된_좌석권_수량': distributed_tickets,
                '매장별_현황': store_ticket_status,
                '선수별_현황': player_ticket_status
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
        현재 로그인한 매장 관리자의 매장에 속한 토너먼트 목록을 반환합니다.
        """
        try:
            # 디버깅을 위한 요청 정보 출력
            print(f"요청 헤더: {request.headers}")
            print(f"인증 헤더: {request.META.get('HTTP_AUTHORIZATION', 'None')}")
            print(f"인증된 사용자: {request.user}")
            
            # 토큰에서 사용자 정보 확인
            user = request.user
            
            # 매장 관리자 권한 확인 - 임시로 AllowAny 권한 부여
            if not user.is_authenticated:
                print("사용자 인증 실패")
                return Response({"error": "인증이 필요합니다."}, 
                               status=status.HTTP_401_UNAUTHORIZED)
            
            # 매장 관리자 권한 확인 - 개발 중에는 임시로 주석 처리
            # if not hasattr(user, 'is_store_owner') or not user.is_store_owner:
            #     return Response({"error": "매장 관리자 권한이 없습니다."}, 
            #                    status=status.HTTP_403_FORBIDDEN)
            
            # 개발 중 테스트용 - 관리자 권한 체크 없이 첫 번째 매장 반환
            from stores.models import Store
            store = Store.objects.first()
            
            if not store:
                return Response({"error": "매장 정보가 없습니다."}, 
                               status=status.HTTP_404_NOT_FOUND)
                
            print(f"사용 매장: {store.name}")
            
            # 매장에 속한 토너먼트 목록 조회
            tournaments = Tournament.objects.filter(store=store).order_by('-start_time')
            
            # 토너먼트 목록 시리얼라이즈
            serializer = self.get_serializer(tournaments, many=True)
            print(f"토너먼트 수: {len(tournaments)}")
            
            return Response(serializer.data)
        except Exception as e:
            import traceback
            print(f"오류 발생: {str(e)}")
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
            
            # 매장 관리자 권한 확인
            if not hasattr(user, 'is_store_owner') or not user.is_store_owner:
                return Response({"error": "매장 관리자 권한이 없습니다."}, 
                               status=status.HTTP_403_FORBIDDEN)
            
            # 토너먼트 조회
            tournament = self.get_object()
            
            # 매장 관리자가 해당 토너먼트의 매장을 관리하는지 확인
            if tournament.store.manager != user:
                return Response({"error": "이 토너먼트를 관리할 권한이 없습니다."}, 
                               status=status.HTTP_403_FORBIDDEN)
            
            # 토너먼트 상태 변경
            tournament.status = 'CANCELLED'
            tournament.save()
            
            # 참가자들에게 토너먼트 취소 알림 로직 추가 가능
            
            return Response({"message": f"토너먼트 '{tournament.name}'이(가) 취소되었습니다."})
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=False, methods=['get'], permission_classes=[IsAdminUser], url_path='registrations')
    def registrations(self, request):
        """
        모든 토너먼트 등록 정보를 관리자만 조회할 수 있습니다.
        """
        registrations = TournamentRegistration.objects.select_related('user', 'tournament', 'tournament__store').all()
        serializer = TournamentRegistrationSerializer(registrations, many=True)
        return Response(serializer.data)

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