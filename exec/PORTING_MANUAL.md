# S14P21E206 포팅 매뉴얼

## 목차

I. 개요

1. 프로젝트 개요
2. 프로젝트 구성
3. 프로젝트 기술 스택
4. 개발환경
5. 외부 서비스
6. 주요 계정 및 프로퍼티 파일 목록
7. DB 덤프 파일 최신본
8. Gitignore 및 비밀값 관리 대상

II. 빌드 및 실행

1. 환경변수 형태
2. 프론트엔드 빌드 및 실행
3. 백엔드 빌드 및 실행
4. 로컬 의존 서비스 실행

III. 배포 및 인프라

1. 인프라 개요
2. Docker Compose 운영 구조
3. Nginx 및 네트워크 엣지
4. Blue-Green 무중단 배포
5. Jenkins 기반 배포
6. 서비스 이용 및 운영 확인 방법

IV. 포팅 체크리스트

1. 프론트엔드 체크리스트
2. 백엔드 체크리스트
3. 인프라 체크리스트
4. 최종 검증 항목

---

## I. 개요

### 1. 프로젝트 개요

`S14P21E206`은 게임 클라이언트, 백엔드 API/BFF, 인증 서버, 데이터 스토어, 운영 자동화, 모니터링이 결합된 통합 서비스다.

사용자는 브라우저에서 게임 프론트엔드에 접속하고, 프론트엔드는 게임 진행에 필요한 정적 에셋을 로드하면서 `/api` 경로를 통해 백엔드와 통신한다. 백엔드는 로그인, 세션, 저장, 공개 통계, 에셋 매니페스트를 제공하고, 인프라 영역은 Nginx ingress, Keycloak, PostgreSQL, Redis, RabbitMQ, Jenkins, n8n, Cloudflare, 모니터링 스택으로 구성된다.

이 프로젝트의 포팅은 단순 웹 정적 파일 이관이 아니라 프론트, 백엔드, 인증, 데이터, 배포 파이프라인을 함께 옮기는 작업이다.

### 2. 프로젝트 구성

프로젝트 루트 `S14P21E206` 기준 주요 폴더는 다음과 같다.

- `FrontEnd/ssafy-maker`
  - React/Phaser/Vite 기반 게임 프론트엔드
- `BackEnd`
  - Spring Boot 기반 API/BFF
- `Infra`
  - Nginx 설정 및 운영 관련 파일
- `docker`
  - 역할별 Docker Compose 파일
- `docs-infra`
  - 운영 상태, 네트워크, 환경 변수, 런북 문서
- `jenkins`
  - 프론트/백엔드 STG, PROD 배포 파이프라인

### 3. 프로젝트 기술 스택

#### 가) 프론트엔드

- React
- Phaser 3
- TypeScript
- Vite
- npm

#### 나) 백엔드

- Java 25
  - 근거: `BackEnd/build.gradle` `java.toolchain.languageVersion = 25`
- Spring Boot 4.0.3
  - 근거: `BackEnd/build.gradle` `plugins { id 'org.springframework.boot' version '4.0.3' }`
- Gradle Wrapper 9.3.1
  - 근거: `BackEnd/gradle/wrapper/gradle-wrapper.properties` `distributionUrl=...gradle-9.3.1-bin.zip`
- Spring MVC
- Spring Security
- OAuth2 Resource Server
- JPA
- Flyway
- PostgreSQL
- Redis
- RabbitMQ
- springdoc OpenAPI

백엔드 버전 검증 기준:

- 검증 일자: `2026-03-28`
- 기준 커밋: `aabc8922c0ff92fd46ecf42e78f2c53e3d9fe2fe`
- 현재 문서의 Java, Spring Boot, Gradle 버전은 저장소 선언값 기준이며, 이 작업 환경에서는 빌드 성공까지 재현 검증하지 못했다.
- 파일 기준 검증 완료:
  - `BackEnd/build.gradle`
  - `BackEnd/gradle/wrapper/gradle-wrapper.properties`
- 실행 검증 상태:
  - `cd BackEnd && ./gradlew --version`
  - 현재 작업 환경에서는 `JAVA_HOME is not set and no 'java' command could be found in your PATH.` 오류로 실행 검증 미완료
- 포팅 시 재검증 필수 명령:
  - `cd BackEnd && ./gradlew --version`
  - `cd BackEnd && ./gradlew build`

#### 다) 인프라 및 운영

- Docker Compose
- Nginx
  - 저장소 기준 운영 대상: ingress 컨테이너 `ingress-nginx-1`
  - 버전: 저장소에서 고정되지 않음. 실제 운영 서버 이미지/패키지 버전 확인 필요
