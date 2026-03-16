# 모니터링 스택 도입 계획

## 1. 목적
현재 운영 환경은 단일 EC2 위에서 Docker Compose로 STG / PROD / OPS / AUTH 스택을 나눠 운영하고 있다.

이번 모니터링 도입의 목적은 아래 3가지다.

1. EC2 자원 사용량을 Grafana UI에서 확인할 수 있게 한다.
2. 주요 컨테이너의 CPU / 메모리 / 재시작 상태를 Grafana UI에서 확인할 수 있게 한다.
3. 각 컨테이너 로그를 Grafana UI에서 쉽게 검색하고 확인할 수 있게 한다.

초기 목표는 "최소한의 구성으로 운영 가시성을 확보"하는 것이다.
처음부터 무거운 운영 체계를 붙이기보다, 현재 인프라 구조를 크게 흔들지 않는 범위에서 관측성을 확보한다.

---

## 2. 선택한 스택

이번에 선택한 스택은 아래와 같다.

- node_exporter
- cAdvisor
- Prometheus
- Grafana
- Loki
- Promtail

각 역할은 아래와 같다.

- node_exporter
    - EC2 호스트 메트릭 수집
    - CPU, memory, disk, filesystem, network 등 확인

- cAdvisor
    - Docker 컨테이너 메트릭 수집
    - 컨테이너별 CPU, memory, filesystem, network, restart 상태 확인

- Prometheus
    - 메트릭 수집 및 저장
    - node_exporter, cAdvisor 등의 scrape target 관리

- Grafana
    - 메트릭 및 로그 UI 제공
    - Prometheus 데이터와 Loki 데이터를 함께 조회

- Loki
    - 로그 저장 및 검색 백엔드

- Promtail
    - Docker 컨테이너 로그를 수집해서 Loki로 전달

---

## 3. 왜 이 스택을 선택했는가

### 3-1. 현재 요구사항에 가장 직접적으로 맞기 때문
현재 필요한 것은 크게 두 가지다.

1. EC2 자원 사용량 확인
2. 각 컨테이너 로그를 쉽게 확인

이 요구를 가장 직접적으로 만족하는 조합이 아래다.

- 메트릭: node_exporter + cAdvisor + Prometheus + Grafana
- 로그: Promtail + Loki + Grafana

즉, 메트릭과 로그를 모두 Grafana UI에서 볼 수 있게 된다.

### 3-2. 현재 인프라 구조와 잘 맞기 때문
현재 운영 구조상 OPS 스택에 이미 Prometheus와 Grafana가 포함되어 있다.
즉 완전히 새로 시작하는 것이 아니라, 부족한 수집기와 로그 스택만 추가하면 된다.

이 방식은 현재 운영 중인 Docker Compose 기반 구조와도 잘 맞고, 공용 network 기반 구조도 그대로 유지할 수 있다.

### 3-3. 과도하게 무거운 스택을 피하기 위해서
ELK(Elasticsearch, Logstash, Kibana) 같은 구성은 기능은 강하지만 현재 규모에서는 과하다.
운영 복잡도, 메모리 사용량, 디스크 사용량이 빠르게 커질 수 있다.

Loki는 Grafana와 결합이 좋고, Docker 로그 수집 용도로는 상대적으로 가볍다.
현재 단일 EC2 운영 구조에서는 Loki가 더 현실적이다.

### 3-4. 처음부터 너무 많은 exporter를 붙이지 않기 위해서
PostgreSQL exporter, Redis exporter, RabbitMQ exporter, Nginx exporter, Blackbox exporter 등은 나중에 추가할 수 있다.
하지만 지금 1차 목표는 "호스트 자원 + 컨테이너 자원 + 컨테이너 로그" 확보다.

따라서 초기 도입 범위는 아래로 제한한다.

- node_exporter
- cAdvisor
- Loki
- Promtail

Prometheus와 Grafana는 기존 구성을 활용한다.

---

## 4. 구현 범위

초기 구현 범위는 아래와 같다.

### 4-1. EC2 메트릭 수집
- node_exporter 추가
- Prometheus scrape target 등록
- Grafana에서 EC2 CPU / memory / disk / filesystem / network 확인

### 4-2. 컨테이너 메트릭 수집
- cAdvisor 추가
- Prometheus scrape target 등록
- Grafana에서 주요 컨테이너별 CPU / memory / restart 상태 확인

초기 주요 확인 대상 컨테이너:
- ingress-nginx
- api-blue
- api-green
- jenkins
- n8n
- keycloak
- postgres
- redis
- rabbitmq

### 4-3. 컨테이너 로그 수집
- Loki 추가
- Promtail 추가
- Docker 컨테이너 stdout/stderr 로그를 Loki로 전달
- Grafana Explore 또는 로그 패널에서 검색 가능하게 구성

