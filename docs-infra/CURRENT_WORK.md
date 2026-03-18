# 현재 진행 작업

## 현재 목적
같은 EC2에서 STG / PROD 앱을 공존시키고, 공용 nginx 1대로 도메인 기준 라우팅과 Jenkins CI/CD를 분리 운영한다.

## 최근 완료 작업

### 운영 모니터링
- `docker/compose.ops.yml` 기준으로 모니터링 스택을 확장
- 추가 컨테이너:
    - `node-exporter`
    - `cadvisor`
    - `loki`
    - `promtail`
- Prometheus 설정 파일 경로를 `Infra/monitoring/prometheus.yml` 기준으로 정리
- Loki 설정 파일 경로를 `Infra/monitoring/loki-config.yml` 기준으로 정리
- Promtail 설정 파일 경로를 `Infra/monitoring/promtail-config.yml` 기준으로 정리
- Grafana datasource provisioning 경로를 `Infra/monitoring/grafana/provisioning/datasources/monitoring.yml` 기준으로 정리
- Grafana에서 Prometheus / Loki datasource를 함께 사용하는 구조로 정리
- EC2 메트릭은 `node_exporter`, 컨테이너 메트릭은 `cAdvisor`, 컨테이너 로그는 `Promtail -> Loki` 기준으로 수집하도록 구성

### 인프라 / nginx
- `docker/compose.app.yml`에서 nginx 서비스를 제거하고 app 전용 compose로 정리
- `docker/compose.nginx.yml`를 추가하여 공용 nginx를 별도 compose로 분리
- nginx container를 `ingress-nginx-1` 기준으로 운영
- 공용 Docker network `s14p21e206_core_net`에서 STG / PROD 앱 컨테이너를 동시에 운영
- backend container에 network alias를 추가
  - STG: `stg-api-blue`, `stg-api-green`
  - PROD: `prod-api-blue`, `prod-api-green`
- nginx upstream 파일을 환경별로 분리
  - `/home/ubuntu/deploy/nginx/upstreams/active-stg.conf`
  - `/home/ubuntu/deploy/nginx/upstreams/active-prod.conf`
- nginx app config를 도메인 기준으로 분리
  - `ssafymaker.cloud` -> PROD
  - `stg.ssafymaker.cloud` -> STG

### 프론트
- 프론트 배포 경로를 환경별로 분리
  - STG releases: `/home/ubuntu/deploy/frontend/stg/releases`
  - STG live: `/home/ubuntu/deploy/frontend/stg/live`
  - PROD releases: `/home/ubuntu/deploy/frontend/prod/releases`
  - PROD live: `/home/ubuntu/deploy/frontend/prod/live`
- 공용 nginx는 `/home/ubuntu/deploy/frontend` 상위 디렉터리를 mount하고, server_name별 root를 분리
- STG 프론트 Jenkins 배포 성공 확인
  - `stg.ssafymaker.cloud`
  - health/smoke check 정상
  - Cloudflare purge 정상

### 백엔드
- STG / PROD backend blue-green 구조를 공용 nginx 기준으로 재정리
- backend Jenkinsfile에서 nginx upstream 파일을 환경별로 분리
- backend health check / switch / verify / rollback 구조를 STG / PROD 공통 패턴으로 통일
- verify/rollback 단계는 ssh heredoc 방식으로 정리하여 로컬 Jenkins shell 평가 문제 제거
- DB는 STG / PROD가 `stg_app` DB를 공용으로 사용하는 기준으로 정리

### Jenkins / GitLab webhook
- Jenkinsfile 이름을 역할 기준으로 재정리
  - `jenkins/Jenkinsfile.backend-develop-stg`
  - `jenkins/Jenkinsfile.frontend-develop-stg`
  - `jenkins/Jenkinsfile.backend-master-prod`
  - `jenkins/Jenkinsfile.frontend-master-prod`
- Jenkins job 이름도 역할 기준으로 재정리
  - `backend-develop-stg`
  - `frontend-develop-stg`
  - `backend-master-prod`
  - `frontend-master-prod`
- GitLab webhook도 4개 job 기준으로 분리
- 각 Jenkinsfile의 path filter에 자기 Jenkinsfile 경로를 포함
- develop / master 대상 브랜치 가드 추가

## 현재 기준 실제 값

### 서버 / 경로
- STG / PROD 서버 IP: `13.125.26.13`
- 원격 프로젝트 경로: `/home/ubuntu/apps/S14P21E206`

### 도메인
- PROD: `ssafymaker.cloud`
- STG: `stg.ssafymaker.cloud`
- Jenkins: `jenkins.ssafymaker.cloud`
- n8n: `n8n.ssafymaker.cloud`
- auth: `auth.ssafymaker.cloud`

