import type { AreaId } from "../../common/enums/area";
import type { FixedEventStatChangeKey } from "../../common/types/fixedEvent";
import { DAY_CYCLE } from "../progression/TimeService";
import type {
  FixedEventChoiceCondition,
  FixedEventChoiceEntry,
  FixedEventChoiceResult,
  FixedEventEntry
} from "./jsonDialogueAdapter";
import { resolveFixedEventLocationId, resolveFixedEventRenderArea } from "./fixedEventNpcPresence";

export type FixedEventDebugChoiceSummary = {
  choiceId: number;
  actionType: string;
  text: string;
  requirementLabels: string[];
  effectLabels: string[];
  feedbackText?: string;
};

export type FixedEventDebugEntry = {
  eventId: string;
  eventName: string;
  week: number;
  day: number;
  dayLabel: string;
  timeOfDay: string;
  locationLabel: string;
  areaId: AreaId;
  isRepeatable: boolean;
  isCompleted: boolean;
  previewText: string;
  requirementLabels: string[];
  choiceSummaries: FixedEventDebugChoiceSummary[];
};

function normalizeText(value: unknown): string {
  if (typeof value !== "string") {
    return "";
  }

  return value.replace(/\s+/g, " ").trim();
}

function summarizePreview(event: FixedEventEntry): string {
  if (event.nodes && event.startNodeId) {
    const nodes = Object.values(event.nodes);
    const preview = nodes
      .map((node) => normalizeText(node.text))
      .filter((text) => text.length > 0)
      .slice(0, 2)
      .join(" / ");
      
    if (!preview) return "대사 미리보기가 없습니다.";
    return preview.length > 180 ? `${preview.slice(0, 177)}...` : preview;
  }

  const dialogues = Array.isArray(event.dialogues) ? event.dialogues : [];
  const preview = dialogues
    .map((entry) => normalizeText(entry.text))
    .filter((text) => text.length > 0)
    .slice(0, 2)
    .join(" / ");

  if (!preview) {
    return "대사 미리보기가 없습니다.";
  }

  return preview.length > 180 ? `${preview.slice(0, 177)}...` : preview;
}

function formatRequirementCondition(condition: FixedEventChoiceCondition | null | undefined): string[] {
  if (!condition || typeof condition !== "object") {
    return [];
  }

  const labels: string[] = [];

  if (typeof condition.social === "number") {
    labels.push(`사교 ${Math.round(condition.social)} 이상`);
  }
  if (typeof condition.code === "number") {
    labels.push(`코딩 ${Math.round(condition.code)} 이상`);
  }
  if (typeof condition.money === "number") {
    labels.push(`재화 ${Math.round(condition.money)} 이상`);
  }
  if (typeof condition.luck === "number") {
    labels.push(`운 ${Math.round(condition.luck)} 이상`);
  }
  if (typeof condition.hp === "number") {
    labels.push(`HP ${Math.round(condition.hp)} 이상`);
  }
  if (typeof condition.stress === "number") {
    labels.push(`스트레스 ${Math.round(condition.stress)} 이하`);
  }
  if (typeof condition.stress_max === "number") {
    labels.push(`스트레스 ${Math.round(condition.stress_max)} 이하`);
  }
  if (typeof condition.trait === "string" && condition.trait.trim().length > 0) {
    labels.push(`특성 ${condition.trait.trim()}`);
  }

  return labels;
}

function formatStatChangeLabels(result: FixedEventChoiceResult | undefined): string[] {
  const changes = result?.statChanges;
  if (!changes || typeof changes !== "object") {
    return [];
  }

  const statLabels: Partial<Record<FixedEventStatChangeKey, string>> = {
    social: "사교",
    code: "코딩",
    money: "재화",
    hp: "HP",
    stress: "스트레스",
    luck: "운",
    fe: "FE",
    be: "BE",
    teamwork: "협업"
  };

  return Object.entries(changes)
    .filter(([, rawValue]) => typeof rawValue === "number" && Number.isFinite(rawValue))
    .map(([rawKey, rawValue]) => {
      const key = rawKey as FixedEventStatChangeKey;
      const label = statLabels[key] ?? rawKey;
      const value = Math.round(rawValue as number);
      return `${label} ${value > 0 ? "+" : ""}${value}`;
    });
}

function buildChoiceSummary(choice: FixedEventChoiceEntry, index: number): FixedEventDebugChoiceSummary {
  const choiceId = Math.round(choice.choiceId ?? index + 1);
  const requirementLabels = formatRequirementCondition(choice.condition);
  const effectLabels = formatStatChangeLabels(choice.result);
  const feedbackText = normalizeText(choice.result?.feedbackText);

  return {
    choiceId,
    actionType: typeof choice.actionType === "string" && choice.actionType.trim().length > 0 ? choice.actionType.trim() : "NORMAL",
    text: normalizeText(choice.text) || `선택지 ${choiceId}`,
    requirementLabels,
    effectLabels,
    feedbackText: feedbackText || undefined
  };
}

function collectEventRequirements(choiceSummaries: FixedEventDebugChoiceSummary[]): string[] {
  const seen = new Set<string>();
  const labels: string[] = [];

  choiceSummaries.forEach((choice) => {
    choice.requirementLabels.forEach((label) => {
      if (seen.has(label)) {
        return;
      }
      seen.add(label);
      labels.push(label);
    });
  });

  return labels;
}

export function buildFixedEventDebugEntry(
  event: FixedEventEntry,
  options?: {
    completedEventIds?: string[];
  }
): FixedEventDebugEntry {
  let choiceSummaries: FixedEventDebugChoiceSummary[] = [];
  
  if (event.nodes && event.startNodeId) {
    const rawChoices = Object.values(event.nodes).flatMap(node => node.choices || []);
    choiceSummaries = rawChoices.map((choice, index) => buildChoiceSummary(choice as any, index));
  } else {
    choiceSummaries = (Array.isArray(event.choices) ? event.choices : []).map(buildChoiceSummary);
  }
  
  const completedSet = new Set(options?.completedEventIds ?? []);
  
  const rawId = event.id ?? event.eventId;
  const eventId = typeof rawId === "string" && rawId.trim().length > 0 ? rawId.trim() : "unknown_event";
  
  const rawTargetName = event.label ?? event.eventName;
  const eventName = typeof rawTargetName === "string" && rawTargetName.trim().length > 0 ? rawTargetName.trim() : "고정 이벤트";
  
  const week = Math.max(1, Math.round(event.triggerTiming?.week ?? 1));
  const day = Math.max(1, Math.min(DAY_CYCLE.length, Math.round(event.triggerTiming?.day ?? 1)));
  const locationLabel =
    typeof event.location === "string" && event.location.trim().length > 0 ? event.location.trim() : "전체 지도";
  const locationId = resolveFixedEventLocationId(locationLabel, "world");

  return {
    eventId,
    eventName,
    week,
    day,
    dayLabel: DAY_CYCLE[day - 1],
    timeOfDay: typeof event.triggerTiming?.timeOfDay === "string" && event.triggerTiming.timeOfDay.trim().length > 0
      ? event.triggerTiming.timeOfDay.trim()
      : "오전",
    locationLabel,
    areaId: resolveFixedEventRenderArea(locationId),
    isRepeatable: event.isRepeatable === true,
    isCompleted: completedSet.has(eventId),
    previewText: summarizePreview(event),
    requirementLabels: collectEventRequirements(choiceSummaries),
    choiceSummaries
  };
}
