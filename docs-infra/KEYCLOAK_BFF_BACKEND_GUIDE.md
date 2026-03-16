# Keycloak BFF Backend Guide

## Goal
- Browser does not store Keycloak access tokens or refresh tokens.
- Backend owns the OAuth 2.0 Authorization Code flow.
- Browser keeps only an `HttpOnly` session cookie.
- Backend reads the session and authorizes application APIs.

## Required Keycloak Settings

### 1. Realm
- Realm name: `app`
- `User registration`: ON
- `Verify email`: ON
- `Reset password`: ON
- `Login with email`: ON
- `Remember me`: optional

### 2. Client
- Recommended client id: `ssafy-maker-bff`
- Client type: `OpenID Connect`
- Client authentication: ON
- Access type: `confidential`
- Standard flow: ON
- Direct access grants: OFF
- Implicit flow: OFF
- Service accounts: OFF unless backend admin automation needs it
- PKCE code challenge method: `S256`

### 3. Redirect URIs
- `http://localhost:8080/api/auth/callback`
- `https://stg.ssafymaker.cloud/api/auth/callback`
- `https://ssafymaker.cloud/api/auth/callback`

Do not point redirect URIs to the frontend in a BFF flow.

### 4. Web Origins
- `http://localhost:5173`
- `https://stg.ssafymaker.cloud`
- `https://ssafymaker.cloud`

### 5. Post Logout Redirect URIs
- `http://localhost:5173/*`
- `https://stg.ssafymaker.cloud/*`
- `https://ssafymaker.cloud/*`

### 6. Claims
The backend expects these claims in the access token:
- `sub`
- `email`
- `preferred_username`
- `email_verified`

If role-based authorization is used, include:
- realm roles under `realm_access.roles`
- client roles under `resource_access.{clientId}.roles`

## Backend Environment Variables

```env
JWT_ENABLED=true
JWT_ISSUER_URI=http://localhost:8081/realms/app
KEYCLOAK_ENABLED=true
KEYCLOAK_BASE_URL=http://localhost:8081
KEYCLOAK_PUBLIC_BASE_URL=http://localhost:8081
KEYCLOAK_INTERNAL_BASE_URL=http://localhost:8081
KEYCLOAK_REALM=app
KEYCLOAK_CLIENT_ID=ssafy-maker-bff
KEYCLOAK_CLIENT_SECRET=<generated-client-secret>
CORS_ALLOWED_ORIGINS=http://localhost:5173
SESSION_COOKIE_NAME=SSAFY_MAKER_SESSION
SESSION_COOKIE_SECURE=false
SESSION_COOKIE_SAME_SITE=Lax
SERVER_SESSION_TIMEOUT=30m
```

For staging and production:
- `KEYCLOAK_PUBLIC_BASE_URL` should be the public auth domain
- `KEYCLOAK_INTERNAL_BASE_URL` should be the internal network address if backend and Keycloak are on the same private network
- `SESSION_COOKIE_SECURE=true`

## Backend Flow
1. Browser calls `GET /api/auth/login` or `GET /api/auth/signup`.
2. Backend creates `state` and `code_verifier`, stores them in `HttpSession`, and redirects to Keycloak.
3. User authenticates on the Keycloak hosted page.
4. Keycloak redirects to `GET /api/auth/callback`.
5. Backend validates `state`, exchanges `code` for tokens, decodes the access token, and upserts the local user row.
6. Backend stores the authenticated user and Keycloak tokens inside the server session.
7. Backend rotates the session id on login success.
8. Browser receives only the session cookie.
9. Protected APIs use the session-backed authentication context.
10. Logout invalidates the local session and redirects to Keycloak logout.

## Frontend Integration Rules
- Frontend should never read or store Keycloak tokens.
- Frontend should call `/api/auth/session` to know whether a user is logged in.
- Frontend should call `/api/users/me` to fetch the current profile.
- Frontend should send requests with `credentials: "include"` so the session cookie is attached.

## Current Backend Files
- `BackEnd/src/main/java/com/example/gameinfratest/service/AuthService.java`
- `BackEnd/src/main/java/com/example/gameinfratest/api/controller/AuthController.java`
- `BackEnd/src/main/java/com/example/gameinfratest/auth/BffSessionAuthenticationFilter.java`
- `BackEnd/src/main/java/com/example/gameinfratest/config/SecurityConfig.java`

## Notes
- The current backend still keeps OAuth tokens in the server session so it can support future refresh or Keycloak logout integration.
- Browser-side storage of `access_token` or `refresh_token` should be removed to keep the flow as a real BFF.
