from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from rest_framework.decorators import action
from django.contrib.auth import get_user_model
from rest_framework import serializers
from django.db.models import Q, Count, Max
import logging
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

from tournaments.models import Tournament

# API 로거 생성
api_logger = logging.getLogger('api')

User = get_user_model()

# 매장 관리자용 토큰 시리얼라이저
class StoreManagerTokenObtainPairSerializer(TokenObtainPairSerializer):
    username_field = 'phone'
    
    def validate(self, attrs):
        phone = attrs.get('phone')
        password = attrs.get('password')
        
        print(f"[STORE LOGIN] 매장관리자 로그인 시도 - 전화번호: {phone}")
        
        if not phone or not password:
            print(f"[STORE LOGIN] 전화번호 또는 비밀번호 누락")
            raise serializers.ValidationError("전화번호와 비밀번호가 필요합니다.")
        
        # 전화번호 형식 정규화
        # 하이픈 제거하고 숫자만 추출
        clean_phone = ''.join(filter(str.isdigit, phone))
        print(f"[STORE LOGIN] 정규화된 전화번호: {clean_phone}")
        
        # 11자리 숫자인지 확인
        if len(clean_phone) != 11 or not clean_phone.startswith('010'):
            print(f"[STORE LOGIN] 전화번호 형식 오류 - 길이: {len(clean_phone)}, 시작: {clean_phone[:3]}")
            raise serializers.ValidationError("올바른 전화번호 형식이 아닙니다.")
        
        # 하이픈 포함 형식으로 변환 (데이터베이스 저장 형식)
        formatted_phone = f"{clean_phone[:3]}-{clean_phone[3:7]}-{clean_phone[7:]}"
        print(f"[STORE LOGIN] 포맷된 전화번호: {formatted_phone}")
        
        try:
            user = User.objects.get(phone=formatted_phone)
            print(f"[STORE LOGIN] 사용자 찾음 - ID: {user.id}, 닉네임: {user.nickname}")
            print(f"[STORE LOGIN] 사용자 상태 - 활성: {user.is_active}, 매장관리자: {user.is_store_owner}")
        except User.DoesNotExist:
            print(f"[STORE LOGIN] 사용자 없음 - {formatted_phone}")
            raise serializers.ValidationError("전화번호 또는 비밀번호가 올바르지 않습니다.")
        
        if not user.check_password(password):
            print(f"[STORE LOGIN] 비밀번호 불일치")
            raise serializers.ValidationError("전화번호 또는 비밀번호가 올바르지 않습니다.")
        
        if not user.is_active:
            print(f"[STORE LOGIN] 비활성화된 계정")
            raise serializers.ValidationError("비활성화된 계정입니다.")
        
        if not user.is_store_owner:
            print(f"[STORE LOGIN] 매장관리자 권한 없음 - is_store_owner: {user.is_store_owner}")
            raise serializers.ValidationError("매장 관리자 권한이 없습니다.")
        
        print(f"[STORE LOGIN] 로그인 성공!")
        
        # 직접 토큰 생성 (super().validate() 호출 제거)
        refresh = self.get_token(user)
        
        return {
            'refresh': str(refresh),
            'access': str(refresh.access_token),
        }
    
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token['phone'] = user.phone
        token['nickname'] = user.nickname if user.nickname else ''
        token['email'] = user.email if user.email else ''
        token['is_store_owner'] = user.is_store_owner
        token['role'] = user.role
        return token

