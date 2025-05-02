from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from rest_framework.decorators import action
import datetime

from tournaments.models import Tournament, TournamentRegistration
from tournaments.serializers import (
    TournamentRegistrationSerializer, TournamentRegistrationSearchSerializer,
    TournamentRegistrationIDSerializer, TournamentIDSerializer
)

class TournamentRegistrationViewSet(viewsets.ModelViewSet):
    """
    토너먼트 등록 관리를 위한 API 뷰셋
    """
    queryset = TournamentRegistration.objects.all()
    serializer_class = TournamentRegistrationSerializer
    permission_classes = [permissions.AllowAny]
    
    def get_queryset(self):
        return TournamentRegistration.objects.all().select_related(
            'tournament', 'tournament__store', 'user'
        )
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
    
    @action(detail=False, methods=['post'])
    def my_registrations(self, request):
        """
        현재 로그인한 사용자가 참가한 모든 토너먼트 등록 정보를 반환합니다.
        """
        registrations = TournamentRegistration.objects.filter(
            user=request.user
        ).select_related('tournament', 'tournament__store')
        
        serializer = TournamentRegistrationSerializer(registrations, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['post'])
    def tournament_registrations(self, request):
        """
        특정 토너먼트의 모든 등록 정보를 반환합니다.
        """
        serializer = TournamentIDSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        tournament_id = serializer.validated_data['tournament_id']
        
        try:
            tournament = Tournament.objects.get(id=tournament_id)
            registrations = TournamentRegistration.objects.filter(tournament=tournament).select_related(
                'user'
            )
            
            registration_serializer = TournamentRegistrationSerializer(registrations, many=True)
            return Response(registration_serializer.data)
        except Tournament.DoesNotExist:
            return Response({"error": "해당 토너먼트를 찾을 수 없습니다."}, 
                          status=status.HTTP_404_NOT_FOUND)
    
    @action(detail=False, methods=['post'])
    def search(self, request):
        """
        특정 사용자의 특정 토너먼트 참가 정보를 검색합니다.
        """
        serializer = TournamentRegistrationSearchSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        username = serializer.validated_data.get('username')
        tournament_name = serializer.validated_data.get('tournament_name')
        
        if not username and not tournament_name:
            return Response({"error": "사용자 이름 또는 토너먼트 이름이 필요합니다."}, 
                           status=status.HTTP_400_BAD_REQUEST)
        
        query = TournamentRegistration.objects.all().select_related(
            'tournament', 'tournament__store', 'user'
        )
        
        if username:
            query = query.filter(user__username=username)
        
        if tournament_name:
            query = query.filter(tournament__name=tournament_name)
        
        registration_serializer = TournamentRegistrationSerializer(query, many=True)
        return Response(registration_serializer.data)
    
    @action(detail=False, methods=['post'])
    def update_registration(self, request):
        """
        토너먼트 등록 정보를 업데이트합니다.
        """
        serializer = TournamentRegistrationIDSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        registration_id = serializer.validated_data['registration_id']
        
        try:
            registration = TournamentRegistration.objects.get(id=registration_id)
            
            update_serializer = TournamentRegistrationSerializer(
                registration, data=request.data, partial=True
            )
            
            if update_serializer.is_valid():
                # 체크인 상태 변경
                checked_in = update_serializer.validated_data.get('checked_in', None)
                if checked_in is not None and checked_in != registration.checked_in and checked_in:
                    update_serializer.validated_data['checked_in_at'] = datetime.datetime.now()
                
                # 저장
                update_serializer.save()
                return Response(update_serializer.data)
            return Response(update_serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except TournamentRegistration.DoesNotExist:
            return Response({"error": "해당 등록 정보를 찾을 수 없습니다."}, 
                          status=status.HTTP_404_NOT_FOUND) 