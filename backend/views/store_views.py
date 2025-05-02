from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from rest_framework.decorators import action
from django.db.models import Count, Q, Max, Sum

from tournaments.models import Tournament, TournamentRegistration
from stores.models import Store
from django.contrib.auth import get_user_model
from rest_framework import serializers

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
        fields = ['id', 'username', 'email', 'tournament_count', 'last_visit']

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
    
    @action(detail=True, methods=['post'])
    def users(self, request, pk=None):
        """
        특정 매장에 방문한 사용자 목록을 반환합니다.
        """
        try:
            store = Store.objects.get(pk=pk)
            
            # 해당 매장의 모든 토너먼트 ID를 가져옵니다
            tournament_ids = Tournament.objects.filter(store=store).values_list('id', flat=True)
            
            if not tournament_ids:
                return Response({"message": "해당 매장에 등록된 토너먼트가 없습니다."}, 
                              status=status.HTTP_200_OK)
            
            # 해당 토너먼트에 참가한 사용자들을 가져옵니다
            user_data = TournamentRegistration.objects.filter(
                tournament_id__in=tournament_ids
            ).values(
                'user'
            ).annotate(
                tournament_count=Count('tournament', distinct=True),
                last_visit=Max('registered_at')
            ).order_by('-last_visit')
            
            # 사용자 ID 목록을 추출합니다
            user_ids = [item['user'] for item in user_data]
            
            # 사용자 정보를 가져옵니다
            users = User.objects.filter(id__in=user_ids)
            
            # 사용자별 토너먼트 참가 횟수와 마지막 방문 정보를 추가합니다
            user_dict = {user.id: user for user in users}
            result_users = []
            
            for item in user_data:
                user = user_dict.get(item['user'])
                if user:
                    user.tournament_count = item['tournament_count']
                    user.last_visit = item['last_visit']
                    result_users.append(user)
            
            serializer = StoreUserSerializer(result_users, many=True)
            return Response(serializer.data)
            
        except Store.DoesNotExist:
            return Response({"error": "해당 매장을 찾을 수 없습니다."}, 
                          status=status.HTTP_404_NOT_FOUND)
    
    @action(detail=False, methods=['post'])
    def search_user_by_store(self, request):
        """
        매장 이름과 사용자 이름으로 검색합니다.
        """
        store_name = request.data.get('store_name')
        username = request.data.get('username')
        
        if not store_name and not username:
            return Response({"error": "매장 이름 또는 사용자 이름이 필요합니다."}, 
                           status=status.HTTP_400_BAD_REQUEST)
        
        # 매장을 검색합니다
        store_query = Q()
        if store_name:
            store_query &= Q(name__icontains=store_name)
        
        stores = Store.objects.filter(store_query)
        if not stores:
            return Response({"message": "해당 조건의 매장을 찾을 수 없습니다."}, 
                          status=status.HTTP_200_OK)
        
        # 해당 매장의 토너먼트 목록을 가져옵니다
        tournament_ids = Tournament.objects.filter(store__in=stores).values_list('id', flat=True)
        
        # 사용자 검색 조건을 추가합니다
        user_query = Q(tournament_id__in=tournament_ids)
        if username:
            users = User.objects.filter(username__icontains=username).values_list('id', flat=True)
            user_query &= Q(user_id__in=users)
        
        # 해당 매장의 토너먼트에 참가한 사용자들을 가져옵니다
        registrations = TournamentRegistration.objects.filter(user_query).select_related(
            'user', 'tournament', 'tournament__store'
        )
        
        # 결과를 그룹화하여 반환합니다
        result = []
        for reg in registrations:
            result.append({
                'user_id': reg.user.id,
                'username': reg.user.username,
                'email': reg.user.email,
                'store_id': reg.tournament.store.id,
                'store_name': reg.tournament.store.name,
                'tournament_id': reg.tournament.id,
                'tournament_name': reg.tournament.name,
                'registered_at': reg.registered_at.isoformat() if reg.registered_at else None,
            })
        
        return Response(result)
        
    @action(detail=True, methods=['get'])
    def tournament_tickets(self, request, pk=None):
        """
        특정 매장의 토너먼트 좌석권 정보를 반환합니다.
        """
        try:
            store = Store.objects.get(pk=pk)
            
            # 해당 매장의 모든 토너먼트를 가져옵니다
            tournaments = Tournament.objects.filter(store=store).order_by('-start_time')
            
            result = {
                'store_name': store.name,
                'store_id': store.id,
                'tournaments': []
            }
            
            for tournament in tournaments:
                # 토너먼트별 좌석권 배포 현황
                registrations = TournamentRegistration.objects.filter(
                    tournament=tournament
                ).select_related('user')
                
                # 선수별 좌석권 현황
                player_tickets = []
                for reg in registrations:
                    player_tickets.append({
                        '선수명': reg.user.username,
                        '배포_일시': reg.registered_at.strftime('%Y-%m-%d %H:%M'),
                        '좌석권_상태': '사용 완료' if reg.checked_in else '사용 가능'
                    })
                
                # 토너먼트 정보
                tournament_info = {
                    '토너먼트_id': tournament.id,
                    '토너먼트명': tournament.name,
                    '시작_시간': tournament.start_time.strftime('%Y-%m-%d %H:%M'),
                    '총_좌석권_수량': tournament.max_seats,
                    '배포된_좌석권_수량': registrations.count(),
                    '남은_좌석권_수량': tournament.max_seats - registrations.count(),
                    '선수별_좌석권': player_tickets
                }
                
                result['tournaments'].append(tournament_info)
            
            return Response(result)
            
        except Store.DoesNotExist:
            return Response({"error": "해당 매장을 찾을 수 없습니다."}, 
                          status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

from django.db import models 