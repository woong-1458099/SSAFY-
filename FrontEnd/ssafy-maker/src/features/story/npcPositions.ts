import type { AreaId } from "@features/main-scene/areas/areaSceneConfig";
import type { NpcDialogueId } from "@features/story/npcDialogueScripts";

export type AreaNpcConfig = {
  dialogueId: NpcDialogueId;
  x: number;
  y: number;
  labelOffsetX: number;
  labelOffsetY: number;
  flashColor: number;
  textureKey?: string;
};

export type AreaNpcLabelLayout = {
  x: number;
  y: number;
  originX: number;
  originY: number;
  color: string;
};

export const FIXED_AREA_NPC_LABEL_COLOR = "#000000";
const DEFAULT_AREA_NPC_LABEL_COLOR = "#f6e6c8";
const CENTERED_AREA_NPC_LABEL_OFFSET_Y = 34;

export const AREA_NPC_CONFIGS: Record<AreaId, AreaNpcConfig[]> = {
  world: [
    // 효련 - 카페 근처
    { dialogueId: "npc_hyoryeon", x: 325, y: 480, labelOffsetX: -24, labelOffsetY: 24, flashColor: 0x3f6e90, textureKey: "fixed-npc-hyoryeon" },
    // 지우 - 집 근처
    { dialogueId: "npc_jiwoo", x: 650, y: 600, labelOffsetX: -24, labelOffsetY: 24, flashColor: 0x3f6e90, textureKey: "fixed-npc-jiwoo" },
    // 종민 - 편의점 근처
    { dialogueId: "npc_jongmin", x: 1120, y: 480, labelOffsetX: -24, labelOffsetY: 24, flashColor: 0x3f6e90, textureKey: "fixed-npc-jongmin" }
  ],
  downtown: [
    // 연웅 - 헬스장 옆
    {
      dialogueId: "npc_yeonwoong",
      x: 380,
      y: 300,
      labelOffsetX: -24,
      labelOffsetY: 24,
      flashColor: 0x3f6e90,
      textureKey: "fixed-npc-yeonwoong"
    },
    // 민수 - 라멘빔스 옆
    {
      dialogueId: "npc_minsu",
      x: 590,
      y: 290,
      labelOffsetX: -24,
      labelOffsetY: 24,
      flashColor: 0x3f6e90,
      textureKey: "fixed-npc-minsu"
    },
    // 명진 - 복권방 앞
    {
      dialogueId: "npc_myungjin",
      x: 696,
      y: 520,
      labelOffsetX: -24,
      labelOffsetY: 24,
      flashColor: 0x3f6e90,
      textureKey: "fixed-npc-myungjin"
    }
  ],
  campus: [
    // 문 앞 (좌측)
    { dialogueId: "campus_sunmi", x: 200, y: 430, labelOffsetX: -36, labelOffsetY: 30, flashColor: 0x3f6e90, textureKey: "fixed-npc-sunmi" },
    // 중앙 (칠판 앞)
    { dialogueId: "campus_doyeon", x: 270, y: 430, labelOffsetX: -36, labelOffsetY: 30, flashColor: 0x3f6e90, textureKey: "fixed-npc-doyeon" },
    // 의자 옆 (우측)
    { dialogueId: "campus_hyunseok", x: 520, y: 430, labelOffsetX: -40, labelOffsetY: 30, flashColor: 0x3f6e90, textureKey: "fixed-npc-hyunseok" }
  ]
};

export function getAreaNpcLabelLayout(area: AreaId, config: AreaNpcConfig): AreaNpcLabelLayout {
  return {
    x: config.x,
    y: config.y + CENTERED_AREA_NPC_LABEL_OFFSET_Y,
    originX: 0.5,
    originY: 0,
    color: area !== "downtown" ? FIXED_AREA_NPC_LABEL_COLOR : DEFAULT_AREA_NPC_LABEL_COLOR,
  };
}
