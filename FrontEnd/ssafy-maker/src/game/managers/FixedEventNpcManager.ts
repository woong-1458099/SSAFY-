import Phaser from "phaser";
import type { AreaId } from "../../common/enums/area";
import {
  FIXED_EVENT_NPC_LABEL_COLOR,
  FIXED_EVENT_SCHEDULED_NPC_SLOT_COUNT,
  type FixedEventNpcPresentation
} from "../../features/story/fixedEventNpcPresence";
import { UI_DEPTH } from "../systems/uiDepth";

type ScheduledNpcView = {
  sprite: Phaser.GameObjects.Sprite;
  label: Phaser.GameObjects.Text;
};

export class FixedEventNpcManager {
  private readonly scene: Phaser.Scene;
  private readonly views: ScheduledNpcView[];

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.views = Array.from({ length: FIXED_EVENT_SCHEDULED_NPC_SLOT_COUNT }, () => {
      const sprite = this.scene.add
        .sprite(0, 0, "")
        .setOrigin(0.5, 1)
        .setScrollFactor(0)
        .setDepth(UI_DEPTH.fixedEventNpcSprite)
        .setVisible(false);
      const label = this.scene.add
        .text(0, 0, "", {
          color: FIXED_EVENT_NPC_LABEL_COLOR,
          fontSize: "14px"
        })
        .setOrigin(0.5, 0)
        .setScrollFactor(0)
        .setDepth(UI_DEPTH.fixedEventNpcLabel)
        .setVisible(false);

      label.setStyle({
        backgroundColor: "rgba(36, 36, 36, 0.85)",
        padding: { left: 6, right: 6, top: 2, bottom: 2 }
      });

      return { sprite, label };
    });
  }

  destroy(): void {
    this.views.forEach((view) => {
      view.sprite.destroy();
      view.label.destroy();
    });
  }

  render(options: {
    presentation: FixedEventNpcPresentation | null;
    areaId: AreaId;
    visible: boolean;
  }): void {
    const shouldShow = options.visible && options.presentation?.renderArea === options.areaId;

    this.views.forEach((view, index) => {
      const participant = shouldShow ? options.presentation?.participants[index] : undefined;
      if (!participant) {
        view.sprite.setVisible(false);
        view.label.setVisible(false);
        return;
      }

      view.sprite
        .setTexture(participant.textureKey)
        .setPosition(participant.slot.x, participant.slot.y)
        .setScale(2.1)
        .setTint(participant.slot.flashColor)
        .setVisible(true);
      view.label
        .setText(participant.label)
        .setPosition(participant.slot.x + participant.slot.labelOffsetX, participant.slot.y + participant.slot.labelOffsetY)
        .setVisible(true);
    });
  }
}
