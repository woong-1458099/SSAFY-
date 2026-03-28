# S14P21E206 포팅 매뉴얼

## 목차

I. 개요

1. 프로젝트 개요
2. 프로젝트 구성
3. 프로젝트 기술 스택
4. 개발환경
5. 외부 서비스
6. Gitignore 및 비밀값 관리 대상

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
- Keycloak
- Cloudflare
- Jenkins
- n8n
- Prometheus
- Grafana
- Loki
- Promtail
- AWS EC2

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

### 5. 외부 서비스

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

### 6. Gitignore 및 비밀값 관리 대상

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

### 가) 프론트엔드 환경변수

프론트는 Vite 환경변수를 사용한다.

대표 변수:

```env
VITE_API_BASE_URL=/api
VITE_ENABLE_DEBUG_SHORTCUTS=false
VITE_ENABLE_DEBUG_OVERLAY=false
VITE_ENABLE_DEBUG_WORLD_GRID=false
```

설명:

- `VITE_API_BASE_URL`
  - 프론트가 호출할 API 기준 경로
  - 미지정 시 `/api`
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
KEYCLOAK_REALM=app
KEYCLOAK_CLIENT_ID=ssafy-maker-prod
KEYCLOAK_CLIENT_SECRET=
ASSET_BASE_URL=https://assets.ssafymaker.cloud/game/releases/2026-03-12.1
ASSET_MANIFEST_VERSION=2026-03-12.1
```

### 다) 인프라/운영 환경변수

운영 환경은 `docs-infra/03_ENV_VARS.md` 기준으로 관리한다.

주요 그룹:

- app
  - backend image, alias, frontend URL, public URL
- data
  - PostgreSQL, Redis, RabbitMQ
- auth
  - Keycloak DB, admin, realm/client
- ops
  - Jenkins, n8n, monitoring

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

### 4. 로컬 의존 서비스 실행

백엔드는 PostgreSQL, Redis, RabbitMQ에 의존한다. 로컬 포팅 검증 시에는 `BackEnd/compose.yaml` 또는 루트 `docker/compose.data.local.yml`을 기준으로 데이터 스택을 먼저 올리는 편이 안전하다.

대표 구성:

- PostgreSQL
- Redis
- RabbitMQ

또한 인증 흐름까지 검증하려면 Keycloak도 함께 실행해야 한다.

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
