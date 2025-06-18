from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from django.db.models import Count, Q, Max, Sum

from tournaments.models import Tournament
from stores.models import Store
from django.contrib.auth import get_user_model
from rest_framework import serializers
import datetime

User = get_user_model()

class StoreSerializer(serializers.ModelSerializer):
    """
    매장 정보를 위한 시리얼라이저
    """
    tournament_count = serializers.SerializerMethodField(read_only=True)
    
    class Meta:
        model = Store
        fields = [
            'id', 'name', 'address', 'description', 'status', 
            'phone_number', 'open_time', 'close_time', 
            'manager_name', 'manager_phone', 'max_capacity',
            'created_at', 'updated_at', 'tournament_count'
        ]
    
    def get_tournament_count(self, obj):
        # Tournament 모델에서 해당 매장과 관련된 토너먼트 수를 계산
        # 현재는 Tournament와 Store 간의 직접적인 관계가 없으므로 0을 반환
        # 추후 Tournament 모델에 store 필드가 추가되면 수정 필요
        try:
            from tournaments.models import Tournament
            # 임시로 0을 반환 (추후 관계 설정 후 수정)
            return 0
        except:
            return 0

class StoreUserSerializer(serializers.ModelSerializer):
    """
    매장 사용자 목록을 위한 시리얼라이저
    """
    tournament_count = serializers.IntegerField(read_only=True)
    last_visit = serializers.DateTimeField(read_only=True)
    
    class Meta:
        model = User
        fields = ['id', 'phone', 'nickname', 'email', 'tournament_count', 'last_visit']

