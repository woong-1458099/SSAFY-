# S14P21E206 포팅 매뉴얼

## I. 개요

### 1. 프로젝트 개요

`S14P21E206`은 게임 클라이언트, 백엔드 API/BFF, 인증 서버, 데이터 스토어, 운영 자동화, 모니터링이 결합된 통합 서비스이다.

사용자는 브라우저를 통해 게임 프론트엔드에 접속하고, 프론트엔드는 정적 에셋을 로드하면서 `/api` 경로를 통해 백엔드와 통신한다. 백엔드는 로그인, 세션, 저장, 공개 통계, 에셋 매니페스트를 제공하며, 인프라 영역은 Nginx ingress, Keycloak, PostgreSQL, Redis, RabbitMQ, Jenkins, n8n, Cloudflare, 모니터링 스택으로 구성된다.

따라서 본 프로젝트의 포팅은 단순 정적 웹 배포가 아니라 프론트엔드, 백엔드, 인증, 데이터, 배포 파이프라인을 함께 이관하는 작업이다.

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

### 3. 파일 구조도

포팅 관점에서 필요한 `S14P21E206` 기준 파일 구조도는 다음과 같다.

```text
S14P21E206/
├─ BackEnd/
│  ├─ src/
│  │  ├─ main/
│  │  │  ├─ java/
│  │  │  └─ resources/
│  │  │     ├─ db/migration/
│  │  │     ├─ application.yml
│  │  │     ├─ application-local.yml
│  │  │     ├─ application-staging.yml
│  │  │     └─ application-prod.yml
│  │  └─ test/
│  ├─ docs/
│  ├─ build.gradle
│  ├─ Dockerfile
│  └─ compose.yaml
├─ FrontEnd/
│  └─ ssafy-maker/
│     ├─ public/
│     │  └─ assets/
│     │     ├─ game/
│     │     └─ raw/
│     ├─ src/
│     │  ├─ app/
│     │  ├─ features/
│     │  ├─ game/
│     │  ├─ infra/
│     │  ├─ scenes/
│     │  └─ shared/
│     ├─ docs/
│     ├─ scripts/
│     ├─ package.json
│     ├─ vite.config.ts
│     └─ index.html
├─ Infra/
│  ├─ infra/
│  │  └─ nginx/
│  │     ├─ conf.d/
│  │     └─ upstreams/
│  └─ monitoring/
├─ docker/
│  ├─ compose.app.yml
│  ├─ compose.auth.yml
│  ├─ compose.data.local.yml
│  ├─ compose.nginx.yml
│  └─ compose.ops.yml
├─ docs-infra/
│  ├─ 00_CURRENT_STATE.md
│  ├─ 02_CI_CD.md
│  ├─ 03_ENV_VARS.md
│  ├─ 04_NETWORK_EDGE.md
│  └─ 07_RUNBOOK.md
├─ jenkins/
│  ├─ Jenkinsfile.backend-develop-stg
│  ├─ Jenkinsfile.backend-master-prod
│  ├─ Jenkinsfile.frontend-develop-stg
│  └─ Jenkinsfile.frontend-master-prod
└─ WORK_GUIDE.md
```

### 4. 프로젝트 기술 스택

#### 가) 프론트엔드

- React
- Phaser 3
- TypeScript
- Vite
- npm

#### 나) 백엔드

- Java 25
- Spring Boot 4.0.3
- Spring MVC
- Spring Security
- OAuth2 Resource Server
- JPA
- Flyway
- PostgreSQL
- Redis
- RabbitMQ
- springdoc OpenAPI

#### 다) 인프라 및 운영

- Docker Compose
- Nginx
- Keycloak
- Cloudflare
- Jenkins
- n8n
- Prometheus
- Grafana
- Loki
- Promtail
- AWS EC2

### 5. 개발환경

현재 저장소 기준으로 확인되는 개발 및 실행 환경은 다음과 같다.

#### 가) 프론트엔드

- Node.js
  - `package.json` 기준 `>=20 <21`
- npm
  - `package.json` 기준 `>=10 <11`
- 개발 서버
  - Vite (`5173`)

주의사항:

- 일부 프론트 문서에는 Node 25, npm 11 기준이 적혀 있으나 실제 `package.json`과 불일치한다.
- 실제 포팅 기준은 `package.json` 엔진 설정을 우선 적용하는 것이 안전하다.

#### 나) 백엔드

- Java toolchain 25
- Gradle Wrapper 사용
- 기본 로컬 API 포트 `8080`

#### 다) 운영 서버

- AWS EC2 단일 호스트 기반 운영
- Nginx ingress + Docker Compose 멀티 스택 운영

### 6. 외부 서비스

현재 프로젝트에서 포팅 시 함께 검토해야 하는 외부 서비스는 다음과 같다.

#### 가) 인증 및 보안

- Keycloak
  - 로그인, 회원가입, OAuth callback, JWT issuer

#### 나) 네트워크 및 엣지

- Cloudflare
  - DNS
  - Reverse proxy
  - 프론트 배포 후 캐시 purge

#### 다) 운영 자동화

