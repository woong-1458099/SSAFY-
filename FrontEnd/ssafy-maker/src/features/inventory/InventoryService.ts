import type { HudState, PlayerStatKey } from "../../game/state/gameState";

export type EquipmentSlotKey = "keyboard" | "mouse";

export type InventoryItemTemplate = {
  templateId: string;
  name: string;
  shortLabel: string;
  kind: "equipment" | "consumable";
  equipSlot?: EquipmentSlotKey;
  price: number;
  sellPrice: number;
  effect: string;
  stackable: boolean;
  color: number;
  iconKey: string;
  hpDelta?: number;
  stressDelta?: number;
  statDelta?: Partial<Record<PlayerStatKey, number>>;
};

export type InventoryItemStack = {
  template: InventoryItemTemplate;
  quantity: number;
};

export type SerializedInventoryStack = {
  templateId: string;
  quantity: number;
};

export type InventorySnapshot = {
  inventorySlots: Array<SerializedInventoryStack | null>;
  equippedSlots: Record<EquipmentSlotKey, string | null>;
};

export type InventoryEffectResult = {
  hudPatch?: Partial<HudState>;
  statDelta?: Partial<Record<PlayerStatKey, number>>;
  toastMessage: string;
};

export type InventoryPurchaseResult = {
  hudPatch?: Partial<HudState>;
  toastMessage: string;
};

const INVENTORY_CAPACITY = 16;

export const SHOP_ITEM_TEMPLATES: InventoryItemTemplate[] = [
  {
    templateId: "kbd-gaming",
    name: "게이밍 키보드",
    shortLabel: "KB",
    kind: "equipment",
    equipSlot: "keyboard",
    price: 35000,
    sellPrice: 17500,
    effect: "FE 능력치 +5",
    stackable: false,
    color: 0x78a6d1,
    iconKey: "shop-item-keyboard",
    statDelta: { fe: 5 }
  },
  {
    templateId: "mouse-gaming",
    name: "게이밍 마우스",
    shortLabel: "MS",
    kind: "equipment",
    equipSlot: "mouse",
    price: 27000,
    sellPrice: 13500,
    effect: "BE 능력치 +5",
    stackable: false,
    color: 0x9a86d4,
    iconKey: "shop-item-mouse",
    statDelta: { be: 5 }
  },
  {
    templateId: "item-chocolate",
    name: "초코릿",
    shortLabel: "CH",
    kind: "consumable",
    price: 6000,
    sellPrice: 3000,
    effect: "HP +4, 스트레스 -3, 운 +1",
    stackable: true,
    color: 0xd89a66,
    iconKey: "shop-item-chocolate",
    hpDelta: 4,
    stressDelta: -3,
    statDelta: { luck: 1 }
  },
  {
    templateId: "item-ramen",
    name: "라면",
    shortLabel: "RA",
    kind: "consumable",
    price: 12000,
    sellPrice: 6000,
    effect: "HP +9, 스트레스 -2",
    stackable: true,
    color: 0xb17b4d,
    iconKey: "shop-item-ramen",
    hpDelta: 9,
    stressDelta: -2
  },
  {
    templateId: "item-dosirak",
    name: "도시락",
    shortLabel: "DO",
    kind: "consumable",
    price: 18000,
    sellPrice: 9000,
    effect: "HP +14, 스트레스 -4, 협업 +1",
    stackable: true,
    color: 0xc9936a,
    iconKey: "shop-item-dosirak",
    hpDelta: 14,
    stressDelta: -4,
    statDelta: { teamwork: 1 }
  },
  {
    templateId: "item-energy-drink",
    name: "에너지 드링크",
    shortLabel: "ED",
    kind: "consumable",
    price: 13000,
    sellPrice: 6500,
    effect: "HP +7, 스트레스 +5, FE +1",
    stackable: true,
    color: 0x7dd2d4,
    iconKey: "shop-item-energy-drink",
    hpDelta: 7,
    stressDelta: 5,
    statDelta: { fe: 1 }
  }
];

const STARTER_ITEM_TEMPLATE_IDS = ["item-chocolate", "item-energy-drink", "kbd-gaming"];

function createEmptyInventorySlots(): Array<InventoryItemStack | null> {
  return Array.from({ length: INVENTORY_CAPACITY }, () => null);
}

