# Phase 0 — 기반 공사 + 워크플로 가동

## 작업

- pnpm workspaces + Turborepo: `apps/api`, `apps/web`, `packages/shared`
- TS strict, Biome(또는 ESLint+Prettier), 공통 tsconfig
- docker compose: Postgres + Redis
- zod 기반 typed env (`packages/shared/env`)
- 워크플로 가동: GitHub repo + Milestone(Phase별) + 라벨, branch protection(main 직접 푸시 금지 + required checks), PR/이슈 템플릿, 최소 CI(lint+typecheck+build), Dependabot, 첫 ADR 2장(monorepo 구조, Fastify+SPA 선택)

## 완료 기준

- `pnpm build` 전체 통과
- compose로 Postgres/Redis 기동
- 잘못된 env로 부팅 즉시 실패
- 이 페이즈 자체가 이슈→브랜치→PR→CI green→squash merge로 진행됐을 것 (main 직접 푸시로 셋업했다면 미달)

## 구현 전 던져야 할 질문

구현 시작 전 AI에게(또는 스스로) 답을 구하고, 한 줄씩 자기 언어로 정리할 것:

1. pnpm workspaces가 npm/yarn workspaces와 다른 점은? (hoisting, 팬텀 의존성)
2. Turborepo가 실제로 해결하는 문제는? 캐시는 무엇을 기준으로 히트하나?
3. 공통 tsconfig를 상속 구조로 만드는 이유와 한계는?
4. env를 zod로 검증하면 "런타임 어디서" 실패하나? 왜 부팅 시점 실패(fail-fast)가 요청 시점 실패보다 나은가?
5. squash merge / merge commit / rebase merge의 차이 — 왜 이 프로젝트는 squash인가?
6. branch protection의 required checks는 무엇을 강제하고 무엇은 강제 못 하나?
7. ADR은 설계 문서와 뭐가 다른가? 언제 쓰고 언제 안 쓰나?

## 이해도 체크 (퀴즈)

완료 기준 통과 후, AI에게 아래 프롬프트를 던져 퀴즈를 받는다. **7할 미만이면 다음 페이즈 진행 금지, 오답 주제 재학습.**

```
Phase 0 학습 끝났어. 아래 주제로 퀴즈 5~7문제 내줘.
개념 설명형과 시나리오형("~한 상황에서 어떻게 되나")을 섞어서, 한 문제씩 내고
내 답을 채점 + 보충 설명해줘. 다 끝나면 취약 주제 정리해줘.

주제: pnpm workspace 의존성 해석, Turborepo 캐시/파이프라인, tsconfig 상속,
zod env 검증과 fail-fast, squash merge vs 대안들, branch protection이 강제하는 것, ADR의 목적
```

## 학습 로그

<!-- 배운 것 / 막혔던 것 / 퀴즈 결과 -->
