import type { AreaId } from "../enums/area";
import type { Facing } from "../enums/facing";
import type { NpcId } from "../enums/npc";
import type { DialogueScriptId } from "./dialogue";
import type { SceneStateId } from "../../game/definitions/sceneStates/sceneStateIds";

export type SceneStateNpc = {
  npcId: NpcId;
  x: number;
  y: number;
  facing?: Facing;
  dialogueId: DialogueScriptId;
};

export type SceneState = {
  id: SceneStateId;
  area: AreaId;
  npcs: SceneStateNpc[];
};
