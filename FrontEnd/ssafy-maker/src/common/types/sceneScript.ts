import type { AreaId } from "../enums/area";
import type { SceneAction } from "./sceneAction";
import type { SceneStateId } from "../../game/definitions/sceneStates/sceneStateIds";

export type SceneScript = {
  id: string;
  area: AreaId;
  initialStateId?: SceneStateId;
  actions: SceneAction[];
};
