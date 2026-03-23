// 샘플 씬에서 NPC 배치 정의와 순차 액션 흐름을 검증하는 테스트 스크립트
import { DIALOGUE_IDS } from "../../../common/enums/dialogue";
import type { SceneScript } from "../../../common/types/sceneScript";
import { SCENE_STATE_IDS } from "../../definitions/sceneStates/sceneStateIds";
import { SCENE_IDS } from "./sceneIds";

export const SCENE_001: SceneScript = {
  id: SCENE_IDS.campusSample,
  area: "campus",
  initialStateId: SCENE_STATE_IDS.campusDefault,
  actions: [
    { type: "moveNpc", npcId: "minsu", toX: 320, toY: 430, duration: 1000 },
    { type: "playDialogue", dialogueId: DIALOGUE_IDS.minsuIntro },
    { type: "turnNpc", npcId: "minsu", facing: "down" },
    { type: "wait", duration: 500 }
  ]
};
