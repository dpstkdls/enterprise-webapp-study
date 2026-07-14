# enterprise-webapp-study

모던 엔터프라이즈 규모 웹 애플리케이션을 처음부터 끝까지 만들어보는 스터디 프로젝트.
인증(better-auth)은 한 페이즈일 뿐 — monorepo, typed API, DB, 실시간, 백그라운드 잡, 테스트, CI/CD, 관측성까지 전체 사이클을 다룬다.

## 도메인

**멀티테넌트 실시간 서버 모니터링 대시보드 (SaaS 스타일)**

- 팀(organization) 단위로 서버를 등록하고, 메트릭을 실시간으로 보고, 임계치 알림을 받는 앱
- 선정 이유: 실시간(WebSocket/SSE), 시계열 데이터, 멀티테넌시, 백그라운드 잡이 자연스럽게 다 나옴 + 취업용 간판 프로젝트로 재사용 가능
- 도메인 자체가 목적이 아니므로 메트릭 수집은 가짜 에이전트(랜덤 생성 스크립트)로 대체

## 기술 스택

| 영역 | 선택 | 선정 이유 |
|---|---|---|
| 언어 | TypeScript (strict) | 전 레이어 단일 언어 |
| Monorepo | pnpm workspaces + Turborepo | apps/api, apps/web, packages/shared 구조. 엔터프라이즈 표준 패턴 |
| 백엔드 | Fastify | 업무 스택 연속성. NestJS 없이 **vertical slice 구조**(기능별 `features/` 폴더 + 공용 `infra/`)를 직접 설계 |
| API 계약 | zod + fastify-type-provider-zod → OpenAPI 자동 생성 | 스키마 한 곳에서 검증+타입+문서 동시 해결. 프론트 클라이언트 codegen까지 연결 |
| DB | PostgreSQL | 엔터프라이즈 기본기. docker compose로 로컬 구동 |
| ORM | Drizzle | SQL이 투명하게 보여서 학습에 유리. better-auth adapter 지원. 마이그레이션 CLI 포함 |
| 캐시/세션 | Redis | 캐싱 + rate limit 저장소 + BullMQ 백엔드 겸용 |
| 백그라운드 잡 | BullMQ | 알림 발송, 메트릭 집계 배치 |
| 인증 | better-auth | email/password + OAuth + RBAC + organization(멀티테넌시) |
| 프론트 | Vite + React + TanStack Router/Query | Next.js 대신 SPA — API 서버가 따로 있는 엔터프라이즈 구조에 더 흔한 형태. CORS/쿠키를 정면으로 다룸 |
| UI | Tailwind + shadcn/ui | 대시보드 조립 속도 |
| 실시간 | WebSocket (@fastify/websocket) | 메트릭 스트리밍. SSE와 비교 후 결정하는 것도 학습 포인트 |
| 테스트 | Vitest + Testcontainers + Playwright | unit / integration(실제 Postgres) / E2E 삼단 |
| 로깅 | pino | Fastify 내장. 구조화 로깅 습관 |
| 관측성 | OpenTelemetry + Prometheus + Grafana | docker compose에 같이 띄움 |
| CI/CD | GitHub Actions + Docker multi-stage | lint → test → build → 배포 |
| 배포 | VPS + docker compose (또는 Fly.io) | k8s는 선택 스텝 |

원칙: 각 영역에서 "지루하고 검증된" 선택. 신기술 컬렉션이 아니라 조합 능력이 목표.

## 목표

- [ ] monorepo에서 타입이 API 경계를 넘어 흐르는 구조(스키마→서버 검증→클라이언트 타입)를 설계할 수 있다
- [ ] 마이그레이션 기반 DB 스키마 진화를 운영할 수 있다
- [ ] 인증 전체(세션, RBAC, 잠금, 만료, OAuth, 멀티테넌시)를 설명하고 구현할 수 있다
- [ ] WebSocket 실시간 파이프라인과 백그라운드 잡을 설계할 수 있다
- [ ] 실제 DB를 띄우는 integration 테스트와 E2E를 CI에서 돌릴 수 있다
- [ ] 구조화 로그 + 메트릭 + 트레이스로 문제를 추적할 수 있다
- [ ] Docker로 빌드해서 외부에서 접속 가능한 상태로 배포할 수 있다

## 워크플로

기술 스택과 별개로, 일하는 방식 자체를 현대 팀 표준으로. Phase 0부터 적용하고 끝까지 유지한다.

### 이슈 → 브랜치 → PR 사이클
- 모든 작업은 **GitHub Issue에서 시작** — Phase = Milestone, 작업 단위 = Issue. 이슈 없는 커밋 금지
- **trunk-based**: main + 수명 짧은 feature 브랜치 (`feat/12-oauth-github` 형식, 이슈 번호 포함). gitflow 안 씀 — 솔로+지속 배포엔 과함
- 브랜치는 1~2일 안에 PR로. 오래 사는 브랜치 = 워크플로 실패 신호
- **PR 필수**: main 직접 푸시 금지 (branch protection으로 강제). squash merge로 main 히스토리 = PR 단위

