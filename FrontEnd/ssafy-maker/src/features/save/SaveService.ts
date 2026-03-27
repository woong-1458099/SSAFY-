import type { AreaId } from "../../common/enums/area";
import type { SceneState } from "../../common/types/sceneState";
import type { RuntimeGameState } from "../../game/state/gameState";
import type { SceneId } from "../../game/scripts/scenes/sceneIds";
import type { InventorySnapshot } from "../inventory/InventoryService";
import type { WeeklyPlanOptionId } from "../planning/weeklyPlan";
import type { TimeState } from "../progression/TimeService";
import { getActiveAuthUserId, readStoredSession } from "../auth/authSession";
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
    completedPlanSlotIndices?: number[];
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
const MIGRATION_STATUS_KEY_PREFIX = "ppap-save-slots-migrated-v1";
const INDEXED_DB_NAME = "ssafy-maker-save-slots";
const INDEXED_DB_STORE_NAME = "saveStores";
const AUTO_SLOT_ID: SaveSlotId = "auto";
const REMOTE_AUTO_SLOT_NUMBER = 999999;

let cachedSlots: SaveStore | null = null;
let cachedScope: string | null = null;
let pendingHydration: Promise<SaveStore> | null = null;

type IndexedDbOpenResult =
  | { status: "available"; db: IDBDatabase }
  | { status: "unsupported" | "blocked" | "error"; error?: unknown };

type IndexedDbReadResult =
  | { status: "success"; store: SaveStore }
  | { status: "empty" }
  | { status: "unsupported" | "blocked" | "error"; error?: unknown };

type IndexedDbWriteResult =
  | { status: "success" }
  | { status: "fallback-localstorage" | "unsupported" | "blocked" | "error"; error?: unknown };

type PersistentStoreReadResult = {
  store: SaveStore;
  source: "indexeddb" | "legacy" | "empty";
  degraded: boolean;
};

type MigrationStatus = "idle" | "pending" | "done" | "failed";

function canUseStorage(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function canUseIndexedDb(): boolean {
  return typeof window !== "undefined" && typeof window.indexedDB !== "undefined";
}

function getCurrentUserId(): string | null {
  return readStoredSession()?.user.id ?? getActiveAuthUserId();
}

function getStorageScope(): string {
  return getCurrentUserId() ?? "guest";
}

function getScopedStorageKey(scope = getStorageScope()): string {
  return `${STORAGE_KEY_PREFIX}:${scope}`;
}

function getMigrationStatusKey(scope = getStorageScope()): string {
  return `${MIGRATION_STATUS_KEY_PREFIX}:${scope}`;
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
    } catch (error) {
      logSaveStorageFailure("read-legacy-store", { scope, key, error });
      return {};
    }
  }

  return {};
}

function logSaveStorageFailure(stage: string, details?: Record<string, unknown>): void {
  console.error("[SaveService] storage access failed", {
    stage,
    scope: getStorageScope(),
    ...details
  });
}

function readStore(scope = getStorageScope()): SaveStore {
  return normalizeStore(readRawStore(scope));
}

function writeStore(store: SaveStore, scope = getStorageScope()): void {
  if (!canUseStorage()) {
    return;
  }

  try {
    window.localStorage.setItem(getScopedStorageKey(scope), JSON.stringify(normalizeStore(store)));
  } catch (error) {
    logSaveStorageFailure("write-legacy-store", { scope, error });
  }
}

function deleteLegacyStores(scope = getStorageScope()): void {
  if (!canUseStorage()) {
    return;
  }

  try {
    window.localStorage.removeItem(getScopedStorageKey(scope));
    window.localStorage.removeItem(LEGACY_STORAGE_KEY);
    window.localStorage.removeItem(LEGACY_STORAGE_KEY_V1);
  } catch {
    // Ignore storage cleanup failures.
  }
}

function hasLegacyStoreData(scope = getStorageScope()): boolean {
  return Object.keys(readStore(scope)).length > 0;
}

function getMigrationStatus(scope = getStorageScope()): MigrationStatus {
  if (!canUseStorage()) {
    return "idle";
  }

  try {
    const raw = window.localStorage.getItem(getMigrationStatusKey(scope));
    if (raw === "pending" || raw === "done" || raw === "failed") {
      return raw;
    }

    return "idle";
  } catch {
    return "idle";
  }
}

function setMigrationStatus(status: Exclude<MigrationStatus, "idle">, scope = getStorageScope()): void {
  if (!canUseStorage()) {
    return;
  }

  try {
    window.localStorage.setItem(getMigrationStatusKey(scope), status);
  } catch (error) {
    logSaveStorageFailure("set-migration-status", { scope, status, error });
  }
}

function verifyStoreMigration(source: SaveStore, target: SaveStore): boolean {
  const sourceEntries = Object.entries(normalizeStore(source)).filter(([, value]) => value !== null);
  const targetEntries = Object.entries(normalizeStore(target)).filter(([, value]) => value !== null);

  if (sourceEntries.length !== targetEntries.length) {
    return false;
  }

  return sourceEntries.every(([slotId, slotData]) => {
    const migrated = target[slotId];
    return (
      !!slotData &&
      !!migrated &&
      migrated.slotId === slotData.slotId &&
      migrated.savedAt === slotData.savedAt &&
      migrated.payload?.gameState?.hud?.week === slotData.payload?.gameState?.hud?.week
    );
  });
}

