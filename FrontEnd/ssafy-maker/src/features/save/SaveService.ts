import type { AreaId } from "../../common/enums/area";
import type { RuntimeGameState } from "../../game/state/gameState";
import type { SceneId } from "../../game/scripts/scenes/sceneIds";
import type { InventorySnapshot } from "../inventory/InventoryService";
import type { TimeState } from "../progression/TimeService";
import type { WeeklyPlanOptionId } from "../planning/weeklyPlan";
import type { SceneState } from "../../common/types/sceneState";

export type SaveSlotId = "auto" | `slot-${number}`;

export type SavePayload = {
  gameState: RuntimeGameState;
  inventory: InventorySnapshot;
  progression?: {
    timeState: TimeState;
    weeklyPlan: WeeklyPlanOptionId[];
    weeklyPlanWeek: number;
    lastPaidWeeklySalaryWeek: number;
  };
  world?: {
    areaId: AreaId;
    sceneId?: SceneId;
    sceneState?: SceneState;
    playerTile?: {
      tileX: number;
      tileY: number;
    };
  };
  story?: {
    completedFixedEventIds: string[];
  };
};

export type SaveSlotData = {
  slotId: SaveSlotId;
  savedAt: string;
  payload: SavePayload;
};

const STORAGE_KEY = "ppap-save-slots-v2";
const LEGACY_STORAGE_KEY = "ppap-save-slots-v1";
const AUTO_SLOT_ID: SaveSlotId = "auto";

function canUseStorage(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function normalizeSlotId(raw: string): SaveSlotId | null {
  if (raw === AUTO_SLOT_ID) {
    return AUTO_SLOT_ID;
  }

  const match = /^slot-(\d+)$/.exec(raw);
  if (!match) {
    return null;
  }

  const index = Number.parseInt(match[1], 10);
  if (!Number.isFinite(index) || index <= 0) {
    return null;
  }

  return `slot-${index}` as SaveSlotId;
}

function readStore(): Record<string, SaveSlotData | null> {
  if (!canUseStorage()) {
    return {};
  }

  try {
    const raw =
      window.localStorage.getItem(STORAGE_KEY) ??
      window.localStorage.getItem(LEGACY_STORAGE_KEY);
    if (!raw) {
      return {};
    }

    const parsed = JSON.parse(raw) as Record<string, SaveSlotData | null>;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function writeStore(store: Record<string, SaveSlotData | null>): void {
  if (!canUseStorage()) {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}

function compareManualSlotIds(a: SaveSlotId, b: SaveSlotId): number {
  const aIndex = Number.parseInt(a.replace("slot-", ""), 10);
  const bIndex = Number.parseInt(b.replace("slot-", ""), 10);
  return aIndex - bIndex;
}

export function formatSaveTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return "알 수 없는 시간";
  }

  return date.toLocaleString("ko-KR", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  });
}

export function getSaveSlotLabel(slotId: SaveSlotId): string {
  if (slotId === AUTO_SLOT_ID) {
    return "Auto Save";
  }

  return `저장 슬롯 ${slotId.replace("slot-", "")}`;
}

export function getSaveSlotMetaText(slotData: SaveSlotData | null): string {
  if (!slotData) {
    return "빈 저장 슬롯";
  }

  const hud = slotData.payload.gameState.hud;
  const summary = [`${hud.week}주차`, hud.dayLabel, hud.timeLabel].join(" ");
  return `${summary} | ${hud.locationLabel} | ${formatSaveTime(slotData.savedAt)}`;
}

export class SaveService {
  getAutoSlotId(): SaveSlotId {
    return AUTO_SLOT_ID;
  }

  getManualSlotIds(): SaveSlotId[] {
    return Object.keys(readStore())
      .map((key) => normalizeSlotId(key))
      .filter((slotId): slotId is SaveSlotId => slotId !== null && slotId !== AUTO_SLOT_ID)
      .sort(compareManualSlotIds);
  }

  getNextManualSlotId(): SaveSlotId {
    const manualSlots = this.getManualSlotIds();
    if (manualSlots.length === 0) {
      return "slot-1";
    }

    const last = manualSlots[manualSlots.length - 1];
    const lastIndex = Number.parseInt(last.replace("slot-", ""), 10);
    return `slot-${lastIndex + 1}` as SaveSlotId;
  }

  getSlotIds(): SaveSlotId[] {
    return [AUTO_SLOT_ID, ...this.getManualSlotIds()];
  }

  loadSlots(): Record<string, SaveSlotData | null> {
    const store = readStore();
    const normalized: Record<string, SaveSlotData | null> = {};

    Object.entries(store).forEach(([rawKey, slotData]) => {
      const slotId = normalizeSlotId(rawKey);
      if (!slotId) {
        return;
      }
      normalized[slotId] = slotData ? { ...slotData, slotId } : null;
    });

    if (!(AUTO_SLOT_ID in normalized)) {
      normalized[AUTO_SLOT_ID] = null;
    }

    return normalized;
  }

  loadSlot(slotId: SaveSlotId): SaveSlotData | null {
    return this.loadSlots()[slotId] ?? null;
  }

  deleteSlot(slotId: SaveSlotId): boolean {
    if (slotId === AUTO_SLOT_ID) {
      return false;
    }

    const store = readStore();
    if (!(slotId in store)) {
      return false;
    }

    delete store[slotId];
    writeStore(store);
    return true;
  }

  saveSlot(slotId: SaveSlotId, payload: SavePayload): SaveSlotData {
    const store = readStore();
    const normalizedSlotId = normalizeSlotId(slotId);
    const targetSlotId = normalizedSlotId ?? this.getNextManualSlotId();
    const slotData: SaveSlotData = {
      slotId: targetSlotId,
      savedAt: new Date().toISOString(),
      payload
    };
    store[targetSlotId] = slotData;
    writeStore(store);
    return slotData;
  }
}
