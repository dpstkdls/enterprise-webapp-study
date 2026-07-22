# Phase 2 — 인증 (better-auth)

## 슬라이스 배치

auth도 슬라이스: `features/auth/`에 betterAuth 인스턴스 + 설정 + hook을 응집 (핸들러 마운트만 `infra/`). org 스코프 격리 로직은 각 슬라이스가 아니라 공용 preHandler로 — "인증/테넌시는 슬라이스를 가로지르는 cross-cutting concern"을 직접 체감하는 페이즈.

## 작업 (스텝 순서대로)

1. **부트스트랩**: betterAuth 인스턴스 + drizzle adapter, Fastify 마운트, CLI로 스키마 생성 → user/session/account 테이블 확인
2. **email/password**: 가입→로그인→get-session→로그아웃 사이클, devtools에서 쿠키 속성(httpOnly/sameSite) 확인
3. **sliding session**: `expiresIn`/`updateAge` 짧게 설정해 갱신/만료 재현, session.expiresAt 갱신 시점 관찰 후 한 문단 정리
4. **RBAC**: admin plugin + `createAccessControl`, admin 전용 라우트 403/200 확인, `createUser`로 수동 발급
5. **계정 잠금**: `/sign-in/email` rate limit로 429 재현, `banUser`/`banExpires` 기간제 잠금 동작 확인
6. **계정 만료일**: `user.additionalFields.expiresAt` + before hook 거부 — built-in 없는 기능을 hook으로 확장하는 패턴 정리
7. **OAuth**: GitHub → Google, redirect 체인 네트워크 탭 추적, credential↔OAuth account linking 확인
8. **멀티테넌시**: organization plugin — 팀 생성/초대, 서버 리소스를 org 스코프로 격리, 다른 org 데이터 접근 시 404/403
9. **테스트**: 내가 쓴 코드만 — 계정 만료 before hook·잠금 판정 로직 unit 테스트, 가입→로그인→보호 라우트 접근 integration 테스트, org 격리 integration 테스트(다른 org 리소스 404/403). better-auth 내부 동작은 테스트하지 않음

## 완료 기준

- 위 9개 스텝 전부, 테스트는 CI에서 통과

## 구현 전 던져야 할 질문

1. 세션 기반 vs JWT 기반 인증 — 트레이드오프는? better-auth는 왜 세션 기본인가?
2. 세션 쿠키의 httpOnly / secure / sameSite 각각 무슨 공격을 막나? sameSite=lax와 strict의 실사용 차이는?
3. `expiresIn`과 `updateAge`의 정확한 관계는? updateAge가 0이면/expiresIn과 같으면 각각 무슨 일이 생기나?
4. 패스워드 해싱에서 bcrypt/scrypt/argon2 차이는? "느린 해시"가 왜 필요한가?
5. rate limit과 account lockout은 뭐가 다른가? lockout이 오히려 공격 도구(고의 잠금 DoS)가 되는 시나리오는?
6. OAuth authorization code flow를 단계별로 그릴 수 있나? `state` 파라미터는 무슨 공격을 막나? PKCE는 언제 필요한가?
7. account linking에서 "이메일이 같으면 자동 연결"이 위험해지는 조건은? (provider의 이메일 검증 여부)
8. RBAC의 한계는? 어떤 요구사항이 오면 ABAC로 넘어가야 하나?
9. 멀티테넌시에서 org 격리를 미들웨어에서 할 때와 쿼리(WHERE)에서 할 때 각각 뭘 놓칠 수 있나?
10. 외부 라이브러리가 대부분을 소유한 기능에서 "내 코드"의 테스트 경계는 어디인가? 라이브러리 내부 동작까지 테스트하면 뭐가 문제인가?

## 이해도 체크 (퀴즈)

```
Phase 2(better-auth 인증) 학습 끝났어. 아래 주제로 퀴즈 7~10문제 내줘.
개념 설명형 + 시나리오형 + "이 설정이면 무슨 일이 생기나" 예측형을 섞어서,
한 문제씩 내고 내 답을 채점 + 보충 설명해줘. 다 끝나면 취약 주제 정리해줘.

주제: 세션 vs JWT, 쿠키 보안 속성과 대응 공격(XSS/CSRF), sliding session 메커니즘,
패스워드 해싱, rate limit vs lockout과 잠금 DoS, OAuth code flow와 state/PKCE,
account linking 위험, RBAC 설계와 한계, org 단위 데이터 격리,
인증 기능의 테스트 경계(내 코드 vs 라이브러리)
```

7할 미만이면 재학습 후 다음 페이즈. 인증은 특히 — 애매하게 아는 상태로 넘어가지 말 것.

## 학습 로그

<!-- 배운 것 / 막혔던 것 / 퀴즈 결과 -->

### 2026-07-22 — auth 부트스트랩 (#55)

**Q1 답 — 세션 vs JWT:**

