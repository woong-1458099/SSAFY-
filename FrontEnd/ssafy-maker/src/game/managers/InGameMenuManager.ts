import Phaser from "phaser";
import { createInventoryPage, type SlotView } from "../../features/inventory/components/inventoryMenu";
import {
  InventoryService,
  type EquipmentSlotKey,
  type InventoryItemStack,
  type InventoryItemTemplate
} from "../../features/inventory/InventoryService";
import {
  createMenuFrame,
  MENU_TAB_ORDER,
  setActiveMenuTab,
  type MenuFrameView,
  type MenuTabKey
} from "../../features/menu/components/MenuFrame";
import {
  createPlaceholderPage,
  createSettingsPage,
  createStatsPage,
  refreshStatsPage,
  type StatRowView
} from "../../features/menu/components/tabPages";
import { createSavePage, type SaveSlotView } from "../../features/save/components/saveMenu";
import { SaveService, getSaveSlotMetaText, type SavePayload, type SaveSlotId } from "../../features/save/SaveService";
import type { HudState, PlayerStatsState, PlayerStatKey } from "../state/gameState";

type InGameMenuManagerOptions = {
  scene: Phaser.Scene;
  getStatsState: () => PlayerStatsState;
  getHudState: () => HudState;
  patchHudState: (next: Partial<HudState>) => void;
  applyStatDelta: (delta: Partial<Record<PlayerStatKey, number>>, multiplier?: 1 | -1) => void;
  inventoryService: InventoryService;
  saveService: SaveService;
  buildSavePayload: () => SavePayload;
  restoreSavePayload: (payload: SavePayload) => boolean;
};

const FONT_FAMILY =
  "\"PFStardustBold\", \"Malgun Gothic\", \"Apple SD Gothic Neo\", \"Noto Sans KR\", sans-serif";

const EQUIPMENT_DEFS: Array<{ key: EquipmentSlotKey; label: string }> = [
  { key: "keyboard", label: "키보드" },
  { key: "mouse", label: "마우스" }
];

export class InGameMenuManager {
  private readonly scene: Phaser.Scene;
  private readonly getStatsState: () => PlayerStatsState;
  private readonly getHudState: () => HudState;
  private readonly patchHudState: (next: Partial<HudState>) => void;
  private readonly applyStatDelta: (delta: Partial<Record<PlayerStatKey, number>>, multiplier?: 1 | -1) => void;
  private readonly inventoryService: InventoryService;
  private readonly saveService: SaveService;
  private readonly buildSavePayload: () => SavePayload;
  private readonly restoreSavePayload: (payload: SavePayload) => boolean;

  private frame?: MenuFrameView;
  private menuOpen = false;
  private activeTab: MenuTabKey = "stats";
  private tabPages: Partial<Record<MenuTabKey, Phaser.GameObjects.Container>> = {};
  private statViews?: Record<keyof PlayerStatsState, StatRowView>;
  private saveSlotViews: SaveSlotView[] = [];
  private selectedSaveSlotId: SaveSlotId = "slot-1";
  private inventorySlotViews: SlotView[] = [];
  private equipmentSlotViews?: Record<EquipmentSlotKey, SlotView>;
  private inventoryInfoTitle?: Phaser.GameObjects.Text;
  private inventoryInfoBody?: Phaser.GameObjects.Text;
  private noticeText?: Phaser.GameObjects.Text;

  constructor(options: InGameMenuManagerOptions) {
    this.scene = options.scene;
    this.getStatsState = options.getStatsState;
    this.getHudState = options.getHudState;
    this.patchHudState = options.patchHudState;
    this.applyStatDelta = options.applyStatDelta;
    this.inventoryService = options.inventoryService;
    this.saveService = options.saveService;
    this.buildSavePayload = options.buildSavePayload;
    this.restoreSavePayload = options.restoreSavePayload;
  }

