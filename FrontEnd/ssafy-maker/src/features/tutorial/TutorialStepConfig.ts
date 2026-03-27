/**
 * Tutorial System - Step Configuration
 */

import type { TutorialStep, TutorialStepId } from "./TutorialState";

export const TUTORIAL_STEPS: readonly TutorialStep[] = [
  // Phase 1: Basic Controls
  {
    id: "movement",
    message: "화살표 키로 이동할 수 있습니다.\n3칸 이동해 보세요!",
    hint: "↑ ↓ ← →",
    highlightTarget: "none",
    completionType: "playerMoved",
    moveCountRequired: 3
  },
  {
    id: "areaAwareness",
    message: "현재 위치는 화면 좌측 상단에서 확인할 수 있습니다.",
    highlightTarget: "hudLeft",
    completionType: "auto",
    autoAdvanceMs: 3000
  },
  {
    id: "actionPoints",
    message: "하루에 4번의 행동이 가능합니다.\n행동력을 잘 관리하세요!",
    hint: "AP: 4/4",
    highlightTarget: "hudLeft",
    completionType: "auto",
    autoAdvanceMs: 3000
  },

  // Phase 2: Interaction Mechanics
  {
    id: "npcInteraction",
    message: "SSAFY 생활에서 표정 관리는 필수입니다!\nNPC 근처에서 SPACE 키를 눌러 웃음참기 훈련을 해보세요.",
    hint: "SPACE",
    highlightTarget: "nearestNpc",
    completionType: "npcInteraction"
  },
  // placeInteraction + areaTransition을 areaTransition 하나로 통합
  // (건물 SPACE → place이벤트 + areaTransition이벤트가 동시 발생해 두 스텝이 한꺼번에 클리어되는 버그 방지)
  {
    id: "placeInteraction",
    message: "건물이나 시설의 출입구에서 이동 화살표를 찾아보세요!\n화살표 표시 위에서 이동하면 들어갈 수 있습니다.",
    highlightTarget: "transitionZone",
    completionType: "areaTransition"
  },

  // Phase 3: Core Gameplay Systems
  {
    id: "statsOverview",
    message: "HP, 스트레스, 돈은\n화면 우측 상단에서 확인할 수 있습니다.",
    highlightTarget: "hudRight",
    completionType: "auto",
    autoAdvanceMs: 3000
  },
  {
    id: "weeklyPlanner",
    message: "P 키를 눌러 주간 계획표를 열 수 있습니다.\n한 번 열어보세요!",
    hint: "P",
    highlightTarget: "none",
    completionType: "plannerOpened"
  },
  {
    id: "menuSystem",
    message: "ESC 키를 눌러 메뉴를 열 수 있습니다.\n능력치와 인벤토리를 확인하세요!",
    hint: "ESC",
    highlightTarget: "none",
    completionType: "menuOpened"
  },

  // Phase 4: Completion
  {
    id: "complete",
    message: "튜토리얼 완료!\n6주간의 SSAFY 생활을 즐겨보세요!",
    highlightTarget: "none",
    completionType: "auto",
    autoAdvanceMs: 3000
  }
] as const;

export const TUTORIAL_STEP_COUNT = TUTORIAL_STEPS.length;

export function getTutorialStep(index: number): TutorialStep | undefined {
  return TUTORIAL_STEPS[index];
}

export function getTutorialStepById(id: TutorialStepId): TutorialStep | undefined {
  return TUTORIAL_STEPS.find((step) => step.id === id);
}

export function getStepIndex(id: TutorialStepId): number {
  return TUTORIAL_STEPS.findIndex((step) => step.id === id);
}
