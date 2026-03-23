export const SCENE_KEYS = {
  boot: "boot",
  preload: "preload",
  login: "login",
  start: "start",
  intro: "intro",
  newCharacter: "newCharacter",
  main: "main",
  completion: "completion",
  finalSummary: "finalSummary",
  endingIntro: "endingIntro",
  endingComic: "endingComic"
} as const;

export type SceneKey = (typeof SCENE_KEYS)[keyof typeof SCENE_KEYS];