- Keycloak
  - 버전: `26.1`
  - 근거: `docker/compose.auth.yml` `quay.io/keycloak/keycloak:26.1`
- Cloudflare
- Jenkins
  - 이미지: `local/jenkins-jdk25:lts`
  - JDK 기준: `25`
  - 근거: `docker/compose.ops.yml`, `jenkins/Dockerfile`
- n8n
  - 버전: `latest`
  - 근거: `docker/compose.ops.yml` `docker.n8n.io/n8nio/n8n:latest`
- Prometheus
  - 버전: `v3.5.0`
  - 근거: `docker/compose.ops.yml` `prom/prometheus:v3.5.0`
- Grafana
  - 버전: `12.1.1`
  - 근거: `docker/compose.ops.yml` `grafana/grafana:12.1.1`
- Loki
- Promtail
- AWS EC2

주요 실행 제품과 저장소 기준 확인 버전:

- PostgreSQL
  - 기본 로컬 기준 이미지: `postgres:16-alpine`
  - 근거: `BackEnd/compose.yaml`
- Redis
  - 기본 로컬 기준 이미지: `redis:7-alpine`
  - 근거: `BackEnd/compose.yaml`
- RabbitMQ
  - 기본 로컬 기준 이미지: `rabbitmq:3-management-alpine`
  - 근거: `BackEnd/compose.yaml`
- Keycloak
  - 운영 기준 이미지: `quay.io/keycloak/keycloak:26.1`
  - 근거: `docker/compose.auth.yml`

IDE 기준:

- IntelliJ IDEA, VS Code 등 사용 IDE 버전은 저장소에 고정되어 있지 않다.
- 제출 시에는 실제 개발자가 사용한 IDE 버전을 별도 확인해 기입해야 한다.
- 현재 저장소만으로는 IDE 버전을 확정할 수 없다.

문서 작성 시 확인된 오류 및 특이사항:

- 백엔드 빌드 환경
  - `JAVA_HOME is not set and no 'java' command could be found in your PATH.`
  - Java 미설치 또는 PATH 미설정 상태에서 발생하는 오류로 확인됨
- 프론트 개발 환경 문서
  - 일부 문서의 Node 25 / npm 11 표기와 실제 `package.json` 엔진 값이 불일치함
- 운영 환경 변수
  - `CORS_ALLOWED_ORIGINS` 는 운영 문서 기준 compose 확인 시 비어 있다는 경고가 있었음
  - 근거: `docs-infra/00_CURRENT_STATE.md`

### 4. 개발환경

현재 저장소 기준으로 확인되는 개발/실행 환경은 다음과 같다.

#### 가) 프론트엔드

- Node.js
  - 표준 버전 고정: 저장소 루트 `.nvmrc` = `20`
  - 엔진 범위 근거: `package.json`, `FrontEnd/ssafy-maker/package.json` 기준 `>=20 <21`
- npm
  - 표준 메이저 버전: `10`
  - 근거: `package.json`, `FrontEnd/ssafy-maker/package.json` `engines.npm = >=10 <11`, `packageManager = npm@10`
- 개발 서버
  - Vite (`5173`)

주의사항:

- 프론트 `README.md` 및 일부 문서에는 Node 25 / npm 11 기준이 적혀 있으나, 실제 `package.json` 엔진과 불일치한다.
- 포팅 표준 버전은 저장소 루트 `.nvmrc`와 각 `package.json`의 `engines`, `packageManager`를 함께 기준으로 사용한다.
- 환경 검증은 루트 또는 `FrontEnd/ssafy-maker`에서 `node -v`, `npm -v`로 수행하고, 각각 Node 20.x / npm 10.x인지 먼저 확인한다.

#### 나) 백엔드

- Java toolchain 25
- Gradle Wrapper 사용
- 기본 로컬 API 포트: `8080`

#### 다) 운영 서버

- AWS EC2 단일 호스트 기반 운영
- Nginx ingress + Docker Compose 멀티 스택 운영

운영 경로 및 설정값:

- 원격 프로젝트 경로: `/home/ubuntu/apps/S14P21E206`
- 프론트 STG release/live
  - `/home/ubuntu/deploy/frontend/stg/releases`
  - `/home/ubuntu/deploy/frontend/stg/live`
- 프론트 PROD release/live
  - `/home/ubuntu/deploy/frontend/prod/releases`
  - `/home/ubuntu/deploy/frontend/prod/live`
- Nginx upstream 경로
  - `/home/ubuntu/deploy/nginx/upstreams`
- Nginx whitelist 경로
  - `/home/ubuntu/deploy/nginx/whitelist`

### 5. 외부 서비스