class StoreViewSet(viewsets.ViewSet):
    """
    매장 관련 API 뷰셋
    """
    permission_classes = [permissions.AllowAny]
    
    def list(self, request):
        """
        모든 매장 목록을 반환합니다.
        """
        try:
            # 한글 정렬 문제 해결을 위해 ID 순으로 정렬
            stores = Store.objects.all().order_by('id')
            serializer = StoreSerializer(stores, many=True)
            return Response(serializer.data)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def retrieve(self, request, pk=None):
        """
        특정 매장의 상세 정보를 반환합니다.
        """
        try:
            store = Store.objects.get(pk=pk)
            serializer = StoreSerializer(store)
            return Response(serializer.data)
        except Store.DoesNotExist:
            return Response({"error": "해당 매장을 찾을 수 없습니다."}, 
                          status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    

    

        

    
    @action(detail=False, methods=['get'])
    def current_store(self, request):
        """
        현재 로그인한 매장 관리자의 매장 정보를 반환합니다.
        """
        try:
            # 토큰에서 사용자 정보 확인
            user = request.user
            
            print(f"=== current_store API 호출 ===")
            print(f"사용자: {user}")
            print(f"인증 여부: {user.is_authenticated}")
            
            if not user.is_authenticated:
                return Response({"error": "로그인이 필요합니다."}, 
                               status=status.HTTP_401_UNAUTHORIZED)
            
            # 사용자의 매장 정보 가져오기 - owner 필드로 연결된 매장 조회
            store = Store.objects.filter(owner=user).first()
            print(f"사용자가 소유한 매장: {store}")
            
            if not store:
                print("연결된 매장 정보가 없음")
                return Response({"error": "연결된 매장 정보가 없습니다."}, 
                               status=status.HTTP_404_NOT_FOUND)
            
            # 시리얼라이저를 사용하여 매장 정보 응답 생성
            serializer = StoreSerializer(store)
            store_data = serializer.data
            
            # 매장에 기본값이 없는 경우 사용자 정보로 보완
            if not store_data.get('manager_name'):
                store_data['manager_name'] = user.nickname or user.phone
            if not store_data.get('manager_phone'):
                store_data['manager_phone'] = user.phone
            if not store_data.get('phone_number'):
                store_data['phone_number'] = '02-123-4567'
            if not store_data.get('open_time'):
                store_data['open_time'] = '10:00'
            if not store_data.get('close_time'):
                store_data['close_time'] = '22:00'
            
            print(f"응답 데이터: {store_data}")
            return Response(store_data)
        except Exception as e:
            print(f"current_store 오류: {str(e)}")
            import traceback
            print(traceback.format_exc())
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=False, methods=['put'])
    def update_current_store(self, request):
        """
        현재 로그인한 매장 관리자의 매장 정보를 업데이트합니다.
        """
        try:
            # 토큰에서 사용자 정보 확인
            user = request.user
            
            print(f"=== update_current_store API 호출 ===")
            print(f"사용자: {user}")
            print(f"요청 데이터: {request.data}")
            
            if not user.is_authenticated:
                return Response({"error": "로그인이 필요합니다."}, 
                               status=status.HTTP_401_UNAUTHORIZED)
            
            # 사용자의 매장 정보 가져오기 - owner 필드로 연결된 매장 조회
            store = Store.objects.filter(owner=user).first()
            print(f"사용자가 소유한 매장: {store}")
            
            if not store:
                print("연결된 매장 정보가 없음")
                return Response({"error": "연결된 매장 정보가 없습니다."}, 
                               status=status.HTTP_404_NOT_FOUND)
            
            # Store 모델에 실제로 있는 필드만 업데이트
            store_fields = [
                'name', 'address', 'description', 'status',
                'phone_number', 'open_time', 'close_time', 
                'manager_name', 'manager_phone', 'max_capacity'
            ]
            update_data = {}
            for field in store_fields:
                if field in request.data:
                    update_data[field] = request.data[field]
            
            print(f"업데이트할 데이터: {update_data}")
            
            # 매장 정보 업데이트
            if update_data:  # 업데이트할 데이터가 있는 경우에만 시리얼라이저 사용
                serializer = StoreSerializer(store, data=update_data, partial=True)
                if serializer.is_valid():
                    serializer.save()
                    print("매장 정보 업데이트 성공")
                else:
                    print(f"시리얼라이저 유효성 검사 실패: {serializer.errors}")
                    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            
            # 업데이트된 매장 정보 다시 조회하여 응답
            store.refresh_from_db()
            serializer = StoreSerializer(store)
            response_data = serializer.data
            
            print(f"응답 데이터: {response_data}")
            return Response(response_data)
        except Exception as e:
            print(f"update_current_store 오류: {str(e)}")
            import traceback
            print(traceback.format_exc())
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=False, methods=['post'])
    def generate_qr_code(self, request):
        """
        매장 QR 코드를 생성합니다.
        """
        try:
            # 토큰에서 사용자 정보 확인
            user = request.user
            
            # 매장 관리자 권한 확인
            if not hasattr(user, 'is_store_owner') or not user.is_store_owner:
                return Response({"error": "매장 관리자 권한이 없습니다."}, 
                               status=status.HTTP_403_FORBIDDEN)
            
            # 매장 관리자와 연결된 매장 조회
            store = Store.objects.filter(owner=user).first()
            if not store:
                return Response({"error": "연결된 매장 정보가 없습니다."}, 
                               status=status.HTTP_404_NOT_FOUND)
            
            # QR 코드 생성 로직 (예: 매장 ID를, 이름, 주소 정보를 포함)
            qr_data = {
                "store_id": store.id,
                "name": store.name,
                "address": store.address,
                "timestamp": datetime.datetime.now().isoformat()
            }
            
            # 실제 QR 코드 이미지 생성 및 URL 반환 로직 구현 필요
            # 임시로 JSON 반환
            return Response({
                "qr_data": qr_data,
                "qr_url": f"/media/qr_codes/store_{store.id}.png"  # 실제 QR 코드 이미지 경로 구현 필요
            })
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=False, methods=['get'])
    def by_owner(self, request):
        """
        매장 소유자 ID로 매장을 조회합니다.
        파라미터:
        - owner_id: 소유자 ID
        """
        try:
            owner_id = request.query_params.get('owner_id')
            if not owner_id:
                return Response({"error": "owner_id 파라미터가 필요합니다."}, 
                              status=status.HTTP_400_BAD_REQUEST)
            
            store = Store.objects.filter(owner_id=owner_id).first()
            if not store:
                return Response({"error": "해당 소유자의 매장을 찾을 수 없습니다."}, 
                              status=status.HTTP_404_NOT_FOUND)
            
            serializer = StoreSerializer(store)
            return Response(serializer.data)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=False, methods=['get'])
    def debug_user(self, request):
        """
        현재 로그인한 사용자 정보를 디버그용으로 반환합니다.
        """
        try:
            user = request.user
            
            print(f"=== debug_user API 호출 ===")
            print(f"사용자: {user}")
            print(f"인증 여부: {user.is_authenticated}")
            print(f"사용자 ID: {user.id if user.is_authenticated else 'N/A'}")
            print(f"전화번호: {user.phone if user.is_authenticated else 'N/A'}")
            print(f"닉네임: {user.nickname if user.is_authenticated else 'N/A'}")
            print(f"is_store_owner: {user.is_store_owner if user.is_authenticated else 'N/A'}")
            print(f"role: {user.role if user.is_authenticated else 'N/A'}")
            
            if not user.is_authenticated:
                return Response({"error": "로그인이 필요합니다."}, 
                               status=status.HTTP_401_UNAUTHORIZED)
            
            # 사용자가 소유한 매장 조회
            stores = Store.objects.filter(owner=user)
            store_info = []
            for store in stores:
                store_info.append({
                    'id': store.id,
                    'name': store.name,
                    'address': store.address
                })
            
            user_data = {
                'id': user.id,
                'phone': user.phone,
                'nickname': user.nickname,
                'is_store_owner': user.is_store_owner,
                'role': user.role,
                'stores': store_info,
                'store_count': len(store_info)
            }
            
            print(f"응답 데이터: {user_data}")
            return Response(user_data)
        except Exception as e:
            print(f"debug_user 오류: {str(e)}")
            import traceback
            print(traceback.format_exc())
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

