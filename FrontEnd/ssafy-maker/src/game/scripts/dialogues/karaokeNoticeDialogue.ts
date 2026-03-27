import { DIALOGUE_IDS } from "../../../common/enums/dialogue";
import type { DialogueScript } from "../../../common/types/dialogue";

export const KARAOKE_NOTICE_DIALOGUE: DialogueScript = {
  id: DIALOGUE_IDS.karaokeNotice,
  label: "노래방 안내",
  startNodeId: "start",
  nodes: {
    start: {
      id: "start",
      speaker: "안내",
      text: "노래방 기능은 다음 이식 단계에서 연결된다."
    }
  }
};
