// 씬 상태 번들 식별자를 한 곳에서 관리한다.
export const SCENE_STATE_IDS = {
  worldDefault: "world_default",
  downtownDefault: "downtown_default",
  campusDefault: "campus_default",
  classroomDefault: "classroom_default"
} as const;

export const LEGACY_SCENE_STATE_ID_ALIASES = {
  scene_world_default: SCENE_STATE_IDS.worldDefault,
  scene_downtown_default: SCENE_STATE_IDS.downtownDefault,
  scene_campus_default: SCENE_STATE_IDS.campusDefault,
  scene_classroom_default: SCENE_STATE_IDS.classroomDefault
} as const;

export type SceneStateId = (typeof SCENE_STATE_IDS)[keyof typeof SCENE_STATE_IDS];

const SCENE_STATE_ID_SET = new Set<string>(Object.values(SCENE_STATE_IDS));
const LEGACY_SCENE_STATE_ID_ALIAS_MAP = new Map<string, SceneStateId>(Object.entries(LEGACY_SCENE_STATE_ID_ALIASES));

export function isSceneStateId(value: string): value is SceneStateId {
  return SCENE_STATE_ID_SET.has(value);
}

export function resolveSceneStateId(value: string): SceneStateId | undefined {
  const normalized = value.trim();
  if (SCENE_STATE_ID_SET.has(normalized)) {
    return normalized as SceneStateId;
  }

  return LEGACY_SCENE_STATE_ID_ALIAS_MAP.get(normalized);
}
