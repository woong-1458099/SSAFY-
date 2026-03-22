import Phaser from "phaser";
import { UI_DEPTH } from "../../../game/systems/uiDepth";

export type MenuTabKey = "inventory" | "stats" | "settings" | "save";

export const MENU_TAB_ORDER: MenuTabKey[] = ["inventory", "stats", "settings", "save"];

export const MENU_TAB_LABELS: Record<MenuTabKey, string> = {
  inventory: "가방",
  stats: "스탯",
  settings: "설정",
  save: "세이브"
};

export type MenuTabView = {
  key: MenuTabKey;
  bg: Phaser.GameObjects.Rectangle;
  label: Phaser.GameObjects.Text;
};

export type MenuFrameView = {
  root: Phaser.GameObjects.Container;
  pageRoot: Phaser.GameObjects.Container;
  tabs: Record<MenuTabKey, MenuTabView>;
  contentBounds: Phaser.Geom.Rectangle;
};

const FONT_FAMILY =
  "\"PFStardustBold\", \"Malgun Gothic\", \"Apple SD Gothic Neo\", \"Noto Sans KR\", sans-serif";

export function createMenuFrame(
  scene: Phaser.Scene,
  onTabSelect: (tab: MenuTabKey) => void
): MenuFrameView {
  const width = 920;
  const height = 548;
  const centerX = Math.round(scene.scale.width / 2);
  const centerY = Math.round(scene.scale.height / 2);
  const left = Math.round(centerX - width / 2);
  const top = Math.round(centerY - height / 2);

  const root = scene.add.container(0, 0).setDepth(UI_DEPTH.menu).setVisible(false).setScrollFactor(0);
  const dim = scene.add
    .rectangle(centerX, centerY, scene.scale.width, scene.scale.height, 0x040816, 0.58)
    .setScrollFactor(0);
  const panel = scene.add.rectangle(centerX, centerY, width, height, 0x102845, 0.97).setScrollFactor(0);
  panel.setStrokeStyle(3, 0x6ab8ff, 1);
  const header = scene.add.rectangle(centerX, top + 36, width - 18, 56, 0x17355a, 0.96).setScrollFactor(0);
  header.setStrokeStyle(2, 0x7dc9ff, 1);
  const title = scene.add.text(centerX, top + 20, "인게임 메뉴", {
    fontFamily: FONT_FAMILY,
    fontSize: "24px",
    fontStyle: "bold",
    color: "#eef7ff",
    resolution: 2
  });
  title.setOrigin(0.5, 0);

  const tabWidth = 170;
  const tabHeight = 40;
  const tabGap = 10;
  const totalTabsWidth = MENU_TAB_ORDER.length * tabWidth + (MENU_TAB_ORDER.length - 1) * tabGap;
  const tabStartX = Math.round(centerX - totalTabsWidth / 2 + tabWidth / 2);
  const tabY = top + 88;

  const tabs = {} as Record<MenuTabKey, MenuTabView>;
  MENU_TAB_ORDER.forEach((tab, index) => {
    const x = Math.round(tabStartX + index * (tabWidth + tabGap));
    const bg = scene.add.rectangle(x, tabY, tabWidth, tabHeight, 0x21476f, 1).setScrollFactor(0);
    bg.setStrokeStyle(2, 0x5aa8ee, 1);
    bg.setInteractive({ useHandCursor: true });
    const label = scene.add.text(x, tabY - 1, MENU_TAB_LABELS[tab], {
      fontFamily: FONT_FAMILY,
      fontSize: "19px",
      fontStyle: "bold",
      color: "#cde5ff",
      resolution: 2
    });
    label.setOrigin(0.5);
    bg.on("pointerdown", () => onTabSelect(tab));
    tabs[tab] = { key: tab, bg, label };
  });

  const contentBounds = new Phaser.Geom.Rectangle(left + 28, top + 122, width - 56, height - 168);
  const contentBg = scene.add
    .rectangle(
      contentBounds.centerX,
      contentBounds.centerY,
      contentBounds.width,
      contentBounds.height,
      0x0a1c30,
      0.96
    )
    .setScrollFactor(0);
  contentBg.setStrokeStyle(2, 0x4f98df, 1);

  const pageRoot = scene.add.container(0, 0).setScrollFactor(0);
  root.add([dim, panel, header, title, ...Object.values(tabs).flatMap((tab) => [tab.bg, tab.label]), contentBg, pageRoot]);

  return {
    root,
    pageRoot,
    tabs,
    contentBounds
  };
}

export function setActiveMenuTab(tabs: Record<MenuTabKey, MenuTabView>, activeTab: MenuTabKey): void {
  MENU_TAB_ORDER.forEach((tab) => {
    const isActive = tab === activeTab;
    tabs[tab].bg.setFillStyle(isActive ? 0x34679d : 0x21476f, 1);
    tabs[tab].bg.setStrokeStyle(2, isActive ? 0x8ed2ff : 0x5aa8ee, 1);
    tabs[tab].label.setColor(isActive ? "#f4fbff" : "#cde5ff");
  });
}
