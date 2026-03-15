export type SaveSlotData = {
  version: number;
  savedAt: string;
  payload: Record<string, unknown>;
};

type SaveStoreData = {
  version: number;
  slots: Record<string, SaveSlotData | null>;
};

export class SaveManager {
  private readonly saveKey = "ssafy_trainee_raising_save_slots";
  private readonly manualSlotCount: number;

  constructor(manualSlotCount = 6) {
    this.manualSlotCount = Math.max(1, manualSlotCount);
  }

  getSlotIds(): string[] {
    const ids = ["auto"];
    for (let i = 1; i <= this.manualSlotCount; i += 1) {
      ids.push(`slot-${i}`);
    }
    return ids;
  }

  loadSlots(): Record<string, SaveSlotData | null> {
    const slotIds = this.getSlotIds();
    const fallback = this.createEmptySlotsMap(slotIds);
    const raw = localStorage.getItem(this.saveKey);
    if (!raw) return fallback;

    try {
      const parsed = JSON.parse(raw) as Partial<SaveStoreData> | null;
      if (!parsed || typeof parsed !== "object" || !parsed.slots || typeof parsed.slots !== "object") {
        return fallback;
      }

      const merged = this.createEmptySlotsMap(slotIds);
      slotIds.forEach((slotId) => {
        const slot = (parsed.slots as Record<string, unknown>)[slotId];
        if (!slot || typeof slot !== "object") return;
        const saveSlot = slot as Partial<SaveSlotData>;
        if (typeof saveSlot.savedAt !== "string" || !saveSlot.payload || typeof saveSlot.payload !== "object") return;
        merged[slotId] = {
          version: typeof saveSlot.version === "number" ? saveSlot.version : 1,
          savedAt: saveSlot.savedAt,
          payload: saveSlot.payload as Record<string, unknown>
        };
      });
      return merged;
    } catch {
      return fallback;
    }
  }

  loadSlot(slotId: string): SaveSlotData | null {
    const slots = this.loadSlots();
    return slots[slotId] ?? null;
  }

  saveSlot(slotId: string, payload: Record<string, unknown>): SaveSlotData {
    const slotIds = this.getSlotIds();
    if (!slotIds.includes(slotId)) {
      throw new Error(`Unknown save slot: ${slotId}`);
    }

    const slots = this.loadSlots();
    const entry: SaveSlotData = {
      version: 1,
      savedAt: new Date().toISOString(),
      payload
    };
    slots[slotId] = entry;
    this.writeSlots(slots);
    return entry;
  }

  private writeSlots(slots: Record<string, SaveSlotData | null>): void {
    const data: SaveStoreData = {
      version: 1,
      slots
    };
    localStorage.setItem(this.saveKey, JSON.stringify(data));
  }

  private createEmptySlotsMap(slotIds: string[]): Record<string, SaveSlotData | null> {
    const empty: Record<string, SaveSlotData | null> = {};
    slotIds.forEach((slotId) => {
      empty[slotId] = null;
    });
    return empty;
  }
}

