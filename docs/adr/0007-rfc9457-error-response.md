# ADR-0007: 에러 응답 규격 — RFC 9457 Problem Details + 확장

- 상태: 승인됨
- 날짜: 2026-07-16
- 관련: [apps/api/src/infra/error-handler.ts](../../apps/api/src/infra/error-handler.ts), [#33](https://github.com/dpstkdls/enterprise-webapp-study/issues/33)

## 배경

모든 에러가 하나의 응답 규격으로 나가야 한다 (#33). 규격이 통일되면
클라이언트는 에러 파싱 코드 하나, 로깅은 `code` 기준 집계, 모니터링은
5xx 비율/알람 기준이 명확해진다. 자체 규격을 발명하기 전에 표준을 검토했다.

## 검토한 대안

### A. 자체 규격 (`{ status: "error", code, message }`)

- 장점: 자유도 최대
- 기각 이유: "표준이 있는데 왜 안 썼나"에 답이 없음. 검증 에러 표현 등
  이미 풀린 문제를 다시 설계하게 됨

### B. Stripe 스타일 (`{ error: { type, code, message, param } }`)

- 장점: 실무에서 널리 참조되는 잘 만든 컨벤션, `error` 봉투로 에러 식별
- 기각 이유: `param`이 단수라 zod처럼 여러 필드 검증 오류를 한 번에
  반환하는 구조와 안 맞음 — `errors[]`를 커스텀으로 붙이는 순간
  Stripe 규격이 아니라 자체 규격이 됨

### C. RFC 9457 Problem Details + 확장 ← 채택

- IETF 표준(구 RFC 7807), `application/problem+json` 미디어 타입
- Spring Boot 3 / ASP.NET Core 기본 채택 — 생태계 검증 완료
- 확장 필드가 스펙에 내장 — `code`, `requestId`, `errors[]`를 규격 안에서 수용

## 결정

RFC 9457 표준 필드(`type`/`title`/`status`/`detail`) + 확장 3개:

- `code`: 기계 분기용 안정 문자열 (Stripe에서 차용) — 클라이언트 분기는 `type` URI가 아니라 이걸 사용
- `requestId`: 로그 상관관계 (`req.id`에서 핸들러가 주입)
- `errors[]`: zod 검증 실패 시 필드별 오류 (`{ path, message }`로 변환, zod 내부 구조 비노출)

`type`은 `"about:blank"` 고정으로 시작 — 에러 문서 페이지가 생기면
URL로 승격 (`problem()` 함수 한 곳만 수정). `title`은 `node:http`의
`STATUS_CODES`에서 자동 채움 (스펙: `about:blank`일 때 title은 status 문구).

분기 정책:

- `AppError`(도메인 에러) → 해당 status + `code`/`detail`
- `ZodError` → 400 `VALIDATION_ERROR` + `errors[]`
- Fastify 자체 4xx (`FST_ERR_*`) → status/code/message pass-through — 매핑 테이블은 결합 문제가 실제로 생기면 도입
- 그 외 전부 → 500 `INTERNAL_SERVER_ERROR`, `detail` 없음(내부 정보 미노출), 스택은 로그로만

## 결과

- 모든 에러 응답이 `problem()` 함수 하나를 통과 — 규격 이탈이 구조적으로 불가능
- 응답 타입 `ErrorResponse`는 api 내부에 두고, web이 API를 호출하기 시작하면 `@ews/shared`로 승격
- 5xx에 `err.code`가 있어도 pass-through 금지 — 4xx만 통과
