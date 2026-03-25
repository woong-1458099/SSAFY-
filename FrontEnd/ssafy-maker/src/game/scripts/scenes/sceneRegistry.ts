// 씬 스크립트를 id 기준으로 모아두는 중앙 레지스트리다.
import type { SceneScript } from "../../../common/types/sceneScript";
import type { AreaId } from "../../../common/enums/area";
import type { SceneId } from "./sceneIds";
import { SCENE_IDS } from "./sceneIds";
import { SCENE_CAMPUS_DEFAULT } from "./scene_campus_default";
import { SCENE_CLASSROOM_DEFAULT } from "./scene_classroom_default";
import { SCENE_DOWNTOWN_DEFAULT } from "./scene_downtown_default";
import { SCENE_WORLD_DEFAULT } from "./scene_world_default";
import { SCENE_001 } from "./scene_001";

export const DEFAULT_START_SCENE_ID: SceneId = SCENE_IDS.worldDefault;

export const SCENE_REGISTRY = {
  [SCENE_IDS.worldDefault]: SCENE_WORLD_DEFAULT,
  [SCENE_IDS.downtownDefault]: SCENE_DOWNTOWN_DEFAULT,
  [SCENE_IDS.campusDefault]: SCENE_CAMPUS_DEFAULT,
  [SCENE_IDS.classroomDefault]: SCENE_CLASSROOM_DEFAULT,
  [SCENE_IDS.campusSample]: SCENE_001
} satisfies Record<SceneId, SceneScript>;

export function getSceneScript(sceneId: SceneId) {
  return SCENE_REGISTRY[sceneId];
}

export function getDefaultSceneIdForArea(areaId: AreaId): SceneId {
  switch (areaId) {
    case "world":
      return SCENE_IDS.worldDefault;
    case "downtown":
      return SCENE_IDS.downtownDefault;
    case "campus":
      return SCENE_IDS.campusDefault;
    case "classroom":
      return SCENE_IDS.classroomDefault;
  }
}
