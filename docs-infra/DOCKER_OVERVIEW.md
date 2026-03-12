# Docker 운영 개요

## 1. Compose 파일 역할

### 앱 스택
- 파일: `docker/compose.app.yml`
- 서비스:
  - `nginx`
  - `api-blue`
  - `api-green`

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
- OPS: `docker`

## 3. 실행 명령

### STG app
```bash
docker compose -p stg-app --env-file docker/.env.stg -f docker/compose.app.yml up -d
```
### PROD app
```
docker compose -p prod-app --env-file docker/.env.prod -f docker/compose.app.yml up -d
```
### OPS
```
docker compose -p docker --env-file docker/.env.ops -f docker/compose.ops.yml up -d
```
### 4. 네트워크 기준
- core network: s14p21e206_core_net
- app/data/ops는 내부 Docker 네트워크 기준으로 통신
- 외부 공개 포트는 22, 80, 443 중심으로 제한
### 5. 프론트 정적 파일 서빙 구조
#### 기존 문제
기존에는 아래 mount 구조를 사용했다.

- `/home/ubuntu/deploy/frontend/current:/usr/share/nginx/frontend:ro`

이 구조는 current 심볼릭 링크 target을 바꿔도 nginx 컨테이너가 새 릴리즈를 자동으로 따라가지 못하는 문제가 있었다.

#### 현재 구조
현재는 아래 구조를 사용한다.

- `/home/ubuntu/deploy/frontend/live:/usr/share/nginx/frontend:ro`

실제 docker/compose.app.yml 반영 위치:

- line 75:
  - `/home/ubuntu/deploy/frontend/live:/usr/share/nginx/frontend:ro`

#### 운영 방식
- 새 빌드 결과를 releases/<release_tag> 에 업로드
- `rsync -a --delete releases/<tag>/ -> live/`
- nginx는 live 를 직접 서빙
- symlink target 변경에 의존하지 않음
### 6. 현재 확인된 mount 상태
`stg-app-nginx-1` mount:

-`/home/ubuntu/apps/S14P21E206/Infra/infra/nginx/conf.d -> /etc/nginx/conf.d`
-`/home/ubuntu/deploy/nginx/upstreams -> /etc/nginx/upstreams`
-`/home/ubuntu/certs/cloudflare -> /etc/nginx/certs`
-`/home/ubuntu/deploy/frontend/live -> /usr/share/nginx/frontend`

### 7. 현재 STG 컨테이너
- stg-app-api-green-1
- stg-app-api-blue-1
- stg-app-nginx-1
- stg-data-postgres-1
- stg-data-redis-1
- stg-data-rabbitmq-1
- docker-jenkins-1
- docker-n8n-1
- docker-grafana-1
- docker-prometheus-1
- stg-keycloak
### 8. 주의사항
- `current` 심볼릭 링크를 nginx 컨테이너에 직접 마운트하지 않는다.
- 프론트 정적 파일은 live 고정 디렉터리를 사용한다.
- 데이터 유지가 필요하면 `down -v`, `docker volume prune` 사용을 피한다.
- nginx 설정 파일 저장 시 UTF-8 BOM 포함 여부를 확인한다.