# Keycloak + PostgreSQL 배포 가이드

## 목표 구조
- 로그인/회원가입은 Keycloak Hosted Page에서 처리한다.
- 백엔드는 Keycloak JWT를 검증하고, 애플리케이션 전용 `users` 테이블을 PostgreSQL에 유지한다.
- Keycloak 자체 데이터는 같은 PostgreSQL 인스턴스 안의 별도 DB 또는 별도 schema에 저장한다.

## 현재 저장소 기준 구성
- 인프라
  - 공용 ingress nginx가 `auth.ssafymaker.cloud` 를 Keycloak으로 프록시한다.
  - 앱 서버는 `docker/compose.app.yml` 기준 blue/green 으로 배포된다.
  - Keycloak은 `docker/compose.auth.yml` 로 분리 운영한다.
- 백엔드
  - `/api/users/me/bootstrap` 에서 JWT `sub`, `email`, `preferred_username`, `email_verified` 로 로컬 사용자 정보를 upsert 한다.
  - Flyway가 `users` 테이블을 자동 생성/확장한다.
- 프론트엔드
  - `LoginScene` 에서 Keycloak Authorization Code + PKCE 를 시작한다.
  - 토큰 교환 후 백엔드 bootstrap API를 호출해 로컬 사용자 행을 동기화한다.

## PostgreSQL 준비
Keycloak은 애플리케이션 DB와 분리된 DB를 쓰는 편이 안전하다.

예시:
```sql
CREATE USER keycloak_app WITH ENCRYPTED PASSWORD '<strong-password>';
CREATE DATABASE keycloak OWNER keycloak_app;
GRANT ALL PRIVILEGES ON DATABASE keycloak TO keycloak_app;
```

이미 운영 PostgreSQL이 떠 있다면 다음처럼 직접 실행한다.
```bash
docker exec -it stg-data-postgres-1 psql -U <postgres-superuser> -d postgres
```

애플리케이션 `users` 테이블은 백엔드 기동 시 Flyway가 만든다.

## Keycloak 배포
`docker/.env.auth` 예시:
```env
KEYCLOAK_ADMIN=admin
KEYCLOAK_ADMIN_PASSWORD=<strong-password>
KEYCLOAK_DB_URL=jdbc:postgresql://postgres:5432/keycloak
KEYCLOAK_DB_USER=keycloak_app
KEYCLOAK_DB_PASSWORD=<strong-password>
```

실행:
```bash
docker compose -p auth --env-file docker/.env.auth -f docker/compose.auth.yml up -d
```

주의:
- `KEYCLOAK_DB_URL` 의 호스트는 Docker network 안에서 접근 가능한 PostgreSQL 서비스명 또는 내부 DNS여야 한다.
- `docker/keycloak/realm/ssafy-maker-realm.template.json` 을 시작점으로 realm/client 설정을 import 한다.
- 운영에서는 realm 이름을 `master` 대신 `app` 같은 전용 realm 으로 분리한다.

## Keycloak 필수 설정
- Realm
  - `app`
  - `Verify email = ON`
  - `User registration = ON`
  - `Reset password = ON`
- Client
  - `Client ID = ssafy-maker-bff`
  - `Client authentication = ON`
  - `Access Type = confidential`
  - `Standard Flow = ON`
  - `Direct Access Grants = OFF`
  - `PKCE S256 required`
- Redirect URI
  - `https://ssafymaker.cloud/*`
  - `https://stg.ssafymaker.cloud/*`
  - `http://localhost:5173/*`
- Web Origin
  - `https://ssafymaker.cloud`
  - `https://stg.ssafymaker.cloud`
  - `http://localhost:5173`

## 백엔드 설정
STG/PROD env 에 최소한 아래 값이 필요하다.

```env
JWT_ENABLED=true
JWT_ISSUER_URI=https://auth.ssafymaker.cloud/realms/app
KEYCLOAK_ENABLED=true
KEYCLOAK_BASE_URL=https://auth.ssafymaker.cloud
KEYCLOAK_PUBLIC_BASE_URL=https://auth.ssafymaker.cloud
KEYCLOAK_INTERNAL_BASE_URL=http://stg-keycloak:8080
KEYCLOAK_REALM=app
KEYCLOAK_CLIENT_ID=ssafy-maker-bff
KEYCLOAK_CLIENT_SECRET=<generated-client-secret>
CORS_ALLOWED_ORIGINS=https://ssafymaker.cloud,https://stg.ssafymaker.cloud,http://localhost:5173
```

- 브라우저 리다이렉트는 `KEYCLOAK_PUBLIC_BASE_URL` 을 사용한다.
- 백엔드와 Keycloak 간 서버 통신은 `KEYCLOAK_INTERNAL_BASE_URL` 을 사용한다.
- BFF 전용 confidential client 이므로 `KEYCLOAK_CLIENT_SECRET` 을 함께 주입한다.
- realm template import 후 Keycloak Admin Console에서 `ssafy-maker-bff` client secret을 확인하거나 재생성한 뒤 backend env와 동일하게 맞춘다.

백엔드는 토큰에서 다음 클레임을 읽는다.
- `sub`
- `email`
- `preferred_username`
- `email_verified`

PostgreSQL `users` 테이블에는 다음 운영 필드를 저장한다.
- `provider_id`: Keycloak user id
- `username`
- `email_verified`
- `last_login_at`

## 프론트엔드 설정
빌드 시 아래 환경변수를 주입해야 한다.

```env
VITE_API_BASE_URL=https://ssafymaker.cloud
VITE_KEYCLOAK_BASE_URL=https://auth.ssafymaker.cloud
VITE_KEYCLOAK_REALM=app
VITE_KEYCLOAK_CLIENT_ID=ssafy-maker-bff
```

STG 는 `ssafymaker.cloud` 대신 `stg.ssafymaker.cloud` 로 맞춘다.

## 실제 로그인/회원가입 흐름
1. 프론트가 Keycloak Authorization Code with PKCE 요청을 시작한다.
2. 사용자는 Keycloak Hosted Login/Register 화면에서 인증한다.
3. Keycloak이 프론트 redirect URI 로 authorization code 를 돌려준다.
4. 프론트가 verifier 로 토큰을 교환한다.
5. 프론트가 access token 으로 `POST /api/users/me/bootstrap` 호출한다.
6. 백엔드가 JWT를 검증하고 PostgreSQL `users` 테이블에 upsert 한다.
7. 이후 보호 API는 동일 access token 으로 호출한다.

## 운영 체크리스트
- `auth.ssafymaker.cloud` 에서 Keycloak OpenID configuration 이 열리는지 확인
- backend 의 `JWT_ISSUER_URI` 가 realm issuer 와 정확히 일치하는지 확인
- frontend 빌드 결과에 `localhost` 기본값이 남지 않았는지 확인
- nginx 에서 `auth.ssafymaker.cloud` 가 Keycloak 컨테이너로 연결되는지 확인
- PostgreSQL 에 `users` 와 Keycloak 내부 테이블이 서로 다른 DB 또는 schema 에 분리되어 있는지 확인
