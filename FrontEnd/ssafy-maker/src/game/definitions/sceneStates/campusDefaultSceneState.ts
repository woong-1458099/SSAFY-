// 캠퍼스 기본 내부 맵 상태에서 사용할 NPC 초기 배치를 정의한다.
import { DIALOGUE_IDS } from "../../../common/enums/dialogue";
import type { SceneState } from "../../../common/types/sceneState";
import { SCENE_STATE_IDS } from "./sceneStateIds";

export const CAMPUS_DEFAULT_SCENE_STATE: SceneState = {
  id: SCENE_STATE_IDS.campusDefault,
  area: "campus",
  npcs: [
    {
      npcId: "minsu",
      x: 220,
      y: 430,
      dialogueId: DIALOGUE_IDS.minsuIntro
    },
    {
      npcId: "hyewon",
      x: 420,
      y: 430,
      dialogueId: DIALOGUE_IDS.npcHyewon
    }
  ]
};
