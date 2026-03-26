import type Phaser from "phaser";
import { ASSET_KEYS, ASSET_PATHS } from "../../common/assets/assetKeys";
import { DIALOGUE_IDS } from "../../common/enums/dialogue";
import type { DialogueScript } from "../../common/types/dialogue";
import type { SceneState } from "../../common/types/sceneState";
import {
  AUTHORED_DIALOGUE_FALLBACK_ID,
  buildAuthoredStoryAssetsFromJson
} from "../../features/story/authoredStoryAdapter";
import { NPC_DEFINITIONS } from "../../game/definitions/npcs/npcDefinitions";
import { SCENE_STATE_IDS, type SceneStateId } from "../../game/definitions/sceneStates/sceneStateIds";
import { setSceneStateRegistry } from "../../game/definitions/sceneStates/sceneStateRegistry";
import { setDialogueRegistry } from "../../game/scripts/dialogues/dialogueRegistry";

let loadPromise: Promise<void> | null = null;

type AuthoredStoryLoadStage = "fetch" | "hydrate" | "preflight";

class AuthoredStoryLoadError extends Error {
  readonly cause?: unknown;

  constructor(
    readonly stage: AuthoredStoryLoadStage,
    readonly issues: string[],
    cause?: unknown
  ) {
    super(`[AuthoredStory:${stage}] ${issues.join("\n")}`);
    this.name = "AuthoredStoryLoadError";
    this.cause = cause;
  }
}

