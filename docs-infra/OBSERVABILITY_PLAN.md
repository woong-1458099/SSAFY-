# 운영 모니터링 도입 계획

## 1. 목적
현재 배포 / CI_CD / 도메인 / STG-PROD 분기 구조를 우선 안정화하고, n8n 자동화 작업 이후 운영 모니터링을 최소 구성으로 붙인다.

목표:
- Grafana에서 EC2 자원 상태 확인
- Grafana에서 주요 컨테이너 자원 상태 확인
- Nginx access log는 컨테이너 로그 또는 기본 로그 파일 기준으로 확인
- Spring 로그는 `docker logs` 기준으로 운영
- 로그 수집 시스템은 당장 무겁게 붙이지 않는다

## 2. 적용 시점
이 작업은 아래가 끝난 뒤 진행한다.
1. STG / PROD 도메인 분기 확정
2. `develop` / `master` 배포 정책 확정
3. 프론트 `live + rsync` 구조 안정화
4. n8n 자동화 작업 마무리

## 3. 적용 대상
초기 적용 대상은 STG가 아니라 PROD 기준으로 잡는다.

이유:
- 실제 운영 트래픽 기준 access log를 봐야 의미가 있다.
- 실제 해외 IP / 봇 / 스캐너 패턴은 운영 환경에서만 제대로 보인다.
- 실제 자원 사용량은 운영 환경을 기준으로 확인해야 의미가 있다.

## 4. 기본 원칙
- 현재 구성은 유지하고 추가는 최소로 간다.
- 메트릭은 Grafana + Prometheus 중심으로 본다.
- 로그는 Docker stdout/stderr 기준으로 수집하고, Grafana에서는 Loki를 통해 조회한다.
- Nginx access log와 Spring 컨테이너 로그는 기존 운영 방식으로 확인한다.
- 필요해질 때만 request logging, log pipeline, log storage를 추가 검토한다.

## 5. 추가한 컨테이너
초기 구성은 아래 4개를 추가한다.

- `node_exporter`
- `cAdvisor`
- `Loki`
- `Promtail`

## 6. 작업 범위

### 6-1. EC2 메트릭 연결
- `node_exporter` 추가
- Prometheus scrape target에 `node_exporter` 추가
- Grafana에서 EC2 CPU / 메모리 대시보드 연결

### 6-2. 컨테이너 메트릭 연결
- `cAdvisor` 추가
- Prometheus scrape target에 `cAdvisor` 추가
- Grafana에서 컨테이너별 CPU / 메모리 대시보드 연결

초기 확인 대상 컨테이너:
- nginx
- api-blue
- api-green
- jenkins
- n8n
- keycloak
- postgres
- rabbitmq
- redis

### 6-3. 컨테이너 로그 연결
- `Loki` 추가
- `Promtail` 추가
- Docker 컨테이너 stdout/stderr 로그를 `Promtail -> Loki` 기준으로 수집
- Grafana Explore 또는 로그 패널에서 컨테이너 로그 검색 가능하도록 구성

초기 확인 대상 컨테이너:
- nginx
- api-blue
- api-green
- jenkins
- n8n
- keycloak
- postgres
- rabbitmq
- redis

### 6-4. Nginx access log 정비
- Nginx access log 활성 상태 확인
- 가능하면 stdout 또는 기본 access.log 기준으로 일관되게 정리
- 로그 포맷은 처음엔 최소형으로 유지
- 우선 확보할 필드:
    - host
    - uri
    - status
    - CF-Connecting-IP
    - user-agent
- 로그 분류는 나중에 추가

### 6-5. Spring 컨테이너 로그 기준 고정
- `docker logs stg-app-api-blue-1`
- `docker logs stg-app-api-green-1`
- 필요 시 `-f`, `--tail` 기준 운영 명령 문서화
- 요청 로그가 부족하면 그때 Spring / Tomcat request logging 추가 검토

### 6-6. Grafana 대시보드 구성
초기 대시보드:
- EC2 CPU
- EC2 메모리
- 컨테이너별 CPU
- 컨테이너별 메모리
- 재시작 여부

로그는 Loki를 통해 Grafana에서 조회하고, 필요 시 `docker logs`를 보조 운영 수단으로 사용한다.

## 7. 예상 결과
- Grafana에서 EC2와 각 컨테이너 자원 사용률 확인 가능
- Grafana에서 주요 컨테이너 로그 검색 가능
- 실제 운영 access log와 backend 로그를 Grafana 또는 `docker logs` 기준으로 확인 가능
- 컨테이너 추가를 최소화하면서 메트릭과 로그 가시성을 함께 확보 가능

## 8. 작업 순서
1. `node_exporter` 추가
2. `cAdvisor` 추가
3. Prometheus scrape 설정 반영
4. Grafana 메트릭 datasource 확인
5. `Loki` 추가
6. `Promtail` 추가
7. Grafana Loki datasource 확인
8. Grafana에서 메트릭 / 로그 동작 검증
9. nginx / backend 로그 운영 기준 문서화

## 9. 추가 메모
- STG보다 PROD 기준 적용이 더 의미 있다.
- 앱 로그 증설보다 메트릭과 access log부터 붙이는 순서가 안전하다.
- request logging은 로그량 증가 위험이 있어 마지막 단계에서 검토한다.