현재 프로젝트에서 포팅 시 함께 검토해야 하는 외부 서비스 및 외부 연계 지점은 다음과 같다.

#### 가) 인증 및 보안

- Keycloak
  - 로그인, 회원가입, OAuth callback, JWT issuer
  - 공개 도메인: `https://auth.ssafymaker.cloud`
  - 내부 서비스명: `stg-keycloak`
  - 필수 준비 정보:
    - 관리자 계정 `KEYCLOAK_ADMIN`
    - 관리자 비밀번호 `KEYCLOAK_ADMIN_PASSWORD`
    - DB 접속 정보 `KEYCLOAK_DB_URL`, `KEYCLOAK_DB_USER`, `KEYCLOAK_DB_PASSWORD`
    - realm 이름 `app`
    - client id `ssafy-maker-bff`
    - client secret `KEYCLOAK_CLIENT_SECRET`
    - redirect URI, web origin 등록 정보
  - 활용 문서:
    - `docs-infra/KEYCLOAK_POSTGRES_DEPLOYMENT.md`
    - `docs-infra/KEYCLOAK_BFF_BACKEND_GUIDE.md`
  - 가입/활용 관점 메모:
    - SaaS 가입형 서비스가 아니라 자체 호스팅 Keycloak 인스턴스다.
    - 신규 환경 포팅 시 별도 회원가입이 아니라 관리자 계정/bootstrap, realm import, client 생성 절차가 필요하다.

#### 나) 네트워크 및 엣지

- Cloudflare
  - DNS
  - Reverse proxy
  - 프론트 배포 후 캐시 purge
  - 사용 도메인:
    - `ssafymaker.cloud`
    - `www.ssafymaker.cloud`
    - `stg.ssafymaker.cloud`
    - `auth.ssafymaker.cloud`
    - `jenkins.ssafymaker.cloud`
    - `n8n.ssafymaker.cloud`
  - 필수 준비 정보:
    - Zone 생성 및 도메인 소유권
    - DNS A/CNAME 레코드
    - Proxied 설정
    - Jenkins purge용 API Token
    - Zone ID
  - 활용 문서:
    - `docs-infra/00_CURRENT_STATE.md`
    - `docs-infra/04_NETWORK_EDGE.md`
    - `docs-infra/07_RUNBOOK.md`
  - 가입/활용 관점 메모:
    - 신규 포팅 환경에서 Cloudflare 계정 및 zone 준비 없이는 현재 공개 도메인 구조를 재현할 수 없다.
    - 프론트 배포 후 Cloudflare cache purge를 수행하는 운영 절차가 포함된다.

#### 다) 운영 자동화

- Jenkins
  - 프론트/백엔드 STG, PROD 배포
  - 공개 도메인: `https://jenkins.ssafymaker.cloud`
  - 내부 서비스 URL: `http://jenkins:8080`
  - 운영 job:
    - `backend-develop-stg`
    - `frontend-develop-stg`
    - `backend-master-prod`
    - `frontend-master-prod`
  - webhook 진입점:
    - `/project/backend-develop-stg`
    - `/project/frontend-develop-stg`
    - `/project/backend-master-prod`
    - `/project/frontend-master-prod`
  - 필수 준비 정보:
    - Jenkins 관리자 계정
    - GitLab webhook 연동
    - Jenkins credential
      - `ec2-deploy-ssh-v2`
      - `cloudflare-api-token`
      - `cloudflare-zone-id`
      - `n8n-deploy-token`
  - 활용 문서:
    - `WORK_GUIDE.md`
    - `docs-infra/00_CURRENT_STATE.md`
    - `docs-infra/02_CI_CD.md`
    - `docs-infra/07_RUNBOOK.md`
- n8n
  - 배포 결과 알림
  - MR 리뷰 및 운영 보조 webhook
  - 공개 도메인: `https://n8n.ssafymaker.cloud`
  - 내부 서비스 URL: `http://n8n:5678`
  - 주요 webhook:
    - `https://n8n.ssafymaker.cloud/webhook/jenkins/deploy-notify`
    - `https://n8n.ssafymaker.cloud/webhook/gitlab/mr-review`
  - 필수 준비 정보:
    - Header Auth credential
    - `N8N_ENCRYPTION_KEY`
    - `N8N_BASIC_AUTH_USER`, `N8N_BASIC_AUTH_PASSWORD`
    - Jenkins, GitLab, OpenAI, Google Sheets 관련 credential
  - 활용 문서:
    - `WORK_GUIDE.md`
    - `docs-infra/00_CURRENT_STATE.md`
    - `docs-infra/02_CI_CD.md`
    - `Infra/n8n_deploy_notify_bot.md`
    - `Infra/n8n_Deploy_NotifyBot.json`
    - `Infra/MR_Review_Sheet.json`
  - 가입/활용 관점 메모:
    - 자체 호스팅 n8n 인스턴스이며, 워크플로 JSON import와 credential 재등록이 필요하다.
    - MR 리뷰 워크플로는 OpenAI API와 Google Sheets를 추가 연동한다.

