import type { FixedEventDialogueEntry, FixedEventEntry } from "./jsonDialogueAdapter";

export type FixedEventTriggerPolicy = "npc_interaction" | "auto";

export const FIXED_EVENT_INTERACTION_NPC_ASSET_KEYS: Partial<Record<string, string>> = {
  NPC_CLASSMATE_MINSU: "fixed-npc-minsu",
  NPC_CLASSMATE_MYUNGJIN: "fixed-npc-myungjin",
  NPC_CLASSMATE_JIWOO: "fixed-npc-jiwoo",
  NPC_CLASSMATE_YEONWOONG: "fixed-npc-yeonwoong",
  NPC_CLASSMATE_HYORYEON: "fixed-npc-hyoryeon",
  NPC_CLASSMATE_JONGMIN: "fixed-npc-jongmin",
  NPC_PRO_SUNMI: "fixed-npc-sunmi",
  NPC_PRO_DOYEON: "fixed-npc-doyeon",
  NPC_CONSULTANT_HYUNSEOK: "fixed-npc-hyunseok",
};

export function isFixedEventInteractionNpcSpeakerId(speakerId: unknown): speakerId is string {
  if (typeof speakerId !== "string") {
    return false;
  }

  return Boolean(FIXED_EVENT_INTERACTION_NPC_ASSET_KEYS[speakerId.trim()]);
}

export function getFixedEventInteractionDialogues(event: FixedEventEntry | null | undefined): FixedEventDialogueEntry[] {
  if (!Array.isArray(event?.dialogues)) {
    return [];
  }

  return event.dialogues.filter((entry) => isFixedEventInteractionNpcSpeakerId(entry.speakerId));
}

export function hasFixedEventInteractionNpc(event: FixedEventEntry | null | undefined): boolean {
  return getFixedEventInteractionDialogues(event).length > 0;
}

export function getFixedEventTriggerPolicy(event: FixedEventEntry | null | undefined): FixedEventTriggerPolicy {
  return hasFixedEventInteractionNpc(event) ? "npc_interaction" : "auto";
}
