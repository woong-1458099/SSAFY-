import { DIALOGUE_IDS } from "../../../common/enums/dialogue";
import type { DialogueScript } from "../../../common/types/dialogue";

export const CAFE_NOTICE_DIALOGUE: DialogueScript = {
  id: DIALOGUE_IDS.cafeNotice,
  label: "카페 안내",
  startNodeId: "start",
  nodes: {
    start: {
      id: "start",
      speaker: "안내",
      text: "카페 상호작용은 다음 이식 단계에서 연결된다."
    }
  }
};
