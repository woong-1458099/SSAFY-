# Mini-Game Catalog

Date: 2026-03-09

## Menu Layout

Current `MenuScene` uses an 8-slot selection layout.

Visible cards:
- Quiz
- Rhythm
- Sort
- Bug Crush
- Runner
- Aim
- Type
- Random

`Random` selects one game from the main playable pool at random.

## Scene List

### 1. QuizScene

- Category: quiz
- Theme: information processing / CS quiz
- Goal: answer 5 questions within time limit

### 2. RhythmScene

- Category: rhythm
- Theme: keyboard timing
- Goal: hit notes using `A S D F`

### 3. DragScene

- Category: puzzle
- Theme: code line ordering
- Goal: drag code blocks into correct order

### 4. BugScene

- Category: action / clicker
- Theme: bug crushing
- Goal: click bugs quickly and build combos

### 5. RunnerScene

- Category: jump runner
- Theme: bus stop runner / jump map
- Goal: jump or double-jump to avoid obstacles
- Input: `SPACE` or mouse click

### 6. AimScene

- Category: aim trainer
- Theme: target clicking
- Goal: click targets fast and accurately

### 7. TypingScene

- Category: typing
- Theme: code typing race
- Goal: type target code correctly within time

### 8. Random slot

- Category: launcher
- Theme: random game selection
- Behavior: chooses one scene from:
  - `QuizScene`
  - `RhythmScene`
  - `DragScene`
  - `BugScene`
  - `RunnerScene`
  - `AimScene`
  - `TypingScene`

## File Locations

- `src/features/game/scenes/MenuScene.ts`
- `src/features/game/scenes/QuizScene.ts`
- `src/features/game/scenes/RhythmScene.ts`
- `src/features/game/scenes/DragScene.ts`
- `src/features/game/scenes/BugScene.ts`
- `src/features/game/scenes/RunnerScene.ts`
- `src/features/game/scenes/AimScene.ts`
- `src/features/game/scenes/TypingScene.ts`