- Jenkins
  - 프론트/백엔드 STG, PROD 배포
- n8n
  - 배포 결과 알림
  - MR 리뷰 및 운영 보조 webhook

#### 라) 모니터링

- Prometheus
- Grafana
- Loki
- Promtail

### 7. Gitignore 및 비밀값 관리 대상

실제 비밀값은 문서에 직접 기록하지 않고, 변수명과 사용 위치만 관리해야 한다.

현재 프로젝트에서 포팅 시 비밀값 관리 대상은 다음과 같다.

#### 가) 백엔드/인증

- `DB_PASSWORD`
- `KEYCLOAK_CLIENT_SECRET`
- `KEYCLOAK_ADMIN_CLIENT_SECRET`
- `KEYCLOAK_ADMIN_PASSWORD`
- `JWT_ISSUER_URI` 관련 민감 설정

#### 나) 메시지/캐시

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

## II. 빌드 및 실행

### 1. 환경변수 형태

환경변수는 실제 값을 문서에 기록하지 않고, 변수명, 용도, 사용 위치 중심으로 관리하는 것을 원칙으로 한다.

#### 1.1 프론트엔드 환경변수

프론트는 Vite 환경변수를 사용한다.

| 변수명 | 설명 | 사용 위치 | 비고 |
| --- | --- | --- | --- |
| `VITE_API_BASE_URL` | 프론트엔드가 호출할 API 기준 경로를 정의한다. | `FrontEnd/ssafy-maker/src/features/auth/api.ts` | 미지정 시 `/api`를 사용한다. |
| `VITE_ENABLE_DEBUG_SHORTCUTS` | 디버그 단축키 기능 활성화 여부를 정의한다. | `FrontEnd/ssafy-maker/src/shared/config/env.ts` | 개발 환경에서 주로 사용한다. |
| `VITE_ENABLE_DEBUG_OVERLAY` | 디버그 오버레이 UI 활성화 여부를 정의한다. | `FrontEnd/ssafy-maker/src/shared/config/env.ts` | 디버그 패널 노출 제어에 사용된다. |
| `VITE_ENABLE_DEBUG_WORLD_GRID` | 월드 그리드 디버그 표시 여부를 정의한다. | `FrontEnd/ssafy-maker/src/shared/config/env.ts` | 월드 좌표 및 타일 편집 검증 시 사용된다. |

#### 1.2 백엔드 환경변수

백엔드는 Spring profile과 Compose 환경 변수를 함께 사용한다.

