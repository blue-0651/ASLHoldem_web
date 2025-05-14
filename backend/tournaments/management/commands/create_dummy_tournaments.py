from django.core.management.base import BaseCommand
from tournaments.models import Tournament
from stores.models import Store
from django.utils import timezone, dateparse
import datetime

class Command(BaseCommand):
    help = 'ASL Poker 토너먼트 10개 더미 데이터 생성'

    def handle(self, *args, **options):
        try:
            store = Store.objects.get(id=1)
        except Store.DoesNotExist:
            self.stdout.write(self.style.ERROR('store id=1 매장이 존재하지 않습니다.'))
            return

        base_time = timezone.now().replace(hour=18, minute=0, second=0, microsecond=0)
        for i in range(1, 11):
            start_time = base_time + datetime.timedelta(days=i)
            tournament, created = Tournament.objects.get_or_create(
                name=f'ASL Poker Tournament {i}',
                defaults={
                    'store': store,
                    'start_time': start_time,
                    'buy_in': 50000 + i * 1000,
                    'ticket_quantity': 100 + i,
                    'description': f'프리미엄 홀덤 토너먼트 {i}',
                    'status': 'UPCOMING',
                }
            )
            if created:
                self.stdout.write(self.style.SUCCESS(f'{tournament.name} 생성'))
            else:
                self.stdout.write(self.style.WARNING(f'{tournament.name} 이미 존재')) 