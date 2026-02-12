# GEO Tracker

AI 가시성(GEO - Generative Engine Optimization) 분석 및 리포팅 플랫폼

ChatGPT, Gemini 등 생성형 AI 검색 결과에서 브랜드가 얼마나 노출되고 인용되는지를 추적하고, 분석 리포트와 개선 인사이트를 제공합니다.

---

## 주요 기능

### 브랜드 관리 (`/dashboard/brands`)
- 모니터링 대상 브랜드 등록/수정/삭제
- 경쟁사 브랜드 추적
- 마케팅 포인트, 키워드 인라인 편집
- 브랜드별 인용 통계 (인용률, 평균 순위, 테스트 수)

### 질문 관리 (`/dashboard/query-ops`)
- **질문 관리 탭**: AI 엔진에 테스트할 질문 등록/수정/삭제, 브랜드 연결, 수동 테스트 실행
- **질문 예약 탭**: 자동 스케줄링 (일간/주간/월간), 실행 시간 설정, 실행 이력 확인
- 지원 엔진: ChatGPT (GPT-4o-mini), Gemini (2.0 Flash)
- 질문 카테고리: 제품 추천, 서비스 비교, 기술 문의, 가격 문의, 브랜드 평판, 기타

### 성과 (`/dashboard/performance`)
- **개요 탭**: 핵심 KPI (총 테스트 수, 인용률, 인용 횟수, SOV), 브랜드별 필터, 엔진별 성과 비교
- **가시성 탭**: 테스트 결과 상세 (AI 응답 원문, 인용 여부, 순위, 키워드 분석, 경쟁사 언급)
- **트렌드 탭**: 시계열 인용률 추이 (1주/1개월/3개월)
  - 전체 인용률 추이 AreaChart
  - 엔진별(ChatGPT vs Gemini) 인용률 비교 AreaChart
  - 카테고리별 평균 인용률 비교 BarChart

### 리포트/인사이트 (`/dashboard/reports`)
- **리포트 탭**: 주간/월간 AI 가시성 리포트 생성 (최소 5개 테스트 필요)
- **인사이트 탭**: AI 기반 전략 인사이트 생성 (공략 키워드, 카테고리 분석, 인용 패턴, 실행 가이드)
- PDF 다운로드 (가시성 리포트, 인사이트 리포트)

### GEO 스코어 (`/dashboard/score`)
- URL 기반 GEO 최적화 점수 측정 (100점 만점, A+~F 등급)
- 5개 카테고리 분석: Structure, Schema, URL, Meta, Content
- 항목별 통과/미통과 상태 및 우선순위별 개선 권장사항
- 경쟁사 URL 비교 분석
- GEO Score PDF 리포트 다운로드

---

## 기술 스택

| 계층 | 기술 | 설명 |
|------|------|------|
| **프론트엔드** | React 19, TypeScript, Vite 7 | SPA 프레임워크 |
| **UI 라이브러리** | Mantine 8 | 컴포넌트, 폼, 차트, 알림 |
| **차트** | Mantine Charts (BarChart, AreaChart) | 대시보드 데이터 시각화 |
| **라우팅** | React Router DOM 7 | 페이지 라우팅 |
| **리치 텍스트** | TipTap 3 | 에디터 컴포넌트 |
| **백엔드** | Node.js, Express 4, TypeScript | REST API 서버 |
| **데이터베이스** | SQLite (better-sqlite3) | 로컬 영구 저장소 |
| **인증** | Passport.js (Local Strategy) | 세션 기반 인증 |
| **AI 연동** | OpenAI API, Google Generative AI | 쿼리 테스트 엔진 |
| **웹 크롤링** | Puppeteer-core, Cheerio | GEO Score 분석용 |
| **PDF 엔진** | Python ReportLab, Matplotlib | 리포트 PDF 생성 |
| **스케줄러** | node-cron | 자동화 작업 |
| **테스트** | Vitest, Testing Library, jsdom | 단위/컴포넌트 테스트 |
| **린팅** | ESLint 9, TypeScript ESLint | 코드 품질 |

---

## 프로젝트 구조

