import Phaser from "phaser";
import type { DebugPanelState } from "../types/debugTypes";
import type { DebugCommandBus } from "../services/DebugCommandBus";

type ButtonConfig = {
  label: string;
  x: number;
  y: number;
  width?: number;
  height?: number;
  onClick: () => void;
};

export class DebugPanel {
  private readonly root: Phaser.GameObjects.Container;
  private readonly overlay: Phaser.GameObjects.Rectangle;
  private readonly panel: Phaser.GameObjects.Rectangle;
  private readonly title: Phaser.GameObjects.Text;
  private readonly stateText: Phaser.GameObjects.Text;
  private readonly buttons: Phaser.GameObjects.GameObject[] = [];
  private visible = false;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly commandBus: DebugCommandBus
  ) {
    const centerX = scene.scale.width / 2;
    const centerY = scene.scale.height / 2;
    const panelWidth = 1120;
    const panelHeight = 610;
    const panelLeft = centerX - panelWidth / 2;
    const titleX = panelLeft + 70;
    const stateX = panelLeft + 70;
    const controlStartX = panelLeft + 700;
    const controlGapX = 130;
    const rowStartY = 120;
    const rowGapY = 70;
    const col = (index: number) => controlStartX + controlGapX * index;

    this.overlay = scene.add.rectangle(centerX, centerY, scene.scale.width, scene.scale.height, 0x02060d, 0.72);
    this.panel = scene.add.rectangle(centerX, centerY, panelWidth, panelHeight, 0x101820, 0.96);
    this.panel.setStrokeStyle(3, 0x6ce7ff, 1);
    this.title = scene.add.text(titleX, 84, "F3 DEBUG PANEL", {
      fontSize: "24px",
      color: "#6ce7ff",
      fontStyle: "bold"
    });
    this.stateText = scene.add.text(stateX, 128, "", {
      fontSize: "15px",
      color: "#f4fbff",
      lineSpacing: 6
    });

    this.buttons.push(
      ...this.createButtonRow([
        { label: "HP -10", x: col(0), y: rowStartY, onClick: () => this.commandBus.emit({ type: "adjustHudValue", key: "hp", delta: -10 }) },
        { label: "HP +10", x: col(1), y: rowStartY, onClick: () => this.commandBus.emit({ type: "adjustHudValue", key: "hp", delta: 10 }) },
        { label: "스트 -10", x: col(2), y: rowStartY, onClick: () => this.commandBus.emit({ type: "adjustHudValue", key: "stress", delta: -10 }) },
        { label: "스트 +10", x: col(3), y: rowStartY, onClick: () => this.commandBus.emit({ type: "adjustHudValue", key: "stress", delta: 10 }) }
      ]),
      ...this.createButtonRow([
        { label: "돈 -1만", x: col(0), y: rowStartY + rowGapY, onClick: () => this.commandBus.emit({ type: "adjustHudValue", key: "money", delta: -10000 }) },
        { label: "돈 +1만", x: col(1), y: rowStartY + rowGapY, onClick: () => this.commandBus.emit({ type: "adjustHudValue", key: "money", delta: 10000 }) },
        { label: "행동 -1", x: col(2), y: rowStartY + rowGapY, onClick: () => this.commandBus.emit({ type: "adjustActionPoint", delta: -1 }) },
        { label: "행동 FULL", x: col(3), y: rowStartY + rowGapY, onClick: () => this.commandBus.emit({ type: "refillActionPoint" }) }
      ]),
      ...this.createButtonRow([
        { label: "FE -5", x: col(0), y: rowStartY + rowGapY * 2, onClick: () => this.commandBus.emit({ type: "adjustStatValue", key: "fe", delta: -5 }) },
        { label: "FE +5", x: col(1), y: rowStartY + rowGapY * 2, onClick: () => this.commandBus.emit({ type: "adjustStatValue", key: "fe", delta: 5 }) },
        { label: "BE -5", x: col(2), y: rowStartY + rowGapY * 2, onClick: () => this.commandBus.emit({ type: "adjustStatValue", key: "be", delta: -5 }) },
        { label: "BE +5", x: col(3), y: rowStartY + rowGapY * 2, onClick: () => this.commandBus.emit({ type: "adjustStatValue", key: "be", delta: 5 }) }
      ]),
      ...this.createButtonRow([
        { label: "협업 -5", x: col(0), y: rowStartY + rowGapY * 3, onClick: () => this.commandBus.emit({ type: "adjustStatValue", key: "teamwork", delta: -5 }) },
        { label: "협업 +5", x: col(1), y: rowStartY + rowGapY * 3, onClick: () => this.commandBus.emit({ type: "adjustStatValue", key: "teamwork", delta: 5 }) },
        { label: "운 -5", x: col(2), y: rowStartY + rowGapY * 3, onClick: () => this.commandBus.emit({ type: "adjustStatValue", key: "luck", delta: -5 }) },
        { label: "운 +5", x: col(3), y: rowStartY + rowGapY * 3, onClick: () => this.commandBus.emit({ type: "adjustStatValue", key: "luck", delta: 5 }) }
      ]),
      ...this.createButtonRow([
        { label: "시간 +1", x: col(0), y: rowStartY + rowGapY * 4, onClick: () => this.commandBus.emit({ type: "advanceTime" }) },
        { label: "주차 -1", x: col(1), y: rowStartY + rowGapY * 4, onClick: () => this.commandBus.emit({ type: "adjustWeek", delta: -1 }) },
        { label: "주차 +1", x: col(2), y: rowStartY + rowGapY * 4, onClick: () => this.commandBus.emit({ type: "adjustWeek", delta: 1 }) },
        { label: "이벤트 실행", x: col(3), y: rowStartY + rowGapY * 4, onClick: () => this.commandBus.emit({ type: "triggerCurrentFixedEvent" }) }
      ]),
      ...this.createButtonRow([
        { label: "초코 지급", x: col(0), y: rowStartY + rowGapY * 5, onClick: () => this.commandBus.emit({ type: "giveInventoryItem", templateId: "item-chocolate" }) },
        { label: "에너지 지급", x: col(1), y: rowStartY + rowGapY * 5, onClick: () => this.commandBus.emit({ type: "giveInventoryItem", templateId: "item-energy-drink" }) },
        { label: "키보드 지급", x: col(2), y: rowStartY + rowGapY * 5, onClick: () => this.commandBus.emit({ type: "giveInventoryItem", templateId: "kbd-gaming" }) },
        { label: "오토세이브", x: col(3), y: rowStartY + rowGapY * 5, onClick: () => this.commandBus.emit({ type: "saveAuto" }) }
      ]),
      ...this.createButtonRow([
        { label: "닫기", x: col(3), y: rowStartY + rowGapY * 6 + 5, width: 140, onClick: () => this.hide() }
      ])
    );

    const footer = scene.add.text(titleX, 590, "F3 패널 토글 | 실제 상태 변경은 MainScene과 manager를 통해서만 수행", {
      fontSize: "12px",
      color: "#8db8c4"
    });

    this.root = scene.add.container(0, 0, [
      this.overlay,
      this.panel,
      this.title,
      this.stateText,
      ...this.buttons,
      footer
    ]);
    this.root.setDepth(9900);
    this.root.setScrollFactor(0);
    this.root.setVisible(false);
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
    this.root.destroy(true);
  }

  private setVisible(visible: boolean): void {
    this.visible = visible;
    this.root.setVisible(visible);
  }

  private createButtonRow(configs: ButtonConfig[]): Phaser.GameObjects.GameObject[] {
    return configs.flatMap((config) => this.createButton(config));
  }

  private createButton(config: ButtonConfig): Phaser.GameObjects.GameObject[] {
    const width = config.width ?? 120;
    const height = config.height ?? 42;
    const shadow = this.scene.add.rectangle(config.x + 3, config.y + 3, width, height, 0x000000, 0.55);
    const rect = this.scene.add.rectangle(config.x, config.y, width, height, 0x17303b, 1);
    rect.setStrokeStyle(2, 0x6ce7ff, 1);
    rect.setInteractive({ useHandCursor: true });
    rect.on("pointerover", () => rect.setFillStyle(0x204554));
    rect.on("pointerout", () => rect.setFillStyle(0x17303b));
    rect.on("pointerdown", config.onClick);

    const text = this.scene.add.text(config.x, config.y, config.label, {
      fontSize: "14px",
      color: "#f4fbff",
      fontStyle: "bold",
      align: "center"
    });
    text.setOrigin(0.5);

    return [shadow, rect, text];
  }
}
