# STG/Auth Handoff (2026-03-10)

## 1) 목적
이 문서는 STG 환경에서 Auth(Keycloak)+Nginx+Cloudflare+Spring JWT 연동 상태를 다음 작업자(Codex)가 즉시 이어받기 위한 운영 기준 문서다.

## 2) 확정 인프라 값
- EC2 Public IP: `13.125.26.13`
- Remote Project Dir: `/home/ubuntu/apps/S14P21E206`
- Docker Network: `s14p21e206_core_net`
- STG app project: `stg-app`
- STG data project: `stg-data`
- STG app containers:
- `stg-app-nginx-1`
- `stg-app-api-green-1`
- `stg-app-api-blue-1`
- STG data containers:
- `stg-data-postgres-1`
- `stg-data-redis-1`
- `stg-data-rabbitmq-1`
- Keycloak container:
- `stg-keycloak`

## 3) 핵심 파일 경로
- App compose: `docker/compose.app.yml`
- STG env: `docker/.env.stg`
- PROD env: `docker/.env.prod`
- LOCAL env: `docker/.env.local`
- Nginx conf: `Infra/infra/nginx/conf.d/app.conf`
- Active upstream: `Infra/infra/nginx/upstreams/active.conf`
- Jenkins STG pipeline: `jenkins/Jenkinsfile.develop-mr-ci-dev-deploy`
- Jenkins PROD pipeline: `jenkins/Jenkinsfile.master-merge-cd`
- Jenkins nightly skeleton: `jenkins/Jenkinsfile.nightly-deploy`

## 4) Cloudflare/DNS/SSL 현재 기준
- DNS:
- `auth.ssafymaker.cloud -> 13.125.26.13`
- SSL mode: `Full (strict)`
- Origin cert/key 적용 완료 (nginx 443에서 사용)
- `auth` issuer endpoint 정상 응답 확인:
- `https://auth.ssafymaker.cloud/realms/app/.well-known/openid-configuration`

## 5) Keycloak/OIDC 기준
- Realm: `app`
- Issuer(최종): `https://auth.ssafymaker.cloud/realms/app`
- OIDC metadata endpoint:
- `https://auth.ssafymaker.cloud/realms/app/.well-known/openid-configuration`
- JWKS endpoint:
- `https://auth.ssafymaker.cloud/realms/app/protocol/openid-connect/certs`

## 6) Spring/JWT 연동 변수명 기준
- 최우선 기준(권장):
- `spring.security.oauth2.resourceserver.jwt.issuer-uri`
- 현재 env 키:
- `JWT_ISSUER_URI`
- compose에서 Spring 표준 키로 매핑 필요 시 사용:
- `SPRING_SECURITY_OAUTH2_RESOURCESERVER_JWT_ISSUER_URI=${JWT_ISSUER_URI}`

## 7) .env.stg 기준 템플릿 (민감정보 제외)
```env
TZ=Asia/Seoul
SPRING_PROFILES_ACTIVE=stg
BACKEND_IMAGE=s14p21e206-backend:latest
NGINX_PORT=80
JWT_ENABLED=true
JWT_ISSUER_URI=https://auth.ssafymaker.cloud/realms/app

DB_URL=jdbc:postgresql://postgres:5432/stg_app
DB_USER=stg_app
DB_PASSWORD=<STG_DB_PASSWORD>

REDIS_HOST=redis
REDIS_PORT=6379

RABBITMQ_HOST=rabbitmq
RABBITMQ_PORT=5672
RABBITMQ_USER=stg_app
RABBITMQ_PASSWORD=<STG_RABBITMQ_PASSWORD>
```
## 8) 운영 커맨드 (STG)
재배포:
- cd /home/ubuntu/apps/S14P21E206
```
docker compose -p stg-app --env-file docker/.env.stg -f docker/compose.app.yml up -d api-green api-blue nginx
```
- 상태:
```
docker compose -p stg-app --env-file docker/.env.stg -f docker/compose.app.yml ps
```
- 로그:
```
docker logs stg-app-api-green-1 --tail 120
docker logs stg-app-api-blue-1 --tail 120
docker logs stg-app-nginx-1 --tail 120
```
- issuer 확인:
```
curl -fsS https://auth.ssafymaker.cloud/realms/app/.well-known/openid-configuration
```
## 9) 트러블슈팅 이력 (재발 방지)
- nginx BOM 이슈:
  - 증상: unknown directive "﻿include"
  - 조치: BOM 제거 후 nginx reload
- upstream 파일 누락:
  - 증상: /etc/nginx/upstreams/active.conf not found
  - 조치: Infra/infra/nginx/upstreams/active.conf 생성
- 권한 이슈:
  - 증상: AccessDeniedException for active.conf
  - 조치: 소유권/권한 수정 후 재기동
## 10) 보안 운영 원칙
- .env.* 실값은 Git 커밋 금지
- 비밀값은 Jenkins Credentials/서버 로컬 파일로 관리
- latest 대신 commit SHA 태그 배포를 기본 정책으로 유지
- SSH/관리 도메인과 공개 서비스 도메인 역할 분리 유지
## 11) 다음 작업 TODO
- SecurityConfig에서 공개 헬스체크 경로(public/checks) 정책 재검토 (permitAll 여부 확정)
- Jenkins 파이프라인에서 SHA 태그 주입 배포 고정
- PROD 분리 시 docker/.env.prod 실값과 prod-app 컨테이너 네이밍 검증

