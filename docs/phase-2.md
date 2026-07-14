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

## 완료 기준

- 위 8개 스텝 전부 + org 격리 integration 테스트

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

## 이해도 체크 (퀴즈)

```
Phase 2(better-auth 인증) 학습 끝났어. 아래 주제로 퀴즈 7~10문제 내줘.
개념 설명형 + 시나리오형 + "이 설정이면 무슨 일이 생기나" 예측형을 섞어서,
한 문제씩 내고 내 답을 채점 + 보충 설명해줘. 다 끝나면 취약 주제 정리해줘.

주제: 세션 vs JWT, 쿠키 보안 속성과 대응 공격(XSS/CSRF), sliding session 메커니즘,
패스워드 해싱, rate limit vs lockout과 잠금 DoS, OAuth code flow와 state/PKCE,
account linking 위험, RBAC 설계와 한계, org 단위 데이터 격리
```

7할 미만이면 재학습 후 다음 페이즈. 인증은 특히 — 애매하게 아는 상태로 넘어가지 말 것.

## 학습 로그

<!-- 배운 것 / 막혔던 것 / 퀴즈 결과 -->
