// 씬이 재사용할 기본 상태 번들을 한 곳에서 조회한다.
import type { SceneState } from "../../../common/types/sceneState";
import type { SceneStateId } from "./sceneStateIds";
import { CAMPUS_DEFAULT_SCENE_STATE } from "./campusDefaultSceneState";
import { DOWNTOWN_DEFAULT_SCENE_STATE } from "./downtownDefaultSceneState";
import { WORLD_DEFAULT_SCENE_STATE } from "./worldDefaultSceneState";

export const SCENE_STATE_REGISTRY: Record<SceneStateId, SceneState> = {
  [WORLD_DEFAULT_SCENE_STATE.id]: WORLD_DEFAULT_SCENE_STATE,
  [DOWNTOWN_DEFAULT_SCENE_STATE.id]: DOWNTOWN_DEFAULT_SCENE_STATE,
  [CAMPUS_DEFAULT_SCENE_STATE.id]: CAMPUS_DEFAULT_SCENE_STATE
};

export function getSceneState(sceneStateId?: SceneStateId) {
  if (!sceneStateId) {
    return undefined;
  }

  return SCENE_STATE_REGISTRY[sceneStateId];
}
