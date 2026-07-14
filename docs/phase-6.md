# Phase 6 — 배포 + 관측성

## 작업

- Docker multi-stage 빌드 (api, web 각각), compose 프로덕션 프로파일
- VPS(또는 Fly.io) 배포, 도메인 + HTTPS(Caddy or Traefik)
- health check + graceful shutdown
- OpenTelemetry 계측 → Prometheus 스크레이프 → Grafana 대시보드 (요청 지연, 에러율, WebSocket 연결 수)

## 완료 기준

- 외부 접속 가능한 URL 존재
- Grafana에서 배포 후 트래픽 관찰
- 프로세스 kill 시 graceful shutdown 로그 확인

## 구현 전 던져야 할 질문

1. multi-stage 빌드가 이미지 크기와 공격 표면에 주는 효과는? 최종 스테이지에 devDependencies가 남으면 뭐가 문제인가?
2. graceful shutdown이 없으면 배포 순간 정확히 무슨 일이 생기나? (진행 중 요청, WebSocket 연결, BullMQ 잡 각각)
3. liveness와 readiness 체크의 차이는? readiness가 DB 연결까지 확인해야 하나 — 양쪽 논거는?
4. 리버스 프록시(Caddy/Traefik)가 앱 앞에 있어야 하는 이유는? TLS 종료를 앱이 직접 하면 안 되나?
5. 로그/메트릭/트레이스는 각각 어떤 질문에 답하나? 하나로 셋을 대체하려 하면 뭐가 무너지나?
6. 모니터링 앱을 만들면서 그 앱을 모니터링한다 — 4 golden signals(latency, traffic, errors, saturation)를 이 앱에선 각각 뭘로 측정하나?
7. env 시크릿은 배포 환경에서 어떻게 주입하나? 이미지에 굽는 것과의 차이는?

## 이해도 체크 (퀴즈)

```
Phase 6 학습 끝났어. 아래 주제로 퀴즈 5~7문제 내줘.
개념 설명형 + 장애 시나리오형("배포 중 유저 요청은 어떻게 되나?")을 섞어서,
한 문제씩 내고 내 답을 채점 + 보충 설명해줘. 다 끝나면 취약 주제 정리해줘.

주제: multi-stage 빌드, graceful shutdown과 연결 드레인, liveness/readiness,
리버스 프록시와 TLS 종료, 로그/메트릭/트레이스 역할 구분, 4 golden signals,
시크릿 주입 방식
```

7할 미만이면 재학습 후 다음 페이즈.

## 학습 로그

<!-- 배운 것 / 막혔던 것 / 퀴즈 결과 -->
