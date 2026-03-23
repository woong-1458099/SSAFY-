// 대화 스크립트와 대화 매니저가 함께 사용하는 공통 대화 타입 정의
import type { DialogueId } from "../enums/dialogue";

export const DIALOGUE_METRIC_KEYS = ["fe", "be", "teamwork", "luck", "stress", "hp", "gold", "money"] as const;
export const DIALOGUE_REQUIREMENT_STAT_KEYS = [
  "fe",
  "be",
  "teamwork",
  "luck",
  "stress",
  "hp",
  "gold",
  "money",
  "playerGender"
] as const;

export type DialogueMetricKey = (typeof DIALOGUE_METRIC_KEYS)[number];
export type DialogueRequirementStatKey = (typeof DIALOGUE_REQUIREMENT_STAT_KEYS)[number];
export type DialogueCurrencyStatKey = Extract<DialogueMetricKey, "gold" | "money">;
export type DialogueStatKey = DialogueMetricKey;
export type StaticDialogueId = string & { readonly __staticDialogueId: unique symbol };
export type RuntimeDialogueId = string & { readonly __runtimeDialogueId: unique symbol };
export type DialogueScriptId = DialogueId | StaticDialogueId | RuntimeDialogueId;
export type DialogueChoiceActionType = "NORMAL" | "LOCKED" | "MADNESS" | "ROMANCE_EVENT";
export const DIALOGUE_ACTIONS = [
  "openShop",
  "openMiniGame",
  "playDrinking",
  "playInterview",
  "playGym",
  "playRhythm",
  "playCooking"
] as const;
export type DialogueAction = (typeof DIALOGUE_ACTIONS)[number];

export type DialogueRequirement = {
  stat: DialogueRequirementStatKey;
  equals?: string;
  min?: number;
  max?: number;
  label?: string;
};

export type AffectionRequirement = {
  npcId: string;
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
  affectionChanges?: Record<string, number>;
  requirements?: DialogueRequirement[];
  affectionRequirements?: AffectionRequirement[];
  lockedReason?: string;
  feedbackText?: string;
  action?: DialogueAction;
  setFlags?: string[];
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
  affectionChanges?: Record<string, number>;
};

export type DialogueScript = {
  id: DialogueScriptId;
  label: string;
  startNodeId: string;
  nodes: Record<string, DialogueNode>;
};

const RUNTIME_DIALOGUE_ID_PREFIX = "runtime:";
export function isDialogueCurrencyStatKey(stat: DialogueStatKey): stat is DialogueCurrencyStatKey {
  return stat === "gold" || stat === "money";
}

export function toDialogueCurrencyHudKey(stat: DialogueCurrencyStatKey): "money" {
  return "money";
}

export function isStaticDialogueId(value: string): value is DialogueId | StaticDialogueId {
  return !isRuntimeDialogueId(value) && value.trim().length > 0;
}

export function isRuntimeDialogueId(value: string): value is RuntimeDialogueId {
  return value.startsWith(RUNTIME_DIALOGUE_ID_PREFIX) && value.length > RUNTIME_DIALOGUE_ID_PREFIX.length;
}

export function createRuntimeDialogueId(value: string): RuntimeDialogueId {
  const normalized = value.trim();
  if (!normalized) {
    throw new Error("Runtime dialogue id must be a non-empty string");
  }

  const runtimeId = isRuntimeDialogueId(normalized)
    ? normalized
    : `${RUNTIME_DIALOGUE_ID_PREFIX}${normalized}`;

  return runtimeId as RuntimeDialogueId;
}
