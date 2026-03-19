import { TIME_CYCLE } from "@features/progression/services/timeProgression";
import { matchesFixedEventLocation, normalizeFixedEventLocationToken } from "./fixedEventLocation";
import { FIXED_EVENT_INTERACTION_NPC_ASSET_KEYS, getFixedEventInteractionDialogues } from "./fixedEventTriggerPolicy";
import type { FixedEventDialogueEntry, FixedEventEntry } from "./jsonDialogueAdapter";

export type FixedEventRenderArea = "campus" | "downtown" | "world";
export type FixedEventLocationId = FixedEventRenderArea | "home" | "cafe" | "store";

export type FixedEventNpcSlot = {
  x: number;
  y: number;
  labelOffsetX: number;
  labelOffsetY: number;
  flashColor: number;
};

type FixedEventTimeLabel = (typeof TIME_CYCLE)[number];
type FixedEventNpcEntry = {
  speakerId: string;
  label: string;
  textureKey: string;
};

type FixedEventNpcSlotMap = Record<FixedEventLocationId, Record<FixedEventTimeLabel, FixedEventNpcSlot[]>>;

export type FixedEventNpcPresentationEntry = FixedEventNpcEntry & {
  slot: FixedEventNpcSlot;
};

export type FixedEventNpcPresentation = {
  eventId?: string;
  renderArea: FixedEventRenderArea;
  participants: FixedEventNpcPresentationEntry[];
};

export const FIXED_EVENT_SCHEDULED_NPC_SLOT_COUNT = 4;

const FIXED_EVENT_NPC_LABELS: Partial<Record<string, string>> = {
  NPC_CLASSMATE_MYUNGJIN: "\uBA85\uC9C4",
  NPC_CLASSMATE_JIWOO: "\uC9C0\uC6B0",
  NPC_CLASSMATE_YEONWOONG: "\uC5F0\uC6C5",
  NPC_CLASSMATE_HYORYEON: "\uD6A8\uB828",
  NPC_CLASSMATE_JONGMIN: "\uC885\uBBFC",
  NPC_PRO_SUNMI: "\uC870\uC120\uBBF8 \uD504\uB85C",
  NPC_PRO_DOYEON: "\uAE40\uB3C4\uC5F0 \uD504\uB85C",
  NPC_CONSULTANT_HYUNSEOK: "\uC774\uD604\uC11D \uCEE8\uC124\uD134\uD2B8",
};

const EVENT_FIELD_SPEAKER_EXCLUDED_IDS = new Set(["SYSTEM", "PLAYER"]);

const FIXED_EVENT_CANONICAL_LOCATIONS: FixedEventLocationId[] = ["campus", "downtown", "world", "home", "cafe", "store"];