from django.db import models 

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def search_user_by_phone(request):
    """
    휴대폰 번호로 사용자 검색
    """
    try:
        phone = request.GET.get('phone')
        if not phone:
            return Response({
                'error': '휴대폰 번호가 필요합니다.'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # 휴대폰 번호 정규화 (하이픈 제거)
        normalized_phone = phone.replace('-', '').replace(' ', '')
        
        # 사용자 검색 (여러 형태의 휴대폰 번호 형식 고려)
        user = None
        phone_variations = [
            normalized_phone,
            phone,
            f"{normalized_phone[:3]}-{normalized_phone[3:7]}-{normalized_phone[7:]}",
        ]
        
        for phone_var in phone_variations:
            try:
                user = User.objects.get(phone=phone_var)
                break
            except User.DoesNotExist:
                continue
        
        if user:
            return Response({
                'found': True,
                'user': {
                    'id': user.id,
                    'username': user.nickname or user.phone,
                    'email': user.email,
                    'phone': user.phone,
                    'first_name': user.first_name,
                    'last_name': user.last_name,
                }
            })
        else:
            return Response({
                'found': False,
                'message': '해당 휴대폰 번호로 등록된 사용자가 없습니다.'
            })
            
    except Exception as e:
        return Response({
            'error': f'사용자 검색 중 오류가 발생했습니다: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def register_player_to_tournament(request):
    """
    선수를 토너먼트에 등록
    """
    try:
        data = request.data
        tournament_id = data.get('tournament_id')
        user_id = data.get('user_id')
        phone_number = data.get('phone_number')
        
        # 토너먼트 확인
        try:
            tournament = Tournament.objects.get(id=tournament_id)
        except Tournament.DoesNotExist:
            return Response({
                'error': '토너먼트를 찾을 수 없습니다.'
            }, status=status.HTTP_404_NOT_FOUND)
        
        # 사용자 확인 또는 생성
        user = None
        if user_id:
            try:
                user = User.objects.get(id=user_id)
            except User.DoesNotExist:
                return Response({
                    'error': '사용자를 찾을 수 없습니다.'
                }, status=status.HTTP_404_NOT_FOUND)
        elif phone_number:
            # 휴대폰 번호로 사용자 검색
            normalized_phone = phone_number.replace('-', '').replace(' ', '')
            phone_variations = [
                normalized_phone,
                phone_number,
                f"{normalized_phone[:3]}-{normalized_phone[3:7]}-{normalized_phone[7:]}",
            ]
            
            for phone_var in phone_variations:
                try:
                    user = User.objects.get(phone_number=phone_var)
                    break
                except User.DoesNotExist:
                    continue
            
            # 사용자가 없으면 새로 생성
            if not user:
                username = data.get('username', f'user_{normalized_phone}')
                email = data.get('email', f'{normalized_phone}@temp.com')
                
                user = User.objects.create_user(
                    username=username,
                    email=email,
                    phone_number=phone_number,
                    first_name=data.get('first_name', ''),
                    last_name=data.get('last_name', ''),
                    password='temp_password_123'  # 임시 비밀번호
                )
        else:
            return Response({
                'error': '사용자 ID 또는 휴대폰 번호가 필요합니다.'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # 이미 등록된 선수인지 확인하고 기존 참가를 USED로 변경
        from tournaments.models import TournamentPlayer
        existing_registrations = TournamentPlayer.objects.filter(
            tournament=tournament,
            user=user,
            status='ACTIVE'  # 활성 상태인 참가만 조회
        )
        
        # 기존 활성 참가가 있으면 USED로 변경
        if existing_registrations.exists():
            for existing_reg in existing_registrations:
                existing_reg.status = 'USED'
                existing_reg.save()
                
                # 기존 참가에서 사용된 SEAT권의 거래 내역에 메모 추가
                try:
                    # 기존 참가에서 사용된 SEAT권 거래 내역 찾기
                    existing_transactions = SeatTicketTransaction.objects.filter(
                        reason__contains=f'토너먼트 참가: {tournament.name}',
                        processed_by__isnull=True  # 시스템에서 처리된 것들
                    ).filter(
                        seat_ticket__user=user,
                        seat_ticket__tournament=tournament,
                        transaction_type='USE'
                    )
                    
                    # 거래 내역에 중복 참가 메모 추가
                    for transaction in existing_transactions:
                        if '중복 참가로 인해 무효화됨' not in transaction.reason:
                            transaction.reason += f' (중복 참가로 인해 무효화됨 - {existing_reg.created_at.strftime("%Y-%m-%d %H:%M")})'
                            transaction.save()
                            
                except Exception as e:
                    # 거래 내역 업데이트 실패해도 메인 로직에는 영향 없음
                    print(f"기존 SEAT권 거래 내역 업데이트 실패: {e}")
            
            # 기존 참가 정보를 로그에 기록
            existing_info = {
                'count': existing_registrations.count(),
                'registrations': [
                    {
                        'id': reg.id,
                        'nickname': reg.nickname,
                        'registered_at': reg.created_at
                    }
                    for reg in existing_registrations
                ]
            }
        else:
            existing_info = {'count': 0, 'registrations': []}
        
        # 사용자의 해당 토너먼트 SEAT권 확인
        from seats.models import SeatTicket, SeatTicketTransaction, UserSeatTicketSummary
        from django.db import transaction as db_transaction
        
        # 필요한 SEAT권 개수 확인 (buy_in)
        required_tickets = tournament.buy_in
        
        # 사용 가능한 SEAT권 조회 (필요한 개수만큼)
        available_tickets = SeatTicket.objects.filter(
            user=user,
            tournament=tournament,
            status='ACTIVE'
        )[:required_tickets]
        
        # 보유한 SEAT권 개수 확인
        available_count = available_tickets.count()
        
        if available_count < required_tickets:
            return Response({
                'error': f'토너먼트 참가에는 SEAT권 {required_tickets}개가 필요하지만, {available_count}개만 보유하고 있습니다.',
                'required_tickets': required_tickets,
                'available_tickets': available_count,
                'tournament_name': tournament.name,
                'user_phone': user.phone_number
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # 모든 SEAT권이 유효한지 확인
        for ticket in available_tickets:
            if not ticket.is_valid():
                return Response({
                    'error': f'보유하신 SEAT권 중 일부가 만료되었거나 사용할 수 없는 상태입니다. (티켓 ID: {ticket.ticket_id})',
                    'ticket_status': ticket.get_status_display()
                }, status=status.HTTP_400_BAD_REQUEST)
        
        # 트랜잭션으로 선수 등록과 SEAT권 사용 처리
        with db_transaction.atomic():
            # 선수 등록
            tournament_player = TournamentPlayer.objects.create(
                tournament=tournament,
                user=user,
                nickname=data.get('nickname', user.nickname or user.phone)
            )
            
            # 모든 필요한 SEAT권 사용 처리
            used_tickets = []
            for ticket in available_tickets:
                ticket.use_ticket()
                used_tickets.append(str(ticket.ticket_id))
                
                # SEAT권 거래 내역 생성
                SeatTicketTransaction.objects.create(
                    seat_ticket=ticket,
                    transaction_type='USE',
                    quantity=1,
                    amount=0,
                    reason=f'토너먼트 참가: {tournament.name}',
                    processed_by=request.user if request.user.is_authenticated else None
                )
            
            # 사용자 SEAT권 요약 정보 업데이트
            try:
                summary = UserSeatTicketSummary.objects.get(
                    user=user,
                    tournament=tournament
                )
                summary.update_summary()
            except UserSeatTicketSummary.DoesNotExist:
                # 요약 정보가 없으면 새로 생성
                summary = UserSeatTicketSummary.objects.create(
                    user=user,
                    tournament=tournament
                )
                summary.update_summary()
        
        # 메시지 생성 (기존 참가가 있었는지에 따라 다른 메시지)
        if existing_info['count'] > 0:
            message = f'선수가 성공적으로 재참가되었습니다. 기존 참가 {existing_info["count"]}건이 사용됨으로 변경되었고, SEAT권 {required_tickets}개가 사용되었습니다.'
        else:
            message = f'선수가 성공적으로 참가되었습니다. SEAT권 {required_tickets}개가 사용되었습니다.'
            
        return Response({
            'success': True,
            'message': message,
            'player': {
                'id': tournament_player.id,
                'user_id': user.id,
                'username': user.nickname or user.phone,
                'phone_number': user.phone_number,
                'nickname': tournament_player.nickname,
                'registered_at': tournament_player.created_at
            },
            'used_tickets': {
                'ticket_ids': used_tickets,
                'count': len(used_tickets),
                'tournament_name': tournament.name
            },
            'existing_registrations': existing_info
        })
        
    except Exception as e:
        return Response({
            'error': f'선수 참가 중 오류가 발생했습니다: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def grant_seat_ticket(request):
    """
    사용자에게 SEAT권을 지급
    """
    try:
        data = request.data
        user_id = data.get('user_id')
        phone_number = data.get('phone_number')
        tournament_id = data.get('tournament_id')
        quantity = data.get('quantity', 1)
        source = data.get('source', 'ADMIN')
        memo = data.get('memo', '')
        
        # 토너먼트 확인
        try:
            tournament = Tournament.objects.get(id=tournament_id)
        except Tournament.DoesNotExist:
            return Response({
                'error': '토너먼트를 찾을 수 없습니다.'
            }, status=status.HTTP_404_NOT_FOUND)
        
        # 사용자 확인
        user = None
        if user_id:
            try:
                user = User.objects.get(id=user_id)
            except User.DoesNotExist:
                return Response({
                    'error': '사용자를 찾을 수 없습니다.'
                }, status=status.HTTP_404_NOT_FOUND)
        elif phone_number:
            # 휴대폰 번호로 사용자 검색
            normalized_phone = phone_number.replace('-', '').replace(' ', '')
            phone_variations = [
                normalized_phone,
                phone_number,
                f"{normalized_phone[:3]}-{normalized_phone[3:7]}-{normalized_phone[7:]}",
            ]
            
            for phone_var in phone_variations:
                try:
                    user = User.objects.get(phone_number=phone_var)
                    break
                except User.DoesNotExist:
                    continue
            
            if not user:
                return Response({
                    'error': '해당 휴대폰 번호로 등록된 사용자를 찾을 수 없습니다.'
                }, status=status.HTTP_404_NOT_FOUND)
        else:
            return Response({
                'error': '사용자 ID 또는 휴대폰 번호가 필요합니다.'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # 수량 검증
        if quantity < 1 or quantity > 10:
            return Response({
                'error': '좌석권 수량은 1개에서 10개 사이여야 합니다.'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # 좌석권 지급
        from seats.models import SeatTicket, SeatTicketTransaction, UserSeatTicketSummary
        from stores.models import Store
        from django.db import transaction as db_transaction
        
        # 현재 로그인한 사용자의 매장 정보 가져오기
        store = Store.objects.filter(owner=request.user).first()
        if not store:
            return Response({
                'error': '매장 정보를 찾을 수 없습니다.'
            }, status=status.HTTP_404_NOT_FOUND)
        
        created_tickets = []
        
        with db_transaction.atomic():
            for i in range(quantity):
                ticket = SeatTicket.objects.create(
                    tournament=tournament,
                    user=user,
                    store=store,
                    source=source,
                    amount=0,
                    memo=memo
                )
                created_tickets.append(ticket)
                
                # 거래 내역 생성
                SeatTicketTransaction.objects.create(
                    seat_ticket=ticket,
                    transaction_type='GRANT',
                    quantity=1,
                    amount=0,
                    reason=f"좌석권 지급: {memo}",
                    processed_by=request.user
                )
            
            # 요약 정보 업데이트
            summary, created = UserSeatTicketSummary.objects.get_or_create(
                user=user,
                tournament=tournament
            )
            summary.update_summary()
        
        return Response({
            'success': True,
            'message': f'{quantity}개의 좌석권이 성공적으로 지급되었습니다.',
            'user_phone': user.phone_number,
            'tournament_name': tournament.name,
            'granted_quantity': quantity,
            'tickets': [
                {
                    'ticket_id': str(ticket.ticket_id),
                    'status': ticket.status,
                    'created_at': ticket.created_at
                } for ticket in created_tickets
            ]
        })
        
    except Exception as e:
        return Response({
            'error': f'좌석권 지급 중 오류가 발생했습니다: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_user_ticket_status(request):
    """
    사용자의 좌석권 보유 현황 조회
    """
    try:
        user_id = request.GET.get('user_id')
        phone_number = request.GET.get('phone_number')
        tournament_id = request.GET.get('tournament_id')
        
        # 사용자 확인
        user = None
        if user_id:
            try:
                user = User.objects.get(id=user_id)
            except User.DoesNotExist:
                return Response({
                    'error': '사용자를 찾을 수 없습니다.'
                }, status=status.HTTP_404_NOT_FOUND)
        elif phone_number:
            # 휴대폰 번호로 사용자 검색
            normalized_phone = phone_number.replace('-', '').replace(' ', '')
            phone_variations = [
                normalized_phone,
                phone_number,
                f"{normalized_phone[:3]}-{normalized_phone[3:7]}-{normalized_phone[7:]}",
            ]
            
            for phone_var in phone_variations:
                try:
                    user = User.objects.get(phone_number=phone_var)
                    break
                except User.DoesNotExist:
                    continue
            
            if not user:
                return Response({
                    'error': '해당 휴대폰 번호로 등록된 사용자를 찾을 수 없습니다.'
                }, status=status.HTTP_404_NOT_FOUND)
        else:
            return Response({
                'error': '사용자 ID 또는 휴대폰 번호가 필요합니다.'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        from seats.models import SeatTicket, UserSeatTicketSummary
        
        # 특정 토너먼트의 좌석권 현황
        if tournament_id:
            try:
                tournament = Tournament.objects.get(id=tournament_id)
            except Tournament.DoesNotExist:
                return Response({
                    'error': '토너먼트를 찾을 수 없습니다.'
                }, status=status.HTTP_404_NOT_FOUND)
            
            # 해당 토너먼트의 좌석권 조회
            tickets = SeatTicket.objects.filter(
                user=user,
                tournament=tournament
            ).order_by('-created_at')
            
            active_tickets = tickets.filter(status='ACTIVE')
            used_tickets = tickets.filter(status='USED')
            
            return Response({
                'user_phone': user.phone_number,
                'tournament_name': tournament.name,
                'total_tickets': tickets.count(),
                'active_tickets': active_tickets.count(),
                'used_tickets': used_tickets.count(),
                'tickets': [
                    {
                        'ticket_id': str(ticket.ticket_id),
                        'status': ticket.status,
                        'status_display': ticket.get_status_display(),
                        'source': ticket.source,
                        'source_display': ticket.get_source_display(),
                        'created_at': ticket.created_at,
                        'used_at': ticket.used_at,
                        'memo': ticket.memo
                    } for ticket in tickets
                ]
            })
        
        # 전체 토너먼트의 좌석권 요약
        else:
            summaries = UserSeatTicketSummary.objects.filter(
                user=user
            ).select_related('tournament').order_by('-last_updated')
            
            return Response({
                'user_phone': user.phone_number,
                'total_tournaments': summaries.count(),
                'tournaments': [
                    {
                        'tournament_id': summary.tournament.id,
                        'tournament_name': summary.tournament.name,
                        'tournament_start_time': summary.tournament.start_time,
                        'total_tickets': summary.total_tickets,
                        'active_tickets': summary.active_tickets,
                        'used_tickets': summary.used_tickets,
                        'last_updated': summary.last_updated
                    } for summary in summaries
                ]
            })
        
    except Exception as e:
        return Response({
            'error': f'좌석권 현황 조회 중 오류가 발생했습니다: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR) 