  build(): void {
    if (this.frame) {
      return;
    }

    this.frame = createMenuFrame(this.scene, (tab) => this.switchTab(tab));
    const bounds = this.frame.contentBounds;

    const statsPage = createStatsPage(this.scene, bounds, this.getStatsState());
    this.statViews = statsPage.statViews;
    const inventoryPage = this.buildInventoryPage(bounds);
    const savePage = this.buildSavePage(bounds);
    this.noticeText = this.scene.add.text(bounds.x + 24, bounds.bottom - 26, "", {
      fontFamily: FONT_FAMILY,
      fontSize: "15px",
      color: "#9ac6f3",
      resolution: 2
    }).setOrigin(0, 0.5).setScrollFactor(0);

    this.tabPages = {
      inventory: inventoryPage,
      stats: statsPage.container,
      settings: createSettingsPage(this.scene, bounds),
      save: savePage
    };

    MENU_TAB_ORDER.forEach((tab) => {
      const page = this.tabPages[tab];
      if (!page) {
        return;
      }
      page.setVisible(tab === this.activeTab);
      this.frame?.pageRoot.add(page);
    });
    this.frame.root.add(this.noticeText);

    setActiveMenuTab(this.frame.tabs, this.activeTab);
    this.refreshInventoryUi();
    this.refreshSaveUi();
  }

  destroy(): void {
    this.frame?.root.destroy(true);
    this.frame = undefined;
    this.tabPages = {};
    this.statViews = undefined;
    this.saveSlotViews = [];
    this.inventorySlotViews = [];
    this.equipmentSlotViews = undefined;
    this.inventoryInfoTitle = undefined;
    this.inventoryInfoBody = undefined;
    this.noticeText = undefined;
    this.menuOpen = false;
  }

  isOpen(): boolean {
    return this.menuOpen;
  }

  toggle(): void {
    this.build();
    this.menuOpen = !this.menuOpen;
    this.frame?.root.setVisible(this.menuOpen);
    if (this.menuOpen) {
      this.refreshStatsUi();
      this.refreshInventoryUi();
      this.refreshSaveUi();
      this.switchTab(this.activeTab);
      this.setNotice("메뉴를 열었습니다");
    }
  }

  close(): void {
    if (!this.menuOpen) {
      return;
    }
    this.menuOpen = false;
    this.frame?.root.setVisible(false);
  }

  showNotice(message: string): void {
    this.setNotice(message);
  }

  refreshStatsUi(): void {
    if (this.statViews) {
      refreshStatsPage(this.statViews, this.getStatsState());
    }
  }

  refreshInventoryUi(): void {
    if (!this.equipmentSlotViews || this.inventorySlotViews.length === 0) {
      return;
    }

    const slots = this.inventoryService.getInventorySlots();
    const equipped = this.inventoryService.getEquippedSlots();
    this.inventorySlotViews.forEach((view, index) => {
      this.renderItem(view, slots[index]);
    });
    EQUIPMENT_DEFS.forEach(({ key }) => {
      this.renderEquipment(this.equipmentSlotViews![key], equipped[key]);
    });
  }

  refreshSaveUi(): void {
    const slots = this.saveService.loadSlots();
    this.saveSlotViews.forEach((view) => {
      const slotData = slots[view.slotId as SaveSlotId] ?? null;
      const selected = view.slotId === this.selectedSaveSlotId;
      view.title.setText(view.slotId === "auto" ? "auto" : `저장 슬롯 ${view.slotId.replace("slot-", "")}`);
      view.meta.setText(getSaveSlotMetaText(slotData));
      view.bg.setFillStyle(selected ? 0x34679d : 0x1f3f64, 1);
      view.bg.setStrokeStyle(2, selected ? 0x7dc9ff : 0x4f98df, 1);
    });
  }

  private switchTab(tab: MenuTabKey): void {
    this.activeTab = tab;
    MENU_TAB_ORDER.forEach((key) => {
      this.tabPages[key]?.setVisible(key === tab);
    });
    if (this.frame) {
      setActiveMenuTab(this.frame.tabs, tab);
    }
    if (tab === "inventory") {
      this.refreshInventoryUi();
      this.setDefaultInventoryInfo();
    }
    if (tab === "save") {
      this.refreshSaveUi();
    }
  }