const FIXED_EVENT_NPC_SLOTS: FixedEventNpcSlotMap = {
  campus: {
    [TIME_CYCLE[0]]: [
      { x: 250, y: 214, labelOffsetX: -34, labelOffsetY: 34, flashColor: 0xb97ad8 },
      { x: 330, y: 238, labelOffsetX: -34, labelOffsetY: 34, flashColor: 0x6cb5ff },
      { x: 410, y: 214, labelOffsetX: -34, labelOffsetY: 34, flashColor: 0x8bd676 },
      { x: 490, y: 238, labelOffsetX: -34, labelOffsetY: 34, flashColor: 0xffb870 },
    ],
    [TIME_CYCLE[1]]: [
      { x: 600, y: 292, labelOffsetX: -34, labelOffsetY: 34, flashColor: 0xb97ad8 },
      { x: 678, y: 318, labelOffsetX: -34, labelOffsetY: 34, flashColor: 0x6cb5ff },
      { x: 756, y: 292, labelOffsetX: -34, labelOffsetY: 34, flashColor: 0x8bd676 },
      { x: 834, y: 318, labelOffsetX: -34, labelOffsetY: 34, flashColor: 0xffb870 },
    ],
    [TIME_CYCLE[2]]: [
      { x: 280, y: 404, labelOffsetX: -34, labelOffsetY: 34, flashColor: 0xb97ad8 },
      { x: 360, y: 430, labelOffsetX: -34, labelOffsetY: 34, flashColor: 0x6cb5ff },
      { x: 440, y: 404, labelOffsetX: -34, labelOffsetY: 34, flashColor: 0x8bd676 },
      { x: 520, y: 430, labelOffsetX: -34, labelOffsetY: 34, flashColor: 0xffb870 },
    ],
    [TIME_CYCLE[3]]: [
      { x: 690, y: 418, labelOffsetX: -34, labelOffsetY: 34, flashColor: 0xb97ad8 },
      { x: 764, y: 444, labelOffsetX: -34, labelOffsetY: 34, flashColor: 0x6cb5ff },
      { x: 838, y: 418, labelOffsetX: -34, labelOffsetY: 34, flashColor: 0x8bd676 },
      { x: 912, y: 444, labelOffsetX: -34, labelOffsetY: 34, flashColor: 0xffb870 },
    ],
  },
  downtown: {
    [TIME_CYCLE[0]]: [
      { x: 272, y: 248, labelOffsetX: -34, labelOffsetY: 34, flashColor: 0xb97ad8 },
      { x: 350, y: 274, labelOffsetX: -34, labelOffsetY: 34, flashColor: 0x6cb5ff },
      { x: 428, y: 248, labelOffsetX: -34, labelOffsetY: 34, flashColor: 0x8bd676 },
      { x: 506, y: 274, labelOffsetX: -34, labelOffsetY: 34, flashColor: 0xffb870 },
    ],
    [TIME_CYCLE[1]]: [
      { x: 520, y: 332, labelOffsetX: -34, labelOffsetY: 34, flashColor: 0xb97ad8 },
      { x: 598, y: 358, labelOffsetX: -34, labelOffsetY: 34, flashColor: 0x6cb5ff },
      { x: 676, y: 332, labelOffsetX: -34, labelOffsetY: 34, flashColor: 0x8bd676 },
      { x: 754, y: 358, labelOffsetX: -34, labelOffsetY: 34, flashColor: 0xffb870 },
    ],
    [TIME_CYCLE[2]]: [
      { x: 346, y: 438, labelOffsetX: -34, labelOffsetY: 34, flashColor: 0xb97ad8 },
      { x: 424, y: 464, labelOffsetX: -34, labelOffsetY: 34, flashColor: 0x6cb5ff },
      { x: 502, y: 438, labelOffsetX: -34, labelOffsetY: 34, flashColor: 0x8bd676 },
      { x: 580, y: 464, labelOffsetX: -34, labelOffsetY: 34, flashColor: 0xffb870 },
    ],
    [TIME_CYCLE[3]]: [
      { x: 688, y: 432, labelOffsetX: -34, labelOffsetY: 34, flashColor: 0xb97ad8 },
      { x: 762, y: 456, labelOffsetX: -34, labelOffsetY: 34, flashColor: 0x6cb5ff },
      { x: 836, y: 432, labelOffsetX: -34, labelOffsetY: 34, flashColor: 0x8bd676 },
      { x: 910, y: 456, labelOffsetX: -34, labelOffsetY: 34, flashColor: 0xffb870 },
    ],
  },
  world: {
    [TIME_CYCLE[0]]: [
      { x: 448, y: 246, labelOffsetX: -34, labelOffsetY: 34, flashColor: 0xb97ad8 },
      { x: 510, y: 272, labelOffsetX: -34, labelOffsetY: 34, flashColor: 0x6cb5ff },
      { x: 572, y: 246, labelOffsetX: -34, labelOffsetY: 34, flashColor: 0x8bd676 },
      { x: 634, y: 272, labelOffsetX: -34, labelOffsetY: 34, flashColor: 0xffb870 },
    ],
    [TIME_CYCLE[1]]: [
      { x: 452, y: 286, labelOffsetX: -34, labelOffsetY: 34, flashColor: 0xb97ad8 },
      { x: 514, y: 312, labelOffsetX: -34, labelOffsetY: 34, flashColor: 0x6cb5ff },
      { x: 576, y: 286, labelOffsetX: -34, labelOffsetY: 34, flashColor: 0x8bd676 },
      { x: 638, y: 312, labelOffsetX: -34, labelOffsetY: 34, flashColor: 0xffb870 },
    ],
    [TIME_CYCLE[2]]: [
      { x: 444, y: 332, labelOffsetX: -34, labelOffsetY: 34, flashColor: 0xb97ad8 },
      { x: 506, y: 356, labelOffsetX: -34, labelOffsetY: 34, flashColor: 0x6cb5ff },
      { x: 568, y: 332, labelOffsetX: -34, labelOffsetY: 34, flashColor: 0x8bd676 },
      { x: 630, y: 356, labelOffsetX: -34, labelOffsetY: 34, flashColor: 0xffb870 },
    ],
    [TIME_CYCLE[3]]: [
      { x: 438, y: 380, labelOffsetX: -34, labelOffsetY: 34, flashColor: 0xb97ad8 },
      { x: 500, y: 404, labelOffsetX: -34, labelOffsetY: 34, flashColor: 0x6cb5ff },
      { x: 562, y: 380, labelOffsetX: -34, labelOffsetY: 34, flashColor: 0x8bd676 },
      { x: 624, y: 404, labelOffsetX: -34, labelOffsetY: 34, flashColor: 0xffb870 },
    ],
  },
  home: {
    [TIME_CYCLE[0]]: [
      { x: 440, y: 250, labelOffsetX: -34, labelOffsetY: 34, flashColor: 0xb97ad8 },
      { x: 496, y: 278, labelOffsetX: -34, labelOffsetY: 34, flashColor: 0x6cb5ff },
      { x: 552, y: 250, labelOffsetX: -34, labelOffsetY: 34, flashColor: 0x8bd676 },
      { x: 608, y: 278, labelOffsetX: -34, labelOffsetY: 34, flashColor: 0xffb870 },
    ],
    [TIME_CYCLE[1]]: [
      { x: 440, y: 250, labelOffsetX: -34, labelOffsetY: 34, flashColor: 0xb97ad8 },
      { x: 496, y: 278, labelOffsetX: -34, labelOffsetY: 34, flashColor: 0x6cb5ff },
      { x: 552, y: 250, labelOffsetX: -34, labelOffsetY: 34, flashColor: 0x8bd676 },
      { x: 608, y: 278, labelOffsetX: -34, labelOffsetY: 34, flashColor: 0xffb870 },
    ],
    [TIME_CYCLE[2]]: [
      { x: 432, y: 300, labelOffsetX: -34, labelOffsetY: 34, flashColor: 0xb97ad8 },
      { x: 488, y: 328, labelOffsetX: -34, labelOffsetY: 34, flashColor: 0x6cb5ff },
      { x: 544, y: 300, labelOffsetX: -34, labelOffsetY: 34, flashColor: 0x8bd676 },
      { x: 600, y: 328, labelOffsetX: -34, labelOffsetY: 34, flashColor: 0xffb870 },
    ],
    [TIME_CYCLE[3]]: [
      { x: 424, y: 346, labelOffsetX: -34, labelOffsetY: 34, flashColor: 0xb97ad8 },
      { x: 480, y: 372, labelOffsetX: -34, labelOffsetY: 34, flashColor: 0x6cb5ff },
      { x: 536, y: 346, labelOffsetX: -34, labelOffsetY: 34, flashColor: 0x8bd676 },
      { x: 592, y: 372, labelOffsetX: -34, labelOffsetY: 34, flashColor: 0xffb870 },
    ],
  },
  cafe: {
    [TIME_CYCLE[0]]: [
      { x: 350, y: 462, labelOffsetX: -34, labelOffsetY: 34, flashColor: 0xb97ad8 },
      { x: 404, y: 486, labelOffsetX: -34, labelOffsetY: 34, flashColor: 0x6cb5ff },
      { x: 458, y: 462, labelOffsetX: -34, labelOffsetY: 34, flashColor: 0x8bd676 },
      { x: 512, y: 486, labelOffsetX: -34, labelOffsetY: 34, flashColor: 0xffb870 },
    ],
    [TIME_CYCLE[1]]: [
      { x: 350, y: 462, labelOffsetX: -34, labelOffsetY: 34, flashColor: 0xb97ad8 },
      { x: 404, y: 486, labelOffsetX: -34, labelOffsetY: 34, flashColor: 0x6cb5ff },
      { x: 458, y: 462, labelOffsetX: -34, labelOffsetY: 34, flashColor: 0x8bd676 },
      { x: 512, y: 486, labelOffsetX: -34, labelOffsetY: 34, flashColor: 0xffb870 },
    ],
    [TIME_CYCLE[2]]: [
      { x: 336, y: 508, labelOffsetX: -34, labelOffsetY: 34, flashColor: 0xb97ad8 },
      { x: 392, y: 534, labelOffsetX: -34, labelOffsetY: 34, flashColor: 0x6cb5ff },
      { x: 448, y: 508, labelOffsetX: -34, labelOffsetY: 34, flashColor: 0x8bd676 },
      { x: 504, y: 534, labelOffsetX: -34, labelOffsetY: 34, flashColor: 0xffb870 },
    ],
    [TIME_CYCLE[3]]: [
      { x: 322, y: 548, labelOffsetX: -34, labelOffsetY: 34, flashColor: 0xb97ad8 },
      { x: 378, y: 572, labelOffsetX: -34, labelOffsetY: 34, flashColor: 0x6cb5ff },
      { x: 434, y: 548, labelOffsetX: -34, labelOffsetY: 34, flashColor: 0x8bd676 },
      { x: 490, y: 572, labelOffsetX: -34, labelOffsetY: 34, flashColor: 0xffb870 },
    ],
  },
  store: {
    [TIME_CYCLE[0]]: [
      { x: 730, y: 232, labelOffsetX: -34, labelOffsetY: 34, flashColor: 0xb97ad8 },
      { x: 786, y: 258, labelOffsetX: -34, labelOffsetY: 34, flashColor: 0x6cb5ff },
      { x: 842, y: 232, labelOffsetX: -34, labelOffsetY: 34, flashColor: 0x8bd676 },
      { x: 898, y: 258, labelOffsetX: -34, labelOffsetY: 34, flashColor: 0xffb870 },
    ],
    [TIME_CYCLE[1]]: [
      { x: 730, y: 232, labelOffsetX: -34, labelOffsetY: 34, flashColor: 0xb97ad8 },
      { x: 786, y: 258, labelOffsetX: -34, labelOffsetY: 34, flashColor: 0x6cb5ff },
      { x: 842, y: 232, labelOffsetX: -34, labelOffsetY: 34, flashColor: 0x8bd676 },
      { x: 898, y: 258, labelOffsetX: -34, labelOffsetY: 34, flashColor: 0xffb870 },
    ],
    [TIME_CYCLE[2]]: [
      { x: 716, y: 286, labelOffsetX: -34, labelOffsetY: 34, flashColor: 0xb97ad8 },
      { x: 772, y: 312, labelOffsetX: -34, labelOffsetY: 34, flashColor: 0x6cb5ff },
      { x: 828, y: 286, labelOffsetX: -34, labelOffsetY: 34, flashColor: 0x8bd676 },
      { x: 884, y: 312, labelOffsetX: -34, labelOffsetY: 34, flashColor: 0xffb870 },
    ],
    [TIME_CYCLE[3]]: [
      { x: 702, y: 338, labelOffsetX: -34, labelOffsetY: 34, flashColor: 0xb97ad8 },
      { x: 758, y: 364, labelOffsetX: -34, labelOffsetY: 34, flashColor: 0x6cb5ff },
      { x: 814, y: 338, labelOffsetX: -34, labelOffsetY: 34, flashColor: 0x8bd676 },
      { x: 870, y: 364, labelOffsetX: -34, labelOffsetY: 34, flashColor: 0xffb870 },
    ],
  },
};

