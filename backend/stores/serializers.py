from rest_framework import serializers
from .models import Store, Banner


class StoreSerializer(serializers.ModelSerializer):
    """매장 정보 시리얼라이저"""
    
    class Meta:
        model = Store
        fields = [
            'id', 'name', 'owner', 'address', 'description', 'image',
            'status', 'latitude', 'longitude', 'phone_number',
            'open_time', 'close_time', 'manager_name', 'manager_phone',
            'max_capacity', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class BannerSerializer(serializers.ModelSerializer):
    """배너 정보 시리얼라이저"""
    store_name = serializers.SerializerMethodField()
    
    class Meta:
        model = Banner
        fields = [
            'id', 'store', 'store_name', 'image', 'title', 'description',
            'start_date', 'end_date', 'is_active', 'is_main_tournament', 'is_store_gallery', 'is_main_selected', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']
    
    def get_store_name(self, obj):
        """매장명 반환 - 매장이 없으면 '전체'로 표시"""
        if obj.store:
            return obj.store.name
        return "전체"
    
    def to_representation(self, instance):
        """시리얼라이저의 출력 표현을 커스터마이징"""
        representation = super().to_representation(instance)
        
        # 이미지 URL을 완전한 URL로 변환
        if instance.image:
            request = self.context.get('request')
            if request:
                # request 객체가 있으면 build_absolute_uri 사용
                representation['image'] = request.build_absolute_uri(instance.image.url)
            else:
                # request 객체가 없으면 상대 경로 반환 (기본 동작)
                representation['image'] = instance.image.url
        else:
            representation['image'] = None
            
        return representation


class StoreCreateSerializer(serializers.ModelSerializer):
    """매장 생성용 시리얼라이저"""
    
    class Meta:
        model = Store
        fields = [
            'name', 'owner', 'address', 'description', 'image',
            'status', 'latitude', 'longitude', 'phone_number',
            'open_time', 'close_time', 'manager_name', 'manager_phone',
            'max_capacity'
        ]
        
    def validate_name(self, value):
        """매장명 유효성 검증"""
        if not value or not value.strip():
            raise serializers.ValidationError("매장명은 필수 입력 사항입니다.")
        
        # 매장명 중복 검사
        if Store.objects.filter(name=value.strip()).exists():
            raise serializers.ValidationError("이미 존재하는 매장명입니다.")
        
        return value.strip()
    
    def validate_address(self, value):
        """매장 주소 유효성 검증"""
        if not value or not value.strip():
            raise serializers.ValidationError("매장 주소는 필수 입력 사항입니다.")
        
        return value.strip()
    
    def validate_phone_number(self, value):
        """전화번호 유효성 검증"""
        if value and not value.strip():
            return None
        
        if value:
            # 전화번호 형식 간단 검증
            import re
            phone_pattern = r'^(\d{2,3}-?\d{3,4}-?\d{4})$'
            if not re.match(phone_pattern, value.strip()):
                raise serializers.ValidationError("올바른 전화번호 형식을 입력해주세요.")
        
        return value.strip() if value else None
    
    def validate_max_capacity(self, value):
        """최대 수용 인원 유효성 검증"""
        if value and (value < 1 or value > 1000):
            raise serializers.ValidationError("최대 수용 인원은 1명 이상 1000명 이하로 설정해주세요.")
        
        return value
    
    def create(self, validated_data):
        """매장 생성"""
        # 생성 시 기본값 설정
        if 'status' not in validated_data:
            validated_data['status'] = 'ACTIVE'
        
        return Store.objects.create(**validated_data)


class StoreUpdateSerializer(serializers.ModelSerializer):
    """매장 수정용 시리얼라이저"""
    
    class Meta:
        model = Store
        fields = [
            'name', 'owner', 'address', 'description', 'image',
            'status', 'latitude', 'longitude', 'phone_number',
            'open_time', 'close_time', 'manager_name', 'manager_phone',
            'max_capacity'
        ]
        
    def validate_name(self, value):
        """매장명 유효성 검증"""
        if not value or not value.strip():
            raise serializers.ValidationError("매장명은 필수 입력 사항입니다.")
        
        # 매장명 중복 검사 (현재 매장 제외)
        if Store.objects.filter(name=value.strip()).exclude(pk=self.instance.pk).exists():
            raise serializers.ValidationError("이미 존재하는 매장명입니다.")
        
        return value.strip()
    
    def validate_address(self, value):
        """매장 주소 유효성 검증"""
        if not value or not value.strip():
            raise serializers.ValidationError("매장 주소는 필수 입력 사항입니다.")
        
        return value.strip()
    
    def validate_phone_number(self, value):
        """전화번호 유효성 검증"""
        if value and not value.strip():
            return None
        
        if value:
            # 전화번호 형식 간단 검증
            import re
            phone_pattern = r'^(\d{2,3}-?\d{3,4}-?\d{4})$'
            if not re.match(phone_pattern, value.strip()):
                raise serializers.ValidationError("올바른 전화번호 형식을 입력해주세요.")
        
        return value.strip() if value else None
    
    def validate_max_capacity(self, value):
        """최대 수용 인원 유효성 검증"""
        if value and (value < 1 or value > 1000):
            raise serializers.ValidationError("최대 수용 인원은 1명 이상 1000명 이하로 설정해주세요.")
        
        return value
    
    def update(self, instance, validated_data):
        """매장 정보 수정"""
        # 매장 정보 업데이트
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        
        instance.save()
        return instance 