```
geo-tracker/
├── src/                           # 프론트엔드 (React)
│   ├── components/
│   │   ├── common/                # 공통 레이아웃 (Header, Footer)
│   │   ├── dashboard/             # 대시보드 레이아웃, 사이드바, 가이드 모달
│   │   ├── ui/                    # UI 컴포넌트 (카드, 패널)
│   │   ├── sections/              # 랜딩 페이지 섹션
│   │   └── ProtectedRoute.tsx     # 인증 라우트 가드
│   ├── contexts/
│   │   └── AuthContext.tsx         # 인증 Context & useAuth 훅
│   ├── pages/
│   │   ├── Landing.tsx            # 랜딩 페이지
│   │   ├── Login.tsx              # 로그인
│   │   ├── Register.tsx           # 회원가입
│   │   └── dashboard/
│   │       ├── Brands.tsx         # 브랜드 관리 페이지
│   │       ├── QueryOpsPage.tsx   # 질문 관리 (질문 관리 탭 + 질문 예약 탭)
│   │       ├── QueryListPanel.tsx # 질문 관리 탭 컴포넌트
│   │       ├── SchedulerPage.tsx  # 질문 예약 탭 컴포넌트
│   │       ├── PerformancePage.tsx # 성과 (개요 + 가시성 + 트렌드 탭)
│   │       ├── Overview.tsx       # 개요 탭 컴포넌트
│   │       ├── Visibility.tsx     # 가시성 탭 컴포넌트
│   │       ├── Trend.tsx          # 트렌드 분석 탭 컴포넌트
│   │       ├── ReportsInsightsPage.tsx # 리포트/인사이트 (리포트 + 인사이트 탭)
│   │       ├── Reports.tsx        # 리포트 탭 컴포넌트
│   │       ├── Insights.tsx       # 인사이트 탭 컴포넌트
│   │       ├── ScorePage.tsx      # GEO 스코어 페이지
│   │       ├── ScoreOverview.tsx  # GEO 스코어 메인 컴포넌트
│   │       └── OnboardingWizard.tsx # 온보딩 위자드
│   ├── services/                  # API 클라이언트 모듈
│   │   ├── client.ts             # Fetch 래퍼 (인증 헤더)
│   │   ├── auth.ts               # 인증 API
│   │   ├── brands.ts             # 브랜드 API
│   │   ├── queries.ts            # 쿼리 API
│   │   ├── results.ts            # 결과 API
│   │   ├── reports.ts            # 리포트 API
│   │   ├── insights.ts           # 인사이트 API
│   │   ├── geoScore.ts           # GEO Score API
│   │   ├── scheduler.ts          # 스케줄러 API
│   │   ├── onboarding.ts         # 온보딩 상태 API
│   │   └── stats.ts              # 통계 & 트렌드 API
│   ├── hooks/                     # 커스텀 훅
│   │   ├── useBodyScrollLock.ts  # 모달 스크롤 잠금
│   │   └── useSidebarData.ts     # 사이드바 상태 데이터
│   ├── utils/
│   │   └── queryTemplates.ts     # 온보딩 질문 템플릿
│   ├── types.ts                   # 공통 TypeScript 타입
│   ├── theme.ts                   # Mantine 테마 설정
│   └── App.tsx                    # 루트 컴포넌트 (라우터 설정)
│
├── server/                        # 백엔드 (Express)
│   └── src/
│       ├── index.ts              # 서버 엔트리포인트 (포트 3001)
│       ├── routes/
│       │   ├── auth.ts           # 인증 라우트
│       │   ├── data.ts           # 데이터 CRUD 라우트
│       │   ├── geoScore.ts       # GEO Score 분석 라우트
│       │   ├── reports.ts        # PDF 리포트 생성 라우트
│       │   └── scheduler.ts      # 스케줄러 라우트
│       ├── services/
│       │   ├── authService.ts    # 인증 비즈니스 로직
│       │   ├── crawler.ts        # Puppeteer 웹 크롤링
│       │   ├── reportGenerator.ts # PDF 생성 오케스트레이션
│       │   ├── scheduler.ts      # cron 스케줄링
│       │   └── analyzer/         # GEO Score 분석 모듈
│       │       ├── content.ts    # 콘텐츠 분석
│       │       ├── structure.ts  # DOM 구조 분석
│       │       ├── schema.ts     # 스키마 마크업 분석
│       │       ├── meta.ts       # 메타태그 분석
│       │       └── url.ts        # URL 구조 분석
│       ├── utils/
│       │   ├── scoring.ts        # 점수 계산 알고리즘
│       │   └── recommendations.ts # 개선 권장사항 생성
│       ├── config/
│       │   ├── db.ts             # DB 설정
│       │   └── passport.ts       # Passport.js 설정
│       ├── middleware/
│       │   └── auth.ts           # 인증 미들웨어
│       └── scripts/              # Python PDF 생성 스크립트
│
├── prisma/
│   └── dev.db                    # SQLite 데이터베이스 파일
│
├── docs/
│   └── GEO_SCORE_METHODOLOGY.md  # GEO 점수 산정 방법론
│
├── vite.config.ts                 # Vite 빌드 & API 프록시 설정
├── vitest.config.ts               # Vitest 테스트 설정
├── tsconfig.json                  # TypeScript 설정
├── eslint.config.js               # ESLint 설정
└── postcss.config.cjs             # PostCSS (Mantine) 설정
```

