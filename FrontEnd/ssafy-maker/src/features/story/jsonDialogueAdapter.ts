import {
  createRuntimeDialogueId,
  isRuntimeDialogueId,
  type DialogueAction,
  type DialogueChoice,
  type DialogueChoiceActionType,
  type DialogueNode,
  type DialogueRequirement,
  type DialogueScript
} from "../../common/types/dialogue";
import { matchesFixedEventLocation, normalizeFixedEventLocationToken } from "./fixedEventLocation";

export type FixedEventDialogueEntry = {
  speakerId?: string;
  speakerName?: string;
  emotion?: string;
  text?: string;
};

export type FixedEventChoiceCondition = {
  social?: number;
  code?: number;
  gold?: number;
  money?: number;
  luck?: number;
  hp?: number;
  stress?: number;
  stress_max?: number;
  trait?: string;
};

export type FixedEventStatChangeKey =
  | "social"
  | "code"
  | "gold"
  | "money"
  | "hp"
  | "stress"
  | "luck"
  | "favor_pro"
  | "madness"
  | "fe"
  | "be"
  | "teamwork";

export type FixedEventChoiceResult = {
  statChanges?: Partial<Record<FixedEventStatChangeKey, number>>;
  feedbackText?: string;
  feedbackDialogues?: FixedEventDialogueEntry[];
};

export type FixedEventChoiceEntry = {
  choiceId?: number;
  actionType?: string;
  condition?: FixedEventChoiceCondition | null;
  text?: string;
  result?: FixedEventChoiceResult;
  action?: DialogueAction;
};

export type FixedEventTriggerTiming = {
  week?: number;
  day?: number;
  timeOfDay?: string;
};

export type FixedEventEntry = {
  eventId?: string;
  eventName?: string;
  eventType?: string;
  triggerTiming?: FixedEventTriggerTiming;
  location?: string;
  isRepeatable?: boolean;
  dialogues?: FixedEventDialogueEntry[];
  choices?: FixedEventChoiceEntry[];
};

type FixedEventMatchContext = {
  week: number;
  day: number;
  timeOfDay: string;
  location: string;
};

type BuildDialogueOptions = {
  fallbackNpcLabel: string;
  playerName?: string;
};

const SPEAKER_LABEL_BY_ID: Record<string, string> = {
  SYSTEM: "시스템",
  PLAYER: "플레이어",
  NPC_UNKNOWN: "동기"
};

function normalizeText(value: unknown, fallback: string): string {
  return typeof value === "string" && value.trim().length > 0 ? value : fallback;
}

function normalizeToken(value: unknown): string {
  if (typeof value !== "string") return "";
  return value.trim().toLowerCase().replace(/\s+/g, "");
}

function replacePlayerNameToken(text: string, playerName: string): string {
  return text.replace(/\{playerName\}/g, playerName);
}

function normalizeTextWithPlayerName(value: unknown, fallback: string, playerName: string): string {
  return replacePlayerNameToken(normalizeText(value, fallback), playerName);
}

function normalizeActionType(value: unknown): DialogueChoiceActionType {
  const token = typeof value === "string" ? value.trim().toUpperCase() : "";
  if (token === "LOCKED" || token === "MADNESS") {
    return token;
  }
  return "NORMAL";
}

function normalizeChoiceText(
  value: unknown,
  fallback: string,
  playerName: string,
  actionType: DialogueChoiceActionType
): string {
  const text = normalizeTextWithPlayerName(value, fallback, playerName).trim();
  let startIndex = 0;

  while (startIndex < text.length) {
    const char = text[startIndex];
    const code = text.charCodeAt(startIndex);
    const isAsciiLetter = (code >= 48 && code <= 57) || (code >= 65 && code <= 90) || (code >= 97 && code <= 122);
    const isKorean = code >= 0xac00 && code <= 0xd7a3;
    const isQuote = char === "\"" || char === "'";
    const isBracket = char === "[";
    if (isAsciiLetter || isKorean || isQuote || isBracket) {
      break;
    }
    startIndex += 1;
  }

  let normalized = text.slice(startIndex);
  if (actionType !== "LOCKED") {
    return normalized;
  }

  const closingBracketIndex = normalized.indexOf("]");
  if (normalized.startsWith("[") && closingBracketIndex > -1) {
    normalized = normalized.slice(closingBracketIndex + 1).trimStart();
  }

  return normalized.trim();
}

