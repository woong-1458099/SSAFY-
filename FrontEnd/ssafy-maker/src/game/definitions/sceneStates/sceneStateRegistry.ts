// 씬이 재사용할 기본 상태 번들을 한 곳에서 조회한다.
import type { SceneState } from "../../../common/types/sceneState";
import type { SceneStateId } from "./sceneStateIds";
import { SCENE_STATE_IDS } from "./sceneStateIds";

export const SCENE_STATE_REGISTRY: Record<SceneStateId, SceneState> = {
  [SCENE_STATE_IDS.worldDefault]: {
    id: SCENE_STATE_IDS.worldDefault,
    area: "world",
    npcs: []
  },
  [SCENE_STATE_IDS.downtownDefault]: {
    id: SCENE_STATE_IDS.downtownDefault,
    area: "downtown",
    npcs: []
  },
  [SCENE_STATE_IDS.campusDefault]: {
    id: SCENE_STATE_IDS.campusDefault,
    area: "campus",
    npcs: []
  }
};

export function setSceneStateRegistry(sceneStates: Record<SceneStateId, SceneState>): void {
  (Object.keys(SCENE_STATE_REGISTRY) as SceneStateId[]).forEach((sceneStateId) => {
    SCENE_STATE_REGISTRY[sceneStateId] = sceneStates[sceneStateId];
  });
}

export function getSceneState(sceneStateId?: SceneStateId) {
  if (!sceneStateId) {
    return undefined;
  }

  return SCENE_STATE_REGISTRY[sceneStateId];
}