  private buildInventoryPage(bounds: Phaser.Geom.Rectangle): Phaser.GameObjects.Container {
    const page = createInventoryPage<EquipmentSlotKey>(this.scene, {
      bounds,
      px: (value) => Math.round(value),
      getBodyStyle: (size, color = "#d7ecff", fontStyle = "normal") => ({
        fontFamily: FONT_FAMILY,
        fontSize: `${size}px`,
        fontStyle,
        color,
        resolution: 2
      }),
      createPanelOuterBorder: (centerX, centerY, width, height) => {
        const rect = this.scene.add.rectangle(centerX, centerY, width + 8, height + 8, 0x05111f, 0.85).setScrollFactor(0);
        rect.setStrokeStyle(1, 0x7dc9ff, 1);
        return rect;
      },
      panelInnerBorderColor: 0x4f98df,
      equipmentDefs: EQUIPMENT_DEFS,
      onEquipHover: (slot) => this.showEquipmentInfo(slot),
      onEquipOut: () => this.setDefaultInventoryInfo(),
      onEquipDown: (slot) => {
        const result = this.inventoryService.unequip(slot);
        this.applyInventoryEffect(result);
      },
      onInventoryHover: (index) => this.showInventoryInfo(index),
      onInventoryOut: () => this.setDefaultInventoryInfo(),
      onInventoryDown: (index) => {
        const result = this.inventoryService.interactInventorySlot(index, this.getHudState());
        this.applyInventoryEffect(result);
      }
    });

    this.inventorySlotViews = page.inventorySlotViews;
    this.equipmentSlotViews = page.equipmentSlotViews;

    this.inventoryInfoTitle = this.scene.add.text(bounds.x + 28, bounds.y + 362, "", {
      fontFamily: FONT_FAMILY,
      fontSize: "22px",
      fontStyle: "bold",
      color: "#eef7ff",
      resolution: 2
    }).setScrollFactor(0);
    this.inventoryInfoBody = this.scene.add.text(bounds.x + 28, bounds.y + 400, "", {
      fontFamily: FONT_FAMILY,
      fontSize: "16px",
      color: "#a9d0f4",
      resolution: 2,
      wordWrap: { width: bounds.width - 56 },
      lineSpacing: 8
    }).setScrollFactor(0);
    page.container.add([this.inventoryInfoTitle, this.inventoryInfoBody]);
    this.setDefaultInventoryInfo();
    return page.container;
  }

  private buildSavePage(bounds: Phaser.Geom.Rectangle): Phaser.GameObjects.Container {
    const page = createSavePage(this.scene, {
      bounds,
      slotIds: this.saveService.getSlotIds(),
      px: (value) => Math.round(value),
      getBodyStyle: (size, color = "#d7ecff", fontStyle = "normal") => ({
        fontFamily: FONT_FAMILY,
        fontSize: `${size}px`,
        fontStyle,
        color,
        resolution: 2
      }),
      createActionButton: ({ x, y, width, height, text, onClick }) => this.createActionButton(x, y, width, height, text, onClick),
      onSelectSlot: (slotId) => {
        this.selectedSaveSlotId = slotId as SaveSlotId;
        this.refreshSaveUi();
      },
      onSave: () => {
        this.saveService.saveSlot(this.selectedSaveSlotId, this.buildSavePayload());
        this.refreshSaveUi();
        this.setNotice(`${this.selectedSaveSlotId} 저장 완료`);
      },
      onLoad: () => {
        const slot = this.saveService.loadSlot(this.selectedSaveSlotId);
        if (!slot) {
          this.setNotice("빈 저장 슬롯입니다");
          return;
        }
        const restored = this.restoreSavePayload(slot.payload);
        this.setNotice(restored ? `${this.selectedSaveSlotId} 불러오기 완료` : "저장 데이터를 복원하지 못했습니다");
        if (restored) {
          this.refreshStatsUi();
          this.refreshInventoryUi();
          this.refreshSaveUi();
        }
      }
    });

    this.saveSlotViews = page.saveSlotViews;
    return page.container;
  }

