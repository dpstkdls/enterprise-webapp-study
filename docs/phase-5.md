# Phase 5 — 품질 게이트 완성

## 작업

- Playwright E2E: 가입→팀 생성→서버 등록→대시보드 확인 핵심 플로우 → CI 최종 스테이지로
- 파이프라인 완성형: lint → typecheck → unit → integration(서비스 컨테이너) → E2E → build (+ gitleaks, pnpm audit)
- 커버리지 리포트(vitest --coverage) 붙여 unit/integration/E2E 비율 실측 — 질문 1의 답을 데이터로. 커버리지 %를 게이트로 강제할지는 스스로 결정하고 근거 기록
- release-please 도입: conventional commits → 자동 버전 태그 + CHANGELOG + GitHub Release

## 완료 기준

- 일부러 버그 넣은 PR이 CI에서 잡힘
- merge하면 release PR 자동 생성 → 첫 v0.x 릴리스 발행

## 구현 전 던져야 할 질문

1. 테스트 피라미드에서 이 프로젝트의 unit/integration/E2E 비율은 실제로 어떻게 됐나? 역피라미드가 왜 나쁜가?
2. E2E는 뭘 검증할 때만 쓰는 게 맞나? "E2E로 다 커버하면 되지 않나"의 반론은?
3. flaky 테스트의 흔한 원인 3가지는? Playwright에서 sleep 대신 뭘 쓰나?
4. CI에서 integration 테스트용 DB는 어떻게 띄우나? (GitHub Actions service container vs Testcontainers) 각각의 제약은?
5. CI 단계 순서는 왜 lint가 먼저인가? (빠른 실패 비용 원칙)
6. release-please는 커밋에서 어떻게 버전을 결정하나? `feat:`/`fix:`/`feat!:`가 각각 semver에 뭘 하나?
7. gitleaks가 CI에서 잡는 것과 못 잡는 것(이미 푸시된 시크릿)의 차이는? 시크릿이 이미 히스토리에 들어갔다면?

## 이해도 체크 (퀴즈)

```
Phase 5 학습 끝났어. 아래 주제로 퀴즈 5~7문제 내줘.
개념 설명형 + 시나리오형("이 커밋들이 머지되면 다음 버전은?")을 섞어서,
한 문제씩 내고 내 답을 채점 + 보충 설명해줘. 다 끝나면 취약 주제 정리해줘.

주제: 테스트 피라미드와 각 층의 역할, E2E 범위 판단, flaky 원인과 대처,
CI에서의 DB 전략, 파이프라인 순서 설계, conventional commits → semver 규칙,
시크릿 스캔의 한계와 유출 시 대응
```

7할 미만이면 재학습 후 다음 페이즈.

## 학습 로그

<!-- 배운 것 / 막혔던 것 / 퀴즈 결과 -->
