# CI/CD Runbook

## 목적

- `backend-ci`: 빠른 CI(기본 테스트)
- `backend-integration`: 통합 테스트(정기/수동)

## Jenkins Job 구성

1. `backend-ci`
- 트리거: GitLab Push/MR 이벤트
- 브랜치: `develop`
- 실행: `clean test` (빠른 검증)

2. `backend-integration`
- 트리거: 주기 실행(예: `H 2 * * *`) 또는 수동
- 브랜치: `develop`
- 실행: `integrationTest` (Testcontainers 포함)

3. `develop-mr-ci-dev-deploy` (스테이징 배포 자동화)
- 기준 스크립트: `jenkins/Jenkinsfile.develop-mr-ci-dev-deploy`
- 용도: STG의 `api-blue/api-green` 배포 + nginx upstream 전환

## 공통 파이프라인 흐름

1. `deleteDir()`로 워크스페이스 초기화
2. GitLab 토큰으로 `develop` 브랜치 clone
3. 파이프라인 목적에 맞는 단계 실행
4. 배포 잡은 SSH로 EC2에 접속해 원격 `docker compose` 실행

## 필수 Credential

1. `gitlab-token-string`
- 타입: `Secret text`
- 용도: GitLab API/Webhook 연동용 토큰

2. `gitlab-repo-read` 또는 동등한 Git HTTPS Credential
- 타입: `Username with password`
- 용도: GitLab HTTPS clone/fetch 인증
- 비고: Password 칸에는 계정 비밀번호가 아니라 PAT 또는 Project Access Token 사용

3. `ec2-deploy-ssh`
- 타입: `SSH Username with private key`
- 용도: EC2 원격 배포용

## JDK/Gradle 기준

- Jenkins 컨테이너에 JDK 25 설치
- 빌드 시 환경 변수:
  - `JAVA_HOME=/opt/jdk-25`
  - `PATH=$JAVA_HOME/bin:$PATH`
  - Gradle 옵션: `-Dorg.gradle.java.installations.paths=/opt/jdk-25`

## 테스트 분리 규칙

- 기본 `test` 태스크: `integration` 태그 제외
- `integrationTest` 태스크: `integration` 태그만 실행
- `GameInfraTestApplicationTests`는 `@Tag("integration")` 적용

## 장애 대응 가이드

1. `RyukResourceReaper` 오류
- 원인: Jenkins/Testcontainers 환경 충돌
- 조치: 통합테스트를 `backend-integration` 잡으로 분리 유지

2. `gradlew not found`
- 원인: wrapper 파일 누락 또는 브랜치 미반영
- 조치: `BackEnd/gradlew`, `gradle/wrapper/*` 커밋 확인

3. Git 인증 실패
- 원인: Credential 타입/ID 불일치
- 조치: `gitlab-token-string` 사용 여부 및 ID 확인

## 운영 원칙

- `develop`에서 CI 검증 완료 후 `master(main)` 배포 반영
- 빠른 피드백은 `backend-ci`, 무거운 검증은 `backend-integration`에 위임

## 작업 이력 (2026-03-05)

1. Jenkins Pipeline 문법 이슈 정리
- 증상: `WorkflowScript: expecting '''` 컴파일 에러 발생
- 원인: `sh '...'` 또는 `sh '''...'''` 내부 `git clone` 명령이 줄바꿈으로 끊겨 문자열 파싱 실패
- 조치: `git clone --depth 1 --branch develop <repo> .` 형태로 한 줄 실행되도록 수정

2. Checkout 실행 이슈 정리
- 증상: `fatal: You must specify a repository to clone.`
- 원인: `develop` 뒤 줄바꿈으로 저장소 URL이 같은 명령으로 전달되지 않음
- 조치: `git clone` 명령을 단일 라인으로 고정

3. GitLab/Jenkins 연동 확인
- Jenkins GitLab Connection: `E206` 선택
- GitLab URL: `https://lab.ssafy.com`
- Credential: API Token 기반(`웹훅 Jenkins 키`) 사용하여 연결 통과
- 참고: Webhook/API 토큰과 Git Clone 인증(PAT/계정)은 목적이 다를 수 있으므로 분리 관리

4. 현 인프라 상태 메모
- 사내/현재 환경에서 22번 포트 제약으로 SSH 기반 배포는 보류
- 우선 HTTPS/API 경로 기준으로 CI 연동 정리 후, EC2 이전 시 SSH 배포로 전환 예정

## EC2 이전 시 운영 계획 (API + SSH)

1. 1단계: API로 통로 오픈
- EC2 보안그룹/방화벽/API 경유 정책으로 배포 통신 경로 먼저 확보

