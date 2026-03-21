import Phaser from "phaser";
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
import type { PlayerStatsState } from "../state/gameState";

type InGameMenuManagerOptions = {
  scene: Phaser.Scene;
  getStatsState: () => PlayerStatsState;
};

export class InGameMenuManager {
  private readonly scene: Phaser.Scene;
  private readonly getStatsState: () => PlayerStatsState;

  private frame?: MenuFrameView;
  private menuOpen = false;
  private activeTab: MenuTabKey = "stats";
  private tabPages: Partial<Record<MenuTabKey, Phaser.GameObjects.Container>> = {};
  private statViews?: Record<keyof PlayerStatsState, StatRowView>;

  constructor(options: InGameMenuManagerOptions) {
    this.scene = options.scene;
    this.getStatsState = options.getStatsState;
  }

  build(): void {
    if (this.frame) {
      return;
    }

    this.frame = createMenuFrame(this.scene, (tab) => this.switchTab(tab));
    const bounds = this.frame.contentBounds;
    const statsPage = createStatsPage(this.scene, bounds, this.getStatsState());
    this.statViews = statsPage.statViews;

    this.tabPages = {
      inventory: createPlaceholderPage(
        this.scene,
        bounds,
        "가방",
        "인벤토리 서비스와 슬롯 UI는 다음 단계에서 연결합니다."
      ),
      stats: statsPage.container,
      settings: createSettingsPage(this.scene, bounds),
      save: createPlaceholderPage(
        this.scene,
        bounds,
        "세이브",
        "SaveService와 슬롯 목록 UI는 다음 단계에서 연결합니다."
      )
    };

    MENU_TAB_ORDER.forEach((tab) => {
      const page = this.tabPages[tab];
      if (!page) {
        return;
      }
      page.setVisible(tab === this.activeTab);
      this.frame?.pageRoot.add(page);
    });

    setActiveMenuTab(this.frame.tabs, this.activeTab);
  }

  destroy(): void {
    this.frame?.root.destroy(true);
    this.frame = undefined;
    this.tabPages = {};
    this.statViews = undefined;
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
      this.switchTab(this.activeTab);
    }
  }

  close(): void {
    if (!this.menuOpen) {
      return;
    }
    this.menuOpen = false;
    this.frame?.root.setVisible(false);
  }

  refreshStatsUi(): void {
    if (!this.statViews) {
      return;
    }
    refreshStatsPage(this.statViews, this.getStatsState());
  }

  private switchTab(tab: MenuTabKey): void {
    this.activeTab = tab;
    MENU_TAB_ORDER.forEach((key) => {
      this.tabPages[key]?.setVisible(key === tab);
    });
    if (this.frame) {
      setActiveMenuTab(this.frame.tabs, tab);
    }
  }
}
