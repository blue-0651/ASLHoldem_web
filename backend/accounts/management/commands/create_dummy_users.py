from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
import random
from datetime import date, timedelta

class Command(BaseCommand):
    help = 'ASL Poker 사용자 더미 10개 생성'

    def handle(self, *args, **options):
        User = get_user_model()
        gender_choices = ['M', 'F', 'O']
        base_birth = date(1990, 1, 1)
        for i in range(1, 11):
            username = f'user{i}'
            email = f'user{i}@example.com'
            phone = f'010-0000-00{i:02d}'
            birth_date = base_birth + timedelta(days=i*365)
            gender = gender_choices[i % 3]
            user, created = User.objects.get_or_create(
                username=username,
                defaults={
                    'email': email,
                    'phone': phone,
                    'birth_date': birth_date,
                    'gender': gender,
                }
            )
            if created:
                user.set_password('testpass123')
                user.save()
                self.stdout.write(self.style.SUCCESS(f'{username} 생성'))
            else:
                self.stdout.write(self.style.WARNING(f'{username} 이미 존재')) 