초기 로그 확인 대상:
- ingress-nginx
- prod-app-api-blue
- prod-app-api-green
- stg-app-api-blue
- stg-app-api-green
- docker-jenkins
- docker-n8n
- stg-keycloak
- stg-data-postgres
- stg-data-redis
- stg-data-rabbitmq

### 4-4. 로그 운영 기준
초기에는 아래 원칙으로 운영한다.

- 앱 로그는 Docker stdout/stderr 기준으로 유지
- Spring request logging은 당장 추가하지 않는다
- nginx access log도 가능하면 Docker 로그 기준으로 본다
- 로그 장기 보관, 정교한 파싱, 복잡한 라벨링은 2차 단계로 미룬다

---

## 5. 구현 방식

### 5-1. compose 배치
추가 대상 서비스는 OPS 성격이므로 기존 OPS compose에 함께 두는 방향으로 간다.

추가 예정 서비스:
- node_exporter
- cAdvisor
- Loki
- Promtail

기존 유지 서비스:
- Prometheus
- Grafana
- Jenkins
- n8n

### 5-2. 네트워크 원칙
- 외부 공개 포트는 최소화한다
- node_exporter, cAdvisor, Loki는 외부 포트 공개 없이 내부 네트워크에서만 접근 가능하게 한다
- Prometheus가 내부 네트워크에서 scrape 할 수 있도록 구성한다
- Grafana만 운영자 접근 기준으로 확인한다

### 5-3. 로그 수집 원칙
- Promtail은 Docker 컨테이너 로그를 읽는다
- 로그는 우선 전체 수집 후, 필요 시 제외 대상 컨테이너를 정리한다
- 라벨은 최소 기준으로 시작한다

초기 라벨 예시:
- job
- container
- service
- compose_project

---

## 6. 단계별 작업 순서

### 1단계. Prometheus 현재 설정 확인
- 현재 Prometheus 설정 파일 실제 위치 확인
- compose에서 참조하는 prometheus.yml 경로 확인
- scrape target 수정 가능한 상태인지 확인

### 2단계. node_exporter 추가
- EC2 호스트 메트릭 수집기 추가
- Prometheus에서 scrape 가능하도록 연결

### 3단계. cAdvisor 추가
- Docker 컨테이너 메트릭 수집기 추가
- Prometheus에서 scrape 가능하도록 연결

### 4단계. Prometheus scrape 반영
- node_exporter target 등록
- cAdvisor target 등록
- Prometheus에서 target UP 상태 확인

### 5단계. Grafana 메트릭 대시보드 연결
- EC2 host dashboard 연결
- Docker / container dashboard 연결

### 6단계. Loki 추가
- 로그 저장 백엔드 추가
- 내부 네트워크 기준으로 연결

### 7단계. Promtail 추가
- Docker 로그 수집 설정 추가
- Loki로 로그 전송
- 주요 컨테이너 로그 유입 확인

### 8단계. Grafana Loki datasource 연결
- Grafana에서 Loki datasource 등록
- Explore에서 로그 검색 확인

### 9단계. 운영 로그 검증
- nginx 접근 로그 확인
- backend 로그 확인
- 장애 상황에서 검색 가능한지 확인

---

## 7. 이번 단계에서 하지 않는 것

초기 단계에서는 아래 항목은 제외한다.

- ELK 도입
- Alertmanager 도입
- PostgreSQL exporter 추가
- Redis exporter 추가
- RabbitMQ exporter 추가
- Nginx exporter 추가
- Blackbox exporter 추가
- Spring request logging 증설
- 복잡한 로그 파싱 및 정규화
- 장기 로그 보관 정책 고도화

이 항목들은 1차 도입 후 실제 운영에서 부족함이 확인되면 2차로 검토한다.

---

## 8. 기대 효과

이 구성을 적용하면 아래가 가능해진다.

- Grafana에서 EC2 CPU / memory / disk 사용량 확인
- Grafana에서 컨테이너별 CPU / memory 상태 확인
- 주요 컨테이너 로그를 Grafana UI에서 검색
- 운영 장애 시 메트릭과 로그를 한 화면 체계 안에서 확인
- 현재 Docker Compose 기반 구조를 크게 바꾸지 않고 관측성 확보

---

## 9. 최종 결론

이번 모니터링 1차 도입은 아래 스택으로 진행한다.

- node_exporter
- cAdvisor
- Prometheus
- Grafana
- Loki
- Promtail

선정 이유는 아래와 같다.

1. 현재 요구사항인 "EC2 자원 사용량 확인"과 "컨테이너 로그 확인"을 직접적으로 만족한다.
2. 기존 OPS 스택의 Prometheus / Grafana를 그대로 활용할 수 있다.
3. ELK보다 가볍고 현재 단일 EC2 구조에 더 적합하다.
4. 운영에 필요한 최소 수준의 메트릭 + 로그 가시성을 빠르게 확보할 수 있다.

초기 목표는 "무겁지 않게 붙이고, 실제 운영에서 보이는 문제를 기준으로 다음 단계를 확장하는 것"이다.