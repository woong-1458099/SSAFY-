// 씬이 재사용할 기본 상태 번들을 한 곳에서 조회한다.
import type { SceneState } from "../../../common/types/sceneState";
import { CAMPUS_DEFAULT_SCENE_STATE } from "./campusDefaultSceneState";

export const SCENE_STATE_REGISTRY: Record<string, SceneState> = {
  [CAMPUS_DEFAULT_SCENE_STATE.id]: CAMPUS_DEFAULT_SCENE_STATE
};

export function getSceneState(sceneStateId?: string) {
  if (!sceneStateId) {
    return undefined;
  }

  return SCENE_STATE_REGISTRY[sceneStateId];
}
