import Phaser from "phaser";
import { UI_PANEL_INNER_BORDER_COLOR, UI_PANEL_OUTER_BORDER_COLOR } from "@features/ui/components/uiPrimitives";

export type BaseModal = {
  root: Phaser.GameObjects.Container;
  setVisible: (visible: boolean) => void;
};

export function createBaseModal(scene: Phaser.Scene, width: number, height: number): BaseModal {
  const centerX = Math.round(scene.scale.width / 2);
  const centerY = Math.round(scene.scale.height / 2);

  const overlay = scene.add.rectangle(centerX, centerY, scene.scale.width, scene.scale.height, 0x000000, 0.45);
  const outerFrame = scene.add.rectangle(centerX, centerY, width + 8, height + 8, 0x000000, 0);
  outerFrame.setStrokeStyle(3, UI_PANEL_OUTER_BORDER_COLOR, 1);
  const panel = scene.add.rectangle(centerX, centerY, width, height, 0x1a3558, 1);
  panel.setStrokeStyle(2, UI_PANEL_INNER_BORDER_COLOR, 1);
  const root = scene.add.container(0, 0, [overlay, outerFrame, panel]);

  return {
    root,
    setVisible: (visible: boolean) => root.setVisible(visible)
  };
}