function resolveSpeakerLabel(entry: FixedEventDialogueEntry, fallbackNpcLabel: string): string {
  if (entry.speakerName && entry.speakerName.trim().length > 0) {
    return entry.speakerName;
  }

  if (entry.speakerId && SPEAKER_LABEL_BY_ID[entry.speakerId]) {
    return SPEAKER_LABEL_BY_ID[entry.speakerId];
  }

  return fallbackNpcLabel;
}

function mapConditionToRequirements(condition: FixedEventChoiceCondition | null | undefined): DialogueRequirement[] {
  if (!condition || typeof condition !== "object") return [];

  const requirements: DialogueRequirement[] = [];

  if (typeof condition.social === "number") {
    requirements.push({ stat: "teamwork", min: Math.round(condition.social), label: `협업 ${Math.round(condition.social)} 이상` });
  }
  if (typeof condition.code === "number") {
    const value = Math.round(condition.code);
    requirements.push({ stat: "fe", min: value, label: `코딩 ${value} 이상` });
    requirements.push({ stat: "be", min: value, label: `코딩 ${value} 이상` });
  }
  const currencyRequirement = typeof condition.gold === "number" ? condition.gold : condition.money;
  if (typeof currencyRequirement === "number") {
    requirements.push({ stat: "gold", min: Math.round(currencyRequirement), label: `재화 ${Math.round(currencyRequirement)}` });
  }
  if (typeof condition.luck === "number") {
    requirements.push({ stat: "luck", min: Math.round(condition.luck), label: `운 ${Math.round(condition.luck)} 이상` });
  }
  if (typeof condition.hp === "number") {
    requirements.push({ stat: "hp", min: Math.round(condition.hp), label: `HP ${Math.round(condition.hp)} 이상` });
  }
  if (typeof condition.stress === "number") {
    requirements.push({ stat: "stress", max: Math.round(condition.stress), label: `스트레스 ${Math.round(condition.stress)} 이하` });
  }
  if (typeof condition.stress_max === "number") {
    requirements.push({ stat: "stress", max: Math.round(condition.stress_max), label: `스트레스 ${Math.round(condition.stress_max)} 이하` });
  }

  return requirements;
}

function mapStatChanges(changes: Partial<Record<FixedEventStatChangeKey, number>> | undefined): DialogueChoice["statChanges"] {
  if (!changes || typeof changes !== "object") return undefined;

  const mapped: NonNullable<DialogueChoice["statChanges"]> = {};

  Object.entries(changes).forEach(([rawKey, rawValue]) => {
    if (typeof rawValue !== "number" || !Number.isFinite(rawValue)) return;
    const value = Math.round(rawValue);

    switch (rawKey) {
      case "social":
      case "favor_pro":
        mapped.teamwork = (mapped.teamwork ?? 0) + value;
        break;
      case "code": {
        const feDelta = value >= 0 ? Math.ceil(value / 2) : Math.floor(value / 2);
        const beDelta = value - feDelta;
        mapped.fe = (mapped.fe ?? 0) + feDelta;
        mapped.be = (mapped.be ?? 0) + beDelta;
        break;
      }
      case "madness":
        mapped.stress = (mapped.stress ?? 0) + value;
        break;
      case "gold":
      case "money":
        mapped.gold = (mapped.gold ?? 0) + value;
        break;
      case "hp":
        mapped.hp = (mapped.hp ?? 0) + value;
        break;
      case "stress":
      case "luck":
      case "fe":
      case "be":
      case "teamwork":
        mapped[rawKey] = (mapped[rawKey] ?? 0) + value;
        break;
      default:
        break;
    }
  });

  return Object.keys(mapped).length > 0 ? mapped : undefined;
}

