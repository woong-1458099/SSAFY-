// 씬 스크립트 식별자를 한 곳에서 관리한다.
export const SCENE_IDS = {
  worldDefault: "scene_world_default",
  downtownDefault: "scene_downtown_default",
  campusDefault: "scene_campus_default",
  campusSample: "scene_001"
} as const;

export type SceneId = (typeof SCENE_IDS)[keyof typeof SCENE_IDS];
