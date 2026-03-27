// 새 구조의 노드형 대화 흐름을 검증하기 위한 샘플 민수 대화 스크립트
import { DIALOGUE_IDS } from "../../../common/enums/dialogue";
import type { DialogueScript } from "../../../common/types/dialogue";

export const MINSU_INTRO_DIALOGUE: DialogueScript = {
  id: DIALOGUE_IDS.minsuIntro,
  label: "민수 소개",
  startNodeId: "intro_1",
  nodes: {
    intro_1: {
      id: "intro_1",
      speaker: "민수",
      text: "드디어 새 구조로 다시 시작하네.",
      nextNodeId: "intro_2"
    },
    intro_2: {
      id: "intro_2",
      speaker: "민수",
      text: "이제 MainScene은 지휘만 하고, 실제 행동은 밖으로 뺄 거야."
    }
  }
};
