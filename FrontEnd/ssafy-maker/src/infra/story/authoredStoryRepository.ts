import type Phaser from "phaser";
import { ASSET_KEYS, ASSET_PATHS } from "../../common/assets/assetKeys";
import { DIALOGUE_IDS } from "../../common/enums/dialogue";
import type { DialogueScript } from "../../common/types/dialogue";
import type { SceneState } from "../../common/types/sceneState";
import {
  AUTHORED_DIALOGUE_FALLBACK_ID,
  buildAuthoredStoryAssetsFromJson
} from "../../features/story/authoredStoryAdapter";
import { SCENE_STATE_IDS, type SceneStateId } from "../../game/definitions/sceneStates/sceneStateIds";
import { setSceneStateRegistry } from "../../game/definitions/sceneStates/sceneStateRegistry";
import { setDialogueRegistry } from "../../game/scripts/dialogues/dialogueRegistry";

let loadPromise: Promise<void> | null = null;

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

async function loadAuthoredStoryJson(scene?: Phaser.Scene): Promise<{
  dialoguesRaw: unknown;
  sceneStatesRaw: unknown;
}> {
  const cached = readCachedAuthoredStory(scene);
  if (cached) {
    return cached;
  }

  const [dialoguesRaw, sceneStatesRaw] = await Promise.all([
    loadJson(`/${ASSET_PATHS.story.authoredDialogues}`),
    loadJson(`/${ASSET_PATHS.story.authoredSceneStates}`)
  ]);

  return { dialoguesRaw, sceneStatesRaw };
}

function installFallbackAuthoredStory(error: unknown): void {
  const message = error instanceof Error ? error.message : String(error);
  console.error("[AuthoredStory] authored story 로드 실패, 안전 기본 데이터로 대체합니다.\n" + message);
  applyAuthoredStoryAssets(createFallbackAuthoredStoryAssets());
}

export async function ensureAuthoredStoryLoaded(scene?: Phaser.Scene): Promise<void> {
  if (loadPromise) {
    return loadPromise;
  }

  loadPromise = loadAuthoredStoryJson(scene)
    .then(({ dialoguesRaw, sceneStatesRaw }) => {
      const authoredStory = buildAuthoredStoryAssetsFromJson(dialoguesRaw, sceneStatesRaw);
      if (authoredStory.warnings.length > 0) {
        console.warn("[AuthoredStory] authored story 경고\n" + authoredStory.warnings.join("\n"));
      }

      if (authoredStory.fatalIssues.length > 0) {
        const issueMessage =
          "[AuthoredStory] authored story 치명적 불일치가 감지되었습니다.\n" + authoredStory.fatalIssues.join("\n");
        console.error(issueMessage);
        throw new Error(issueMessage);
      }

      applyAuthoredStoryAssets(authoredStory);
    })
    .catch((error) => {
      installFallbackAuthoredStory(error);
    });

  return loadPromise;
}
