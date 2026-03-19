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
export const FIXED_EVENT_NPC_LABEL_COLOR = "#000000";

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
const FIXED_EVENT_SHARED_SLOT: FixedEventNpcSlot = {
  x: 800,
  y: 530,
  labelOffsetX: 0,
  labelOffsetY: 34,
  flashColor: 0xb97ad8,
};

function createSharedFixedEventNpcSlots(): FixedEventNpcSlot[] {
  return Array.from({ length: FIXED_EVENT_SCHEDULED_NPC_SLOT_COUNT }, () => ({
    ...FIXED_EVENT_SHARED_SLOT,
  }));
}

const FIXED_EVENT_NPC_SLOTS: FixedEventNpcSlotMap = {
  campus: {
    [TIME_CYCLE[0]]: createSharedFixedEventNpcSlots(),
    [TIME_CYCLE[1]]: createSharedFixedEventNpcSlots(),
    [TIME_CYCLE[2]]: createSharedFixedEventNpcSlots(),
    [TIME_CYCLE[3]]: createSharedFixedEventNpcSlots(),
  },
  downtown: {
    [TIME_CYCLE[0]]: createSharedFixedEventNpcSlots(),
    [TIME_CYCLE[1]]: createSharedFixedEventNpcSlots(),
    [TIME_CYCLE[2]]: createSharedFixedEventNpcSlots(),
    [TIME_CYCLE[3]]: createSharedFixedEventNpcSlots(),
  },
  world: {
    [TIME_CYCLE[0]]: createSharedFixedEventNpcSlots(),
    [TIME_CYCLE[1]]: createSharedFixedEventNpcSlots(),
    [TIME_CYCLE[2]]: createSharedFixedEventNpcSlots(),
    [TIME_CYCLE[3]]: createSharedFixedEventNpcSlots(),
  },
  home: {
    [TIME_CYCLE[0]]: createSharedFixedEventNpcSlots(),
    [TIME_CYCLE[1]]: createSharedFixedEventNpcSlots(),
    [TIME_CYCLE[2]]: createSharedFixedEventNpcSlots(),
    [TIME_CYCLE[3]]: createSharedFixedEventNpcSlots(),
  },
  cafe: {
    [TIME_CYCLE[0]]: createSharedFixedEventNpcSlots(),
    [TIME_CYCLE[1]]: createSharedFixedEventNpcSlots(),
    [TIME_CYCLE[2]]: createSharedFixedEventNpcSlots(),
    [TIME_CYCLE[3]]: createSharedFixedEventNpcSlots(),
  },
  store: {
    [TIME_CYCLE[0]]: createSharedFixedEventNpcSlots(),
    [TIME_CYCLE[1]]: createSharedFixedEventNpcSlots(),
    [TIME_CYCLE[2]]: createSharedFixedEventNpcSlots(),
    [TIME_CYCLE[3]]: createSharedFixedEventNpcSlots(),
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
