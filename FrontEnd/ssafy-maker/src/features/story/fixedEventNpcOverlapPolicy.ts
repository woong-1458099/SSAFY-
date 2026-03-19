import type { FixedEventNpcPresentation } from "./fixedEventNpcPresence";
import type { AreaNpcConfig } from "./npcPositions";
import { getFixedEventEntries, type FixedEventEntry } from "./jsonDialogueAdapter";
import { getFixedEventPresentNpcs } from "./fixedEventNpcPresence";

export function collectFixedEventHiddenNpcTextureKeys(
  presentation: FixedEventNpcPresentation | null | undefined,
  persistedTextureKeys: Iterable<string> = []
): Set<string> {
  const hiddenTextureKeys = new Set<string>();

  for (const textureKey of persistedTextureKeys) {
    if (typeof textureKey === "string" && textureKey.trim().length > 0) {
      hiddenTextureKeys.add(textureKey.trim());
    }
  }

  presentation?.participants.forEach((participant) => {
    if (participant.textureKey.trim().length > 0) {
      hiddenTextureKeys.add(participant.textureKey);
    }
  });

  return hiddenTextureKeys;
}

export function shouldHideAreaNpcForFixedEvent(config: AreaNpcConfig, hiddenTextureKeys: ReadonlySet<string>): boolean {
  return typeof config.textureKey === "string" && hiddenTextureKeys.has(config.textureKey);
}

export function collectActiveFixedEventSlotNpcTextureKeys(
  rawData: unknown,
  context: {
    week: number;
    day: number;
    timeOfDay: string;
  },
  completedEventIds: Iterable<string>
): Set<string> {
  const completedSet = new Set(completedEventIds);
  const textureKeys = new Set<string>();
  const targetTime = typeof context.timeOfDay === "string" ? context.timeOfDay.trim() : "";

  getFixedEventEntries(rawData).forEach((event: FixedEventEntry) => {
    const timing = event.triggerTiming;
    if (!timing || event.eventType !== "FIXED") return;

    const eventId = typeof event.eventId === "string" ? event.eventId.trim() : "";
    if (event.isRepeatable !== true && eventId && completedSet.has(eventId)) {
      return;
    }

    const sameWeek = Math.round(timing.week ?? -1) === context.week;
    const sameDay = Math.round(timing.day ?? -1) === context.day;
    const sameTime = (typeof timing.timeOfDay === "string" ? timing.timeOfDay.trim() : "") === targetTime;
    if (!sameWeek || !sameDay || !sameTime) {
      return;
    }

    getFixedEventPresentNpcs(event).forEach((participant) => {
      textureKeys.add(participant.textureKey);
    });
  });

  return textureKeys;
}
