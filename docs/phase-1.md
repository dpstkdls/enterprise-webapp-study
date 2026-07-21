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

### 2026-07-21 — 구현 실습 (#37 #38) + 이해도 체크 퀴즈

**구현하며 배운 것 / 막혔던 것 (#37 servers CRUD, #38 테스트):**

- response 스키마는 문서용이 아니라 **직렬화 계약** — serializerCompiler가 스키마로 응답을 safeParse. `z.string()` 자리에 `Date` 반환 → typecheck가 먼저 잡음 (type provider가 스키마에서 handler 반환 타입을 역산)
- `noUncheckedIndexedAccess`에서 `arr[0]`은 `T | undefined` — `length` 체크는 타입을 못 좁힘, 구조 분해 + `if (!x)` 가드로 404 판별과 타입 좁히기를 한 번에
- PATCH의 id는 body가 아니라 URL — 숨겨도 보안 이득 없음 (HTTPS는 path도 암호화, 진짜 방어는 인가). 리소스 식별은 URL 소관
- 모든 필드 optional인 PATCH에 빈 `{}` → drizzle "No values to set" 500. 클라이언트 입력으로 500이 나면 검증 경계의 구멍 — zod `.refine`으로 400 처리
- `status` 0~1 제한이 zod에만 있고 DB엔 CHECK 제약 없음 — 검증 경계를 우회한 경로(repository 직접 호출)는 아무도 못 막음. 방어를 어느 레이어에 둘지는 결정 사항
- Testcontainers는 Docker 대체가 아니라 Docker를 테스트 생명주기에 맞춰 코드로 제어하는 도구 — 격리(매번 빈 컨테이너 + 마이그레이션부터), 로컬=CI 동일 경로, 랜덤 포트
- testcontainers@12는 Node >=22.19 요구 (undici@8) — 22.17.1 유지하려면 v11 (API 동일)
- 테스트 추가 기준: "이 테스트가 실패하면 어떤 버그를 잡은 건가"에 답 못 하면 안 씀. invalid 값 테스트는 레이어별 소관 — 타입 오류는 TS, 규칙 위반은 route(zod), 제약 위반은 DB

**퀴즈 결과 (평균 5.0/10 — 기준 7할 미달, 취약 주제 재학습 필요):**

| 주제 | 점수 |
|---|---|
| 슬라이스 vs 레이어드 트레이드오프 | 8 |
| 슬라이스 내 파일 분리 실익 | 6 |
| Fastify plugin/decorate 캡슐화 | 0 |
| Drizzle 마이그레이션 수명주기 | 5 |
| zod 컴파일/런타임 보장 구분 | 4 |
| 에러 규격 + 요청 ID | 6 |
| Testcontainers vs mock | 6 |

**취약 주제 재학습 노트:**

1. **Fastify 캡슐화** — decorate/hook은 자기 컨텍스트+자손에게만 보임. `register()`가 컨텍스트를 새로 파고 `fp()`는 부모에 눌러붙음. 판단 기준: "모든 슬라이스가 봐야 하나?" yes → fp (db/config/logger), no → 기본 register (라우트, 슬라이스 전용 hook). fp 남용 = 전역 오염, 미사용 = 간헐적 undefined. app.ts의 register 순서가 사실상 의존성 그래프. → scratch로 케이스 토글 + `hasDecorator` 확인 실습 남음
2. **zod의 이중 보장** — "zod는 런타임에 **데이터**를, 파생 타입은 컴파일에 **내 코드**를 검증한다". `.int().min().max()`는 타입에 안 남음 (추론은 그냥 `number`)
3. **마이그레이션 메커니즘** — 적용된 파일 수정은 에러가 아니라 **조용한 분기**: 기존 DB는 무시(이력 기준), 새 DB만 실행 → 환경별 스키마 drift. generate는 SQL이 아니라 `meta/` snapshot 기준 diff. CI 방어: fresh DB migrate(#38 integration이 수행) + `db:generate` 후 `git diff --exit-code`
4. **에러 응답의 계약 필드** — 클라이언트 분기는 `code` + `status` 클래스. title/메시지는 사람용 문자열이라 계약 아님 (문구 수정이 프론트 장애가 되는 길). requestId는 `x-request-id` 헤더로 이어받고 응답 헤더로도 반환 — 시스템 관통 추적의 연결 고리

**강한 곳:** 구조 트레이드오프 감각, 공유 코드 승격 기준("동시에 변경돼야 하는가" = DRY의 본질)

**다음 단계:** 취약 4개 재학습 → 재퀴즈(4문제) → 7할 이상 시 Phase 2 진행
