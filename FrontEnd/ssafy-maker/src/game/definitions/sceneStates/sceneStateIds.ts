// 씬 상태 번들 식별자를 한 곳에서 관리한다.
export const SCENE_STATE_IDS = {
  worldDefault: "world_default",
  downtownDefault: "downtown_default",
  campusDefault: "campus_default"
} as const;

export type SceneStateId = (typeof SCENE_STATE_IDS)[keyof typeof SCENE_STATE_IDS];

const SCENE_STATE_ID_SET = new Set<string>(Object.values(SCENE_STATE_IDS));

export function isSceneStateId(value: string): value is SceneStateId {
  return SCENE_STATE_ID_SET.has(value);
}
