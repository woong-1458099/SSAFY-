import type { AreaId } from "../../common/enums/area";
import type { SceneState } from "../../common/types/sceneState";
import type { RuntimeGameState } from "../../game/state/gameState";
import type { SceneId } from "../../game/scripts/scenes/sceneIds";
import type { InventorySnapshot } from "../inventory/InventoryService";
import type { WeeklyPlanOptionId } from "../planning/weeklyPlan";
import type { TimeState } from "../progression/TimeService";
import { readStoredSession } from "../auth/authSession";
import {
  createUserSaveFile,
  deleteUserSaveFile,
  fetchUserSaveFiles,
  updateUserSaveFile,
  type BackendSaveFile
} from "./saveApi";

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
  saveFileId?: string;
  userId?: string;
};

type SaveStore = Record<string, SaveSlotData | null>;

const STORAGE_KEY_PREFIX = "ppap-save-slots-v3";
const LEGACY_STORAGE_KEY = "ppap-save-slots-v2";
const LEGACY_STORAGE_KEY_V1 = "ppap-save-slots-v1";
const AUTO_SLOT_ID: SaveSlotId = "auto";
const REMOTE_AUTO_SLOT_NUMBER = 999999;

let cachedSlots: SaveStore | null = null;
let cachedScope: string | null = null;
let pendingHydration: Promise<SaveStore> | null = null;

