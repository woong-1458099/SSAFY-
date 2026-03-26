import type { SceneScript } from "../../../common/types/sceneScript";
import { SCENE_STATE_IDS } from "../../definitions/sceneStates/sceneStateIds";
import { SCENE_IDS } from "./sceneIds";

export const SCENE_CLASSROOM_DEFAULT: SceneScript = {
  id: SCENE_IDS.classroomDefault,
  area: "classroom",
  initialStateId: SCENE_STATE_IDS.classroomDefault,
  actions: []
};
