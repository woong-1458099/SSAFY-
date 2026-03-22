import type { AreaId } from "../../common/enums/area";
import type { Facing } from "../../common/enums/facing";
import { isNpcId, type NpcId } from "../../common/enums/npc";
import type {
  DialogueAction,
  DialogueChoice,
  DialogueChoiceActionType,
  DialogueNode,
  DialogueRequirement,
  DialogueScript,
  DialogueStatKey
} from "../../common/types/dialogue";
import type { SceneState, SceneStateNpc } from "../../common/types/sceneState";
import { isSceneStateId, type SceneStateId } from "../../game/definitions/sceneStates/sceneStateIds";

type AuthoredDialogueJson = {
  dialogues?: AuthoredDialogueScriptJson[];
};

type AuthoredDialogueScriptJson = {
  id?: string;
  label?: string;
  startNodeId?: string;
  nodes?: Record<string, AuthoredDialogueNodeJson>;
};

type AuthoredDialogueNodeJson = {
  id?: string;
  speaker?: string;
  speakerId?: string;
  emotion?: string;
  text?: string;
  nextNodeId?: string;
  choices?: AuthoredDialogueChoiceJson[];
  action?: DialogueAction;
};

type AuthoredDialogueChoiceJson = {
  id?: string;
  text?: string;
  nextNodeId?: string;
  actionType?: DialogueChoiceActionType;
  statChanges?: Partial<Record<DialogueStatKey, number>>;
  requirements?: DialogueRequirement[];
  lockedReason?: string;
  feedbackText?: string;
  action?: DialogueAction;
};

type SceneStateJson = {
  sceneStates?: SceneStateEntryJson[];
};

type SceneStateEntryJson = {
  id?: string;
  area?: AreaId;
  npcs?: SceneStateNpcJson[];
};

type SceneStateNpcJson = {
  npcId?: string;
  x?: number;
  y?: number;
  facing?: Facing;
  dialogueId?: string;
};

const AREA_ID_SET = new Set<AreaId>(["world", "downtown", "campus"]);

function isAreaId(value: unknown): value is AreaId {
  return typeof value === "string" && AREA_ID_SET.has(value as AreaId);
}

function isFacing(value: unknown): value is Facing {
  return value === "up" || value === "down" || value === "left" || value === "right";
}

function normalizeChoice(choice: AuthoredDialogueChoiceJson, index: number): DialogueChoice {
  return {
    id: typeof choice.id === "string" && choice.id.trim().length > 0 ? choice.id.trim() : `choice_${index + 1}`,
    text: typeof choice.text === "string" && choice.text.trim().length > 0 ? choice.text : `선택지 ${index + 1}`,
    nextNodeId: typeof choice.nextNodeId === "string" && choice.nextNodeId.trim().length > 0 ? choice.nextNodeId.trim() : undefined,
    actionType: choice.actionType,
    statChanges: choice.statChanges,
    requirements: Array.isArray(choice.requirements) ? choice.requirements : undefined,
    lockedReason: typeof choice.lockedReason === "string" ? choice.lockedReason : undefined,
    feedbackText: typeof choice.feedbackText === "string" ? choice.feedbackText : undefined,
    action: choice.action
  };
}

function normalizeNode(nodeKey: string, node: AuthoredDialogueNodeJson): DialogueNode {
  return {
    id: typeof node.id === "string" && node.id.trim().length > 0 ? node.id.trim() : nodeKey,
    speaker: typeof node.speaker === "string" && node.speaker.trim().length > 0 ? node.speaker.trim() : "NPC",
    speakerId: typeof node.speakerId === "string" && node.speakerId.trim().length > 0 ? node.speakerId.trim() : undefined,
    emotion: typeof node.emotion === "string" && node.emotion.trim().length > 0 ? node.emotion.trim() : undefined,
    text: typeof node.text === "string" && node.text.trim().length > 0 ? node.text : "...",
    nextNodeId: typeof node.nextNodeId === "string" && node.nextNodeId.trim().length > 0 ? node.nextNodeId.trim() : undefined,
    choices: Array.isArray(node.choices) ? node.choices.map(normalizeChoice) : undefined,
    action: node.action
  };
}

export function buildDialogueRegistryFromJson(raw: unknown): Record<string, DialogueScript> {
  const asset = (raw ?? {}) as AuthoredDialogueJson;
  const dialogues = Array.isArray(asset.dialogues) ? asset.dialogues : [];
  const registry: Record<string, DialogueScript> = {};

  dialogues.forEach((entry, index) => {
    const id = typeof entry.id === "string" ? entry.id.trim() : "";
    const startNodeId = typeof entry.startNodeId === "string" ? entry.startNodeId.trim() : "";
    const rawNodes = entry.nodes ?? {};
    if (!id || !startNodeId || typeof rawNodes !== "object") {
      return;
    }

    const nodes = Object.fromEntries(
      Object.entries(rawNodes).map(([nodeKey, node]) => [nodeKey, normalizeNode(nodeKey, node as AuthoredDialogueNodeJson)])
    );

    if (!nodes[startNodeId]) {
      return;
    }

    registry[id] = {
      id: id as DialogueScript["id"],
      label: typeof entry.label === "string" && entry.label.trim().length > 0 ? entry.label.trim() : `대화 ${index + 1}`,
      startNodeId,
      nodes
    };
  });

  return registry;
}

function normalizeSceneStateNpc(entry: SceneStateNpcJson): SceneStateNpc | null {
  if (
    typeof entry.npcId !== "string" ||
    !isNpcId(entry.npcId) ||
    typeof entry.x !== "number" ||
    typeof entry.y !== "number" ||
    typeof entry.dialogueId !== "string" ||
    entry.dialogueId.trim().length === 0
  ) {
    return null;
  }

  return {
    npcId: entry.npcId as NpcId,
    x: Math.round(entry.x),
    y: Math.round(entry.y),
    facing: isFacing(entry.facing) ? entry.facing : undefined,
    dialogueId: entry.dialogueId.trim() as SceneStateNpc["dialogueId"]
  };
}

export function buildSceneStateRegistryFromJson(raw: unknown): Record<SceneStateId, SceneState> {
  const asset = (raw ?? {}) as SceneStateJson;
  const entries = Array.isArray(asset.sceneStates) ? asset.sceneStates : [];
  const registry: Partial<Record<SceneStateId, SceneState>> = {};

  entries.forEach((entry) => {
    if (!isSceneStateId(typeof entry.id === "string" ? entry.id : "") || !isAreaId(entry.area)) {
      return;
    }

    registry[entry.id] = {
      id: entry.id,
      area: entry.area,
      npcs: Array.isArray(entry.npcs) ? entry.npcs.map(normalizeSceneStateNpc).filter((npc): npc is SceneStateNpc => npc !== null) : []
    };
  });

  return registry as Record<SceneStateId, SceneState>;
}
