from django.core.management.base import BaseCommand
from tournaments.models import Tournament
from django.utils import timezone
from datetime import datetime, timedelta
import random

class Command(BaseCommand):
    help = '모든 토너먼트의 개최일자를 8월 이후로 수정하고 관련 컬럼들도 업데이트'

    def add_arguments(self, parser):
        parser.add_argument(
            '--start-month',
            type=int,
            default=8,
            help='시작 월 (기본값: 8월)'
        )
        parser.add_argument(
            '--year',
            type=int,
            default=2025,
            help='연도 (기본값: 2025)'
        )
        parser.add_argument(
            '--confirm',
            action='store_true',
            help='실제로 토너먼트 날짜를 업데이트'
        )

    def handle(self, *args, **options):
        start_month = options['start_month']
        year = options['year']
        
        if not options['confirm']:
            self.stdout.write(
                self.style.WARNING(
                    '⚠️ 주의: 토너먼트 날짜를 수정하는 것은 신중해야 합니다.\n'
                    '실행하려면 --confirm 옵션을 사용하세요.\n'
                    f'변경 예정: {year}년 {start_month}월 이후로 토너먼트 날짜 업데이트'
                )
            )
            return
        
        tournaments = Tournament.objects.all().order_by('start_time')
        
        if tournaments.count() == 0:
            self.stdout.write(self.style.WARNING('업데이트할 토너먼트가 없습니다.'))
            return
        
        self.stdout.write(f"업데이트할 토너먼트 수: {tournaments.count()}개")
        
        # 8월부터 시작하여 각 토너먼트에 새로운 날짜 할당
        updated_count = 0
        current_date = datetime(year, start_month, 1)  # 8월 1일부터 시작
        
        # 토너먼트 시간 옵션들 (다양성을 위해)
        time_options = [
            (14, 0),   # 오후 2시
            (15, 0),   # 오후 3시
            (16, 0),   # 오후 4시
            (17, 0),   # 오후 5시
            (18, 0),   # 오후 6시
            (19, 0),   # 오후 7시
            (20, 0),   # 오후 8시
        ]
        
        for i, tournament in enumerate(tournaments):
            # 날짜 계산: 8월부터 시작하여 주 단위로 간격을 둠
            days_to_add = i * 7  # 일주일 간격
            new_date = current_date + timedelta(days=days_to_add)
            
            # 주말 피하기 (토요일=5, 일요일=6)
            while new_date.weekday() >= 5:
                new_date += timedelta(days=1)
            
            # 랜덤한 시간 선택
            hour, minute = random.choice(time_options)
            
            # 새로운 시작 시간 설정
            old_start_time = tournament.start_time
            new_start_time = timezone.make_aware(
                datetime(new_date.year, new_date.month, new_date.day, hour, minute)
            )
            
            tournament.start_time = new_start_time
            
            # 상태 업데이트 (8월 이후는 모두 UPCOMING으로)
            old_status = tournament.status
            tournament.status = 'UPCOMING'
            
            tournament.save()
            
            updated_count += 1
            self.stdout.write(
                f"토너먼트 ID {tournament.id} ({tournament.name}):\n"
                f"  날짜: {old_start_time} → {new_start_time}\n"
                f"  상태: {old_status} → {tournament.status}"
            )
        
        self.stdout.write(
            self.style.SUCCESS(f'\n작업 완료! {updated_count}개의 토너먼트 날짜 업데이트됨')
        )
        
        # 업데이트 결과 요약
        now = timezone.now()
        future_tournaments = Tournament.objects.filter(start_time__gt=now).count()
        august_later = Tournament.objects.filter(
            start_time__year=year,
            start_time__month__gte=start_month
        ).count()
        
        self.stdout.write(f"\n=== 업데이트 결과 요약 ===")
        self.stdout.write(f"총 토너먼트 수: {Tournament.objects.count()}개")
        self.stdout.write(f"미래 토너먼트 수: {future_tournaments}개")
        self.stdout.write(f"{year}년 {start_month}월 이후 토너먼트: {august_later}개")
        
        # 관련 좌석권 정보도 확인
        try:
            from seats.models import SeatTicket, TournamentTicketDistribution
            
            seat_tickets = SeatTicket.objects.filter(tournament__in=tournaments).count()
            ticket_distributions = TournamentTicketDistribution.objects.filter(
                tournament__in=tournaments
            ).count()
            
            self.stdout.write(f"\n=== 관련 데이터 현황 ===")
            self.stdout.write(f"관련 좌석권 수: {seat_tickets}개")
            self.stdout.write(f"관련 매장 분배 데이터: {ticket_distributions}개")
            
            if seat_tickets > 0:
                self.stdout.write(
                    self.style.WARNING(
                        "📝 참고: 좌석권 데이터가 존재합니다. "
                        "필요시 좌석권 만료일자도 함께 조정을 고려해보세요."
                    )
                )
                
        except ImportError:
            self.stdout.write("좌석권 모듈을 찾을 수 없습니다.")
        
        self.stdout.write(self.style.SUCCESS("\n✅ 모든 토너먼트 날짜 업데이트 완료!")) 