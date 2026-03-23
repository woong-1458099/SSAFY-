import Phaser from "phaser";
import { SCENE_KEYS } from "../../common/enums/scene";
import {
  assertMinigameCatalogIntegrity,
  LEGACY_MINIGAME_CARDS
} from "../../features/minigame/minigameCatalog";
import {
  assertMinigameSceneKeyIntegrity,
  DEPRECATED_MINIGAME_SCENE_KEYS,
  LEGACY_MINIGAME_FLOW_SCENE_KEYS,
  LEGACY_MINIGAME_MENU_SCENE_KEY,
  LEGACY_MINIGAME_PAUSE_SCENE_KEY,
  LEGACY_MINIGAME_SCENE_KEYS,
  isDeprecatedMinigameSceneKey,
  SUPPORTED_MINIGAME_SCENE_KEYS
} from "../../features/minigame/minigameSceneKeys";
import { BootScene } from "../../game/scenes/BootScene";
import { PreloadScene } from "../../game/scenes/PreloadScene";
import { MainScene } from "../../game/scenes/MainScene";
import { MiniGameCenterScene } from "../../game/scenes/minigames/MiniGameCenterScene";
import { MiniGameReflexScene } from "../../game/scenes/minigames/MiniGameReflexScene";
import LegacyBusinessSmileScene from "../../game/scenes/minigames/BusinessSmileScene";
import LegacyCookingScene from "../../game/scenes/minigames/CookingScene";
import LegacyDontSmileScene from "../../game/scenes/minigames/DontSmileScene";
import LegacyDrinkingScene from "../../game/scenes/minigames/DrinkingScene";
import LegacyGymScene from "../../game/scenes/minigames/GymScene";
import LegacyInterviewScene from "../../game/scenes/minigames/InterviewScene";
import LegacyLottoScene from "../../game/scenes/minigames/LottoScene";
import LegacyMenuScene from "../../game/scenes/minigames/MenuScene";
import LegacyMinigamePauseScene from "../../game/scenes/minigames/MinigamePauseScene";
import LegacyQuizScene from "../../game/scenes/minigames/QuizScene";
import LegacyRhythmScene from "../../game/scenes/minigames/RhythmScene";
import LegacyRunnerScene from "../../game/scenes/minigames/RunnerScene";
import LegacyTankScene from "../../game/scenes/minigames/TankScene";
import LegacyTypingScene from "../../game/scenes/minigames/TypingScene";

type SceneConstructor = new () => Phaser.Scene;

type SceneRegistryEntry = {
  key: string;
  scene: SceneConstructor;
};

const SCENE_REGISTRY_ENTRIES: readonly SceneRegistryEntry[] = [
  { key: SCENE_KEYS.boot, scene: BootScene },
  { key: SCENE_KEYS.preload, scene: PreloadScene },
  { key: SCENE_KEYS.main, scene: MainScene },
  { key: LEGACY_MINIGAME_MENU_SCENE_KEY, scene: LegacyMenuScene },
  { key: LEGACY_MINIGAME_PAUSE_SCENE_KEY, scene: LegacyMinigamePauseScene },
  { key: "QuizScene", scene: LegacyQuizScene },
  { key: "RhythmScene", scene: LegacyRhythmScene },
  { key: "InterviewScene", scene: LegacyInterviewScene },
  { key: "RunnerScene", scene: LegacyRunnerScene },
  { key: "TankScene", scene: LegacyTankScene },
  { key: "TypingScene", scene: LegacyTypingScene },
  { key: "BusinessSmileScene", scene: LegacyBusinessSmileScene },
  { key: "DontSmileScene", scene: LegacyDontSmileScene },
  { key: "GymScene", scene: LegacyGymScene },
  { key: "CookingScene", scene: LegacyCookingScene },
  { key: "LottoScene", scene: LegacyLottoScene },
  { key: "DrinkingScene", scene: LegacyDrinkingScene },
  { key: "MiniGameCenterScene", scene: MiniGameCenterScene },
  { key: "MiniGameReflexScene", scene: MiniGameReflexScene }
];

function findMissingKeys(requiredKeys: Iterable<string>, registeredKeySet: Set<string>): string[] {
  return [...requiredKeys].filter((key) => !registeredKeySet.has(key)).sort();
}

