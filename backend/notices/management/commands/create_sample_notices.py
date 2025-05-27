from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import timedelta
from notices.models import Notice
import random

User = get_user_model()

class Command(BaseCommand):
    help = '공지사항 샘플 데이터 10개 생성'

    def handle(self, *args, **options):
        # 관리자 사용자 확인 또는 생성
        admin_user = self.get_or_create_admin_user()
        
        # 샘플 공지사항 데이터
        sample_notices = [
            {
                'title': '🎉 ASL 홀덤 서비스 정식 오픈 안내',
                'content': '''안녕하세요, ASL 홀덤 회원 여러분!

드디어 ASL 홀덤 서비스가 정식으로 오픈되었습니다.

📅 오픈일: 2024년 1월 1일
🎯 주요 기능:
- 토너먼트 참가 및 관리
- 실시간 순위 확인
- 좌석권 시스템
- 포인트 적립 및 사용

많은 관심과 참여 부탁드립니다!

감사합니다.''',
                'notice_type': 'GENERAL',
                'priority': 'HIGH',
                'is_pinned': True,
            },
            {
                'title': '📋 토너먼트 참가 규정 안내',
                'content': '''토너먼트 참가 시 다음 규정을 준수해 주시기 바랍니다.

1. 참가 신청은 토너먼트 시작 1시간 전까지 가능합니다.
2. 좌석권이 있어야 참가 가능합니다.
3. 체크인은 토너먼트 시작 30분 전부터 가능합니다.
4. 지각 시 자동으로 블라인드가 차감됩니다.
5. 부정행위 적발 시 즉시 퇴장 조치됩니다.

자세한 내용은 고객센터로 문의해 주세요.''',
                'notice_type': 'MEMBER_ONLY',
                'priority': 'NORMAL',
                'is_pinned': False,
            },
            {
                'title': '🔧 시스템 점검 안내 (1월 15일)',
                'content': '''시스템 안정성 향상을 위한 정기 점검을 실시합니다.

📅 점검 일시: 2024년 1월 15일 (월) 02:00 ~ 06:00 (4시간)
🔧 점검 내용:
- 서버 성능 최적화
- 보안 업데이트
- 버그 수정

점검 시간 동안 서비스 이용이 불가능합니다.
이용에 불편을 드려 죄송합니다.''',
                'notice_type': 'GENERAL',
                'priority': 'URGENT',
                'is_pinned': True,
            },
            {
                'title': '💰 포인트 적립 이벤트 진행',
                'content': '''신규 회원 대상 포인트 적립 이벤트를 진행합니다!

🎁 이벤트 혜택:
- 회원가입 시 1,000포인트 지급
- 첫 토너먼트 참가 시 추가 500포인트
- 친구 추천 시 양쪽 모두 300포인트

📅 이벤트 기간: 2024년 1월 1일 ~ 1월 31일
💡 포인트는 좌석권 구매에 사용 가능합니다.

많은 참여 부탁드립니다!''',
                'notice_type': 'GENERAL',
                'priority': 'NORMAL',
                'is_pinned': False,
            },
            {
                'title': '📱 모바일 앱 업데이트 안내',
                'content': '''ASL 홀덤 모바일 앱이 업데이트되었습니다.

🆕 새로운 기능:
- 푸시 알림 기능 추가
- UI/UX 개선
- 토너먼트 실시간 현황 확인
- 좌석권 관리 기능 강화

📲 업데이트 방법:
- iOS: App Store에서 업데이트
- Android: Google Play에서 업데이트

최신 버전으로 업데이트하여 더 나은 서비스를 이용해 보세요!''',
                'notice_type': 'GENERAL',
                'priority': 'NORMAL',
                'is_pinned': False,
            },
            {
                'title': '🏆 월간 토너먼트 챔피언십 개최',
                'content': '''매월 마지막 주 토요일에 챔피언십 토너먼트를 개최합니다.

🏆 대회 정보:
- 일시: 매월 마지막 토요일 오후 7시
- 참가비: 좌석권 3개
- 상금: 총 상금풀의 50%
- 참가 자격: 해당 월 토너먼트 3회 이상 참가자

🎯 특별 혜택:
- 우승자: 다음 달 좌석권 10개 지급
- 준우승자: 좌석권 5개 지급
- 3위: 좌석권 3개 지급

많은 참여 바랍니다!''',
                'notice_type': 'MEMBER_ONLY',
                'priority': 'HIGH',
                'is_pinned': False,
            },
            {
                'title': '⚠️ 계정 보안 강화 안내',
                'content': '''회원님의 계정 보안을 위해 다음 사항을 확인해 주세요.

🔐 보안 수칙:
1. 비밀번호는 정기적으로 변경해 주세요
2. 타인과 계정 정보를 공유하지 마세요
3. 공용 컴퓨터에서 로그아웃을 잊지 마세요
4. 의심스러운 활동 발견 시 즉시 신고해 주세요

📞 신고 및 문의:
- 고객센터: 1588-1234
- 이메일: security@aslholdem.com

안전한 게임 환경을 위해 협조 부탁드립니다.''',
                'notice_type': 'GENERAL',
                'priority': 'HIGH',
                'is_pinned': False,
            },
            {
                'title': '🎊 신년 특별 이벤트 안내',
                'content': '''새해를 맞아 특별 이벤트를 준비했습니다!

🎉 이벤트 내용:
- 매일 첫 토너먼트 참가 시 좌석권 1개 추가 지급
- 연속 7일 접속 시 특별 보상
- 신년 특별 토너먼트 개최 (1월 1일)

🎁 특별 보상:
- 7일 연속 접속: 좌석권 5개
- 신년 토너먼트 참가: 기념품 증정
- 이벤트 기간 누적 참가 10회: VIP 혜택

📅 이벤트 기간: 2024년 1월 1일 ~ 1월 14일

새해 복 많이 받으세요!''',
                'notice_type': 'GENERAL',
                'priority': 'NORMAL',
                'is_pinned': False,
            },
            {
                'title': '📞 고객센터 운영시간 변경 안내',
                'content': '''고객센터 운영시간이 변경됩니다.

⏰ 변경 전: 평일 09:00 ~ 18:00
⏰ 변경 후: 평일 10:00 ~ 19:00, 토요일 10:00 ~ 17:00

📅 적용일: 2024년 1월 8일부터

📞 연락처:
- 전화: 1588-1234
- 이메일: support@aslholdem.com
- 카카오톡: @ASL홀덤

더 나은 서비스 제공을 위한 변경이니 양해 부탁드립니다.''',
                'notice_type': 'GENERAL',
                'priority': 'LOW',
                'is_pinned': False,
            },
            {
                'title': '🔄 좌석권 시스템 개선 안내',
                'content': '''좌석권 시스템이 개선되었습니다.

✨ 개선 사항:
- 좌석권 유효기간 표시 기능 추가
- 좌석권 사용 내역 상세 조회 가능
- 좌석권 선물하기 기능 추가
- 좌석권 자동 충전 기능 (선택사항)

💡 새로운 기능:
- 좌석권 알림 설정
- 좌석권 사용 통계 확인
- 월간 좌석권 사용 리포트

더욱 편리해진 좌석권 시스템을 이용해 보세요!''',
                'notice_type': 'MEMBER_ONLY',
                'priority': 'NORMAL',
                'is_pinned': False,
            },
        ]
        
        created_count = 0
        
        for i, notice_data in enumerate(sample_notices):
            # 이미 존재하는 공지사항인지 확인
            if Notice.objects.filter(title=notice_data['title']).exists():
                self.stdout.write(f"공지사항 '{notice_data['title']}'는 이미 존재합니다.")
                continue
            
            # 공지사항 생성
            notice = Notice.objects.create(
                title=notice_data['title'],
                content=notice_data['content'],
                notice_type=notice_data['notice_type'],
                priority=notice_data['priority'],
                is_pinned=notice_data['is_pinned'],
                author=admin_user,
                is_published=True,
                view_count=random.randint(0, 100),  # 랜덤 조회수
                created_at=timezone.now() - timedelta(days=random.randint(0, 30))  # 랜덤 생성일
            )
            
            created_count += 1
            self.stdout.write(f"공지사항 생성: {notice.title}")
        
        self.stdout.write(
            self.style.SUCCESS(f'공지사항 샘플 데이터 생성 완료! (총 {created_count}개 생성)')
        )
    
    def get_or_create_admin_user(self):
        """관리자 사용자를 가져오거나 생성합니다."""
        # 기존 관리자 사용자 찾기
        admin_user = User.objects.filter(is_staff=True, is_superuser=True).first()
        
        if admin_user:
            self.stdout.write(f"기존 관리자 사용자 사용: {admin_user.username}")
            return admin_user
        
        # 관리자 사용자가 없으면 생성
        admin_user = User.objects.create_user(
            username='admin',
            phone='010-0000-0000',
            email='admin@aslholdem.com',
            password='admin123',
            is_staff=True,
            is_superuser=True,
            role='ADMIN'
        )
        
        self.stdout.write(f"새 관리자 사용자 생성: {admin_user.username}")
        return admin_user 