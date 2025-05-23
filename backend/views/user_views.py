from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from rest_framework.decorators import action
from django.contrib.auth import get_user_model
from rest_framework import serializers
from django.db.models import Q, Count, Max
import logging
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

from tournaments.models import TournamentRegistration, Tournament

# API 로거 생성
api_logger = logging.getLogger('api')

User = get_user_model()

# 매장 관리자용 토큰 시리얼라이저
class StoreManagerTokenObtainPairSerializer(TokenObtainPairSerializer):
    username_field = 'phone'
    
    def validate(self, attrs):
        phone = attrs.get('phone')
        password = attrs.get('password')
        
        if not phone or not password:
            raise serializers.ValidationError("전화번호와 비밀번호가 필요합니다.")
        
        try:
            user = User.objects.get(phone=phone)
        except User.DoesNotExist:
            raise serializers.ValidationError("전화번호 또는 비밀번호가 올바르지 않습니다.")
        
        if not user.check_password(password):
            raise serializers.ValidationError("전화번호 또는 비밀번호가 올바르지 않습니다.")
        
        if not user.is_active:
            raise serializers.ValidationError("비활성화된 계정입니다.")
        
        if not user.is_store_owner:
            raise serializers.ValidationError("매장 관리자 권한이 없습니다.")
        
        # 직접 토큰 생성 (super().validate() 호출 제거)
        refresh = self.get_token(user)
        
        return {
            'refresh': str(refresh),
            'access': str(refresh.access_token),
        }
    
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token['user_type'] = 'store_manager'
        token['phone'] = user.phone
        token['nickname'] = user.nickname
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
        
        if not phone or not password:
            raise serializers.ValidationError("전화번호와 비밀번호가 필요합니다.")
        
        try:
            user = User.objects.get(phone=phone)
        except User.DoesNotExist:
            raise serializers.ValidationError("전화번호 또는 비밀번호가 올바르지 않습니다.")
        
        if not user.check_password(password):
            raise serializers.ValidationError("전화번호 또는 비밀번호가 올바르지 않습니다.")
        
        if not user.is_active:
            raise serializers.ValidationError("비활성화된 계정입니다.")
        
        # 직접 토큰 생성
        refresh = self.get_token(user)
        
        return {
            'refresh': str(refresh),
            'access': str(refresh.access_token),
        }
    
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token['user_type'] = 'regular_user'
        token['phone'] = user.phone
        token['nickname'] = user.nickname
        token['email'] = user.email if user.email else ''
        return token

# 관리자용 토큰 시리얼라이저
class AdminTokenObtainPairSerializer(TokenObtainPairSerializer):
    username_field = 'phone'
    
    def validate(self, attrs):
        phone = attrs.get('phone')
        password = attrs.get('password')
        
        if not phone or not password:
            raise serializers.ValidationError("전화번호와 비밀번호가 필요합니다.")
        
        try:
            user = User.objects.get(phone=phone)
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
        token['user_type'] = 'admin'
        token['phone'] = user.phone
        token['nickname'] = user.nickname
        token['email'] = user.email if user.email else ''
        token['is_staff'] = user.is_staff
        token['is_superuser'] = user.is_superuser
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

class UserRegistrationSerializer(serializers.ModelSerializer):
    """
    사용자의 토너먼트 등록 정보 시리얼라이저
    """
    tournament_name = serializers.CharField(source='tournament.name', read_only=True)
    tournament_start_time = serializers.DateTimeField(source='tournament.start_time', read_only=True)
    tournament_status = serializers.CharField(source='tournament.status', read_only=True)
    store_name = serializers.CharField(source='tournament.store.name', read_only=True)
    
    class Meta:
        model = TournamentRegistration
        fields = ['id', 'tournament', 'tournament_name', 'tournament_start_time', 'tournament_status',
                  'store_name', 'paid_amount', 'registered_at', 'checked_in', 'checked_in_at', 'has_ticket']

