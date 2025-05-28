from rest_framework import serializers
from .models import Tournament
from django.contrib.auth import get_user_model

User = get_user_model()

class UserSerializer(serializers.ModelSerializer):
    nickname = serializers.CharField(required=False, allow_null=True, allow_blank=True)
    class Meta:
        model = User
        fields = ['id', 'phone', 'nickname', 'email']

class TournamentSerializer(serializers.ModelSerializer):
    ticket_quantity = serializers.IntegerField(read_only=False)
    
    class Meta:
        model = Tournament
        fields = ['id', 'name', 'start_time', 'buy_in', 
                  'ticket_quantity', 'description', 'status', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']



class TournamentParticipantsCountSerializer(serializers.Serializer):
    tournament_name = serializers.CharField(max_length=100)


    
class TournamentIDSerializer(serializers.Serializer):
    tournament_id = serializers.IntegerField(required=True, help_text="토너먼트 ID")

class TournamentParticipantsResponseSerializer(serializers.Serializer):
    tournament_id = serializers.IntegerField(read_only=True)
    tournament_name = serializers.CharField(read_only=True)
    start_time = serializers.DateTimeField(read_only=True)
    status = serializers.CharField(read_only=True)
    ticket_quantity = serializers.IntegerField(read_only=True)
    participant_count = serializers.IntegerField(read_only=True)
    remaining_tickets = serializers.IntegerField(read_only=True) 