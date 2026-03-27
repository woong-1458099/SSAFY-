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

type AuthoredDialogueNodeRaw = {
  text?: string;
  speaker?: string;
  speakerId?: string;
  emotion?: string;
  speakerGender?: string;
  nextNodeId?: string;
  action?: string;
  choices?: any[];
  requirements?: any[];
  affectionChanges?: any;
};

type AuthoredDialogueJson = {
  dialogues: Array<{
    id: string;
    label?: string;
    startNodeId: string;
    nodes: Record<string, AuthoredDialogueNodeRaw>;
  }>;
};

type AuthoredSceneStateJson = {
  sceneStates: Array<{
    id: string;
    area: string;
    npcs: Array<{
      npcId: string;
      x: number;
      y: number;
      dialogueId: string;
      facing?: string;
    }>;
  }>;
};

const REQUIRED_DIALOGUE_IDS = new Set<string>(Object.values(DIALOGUE_IDS));
const REQUIRED_SCENE_STATE_IDS = new Set<SceneStateId>(Object.values(SCENE_STATE_IDS));
export const AUTHORED_DIALOGUE_FALLBACK_ID = "authored_dialogue_missing";

function normalizeString(value: unknown): string {
  if (typeof value !== "string") {
    return "";
  }
  return value.trim();
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function warnOnce(message: string): void {
  console.warn(`[AuthoredStoryAdapter] ${message}`);
}

function createMissingDialogueFallback(): DialogueScript {
  return {
    id: AUTHORED_DIALOGUE_FALLBACK_ID as DialogueScript["id"],
    label: "알 수 없는 대화",
    startNodeId: "missing",
    nodes: {
      missing: {
        id: "missing",
        speaker: "시스템",
        text: "대화 데이터를 찾을 수 없습니다. (ID: missing)"
      }
    }
  };
}

export function buildDialogueNode(nodeId: string, raw: unknown): DialogueNode {
  const node = (raw ?? {}) as AuthoredDialogueNodeRaw;
  const text = normalizeString(node.text);
  if (!text) {
    throw new Error(`node:${nodeId} text가 비어 있습니다.`);
  }

  const result: DialogueNode = {
    id: nodeId,
    speaker: normalizeString(node.speaker) || "???",
    text,
    speakerId: normalizeString(node.speakerId) || undefined,
    emotion: normalizeString(node.emotion) || undefined,
    speakerGender: node.speakerGender === "male" || node.speakerGender === "female" ? node.speakerGender : undefined,
    nextNodeId: normalizeString(node.nextNodeId) || undefined,
    action: node.action ? (normalizeString(node.action) as DialogueAction) : undefined
  };

  if (Array.isArray(node.choices)) {
    result.choices = node.choices
      .map((choiceRaw: any, index: number) => {
        const choice = (choiceRaw ?? {}) as Record<string, any>;
        const choiceText = normalizeString(choice.text);
        if (!choiceText) {
          warnOnce(`node:${nodeId} choices[${index}] text가 비어 있어 건너뜁니다.`);
          return null;
        }

        const typedChoice: DialogueChoice = {
          id: normalizeString(choice.id) || `choice_${index}`,
          text: choiceText,
          nextNodeId: normalizeString(choice.nextNodeId) || undefined,
          actionType: (normalizeString(choice.actionType) as DialogueChoiceActionType) || "NORMAL",
          statChanges: choice.statChanges,
          affectionChanges: choice.affectionChanges,
          requirements: choice.requirements,
          affectionRequirements: choice.affectionRequirements,
          lockedReason: normalizeString(choice.lockedReason) || undefined,
          feedbackText: normalizeString(choice.feedbackText) || undefined,
          action: choice.action ? (normalizeString(choice.action) as DialogueAction) : undefined,
          setFlags: Array.isArray(choice.setFlags) ? (choice.setFlags as string[]) : undefined
        };
        return typedChoice;
      })
      .filter((c): c is DialogueChoice => c !== null);
  }

  if (Array.isArray(node.requirements)) {
    result.requirements = node.requirements;
  }

  if (node.affectionChanges) {
    result.affectionChanges = node.affectionChanges;
  }

  return result;
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

    // 중복 ID 발생 시 덮어쓰기 허용 (로그는 생략하거나 다른 방식으로 처리)
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
      warnOnce(`[DialogueAdapter] dialogue:${id} 에 노드가 없습니다.`);
    }

    const nodes: Record<string, DialogueNode> = {};
    const normalizedNodeIds = new Set<string>();

    nodeEntries.forEach(([nodeId, nodeEntry]) => {
      const normalizedNodeId = normalizeString(nodeId);
      if (!normalizedNodeId) {
        fatalIssues.push(`[dialogue:${id}] 유효하지 않은 node id="${nodeId}" 입니다.`);
        return;
      }
      if (normalizedNodeIds.has(normalizedNodeId)) {
        fatalIssues.push(`[dialogue:${id}] node id=${normalizedNodeId} 가 중복됩니다.`);
        return;
      }
      normalizedNodeIds.add(normalizedNodeId);

      try {
        nodes[normalizedNodeId] = buildDialogueNode(normalizedNodeId, nodeEntry);
      } catch (error) {
        fatalIssues.push(`[dialogue:${id}, node:${normalizedNodeId}] ${error instanceof Error ? error.message : "빌드 실패"}`);
      }
    });

    if (!normalizedNodeIds.has(startNodeId)) {
      fatalIssues.push(`[dialogue:${id}] startNodeId=${startNodeId} 가 nodes에 존재하지 않습니다.`);
      return;
    }

    registry[id] = {
      id: id as DialogueScript["id"],
      label: normalizeString(entry.label) || `대화 ${index + 1}`,
      startNodeId,
      nodes
    };
  });

  return registry;
}

