import { DIALOGUE_IDS } from "../../../common/enums/dialogue";
import type { DialogueScript } from "../../../common/types/dialogue";

export const HOME_LOCKED_DIALOGUE: DialogueScript = {
  id: DIALOGUE_IDS.homeLocked,
  label: "집 안내",
  startNodeId: "start",
  nodes: {
    start: {
      id: "start",
      speaker: "안내",
      text: "지금은 집으로 들어갈 수 없다."
    }
  }
};
