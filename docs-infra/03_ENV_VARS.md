# env 변수 정리

이 문서는 `.env.*` 파일의 역할과 변수 카탈로그를 정리한다.

## 원칙
- 문서에는 실제 비밀값을 적지 않는다.
- 비밀 변수는 변수명, 용도, 사용 위치만 적는다.
- 값이 외부 주소, 포트, 서비스명처럼 공개 가능한 경우에만 예시를 적는다.

## 1. `docker/.env.local`
로컬 개발용 앱 환경이다.
SSH 터널 기준으로 로컬에서 PostgreSQL, Redis, RabbitMQ에 붙는다.

### 성격
- 대상: 로컬 백엔드 실행
- 프로필: `local`
- 특징: `localhost` 기준

### 주요 변수
- `SPRING_PROFILES_ACTIVE`
- `DB_URL`
- `DB_USER`
- `DB_PASSWORD`
- `REDIS_HOST`
- `REDIS_PORT`
- `RABBITMQ_HOST`
- `RABBITMQ_PORT`
- `RABBITMQ_USER`
- `RABBITMQ_PASSWORD`
- `JWT_ISSUER_URI`
- `KEYCLOAK_BASE_URL`
- `KEYCLOAK_PUBLIC_BASE_URL`
- `KEYCLOAK_INTERNAL_BASE_URL`
- `KEYCLOAK_CLIENT_ID`
- `KEYCLOAK_CLIENT_SECRET`
- `APP_PUBLIC_BASE_URL`
- `APP_FRONTEND_BASE_URL`

## 2. `docker/.env.stg`
STG 앱/데이터 환경 변수다.

### 성격
- 대상: `docker/compose.app.yml`
- 프로필: `stg`
- 특징: STG 앱, STG data, blue/green alias 포함

### 주요 변수
- `API_BLUE_ALIAS`
- `API_GREEN_ALIAS`
- `BACKEND_IMAGE`
- `DB_URL`
- `DB_USER`
- `DB_PASSWORD`
- `POSTGRES_IMAGE`
- `POSTGRES_DB`
- `POSTGRES_USER`
- `POSTGRES_PASSWORD`
- `REDIS_HOST`
- `REDIS_PORT`
- `REDIS_IMAGE`
- `RABBITMQ_HOST`
- `RABBITMQ_PORT`
- `RABBITMQ_IMAGE`
- `RABBITMQ_USER`
- `RABBITMQ_PASSWORD`
- `RABBITMQ_DEFAULT_USER`
- `RABBITMQ_DEFAULT_PASS`
- `JWT_ISSUER_URI`
- `KEYCLOAK_BASE_URL`
- `KEYCLOAK_PUBLIC_BASE_URL`
- `KEYCLOAK_INTERNAL_BASE_URL`
- `KEYCLOAK_REALM`
- `KEYCLOAK_CLIENT_ID`
- `KEYCLOAK_CLIENT_SECRET`
- `APP_PUBLIC_BASE_URL`
- `APP_FRONTEND_BASE_URL`

## 3. `docker/.env.prod`
PROD 앱 환경 변수다.

### 성격
- 대상: `docker/compose.app.yml`
- 프로필: `prod`
- 특징: PROD blue/green alias 사용

### 주요 변수
- `API_BLUE_ALIAS`
- `API_GREEN_ALIAS`
- `BACKEND_IMAGE`
- `DB_URL`
- `DB_USER`
- `DB_PASSWORD`
- `REDIS_HOST`
- `REDIS_PORT`
- `RABBITMQ_HOST`
- `RABBITMQ_PORT`
- `RABBITMQ_USER`
- `RABBITMQ_PASSWORD`
- `JWT_ISSUER_URI`
- `KEYCLOAK_BASE_URL`
- `KEYCLOAK_PUBLIC_BASE_URL`
- `KEYCLOAK_INTERNAL_BASE_URL`
- `KEYCLOAK_REALM`
- `KEYCLOAK_CLIENT_ID`
- `KEYCLOAK_CLIENT_SECRET`
- `APP_PUBLIC_BASE_URL`
- `APP_FRONTEND_BASE_URL`

## 4. `docker/.env.ops`
운영 도구 스택 환경 변수다.

### 성격
- 대상: `docker/compose.ops.yml`
- 구성요소: Jenkins, n8n, Prometheus, Grafana, Loki, Promtail

### 주요 변수
#### Jenkins / GitLab / n8n
- `JENKINS_PORT`
- `JENKINS_AGENT_PORT`
- `JENKINS_BASE_URL`
- `JENKINS_JOB_NAME`
- `JENKINS_USER`
- `JENKINS_API_TOKEN`
- `JENKINS_REMOTE_TOKEN`
- `GITLAB_BASE_URL`
- `N8N_HOST`
- `N8N_PROTOCOL`
- `N8N_PATH`
- `WEBHOOK_URL`
- `N8N_EDITOR_BASE_URL`
- `N8N_ENCRYPTION_KEY`
- `N8N_BASIC_AUTH_ACTIVE`
- `N8N_BASIC_AUTH_USER`
- `N8N_BASIC_AUTH_PASSWORD`
- `N8N_PROXY_HOPS`
- `SHEETS_WEBHOOK_URL`
- `OPENAI_MODEL`
- `OPENAI_API_KEY`

#### Prometheus / Grafana / Loki / Promtail
- `PROMETHEUS_PORT`
- `GRAFANA_PORT`
- `GRAFANA_ADMIN_USER`
- `GRAFANA_ADMIN_PASSWORD`
- `LOKI_IMAGE`
- `LOKI_HTTP_PORT`
- `LOKI_GRPC_PORT`
- `LOKI_RETENTION_PERIOD`
- `LOKI_PUSH_URL`
- `PROMTAIL_HTTP_PORT`
- `PROMTAIL_REFRESH_INTERVAL`
- `PROMTAIL_IMAGE`
- `CADVISOR_IMAGE`
- `NODE_EXPORTER_IMAGE`

## 5. `docker/.env.auth.stg`
STG Keycloak 초기 관리자용 환경 변수다.

### 성격
- 대상: `docker/compose.auth.yml`
- 사용처: Keycloak admin bootstrap

### 주요 변수
- `KEYCLOAK_ADMIN`
- `KEYCLOAK_ADMIN_PASSWORD`

## 6. 비밀 변수 분류
아래 변수는 문서에 실제 값을 직접 적지 않는다.

- `DB_PASSWORD`
- `POSTGRES_PASSWORD`
- `RABBITMQ_PASSWORD`
- `RABBITMQ_DEFAULT_PASS`
- `KEYCLOAK_CLIENT_SECRET`
- `KEYCLOAK_ADMIN_PASSWORD`
- `JENKINS_API_TOKEN`
- `JENKINS_REMOTE_TOKEN`
- `N8N_ENCRYPTION_KEY`
- `N8N_BASIC_AUTH_PASSWORD`
- `OPENAI_API_KEY`
- `GRAFANA_ADMIN_PASSWORD`

## 7. 문서화 메모
- 내부 서비스 URL과 외부 공개 URL을 구분해 적는다.
- 예:
  - 외부 공개 Jenkins: `https://jenkins.ssafymaker.cloud/`
  - 내부 서비스 Jenkins: `http://jenkins:8080`
- compose config 출력에 경고가 있었던 `CORS_ALLOWED_ORIGINS` 는 추후 보완이 필요하다.
- `docker/.env.auth` 는 현재 서버에서 확인되지 않았고, 운영 기준 파일은 `docker/.env.auth.stg` 로 본다.
