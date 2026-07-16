# Phase 8 — (선택) 두 번째 앱: 관리자 웹앱 + 공통 컴포넌트 관리

모노레포에 앱이 하나면 monorepo의 진짜 문제(공통 코드 관리)를 겪을 수 없다. `apps/admin`을 추가해서 **공통 컴포넌트/설정을 패키지로 추출하고 여러 앱이 소비하는 구조**를 직접 운영해본다. 엔터프라이즈에서 "디자인 시스템 팀"이 하는 일의 축소판.

## 작업

### 1. `packages/ui` 추출 (앱 만들기 전에 먼저)

- `apps/web`에서 admin도 쓸 컴포넌트(Button, Table, Card, 레이아웃 등)를 `packages/ui`로 이동
- shadcn/ui 컴포넌트를 패키지에서 관리하는 방식 결정 (복사 기반이라 일반 라이브러리와 다름 — 이게 학습 포인트)
- Tailwind 설정 공유: preset을 패키지로 뽑아 web/admin이 같은 토큰(색·간격) 사용
- `packages/tsconfig` 패턴 그대로 — ui 패키지도 공유 tsconfig 상속
- 빌드 전략 결정: 패키지를 빌드해서 배포(dist)할지, 소스 그대로 소비(internal package, `exports`에 .tsx 직접)할지

### 2. `apps/admin` 신설

- Vite + React + TanStack Router — web과 같은 스택 (스택 비교가 목적이 아님)
- 기능은 최소 2개면 충분: 전체 org/유저 목록 + 상태 변경(정지 등), audit 성격의 최근 활동 조회
- 인증: better-auth admin 역할 재사용 — 일반 유저는 로그인해도 403
- API는 기존 `apps/api`에 `features/admin` 슬라이스 추가 (별도 서버 만들지 않음)

### 3. 공통 패키지 운영 연습 (이 페이즈의 핵심)

- `packages/ui`의 Button 스타일을 바꾸는 PR → web/admin 둘 다에 영향 — 이 변경을 어떻게 안전하게 내보내나
- Turborepo 파이프라인: ui 변경 시 web/admin만 재빌드·재테스트되는지 캐시 히트/미스로 확인
- CI: affected 기반 실행 (`turbo run test --filter=...[origin/main]`) — ui 변경 PR과 admin-only 변경 PR의 CI 로그 비교
- (선택) Storybook 또는 최소 데모 페이지 — 컴포넌트를 앱 밖에서 확인하는 채널
- (선택) changesets 도입해보고 "internal package엔 과한가?"를 스스로 판정

## 완료 기준

- [ ] `apps/admin`이 `packages/ui` 컴포넌트로 화면을 구성하고, web과 시각적으로 같은 토큰 사용
- [ ] admin 역할만 접근 가능 (E2E 1개: 일반 유저 403)
- [ ] `packages/ui` 컴포넌트 변경 → web/admin 양쪽 반영을 PR 하나로 경험하고, 그 PR의 CI가 두 앱 모두 검증했음을 로그로 확인
- [ ] admin-only 변경 PR에서 web 빌드/테스트가 캐시로 스킵되는 것 확인
- [ ] "ui 패키지에 넣을 것 / 각 앱에 남길 것"의 기준을 ADR 1장으로 기록

## 구현 전 던져야 할 질문

1. 어떤 컴포넌트를 `packages/ui`로 올리고 어떤 건 앱에 남기나? 기준이 "두 앱이 쓰니까"뿐이면 뭐가 잘못되나? (성급한 공통화의 비용)
2. shadcn/ui는 복사 기반인데 이걸 공유 패키지로 만들면 shadcn의 철학과 충돌하나? 실무 모노레포들은 어떻게 푸나?
3. internal package를 빌드 없이 소스로 소비할 때와 dist로 빌드할 때의 트레이드오프는? (타입 속도, HMR, 배포 독립성)
4. `packages/ui`의 breaking change는 어떻게 관리하나? 버전 없이 main에서 함께 움직이는 모노레포에서 "breaking"의 의미는?
5. admin을 별도 앱으로 만드는 것 vs web 안에 `/admin` 라우트로 넣는 것 — 각각 언제 정당한가? 이 프로젝트에선 학습 목적 말고 실무 근거가 있나?
6. Tailwind 토큰을 preset으로 공유할 때, 한 앱만 토큰을 바꾸고 싶어지면 어떻게 되나? (테마 오버라이드 vs 포크)
7. ui 패키지 변경 시 web/admin의 어떤 테스트가 돌아야 충분한가? 컴포넌트 단위 테스트는 패키지에, 통합은 앱에 — 이 분배가 맞나?
8. 앱이 2개가 되면 CORS, 쿠키 도메인, better-auth trustedOrigins는 뭐가 달라지나?

## 이해도 체크 (퀴즈)

```
Phase 8 학습 끝났어. 아래 주제로 퀴즈 5~7문제 내줘.
개념 설명형 + 설계 판단형("이 컴포넌트를 ui 패키지로 올려야 하나?" 같은 케이스)을 섞어서,
한 문제씩 내고 내 답을 채점 + 보충 설명해줘. 다 끝나면 취약 주제 정리해줘.

주제: 공통 컴포넌트 추출 기준과 성급한 공통화, shadcn 복사 모델과 공유 패키지의 긴장,
internal package 소스 소비 vs 빌드 소비, 모노레포에서 breaking change 관리,
별도 앱 vs 라우트 분리 판단, Tailwind preset 공유와 오버라이드,
Turborepo affected 빌드/캐시, 멀티 앱 인증(쿠키/CORS/trustedOrigins)
```

7할 미만이면 재학습 후 종료.

## 학습 로그

<!-- 배운 것 / 막혔던 것 / 퀴즈 결과 -->
