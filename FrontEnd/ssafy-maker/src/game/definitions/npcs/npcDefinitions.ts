import type { Facing } from "../../../common/enums/facing";
import type { NpcId } from "../../../common/enums/npc";
import type { NpcVisualAssetId } from "../assets/npcAssetCatalog";

export type NpcDefinition = {
  id: NpcId;
  label: string;
  visualAssetId: NpcVisualAssetId;
  defaultFacing: Facing;
  moveSpeed: number;
  /** emotion.png 기본 프레임: 0=미소 1=? 2=! 3=❤️ 4=💧 5=💬 6=zzz 7=⭐ 8=😊 9=~~ */
  defaultEmotionFrame: number;
};

export const NPC_DEFINITIONS: Record<NpcId, NpcDefinition> = {
  minsu: {
    id: "minsu",
    label: "민수",
    visualAssetId: "minsu",
    defaultFacing: "down",
    moveSpeed: 140,
    defaultEmotionFrame: 2  // ! (직설적)
  },
  hyewon: {
    id: "hyewon",
    label: "혜원",
    visualAssetId: "hyewon",
    defaultFacing: "down",
    moveSpeed: 140,
    defaultEmotionFrame: 3  // ❤️ (따뜻함)
  },
  hyunseok: {
    id: "hyunseok",
    label: "현석",
    visualAssetId: "hyunseok",
    defaultFacing: "down",
    moveSpeed: 140,
    defaultEmotionFrame: 5  // 💬 (컨설팅, 소통)
  },
  hyoryeon: {
    id: "hyoryeon",
    label: "효련",
    visualAssetId: "hyoryeon",
    defaultFacing: "down",
    moveSpeed: 140,
    defaultEmotionFrame: 0  // 미소 (차분)
  },
  jiwoo: {
    id: "jiwoo",
    label: "지우",
    visualAssetId: "jiwoo",
    defaultFacing: "down",
    moveSpeed: 140,
    defaultEmotionFrame: 1  // ? (호기심, 협업 소통)
  },
  jongmin: {
    id: "jongmin",
    label: "종민",
    visualAssetId: "jongmin",
    defaultFacing: "down",
    moveSpeed: 140,
    defaultEmotionFrame: 9  // ~~ (노력, 땀)
  },
  myungjin: {
    id: "myungjin",
    label: "명진",
    visualAssetId: "myungjin",
    defaultFacing: "down",
    moveSpeed: 140,
    defaultEmotionFrame: 8  // 😊 (차분하게 웃음)
  },
  yeonwoong: {
    id: "yeonwoong",
    label: "연웅",
    visualAssetId: "yeonwoong",
    defaultFacing: "down",
    moveSpeed: 140,
    defaultEmotionFrame: 6  // zzz (바쁨, 피곤)
  },
  doyeon: {
    id: "doyeon",
    label: "김도연 프로",
    visualAssetId: "doyeon",
    defaultFacing: "down",
    moveSpeed: 140,
    defaultEmotionFrame: 3  // ❤️ (화이팅! 긍정적)
  },
  sunmi: {
    id: "sunmi",
    label: "조선미 프로",
    visualAssetId: "sunmi",
    defaultFacing: "down",
    moveSpeed: 140,
    defaultEmotionFrame: 4  // 💧 (허거덩, 놀람)
  },
  minseok: {
    id: "minseok",
    label: "민석",
    visualAssetId: "minseok",
    defaultFacing: "down",
    moveSpeed: 140,
    defaultEmotionFrame: 7  // ⭐ (성취)
  }
};
