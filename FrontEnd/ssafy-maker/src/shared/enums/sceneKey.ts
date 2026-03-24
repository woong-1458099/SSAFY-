import { SCENE_KEYS } from "../../common/enums/scene";
import {
  EXPERIMENTAL_MINIGAME_CENTER_SCENE_KEY
  // LEGACY_TYPING_SCENE_KEY // 타이핑 게임 비활성화
} from "../../features/minigame/minigameSceneKeys";

export const SceneKey = {
  Boot: SCENE_KEYS.boot,
  Preload: SCENE_KEYS.preload,
  Login: SCENE_KEYS.login,
  Start: SCENE_KEYS.start,
  Intro: SCENE_KEYS.intro,
  NewCharacter: SCENE_KEYS.newCharacter,
  Main: SCENE_KEYS.main,
  Completion: SCENE_KEYS.completion,
  FinalSummary: SCENE_KEYS.finalSummary,
  EndingIntro: SCENE_KEYS.endingIntro,
  EndingComic: SCENE_KEYS.endingComic,
  MiniGameCenter: EXPERIMENTAL_MINIGAME_CENTER_SCENE_KEY
  // MiniGameTyping: LEGACY_TYPING_SCENE_KEY // 타이핑 게임 비활성화
} as const;

export type SceneKey = (typeof SceneKey)[keyof typeof SceneKey];
