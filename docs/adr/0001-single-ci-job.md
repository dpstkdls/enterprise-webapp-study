# ADR-0001: CI를 단일 job으로 구성

- 상태: 승인됨
- 날짜: 2026-07-15
- 관련: [.github/workflows/ci.yml](../../.github/workflows/ci.yml), PR #12

## 배경

CI 파이프라인에 lint / typecheck / build 세 검사가 필요하다. GitHub Actions에서
이를 job 3개로 분리할지, 단일 job의 step 3개로 둘지 결정해야 한다.

## 검토한 대안

### A. job 3개 분리 (lint / typecheck / build)

- 장점: 병렬 실행, 실패 원인이 job 이름으로 바로 보임, required check를 개별 등록 가능
- 단점: checkout + pnpm setup + install을 job마다 반복 (3중 실행). 현재 전체 검사가
  20초 미만이라 병렬화 이득 < setup 중복 비용

### B. 단일 job, step 순차 실행 (lint → typecheck → build) ← 채택

- 장점: setup 1회. 빠른 검사(lint, 밀리초)가 먼저 죽어서 피드백 순서가 자연스러움
- 단점: 순차 실행이라 전체 시간 = 합. 규모 커지면 병목

## 결정

단일 job `ci`에 step으로 lint → typecheck → build를 순차 실행한다.
required check도 `ci` 하나만 등록한다.

## 결과

- 지금 규모(패키지 4개, 검사 20초)에서 가장 빠르고 단순
- job 이름 `ci`가 branch ruleset의 required check로 등록되어 있으므로,
  **job 이름을 바꾸면 모든 PR 머지가 잠긴다** — rename 시 ruleset도 함께 수정할 것
- 재검토 시점: Phase 5에서 E2E 테스트 추가 시. E2E는 분 단위라 병렬 분리 이득이
  setup 중복 비용을 넘어서므로 job 분리를 다시 검토한다
