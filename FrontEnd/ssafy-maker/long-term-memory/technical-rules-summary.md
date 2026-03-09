# Technical Rules Summary

Date: 2026-03-09

## Project Rules

- Do not modify code unless the user explicitly says `코드수정해줘`.
- All new frontend development must use TypeScript.
- Do not add new `.js` or `.jsx` source files.

## Current Technical State

### Language

- Main frontend app is based on TypeScript
- React files use `.tsx`
- Config and logic files use `.ts` when applicable

### Game scenes

- Mini-game scenes were migrated into `ssafy-maker`
- Scene files currently remain in TypeScript files with `@ts-nocheck`
- This is intentional for the migrated Phaser scene code

### Lint policy

- General TypeScript lint rules are enabled
- `src/features/game/scenes/*.ts` has a narrow exception for `@ts-nocheck`

## Recommended Future Cleanup

- Gradually remove `@ts-nocheck` from Phaser scene files
- Add scene-level Phaser typings
- Extract shared scene helpers if scene count grows
