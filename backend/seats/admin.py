from django.contrib import admin
from .models import SeatTicket, SeatTicketTransaction, UserSeatTicketSummary, TournamentTicketDistribution


@admin.register(SeatTicket)
class SeatTicketAdmin(admin.ModelAdmin):
    list_display = ['ticket_id', 'user_phone', 'tournament_name', 'status', 'source', 'amount', 'created_at']
    list_filter = ['status', 'source', 'tournament', 'created_at']
    search_fields = ['ticket_id', 'user__phone', 'user__nickname', 'tournament__name']
    readonly_fields = ['ticket_id', 'used_at', 'created_at', 'updated_at']
    
    def user_phone(self, obj):
        return obj.user.phone
    user_phone.short_description = '사용자 전화번호'
    
    def tournament_name(self, obj):
        return obj.tournament.name
    tournament_name.short_description = '토너먼트명'
    
    fieldsets = (
        ('기본 정보', {
            'fields': ('ticket_id', 'tournament', 'user', 'status', 'source')
        }),
        ('금액 정보', {
            'fields': ('amount',)
        }),
        ('시간 정보', {
            'fields': ('used_at', 'expires_at', 'created_at', 'updated_at')
        }),
        ('추가 정보', {
            'fields': ('memo',),
            'classes': ('collapse',)
        })
    )


@admin.register(SeatTicketTransaction)
class SeatTicketTransactionAdmin(admin.ModelAdmin):
    list_display = ['id', 'user_phone', 'tournament_name', 'transaction_type', 'quantity', 'amount', 'created_at']
    list_filter = ['transaction_type', 'created_at']
    search_fields = ['seat_ticket__user__phone', 'seat_ticket__tournament__name', 'reason']
    readonly_fields = ['created_at']
    
    def user_phone(self, obj):
        return obj.seat_ticket.user.phone
    user_phone.short_description = '사용자 전화번호'
    
    def tournament_name(self, obj):
        return obj.seat_ticket.tournament.name
    tournament_name.short_description = '토너먼트명'


@admin.register(UserSeatTicketSummary)
class UserSeatTicketSummaryAdmin(admin.ModelAdmin):
    list_display = ['user_phone', 'tournament_name', 'active_tickets', 'used_tickets', 'total_tickets', 'last_updated']
    list_filter = ['tournament', 'last_updated']
    search_fields = ['user__phone', 'user__nickname', 'tournament__name']
    readonly_fields = ['last_updated']
    
    def user_phone(self, obj):
        return obj.user.phone
    user_phone.short_description = '사용자 전화번호'
    
    def tournament_name(self, obj):
        return obj.tournament.name
    tournament_name.short_description = '토너먼트명'
    
    actions = ['update_summaries']
    
    def update_summaries(self, request, queryset):
        """선택된 요약 정보들을 업데이트합니다."""
        for summary in queryset:
            summary.update_summary()
        self.message_user(request, f"{queryset.count()}개의 요약 정보가 업데이트되었습니다.")
    update_summaries.short_description = "선택된 요약 정보 업데이트" 


@admin.register(TournamentTicketDistribution)
class TournamentTicketDistributionAdmin(admin.ModelAdmin):
    list_display = ['tournament_name', 'store_name', 'allocated_quantity', 'remaining_quantity', 'distributed_quantity', 'distribution_rate', 'created_at']
    list_filter = ['tournament', 'store', 'created_at']
    search_fields = ['tournament__name', 'store__name', 'memo']
    readonly_fields = ['created_at', 'updated_at']
    
    def tournament_name(self, obj):
        return obj.tournament.name
    tournament_name.short_description = '토너먼트명'
    
    def store_name(self, obj):
        return obj.store.name
    store_name.short_description = '매장명'
    
    def distribution_rate(self, obj):
        if obj.allocated_quantity > 0:
            rate = (obj.distributed_quantity / obj.allocated_quantity) * 100
            return f"{rate:.1f}%"
        return "0%"
    distribution_rate.short_description = '배포율'
    
    fieldsets = (
        ('기본 정보', {
            'fields': ('tournament', 'store')
        }),
        ('수량 정보', {
            'fields': ('allocated_quantity', 'remaining_quantity', 'distributed_quantity')
        }),
        ('시간 정보', {
            'fields': ('created_at', 'updated_at')
        }),
        ('추가 정보', {
            'fields': ('memo',),
            'classes': ('collapse',)
        })
    )
    
    actions = ['recalculate_quantities']
    
    def recalculate_quantities(self, request, queryset):
        """선택된 분배 정보의 수량을 재계산합니다."""
        updated_count = 0
        for distribution in queryset:
            # 실제 배포된 좌석권 수량을 계산하여 업데이트
            from seats.models import SeatTicket
            actual_distributed = SeatTicket.objects.filter(
                tournament=distribution.tournament,
                store=distribution.store
            ).count()
            
            if actual_distributed != distribution.distributed_quantity:
                distribution.distributed_quantity = actual_distributed
                distribution.remaining_quantity = distribution.allocated_quantity - actual_distributed
                distribution.save()
                updated_count += 1
        
        self.message_user(request, f"{updated_count}개의 분배 정보가 재계산되었습니다.")
    recalculate_quantities.short_description = "선택된 분배 정보 수량 재계산" 