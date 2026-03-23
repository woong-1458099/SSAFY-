export const LEGACY_MINIGAME_MENU_SCENE_KEY = "MenuScene" as const;
export const LEGACY_MINIGAME_PAUSE_SCENE_KEY = "MinigamePauseScene" as const;

export const DEPRECATED_MINIGAME_SCENE_KEYS = [
  "DragScene",
  "MiniGameTypingScene"
] as const;
export const DEPRECATED_MINIGAME_SCENE_KEY_SET = new Set<string>(DEPRECATED_MINIGAME_SCENE_KEYS);

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
  "DrinkingScene"
] as const;

export const EXPERIMENTAL_MINIGAME_SCENE_KEYS = [
  "MiniGameCenterScene"
] as const;

export const LEGACY_MINIGAME_FLOW_SCENE_KEYS = [
  LEGACY_MINIGAME_MENU_SCENE_KEY,
  LEGACY_MINIGAME_PAUSE_SCENE_KEY,
  ...EXPERIMENTAL_MINIGAME_SCENE_KEYS,
  ...LEGACY_MINIGAME_SCENE_KEYS
] as const;

export const SUPPORTED_MINIGAME_SCENE_KEYS = [
  ...LEGACY_MINIGAME_FLOW_SCENE_KEYS
] as const;
export const SUPPORTED_MINIGAME_SCENE_KEY_SET = new Set<string>(SUPPORTED_MINIGAME_SCENE_KEYS);

export type DeprecatedMinigameSceneKey = (typeof DEPRECATED_MINIGAME_SCENE_KEYS)[number];
export type LegacyMinigameSceneKey = (typeof LEGACY_MINIGAME_SCENE_KEYS)[number];
export type LegacyMinigameFlowSceneKey = (typeof LEGACY_MINIGAME_FLOW_SCENE_KEYS)[number];

export function isDeprecatedMinigameSceneKey(sceneKey: string): sceneKey is DeprecatedMinigameSceneKey {
  return DEPRECATED_MINIGAME_SCENE_KEY_SET.has(sceneKey);
}

export function isSupportedMinigameSceneKey(sceneKey: string): sceneKey is LegacyMinigameFlowSceneKey {
  return SUPPORTED_MINIGAME_SCENE_KEY_SET.has(sceneKey);
}

export function assertMinigameSceneKeyIntegrity(): void {
  const supportedKeys = new Set<string>(SUPPORTED_MINIGAME_SCENE_KEYS);
  const overlappingDeprecatedKeys = DEPRECATED_MINIGAME_SCENE_KEYS.filter((sceneKey) => supportedKeys.has(sceneKey));

  if (overlappingDeprecatedKeys.length > 0) {
    throw new Error(`[minigameSceneKeys] deprecated key가 활성 목록에 남아 있습니다: ${overlappingDeprecatedKeys.join(", ")}`);
  }
}
