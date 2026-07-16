# Phase 1 — 백엔드 코어 (첫 수직 슬라이스: servers)

## 구조 원칙: vertical slice

레이어별 폴더(`routes/`, `services/`, `repositories/`)가 아니라 **기능별 폴더**. 한 기능의 라우트→검증→로직→DB 접근이 폴더 하나에 응집:

```
apps/api/src/
├── infra/                 # 슬라이스가 공유하는 것만: db 클라이언트, env, 에러 핸들러, logger, auth 마운트
└── features/
    └── servers/           # 슬라이스 = 기능 단위
        ├── servers.routes.ts      # 라우트 + zod 스키마
        ├── servers.service.ts     # 도메인 로직
        ├── servers.repository.ts  # DB 접근
        ├── servers.schema.ts      # Drizzle 테이블 정의
        └── servers.test.ts
```

이후 페이즈의 auth/metrics/alerts도 전부 `features/` 아래 슬라이스로 추가된다. 새 기능 = 새 폴더, 기존 슬라이스 수정 최소화.

## 작업

- `infra/`: db 클라이언트, 전역 에러 핸들러 + 에러 응답 규격, pino 구조화 로깅(요청 ID 포함), OpenAPI(Swagger UI) 셋업
- 첫 슬라이스 `features/servers`: Drizzle 테이블 + 마이그레이션, zod type provider 라우트(CRUD) → `/docs` 자동 반영
  - metrics 테이블은 여기서 만들지 않음 — Phase 4의 metrics 슬라이스가 자기 테이블을 가져감
- Vitest unit + Testcontainers로 repository integration 테스트 → CI에 test 스테이지 추가
- ADR: vertical slice 구조 선택(레이어드 대비), Drizzle 선택, 에러 응답 규격

## 완료 기준

- servers CRUD가 OpenAPI 문서에 자동 반영
- integration 테스트가 실제 Postgres 컨테이너로 CI에서 통과
- 셀프 점검: "가짜 기능 하나를 추가한다면 `features/` 폴더 하나로 끝나는가, infra를 고치게 되는가?" — infra를 고쳐야 하면 경계 재조정

## 구현 전 던져야 할 질문

1. vertical slice vs 레이어드 — 각각 뭐가 응집되고 뭐가 흩어지나? 이 프로젝트에서 슬라이스를 택한 근거를 스스로 말할 수 있나? (반론 포함)
2. 슬라이스 안에서도 routes/service/repository를 파일로 나누는 실익은? 파일 하나로 합치면 안 되나?
3. 슬라이스끼리 공유해야 하는 코드가 생기면 어디로 가야 하나? `infra/`가 쓰레기장이 되는 것을 막는 기준은?
4. NestJS 같은 DI 컨테이너 없이 Fastify에서 의존성은 어떻게 전달하나? (plugin, decorate 패턴) 슬라이스 등록은 어떻게 조립하나?
5. 마이그레이션 파일은 왜 손으로 안 고치나? 테이블 정의가 슬라이스별로 흩어져도 마이그레이션은 왜 전역 하나인가?
6. zod type provider는 컴파일 타임에 뭘 보장하고 런타임에 뭘 보장하나? 둘의 간극은?
7. 에러 응답 규격을 통일하면 클라이언트/로깅/모니터링 각각에서 뭐가 좋아지나?
8. 요청 ID(correlation ID)는 어디서 만들어 어디까지 흘러가야 하나?
9. Testcontainers vs DB mock — 각각 언제 옳은가? mock으로 integration 테스트를 대체하면 뭘 놓치나?

## 이해도 체크 (퀴즈)

```
Phase 1 학습 끝났어. 아래 주제로 퀴즈 5~7문제 내줘.
개념 설명형과 시나리오형을 섞어서, 한 문제씩 내고 내 답을 채점 + 보충 설명해줘.
다 끝나면 취약 주제 정리해줘.

주제: vertical slice vs 레이어드 트레이드오프, 슬라이스 간 공유 코드 배치 기준,
Fastify plugin/decorate 의존성 전달과 슬라이스 조립, Drizzle 마이그레이션 수명주기,
zod 검증의 런타임/타입 보장 차이, 에러 규격 설계, 구조화 로깅과 요청 ID,
Testcontainers vs mock 판단 기준
```

7할 미만이면 재학습 후 다음 페이즈.

## 학습 로그

<!-- 배운 것 / 막혔던 것 / 퀴즈 결과 -->

### 2026-07-16 — 전역 에러 핸들러 (#33)

**Q7 답 — 에러 응답 규격 통일의 효용:**

- 클라이언트: 에러 파싱 코드가 하나. `code`로 분기, `errors[]`로 폼 필드 매핑 — 엔드포인트마다 에러 모양 확인할 필요 없음
- 로깅: 모든 에러가 `requestId` 달고 나가서 응답 ↔ 서버 로그 1:1 대조 가능. `code` 기준 집계 쿼리 가능
- 모니터링: 5xx 비율/알람 기준이 명확. `type`/`code`가 안정 식별자라 대시보드가 메시지 문자열 파싱에 의존 안 함

**배운 것 / 막혔던 것:**

- TS `type`은 컴파일 후 지워짐 → `instanceof` 불가. 런타임 판별 필요하면 class (에러는 JS 관용구가 class — zod/Fastify도 class 에러)
- `reply.json()`은 Express API. Fastify는 `reply.send()`. 핸들러 파라미터에 타입 안 붙이면(implicit any) 이런 존재하지 않는 API를 tsc가 못 잡음 — 타입 생략이 런타임 크래시로 이어진 실례
- zod v4는 `err.errors` 없음 → `err.issues`. 외부 라이브러리 내부 구조를 응답에 그대로 내보내지 말고 경계에서 변환할 것
- `requestId`는 요청 소속 — 에러 객체가 아니라 핸들러가 `req.id`에서 주입
- 규격 강제는 타입 선언만으로 부족 — 모든 분기가 생성 함수 하나(`problem()`)를 통과하게 해야 구조적으로 이탈 불가
- 에러 규격은 RFC 9457 채택 — 근거는 [ADR-0007](adr/0007-rfc9457-error-response.md)