function validateDialogueScript(script: DialogueScript): DialogueScript {
  if (!isRuntimeDialogueId(script.id)) {
    throw new Error(`Runtime dialogue id is invalid: ${script.id}`);
  }

  if (!script.startNodeId || !script.nodes[script.startNodeId]) {
    throw new Error(`Dialogue start node is missing: ${script.id}`);
  }

  const nodeEntries = Object.entries(script.nodes);
  if (nodeEntries.length === 0) {
    throw new Error(`Dialogue nodes are empty: ${script.id}`);
  }

  const referencedNodeIds = new Set<string>();

  nodeEntries.forEach(([nodeId, node]) => {
    if (node.id !== nodeId) {
      throw new Error(`Dialogue node id mismatch: ${script.id}:${nodeId}`);
    }

    if (node.nextNodeId) {
      referencedNodeIds.add(node.nextNodeId);
    }

    node.choices?.forEach((choice, choiceIndex) => {
      if (!choice.id.trim()) {
        throw new Error(`Dialogue choice id is empty: ${script.id}:${nodeId}:${choiceIndex}`);
      }
      if (choice.nextNodeId) {
        referencedNodeIds.add(choice.nextNodeId);
      }
    });
  });

  referencedNodeIds.forEach((nodeId) => {
    if (!script.nodes[nodeId]) {
      throw new Error(`Dialogue references missing node: ${script.id}:${nodeId}`);
    }
  });

  return script;
}

export function getFixedEventEntries(rawData: unknown): FixedEventEntry[] {
  if (Array.isArray(rawData)) {
    return rawData.filter((entry): entry is FixedEventEntry => Boolean(entry && typeof entry === "object"));
  }

  if (rawData && typeof rawData === "object" && Array.isArray((rawData as { events?: unknown[] }).events)) {
    return (rawData as { events: unknown[] }).events.filter(
      (entry): entry is FixedEventEntry => Boolean(entry && typeof entry === "object")
    );
  }

  return [];
}

export function findMatchingFixedEvent(
  rawData: unknown,
  context: FixedEventMatchContext,
  completedEventIds: string[]
): FixedEventEntry | null {
  const completedSet = new Set(completedEventIds);
  const targetTime = normalizeToken(context.timeOfDay);

  return (
    getFixedEventEntries(rawData).find((event) => {
      const timing = event.triggerTiming;
      if (!timing || event.eventType !== "FIXED") return false;

      const eventId = typeof event.eventId === "string" ? event.eventId : "";
      if (event.isRepeatable !== true && eventId && completedSet.has(eventId)) {
        return false;
      }

      const sameWeek = Math.round(timing.week ?? -1) === context.week;
      const sameDay = Math.round(timing.day ?? -1) === context.day;
      const sameTime = normalizeToken(timing.timeOfDay) === targetTime;
      const sameLocation = matchesFixedEventLocation(event.location, context.location);
      return sameWeek && sameDay && sameTime && sameLocation;
    }) ?? null
  );
}