#### 라) 모니터링

- Prometheus
- Grafana
- Loki
- Promtail

#### 마) 외부 서비스 범위 정리

- 본 프로젝트는 Photon Cloud를 사용하지 않는다.
- 소셜 인증 SaaS, 코드 컴파일 SaaS도 현재 저장소 기준 직접 사용하지 않는다.
- 다만 다음 외부 연계는 존재한다.
  - GitLab webhook
  - Mattermost 알림 수신 webhook
  - OpenAI API
  - Google Sheets API
- 위 항목은 인프라 운영 자동화 보조 기능이며, 게임 런타임 필수 의존성은 아니다.

### 6. 주요 계정 및 프로퍼티 파일 목록

포팅 시 함께 확인해야 하는 주요 계정, 환경 변수, 프로퍼티 정의/소비 파일은 다음과 같다.

#### 가) 백엔드 애플리케이션 설정

- `BackEnd/src/main/resources/application.yml`
- `BackEnd/src/main/resources/application-local.yml`
- `BackEnd/src/main/resources/application-staging.yml`
- `BackEnd/src/main/resources/application-prod.yml`
- `BackEnd/src/main/resources/application.properties`
- `BackEnd/src/test/resources/application-test.yml`

주요 확인 항목:

- Spring profile
- DB, Redis, RabbitMQ 접속값
- JWT issuer
- Keycloak base/public/internal URL
- client id / secret
- asset base URL / manifest version
- session cookie 정책
- CORS allowed origins

#### 나) 프론트엔드 환경 변수 관련 파일

- `FrontEnd/ssafy-maker/src/shared/config/env.ts`
- `FrontEnd/ssafy-maker/src/features/auth/api.ts`
- `FrontEnd/ssafy-maker/vite.config.ts`
- `FrontEnd/ssafy-maker/docs/conventions/ENVIRONMENT_SETUP.md`

주요 확인 항목:

- `VITE_API_BASE_URL`
- `VITE_API_PROXY_TARGET`
- `VITE_ENABLE_AUTH_BYPASS_LOGIN`
- `VITE_ENABLE_DEBUG_SHORTCUTS`
- `VITE_ENABLE_DEBUG_OVERLAY`
- `VITE_ENABLE_DEBUG_WORLD_GRID`

#### 다) Docker Compose 및 서버 환경 파일

- `docker/compose.app.yml`
- `docker/compose.auth.yml`
- `docker/compose.data.local.yml`
- `docker/compose.nginx.yml`
- `docker/compose.ops.yml`
- `docker/.env.local`
- `docker/.env.stg`
- `docker/.env.prod`
- `docker/.env.ops`
- `docker/.env.auth.stg`
- `docs-infra/03_ENV_VARS.md`

주요 확인 항목:

- app stack image / alias / URL
- data stack image / 계정 / 비밀번호
- Keycloak 관리자/DB/client 정보
- Jenkins, n8n, Grafana 등 운영 도구 변수

#### 라) 배포 파이프라인 및 운영 자동화 파일

- `jenkins/Jenkinsfile.frontend-develop-stg`
- `jenkins/Jenkinsfile.frontend-master-prod`
- `jenkins/Jenkinsfile.backend-develop-stg`
- `jenkins/Jenkinsfile.backend-master-prod`
- `WORK_GUIDE.md`
- `docs-infra/00_CURRENT_STATE.md`
- `docs-infra/02_CI_CD.md`
- `docs-infra/04_NETWORK_EDGE.md`
- `docs-infra/07_RUNBOOK.md`
- `Infra/n8n_deploy_notify_bot.md`
- `Infra/n8n_Deploy_NotifyBot.json`
- `Infra/MR_Review_Sheet.json`

주요 확인 항목:

- Jenkins credential id
- GitLab webhook URL
- n8n webhook URL
- Cloudflare purge 토큰/zone id 사용 위치
- 배포 release/live 경로
- whitelist 예외 경로

### 7. DB 덤프 파일 최신본

포팅 제출용 최신 DB 덤프 파일은 `exec` 폴더 아래에 다음과 같이 정리한다.

- `exec/ssafy-maker_2026-03-30.dump`
  - PostgreSQL custom dump 형식
  - `pg_restore` 기반 복원용
- `exec/ssafy-maker_2026-03-30.sql`
  - PostgreSQL plain SQL 형식
  - SQL 직접 확인 및 plain restore 용도

