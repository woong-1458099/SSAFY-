# Docker 운영 개요

## 1. Compose 파일 역할

### 앱 스택
- 파일: `docker/compose.app.yml`
- 서비스:
  - `api-blue`
  - `api-green`

### ingress nginx
- 파일: `docker/compose.nginx.yml`
- 서비스:
  - `nginx`

### 데이터 스택
- 파일: `docker/compose.data.local.yml`
- 서비스:
  - `postgres`
  - `redis`
  - `rabbitmq`

### 운영 도구 스택
- 파일: `docker/compose.ops.yml`
- 서비스:
  - `jenkins`
  - `n8n`
  - `prometheus`
  - `grafana`

## 2. compose project 이름
- STG app: `stg-app`
- STG data: `stg-data`
- PROD app: `prod-app`
- ingress nginx: `ingress`
- OPS: `docker`

## 3. 실행 명령

### STG app
```bash
docker compose -p stg-app --env-file docker/.env.stg -f docker/compose.app.yml up -d
```

### PROD app
```bash
docker compose -p prod-app --env-file docker/.env.prod -f docker/compose.app.yml up -d
```

### ingress nginx
```bash
docker compose -p ingress -f docker/compose.nginx.yml up -d
```

### OPS
```bash
docker compose -p docker --env-file docker/.env.ops -f docker/compose.ops.yml up -d
```

## 4. 네트워크 기준
- core network: `s14p21e206_core_net`
- app / data / ops / ingress는 공용 Docker network 기준으로 통신
- 외부 공개 포트는 ingress nginx가 담당
- `docker/compose.app.yml`, `docker/compose.nginx.yml`의 core network는 `external: true` 기준으로 기존 network를 재사용

## 5. backend alias 기준
공용 nginx가 STG / PROD 앱을 동시에 구분할 수 있도록 app container에 alias를 부여한다.

### STG
- `stg-api-blue`
- `stg-api-green`

### PROD
- `prod-api-blue`
- `prod-api-green`

## 6. frontend 정적 파일 서빙 구조

### 현재 구조
프론트 정적 파일 경로를 환경별로 분리한다.

- STG releases: `/home/ubuntu/deploy/frontend/stg/releases`
- STG live: `/home/ubuntu/deploy/frontend/stg/live`
- PROD releases: `/home/ubuntu/deploy/frontend/prod/releases`
- PROD live: `/home/ubuntu/deploy/frontend/prod/live`

### nginx mount
- `/home/ubuntu/deploy/frontend -> /usr/share/nginx/frontend`

### nginx root
- STG:
  - `/usr/share/nginx/frontend/stg/live`
- PROD:
  - `/usr/share/nginx/frontend/prod/live`

### 운영 방식
- 새 빌드 결과를 `releases/<release_tag>` 에 업로드
- `rsync -a --delete releases/<tag>/ -> live/`
- nginx는 environment별 `live`를 직접 서빙
- symlink 기반 `current` 구조는 사용하지 않음

## 7. nginx upstream 구조

### upstream 파일
- STG:
  - `/home/ubuntu/deploy/nginx/upstreams/active-stg.conf`
- PROD:
  - `/home/ubuntu/deploy/nginx/upstreams/active-prod.conf`

### 예시
STG:
```nginx
upstream api_upstream_stg {
server stg-api-blue:8080;
}
```

PROD:
```nginx
upstream api_upstream_prod {
server prod-api-blue:8080;
}
```

## 8. nginx 설정 구조
- 설정 파일: `Infra/infra/nginx/conf.d/app.conf`
- include:
  - `/etc/nginx/upstreams/active-stg.conf`
  - `/etc/nginx/upstreams/active-prod.conf`

### 도메인 기준 라우팅
- `ssafymaker.cloud` -> `api_upstream_prod`
- `stg.ssafymaker.cloud` -> `api_upstream_stg`
- `jenkins.ssafymaker.cloud` -> `jenkins`
- `n8n.ssafymaker.cloud` -> `n8n`
- `auth.ssafymaker.cloud` -> `stg-keycloak`

## 9. 현재 확인된 주요 컨테이너
- `stg-app-api-blue-1`
- `stg-app-api-green-1`
- `prod-app-api-blue-1`
- `prod-app-api-green-1`
- `ingress-nginx-1`
- `stg-data-postgres-1`
- `stg-data-redis-1`
- `stg-data-rabbitmq-1`
- `docker-jenkins-1`
- `docker-n8n-1`
- `docker-grafana-1`
- `docker-prometheus-1`
- `stg-keycloak`

## 10. 주의사항
- `compose.app.yml`에 nginx를 다시 넣지 않는다.
- 공용 nginx는 `docker/compose.nginx.yml` 기준으로만 운영한다.
- backend app container는 외부 포트를 직접 publish하지 않는다.
- 데이터 유지가 필요하면 `down -v`, `docker volume prune` 사용을 피한다.
- nginx 설정 파일 저장 시 UTF-8 BOM 포함 여부를 확인한다.