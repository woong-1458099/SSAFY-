// 기본 상태 번들을 실제 씬 액션과 상호작용용 조회 데이터로 변환한다.
import type { SpawnNpcAction } from "../../common/types/sceneAction";
import type { SceneScript } from "../../common/types/sceneScript";
import type { SceneState } from "../../common/types/sceneState";

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
  return {
    ...script,
    actions: [...buildSceneStateSpawnActions(sceneState), ...script.actions]
  };
}
