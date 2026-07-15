# ADR-0006: 내부 패키지는 JIT(소스 export) + 소비자 번들

- 상태: 승인됨 (ADR-0004의 shared 빌드 구조 일부를 대체)
- 날짜: 2026-07-15
- 관련: [packages/shared](../../packages/shared), [apps/api/tsup.config.ts](../../apps/api/tsup.config.ts), 이슈 #29

## 배경

#6에서 `@ews/shared`를 dist를 빌드하는 패키지로 만들었더니 두 가지 마찰이 생겼다:

1. **dev 반영 지연** — shared 소스를 고쳐도 rebuild 전엔 web/api가 못 봄.
   shared에 컴포넌트/유틸이 늘수록 HMR 부재가 치명적
2. **stale dist** — 소스와 dist가 어긋날 수 있음. PR #15의 "로컬 초록, CI 빨강"이
   이 구조의 산물 (`dependsOn: ^build`로 완화했지만 근본 원인은 사본의 존재)

shared는 단독 배포·퍼블리시 계획이 없다 — 빌드 산출물의 유일한 소비자가
같은 레포의 web/api뿐이다.

## 검토한 대안

### A. 빌드 패키지 유지 (현행)

- 장점: 한 번 컴파일 → N소비자 재사용(turbo 캐시), 퍼블리시 가능
- 기각: 그 장점이 발동하는 규모(다수 소비자, 외부 배포)가 아님. 비용만 실재

### B. JIT + api는 vite build --ssr로 번들

- 장점: Vitest 도입 시 Vite가 어차피 들어오므로 도구 단일화
- 기각: vite.config의 test 블록과 build 블록은 내용이 안 겹쳐 설정 공유
  실익이 얇음. Vitest는 vite.config 없이도 동작. 서버 번들에 웹 지향
  기본값을 거스르는 설정 필요. 단, two-way door — tsup ↔ vite build 전환은
  스크립트 한 줄이라 재검토 비용 낮음

### C. JIT + api는 tsup으로 번들 ← 채택

- shared: 빌드 없음, `exports`가 `./src/index.ts` 직접 참조
- web dev: Vite가 shared 소스를 import 그래프로 watch → 진짜 HMR
- api dev: tsx가 shared 소스 직접 실행 → 수정 시 자동 재시작
- api prod: tsup `noExternal: ["@ews/shared"]` — shared 소스를 api dist에
  번들. node는 shared의 존재를 모름 (node_modules의 .ts 실행 불가 문제 소멸)
- 단점: 소비자마다 shared를 재컴파일(현 규모에서 무시 가능), tsup 의존성 추가

## 결정

내부 패키지는 소스를 export한다(JIT). prod에서 node로 실행되는 소비자(api)가
번들 책임을 진다(tsup). web은 기존 Vite 번들이 같은 역할을 이미 수행.

## 결과

- shared 수정 → web HMR / api 재시작 즉시 반영. stale dist 클래스의 버그 소멸
- shared의 소스는 가장 엄격한 소비자(api의 NodeNext) 기준을 따라야 함 —
  상대 import에 `.js` 확장자 필수. shared tsconfig도 node.json 상속으로 강제
- turbo `typecheck: dependsOn ^build`는 유지 — 현재는 no-op이지만 빌드되는
  내부 패키지가 다시 생기면 보호막
- 재검토 조건: 내부 패키지를 외부 퍼블리시하게 되거나, 소비자 수가 늘어
  중복 컴파일이 체감될 때 (→ 빌드 패키지 + turbo 캐시로 회귀)
- shared가 브라우저 전용 코드(React 컴포넌트)를 품게 되면 subpath export
  (`./ui`, `./utils`)로 분리 — api 번들에 React가 딸려오는 사고 방지
