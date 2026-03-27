import {
  getNpcIdleAnimationKey,
  getNpcIdleTextureKey,
  getNpcWalkTextureKey
} from "../../../common/assets/assetKeys";
import type { Facing } from "../../../common/enums/facing";

// 현재 NPC 에셋은 16x32 단위 프레임으로 idle 4장, walk 13장을 사용한다.
export const NPC_SPRITE_FRAME = {
  width: 16,
  height: 32
} as const;

export const NPC_IDLE_FRAME_RANGE = {
  start: 0,
  end: 3
} as const;

export const NPC_WALK_FRAME_RANGES: Record<Facing, { start: number; end: number }> = {
  right: { start: 0, end: 2 },
  up: { start: 3, end: 6 },
  left: { start: 7, end: 8 },
  down: { start: 9, end: 12 }
} as const;

export type NpcVisualAssetId =
  | "minsu"
  | "hyoryeon"
  | "jiwoo"
  | "jongmin"
  | "myungjin"
  | "yeonwoong"
  | "doyeon"
  | "sunmi"
  | "hyunseok"
  | "hyewon"
  | "minseok"
  | "minigame_npc"
  | "nayool";

export type NpcVisualAssetDefinition = {
  id: NpcVisualAssetId;
  idleTextureKey: string;
  walkTextureKey: string;
  idleAnimationKey: string;
  idleImagePath: string;
  walkSpritesheetPath: string;
  frameWidth: number;
  frameHeight: number;
  idleFrameRange: {
    start: number;
    end: number;
  };
  walkFrameRanges: Record<Facing, { start: number; end: number }>;
  idleFrameRate: number;
  walkFrameRate: number;
};

function createNpcAssetDefinition(
  id: NpcVisualAssetId,
  idleFileName: string,
  walkFileName: string
): NpcVisualAssetDefinition {
  return {
    id,
    idleTextureKey: getNpcIdleTextureKey(id),
    walkTextureKey: getNpcWalkTextureKey(id),
    idleAnimationKey: getNpcIdleAnimationKey(id),
    idleImagePath: `/assets/game/npc/${idleFileName}`,
    walkSpritesheetPath: `/assets/game/npc/${walkFileName}`,
    frameWidth: NPC_SPRITE_FRAME.width,
    frameHeight: NPC_SPRITE_FRAME.height,
    idleFrameRange: NPC_IDLE_FRAME_RANGE,
    walkFrameRanges: NPC_WALK_FRAME_RANGES,
    idleFrameRate: 4,
    walkFrameRate: 8
  };
}

// 실제 파일명과 visual id의 차이를 catalog 한곳에서만 흡수한다.
export const NPC_ASSET_CATALOG: Record<NpcVisualAssetId, NpcVisualAssetDefinition> = {
  minsu: createNpcAssetDefinition("minsu", "minsu.png", "walking-minsu.png"),
  hyoryeon: createNpcAssetDefinition("hyoryeon", "hyoryeon.png", "walking-hyoryeon.png"),
  jiwoo: createNpcAssetDefinition("jiwoo", "jiwoo.png", "walking-jiwoo.png"),
  jongmin: createNpcAssetDefinition("jongmin", "jongmin.png", "walking-jongmin.png"),
  myungjin: createNpcAssetDefinition("myungjin", "myungjin.png", "walking-myeongjin.png"),
  yeonwoong: createNpcAssetDefinition("yeonwoong", "yeonwoong.png", "walking-yeonwoong.png"),
  doyeon: createNpcAssetDefinition("doyeon", "doyeon-pro.png", "walking-doyeon.png"),
  sunmi: createNpcAssetDefinition("sunmi", "sunmi-pro.png", "walking-sunmi.png"),
  hyunseok: createNpcAssetDefinition("hyunseok", "hyunseok-consultant.png", "walking-hyeonsok.png"),
  hyewon: createNpcAssetDefinition("hyewon", "hyewonC.png", "walking-hyewon.png"),
  minseok: createNpcAssetDefinition("minseok", "minseokC.png", "walking-minsok.png"),
  minigame_npc: createNpcAssetDefinition("minigame_npc", "minigame_npc.png", "walking-minigame_npc.png"),
  nayool: createNpcAssetDefinition("nayool", "nayool.png", "walking-nayool.png")
};

export const NPC_ASSET_LIST = Object.values(NPC_ASSET_CATALOG);

// NPC 비주얼 메타는 catalog를 통해서만 조회한다.
export function getNpcAssetDefinition(npcVisualId: NpcVisualAssetId) {
  return NPC_ASSET_CATALOG[npcVisualId];
}
