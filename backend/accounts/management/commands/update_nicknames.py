from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.db import models
import random

class Command(BaseCommand):
    help = '모든 사용자의 nickname을 임의의 한국어 닉네임으로 업데이트'

    def handle(self, *args, **options):
        User = get_user_model()
        
        # 한국어 형용사와 동물 이름 목록
        adjectives = [
            '귀여운', '멋진', '활발한', '조용한', '빠른', '느린', '큰', '작은', 
            '밝은', '어두운', '따뜻한', '차가운', '친절한', '용감한', '똑똑한', 
            '재미있는', '신비한', '강한', '부드러운', '예쁜', '행복한', '슬픈',
            '웃긴', '시원한', '달콤한', '쓴', '매운', '짠', '신선한', '고급스러운'
        ]
        
        animals = [
            '호랑이', '사자', '곰', '토끼', '고양이', '강아지', '펭귄', '코끼리',
            '기린', '원숭이', '팬더', '코알라', '캥거루', '늑대', '여우', '다람쥐',
            '거북이', '독수리', '올빼미', '까마귀', '비둘기', '참새', '오리', '백조',
            '돌고래', '고래', '상어', '문어', '해파리', '불가사리', '나비', '벌'
        ]
        
        # nickname이 None이거나 빈 문자열인 사용자들 가져오기
        users_to_update = User.objects.filter(
            models.Q(nickname__isnull=True) | models.Q(nickname='')
        )
        
        updated_count = 0
        used_nicknames = set()
        
        # 기존에 사용중인 닉네임들 수집
        existing_nicknames = set(
            User.objects.exclude(
                models.Q(nickname__isnull=True) | models.Q(nickname='')
            ).values_list('nickname', flat=True)
        )
        used_nicknames.update(existing_nicknames)
        
        self.stdout.write(f"업데이트할 사용자 수: {users_to_update.count()}명")
        self.stdout.write(f"기존 닉네임 수: {len(existing_nicknames)}개")
        
        for user in users_to_update:
            # 중복되지 않는 닉네임 생성
            attempts = 0
            while attempts < 100:  # 무한루프 방지
                adjective = random.choice(adjectives)
                animal = random.choice(animals)
                new_nickname = f"{adjective}{animal}"
                
                if new_nickname not in used_nicknames:
                    used_nicknames.add(new_nickname)
                    break
                    
                attempts += 1
            else:
                # 100번 시도해도 중복이면 숫자 추가
                base_nickname = f"{random.choice(adjectives)}{random.choice(animals)}"
                counter = 1
                while f"{base_nickname}{counter}" in used_nicknames:
                    counter += 1
                new_nickname = f"{base_nickname}{counter}"
                used_nicknames.add(new_nickname)
            
            # 닉네임 업데이트
            old_nickname = user.nickname
            user.nickname = new_nickname
            user.save()
            
            updated_count += 1
            self.stdout.write(f"사용자 ID {user.id} ({user.phone}): '{old_nickname}' → '{new_nickname}'")
        
        self.stdout.write(
            self.style.SUCCESS(f'작업 완료! {updated_count}명의 사용자 닉네임 업데이트됨')
        ) 