# SSAFYTraineeRaising Code Convention

## 1) Language and Encoding
- Use C# for all runtime/editor scripts.
- Keep source files UTF-8.
- Use English for identifiers and log prefixes.
- UI text can be Korean or English, but ensure the assigned TMP font supports it.

## 2) Naming
- Class/Struct/Method/Event/Property: `PascalCase`
  - Example: `StatsManager`, `ApplyDelta`, `OnStatsChanged`
- Local variables and parameters: `camelCase`
  - Example: `statsText`, `activity`
- Private fields: `_camelCase`
  - Example: `_gameOverRaised`, `_isSubscribed`
- Public serialized fields used in inspector/data objects: existing `camelCase` 유지
  - Example: `hp`, `maxHP`, `coding`, `stress`
- Constants: `PascalCase` (current project style)
  - Example: `DataFolder`

## 3) File and Folder Structure
- Runtime scripts: `Assets/Scripts/...`
  - Domain-based folders: `Core`, `UI`, `Data`
- Editor-only scripts: `Assets/Editor/...`
- ScriptableObject data assets: `Assets/StatsData/...`
- One top-level public class per file, filename == class name.

## 4) Access Modifiers and Class Layout
- Always write explicit access modifiers (`private`, `public`).
- Recommended member order:
1. constants
2. serialized/public fields
3. properties/events
4. private fields
5. Unity lifecycle methods (`Awake`, `OnEnable`, `Start`, `Update`, `OnDisable`)
6. public methods
7. private helper methods

## 5) Braces and Formatting
- Use Allman style braces.
- 4 spaces indentation.
- Keep single-line guard clauses when clear:
  - `if (statsText == null) return;`
- Keep methods small and focused.

## 6) Null and Error Handling
- Guard null early and return.
- For runtime safety, fail soft where possible (log + return/create fallback).
  - Example: auto-create `StatsManager` if missing.
- Do not silently swallow unexpected states.

## 7) Logging
- Prefix logs with script name in square brackets.
  - Example: `[GameManager] ...`, `[ActivityExecutor] ...`
- Use:
  - `Debug.Log` for state/progress
  - `Debug.LogWarning` for recoverable issues
  - `Debug.LogError` for blocking issues

## 8) Events and State Updates
- Event names use `On...` pattern.
- Subscribe in `OnEnable`, unsubscribe in `OnDisable`.
- Prevent duplicate subscriptions with flags when needed.
- After mutating stats, clamp values before broadcasting.

## 9) Unity UI / Data Rules
- Do not hardcode gameplay balance in multiple places.
- Source of truth for activity balance is `Assets/StatsData/*.asset`.
- Editor setup scripts must be idempotent:
  - running setup repeatedly must not duplicate listeners/components.

## 10) Recommended Cleanup (Gradual)
- Replace implicit private methods/fields with explicit `private` (e.g., in `GameManager`).
- Keep one gameplay system path per scene (avoid mixed `GameManager` and `ActivityExecutor` flows unless intentional).
- Keep text/font pairs consistent to avoid TMP glyph warnings.
