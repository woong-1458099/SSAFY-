// 샘플 씬에서 NPC 배치 정의와 순차 액션 흐름을 검증하는 테스트 스크립트
import { DIALOGUE_IDS } from "../../../common/enums/dialogue";
import type { SceneScript } from "../../../common/types/sceneScript";

export const SCENE_001: SceneScript = {
  id: "scene_001",
  area: "campus",
  initialStateId: "campus_default",
  actions: [
    { type: "moveNpc", npcId: "minsu", toX: 320, toY: 430, duration: 1000 },
    { type: "playDialogue", dialogueId: DIALOGUE_IDS.minsuIntro },
    { type: "turnNpc", npcId: "minsu", facing: "down" },
    { type: "wait", duration: 500 }
  ]
};
