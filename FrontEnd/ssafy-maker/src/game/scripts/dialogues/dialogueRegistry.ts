import type { DialogueScript } from "../../../common/types/dialogue";

export const DIALOGUE_REGISTRY: Record<string, DialogueScript> = {};

export function setDialogueRegistry(dialogues: Record<string, DialogueScript>): void {
  Object.keys(DIALOGUE_REGISTRY).forEach((key) => {
    delete DIALOGUE_REGISTRY[key];
  });
  Object.assign(DIALOGUE_REGISTRY, dialogues);
}

export function resolveRegisteredDialogue(dialogueId: string): DialogueScript | null {
  return DIALOGUE_REGISTRY[dialogueId] ?? null;
}
