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
    store_name = serializers.CharField(source='store.name', read_only=True)
    
    class Meta:
        model = Banner
        fields = [
            'id', 'store', 'store_name', 'image', 'title', 'description',
            'start_date', 'end_date', 'is_active', 'is_main_tournament', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']


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


class StoreUpdateSerializer(serializers.ModelSerializer):
    """매장 수정용 시리얼라이저"""
    
    class Meta:
        model = Store
        fields = [
            'name', 'address', 'description', 'image',
            'status', 'latitude', 'longitude', 'phone_number',
            'open_time', 'close_time', 'manager_name', 'manager_phone',
            'max_capacity'
        ] 