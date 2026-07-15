# ADR-0002: squash merge만 허용

- 상태: 승인됨
- 날짜: 2026-07-15
- 관련: repo Settings → Pull Requests, branch ruleset `main-protection`

## 배경

PR을 main에 합치는 방식으로 GitHub는 merge commit / squash / rebase 세 가지를
제공한다. 히스토리 정책을 정하고 저장소 설정으로 강제해야 한다.

## 검토한 대안

### A. merge commit

- 브랜치 커밋 전부 + 머지 커밋이 남음. 작업 과정의 완전한 기록
- 단점: WIP 커밋("fix typo", 실험/revert 쌍)이 main을 오염. 그래프가 갈라져 읽기 어려움

### B. rebase merge

- 브랜치 커밋을 main 위에 직선으로 재생. 커밋 단위 bisect 가능
- 단점: 모든 커밋이 각각 빌드되고 의미 있어야 가치가 있음 — 1인 프로젝트에 과한 규율

### C. squash merge ← 채택

- PR당 커밋 1개. main 히스토리 = 기능 목록
- 단점: PR 내부 커밋 소실 → PR 안쪽으로 bisect 불가

## 결정

squash merge만 허용한다. merge commit / rebase는 repo 설정에서 비활성화.
커밋 메시지 기본값은 PR 제목.

## 결과

- PR #12가 근거 사례: 브랜치에는 `ci 추가` → `고의 타입 에러` → `revert` 3개가
  있었지만 main에는 "CI 파이프라인 추가" 하나만 남았다
- revert 단위 = PR 단위. 기능 롤백이 커밋 하나 revert로 끝남
- bisect 해상도가 PR 단위로 떨어지므로 **PR을 작게 유지하는 것이 전제 조건**
- 포트폴리오 저장소 특성상 `git log`가 읽히는 것 자체가 산출물
