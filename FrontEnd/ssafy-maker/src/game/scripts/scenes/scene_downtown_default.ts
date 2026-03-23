// 번화가 기본 탐험 씬은 맵과 이동만 먼저 검증한다.
import type { SceneScript } from "../../../common/types/sceneScript";
import { SCENE_STATE_IDS } from "../../definitions/sceneStates/sceneStateIds";
import { SCENE_IDS } from "./sceneIds";

export const SCENE_DOWNTOWN_DEFAULT: SceneScript = {
  id: SCENE_IDS.downtownDefault,
  area: "downtown",
  initialStateId: SCENE_STATE_IDS.downtownDefault,
  actions: []
};
