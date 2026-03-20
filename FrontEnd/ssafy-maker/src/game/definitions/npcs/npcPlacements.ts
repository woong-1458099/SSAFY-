// 지역별 NPC 배치와 기본 대화 연결 정보를 관리하는 배치 정의
import type { AreaId } from "../../../common/enums/area";
import { DIALOGUE_IDS } from "../../../common/enums/dialogue";
import type { NpcId } from "../../../common/enums/npc";
import type { NpcPlacement } from "./npcPlacement";

export const NPC_PLACEMENTS_BY_AREA: Record<AreaId, NpcPlacement[]> = {
  world: [],
  downtown: [],
  campus: [
    {
      npcId: "minsu",
      areaId: "campus",
      x: 220,
      y: 430,
      facing: "right",
      dialogueId: DIALOGUE_IDS.minsuIntro
    },
    {
      npcId: "yuna",
      areaId: "campus",
      x: 420,
      y: 430,
      facing: "left",
      dialogueId: DIALOGUE_IDS.yunaGreeting
    }
  ]
};

export function getNpcPlacement(areaId: AreaId, npcId: NpcId) {
  return NPC_PLACEMENTS_BY_AREA[areaId].find((placement) => placement.npcId === npcId);
}
