from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from rest_framework.decorators import action
from django.contrib.auth import get_user_model
from rest_framework import serializers
from django.db.models import Q, Count, Max
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

from tournaments.models import TournamentRegistration, Tournament

User = get_user_model()

# 매장 관리자용 토큰 시리얼라이저
class StoreManagerTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        
        # 매장 관리자인지 확인 (is_store_owner 필드 사용)
        if not user.is_store_owner:
            raise serializers.ValidationError({
                "detail": "매장 관리자 권한이 없습니다."
            })
        
        # 토큰에 추가 정보 담기
        token['user_type'] = 'store_manager'
        token['username'] = user.username
        token['email'] = user.email if user.email else ''
        token['is_store_owner'] = user.is_store_owner
        token['role'] = user.role
        
        return token

# 일반 사용자용 토큰 시리얼라이저
class UserTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        
        # 토큰에 추가 정보 담기
        token['user_type'] = 'regular_user'
        token['username'] = user.username
        token['email'] = user.email if user.email else ''
        
        return token

# 관리자용 토큰 시리얼라이저
class AdminTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        
        # 관리자 권한 확인
        if not user.is_staff:
            raise serializers.ValidationError({
                "detail": "관리자 권한이 없습니다."
            })
        
        # 토큰에 추가 정보 담기
        token['user_type'] = 'admin'
        token['username'] = user.username
        token['email'] = user.email if user.email else ''
        token['is_staff'] = user.is_staff
        token['is_superuser'] = user.is_superuser
        
        return token

# 매장 관리자용 토큰 뷰
class StoreManagerTokenObtainPairView(TokenObtainPairView):
    serializer_class = StoreManagerTokenObtainPairSerializer

# 일반 사용자용 토큰 뷰
class UserTokenObtainPairView(TokenObtainPairView):
    serializer_class = UserTokenObtainPairSerializer

# 관리자용 토큰 뷰
class AdminTokenObtainPairView(TokenObtainPairView):
    serializer_class = AdminTokenObtainPairSerializer

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
    password = serializers.CharField(write_only=True, required=False)
    tournament_registrations = UserRegistrationSerializer(source='tournament_registrations.all', many=True, read_only=True)
    total_registrations = serializers.SerializerMethodField()
    total_checked_in = serializers.SerializerMethodField()
    last_activity = serializers.SerializerMethodField()
    total_spent = serializers.SerializerMethodField()
    user_permissions_list = serializers.SerializerMethodField()
    groups_list = serializers.SerializerMethodField()
    phone = serializers.CharField(required=True)
    
    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name', 'password', 
            'is_active', 'is_staff', 'is_superuser', 'date_joined', 'last_login',
            'tournament_registrations', 'total_registrations', 'total_checked_in',
            'last_activity', 'total_spent', 'groups', 'groups_list',
            'user_permissions', 'user_permissions_list', 'phone'
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
        user = User.objects.create(**validated_data)
        
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
    username = serializers.CharField()
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
        username = request.data.get('username')
        
        # 사용자 ID나 사용자명 중 하나는 필요
        if not user_id and not username:
            return Response({"error": "사용자 ID 또는 사용자명이 필요합니다."}, 
                           status=status.HTTP_400_BAD_REQUEST)
        
        try:
            # ID로 조회
            if user_id:
                user = User.objects.get(id=user_id)
            # 사용자명으로 조회
            else:
                user = User.objects.get(username=username)
            
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
            
            return Response({"message": f"사용자 {user.username}가 비활성화되었습니다."}, 
                          status=status.HTTP_200_OK)
        except User.DoesNotExist:
            return Response({"error": "해당 사용자를 찾을 수 없습니다."}, 
                          status=status.HTTP_404_NOT_FOUND)
                          
    @action(detail=False, methods=['get'])
    def get_all_users(self, request):
        """
        모든 사용자 목록을 조회합니다.
        """
        users = User.objects.all()
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
                'username': user.username,
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