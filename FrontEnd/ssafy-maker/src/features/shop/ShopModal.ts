import Phaser from "phaser";
import type { InventoryItemTemplate } from "../inventory/InventoryService";

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

export function createShopModal(scene: Phaser.Scene, options: {
  items: InventoryItemTemplate[];
  money: number;
  createButton: ButtonFactory;
  onBuy: (templateId: string) => void;
  onClose: () => void;
}): Phaser.GameObjects.Container {
  const centerX = Math.round(scene.scale.width / 2);
  const centerY = Math.round(scene.scale.height / 2);
  const overlay = scene.add.rectangle(centerX, centerY, scene.scale.width, scene.scale.height, 0x04101d, 0.58);
  const panel = scene.add.rectangle(centerX, centerY, 860, 620, 0x14314f, 0.98);
  panel.setStrokeStyle(3, 0x8ed2ff, 1);
  const title = scene.add.text(centerX, centerY - 270, "편의점", {
    fontFamily: FONT_FAMILY,
    fontSize: "34px",
    fontStyle: "bold",
    color: "#eef7ff",
    resolution: 2
  }).setOrigin(0.5);
  const moneyText = scene.add.text(centerX, centerY - 232, `보유 금액 ${money.toLocaleString("ko-KR")} G`, {
    fontFamily: FONT_FAMILY,
    fontSize: "18px",
    color: "#9fcdf5",
    resolution: 2
  }).setOrigin(0.5);

  const objects: Phaser.GameObjects.GameObject[] = [overlay, panel, title, moneyText];

  options.items.forEach((item, index) => {
    const y = centerY - 162 + index * 74;
    const rowBg = scene.add.rectangle(centerX, y, 760, 62, 0x1c4168, 0.92);
    rowBg.setStrokeStyle(2, 0x5aa8ee, 1);
    const nameText = scene.add.text(centerX - 352, y - 9, item.name, {
      fontFamily: FONT_FAMILY,
      fontSize: "20px",
      fontStyle: "bold",
      color: "#eef7ff",
      resolution: 2
    }).setOrigin(0, 0.5);
    const descText = scene.add.text(centerX - 352, y + 13, item.effect, {
      fontFamily: FONT_FAMILY,
      fontSize: "14px",
      color: "#b8d8f7",
      resolution: 2
    }).setOrigin(0, 0.5);
    const priceText = scene.add.text(centerX + 156, y, `${item.price.toLocaleString("ko-KR")} G`, {
      fontFamily: FONT_FAMILY,
      fontSize: "18px",
      fontStyle: "bold",
      color: "#ffe7aa",
      resolution: 2
    }).setOrigin(0.5);
    const buyButton = options.createButton({
      x: centerX + 292,
      y,
      width: 120,
      height: 42,
      text: "구매",
      onClick: () => options.onBuy(item.templateId)
    });
    objects.push(rowBg, nameText, descText, priceText, buyButton);
  });

  objects.push(
    options.createButton({
      x: centerX,
      y: centerY + 270,
      width: 220,
      height: 52,
      text: "닫기",
      onClick: options.onClose
    })
  );

  return scene.add.container(0, 0, objects);
}
