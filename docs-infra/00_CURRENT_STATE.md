# 현재 운영 상태

이 문서는 2026-03-18 기준 E206 인프라의 실제 운영 상태를 정리한다.

## 1. 서버
- 호스트명: `ip-172-26-11-125`
- 운영 계정: `ubuntu`
- 원격 프로젝트 경로: `/home/ubuntu/apps/S14P21E206`
- 공인 IP: `13.125.26.13`
- 사설 IP: `172.26.11.125/20`
- 타임존: `Asia/Seoul`

## 2. Cloudflare DNS
아래 레코드는 모두 Cloudflare `Proxied` 상태다.

- `ssafymaker.cloud` -> `13.125.26.13`
- `www.ssafymaker.cloud` -> `13.125.26.13`
- `stg.ssafymaker.cloud` -> `13.125.26.13`
- `auth.ssafymaker.cloud` -> `13.125.26.13`
- `jenkins.ssafymaker.cloud` -> `13.125.26.13`
- `n8n.ssafymaker.cloud` -> `13.125.26.13`

### 추가 예정 레코드
- `grafana.ssafymaker.cloud`
- `prometheus.ssafymaker.cloud`
- `rabbitmq.ssafymaker.cloud`
- `dev.ssafymaker.cloud`

추가 예정 레코드도 같은 원점 IP를 사용하고, 운영자 접근 도구는 whitelist를 유지한다.

## 3. Docker 네트워크
- 앱/ingress 공용 네트워크: `s14p21e206_core_net`
- 운영 도구 네트워크: `docker_ops-net`

## 4. Compose project
- STG app: `stg-app`
- PROD app: `prod-app`
- STG data: `stg-data`
- Auth: `stg-auth`
- Ingress nginx: `ingress`
- OPS stack: `docker`

## 5. 현재 컨테이너
- `ingress-nginx-1`
- `docker-jenkins-1`
- `docker-n8n-1`
- `docker-prometheus-1`
- `docker-grafana-1`
- `docker-loki-1`
- `docker-promtail-1`
- `docker-node-exporter-1`
- `docker-docker-stats-exporter-1`
- `stg-app-api-blue-1`
- `stg-app-api-green-1`
- `prod-app-api-blue-1`
- `prod-app-api-green-1`
- `stg-data-postgres-1`
- `stg-data-redis-1`
- `stg-data-rabbitmq-1`
- `stg-keycloak`

## 6. 볼륨
- `jenkins_jenkins_home`
- `n8n_n8n_data`
- `s14p21e206_prometheus_data`
- `s14p21e206_grafana_data`
- `s14p21e206_loki_data`
- `s14p21e206_promtail_positions`
- `s14p21e206_pg_data`
- `s14p21e206_rabbitmq_data`
- `s14p21e206_redis_data`

## 7. 도메인별 ingress 라우팅
- `ssafymaker.cloud`, `www.ssafymaker.cloud`
  - PROD frontend live
  - `/api` 는 `api_upstream_prod`
- `stg.ssafymaker.cloud`
  - STG frontend live
  - `/api` 는 `api_upstream_stg`
- `auth.ssafymaker.cloud`
  - Keycloak
- `jenkins.ssafymaker.cloud`
  - Jenkins
- `n8n.ssafymaker.cloud`
  - n8n

## 8. nginx 운영 경로
- nginx compose: `docker/compose.nginx.yml`
- nginx 설정 파일: `Infra/infra/nginx/conf.d/app.conf`
- upstream 런타임 경로: `/home/ubuntu/deploy/nginx/upstreams`
- whitelist 런타임 경로: `/home/ubuntu/deploy/nginx/whitelist`
- 현재 whitelist 파일:
  - `active-whitelist.conf`
  - `backup-whitelist.conf`
  - `candidate-whitelist.conf`

## 9. whitelist 현재 상태
공통 whitelist는 런타임 `active-whitelist.conf` 기준으로 운영한다.
실제 허용 IP 목록은 저장소 문서에 직접 기록하지 않는다.
필요 시 서버의 `/home/ubuntu/deploy/nginx/whitelist/active-whitelist.conf` 에서 확인한다.

