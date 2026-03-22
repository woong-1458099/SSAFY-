import Phaser from "phaser";
import type { InventoryItemTemplate } from "../inventory/InventoryService";
import { applyInventoryItemIconImage } from "../inventory/inventoryAssets";

const FONT_FAMILY =
  "\"PFStardustBold\", \"Malgun Gothic\", \"Apple SD Gothic Neo\", \"Noto Sans KR\", sans-serif";

type ButtonFactory = (params: {
  x: number;
  y: number;
  width: number;
  height: number;
  text: string;
  onClick: () => void;
}) => Phaser.GameObjects.Container;

function setTooltipContent(
  tooltipBg: Phaser.GameObjects.Rectangle,
  tooltipText: Phaser.GameObjects.Text,
  item: InventoryItemTemplate
): void {
  const kindText = item.kind === "equipment" ? "장비" : "소비";
  tooltipText.setText(
    `이름: ${item.name}\n종류: ${kindText}\n효과: ${item.effect}\n판매 금액: ${item.sellPrice.toLocaleString("ko-KR")} G`
  );
  tooltipBg.width = Math.max(240, Math.ceil(tooltipText.width + 22));
  tooltipBg.height = Math.max(94, Math.ceil(tooltipText.height + 18));
}

function positionTooltip(
  scene: Phaser.Scene,
  tooltipRoot: Phaser.GameObjects.Container,
  tooltipBg: Phaser.GameObjects.Rectangle,
  pointerX: number,
  pointerY: number
): void {
  const margin = 14;
  const maxX = scene.scale.width - tooltipBg.width - margin;
  const maxY = scene.scale.height - tooltipBg.height - margin;
  tooltipRoot.setPosition(
    Phaser.Math.Clamp(pointerX + margin, margin, maxX),
    Phaser.Math.Clamp(pointerY + margin, margin, maxY)
  );
}

