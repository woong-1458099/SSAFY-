# 인프라 문서 인덱스

## 목적
이 문서는 E206 프로젝트의 인프라/배포/운영 관련 문서를 빠르게 찾기 위한 인덱스다.

## 문서 목록

### 1. 현재 진행 상황
- `CURRENT_WORK.md`
- 최근 실제 작업 상태
- 지금 남은 작업
- 가장 먼저 봐야 하는 문서

### 2. CI/CD 운영 문서
- `CI_CD_RUNBOOK.md`
- Jenkins job
- GitLab webhook
- merge 이벤트 정책
- 프론트/백엔드 배포 절차
- credential id
- Cloudflare purge 자동화

### 3. Docker 운영 문서
- `DOCKER_OVERVIEW.md`
- compose 파일 역할
- 프로젝트명
- volume/mount 정책
- nginx 프론트 live 마운트 구조
- 실행 명령

### 4. 환경 변수 운영 문서
- `ENVIRONMENTS.md`
- `.env.local`, `.env.stg`, `.env.prod`, `.env.ops`
- 환경 분리 원칙
- SSH 터널 기준
- 앱/데이터/ops 환경 구분

### 5. Monitoring 설정 문서
- `../Infra/monitoring/MONITORING_STACK_PLAN.md`
- `../Infra/monitoring/README.md`
- monitoring stack 선택 이유
- 설정 파일 위치
- 메트릭 / 로그 구성
- 기본 확인 포인트

### 6. 진행 계획 문서
- `PROGRESS_PLAN.md`
- 완료 작업
- 의사결정 메모
- 다음 단계 계획

## 현재 기준 핵심 운영 값

### 서버 / 경로
- STG 서버 IP: `13.125.26.13`
- 원격 프로젝트 경로: `/home/ubuntu/apps/S14P21E206`

### compose project
- STG app: `stg-app`
- STG data: `stg-data`
- PROD app: `prod-app`

### 도메인
- 메인 서비스: `ssafymaker.cloud`
- Jenkins: `jenkins.ssafymaker.cloud`
- n8n: `n8n.ssafymaker.cloud`
- auth: `auth.ssafymaker.cloud`
- 운영자 점검용: `j14e206.p.ssafy.io`

### 컨테이너
- nginx: `ingress-nginx-1`
- Jenkins: `docker-jenkins-1`
- postgres: `stg-data-postgres-1`
- redis: `stg-data-redis-1`
- rabbitmq: `stg-data-rabbitmq-1`
- node_exporter: `docker-node-exporter-1`
- cadvisor: `docker-cadvisor-1`
- loki: `docker-loki-1`
- promtail: `docker-promtail-1`

### 프론트 배포 경로
- STG releases: `/home/ubuntu/deploy/frontend/stg/releases`
- STG live: `/home/ubuntu/deploy/frontend/stg/live`
- PROD releases: `/home/ubuntu/deploy/frontend/prod/releases`
- PROD live: `/home/ubuntu/deploy/frontend/prod/live`

### 운영 모니터링 계획
- `docs-infra/OBSERVABILITY_PLAN.md`
- `../Infra/monitoring/MONITORING_STACK_PLAN.md`
- `../Infra/monitoring/README.md`
- `node_exporter`
- `cAdvisor`
- `Loki`
- `Promtail`
- Prometheus scrape
- Grafana 대시보드
- Grafana 로그 조회
- Nginx access log 운영 기준

## 문서 관리 원칙
- 루트에는 안내 문서만 두고, 세부 문서는 `docs-infra/` 에 모은다.
- 실제 운영 값이 바뀌면 인덱스와 세부 문서를 함께 갱신한다.
- 프론트/백엔드/infra 공통 값은 중복 서술하더라도 실제 작업에 유리하면 남긴다.