- 세션 = "서버가 기억"이라 취소가 쉽고, JWT = "클라이언트가 증명"이라 취소가 안 된다. 인증 라이브러리의 기능 대부분(로그아웃, ban, 기기별 세션 해제, sliding session, org 전환)은 **취소하거나 바꾸는 기능** — 서버 상태 없이는 성립 안 함. better-auth가 세션 기본인 이유
- JWT로 revoke를 풀려면 블랙리스트 = 상태를 다시 들이게 됨 — 세션 비용은 그대로 내면서 즉시성만 잃은 구조
- "세션은 확장 안 됨"은 메모리 세션 시절 오해 — DB 세션이면 앱 서버는 무상태라 수평 확장 문제없음. 조회 병목은 cookie cache(단기 서명 쿠키로 DB 조회 생략) / secondaryStorage(Redis)로 완화. 인스타급도 패턴은 쿠키 세션 — 그 규모에선 라이브러리가 아니라 저장소를 갈아끼움
- 현대의 정리: 승부가 아니라 **배치 문제** — 신뢰 경계 안(브라우저↔자사 백엔드)은 세션, 경계를 넘을 때(OIDC, 서비스 간)는 JWT, JWT 수명은 항상 짧게. 실무는 하이브리드로 수렴: 취소 가능한 앵커(refresh token/세션) + 짧은 무상태 증명(access token/cookie cache)

**배운 것 / 막혔던 것:**

- better-auth 인스턴스는 db가 필요 → 앱은 `createAuth(fastify.db)` 팩토리로 주입, CLI는 env에서 자기 db를 만드는 `auth.config.ts` 사용 — drizzle-kit과 drizzle.config.ts의 관계와 동일한 구조. **앱 코드는 auth.config를 절대 import 안 함** (커넥션 이중화 + cwd 의존 유입)
- 생성 체인: `auth:generate`(설정→schema TS) → `db:generate`(TS→SQL) → `db:migrate`(적용). 역할이 달라 대체 불가. 클론 후 셋업은 migrate만 — generate 산출물은 전부 커밋되므로. "산출물은 손대지 않고 원본을 고친다"가 한 층 위에서 반복됨 (auth.schema.ts의 원본은 auth.ts 설정)
- CLI 기본 산출물명 `auth-schema.ts`는 drizzle glob(`*.schema.ts`)에 **매칭 안 됨** — 에러 없이 무시되는 조용한 함정. `--output`으로 강제
- `process.loadEnvFile` 상대경로는 파일 위치가 아니라 cwd 기준 — package.json script로 감싸 cwd를 고정하는 게 이 레포 컨벤션 (drizzle.config.ts와 동일)
- Fastify 마운트: better-auth handler는 Web Request/Response — 변환 시 **응답 헤더 복사(특히 set-cookie)를 빠뜨리면** 로그인해도 세션 쿠키가 클라이언트에 영영 안 감. 원인 모를 인증 실패의 씨앗
- `tsx watch`는 감시자+서버 2프로세스 — 패턴 kill로 부모만 죽이면 자식이 좀비로 포트 점유. 정리는 포트 기준(`lsof -ti :3000 | xargs kill`)

### 2026-07-22 — email/password 사이클 (#56)

**관찰 기록:**

- 가입→로그인→get-session→로그아웃 사이클 curl로 재현. 세션 쿠키:
  `better-auth.session_token=토큰.서명; Max-Age=604800; Path=/; HttpOnly; SameSite=Lax`
  — `Secure` 없음은 baseURL이 http라서 (배포 시 https면 붙음). 쿠키 값이 `토큰.서명` 2부 구조 — 서명 검증이 DB 조회 전에 위조를 걸러줌
- account.password는 `salt:hash` (scrypt) — 평문 없음 확인

**Q2 답 — 쿠키 속성과 대응 공격:**

- `httpOnly` → XSS: 스크립트가 쿠키를 못 읽음. **XSS = 훔쳐서 쓴다**
- `secure` → 평문 HTTP 전송 차단 (중간자 도청)
- `sameSite` → CSRF: 쿠키는 안 훔쳐짐 — 공격 사이트가 우리 서버로 요청을 날리면 브라우저가 쿠키를 자동 첨부하는 게 문제. **CSRF = 못 보지만 시킨다.** XSS와 방어 축이 다름
- lax vs strict: lax는 최상위 GET 네비게이션(외부 링크 클릭 진입)에 쿠키 허용 — 링크 타고 와도 로그인 유지. strict는 그것도 차단 — 외부 진입 시 로그아웃처럼 보임. POST/fetch류 cross-site는 lax도 차단하므로 CSRF 방어는 유지 → lax가 기본값인 이유

**Q4 답 — 느린 해시:**

- salt = 사전계산(레인보우 테이블) 무효화, 같은 비번도 다른 해시
- 느림 = DB 유출 후 오프라인 브루트포스 단가 상승 — sha256은 GPU 초당 수십억 회, scrypt는 메모리+연산 강제로 초당 수천 회. **salt는 "미리 계산 못 하게", 느림은 "지금 계산도 비싸게"** — 역할이 달라 둘 다 필요

**막혔던 것:**

- sign-up 500: `drizzleAdapter(db, { provider: "pg" })`에 **schema 미전달** — 우리 drizzle 클라이언트는 schema 없이 생성되므로 adapter가 user 모델을 못 찾음. `schema: authSchema` 명시로 해결. auth 슬라이스가 자기 스키마를 자기 adapter에 주입하는 게 의존 방향도 맞음 (infra가 슬라이스 스키마를 알면 역전)
- better-auth는 라우터 내장 — 캐치올 하나가 전부 커버, plugin이 라우트도 추가함. 단 우리 zod provider를 안 거치니 /docs에 안 나옴. 내부 호출용 `auth.api.*`가 따로 있음 (org preHandler에서 쓸 것)
