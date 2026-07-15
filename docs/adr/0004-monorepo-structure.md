# ADR-0004: pnpm workspace + Turborepo 모노레포

- 상태: 승인됨
- 날짜: 2026-07-15 (기록일 — 결정 자체는 Phase 0 초기, PR #10)
- 관련: [pnpm-workspace.yaml](../../pnpm-workspace.yaml), [turbo.json](../../turbo.json)

## 배경

React SPA(web)와 Fastify API(api)를 함께 개발한다. 코드 공유(타입, env 스키마),
통일된 도구 설정, 원자적 변경(API와 클라이언트를 한 PR로)이 필요하다.

## 검토한 대안

### A. 레포 분리 (web / api 각각)

- 장점: 레포당 단순, 배포 독립
- 단점: 타입 공유가 패키지 퍼블리시 or 복붙이 됨. API 계약 변경이 PR 2개 +
  순서 조율. 1인 프로젝트에서 오버헤드만 있고 이득 없음

### B. 단일 레포, 워크스페이스 없음 (폴더만 분리)

- 장점: 가장 단순
- 단점: 의존성/스크립트가 한 package.json에 뒤엉킴. `@ews/shared` 같은
  내부 패키지 경계를 만들 수 없음

### C. pnpm workspace + Turborepo ← 채택

- pnpm: 디스크 효율(하드링크), 엄격한 호이스팅(유령 의존성 차단), workspace 프로토콜
- Turborepo: 태스크 그래프(`dependsOn: ^build`) + 캐싱 — "shared 빌드 후
  api typecheck" 같은 순서를 선언으로 해결
- 단점: 도구 2개의 학습 비용, 태스크 의존성 선언 누락 시 "로컬 초록, CI 빨강"
  (실제로 PR #15에서 겪음 → typecheck에 `^build` 추가)

## 결정

pnpm workspace + Turborepo. 구조는 `apps/`(배포 단위: web, api)와
`packages/`(공유 코드: shared, tsconfig)로 분리.

## 결과

- 내부 패키지는 `workspace:*`로 참조, 버전 관리 없음 (퍼블리시 안 함)
- 태스크 간 의존은 반드시 turbo.json에 선언해야 함 — 암묵적 순서는 CI에서 깨짐
- 학습 목적 부합: 실무 표준 모노레포 패턴을 작은 규모로 경험
