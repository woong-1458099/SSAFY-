# 환경 변수 운영 가이드

## 1. env 파일 역할
- `docker/.env.local`
  - 로컬 개발자용
  - SSH 터널 기준 DB/Redis/RabbitMQ 연결
- `docker/.env.stg`
  - STG 앱 배포용
- `docker/.env.prod`
  - PROD 앱 배포용
- `docker/.env.ops`
  - Jenkins / n8n / 모니터링용

## 2. 환경 분리 원칙
1. local / stg / prod / ops env를 섞지 않는다.
2. 비밀값은 저장소에 커밋하지 않는다.
3. stg / prod는 `-p` 기준 compose project를 명확히 분리한다.
4. 외부 인바운드는 Nginx 단일 진입을 기준으로 한다.

## 3. compose project 기준
- STG app: `stg-app`
- STG data: `stg-data`
- PROD app: `prod-app`

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

내부 서비스명 기준 연결:
- postgres
- redis
- rabbitmq

## 6. 도메인 기준
- 메인 서비스: `ssafymaker.cloud`
- Jenkins: `jenkins.ssafymaker.cloud`
- n8n: `n8n.ssafymaker.cloud`
- auth: `auth.ssafymaker.cloud`
- 운영자 점검용: `j14e206.p.ssafy.io`

## 7. 비밀값 관리 기준
- STG / PROD 실제 값은 Git에 커밋하지 않는다.
- Jenkins Credentials 또는 별도 비밀 저장소로 관리한다.
- 문서에는 예시 또는 운영 기준만 적는다.