function isFixedEventTimeLabel(value: string): value is FixedEventTimeLabel {
  return TIME_CYCLE.includes(value as FixedEventTimeLabel);
}

function normalizeFixedEventTimeLabel(value: unknown): FixedEventTimeLabel {
  if (typeof value === "string" && isFixedEventTimeLabel(value)) {
    return value;
  }
  return TIME_CYCLE[0];
}

function normalizeFixedEventNpcSlots(
  location: FixedEventLocationId,
  timeLabel: FixedEventTimeLabel,
  slots: FixedEventNpcSlot[]
): FixedEventNpcSlot[] {
  const fallbackSlots = FIXED_EVENT_NPC_SLOTS[location][TIME_CYCLE[0]] ?? [];

  if (slots.length === FIXED_EVENT_SCHEDULED_NPC_SLOT_COUNT) {
    return slots;
  }

  console.warn("[fixed-event] unexpected scheduled NPC slot count", {
    location,
    timeLabel,
    expected: FIXED_EVENT_SCHEDULED_NPC_SLOT_COUNT,
    actual: slots.length
  });

  return Array.from({ length: FIXED_EVENT_SCHEDULED_NPC_SLOT_COUNT }, (_, index) => slots[index] ?? fallbackSlots[index]).filter(
    (slot): slot is FixedEventNpcSlot => Boolean(slot)
  );
}

