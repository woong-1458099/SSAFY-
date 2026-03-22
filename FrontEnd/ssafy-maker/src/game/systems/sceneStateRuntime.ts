// 기본 상태 번들을 실제 씬 액션과 상호작용용 조회 데이터로 변환한다.
import type { SpawnNpcAction } from "../../common/types/sceneAction";
import type { SceneScript } from "../../common/types/sceneScript";
import type { SceneState, SceneStateNpc } from "../../common/types/sceneState";
import { DEFAULT_SCENE_STATE_NPC_FACING } from "../definitions/sceneStates/sceneStateDefaults";
import { resolveSceneStateId } from "../definitions/sceneStates/sceneStateIds";

function normalizeSceneStateNpc(npc: SceneStateNpc): SceneStateNpc {
  return {
    ...npc,
    // 한 줄 한글 설명: 씬 상태에 시선 방향이 없으면 정면을 보는 방향으로 고정한다.
    facing: npc.facing ?? DEFAULT_SCENE_STATE_NPC_FACING
  };
}

export function normalizeSceneState(sceneState?: SceneState): SceneState | undefined {
  if (!sceneState) {
    return undefined;
  }

  const resolvedSceneStateId = resolveSceneStateId(sceneState.id);

  return {
    ...sceneState,
    id: resolvedSceneStateId ?? sceneState.id,
    npcs: sceneState.npcs.map(normalizeSceneStateNpc)
  };
}

export function buildSceneStateSpawnActions(sceneState?: SceneState): SpawnNpcAction[] {
  if (!sceneState) {
    return [];
  }

  return sceneState.npcs.map((npc) => ({
    type: "spawnNpc",
    npcId: npc.npcId,
    x: npc.x,
    y: npc.y,
    facing: npc.facing
  }));
}

export function buildRuntimeSceneScript(script: SceneScript, sceneState?: SceneState): SceneScript {
  const normalizedSceneState = normalizeSceneState(sceneState);

  return {
    ...script,
    actions: [...buildSceneStateSpawnActions(normalizedSceneState), ...script.actions]
  };
}
