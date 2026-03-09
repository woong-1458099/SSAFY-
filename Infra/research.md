# 인프라 요약

(EC2 1대 시작, Docker/Compose, Blue-Green, 자체 모니터링)

## 1) 목표

- Unity 게임 백엔드 운영을 위한 컨테이너 기반 인프라 구성
- 무중단(Blue/Green) 배포 + 빠른 롤백
- AWS CloudWatch 미사용, 자체 모니터링(Prometheus/Grafana)
- 비동기 이벤트 처리(큐/워커) 기반 확장

---

## 2) 배포 단위 및 실행 환경

- 호스트: EC2 1대(초기), 추후 다중 인스턴스 + LB 확장 고려
- 실행: Docker + Docker Compose
- 진입점: nginx(Reverse Proxy)
- 배포 전략: Blue/Green (api-blue / api-green 2벌 + nginx 스위칭)

---

## 3) 컨테이너 구성(초기)

### Gateway

- nginx
  - 80/443 수신(SSL 종료는 추후)
  - `/api` -> 활성 API(blue/green)로 reverse proxy
  - 배포 시 upstream 변경 + reload로 트래픽 스위치
  - 롤백은 upstream을 이전 버전으로 되돌리면 즉시 가능

### Application

- api-blue / api-green (Spring Boot)
  - REST API + (필요 시) WebSocket
  - 헬스체크 엔드포인트로 배포/가용성 판단
- worker (Spring Boot 또는 별도 서비스)
  - 큐 소비하여 업적/로그/AI 후처리 등 비동기 처리

### Data / Messaging

- PostgreSQL (초기엔 컨테이너 가능, 운영은 분리 권장)
- Redis (캐시/레이트리밋/분산락/Streams 등)
- Message Queue
  - RabbitMQ (Erlang 기반 - 매우 빠르고 경량화)
  - DB 부하 완충 및 이벤트 기반 처리용

### Observability

- Prometheus
  - Spring Actuator/Micrometer 메트릭 수집
  - node_exporter 메트릭 수집(호스트 자원)
- Grafana
  - 대시보드(서버 상태, 자원 %, API 지표, 큐 적체량 등)

---

## 4) 트래픽/처리 흐름

### 동기 요청(즉시 응답)

- Unity -> nginx -> (blue 또는 green) API -> DB/Redis -> 응답
- 회원가입/로그인/조회 등은 DB가 살아있어야 정상 처리 가능

### 비동기 요청(나중 처리)

- Unity -> API -> Queue publish(빠른 응답) -> worker consume -> DB 반영
- 도전과제/업적 이벤트, 로그 적재, AI 작업물 반영 등은 큐/워커로 처리

---

## 5) 무중단 배포(Blue/Green) 운영 방식

- Jenkins 파이프라인(요약)
  1. 새 이미지 빌드/푸시
  2. green 컨테이너 기동
  3. 헬스체크 통과 확인
  4. nginx upstream을 green으로 전환 + reload
  5. 문제 발생 시 즉시 blue로 롤백
- 핵심 요건
  - API에 확실한 헬스체크 엔드포인트 필요
  - DB 스키마 변경은 forward-compatible 방식으로 진행(무중단 유지)

---

## 6) 모니터링 범위(CloudWatch 없이)

### 서버 생존/상태

- 서비스 up/down
- 현재 활성 버전(blue/green)
- 배포 중 상태(헬스체크 실패/성공)

### API 지표

- RPS(요청수)
- latency(p95/p99)
- error rate(4xx/5xx)
- (선택) WebSocket 연결 수

### 자원 지표

- CPU/메모리/디스크/네트워크 사용률(%)
- 디스크 용량 부족 알림(로그/메트릭 저장량 관리)

### 큐/워커 지표

- 큐 적체량(백로그)
- 처리량(consume rate)
- 실패/재시도 수

---

## 7) AI 영상 서빙/삭제 정책

- AI 생성 영상은 EC2에 임시 저장 후 사용자에게 제공
- 전달 직후 또는 짧은 TTL 만료 시 즉시 삭제
- 파일 경로 직접 노출 금지(토큰 기반 1회성/단기 URL 권장)
- 디스크 임계치(예: 70/85/95%) 모니터링 및 알림 필요
- Blue/Green 전환 시 tmp 디렉터리 공유 여부를 명시하고 정리 충돌 방지

