# Game Integration Summary

Date: 2026-03-09

## Purpose

The post-login area now runs the mini-game center directly inside `ssafy-maker`.

- `ssafy-game` is no longer required at runtime.
- Mini-game scenes have been migrated into `ssafy-maker`.
- Login and game execution remain separated at the component level.

## Main Files

- `src/features/game/GameScreen.tsx`
- `src/PhaserGame.tsx`
- `src/features/game/scenes/`

## Runtime Structure

### Game screen

`GameScreen.tsx`

- Receives authenticated user
- Shows lobby copy and logout button
- Mounts `PhaserGame`

### Phaser entry

`PhaserGame.tsx`

- Creates Phaser game instance
- Registers local mini-game scenes
- Shows a banner above the Phaser canvas

### Registered scenes

- `MenuScene`
- `QuizScene`
- `RhythmScene`
- `DragScene`
- `BugScene`
- `RunnerScene`
- `AimScene`
- `TypingScene`

## Important Note

The game hub is now fully local to `ssafy-maker`.

If `ssafy-game` is deleted later, `ssafy-maker` should continue working because scene imports no longer point outside the project.