모든 운영자 도구를 전부 열지 않고, 기본은 whitelist 보호를 유지한다.

### whitelist 예외 경로
- Jenkins: `/project/`
  - GitLab webhook 수신용
  - Jenkins UI는 계속 whitelist 적용
- n8n: `/webhook/`, `/webhook-test/`
  - 외부 webhook 수신용
  - n8n 메인 UI는 계속 whitelist 적용
- auth: `/admin`, `/admin/` 만 whitelist 적용

## 10. Jenkins
- 공개 도메인: `jenkins.ssafymaker.cloud`
- 내부 서비스 URL: `http://jenkins:8080`
- Jenkins Root URL: `https://jenkins.ssafymaker.cloud/`
- Jenkins 컨테이너: `docker-jenkins-1`
- webhook trigger 경로:
  - `/project/backend-develop-stg`
  - `/project/frontend-develop-stg`
  - `/project/backend-master-prod`
  - `/project/frontend-master-prod`

### Jenkins job 기준
- `backend-develop-stg`
- `frontend-develop-stg`
- `backend-master-prod`
- `frontend-master-prod`

### Jenkins credential id
- `ec2-deploy-ssh-v2`
- `cloudflare-api-token`
- `cloudflare-zone-id`
- `n8n-deploy-token`

## 11. n8n
- 공개 도메인: `n8n.ssafymaker.cloud`
- 내부 서비스 URL: `http://n8n:5678`
- n8n 컨테이너: `docker-n8n-1`
- 운영 워크플로는 아래 4개 기준으로 관리한다.
  - `MR 리뷰 코멘트 Sheets.json`
  - `n8n Deploy Notify Bot.json`
  - `IP Whitelist Intake and Validate.json`
  - `IP Whitelist Sync to Nginx.json`

### n8n webhook 기준
- GitLab MR review webhook:
  - `https://n8n.ssafymaker.cloud/webhook/gitlab/mr-review`
- Jenkins deploy notify webhook:
  - `https://n8n.ssafymaker.cloud/webhook/jenkins/deploy-notify`

## 12. 앱 배포 구조
- STG backend alias:
  - `stg-api-blue`
  - `stg-api-green`
- PROD backend alias:
  - `prod-api-blue`
  - `prod-api-green`

### frontend 경로
- STG releases: `/home/ubuntu/deploy/frontend/stg/releases`
- STG live: `/home/ubuntu/deploy/frontend/stg/live`
- PROD releases: `/home/ubuntu/deploy/frontend/prod/releases`
- PROD live: `/home/ubuntu/deploy/frontend/prod/live`

## 13. 모니터링 현재 상태
- Prometheus: healthy
- Grafana: 로그인 페이지 응답 확인
- RabbitMQ management UI: 로컬 바인딩 응답 확인
- Prometheus active target:
  - `docker-stats-exporter`
  - `node-exporter`
  - `prometheus`

### 아직 미완료인 부분
- RabbitMQ exporter 미연결
- Grafana 자체 exporter 미연결
- Jenkins/n8n/nginx exporter 미연결
- `grafana`, `prometheus`, `rabbitmq` 외부 도메인 미추가

## 14. env 파일 실제 상태
- 존재 확인:
  - `docker/.env.local`
  - `docker/.env.stg`
  - `docker/.env.prod`
  - `docker/.env.ops`
  - `docker/.env.auth.stg`
- 미확인/없음:
  - `docker/.env.auth`

## 15. 현재 주의사항
- Jenkins `/project/...` 는 nginx 403이 아니라 Jenkins까지 도달하는 상태다.
- `curl` 로 직접 `/project/backend-develop-stg` 를 호출하면 현재 Jenkins 404가 응답될 수 있다.
- n8n `webhook-test` 경로는 실행 버튼 기반의 임시 test endpoint라 항상 등록 상태가 아니다.
- `CORS_ALLOWED_ORIGINS` 는 compose 확인 시 비어 있다는 경고가 있었다.
- 문서에는 실제 비밀값을 쓰지 않는다.
