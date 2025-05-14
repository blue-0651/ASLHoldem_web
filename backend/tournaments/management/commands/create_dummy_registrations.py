from django.core.management.base import BaseCommand
from tournaments.models import Tournament, TournamentRegistration
from django.contrib.auth import get_user_model

class Command(BaseCommand):
    help = 'ASL Poker 토너먼트 참가(등록) 더미 데이터 10개 생성'

    def handle(self, *args, **options):
        User = get_user_model()
        try:
            user = User.objects.get(id=1)
        except User.DoesNotExist:
            self.stdout.write(self.style.ERROR('user id=1 유저가 존재하지 않습니다.'))
            return

        tournaments = Tournament.objects.order_by('id')[:10]
        if not tournaments:
            self.stdout.write(self.style.ERROR('토너먼트 데이터가 부족합니다.'))
            return

        for t in tournaments:
            reg, created = TournamentRegistration.objects.get_or_create(
                user=user,
                tournament=t,
                defaults={
                    'paid_amount': 50000,
                }
            )
            if created:
                self.stdout.write(self.style.SUCCESS(f'{user.username} -> {t.name} 참가 등록'))
            else:
                self.stdout.write(self.style.WARNING(f'{user.username} -> {t.name} 이미 등록됨')) 