function getFixedEventNpcSlotsForLocation(location: FixedEventLocationId, timeOfDay: unknown): FixedEventNpcSlot[] {
  const timeLabel = normalizeFixedEventTimeLabel(timeOfDay);
  const slots = FIXED_EVENT_NPC_SLOTS[location][timeLabel] ?? FIXED_EVENT_NPC_SLOTS[location][TIME_CYCLE[0]] ?? [];
  return normalizeFixedEventNpcSlots(location, timeLabel, slots);
}

function buildNpcEntry(entry: FixedEventDialogueEntry): FixedEventNpcEntry | null {
  if (typeof entry.speakerId !== "string") return null;

  const speakerId = entry.speakerId.trim();
  if (!speakerId || EVENT_FIELD_SPEAKER_EXCLUDED_IDS.has(speakerId)) return null;

  const textureKey = FIXED_EVENT_INTERACTION_NPC_ASSET_KEYS[speakerId];
  if (!textureKey) return null;

  const label =
    typeof entry.speakerName === "string" && entry.speakerName.trim().length > 0
      ? entry.speakerName.trim()
      : FIXED_EVENT_NPC_LABELS[speakerId] ?? speakerId;

  return { speakerId, label, textureKey };
}

function collectUniqueEventNpcs(entries: FixedEventDialogueEntry[]): FixedEventNpcEntry[] {
  const participants: FixedEventNpcEntry[] = [];
  const seen = new Set<string>();

  entries.forEach((entry) => {
    const participant = buildNpcEntry(entry);
    if (!participant || seen.has(participant.speakerId)) return;
    seen.add(participant.speakerId);
    participants.push(participant);
  });

  return participants;
}

