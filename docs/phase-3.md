# Phase 3 — 프론트엔드 (servers 슬라이스를 끝까지 완성)

## 슬라이스 배치

프론트도 기능별 폴더. 라우트 파일은 얇게, 실체는 `features/`에:

```
apps/web/src/
├── routes/                # TanStack Router 파일 라우트 (얇은 껍데기)
├── features/
│   ├── auth/              # 로그인/가입 폼, 세션 훅, 라우트 가드
│   └── servers/           # 서버 목록/등록 UI, 쿼리 훅
└── shared/                # api client(codegen 산출물), ui 컴포넌트
```

이 페이즈가 끝나면 **servers가 DB→API→UI까지 관통하는 첫 완성 수직 슬라이스**가 된다. 이후 새 기능은 이 관통 경로를 복제하는 방식으로 추가.

## 작업

- Vite + React + TanStack Router(파일 기반 라우팅) + TanStack Query
- OpenAPI 스펙에서 typed client 생성(openapi-typescript 등) → 서버 스키마 바꾸면 프론트 타입 에러 나는 것 확인
- auth 슬라이스: better-auth 클라이언트 연동, 로그인/가입 페이지, 세션 기반 라우트 가드
- servers 슬라이스: 목록/등록/수정 UI — 백엔드 `features/servers`와 1:1 대응
- cross-origin 정면 돌파: `trustedOrigins`, CORS, 쿠키 sameSite — 뭐가 왜 깨졌는지 기록
- Tailwind + shadcn/ui로 대시보드 레이아웃
- 프론트 테스트: Vitest + React Testing Library 컴포넌트 테스트, MSW로 API mocking — 라우트 가드(비로그인 리다이렉트), servers 목록/폼(로딩·에러·검증 실패) 위주
- CI에 프론트 빌드 + web test 스테이지 + codegen 최신성 검증(생성 파일 diff 체크) 추가

## 완료 기준

- 별도 포트 프론트에서 로그인→org 전환→서버 목록 CRUD 동작 (= servers 슬라이스 end-to-end 완성)
- API 스키마 변경이 프론트 컴파일 에러로 잡힘
- 프론트 테스트가 실서버 없이(MSW) CI에서 통과
- 셀프 점검: 백엔드 `features/servers`와 프론트 `features/servers`가 같은 기능 경계를 갖는가

## 구현 전 던져야 할 질문

1. SPA 인증에서 쿠키 세션 vs 토큰(localStorage) — 각각 무슨 공격에 취약한가? 왜 쿠키를 택했나?
2. CORS preflight(OPTIONS)는 언제 발생하고 언제 생략되나? `credentials: 'include'`가 추가로 요구하는 것은?
3. sameSite=lax 쿠키가 다른 포트/다른 도메인에서 각각 어떻게 동작하나? "같은 origin"의 정확한 정의는?
4. TanStack Query의 캐시 키 설계 — org 전환 시 stale 데이터가 보이는 사고를 어떻게 막나?
5. 클라이언트 라우트 가드는 보안 수단인가? 서버 검증과의 역할 분담은?
6. OpenAPI codegen이 보장하는 것과 보장 못 하는 것은? (스키마 거짓말 시나리오)
7. 파일 기반 라우팅의 장단점은? 어떤 규모부터 이득인가?
8. 프론트에서 기능별 폴더(features/)와 종류별 폴더(components/, hooks/)의 트레이드오프는? 라우트 파일을 얇게 유지하는 이유는?
9. 프론트 컴포넌트 테스트는 뭘 검증할 때 가치 있나? (구현 디테일 vs 사용자 관점 동작) MSW mock이 실제 API와 어긋나는 것(스키마 드리프트)은 뭘로 막나 — codegen 타입과의 관계는?

## 이해도 체크 (퀴즈)

```
Phase 3 학습 끝났어. 아래 주제로 퀴즈 5~7문제 내줘.
개념 설명형 + 시나리오형("이 요청은 preflight가 뜨나?" 같은 예측형 포함)을 섞어서,
한 문제씩 내고 내 답을 채점 + 보충 설명해줘. 다 끝나면 취약 주제 정리해줘.

주제: SPA 인증 저장 위치와 XSS/CSRF, CORS preflight 조건과 credentials,
origin/sameSite 정확한 규칙, TanStack Query 캐시 무효화, 클라 가드 vs 서버 검증,
OpenAPI codegen의 보장 범위, 컴포넌트 테스트 범위와 MSW mock의 한계
```

7할 미만이면 재학습 후 다음 페이즈.

## 학습 로그

<!-- 배운 것 / 막혔던 것 / 퀴즈 결과 -->
