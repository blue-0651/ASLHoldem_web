from django.core.management.base import BaseCommand
from stores.models import Store
from django.contrib.auth import get_user_model

class Command(BaseCommand):
    help = 'ASL Poker 매장 10개 더미 데이터 생성'

    def handle(self, *args, **options):
        User = get_user_model()
        try:
            owner = User.objects.get(id=1)
        except User.DoesNotExist:
            self.stdout.write(self.style.ERROR('owner id=1 유저가 존재하지 않습니다.'))
            return

        for i in range(1, 11):
            store, created = Store.objects.get_or_create(
                name=f'ASL Poker Store {i}',
                defaults={
                    'owner': owner,
                    'address': f'서울시 강남구 {i}번지',
                    'description': f'프리미엄 홀덤 매장 {i}',
                    'status': 'ACTIVE',
                    'latitude': 37.1234 + i * 0.0001,
                    'longitude': 127.1234 + i * 0.0001,
                }
            )
            if created:
                self.stdout.write(self.style.SUCCESS(f'{store.name} 생성'))
            else:
                self.stdout.write(self.style.WARNING(f'{store.name} 이미 존재')) 