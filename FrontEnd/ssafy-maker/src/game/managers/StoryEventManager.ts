import Phaser from "phaser";
import type { DialogueScript } from "../../common/types/dialogue";
import type { HudState } from "../state/gameState";
import { TIME_CYCLE } from "../../features/progression/TimeService";
import { getWeeklyPlanSlotIndex, WEEKLY_PLAN_TIME_LABELS } from "../../features/planning/weeklyPlan";
import {
  buildDialogueScriptFromFixedEventEntry,
  findMatchingFixedEvent,
  getFixedEventEntries,
  type FixedEventEntry
} from "../../features/story/jsonDialogueAdapter";
import { loadFixedEventWeek } from "../../infra/story/fixedEventRepository";

export type StoryEventSnapshot = {
  completedFixedEventIds: string[];
};

type StoryEventManagerOptions = {
  scene: Phaser.Scene;
  getHudState: () => HudState;
  getCurrentLocation: () => string;
  getPlayerName: () => string;
  setRuntimeDialogueScript: (script: DialogueScript) => void;
  removeRuntimeDialogueScript: (dialogueId: string) => void;
  playDialogue: (dialogueId: string) => Promise<void>;
  advanceTimeAfterFixedEvent: () => void;
  onNotice?: (message: string) => void;
};

export class StoryEventManager {
  private static readonly FIXED_EVENT_DIALOGUE_ID = "fixed_event_runtime";

  private readonly scene: Phaser.Scene;
  private readonly getHudState: () => HudState;
  private readonly getCurrentLocation: () => string;
  private readonly getPlayerName: () => string;
  private readonly setRuntimeDialogueScript: (script: DialogueScript) => void;
  private readonly removeRuntimeDialogueScript: (dialogueId: string) => void;
  private readonly playDialogue: (dialogueId: string) => Promise<void>;
  private readonly advanceTimeAfterFixedEvent: () => void;
  private readonly onNotice?: (message: string) => void;

  private readonly weekData = new Map<number, unknown>();
  private readonly weekLoads = new Map<number, Promise<unknown>>();
  private completedFixedEventIds: string[] = [];
  private activeFixedEventId: string | null = null;
  private starting = false;

  constructor(options: StoryEventManagerOptions) {
    this.scene = options.scene;
    this.getHudState = options.getHudState;
    this.getCurrentLocation = options.getCurrentLocation;
    this.getPlayerName = options.getPlayerName;
    this.setRuntimeDialogueScript = options.setRuntimeDialogueScript;
    this.removeRuntimeDialogueScript = options.removeRuntimeDialogueScript;
    this.playDialogue = options.playDialogue;
    this.advanceTimeAfterFixedEvent = options.advanceTimeAfterFixedEvent;
    this.onNotice = options.onNotice;
  }

  async initialize(week: number): Promise<void> {
    await this.ensureWeekLoaded(week);
  }

  destroy(): void {
    this.activeFixedEventId = null;
    this.starting = false;
    this.removeRuntimeDialogueScript(StoryEventManager.FIXED_EVENT_DIALOGUE_ID);
  }

  restore(snapshot?: Partial<StoryEventSnapshot>): void {
    this.completedFixedEventIds = Array.isArray(snapshot?.completedFixedEventIds)
      ? snapshot.completedFixedEventIds.filter((value): value is string => typeof value === "string")
      : [];
  }

  getSnapshot(): StoryEventSnapshot {
    return {
      completedFixedEventIds: [...this.completedFixedEventIds]
    };
  }

  syncWeek(week: number): void {
    void this.ensureWeekLoaded(week);
  }