파일 기준:

- 추출 일자: `2026-03-30`
- 파일 위치: 저장소 `exec` 폴더
- 용도:
  - `*.dump`: 운영/포팅 복원 기준본
  - `*.sql`: 내용 검토 및 대체 복원용

복원 예시:

```bash
pg_restore -d <TARGET_DB> ssafy-maker_2026-03-30.dump
psql -d <TARGET_DB> -f ssafy-maker_2026-03-30.sql
```

주의사항:

- 실제 복원 전 대상 DB 이름, 계정, 확장(extension), 인코딩이 현재 운영 환경과 맞는지 확인해야 한다.
- 제출 시에는 dump와 sql 두 파일을 함께 제공해 복원 호환성을 높인다.

### 8. Gitignore 및 비밀값 관리 대상

문서와 저장소 원칙상 실제 비밀값은 직접 기록하지 않고, 변수명과 사용 위치만 관리해야 한다.

현재 프로젝트에서 포팅 시 비밀값 관리 대상은 다음과 같다.

#### 가) 백엔드/인증

- `DB_PASSWORD`
- `KEYCLOAK_CLIENT_SECRET`
- `KEYCLOAK_ADMIN_CLIENT_SECRET`
- `KEYCLOAK_ADMIN_PASSWORD`
- `JWT_ISSUER_URI` 관련 민감 설정

#### 나) 메시지/캐시/스토리지

- `RABBITMQ_PASSWORD`
- Redis 인증값이 있는 경우 관련 secret

#### 다) 운영 자동화

- Jenkins credential
  - `ec2-deploy-ssh-v2`
  - `cloudflare-api-token`
  - `cloudflare-zone-id`
  - `n8n-deploy-token`

#### 라) 환경 파일

- `docker/.env.local`
- `docker/.env.stg`
- `docker/.env.prod`
- `docker/.env.ops`
- `docker/.env.auth.stg`

포팅 시 실제 값은 새 환경의 secret manager, Jenkins credential, 혹은 서버 전용 `.env` 파일로 이관해야 한다.

---

## II. 빌드 및 실행

### 1. 환경변수 형태

환경변수는 실제 값을 문서에 기록하지 않고, 변수명, 용도, 사용 위치를 중심으로 관리한다.

### 가) 프론트엔드 환경변수

프론트는 Vite 환경변수를 사용한다.

대표 변수:

```env
VITE_API_BASE_URL=/api
VITE_API_PROXY_TARGET=http://localhost:8080
VITE_ENABLE_AUTH_BYPASS_LOGIN=false
VITE_ENABLE_DEBUG_SHORTCUTS=false
VITE_ENABLE_DEBUG_OVERLAY=false
VITE_ENABLE_DEBUG_WORLD_GRID=false
```

설명:

- `VITE_API_BASE_URL`
  - 프론트가 호출할 API 기준 경로
  - 미지정 시 `/api`
- `VITE_API_PROXY_TARGET`
  - Vite dev server의 `/api` 프록시 대상 주소
  - 미지정 시 `http://localhost:8080`
- `VITE_ENABLE_AUTH_BYPASS_LOGIN`
  - 개발용 백엔드 우회 로그인 버튼 활성화 여부
- `VITE_ENABLE_DEBUG_SHORTCUTS`
  - 디버그 단축키 사용 여부
- `VITE_ENABLE_DEBUG_OVERLAY`
  - 디버그 UI 사용 여부
- `VITE_ENABLE_DEBUG_WORLD_GRID`
  - 월드 그리드 디버그 사용 여부

### 나) 백엔드 환경변수

백엔드는 Spring profile과 Compose 환경 변수를 함께 사용한다.

대표 형태:

```env
SPRING_PROFILES_ACTIVE=local
DB_URL=jdbc:postgresql://localhost:5432/mydatabase
DB_USER=myuser
DB_PASSWORD=secret
REDIS_HOST=localhost
REDIS_PORT=6379
RABBITMQ_HOST=localhost
RABBITMQ_PORT=5672
RABBITMQ_USER=myuser
RABBITMQ_PASSWORD=secret
JWT_ENABLED=true
JWT_ISSUER_URI=http://localhost:8081/realms/app
APP_PUBLIC_BASE_URL=http://localhost:8080
APP_FRONTEND_BASE_URL=http://localhost:5173
KEYCLOAK_ENABLED=true
KEYCLOAK_BASE_URL=http://localhost:8081
KEYCLOAK_PUBLIC_BASE_URL=http://localhost:8081
KEYCLOAK_INTERNAL_BASE_URL=http://localhost:8081
KEYCLOAK_REQUIRE_CLIENT_SECRET=true
KEYCLOAK_REALM=app
KEYCLOAK_CLIENT_ID=ssafy-maker-bff
KEYCLOAK_CLIENT_SECRET=
KEYCLOAK_ADMIN_CLIENT_ID=admin-cli
KEYCLOAK_ADMIN_CLIENT_SECRET=
CORS_ALLOWED_ORIGINS=http://localhost:5173
SERVER_SESSION_TIMEOUT=30m
SESSION_COOKIE_NAME=SSAFY_MAKER_SESSION
SESSION_COOKIE_SECURE=false
SESSION_COOKIE_SAME_SITE=Lax
ASSET_BASE_URL=https://assets.ssafymaker.cloud/game/releases/2026-03-12.1
ASSET_MANIFEST_VERSION=2026-03-12.1
```