2. 2단계: Git 작업은 SSH 전환
- EC2 내 배포 사용자에 SSH 키 배치 후 GitLab Deploy Key 또는 개인 키로 `git clone/fetch` 수행
- Jenkins에는 `ec2-deploy-ssh` 크리덴셜을 사용해 원격 명령 실행

3. 3단계: CD 파이프라인 반영
- `jenkins/Jenkinsfile.develop-mr-ci-dev-deploy` 기준으로 SSH 접속 후 배포/헬스체크/업스트림 스위칭 수행
- 장애 시 blue/green 롤백 절차 유지

## 2026-03-09 CI/CD 운영 기준 확정

### 브랜치 역할

- `develop`: 개발 통합 브랜치
- `master`: 배포 기준 브랜치
- `master`는 direct push를 허용하지 않고 MR merge만 허용한다.

### Jenkins 잡 기준

1. `develop-mr-ci-dev-deploy`
- 트리거: `develop` 대상 MR 생성/업데이트
- 실행 범위: STG 대상 `api-blue/api-green` 원격 배포 -> 내부 health check -> 선택적 upstream 전환 -> 최종 verify -> 실패 시 rollback
- 추가 작업: n8n 코드리뷰 워크플로우 트리거
- 대상 정책: 모든 MR 대상

2. `master-merge-cd`
- 트리거: `develop -> master` MR merge 후 `master` 브랜치 갱신
- 실행 범위: blue/green 배포 -> health check -> nginx upstream 전환
- 실패 정책: health check 실패 또는 전환 검증 실패 시 이전 슬롯으로 rollback

3. `nightly-deploy`
- 용도: 필요 시 수동으로 활성화하는 예약 배포 잡
- 기본 정책: 기본 비활성 상태 유지
- 예정 시각: 새벽 2시 기준으로 사용 가능하도록 유지
- 비고: 초기 운영에서는 상시 활성화하지 않는다.

### 배포 환경 기준

- MR 검증 결과는 개발자 확인을 위해 개발 환경에 자동 반영한다.
- 실제 배포 서버 반영은 `master` merge 이후에만 수행한다.
- 개발 환경은 단일 환경을 사용하며, 최신 MR 기준으로 덮어쓴다.
- 현재 STG app compose 프로젝트명은 `stg-app` 기준으로 운영한다.
- 현재 배포 기준 경로는 `~/apps/S14P21E206` 이다.
- 현재 STG upstream active 기본 확인 파일은 `Infra/infra/nginx/upstreams/active.conf` 이다.

### 현재 STG 배포 명령 기준

```bash
docker compose -p stg-app --env-file docker/.env.stg -f docker/compose.app.yml up -d api-<blue|green>
```

### 현재 검증 기준

- 내부 앱 기동 확인: `docker exec stg-app-api-<color>-1 curl -fsS http://localhost:8080/actuator/health`
- nginx 경유 최종 확인: `curl -fsS http://localhost/api/public/checks`
- nginx 전환: `active.conf` 수정 후 `docker exec stg-app-nginx-1 nginx -s reload`

### 리뷰 및 권한 정책

- 모든 MR에 대해 n8n 기반 코드리뷰 코멘트를 남긴다.
- 리뷰 프롬프트는 추후 언어별로 별도 정리한다.
- 현재 팀 운영 특성상 모든 팀원이 MR 생성/승인 가능하도록 유지한다.
- 권한을 넓게 두는 대신 Jenkins 배포 이력과 rollback 절차를 운영 기준으로 삼는다.

## 2026-03-09 도메인/배포 운영 기준 추가

### 도메인 운영 기준

- `ssafymaker.cloud`: 메인 서비스 도메인
- `jenkins.ssafymaker.cloud`: Jenkins 전용 도메인
- `n8n.ssafymaker.cloud`: n8n 전용 도메인
- `j14e206.p.ssafy.io`: SSH 및 관리자 점검용 주소

### reverse proxy 운영 기준

- 외부 공개 트래픽은 Cloudflare + nginx 기준으로 수신한다.
- 메인 서비스와 운영 도구는 host 기반 reverse proxy로 분리한다.
- Jenkins는 서브도메인 기반으로 운영하며 path prefix를 사용하지 않는다.
- n8n은 `/n8n` path 기반 대신 서브도메인 기반으로 운영한다.

### ops 구성 기준

- Jenkins / n8n은 `docker/compose.ops.yml` 기준으로 운영한다.
- Jenkins / n8n은 `core-net`에 연결하여 nginx가 내부 Docker 네트워크 기준으로 접근한다.
- Jenkins는 `JENKINS_OPTS --prefix` 없이 루트 기준으로 운영한다.
- n8n의 `N8N_PATH`는 env 기준으로 관리하며 현재 운영값은 `/` 이다.

### Cloudflare / SSL 기준