| 변수명 | 설명 | 사용 위치 | 비고 |
| --- | --- | --- | --- |
| `SPRING_PROFILES_ACTIVE` | 실행 프로필을 정의한다. | `BackEnd/src/main/resources/application.yml` | `local`, `staging`, `prod` 구분에 사용된다. |
| `DB_URL` | PostgreSQL 접속 URL을 정의한다. | `BackEnd/src/main/resources/application-local.yml`, `docker/.env.*` | DB는 PostgreSQL 기준으로 운영된다. |
| `DB_USER` | PostgreSQL 사용자 계정을 정의한다. | `BackEnd/src/main/resources/application-local.yml`, `docker/.env.*` | 민감정보와 함께 관리해야 한다. |
| `DB_PASSWORD` | PostgreSQL 비밀번호를 정의한다. | `BackEnd/src/main/resources/application-local.yml`, `docker/.env.*` | 비밀값으로 별도 관리해야 한다. |
| `REDIS_HOST` | Redis 호스트를 정의한다. | `BackEnd/src/main/resources/application-local.yml`, `docker/.env.*` | 캐시 및 세션성 보조 처리에 사용된다. |
| `REDIS_PORT` | Redis 포트를 정의한다. | `BackEnd/src/main/resources/application-local.yml`, `docker/.env.*` | 기본값은 `6379`다. |
| `RABBITMQ_HOST` | RabbitMQ 호스트를 정의한다. | `BackEnd/src/main/resources/application-local.yml`, `docker/.env.*` | 메시지 브로커 연결에 사용된다. |
| `RABBITMQ_PORT` | RabbitMQ 포트를 정의한다. | `BackEnd/src/main/resources/application-local.yml`, `docker/.env.*` | 기본값은 `5672`다. |
| `RABBITMQ_USER` | RabbitMQ 사용자 계정을 정의한다. | `BackEnd/src/main/resources/application-local.yml`, `docker/.env.*` | 운영 환경별 계정 분리가 필요하다. |
| `RABBITMQ_PASSWORD` | RabbitMQ 비밀번호를 정의한다. | `BackEnd/src/main/resources/application-local.yml`, `docker/.env.*` | 비밀값으로 별도 관리해야 한다. |
| `JWT_ENABLED` | JWT 검증 기능 활성화 여부를 정의한다. | `BackEnd/src/main/resources/application.yml` | 로컬 테스트와 운영 환경 구분에 사용된다. |
| `JWT_ISSUER_URI` | JWT issuer URI를 정의한다. | `BackEnd/src/main/resources/application-local.yml`, `docker/.env.*` | Keycloak realm issuer와 일치해야 한다. |
| `APP_PUBLIC_BASE_URL` | 백엔드 외부 공개 기준 URL을 정의한다. | `BackEnd/src/main/resources/application.yml`, `docker/.env.*` | 외부 접근 기준 주소다. |
| `APP_FRONTEND_BASE_URL` | 프론트엔드 기준 URL을 정의한다. | `BackEnd/src/main/resources/application.yml`, `docker/.env.*` | 인증 리다이렉트 복귀 경로와 연관된다. |
| `KEYCLOAK_ENABLED` | Keycloak 연동 활성화 여부를 정의한다. | `BackEnd/src/main/resources/application.yml` | 인증 인프라 활성화 여부를 제어한다. |
| `KEYCLOAK_BASE_URL` | Keycloak 기본 URL을 정의한다. | `BackEnd/src/main/resources/application.yml`, `docker/.env.*` | 내부 및 외부 URL 파생의 기준이 된다. |
| `KEYCLOAK_PUBLIC_BASE_URL` | 브라우저 기준 Keycloak 공개 URL을 정의한다. | `BackEnd/src/main/resources/application.yml`, `docker/.env.*` | reverse proxy 환경에서 특히 중요하다. |
| `KEYCLOAK_INTERNAL_BASE_URL` | 서버 내부 통신용 Keycloak URL을 정의한다. | `BackEnd/src/main/resources/application.yml`, `docker/.env.*` | 컨테이너 간 통신 시 사용된다. |
| `KEYCLOAK_REALM` | Keycloak realm 이름을 정의한다. | `BackEnd/src/main/resources/application.yml`, `docker/.env.*` | issuer 및 client 구성과 함께 맞춰야 한다. |
| `KEYCLOAK_CLIENT_ID` | Keycloak client ID를 정의한다. | `BackEnd/src/main/resources/application.yml`, `docker/.env.*` | 프론트 로그인 플로우와 연동된다. |
| `KEYCLOAK_CLIENT_SECRET` | Keycloak client secret을 정의한다. | `BackEnd/src/main/resources/application.yml`, `docker/.env.*` | 비밀값으로 별도 관리해야 한다. |
| `ASSET_BASE_URL` | 에셋 배포 기준 URL을 정의한다. | `BackEnd/src/main/resources/application.yml`, `docker/.env.*` | 에셋 매니페스트 응답에 사용된다. |
| `ASSET_MANIFEST_VERSION` | 에셋 버전을 정의한다. | `BackEnd/src/main/resources/application.yml`, `docker/.env.*` | 정적 에셋 릴리스 버전 식별에 사용된다. |

#### 1.3 인프라 및 운영 환경변수

운영 환경은 `docs-infra/03_ENV_VARS.md` 기준으로 관리한다.

| 그룹 | 주요 변수 예시 | 설명 |
| --- | --- | --- |
| app | `BACKEND_IMAGE`, `API_BLUE_ALIAS`, `API_GREEN_ALIAS`, `APP_PUBLIC_BASE_URL`, `APP_FRONTEND_BASE_URL` | 백엔드 배포 이미지, blue-green alias, 외부 공개 URL을 관리한다. |
| data | `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD`, `REDIS_IMAGE`, `RABBITMQ_IMAGE` | PostgreSQL, Redis, RabbitMQ 데이터 스택을 구성한다. |
| auth | `KEYCLOAK_DB_URL`, `KEYCLOAK_DB_USER`, `KEYCLOAK_DB_PASSWORD`, `KEYCLOAK_ADMIN`, `KEYCLOAK_ADMIN_PASSWORD` | Keycloak 데이터베이스 및 관리자 초기 구성을 관리한다. |
| ops | `JENKINS_BASE_URL`, `N8N_HOST`, `N8N_ENCRYPTION_KEY`, `GRAFANA_ADMIN_USER`, `GRAFANA_ADMIN_PASSWORD` | Jenkins, n8n, 모니터링 도구 운영 설정을 관리한다. |

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

포팅 시 중요 포인트:

1. DB는 PostgreSQL 기준으로 맞춰야 한다.
2. Flyway migration이 정상 수행되어야 한다.
3. Redis, RabbitMQ, Keycloak 연결이 맞아야 한다.
4. `/api/auth/session`, `/api/users/me`, `/api/public/deaths/dashboard` 등이 응답해야 한다.

### 4. 로컬 의존 서비스 실행

백엔드는 PostgreSQL, Redis, RabbitMQ에 의존한다. 로컬 포팅 검증 시에는 `BackEnd/compose.yaml` 또는 루트 `docker/compose.data.local.yml`을 기준으로 데이터 스택을 먼저 올리는 편이 안전하다.

대표 구성:

- PostgreSQL
- Redis
- RabbitMQ

인증 흐름까지 검증하려면 Keycloak도 함께 실행해야 한다.

## III. 배포 및 인프라

### 1. 인프라 개요

현재 운영은 Cloudflare, AWS EC2, Nginx ingress, Docker Compose 기반 서비스 스택으로 구성되어 있다.

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