export function createShopModal(scene: Phaser.Scene, options: {
  items: InventoryItemTemplate[];
  money: number;
  backgroundImage?: Phaser.GameObjects.Image | null;
  createButton: ButtonFactory;
  onBuy: (templateId: string) => void;
  onClose: () => void;
}): Phaser.GameObjects.Container {
  const centerX = Math.round(scene.scale.width / 2);
  const centerY = Math.round(scene.scale.height / 2);
  const overlay = scene.add.rectangle(
    centerX,
    centerY,
    scene.scale.width,
    scene.scale.height,
    0x04101d,
    options.backgroundImage ? 0.18 : 0.45
  );
  const panelOuter = scene.add.rectangle(centerX, centerY, 830, 680, 0x224d7a, 0.98);
  panelOuter.setStrokeStyle(3, 0x8ed2ff, 1);
  const panel = scene.add.rectangle(centerX, centerY, 810, 660, 0x14314f, options.backgroundImage ? 0.9 : 0.98);
  panel.setStrokeStyle(2, 0x5aa8ee, 1);
  const title = scene.add.text(centerX, centerY - 284, "편의점", {
    fontFamily: FONT_FAMILY,
    fontSize: "30px",
    fontStyle: "bold",
    color: "#eef7ff",
    resolution: 2
  }).setOrigin(0.5);
  const moneyText = scene.add.text(centerX, centerY - 248, `보유 금액 ${options.money.toLocaleString("ko-KR")} G`, {
    fontFamily: FONT_FAMILY,
    fontSize: "18px",
    fontStyle: "bold",
    color: "#b6d6fb",
    resolution: 2
  }).setOrigin(0.5);
  const hintText = scene.add.text(centerX, centerY + 308, "Space / ESC로 닫기", {
    fontFamily: FONT_FAMILY,
    fontSize: "15px",
    color: "#9fcdf5",
    resolution: 2
  }).setOrigin(0.5);

  const tooltipBg = scene.add.rectangle(0, 0, 240, 94, 0x153253, 0.96).setOrigin(0, 0);
  tooltipBg.setStrokeStyle(2, 0x5aa8ee, 1);
  const tooltipText = scene.add.text(10, 8, "", {
    fontFamily: FONT_FAMILY,
    fontSize: "15px",
    color: "#e6f3ff",
    resolution: 2
  });
  const tooltipRoot = scene.add.container(0, 0, [tooltipBg, tooltipText]).setVisible(false);

  const objects: Phaser.GameObjects.GameObject[] = [overlay, panelOuter, panel, title, moneyText, hintText];

  options.items.forEach((item, index) => {
    const col = index % 3;
    const row = Math.floor(index / 3);
    const x = centerX - 248 + col * 248;
    const y = centerY - 160 + row * 160;
    const card = scene.add.rectangle(x, y, 220, 164, 0x234873, 1);
    card.setStrokeStyle(2, 0x5cb0ff, 1);

    const iconPlate = scene.add.rectangle(x, y - 36, 74, 74, 0xf5fbff, 1);
    iconPlate.setStrokeStyle(2, item.color, 1);
    const iconImage = scene.add.image(x, y - 36, "__WHITE");
    const hasIconImage = applyInventoryItemIconImage(scene, iconImage, item, 62, 62);
    iconPlate.setFillStyle(0xf5fbff, hasIconImage ? 0 : 1);
    const iconLabel = scene.add.text(x, y - 35, item.shortLabel, {
      fontFamily: FONT_FAMILY,
      fontSize: "22px",
      fontStyle: "bold",
      color: "#234873",
      resolution: 2
    }).setOrigin(0.5);
    iconLabel.setVisible(!hasIconImage);

    const nameText = scene.add.text(x, y + 18, item.name, {
      fontFamily: FONT_FAMILY,
      fontSize: "16px",
      fontStyle: "bold",
      color: "#eef7ff",
      resolution: 2,
      align: "center",
      wordWrap: { width: 190 }
    }).setOrigin(0.5);
    const priceText = scene.add.text(x, y + 50, `${item.price.toLocaleString("ko-KR")} G`, {
      fontFamily: FONT_FAMILY,
      fontSize: "17px",
      fontStyle: "bold",
      color: "#b6d6fb",
      resolution: 2
    }).setOrigin(0.5);
    const buyHint = scene.add.text(x, y + 72, "클릭 구매", {
      fontFamily: FONT_FAMILY,
      fontSize: "14px",
      color: "#a1c5ef",
      resolution: 2
    }).setOrigin(0.5);

    card.setInteractive({ useHandCursor: true });
    card.on("pointerover", (pointer: Phaser.Input.Pointer) => {
      card.setFillStyle(0x2c5a8f, 1);
      setTooltipContent(tooltipBg, tooltipText, item);
      positionTooltip(scene, tooltipRoot, tooltipBg, pointer.x, pointer.y);
      tooltipRoot.setVisible(true);
    });
    card.on("pointermove", (pointer: Phaser.Input.Pointer) => {
      if (!tooltipRoot.visible) {
        return;
      }
      positionTooltip(scene, tooltipRoot, tooltipBg, pointer.x, pointer.y);
    });
    card.on("pointerout", () => {
      card.setFillStyle(0x234873, 1);
      tooltipRoot.setVisible(false);
    });
    card.on("pointerdown", () => options.onBuy(item.templateId));

    objects.push(card, iconPlate, iconImage, iconLabel, nameText, priceText, buyHint);
  });

  const closeButton = options.createButton({
    x: centerX,
    y: centerY + 272,
    width: 220,
    height: 50,
    text: "닫기",
    onClick: options.onClose
  });

  objects.push(closeButton, tooltipRoot);

  if (options.backgroundImage) {
    options.backgroundImage.setAlpha(0.98);
    objects.unshift(options.backgroundImage);
  }

  const root = scene.add.container(0, 0, objects);

  const keyboard = scene.input.keyboard;
  const escKey = keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
  const spaceKey = keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
  const updateCloseKeys = () => {
    if (escKey && Phaser.Input.Keyboard.JustDown(escKey)) {
      options.onClose();
    }
    if (spaceKey && Phaser.Input.Keyboard.JustDown(spaceKey)) {
      options.onClose();
    }
  };

  scene.events.on("update", updateCloseKeys);
  root.once("destroy", () => {
    tooltipRoot.destroy(true);
    scene.events.off("update", updateCloseKeys);
    escKey?.destroy();
    spaceKey?.destroy();
  });

  return root;
}
