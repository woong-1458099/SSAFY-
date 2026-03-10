# 진행 현황 및 다음 계획

## 1. 현재 확정 아키텍처

### 1) Compose 분리 원칙
- 앱 스택: `docker/compose.app.yml`
  - `nginx`, `api-blue`, `api-green`
- 데이터 스택(로컬/데이터 전용 서버): `docker/compose.data.local.yml`
  - `postgres`, `redis`, `rabbitmq`
- 운영 도구 스택: `docker/compose.ops.yml`
  - `jenkins`, `n8n`, `prometheus`, `grafana`

### 2) 환경변수 분리 원칙
- 로컬 개발자용: `docker/.env.local`
- 스테이징 앱 배포용: `docker/.env.stg`
- 운영 앱 배포용: `docker/.env.prod`
- 운영 도구용: `docker/.env.ops`

### 3) 볼륨 정책
- Jenkins: `jenkins_jenkins_home` (external 재사용)
- n8n: `n8n_n8n_data` (external 재사용)
- 데이터/모니터링 볼륨은 고정 이름 사용
- 주의: `docker compose down -v`, `docker volume prune`는 데이터 유실 가능

## 2. 지금까지 완료한 작업

1. compose 파일을 역할별로 분리하고 `docker/` 폴더로 정리
2. n8n encryption key 불일치 이슈 해결 및 재기동 검증
3. Jenkins/n8n 백업 파일 복원 절차 검증
4. 앱 이미지 빌드용 `BackEnd/Dockerfile` 추가
5. 문서(`DOCKER_ENV_YML.md`, `ENVIRONMENTS.md`) 정리 기반 마련

## 3. 운영 시 실행 기준

### 로컬 개발
- 로컬에서 data compose를 기본으로 띄우지 않음
- `docker/.env.local` + SSH 터널로 DB/Redis/RabbitMQ 연결

### 스테이징 앱
```bash
docker compose -p stg-app --env-file docker/.env.stg -f docker/compose.app.yml up -d
```

### 운영 앱
```bash
docker compose -p prod-app --env-file docker/.env.prod -f docker/compose.app.yml up -d
```

### 운영 도구
```bash
docker compose -p docker --env-file docker/.env.ops -f docker/compose.ops.yml up -d
```

## 4. 네트워크/보안 운영 원칙

1. 외부 공개 포트는 원칙적으로 Nginx(80/443)만 사용
2. 웹훅/콜백 인바운드도 Nginx를 통해 수신
3. DB/Redis/RabbitMQ는 외부 직접 공개 금지
4. SSH(22)는 필요 시에만 제한 개방
5. `stg/prod`는 같은 compose를 사용하되 `-p`로 프로젝트 분리

## 5. 접근 제어 자동화(확정)

1. Google Form 신청
2. Google Sheets 기록
3. n8n 자동 처리
4. Security Group에 `/32` 임시 등록
5. 만료 시간 도달 시 자동 회수

원칙:
- 초대된 계정만 신청 가능
- 공용 비밀번호 방식 사용 금지
- 신청/승인/회수 이력 기록

## 6. 다음 작업 계획

1. `api-blue/api-green` 실제 백엔드 이미지 태그 전략 확정
2. EC2 기준 보안그룹/포트 정책 확정
3. App EC2 / Data EC2 분리 시나리오 점검
4. 스테이징-운영 전환 체크리스트(롤백 포함) 문서화
5. 팀원용 SSH 터널 접속 가이드 표준화

## 7. 의사결정 메모

- 로컬 개발자용 env와 배포용 env는 분리 유지
- 운영 자동화/모니터링 스택은 앱 스택과 분리 유지
- 장기적으로는 Data 계층을 별도 EC2로 분리하는 방향 유지

## 8. 2026-03-09 EC2 진행 업데이트

### 완료한 작업

1. Ubuntu 24.04.3 LTS EC2 기본 점검 완료
2. Docker / Docker Compose 설치 완료
3. `docker/compose.app.yml`, `docker/compose.data.local.yml`을 같은 내부 네트워크(`s14p21e206_core_net`) 기준으로 정리
4. STG data 스택 기동 성공
   - `postgres`, `redis`, `rabbitmq`
   - 외부 포트 미공개, Docker 내부 네트워크 전용
5. STG app 스택 기동 성공
   - `api-blue`, `api-green`, `nginx`
   - `nginx`가 `80` 포트로 정상 응답
6. 애플리케이션 연결 검증 완료
   - PostgreSQL 연결 성공
   - RabbitMQ 사용자 생성 반영 확인
   - Docker 네트워크 내부 기준 `/actuator/health` 응답 `UP` 확인

### 현재 상태

- 외부 공개 포트: `22`, `80`, `443`
- data 계층(PostgreSQL / Redis / RabbitMQ)은 외부 미공개
- STG app/data는 같은 Docker 네트워크를 통해 서비스명(`postgres`, `redis`, `rabbitmq`)으로 통신
- nginx upstream 현재 active 대상은 `api-green`
- STG app compose 프로젝트명은 `stg-app`
- Jenkinsfile 경로는 `jenkins/Jenkinsfile.develop-mr-ci-dev-deploy`

### 다음 작업

1. 수동 배포 성공 절차를 Jenkins 파이프라인으로 이관
2. blue/green 전환 및 롤백 절차 명문화
3. STG/PROD 실제 비밀값 관리 방식 정리
4. 팀원용 SSH 터널 접속 가이드와 `env.local` 표준안 공유
5. ops 스택(`jenkins`, `n8n`, `prometheus`, `grafana`) 검증

