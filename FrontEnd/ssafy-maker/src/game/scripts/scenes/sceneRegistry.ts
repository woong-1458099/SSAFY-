// 씬 스크립트를 id 기준으로 모아두는 중앙 레지스트리다.
import type { SceneScript } from "../../../common/types/sceneScript";
import type { AreaId } from "../../../common/enums/area";
import type { SceneId } from "./sceneIds";
import { SCENE_CAMPUS_DEFAULT } from "./scene_campus_default";
import { SCENE_DOWNTOWN_DEFAULT } from "./scene_downtown_default";
import { SCENE_WORLD_DEFAULT } from "./scene_world_default";
import { SCENE_001 } from "./scene_001";

export const DEFAULT_START_SCENE_ID: SceneId = SCENE_WORLD_DEFAULT.id;

export const SCENE_REGISTRY: Record<SceneId, SceneScript> = {
  [SCENE_WORLD_DEFAULT.id]: SCENE_WORLD_DEFAULT,
  [SCENE_DOWNTOWN_DEFAULT.id]: SCENE_DOWNTOWN_DEFAULT,
  [SCENE_CAMPUS_DEFAULT.id]: SCENE_CAMPUS_DEFAULT,
  [SCENE_001.id]: SCENE_001
};

export function getSceneScript(sceneId: SceneId) {
  return SCENE_REGISTRY[sceneId];
}

export function getDefaultSceneIdForArea(areaId: AreaId): SceneId {
  switch (areaId) {
    case "world":
      return SCENE_WORLD_DEFAULT.id;
    case "downtown":
      return SCENE_DOWNTOWN_DEFAULT.id;
    case "campus":
      return SCENE_CAMPUS_DEFAULT.id;
  }
}
