// 혜원 NPC 배치와 연결되는 간단한 샘플 대화 스크립트
import { DIALOGUE_IDS } from "../../../common/enums/dialogue";
import type { DialogueScript } from "../../../common/types/dialogue";

export const HYEWON_GREETING_DIALOGUE: DialogueScript = {
  id: DIALOGUE_IDS.npcHyewon,
  label: "혜원 인사",
  startNodeId: "greeting_1",
  nodes: {
    greeting_1: {
      id: "greeting_1",
      speaker: "혜원",
      text: "지금은 구조를 먼저 제대로 세우는 게 중요해."
    }
  }
};