# 일반 사용자용 토큰 시리얼라이저
class UserTokenObtainPairSerializer(TokenObtainPairSerializer):
    username_field = 'phone'
    
    def validate(self, attrs):
        phone = attrs.get('phone')
        password = attrs.get('password')
        
        print(f"[USER LOGIN] 일반사용자 로그인 시도 - 전화번호: {phone}")
        
        if not phone or not password:
            print(f"[USER LOGIN] 전화번호 또는 비밀번호 누락")
            raise serializers.ValidationError("전화번호와 비밀번호가 필요합니다.")
        
        # 전화번호 형식 정규화
        # 하이픈 제거하고 숫자만 추출
        clean_phone = ''.join(filter(str.isdigit, phone))
        print(f"[USER LOGIN] 정규화된 전화번호: {clean_phone}")
        
        # 11자리 숫자인지 확인
        if len(clean_phone) != 11 or not clean_phone.startswith('010'):
            print(f"[USER LOGIN] 전화번호 형식 오류 - 길이: {len(clean_phone)}, 시작: {clean_phone[:3] if clean_phone else 'None'}")
            raise serializers.ValidationError("올바른 전화번호 형식이 아닙니다.")
        
        # 하이픈 포함 형식으로 변환 (데이터베이스 저장 형식)
        formatted_phone = f"{clean_phone[:3]}-{clean_phone[3:7]}-{clean_phone[7:]}"
        print(f"[USER LOGIN] 포맷된 전화번호: {formatted_phone}")
        
        try:
            user = User.objects.get(phone=formatted_phone)
            print(f"[USER LOGIN] 사용자 찾음 - ID: {user.id}, 닉네임: {user.nickname}")
            print(f"[USER LOGIN] 사용자 상태 - 활성: {user.is_active}, 매장관리자: {user.is_store_owner}, 스태프: {user.is_staff}")
        except User.DoesNotExist:
            print(f"[USER LOGIN] 사용자 없음 - {formatted_phone}")
            raise serializers.ValidationError("전화번호 또는 비밀번호가 올바르지 않습니다.")
        
        if not user.check_password(password):
            print(f"[USER LOGIN] 비밀번호 불일치")
            raise serializers.ValidationError("전화번호 또는 비밀번호가 올바르지 않습니다.")
        
        if not user.is_active:
            print(f"[USER LOGIN] 비활성화된 계정")
            raise serializers.ValidationError("비활성화된 계정입니다.")
        
        # 매장관리자 계정은 일반사용자 API로 로그인 불가
        if user.is_store_owner:
            print(f"[USER LOGIN] 매장관리자 계정으로 일반사용자 로그인 시도")
            raise serializers.ValidationError("매장관리자 계정입니다. 매장관리자 로그인을 이용해주세요.")
        
        # 관리자 계정은 일반사용자 API로 로그인 불가  
        if user.is_staff or user.is_superuser:
            print(f"[USER LOGIN] 관리자 계정으로 일반사용자 로그인 시도")
            raise serializers.ValidationError("관리자 계정입니다. 관리자 로그인을 이용해주세요.")
        
        print(f"[USER LOGIN] 로그인 성공!")
        
        # 직접 토큰 생성
        refresh = self.get_token(user)
        
        return {
            'refresh': str(refresh),
            'access': str(refresh.access_token),
        }
    
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token['phone'] = user.phone
        token['nickname'] = user.nickname if user.nickname else ''
        token['email'] = user.email if user.email else ''
        token['role'] = user.role
        return token

# 관리자용 토큰 시리얼라이저
class AdminTokenObtainPairSerializer(TokenObtainPairSerializer):
    username_field = 'phone'
    
    def validate(self, attrs):
        phone = attrs.get('phone')
        password = attrs.get('password')
        
        if not phone or not password:
            raise serializers.ValidationError("전화번호와 비밀번호가 필요합니다.")
        
        # 전화번호 형식 정규화
        # 하이픈 제거하고 숫자만 추출
        clean_phone = ''.join(filter(str.isdigit, phone))
        
        # 11자리 숫자인지 확인
        if len(clean_phone) != 11 or not clean_phone.startswith('010'):
            raise serializers.ValidationError("올바른 전화번호 형식이 아닙니다.")
        
        # 하이픈 포함 형식으로 변환 (데이터베이스 저장 형식)
        formatted_phone = f"{clean_phone[:3]}-{clean_phone[3:7]}-{clean_phone[7:]}"
        
        try:
            user = User.objects.get(phone=formatted_phone)
        except User.DoesNotExist:
            raise serializers.ValidationError("전화번호 또는 비밀번호가 올바르지 않습니다.")
        
        if not user.check_password(password):
            raise serializers.ValidationError("전화번호 또는 비밀번호가 올바르지 않습니다.")
        
        if not user.is_active:
            raise serializers.ValidationError("비활성화된 계정입니다.")
        
        if not (user.is_staff or user.is_superuser):
            raise serializers.ValidationError("관리자 권한이 없습니다.")
        
        # 직접 토큰 생성
        refresh = self.get_token(user)
        
        return {
            'refresh': str(refresh),
            'access': str(refresh.access_token),
        }
    
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token['phone'] = user.phone
        token['nickname'] = user.nickname if user.nickname else ''
        token['email'] = user.email if user.email else ''
        token['is_staff'] = user.is_staff
        token['is_superuser'] = user.is_superuser
        token['role'] = user.role
        return token

