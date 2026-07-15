# ADR-0003: 린터/포매터로 Biome 채택

- 상태: 승인됨
- 날짜: 2026-07-15
- 관련: [biome.json](../../biome.json), PR #11

## 배경

모노레포(React+Vite, Fastify) 전체에 린트와 포맷 규칙이 필요하다.
업계 표준은 ESLint + Prettier 조합이지만 설정 파일, 플러그인, 두 도구 간
충돌 관리 비용이 있다.

## 검토한 대안

### A. ESLint + Prettier

- 장점: 생태계 최대. type-aware 룰(typescript-eslint), 프레임워크별 플러그인 풍부
- 단점: 도구 2개 + 충돌 방지 설정(eslint-config-prettier) + 플러그인 관리.
  대형 레포에서 lint가 분 단위로 느려짐

### B. Biome ← 채택

- 장점: 린트+포맷 단일 도구, 단일 설정 파일. Rust 기반 — 전체 레포 검사 1초 미만이라
  CI 캐싱조차 불필요. `vcs.useIgnoreFile`로 .gitignore 재활용
- 단점: type-aware 린트 없음(타입 검사는 tsc가 전담 — 역할 분리로 해소),
  플러그인 생태계 얇음, 일부 프레임워크 특화 룰 부재

## 결정

Biome 단일 도구로 lint + format을 담당한다. 루트 `biome.json` 하나로 전체
모노레포를 커버하고, 패키지별 중첩 설정은 실제 필요가 생길 때 도입한다.
타입 검사는 `tsc --noEmit`(typecheck 태스크)이 전담한다.

## 결과

- `pnpm lint`가 루트에서 직접 실행 — 빨라서 turbo 태스크로 감쌀 이유가 없음
- 에디터 통일: `.vscode/settings.json`에서 기본 포매터를 Biome로 고정,
  Prettier 확장은 워크스페이스에서 비활성화
- 알려진 동작: Biome 2.2+는 HTML 포매터가 기본 활성화되어 `.svg`도 포맷
  대상 — `files.includes`에서 `!**/*.svg`로 제외함
- 재검토 시점: type-aware 린트 룰이 실제로 아쉬워지거나(예: floating promise
  검출), 팀 확장으로 ESLint 특화 플러그인이 필요해질 때
