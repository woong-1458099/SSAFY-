import { DIALOGUE_IDS } from "../../../common/enums/dialogue";
import type { PlayerSnapshot } from "../../../common/types/player";
import type { SceneState } from "../../../common/types/sceneState";
import type { InventorySnapshot } from "../../../features/inventory/InventoryService";
import type { EndingFlowPayload, EndingId, EndingResult } from "../../../features/progression/types/ending";
import type { SavePayload } from "../../../features/save/SaveService";
import type { RuntimeGameState } from "../../state/gameState";
import type { SceneId } from "../../scripts/scenes/sceneIds";
import { normalizeSceneState } from "../../systems/sceneStateRuntime";
import type { AreaId } from "../../../common/enums/area";
import type { ProgressionSnapshot } from "../../managers/ProgressionManager";
import type { StoryEventSnapshot } from "../../managers/StoryEventManager";

type NpcSnapshotLike = {
  id: string;
  x: number;
  y: number;
  facing: string;
};

type BuildMainSceneSavePayloadArgs = {
  gameState: RuntimeGameState;
  inventory: InventorySnapshot;
  progression?: ProgressionSnapshot;
  areaId?: AreaId;
  sceneId?: SceneId;
  baseSceneState?: SceneState;
  npcSnapshots?: NpcSnapshotLike[];
  playerSnapshot?: PlayerSnapshot;
  story?: StoryEventSnapshot;
};

type BuildEndingPayloadArgs = {
  gameState: RuntimeGameState;
  overrides?: Partial<EndingFlowPayload>;
};

export function buildCurrentSceneStateSnapshot(
  baseSceneState?: SceneState,
  npcSnapshots?: NpcSnapshotLike[]
): SceneState | undefined {
  if (!baseSceneState || !npcSnapshots?.length) {
    return baseSceneState;
  }

  const dialogueIdByNpcId = new Map(
    baseSceneState.npcs.map((npc) => [npc.npcId, npc.dialogueId] as const)
  );
  const fallbackDialogueId = baseSceneState.npcs[0]?.dialogueId ?? DIALOGUE_IDS.minsuIntro;

  return normalizeSceneState({
    ...baseSceneState,
    npcs: npcSnapshots.map((npc) => ({
      npcId: npc.id,
      x: npc.x,
      y: npc.y,
      facing: npc.facing,
      dialogueId: dialogueIdByNpcId.get(npc.id) ?? fallbackDialogueId
    }))
  });
}

export function buildMainSceneSavePayload(args: BuildMainSceneSavePayloadArgs): SavePayload {
  return {
    gameState: args.gameState,
    inventory: args.inventory,
    progression: args.progression,
    world: {
      areaId: args.areaId ?? "world",
      sceneId: args.sceneId,
      sceneState: buildCurrentSceneStateSnapshot(args.baseSceneState, args.npcSnapshots),
      playerTile: args.playerSnapshot
        ? {
            tileX: args.playerSnapshot.tileX,
            tileY: args.playerSnapshot.tileY
          }
        : undefined
    },
    story: args.story
  };
}

export function buildMainSceneEndingPayload(args: BuildEndingPayloadArgs): EndingFlowPayload {
  const hudState = args.gameState.hud;
  const statsState = args.gameState.stats;
  const endingProgress = args.gameState.endingProgress;

  return {
    fe: statsState.fe,
    be: statsState.be,
    teamwork: statsState.teamwork,
    luck: statsState.luck,
    hp: hudState.hp,
    hpMax: hudState.hpMax,
    stress: hudState.stress,
    gamePlayCount: endingProgress.gamePlayCount,
    lottoRank: endingProgress.lottoRank,
    week: hudState.week,
    dayLabel: hudState.dayLabel,
    timeLabel: hudState.timeLabel,
    ...args.overrides
  };
}

export function buildEndingPresetPayload(
  endingId: EndingId,
  fallbackBuilder: () => EndingFlowPayload
): EndingFlowPayload {
  const base: Pick<EndingFlowPayload, "week" | "dayLabel" | "timeLabel" | "hpMax" | "stress" | "gamePlayCount" | "lottoRank"> = {
    week: 6,
    hpMax: 100,
    stress: 24,
    gamePlayCount: 0,
    lottoRank: null,
    dayLabel: "금요일",
    timeLabel: "밤"
  };

  switch (endingId) {
    case "lotto":
      return { ...base, fe: 30, be: 24, teamwork: 28, luck: 200, hp: 84, lottoRank: 1 };
    case "game_over":
      return { ...base, fe: 90, be: 84, teamwork: 72, luck: 40, hp: 0, stress: 92 };
    case "runaway":
      return { ...base, fe: 110, be: 106, teamwork: 104, luck: 52, hp: 38, stress: 100 };
    case "largecompany":
      return { ...base, fe: 180, be: 170, teamwork: 165, luck: 58, hp: 72 };
    case "lucky_job":
      return { ...base, fe: 88, be: 74, teamwork: 80, luck: 190, hp: 70 };
    case "gamer":
      return { ...base, fe: 70, be: 52, teamwork: 64, luck: 162, hp: 76, gamePlayCount: 18 };
    case "frontend_master":
      return { ...base, fe: 260, be: 92, teamwork: 118, luck: 46, hp: 68 };
    case "backend_master":
      return { ...base, fe: 82, be: 220, teamwork: 94, luck: 42, hp: 66 };
    case "collaborative_dev":
      return { ...base, fe: 170, be: 160, teamwork: 220, luck: 44, hp: 82 };
    case "leader_type":
      return { ...base, fe: 120, be: 118, teamwork: 260, luck: 40, hp: 88 };
    case "health_trainer":
      return { ...base, fe: 70, be: 68, teamwork: 108, luck: 34, hp: 96, hpMax: 210 };
    case "normal":
      return { ...base, fe: 118, be: 112, teamwork: 124, luck: 78, hp: 74 };
    default:
      return fallbackBuilder();
  }
}

export function buildEndingAutoSavePayload(
  payload: SavePayload,
  ending: EndingResult
): SavePayload {
  if (ending.autoSaveMode !== "recoverable" || !ending.autoSaveRestoreOverrides) {
    return payload;
  }

  const overrides = ending.autoSaveRestoreOverrides;
  const nextHud = { ...payload.gameState.hud };
  const nextStats = { ...payload.gameState.stats };
  const nextEndingProgress = { ...payload.gameState.endingProgress };

  if (typeof overrides.hp === "number") {
    nextHud.hp = overrides.hp;
  }
  if (typeof overrides.hpMax === "number") {
    nextHud.hpMax = overrides.hpMax;
  }
  if (typeof overrides.stress === "number") {
    nextHud.stress = overrides.stress;
    nextStats.stress = overrides.stress;
  }
  if (typeof overrides.fe === "number") {
    nextStats.fe = overrides.fe;
  }
  if (typeof overrides.be === "number") {
    nextStats.be = overrides.be;
  }
  if (typeof overrides.teamwork === "number") {
    nextStats.teamwork = overrides.teamwork;
  }
  if (typeof overrides.luck === "number") {
    nextStats.luck = overrides.luck;
  }
  if (typeof overrides.gamePlayCount === "number") {
    nextEndingProgress.gamePlayCount = overrides.gamePlayCount;
  }
  if ("lottoRank" in overrides) {
    nextEndingProgress.lottoRank = overrides.lottoRank ?? null;
  }

  return {
    ...payload,
    gameState: {
      ...payload.gameState,
      hud: nextHud,
      stats: nextStats,
      endingProgress: nextEndingProgress
    }
  };
}
