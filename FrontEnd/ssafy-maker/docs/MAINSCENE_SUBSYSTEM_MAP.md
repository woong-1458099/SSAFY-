# MainScene Subsystem Map

## Purpose

This document explains how `MainScene.ts` is currently split so future changes can be made in the right place without turning the scene back into a monolith.

Target path:

- `src/game/scenes/MainScene.ts`
- `src/game/scenes/main/*`

## Design Rule

`MainScene.ts` is the runtime orchestrator.

It should keep:

- Phaser scene lifecycle handling
- manager wiring
- cross-system gameplay flow
- scene transitions and event emission

It should avoid owning:

- payload shaping
- reusable calculation helpers
- deferred refresh bookkeeping
- debug command routing details
- auth/session helper flows

Those responsibilities now live under `src/game/scenes/main/`.

## Current Split

### `src/game/scenes/MainScene.ts`

Owns the live runtime flow:

- `create()` bootstraps managers, world state, UI scene, and initial area load
- `update()` coordinates interaction state, debug overlays, UI patching, and movement-time checks
- area enter / restart / restore flow
- ending trigger flow
- death handling and brightness overlay lifecycle

Think of this file as the top-level coordinator that decides when something happens, not where all detailed logic should live.

### `src/game/scenes/main/authFlow.ts`

Owns auth-related helper flow for `MainScene`:

- authenticated entry check
- existing session fallback
- logout fallback cleanup

Use this when changing:

- redirect-to-login behavior
- logout cleanup rules
- session restore checks before entering gameplay

### `src/game/scenes/main/autoSaveCoordinator.ts`

Owns autosave policy and scheduling:

- dirty-state tracking
- idle-only save condition timing
- minimum save interval
- save success bookkeeping

Use this when changing:

- autosave interval
- idle detection policy
- dirty fingerprint strategy

### `src/game/scenes/main/persistence.ts`

Owns payload shaping for scene persistence:

- regular save payload builder
- ending payload builder
- ending autosave payload builder
- current scene-state snapshot builder

Use this when changing:

- what data is serialized
- ending scene payload fields
- snapshot composition rules

### `src/game/scenes/main/ending.ts`

Owns debug ending preset helpers:

- fixed preset payloads for forced ending entry

Use this when changing:

- debug ending presets
- ending test payload defaults

### `src/game/scenes/main/debugPanel.ts`

Owns debug panel view-model shaping:

- HUD/stats/inventory/debug story data assembled for panel rendering

Use this when changing:

- what the debug panel displays
- how debug panel state is grouped

### `src/game/scenes/main/debugFlow.ts`

Owns debug command routing helpers:

- maps debug commands to runtime handlers
- resolves debug-scene restart spawn overrides

Use this when changing:

- debug command behavior
- debug scene jump flow
- command-to-handler mapping

### `src/game/scenes/main/fixedEventDebug.ts`

Owns fixed-event debug jump payload shaping:

- rewrites save payload to match a target week/day/time/event
- optional completion reset behavior

Use this when changing:

- debug event-jump behavior
- forced event-entry state patching

### `src/game/scenes/main/targets.ts`

Owns interaction target calculation:

- area transition targets
- static place interaction targets

Use this when changing:

- clickable area transitions
- place interaction detection
- target placement math

### `src/game/scenes/main/areaPresentation.ts`

Owns area presentation helpers:

- area label mapping
- safe rerender tile selection
- nearest walkable tile fallback

Use this when changing:

- area name display labels
- safe player reposition during rerender
- walkable refresh heuristics

### `src/game/scenes/main/areaRefreshCoordinator.ts`

Owns deferred area rerender lifecycle:

- pending refresh handler registration
- request id invalidation
- refresh finalization / cancellation

Use this when changing:

- delayed area refresh timing
- rerender cancellation safety
- request deduplication

## Read Order

Recommended reading order for future work:

1. `src/game/scenes/MainScene.ts`
2. `src/game/scenes/main/README.md`
3. `src/game/scenes/main/authFlow.ts`
4. `src/game/scenes/main/autoSaveCoordinator.ts`
5. `src/game/scenes/main/persistence.ts`
6. `src/game/scenes/main/debugFlow.ts`
7. `src/game/scenes/main/targets.ts`
8. `src/game/scenes/main/areaPresentation.ts`
9. `src/game/scenes/main/areaRefreshCoordinator.ts`

## Practical Edit Guide

If the task is:

- auth/session entry issue: `authFlow.ts`
- autosave timing or dirty-state issue: `autoSaveCoordinator.ts`
- save schema change: `persistence.ts`
- debug command addition: `debugFlow.ts`
- debug panel content: `debugPanel.ts`
- fixed event jump behavior: `fixedEventDebug.ts`
- transition/place target bug: `targets.ts`
- rerender tile or area label issue: `areaPresentation.ts`
- delayed area refresh race issue: `areaRefreshCoordinator.ts`
- multi-manager scene flow issue: `MainScene.ts`

## Current Boundary

The current split is intentionally moderate.

Further splitting would only make sense if one of these becomes substantially larger again:

- death flow
- brightness/display flow
- BGM/background selection flow
- scene restore/restart flow

Until then, keeping those inside `MainScene.ts` is more readable than scattering them into too many tiny files.
