# Login Implementation Summary

Date: 2026-03-09

## Purpose

The login area is treated as an authentication layer that grants game access permission.

- Authentication UI and validation logic are separated from the game screen.
- The game screen renders only after authentication state is confirmed.
- OAuth2 callback/result pages are still not implemented.

## Current Structure

### App shell

Location:
- `src/App.tsx`

Responsibility:
- Holds high-level authentication state
- Switches between auth screen and game screen
- Does not contain form markup anymore

### Auth screen

Location:
- `src/features/auth/AuthScreen.tsx`

Responsibility:
- Renders the authentication-only landing layout
- Passes props to the auth card
- Does not render the Phaser game

### Auth card

Location:
- `src/features/auth/AuthCard.tsx`

Responsibility:
- Owns auth form state
- Owns auth view switching
- Runs validation for each auth flow
- Emits successful login/signup events upward

### Auth subcomponents

Locations:
- `src/features/auth/LoginForm.tsx`
- `src/features/auth/SignupForm.tsx`
- `src/features/auth/FindIdForm.tsx`
- `src/features/auth/FindPasswordForm.tsx`
- `src/features/auth/OAuthButtons.tsx`
- `src/features/auth/StatusMessage.tsx`
- `src/features/auth/authConfig.ts`

Responsibility:
- `LoginForm`: ID/password login form only
- `SignupForm`: signup input UI only
- `FindIdForm`: ID recovery UI only
- `FindPasswordForm`: password recovery UI only
- `OAuthButtons`: Kakao/Steam OAuth2 entry buttons only
- `StatusMessage`: auth message rendering only
- `authConfig.ts`: auth constants and static config only

### Game screen

Location:
- `src/features/game/GameScreen.tsx`

Responsibility:
- Renders only the post-authenticated game entry UI
- Receives authenticated user info and logout handler
- Delegates Phaser rendering to `src/PhaserGame.tsx`

## Implemented Features

### 1. Login form

Behavior:
- Accepts `loginId` and `password`
- Validates required fields
- On success, grants authenticated state to the app shell

### 2. OAuth2 entry buttons

Providers:
- Kakao: `/oauth2/authorization/kakao`
- Steam: `/oauth2/authorization/steam`

Scope:
- Entry links only
- No callback/result page implemented

### 3. Signup form

Behavior:
- Fields: `loginId`, `nickname`, `email`, `password`, `confirmPassword`
- Validates required fields, email pattern, password length, and password match
- On success, returns to login view and prefills login ID

### 4. Find ID form

Behavior:
- Fields: `nickname`, `email`
- Validates required fields
- Shows success guidance message

### 5. Find Password form

Behavior:
- Fields: `loginId`, `email`
- Validates required fields
- Shows password reset guidance message

## Separation Assessment

Current status: improved and acceptable for this project stage.

Separated clearly:
- App-level screen switching
- Auth-only presentation
- Form-specific components
- OAuth button rendering
- Game-only presentation
- Phaser rendering

Remaining coupling:
- `AuthCard.tsx` still owns all auth state and validation logic in one place
- Real backend API integration is not yet abstracted into a service layer

## Recommended Next Refactor

If backend integration starts, consider adding:

- `src/features/auth/api/authApi.ts`
- `src/features/auth/hooks/useAuthForms.ts`
- `src/features/auth/validators.ts`

## Conclusion

The login area and the game area are now separated at the component level.

Login is currently acting as an authentication gate for game access, not as a UI mixed directly into the game screen.