---

## 8) API 버저닝 운영 방침 (Spring 공식 방식 기준)

- 정책: URL path segment 기반 버저닝을 기본으로 사용
  - 예: `/api/v1/...`, `/api/v2/...`
- 구현: Spring Framework 7 API Versioning 설정(`ApiVersionConfigurer`) 사용
- 라우팅: nginx는 `/api` 프리픽스만 유지, 앱 내부에서 버전 라우팅 처리
- 전환 전략
  1. `v1`를 기본/안정 버전으로 운영
  2. `v2` 출시 시 동시 운영(점진 전환)
  3. 메트릭에서 버전별 트래픽 비율 추적 후 `v1` 종료 공지
- 운영 규칙
  - 기본 버전 fallback 동작을 명시(헤더 누락/잘못된 버전 요청 대응)
  - 배포/롤백 시 버전별 에러율(4xx/5xx), p95 latency를 별도 확인

## 9) 트레이싱 운영 방침 (CloudWatch 미사용)

- 목표: 요청 1건의 흐름을 `nginx -> api -> redis/rabbitmq/db -> worker` 단위로 추적
- 구성 권장
  - 앱: Micrometer Tracing + OpenTelemetry bridge/exporter
  - 수집기: OpenTelemetry Collector
  - 저장/조회: Grafana Tempo(또는 Jaeger)
  - 시각화: Grafana(메트릭 + 트레이스 연계)
- 필수 표준
  - Trace Context(W3C) 전파
  - 로그에 `traceId`, `spanId`, `version(v1/v2)`, `deploy_color(blue/green)` 포함
  - 비동기 메시지(RabbitMQ)에도 trace context 전달
- 운영 지표
  - 엔드포인트별 지연 구간(DB/외부호출/큐 publish-consume) 파악
  - 장애 시 trace 기반 root cause 추적 시간 단축

---

# 인프라에 직접 영향 주는 Java 의존성/기능(앱 쪽)

## 1) 헬스/메트릭(모니터링 핵심)

- spring-boot-starter-actuator
  - `/actuator/health`로 배포 헬스체크 기준 제공
  - 운영 상태/지표 엔드포인트 제공
- micrometer-registry-prometheus
  - `/actuator/prometheus`로 Prometheus 수집 가능
  - Grafana 대시보드 구성의 데이터 소스

## 2) 인증 방식(프록시/운영에 영향)

- spring-boot-starter-security
  - 인증/인가 필터 체인
- oauth2 resource server(JWT)
  - JWT 서명 검증 기반 stateless 구성
  - 세션 저장소 의존 없이 수평 확장에 유리
  - (Refresh 토큰/레이트리밋 등은 Redis로 보강)

## 3) DB/마이그레이션(배포에 영향)

- spring-boot-starter-data-jpa + postgresql driver
  - 트랜잭션/정합성 영역의 중심
- flyway (flyway-core + flyway-database-postgresql)
  - 스키마 변경을 코드로 관리
  - Blue/Green 배포 시 DB 변경 장애를 줄이는 핵심

## 4) Redis(운영 기능에 영향)

- spring-boot-starter-data-redis
  - 캐시/레이트리밋/분산락/Streams 등
  - 트래픽 증가 시 DB 부담 완화 및 운영 안정성 향상

## 5) 메시징/이벤트(비동기 구조에 영향)

- spring-boot-starter-amqp
  - 이벤트 기반 처리, 백로그/완충 구조 구현
  - worker 분리 및 확장에 핵심

## 6) 실시간(선택)

- spring-boot-starter-websocket
  - 룸/알림/채팅 등 실시간 푸시
  - 연결 수/메시지량 모니터링 필요

## 7) API 버저닝(공식)

- spring-webmvc (Spring Framework 7 API Versioning)
  - `ApiVersionConfigurer`로 버전 해석 규칙(path segment 등) 정의
  - URL 기반 운영(`v1`, `v2`) + 필요 시 헤더/미디어타입 확장 가능

## 8) 트레이싱(공식 권장 라인)

- micrometer-tracing + OpenTelemetry exporter/bridge
  - trace/span 생성 및 전파
  - 로그/메트릭/트레이스 상호 연계로 운영 가시성 강화
