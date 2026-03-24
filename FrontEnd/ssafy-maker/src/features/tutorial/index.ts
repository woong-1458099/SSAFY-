/**
 * Tutorial System - Public API
 */

export { TutorialManager } from "./TutorialManager";
export type { TutorialManagerOptions } from "./TutorialManager";

export { TutorialOverlay } from "./TutorialOverlay";

export {
  TUTORIAL_STEPS,
  TUTORIAL_STEP_COUNT,
  getTutorialStep,
  getTutorialStepById,
  getStepIndex
} from "./TutorialStepConfig";

export {
  markTutorialCompleted,
  isTutorialCompleted,
  resetTutorialProgress
} from "./TutorialState";

export type {
  TutorialStep,
  TutorialStepId,
  TutorialStepStatus,
  TutorialProgress,
  TutorialManagerState,
  TutorialCompletionType,
  TutorialHighlightTarget
} from "./TutorialState";
