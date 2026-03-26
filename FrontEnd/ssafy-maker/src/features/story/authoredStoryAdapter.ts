import { DIALOGUE_IDS } from "../../common/enums/dialogue";
import type { AreaId } from "../../common/enums/area";
import type { Facing } from "../../common/enums/facing";
import { isNpcId, type NpcId } from "../../common/enums/npc";
import type {
  DialogueAction,
  DialogueChoice,
  DialogueChoiceActionType,
  DialogueNode,
  DialogueRequirement,
  AffectionRequirement,
  DialogueScript,
  DialogueScriptId,
  DialogueStatKey
} from "../../common/types/dialogue";
import { createRuntimeDialogueId, normalizeDialogueScriptId } from "../../common/types/dialogue";
import type { SceneState, SceneStateNpc } from "../../common/types/sceneState";
import {
  SCENE_STATE_IDS,
  isSceneStateId,
  resolveSceneStateId,
  type SceneStateId
} from "../../game/definitions/sceneStates/sceneStateIds";

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
  affectionChanges?: Record<string, number>;
};

type AuthoredDialogueChoiceJson = {
  id?: string;
  text?: string;
  nextNodeId?: string;
  actionType?: DialogueChoiceActionType;
  statChanges?: Partial<Record<DialogueStatKey, number>>;
  affectionChanges?: Record<string, number>;
  requirements?: DialogueRequirement[];
  affectionRequirements?: AffectionRequirement[];
  lockedReason?: string;
  feedbackText?: string;
  action?: DialogueAction;
  setFlags?: string[];
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

const AREA_ID_SET = new Set<AreaId>(["world", "downtown", "campus", "classroom"]);
const REQUIRED_DIALOGUE_IDS = new Set<string>(Object.values(DIALOGUE_IDS));
const REQUIRED_SCENE_STATE_IDS = new Set<SceneStateId>(Object.values(SCENE_STATE_IDS));
export const AUTHORED_DIALOGUE_FALLBACK_ID = createRuntimeDialogueId("authored_dialogue_missing");
const SCENE_STATE_NPC_DIALOGUE_ID_PATTERN = /^npc_[a-z0-9_]+$/;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function normalizeString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function isAreaId(value: unknown): value is AreaId {
  return typeof value === "string" && AREA_ID_SET.has(value as AreaId);
}

function isFacing(value: unknown): value is Facing {
  return value === "up" || value === "down" || value === "left" || value === "right";
}

function normalizeChoice(choice: AuthoredDialogueChoiceJson, index: number): DialogueChoice {
  return {
    id: normalizeString(choice.id) || `choice_${index + 1}`,
    text: normalizeString(choice.text) || `선택지 ${index + 1}`,
    nextNodeId: normalizeString(choice.nextNodeId) || undefined,
    actionType: choice.actionType,
    statChanges: choice.statChanges,
    affectionChanges: choice.affectionChanges,
    requirements: Array.isArray(choice.requirements) ? choice.requirements : undefined,
    affectionRequirements: Array.isArray(choice.affectionRequirements) ? choice.affectionRequirements : undefined,
    lockedReason: typeof choice.lockedReason === "string" ? choice.lockedReason : undefined,
    feedbackText: typeof choice.feedbackText === "string" ? choice.feedbackText : undefined,
    action: choice.action,
    setFlags: Array.isArray(choice.setFlags) ? choice.setFlags : undefined
  };
}

function resolveFallbackSpeakerLabel(node: AuthoredDialogueNodeJson): string {
  const speakerId = normalizeString(node.speakerId).toUpperCase();
  if (speakerId === "SYSTEM") {
    return "시스템";
  }
  if (speakerId === "PLAYER") {
    return "플레이어";
  }
  return "내레이션";
}

function normalizeNode(nodeKey: string, node: AuthoredDialogueNodeJson): DialogueNode {
  return {
    id: normalizeString(node.id) || nodeKey,
    speaker: normalizeString(node.speaker) || resolveFallbackSpeakerLabel(node),
    speakerId: normalizeString(node.speakerId) || undefined,
    emotion: normalizeString(node.emotion) || undefined,
    text: normalizeString(node.text) || "...",
    nextNodeId: normalizeString(node.nextNodeId) || undefined,
    choices: Array.isArray(node.choices) ? node.choices.map(normalizeChoice) : undefined,
    action: node.action,
    affectionChanges: node.affectionChanges
  };
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

function buildExpectedSceneStateDialogueId(npcId: NpcId): string {
  return `npc_${npcId}`;
}

function validateDialogueNode(
  dialogueId: string,
  nodeKey: string,
  node: AuthoredDialogueNodeJson,
  nodeKeys: Set<string>,
  fatalIssues: string[]
): boolean {
  if (!isRecord(node)) {
    fatalIssues.push(`[dialogue:${dialogueId}] nodes.${nodeKey} 가 객체가 아닙니다.`);
    return false;
  }

  let valid = true;
  const explicitNodeId = normalizeString(node.id);
  if (explicitNodeId && explicitNodeId !== nodeKey) {
    fatalIssues.push(`[dialogue:${dialogueId}] nodes.${nodeKey}.id=${explicitNodeId} 는 nodes 키와 일치해야 합니다.`);
    valid = false;
  }

  if (!normalizeString(node.text)) {
    fatalIssues.push(`[dialogue:${dialogueId}] nodes.${nodeKey}.text 가 비어 있거나 문자열이 아닙니다.`);
    valid = false;
  }

  const nextNodeId = normalizeString(node.nextNodeId);
  if (nextNodeId && !nodeKeys.has(nextNodeId)) {
    fatalIssues.push(`[dialogue:${dialogueId}] nodes.${nodeKey}.nextNodeId=${nextNodeId} 가 nodes에 없습니다.`);
    valid = false;
  }

  if (node.choices !== undefined && !Array.isArray(node.choices)) {
    fatalIssues.push(`[dialogue:${dialogueId}] nodes.${nodeKey}.choices 가 배열이 아닙니다.`);
    return false;
  }

  const explicitChoiceIds = new Set<string>();

  (node.choices ?? []).forEach((choice, choiceIndex) => {
    if (!isRecord(choice)) {
      fatalIssues.push(`[dialogue:${dialogueId}] nodes.${nodeKey}.choices[${choiceIndex}] 가 객체가 아닙니다.`);
      valid = false;
      return;
    }

    if (!normalizeString(choice.text)) {
      fatalIssues.push(`[dialogue:${dialogueId}] nodes.${nodeKey}.choices[${choiceIndex}].text 가 비어 있거나 문자열이 아닙니다.`);
      valid = false;
    }

    const choiceId = normalizeString(choice.id);
    if (choiceId) {
      if (explicitChoiceIds.has(choiceId)) {
        fatalIssues.push(`[dialogue:${dialogueId}] nodes.${nodeKey} choice id=${choiceId} 가 중복됩니다.`);
        valid = false;
      } else {
        explicitChoiceIds.add(choiceId);
      }
    }

    const choiceNextNodeId = normalizeString(choice.nextNodeId);
    if (choiceNextNodeId && !nodeKeys.has(choiceNextNodeId)) {
      fatalIssues.push(
        `[dialogue:${dialogueId}] nodes.${nodeKey}.choices[${choiceIndex}].nextNodeId=${choiceNextNodeId} 가 nodes에 없습니다.`
      );
      valid = false;
    }
  });

  return valid;
}

export function buildDialogueRegistryFromJson(
  raw: unknown,
  fatalIssues: string[] = [],
  existingRegistry: Record<string, DialogueScript> = {}
): Record<string, DialogueScript> {
  const asset = (raw ?? {}) as AuthoredDialogueJson;
  const dialogues = Array.isArray(asset.dialogues) ? asset.dialogues : [];
  const registry: Record<string, DialogueScript> = { ...existingRegistry };
  const seenDialogueIds = new Set<string>(Object.keys(registry));

  dialogues.forEach((entry, index) => {
    let id: DialogueScriptId;
    try {
      id = normalizeDialogueScriptId(normalizeString(entry.id));
    } catch (error) {
      fatalIssues.push(`[dialogues.${index}] id="${entry.id}" 이 유효한 형식이 아닙니다.`);
      return;
    }

    if (seenDialogueIds.has(id)) {
      fatalIssues.push(`[dialogues] 중복 dialogue id=${id} 가 있습니다.`);
      return;
    }

    seenDialogueIds.add(id);

    const startNodeId = normalizeString(entry.startNodeId);
    if (!startNodeId) {
      fatalIssues.push(`[dialogue:${id}] startNodeId가 비어 있습니다.`);
      return;
    }

    if (!isRecord(entry.nodes)) {
      fatalIssues.push(`[dialogue:${id}] nodes가 객체가 아닙니다.`);
      return;
    }

    const nodeEntries = Object.entries(entry.nodes);
    if (nodeEntries.length === 0) {
      fatalIssues.push(`[dialogue:${id}] nodes가 비어 있습니다.`);
      return;
    }

    const nodeKeys = new Set(nodeEntries.map(([nodeKey]) => nodeKey));
    if (!nodeKeys.has(startNodeId)) {
      fatalIssues.push(`[dialogue:${id}] startNodeId=${startNodeId} 가 nodes에 없습니다.`);
      return;
    }

    const normalizedNodeIds = new Set<string>();
    let isValid = true;

    nodeEntries.forEach(([nodeKey, node]) => {
      if (!validateDialogueNode(id, nodeKey, node as AuthoredDialogueNodeJson, nodeKeys, fatalIssues)) {
        isValid = false;
      }

      const normalizedNodeId = normalizeString((node as AuthoredDialogueNodeJson).id) || nodeKey;
      if (normalizedNodeIds.has(normalizedNodeId)) {
        fatalIssues.push(`[dialogue:${id}] node id=${normalizedNodeId} 가 중복됩니다.`);
        isValid = false;
      } else {
        normalizedNodeIds.add(normalizedNodeId);
      }
    });

    if (!isValid) {
      return;
    }

    const nodes = Object.fromEntries(
      nodeEntries.map(([nodeKey, node]) => [nodeKey, normalizeNode(nodeKey, node as AuthoredDialogueNodeJson)])
    );

    registry[id] = {
      id: id as DialogueScript["id"],
      label: normalizeString(entry.label) || `대화 ${index + 1}`,
      startNodeId,
      nodes
    };
  });

  return registry;
}

function normalizeSceneStateNpc(
  entry: SceneStateNpcJson,
  sceneStateId: string,
  npcIndex: number,
  fatalIssues: string[]
): SceneStateNpc | null {
  const rawNpcId = normalizeString(entry.npcId);
  if (!rawNpcId || !isNpcId(rawNpcId)) {
    fatalIssues.push(`[${sceneStateId}] npcs[${npcIndex}] npcId=${JSON.stringify(entry.npcId)} 가 유효한 NpcId가 아닙니다.`);
    return null;
  }

  if (typeof entry.x !== "number" || typeof entry.y !== "number") {
    fatalIssues.push(`[${sceneStateId}] npcs[${npcIndex}] npcId=${rawNpcId} 좌표(x,y)가 유효하지 않습니다.`);
    return null;
  }

  const dialogueId = normalizeString(entry.dialogueId);
  if (!dialogueId) {
    fatalIssues.push(`[${sceneStateId}] npcs[${npcIndex}] npcId=${rawNpcId} dialogueId가 비어 있습니다.`);
    return null;
  }

  const expectedDialogueId = buildExpectedSceneStateDialogueId(rawNpcId as NpcId);
  if (!SCENE_STATE_NPC_DIALOGUE_ID_PATTERN.test(dialogueId) || dialogueId !== expectedDialogueId) {
    fatalIssues.push(
      `[${sceneStateId}] npcs[${npcIndex}] npcId=${rawNpcId} dialogueId=${dialogueId} 가 규칙과 다릅니다. expected=${expectedDialogueId}`
    );
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

export function buildSceneStateRegistryFromJson(
  raw: unknown,
  fatalIssues: string[] = []
): Partial<Record<SceneStateId, SceneState>> {
  const asset = (raw ?? {}) as SceneStateJson;
  const entries = Array.isArray(asset.sceneStates) ? asset.sceneStates : [];
  const registry: Partial<Record<SceneStateId, SceneState>> = {};
  const seenSceneStateIds = new Set<SceneStateId>();

  entries.forEach((entry, entryIndex) => {
    const rawSceneStateId = normalizeString(entry.id);
    const resolvedSceneStateId = resolveSceneStateId(rawSceneStateId);

    if (!resolvedSceneStateId || !isSceneStateId(resolvedSceneStateId)) {
      fatalIssues.push(`[sceneStates.${entryIndex}] id=${JSON.stringify(entry.id)} 가 유효한 SceneStateId가 아닙니다.`);
      return;
    }

    if (rawSceneStateId !== resolvedSceneStateId) {
      fatalIssues.push(
        `[sceneStates.${entryIndex}] id=${JSON.stringify(entry.id)} 는 레거시 형식입니다. canonical=${resolvedSceneStateId} 를 사용하세요.`
      );
      return;
    }

    if (seenSceneStateIds.has(resolvedSceneStateId)) {
      fatalIssues.push(`[sceneStates] 중복 sceneState id=${resolvedSceneStateId} 가 있습니다.`);
      return;
    }

    seenSceneStateIds.add(resolvedSceneStateId);

    if (!isAreaId(entry.area)) {
      fatalIssues.push(`[${resolvedSceneStateId}] area=${JSON.stringify(entry.area)} 가 유효한 AreaId가 아닙니다.`);
      return;
    }

    const npcs = Array.isArray(entry.npcs)
      ? entry.npcs
          .map((npc, npcIndex) => normalizeSceneStateNpc(npc, resolvedSceneStateId, npcIndex, fatalIssues))
          .filter((npc): npc is SceneStateNpc => npc !== null)
      : [];

    registry[resolvedSceneStateId] = {
      id: resolvedSceneStateId,
      area: entry.area,
      npcs
    };
  });

  return registry;
}

export function buildAuthoredStoryAssetsFromJson(
  dialoguesChunksRaw: unknown[],
  sceneStatesRaw: unknown
): {
  dialogues: Record<string, DialogueScript>;
  sceneStates: Record<SceneStateId, SceneState>;
  warnings: string[];
  fatalIssues: string[];
} {
  const fatalIssues: string[] = [];
  const warnings: string[] = [];
  
  let dialogues: Record<string, DialogueScript> = {};
  dialoguesChunksRaw.forEach((chunk) => {
    dialogues = buildDialogueRegistryFromJson(chunk, fatalIssues, dialogues);
  });
  dialogues[AUTHORED_DIALOGUE_FALLBACK_ID] ??= createMissingDialogueFallback();

  // 모든 조각이 병합된 후에 필수 ID 검증을 수행합니다.
  REQUIRED_DIALOGUE_IDS.forEach((dialogueId) => {
    if (!dialogues[dialogueId]) {
      fatalIssues.push(`[dialogues] 정적 dialogue id=${dialogueId} 가 authored registry에 없습니다.`);
    }
  });

  const rawSceneStates = buildSceneStateRegistryFromJson(sceneStatesRaw, fatalIssues);
  REQUIRED_SCENE_STATE_IDS.forEach((sceneStateId) => {
    if (!rawSceneStates[sceneStateId]) {
      fatalIssues.push(`[sceneStates] 정적 id=${sceneStateId} 가 authored registry에 없습니다.`);
    }
  });
  const dialogueIds = new Set(Object.keys(dialogues));

  const sceneStates = Object.fromEntries(
    Object.entries(rawSceneStates).map(([sceneStateId, sceneState]) => [
      sceneStateId,
      {
        ...sceneState,
        npcs: sceneState.npcs.map((npc) => {
          if (dialogueIds.has(npc.dialogueId)) {
            return npc;
          }

          warnings.push(
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
    warnings,
    fatalIssues
  };
}