### 다) 인프라/운영 환경변수

운영 환경은 `docs-infra/03_ENV_VARS.md` 기준으로 관리한다.

주요 그룹:

- app
  - backend image, alias, frontend URL, public URL, CORS, multi-url
- data
  - PostgreSQL, Redis, RabbitMQ
- auth
  - Keycloak DB, admin, realm/client
- ops
  - Jenkins, n8n, monitoring

추가로 실제 포팅 시 빠뜨리기 쉬운 변수:

- app
  - `APP_PUBLIC_BASE_URLS`
  - `APP_FRONTEND_BASE_URLS`
  - `CORS_ALLOWED_ORIGINS`
- auth
  - `KEYCLOAK_REQUIRE_CLIENT_SECRET`
  - `KEYCLOAK_ADMIN_CLIENT_ID`
  - `KEYCLOAK_ADMIN_CLIENT_SECRET`
- ops
  - `OPENAI_API_KEY`
  - `OPENAI_MODEL`
  - `N8N_ENCRYPTION_KEY`
  - `GRAFANA_ADMIN_PASSWORD`

### 2. 프론트엔드 빌드 및 실행

위치:

- `FrontEnd/ssafy-maker`

실행 절차:

```bash
npm install
npm run dev
```

빌드:

```bash
npm run build
```

프론트 빌드 시 실제 수행되는 검증:

- `npm run typecheck`
- `npm run validate:scene-registry`
- `npm run validate:minigame-structure`
- `npm run validate:game-assets`
- `npm run validate:tmx-patch-layers`
- `npm run test:tmx-navigation-policy`
- `npm run test:main-scene-runtime-contracts`
- `npm run test:audio-runtime-contracts`
- `npm run validate:fixed-events`
- `vite build`

미리보기:

```bash
npm run preview
```

프론트 포팅 시 반드시 확인할 사항:

1. `/api` 호출이 백엔드로 연결되는지
2. `/assets/game/...` 정적 리소스가 깨지지 않는지
3. 로그인 후 callback 흐름이 정상인지

### 3. 백엔드 빌드 및 실행

위치:

- `BackEnd`

기본 실행:

```bash
./gradlew build
./gradlew bootRun
```

문서 기준 검증 메모:

- `2026-03-28`, 커밋 `aabc8922c0ff92fd46ecf42e78f2c53e3d9fe2fe` 기준으로 `build.gradle`, Gradle wrapper 설정 파일은 재확인했다.
- 다만 현재 문서 작성 환경에는 Java 실행 환경이 없어 `./gradlew --version`, `./gradlew build` 성공 로그는 확보하지 못했다.
- 실제 포팅 환경에서는 아래 순서로 재현 검증 후 결과를 함께 기록해야 한다.

```bash
./gradlew --version
./gradlew build
```

포팅 시 중요 포인트:

1. DB는 PostgreSQL 기준으로 맞춰야 한다.
2. Flyway migration이 정상 수행되어야 한다.
3. Redis, RabbitMQ, Keycloak 연결이 맞아야 한다.
4. `/api/auth/session`, `/api/users/me`, `/api/public/deaths/dashboard` 등이 응답해야 한다.

백엔드 API 문서 위치:

- 정적 초안 문서
  - `BackEnd/docs/API_SPEC_DRAFT.md`
  - `BackEnd/docs/API_SPEC_WITH_EXAMPLES.txt`
- 실행 시 노출 경로
  - `/api/swagger-ui.html`
  - `/api/v3/api-docs`

### 4. 로컬 의존 서비스 실행

백엔드는 PostgreSQL, Redis, RabbitMQ에 의존한다. 로컬 포팅 검증 시에는 `BackEnd/compose.yaml` 또는 루트 `docker/compose.data.local.yml`을 기준으로 데이터 스택을 먼저 올리는 편이 안전하다.

대표 구성:

