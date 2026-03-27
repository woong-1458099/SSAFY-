# 백엔드(Java) 기준 요약

기본 설정: JAVA 25 + Spring Boot 4.0.3

이 문서는 GameInfraTest 작업 시 의존성/구성 기준으로 사용한다.

## 1) Web / 실시간 통신

- Spring Web
  - REST API(컨트롤러), JSON 직렬화/역직렬화, 기본 웹 서버(Tomcat) 포함
- WebSocket
  - 실시간 통신(룸 상태/채팅/알림 푸시)
  - 초기엔 REST만으로 시작하고 필요 시 확장

## 2) 인증 / 보안

- Spring Security
  - 인증/인가 프레임워크(필터 체인, 권한 체크)
- OAuth2 Resource Server
  - JWT 검증(Access Token 서명 검증, 클레임 파싱)

## 3) 요청 검증

- Validation
  - DTO 유효성 검증(`@NotNull`, `@Size` 등)
  - 잘못된 요청을 초기 차단해 API 품질/보안에 도움

## 4) DB / 영속성

- Spring Data JPA
  - ORM 기반 데이터 접근(JPA/Hibernate)
- PostgreSQL Driver
  - PostgreSQL 접속 드라이버
  - 기준 의존성: `runtimeOnly 'org.postgresql:postgresql'`

## 5) 캐시 / 세션 / Redis

- Spring Data Redis
  - Redis를 캐시/레이트리밋/분산락/큐(Streams) 등 일반 용도로 사용

## 6) 메시징(이벤트/큐)

- Spring for RabbitMQ
  - RabbitMQ 기반 메시지 큐(업적 이벤트/로그/AI 후처리 등 비동기 처리)
- 대안: Redis Streams
  - 별도 스타터 없이 Spring Data Redis로 Streams 사용 가능

## 7) 운영 / 헬스체크 / 메트릭(모니터링)

- Spring Boot Actuator
  - 헬스체크(`/actuator/health`), 앱 상태/지표 엔드포인트 제공
  - Blue/Green 배포 헬스체크 기준
- Prometheus (Micrometer Prometheus Registry)
  - `/actuator/prometheus` 메트릭 노출
  - Grafana 대시보드 구성 기반

## 8) 설정 / 개발 편의

- Lombok
  - 보일러플레이트(Getter/Constructor/Builder 등) 축소
- Spring Configuration Processor
  - `@ConfigurationProperties` 자동완성/메타데이터
- Spring Boot DevTools
  - 개발 중 자동 재시작/라이브 리로드(운영 제외)

## 9) DB 마이그레이션

- Flyway Migration (또는 Liquibase)
  - 스키마 변경 버전 관리
  - 무중단 배포에서 DB 변경 리스크 완화
- PostgreSQL 기준 Flyway 의존성
  - `implementation 'org.flywaydb:flyway-database-postgresql'`

## 10) 테스트

- Spring Boot Starter Test
  - JUnit/Mockito 등 기본 테스트 패키지
- Testcontainers
  - 테스트에서 PostgreSQL/Redis/RabbitMQ 통합 테스트
  - PostgreSQL 모듈 좌표는 `org.testcontainers:testcontainers-postgresql` 사용

## 11) API 버저닝 전략 (Spring 공식 API Versioning)

- 방향: Spring Framework 7 공식 버저닝 엔진 사용
- 기본 채택: URL path segment 버저닝
  - 예: `/api/v1/users`, `/api/v2/users`
- 이유
  - Unity/운영 로그/프록시에서 버전 식별이 쉬움
  - 초기 운영 단순성 유지 + 추후 헤더/미디어타입 확장 가능
- 구현 원칙
  1. `ApiVersionConfigurer`로 버전 파서(path segment) 설정
  2. 컨트롤러 매핑에 버전 조건을 명시
  3. 기본 버전(fallback) 정책과 미지원 버전 응답 정책을 명확히 정의
- 운영 원칙
  - `v1` 안정 운영 후 `v2` 병행 공개
  - 버전별 에러율/지연/트래픽 비율 모니터링 후 단계적 종료

## 12) 트레이싱 전략 (Micrometer + OpenTelemetry)

- 목표: 요청 단위 E2E 추적
  - API 수신 -> DB/Redis/RabbitMQ -> Worker 처리 흐름 가시화
- 권장 구성
  - 앱 계층: `micrometer-tracing` + OpenTelemetry bridge/exporter
  - 수집 계층: OpenTelemetry Collector
  - 저장/조회: Tempo(권장) 또는 Jaeger
  - 대시보드: Grafana
- 필수 구현 규칙
  1. 모든 inbound HTTP 요청에 trace context 수신/생성
  2. outbound HTTP, DB 호출, MQ publish/consume에 context 전파
  3. 로그 패턴에 `traceId`, `spanId`, `apiVersion`, `deployColor` 포함
  4. 샘플링 비율은 초기 낮게 시작(예: 5~10%) 후 상황에 맞게 조정
- 기대 효과
  - 장애 원인 파악 시간 단축
  - 느린 구간(쿼리/외부호출/큐 적체) 식별 용이
  - Blue/Green 전환 중 이슈 상관관계 분석 용이

## 현재 프로젝트 반영 체크포인트

1. datasource 기본값은 `jdbc:postgresql://localhost:5432/mydatabase`
2. Compose DB 서비스는 postgres(`5432:5432`) 사용
3. Testcontainers 코드는 `PostgreSQLContainer` 사용
4. 공개/보호 API 정책과 actuator 노출 범위는 인프라 요구사항과 일치해야 함
5. API 버저닝은 Spring 공식 설정 기반으로 `v1`부터 운영
6. 트레이싱은 traceId/spanId 로그 연계 + OTEL 파이프라인 기준으로 구축