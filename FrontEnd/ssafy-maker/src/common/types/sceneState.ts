import type { AreaId } from "../enums/area";
import type { DialogueId } from "../enums/dialogue";
import type { Facing } from "../enums/facing";
import type { NpcId } from "../enums/npc";
import type { SceneStateId } from "../../game/definitions/sceneStates/sceneStateIds";

export type SceneStateNpc = {
  npcId: NpcId;
  x: number;
  y: number;
  facing?: Facing;
  dialogueId: DialogueId;
};

export type SceneState = {
  id: SceneStateId;
  area: AreaId;
  npcs: SceneStateNpc[];
};