export function resolveCurrentFixedEventLocation(currentArea: FixedEventRenderArea, lastSelectedWorldPlace: string): FixedEventLocationId {
  if (currentArea === "campus" || currentArea === "downtown") {
    return currentArea;
  }

  const normalizedPlace = normalizeFixedEventLocationToken(lastSelectedWorldPlace);
  if (normalizedPlace === "home" || normalizedPlace === "cafe" || normalizedPlace === "store") {
    return normalizedPlace;
  }

  return "world";
}

export function resolveFixedEventLocationId(rawLocation: unknown, fallbackLocation: FixedEventLocationId): FixedEventLocationId {
  for (const locationId of FIXED_EVENT_CANONICAL_LOCATIONS) {
    if (matchesFixedEventLocation(rawLocation, locationId)) {
      return locationId;
    }
  }

  return fallbackLocation;
}

export function resolveFixedEventRenderArea(location: FixedEventLocationId): FixedEventRenderArea {
  if (location === "campus" || location === "downtown") {
    return location;
  }

  return "world";
}

export function getDefaultFixedEventNpcSlotsForArea(area: FixedEventRenderArea, timeOfDay: unknown): FixedEventNpcSlot[] {
  return getFixedEventNpcSlotsForLocation(area, timeOfDay);
}

export function getFixedEventPresentNpcs(event: FixedEventEntry | null | undefined): FixedEventNpcEntry[] {
  if (!event) return [];
  return collectUniqueEventNpcs(getFixedEventInteractionDialogues(event));
}

export function buildFixedEventNpcPresentation(
  event: FixedEventEntry | null | undefined,
  context: {
    currentLocation: FixedEventLocationId;
    timeOfDay: unknown;
  }
): FixedEventNpcPresentation | null {
  const participants = getFixedEventPresentNpcs(event);
  if (!event || participants.length === 0) {
    return null;
  }

  const location = resolveFixedEventLocationId(event.location, context.currentLocation);
  const renderArea = resolveFixedEventRenderArea(location);
  const slots = getFixedEventNpcSlotsForLocation(
    location,
    typeof event.triggerTiming?.timeOfDay === "string" ? event.triggerTiming.timeOfDay : context.timeOfDay
  );

  return {
    eventId: typeof event.eventId === "string" && event.eventId.trim().length > 0 ? event.eventId.trim() : undefined,
    renderArea,
    participants: participants
      .slice(0, slots.length)
      .map((participant, index) => ({
        ...participant,
        slot: slots[index],
      })),
  };
}
