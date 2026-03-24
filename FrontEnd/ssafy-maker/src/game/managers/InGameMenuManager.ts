import Phaser from "phaser";
import { createInventoryPage, type SlotView } from "../../features/inventory/components/inventoryMenu";
import { applyInventoryItemIconImage } from "../../features/inventory/inventoryAssets";
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
  type SettingsPageState,
  type SettingsPageView,
  type StatRowView
} from "../../features/menu/components/tabPages";
import { createSavePage, type SaveSlotView } from "../../features/save/components/saveMenu";
import {
  SaveService,
  getSaveSlotLabel,
  getSaveSlotMetaText,
  type SavePayload,
  type SaveSlotId
} from "../../features/save/SaveService";
import { createSaveConfirmDialog } from "../../features/save/components/saveConfirmDialog";
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
  getSettingsState: () => SettingsPageState;
  onAdjustBgmVolume: (delta: number) => void;
  onToggleBgm: () => void;
  onAdjustSfxVolume: (delta: number) => void;
  onToggleSfx: () => void;
  onAdjustBrightness: (delta: number) => void;
  onLogout: () => void;
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
  private readonly getSettingsState: () => SettingsPageState;
  private readonly onAdjustBgmVolume: (delta: number) => void;
  private readonly onToggleBgm: () => void;
  private readonly onAdjustSfxVolume: (delta: number) => void;
  private readonly onToggleSfx: () => void;
  private readonly onAdjustBrightness: (delta: number) => void;
  private readonly onLogout: () => void;

  private frame?: MenuFrameView;
  private menuOpen = false;
  private activeTab: MenuTabKey = "stats";
  private tabPages: Partial<Record<MenuTabKey, Phaser.GameObjects.Container>> = {};
  private statViews?: Record<keyof PlayerStatsState, StatRowView>;
  private saveSlotViews: SaveSlotView[] = [];
  private selectedSaveSlotId: SaveSlotId = "auto";
  private manualSaveSlotPage = 0;
  private readonly manualSaveSlotPageSize = 6;
  private inventorySlotViews: SlotView[] = [];
  private equipmentSlotViews?: Record<EquipmentSlotKey, SlotView>;
  private inventoryInfoTitle?: Phaser.GameObjects.Text;
  private inventoryInfoBody?: Phaser.GameObjects.Text;
  private noticeText?: Phaser.GameObjects.Text;
  private saveConfirmDialog?: Phaser.GameObjects.Container;
  private settingsPageView?: SettingsPageView;

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
    this.getSettingsState = options.getSettingsState;
    this.onAdjustBgmVolume = options.onAdjustBgmVolume;
    this.onToggleBgm = options.onToggleBgm;
    this.onAdjustSfxVolume = options.onAdjustSfxVolume;
    this.onToggleSfx = options.onToggleSfx;
    this.onAdjustBrightness = options.onAdjustBrightness;
    this.onLogout = options.onLogout;
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
    this.settingsPageView = createSettingsPage(this.scene, bounds, {
      getState: () => this.getSettingsState(),
      onAdjustBgmVolume: (delta) => this.onAdjustBgmVolume(delta),
      onToggleBgm: () => this.onToggleBgm(),
      onAdjustSfxVolume: (delta) => this.onAdjustSfxVolume(delta),
      onToggleSfx: () => this.onToggleSfx(),
      onAdjustBrightness: (delta) => this.onAdjustBrightness(delta),
      createActionButton: ({ x, y, width, height, text, onClick }) =>
        this.createActionButton(x, y, width, height, text, onClick),
      onLogout: () => this.onLogout()
    });
    this.noticeText = this.scene.add.text(bounds.x + 24, bounds.bottom + 10, "", {
      fontFamily: FONT_FAMILY,
      fontSize: "13px",
      color: "#9ac6f3",
      resolution: 2
    }).setOrigin(0, 0.5).setScrollFactor(0).setVisible(false);

    this.tabPages = {
      inventory: inventoryPage,
      stats: statsPage.container,
      settings: this.settingsPageView.container,
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
    void this.hydrateSaveSlots();
  }

  destroy(): void {
    this.settingsPageView?.destroy();
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
    this.saveConfirmDialog = undefined;
    this.settingsPageView = undefined;
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
      this.settingsPageView?.refresh();
      this.switchTab(this.activeTab);
      void this.hydrateSaveSlots(this.activeTab === "save");
    }
  }

  close(): void {
    if (!this.menuOpen) {
      return;
    }
    this.menuOpen = false;
    this.frame?.root.setVisible(false);
    this.hideSaveConfirmDialog();
    this.noticeText?.setVisible(false);
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
      const slotData = slots[view.slotId] ?? null;
      const selected = view.slotId === this.selectedSaveSlotId;
      view.title.setText(getSaveSlotLabel(view.slotId));
      view.meta.setText(getSaveSlotMetaText(slotData));
      view.bg.setFillStyle(selected ? 0x34679d : 0x1f3f64, 1);
      view.bg.setStrokeStyle(2, selected ? 0x7dc9ff : 0x4f98df, 1);
    });
  }

  private async hydrateSaveSlots(force = false): Promise<void> {
    await this.saveService.hydrate(force);
    if (!this.frame) {
      return;
    }

    this.rebuildSavePage();
    this.refreshSaveUi();
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
      this.rebuildSavePage();
      this.refreshSaveUi();
      void this.hydrateSaveSlots(true);
    }
    if (tab === "settings") {
      this.settingsPageView?.refresh();
    }
    this.updateNoticeVisibility();
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

    const infoPanelHeight = 64;
    const infoPanelTop = bounds.y + 318;
    const infoPanelCenterX = bounds.centerX;
    const infoPanelCenterY = Math.round(infoPanelTop + infoPanelHeight / 2);
    const infoPanelOuter = this.scene.add
      .rectangle(infoPanelCenterX, infoPanelCenterY, bounds.width - 8, infoPanelHeight + 8, 0x05111f, 0.85)
      .setScrollFactor(0);
    infoPanelOuter.setStrokeStyle(1, 0x7dc9ff, 1);
    const infoPanel = this.scene.add
      .rectangle(infoPanelCenterX, infoPanelCenterY, bounds.width - 16, infoPanelHeight, 0x14314f, 0.9)
      .setScrollFactor(0);
    infoPanel.setStrokeStyle(2, 0x4f98df, 1);

    this.inventoryInfoTitle = this.scene.add.text(bounds.x + 28, infoPanelTop + 8, "", {
      fontFamily: FONT_FAMILY,
      fontSize: "17px",
      fontStyle: "bold",
      color: "#eef7ff",
      resolution: 2
    }).setScrollFactor(0);
    this.inventoryInfoBody = this.scene.add.text(bounds.x + 28, infoPanelTop + 30, "", {
      fontFamily: FONT_FAMILY,
      fontSize: "13px",
      color: "#a9d0f4",
      resolution: 2,
      wordWrap: { width: bounds.width - 56 },
      lineSpacing: 3
    }).setScrollFactor(0);
    page.container.add([infoPanelOuter, infoPanel, this.inventoryInfoTitle, this.inventoryInfoBody]);
    this.setDefaultInventoryInfo();
    return page.container;
  }

  private buildSavePage(bounds: Phaser.Geom.Rectangle): Phaser.GameObjects.Container {
    const manualSlotIds = this.saveService.getManualSlotIds();
    const maxPageIndex = Math.max(0, Math.ceil(Math.max(manualSlotIds.length, 1) / this.manualSaveSlotPageSize) - 1);
    this.manualSaveSlotPage = Phaser.Math.Clamp(this.manualSaveSlotPage, 0, maxPageIndex);
    const page = createSavePage(this.scene, {
      bounds,
      autoSlotId: this.saveService.getAutoSlotId(),
      manualSlotIds,
      selectedSlotId: this.selectedSaveSlotId,
      manualSlotPage: this.manualSaveSlotPage,
      manualSlotPageSize: this.manualSaveSlotPageSize,
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
        this.selectedSaveSlotId = slotId;
        this.refreshSaveUi();
      },
      onCreateNewSlot: () => {
        void this.handleCreateNewSlot();
      },
      onPrevPage: () => {
        this.manualSaveSlotPage = Math.max(0, this.manualSaveSlotPage - 1);
        this.rebuildSavePage();
      },
      onNextPage: () => {
        const nextMaxPageIndex = Math.max(
          0,
          Math.ceil(Math.max(this.saveService.getManualSlotIds().length, 1) / this.manualSaveSlotPageSize) - 1
        );
        this.manualSaveSlotPage = Math.min(nextMaxPageIndex, this.manualSaveSlotPage + 1);
        this.rebuildSavePage();
      },
      onSaveSelected: () => {
        if (this.selectedSaveSlotId === this.saveService.getAutoSlotId()) {
          this.setNotice("Auto Save는 시스템 전용입니다. 신규 저장이나 수동 슬롯을 사용하세요.");
          return;
        }
        this.openSaveConfirmDialog({
          title: "저장 확인",
          body: `${getSaveSlotLabel(this.selectedSaveSlotId)}에 현재 진행 상황을 저장할까요?`,
          confirmText: "저장",
          onConfirm: () => {
            void this.handleSaveSelected();
          }
        });
      },
      onLoadSelected: () => {
        const slot = this.saveService.loadSlot(this.selectedSaveSlotId);
        if (!slot) {
          this.setNotice("빈 저장 슬롯입니다");
          return;
        }
        this.openSaveConfirmDialog({
          title: "불러오기 확인",
          body: `${getSaveSlotLabel(this.selectedSaveSlotId)}를 불러오면 현재 진행 상황이 덮어써집니다.\n계속할까요?`,
          confirmText: "불러오기",
          onConfirm: () => {
            const restored = this.restoreSavePayload(slot.payload);
            this.setNotice(
              restored ? `${getSaveSlotLabel(this.selectedSaveSlotId)} 불러오기 완료` : "저장 데이터를 복원하지 못했습니다"
            );
            if (restored) {
              this.refreshStatsUi();
              this.refreshInventoryUi();
              this.refreshSaveUi();
            }
          }
        });
      },
      onDeleteSelected: () => {
        if (this.selectedSaveSlotId === this.saveService.getAutoSlotId()) {
          this.setNotice("Auto Save는 삭제할 수 없습니다.");
          return;
        }

        const slot = this.saveService.loadSlot(this.selectedSaveSlotId);
        if (!slot) {
          this.setNotice("삭제할 저장 슬롯이 없습니다.");
          return;
        }
        this.openSaveConfirmDialog({
          title: "삭제 확인",
          body: `${getSaveSlotLabel(this.selectedSaveSlotId)}를 삭제할까요?\n삭제한 저장은 되돌릴 수 없습니다.`,
          confirmText: "삭제",
          onConfirm: () => {
            void this.handleDeleteSelected();
          }
        });
      }
    });

    this.saveSlotViews = page.saveSlotViews;
    return page.container;
  }

  private rebuildSavePage(): void {
    const bounds = this.frame?.contentBounds;
    if (!bounds) {
      return;
    }

    this.tabPages.save?.destroy(true);
    const savePage = this.buildSavePage(bounds);
    savePage.setVisible(this.activeTab === "save");
    this.tabPages.save = savePage;
    this.frame?.pageRoot.add(savePage);
  }

  private async handleCreateNewSlot(): Promise<void> {
    this.selectedSaveSlotId = this.saveService.getNextManualSlotId();
    this.manualSaveSlotPage = Math.floor(this.saveService.getManualSlotIds().length / this.manualSaveSlotPageSize);

    try {
      await this.saveService.saveSlot(this.selectedSaveSlotId, this.buildSavePayload());
      this.rebuildSavePage();
      this.refreshSaveUi();
      this.setNotice(`${getSaveSlotLabel(this.selectedSaveSlotId)} 생성 및 저장 완료`);
    } catch (error) {
      console.error("[InGameMenuManager] failed to create save slot", error);
      this.setNotice("저장 슬롯 생성에 실패했습니다.");
    }
  }

  private async handleSaveSelected(): Promise<void> {
    try {
      await this.saveService.saveSlot(this.selectedSaveSlotId, this.buildSavePayload());
      this.rebuildSavePage();
      this.refreshSaveUi();
      this.setNotice(`${getSaveSlotLabel(this.selectedSaveSlotId)} 저장 완료`);
    } catch (error) {
      console.error("[InGameMenuManager] failed to save slot", error);
      this.setNotice("저장에 실패했습니다.");
    }
  }

  private async handleDeleteSelected(): Promise<void> {
    try {
      const deleted = await this.saveService.deleteSlot(this.selectedSaveSlotId);
      if (!deleted) {
        this.setNotice("삭제할 저장 슬롯이 없습니다.");
        return;
      }

      const remainingManualSlots = this.saveService.getManualSlotIds();
      this.selectedSaveSlotId =
        remainingManualSlots[remainingManualSlots.length - 1] ?? this.saveService.getAutoSlotId();
      const maxPageIndexAfterDelete = Math.max(
        0,
        Math.ceil(Math.max(remainingManualSlots.length, 1) / this.manualSaveSlotPageSize) - 1
      );
      this.manualSaveSlotPage = Math.min(this.manualSaveSlotPage, maxPageIndexAfterDelete);
      this.rebuildSavePage();
      this.refreshSaveUi();
      this.setNotice("저장 슬롯을 삭제했습니다.");
    } catch (error) {
      console.error("[InGameMenuManager] failed to delete save slot", error);
      this.setNotice("저장 삭제에 실패했습니다.");
    }
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

    const hasIconImage = applyInventoryItemIconImage(
      this.scene,
      view.iconImage,
      stack.template,
      view.icon.width - 10,
      view.icon.height - 10
    );
    view.icon.setFillStyle(0xf5fbff, hasIconImage ? 0 : 1);
    view.iconText.setText(stack.template.shortLabel);
    view.iconText.setColor(hasIconImage ? "#e8f4ff" : "#234873");
    view.iconText.setVisible(!hasIconImage);
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

    const hasIconImage = applyInventoryItemIconImage(
      this.scene,
      view.iconImage,
      template,
      view.icon.width - 10,
      view.icon.height - 10
    );
    view.icon.setFillStyle(0xf5fbff, hasIconImage ? 0 : 1);
    view.iconText.setText(template.shortLabel);
    view.iconText.setColor(hasIconImage ? "#e8f4ff" : "#234873");
    view.iconText.setVisible(!hasIconImage);
  }

  private showInventoryInfo(index: number): void {
    const stack = this.inventoryService.getInventorySlots()[index];
    if (!stack) {
      this.setDefaultInventoryInfo();
      return;
    }
    this.inventoryInfoTitle?.setText(stack.template.name);
    this.inventoryInfoBody?.setText(
      `${stack.template.effect}\n종류: ${stack.template.kind === "equipment" ? "장비" : "소비 아이템"}\n사용: ${
        stack.template.kind === "equipment" ? "장착 / 교체" : "사용"
      }`
    );
  }

  private showEquipmentInfo(slotKey: EquipmentSlotKey): void {
    const template = this.inventoryService.getEquippedSlots()[slotKey];
    if (!template) {
      this.inventoryInfoTitle?.setText(slotKey === "keyboard" ? "키보드 슬롯" : "마우스 슬롯");
      this.inventoryInfoBody?.setText("현재 장착된 아이템이 없습니다.\n인벤토리의 장비 아이템을 누르면 장착됩니다.");
      return;
    }
    this.inventoryInfoTitle?.setText(template.name);
    this.inventoryInfoBody?.setText(`${template.effect}\n사용: 장착 해제`);
  }

  private setDefaultInventoryInfo(): void {
    this.inventoryInfoTitle?.setText("가방 사용법");
    this.inventoryInfoBody?.setText("장비 아이템은 누르면 장착됩니다.\n소비 아이템은 누르면 즉시 사용되어 스탯에 반영됩니다.");
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
    this.noticeText?.setVisible(message.trim().length > 0);
    this.updateNoticeVisibility();
  }

  private openSaveConfirmDialog(options: {
    title: string;
    body: string;
    confirmText: string;
    onConfirm: () => void;
  }): void {
    this.hideSaveConfirmDialog();
    const dialog = createSaveConfirmDialog(this.scene, {
      title: options.title,
      body: options.body,
      confirmText: options.confirmText,
      createActionButton: ({ x, y, width, height, text, onClick }) =>
        this.createActionButton(x, y, width, height, text, onClick),
      onConfirm: () => {
        this.hideSaveConfirmDialog();
        options.onConfirm();
      },
      onCancel: () => {
        this.hideSaveConfirmDialog();
      }
    });
    this.frame?.root.add(dialog);
    this.saveConfirmDialog = dialog;
  }

  private hideSaveConfirmDialog(): void {
    this.saveConfirmDialog?.destroy(true);
    this.saveConfirmDialog = undefined;
  }

  private updateNoticeVisibility(): void {
    const hasText = Boolean(this.noticeText?.text && this.noticeText.text.trim().length > 0);
    const shouldShow = this.menuOpen && this.activeTab !== "stats" && hasText;
    this.noticeText?.setVisible(shouldShow);
  }
}
