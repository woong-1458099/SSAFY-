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
export const AUTHORED_DIALOGUE_FALLBACK_ID = "authored_dialogue_missing";

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

function createMissingDialogueFallback(): DialogueScript {
  return {
    id: AUTHORED_DIALOGUE_FALLBACK_ID,
    label: "누락된 대화 안내",
    startNodeId: "start",
    nodes: {
      start: {
        id: "start",
        speaker: "안내",
        text: "연결된 authored 대화 데이터가 없습니다. dialogues.json과 scene_states.json 참조를 확인하세요."
      }
    }
  };
}

function normalizeSceneStateNpc(
  entry: SceneStateNpcJson,
  sceneStateId: string,
  npcIndex: number,
  issues: string[]
): SceneStateNpc | null {
  const rawNpcId = typeof entry.npcId === "string" ? entry.npcId.trim() : "";
  if (!rawNpcId || !isNpcId(rawNpcId)) {
    issues.push(
      `[${sceneStateId}] npcs[${npcIndex}] npcId=${JSON.stringify(entry.npcId)} 가 유효한 NpcId가 아니라서 제외합니다.`
    );
    return null;
  }

  if (typeof entry.x !== "number" || typeof entry.y !== "number") {
    issues.push(`[${sceneStateId}] npcs[${npcIndex}] npcId=${rawNpcId} 좌표(x,y)가 유효하지 않아 제외합니다.`);
    return null;
  }

  const dialogueId = typeof entry.dialogueId === "string" ? entry.dialogueId.trim() : "";
  if (!dialogueId) {
    issues.push(`[${sceneStateId}] npcs[${npcIndex}] npcId=${rawNpcId} dialogueId가 비어 있어 제외합니다.`);
    return null;
  }

  return {
    npcId: rawNpcId as NpcId,
    x: Math.round(entry.x),
    y: Math.round(entry.y),
    facing: isFacing(entry.facing) ? entry.facing : undefined,
    dialogueId: dialogueId as SceneStateNpc["dialogueId"]
  };
}

export function buildSceneStateRegistryFromJson(raw: unknown, issues: string[] = []): Record<SceneStateId, SceneState> {
  const asset = (raw ?? {}) as SceneStateJson;
  const entries = Array.isArray(asset.sceneStates) ? asset.sceneStates : [];
  const registry: Partial<Record<SceneStateId, SceneState>> = {};

  entries.forEach((entry, entryIndex) => {
    const sceneStateId = typeof entry.id === "string" ? entry.id : "";
    if (!isSceneStateId(sceneStateId)) {
      issues.push(`[sceneStates.${entryIndex}] id=${JSON.stringify(entry.id)} 가 유효한 SceneStateId가 아니라서 제외합니다.`);
      return;
    }

    if (!isAreaId(entry.area)) {
      issues.push(`[${sceneStateId}] area=${JSON.stringify(entry.area)} 가 유효한 AreaId가 아니라서 제외합니다.`);
      return;
    }

    registry[sceneStateId] = {
      id: sceneStateId,
      area: entry.area,
      npcs: Array.isArray(entry.npcs)
        ? entry.npcs
            .map((npc, npcIndex) => normalizeSceneStateNpc(npc, sceneStateId, npcIndex, issues))
            .filter((npc): npc is SceneStateNpc => npc !== null)
        : []
    };
  });

  return registry as Record<SceneStateId, SceneState>;
}

export function buildAuthoredStoryAssetsFromJson(
  dialoguesRaw: unknown,
  sceneStatesRaw: unknown
): {
  dialogues: Record<string, DialogueScript>;
  sceneStates: Record<SceneStateId, SceneState>;
  issues: string[];
} {
  const dialogues = buildDialogueRegistryFromJson(dialoguesRaw);
  dialogues[AUTHORED_DIALOGUE_FALLBACK_ID] ??= createMissingDialogueFallback();

  const dialogueIds = new Set(Object.keys(dialogues));
  const issues: string[] = [];
  const rawSceneStates = buildSceneStateRegistryFromJson(sceneStatesRaw, issues);

  const sceneStates = Object.fromEntries(
    Object.entries(rawSceneStates).map(([sceneStateId, sceneState]) => [
      sceneStateId,
      {
        ...sceneState,
        npcs: sceneState.npcs.map((npc) => {
          if (dialogueIds.has(npc.dialogueId)) {
            return npc;
          }

          issues.push(
            `[${sceneState.id}] npcId=${npc.npcId} dialogueId=${npc.dialogueId} 참조가 dialogues.json에 없습니다. fallback 대화로 치환합니다.`
          );

          return {
            ...npc,
            dialogueId: AUTHORED_DIALOGUE_FALLBACK_ID
          };
        })
      } satisfies SceneState
    ])
  ) as Record<SceneStateId, SceneState>;

  return {
    dialogues,
    sceneStates,
    issues
  };
}
