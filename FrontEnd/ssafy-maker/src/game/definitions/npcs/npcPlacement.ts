// NPC가 특정 지역에 어떻게 배치되는지 표현하는 배치 타입 정의
import type { AreaId } from "../../../common/enums/area";
import type { DialogueId } from "../../../common/enums/dialogue";
import type { Facing } from "../../../common/enums/facing";
import type { NpcId } from "../../../common/enums/npc";

export type NpcPlacement = {
  npcId: NpcId;
  areaId: AreaId;
  x: number;
  y: number;
  facing?: Facing;
  dialogueId: DialogueId;
};
