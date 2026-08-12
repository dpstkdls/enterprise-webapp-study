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

### #84 cross-origin 정면 돌파 (2026-08-11)

깨진 것 → 원인 → 고친 것:

1. **proxy 제거 직후**: preflight OPTIONS가 404 → 브라우저가 본 요청(POST sign-in)을 보내지도 않음. 서버에 OPTIONS 핸들러가 없어서. → `@fastify/cors` 등록 (OPTIONS 자동 응답 + `Access-Control-Allow-*` 부착)
2. **Invalid origin 403 (better-auth)**: `.env`에 `WEB_ORIGIN=http://127.0.0.1:5173`로 오타 — origin 비교는 DNS 해석 없는 문자열 비교라 localhost ≠ 127.0.0.1. → localhost로 수정
3. **trustedOrigins가 [undefined]**: `createAuth` 시그니처에 webOrigin 추가했는데 `auth.plugin.ts` 호출부를 안 고침. tsx는 타입 검사 없이 실행해서 런타임까지 조용히 통과 — typecheck 돌렸으면 즉시 잡혔음. → 호출부 수정. "돌아간다 ≠ 타입이 맞다"

핵심 정리:

- **CORS는 origin 기준(scheme+host+port), 쿠키 sameSite는 site 기준(eTLD+1, 포트 무시)** — 그래서 5173↔3000은 CORS 벽은 만나지만 쿠키 벽은 안 만남. 도메인이 갈리면 쿠키 벽(sameSite=none+secure)까지 등판
- preflight는 "form이 원래 못 만들던 모양"의 요청에만 발생 — `Content-Type: application/json` POST 포함
- `credentials: "include"`면 `Access-Control-Allow-Origin: *` 금지, 정확한 origin + `Allow-Credentials: true` 필요
- CORS(브라우저가 집행)와 better-auth Origin 검증(서버가 집행)은 서로 다른 층 — proxy 시절에도 Origin 헤더는 5173 그대로였음(proxy는 Origin을 안 속임)
- better-auth 클라이언트는 credentials 기본 include, openapi-fetch는 기본 same-origin이라 명시 필요

### Phase 3 마감 (2026-08-12, #81~#89 / PR #90~#97)

완료 기준 점검:

- ✅ 별도 포트 프론트에서 로그인→org 전환→서버 목록 CRUD (servers 슬라이스 DB→API→UI 관통, #86에서 시연)
- ✅ API 스키마 변경이 프론트 컴파일 에러로 잡힘 (#82 파괴 실험 + #87 typed mock)
- ✅ 프론트 테스트 9개가 실서버 없이(MSW) 통과, CI 편입 (#87, #88)
- ✅ 백엔드/프론트 `features/servers` 기능 경계 일치 (route/service/repository ↔ api/queries)

회차별 삽질 하이라이트:

- #85: shadcn CLI는 solution tsconfig.json의 paths만 읽음(안 주면 문자 그대로 `@/` 폴더 생성), TS 6은 baseUrl 퇴역, biome은 `css.parser.tailwindDirectives` 필요
- #86: shadcn(base-nova)은 Radix 아닌 Base UI — 합성은 `asChild` 아닌 `render` prop. 활성 org는 클라 상태가 아니라 세션(DB) 상태
- #87: MSW `server.listen`은 setup 최상단(better-fetch가 import 시점에 fetch 캡처), RTL cleanup은 globals:true 전용이라 수동 등록, "서버 검증 실패" 테스트 입력은 브라우저 검증은 통과해야 함. **role/label 쿼리가 LoginForm 라벨-입력 연결 누락(실제 접근성 버그)을 잡음**
- #88: turbo 모노레포는 패키지에 스크립트만 생기면 CI 자동 편입. codegen freshness는 `재생성 + git diff --exit-code`

퀴즈 결과: **평균 6.2/10 (7문제)** — 7할 미만. 재퀴즈는 본인 선택으로 생략, 약점 5개를 Phase 4 시작 시 복습 대상으로 이월.

## 복습 노트 (퀴즈 약점 5)

1. **origin vs site** — origin = scheme+host+port **전부 문자열 일치** (서브도메인·포트 달라도 남). site = scheme + 등록도메인(eTLD+1) — schemeful이라 http↔https도 남. 판정: CORS·fetch credentials는 origin 기준, 쿠키 sameSite는 site 기준. `app.example.com↔api.example.com` = cross-origin이지만 same-site → 쿠키는 붙되(단 `credentials: "include"` 필요) CORS는 필요
2. **XSS: 탈취 vs 도용** (Phase 2부터 2회 이월) — 기준 문장: **"공격이 피해자 브라우저를 벗어날 수 있는가."** localStorage 토큰 = 반출되어 공격자 PC에서 재사용(탈취). httpOnly 쿠키 = 반출 불가, 피해자 브라우저 안에서 스크립트 수명 동안만 도용
3. **simple request** — "1997년 form/img가 만들 수 있던 모양은 preflight 없이 그냥 나간다." 단순 GET·form POST는 서버에 **도달한다** (응답 열람만 차단) — CSRF가 성립하는 이유. json POST·커스텀 헤더·PUT/DELETE만 OPTIONS 선행
4. **Query 재조회는 타이머가 아니라 트리거** — staleTime은 "트리거가 왔을 때 다시 가져올지"의 판정값일 뿐. 트리거 = 리포커스·리마운트·키 변경·invalidate. mutation 후 invalidate 안 하면 다음 우연한 트리거까지 옛 데이터
5. **파이프라인이 못 잡는 구멍** — ① zod 소스↔openapi.json 드리프트 (export가 수동·서버 필요, CI freshness는 openapi.json↔schema.ts만 비교) ② 네트워크 층 전체 (CORS·trustedOrigins·쿠키 — MSW가 통째로 우회) ③ 배포 스큐 (타입은 codegen 시점 스냅샷). 자동화가 안 잡는 목록을 아는 것까지가 도구 이해
