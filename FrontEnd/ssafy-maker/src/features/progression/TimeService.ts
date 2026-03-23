import type { HudState } from "../../game/state/gameState";

export const TIME_CYCLE = ["오전", "오후", "저녁", "밤"] as const;
export const DAY_CYCLE = ["월요일", "화요일", "수요일", "목요일", "금요일", "토요일", "일요일"] as const;

export type TimeLabel = (typeof TIME_CYCLE)[number];
export type DayLabel = (typeof DAY_CYCLE)[number];

export type TimeState = {
  actionPoint: number;
  maxActionPoint: number;
  timeCycleIndex: number;
  dayCycleIndex: number;
  week: number;
};

export type AdvanceTimeResult = {
  next: TimeState;
  hudPatch: Partial<HudState>;
  dayPassed: boolean;
  shouldStartEndingAfterUpdate: boolean;
};

const DEFAULT_ENDING_WEEK = 6;

export function createDefaultTimeState(): TimeState {
  return {
    actionPoint: 4,
    maxActionPoint: 4,
    timeCycleIndex: 0,
    dayCycleIndex: 0,
    week: 1
  };
}

export function buildHudPatchFromTimeState(timeState: TimeState): Partial<HudState> {
  return {
    timeLabel: TIME_CYCLE[timeState.timeCycleIndex],
    dayLabel: DAY_CYCLE[timeState.dayCycleIndex],
    week: timeState.week,
    actionPoint: timeState.actionPoint,
    maxActionPoint: timeState.maxActionPoint
  };
}

export function advanceTime(timeState: TimeState): AdvanceTimeResult {
  const nextTimeCycleIndex = (timeState.timeCycleIndex + 1) % TIME_CYCLE.length;
  const nextActionPoint = Math.max(0, Math.min(timeState.maxActionPoint, timeState.actionPoint - 1));

  let nextDayCycleIndex = timeState.dayCycleIndex;
  let nextWeek = timeState.week;
  let nextAvailableActionPoint = nextActionPoint;
  let dayPassed = false;
  let shouldStartEndingAfterUpdate = false;

  if (nextTimeCycleIndex === 0) {
    dayPassed = true;
    nextAvailableActionPoint = timeState.maxActionPoint;
    nextDayCycleIndex = (timeState.dayCycleIndex + 1) % DAY_CYCLE.length;
    if (nextDayCycleIndex === 0) {
      const candidateWeek = timeState.week + 1;
      if (candidateWeek > DEFAULT_ENDING_WEEK) {
        shouldStartEndingAfterUpdate = true;
      } else {
        nextWeek = candidateWeek;
      }
    }
  }

  const next: TimeState = {
    ...timeState,
    actionPoint: nextAvailableActionPoint,
    timeCycleIndex: nextTimeCycleIndex,
    dayCycleIndex: nextDayCycleIndex,
    week: nextWeek
  };

  return {
    next,
    hudPatch: buildHudPatchFromTimeState(next),
    dayPassed,
    shouldStartEndingAfterUpdate
  };
}
