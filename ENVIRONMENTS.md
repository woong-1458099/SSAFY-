# 환경 변수 운영 가이드

## 1. 파일 목적

- `docker/.env.local`
  - 로컬 개발자용
  - Docker 데이터 스택이 아니라 SSH 터널 기반으로 DB/Redis/RabbitMQ에 연결
- `docker/.env.stg`
  - 스테이징 앱 배포용
  - STG 전용 DB/Redis/RabbitMQ를 가리킴
- `docker/.env.prod`
  - 운영 앱 배포용
  - PROD 전용 DB/Redis/RabbitMQ를 가리킴
- `docker/.env.ops`
  - Jenkins/n8n/모니터링용
  - 앱 환경과 분리 관리

## 2. 실행 명령

### 스테이징 앱
```bash
docker compose -p stg --env-file docker/.env.stg -f docker/compose.app.yml up -d
```

### 운영 앱
```bash
docker compose -p prod --env-file docker/.env.prod -f docker/compose.app.yml up -d
```

### 운영 도구
```bash
docker compose -p ops --env-file docker/.env.ops -f docker/compose.ops.yml up -d
```

## 3. 로컬 개발자 연결 방식(SSH 터널)

예시:
```bash
ssh -L 15432:127.0.0.1:5432 -L 16379:127.0.0.1:6379 -L 15673:127.0.0.1:5672 <user>@<host>
```

로컬 앱은 `docker/.env.local` 값을 사용해 다음으로 연결:
- Postgres: `localhost:15432`
- Redis: `localhost:16379`
- RabbitMQ: `localhost:15673`

## 4. 핵심 원칙

1. local/stg/prod/ops env를 절대 섞지 않는다
2. 코드에 주소/비밀번호 하드코딩 금지
3. stg/prod는 `-p` 옵션으로 프로젝트 분리
4. 민감 정보는 저장소 커밋 금지
5. stg/prod는 DB/Redis/RabbitMQ를 반드시 분리 운영
6. 로컬은 SSH 터널 포트(`localhost`) 기준으로만 연결
7. 외부 인바운드는 Nginx 단일 진입을 원칙으로 운영

## 5. stg/prod 데이터 분리 기준

1. 호스트 분리: `stg-data.*` / `prod-data.*`
2. DB 분리: `stg_app` / `prod_app`
3. 계정 분리: `stg_*` / `prod_*`
4. 비밀번호 분리: 환경별 별도 비밀값
5. Redis/RabbitMQ도 호스트/계정을 환경별로 분리

## 6. yml / Dockerfile 정합성

- `docker/compose.app.yml`은 아래 env 키를 사용하도록 이미 맞춰져 있음:
  - `DB_URL`, `DB_USER`, `DB_PASSWORD`
  - `REDIS_HOST`, `REDIS_PORT`
  - `RABBITMQ_HOST`, `RABBITMQ_PORT`, `RABBITMQ_USER`, `RABBITMQ_PASSWORD`
- `BackEnd/Dockerfile`은 앱 이미지 빌드용으로 준비되어 있음
- Jenkins/n8n은 tgz 복원 후 기존 볼륨 재사용 정책으로 유지됨

## 7. 2026-03-09 기준 추가 정리

### EC2 staging env 기준

- `docker/.env.stg`는 EC2 내부 Docker 네트워크 기준으로 작성한다.
- `BACKEND_IMAGE`는 EC2에서 직접 빌드한 이미지 태그를 사용한다.
- data 계층 호스트는 외부 주소가 아니라 Docker 서비스명 기준으로 사용한다.
  - `DB_URL=jdbc:postgresql://postgres:5432/...`
  - `REDIS_HOST=redis`
  - `RABBITMQ_HOST=rabbitmq`

### local env 기준

- 로컬 개발은 SSH 터널 기반으로 통일한다.
- 로컬 앱은 아래 포트로 접속한다.
  - PostgreSQL: `localhost:15432`
  - Redis: `localhost:16379`
  - RabbitMQ: `localhost:15673`
- `env.local`은 Git에 실제 값으로 커밋하지 않고, 팀 공통 예시와 별도 공유값 기준으로 관리한다.

### 비밀값 관리 원칙

- `stg/prod` 실제 비밀값은 Git에 커밋하지 않는다.
- 운영 배포용 비밀값은 Jenkins Credentials 또는 별도 비밀 저장소 기준으로 관리한다.
- `.env.example` 또는 문서에는 예시 값만 기록한다.