  getFixedEventSlotsForWeek(week: number): ReadonlyMap<number, string> {
    const rawData = this.weekData.get(week);
    if (!rawData) {
      this.syncWeek(week);
      return new Map();
    }

    const slots = new Map<number, string>();
    const entries = getFixedEventEntries(rawData);

    entries.forEach((event) => {
      const timing = event.triggerTiming;
      if (!timing || event.eventType !== "FIXED") {
        return;
      }

      const day = Math.round(timing.day ?? -1);
      if (day < 1 || day > 5) {
        return;
      }

      const normalizedTime = typeof timing.timeOfDay === "string" ? timing.timeOfDay.trim() : "";
      const timeIndex = TIME_CYCLE.findIndex((label) => label === normalizedTime);
      if (timeIndex < 0 || timeIndex >= WEEKLY_PLAN_TIME_LABELS.length) {
        return;
      }

      const slotIndex = getWeeklyPlanSlotIndex(day - 1, timeIndex);
      const eventName =
        typeof event.eventName === "string" && event.eventName.trim().length > 0
          ? event.eventName.trim()
          : "고정 이벤트";
      slots.set(slotIndex, eventName);
    });

    return slots;
  }

  tryStartCurrentFixedEvent(): void {
    const hudState = this.getHudState();
    const week = hudState.week;
    const rawData = this.weekData.get(week);

    if (this.starting || this.activeFixedEventId || !rawData) {
      this.syncWeek(week);
      return;
    }

    const event = findMatchingFixedEvent(
      rawData,
      {
        week,
        day: this.resolveDayIndex(hudState.dayLabel) + 1,
        timeOfDay: hudState.timeLabel,
        location: this.getCurrentLocation()
      },
      this.completedFixedEventIds
    );

    if (!event) {
      return;
    }

    const eventId = typeof event.eventId === "string" ? event.eventId : null;
    const runtimeScript = buildDialogueScriptFromFixedEventEntry(
      StoryEventManager.FIXED_EVENT_DIALOGUE_ID,
      event,
      {
        fallbackNpcLabel: typeof event.eventName === "string" ? event.eventName : "이벤트",
        playerName: this.getPlayerName()
      }
    );

    if (!runtimeScript) {
      return;
    }

    this.starting = true;
    this.activeFixedEventId = eventId;
    this.setRuntimeDialogueScript(runtimeScript);
    void this.playFixedEventDialogue(event, runtimeScript, eventId);
  }

  private async playFixedEventDialogue(
    event: FixedEventEntry,
    runtimeScript: DialogueScript,
    eventId: string | null
  ): Promise<void> {
    try {
      await this.playDialogue(runtimeScript.id);
      if (eventId && !this.completedFixedEventIds.includes(eventId)) {
        this.completedFixedEventIds.push(eventId);
      }
      this.advanceTimeAfterFixedEvent();
    } catch (error) {
      const message = error instanceof Error ? error.message : "고정 이벤트 실행 중 오류가 발생했습니다";
      this.onNotice?.(message);
    } finally {
      this.activeFixedEventId = null;
      this.starting = false;
      this.removeRuntimeDialogueScript(runtimeScript.id);
      this.syncWeek(this.getHudState().week);
    }
  }

  private async ensureWeekLoaded(week: number): Promise<void> {
    const normalizedWeek = Phaser.Math.Clamp(Math.round(week), 1, 6);
    if (this.weekData.has(normalizedWeek)) {
      return;
    }

    const existing = this.weekLoads.get(normalizedWeek);
    if (existing) {
      await existing;
      return;
    }

    const request = loadFixedEventWeek(normalizedWeek)
      .then((rawData) => {
        this.weekData.set(normalizedWeek, rawData);
        this.weekLoads.delete(normalizedWeek);
        return rawData;
      })
      .catch((error) => {
        this.weekLoads.delete(normalizedWeek);
        throw error;
      });

    this.weekLoads.set(normalizedWeek, request);

    try {
      await request;
    } catch (error) {
      const message = error instanceof Error ? error.message : "고정 이벤트 데이터를 불러오지 못했습니다";
      this.onNotice?.(message);
    }
  }

  private resolveDayIndex(dayLabel: string): number {
    switch (dayLabel) {
      case "월요일":
        return 0;
      case "화요일":
        return 1;
      case "수요일":
        return 2;
      case "목요일":
        return 3;
      case "금요일":
        return 4;
      case "토요일":
        return 5;
      case "일요일":
      default:
        return 6;
    }
  }
}
