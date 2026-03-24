import Phaser from "phaser";
import { createWeeklyPlannerModal } from "../../features/planning/weeklyPlannerModal";
import {
  createDefaultWeeklyPlan,
  getWeeklyPlanOption,
  getWeeklyPlanSlotIndex,
  parseWeeklyPlanOptionId,
  type WeeklyPlanOptionId
} from "../../features/planning/weeklyPlan";
import { createWeeklySalaryModal } from "../../features/progression/weeklySalaryModal";
import {
  DAY_CYCLE,
  TIME_CYCLE,
  advanceTime,
  buildHudPatchFromTimeState,
  createDefaultTimeState,
  type TimeState
} from "../../features/progression/TimeService";
import type { HudState, PlayerStatKey } from "../state/gameState";

const WEEKLY_SALARY_AMOUNT = 50000;

type ProgressionSnapshot = {
  timeState: TimeState;
  weeklyPlan: WeeklyPlanOptionId[];
  weeklyPlanWeek: number;
  lastPaidWeeklySalaryWeek: number;
};

type ProgressionManagerOptions = {
  scene: Phaser.Scene;
  getHudState: () => HudState;
  patchHudState: (next: Partial<HudState>) => void;
  applyStatDelta: (delta: Partial<Record<PlayerStatKey, number>>, multiplier?: 1 | -1) => void;
  getFixedEventSlots?: (week: number) => ReadonlyMap<number, string>;
  resolveTimeAdvanceBlockedMessage?: () => string | null;
  onNotice?: (message: string) => void;
  onStartEndingFlow?: () => void;
};

export type ConsumeActionPointFailureReason = "no-action-point" | "blocked-time-advance" | "busy";

export type ConsumeActionPointResult =
  | { ok: true }
  | {
      ok: false;
      reason: ConsumeActionPointFailureReason;
      message?: string;
    };

export class ProgressionManager {
  private readonly scene: Phaser.Scene;
  private readonly getHudState: () => HudState;
  private readonly patchHudState: (next: Partial<HudState>) => void;
  private readonly applyStatDelta: (delta: Partial<Record<PlayerStatKey, number>>, multiplier?: 1 | -1) => void;
  private readonly getFixedEventSlots?: (week: number) => ReadonlyMap<number, string>;
  private readonly resolveTimeAdvanceBlockedMessage?: () => string | null;
  private readonly onNotice?: (message: string) => void;
  private readonly onStartEndingFlow?: () => void;

  private timeState: TimeState = createDefaultTimeState();
  private weeklyPlan: WeeklyPlanOptionId[] = createDefaultWeeklyPlan();
  private weeklyPlanWeek = 0;
  private lastPaidWeeklySalaryWeek = 0;
  private pendingWeeklySalaryWeek: number | null = null;
  private plannerRoot?: Phaser.GameObjects.Container;
  private salaryRoot?: Phaser.GameObjects.Container;
  private endingFlowStarted = false;

  constructor(options: ProgressionManagerOptions) {
    this.scene = options.scene;
    this.getHudState = options.getHudState;
    this.patchHudState = options.patchHudState;
    this.applyStatDelta = options.applyStatDelta;
    this.getFixedEventSlots = options.getFixedEventSlots;
    this.resolveTimeAdvanceBlockedMessage = options.resolveTimeAdvanceBlockedMessage;
    this.onNotice = options.onNotice;
    this.onStartEndingFlow = options.onStartEndingFlow;
  }

  initialize(): void {
    this.patchHudState(buildHudPatchFromTimeState(this.timeState));
  }

  destroy(): void {
    this.closeSalaryModal();
    this.closePlanner();
  }

