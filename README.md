# ASL Holdem

ASL 홀덤 웹 애플리케이션은 토너먼트 관리 및 좌석 관리 시스템입니다.

## 프로젝트 구조

```
ASLHoldem_web/
├── backend/               # Django 백엔드
│   ├── accounts/          # 사용자 계정 관리 앱
│   ├── asl_holdem/        # 프로젝트 설정
│   ├── media/             # 미디어 파일
│   ├── stores/            # 매장 관련 앱
│   ├── tournaments/       # 토너먼트 관련 앱
│   ├── views/             # API 뷰 모듈
│   ├── manage.py          # Django 관리 스크립트
│   └── requirements.txt   # 백엔드 의존성
│
├── frontend/              # React 프론트엔드
│   ├── public/            # 정적 파일
│   ├── src/               # 소스 코드
│   │   ├── assets/        # 이미지 및 리소스
│   │   ├── components/    # 재사용 가능한 컴포넌트
│   │   ├── pages/         # 페이지 컴포넌트
│   │   ├── utils/         # 유틸리티 함수
│   │   └── App.js         # 루트 컴포넌트
│   ├── package.json       # 프론트엔드 의존성
│   └── .env               # 환경 변수
│
├── docs/                  # 문서
│   └── API_Collection.json # API 문서
│
└── .gitignore             # Git 제외 설정
```

## 시작하기

### 백엔드 실행
```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

### 프론트엔드 실행
```bash
cd frontend
npm install
npm start
```

## 데이터베이스 설정

백엔드는 PostgreSQL 데이터베이스를 사용합니다:
- 데이터베이스 이름: asl_db
- 사용자: postgres
- 비밀번호: postgres
- 호스트: localhost
- 포트: 5432