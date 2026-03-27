// 캠퍼스 기본 탐험 씬은 기본 상태만 먼저 올리고 액션은 비운다.
import type { SceneScript } from "../../../common/types/sceneScript";
import { SCENE_STATE_IDS } from "../../definitions/sceneStates/sceneStateIds";
import { SCENE_IDS } from "./sceneIds";

export const SCENE_CAMPUS_DEFAULT: SceneScript = {
  id: SCENE_IDS.campusDefault,
  area: "campus",
  initialStateId: SCENE_STATE_IDS.campusDefault,
  actions: []
};