async function loadJson(url: string): Promise<unknown> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to load story asset: ${url} (${response.status})`);
  }
  return response.json();
}

function createFallbackDialogue(dialogueId: string, text: string): DialogueScript {
  return {
    id: dialogueId as DialogueScript["id"],
    label: `기본 대화 (${dialogueId})`,
    startNodeId: "start",
    nodes: {
      start: {
        id: "start",
        speaker: "안내",
        text
      }
    }
  };
}

function createFallbackAuthoredStoryAssets(): {
  dialogues: Record<string, DialogueScript>;
  sceneStates: Record<SceneStateId, SceneState>;
} {
  const fallbackText = "authored 스토리 데이터를 불러오지 못했습니다. 기본 안전 대화로 대체합니다.";
  const dialogueEntries = [
    ...Object.values(DIALOGUE_IDS),
    AUTHORED_DIALOGUE_FALLBACK_ID
  ].map((dialogueId) => [dialogueId, createFallbackDialogue(dialogueId, fallbackText)] as const);

  return {
    dialogues: Object.fromEntries(dialogueEntries),
    sceneStates: {
      [SCENE_STATE_IDS.worldDefault]: {
        id: SCENE_STATE_IDS.worldDefault,
        area: "world",
        npcs: []
      },
      [SCENE_STATE_IDS.downtownDefault]: {
        id: SCENE_STATE_IDS.downtownDefault,
        area: "downtown",
        npcs: []
      },
      [SCENE_STATE_IDS.campusDefault]: {
        id: SCENE_STATE_IDS.campusDefault,
        area: "campus",
        npcs: []
      },
      [SCENE_STATE_IDS.classroomDefault]: {
        id: SCENE_STATE_IDS.classroomDefault,
        area: "classroom",
        npcs: []
      }
    }
  };
}

function applyAuthoredStoryAssets(storyAssets: {
  dialogues: Record<string, DialogueScript>;
  sceneStates: Record<SceneStateId, SceneState>;
}): void {
  setDialogueRegistry(storyAssets.dialogues);
  setSceneStateRegistry(storyAssets.sceneStates);
}

function buildRuntimePreflightIssues(storyAssets: {
  dialogues: Record<string, DialogueScript>;
  sceneStates: Record<SceneStateId, SceneState>;
  warnings: string[];
}): string[] {
  const issues = [...storyAssets.warnings];
  const dialogueIds = new Set(Object.keys(storyAssets.dialogues));
  const npcIds = new Set(Object.keys(NPC_DEFINITIONS));

  Object.values(DIALOGUE_IDS).forEach((dialogueId) => {
    if (!dialogueIds.has(dialogueId)) {
      issues.push(`[dialogues] 중앙 DIALOGUE_IDS=${dialogueId} 가 runtime registry에 없습니다.`);
    }
  });

  Object.values(storyAssets.sceneStates).forEach((sceneState) => {
    sceneState.npcs.forEach((npc, npcIndex) => {
      if (!npcIds.has(npc.npcId)) {
        issues.push(`[${sceneState.id}] npcs[${npcIndex}] npcId=${npc.npcId} 가 NPC_DEFINITIONS에 없습니다.`);
      }

      if (!dialogueIds.has(npc.dialogueId)) {
        issues.push(`[${sceneState.id}] npcs[${npcIndex}] dialogueId=${npc.dialogueId} 가 runtime registry에 없습니다.`);
      }
    });
  });

  return issues;
}

function readCachedAuthoredStory(scene?: Phaser.Scene): {
  dialoguesRaw: unknown;
  sceneStatesRaw: unknown;
} | null {
  if (!scene) {
    return null;
  }

  const dialoguesRaw = scene.cache.json.get(ASSET_KEYS.story.authoredDialogues);
  const sceneStatesRaw = scene.cache.json.get(ASSET_KEYS.story.authoredSceneStates);
  if (dialoguesRaw === undefined || sceneStatesRaw === undefined) {
    return null;
  }

  return { dialoguesRaw, sceneStatesRaw };
}

async function loadAuthoredStoryJson(scene?: Phaser.Scene, week: number = 1): Promise<{
  dialoguesChunksRaw: unknown[];
  sceneStatesRaw: unknown;
}> {
  try {
    const weekKey = `authoredDialoguesW${week}` as keyof typeof ASSET_PATHS.story;
    const weekPath = ASSET_PATHS.story[weekKey];
    
    // dialogues.json (레거시), dialogues_common.json, 그리고 현재 주차 파일을 함께 로드합니다.
    const [legacyRaw, commonRaw, weekRaw, sceneStatesRaw] = await Promise.all([
      loadJson(`${ASSET_PATHS.story.authoredDialogues}`).catch(() => ({ dialogues: [] })),
      loadJson(`${ASSET_PATHS.story.authoredDialoguesCommon}`).catch(() => ({ dialogues: [] })),
      loadJson(`${weekPath}`).catch(() => ({ dialogues: [] })),
      loadJson(`${ASSET_PATHS.story.authoredSceneStates}`)
    ]);

    return { 
      dialoguesChunksRaw: [legacyRaw, commonRaw, weekRaw], 
      sceneStatesRaw 
    };
  } catch (error) {
    throw new AuthoredStoryLoadError("fetch", ["authored JSON fetch에 실패했습니다."], error);
  }
}

function installFallbackAuthoredStory(error: unknown): void {
  const message =
    error instanceof AuthoredStoryLoadError
      ? `${error.stage}\n${error.issues.join("\n")}`
      : error instanceof Error
        ? error.message
        : String(error);
  console.error("[AuthoredStory] authored story 로드 실패, 안전 기본 데이터로 대체합니다.\n" + message);
  applyAuthoredStoryAssets(createFallbackAuthoredStoryAssets());
}

let currentLoadedWeek: number | null = null;

export async function ensureAuthoredStoryLoaded(scene?: Phaser.Scene, week: number = 1): Promise<void> {
  // 이미 해당 주차의 스토리가 로드되어 있다면 건너뜁니다.
  if (loadPromise && currentLoadedWeek === week) {
    return loadPromise;
  }

  loadPromise = loadAuthoredStoryJson(scene, week)
    .then(({ dialoguesChunksRaw, sceneStatesRaw }) => {
      const authoredStory = buildAuthoredStoryAssetsFromJson(dialoguesChunksRaw, sceneStatesRaw);
      if (authoredStory.fatalIssues.length > 0) {
        throw new AuthoredStoryLoadError("hydrate", authoredStory.fatalIssues);
      }

      const preflightIssues = buildRuntimePreflightIssues(authoredStory);
      if (preflightIssues.length > 0) {
        throw new AuthoredStoryLoadError("preflight", preflightIssues);
      }

      applyAuthoredStoryAssets(authoredStory);
      currentLoadedWeek = week;
    })
    .catch((error) => {
      installFallbackAuthoredStory(error);
      currentLoadedWeek = null;
    });

  return loadPromise;
}