  private renderItem(view: SlotView, stack: InventoryItemStack | null): void {
    view.bg.setFillStyle(stack ? 0x395e8b : 0x2e527d, 1);
    view.icon.setVisible(Boolean(stack));
    view.iconImage.setVisible(false);
    view.iconText.setVisible(Boolean(stack));
    view.stackText.setVisible(Boolean(stack && stack.quantity > 1));

    if (!stack) {
      view.iconText.setText("");
      view.stackText.setText("");
      return;
    }

    view.icon.setFillStyle(stack.template.color, 1);
    view.iconText.setText(stack.template.shortLabel);
    view.stackText.setText(stack.quantity > 1 ? `${stack.quantity}` : "");
  }

  private renderEquipment(view: SlotView, template: InventoryItemTemplate | null): void {
    view.bg.setFillStyle(template ? 0x395e8b : 0x2e527d, 1);
    view.icon.setVisible(Boolean(template));
    view.iconImage.setVisible(false);
    view.iconText.setVisible(Boolean(template));
    view.stackText.setVisible(false);

    if (!template) {
      view.iconText.setText("");
      return;
    }

    view.icon.setFillStyle(template.color, 1);
    view.iconText.setText(template.shortLabel);
  }

  private showInventoryInfo(index: number): void {
    const stack = this.inventoryService.getInventorySlots()[index];
    if (!stack) {
      this.setDefaultInventoryInfo();
      return;
    }
    this.inventoryInfoTitle?.setText(stack.template.name);
    this.inventoryInfoBody?.setText(
      `${stack.template.effect}\n종류: ${stack.template.kind === "equipment" ? "장비" : "소비 아이템"}\n클릭: ${
        stack.template.kind === "equipment" ? "장착 / 교체" : "사용"
      }`
    );
  }

  private showEquipmentInfo(slotKey: EquipmentSlotKey): void {
    const template = this.inventoryService.getEquippedSlots()[slotKey];
    if (!template) {
      this.inventoryInfoTitle?.setText(slotKey === "keyboard" ? "키보드 슬롯" : "마우스 슬롯");
      this.inventoryInfoBody?.setText("현재 장착된 아이템이 없습니다.\n인벤토리의 장비 아이템을 클릭하면 장착됩니다.");
      return;
    }
    this.inventoryInfoTitle?.setText(template.name);
    this.inventoryInfoBody?.setText(`${template.effect}\n클릭: 장착 해제`);
  }

  private setDefaultInventoryInfo(): void {
    this.inventoryInfoTitle?.setText("가방 사용법");
    this.inventoryInfoBody?.setText("장비 아이템은 클릭하면 장착됩니다.\n소비 아이템은 클릭하면 즉시 사용되어 HP/스트레스/스탯에 반영됩니다.");
  }

  private applyInventoryEffect(result: { hudPatch?: Partial<HudState>; statDelta?: Partial<Record<PlayerStatKey, number>>; toastMessage: string } | null): void {
    if (!result) {
      return;
    }
    if (result.statDelta) {
      this.applyStatDelta(result.statDelta, 1);
    }
    if (result.hudPatch) {
      this.patchHudState(result.hudPatch);
    }
    this.refreshInventoryUi();
    this.refreshStatsUi();
    this.setNotice(result.toastMessage);
  }

  private createActionButton(
    x: number,
    y: number,
    width: number,
    height: number,
    text: string,
    onClick: () => void
  ): Phaser.GameObjects.Container {
    const bg = this.scene.add.rectangle(0, 0, width, height, 0x29527d, 1).setScrollFactor(0);
    bg.setStrokeStyle(2, 0x8ed2ff, 1);
    const label = this.scene.add.text(0, -1, text, {
      fontFamily: FONT_FAMILY,
      fontSize: "20px",
      fontStyle: "bold",
      color: "#eef7ff",
      resolution: 2
    });
    label.setOrigin(0.5);
    const container = this.scene.add.container(x, y, [bg, label]).setScrollFactor(0);
    bg.setInteractive({ useHandCursor: true });
    bg.on("pointerdown", onClick);
    bg.on("pointerover", () => bg.setFillStyle(0x34679d, 1));
    bg.on("pointerout", () => bg.setFillStyle(0x29527d, 1));
    return container;
  }

  private setNotice(message: string): void {
    this.noticeText?.setText(message);
  }
}
