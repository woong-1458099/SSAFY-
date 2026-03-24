import Phaser from "phaser";
import type { AreaId } from "../../common/enums/area";
import { createRuntimeDialogueId, type DialogueScript } from "../../common/types/dialogue";
import type { HudState } from "../state/gameState";
import { TIME_CYCLE } from "../../features/progression/TimeService";
import { getWeeklyPlanSlotIndex, WEEKLY_PLAN_TIME_LABELS } from "../../features/planning/weeklyPlan";
import {
  buildFixedEventDebugEntry,
  type FixedEventDebugEntry
} from "../../features/story/fixedEventDebug";
import {
  buildFixedEventNpcPresentation,
  resolveFixedEventLocationId,
  resolveFixedEventRenderArea,
  type FixedEventNpcPresentation
} from "../../features/story/fixedEventNpcPresence";
import { buildDialogueScriptFromFixedEventEntry, findMatchingFixedEvent, getFixedEventEntries, type FixedEventEntry } from "../../features/story/jsonDialogueAdapter";
import { loadFixedEventWeek } from "../../infra/story/fixedEventRepository";

export type StoryEventSnapshot = {
  completedFixedEventIds: string[];
};

type StoryEventManagerOptions = {
  scene: Phaser.Scene;
  getHudState: () => HudState;
  getCurrentArea: () => AreaId;
  getCurrentLocation: () => string;
  getPlayerGender: () => string;
  getPlayerName: () => string;
  setRuntimeDialogueScript: (script: DialogueScript) => void;
  removeRuntimeDialogueScript: (dialogueId: string) => void;
  playDialogue: (dialogueId: string) => Promise<void>;
  advanceTimeAfterFixedEvent: () => void;
  onNotice?: (message: string) => void;
};

export class StoryEventManager {
  private static readonly FIXED_EVENT_DIALOGUE_ID = createRuntimeDialogueId("fixed_event");

  private readonly scene: Phaser.Scene;
  private readonly getHudState: () => HudState;
  private readonly getCurrentArea: () => AreaId;
  private readonly getCurrentLocation: () => string;
  private readonly getPlayerGender: () => string;
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
    this.getCurrentArea = options.getCurrentArea;
    this.getCurrentLocation = options.getCurrentLocation;
    this.getPlayerGender = options.getPlayerGender;
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

  debugSyncAllWeeks(): void {
    Array.from({ length: 6 }, (_, index) => index + 1).forEach((week) => {
      this.syncWeek(week);
    });
  }

  hasWeekLoaded(week: number): boolean {
    return this.weekData.has(Phaser.Math.Clamp(Math.round(week), 1, 6));
  }

  getFixedEventDebugEntriesForWeek(week: number): FixedEventDebugEntry[] {
    const normalizedWeek = Phaser.Math.Clamp(Math.round(week), 1, 6);
    const rawData = this.weekData.get(normalizedWeek);
    if (!rawData) {
      this.syncWeek(normalizedWeek);
      return [];
    }

    return getFixedEventEntries(rawData)
      .filter((event) => {
        if (event.eventType !== "FIXED" && event.eventType !== "ROMANCE") return false;
        if (event.eventType === "ROMANCE") {
          const eventId = String((event.id ?? event.eventId) || "");
          const gender = this.getPlayerGender();
          if (gender === "MALE" && eventId.includes("_MINSU_")) return false;
          if (gender === "FEMALE" && eventId.includes("_HYO_")) return false;
        }
        return true;
      })
      .map((event) =>
        buildFixedEventDebugEntry(event, {
          completedEventIds: this.completedFixedEventIds
        })
      );
  }

  getFixedEventDebugEntry(week: number, eventId: string): FixedEventDebugEntry | null {
    return this.getFixedEventDebugEntriesForWeek(week).find((event) => event.eventId === eventId) ?? null;
  }

  debugResetFixedEventCompletion(eventId: string): boolean {
    const nextIds = this.completedFixedEventIds.filter((id) => id !== eventId);
    const changed = nextIds.length !== this.completedFixedEventIds.length;
    this.completedFixedEventIds = nextIds;
    return changed;
  }

  debugResetFixedEventCompletionsForWeek(week: number): number {
    const eventIds = new Set(this.getFixedEventDebugEntriesForWeek(week).map((event) => event.eventId));
    if (eventIds.size === 0) {
      return 0;
    }

    const previousLength = this.completedFixedEventIds.length;
    this.completedFixedEventIds = this.completedFixedEventIds.filter((eventId) => !eventIds.has(eventId));
    return previousLength - this.completedFixedEventIds.length;
  }

  debugStartFixedEventById(week: number, eventId: string): boolean {
    const event = this.findFixedEventById(week, eventId);
    if (!event) {
      return false;
    }

    return this.startFixedEvent(event);
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
      if (!timing || (event.eventType !== "FIXED" && event.eventType !== "ROMANCE")) {
        return;
      }

      if (event.eventType === "ROMANCE") {
        const eventId = String((event.id ?? event.eventId) || "");
        const gender = this.getPlayerGender();
        if (gender === "MALE" && eventId.includes("_MINSU_")) return;
        if (gender === "FEMALE" && eventId.includes("_HYO_")) return;
      }

      const sameWeek = Math.round(timing.week ?? -1) === week;
      if (!sameWeek) {
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
      const rawEventName = event.label ?? event.eventName;
      const eventName =
        typeof rawEventName === "string" && rawEventName.trim().length > 0
          ? rawEventName.trim()
          : "고정 이벤트";
      slots.set(slotIndex, eventName);
    });