export function buildSceneStateRegistryFromJson(
  raw: unknown,
  fatalIssues: string[] = []
): Record<SceneStateId, SceneState> {
  const asset = (raw ?? {}) as AuthoredSceneStateJson;
  const scenes = Array.isArray(asset.sceneStates) ? asset.sceneStates : [];
  const registry = {} as Record<SceneStateId, SceneState>;

  scenes.forEach((entry, index) => {
    const rawId = normalizeString(entry.id);
    const resolvedSceneStateId = resolveSceneStateId(rawId);
    if (!resolvedSceneStateId) {
      fatalIssues.push(`[scenes.${index}] id="${entry.id}" 은 알려진 SceneStateId가 아닙니다.`);
      return;
    }

    const npcs: SceneStateNpc[] = (Array.isArray(entry.npcs) ? entry.npcs : [])
      .map((npc, npcIdx) => {
        const npcId = normalizeNpcId(npc.npcId);
        if (!npcId) {
          fatalIssues.push(`[scene:${rawId}, npc:${npcIdx}] npcId="${npc.npcId}" 가 유효하지 않습니다.`);
          return null;
        }

        const result: SceneStateNpc = {
          npcId,
          x: Number(npc.x) || 0,
          y: Number(npc.y) || 0,
          dialogueId: normalizeString(npc.dialogueId) as DialogueScriptId,
          facing: (normalizeString(npc.facing) as Facing) || undefined
        };
        return result;
      })
      .filter((npc): npc is SceneStateNpc => npc !== null);

    registry[resolvedSceneStateId] = {
      id: resolvedSceneStateId,
      area: (normalizeString(entry.area) as AreaId) || "world",
      npcs
    };
  });

  return registry;
}

function normalizeNpcId(value: string): NpcId | null {
  const normalized = normalizeString(value);
  return isNpcId(normalized) ? normalized : null;
}

export function buildAuthoredStoryAssetsFromJson(
  dialoguesChunksRaw: unknown[],
  sceneStatesRaw: unknown,
  week: number = 1
): {
  dialogues: Record<string, DialogueScript>;
  sceneStates: Record<SceneStateId, SceneState>;
  warnings: string[];
  fatalIssues: string[];
} {
  const fatalIssues: string[] = [];
  const warnings: string[] = [];

  let dialogues: Record<string, DialogueScript> = {};
  dialoguesChunksRaw.forEach((chunk, i) => {
    dialogues = buildDialogueRegistryFromJson(chunk, fatalIssues, dialogues);
  });
  console.log(`[StoryAdapter] Merged Registry IDs: ${Object.keys(dialogues).join(", ")}`);
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
            console.log(`[StoryAdapter] Mapping NPC: ${npc.npcId} in ${sceneState.id} -> ${npc.dialogueId}`);
            return npc;
          }

          warnings.push(
            `[${sceneState.id}] npcId=${npc.npcId} dialogueId=${npc.dialogueId} 참조가 dialogues JSON에 없습니다. fallback 대화로 치환합니다.`
          );
          console.warn(`[StoryAdapter] MISSING dialogue for ${npc.npcId} in ${sceneState.id}: ${npc.dialogueId}`);

          return {
            ...npc,
            dialogueId: AUTHORED_DIALOGUE_FALLBACK_ID as DialogueScriptId
          };
        })
      }
    ])
  ) as Record<SceneStateId, SceneState>;

  return {
    dialogues,
    sceneStates,
    warnings,
    fatalIssues
  };
}