- PostgreSQL
- Redis
- RabbitMQ

또한 인증 흐름까지 검증하려면 Keycloak도 함께 실행해야 한다.

배포 시 특이사항:

- 프론트는 단순 정적 파일 업로드가 아니라 release/live 디렉터리 전환과 nginx reload까지 포함한다.
- 백엔드는 blue-green 구조이므로 비활성 color 배포 후 health check, upstream 전환, verify, rollback 순서를 따라야 한다.
- Cloudflare를 사용하는 경우 프론트 배포 후 cache purge가 필요하다.
- Jenkins UI 전체를 외부 개방하지 않고 `/project/*` webhook 경로만 whitelist 예외를 둔다.
- n8n도 UI 전체 공개가 아니라 `/webhook/*`, `/webhook-test/*`만 예외 공개한다.

---

## III. 배포 및 인프라

### 1. 인프라 개요

현재 운영은 Cloudflare -> EC2 -> Nginx ingress -> Docker 서비스 구조를 따른다.

도메인 흐름:

- `ssafymaker.cloud`, `www.ssafymaker.cloud`
  - PROD 프론트
  - `/api` -> PROD backend
- `stg.ssafymaker.cloud`
  - STG 프론트
  - `/api` -> STG backend
- `auth.ssafymaker.cloud`
  - Keycloak
- `jenkins.ssafymaker.cloud`
  - Jenkins
- `n8n.ssafymaker.cloud`
  - n8n

### 2. Docker Compose 운영 구조

현재 프로젝트는 역할별 Docker Compose 분리 운영을 사용한다.

#### 가) 데이터 스택

- 파일: `docker/compose.data.local.yml`
- 구성:
  - PostgreSQL
  - Redis
  - RabbitMQ

#### 나) 인증 스택

- 파일: `docker/compose.auth.yml`
- 구성:
  - Keycloak

#### 다) 앱 스택

- 파일: `docker/compose.app.yml`
- 구성:
  - `api-blue`
  - `api-green`

#### 라) 인그레스 스택

- 파일: `docker/compose.nginx.yml`
- 구성:
  - Nginx ingress

#### 마) 운영 도구 스택

- 파일: `docker/compose.ops.yml`
- 구성:
  - Jenkins
  - n8n
  - Prometheus
  - Grafana
  - Loki
  - Promtail

운영 네트워크:

- `s14p21e206_core_net`
- `docker_ops-net`

운영 볼륨 예시:

- `s14p21e206_pg_data`
- `s14p21e206_redis_data`
- `s14p21e206_rabbitmq_data`
- `jenkins_jenkins_home`

### 3. Nginx 및 네트워크 엣지

Nginx는 다음 역할을 동시에 수행한다.

1. 프론트 정적 파일 서빙
2. `/api` 백엔드 프록시
3. Keycloak, Jenkins, n8n, Grafana, RabbitMQ UI 프록시
4. whitelist 기반 운영 도구 보호

핵심 설정 파일:

- `docker/compose.nginx.yml`
- `Infra/infra/nginx/conf.d/app.conf`

중요 운영 경로:

- upstream 파일
  - `/home/ubuntu/deploy/nginx/upstreams`
- whitelist 파일
  - `/home/ubuntu/deploy/nginx/whitelist`

Cloudflare 포팅 시 확인할 사항:

1. DNS를 Cloudflare로 유지할지 결정
2. proxied 도메인 정책 유지 여부 결정
3. 프론트 배포 후 purge 절차 유지

### 4. Blue-Green 무중단 배포

현재 백엔드는 STG/PROD 모두 blue-green 구조로 무중단 배포를 수행한다.

#### 가) STG

- `stg-api-blue`
- `stg-api-green`

#### 나) PROD

- `prod-api-blue`
- `prod-api-green`

배포 흐름:

1. 비활성 color에 새 이미지 배포
2. health check 수행
3. Nginx upstream 전환
4. verify 수행
5. 실패 시 이전 active color로 rollback

운영 파일:

- STG upstream
  - `/home/ubuntu/deploy/nginx/upstreams/active-stg.conf`
- PROD upstream
  - `/home/ubuntu/deploy/nginx/upstreams/active-prod.conf`

즉, 이 프로젝트의 무중단 배포 핵심은 Kubernetes가 아니라 Nginx upstream 스위칭과 verify/rollback 절차다.

### 5. Jenkins 기반 배포

현재 CI/CD 흐름은 `GitLab -> Jenkins -> n8n` 구조다.

#### 가) 주요 Jenkins Job

- `backend-develop-stg`
- `frontend-develop-stg`
- `backend-master-prod`
- `frontend-master-prod`

#### 나) 배포 흐름

