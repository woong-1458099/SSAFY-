import { getNpcIdleTextureKey } from "../../common/assets/assetKeys";
import type { AreaId } from "../../common/enums/area";
import type { FixedEventDialogueEntry, FixedEventEntry } from "./jsonDialogueAdapter";
import { matchesFixedEventLocation } from "./fixedEventLocation";

export type FixedEventRenderArea = AreaId;
export type FixedEventLocationId = FixedEventRenderArea | "home" | "cafe" | "store";

export type FixedEventNpcSlot = {
  x: number;
  y: number;
  labelOffsetX: number;
  labelOffsetY: number;
  flashColor: number;
};

type FixedEventNpcEntry = {
  speakerId: string;
  label: string;
  textureKey: string;
};

export type FixedEventNpcPresentationEntry = FixedEventNpcEntry & {
  slot: FixedEventNpcSlot;
};

export type FixedEventNpcPresentation = {
  eventId?: string;
  renderArea: FixedEventRenderArea;
  participants: FixedEventNpcPresentationEntry[];
};

export const FIXED_EVENT_SCHEDULED_NPC_SLOT_COUNT = 4;
export const FIXED_EVENT_NPC_LABEL_COLOR = "#fff6d0";

const FIXED_EVENT_SPEAKER_LABELS: Partial<Record<string, string>> = {
  NPC_CLASSMATE_MYUNGJIN: "명진",
  NPC_CLASSMATE_JIWOO: "지우",
  NPC_CLASSMATE_YEONWOONG: "연웅",
  NPC_CLASSMATE_HYORYEON: "효련",
  NPC_CLASSMATE_JONGMIN: "종민",
  NPC_PRO_SUNMI: "조선미 프로",
  NPC_PRO_DOYEON: "김도연 프로",
  NPC_CONSULTANT_HYUNSEOK: "이현석 컨설턴트"
};

const FIXED_EVENT_SPEAKER_TEXTURE_KEYS: Partial<Record<string, string>> = {
  NPC_CLASSMATE_MYUNGJIN: getNpcIdleTextureKey("myungjin"),
  NPC_CLASSMATE_JIWOO: getNpcIdleTextureKey("jiwoo"),
  NPC_CLASSMATE_YEONWOONG: getNpcIdleTextureKey("yeonwoong"),
  NPC_CLASSMATE_HYORYEON: getNpcIdleTextureKey("hyoryeon"),
  NPC_CLASSMATE_JONGMIN: getNpcIdleTextureKey("jongmin"),
  NPC_PRO_SUNMI: getNpcIdleTextureKey("sunmi"),
  NPC_PRO_DOYEON: getNpcIdleTextureKey("doyeon"),
  NPC_CONSULTANT_HYUNSEOK: getNpcIdleTextureKey("hyunseok")
};

const EXCLUDED_SPEAKER_IDS = new Set(["SYSTEM", "PLAYER"]);

function createSharedSlots(baseX: number, baseY: number): FixedEventNpcSlot[] {
  return Array.from({ length: FIXED_EVENT_SCHEDULED_NPC_SLOT_COUNT }, (_, index) => ({
    x: baseX + index * 100,
    y: baseY,
    labelOffsetX: 0,
    labelOffsetY: 44,
    flashColor: 0xf2d4ff
  }));
}

const FIXED_EVENT_NPC_SLOTS: Record<FixedEventLocationId, FixedEventNpcSlot[]> = {
  campus: createSharedSlots(760, 468),
  classroom: createSharedSlots(760, 468),
  downtown: createSharedSlots(760, 468),
  world: createSharedSlots(760, 468),
  home: createSharedSlots(760, 468),
  cafe: createSharedSlots(760, 468),
  store: createSharedSlots(760, 468)
};

function buildNpcEntry(entry: FixedEventDialogueEntry): FixedEventNpcEntry | null {
  if (typeof entry.speakerId !== "string") {
    return null;
  }

  const speakerId = entry.speakerId.trim();
  if (!speakerId || EXCLUDED_SPEAKER_IDS.has(speakerId)) {
    return null;
  }

  const textureKey = FIXED_EVENT_SPEAKER_TEXTURE_KEYS[speakerId];
  if (!textureKey) {
    return null;
  }

  const label =
    typeof entry.speakerName === "string" && entry.speakerName.trim().length > 0
      ? entry.speakerName.trim()
      : FIXED_EVENT_SPEAKER_LABELS[speakerId] ?? speakerId;

  return { speakerId, label, textureKey };
}

function collectUniqueParticipants(entries: FixedEventDialogueEntry[]): FixedEventNpcEntry[] {
  const participants: FixedEventNpcEntry[] = [];
  const seen = new Set<string>();

  entries.forEach((entry) => {
    const participant = buildNpcEntry(entry);
    if (!participant || seen.has(participant.speakerId)) {
      return;
    }

    seen.add(participant.speakerId);
    participants.push(participant);
  });

  return participants;
}

function extractDialogueEntriesFromGraphNodes(nodes: FixedEventEntry["nodes"]): FixedEventDialogueEntry[] {
  if (!nodes || typeof nodes !== "object") {
    return [];
  }

  return Object.values(nodes)
    .filter((node): node is NonNullable<typeof node> => Boolean(node && typeof node === "object"))
    .map((node) => ({
      speakerId: typeof node.speakerId === "string" ? node.speakerId : undefined,
      speakerName: typeof node.speaker === "string" ? node.speaker : undefined
    }));
}

export function resolveFixedEventLocationId(rawLocation: unknown, fallbackLocation: FixedEventLocationId): FixedEventLocationId {
  const candidates: FixedEventLocationId[] = ["campus", "downtown", "world", "home", "cafe", "store"];
  return candidates.find((locationId) => matchesFixedEventLocation(rawLocation, locationId)) ?? fallbackLocation;
}

export function resolveFixedEventRenderArea(location: FixedEventLocationId): FixedEventRenderArea {
  if (location === "campus" || location === "downtown" || location === "classroom") {
    return location;
  }

  return "world";
}

export function buildFixedEventNpcPresentation(
  event: FixedEventEntry | null | undefined,
  options: {
    fallbackLocation: FixedEventLocationId;
  }
): FixedEventNpcPresentation | null {
  if (!event) {
    return null;
  }

  const dialogueEntries = Array.isArray(event.dialogues) ? event.dialogues : extractDialogueEntriesFromGraphNodes(event.nodes);
  const participants = collectUniqueParticipants(dialogueEntries);
  if (participants.length === 0) {
    return null;
  }

  const location = resolveFixedEventLocationId(event.location, options.fallbackLocation);
  const renderArea = resolveFixedEventRenderArea(location);
  const slots = FIXED_EVENT_NPC_SLOTS[location] ?? FIXED_EVENT_NPC_SLOTS[renderArea];

  const rawEventId = event.id ?? event.eventId;
  return {
    eventId: typeof rawEventId === "string" && rawEventId.trim().length > 0 ? rawEventId.trim() : undefined,
    renderArea,
    participants: participants.slice(0, slots.length).map((participant, index) => ({
      ...participant,
      slot: slots[index]
    }))
  };
}