function cloneSlots(slots: Array<InventoryItemStack | null>): Array<InventoryItemStack | null> {
  return slots.map((slot) => (slot ? { template: slot.template, quantity: slot.quantity } : null));
}

function cloneEquippedSlots(
  equippedSlots: Record<EquipmentSlotKey, InventoryItemTemplate | null>
): Record<EquipmentSlotKey, InventoryItemTemplate | null> {
  return {
    keyboard: equippedSlots.keyboard,
    mouse: equippedSlots.mouse
  };
}

function signedDelta(
  delta: Partial<Record<PlayerStatKey, number>> | undefined,
  multiplier: 1 | -1
): Partial<Record<PlayerStatKey, number>> | undefined {
  if (!delta) {
    return undefined;
  }

  const result: Partial<Record<PlayerStatKey, number>> = {};
  (Object.keys(delta) as PlayerStatKey[]).forEach((key) => {
    const value = delta[key];
    if (typeof value === "number" && value !== 0) {
      result[key] = value * multiplier;
    }
  });
  return Object.keys(result).length > 0 ? result : undefined;
}

function mergeDelta(
  base: Partial<Record<PlayerStatKey, number>> | undefined,
  extra: Partial<Record<PlayerStatKey, number>> | undefined
): Partial<Record<PlayerStatKey, number>> | undefined {
  if (!base && !extra) {
    return undefined;
  }

  const result: Partial<Record<PlayerStatKey, number>> = { ...(base ?? {}) };
  (Object.keys(extra ?? {}) as PlayerStatKey[]).forEach((key) => {
    result[key] = (result[key] ?? 0) + (extra?.[key] ?? 0);
  });
  return result;
}

export class InventoryService {
  private readonly templateMap = new Map<string, InventoryItemTemplate>();
  private inventorySlots: Array<InventoryItemStack | null> = createEmptyInventorySlots();
  private equippedSlots: Record<EquipmentSlotKey, InventoryItemTemplate | null> = {
    keyboard: null,
    mouse: null
  };
  private onChange?: () => void;

  constructor() {
    SHOP_ITEM_TEMPLATES.forEach((template) => {
      this.templateMap.set(template.templateId, template);
    });
    this.reset();
  }

  setChangeListener(listener?: () => void): void {
    this.onChange = listener;
  }

  reset(): void {
    this.inventorySlots = createEmptyInventorySlots();
    this.equippedSlots = { keyboard: null, mouse: null };
    STARTER_ITEM_TEMPLATE_IDS.forEach((templateId, index) => {
      const template = this.templateMap.get(templateId);
      if (template) {
        this.inventorySlots[index] = { template, quantity: 1 };
      }
    });
    this.onChange?.();
  }

  getInventorySlots(): Array<InventoryItemStack | null> {
    return cloneSlots(this.inventorySlots);
  }

  getEquippedSlots(): Record<EquipmentSlotKey, InventoryItemTemplate | null> {
    return cloneEquippedSlots(this.equippedSlots);
  }

  getShopCatalog(): InventoryItemTemplate[] {
    return [...SHOP_ITEM_TEMPLATES];
  }

  purchaseItem(templateId: string, hudState: HudState): InventoryPurchaseResult {
    const template = this.templateMap.get(templateId);
    if (!template) {
      return { toastMessage: "구매할 수 없는 아이템입니다" };
    }

    if (hudState.money < template.price) {
      return { toastMessage: "돈이 부족합니다" };
    }

    if (!this.addItem(template, 1)) {
      return { toastMessage: "가방이 가득 찼습니다" };
    }

    this.onChange?.();
    return {
      hudPatch: { money: hudState.money - template.price },
      toastMessage: `${template.name} 구매 완료`
    };
  }

  interactInventorySlot(index: number, hudState: HudState): InventoryEffectResult | null {
    const slot = this.inventorySlots[index];
    if (!slot) {
      return null;
    }

    if (slot.template.kind === "equipment") {
      return this.equipFromInventory(index);
    }

    return this.useConsumable(index, hudState);
  }