function mergeStoresByLatest(primary: SaveStore, secondary: SaveStore): SaveStore {
  const merged: SaveStore = {};
  const slotIds = new Set<SaveSlotId>([
    AUTO_SLOT_ID,
    ...Object.keys(normalizeStore(primary))
      .map((slotId) => normalizeSlotId(slotId))
      .filter((slotId): slotId is SaveSlotId => slotId !== null),
    ...Object.keys(normalizeStore(secondary))
      .map((slotId) => normalizeSlotId(slotId))
      .filter((slotId): slotId is SaveSlotId => slotId !== null)
  ]);

  slotIds.forEach((slotId) => {
    const primarySlot = primary[slotId] ?? null;
    const secondarySlot = secondary[slotId] ?? null;

    if (!primarySlot && !secondarySlot) {
      if (slotId === AUTO_SLOT_ID) {
        merged[slotId] = null;
      }
      return;
    }

    if (!primarySlot) {
      merged[slotId] = secondarySlot;
      return;
    }

    if (!secondarySlot) {
      merged[slotId] = primarySlot;
      return;
    }

    merged[slotId] =
      parseSavedAt(primarySlot.savedAt) >= parseSavedAt(secondarySlot.savedAt)
        ? primarySlot
        : secondarySlot;
  });

  return normalizeStore(merged);
}

function openSaveIndexedDb(): Promise<IndexedDbOpenResult> {
  if (!canUseIndexedDb()) {
    return Promise.resolve({ status: "unsupported" });
  }

  return new Promise((resolve) => {
    try {
      const request = window.indexedDB.open(INDEXED_DB_NAME, 1);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(INDEXED_DB_STORE_NAME)) {
          db.createObjectStore(INDEXED_DB_STORE_NAME);
        }
      };
      request.onsuccess = () => resolve({ status: "available", db: request.result });
      request.onerror = () => resolve({ status: "error", error: request.error });
      request.onblocked = () => resolve({ status: "blocked" });
    } catch (error) {
      resolve({ status: "error", error });
    }
  });
}

async function readIndexedDbStore(scope = getStorageScope()): Promise<IndexedDbReadResult> {
  const openResult = await openSaveIndexedDb();
  if (openResult.status !== "available") {
    return openResult;
  }
  const { db } = openResult;

  return new Promise((resolve) => {
    try {
      const transaction = db.transaction(INDEXED_DB_STORE_NAME, "readonly");
      const store = transaction.objectStore(INDEXED_DB_STORE_NAME);
      const request = store.get(scope);
      request.onsuccess = () => {
        const result = request.result;
        if (result && typeof result === "object") {
          resolve({ status: "success", store: normalizeStore(result as SaveStore) });
          return;
        }

        resolve({ status: "empty" });
      };
      request.onerror = () => resolve({ status: "error", error: request.error });
      transaction.oncomplete = () => db.close();
      transaction.onerror = () => db.close();
      transaction.onabort = () => db.close();
    } catch (error) {
      db.close();
      resolve({ status: "error", error });
    }
  });
}

async function writeIndexedDbStore(store: SaveStore, scope = getStorageScope()): Promise<IndexedDbWriteResult> {
  const normalized = normalizeStore(store);
  const openResult = await openSaveIndexedDb();
  if (openResult.status !== "available") {
    writeStore(normalized, scope);
    return {
      status: "fallback-localstorage",
      error: openResult.error
    };
  }
  const { db } = openResult;

  const status = await new Promise<IndexedDbWriteResult>((resolve) => {
    try {
      const transaction = db.transaction(INDEXED_DB_STORE_NAME, "readwrite");
      const objectStore = transaction.objectStore(INDEXED_DB_STORE_NAME);
      objectStore.put(normalized, scope);
      transaction.oncomplete = () => resolve({ status: "success" });
      transaction.onerror = () => resolve({ status: "error", error: transaction.error });
      transaction.onabort = () => resolve({ status: "error", error: transaction.error });
    } catch (error) {
      resolve({ status: "error", error });
    }
  });

  db.close();
  if (status.status !== "success") {
    writeStore(normalized, scope);
    return {
      status: "fallback-localstorage",
      error: status.status === "error" ? status.error : undefined
    };
  }

  return status;
}

async function migrateLegacyStoreIfNeeded(scope: string, legacyStore: SaveStore): Promise<void> {
  if (!hasLegacyStoreData(scope) || getMigrationStatus(scope) === "done") {
    return;
  }

  setMigrationStatus("pending", scope);
  const writeResult = await writeIndexedDbStore(legacyStore, scope);
  if (writeResult.status !== "success") {
    setMigrationStatus("failed", scope);
    logSaveStorageFailure("migrate-legacy-write", { scope, status: writeResult.status, error: writeResult.error });
    return;
  }

  const verifyResult = await readIndexedDbStore(scope);
  if (verifyResult.status !== "success" || !verifyStoreMigration(legacyStore, verifyResult.store)) {
    setMigrationStatus("failed", scope);
    logSaveStorageFailure("migrate-legacy-verify", { scope, status: verifyResult.status });
    return;
  }

  setMigrationStatus("done", scope);
  deleteLegacyStores(scope);
}