function findDuplicateKeys(keys: readonly string[]): string[] {
  const seen = new Set<string>();
  const duplicates = new Set<string>();

  keys.forEach((key) => {
    if (seen.has(key)) {
      duplicates.add(key);
      return;
    }

    seen.add(key);
  });

  return [...duplicates].sort();
}

export function assertSceneRegistryIntegrity(): void {
  assertMinigameSceneKeyIntegrity();
  assertMinigameCatalogIntegrity(LEGACY_MINIGAME_CARDS);

  const coreSceneKeys = [SCENE_KEYS.boot, SCENE_KEYS.preload, SCENE_KEYS.main] as const;
  const registeredKeys = SCENE_REGISTRY_ENTRIES.map((entry) => entry.key);
  const registeredKeySet = new Set(registeredKeys);
  const registeredMinigameKeys = registeredKeys.filter((key) => !coreSceneKeys.includes(key as (typeof coreSceneKeys)[number]));
  const registeredMinigameKeySet = new Set(registeredMinigameKeys);
  const supportedMinigameKeySet = new Set(SUPPORTED_MINIGAME_SCENE_KEYS);
  const cardKeys = new Set(LEGACY_MINIGAME_CARDS.map((card) => card.key));
  const issues: string[] = [];

  const duplicateKeys = findDuplicateKeys(registeredKeys);
  if (duplicateKeys.length > 0) {
    issues.push(`[sceneRegistry] 중복 scene key: ${duplicateKeys.join(", ")}`);
  }

  const missingCoreKeys = findMissingKeys(coreSceneKeys, registeredKeySet);
  if (missingCoreKeys.length > 0) {
    issues.push(`[sceneRegistry] 핵심 scene key 누락: ${missingCoreKeys.join(", ")}`);
  }

  const missingFlowKeys = findMissingKeys(LEGACY_MINIGAME_FLOW_SCENE_KEYS, registeredKeySet);
  if (missingFlowKeys.length > 0) {
    issues.push(`[sceneRegistry] 미니게임 flow scene key 누락: ${missingFlowKeys.join(", ")}`);
  }

  const missingSupportedRegistryKeys = findMissingKeys(SUPPORTED_MINIGAME_SCENE_KEYS, registeredMinigameKeySet);
  if (missingSupportedRegistryKeys.length > 0) {
    issues.push(`[sceneRegistry] 지원 대상 미니게임 scene key가 registry에 누락되었습니다: ${missingSupportedRegistryKeys.join(", ")}`);
  }

  const unexpectedRegisteredMinigameKeys = findMissingKeys(registeredMinigameKeys, supportedMinigameKeySet);
  if (unexpectedRegisteredMinigameKeys.length > 0) {
    issues.push(`[sceneRegistry] 지원 목록에 없는 scene key가 registry에 등록되었습니다: ${unexpectedRegisteredMinigameKeys.join(", ")}`);
  }

  const missingCatalogKeys = findMissingKeys(cardKeys, registeredKeySet);
  if (missingCatalogKeys.length > 0) {
    issues.push(`[sceneRegistry] 미니게임 catalog key 누락: ${missingCatalogKeys.join(", ")}`);
  }

  const deprecatedRegisteredKeys = registeredMinigameKeys.filter((key) => isDeprecatedMinigameSceneKey(key)).sort();
  if (deprecatedRegisteredKeys.length > 0) {
    issues.push(`[sceneRegistry] 제거된 미니게임 scene key가 registry에 남아 있습니다: ${deprecatedRegisteredKeys.join(", ")}`);
  }

  const uncataloguedLegacyKeys = findMissingKeys(LEGACY_MINIGAME_SCENE_KEYS, cardKeys);
  if (uncataloguedLegacyKeys.length > 0) {
    issues.push(`[sceneRegistry] catalog에 없는 legacy scene key: ${uncataloguedLegacyKeys.join(", ")}`);
  }

  if (issues.length > 0) {
    throw new Error(issues.join("\n"));
  }
}

assertSceneRegistryIntegrity();

export const SCENE_REGISTRY = SCENE_REGISTRY_ENTRIES.map((entry) => entry.scene);
