export const LEGACY_MINIGAME_MENU_SCENE_KEY = "MenuScene" as const;
export const LEGACY_MINIGAME_PAUSE_SCENE_KEY = "MinigamePauseScene" as const;

export const LEGACY_MINIGAME_SCENE_KEYS = [
  "QuizScene",
  "RhythmScene",
  "ConflictResolveScene",
  "InterviewScene",
  "RunnerScene",
  "BilliardsScene",
  "TankScene",

  "TypingScene",
  "BusinessSmileScene",
  "DontSmileScene",
  "GymScene",
  "CookingScene",
  "LottoScene",
  "DrinkingScene"
] as const;

export const LEGACY_MINIGAME_FLOW_SCENE_KEYS = [
  LEGACY_MINIGAME_MENU_SCENE_KEY,
  LEGACY_MINIGAME_PAUSE_SCENE_KEY,
  ...LEGACY_MINIGAME_SCENE_KEYS
] as const;

export type LegacyMinigameSceneKey = (typeof LEGACY_MINIGAME_SCENE_KEYS)[number];
export type LegacyMinigameFlowSceneKey = (typeof LEGACY_MINIGAME_FLOW_SCENE_KEYS)[number];