class UserSerializer(serializers.ModelSerializer):
    """
    사용자 정보를 위한 시리얼라이저 - 모든 필드 포함
    """
    nickname = serializers.CharField(required=False, allow_null=True, allow_blank=True)
    password = serializers.CharField(write_only=True, required=False)
    tournament_registrations = UserRegistrationSerializer(source='tournament_registrations.all', many=True, read_only=True)
    total_registrations = serializers.SerializerMethodField()
    total_checked_in = serializers.SerializerMethodField()
    last_activity = serializers.SerializerMethodField()
    total_spent = serializers.SerializerMethodField()
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
            'tournament_registrations', 'total_registrations', 'total_checked_in',
            'last_activity', 'total_spent', 'groups', 'groups_list',
            'user_permissions', 'user_permissions_list', 'is_store_owner',
            'birth_date', 'gender'
        ]
        read_only_fields = ['id', 'date_joined', 'last_login', 'tournament_registrations',
                           'total_registrations', 'total_checked_in', 'last_activity',
                           'total_spent', 'user_permissions_list', 'groups_list']
    
    def get_total_registrations(self, obj):
        return obj.tournament_registrations.count()
    
    def get_total_checked_in(self, obj):
        return obj.tournament_registrations.filter(checked_in=True).count()
    
    def get_last_activity(self, obj):
        latest_reg = obj.tournament_registrations.all().order_by('-registered_at').first()
        return latest_reg.registered_at if latest_reg else None
    
    def get_total_spent(self, obj):
        total = sum(reg.paid_amount for reg in obj.tournament_registrations.all() if reg.paid_amount)
        return float(total) if total else 0
    
    def get_user_permissions_list(self, obj):
        return [perm.codename for perm in obj.user_permissions.all()]
    
    def get_groups_list(self, obj):
        return [group.name for group in obj.groups.all()]
    
    def create(self, validated_data):
        # many-to-many 필드 추출
        groups = validated_data.pop('groups', None)
        user_permissions = validated_data.pop('user_permissions', None)
        password = validated_data.pop('password', None)
        is_store_owner = validated_data.pop('is_store_owner', False)
        user = User.objects.create(**validated_data)
        user.is_store_owner = is_store_owner
        if password:
            user.set_password(password)
        # many-to-many 필드 설정
        if groups is not None:
            user.groups.set(groups)
        if user_permissions is not None:
            user.user_permissions.set(user_permissions)
        user.save()
        return user
    
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
        serializer = UserSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
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
                return Response(serializer.data)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except User.DoesNotExist:
            return Response({"error": "해당 사용자를 찾을 수 없습니다."}, 
                          status=status.HTTP_404_NOT_FOUND)
    
    @action(detail=False, methods=['post'])
    def delete_user(self, request):
        """
        사용자를 삭제합니다. (비활성화)
        실제로 데이터베이스에서 삭제하지 않고 비활성화합니다.
        """
        user_id = request.data.get('user_id')
        if not user_id:
            return Response({"error": "사용자 ID가 필요합니다."}, 
                           status=status.HTTP_400_BAD_REQUEST)
        
        try:
            user = User.objects.get(id=user_id)
            
            # 실제 삭제 대신 비활성화
            user.is_active = False
            user.save()
            
            return Response({"message": f"사용자 {user.phone}가 비활성화되었습니다."}, 
                          status=status.HTTP_200_OK)
        except User.DoesNotExist:
            return Response({"error": "해당 사용자를 찾을 수 없습니다."}, 
                          status=status.HTTP_404_NOT_FOUND)
                          
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
        phone 중복 여부를 확인하는 API
        쿼리 파라미터로 phone을 전달하면 사용 가능 여부를 반환
        """
        phone = request.query_params.get('phone')
        if not phone:
            return Response({'error': 'phone 파라미터가 필요합니다.'}, status=status.HTTP_400_BAD_REQUEST)
        exists = User.objects.filter(phone=phone).exists()
        return Response({'phone': phone, 'is_available': not exists}) 