1. GitLab merge event 발생
2. GitLab webhook이 Jenkins `/project/<job>` 호출
3. Jenkins job이 build 및 deploy 수행
4. 성공 또는 실패 결과를 n8n webhook으로 전송
5. n8n이 Mattermost 등으로 알림 전송

#### 다) 관련 credential

- `ec2-deploy-ssh-v2`
- `cloudflare-api-token`
- `cloudflare-zone-id`
- `n8n-deploy-token`

#### 라) 프론트 배포 핵심

- STG release root
  - `/home/ubuntu/deploy/frontend/stg/releases`
- STG live root
  - `/home/ubuntu/deploy/frontend/stg/live`
- PROD release root
  - `/home/ubuntu/deploy/frontend/prod/releases`
- PROD live root
  - `/home/ubuntu/deploy/frontend/prod/live`

프론트는 release/live 디렉터리 전환과 Cloudflare purge까지 포함해서 운영한다.

### 6. 서비스 이용 및 운영 확인 방법

#### 가) 인증 서비스

1. `/api/auth/login` 요청 시 Keycloak 로그인 페이지로 이동
2. 로그인 완료 후 `/api/auth/callback` 처리
3. 프론트로 복귀 후 `/api/auth/session` 정상 응답 확인

#### 나) 저장 서비스

1. `/api/users/{userId}/save-files` 조회
2. 저장 생성/수정/삭제 확인
3. 프론트 인게임 저장 UI와 연동 확인

#### 다) 공개 통계 서비스

1. `/api/public/deaths/dashboard` 호출
2. 최근 사망 기록 및 랭킹 응답 확인

#### 라) 운영 명령 예시

```bash
docker exec ingress-nginx-1 nginx -t
docker exec ingress-nginx-1 nginx -s reload
docker logs --tail 200 ingress-nginx-1
docker logs --tail 200 docker-jenkins-1
docker logs --tail 200 docker-n8n-1
```

---

## IV. 포팅 체크리스트

### 1. 프론트엔드 체크리스트

- `npm install`, `npm run build` 성공
- `/assets/game/...` 정적 파일 응답 정상
- `VITE_API_BASE_URL` 또는 `/api` 프록시 정상
- 로그인 후 프론트 복귀 정상
- 주요 씬 진입 시 에셋 누락 없음

### 2. 백엔드 체크리스트

- PostgreSQL 연결 정상
- Flyway migration 정상
- Redis 연결 정상
- RabbitMQ 연결 정상
- Keycloak issuer 및 client 설정 정상
- `/api/auth/session` 응답 정상
- `/api/users/me` 응답 정상
- `/api/public/deaths/dashboard` 응답 정상

### 3. 인프라 체크리스트

- Docker Compose 스택 분리 운영 가능
- `s14p21e206_core_net` 네트워크 재현
- Nginx `/api` 프록시 정상
- STG/PROD 라우팅 분리 정상
- Blue-Green 전환 절차 재현 가능
- Jenkins webhook 호출 가능
- Cloudflare DNS 및 purge 절차 확인

### 4. 최종 검증 항목

1. 브라우저에서 프론트 진입 가능
2. 로그인 가능
3. 저장 기능 가능
4. 공개 대시보드 조회 가능
5. STG/PROD 배포 경로 분리 정상
6. Nginx reload 및 rollback 절차 검증 완료
7. 운영 문서와 실제 서버 구성이 일치함

---

## 결론

이 프로젝트의 포팅은 프론트엔드만 옮기는 작업이 아니라, 프론트, 백엔드, PostgreSQL 기반 데이터 스택, Keycloak 인증, Docker Compose 운영, Blue-Green 무중단 배포, Cloudflare, Jenkins 자동화까지 함께 옮기는 통합 작업이다.

가장 안전한 포팅 순서는 다음과 같다.

1. PostgreSQL, Redis, RabbitMQ, Keycloak 복원
2. 백엔드 실행 및 인증/API 확인
3. 프론트 실행 및 `/api` 연동 확인
4. Nginx ingress 및 정적 에셋 경로 복원
5. Jenkins, n8n, Cloudflare, blue-green 배포 흐름 복원
6. 최종 smoke check 및 rollback 검증

이 순서를 기준으로 포팅하면 개발용 이전과 운영용 이전을 분리해서 안정적으로 진행할 수 있다.

## 부록. 시연 시나리오

- 시연 절차 및 테스트 흐름은 `exec/시연테스트.md`를 기준으로 진행한다.
- 해당 문서에는 로그인, 새 게임 시작, 캐릭터 생성, 메인 플레이, 저장/불러오기, 공개 통계 확인, 엔딩 흐름 점검 순서가 정리되어 있다.
