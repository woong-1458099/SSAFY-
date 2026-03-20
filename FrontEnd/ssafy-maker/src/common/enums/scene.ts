export const SCENE_KEYS = {
  boot: "boot",
  preload: "preload",
  main: "main"
} as const;

export type SceneKey = (typeof SCENE_KEYS)[keyof typeof SCENE_KEYS];
