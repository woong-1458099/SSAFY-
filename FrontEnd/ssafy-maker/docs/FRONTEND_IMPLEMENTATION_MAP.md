# Frontend Implementation Map

## Purpose

This document summarizes the current frontend implementation so the project can be understood later by reading Markdown first and code second.

Target project path:

- `FrontEnd/ssafy-maker`

Tech stack:

- Phaser 3
- TypeScript
- Vite

## Runtime Entry

The game starts from:

- `src/app/main.ts`
- `src/app/game.ts`
- `src/app/config/gameConfig.ts`

Flow:

1. `createGame("app")` creates the Phaser instance.
2. `gameConfig` applies screen size, physics, DOM support, scaling, and scene registration.
3. Scene registration is centralized in `src/app/registry/scenes.ts`.

Important note:

- New scenes should be added to `SCENE_REGISTRY`, otherwise Phaser will not load them.

## High-Level Frontend Flow

Current main flow is:

1. `BootScene`
2. `PreloadScene`
3. `LoginScene`
4. `StartScene`
5. `IntroScene`
6. `NewCharacterScene`
7. `MainScene`
8. `FinalSummaryScene`
9. `EndingIntroScene`
10. `EndingComicScene`
11. Return to `StartScene`

Observed from implementation:

- `TitleScene` exists and is registered, but the current live flow does not route through it.
- `MiniGameCenterScene` and `MiniGameReflexScene` are included in the current minigame flow.
- `MiniGameTypingScene` and `DragScene` are intentionally removed and tracked as deprecated keys to catch stale references early.

## Directory Map

### `src/app`

- App bootstrap and Phaser configuration.
- Scene registry is owned here.

### `src/scenes`

- Main gameplay and flow scenes.
- This is the most important folder for understanding current runtime behavior.

Key scenes:

- `BootScene.ts`: immediate handoff to preload.
- `PreloadScene.ts`: preloads shared UI backgrounds and TMX map text assets.
- `LoginScene.ts`: backend-driven login/signup UI using Phaser DOM elements.
- `StartScene.ts`: authenticated landing screen with logout.
- `IntroScene.ts`: long cinematic intro sequence.
- `NewCharacterScene.ts`: avatar setup before entering gameplay.
- `MainScene.ts`: actual gameplay hub, world map, NPC management, shop/inventory logic, time/day/week progression.
- `InGameUIScene.ts`: parallel UI layer hosting HUD, dialogues, menus, and overlays.
- `FinalSummaryScene.ts`, `EndingIntroScene.ts`, `EndingComicScene.ts`: ending pipeline.

### `src/features`

Domain-oriented modules.

- `auth`: backend auth session storage and API calls.
- `ui`: HUD, buttons, panels, modal primitives, UI asset preload.
- `story`: NPC dialogue scripts and choice rules.
- `progression`: ending resolution logic and ending types.
- `minigames`: newer minigame-related types, but runtime wiring is still partial.
- `ai`: type definitions only at the moment.

### `src/core`

Shared managers and low-level utilities.

- `AudioManager.ts`
- `InputManager.ts`
- `SaveManager.ts`
- `StateManager.ts`
- `EventBus.ts`
- `constants/gameConstants.ts`

### `src/shared`

- Scene keys, common types, and shared constants such as place background keys.

### `assets` and `public/assets`

- Runtime assets are duplicated in several places.
- The implementation currently loads from `assets/game/...` paths in scene code.
- `public/assets/...` also contains mirrored content.

Practical implication:

- Asset organization is not fully normalized yet. When changing asset paths, check both `assets` and `public/assets`.

## Authentication Structure

Main files:

- `src/features/auth/authSession.ts`
- `src/features/auth/api.ts`
- `src/scenes/LoginScene.ts`
- `src/scenes/StartScene.ts`

Current auth model:

- The frontend does not handle credentials directly.
- `LoginScene` starts login/signup by redirecting to backend endpoints.
- The backend returns an `auth_ticket` query parameter.
- The frontend exchanges that ticket through `/api/auth/session`.
- Tokens and user info are stored in `localStorage`.

Stored keys:

- `auth.accessToken`
- `auth.refreshToken`
- `auth.idToken`
- `auth.expiresAt`
- `auth.user`

Important behavior:

- If stored session is expired, it is cleared automatically.
- `StartScene` checks for auth before allowing entry.
- Logout is also backend-driven through `/api/auth/logout`.

## Main Gameplay Structure

The center of the current implementation is `src/scenes/MainScene.ts`.

This file currently owns most runtime game logic:

- Sub-area entry and area navigation
- TMX-based map parsing and collision handling
- Player movement and avatar rendering
- Inventory and equipment
- Time/day/week progression and Ending trigger
- *Note: UI rendering (HUD, Dialogue box, Menus) is offloaded to InGameUIScene.*

### MainScene responsibilities

#### Area and map flow

- Uses three area concepts: `world`, `downtown`, `campus`.
- Uses preloaded TMX text assets:
  - `map_tmx_world`
  - `map_tmx_downtown`
  - `map_tmx_campus`
- `enterArea(...)` is the main area transition entry.

#### Player and avatar

- Avatar parts are layered from base body, clothes, and hair spritesheets.
- Character selection data is passed via Phaser registry from `NewCharacterScene`.