### 리뷰 (솔로 버전)
- 혼자라도 리뷰 패스 분리: PR 올리고 **최소 몇 시간 뒤** GitHub UI에서 셀프 리뷰 — 작성자 모드와 리뷰어 모드를 시간으로 격리
- AI 리뷰 병행 (Claude Code `/code-review` 등) — 지적사항 반영 여부를 PR 코멘트로 남김
- PR 템플릿: 목적 / 변경사항 / 테스트 방법 / 스크린샷

### 커밋 규칙
- **Conventional Commits** (`feat:`, `fix:`, `chore:`, `refactor:`...) — changelog 자동 생성의 전제
- 커밋은 작게, 각 커밋이 빌드 가능한 상태

### CI = 처음부터, 점진적으로 강화
- Phase 0에서 최소 파이프라인(lint + typecheck + build) 가동, 이후 페이즈마다 게이트 추가
- required checks로 등록 — CI 빨간불이면 merge 불가
- Phase별 추가: P1 unit+integration → P3 프론트 빌드+codegen 검증 → P5 E2E + release 자동화

### 의사결정 기록
- 아키텍처급 결정마다 **ADR** 1장 (`docs/adr/NNNN-제목.md`, MADR 양식 간소화) — "왜 Drizzle인가, 왜 SPA인가"를 결정 당시에 기록. 소급 작성 아님
- 페이즈 시작 전 해당 Issue에 간단 설계 메모 (뭘 만들고 어떻게 검증할지 3~5줄)

### 릴리스 + 유지보수 자동화
- **release-please**(또는 유사): conventional commits → 버전 태그 + CHANGELOG + GitHub Release 자동
- **Dependabot**: 의존성 업데이트 PR 자동 생성 — 머지 판단 연습도 학습
- 시크릿 스캔(gitleaks) + `pnpm audit` CI에 포함

### Definition of Done (모든 PR 공통)
- [ ] CI green  [ ] 셀프 리뷰 완료  [ ] 테스트 추가/갱신  [ ] 문서(README/ADR) 반영  [ ] 이슈 연결(`Closes #N`)

## 스터디 플랜

페이즈별 상세는 `docs/phase-N.md`. 각 파일에 작업 / 완료 기준 / **구현 전 던져야 할 질문** / **이해도 퀴즈 프롬프트**가 있다.

| Phase | 문서 | 내용 |
|---|---|---|
| 0 | [docs/phase-0.md](docs/phase-0.md) | 기반 공사 + 워크플로 가동 (monorepo, compose, CI, branch protection, ADR) |
| 1 | [docs/phase-1.md](docs/phase-1.md) | 백엔드 코어 — 첫 슬라이스 `servers` (vertical slice 구조, Drizzle, OpenAPI, 테스트) |
| 2 | [docs/phase-2.md](docs/phase-2.md) | 인증 better-auth — auth 슬라이스 + cross-cutting 테넌시 (session, RBAC, 잠금, 만료, OAuth, org) |
| 3 | [docs/phase-3.md](docs/phase-3.md) | 프론트엔드 — servers 슬라이스를 DB→API→UI로 관통 완성 (TanStack, codegen, CORS) |
| 4 | [docs/phase-4.md](docs/phase-4.md) | 슬라이스 2개 통짜 구현 — `metrics`(WebSocket), `alerts`(BullMQ) + cross-cutting 캐싱 |
| 5 | [docs/phase-5.md](docs/phase-5.md) | 품질 게이트 완성 (E2E, 파이프라인, release-please) |
| 6 | [docs/phase-6.md](docs/phase-6.md) | 배포 + 관측성 (Docker, HTTPS, graceful shutdown, Grafana) |
| 7 | [docs/phase-7.md](docs/phase-7.md) | (선택) 심화 (audit log, k6, k8s, 2FA, preview 환경) |

### 페이즈 진행 루프 (고정)

```
1. 질문   — 페이즈 문서의 "던져야 할 질문"을 AI에게 던지고 자기 언어로 정리
2. 구현   — 이슈 → 브랜치 → PR → CI → merge
3. 검증   — "완료 기준" 전부 통과
4. 퀴즈   — 문서의 퀴즈 프롬프트를 AI에게 그대로 던져 시험 → 7할 미만이면 재학습, 통과해야 다음 페이즈
5. 기록   — 페이즈 문서의 학습 로그 갱신
```

구현하면서 AI에게 코드를 통째로 받는 건 금지 — 질문/리뷰/퀴즈 용도로만. 손이 기억해야 스터디다.

## 규칙

- 페이즈 단위로 체크박스 갱신 + 학습 로그 1~3줄 (각 phase 문서에)
- 막힌 지점이 가장 가치 있는 기록 — 에러 메시지 원문 보존
- 공식 문서가 1차 소스. 블로그는 교차 검증용
- 워크플로 규칙(위 섹션)은 Phase 0부터 끝까지 예외 없음 — 급하다고 main 직접 푸시하는 순간 이 스터디의 절반이 무너짐
