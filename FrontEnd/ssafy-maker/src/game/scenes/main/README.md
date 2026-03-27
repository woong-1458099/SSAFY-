# MainScene Support Modules

This folder holds support modules extracted from `MainScene.ts`.

Current split:

- `authFlow.ts`
  - Session gate and logout fallback flow for entering/leaving `MainScene`.
- `autoSaveCoordinator.ts`
  - Dirty/idle/min-interval based autosave scheduling.
- `debugPanel.ts`
  - Debug panel view-state payload shaping.
- `debugFlow.ts`
  - Debug command routing and debug-scene restart helpers.
- `areaPresentation.ts`
  - Safe rerender tile resolution and area presentation helpers.
- `areaRefreshCoordinator.ts`
  - Deferred area rerender request lifecycle management.
  - Tracks request ownership and refresh-in-progress state for frame-boundary requeue safety.
  - Refresh helpers may be async; the coordinator keeps the running state until that work settles.
  - Async refresh handlers also receive a request-current check and abort signal so stale completions can bail out safely.
  - Scene `SHUTDOWN`/`DESTROY` listeners are detached during `dispose()` to avoid duplicate lifecycle handlers after scene restarts.
  - Cancel/requeue paths clear running state only for the owning request id so an older async `finally` block cannot reset a newer refresh.
- `ending.ts`
  - Ending preset payload helpers.
- `fixedEventDebug.ts`
  - Debug fixed-event jump payload shaping.
- `targets.ts`
  - Area transition target and static place target calculation helpers.
- `persistence.ts`
  - Save payload, ending payload, and scene-state snapshot helpers.

Rule of thumb:

- Keep world orchestration and cross-manager runtime flow inside `MainScene.ts`.
- Move reusable support logic, payload shaping, and lifecycle helpers into this folder.
- `PlayerManager.getMovementActivitySnapshot()` is the canonical movement-activity contract.
- `PlayerManager.getMovementActivitySnapshot().autoSaveGateActive` is the autosave-facing field: it keeps autosave blocked for real movement/raw input and for the short input-lock transition grace window configured by `PLAYER_AUTOSAVE_LOCK_TRANSITION_GRACE_MS` only when `setInputLocked(..., { preserveAutoSaveGateDuringLockTransition: true })` marks the lock as an interaction-style transition.
- `autoSaveGateActive` is computed from a dedicated lock-transition timestamp, not from the broader `graceActive` field, so autosave gating is resilient to frame-order differences between generic movement grace and input-lock transitions.
- The runtime-contract test locks this further: repeated `setInputLocked(true)` calls must not refresh the grace timer, and idle-to-locked transitions must not create new autosave gate activity.
- `PlayerManager.isAutoSaveMovementActivityInProgress()` is the compatibility shortcut for `autoSaveGateActive`.
- `PlayerManager.isMovementActivityInProgress()` keeps the broader grace-preserved activity policy for lock/load boundaries.
- `PlayerManager.isImmediateMovementActivityInProgress()` remains available as the raw immediate-activity helper.
- Current usage note: `MainScene.shouldAutoSave()` now reads `getMovementActivitySnapshot().autoSaveGateActive`.
- Contract note: the lock-transition autosave gate is verified in [`scripts/test-main-scene-runtime-contracts.mjs`](/C:/Users/HOME/Downloads/gitlab/shoot/S14P21E206/FrontEnd/ssafy-maker/scripts/test-main-scene-runtime-contracts.mjs), and code changes to this policy should be updated there in the same change.
- Boundary note: `findNearestWalkableRefreshTile(...)` now rejects out-of-bounds origin tiles up front and leaves final fallback selection to `resolveSafeRefreshTile(...)`.
- Refresh-tile search caching is now scene-owned: `MainScene` passes its own cache object into `areaPresentation.ts` and clears it during scene cleanup.
- Refresh-tile search caching is also revision-scoped: callers must pass the current rerender revision, and `MainScene` bumps a local revision before rerender sync so same-reference mutable maps/grids cannot replay stale nearest-tile results across refresh passes.
