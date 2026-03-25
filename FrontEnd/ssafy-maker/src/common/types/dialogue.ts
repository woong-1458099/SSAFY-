// 대화 스크립트와 대화 매니저가 함께 사용하는 공통 대화 타입 정의
import type { DialogueId } from "../enums/dialogue";

export type DialogueBaseStatKey = "fe" | "be" | "teamwork" | "luck" | "stress";
export type DialogueCurrencyStatKey = "gold" | "money";
export type DialogueStatKey = DialogueBaseStatKey | "hp" | DialogueCurrencyStatKey;
export type StaticDialogueId = string & { readonly __staticDialogueId: unique symbol };
export type RuntimeDialogueId = string & { readonly __runtimeDialogueId: unique symbol };
export type DialogueScriptId = DialogueId | StaticDialogueId | RuntimeDialogueId;
export type DialogueChoiceActionType = "NORMAL" | "LOCKED" | "MADNESS";
export const DIALOGUE_ACTIONS = [
  "openShop",
  "openMiniGame",
  "playDrinking",
  "playInterview",
  "playGym",
  "playRhythm",
  "playCooking",
  "playTank",
  "playQuiz",
  "playRunner",
  "playBusinessSmile",
  "playTyping",
  "playLotto",
  "playDontSmile"
] as const;
export type DialogueAction = (typeof DIALOGUE_ACTIONS)[number];

export type DialogueRequirement = {
  stat: DialogueStatKey;
  min?: number;
  max?: number;
  label?: string;
};

export type Gender = "male" | "female"

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
  speakerGender?: Gender;
  nextNodeId?: string;
  choices?: DialogueChoice[];
  action?: DialogueAction;
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

export function isDialogueScriptId(value: string): value is DialogueScriptId {
  const normalized = value.trim();
  if (normalized.length === 0) {
    return false;
  }

  // Runtime ID pattern
  if (isRuntimeDialogueId(normalized)) {
    return true;
  }

  // Authored ID pattern (npc_ prefix, place_ prefix or etc)
  if (/^[a-z0-9_]+$/.test(normalized)) {
    return true;
  }

  return false;
}

export function normalizeDialogueScriptId(value: string): DialogueScriptId {
  const normalized = value.trim();
  if (!isDialogueScriptId(normalized)) {
    throw new Error(`Invalid DialogueScriptId format: ${value}. Expected alphanumeric with underscores.`);
  }

  return normalized as DialogueScriptId;
}
