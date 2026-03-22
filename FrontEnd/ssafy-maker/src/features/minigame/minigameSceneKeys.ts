export const LEGACY_MINIGAME_MENU_SCENE_KEY = "MenuScene" as const;
export const LEGACY_MINIGAME_PAUSE_SCENE_KEY = "MinigamePauseScene" as const;

export const LEGACY_MINIGAME_SCENE_KEYS = [
  "QuizScene",
  "RhythmScene",
  "InterviewScene",
  "RunnerScene",
  "TankScene",
  "TypingScene",
  "BusinessSmileScene",
  "DontSmileScene",
  "GymScene",
  "CookingScene",
  "LottoScene",
  "DrinkingScene",
  "MiniGameReflexScene"
] as const;

export const EXPERIMENTAL_MINIGAME_SCENE_KEYS = [
  "MiniGameCenterScene",
  "MiniGameReflexScene"
] as const;

export const LEGACY_MINIGAME_FLOW_SCENE_KEYS = [
  LEGACY_MINIGAME_MENU_SCENE_KEY,
  LEGACY_MINIGAME_PAUSE_SCENE_KEY,
  ...EXPERIMENTAL_MINIGAME_SCENE_KEYS,
  ...LEGACY_MINIGAME_SCENE_KEYS
] as const;

export type LegacyMinigameSceneKey = (typeof LEGACY_MINIGAME_SCENE_KEYS)[number];
export type LegacyMinigameFlowSceneKey = (typeof LEGACY_MINIGAME_FLOW_SCENE_KEYS)[number];
