import Phaser from "phaser";
import { SCENE_KEYS } from "../../common/enums/scene";
import {
  assertMinigameCatalogIntegrity,
  LEGACY_MINIGAME_CARDS
} from "../../features/minigame/minigameCatalog";
import {
  assertMinigameSceneKeyIntegrity,
  DEPRECATED_MINIGAME_SCENE_KEYS,
  EXPERIMENTAL_MINIGAME_CENTER_SCENE_KEY,
  LEGACY_BUSINESS_SMILE_SCENE_KEY,
  LEGACY_COOKING_SCENE_KEY,
  LEGACY_DONT_SMILE_SCENE_KEY,
  LEGACY_DRINKING_SCENE_KEY,
  LEGACY_GYM_SCENE_KEY,
  LEGACY_INTERVIEW_SCENE_KEY,
  LEGACY_MINIGAME_FLOW_SCENE_KEYS,
  LEGACY_MINIGAME_MENU_SCENE_KEY,
  LEGACY_MINIGAME_PAUSE_SCENE_KEY,
  LEGACY_MINIGAME_SCENE_KEYS,
  LEGACY_LOTTO_SCENE_KEY,
  LEGACY_QUIZ_SCENE_KEY,
  LEGACY_RHYTHM_SCENE_KEY,
  LEGACY_RUNNER_SCENE_KEY,
  LEGACY_TANK_SCENE_KEY,
  LEGACY_TYPING_SCENE_KEY,
  isDeprecatedMinigameSceneKey,
  SUPPORTED_MINIGAME_SCENE_KEYS
} from "../../features/minigame/minigameSceneKeys";
import { BootScene } from "../../game/scenes/BootScene";
import { PreloadScene } from "../../game/scenes/PreloadScene";
import { MainScene } from "../../game/scenes/MainScene";
import { LoginScene } from "../../scenes/LoginScene";
import { StartScene } from "../../scenes/StartScene";
import { IntroScene } from "../../scenes/IntroScene";
import { NewCharacterScene } from "../../scenes/NewCharacterScene";
import { CompletionScene } from "../../scenes/CompletionScene";
import { FinalSummaryScene } from "../../scenes/FinalSummaryScene";
import { EndingIntroScene } from "../../scenes/EndingIntroScene";
import { EndingComicScene } from "../../scenes/EndingComicScene";
import { MiniGameCenterScene } from "../../game/scenes/minigames/MiniGameCenterScene";
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
  { key: SCENE_KEYS.login, scene: LoginScene },
  { key: SCENE_KEYS.start, scene: StartScene },
  { key: SCENE_KEYS.intro, scene: IntroScene },
  { key: SCENE_KEYS.newCharacter, scene: NewCharacterScene },
  { key: SCENE_KEYS.main, scene: MainScene },
  { key: SCENE_KEYS.completion, scene: CompletionScene },
  { key: SCENE_KEYS.finalSummary, scene: FinalSummaryScene },
  { key: SCENE_KEYS.endingIntro, scene: EndingIntroScene },
  { key: SCENE_KEYS.endingComic, scene: EndingComicScene },
  { key: LEGACY_MINIGAME_MENU_SCENE_KEY, scene: LegacyMenuScene },
  { key: LEGACY_MINIGAME_PAUSE_SCENE_KEY, scene: LegacyMinigamePauseScene },
  { key: LEGACY_QUIZ_SCENE_KEY, scene: LegacyQuizScene },
  { key: LEGACY_RHYTHM_SCENE_KEY, scene: LegacyRhythmScene },
  { key: LEGACY_INTERVIEW_SCENE_KEY, scene: LegacyInterviewScene },
  { key: LEGACY_RUNNER_SCENE_KEY, scene: LegacyRunnerScene },
  { key: LEGACY_TANK_SCENE_KEY, scene: LegacyTankScene },
  { key: LEGACY_TYPING_SCENE_KEY, scene: LegacyTypingScene },
  { key: LEGACY_BUSINESS_SMILE_SCENE_KEY, scene: LegacyBusinessSmileScene },
  { key: LEGACY_DONT_SMILE_SCENE_KEY, scene: LegacyDontSmileScene },
  { key: LEGACY_GYM_SCENE_KEY, scene: LegacyGymScene },
  { key: LEGACY_COOKING_SCENE_KEY, scene: LegacyCookingScene },
  { key: LEGACY_LOTTO_SCENE_KEY, scene: LegacyLottoScene },
  { key: LEGACY_DRINKING_SCENE_KEY, scene: LegacyDrinkingScene },
  { key: EXPERIMENTAL_MINIGAME_CENTER_SCENE_KEY, scene: MiniGameCenterScene }
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

function resolveDeclaredSceneKey(sceneCtor: SceneConstructor): string {
  const instance = new sceneCtor();
  const declaredKey =
    ((instance as Phaser.Scene & { sys?: { settings?: { key?: unknown } } }).sys?.settings?.key as string | undefined) ??
    instance.scene.key;

  if (typeof declaredKey !== "string" || declaredKey.trim().length === 0) {
    throw new Error(`[sceneRegistry] ${sceneCtor.name} declared an empty scene key.`);
  }

  return declaredKey.trim();
}

export function assertSceneRegistryIntegrity(): void {
  assertMinigameSceneKeyIntegrity();
  assertMinigameCatalogIntegrity(LEGACY_MINIGAME_CARDS);

  const coreSceneKeys = [
    SCENE_KEYS.boot,
    SCENE_KEYS.preload,
    SCENE_KEYS.login,
    SCENE_KEYS.start,
    SCENE_KEYS.intro,
    SCENE_KEYS.newCharacter,
    SCENE_KEYS.main,
    SCENE_KEYS.completion,
    SCENE_KEYS.finalSummary,
    SCENE_KEYS.endingIntro,
    SCENE_KEYS.endingComic
  ] as const;
  const registeredKeys = SCENE_REGISTRY_ENTRIES.map((entry) => entry.key);
  const declaredKeysByScene = SCENE_REGISTRY_ENTRIES.map((entry) => ({
    registryKey: entry.key,
    declaredKey: resolveDeclaredSceneKey(entry.scene),
    sceneName: entry.scene.name
  }));
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

  const duplicateDeclaredKeys = findDuplicateKeys(declaredKeysByScene.map((entry) => entry.declaredKey));
  if (duplicateDeclaredKeys.length > 0) {
    issues.push(`[sceneRegistry] Scene class 내부 declared key 중복: ${duplicateDeclaredKeys.join(", ")}`);
  }

  const sceneKeyMismatches = declaredKeysByScene
    .filter((entry) => entry.registryKey !== entry.declaredKey)
    .map((entry) => `${entry.sceneName}: registry=${entry.registryKey}, declared=${entry.declaredKey}`);
  if (sceneKeyMismatches.length > 0) {
    issues.push(`[sceneRegistry] registry key와 Scene class key 불일치: ${sceneKeyMismatches.join(" | ")}`);
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

export const SCENE_REGISTRY = (() => {
  assertSceneRegistryIntegrity();

  if (import.meta.env.DEV) {
    console.info("[sceneRegistry] registered scene keys:", SCENE_REGISTRY_ENTRIES.map((entry) => entry.key).join(", "));
  }

  return SCENE_REGISTRY_ENTRIES.map((entry) => entry.scene);
})();