## 9. 2026-03-09 운영 도메인/ops 복구 업데이트

### 완료한 작업

1. Jenkins / n8n 백업 볼륨을 EC2에 업로드하고 external volume 기준으로 복원 완료
   - `jenkins_jenkins_home.tgz`
   - `n8n_n8n_data.tgz`
2. Jenkins credential 복원 확인 완료
   - `ec2-deploy-ssh`
   - `gitlab-token-string`
   - GitLab 관련 credential
3. n8n 백업 내부 `config` 파일 기준 encryption key 확인 후 복원 성공
4. `docker/compose.ops.yml` 기준 ops 스택 기동 및 Jenkins / n8n / Prometheus / Grafana 컨테이너 실행 확인
5. 신규 도메인 `ssafymaker.cloud` 구매 및 Cloudflare 연결 완료
6. host 기반 reverse proxy 구조로 운영 방향 전환
   - `ssafymaker.cloud` -> 메인 서비스
   - `jenkins.ssafymaker.cloud` -> Jenkins
   - `n8n.ssafymaker.cloud` -> n8n
7. 기존 `j14e206.p.ssafy.io`는 SSH/관리용 주소로 유지
8. `/n8n` path 기반 프록시는 정적 asset/API 경로 문제로 운영 대상에서 제외하고, n8n은 서브도메인 기반으로 정리

### 작업 중 확인한 이슈

1. nginx 설정 파일 `app.conf` 저장 시 UTF-8 BOM 문제로 컨테이너 기동 실패 발생
   - 증상: `unknown directive "﻿include"`
   - 조치: BOM 제거 후 nginx 재기동
2. Jenkins / n8n을 path 기반(`/jenkins`, `/n8n`)으로 동일 호스트 아래에 두는 방식은 Jenkins는 가능했으나 n8n은 자산 경로/REST 경로 불일치로 white screen 발생
   - 결론: n8n은 서브도메인 기반이 더 적합
3. Cloudflare `Full` 모드에서는 origin 443 미구성 상태와 맞지 않아 `521` 발생
   - 현재 origin은 80 포트 기준 운영

### 다음 작업

1. Jenkins 잡 구조 정리
   - `develop-mr-ci-dev-deploy`
   - `master-merge-cd`
   - `nightly-deploy` 기본 비활성
2. GitLab webhook 및 Jenkins 연동 정리
3. n8n MR 코드리뷰 자동화 연동
4. Cloudflare/origin HTTPS 구성 후 SSL 모드 상향 검토


## 10. 다음 Codex 작업 메모

현재 기준 사실:

1. STG 서버 경로는 `~/apps/S14P21E206`
2. STG app compose 프로젝트명은 `stg-app`
3. Jenkins 배포 파일은 `jenkins/Jenkinsfile.develop-mr-ci-dev-deploy`
4. nginx `/api` 프록시는 수정 완료되어 `curl http://localhost/api/public/checks`가 `200` 응답함
5. active upstream 기본 상태는 `api-green`
6. Jenkins/GitLab HTTPS 인증은 비밀번호가 아니라 토큰 기반으로 처리해야 함

다음 Codex가 이어서 할 일:

1. Jenkins 잡 `develop-mr-ci-dev-deploy`를 `Pipeline script from SCM`으로 연결하고 첫 수동 실행 결과를 검증한다.
2. 현재 Jenkinsfile에 없는 `test`, `build`, Docker image build/tag update 단계를 추가한다.
3. `master-merge-cd`용 Jenkinsfile을 별도로 만들고 blue/green 전환 기준을 분리한다.
4. `nightly-deploy` 잡은 기본 비활성으로만 생성한다.
5. `docker/.env.prod`를 실제 운영 기준으로 작성하고 `prod-app` 프로젝트명 정책을 문서/파이프라인에 맞춘다.
6. `BACKEND_IMAGE=s14p21e206-backend:latest`를 commit SHA 기반 태그 전략으로 교체한다.

## 2026-03-10 STG 인증/도메인/배포 파이프라인 진행 업데이트

### 완료
1. `auth.ssafymaker.cloud`를 Keycloak(`stg-keycloak`)으로 reverse proxy 연결 완료
2. Cloudflare Origin Cert + nginx 443 설정 완료, `Full (strict)` 기준 동작 확인
3. OIDC issuer 확인 완료
   - `https://auth.ssafymaker.cloud/realms/app/.well-known/openid-configuration`
4. STG 앱 DB/Redis/RabbitMQ 연결 정상화
   - DB: `postgres:5432/stg_app`
   - Redis: `redis:6379`
   - RabbitMQ: `rabbitmq:5672`
5. Jenkins STG 파이프라인에서 아래 단계 정상 통과 확인
   - Checkout / Test / Build Jar / Remote Docker Build / Active Color Detect / Deploy Target Color

### 현재 이슈(미해결)
1. Jenkins `Health Check` 단계 실패
   - 원인: 원격(EC2) 실행/변수 전달/grep 패턴 불일치가 섞여 간헐 실패
   - 앱 자체는 기동 완료 로그 확인됨 (`Tomcat started on port 8080`, RabbitMQ connection created)
2. `Switch Nginx Upstream`/`Verify And Rollback` 단계는 Health Check 실패로 미실행

### 다음 액션
1. Jenkinsfile `Health Check`를 원격 ssh heredoc 방식으로 고정
2. `TARGET_COLOR`를 `withEnv`로 명시 전달
3. health 판정식을 JSON 기준으로 고정
   - `grep -Eq '"status"[[:space:]]*:[[:space:]]*"UP"'`
4. 통과 후 `Switch/Verify/Rollback` 최종 검증