  unequip(slotKey: EquipmentSlotKey): InventoryEffectResult | null {
    const equipped = this.equippedSlots[slotKey];
    if (!equipped) {
      return null;
    }

    const emptyIndex = this.inventorySlots.findIndex((slot) => slot === null);
    if (emptyIndex < 0) {
      return {
        toastMessage: "가방이 가득 차서 장비를 해제할 수 없습니다"
      };
    }

    this.inventorySlots[emptyIndex] = { template: equipped, quantity: 1 };
    this.equippedSlots[slotKey] = null;
    this.onChange?.();
    return {
      statDelta: signedDelta(equipped.statDelta, -1),
      toastMessage: `${equipped.name} 장착 해제`
    };
  }

  serialize(): InventorySnapshot {
    return {
      inventorySlots: this.inventorySlots.map((slot) =>
        slot
          ? {
              templateId: slot.template.templateId,
              quantity: slot.quantity
            }
          : null
      ),
      equippedSlots: {
        keyboard: this.equippedSlots.keyboard?.templateId ?? null,
        mouse: this.equippedSlots.mouse?.templateId ?? null
      }
    };
  }

  restore(snapshot?: Partial<InventorySnapshot> | null): void {
    this.inventorySlots = createEmptyInventorySlots();
    this.equippedSlots = { keyboard: null, mouse: null };

    const slots = Array.isArray(snapshot?.inventorySlots) ? snapshot.inventorySlots : [];
    for (let index = 0; index < Math.min(slots.length, INVENTORY_CAPACITY); index += 1) {
      const saved = slots[index];
      if (!saved || typeof saved.templateId !== "string") {
        continue;
      }

      const template = this.templateMap.get(saved.templateId);
      if (!template) {
        continue;
      }

      this.inventorySlots[index] = {
        template,
        quantity: Math.max(1, Math.round(saved.quantity ?? 1))
      };
    }

    (["keyboard", "mouse"] as EquipmentSlotKey[]).forEach((slotKey) => {
      const templateId = snapshot?.equippedSlots?.[slotKey];
      if (typeof templateId !== "string") {
        return;
      }
      this.equippedSlots[slotKey] = this.templateMap.get(templateId) ?? null;
    });

    this.onChange?.();
  }

  private equipFromInventory(index: number): InventoryEffectResult {
    const slot = this.inventorySlots[index];
    if (!slot || slot.template.kind !== "equipment" || !slot.template.equipSlot) {
      return { toastMessage: "장착할 수 없는 아이템입니다" };
    }

    const equipSlot = slot.template.equipSlot;
    const previous = this.equippedSlots[equipSlot];
    this.equippedSlots[equipSlot] = slot.template;
    this.inventorySlots[index] = previous ? { template: previous, quantity: 1 } : null;
    this.onChange?.();

    return {
      statDelta: mergeDelta(signedDelta(previous?.statDelta, -1), signedDelta(slot.template.statDelta, 1)),
      toastMessage: `${slot.template.name} 장착`
    };
  }

  private useConsumable(index: number, hudState: HudState): InventoryEffectResult {
    const slot = this.inventorySlots[index];
    if (!slot || slot.template.kind !== "consumable") {
      return { toastMessage: "사용할 수 없는 아이템입니다" };
    }

    const nextQuantity = slot.quantity - 1;
    if (nextQuantity <= 0) {
      this.inventorySlots[index] = null;
    } else {
      this.inventorySlots[index] = {
        template: slot.template,
        quantity: nextQuantity
      };
    }

    this.onChange?.();
    return {
      hudPatch: {
        hp: hudState.hp + (slot.template.hpDelta ?? 0),
        stress: hudState.stress + (slot.template.stressDelta ?? 0)
      },
      statDelta: signedDelta(slot.template.statDelta, 1),
      toastMessage: `${slot.template.name} 사용`
    };
  }

  private addItem(template: InventoryItemTemplate, quantity: number): boolean {
    if (template.stackable) {
      const existingIndex = this.inventorySlots.findIndex(
        (slot) => slot?.template.templateId === template.templateId
      );
      if (existingIndex >= 0) {
        const existing = this.inventorySlots[existingIndex]!;
        this.inventorySlots[existingIndex] = {
          template: existing.template,
          quantity: existing.quantity + quantity
        };
        return true;
      }
    }

    const emptyIndex = this.inventorySlots.findIndex((slot) => slot === null);
    if (emptyIndex < 0) {
      return false;
    }

    this.inventorySlots[emptyIndex] = {
      template,
      quantity
    };
    return true;
  }
}