# 매장 관리자용 토큰 뷰
class StoreManagerTokenObtainPairView(TokenObtainPairView):
    serializer_class = StoreManagerTokenObtainPairSerializer
    
    def post(self, request, *args, **kwargs):
        # 요청 데이터 로깅 (비밀번호는 제외)
        log_data = request.data.copy()
        if 'password' in log_data:
            log_data['password'] = '******'
        api_logger.info(f"매장관리자 로그인 요청: {log_data}")
        
        # 원래 메서드 호출
        response = super().post(request, *args, **kwargs)
        
        # 응답 로깅 (민감한 정보는 제외)
        log_response = response.data.copy() if hasattr(response, 'data') else {}
        if 'access' in log_response:
            log_response['access'] = log_response['access'][:10] + '...'
        if 'refresh' in log_response:
            log_response['refresh'] = log_response['refresh'][:10] + '...'
        api_logger.info(f"매장관리자 로그인 응답: {log_response}")
        
        return response

# 일반 사용자용 토큰 뷰
class UserTokenObtainPairView(TokenObtainPairView):
    serializer_class = UserTokenObtainPairSerializer
    
    def post(self, request, *args, **kwargs):
        # 요청 데이터 로깅 (비밀번호는 제외)
        log_data = request.data.copy()
        if 'password' in log_data:
            log_data['password'] = '******'
        api_logger.info(f"일반 사용자 로그인 요청: {log_data}")
        
        # 원래 메서드 호출
        response = super().post(request, *args, **kwargs)
        
        # 응답 로깅 (민감한 정보는 제외)
        log_response = response.data.copy() if hasattr(response, 'data') else {}
        if 'access' in log_response:
            log_response['access'] = log_response['access'][:10] + '...'
        if 'refresh' in log_response:
            log_response['refresh'] = log_response['refresh'][:10] + '...'
        api_logger.info(f"일반 사용자 로그인 응답: {log_response}")
        
        return response

# 관리자용 토큰 뷰
class AdminTokenObtainPairView(TokenObtainPairView):
    serializer_class = AdminTokenObtainPairSerializer
    
    def post(self, request, *args, **kwargs):
        # 요청 데이터 로깅 (비밀번호는 제외)
        log_data = request.data.copy()
        if 'password' in log_data:
            log_data['password'] = '******'
        api_logger.info(f"관리자 로그인 요청: {log_data}")
        
        # 원래 메서드 호출
        response = super().post(request, *args, **kwargs)
        
        # 응답 로깅 (민감한 정보는 제외)
        log_response = response.data.copy() if hasattr(response, 'data') else {}
        if 'access' in log_response:
            log_response['access'] = log_response['access'][:10] + '...'
        if 'refresh' in log_response:
            log_response['refresh'] = log_response['refresh'][:10] + '...'
        api_logger.info(f"관리자 로그인 응답: {log_response}")
        
        return response

class TournamentBasicSerializer(serializers.ModelSerializer):
    """
    토너먼트 기본 정보 시리얼라이저
    """
    store_name = serializers.CharField(source='store.name', read_only=True)
    
    class Meta:
        model = Tournament
        fields = ['id', 'name', 'start_time', 'status', 'buy_in', 'store', 'store_name']



