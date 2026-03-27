import Phaser from "phaser";
import { ASSET_KEYS } from "../../common/assets/assetKeys";
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
  bubble: Phaser.GameObjects.Sprite;
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

      const bubble = this.scene.add
        .sprite(0, 0, ASSET_KEYS.ui.emotion, 3)
        .setOrigin(0.5, 1)
        .setScrollFactor(0)
        .setDepth(UI_DEPTH.fixedEventNpcLabel + 1)
        .setScale(1.5)
        .setVisible(false);

      return { sprite, label, bubble };
    });
  }

  destroy(): void {
    this.views.forEach((view) => {
      view.sprite.destroy();
      view.label.destroy();
      view.bubble.destroy();
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
        view.bubble.setVisible(false);
        if (this.scene.tweens.getTweensOf(view.bubble).length > 0) {
          this.scene.tweens.killTweensOf(view.bubble);
        }
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

      const isRomance = options.presentation?.isRomance === true;
      if (isRomance) {
        const spriteTopY = participant.slot.y - view.sprite.height * 2.1;
        view.bubble
          .setPosition(participant.slot.x, spriteTopY - 10)
          .setVisible(true);
        
        // 하트 둥실둥실 애니메이션
        if (this.scene.tweens.getTweensOf(view.bubble).length === 0) {
          this.scene.tweens.add({
            targets: view.bubble,
            y: spriteTopY - 20,
            duration: 800,
            yoyo: true,
            repeat: -1,
            ease: "Sine.easeInOut"
          });
        }
      } else {
        view.bubble.setVisible(false);
        if (this.scene.tweens.getTweensOf(view.bubble).length > 0) {
          this.scene.tweens.killTweensOf(view.bubble);
        }
      }
    });
  }
}
