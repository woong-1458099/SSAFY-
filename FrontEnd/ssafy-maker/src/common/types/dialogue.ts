// 대화 스크립트와 대화 매니저가 함께 사용하는 공통 대화 타입 정의
import type { DialogueId } from "../enums/dialogue";

export type DialogueBaseStatKey = "fe" | "be" | "teamwork" | "luck" | "stress";
export type DialogueStatKey = DialogueBaseStatKey | "hp" | "gold";
export type DialogueChoiceActionType = "NORMAL" | "LOCKED" | "MADNESS";
export type DialogueAction =
  | "openShop"
  | "openMiniGame"
  | "playDrinking"
  | "playInterview"
  | "playGym"
  | "playRhythm"
  | "playCooking";

export type DialogueRequirement = {
  stat: DialogueStatKey;
  min?: number;
  max?: number;
  label?: string;
};

export type DialogueChoice = {
  id: string;
  text: string;
  nextNodeId?: string;
  actionType?: DialogueChoiceActionType;
  statChanges?: Partial<Record<DialogueStatKey, number>>;
  requirements?: DialogueRequirement[];
  lockedReason?: string;
  feedbackText?: string;
  action?: DialogueAction;
};

export type DialogueNode = {
  id: string;
  speaker: string;
  speakerId?: string;
  emotion?: string;
  text: string;
  nextNodeId?: string;
  choices?: DialogueChoice[];
  action?: DialogueAction;
};

export type DialogueScript = {
  id: DialogueId | string;
  label: string;
  startNodeId: string;
  nodes: Record<string, DialogueNode>;
};
