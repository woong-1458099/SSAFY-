import type { DialogueChoice, DialogueNode, NpcDialogueId, NpcDialogueScript } from "./npcDialogueScripts";

type FixedEventDialogueEntry = {
  speakerId?: string;
  speakerName?: string;
  text?: string;
};

type FixedEventChoiceEntry = {
  choiceId?: number;
  text?: string;
  result?: {
    feedbackText?: string;
  };
};

type FixedEventEntry = {
  eventName?: string;
  dialogues?: FixedEventDialogueEntry[];
  choices?: FixedEventChoiceEntry[];
};

const SPEAKER_LABEL_BY_ID: Record<string, string> = {
  SYSTEM: "SYSTEM",
  PLAYER: "PLAYER"
};

function normalizeText(value: unknown, fallback: string): string {
  return typeof value === "string" && value.trim().length > 0 ? value : fallback;
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

export function buildDialogueScriptFromFixedEventJson(
  dialogueId: NpcDialogueId,
  rawData: unknown,
  fallbackNpcLabel: string
): NpcDialogueScript | null {
  if (!Array.isArray(rawData) || rawData.length === 0) {
    return null;
  }

  const firstEvent = rawData[0] as FixedEventEntry | undefined;
  if (!firstEvent) {
    return null;
  }

  const dialogues = Array.isArray(firstEvent.dialogues) ? firstEvent.dialogues : [];
  const choices = Array.isArray(firstEvent.choices) ? firstEvent.choices : [];
  if (dialogues.length === 0) {
    return null;
  }

  const nodes: Record<string, DialogueNode> = {};
  const npcLabel =
    dialogues.find((entry) => entry.speakerName && entry.speakerName.trim().length > 0)?.speakerName ??
    fallbackNpcLabel;

  dialogues.forEach((entry, index) => {
    const id = `json_dialogue_${index + 1}`;
    const nextNodeId =
      index < dialogues.length - 1
        ? `json_dialogue_${index + 2}`
        : choices.length > 0
          ? undefined
          : "json_end";

    nodes[id] = {
      id,
      speaker: resolveSpeakerLabel(entry, npcLabel),
      text: normalizeText(entry.text, "..."),
      nextNodeId
    };
  });

  if (choices.length > 0) {
    const finalDialogueNode = nodes[`json_dialogue_${dialogues.length}`];
    finalDialogueNode.choices = choices.map((choice, index): DialogueChoice => ({
      id: `json_choice_${choice.choiceId ?? index + 1}`,
      text: normalizeText(choice.text, `선택지 ${index + 1}`),
      nextNodeId: `json_choice_result_${choice.choiceId ?? index + 1}`
    }));

    choices.forEach((choice, index) => {
      const choiceId = choice.choiceId ?? index + 1;
      nodes[`json_choice_result_${choiceId}`] = {
        id: `json_choice_result_${choiceId}`,
        speaker: npcLabel,
        text: normalizeText(choice.result?.feedbackText, "결과가 반영되었습니다."),
        nextNodeId: "json_end"
      };
    });
  }

  nodes.json_end = {
    id: "json_end",
    speaker: npcLabel,
    text: normalizeText(firstEvent.eventName, "이벤트가 종료되었습니다.")
  };

  return {
    npcId: dialogueId,
    npcLabel,
    startNodeId: "json_dialogue_1",
    nodes
  };
}
