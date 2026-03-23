import { SCENE_KEYS } from "../../common/enums/scene";

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
  MiniGameCenter: "MiniGameCenterScene",
  MiniGameTyping: "TypingScene",
  MiniGameReflex: "MiniGameReflexScene"
} as const;

export type SceneKey = (typeof SceneKey)[keyof typeof SceneKey];
