import Phaser from "phaser";
import type { DebugPanelState } from "../types/debugTypes";
import type { DebugCommandBus } from "../services/DebugCommandBus";
import { UI_DEPTH } from "../../game/systems/uiDepth";

type ButtonPreset = {
  label: string;
  row: number;
  col: number;
  width?: number;
  height?: number;
  yOffset?: number;
  onClick: () => void;
};

type ButtonEntry = {
  preset: ButtonPreset;
  shadow: Phaser.GameObjects.Rectangle;
  rect: Phaser.GameObjects.Rectangle;
  text: Phaser.GameObjects.Text;
};

type PanelLayout = {
  centerX: number;
  centerY: number;
  panelWidth: number;
  panelHeight: number;
  panelLeft: number;
  panelTop: number;
  titleX: number;
  titleY: number;
  stateX: number;
  stateY: number;
  footerX: number;
  footerY: number;
  controlStartX: number;
  controlGapX: number;
  rowStartY: number;
  rowGapY: number;
  stateWrapWidth: number;
};

const BASE_PANEL_WIDTH = 1120;
const BASE_PANEL_HEIGHT = 610;
const BUTTON_BASE_WIDTH = 120;
const BUTTON_BASE_HEIGHT = 42;

export class DebugPanel {
  private readonly root: Phaser.GameObjects.Container;
  private readonly overlay: Phaser.GameObjects.Rectangle;
  private readonly panel: Phaser.GameObjects.Rectangle;
  private readonly title: Phaser.GameObjects.Text;
  private readonly stateText: Phaser.GameObjects.Text;
  private readonly footer: Phaser.GameObjects.Text;
  private readonly buttonEntries: ButtonEntry[];
  private readonly handleResize: () => void;
  private visible = false;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly commandBus: DebugCommandBus
  ) {
    this.overlay = scene.add.rectangle(0, 0, 0, 0, 0x02060d, 0.72);
    this.panel = scene.add.rectangle(0, 0, 0, 0, 0x101820, 0.96);
    this.panel.setStrokeStyle(3, 0x6ce7ff, 1);

    this.title = scene.add.text(0, 0, "F3 DEBUG PANEL", {
      fontSize: "24px",
      color: "#6ce7ff",
      fontStyle: "bold"
    });

    this.stateText = scene.add.text(0, 0, "", {
      fontSize: "15px",
      color: "#f4fbff",
      lineSpacing: 6
    });

    this.footer = scene.add.text(0, 0, "F3 패널 토글 | 실제 상태 변경은 MainScene과 manager를 통해서만 수행", {
      fontSize: "12px",
      color: "#8db8c4"
    });

    this.buttonEntries = this.createButtonEntries();
    this.root = scene.add.container(0, 0, [
      this.overlay,
      this.panel,
      this.title,
      this.stateText,
      ...this.buttonEntries.flatMap((entry) => [entry.shadow, entry.rect, entry.text]),
      this.footer
    ]);
    this.root.setDepth(UI_DEPTH.debugPanel);
    this.root.setScrollFactor(0);
    this.root.setVisible(false);

    this.handleResize = () => {
      this.layout();
    };
    this.scene.scale.on(Phaser.Scale.Events.RESIZE, this.handleResize);
    this.layout();
  }

  render(state: DebugPanelState): void {
    if (!this.visible) {
      return;
    }

    this.stateText.setText([
      `[STATE]`,
      `씬: ${state.currentSceneId || "-"}`,
      `지역: ${state.currentAreaId ?? "-"} / ${state.currentLocationLabel}`,
      `시간: ${state.hud.week}주차 ${state.hud.dayLabel} ${state.hud.timeLabel}`,
      `행동력: ${state.hud.actionPoint}/${state.hud.maxActionPoint}`,
      `HP: ${state.hud.hp}/${state.hud.hpMax}`,
      `돈: ${state.hud.money.toLocaleString("ko-KR")} G`,
      `스트레스: ${state.hud.stress}`,
      `FE: ${state.stats.fe}`,
      `BE: ${state.stats.be}`,
      `협업: ${state.stats.teamwork}`,
      `운: ${state.stats.luck}`,
      `인벤토리: ${state.inventoryUsageText}`,
      `고정 이벤트: ${state.fixedEventId ?? "-"}`
    ]);
  }

  toggle(): void {
    this.setVisible(!this.visible);
  }

  hide(): void {
    this.setVisible(false);
  }

  isVisible(): boolean {
    return this.visible;
  }

  destroy(): void {
    this.scene.scale.off(Phaser.Scale.Events.RESIZE, this.handleResize);
    this.root.destroy(true);
  }

  private setVisible(visible: boolean): void {
    this.visible = visible;
    this.root.setVisible(visible);
  }

  private createButtonEntries(): ButtonEntry[] {
    return this.getButtonPresets().map((preset) => {
      const shadow = this.scene.add.rectangle(0, 0, 1, 1, 0x000000, 0.55);
      const rect = this.scene.add.rectangle(0, 0, 1, 1, 0x17303b, 1);
      rect.setStrokeStyle(2, 0x6ce7ff, 1);
      rect.setInteractive({ useHandCursor: true });
      rect.on("pointerover", () => rect.setFillStyle(0x204554));
      rect.on("pointerout", () => rect.setFillStyle(0x17303b));
      rect.on("pointerdown", preset.onClick);

      const text = this.scene.add.text(0, 0, preset.label, {
        fontSize: "14px",
        color: "#f4fbff",
        fontStyle: "bold",
        align: "center"
      });
      text.setOrigin(0.5);

      return { preset, shadow, rect, text };
    });
  }

  private getButtonPresets(): ButtonPreset[] {
    return [
      { label: "HP -10", row: 0, col: 0, onClick: () => this.commandBus.emit({ type: "adjustHudValue", key: "hp", delta: -10 }) },
      { label: "HP +10", row: 0, col: 1, onClick: () => this.commandBus.emit({ type: "adjustHudValue", key: "hp", delta: 10 }) },
      { label: "스트 -10", row: 0, col: 2, onClick: () => this.commandBus.emit({ type: "adjustHudValue", key: "stress", delta: -10 }) },
      { label: "스트 +10", row: 0, col: 3, onClick: () => this.commandBus.emit({ type: "adjustHudValue", key: "stress", delta: 10 }) },
      { label: "돈 -1만", row: 1, col: 0, onClick: () => this.commandBus.emit({ type: "adjustHudValue", key: "money", delta: -10000 }) },
      { label: "돈 +1만", row: 1, col: 1, onClick: () => this.commandBus.emit({ type: "adjustHudValue", key: "money", delta: 10000 }) },
      { label: "행동 -1", row: 1, col: 2, onClick: () => this.commandBus.emit({ type: "adjustActionPoint", delta: -1 }) },
      { label: "행동 FULL", row: 1, col: 3, onClick: () => this.commandBus.emit({ type: "refillActionPoint" }) },
      { label: "FE -5", row: 2, col: 0, onClick: () => this.commandBus.emit({ type: "adjustStatValue", key: "fe", delta: -5 }) },
      { label: "FE +5", row: 2, col: 1, onClick: () => this.commandBus.emit({ type: "adjustStatValue", key: "fe", delta: 5 }) },
      { label: "BE -5", row: 2, col: 2, onClick: () => this.commandBus.emit({ type: "adjustStatValue", key: "be", delta: -5 }) },
      { label: "BE +5", row: 2, col: 3, onClick: () => this.commandBus.emit({ type: "adjustStatValue", key: "be", delta: 5 }) },
      { label: "협업 -5", row: 3, col: 0, onClick: () => this.commandBus.emit({ type: "adjustStatValue", key: "teamwork", delta: -5 }) },
      { label: "협업 +5", row: 3, col: 1, onClick: () => this.commandBus.emit({ type: "adjustStatValue", key: "teamwork", delta: 5 }) },
      { label: "운 -5", row: 3, col: 2, onClick: () => this.commandBus.emit({ type: "adjustStatValue", key: "luck", delta: -5 }) },
      { label: "운 +5", row: 3, col: 3, onClick: () => this.commandBus.emit({ type: "adjustStatValue", key: "luck", delta: 5 }) },
      { label: "시간 +1", row: 4, col: 0, onClick: () => this.commandBus.emit({ type: "advanceTime" }) },
      { label: "주차 -1", row: 4, col: 1, onClick: () => this.commandBus.emit({ type: "adjustWeek", delta: -1 }) },
      { label: "주차 +1", row: 4, col: 2, onClick: () => this.commandBus.emit({ type: "adjustWeek", delta: 1 }) },
      { label: "이벤트 실행", row: 4, col: 3, onClick: () => this.commandBus.emit({ type: "triggerCurrentFixedEvent" }) },
      { label: "초코 지급", row: 5, col: 0, onClick: () => this.commandBus.emit({ type: "giveInventoryItem", templateId: "item-chocolate" }) },
      { label: "에너지 지급", row: 5, col: 1, onClick: () => this.commandBus.emit({ type: "giveInventoryItem", templateId: "item-energy-drink" }) },
      { label: "키보드 지급", row: 5, col: 2, onClick: () => this.commandBus.emit({ type: "giveInventoryItem", templateId: "kbd-gaming" }) },
      { label: "오토세이브", row: 5, col: 3, onClick: () => this.commandBus.emit({ type: "saveAuto" }) },
      { label: "닫기", row: 6, col: 3, width: 140, yOffset: 5, onClick: () => this.hide() }
    ];
  }

  private layout(): void {
    const layout = this.computeLayout();

    this.overlay.setPosition(layout.centerX, layout.centerY);
    this.overlay.setSize(this.scene.scale.width, this.scene.scale.height);
    this.panel.setPosition(layout.centerX, layout.centerY);
    this.panel.setSize(layout.panelWidth, layout.panelHeight);

    this.title.setPosition(layout.titleX, layout.titleY);
    this.stateText.setPosition(layout.stateX, layout.stateY);
    this.stateText.setWordWrapWidth(layout.stateWrapWidth);
    this.footer.setPosition(layout.footerX, layout.footerY);

    this.buttonEntries.forEach((entry) => {
      const width = entry.preset.width ?? BUTTON_BASE_WIDTH;
      const height = entry.preset.height ?? BUTTON_BASE_HEIGHT;
      const x = layout.controlStartX + layout.controlGapX * entry.preset.col;
      const y = layout.rowStartY + layout.rowGapY * entry.preset.row + (entry.preset.yOffset ?? 0);
      entry.shadow.setPosition(x + 3, y + 3);
      entry.shadow.setSize(width, height);
      entry.rect.setPosition(x, y);
      entry.rect.setSize(width, height);
      entry.text.setPosition(x, y);
    });
  }

  private computeLayout(): PanelLayout {
    const width = this.scene.scale.width;
    const height = this.scene.scale.height;
    const panelWidth = Math.max(760, Math.min(BASE_PANEL_WIDTH, width - 48));
    const panelHeight = Math.max(500, Math.min(BASE_PANEL_HEIGHT, height - 48));
    const centerX = width / 2;
    const centerY = height / 2;
    const panelLeft = centerX - panelWidth / 2;
    const panelTop = centerY - panelHeight / 2;
    const controlStartX = panelLeft + panelWidth - 420;

    return {
      centerX,
      centerY,
      panelWidth,
      panelHeight,
      panelLeft,
      panelTop,
      titleX: panelLeft + 70,
      titleY: panelTop + 54,
      stateX: panelLeft + 70,
      stateY: panelTop + 98,
      footerX: panelLeft + 70,
      footerY: panelTop + panelHeight - 30,
      controlStartX,
      controlGapX: 130,
      rowStartY: panelTop + 120,
      rowGapY: 70,
      stateWrapWidth: Math.max(280, controlStartX - panelLeft - 110)
    };
  }
}