    return slots;
  }

  getCurrentFixedEventPresentation(): FixedEventNpcPresentation | null {
    if (this.starting || this.activeFixedEventId) {
      return null;
    }

    const event = this.findPresentableFixedEventForCurrentArea();
    if (!event) {
      return null;
    }

    return buildFixedEventNpcPresentation(event, {
      fallbackLocation: this.getCurrentArea()
    });
  }

  tryStartCurrentFixedEvent(): boolean {
    return this.tryStartFixedEventForLocation(this.getCurrentLocation());
  }

  tryStartFixedEventForLocation(location: string): boolean {
    const event = this.findMatchingFixedEventForLocation(location);
    if (!event) {
      return false;
    }

    return this.startFixedEvent(event);
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

  private findFixedEventById(week: number, eventId: string): FixedEventEntry | null {
    const normalizedWeek = Phaser.Math.Clamp(Math.round(week), 1, 6);
    const normalizedEventId = eventId.trim();
    const rawData = this.weekData.get(normalizedWeek);

    if (!normalizedEventId || !rawData) {
      this.syncWeek(normalizedWeek);
      return null;
    }

    return (
      getFixedEventEntries(rawData).find((event) => {
        const rawEventId = event.id ?? event.eventId;
        const eventIdStr = typeof rawEventId === "string" ? rawEventId : "";
        
        if (event.eventType === "ROMANCE") {
          const gender = this.getPlayerGender();
          if (gender === "MALE" && eventIdStr.includes("_MINSU_")) return false;
          if (gender === "FEMALE" && eventIdStr.includes("_HYO_")) return false;
        }

        return (event.eventType === "FIXED" || event.eventType === "ROMANCE") && typeof rawEventId === "string" && rawEventId.trim() === normalizedEventId;
      }) ?? null
    );
  }

  private findMatchingFixedEventForLocation(location: string): FixedEventEntry | null {
    const hudState = this.getHudState();
    const week = hudState.week;
    const rawData = this.weekData.get(week);

    if (this.starting || this.activeFixedEventId || !rawData) {
      this.syncWeek(week);
      return null;
    }

    return findMatchingFixedEvent(
      rawData,
      {
        week,
        day: this.resolveDayIndex(hudState.dayLabel) + 1,
        timeOfDay: hudState.timeLabel,
        location,
        playerGender: this.getPlayerGender()
      },
      this.completedFixedEventIds
    );
  }

  private findPresentableFixedEventForCurrentArea(): FixedEventEntry | null {
    const hudState = this.getHudState();
    const rawData = this.weekData.get(hudState.week);

    if (!rawData) {
      this.syncWeek(hudState.week);
      return null;
    }

    return (
      getFixedEventEntries(rawData).find((event) => {
        const timing = event.triggerTiming;
        if (!timing || (event.eventType !== "FIXED" && event.eventType !== "ROMANCE")) {
          return false;
        }

        const rawEventId = event.id ?? event.eventId;
        const eventId = typeof rawEventId === "string" ? rawEventId : "";
        
        if (event.eventType === "ROMANCE") {
          const gender = this.getPlayerGender();
          if (gender === "MALE" && eventId.includes("_MINSU_")) return false;
          if (gender === "FEMALE" && eventId.includes("_HYO_")) return false;
        }

        if (event.isRepeatable !== true && eventId && this.completedFixedEventIds.includes(eventId)) {
          return false;
        }

        const sameWeek = Math.round(timing.week ?? -1) === hudState.week;
        const sameDay = Math.round(timing.day ?? -1) === this.resolveDayIndex(hudState.dayLabel) + 1;
        const sameTime = typeof timing.timeOfDay === "string" && timing.timeOfDay.trim() === hudState.timeLabel;
        if (!sameWeek || !sameDay || !sameTime) {
          return false;
        }

        const locationId = resolveFixedEventLocationId(event.location, this.getCurrentArea());
        return resolveFixedEventRenderArea(locationId) === this.getCurrentArea();
      }) ?? null
    );
  }

  private startFixedEvent(event: FixedEventEntry): boolean {
    const rawEventId = event.id ?? event.eventId;
    const eventId = typeof rawEventId === "string" ? rawEventId : null;
    const rawEventName = event.label ?? event.eventName;
    const runtimeScript = buildDialogueScriptFromFixedEventEntry(StoryEventManager.FIXED_EVENT_DIALOGUE_ID, event, {
      fallbackNpcLabel: typeof rawEventName === "string" ? rawEventName : "이벤트",
      playerName: this.getPlayerName()
    });

    if (!runtimeScript) {
      return false;
    }

    this.starting = true;
    this.activeFixedEventId = eventId;
    this.setRuntimeDialogueScript(runtimeScript);
    void this.playFixedEventDialogue(event, runtimeScript, eventId);
    return true;
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
