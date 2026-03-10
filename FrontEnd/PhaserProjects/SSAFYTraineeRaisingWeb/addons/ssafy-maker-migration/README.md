# ssafy-maker migration staging

This folder was added without modifying existing files under `src/` in `SSAFYTraineeRaisingWeb`.

## Goal
Prepare login + minigame features from `ssafy-maker` so they can be merged later into:
1. Login first
2. Enter SSAFY trainee raising game
3. Start minigames by talking to NPC in-game

## Classified groups

### 1) auth-login
Source copied from `ssafy-maker/src/features/auth`.
- Path: `auth-login/src/features/auth/*`
- Purpose: login, signup, account recovery UI + auth view config

### 2) minigames
Source copied from `ssafy-maker/src/features/game` and `ssafy-maker/src/PhaserGame.tsx`.
- Path: `minigames/src/features/game/*`
- Path: `minigames/src/PhaserGame.tsx`
- Purpose: menu + 9 minigames + pause scene + face tracking helper

### 3) flow-shell
Source copied from app shell files that connect auth -> game.
- Path: `flow-shell/src/App.tsx`
- Path: `flow-shell/src/main.tsx`
- Path: `flow-shell/src/App.css`
- Path: `flow-shell/src/index.css`
- Purpose: reference flow wiring from login screen to game screen

### 4) references
Copied summaries from `ssafy-maker/long-term-memory` for faster merge work.

## Integration notes for next step
- Keep current `SSAFYTraineeRaisingWeb` scenes as the main game.
- Add a login gate scene or web UI wrapper before `MainScene` starts.
- Reuse NPC interaction in `MainScene` to open a minigame selector.
- Launch imported minigame scene keys from the selector and return to `MainScene` after completion.

## Important
This staging area is intentionally isolated. Nothing here is wired into current runtime yet.
