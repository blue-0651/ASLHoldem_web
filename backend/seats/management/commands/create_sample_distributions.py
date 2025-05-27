from django.core.management.base import BaseCommand
from django.db import transaction
from seats.models import TournamentTicketDistribution, SeatTicket
from tournaments.models import Tournament
from stores.models import Store
from accounts.models import User
import random
from datetime import datetime, timedelta

class Command(BaseCommand):
    help = '토너먼트 좌석권 분배 샘플 데이터 생성 (기존 데이터와의 관계성 고려)'

    def add_arguments(self, parser):
        parser.add_argument(
            '--clear',
            action='store_true',
            help='기존 TournamentTicketDistribution 데이터를 모두 삭제하고 새로 생성',
        )

    def handle(self, *args, **options):
        if options['clear']:
            TournamentTicketDistribution.objects.all().delete()
            self.stdout.write(self.style.WARNING('기존 TournamentTicketDistribution 데이터를 모두 삭제했습니다.'))

        # 기존 데이터 확인
        tournaments = list(Tournament.objects.all())
        stores = list(Store.objects.all())
        users = list(User.objects.all())
        
        if not tournaments:
            self.stdout.write(self.style.ERROR('토너먼트 데이터가 없습니다. 먼저 토너먼트를 생성해주세요.'))
            return
            
        if not stores:
            self.stdout.write(self.style.ERROR('매장 데이터가 없습니다. 먼저 매장을 생성해주세요.'))
            return

        self.stdout.write(f'발견된 데이터: 토너먼트 {len(tournaments)}개, 매장 {len(stores)}개, 사용자 {len(users)}개')

        created_count = 0
        
        with transaction.atomic():
            for tournament in tournaments:
                # 토너먼트의 총 좌석권 수량
                total_tickets = tournament.ticket_quantity
                remaining_tickets = total_tickets
                
                # 해당 토너먼트에 대한 기존 SeatTicket 확인
                existing_seat_tickets = SeatTicket.objects.filter(tournament=tournament)
                existing_tickets_by_store = {}
                
                for ticket in existing_seat_tickets:
                    store_id = ticket.store_id if ticket.store else None
                    if store_id:
                        if store_id not in existing_tickets_by_store:
                            existing_tickets_by_store[store_id] = 0
                        existing_tickets_by_store[store_id] += 1

                self.stdout.write(f'\n토너먼트: {tournament.name} (총 좌석권: {total_tickets}개)')
                if existing_tickets_by_store:
                    self.stdout.write(f'기존 SeatTicket 분포: {existing_tickets_by_store}')

                # 매장별 분배 계획 수립
                # 1. 기존 SeatTicket이 있는 매장들을 우선 고려
                # 2. 나머지 매장들 중 일부를 랜덤 선택
                
                stores_with_tickets = [store for store in stores if store.id in existing_tickets_by_store]
                stores_without_tickets = [store for store in stores if store.id not in existing_tickets_by_store]
                
                # 기존 티켓이 있는 매장 + 랜덤 선택된 매장들
                additional_stores = random.sample(
                    stores_without_tickets, 
                    min(len(stores_without_tickets), random.randint(1, 3))
                )
                selected_stores = stores_with_tickets + additional_stores
                
                # 각 매장에 분배할 수량 계산
                for i, store in enumerate(selected_stores):
                    # 기존 분배 데이터가 있는지 확인
                    if TournamentTicketDistribution.objects.filter(
                        tournament=tournament, store=store
                    ).exists():
                        continue
                    
                    # 기존 SeatTicket 수량 확인
                    existing_tickets = existing_tickets_by_store.get(store.id, 0)
                    
                    # 분배량 계산
                    if existing_tickets > 0:
                        # 기존 티켓이 있는 경우: 기존 티켓 수의 1.2~2배로 분배
                        base_allocation = existing_tickets
                        allocated = random.randint(
                            max(existing_tickets, int(base_allocation * 1.2)),
                            min(remaining_tickets, int(base_allocation * 2))
                        )
                    else:
                        # 기존 티켓이 없는 경우: 적은 수량 분배
                        max_allocation = min(remaining_tickets, int(total_tickets * 0.1))
                        allocated = random.randint(1, max(1, max_allocation))
                    
                    if allocated <= 0 or remaining_tickets <= 0:
                        continue
                    
                    allocated = min(allocated, remaining_tickets)
                    
                    # 배포된 수량 계산 (기존 SeatTicket 수량을 기반으로)
                    if existing_tickets > 0:
                        # 기존 티켓이 있으면 그 수량만큼은 이미 배포된 것으로 간주
                        distributed = min(existing_tickets, allocated)
                        # 추가로 일부 더 배포될 수 있음
                        additional_distributed = random.randint(0, max(0, allocated - distributed))
                        distributed = min(distributed + additional_distributed, allocated)
                    else:
                        # 기존 티켓이 없으면 할당량의 0-60% 배포
                        distributed = random.randint(0, int(allocated * 0.6))
                    
                    remaining = allocated - distributed
                    
                    # 분배 데이터 생성
                    distribution = TournamentTicketDistribution.objects.create(
                        tournament=tournament,
                        store=store,
                        allocated_quantity=allocated,
                        remaining_quantity=remaining,
                        distributed_quantity=distributed,
                        memo=f'자동 생성 - 기존 SeatTicket {existing_tickets}개 고려하여 분배'
                    )
                    
                    remaining_tickets -= allocated
                    created_count += 1
                    
                    self.stdout.write(
                        f"  {created_count}. {store.name}: "
                        f"분배 {allocated}개, 보유 {remaining}개, 배포 {distributed}개 "
                        f"(기존 SeatTicket: {existing_tickets}개)"
                    )
                    
                    if remaining_tickets <= 0:
                        break
                
                # 남은 좌석권이 있으면 경고
                if remaining_tickets > 0:
                    self.stdout.write(
                        self.style.WARNING(f'  ⚠️  {tournament.name}: {remaining_tickets}개 좌석권이 분배되지 않았습니다.')
                    )

        # 최종 검증
        self.stdout.write('\n=== 분배 결과 검증 ===')
        for tournament in tournaments:
            distributions = TournamentTicketDistribution.objects.filter(tournament=tournament)
            total_allocated = sum(d.allocated_quantity for d in distributions)
            total_distributed = sum(d.distributed_quantity for d in distributions)
            total_remaining = sum(d.remaining_quantity for d in distributions)
            
            self.stdout.write(
                f'{tournament.name}: 총 분배 {total_allocated}개 / 총 좌석권 {tournament.ticket_quantity}개 '
                f'(배포: {total_distributed}개, 보유: {total_remaining}개)'
            )
            
            # 정합성 검증
            if total_distributed + total_remaining != total_allocated:
                self.stdout.write(
                    self.style.ERROR(f'  ❌ 정합성 오류: 배포({total_distributed}) + 보유({total_remaining}) ≠ 분배({total_allocated})')
                )
            else:
                self.stdout.write(self.style.SUCCESS(f'  ✅ 정합성 검증 통과'))

        self.stdout.write(
            self.style.SUCCESS(f'\n토너먼트 좌석권 분배 {created_count}개 샘플 생성 완료!')
        ) 