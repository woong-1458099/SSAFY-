import Phaser from "phaser";

export type SlotView = {
  bg: Phaser.GameObjects.Rectangle;
  icon: Phaser.GameObjects.Rectangle;
  iconImage: Phaser.GameObjects.Image;
  iconText: Phaser.GameObjects.Text;
  stackText: Phaser.GameObjects.Text;
};

type TextStyleFactory = (
  size: number,
  color?: string,
  fontStyle?: "normal" | "bold"
) => Phaser.Types.GameObjects.Text.TextStyle;

export function createInventoryPage<EquipmentSlotKey extends string>(scene: Phaser.Scene, options: {
  bounds: Phaser.Geom.Rectangle;
  px: (value: number) => number;
  getBodyStyle: TextStyleFactory;
  createPanelOuterBorder: (
    centerX: number,
    centerY: number,
    width: number,
    height: number
  ) => Phaser.GameObjects.Rectangle;
  panelInnerBorderColor: number;
  equipmentDefs: Array<{ key: EquipmentSlotKey; label: string }>;
  onEquipHover: (slot: EquipmentSlotKey, view: SlotView) => void;
  onEquipOut: (slot: EquipmentSlotKey, view: SlotView) => void;
  onEquipDown: (slot: EquipmentSlotKey, view: SlotView) => void;
  onInventoryHover: (index: number, view: SlotView) => void;
  onInventoryOut: (index: number, view: SlotView) => void;
  onInventoryDown: (index: number, view: SlotView) => void;
}): {
  container: Phaser.GameObjects.Container;
  inventorySlotViews: SlotView[];
  equipmentSlotViews: Record<EquipmentSlotKey, SlotView>;
} {
  const {
    bounds,
    px,
    getBodyStyle,
    createPanelOuterBorder,
    panelInnerBorderColor,
    equipmentDefs,
    onEquipHover,
    onEquipOut,
    onEquipDown,
    onInventoryHover,
    onInventoryOut,
    onInventoryDown
  } = options;

  const container = scene.add.container(0, 0).setScrollFactor(0);
  const panelY = px(bounds.y + 28);
  const panelH = 270;

  const equipPanelX = px(bounds.x + 24);
  const equipPanelW = 300;
  const equipPanelCenterX = px(equipPanelX + equipPanelW / 2);

  const inventoryPanelX = px(equipPanelX + equipPanelW + 16);
  const inventoryPanelW = px(bounds.width - (inventoryPanelX - bounds.x) - 24);
  const inventoryPanelCenterX = px(inventoryPanelX + inventoryPanelW / 2);

  const equipPanelOuter = createPanelOuterBorder(equipPanelCenterX, panelY + panelH / 2, equipPanelW, panelH);
  const equipPanel = scene.add.rectangle(equipPanelCenterX, panelY + panelH / 2, equipPanelW, panelH, 0x17355a, 0.86);
  equipPanel.setStrokeStyle(2, panelInnerBorderColor, 1);
  const inventoryPanelOuter = createPanelOuterBorder(inventoryPanelCenterX, panelY + panelH / 2, inventoryPanelW, panelH);
  const inventoryPanel = scene.add.rectangle(inventoryPanelCenterX, panelY + panelH / 2, inventoryPanelW, panelH, 0x17355a, 0.86);
  inventoryPanel.setStrokeStyle(2, panelInnerBorderColor, 1);

  const equipLabel = scene.add.text(equipPanelCenterX, px(panelY + 10), "장비 칸", getBodyStyle(18, "#b9d8fb"));
  equipLabel.setOrigin(0.5, 0);
  const inventoryLabel = scene.add.text(inventoryPanelCenterX, px(panelY + 10), "인벤토리", getBodyStyle(18, "#b9d8fb"));
  inventoryLabel.setOrigin(0.5, 0);

  const createSlotView = (x: number, y: number, size: number): SlotView => {
    const bg = scene.add.rectangle(x, y, size, size, 0x2e527d, 1);
    bg.setStrokeStyle(2, 0x5aa8ee, 1);

    const icon = scene.add.rectangle(x, y, px(size - 14), px(size - 14), 0xffffff, 1);
    icon.setStrokeStyle(1, 0x4f98df, 1);
    icon.setVisible(false);

    const iconImage = scene.add.image(x, y, "__WHITE");
    iconImage.setVisible(false);

    const iconText = scene.add.text(x, y + 1, "", getBodyStyle(Math.max(12, Math.floor(size * 0.28)), "#e8f4ff", "bold"));
    iconText.setOrigin(0.5);
    iconText.setVisible(false);

    const stackText = scene.add.text(x + size / 2 - 4, y + size / 2 - 3, "", getBodyStyle(13, "#e8f4ff", "bold"));
    stackText.setOrigin(1, 1);
    stackText.setVisible(false);

    return { bg, icon, iconImage, iconText, stackText };
  };

  const equipSlotSize = 96;
  const equipSlotY = px(panelY + 154);
  const equipSlotGap = 156;
  const equipCenters = [px(equipPanelCenterX - equipSlotGap / 2), px(equipPanelCenterX + equipSlotGap / 2)];

  const equipmentSlotViews = {} as Record<EquipmentSlotKey, SlotView>;
  const equipmentObjects: Phaser.GameObjects.GameObject[] = [];

  equipmentDefs.forEach((def, index) => {
    const slotX = equipCenters[index] ?? equipPanelCenterX;
    const view = createSlotView(slotX, equipSlotY, equipSlotSize);
    const label = scene.add.text(slotX, px(equipSlotY + equipSlotSize / 2 + 14), def.label, getBodyStyle(17, "#b9d8fb"));
    label.setOrigin(0.5, 0.5);

    view.bg.setInteractive({ useHandCursor: true });
    view.bg.on("pointerover", () => onEquipHover(def.key, view));
    view.bg.on("pointerout", () => onEquipOut(def.key, view));
    view.bg.on("pointerdown", () => onEquipDown(def.key, view));

    equipmentSlotViews[def.key] = view;
    equipmentObjects.push(view.bg, view.icon, view.iconImage, view.iconText, view.stackText, label);
  });

  const inventorySlotSize = 52;
  const inventorySlotGap = 10;
  const gridTotalW = inventorySlotSize * 4 + inventorySlotGap * 3;
  const gridTotalH = inventorySlotSize * 4 + inventorySlotGap * 3;
  const gridStartX = px(inventoryPanelCenterX - gridTotalW / 2 + inventorySlotSize / 2);
  const gridStartY = px(panelY + 48 + (panelH - 72 - gridTotalH) / 2 + inventorySlotSize / 2);
  const inventorySlotViews: SlotView[] = [];
  const inventoryObjects: Phaser.GameObjects.Container[] = [];

  for (let row = 0; row < 4; row += 1) {
    for (let col = 0; col < 4; col += 1) {
      const x = px(gridStartX + col * (inventorySlotSize + inventorySlotGap));
      const y = px(gridStartY + row * (inventorySlotSize + inventorySlotGap));
      const slotIndex = row * 4 + col;
      const view = createSlotView(x, y, inventorySlotSize);
      inventorySlotViews.push(view);

      view.bg.setInteractive({ useHandCursor: true });
      view.bg.on("pointerover", () => onInventoryHover(slotIndex, view));
      view.bg.on("pointerout", () => onInventoryOut(slotIndex, view));
      view.bg.on("pointerdown", () => onInventoryDown(slotIndex, view));

      inventoryObjects.push(scene.add.container(0, 0, [view.bg, view.icon, view.iconImage, view.iconText, view.stackText]));
    }
  }

  container.add([
    equipPanelOuter,
    equipPanel,
    inventoryPanelOuter,
    inventoryPanel,
    equipLabel,
    inventoryLabel,
    ...equipmentObjects,
    ...inventoryObjects
  ]);

  return {
    container,
    inventorySlotViews,
    equipmentSlotViews
  };
}
