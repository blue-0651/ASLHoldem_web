from django.core.management.base import BaseCommand
from seats.models import SeatTicket
from tournaments.models import Tournament
from django.utils import timezone
from datetime import timedelta

class Command(BaseCommand):
    help = '토너먼트 날짜 변경에 맞춰 관련 좌석권의 만료일자 업데이트'

    def add_arguments(self, parser):
        parser.add_argument(
            '--confirm',
            action='store_true',
            help='실제로 좌석권 만료일자를 업데이트'
        )
        parser.add_argument(
            '--days-before',
            type=int,
            default=0,
            help='토너먼트 시작일 기준 며칠 전까지 좌석권 유효 (기본값: 토너먼트 당일까지)'
        )

    def handle(self, *args, **options):
        days_before = options['days_before']
        
        if not options['confirm']:
            self.stdout.write(
                self.style.WARNING(
                    '⚠️ 주의: 좌석권 만료일자를 수정하는 것은 신중해야 합니다.\n'
                    '실행하려면 --confirm 옵션을 사용하세요.\n'
                    f'변경 예정: 좌석권 만료일을 토너먼트 시작일 {days_before}일 전으로 설정'
                )
            )
            return
        
        # 활성 상태인 좌석권들만 업데이트
        seat_tickets = SeatTicket.objects.filter(
            status='ACTIVE'
        ).select_related('tournament')
        
        if seat_tickets.count() == 0:
            self.stdout.write(self.style.WARNING('업데이트할 활성 좌석권이 없습니다.'))
            return
        
        self.stdout.write(f"업데이트할 활성 좌석권 수: {seat_tickets.count()}개")
        
        updated_count = 0
        skipped_count = 0
        
        for ticket in seat_tickets:
            tournament = ticket.tournament
            
            # 토너먼트 시작일을 기준으로 만료일 계산
            if tournament.start_time:
                # 토너먼트 시작일에서 지정된 일수를 뺀 날짜를 만료일로 설정
                new_expires_at = tournament.start_time - timedelta(days=days_before)
                
                old_expires_at = ticket.expires_at
                ticket.expires_at = new_expires_at
                ticket.save()
                
                updated_count += 1
                self.stdout.write(
                    f"좌석권 {ticket.ticket_id} (토너먼트: {tournament.name}):\n"
                    f"  만료일: {old_expires_at} → {new_expires_at}"
                )
            else:
                skipped_count += 1
                self.stdout.write(
                    self.style.WARNING(
                        f"좌석권 {ticket.ticket_id}: 토너먼트 시작일이 없어 건너뜀"
                    )
                )
        
        self.stdout.write(
            self.style.SUCCESS(f'\n작업 완료! {updated_count}개의 좌석권 만료일 업데이트됨')
        )
        
        if skipped_count > 0:
            self.stdout.write(
                self.style.WARNING(f'{skipped_count}개의 좌석권은 건너뛰었습니다.')
            )
        
        # 업데이트 결과 요약
        now = timezone.now()
        
        # 상태별 좌석권 수 계산
        active_tickets = SeatTicket.objects.filter(status='ACTIVE').count()
        expired_tickets = SeatTicket.objects.filter(status='EXPIRED').count()
        used_tickets = SeatTicket.objects.filter(status='USED').count()
        
        # 만료일이 미래인 활성 좌석권 수
        valid_tickets = SeatTicket.objects.filter(
            status='ACTIVE',
            expires_at__gt=now
        ).count()
        
        self.stdout.write(f"\n=== 좌석권 현황 요약 ===")
        self.stdout.write(f"총 좌석권 수: {SeatTicket.objects.count()}개")
        self.stdout.write(f"활성 좌석권: {active_tickets}개")
        self.stdout.write(f"만료된 좌석권: {expired_tickets}개")
        self.stdout.write(f"사용된 좌석권: {used_tickets}개")
        self.stdout.write(f"유효한 좌석권: {valid_tickets}개")
        
        # 토너먼트별 좌석권 현황
        tournaments_with_tickets = Tournament.objects.filter(
            seat_tickets__isnull=False
        ).distinct().count()
        
        self.stdout.write(f"\n=== 토너먼트 연관 정보 ===")
        self.stdout.write(f"좌석권이 있는 토너먼트 수: {tournaments_with_tickets}개")
        
        self.stdout.write(self.style.SUCCESS("\n✅ 모든 좌석권 만료일 업데이트 완료!")) 