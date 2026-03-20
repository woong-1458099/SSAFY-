import { ASSET_KEYS } from "../../../common/assets/assetKeys";
import type { Facing } from "../../../common/enums/facing";
import type { NpcId } from "../../../common/enums/npc";

export type NpcDefinition = {
  id: NpcId;
  label: string;
  textureKey: string;
  defaultFacing: Facing;
  moveSpeed: number;
};

export const NPC_DEFINITIONS: Record<NpcId, NpcDefinition> = {
  minsu: { id: "minsu", label: "민수", textureKey: ASSET_KEYS.npc.minsu, defaultFacing: "right", moveSpeed: 140 },
  yuna: { id: "yuna", label: "유나", textureKey: ASSET_KEYS.npc.yuna, defaultFacing: "left", moveSpeed: 140 },
  guide: { id: "guide", label: "가이드", textureKey: ASSET_KEYS.npc.guide, defaultFacing: "down", moveSpeed: 140 }
};
