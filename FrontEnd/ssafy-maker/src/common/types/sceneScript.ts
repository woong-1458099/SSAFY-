import type { AreaId } from "../enums/area";
import type { SceneAction } from "./sceneAction";

export type SceneScript = {
  id: string;
  area: AreaId;
  initialStateId?: string;
  actions: SceneAction[];
};
