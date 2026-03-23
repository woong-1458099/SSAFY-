import type { Facing } from "../../../common/enums/facing";
import type { NpcId } from "../../../common/enums/npc";
import type { NpcVisualAssetId } from "../assets/npcAssetCatalog";

export type NpcDefinition = {
  id: NpcId;
  label: string;
  visualAssetId: NpcVisualAssetId;
  defaultFacing: Facing;
  moveSpeed: number;
};

export const NPC_DEFINITIONS: Record<NpcId, NpcDefinition> = {
  minsu: {
    id: "minsu",
    label: "민수",
    visualAssetId: "minsu",
    defaultFacing: "down",
    moveSpeed: 140
  },
  hyewon: {
    id: "hyewon",
    label: "혜원",
    // 논리 NPC도 실제 에셋 roster 기준 이름으로 맞춘다.
    visualAssetId: "hyewon",
    defaultFacing: "down",
    moveSpeed: 140
  },
  hyunseok: {
    id: "hyunseok",
    label: "현석",
    // 논리 NPC도 실제 에셋 roster 기준 이름으로 맞춘다.
    visualAssetId: "hyunseok",
    defaultFacing: "down",
    moveSpeed: 140
  },
  hyoryeon: {
    id: "hyoryeon",
    label: "효련",
    visualAssetId: "hyoryeon",
    defaultFacing: "down",
    moveSpeed: 140
  },
  jiwoo: {
    id: "jiwoo",
    label: "지우",
    visualAssetId: "jiwoo",
    defaultFacing: "down",
    moveSpeed: 140
  },
  jongmin: {
    id: "jongmin",
    label: "종민",
    visualAssetId: "jongmin",
    defaultFacing: "down",
    moveSpeed: 140
  },
  myungjin: {
    id: "myungjin",
    label: "명진",
    visualAssetId: "myungjin",
    defaultFacing: "down",
    moveSpeed: 140
  },
  yeonwoong: {
    id: "yeonwoong",
    label: "연웅",
    visualAssetId: "yeonwoong",
    defaultFacing: "down",
    moveSpeed: 140
  },
  doyeon: {
    id: "doyeon",
    label: "김도연 프로",
    visualAssetId: "doyeon",
    defaultFacing: "down",
    moveSpeed: 140
  },
  sunmi: {
    id: "sunmi",
    label: "조선미 프로",
    visualAssetId: "sunmi",
    defaultFacing: "down",
    moveSpeed: 140
  },
  minseok: {
    id: "minseok",
    label: "민석",
    visualAssetId: "minseok",
    defaultFacing: "down",
    moveSpeed: 140
  }
};
