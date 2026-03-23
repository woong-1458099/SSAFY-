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
};

// 전이 포인트는 버튼 스프라이트 대신 그래픽 오버레이로 표시한다.
export class AreaTransitionOverlay {
  private views = new Map<AreaTransitionId, TransitionView>();

  constructor(private scene: Phaser.Scene) {}

  render(targets: RuntimeAreaTransitionTarget[], activeId?: AreaTransitionId) {
    const visibleIds = new Set(targets.map((target) => target.id));

    for (const [id, view] of this.views.entries()) {
      if (visibleIds.has(id)) {
        continue;
      }

      view.zone.destroy();
      view.label.destroy();
      this.views.delete(id);
    }

    targets.forEach((target) => {
      const view = this.views.get(target.id) ?? this.createView(target);
      this.drawZone(view.zone, target, target.id === activeId);
      view.label.setPosition(target.centerX, target.zoneY + target.zoneHeight + 6);
      view.label.setText(target.label);
      view.zone.setVisible(true);
      view.label.setVisible(true);
    });
  }

  destroy() {
    for (const view of this.views.values()) {
      view.zone.destroy();
      view.label.destroy();
    }

    this.views.clear();
  }

  private createView(target: RuntimeAreaTransitionTarget) {
    const zone = this.scene.add.graphics().setDepth(UI_DEPTH.areaTransitionZone);
    const label = this.scene.add
      .text(target.centerX, target.zoneY + target.zoneHeight + 6, target.label, {
        fontSize: "12px",
        color: "#ffffff",
        backgroundColor: "#000000"
      })
      .setOrigin(0.5, 0)
      .setDepth(UI_DEPTH.areaTransitionLabel);

    const view = { zone, label };
    this.views.set(target.id, view);
    return view;
  }

  private drawZone(
    graphics: Phaser.GameObjects.Graphics,
    target: RuntimeAreaTransitionTarget,
    isActive: boolean
  ) {
    graphics.clear();
    graphics.fillStyle(isActive ? 0xbfbfbf : 0x8c8c8c, isActive ? 0.45 : 0.28);
    graphics.lineStyle(2, isActive ? 0xffffff : 0xbfbfbf, isActive ? 0.95 : 0.7);
    graphics.fillRect(target.zoneX, target.zoneY, target.zoneWidth, target.zoneHeight);
    graphics.strokeRect(target.zoneX, target.zoneY, target.zoneWidth, target.zoneHeight);
  }
}