#### HUD

- HUD is a dedicated component (`src/features/ui/components/GameHud.ts`).
- It is now rendered and managed by `InGameUIScene`.
- `MainScene` emits `ui:patchHud` events to update the HUD state asynchronously.

#### Inventory and equipment

- Inventory is local-state based inside MainScene.
- Equipment slots are `keyboard` and `mouse`.
- Starter items and shop items are hardcoded in MainScene.

#### Dialogue and story

- Dialogue content is stored in `src/features/story/npcDialogueScripts.ts`.
- MainScene interprets dialogue choices, stat changes, requirement locks, and actions.
- Dialogue actions currently include:
  - `openShop`
  - `openMiniGame`

#### Save/load

- Save slots are persisted in `localStorage` through `SaveManager`.
- Slot IDs are `auto`, `slot-1` through `slot-6`.
- MainScene serializes its own game state payload.

#### Time progression and ending

- Action points drive time advancement.
- Day rollover can autosave.
- Week progression eventually triggers ending flow.
- `startEndingFlow()` sends the player to `FinalSummaryScene`.

## Ending Pipeline

Main files:

- `src/features/progression/services/endingResolver.ts`
- `src/scenes/FinalSummaryScene.ts`
- `src/scenes/EndingIntroScene.ts`
- `src/scenes/EndingComicScene.ts`

Current design:

- Ending selection is stat-based.
- Dominant stats decide one of several endings.
- `frontend-leader` has a special threshold-based branch.

Stat inputs:

- `fe`
- `be`
- `teamwork`
- `luck`
- `hp`

## Important Persistence Points

### Phaser Registry

Used for short-lived scene-to-scene runtime data such as:

- auth token
- auth user
- player avatar selection

### Local Storage

Used for durable client data:

- auth session
- save slots

Practical rule:

- If data must survive refresh, look at `localStorage`.
- If data only needs to survive scene changes, check Phaser registry usage first.

## Current Architecture Characteristics

### What is already modular

- Auth API/session code is separated.
- HUD is a dedicated component.
- Dialogue data is separated from dialogue rendering.
- Ending resolution logic is separated from ending scenes.
- Scene registration is centralized.

### What is still concentrated

- `MainScene.ts` was historically the gameplay monolith.
- **Refactoring Update**: UI management (HUD, Menus, Dialogues) has been migrated to `InGameUIScene.ts` to reduce coupling.
- Map logic, dialogue *execution* (script selection), and progression logic still reside in `MainScene`.

Practical reading order for future analysis:

1. `src/app/registry/scenes.ts`
2. `src/shared/enums/sceneKey.ts`
3. `src/scenes/LoginScene.ts`
4. `src/scenes/StartScene.ts`
5. `src/scenes/MainScene.ts`
6. `src/features/auth/*`
7. `src/features/story/npcDialogueScripts.ts`
8. `src/features/progression/services/endingResolver.ts`
9. `src/core/managers/SaveManager.ts`

## Current Risks and Notes

### 1. MainScene size

- `MainScene.ts` is effectively the gameplay monolith.
- Future changes to inventory, map, dialogue, and saving can conflict because they live in one file.

### 2. Minigame compatibility boundaries

- The runtime uses `src/game/scenes/minigames/*` as the active path.
- Removed scene keys such as `DragScene` and `MiniGameTypingScene` are tracked explicitly so stale registry/catalog references fail fast.

### 3. Unused or partially wired runtime pieces

- `TitleScene` is registered but not part of the main login-to-game path.
- `MiniGameCenterScene` and some newer minigame scenes exist but are not registered.
- `@infra` alias exists in config, but there is no active `src/infra` folder in the current tree.

### 4. String encoding issues

- Several scenes contain visibly broken Korean strings.
- This is noticeable in `IntroScene.ts`, `NewCharacterScene.ts`, ending scenes, dialogue scripts, and ending resolver text.
- Any UX copy cleanup should start with file encoding verification.

### 5. Asset duplication

- Similar assets exist under both `assets` and `public/assets`.
- Before cleanup, confirm which paths are actually used at runtime.

## Where To Modify By Goal

If the future task is about:

- Login/logout/session flow: `src/features/auth/*`, `src/scenes/LoginScene.ts`, `src/scenes/StartScene.ts`
- Scene order or adding a new scene: `src/app/registry/scenes.ts`, `src/shared/enums/sceneKey.ts`
- HUD layout/state: `src/features/ui/components/game-hud.ts`, `src/scenes/MainScene.ts`
- NPC dialogue content: `src/features/story/npcDialogueScripts.ts`
- Shop/inventory/equipment: `src/scenes/MainScene.ts`
- Save/load behavior: `src/core/managers/SaveManager.ts`, `src/scenes/MainScene.ts`
- Ending conditions or ending copy: `src/features/progression/services/endingResolver.ts`, ending scenes
- Character creation flow: `src/scenes/NewCharacterScene.ts`
- Intro cinematic flow: `src/scenes/IntroScene.ts`

## Suggested Next Documentation

If more Markdown-based project understanding is needed later, the next high-value documents would be:

1. A `MainScene` subsystem split document.
2. A frontend-backend API contract summary focused on auth and save/challenge APIs.
3. An asset loading map that states which assets are really used and from which directory.
