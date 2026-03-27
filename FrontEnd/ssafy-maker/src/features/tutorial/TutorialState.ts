/**
 * Tutorial System - Type Definitions
 */

export type TutorialStepId =
  | "movement"
  | "areaAwareness"
  | "actionPoints"
  | "npcInteraction"
  | "placeInteraction"
  | "areaTransition"
  | "statsOverview"
  | "weeklyPlanner"
  | "menuSystem"
  | "complete";

export type TutorialStepStatus = "pending" | "active" | "completed" | "skipped";

export type TutorialCompletionType =
  | "auto"
  | "playerMoved"
  | "npcInteraction"
  | "placeInteraction"
  | "areaTransition"
  | "plannerOpened"
  | "menuOpened";

export type TutorialHighlightTarget =
  | "hudLeft"
  | "hudRight"
  | "nearestNpc"
  | "nearestPlace"
  | "transitionZone"
  | "none";

export interface TutorialStep {
  id: TutorialStepId;
  message: string;
  hint?: string;
  highlightTarget: TutorialHighlightTarget;
  completionType: TutorialCompletionType;
  autoAdvanceMs?: number;
  moveCountRequired?: number;
}

export interface TutorialProgress {
  currentStepIndex: number;
  stepStatuses: Record<TutorialStepId, TutorialStepStatus>;
  moveCount: number;
  startedAt: number;
  completedAt?: number;
}

export interface TutorialManagerState {
  isActive: boolean;
  isOverlayVisible: boolean;
  isPaused: boolean;
  progress: TutorialProgress;
}

const TUTORIAL_STORAGE_KEY = "ssafy_maker_tutorial_completed";

export function markTutorialCompleted(
  registry: Phaser.Data.DataManager
): void {
  registry.set("tutorialCompleted", true);
  try {
    localStorage.setItem(TUTORIAL_STORAGE_KEY, "true");
  } catch {
    // localStorage may not be available
  }
}

export function isTutorialCompleted(
  registry: Phaser.Data.DataManager
): boolean {
  if (registry.get("tutorialCompleted") === true) {
    return true;
  }
  try {
    return localStorage.getItem(TUTORIAL_STORAGE_KEY) === "true";
  } catch {
    return false;
  }
}

export function resetTutorialProgress(
  registry: Phaser.Data.DataManager
): void {
  registry.set("tutorialCompleted", false);
  try {
    localStorage.removeItem(TUTORIAL_STORAGE_KEY);
  } catch {
    // localStorage may not be available
  }
}