- 신규 도메인은 Cloudflare DNS 기준으로 운영한다.
- origin에 443 구성이 완료되기 전까지는 현재 origin 포트 구조와 일치하는 SSL 모드를 사용한다.
- 장기적으로는 origin HTTPS 구성 후 `Full` 또는 `Full (strict)` 기준으로 정리한다.


## 다음 작업 메모

1. `develop-mr-ci-dev-deploy`에 `test`, `build`, 이미지 태그 생성 단계를 추가한다.
2. `BACKEND_IMAGE=s14p21e206-backend:latest`를 commit SHA 기반 태그 전략으로 교체한다.
3. `master-merge-cd` Jenkinsfile을 별도 파일로 분리한다.
4. `nightly-deploy`는 기본 비활성 잡으로만 생성하고 운영 정책을 문서화한다.

## 2026-03-10 Jenkins 파이프라인 기준 업데이트

### 확정된 서버/경로/컨테이너 정보
- STG 서버 공인 IP: `13.125.26.13`
- 원격 프로젝트 경로: `/home/ubuntu/apps/S14P21E206`
- STG app compose 프로젝트명: `stg-app`
- STG data compose 프로젝트명: `stg-data`
- 현재 STG 컨테이너:
  - `stg-app-nginx-1`
  - `stg-app-api-green-1`
  - `stg-app-api-blue-1`
  - `stg-data-postgres-1`
  - `stg-data-redis-1`
  - `stg-data-rabbitmq-1`
- compose 서비스명(`docker/compose.app.yml`): `api-green`, `api-blue`, `nginx`

### 이미지 태그 정책
- `latest` 고정 태그 대신 `commit SHA` 태그를 사용한다.
- Jenkins에서 `git rev-parse --short=12 HEAD` 값을 태그로 생성한다.
- 배포 시 `BACKEND_IMAGE=s14p21e206-backend:<short_sha>`를 런타임 주입한다.

### Jenkins 잡/스크립트 경로
- `develop-mr-ci-dev-deploy`
  - Script Path: `jenkins/Jenkinsfile.develop-mr-ci-dev-deploy`
  - 목적: STG 배포(blue/green 전환 + verify + rollback)
- `master-merge-cd`
  - Script Path: `jenkins/Jenkinsfile.master-merge-cd`
  - 목적: PROD 배포용 파이프라인 분리
- `nightly-deploy`
  - Script Path: `jenkins/Jenkinsfile.nightly-deploy`
  - 기본 정책: 비활성(`ENABLE_NIGHTLY=false`)

### 현재 env 상태 메모
- `docker/.env.stg`에는 `BACKEND_IMAGE=s14p21e206-backend:latest`가 존재한다.
- `docker/.env.prod`에는 `BACKEND_IMAGE` 값이 아직 확인되지 않았다.
- Jenkins 런타임 주입값(`BACKEND_IMAGE=<sha>`)을 우선 사용한다.

### 주의사항
- PROD 컨테이너명(`prod-app-*`)은 실제 PROD compose 기동 전에는 존재하지 않는다.
- PROD 분리 후 `docker ps` 결과 기준으로 health check 컨테이너명을 최종 점검한다.
## 2026-03-10 Jenkins STG 파이프라인 검증 결과

### 검증된 사항
- Jenkins에서 다음 단계는 정상 동작 확인:
  - `Resolve Image Tag (Commit SHA)`
  - `Test` (`./BackEnd/gradlew test --no-daemon -p BackEnd`)
  - `Build Jar` (`./BackEnd/gradlew bootJar --no-daemon -p BackEnd`)
  - `Build Docker Image On EC2`
  - `Detect Active Color` (`active.conf` 기반)
  - `Deploy Target Color` (inactive color 배포)

### 확인된 구성값
- `EC2_HOST=13.125.26.13`
- `REMOTE_PROJECT_DIR=/home/ubuntu/apps/S14P21E206`
- compose args: `-p stg-app --env-file docker/.env.stg -f docker/compose.app.yml`
- credential id: `ec2-deploy-ssh-v2`

### 현재 실패 지점
- `Health Check` 단계
- 주 원인 후보:
  1. 원격 실행 컨텍스트 누락(로컬 Jenkins에서 docker 명령 실행)
  2. `TARGET_COLOR` 전달 누락
  3. health 응답 파싱 패턴 불일치

### 권장 Health Check 기준
- 실행 위치: 반드시 EC2 원격 shell 내부
- 대상: `docker exec stg-app-nginx-1` 통해 `api-<color>:8080/actuator/health` 조회
- 성공 조건:
  - `grep -Eq '"status"[[:space:]]*:[[:space:]]*"UP"'`

### 참고 운영 경고
- compose 경고:
  - `a network with name s14p21e206_core_net exists but was not created for project "stg-app"`
- 필요 시 `docker/compose.app.yml`의 `core-net`에 `external: true` 명시