---

## 라우팅 구조

### 프론트엔드 페이지

| 경로 | 페이지 | 설명 |
|------|--------|------|
| `/` | Landing | 랜딩 페이지 (Hero, 기능소개, 가격) |
| `/login` | Login | 로그인 |
| `/register` | Register | 회원가입 |
| `/dashboard` | — | `/dashboard/performance?tab=overview`로 리다이렉트 |
| `/dashboard/brands` | Brands | 브랜드 관리 |
| `/dashboard/query-ops` | QueryOpsPage | 질문 관리 (탭: 질문 관리 / 질문 예약) |
| `/dashboard/performance` | PerformancePage | 성과 (탭: 개요 / 가시성 / 트렌드) |
| `/dashboard/reports` | ReportsInsightsPage | 리포트/인사이트 (탭: 리포트 / 인사이트) |
| `/dashboard/score` | ScorePage | GEO 스코어 분석 |

### API 엔드포인트

#### 인증 (`/api/auth`)

| 메서드 | 경로 | 설명 |
|--------|------|------|
| POST | `/register` | 회원가입 |
| POST | `/login` | 로그인 |
| POST | `/logout` | 로그아웃 |
| GET | `/me` | 현재 사용자 정보 |

#### 데이터 (`/api`) — 인증 필요

| 메서드 | 경로 | 설명 |
|--------|------|------|
| GET/POST | `/brands` | 브랜드 목록 조회 / 생성 |
| PUT/DELETE | `/brands/:id` | 브랜드 수정 / 삭제 |
| GET/POST | `/queries` | 쿼리 목록 조회 / 생성 |
| PUT/DELETE | `/queries/:id` | 쿼리 수정 / 삭제 |
| PUT | `/queries/:id/brands` | 쿼리-브랜드 연결 |
| POST | `/test-query` | AI 엔진 쿼리 테스트 실행 |
| GET/POST | `/results` | 테스트 결과 조회 / 저장 |
| GET/POST/DELETE | `/reports` | 리포트 관리 |
| GET/POST/DELETE | `/insights` | 인사이트 관리 |
| GET | `/stats` | 통계 데이터 |
| GET | `/trends?range=week\|month\|quarter` | 시계열 트렌드 데이터 |
| PATCH | `/onboarding` | 온보딩 단계 업데이트 |

#### GEO Score (`/api/geo-score`)

| 메서드 | 경로 | 설명 |
|--------|------|------|
| POST | `/analyze` | URL GEO 점수 분석 |
| GET | `/health` | 서비스 상태 확인 |

#### PDF 리포트 (`/api/reports`)

| 메서드 | 경로 | 설명 |
|--------|------|------|
| POST | `/pdf` | AI 가시성 리포트 PDF 생성 |
| POST | `/geo-score` | GEO Score 리포트 PDF 생성 |
| POST | `/insights` | 인사이트 리포트 PDF 생성 |