async function readPersistentStore(scope = getStorageScope()): Promise<PersistentStoreReadResult> {
  const migrationStatus = getMigrationStatus(scope);
  const indexedDbStore = await readIndexedDbStore(scope);
  if (indexedDbStore.status === "success") {
    const legacyStore = readStore(scope);
    if (Object.keys(legacyStore).length > 0 && migrationStatus !== "done") {
      const mergedStore = mergeStoresByLatest(indexedDbStore.store, legacyStore);
      await migrateLegacyStoreIfNeeded(scope, mergedStore);
      return {
        store: mergedStore,
        source: "indexeddb",
        degraded: false
      };
    }

    return {
      store: indexedDbStore.store,
      source: "indexeddb",
      degraded: false
    };
  }

  if (indexedDbStore.status === "empty") {
    const legacyStore = readStore(scope);
    if (Object.keys(legacyStore).length > 0) {
      await migrateLegacyStoreIfNeeded(scope, legacyStore);
      return {
        store: legacyStore,
        source: "legacy",
        degraded: false
      };
    }

    return {
      store: {},
      source: "empty",
      degraded: false
    };
  }

  const legacyStore = readStore(scope);
  if (Object.keys(legacyStore).length > 0) {
    logSaveStorageFailure("read-indexeddb-fallback", {
      scope,
      migrationStatus,
      status: indexedDbStore.status,
      error: indexedDbStore.error,
      fallback: "legacy"
    });
    await migrateLegacyStoreIfNeeded(scope, legacyStore);
    return {
      store: legacyStore,
      source: "legacy",
      degraded: true
    };
  }

  logSaveStorageFailure("read-indexeddb-fallback", {
    scope,
    migrationStatus,
    status: indexedDbStore.status,
    error: indexedDbStore.error,
    fallback: "empty"
  });
  return {
    store: {},
    source: "empty",
    degraded: true
  };
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

async function upsertLocalSlot(slotData: SaveSlotData, scope = getStorageScope()): Promise<SaveSlotData> {
  const { store } = await readPersistentStore(scope);
  store[slotData.slotId] = slotData;
  const writeResult = await writeIndexedDbStore(store, scope);
  if (writeResult.status !== "success" && writeResult.status !== "fallback-localstorage") {
    logSaveStorageFailure("upsert-local-slot", { scope, status: writeResult.status, error: writeResult.error });
  }
  setCachedStore(store, scope);
  return slotData;
}

async function removeLocalSlot(slotId: SaveSlotId, scope = getStorageScope()): Promise<boolean> {
  if (slotId === AUTO_SLOT_ID) {
    return false;
  }

  const { store } = await readPersistentStore(scope);
  if (!(slotId in store)) {
    return false;
  }

  delete store[slotId];
  const writeResult = await writeIndexedDbStore(store, scope);
  if (writeResult.status !== "success" && writeResult.status !== "fallback-localstorage") {
    logSaveStorageFailure("remove-local-slot", { scope, status: writeResult.status, error: writeResult.error });
  }
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

      return cloneStore(setCachedStore((await readPersistentStore(scope)).store, scope));
    }

    if (!force && pendingHydration && cachedScope === scope) {
      return cloneStore(await pendingHydration);
    }

    if (!force && cachedSlots && cachedScope === scope) {
      return cloneStore(cachedSlots);
    }

    pendingHydration = (async () => {
      const localReadResult = await readPersistentStore(scope);
      const localStore = localReadResult.store;

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
              merged[slotId] = newestLocal;
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
            merged[slotId] = newestLocal;
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

        const writeResult = await writeIndexedDbStore(merged, scope);
        if (writeResult.status !== "success" && writeResult.status !== "fallback-localstorage") {
          logSaveStorageFailure("hydrate-write-merged-store", {
            scope,
            status: writeResult.status,
            error: writeResult.error
          });
        }
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
    const userId = getCurrentUserId();

    if (userId) {
      await this.hydrate();
    }

    const current = this.loadSlot(targetSlotId);
    const baseSlotData: SaveSlotData = {
      slotId: targetSlotId,
      savedAt: new Date().toISOString(),
      payload,
      saveFileId: current?.saveFileId,
      userId: current?.userId
    };
    const localSlotData = await upsertLocalSlot(baseSlotData, scope);

    if (!userId) {
      return localSlotData;
    }

    try {
      const remoteSlotData = await this.upsertRemoteSlot(
        userId,
        {
          ...baseSlotData,
          userId
        }
      );
      return upsertLocalSlot(remoteSlotData, scope);
    } catch (error) {
      console.error("[SaveService] remote save failed", error);
      return upsertLocalSlot(
        {
          ...localSlotData,
          userId
        },
        scope
      );
    }
  }
}
