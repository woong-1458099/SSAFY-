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

function createLayerButton(
  scene: Phaser.Scene,
  params: {
    width: number;
    height: number;
    text: string;
    onClick: () => void;
  }
): Phaser.GameObjects.Container {
  const bg = scene.add.rectangle(0, 0, params.width, params.height, 0x29527d, 1);
  bg.setStrokeStyle(2, 0x8ed2ff, 1);
  const label = scene.add.text(0, -1, params.text, {
    fontFamily: FONT_FAMILY,
    fontSize: params.height >= 48 ? "18px" : "15px",
    fontStyle: "bold",
    color: "#eef7ff",
    resolution: 2,
    align: "center",
    wordWrap: { width: params.width - 18 }
  }).setOrigin(0.5);
  const container = scene.add.container(0, 0, [bg, label]);

  bg.setInteractive({ useHandCursor: true });
  bg.on("pointerdown", params.onClick);
  bg.on("pointerover", () => bg.setFillStyle(0x34679d, 1));
  bg.on("pointerout", () => bg.setFillStyle(0x29527d, 1));

  return container;
}

export function createShopModal(scene: Phaser.Scene, options: {
  items: InventoryItemTemplate[];
  money: number;
  backgroundImage?: Phaser.GameObjects.Image | null;
  createButton: ButtonFactory;
  onBuy: (templateId: string) => void;
  onClose: () => void;
}): Phaser.GameObjects.Container {
  const itemsPerPage = 6;
  const cardWidth = 216;
  const cardHeight = 178;
  const cardGapX = 22;
  const cardGapY = 24;
  const panelWidth = 860;
  const panelHeight = 720;
  const innerWidth = panelWidth - 20;
  const innerHeight = panelHeight - 20;
  const panelTop = -panelHeight / 2;
  const footerHeight = 142;
  const columns = 3;
  const gridWidth = columns * cardWidth + (columns - 1) * cardGapX;
  const gridStartX = -gridWidth / 2 + cardWidth / 2;
  const gridStartY = panelTop + 170 + cardHeight / 2;
  const footerTop = panelHeight / 2 - footerHeight;
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
  const panelRoot = scene.add.container(centerX, centerY);
  const panelOuter = scene.add.rectangle(0, 0, panelWidth, panelHeight, 0x224d7a, 0.98);
  panelOuter.setStrokeStyle(3, 0x8ed2ff, 1);
  const panel = scene.add.rectangle(0, 0, innerWidth, innerHeight, 0x14314f, options.backgroundImage ? 0.9 : 0.98);
  panel.setStrokeStyle(2, 0x5aa8ee, 1);
  const headerLayer = scene.add.container(0, 0);
  const contentLayer = scene.add.container(0, 0);
  const footerLayer = scene.add.container(0, 0);
  const divider = scene.add.rectangle(0, footerTop - 14, innerWidth - 24, 2, 0x41739f, 0.9);
  const title = scene.add.text(0, panelTop + 54, "편의점", {
    fontFamily: FONT_FAMILY,
    fontSize: "30px",
    fontStyle: "bold",
    color: "#eef7ff",
    resolution: 2
  }).setOrigin(0.5);
  const moneyText = scene.add.text(0, panelTop + 92, `보유 금액 ${options.money.toLocaleString("ko-KR")} G`, {
    fontFamily: FONT_FAMILY,
    fontSize: "18px",
    fontStyle: "bold",
    color: "#b6d6fb",
    resolution: 2
  }).setOrigin(0.5);
  const subtitleText = scene.add.text(0, panelTop + 118, "한 번에 6개씩 확인할 수 있습니다", {
    fontFamily: FONT_FAMILY,
    fontSize: "14px",
    color: "#88b8e9",
    resolution: 2
  }).setOrigin(0.5);
  const hintText = scene.add.text(0, footerTop + 112, "LEFT / RIGHT 페이지 이동 | Space / ESC 닫기", {
    fontFamily: FONT_FAMILY,
    fontSize: "14px",
    color: "#9fcdf5",
    resolution: 2
  }).setOrigin(0.5);
  const pageIndicator = scene.add.text(0, footerTop + 18, "", {
    fontFamily: FONT_FAMILY,
    fontSize: "16px",
    fontStyle: "bold",
    color: "#b6d6fb",
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
  const pageRoot = scene.add.container(0, 0);
  const pageCount = Math.max(1, Math.ceil(options.items.length / itemsPerPage));
  let currentPage = 0;
  const prevButton = createLayerButton(scene, {
    width: 108,
    height: 40,
    text: "이전",
    onClick: () => {
      if (currentPage <= 0) {
        return;
      }
      currentPage -= 1;
      renderPage();
    }
  });
  prevButton.setPosition(-154, footerTop + 18);
  const nextButton = createLayerButton(scene, {
    width: 108,
    height: 40,
    text: "다음",
    onClick: () => {
      if (currentPage >= pageCount - 1) {
        return;
      }
      currentPage += 1;
      renderPage();
    }
  });
  nextButton.setPosition(154, footerTop + 18);
  const closeButton = createLayerButton(scene, {
    width: 220,
    height: 50,
    text: "닫기",
    onClick: options.onClose
  });
  closeButton.setPosition(0, footerTop + 64);

  function renderPage(): void {
    tooltipRoot.setVisible(false);
    pageRoot.removeAll(true);

    const pageItems = options.items.slice(currentPage * itemsPerPage, (currentPage + 1) * itemsPerPage);

    pageItems.forEach((item, index) => {
      const col = index % columns;
      const row = Math.floor(index / columns);
      const x = gridStartX + col * (cardWidth + cardGapX);
      const y = gridStartY + row * (cardHeight + cardGapY);
      const cardRoot = scene.add.container(x, y);
      const card = scene.add.rectangle(0, 0, cardWidth, cardHeight, 0x234873, 1);
      card.setStrokeStyle(2, 0x5cb0ff, 1);

      const iconPlate = scene.add.rectangle(0, -46, 74, 74, 0xf5fbff, 1);
      iconPlate.setStrokeStyle(2, item.color, 1);
      const iconImage = scene.add.image(0, -46, "__WHITE");
      const hasIconImage = applyInventoryItemIconImage(scene, iconImage, item, 58, 58);
      iconPlate.setFillStyle(0xf5fbff, hasIconImage ? 0 : 1);
      const iconLabel = scene.add.text(0, -46, item.shortLabel, {
        fontFamily: FONT_FAMILY,
        fontSize: "20px",
        fontStyle: "bold",
        color: "#234873",
        resolution: 2
      }).setOrigin(0.5);
      iconLabel.setVisible(!hasIconImage);

      const typeText = scene.add.text(0, 22, item.kind === "equipment" ? "장비" : "소비", {
        fontFamily: FONT_FAMILY,
        fontSize: "12px",
        color: "#8fc7ff",
        resolution: 2
      }).setOrigin(0.5);
      const nameText = scene.add.text(0, 48, item.name, {
        fontFamily: FONT_FAMILY,
        fontSize: "15px",
        fontStyle: "bold",
        color: "#eef7ff",
        resolution: 2,
        align: "center",
        wordWrap: { width: 184 }
      }).setOrigin(0.5);
      const priceText = scene.add.text(0, 88, `${item.price.toLocaleString("ko-KR")} G`, {
        fontFamily: FONT_FAMILY,
        fontSize: "16px",
        fontStyle: "bold",
        color: "#b6d6fb",
        resolution: 2
      }).setOrigin(0.5);
      const buyButton = scene.add.rectangle(0, 122, 132, 30, 0x2b5a8c, 1);
      buyButton.setStrokeStyle(1, 0x8ed2ff, 1);
      ;
      cardRoot.add([card, iconPlate, iconImage, iconLabel, typeText, nameText, priceText, buyButton]);

      card.setInteractive({ useHandCursor: true });
      card.on("pointerover", (pointer: Phaser.Input.Pointer) => {
        card.setFillStyle(0x2c5a8f, 1);
        buyButton.setFillStyle(0x3771ad, 1);
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
        buyButton.setFillStyle(0x2b5a8c, 1);
        tooltipRoot.setVisible(false);
      });
      card.on("pointerdown", () => options.onBuy(item.templateId));

      pageRoot.add(cardRoot);
    });

    pageIndicator.setText(`${currentPage + 1} / ${pageCount}`);
    prevButton.setVisible(pageCount > 1);
    nextButton.setVisible(pageCount > 1);
    prevButton.setAlpha(currentPage > 0 ? 1 : 0.45);
    nextButton.setAlpha(currentPage < pageCount - 1 ? 1 : 0.45);
  }
  headerLayer.add([title, moneyText, subtitleText]);
  contentLayer.add(pageRoot);
  footerLayer.add([divider, prevButton, pageIndicator, nextButton, closeButton, hintText]);
  panelRoot.add([panelOuter, panel, headerLayer, contentLayer, footerLayer]);

  const objects: Phaser.GameObjects.GameObject[] = [overlay, panelRoot, tooltipRoot];

  if (options.backgroundImage) {
    options.backgroundImage.setAlpha(0.98);
    objects.unshift(options.backgroundImage);
  }

  const root = scene.add.container(0, 0, objects);
  renderPage();

  const keyboard = scene.input.keyboard;
  const escKey = keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
  const spaceKey = keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
  const leftKey = keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.LEFT);
  const rightKey = keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.RIGHT);
  const updateCloseKeys = () => {
    if (escKey && Phaser.Input.Keyboard.JustDown(escKey)) {
      options.onClose();
    }
    if (spaceKey && Phaser.Input.Keyboard.JustDown(spaceKey)) {
      options.onClose();
    }
    if (leftKey && Phaser.Input.Keyboard.JustDown(leftKey) && currentPage > 0) {
      currentPage -= 1;
      renderPage();
    }
    if (rightKey && Phaser.Input.Keyboard.JustDown(rightKey) && currentPage < pageCount - 1) {
      currentPage += 1;
      renderPage();
    }
  };

  scene.events.on("update", updateCloseKeys);
  root.once("destroy", () => {
    scene.events.off("update", updateCloseKeys);
    escKey?.destroy();
    spaceKey?.destroy();
    leftKey?.destroy();
    rightKey?.destroy();
  });

  return root;
}