#### 스케줄러 (`/api/scheduler`)

| 메서드 | 경로 | 설명 |
|--------|------|------|
| GET | `/` | 스케줄러 상태 조회 |
| POST | `/start` | 스케줄러 시작 |
| POST | `/stop` | 스케줄러 중지 |
| POST | `/run-now` | 즉시 실행 |
| PUT | `/config` | 설정 변경 |

---

## 데이터베이스 스키마

| 테이블 | 설명 |
|--------|------|
| `users` | 사용자 정보 (이름, 이메일, 온보딩 단계) |
| `brands` | 브랜드 정보 (이름, 경쟁사, 마케팅포인트, 키워드) |
| `queries` | 모니터링 쿼리 (검색어, 카테고리, 빈도) |
| `query_brands` | 쿼리-브랜드 다대다 관계 |
| `results` | AI 엔진 테스트 결과 (엔진, 인용여부, 응답) |
| `brand_results` | 브랜드별 결과 (인용여부, 순위, 경쟁사 언급) |
| `reports` | 생성된 리포트 (기간, 지표, 하이라이트) |
| `insights` | AI 인사이트 (키워드, 패턴, 콘텐츠 갭) |
| `scheduler_config` | 스케줄러 설정 (싱글톤) |
| `scheduler_history` | 스케줄러 실행 이력 |
| `geo_scores` | GEO 점수 분석 결과 |

---

## 개발 환경 설정

### 사전 요구사항
- Node.js 18+
- Python 3.8+ (PDF 생성용)
- Chrome/Chromium (Puppeteer 크롤링용)

### 환경 변수 (`.env`)
```env
OPENAI_API_KEY=your-openai-key
GEMINI_API_KEY=your-gemini-key
SESSION_SECRET=your-session-secret
VITE_API_URL=http://localhost:3001/api
```

### 프론트엔드
```bash
npm install
npm run dev          # 개발 서버 (Vite, 포트 5173)
```

### 백엔드
```bash
cd server
npm install
pip install reportlab matplotlib numpy
npm run dev          # Express 서버 (포트 3001)
```

### 테스트
```bash
npm test             # 테스트 실행
npm run test:watch   # 워치 모드
```

### 빌드
```bash
npm run build        # 프로덕션 빌드
npm run preview      # 빌드 미리보기
```

---

## 아키텍처

### 전체 구조
```
[브라우저]  ──HTTP──  [Vite Dev Server :5173]  ──프록시──  [Express :3001]  ──  [SQLite]
                                                              │
                                                    ┌────────┼────────┐
                                                    │        │        │
                                               [OpenAI] [Gemini] [Puppeteer]
                                                    │
                                           [Python PDF 엔진]
```

### 설계 패턴
- **Repository 패턴**: 데이터 접근 레이어 추상화
- **Service 패턴**: 비즈니스 로직 분리 (프론트엔드 서비스 모듈, 백엔드 서비스)
- **Context API**: React 전역 인증 상태 관리 (`useAuth` 훅)
- **탭 기반 페이지 구조**: URL 쿼리 파라미터(`?tab=`)로 탭 상태 관리
- **미들웨어 패턴**: Express 인증, CORS, 세션 관리
- **하이브리드 프로세스**: Node.js → Python child_process 스폰 (PDF 생성)

---

## 사용자 플로우

### 첫 사용자
1. `/register`에서 회원가입
2. 온보딩 위자드 4단계 진행 (브랜드 등록 → 질문 추가 → 테스트 실행 → 대시보드 진입)
3. 대시보드에서 성과 확인

### 일상적 사용
1. **브랜드** — 모니터링 대상 브랜드와 경쟁사 관리
2. **질문 관리** — 질문 등록/테스트, 자동 예약 설정
3. **성과** — 개요에서 KPI 확인, 가시성에서 상세 결과, 트렌드에서 시계열 분석
4. **리포트/인사이트** — 주간/월간 리포트 생성, AI 인사이트 확인
5. **GEO 스코어** — 웹사이트 최적화 점수 분석 및 경쟁사 비교

---

## 라이선스

MIT License
