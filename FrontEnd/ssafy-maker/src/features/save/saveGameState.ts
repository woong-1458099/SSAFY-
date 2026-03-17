import Phaser from "phaser";
import type { SaveSlotData } from "@core/managers/SaveManager";
import type { HudState } from "@features/ui/components/game-hud";

export type SerializedInventoryStack = {
  templateId: string;
  quantity: number;
};

export type SaveGamePayload<
  AreaId extends string,
  WorldPlaceId extends string,
  StatKey extends string,
  EquipmentSlotKey extends string,
  WeeklyPlanOptionId extends string,
> = {
  currentArea: AreaId;
  lastSelectedWorldPlace: WorldPlaceId;
  playerPosition: { x: number; y: number };
  hudState: HudState;
  statsState: Record<StatKey, number>;
  actionPoint: number;
  timeCycleIndex: number;
  dayCycleIndex: number;
  weeklyPlan: WeeklyPlanOptionId[];
  weeklyPlanWeek: number;
  lastAppliedWeeklyPlanSlotKey: string | null;
  inventorySlots: Array<SerializedInventoryStack | null>;
  equippedSlots: Record<EquipmentSlotKey, string | null>;
};

type InventoryLikeTemplate<EquipmentSlotKey extends string> = {
  templateId: string;
  equipSlot?: EquipmentSlotKey;
};

type InventoryLikeStack<Template> = {
  template: Template;
  quantity: number;
};

export function getSaveSlotMetaText<
  AreaId extends string,
  WorldPlaceId extends string,
  StatKey extends string,
  EquipmentSlotKey extends string,
  WeeklyPlanOptionId extends string,
>(slotData: SaveSlotData | null): string {
  if (!slotData) return "빈칸";

  const payload = slotData.payload as Partial<
    SaveGamePayload<AreaId, WorldPlaceId, StatKey, EquipmentSlotKey, WeeklyPlanOptionId>
  >;
  const hud = payload.hudState as Partial<HudState> | undefined;
  const weekText = typeof hud?.week === "number" ? `${hud.week}주차` : "";
  const dayText = typeof hud?.dayLabel === "string" ? hud.dayLabel : "";
  const timeText = typeof hud?.timeLabel === "string" ? hud.timeLabel : "";
  const locationText = typeof hud?.locationLabel === "string" ? hud.locationLabel : "";
  const summary = [weekText, dayText, timeText].filter((entry) => entry.length > 0).join(" ");
  const savedAt = formatSaveTime(slotData.savedAt);

  if (summary && locationText) {
    return `${summary} | ${locationText} | ${savedAt}`;
  }
  if (summary) {
    return `${summary} | ${savedAt}`;
  }
  return savedAt;
}

export function formatSaveTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "저장 데이터";
  return date.toLocaleString("ko-KR", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  });
}

export function captureGameSavePayload<
  AreaId extends string,
  WorldPlaceId extends string,
  StatKey extends string,
  EquipmentSlotKey extends string,
  WeeklyPlanOptionId extends string,
  Template extends InventoryLikeTemplate<EquipmentSlotKey>,