class UserSerializer(serializers.ModelSerializer):
    """
    사용자 정보를 위한 시리얼라이저 - 모든 필드 포함
    """
    nickname = serializers.CharField(required=False, allow_null=True, allow_blank=True)
    password = serializers.CharField(write_only=True, required=False)

    user_permissions_list = serializers.SerializerMethodField()
    groups_list = serializers.SerializerMethodField()
    phone = serializers.CharField(required=True)
    is_store_owner = serializers.BooleanField(required=False, default=False)
    birth_date = serializers.DateField(required=False, allow_null=True)
    gender = serializers.ChoiceField(choices=[('M', '남성'), ('F', '여성'), ('O', '기타')], required=False, allow_null=True)
    
    class Meta:
        model = User
        fields = [
            'id', 'phone', 'nickname', 'email', 'first_name', 'last_name', 'password', 
            'is_active', 'is_staff', 'is_superuser', 'date_joined', 'last_login',
            'groups', 'groups_list', 'user_permissions', 'user_permissions_list', 
            'is_store_owner', 'birth_date', 'gender', 'role'
        ]
        read_only_fields = ['id', 'date_joined', 'last_login', 'user_permissions_list', 'groups_list']
    

    
    def get_user_permissions_list(self, obj):
        return [perm.codename for perm in obj.user_permissions.all()]
    
    def get_groups_list(self, obj):
        return [group.name for group in obj.groups.all()]
    
    def create(self, validated_data):
        try:
            # many-to-many 필드 추출
            groups = validated_data.pop('groups', None)
            user_permissions = validated_data.pop('user_permissions', None)
            password = validated_data.pop('password', None)
            is_store_owner = validated_data.pop('is_store_owner', False)
            
            # username을 phone 값으로 설정 (unique constraint 해결)
            if 'phone' in validated_data and not validated_data.get('username'):
                validated_data['username'] = validated_data['phone']
            
            # 비밀번호가 없으면 임시 비밀번호 설정
            if not password:
                password = 'temp_password_123'
            
            # User 객체 생성
            user = User.objects.create_user(
                username=validated_data['username'],
                email=validated_data.get('email', ''),
                password=password,
                **{k: v for k, v in validated_data.items() if k not in ['username', 'email']}
            )
            
            # 추가 속성 설정
            user.is_store_owner = is_store_owner
            
            # many-to-many 필드 설정
            if groups is not None:
                user.groups.set(groups)
            if user_permissions is not None:
                user.user_permissions.set(user_permissions)
            
            user.save()
            return user
        except Exception as e:
            api_logger.error(f"사용자 생성 중 오류: {str(e)}", exc_info=True)
            raise e
    
    def update(self, instance, validated_data):
        # many-to-many 필드 추출
        groups = validated_data.pop('groups', None)
        user_permissions = validated_data.pop('user_permissions', None)
        
        password = validated_data.pop('password', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
            
        if password:
            instance.set_password(password)
            
        # many-to-many 필드 설정
        if groups is not None:
            instance.groups.set(groups)
        
        if user_permissions is not None:
            instance.user_permissions.set(user_permissions)
            
        instance.save()
        return instance

class UserStatsSerializer(serializers.Serializer):
    """
    사용자 통계 정보 시리얼라이저
    """
    phone = serializers.CharField()
    email = serializers.EmailField()
    tournaments_count = serializers.IntegerField()
    checked_in_count = serializers.IntegerField()
    total_spent = serializers.DecimalField(max_digits=10, decimal_places=2)
    last_tournament = serializers.DateTimeField()
    is_active = serializers.BooleanField()

class UserViewSet(viewsets.ViewSet):
    """
    사용자 정보 CRUD를 위한 API 뷰셋
    """
    permission_classes = [permissions.AllowAny]
    
    @action(detail=False, methods=['post'])
    def create_user(self, request):
        """
        새로운 사용자를 생성합니다.
        """
        try:
            # 요청 데이터 로깅 (비밀번호 제외)
            request_data = request.data.copy()
            if 'password' in request_data:
                request_data['password'] = '[HIDDEN]'
            api_logger.info(f"회원가입 요청 데이터: {request_data}")
            
            serializer = UserSerializer(data=request.data)
            if serializer.is_valid():
                user = serializer.save()
                api_logger.info(f"회원가입 성공: {user.phone} (ID: {user.id})")
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            else:
                api_logger.error(f"회원가입 유효성 검사 실패: {serializer.errors}")
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            api_logger.error(f"회원가입 중 예외 발생: {str(e)}", exc_info=True)
            return Response({
                'error': '회원가입 처리 중 오류가 발생했습니다.',
                'detail': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=False, methods=['post'])
    def get_user(self, request):
        """
        사용자 정보를 조회합니다.
        """
        user_id = request.data.get('user_id')
        phone = request.data.get('phone')
        if not user_id and not phone:
            return Response({"error": "사용자 ID 또는 전화번호가 필요합니다."}, 
                           status=status.HTTP_400_BAD_REQUEST)
        
        try:
            if user_id:
                user = User.objects.get(id=user_id)
            else:
                user = User.objects.get(phone=phone)
            
            serializer = UserSerializer(user)
            return Response(serializer.data)
        except User.DoesNotExist:
            return Response({"error": "해당 사용자를 찾을 수 없습니다."}, 
                          status=status.HTTP_404_NOT_FOUND)
    
    @action(detail=False, methods=['post'])
    def update_user(self, request):
        """
        사용자 정보를 업데이트합니다.
        """
        user_id = request.data.get('user_id')
        if not user_id:
            return Response({"error": "사용자 ID가 필요합니다."}, 
                           status=status.HTTP_400_BAD_REQUEST)
        
        try:
            user = User.objects.get(id=user_id)
            
            serializer = UserSerializer(user, data=request.data, partial=True)
            if serializer.is_valid():
                serializer.save()
                return Response({
                    "success": True,
                    "message": "사용자 정보가 성공적으로 수정되었습니다.",
                    "user": serializer.data
                })
            return Response({
                "success": False,
                "error": "입력 데이터가 올바르지 않습니다.",
                "details": serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)
        except User.DoesNotExist:
            return Response({
                "success": False,
                "error": "해당 사용자를 찾을 수 없습니다."
            }, status=status.HTTP_404_NOT_FOUND)
    
    @action(detail=False, methods=['post'])
    def delete_user(self, request):
        """
        사용자를 삭제합니다. (비활성화)
        실제로 데이터베이스에서 삭제하지 않고 비활성화합니다.
        """
        user_id = request.data.get('user_id')
        if not user_id:
            return Response({
                "success": False,
                "error": "사용자 ID가 필요합니다."
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            user = User.objects.get(id=user_id)
            
            # 실제 삭제 대신 비활성화
            user.is_active = False
            user.save()
            
            return Response({
                "success": True,
                "message": f"사용자 {user.nickname or user.phone}가 비활성화되었습니다."
            }, status=status.HTTP_200_OK)
        except User.DoesNotExist:
            return Response({
                "success": False,
                "error": "해당 사용자를 찾을 수 없습니다."
            }, status=status.HTTP_404_NOT_FOUND)
                          
    @action(detail=False, methods=['get'])
    def get_all_users(self, request):
        """
        모든 사용자 목록을 조회합니다. role 파라미터(ADMIN, STORE_OWNER, USER)로 필터링 가능
        ADMIN: is_superuser=True 또는 role='ADMIN'
        STORE_OWNER(매장관리자)): is_store_owner=True 또는 role='STORE_OWNER'
        USER: is_superuser=False, is_store_owner=False, role='USER'
        """
        role = request.query_params.get('role')
        users = User.objects.all()
        if role == 'ADMIN':
            users = users.filter(Q(is_superuser=True) | Q(role='ADMIN'))
        elif role == 'STORE_OWNER':
            users = users.filter(Q(is_store_owner=True) | Q(role='STORE_OWNER'))
        elif role == 'USER':
            users = users.filter(Q(is_superuser=False) & Q(is_store_owner=False) & Q(role='USER'))
        serializer = UserSerializer(users, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def get_user_stats(self, request):
        """
        사용자 통계 정보를 조회합니다.
        """
        users = User.objects.annotate(
            tournaments_count=Count('tournament_registrations'),
            checked_in_count=Count('tournament_registrations', filter=Q(tournament_registrations__checked_in=True)),
            last_tournament=Max('tournament_registrations__registered_at')
        )
        
        stats = []
        for user in users:
            total_spent = sum(reg.paid_amount for reg in user.tournament_registrations.all() if reg.paid_amount)
            stats.append({
                'phone': user.phone,
                'email': user.email,
                'tournaments_count': user.tournaments_count,
                'checked_in_count': user.checked_in_count,
                'total_spent': float(total_spent) if total_spent else 0,
                'last_tournament': user.last_tournament,
                'is_active': user.is_active
            })
            
        return Response(stats)
    
    @action(detail=False, methods=['post'])
    def get_user_by_phone(self, request):
        """
        전화번호로 사용자 정보를 조회합니다.
        """
        phone = request.data.get('phone')
        if not phone:
            return Response(
                {"error": "전화번호가 필요합니다."},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        try:
            user = User.objects.get(phone=phone)
            serializer = UserSerializer(user)
            return Response(serializer.data)
        except User.DoesNotExist:
            return Response(
                {"error": "해당 전화번호로 등록된 사용자를 찾을 수 없습니다."},
                status=status.HTTP_404_NOT_FOUND
            )
    
    @action(detail=False, methods=['get'], url_path='check_phone')
    def check_phone(self, request):
        """
        전화번호 중복 확인 API
        """
        try:
            phone = request.GET.get('phone')
            
            if not phone:
                return Response({
                    'error': '전화번호가 필요합니다.'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # 전화번호 형식 검증 및 정규화
            clean_phone = ''.join(filter(str.isdigit, phone))
            if len(clean_phone) != 11 or not clean_phone.startswith('010'):
                return Response({
                    'error': '올바른 전화번호 형식이 아닙니다.'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            formatted_phone = f"{clean_phone[:3]}-{clean_phone[3:7]}-{clean_phone[7:]}"
              # 사용자 존재 여부 확인
            exists = User.objects.filter(phone=formatted_phone).exists()
            
            return Response({
                'exists': exists,
                'is_available': not exists,  # 프론트엔드 호환성을 위해 추가
                'phone': formatted_phone
            })
            
        except Exception as e:
            api_logger.error(f"전화번호 확인 중 오류: {str(e)}")
            return Response({
                'error': f'전화번호 확인 중 오류가 발생했습니다: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=False, methods=['get'], url_path='check_nickname')
    def check_nickname(self, request):
        """
        닉네임 중복 확인 API
        """
        try:
            nickname = request.GET.get('nickname')
            
            if not nickname:
                return Response({
                    'error': '닉네임이 필요합니다.'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # 닉네임 길이 검증
            if len(nickname.strip()) < 2:
                return Response({
                    'error': '닉네임은 2자 이상이어야 합니다.'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            if len(nickname.strip()) > 20:
                return Response({
                    'error': '닉네임은 20자 이하여야 합니다.'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # 닉네임 존재 여부 확인
            exists = User.objects.filter(nickname=nickname.strip()).exists()
            
            return Response({
                'exists': exists,
                'is_available': not exists,  # 프론트엔드 호환성을 위해 추가
                'nickname': nickname.strip()
            })
            
        except Exception as e:
            api_logger.error(f"닉네임 확인 중 오류: {str(e)}")
            return Response({
                'error': f'닉네임 확인 중 오류가 발생했습니다: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=False, methods=['post'], url_path='create_guest_user')
    def create_guest_user(self, request):
        """
        게스트 사용자 생성 API
        - 최소한의 정보로 게스트 사용자를 생성합니다.
        - 닉네임은 자동 생성되거나 사용자가 입력할 수 있습니다.
        """
        try:
            # 요청 데이터 추출
            nickname = request.data.get('nickname', '').strip()
            memo = request.data.get('memo', '').strip()
            expires_days = request.data.get('expires_days', 30)  # 기본 30일
            
            # 게스트 닉네임 자동 생성 (닉네임이 없는 경우)
            if not nickname:
                import random
                import string
                # "게스트_랜덤5자리" 형태로 생성
                random_suffix = ''.join(random.choices(string.ascii_uppercase + string.digits, k=5))
                nickname = f"게스트_{random_suffix}"
            
            # 닉네임 중복 확인 (게스트 사용자 간)
            counter = 1
            original_nickname = nickname
            while User.objects.filter(nickname=nickname, role='GUEST').exists():
                nickname = f"{original_nickname}_{counter}"
                counter += 1
            
            # 게스트 전용 임시 전화번호 생성 (중복되지 않는 임시번호)
            import time
            timestamp = str(int(time.time()))[-8:]  # 타임스탬프 뒤 8자리
            guest_phone = f"999-{timestamp[:4]}-{timestamp[4:]}"
            
            # 전화번호 중복 확인
            counter = 1
            original_phone = guest_phone
            while User.objects.filter(phone=guest_phone).exists():
                guest_phone = f"999-{timestamp[:4]}-{str(int(timestamp[4:]) + counter).zfill(4)}"
                counter += 1
            
            # 게스트 전용 임시 이메일 생성
            guest_email = f"guest_{timestamp}@guest.temp"
            
            # 만료일 계산
            from datetime import datetime, timedelta
            expires_at = datetime.now() + timedelta(days=int(expires_days))
            
            # 게스트 사용자 생성
            guest_user = User.objects.create(
                phone=guest_phone,
                nickname=nickname,
                email=guest_email,
                role='GUEST',
                is_active=True,
                is_verified=True,  # 게스트는 즉시 사용 가능
                first_name=memo if memo else '게스트',  # 메모를 first_name에 임시 저장
                # 게스트는 비밀번호 없이 생성 (필요시 임시 비밀번호 설정)
            )
            
            # 임시 비밀번호 설정 (시스템에서 자동 생성)
            temp_password = f"guest{timestamp}"
            guest_user.set_password(temp_password)
            guest_user.save()
            
            api_logger.info(f"게스트 사용자 생성 완료: {guest_user.nickname} (ID: {guest_user.id})")
            
            # 생성된 게스트 사용자 정보 반환
            return Response({
                'success': True,
                'message': '게스트 사용자가 성공적으로 생성되었습니다.',
                'guest_user': {
                    'id': guest_user.id,
                    'nickname': guest_user.nickname,
                    'phone': guest_user.phone,
                    'email': guest_user.email,
                    'role': guest_user.role,
                    'memo': memo,
                    'expires_days': expires_days,
                    'created_at': guest_user.created_at.isoformat(),
                    'temp_password': temp_password  # 개발용 - 실제 운영시에는 제거 필요
                }
            }, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            api_logger.error(f"게스트 사용자 생성 중 오류: {str(e)}")
            return Response({
                'success': False,
                'error': f'게스트 사용자 생성 중 오류가 발생했습니다: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=False, methods=['get'], url_path='my_qr_code')
    def get_my_qr_code(self, request):
        """
        현재 로그인한 사용자의 QR 코드를 조회합니다.
        """
        try:
            user = request.user
            
            if not user.is_authenticated:
                return Response({
                    'error': '로그인이 필요합니다.'
                }, status=status.HTTP_401_UNAUTHORIZED)
            
            # QR 코드가 없으면 생성
            if not user.qr_code:
                user.generate_qr_code()
            
            # QR 코드 URL 생성
            qr_code_url = request.build_absolute_uri(user.qr_code.url) if user.qr_code else None
            
            return Response({
                'success': True,
                'user_info': {
                    'id': user.id,
                    'phone': user.phone,
                    'nickname': user.nickname,
                    'email': user.email,
                    'qr_code_uuid': str(user.qr_code_uuid),
                    'qr_code_url': qr_code_url
                }
            })
            
        except Exception as e:
            api_logger.error(f"QR 코드 조회 중 오류: {str(e)}")
            return Response({
                'error': f'QR 코드 조회 중 오류가 발생했습니다: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=False, methods=['post'], url_path='scan_qr_code')
    def scan_qr_code(self, request):
        """
        QR 코드를 스캔하여 사용자 정보를 조회합니다.
        매장관리자가 사용하는 API입니다.
        """
        try:
            # 매장관리자 권한 확인
            if not request.user.is_authenticated:
                return Response({
                    'error': '로그인이 필요합니다.'
                }, status=status.HTTP_401_UNAUTHORIZED)
            
            if not request.user.is_store_owner:
                return Response({
                    'error': '매장관리자 권한이 필요합니다.'
                }, status=status.HTTP_403_FORBIDDEN)
            
            # QR 코드 데이터 추출
            qr_data = request.data.get('qr_data', '').strip()
            
            if not qr_data:
                return Response({
                    'error': 'QR 코드 데이터가 필요합니다.'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # QR 코드 데이터 파싱 (예: "user_id:13,uuid:abc123...")
            try:
                parts = qr_data.split(',')
                user_id = None
                uuid_str = None
                
                for part in parts:
                    if part.startswith('user_id:'):
                        user_id = int(part.split(':')[1])
                    elif part.startswith('uuid:'):
                        uuid_str = part.split(':')[1]
                
                if not user_id or not uuid_str:
                    raise ValueError("Invalid QR code format")
                    
            except (ValueError, IndexError) as e:
                return Response({
                    'error': '올바르지 않은 QR 코드 형식입니다.'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # 사용자 조회
            try:
                user = User.objects.get(id=user_id, qr_code_uuid=uuid_str)
            except User.DoesNotExist:
                return Response({
                    'error': '유효하지 않은 QR 코드입니다.'
                }, status=status.HTTP_404_NOT_FOUND)
            
            # 사용자 정보 반환
            return Response({
                'success': True,
                'user_info': {
                    'id': user.id,
                    'phone': user.phone,
                    'nickname': user.nickname,
                    'email': user.email,
                    'role': user.role,
                    'is_active': user.is_active,
                    'created_at': user.created_at.isoformat()
                }
            })
            
        except Exception as e:
            api_logger.error(f"QR 코드 스캔 중 오류: {str(e)}")
            return Response({
                'error': f'QR 코드 스캔 중 오류가 발생했습니다: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR) 