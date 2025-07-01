from django.contrib import admin
from stores.models import Banner, Store


@admin.register(Banner)
class BannerAdmin(admin.ModelAdmin):
    list_display = ['title', 'store', 'is_active', 'is_main_tournament', 'start_date', 'end_date', 'created_at']
    list_filter = ['is_active', 'is_main_tournament', 'store', 'created_at']
    search_fields = ['title', 'description', 'store__name']
    list_editable = ['is_active', 'is_main_tournament']
    readonly_fields = ['created_at']
    ordering = ['-created_at']
    
    fieldsets = (
        ('기본 정보', {
            'fields': ('title', 'description', 'store', 'image')
        }),
        ('설정', {
            'fields': ('is_active', 'is_main_tournament')
        }),
        ('기간 설정', {
            'fields': ('start_date', 'end_date')
        }),
        ('시스템', {
            'fields': ('created_at',),
            'classes': ('collapse',)
        }),
    )
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('store')


@admin.register(Store)
class StoreAdmin(admin.ModelAdmin):
    list_display = ['name', 'owner', 'status', 'address', 'phone_number', 'created_at']
    list_filter = ['status', 'created_at']
    search_fields = ['name', 'address', 'owner__username']
    readonly_fields = ['created_at', 'updated_at']
    ordering = ['-created_at']
