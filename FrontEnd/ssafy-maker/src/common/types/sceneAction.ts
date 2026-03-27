import type { Facing } from "../enums/facing";
import type { NpcId } from "../enums/npc";

export type SpawnNpcAction = {
  type: "spawnNpc";
  npcId: NpcId;
  x: number;
  y: number;
  facing?: Facing;
};

export type MoveNpcAction = {
  type: "moveNpc";
  npcId: NpcId;
  toX: number;
  toY: number;
  duration: number;
};

export type TurnNpcAction = {
  type: "turnNpc";
  npcId: NpcId;
  facing: Facing;
};

export type PlayDialogueAction = {
  type: "playDialogue";
  dialogueId: string;
};

export type WaitAction = {
  type: "wait";
  duration: number;
};

export type SceneAction =
  | SpawnNpcAction
  | MoveNpcAction
  | TurnNpcAction
  | PlayDialogueAction
  | WaitAction;
