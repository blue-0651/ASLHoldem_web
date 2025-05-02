from rest_framework import serializers
from .models import Tournament, TournamentRegistration
from django.contrib.auth import get_user_model

User = get_user_model()

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email']

class TournamentSerializer(serializers.ModelSerializer):
    store_name = serializers.CharField(source='store.name', read_only=True)
    ticket_quantity = serializers.IntegerField(source='max_seats', read_only=False)
    
    class Meta:
        model = Tournament
        fields = ['id', 'store', 'store_name', 'name', 'start_time', 'buy_in', 
                  'ticket_quantity', 'description', 'status', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']

class TournamentRegistrationSerializer(serializers.ModelSerializer):
    tournament_name = serializers.CharField(source='tournament.name', read_only=True)
    tournament_start_time = serializers.DateTimeField(source='tournament.start_time', read_only=True)
    tournament_status = serializers.CharField(source='tournament.status', read_only=True)
    store_name = serializers.CharField(source='tournament.store.name', read_only=True)
    username = serializers.CharField(source='user.username', read_only=True)
    
    class Meta:
        model = TournamentRegistration
        fields = ['id', 'tournament', 'tournament_name', 'tournament_start_time', 
                  'tournament_status', 'user', 'username', 'store_name',
                  'paid_amount', 'registered_at', 'checked_in', 'checked_in_at', 'has_ticket']
        read_only_fields = ['id', 'registered_at', 'checked_in_at']

class TournamentParticipantsCountSerializer(serializers.Serializer):
    tournament_name = serializers.CharField(required=True, help_text="조회할 토너먼트 이름")

class TournamentRegistrationSearchSerializer(serializers.Serializer):
    username = serializers.CharField(required=False, help_text="검색할 사용자 이름")
    tournament_name = serializers.CharField(required=False, help_text="검색할 토너먼트 이름")

class TournamentRegistrationIDSerializer(serializers.Serializer):
    registration_id = serializers.IntegerField(required=True, help_text="등록 ID")
    
class TournamentIDSerializer(serializers.Serializer):
    tournament_id = serializers.IntegerField(required=True, help_text="토너먼트 ID")

class TournamentParticipantsResponseSerializer(serializers.Serializer):
    tournament_id = serializers.IntegerField(read_only=True)
    tournament_name = serializers.CharField(read_only=True)
    start_time = serializers.DateTimeField(read_only=True)
    status = serializers.CharField(read_only=True)
    ticket_quantity = serializers.IntegerField(source='max_seats', read_only=True)
    participant_count = serializers.IntegerField(read_only=True)
    remaining_tickets = serializers.IntegerField(read_only=True) 