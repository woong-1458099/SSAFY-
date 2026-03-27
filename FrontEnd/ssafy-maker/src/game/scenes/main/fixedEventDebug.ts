import Phaser from "phaser";
import { buildHudPatchFromTimeState, DAY_CYCLE, TIME_CYCLE } from "../../../features/progression/TimeService";
import type { FixedEventDebugEntry } from "../../../features/story/fixedEventDebug";
import type { SavePayload } from "../../../features/save/SaveService";
import { getDefaultSceneIdForArea } from "../../scripts/scenes/sceneRegistry";

export function buildDebugFixedEventJumpPayload(
  payload: SavePayload,
  event: FixedEventDebugEntry,
  options: {
    resetCompletion: boolean;
  }
): SavePayload {
  const nextPayload: SavePayload = {
    ...payload,
    gameState: {
      ...payload.gameState,
      hud: { ...payload.gameState.hud },
      stats: { ...payload.gameState.stats },
      affection: { ...payload.gameState.affection },
      flags: [...payload.gameState.flags],
      endingProgress: { ...payload.gameState.endingProgress }
    },
    progression: payload.progression
      ? {
          ...payload.progression,
          timeState: { ...payload.progression.timeState },
          weeklyPlan: [...payload.progression.weeklyPlan]
        }
      : undefined,
    world: payload.world ? { ...payload.world } : undefined,
    story: payload.story
      ? {
          completedFixedEventIds: [...payload.story.completedFixedEventIds]
        }
      : undefined
  };

  const targetSceneId = getDefaultSceneIdForArea(event.areaId);
  const timeCycleIndex = Math.max(0, TIME_CYCLE.findIndex((label) => label === event.timeOfDay));
  const dayCycleIndex = Phaser.Math.Clamp(event.day - 1, 0, DAY_CYCLE.length - 1);

  if (nextPayload.progression) {
    nextPayload.progression.timeState = {
      ...nextPayload.progression.timeState,
      week: event.week,
      dayCycleIndex,
      timeCycleIndex,
      actionPoint: nextPayload.progression.timeState.maxActionPoint
    };
    nextPayload.progression.weeklyPlanWeek = event.week;
    nextPayload.progression.lastPaidWeeklySalaryWeek = Math.max(nextPayload.progression.lastPaidWeeklySalaryWeek, event.week);
  }

  nextPayload.gameState.hud = {
    ...nextPayload.gameState.hud,
    ...buildHudPatchFromTimeState(nextPayload.progression?.timeState ?? {
      actionPoint: nextPayload.gameState.hud.actionPoint,
      maxActionPoint: nextPayload.gameState.hud.maxActionPoint,
      timeCycleIndex,
      dayCycleIndex,
      week: event.week
    }),
    locationLabel: event.locationLabel
  };

  if (options.resetCompletion) {
    nextPayload.story = {
      completedFixedEventIds: (nextPayload.story?.completedFixedEventIds ?? []).filter((completedEventId) => completedEventId !== event.eventId)
    };
  }

  nextPayload.world = {
    areaId: event.areaId,
    sceneId: targetSceneId
  };

  return nextPayload;
}
