# ASL Holdem 이상적 디렉토리 구조

아래 구조는 실제로 변환해야 할 이상적인 디렉토리 구조입니다. 현재 구조에서 이상적인 구조로 이동하기 위해 다음 단계를 따르세요.

```
ASLHoldem_web/
├── backend/                # Django 백엔드
│   ├── accounts/           # 사용자 계정 관리 앱
│   ├── asl_holdem/         # 프로젝트 설정
│   ├── media/              # 미디어 파일
│   ├── stores/             # 매장 관련 앱
│   ├── tournaments/        # 토너먼트 관련 앱
│   ├── views/              # API 뷰 모듈
│   ├── .env                # 환경 변수 (gitignore에 포함)
│   ├── .env.example        # 환경 변수 예시
│   ├── manage.py           # Django 관리 스크립트
│   ├── README.md           # 백엔드 문서
│   └── requirements.txt    # 백엔드 의존성
│
├── frontend/               # React 프론트엔드
│   ├── public/             # 정적 파일
│   ├── src/                # 소스 코드
│   │   ├── assets/         # 이미지 및 리소스
│   │   ├── components/     # 재사용 가능한 컴포넌트
│   │   ├── pages/          # 페이지 컴포넌트
│   │   ├── utils/          # 유틸리티 함수
│   │   └── App.js          # 루트 컴포넌트
│   ├── .env                # 환경 변수 (gitignore에 포함)
│   ├── .env.example        # 환경 변수 예시
│   ├── package.json        # 프론트엔드 의존성
│   ├── package-lock.json   # 의존성 버전 잠금
│   └── README.md           # 프론트엔드 문서
│
├── docs/                   # 문서
│   ├── API_Collection.json # API 문서
│   └── README.md           # 문서 설명
│
├── .gitignore              # Git 제외 설정
└── README.md               # 프로젝트 문서
```

## 마이그레이션 단계

1. 기존 디렉토리 구조를 백업합니다.
2. 새 디렉토리 구조를 구성합니다.
3. 파일을 새 구조로 복사합니다:
   ```bash
   # 프론트엔드 파일 이동
   mkdir -p frontend/public frontend/src/assets frontend/src/components frontend/src/pages frontend/src/utils
   cp -r public/* frontend/public/
   cp -r src/* frontend/src/
   cp package.json package-lock.json frontend/
   
   # 문서 이동
   mkdir -p docs
   cp ASLHoldem_API_Collection.json docs/API_Collection.json
   ```
4. 새 구조를 테스트합니다.
5. 기존 구조를 정리합니다:
   ```bash
   # 주의: 백업 후 진행하세요
   rm -rf public src ASLHoldem_API_Collection.json
   ``` 