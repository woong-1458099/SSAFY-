# Auth Structure Summary

Date: 2026-03-09

## Purpose

`ssafy-maker` uses the login area as an authentication gate before entering the mini-game center.

- Authentication UI and game UI are separated.
- Login grants frontend access state only.
- Real backend authentication and authorization are not connected yet.

## Main Files

- `src/App.tsx`
- `src/features/auth/AuthScreen.tsx`
- `src/features/auth/AuthCard.tsx`
- `src/features/auth/LoginForm.tsx`
- `src/features/auth/SignupForm.tsx`
- `src/features/auth/FindIdForm.tsx`
- `src/features/auth/FindPasswordForm.tsx`
- `src/features/auth/OAuthButtons.tsx`
- `src/features/auth/StatusMessage.tsx`
- `src/features/auth/authConfig.ts`

## Current Flow

1. User lands on auth screen.
2. User can use:
   - login
   - signup
   - find ID
   - find password
   - Kakao OAuth2 entry button
   - Steam OAuth2 entry button
3. When login succeeds in frontend state, app switches to game screen.

## Current Limitations

- Login is still frontend-only state transition.
- Password is not validated by server.
- OAuth2 callback/result handling is not implemented.
- Session/token-based protection is not implemented.

## Recommended Next Backend Step

- Add real auth API
- Add `/me` session check
- Use server-side authorization for game access
