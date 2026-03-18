# 환경 변수 운영 가이드

## 1. env 파일 역할
- `docker/.env.local`
  - 로컬 개발자용
  - SSH 터널 기준 DB / Redis / RabbitMQ 연결

- `docker/.env.stg`
  - STG app 배포용
  - backend alias
    - `API_BLUE_ALIAS=stg-api-blue`
    - `API_GREEN_ALIAS=stg-api-green`

- `docker/.env.prod`
  - PROD app 배포용
  - backend alias
    - `API_BLUE_ALIAS=prod-api-blue`
    - `API_GREEN_ALIAS=prod-api-green`

- `docker/.env.ops`
  - Jenkins / n8n / 모니터링용

- `docker/.env.auth`
  - Keycloak 배포용
  - PostgreSQL 내 Keycloak 전용 DB 접속 정보 포함

## 2. 환경 분리 원칙
1. local / stg / prod / ops env를 섞지 않는다.
2. 비밀값은 저장소에 커밋하지 않는다.
3. STG / PROD는 `-p` 기준 compose project를 명확히 분리한다.
4. 외부 인바운드는 공용 nginx 1대를 기준으로 받는다.
5. STG / PROD backend는 Docker network alias로 내부 식별을 분리한다.

## 3. compose project 기준
- STG app: `stg-app`
- STG data: `stg-data`
- PROD app: `prod-app`
- ingress nginx: `ingress`

## 4. 로컬 개발 기준
- Docker data stack을 기본으로 띄우지 않는다.
- SSH 터널로 연결한다.

예시:
```bash
ssh -L 15432:127.0.0.1:5432 -L 16379:127.0.0.1:6379 -L 15673:127.0.0.1:5672 <user>@<host>
```

로컬 연결 포트:
- PostgreSQL: `localhost:15432`
- Redis: `localhost:16379`
- RabbitMQ: `localhost:15673`

## 5. STG 기준
- 원격 프로젝트 경로: `/home/ubuntu/apps/S14P21E206`
- compose project: `stg-app`
- data compose project: `stg-data`
- domain: `stg.ssafymaker.cloud`

내부 서비스명 기준 연결:
- postgres
- redis
- rabbitmq

내부 backend alias:
- `stg-api-blue`
- `stg-api-green`

## 6. PROD 기준
- 원격 프로젝트 경로: `/home/ubuntu/apps/S14P21E206`
- compose project: `prod-app`
- domain: `ssafymaker.cloud`

내부 서비스명 기준 연결:
- postgres
- redis
- rabbitmq

내부 backend alias:
- `prod-api-blue`
- `prod-api-green`

## 7. 도메인 기준
- PROD 메인 서비스: `ssafymaker.cloud`
- STG 서비스: `stg.ssafymaker.cloud`
- Jenkins: `jenkins.ssafymaker.cloud`
- n8n: `n8n.ssafymaker.cloud`
- auth: `auth.ssafymaker.cloud`
- 운영자 점검용: `j14e206.p.ssafy.io`

## 8. 데이터 / 인증 운영 기준
- data stack은 현재 단일 운영 기준으로 유지
- STG / PROD backend는 같은 postgres / redis / rabbitmq를 사용할 수 있음
- 단기 프로젝트 기준으로 auth는 단일 인스턴스 유지
- 외부 인증 도메인은 `auth.ssafymaker.cloud` 기준으로 사용
- Keycloak 데이터는 앱 `users` 테이블과 분리된 별도 DB 또는 schema 로 유지

### 운영 도구 외부 공개 원칙
- 운영 도구는 HTTPS + 서비스 자체 로그인 + 공통 IP 화이트리스트 기준으로 공개
- 공통 IP 화이트리스트 대상:
  - `jenkins.ssafymaker.cloud`
  - `n8n.ssafymaker.cloud`
  - `grafana.ssafymaker.cloud`
  - `rabbitmq.ssafymaker.cloud`
- `auth.ssafymaker.cloud` 는 전체 공개 유지, admin 관련 경로만 별도 제한

## 9. 비밀값 관리 기준
- STG / PROD 실제 값은 Git에 커밋하지 않는다.
- Jenkins Credentials 또는 별도 비밀 저장소로 관리한다.
- webhook secret, GitLab access token, EC2 SSH key는 역할을 구분해 관리한다.
- 문서에는 예시 또는 운영 기준만 적는다.
