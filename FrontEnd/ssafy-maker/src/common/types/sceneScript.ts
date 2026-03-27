import type { AreaId } from "../enums/area";
import type { SceneAction } from "./sceneAction";
import type { SceneStateId } from "../../game/definitions/sceneStates/sceneStateIds";
import type { SceneId } from "../../game/scripts/scenes/sceneIds";

export type SceneScript = {
  id: SceneId;
  area: AreaId;
  initialStateId?: SceneStateId;
  actions: SceneAction[];
};