  isPlannerOpen(): boolean {
    return Boolean(this.plannerRoot?.visible || this.salaryRoot?.visible);
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

  getTimeState(): TimeState {
    return { ...this.timeState };
  }

  processAutomaticFlow(): boolean {
    if (this.endingFlowStarted) {
      return false;
    }
    this.grantWeeklySalaryIfDue();
    if (this.pendingWeeklySalaryWeek !== null) {
      this.openSalaryModal();
      return true;
    }
    if (this.shouldOpenWeeklyPlanner()) {
      this.openPlanner();
      return true;
    }
    return false;
  }

  consumeActionPoint(options?: {
    ignoreTimeAdvanceBlock?: boolean;
  }): boolean {
    return this.tryConsumeActionPoint({
      ignoreTimeAdvanceBlock: options?.ignoreTimeAdvanceBlock,
      notifyOnFailure: true
    }).ok;
  }

  tryConsumeActionPoint(options?: {
    ignoreTimeAdvanceBlock?: boolean;
    notifyOnFailure?: boolean;
  }): ConsumeActionPointResult {
    if (this.timeState.actionPoint <= 0) {
      const message = "행동력이 부족합니다";
      if (options?.notifyOnFailure !== false) {
        this.onNotice?.(message);
      }
      return {
        ok: false,
        reason: "no-action-point",
        message
      };
    }
    if (this.salaryRoot?.visible) {
      return {
        ok: false,
        reason: "busy"
      };
    }
    if (!options?.ignoreTimeAdvanceBlock) {
      const blockedMessage = this.resolveTimeAdvanceBlockedMessage?.() ?? null;
      if (blockedMessage) {
        if (options?.notifyOnFailure !== false) {
          this.onNotice?.(blockedMessage);
        }
        return {
          ok: false,
          reason: "blocked-time-advance",
          message: blockedMessage
        };
      }
    }

    const result = advanceTime(this.timeState);
    this.timeState = result.next;
    this.patchHudState(result.hudPatch);

    if (result.dayPassed && this.timeState.dayCycleIndex === 0) {
      this.weeklyPlan = createDefaultWeeklyPlan();
    }

    this.grantWeeklySalaryIfDue();
    if (result.shouldStartEndingAfterUpdate) {
      this.requestEndingFlow();
    }
    return { ok: true };
  }

  debugAdvanceTime(): void {
    this.closeSalaryModal();
    this.closePlanner();

    const result = advanceTime(this.timeState);
    this.timeState = result.next;
    this.patchHudState(result.hudPatch);

    if (result.dayPassed && this.timeState.dayCycleIndex === 0) {
      this.weeklyPlan = createDefaultWeeklyPlan();
    }

    this.grantWeeklySalaryIfDue();
    if (result.shouldStartEndingAfterUpdate) {
      this.requestEndingFlow();
    }
  }

  debugPatchTimeState(next: Partial<TimeState>): void {
    this.closeSalaryModal();
    this.closePlanner();

    const maxActionPoint = Math.max(0, Math.round(next.maxActionPoint ?? this.timeState.maxActionPoint));
    const actionPoint = Phaser.Math.Clamp(
      Math.round(next.actionPoint ?? this.timeState.actionPoint),
      0,
      maxActionPoint
    );

    this.timeState = {
      ...this.timeState,
      ...next,
      maxActionPoint,
      actionPoint,
      timeCycleIndex: Phaser.Math.Clamp(
        Math.round(next.timeCycleIndex ?? this.timeState.timeCycleIndex),
        0,
        TIME_CYCLE.length - 1
      ),
      dayCycleIndex: Phaser.Math.Clamp(
        Math.round(next.dayCycleIndex ?? this.timeState.dayCycleIndex),
        0,
        DAY_CYCLE.length - 1
      ),
      week: Math.max(1, Math.round(next.week ?? this.timeState.week))
    };

    this.pendingWeeklySalaryWeek = null;
    this.endingFlowStarted = false;
    this.patchHudState(buildHudPatchFromTimeState(this.timeState));
  }

  private requestEndingFlow(): void {
    if (this.endingFlowStarted) {
      return;
    }

    this.endingFlowStarted = true;
    this.closeSalaryModal();
    this.closePlanner();
    this.onStartEndingFlow?.();
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
      weeklyPlanWeek: this.weeklyPlanWeek,
      lastPaidWeeklySalaryWeek: this.lastPaidWeeklySalaryWeek
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
      this.weeklyPlanWeek = Math.max(0, Math.round(snapshot.weeklyPlanWeek));
    }
    if (typeof snapshot?.lastPaidWeeklySalaryWeek === "number") {
      this.lastPaidWeeklySalaryWeek = Math.max(0, Math.round(snapshot.lastPaidWeeklySalaryWeek));
    }
    this.pendingWeeklySalaryWeek = null;
    this.patchHudState(buildHudPatchFromTimeState(this.timeState));
  }

  private openPlanner(): void {
    if (this.plannerRoot?.visible || this.salaryRoot?.visible) {
      return;
    }

    this.closePlanner();
    this.plannerRoot = createWeeklyPlannerModal(this.scene, {
      week: this.timeState.week,
      dayLabels: DAY_CYCLE,
      currentDayLabel: DAY_CYCLE[this.timeState.dayCycleIndex],
      currentTimeLabel: buildHudPatchFromTimeState(this.timeState).timeLabel ?? "오전",
      actionPoint: this.timeState.actionPoint,
      maxActionPoint: this.timeState.maxActionPoint,
      fixedEventSlots: this.getFixedEventSlots?.(this.timeState.week) ?? new Map(),
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

  private openSalaryModal(): void {
    const week = this.pendingWeeklySalaryWeek;
    if (week === null || this.salaryRoot?.visible) {
      return;
    }

    this.closeSalaryModal();
    this.salaryRoot = createWeeklySalaryModal(this.scene, {
      week,
      amount: WEEKLY_SALARY_AMOUNT,
      onConfirm: () => {
        this.closeSalaryModal();
        this.processAutomaticFlow();
      }
    });
    this.pendingWeeklySalaryWeek = null;
  }

  private closeSalaryModal(): void {
    this.salaryRoot?.destroy(true);
    this.salaryRoot = undefined;
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

  private shouldPayWeeklySalary(): boolean {
    return this.timeState.dayCycleIndex === 0 && this.timeState.week > this.lastPaidWeeklySalaryWeek;
  }

  private grantWeeklySalaryIfDue(): boolean {
    if (!this.shouldPayWeeklySalary()) {
      return false;
    }

    this.lastPaidWeeklySalaryWeek = this.timeState.week;
    this.pendingWeeklySalaryWeek = this.timeState.week;
    const hudState = this.getHudState();
    this.patchHudState({
      money: hudState.money + WEEKLY_SALARY_AMOUNT
    });
    return true;
  }

  private shouldOpenWeeklyPlanner(): boolean {
    return this.timeState.dayCycleIndex === 0 && this.weeklyPlanWeek < this.timeState.week;
  }
}
