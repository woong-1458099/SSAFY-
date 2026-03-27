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
