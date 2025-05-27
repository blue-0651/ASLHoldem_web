from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from seats.models import SeatTicket
from tournaments.models import Tournament
from stores.models import Store
from decimal import Decimal
import random
from django.utils import timezone

User = get_user_model()

class Command(BaseCommand):
    help = '토너먼트, 사용자, 매장 데이터를 활용해 SeatTicket 100개 샘플 생성'

    def handle(self, *args, **options):
        tournaments = list(Tournament.objects.all())
        users = list(User.objects.all())
        stores = list(Store.objects.all())
        if not tournaments or not users or not stores:
            self.stdout.write(self.style.ERROR('토너먼트, 사용자, 매장 데이터가 충분하지 않습니다.'))
            return

        status_choices = [s[0] for s in SeatTicket.STATUS_CHOICES]
        source_choices = [s[0] for s in SeatTicket.SOURCE_CHOICES]
        created_count = 0
        for i in range(100):
            tournament = random.choice(tournaments)
            user = random.choice(users)
            store = random.choice(stores)
            status = random.choices(status_choices, weights=[7,2,1,1])[0]  # ACTIVE 비율 높게
            source = random.choice(source_choices)
            amount = Decimal(random.choice([0, 10000, 20000, 30000, 50000]))
            used_at = timezone.now() if status == 'USED' else None
            ticket = SeatTicket.objects.create(
                tournament=tournament,
                user=user,
                store=store,
                status=status,
                source=source,
                amount=amount,
                used_at=used_at
            )
            created_count += 1
            self.stdout.write(f"{created_count} - {user.phone} / {tournament.name} / {store.name} / {status} / {source}")
        self.stdout.write(self.style.SUCCESS(f'SeatTicket 100개 샘플 생성 완료!')) 