export const LEGACY_MINIGAME_MENU_SCENE_KEY = "MenuScene" as const;
export const LEGACY_MINIGAME_PAUSE_SCENE_KEY = "MinigamePauseScene" as const;

export const LEGACY_QUIZ_SCENE_KEY = "QuizScene" as const;
export const LEGACY_RHYTHM_SCENE_KEY = "RhythmScene" as const;
export const LEGACY_INTERVIEW_SCENE_KEY = "InterviewScene" as const;
export const LEGACY_RUNNER_SCENE_KEY = "RunnerScene" as const;
export const LEGACY_TANK_SCENE_KEY = "TankScene" as const;
// export const LEGACY_TYPING_SCENE_KEY = "TypingScene" as const; // 타이핑 게임 비활성화
export const LEGACY_BUSINESS_SMILE_SCENE_KEY = "BusinessSmileScene" as const;
export const LEGACY_DONT_SMILE_SCENE_KEY = "DontSmileScene" as const;
export const LEGACY_GYM_SCENE_KEY = "GymScene" as const;
export const LEGACY_COOKING_SCENE_KEY = "CookingScene" as const;
export const LEGACY_LOTTO_SCENE_KEY = "LottoScene" as const;
export const LEGACY_DRINKING_SCENE_KEY = "DrinkingScene" as const;

export const EXPERIMENTAL_MINIGAME_CENTER_SCENE_KEY = "MiniGameCenterScene" as const;

export const MINIGAME_SCENE_KEYS = {
  menu: LEGACY_MINIGAME_MENU_SCENE_KEY,
  pause: LEGACY_MINIGAME_PAUSE_SCENE_KEY,
  quiz: LEGACY_QUIZ_SCENE_KEY,
  rhythm: LEGACY_RHYTHM_SCENE_KEY,
  interview: LEGACY_INTERVIEW_SCENE_KEY,
  runner: LEGACY_RUNNER_SCENE_KEY,
  tank: LEGACY_TANK_SCENE_KEY,
  // typing: LEGACY_TYPING_SCENE_KEY, // 타이핑 게임 비활성화
  businessSmile: LEGACY_BUSINESS_SMILE_SCENE_KEY,
  dontSmile: LEGACY_DONT_SMILE_SCENE_KEY,
  gym: LEGACY_GYM_SCENE_KEY,
  cooking: LEGACY_COOKING_SCENE_KEY,
  lotto: LEGACY_LOTTO_SCENE_KEY,
  drinking: LEGACY_DRINKING_SCENE_KEY,
  center: EXPERIMENTAL_MINIGAME_CENTER_SCENE_KEY
} as const;

export const DEPRECATED_MINIGAME_SCENE_KEYS = [
  "DragScene",
  "MiniGameTypingScene"
] as const;
export const DEPRECATED_MINIGAME_SCENE_KEY_SET = new Set<string>(DEPRECATED_MINIGAME_SCENE_KEYS);

export const LEGACY_MINIGAME_SCENE_KEYS = [
  LEGACY_QUIZ_SCENE_KEY,
  LEGACY_RHYTHM_SCENE_KEY,
  LEGACY_INTERVIEW_SCENE_KEY,
  LEGACY_RUNNER_SCENE_KEY,
  LEGACY_TANK_SCENE_KEY,
  // LEGACY_TYPING_SCENE_KEY, // 타이핑 게임 비활성화
  LEGACY_BUSINESS_SMILE_SCENE_KEY,
  LEGACY_DONT_SMILE_SCENE_KEY,
  LEGACY_GYM_SCENE_KEY,
  LEGACY_COOKING_SCENE_KEY,
  LEGACY_LOTTO_SCENE_KEY,
  LEGACY_DRINKING_SCENE_KEY
] as const;

export const EXPERIMENTAL_MINIGAME_SCENE_KEYS = [
  EXPERIMENTAL_MINIGAME_CENTER_SCENE_KEY
] as const;

export const LEGACY_MINIGAME_FLOW_SCENE_KEYS = [
  LEGACY_MINIGAME_MENU_SCENE_KEY,
  LEGACY_MINIGAME_PAUSE_SCENE_KEY,
  ...EXPERIMENTAL_MINIGAME_SCENE_KEYS,
  ...LEGACY_MINIGAME_SCENE_KEYS
] as const;

export const SUPPORTED_MINIGAME_SCENE_KEYS = [...LEGACY_MINIGAME_FLOW_SCENE_KEYS] as const;
export const SUPPORTED_MINIGAME_SCENE_KEY_SET = new Set<string>(SUPPORTED_MINIGAME_SCENE_KEYS);

export type DeprecatedMinigameSceneKey = (typeof DEPRECATED_MINIGAME_SCENE_KEYS)[number];
export type LegacyMinigameSceneKey = (typeof LEGACY_MINIGAME_SCENE_KEYS)[number];
export type LegacyMinigameFlowSceneKey = (typeof LEGACY_MINIGAME_FLOW_SCENE_KEYS)[number];
export type SupportedMinigameSceneKey = (typeof SUPPORTED_MINIGAME_SCENE_KEYS)[number];

export function isDeprecatedMinigameSceneKey(sceneKey: string): sceneKey is DeprecatedMinigameSceneKey {
  return DEPRECATED_MINIGAME_SCENE_KEY_SET.has(sceneKey);
}

export function isSupportedMinigameSceneKey(sceneKey: string): sceneKey is SupportedMinigameSceneKey {
  return SUPPORTED_MINIGAME_SCENE_KEY_SET.has(sceneKey);
}

export function assertMinigameSceneKeyIntegrity(): void {
  const supportedKeys = new Set<string>(SUPPORTED_MINIGAME_SCENE_KEYS);
  const overlappingDeprecatedKeys = DEPRECATED_MINIGAME_SCENE_KEYS.filter((sceneKey) => supportedKeys.has(sceneKey));

  if (overlappingDeprecatedKeys.length > 0) {
    throw new Error(`[minigameSceneKeys] deprecated key가 활성 목록에 남아 있습니다: ${overlappingDeprecatedKeys.join(", ")}`);
  }
}
