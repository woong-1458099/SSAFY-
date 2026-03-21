import { DIALOGUE_IDS } from "../../../common/enums/dialogue";
import type { DialogueScript } from "../../../common/types/dialogue";

export const BEER_NOTICE_DIALOGUE: DialogueScript = {
  id: DIALOGUE_IDS.beerNotice,
  label: "역전할머니호프 안내",
  startNodeId: "start",
  nodes: {
    start: {
      id: "start",
      speaker: "안내",
      text: "역전할머니호프 기능은 다음 이식 단계에서 연결된다."
    }
  }
};
