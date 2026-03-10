# SSAFY Maker Migration Map

`FrontEnd/ssafy-maker` 기능을 `FrontEnd/PhaserProjects/SSAFYTraineeRaisingWeb`로 옮긴 위치입니다.

## UI/Auth

- `ssafy-maker/src/features/auth/*`
  -> `src/features/ui/auth/*`

## UI/Game

- `ssafy-maker/src/features/game/GameScreen.tsx`
  -> `src/features/ui/game/GameScreen.tsx`
- `ssafy-maker/src/PhaserGame.tsx`
  -> `src/features/ui/game/PhaserGame.tsx`

## Minigames

- `ssafy-maker/src/features/game/scenes/*`
  -> `src/features/minigames/scenes/*`

## UI Shell

- `ssafy-maker/src/App.tsx`
  -> `src/features/ui/shell/App.tsx`
- `ssafy-maker/src/main.tsx`
  -> `src/features/ui/shell/main.tsx`
- `ssafy-maker/src/vite-env.d.ts`
  -> `src/features/ui/shell/vite-env.d.ts`

## Styles

- `ssafy-maker/src/App.css`
  -> `src/features/ui/styles/App.css`
- `ssafy-maker/src/index.css`
  -> `src/features/ui/styles/index.css`

## Note

- `ssafy-maker` 폴더는 이관 완료 후 삭제 대상입니다.