>(params: {
  currentArea: AreaId;
  lastSelectedWorldPlace: WorldPlaceId;
  playerPosition: { x: number; y: number };
  hudState: HudState;
  statsState: Record<StatKey, number>;
  actionPoint: number;
  timeCycleIndex: number;
  dayCycleIndex: number;
  weeklyPlan: WeeklyPlanOptionId[];
  weeklyPlanWeek: number;
  lastAppliedWeeklyPlanSlotKey: string | null;
  inventorySlots: Array<InventoryLikeStack<Template> | null>;
  equippedSlots: Record<EquipmentSlotKey, Template | null>;
}): SaveGamePayload<AreaId, WorldPlaceId, StatKey, EquipmentSlotKey, WeeklyPlanOptionId> {
  const {
    currentArea,
    lastSelectedWorldPlace,
    playerPosition,
    hudState,
    statsState,
    actionPoint,
    timeCycleIndex,
    dayCycleIndex,
    weeklyPlan,
    weeklyPlanWeek,
    lastAppliedWeeklyPlanSlotKey,
    inventorySlots,
    equippedSlots
  } = params;

  return {
    currentArea,
    lastSelectedWorldPlace,
    playerPosition,
    hudState: { ...hudState },
    statsState: { ...statsState },
    actionPoint,
    timeCycleIndex,
    dayCycleIndex,
    weeklyPlan: [...weeklyPlan],
    weeklyPlanWeek,
    lastAppliedWeeklyPlanSlotKey,
    inventorySlots: inventorySlots.map((slot) =>
      slot
        ? {
            templateId: slot.template.templateId,
            quantity: slot.quantity
          }
        : null
    ),
    equippedSlots: Object.fromEntries(
      Object.entries(equippedSlots).map(([slotKey, template]) => [slotKey, (template as any)?.templateId ?? null])
    ) as Record<EquipmentSlotKey, string | null>
  };
}

export function restoreStatsFromSave<StatKey extends string>(params: {
  stats: unknown;
  statsState: Record<StatKey, number>;
  statKeys: readonly StatKey[];
  legacyCodingTargets?: readonly StatKey[];
}): void {
  const { stats, statsState, statKeys, legacyCodingTargets = [] } = params;
  if (!stats || typeof stats !== "object") return;
  const saved = stats as Partial<Record<StatKey, number>>;
  const legacyCoding = (stats as Partial<Record<"coding", number>>).coding;

  if (typeof legacyCoding === "number") {
    const next = Phaser.Math.Clamp(Math.round(legacyCoding), 0, 100);
    legacyCodingTargets.forEach((key) => {
      if (typeof saved[key] !== "number") {
        statsState[key] = next;
      }
    });
  }

  statKeys.forEach((key) => {
    const next = saved[key];
    if (typeof next !== "number") return;
    statsState[key] = Phaser.Math.Clamp(Math.round(next), 0, 100);
  });
}

export function restoreInventoryFromSave<
  EquipmentSlotKey extends string,
  Template extends InventoryLikeTemplate<EquipmentSlotKey>,
>(params: {
  payload: Partial<SaveGamePayload<string, string, string, EquipmentSlotKey, string>>;
  inventorySlots: Array<InventoryLikeStack<Template> | null>;
  equippedSlots: Record<EquipmentSlotKey, Template | null>;
  templates: readonly Template[];
}): void {
  const { payload, inventorySlots, equippedSlots, templates } = params;
  const templateMap = new Map<string, Template>();
  templates.forEach((template) => {
    templateMap.set(template.templateId, template);
  });

  for (let i = 0; i < inventorySlots.length; i += 1) {
    inventorySlots[i] = null;
  }

  const savedInventory = Array.isArray(payload.inventorySlots) ? payload.inventorySlots : [];
  for (let i = 0; i < inventorySlots.length; i += 1) {
    const row = savedInventory[i];
    if (!row || typeof row !== "object") continue;
    const item = row as Partial<SerializedInventoryStack>;
    if (typeof item.templateId !== "string") continue;
    const template = templateMap.get(item.templateId);
    if (!template) continue;
    const quantity = Math.max(1, Math.round(item.quantity ?? 1));
    inventorySlots[i] = { template, quantity };
  }

  Object.keys(equippedSlots).forEach((slotKey) => {
    equippedSlots[slotKey as EquipmentSlotKey] = null;
  });

  const savedEquipped = payload.equippedSlots;
  if (!savedEquipped || typeof savedEquipped !== "object") return;

  Object.keys(equippedSlots).forEach((slotKey) => {
    const templateId = (savedEquipped as Partial<Record<EquipmentSlotKey, string | null>>)[slotKey as EquipmentSlotKey];
    equippedSlots[slotKey as EquipmentSlotKey] =
      typeof templateId === "string" ? templateMap.get(templateId) ?? null : null;
  });
}