### compose project
- STG app: `stg-app`
- STG data: `stg-data`
- PROD app: `prod-app`
- ingress nginx: `ingress`

### nginx
- nginx compose file: `docker/compose.nginx.yml`
- nginx container: `ingress-nginx-1`
- nginx conf: `Infra/infra/nginx/conf.d/app.conf`
- upstream dir: `/home/ubuntu/deploy/nginx/upstreams`
- STG upstream file: `/home/ubuntu/deploy/nginx/upstreams/active-stg.conf`
- PROD upstream file: `/home/ubuntu/deploy/nginx/upstreams/active-prod.conf`

### monitoring
- monitoring root dir: `Infra/monitoring`
- prometheus config: `Infra/monitoring/prometheus.yml`
- loki config: `Infra/monitoring/loki-config.yml`
- promtail config: `Infra/monitoring/promtail-config.yml`
- grafana datasource provisioning: `Infra/monitoring/grafana/provisioning/datasources/monitoring.yml`

### frontend path
- STG releases: `/home/ubuntu/deploy/frontend/stg/releases`
- STG live: `/home/ubuntu/deploy/frontend/stg/live`
- PROD releases: `/home/ubuntu/deploy/frontend/prod/releases`
- PROD live: `/home/ubuntu/deploy/frontend/prod/live`

### backend alias
- STG blue: `stg-api-blue`
- STG green: `stg-api-green`
- PROD blue: `prod-api-blue`
- PROD green: `prod-api-green`

### Jenkinsfile
- STG backend: `jenkins/Jenkinsfile.backend-develop-stg`
- STG frontend: `jenkins/Jenkinsfile.frontend-develop-stg`
- PROD backend: `jenkins/Jenkinsfile.backend-master-prod`
- PROD frontend: `jenkins/Jenkinsfile.frontend-master-prod`
- nightly: `jenkins/Jenkinsfile.nightly-deploy`

### Jenkins credentials
- `ec2-deploy-ssh-v2`
- `cloudflare-api-token`
- `cloudflare-zone-id`

### monitoring 설정 경로
- Prometheus config: `Infra/monitoring/prometheus.yml`
- Loki config: `Infra/monitoring/loki-config.yml`
- Promtail config: `Infra/monitoring/promtail-config.yml`
- Grafana datasource provisioning: `Infra/monitoring/grafana/provisioning/datasources/monitoring.yml`

## 현재 확인된 정상 동작
- 공용 nginx 기동 정상
- `ingress-nginx-1`에서 STG / PROD backend alias 해석 정상
- STG backend health check 정상
- PROD backend health check 정상
- STG frontend deploy 성공
- `stg.ssafymaker.cloud` root health 정상
- `stg.ssafymaker.cloud/api/public/checks`는 인증 정책 기준 `401` 응답 정상
- Cloudflare purge 정상
- branch guard / path filter / webhook 분기 동작 정상
- `docker-prometheus-1` 기동 정상
- `docker-grafana-1` 기동 정상
- `docker-node-exporter-1` 기동 정상
- `docker-cadvisor-1` 기동 정상
- `docker-loki-1` 기동 정상
- `docker-promtail-1` 기동 정상
- Prometheus target에서 `node-exporter`, `cadvisor` 수집 가능
- Grafana datasource에서 `Prometheus`, `Loki` 확인 가능
- Grafana Explore에서 Docker 컨테이너 로그 조회 가능

## 지금 남은 작업
1. n8n 연동
2. 모니터링 대시보드 정리
3. nginx / backend 로그 운영 기준 문서화
4. 필요 시 exporter / alerting 2차 확장 검토
5. 운영 도구 공통 IP 화이트리스트 자동화
  - 대상: `jenkins.ssafymaker.cloud`, `n8n.ssafymaker.cloud`, `grafana.ssafymaker.cloud`, `rabbitmq.ssafymaker.cloud`
  - Keycloak 은 `auth.ssafymaker.cloud` 전체가 아니라 admin 관련 경로만 제한
  - Google Form + Google Sheet + n8n 으로 자동 반영
  - Mattermost 전용 채널로 실패/거절/반영 오류 알림
  - Nginx 런타임 경로: `/home/ubuntu/deploy/nginx/whitelist`
  - 상세 계획: `docs-infra/IP_WHITELIST_PLAN.md`

## 다음에 작업할 때 먼저 볼 것
1. `WORK_GUIDE.md`
2. `docs-infra/CURRENT_WORK.md`
3. `docs-infra/CI_CD_RUNBOOK.md`
4. `docs-infra/DOCKER_OVERVIEW.md`
5. `docs-infra/ENVIRONMENTS.md`