import { buildAuthoredStoryAssetsFromJson } from "../../features/story/authoredStoryAdapter";
import { setSceneStateRegistry } from "../../game/definitions/sceneStates/sceneStateRegistry";
import { setDialogueRegistry } from "../../game/scripts/dialogues/dialogueRegistry";

const AUTHORED_DIALOGUES_URL = "/assets/game/data/story/authored/dialogues.json";
const SCENE_STATES_URL = "/assets/game/data/story/authored/scene_states.json";

let loadPromise: Promise<void> | null = null;

async function loadJson(url: string): Promise<unknown> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to load story asset: ${url} (${response.status})`);
  }
  return response.json();
}

export async function ensureAuthoredStoryLoaded(): Promise<void> {
  if (loadPromise) {
    return loadPromise;
  }

  loadPromise = Promise.all([loadJson(AUTHORED_DIALOGUES_URL), loadJson(SCENE_STATES_URL)])
    .then(([dialoguesRaw, sceneStatesRaw]) => {
      const authoredStory = buildAuthoredStoryAssetsFromJson(dialoguesRaw, sceneStatesRaw);
      if (authoredStory.issues.length > 0) {
        const issueMessage =
          "[AuthoredStory] authored story 데이터 불일치가 감지되었습니다.\n" + authoredStory.issues.join("\n");
        console.error(issueMessage);
        if (import.meta.env.DEV) {
          throw new Error(issueMessage);
        }
      }

      setDialogueRegistry(authoredStory.dialogues);
      setSceneStateRegistry(authoredStory.sceneStates);
    })
    .catch((error) => {
      loadPromise = null;
      throw error;
    });

  return loadPromise;
}
