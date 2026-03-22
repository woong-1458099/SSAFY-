import type { AreaId } from "../../common/enums/area";
import type { RuntimeGameState } from "../../game/state/gameState";
import type { SceneId } from "../../game/scripts/scenes/sceneIds";
import type { InventorySnapshot } from "../inventory/InventoryService";
import type { TimeState } from "../progression/TimeService";
import type { WeeklyPlanOptionId } from "../planning/weeklyPlan";
import type { SceneState } from "../../common/types/sceneState";

export type SaveSlotId = "auto" | "slot-1" | "slot-2" | "slot-3" | "slot-4" | "slot-5";

export type SavePayload = {
  gameState: RuntimeGameState;
  inventory: InventorySnapshot;
  progression?: {
    timeState: TimeState;
    weeklyPlan: WeeklyPlanOptionId[];
    weeklyPlanWeek: number;
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
};

export type SaveSlotData = {
  slotId: SaveSlotId;
  savedAt: string;
  payload: SavePayload;
};

const STORAGE_KEY = "ppap-save-slots-v1";
const SLOT_IDS: SaveSlotId[] = ["auto", "slot-1", "slot-2", "slot-3", "slot-4", "slot-5"];

function canUseStorage(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function readStore(): Partial<Record<SaveSlotId, SaveSlotData | null>> {
  if (!canUseStorage()) {
    return {};
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return {};
    }
    const parsed = JSON.parse(raw) as Partial<Record<SaveSlotId, SaveSlotData | null>>;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function writeStore(store: Partial<Record<SaveSlotId, SaveSlotData | null>>): void {
  if (!canUseStorage()) {
    return;
  }
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
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

export function getSaveSlotMetaText(slotData: SaveSlotData | null): string {
  if (!slotData) {
    return "빈 저장 슬롯";
  }

  const hud = slotData.payload.gameState.hud;
  const summary = [`${hud.week}주차`, hud.dayLabel, hud.timeLabel].join(" ");
  return `${summary} | ${hud.locationLabel} | ${formatSaveTime(slotData.savedAt)}`;
}

export class SaveService {
  getSlotIds(): SaveSlotId[] {
    return [...SLOT_IDS];
  }

  loadSlots(): Record<SaveSlotId, SaveSlotData | null> {
    const store = readStore();
    return Object.fromEntries(
      SLOT_IDS.map((slotId) => [slotId, (store[slotId] as SaveSlotData | null | undefined) ?? null])
    ) as Record<SaveSlotId, SaveSlotData | null>;
  }

  loadSlot(slotId: SaveSlotId): SaveSlotData | null {
    return this.loadSlots()[slotId] ?? null;
  }

  saveSlot(slotId: SaveSlotId, payload: SavePayload): SaveSlotData {
    const store = readStore();
    const slotData: SaveSlotData = {
      slotId,
      savedAt: new Date().toISOString(),
      payload
    };
    store[slotId] = slotData;
    writeStore(store);
    return slotData;
  }
}
