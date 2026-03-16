# 작업 안내

이 프로젝트의 인프라/배포/CI_CD 관련 작업을 시작할 때 먼저 이 문서를 본다.

## 문서 위치
관련 문서는 모두 `docs-infra/` 폴더 아래에 정리한다.

## 문서 읽는 순서
1. `docs-infra/CURRENT_WORK.md`
2. `docs-infra/INFRA_INDEX.md`
3. 필요한 세부 문서

## 어떤 내용이 어디 있는지

### 지금 진행 중인 작업 / 최근 변경 / 다음 액션
- `docs-infra/CURRENT_WORK.md`

### 전체 인프라/문서 인덱스
- `docs-infra/INFRA_INDEX.md`

### Jenkins / GitLab webhook / CI_CD / 배포 절차
- `docs-infra/CI_CD_RUNBOOK.md`

### docker compose / nginx mount / volume / 네트워크 / 운영 명령
- `docs-infra/DOCKER_OVERVIEW.md`

### monitoring 설정 / 로그 / 메트릭 구성
- `Infra/monitoring/MONITORING_STACK_PLAN.md`
- `Infra/monitoring/README.md`

### env 파일 역할 / 환경별 변수 운영 원칙
- `docs-infra/ENVIRONMENTS.md`

### 장기 계획 / 결정 사항 / 다음 할 일
- `docs-infra/PROGRESS_PLAN.md`

## 현재 운영 기준 핵심 값
- STG 서버 IP: `13.125.26.13`
- 원격 프로젝트 경로: `/home/ubuntu/apps/S14P21E206`
- STG app project: `stg-app`
- STG data project: `stg-data`
- nginx container: `ingress-nginx-1`
- STG 프론트 release 경로: `/home/ubuntu/deploy/frontend/stg/releases`
- STG 프론트 live 경로: `/home/ubuntu/deploy/frontend/stg/live`
- PROD 프론트 release 경로: `/home/ubuntu/deploy/frontend/prod/releases`
- PROD 프론트 live 경로: `/home/ubuntu/deploy/frontend/prod/live`
- 메인 도메인: `ssafymaker.cloud`
- Jenkins 도메인: `jenkins.ssafymaker.cloud`
- n8n 도메인: `n8n.ssafymaker.cloud`
- auth 도메인: `auth.ssafymaker.cloud`

### 운영 모니터링 계획
- `docs-infra/OBSERVABILITY_PLAN.md`
- `Infra/monitoring/MONITORING_STACK_PLAN.md`
- `Infra/monitoring/README.md`
- node_exporter
- cAdvisor
- Loki
- Promtail
- Prometheus scrape
- Grafana 대시보드
- Grafana 로그 조회
- Nginx access log 운영 기준

## 작업 규칙
- 실제 값이 확인된 것은 문서에 정확히 적는다.
- 인프라 관련 값은 추상적으로 쓰지 말고 실제 주소/경로/프로젝트명/credential id 기준으로 정리한다.
- 문서를 수정했으면 관련 문서 간 중복/충돌도 같이 점검한다.