export function buildDialogueScriptFromFixedEventEntry(
  dialogueId: string,
  event: FixedEventEntry,
  options: BuildDialogueOptions
): DialogueScript | null {
  const runtimeDialogueId = createRuntimeDialogueId(dialogueId);
  const fallbackNpcLabel = options.fallbackNpcLabel;
  const playerName = options.playerName ?? "플레이어";
  const dialogues = Array.isArray(event.dialogues) ? event.dialogues : [];
  const choices = Array.isArray(event.choices) ? event.choices : [];
  if (dialogues.length === 0) {
    return null;
  }

  const nodes: Record<string, DialogueNode> = {};
  const npcLabel =
    dialogues.find((entry) => entry.speakerName && entry.speakerName.trim().length > 0)?.speakerName ??
    fallbackNpcLabel;

  dialogues.forEach((entry, index) => {
    const id = `json_dialogue_${index + 1}`;
    const nextNodeId = index < dialogues.length - 1 ? `json_dialogue_${index + 2}` : undefined;

    nodes[id] = {
      id,
      speaker: resolveSpeakerLabel(entry, npcLabel),
      speakerId: typeof entry.speakerId === "string" ? entry.speakerId : undefined,
      emotion: typeof entry.emotion === "string" ? entry.emotion : undefined,
      text: normalizeTextWithPlayerName(entry.text, "...", playerName),
      nextNodeId
    };
  });

  if (choices.length > 0) {
    const finalDialogueNode = nodes[`json_dialogue_${dialogues.length}`];
    finalDialogueNode.nextNodeId = undefined;
    finalDialogueNode.choices = choices.map((choice, index): DialogueChoice => {
      const choiceId = choice.choiceId ?? index + 1;
      const actionType = normalizeActionType(choice.actionType);
      const requirements = mapConditionToRequirements(choice.condition);
      const feedbackDialogues = Array.isArray(choice.result?.feedbackDialogues) ? choice.result.feedbackDialogues : [];
      const feedbackStartNodeId = feedbackDialogues.length > 0 ? `json_choice_feedback_${choiceId}_1` : undefined;
      const lockedReason =
        typeof choice.condition?.trait === "string" && choice.condition.trait.trim().length > 0
          ? `${choice.condition.trait} 조건은 아직 특성 시스템에 연결되지 않았습니다`
          : undefined;

      return {
        id: `json_choice_${choiceId}`,
        text: normalizeChoiceText(choice.text, `선택지 ${index + 1}`, playerName, actionType),
        nextNodeId: feedbackStartNodeId,
        actionType,
        action: choice.action,
        requirements,
        lockedReason,
        statChanges: mapStatChanges(choice.result?.statChanges),
        feedbackText:
          feedbackDialogues.length === 0
            ? normalizeTextWithPlayerName(choice.result?.feedbackText, "", playerName)
            : undefined
      };
    });

    choices.forEach((choice, index) => {
      const choiceId = choice.choiceId ?? index + 1;
      const feedbackDialogues = Array.isArray(choice.result?.feedbackDialogues) ? choice.result.feedbackDialogues : [];
      if (feedbackDialogues.length === 0) return;

      feedbackDialogues.forEach((entry, feedbackIndex) => {
        const id = `json_choice_feedback_${choiceId}_${feedbackIndex + 1}`;
        const nextNodeId =
          feedbackIndex < feedbackDialogues.length - 1 ? `json_choice_feedback_${choiceId}_${feedbackIndex + 2}` : undefined;
        nodes[id] = {
          id,
          speaker: resolveSpeakerLabel(entry, npcLabel),
          speakerId: typeof entry.speakerId === "string" ? entry.speakerId : undefined,
          emotion: typeof entry.emotion === "string" ? entry.emotion : undefined,
          text: normalizeTextWithPlayerName(entry.text, "...", playerName),
          nextNodeId
        };
      });
    });
  }

  return validateDialogueScript({
    id: runtimeDialogueId,
    label: event.eventName ?? fallbackNpcLabel,
    startNodeId: "json_dialogue_1",
    nodes
  });
}

export function buildDialogueScriptFromFixedEventJson(
  dialogueId: string,
  rawData: unknown,
  fallbackNpcLabel: string,
  playerName = "플레이어"
): DialogueScript | null {
  const firstEvent = getFixedEventEntries(rawData)[0];
  if (!firstEvent) {
    return null;
  }

  return buildDialogueScriptFromFixedEventEntry(dialogueId, firstEvent, {
    fallbackNpcLabel,
    playerName
  });
}

export { normalizeFixedEventLocationToken };
