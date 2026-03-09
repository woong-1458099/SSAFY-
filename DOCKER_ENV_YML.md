# Docker ENV/YML 정리

## 1. 구성 분리

- 앱 스택: `docker/compose.app.yml`
  - `nginx`, `api-blue`, `api-green`
- 운영 도구 스택: `docker/compose.ops.yml`
  - `jenkins`, `n8n`, `prometheus`, `grafana`
- 로컬 데이터 스택: `docker/compose.data.local.yml`
  - 파일은 유지하되 기본 흐름에서는 사용하지 않음(SSH 터널 우선)

## 2. env 파일 분리

- `docker/.env.local` : 로컬 개발자(SSH 터널)
- `docker/.env.stg` : 스테이징 배포
- `docker/.env.prod` : 운영 배포
- `docker/.env.ops` : 운영도구

## 3. 실행 명령

```bash
# app(stg)
docker compose -p stg-app --env-file docker/.env.stg -f docker/compose.app.yml up -d

# app(prod)
docker compose -p prod-app --env-file docker/.env.prod -f docker/compose.app.yml up -d

# ops
docker compose -p docker --env-file docker/.env.ops -f docker/compose.ops.yml up -d
```

로컬 개발:
- Docker data 스택 대신 `docker/.env.local` + SSH 터널 사용
- 필요 시에만 `compose.data.local.yml`을 임시로 사용

## 4. 볼륨 정책

- Jenkins: `jenkins_jenkins_home` 재사용
- n8n: `n8n_n8n_data` 재사용
- 데이터/모니터링 볼륨은 고정 이름 유지

주의:
- 데이터 유지가 필요하면 `down -v` 금지
- `docker volume prune` 사용 금지
- 외부 공개 포트는 Nginx 중심(80/443)으로 제한

## 5. 2026-03-09 compose 운영 기준 보완

### app / data 네트워크

- `compose.app.yml`과 `compose.data.local.yml`은 같은 Docker 네트워크(`s14p21e206_core_net`)를 사용하도록 맞춘다.
- 앱은 내부 서비스명(`postgres`, `redis`, `rabbitmq`)으로 data 계층에 접근한다.

### 외부 공개 포트 정책

- 외부 공개는 `22`, `80`, `443`만 사용한다.
- PostgreSQL / Redis / RabbitMQ는 `ports:`로 외부 공개하지 않는다.
- `nginx`만 `80/443` 진입점으로 둔다.

### 현재 검증 결과

- data 스택 컨테이너 정상 기동 확인
- app 스택 컨테이너 정상 기동 확인
- nginx -> backend 프록시 경로(`/api`) 동작 확인
- 내부 Docker 네트워크 기준 actuator health 응답 확인
- 현재 STG app 컨테이너명 기준: `stg-app-nginx-1`, `stg-app-api-blue-1`, `stg-app-api-green-1`

## 8. 2026-03-09 ops/app compose 반영 사항

### docker/compose.ops.yml 기준

- Jenkins는 `JENKINS_OPTS --prefix=/jenkins` 설정을 제거하고 루트 기준으로 운영한다.
- n8n의 `N8N_PATH`는 하드코딩하지 않고 `.env.ops` 값을 참조한다.
- Jenkins / n8n은 `ops-net`과 `core-net`에 함께 연결한다.
- nginx는 `core-net`을 통해 Jenkins / n8n으로 reverse proxy 한다.

### docker/.env.ops 기준

- `N8N_HOST=n8n.ssafymaker.cloud`
- `WEBHOOK_URL=http://n8n.ssafymaker.cloud/`
- `N8N_EDITOR_BASE_URL=http://n8n.ssafymaker.cloud/`
- `N8N_PATH=/`
- `JENKINS_BASE_URL=http://jenkins.ssafymaker.cloud/`

### nginx conf 기준

- 메인 서비스는 `ssafymaker.cloud`
- Jenkins는 `jenkins.ssafymaker.cloud`
- n8n은 `n8n.ssafymaker.cloud`
- path 기반(`/n8n`) 프록시는 운영 대상에서 제외한다.

### 주의사항

- nginx 설정 파일 저장 시 UTF-8 BOM이 포함되면 컨테이너 기동 실패가 발생할 수 있다.
- 서버의 `.env.ops`는 민감값 포함 파일이므로 Git이 아닌 서버 로컬에서 관리한다.


## 다음 작업 메모

1. `compose.app.yml` 배포 전에 `docker/.env.stg`의 `BACKEND_IMAGE`를 새 태그로 갱신하는 절차를 Jenkins에 추가한다.
2. nginx upstream 변경은 `active.conf` 수정 후 `docker exec stg-app-nginx-1 nginx -s reload`를 기준으로 유지한다.


