from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from stores.models import Store
from django.db import transaction
import logging

User = get_user_model()

class Command(BaseCommand):
    help = '배포서버에 샘플 매장 10개를 생성합니다.'

    def add_arguments(self, parser):
        parser.add_argument(
            '--force',
            action='store_true',
            help='기존 매장이 있어도 강제로 생성합니다.'
        )

    def handle(self, *args, **options):
        # 샘플 매장 데이터 정의
        sample_stores = [
            {
                'name': 'ASL 강남점',
                'address': '서울특별시 강남구 테헤란로 123',
                'description': '강남역 근처 프리미엄 홀덤 매장입니다. 최신 시설과 편안한 환경을 제공합니다.',
                'phone_number': '02-1234-5678',
                'manager_name': '김강남',
                'manager_phone': '010-1234-5678',
                'open_time': '10:00',
                'close_time': '24:00',
                'max_capacity': 80,
                'latitude': 37.497942,
                'longitude': 127.027618
            },
            {
                'name': 'ASL 홍대점',
                'address': '서울특별시 마포구 와우산로 456',
                'description': '홍대 젊은 에너지가 가득한 홀덤 매장입니다. 활기찬 분위기에서 게임을 즐기세요.',
                'phone_number': '02-2345-6789',
                'manager_name': '이홍대',
                'manager_phone': '010-2345-6789',
                'open_time': '14:00',
                'close_time': '02:00',
                'max_capacity': 60,
                'latitude': 37.550339,
                'longitude': 126.922340
            },
            {
                'name': 'ASL 건대점',
                'address': '서울특별시 광진구 능동로 789',
                'description': '건국대학교 근처 학생들에게 인기 있는 홀덤 매장입니다.',
                'phone_number': '02-3456-7890',
                'manager_name': '박건대',
                'manager_phone': '010-3456-7890',
                'open_time': '12:00',
                'close_time': '23:00',
                'max_capacity': 50,
                'latitude': 37.540713,
                'longitude': 127.070042
            },
            {
                'name': 'ASL 잠실점',
                'address': '서울특별시 송파구 잠실로 321',
                'description': '잠실 롯데월드 근처 대형 홀덤 매장입니다. 넓은 공간과 다양한 테이블을 제공합니다.',
                'phone_number': '02-4567-8901',
                'manager_name': '최잠실',
                'manager_phone': '010-4567-8901',
                'open_time': '10:00',
                'close_time': '24:00',
                'max_capacity': 100,
                'latitude': 37.513294,
                'longitude': 127.100076
            },
            {
                'name': 'ASL 신촌점',
                'address': '서울특별시 서대문구 신촌로 654',
                'description': '신촌 연세대학교 근처 아늑한 홀덤 매장입니다.',
                'phone_number': '02-5678-9012',
                'manager_name': '정신촌',
                'manager_phone': '010-5678-9012',
                'open_time': '13:00',
                'close_time': '01:00',
                'max_capacity': 45,
                'latitude': 37.554648,
                'longitude': 126.937041
            },
            {
                'name': 'ASL 부산 해운대점',
                'address': '부산광역시 해운대구 해운대해변로 987',
                'description': '해운대 바다 전망이 보이는 특별한 홀덤 매장입니다.',
                'phone_number': '051-6789-0123',
                'manager_name': '김해운',
                'manager_phone': '010-6789-0123',
                'open_time': '11:00',
                'close_time': '23:00',
                'max_capacity': 70,
                'latitude': 35.158698,
                'longitude': 129.160384
            },
            {
                'name': 'ASL 부산 서면점',
                'address': '부산광역시 부산진구 서면로 246',
                'description': '부산 최대 번화가 서면의 중심가에 위치한 홀덤 매장입니다.',
                'phone_number': '051-7890-1234',
                'manager_name': '이서면',
                'manager_phone': '010-7890-1234',
                'open_time': '12:00',
                'close_time': '24:00',
                'max_capacity': 65,
                'latitude': 35.157567,
                'longitude': 129.056189
            },
            {
                'name': 'ASL 대구 동성로점',
                'address': '대구광역시 중구 동성로 135',
                'description': '대구 중심가 동성로에 위치한 전통 있는 홀덤 매장입니다.',
                'phone_number': '053-8901-2345',
                'manager_name': '박동성',
                'manager_phone': '010-8901-2345',
                'open_time': '12:00',
                'close_time': '23:00',
                'max_capacity': 55,
                'latitude': 35.869085,
                'longitude': 128.593033
            },
            {
                'name': 'ASL 인천 송도점',
                'address': '인천광역시 연수구 송도국제도시 567',
                'description': '송도 국제도시의 모던한 홀덤 매장입니다. 최신 시설과 깔끔한 인테리어가 특징입니다.',
                'phone_number': '032-9012-3456',
                'manager_name': '최송도',
                'manager_phone': '010-9012-3456',
                'open_time': '11:00',
                'close_time': '23:00',
                'max_capacity': 75,
                'latitude': 37.395071,
                'longitude': 126.644265
            },
            {
                'name': 'ASL 광주 상무점',
                'address': '광주광역시 서구 상무대로 890',
                'description': '광주 상무지구의 깔끔하고 모던한 홀덤 매장입니다.',
                'phone_number': '062-0123-4567',
                'manager_name': '김상무',
                'manager_phone': '010-0123-4567',
                'open_time': '12:00',
                'close_time': '23:00',
                'max_capacity': 60,
                'latitude': 35.152894,
                'longitude': 126.851337
            }
        ]

        # 매장 관리자 계정 찾기 (기존 매장 관리자 계정 사용)
        try:
            store_owner = User.objects.filter(is_store_owner=True).first()
            if not store_owner:
                self.stdout.write(self.style.ERROR('매장 관리자 계정이 없습니다. 먼저 매장 관리자 계정을 생성하세요.'))
                return
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'매장 관리자 계정 조회 실패: {str(e)}'))
            return

        self.stdout.write(f'매장 관리자 계정: {store_owner.phone} (ID: {store_owner.id})')

        # 기존 매장 확인
        existing_stores = Store.objects.filter(name__in=[store['name'] for store in sample_stores])
        if existing_stores.exists() and not options['force']:
            self.stdout.write(self.style.WARNING(f'이미 존재하는 매장이 있습니다: {list(existing_stores.values_list("name", flat=True))}'))
            self.stdout.write(self.style.WARNING('--force 옵션을 사용하여 강제로 생성하거나 기존 매장을 삭제하세요.'))
            return

        # 트랜잭션 내에서 매장 생성
        try:
            with transaction.atomic():
                created_count = 0
                updated_count = 0
                
                for store_data in sample_stores:
                    store, created = Store.objects.update_or_create(
                        name=store_data['name'],
                        defaults={
                            'owner': store_owner,
                            'address': store_data['address'],
                            'description': store_data['description'],
                            'phone_number': store_data['phone_number'],
                            'manager_name': store_data['manager_name'],
                            'manager_phone': store_data['manager_phone'],
                            'open_time': store_data['open_time'],
                            'close_time': store_data['close_time'],
                            'max_capacity': store_data['max_capacity'],
                            'latitude': store_data['latitude'],
                            'longitude': store_data['longitude'],
                            'status': 'ACTIVE'
                        }
                    )
                    
                    if created:
                        created_count += 1
                        self.stdout.write(f'✅ 매장 생성: {store.name} (ID: {store.id})')
                    else:
                        updated_count += 1
                        self.stdout.write(f'🔄 매장 업데이트: {store.name} (ID: {store.id})')

                self.stdout.write(
                    self.style.SUCCESS(
                        f'\n📊 매장 생성 완료!\n'
                        f'- 새로 생성된 매장: {created_count}개\n'
                        f'- 업데이트된 매장: {updated_count}개\n'
                        f'- 총 매장 수: {Store.objects.count()}개'
                    )
                )

        except Exception as e:
            self.stdout.write(self.style.ERROR(f'매장 생성 중 오류 발생: {str(e)}'))
            raise

        # 생성된 매장 목록 출력
        self.stdout.write('\n🏪 현재 등록된 매장 목록:')
        for store in Store.objects.all().order_by('id'):
            self.stdout.write(f'  - {store.name} ({store.address}) - {store.status}')

        self.stdout.write(self.style.SUCCESS('\n🎉 샘플 매장 생성이 완료되었습니다!')) 