function canUseStorage(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function getCurrentUserId(): string | null {
  return readStoredSession()?.user.id ?? null;
}

function getStorageScope(): string {
  return getCurrentUserId() ?? "guest";
}

function getScopedStorageKey(scope = getStorageScope()): string {
  return `${STORAGE_KEY_PREFIX}:${scope}`;
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

function compareManualSlotIds(a: SaveSlotId, b: SaveSlotId): number {
  const aIndex = Number.parseInt(a.replace("slot-", ""), 10);
  const bIndex = Number.parseInt(b.replace("slot-", ""), 10);
  return aIndex - bIndex;
}

function parseSavedAt(iso: string | undefined): number {
  if (!iso) {
    return 0;
  }

  const timestamp = new Date(iso).getTime();
  return Number.isFinite(timestamp) ? timestamp : 0;
}

function cloneStore(store: SaveStore): SaveStore {
  return Object.fromEntries(
    Object.entries(store).map(([slotId, slotData]) => [slotId, slotData ? { ...slotData } : null])
  );
}

function normalizeStore(store: SaveStore): SaveStore {
  const normalized: SaveStore = {};

  Object.entries(store).forEach(([rawKey, slotData]) => {
    const slotId = normalizeSlotId(rawKey);
    if (!slotId) {
      return;
    }

    if (slotId !== AUTO_SLOT_ID && !slotData) {
      return;
    }

    normalized[slotId] = slotData ? { ...slotData, slotId } : null;
  });

  if (!(AUTO_SLOT_ID in normalized)) {
    normalized[AUTO_SLOT_ID] = null;
  }

  return normalized;
}

function readRawStore(scope = getStorageScope()): SaveStore {
  if (!canUseStorage()) {
    return {};
  }

  const candidateKeys = [getScopedStorageKey(scope), LEGACY_STORAGE_KEY, LEGACY_STORAGE_KEY_V1];
  for (const key of candidateKeys) {
    try {
      const raw = window.localStorage.getItem(key);
      if (!raw) {
        continue;
      }

      const parsed = JSON.parse(raw) as SaveStore;
      if (parsed && typeof parsed === "object") {
        return parsed;
      }
    } catch {
      return {};
    }
  }

  return {};
}

function readStore(scope = getStorageScope()): SaveStore {
  return normalizeStore(readRawStore(scope));
}

function writeStore(store: SaveStore, scope = getStorageScope()): void {
  if (!canUseStorage()) {
    return;
  }

  window.localStorage.setItem(getScopedStorageKey(scope), JSON.stringify(normalizeStore(store)));
}

function setCachedStore(store: SaveStore, scope = getStorageScope()): SaveStore {
  const normalized = normalizeStore(store);
  cachedSlots = normalized;
  cachedScope = scope;
  return normalized;
}

function ensureCachedStore(): SaveStore {
  const scope = getStorageScope();
  if (!cachedSlots || cachedScope !== scope) {
    return setCachedStore(readStore(scope), scope);
  }

  return cachedSlots;
}

function slotIdToRemoteSlotNumber(slotId: SaveSlotId): number | null {
  if (slotId === AUTO_SLOT_ID) {
    return REMOTE_AUTO_SLOT_NUMBER;
  }

  const normalized = normalizeSlotId(slotId);
  if (!normalized || normalized === AUTO_SLOT_ID) {
    return null;
  }

  return Number.parseInt(normalized.replace("slot-", ""), 10);
}

function remoteSlotNumberToSlotId(slotNumber: number): SaveSlotId | null {
  if (!Number.isFinite(slotNumber) || slotNumber <= 0) {
    return null;
  }

  if (slotNumber === REMOTE_AUTO_SLOT_NUMBER) {
    return AUTO_SLOT_ID;
  }

  return `slot-${slotNumber}` as SaveSlotId;
}

function buildSaveName(slotId: SaveSlotId, payload: SavePayload): string {
  const hud = payload.gameState.hud;
  return `${getSaveSlotLabel(slotId)} | ${hud.week}주차 ${hud.dayLabel} ${hud.timeLabel}`;
}

function toRemoteSlotData(saveFile: BackendSaveFile): SaveSlotData | null {
  const slotId = remoteSlotNumberToSlotId(saveFile.slotNumber);
  if (!slotId) {
    return null;
  }

  try {
    const payload = JSON.parse(saveFile.gameState) as SavePayload;
    return {
      slotId,
      savedAt: saveFile.updatedAt ?? saveFile.createdAt ?? new Date().toISOString(),
      payload,
      saveFileId: saveFile.id,
      userId: saveFile.userId
    };
  } catch (error) {
    console.error("[SaveService] failed to parse remote save payload", {
      slotNumber: saveFile.slotNumber,
      saveFileId: saveFile.id,
      error
    });
    return null;
  }
}

function indexRemoteSaveFiles(remoteSaveFiles: BackendSaveFile[]): Map<SaveSlotId, BackendSaveFile> {
  const indexed = new Map<SaveSlotId, BackendSaveFile>();

  remoteSaveFiles.forEach((saveFile) => {
    const slotId = remoteSlotNumberToSlotId(saveFile.slotNumber);
    if (!slotId) {
      return;
    }

    const existing = indexed.get(slotId);
    if (!existing || parseSavedAt(saveFile.updatedAt ?? saveFile.createdAt) >= parseSavedAt(existing.updatedAt ?? existing.createdAt)) {
      indexed.set(slotId, saveFile);
    }
  });

  return indexed;
}

function upsertLocalSlot(slotData: SaveSlotData, scope = getStorageScope()): SaveSlotData {
  const store = readStore(scope);
  store[slotData.slotId] = slotData;
  writeStore(store, scope);
  setCachedStore(store, scope);
  return slotData;
}

function removeLocalSlot(slotId: SaveSlotId, scope = getStorageScope()): boolean {
  if (slotId === AUTO_SLOT_ID) {
    return false;
  }

  const store = readStore(scope);
  if (!(slotId in store)) {
    return false;
  }

  delete store[slotId];
  writeStore(store, scope);
  setCachedStore(store, scope);
  return true;
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

  private buildUploadPayload(slotData: SaveSlotData) {
    return {
      slotNumber: slotIdToRemoteSlotNumber(slotData.slotId)!,
      name: buildSaveName(slotData.slotId, slotData.payload),
      gameState: JSON.stringify(slotData.payload)
    };
  }

  private async upsertRemoteSlot(
    userId: string,
    slotData: SaveSlotData,
    remoteFile?: BackendSaveFile
  ): Promise<SaveSlotData> {
    const requestBody = this.buildUploadPayload(slotData);
    const remoteId = remoteFile?.id ?? slotData.saveFileId;

    try {
      const saved = remoteId
        ? await updateUserSaveFile(remoteId, requestBody)
        : await createUserSaveFile(userId, requestBody);
      return toRemoteSlotData(saved) ?? { ...slotData, userId };
    } catch (error) {
      if (!remoteId) {
        throw error;
      }

      const created = await createUserSaveFile(userId, requestBody);
      return toRemoteSlotData(created) ?? { ...slotData, userId };
    }
  }

  async hydrate(force = false): Promise<SaveStore> {
    const scope = getStorageScope();
    const userId = getCurrentUserId();

    if (!userId) {
      pendingHydration = null;
      if (!force && cachedSlots && cachedScope === scope) {
        return cloneStore(cachedSlots);
      }

      return cloneStore(setCachedStore(readStore(scope), scope));
    }

    if (!force && pendingHydration && cachedScope === scope) {
      return cloneStore(await pendingHydration);
    }

    if (!force && cachedSlots && cachedScope === scope) {
      return cloneStore(cachedSlots);
    }

    pendingHydration = (async () => {
      const localStore = readStore(scope);

      try {
        const remoteBySlot = indexRemoteSaveFiles(await fetchUserSaveFiles(userId));
        const merged: SaveStore = {};
        const syncTargets: Array<Promise<{ slotId: SaveSlotId; slotData: SaveSlotData }>> = [];
        const slotIds = new Set<SaveSlotId>([
          AUTO_SLOT_ID,
          ...Object.keys(localStore)
            .map((key) => normalizeSlotId(key))
            .filter((slotId): slotId is SaveSlotId => slotId !== null),
          ...remoteBySlot.keys()
        ]);

        slotIds.forEach((slotId) => {
          const localSlot = localStore[slotId] ?? null;
          const remoteFile = remoteBySlot.get(slotId);
          const remoteSlot = remoteFile ? toRemoteSlotData(remoteFile) : null;

          if (!localSlot && !remoteSlot) {
            if (slotId === AUTO_SLOT_ID) {
              merged[slotId] = null;
            }
            return;
          }

          if (localSlot && remoteSlot) {
            if (parseSavedAt(localSlot.savedAt) > parseSavedAt(remoteSlot.savedAt)) {
              const newestLocal = { ...localSlot, userId, saveFileId: remoteSlot.saveFileId ?? localSlot.saveFileId };
              syncTargets.push(
                this.upsertRemoteSlot(userId, newestLocal, remoteFile).then((slotData) => ({ slotId, slotData }))
              );
              merged[slotId] = remoteSlot;
              return;
            }

            merged[slotId] = remoteSlot;
            return;
          }

          if (localSlot) {
            const newestLocal = { ...localSlot, userId };
            syncTargets.push(
              this.upsertRemoteSlot(userId, newestLocal, remoteFile).then((slotData) => ({ slotId, slotData }))
            );
            if (slotId === AUTO_SLOT_ID) {
              merged[slotId] = null;
            }
            return;
          }

          if (remoteSlot) {
            merged[slotId] = remoteSlot;
          }
        });

        const syncResults = await Promise.allSettled(syncTargets);
        syncResults.forEach((result) => {
          if (result.status === "fulfilled") {
            merged[result.value.slotId] = result.value.slotData;
            return;
          }

          console.error("[SaveService] slot sync during hydrate failed", result.reason);
        });

        writeStore(merged, scope);
        return setCachedStore(merged, scope);
      } catch (error) {
        console.error("[SaveService] remote hydrate failed, falling back to local cache", error);
        return setCachedStore(localStore, scope);
      } finally {
        pendingHydration = null;
      }
    })();

    return cloneStore(await pendingHydration);
  }

  getManualSlotIds(): SaveSlotId[] {
    return Object.entries(ensureCachedStore())
      .filter(([slotId, slotData]) => slotId !== AUTO_SLOT_ID && slotData !== null)
      .map(([slotId]) => slotId as SaveSlotId)
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

  loadSlots(): SaveStore {
    return cloneStore(ensureCachedStore());
  }

  loadSlot(slotId: SaveSlotId): SaveSlotData | null {
    return this.loadSlots()[slotId] ?? null;
  }

  async deleteSlot(slotId: SaveSlotId): Promise<boolean> {
    if (slotId === AUTO_SLOT_ID) {
      return false;
    }

    const scope = getStorageScope();
    const current = this.loadSlot(slotId);
    const userId = getCurrentUserId();

    if (!userId || !current?.saveFileId) {
      return removeLocalSlot(slotId, scope);
    }

    try {
      await deleteUserSaveFile(current.saveFileId);
      return removeLocalSlot(slotId, scope);
    } catch (error) {
      console.error("[SaveService] remote delete failed", error);
      throw error;
    }
  }

  async saveSlot(slotId: SaveSlotId, payload: SavePayload): Promise<SaveSlotData> {
    const scope = getStorageScope();
    const normalizedSlotId = normalizeSlotId(slotId);
    const targetSlotId = normalizedSlotId ?? this.getNextManualSlotId();
    const baseSlotData: SaveSlotData = {
      slotId: targetSlotId,
      savedAt: new Date().toISOString(),
      payload
    };

    const userId = getCurrentUserId();
    if (!userId) {
      return upsertLocalSlot(baseSlotData, scope);
    }

    await this.hydrate();

    try {
      const current = this.loadSlot(targetSlotId);
      const remoteSlotData = await this.upsertRemoteSlot(
        userId,
        {
          ...baseSlotData,
          saveFileId: current?.saveFileId,
          userId
        }
      );
      return upsertLocalSlot(remoteSlotData, scope);
    } catch (error) {
      console.error("[SaveService] remote save failed", error);
      throw error;
    }
  }
}
