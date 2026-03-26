import Phaser from "phaser";
import type { AreaTransitionId } from "../definitions/places/areaTransitionDefinitions";
import { UI_DEPTH } from "../systems/uiDepth";

export type RuntimeAreaTransitionTarget = {
  id: AreaTransitionId;
  label: string;
  centerX: number;
  centerY: number;
  zoneX: number;
  zoneY: number;
  zoneWidth: number;
  zoneHeight: number;
  tileX: number;
  tileY: number;
  tileWidth: number;
  tileHeight: number;
};

type TransitionView = {
  zone: Phaser.GameObjects.Graphics;
  label: Phaser.GameObjects.Text;
  arrow: Phaser.GameObjects.Text;
  pulseTimer?: Phaser.Time.TimerEvent;
  pulsePhase: number;
};

// 전이 포인트를 포탈 느낌의 직관적인 UI로 표시한다.
export class AreaTransitionOverlay {
  private views = new Map<AreaTransitionId, TransitionView>();
  private isVisible = true;

  constructor(private scene: Phaser.Scene) {}

  setVisible(visible: boolean) {
    this.isVisible = visible;

    for (const view of this.views.values()) {
      view.zone.setVisible(visible);
      view.label.setVisible(visible);
      view.arrow.setVisible(visible);
    }
  }

  render(targets: RuntimeAreaTransitionTarget[], activeId?: AreaTransitionId) {
    const visibleIds = new Set(targets.map((target) => target.id));

    for (const [id, view] of this.views.entries()) {
      if (visibleIds.has(id)) {
        continue;
      }

      view.zone.destroy();
      view.label.destroy();
      view.arrow.destroy();
      view.pulseTimer?.destroy();
      this.views.delete(id);
    }

    targets.forEach((target) => {
      const view = this.views.get(target.id) ?? this.createView(target);
      const isActive = target.id === activeId;
      this.drawZone(view.zone, target, isActive, view.pulsePhase);
      view.label.setText(`🚪 ${target.label}`);
      this.positionLabel(view.label, target);
      view.label.setAlpha(isActive ? 1 : 0.85);
      view.arrow.setPosition(target.centerX, target.centerY);
      view.arrow.setAlpha(isActive ? 1 : 0.7);
      view.zone.setVisible(this.isVisible);
      view.label.setVisible(this.isVisible);
      view.arrow.setVisible(this.isVisible);
    });
  }

  destroy() {
    for (const view of this.views.values()) {
      view.zone.destroy();
      view.label.destroy();
      view.arrow.destroy();
      view.pulseTimer?.destroy();
    }

    this.views.clear();
  }

  private createView(target: RuntimeAreaTransitionTarget) {
    const zone = this.scene.add.graphics().setDepth(UI_DEPTH.areaTransitionZone);

    const label = this.scene.add
      .text(target.centerX, target.zoneY + target.zoneHeight + 8, `🚪 ${target.label}`, {
        fontSize: "13px",
        fontFamily: '"PFStardustBold", "Malgun Gothic", sans-serif',
        color: "#ffffff",
        backgroundColor: "rgba(0, 80, 160, 0.85)",
        padding: { x: 8, y: 4 },
        shadow: {
          offsetX: 1,
          offsetY: 1,
          color: "#000000",
          blur: 2,
          fill: true
        }
      })
      .setOrigin(0, 0)
      .setDepth(UI_DEPTH.areaTransitionLabel);

    // 화살표 아이콘 (위쪽 방향)
    const arrow = this.scene.add
      .text(target.centerX, target.centerY, "▲", {
        fontSize: "20px",
        color: "#ffffff",
        shadow: {
          offsetX: 0,
          offsetY: 2,
          color: "#0066cc",
          blur: 4,
          fill: true
        }
      })
      .setOrigin(0.5)
      .setDepth(UI_DEPTH.areaTransitionZone + 1);

    // 화살표 위아래 애니메이션
    this.scene.tweens.add({
      targets: arrow,
      y: target.centerY - 6,
      duration: 600,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut"
    });

    const view: TransitionView = { zone, label, arrow, pulsePhase: 0 };

    // 펄스 애니메이션을 위한 타이머
    view.pulseTimer = this.scene.time.addEvent({
      delay: 50,
      callback: () => {
        view.pulsePhase = (view.pulsePhase + 0.1) % (Math.PI * 2);
      },
      loop: true
    });

    this.views.set(target.id, view);
    return view;
  }

  private positionLabel(label: Phaser.GameObjects.Text, target: RuntimeAreaTransitionTarget) {
    const { worldView } = this.scene.cameras.main;
    const desiredX = target.centerX - label.width / 2;
    const minX = worldView.x;
    const maxX = Math.max(minX, worldView.right - label.width);
    const clampedX = Phaser.Math.Clamp(desiredX, minX, maxX);
    label.setPosition(clampedX, target.zoneY + target.zoneHeight + 8);
  }

  private drawZone(
    graphics: Phaser.GameObjects.Graphics,
    target: RuntimeAreaTransitionTarget,
    isActive: boolean,
    pulsePhase: number
  ) {
    graphics.clear();

    const pulseAlpha = 0.15 + Math.sin(pulsePhase) * 0.1;
    const baseColor = isActive ? 0x00aaff : 0x0088cc;
    const borderColor = isActive ? 0x66ddff : 0x44aadd;

    // 외곽 글로우 효과
    const glowSize = isActive ? 6 : 4;
    graphics.fillStyle(baseColor, pulseAlpha * 0.5);
    graphics.fillRoundedRect(
      target.zoneX - glowSize,
      target.zoneY - glowSize,
      target.zoneWidth + glowSize * 2,
      target.zoneHeight + glowSize * 2,
      6
    );

    // 메인 영역
    graphics.fillStyle(baseColor, isActive ? 0.4 : 0.25);
    graphics.fillRoundedRect(target.zoneX, target.zoneY, target.zoneWidth, target.zoneHeight, 4);

    // 테두리
    graphics.lineStyle(isActive ? 3 : 2, borderColor, isActive ? 0.95 : 0.75);
    graphics.strokeRoundedRect(target.zoneX, target.zoneY, target.zoneWidth, target.zoneHeight, 4);

    // 내부 하이라이트 라인 (위쪽)
    graphics.lineStyle(1, 0xffffff, isActive ? 0.4 : 0.2);
    graphics.beginPath();
    graphics.moveTo(target.zoneX + 6, target.zoneY + 3);
    graphics.lineTo(target.zoneX + target.zoneWidth - 6, target.zoneY + 3);
    graphics.strokePath();
  }
}
