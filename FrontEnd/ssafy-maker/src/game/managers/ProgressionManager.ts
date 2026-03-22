import Phaser from "phaser";
import { createWeeklyPlannerModal } from "../../features/planning/weeklyPlannerModal";
import {
  createDefaultWeeklyPlan,
  getWeeklyPlanOption,
  getWeeklyPlanSlotIndex,
  parseWeeklyPlanOptionId,
  type WeeklyPlanOptionId
} from "../../features/planning/weeklyPlan";
import {
  DAY_CYCLE,
  advanceTime,
  buildHudPatchFromTimeState,
  createDefaultTimeState,
  type TimeState
} from "../../features/progression/TimeService";
import type { HudState, PlayerStatKey } from "../state/gameState";

type ProgressionSnapshot = {
  timeState: TimeState;
  weeklyPlan: WeeklyPlanOptionId[];
  weeklyPlanWeek: number;
};

type ProgressionManagerOptions = {
  scene: Phaser.Scene;
  patchHudState: (next: Partial<HudState>) => void;
  applyStatDelta: (delta: Partial<Record<PlayerStatKey, number>>, multiplier?: 1 | -1) => void;
  onNotice?: (message: string) => void;
};

export class ProgressionManager {
  private readonly scene: Phaser.Scene;
  private readonly patchHudState: (next: Partial<HudState>) => void;
  private readonly applyStatDelta: (delta: Partial<Record<PlayerStatKey, number>>, multiplier?: 1 | -1) => void;
  private readonly onNotice?: (message: string) => void;

  private timeState: TimeState = createDefaultTimeState();
  private weeklyPlan: WeeklyPlanOptionId[] = createDefaultWeeklyPlan();
  private weeklyPlanWeek = 1;
  private plannerRoot?: Phaser.GameObjects.Container;

  constructor(options: ProgressionManagerOptions) {
    this.scene = options.scene;
    this.patchHudState = options.patchHudState;
    this.applyStatDelta = options.applyStatDelta;
    this.onNotice = options.onNotice;
  }

  initialize(): void {
    this.patchHudState(buildHudPatchFromTimeState(this.timeState));
  }

  destroy(): void {
    this.closePlanner();
  }

  isPlannerOpen(): boolean {
    return Boolean(this.plannerRoot?.visible);
  }

  getTimeCycleIndex(): number {
    return this.timeState.timeCycleIndex;
  }

  getActionPoint(): number {
    return this.timeState.actionPoint;
  }

  getMaxActionPoint(): number {
    return this.timeState.maxActionPoint;
  }

  consumeActionPoint(): boolean {
    if (this.timeState.actionPoint <= 0) {
      this.onNotice?.("행동력이 부족합니다");
      return false;
    }

    const result = advanceTime(this.timeState);
    this.timeState = result.next;
    this.patchHudState(result.hudPatch);

    if (this.timeState.week > this.weeklyPlanWeek) {
      this.weeklyPlan = createDefaultWeeklyPlan();
      this.weeklyPlanWeek = this.timeState.week;
    }

    return true;
  }

  togglePlanner(): void {
    if (this.isPlannerOpen()) {
      this.closePlanner();
      return;
    }
    this.openPlanner();
  }

  getSnapshot(): ProgressionSnapshot {
    return {
      timeState: { ...this.timeState },
      weeklyPlan: [...this.weeklyPlan],
      weeklyPlanWeek: this.weeklyPlanWeek
    };
  }

  restore(snapshot?: Partial<ProgressionSnapshot>): void {
    if (snapshot?.timeState) {
      this.timeState = { ...snapshot.timeState };
    }
    if (Array.isArray(snapshot?.weeklyPlan) && snapshot.weeklyPlan.length === this.weeklyPlan.length) {
      this.weeklyPlan = snapshot.weeklyPlan.map((value, index) =>
        parseWeeklyPlanOptionId(value) ?? this.weeklyPlan[index]
      );
    }
    if (typeof snapshot?.weeklyPlanWeek === "number") {
      this.weeklyPlanWeek = Math.max(1, Math.round(snapshot.weeklyPlanWeek));
    }
    this.patchHudState(buildHudPatchFromTimeState(this.timeState));
  }

  private openPlanner(): void {
    this.closePlanner();
    this.plannerRoot = createWeeklyPlannerModal(this.scene, {
      week: this.timeState.week,
      dayLabels: DAY_CYCLE,
      currentDayLabel: DAY_CYCLE[this.timeState.dayCycleIndex],
      currentTimeLabel: buildHudPatchFromTimeState(this.timeState).timeLabel ?? "오전",
      actionPoint: this.timeState.actionPoint,
      maxActionPoint: this.timeState.maxActionPoint,
      initialPlan: this.weeklyPlan,
      onConfirm: (plan) => {
        this.weeklyPlan = [...plan];
        this.weeklyPlanWeek = this.timeState.week;
        this.onNotice?.(`${this.timeState.week}주차 계획표 저장 완료`);
        this.closePlanner();
      },
      onAdvance: (plan) => {
        this.weeklyPlan = [...plan];
        this.weeklyPlanWeek = this.timeState.week;
        this.advanceCurrentSlot();
        this.closePlanner();
      }
    });
  }

  private closePlanner(): void {
    this.plannerRoot?.destroy(true);
    this.plannerRoot = undefined;
  }

  private advanceCurrentSlot(): void {
    const previousState = {
      dayCycleIndex: this.timeState.dayCycleIndex,
      timeCycleIndex: this.timeState.timeCycleIndex
    };

    if (!this.consumeActionPoint()) {
      return;
    }

    if (previousState.dayCycleIndex < 5 && previousState.timeCycleIndex < 2) {
      const slotIndex = getWeeklyPlanSlotIndex(previousState.dayCycleIndex, previousState.timeCycleIndex);
      const option = getWeeklyPlanOption(this.weeklyPlan[slotIndex]);
      this.applyStatDelta(option.statDelta, 1);
      this.onNotice?.(`${option.label} 완료`);
    } else {
      this.onNotice?.("이번 시간대에는 계획 보상이 없습니다");
    }
  }
}
