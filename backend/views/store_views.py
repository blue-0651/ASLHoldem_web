from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from rest_framework.decorators import action
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
        fields = ['id', 'name', 'address', 'description', 'status', 'created_at', 'updated_at', 'tournament_count']
    
    def get_tournament_count(self, obj):
        return obj.tournaments.count()

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
            stores = Store.objects.all().order_by('name')
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
            
            # 매장 관리자 권한 확인
            if not hasattr(user, 'is_store_owner') or not user.is_store_owner:
                return Response({"error": "매장 관리자 권한이 없습니다."}, 
                               status=status.HTTP_403_FORBIDDEN)
            
            # 매장 관리자와 연결된 매장 조회 (manager -> owner로 변경)
            store = Store.objects.filter(owner=user).first()
            if not store:
                return Response({"error": "연결된 매장 정보가 없습니다."}, 
                               status=status.HTTP_404_NOT_FOUND)
            
            # 프론트엔드에서 요청하는 추가 필드들을 포함한 응답 생성
            store_data = {
                'id': store.id,
                'name': store.name,
                'address': store.address,
                'description': store.description,
                'status': store.status,
                'created_at': store.created_at,
                'updated_at': store.updated_at,
                # 프론트엔드에서 요청하는 추가 필드들 (임시 데이터)
                'phone_number': '02-123-4567',  # Store 모델에 없는 필드 - 임시 데이터
                'open_time': '10:00',           # Store 모델에 없는 필드 - 임시 데이터  
                'close_time': '22:00',          # Store 모델에 없는 필드 - 임시 데이터
                'manager_name': user.nickname or user.phone,  # Store 모델에 없는 필드 - 사용자 정보 활용
                'manager_phone': user.phone,    # Store 모델에 없는 필드 - 사용자 정보 활용
                'max_capacity': 50              # Store 모델에 없는 필드 - 임시 데이터
            }
            
            return Response(store_data)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=False, methods=['put'])
    def update_current_store(self, request):
        """
        현재 로그인한 매장 관리자의 매장 정보를 업데이트합니다.
        """
        try:
            # 토큰에서 사용자 정보 확인
            user = request.user
            
            # 매장 관리자 권한 확인
            if not hasattr(user, 'is_store_owner') or not user.is_store_owner:
                return Response({"error": "매장 관리자 권한이 없습니다."}, 
                               status=status.HTTP_403_FORBIDDEN)
            
            # 매장 관리자와 연결된 매장 조회 (manager -> owner로 변경)
            store = Store.objects.filter(owner=user).first()
            if not store:
                return Response({"error": "연결된 매장 정보가 없습니다."}, 
                               status=status.HTTP_404_NOT_FOUND)
            
            # Store 모델에 실제로 있는 필드만 업데이트
            store_fields = ['name', 'address', 'description', 'status']
            update_data = {}
            for field in store_fields:
                if field in request.data:
                    update_data[field] = request.data[field]
            
            # 매장 정보 업데이트
            serializer = StoreSerializer(store, data=update_data, partial=True)
            if serializer.is_valid():
                serializer.save()
                
                # 업데이트된 데이터에 추가 필드들 포함하여 응답
                response_data = serializer.data
                response_data.update({
                    'phone_number': request.data.get('phone_number', '02-123-4567'),
                    'open_time': request.data.get('open_time', '10:00'),
                    'close_time': request.data.get('close_time', '22:00'),
                    'manager_name': request.data.get('manager_name', user.nickname or user.phone),
                    'manager_phone': request.data.get('manager_phone', user.phone),
                    'max_capacity': request.data.get('max_capacity', 50)
                })
                
                return Response(response_data)
            else:
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
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

from django.db import models 