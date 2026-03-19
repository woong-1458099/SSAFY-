export const TIME_CYCLE = ["\uC624\uC804", "\uC624\uD6C4", "\uC800\uB141", "\uBC24"] as const;
export const DAY_CYCLE = [
  "\uC6D4\uC694\uC77C",
  "\uD654\uC694\uC77C",
  "\uC218\uC694\uC77C",
  "\uBAA9\uC694\uC77C",
  "\uAE08\uC694\uC77C",
  "\uD1A0\uC694\uC77C",
  "\uC77C\uC694\uC77C",
] as const;

const MORNING_TIME_INDEX = 0;
const FRIDAY_DAY_INDEX = 4;

export type TimeLabel = (typeof TIME_CYCLE)[number];
export type DayLabel = (typeof DAY_CYCLE)[number];

export type AdvanceTimeInput = {
  actionPoint: number;
  maxActionPoint: number;
  timeCycleIndex: number;
  dayCycleIndex: number;
  week: number;
  endingWeek?: number;
};

export type AdvanceTimeResult = {
  actionPoint: number;
  timeCycleIndex: number;
  dayCycleIndex: number;
  patch: {
    timeLabel: TimeLabel;
    dayLabel?: DayLabel;
    week?: number;
  };
  dayPassed: boolean;
  shouldStartEndingAfterUpdate: boolean;
};

function isEndingCutoffTransition(
  input: AdvanceTimeInput,
  nextTimeCycleIndex: number,
  endingWeek: number
): boolean {
  return input.week >= endingWeek && input.dayCycleIndex === FRIDAY_DAY_INDEX && nextTimeCycleIndex === MORNING_TIME_INDEX;
}

export function advanceTimeProgress(input: AdvanceTimeInput): AdvanceTimeResult {
  const endingWeek = input.endingWeek ?? 6;
  const nextActionPoint = Math.max(0, Math.min(input.maxActionPoint, input.actionPoint - 1));
  const nextTimeCycleIndex = (input.timeCycleIndex + 1) % TIME_CYCLE.length;

  let actionPoint = nextActionPoint;
  let dayCycleIndex = input.dayCycleIndex;
  let patch: AdvanceTimeResult["patch"] = {
    timeLabel: TIME_CYCLE[nextTimeCycleIndex],
  };
  let dayPassed = false;
  let shouldStartEndingAfterUpdate = false;

  if (nextTimeCycleIndex === 0) {
    dayPassed = true;
    actionPoint = input.maxActionPoint;
    dayCycleIndex = (input.dayCycleIndex + 1) % DAY_CYCLE.length;
    patch.dayLabel = DAY_CYCLE[dayCycleIndex];

    if (isEndingCutoffTransition(input, nextTimeCycleIndex, endingWeek)) {
      shouldStartEndingAfterUpdate = true;
    } else if (dayCycleIndex === 0) {
      if (input.week >= endingWeek) {
        shouldStartEndingAfterUpdate = true;
      } else {
        patch.week = input.week + 1;
      }
    }
  }

  return {
    actionPoint,
    timeCycleIndex: nextTimeCycleIndex,
    dayCycleIndex,
    patch,
    dayPassed,
    shouldStartEndingAfterUpdate,
  };
}

export function shouldTriggerEndingFlow(currentWeek: number, nextWeek?: number, endingWeek = 6): boolean {
  return typeof nextWeek === "number" && currentWeek <= endingWeek && nextWeek > endingWeek;
}
