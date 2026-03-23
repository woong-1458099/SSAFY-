import Phaser from "phaser";
import type { SaveSlotId } from "../SaveService";

export type SaveSlotView = {
  slotId: SaveSlotId;
  bg: Phaser.GameObjects.Rectangle;
  title: Phaser.GameObjects.Text;
  meta: Phaser.GameObjects.Text;
};

type TextStyleFactory = (
  size: number,
  color: string,
  fontStyle?: "normal" | "bold"
) => Phaser.Types.GameObjects.Text.TextStyle;

export function createSavePage(scene: Phaser.Scene, options: {
  bounds: Phaser.Geom.Rectangle;
  autoSlotId: SaveSlotId;
  manualSlotIds: SaveSlotId[];
  selectedSlotId: SaveSlotId;
  manualSlotPage: number;
  manualSlotPageSize: number;
  px: (value: number) => number;
  getBodyStyle: TextStyleFactory;
  createActionButton: (params: {
    x: number;
    y: number;
    width: number;
    height: number;
    text: string;
    onClick: () => void;
  }) => Phaser.GameObjects.Container;
  onSelectSlot: (slotId: SaveSlotId) => void;
  onCreateNewSlot: () => void;
  onPrevPage: () => void;
  onNextPage: () => void;
  onSaveSelected: () => void;
  onLoadSelected: () => void;
  onDeleteSelected: () => void;
}): {
  container: Phaser.GameObjects.Container;
  saveSlotViews: SaveSlotView[];
} {
  const {
    bounds,
    autoSlotId,
    manualSlotIds,
    selectedSlotId,
    manualSlotPage,
    manualSlotPageSize,
    px,
    getBodyStyle,
    createActionButton,
    onSelectSlot,
    onCreateNewSlot,
    onPrevPage,
    onNextPage,
    onSaveSelected,
    onLoadSelected,
    onDeleteSelected
  } = options;

  const container = scene.add.container(0, 0).setScrollFactor(0);
  const centerX = px(bounds.x + bounds.width / 2);
  const saveSlotViews: SaveSlotView[] = [];

  const title = scene.add.text(centerX, px(bounds.y + 26), "세이브 / 불러오기", getBodyStyle(24, "#d7ecff", "bold"));
  title.setOrigin(0.5, 0.5);
  const subtitle = scene.add.text(
    centerX,
    px(bounds.y + 52),
    "오토 세이브와 수동 저장 슬롯을 분리해서 관리합니다.",
    getBodyStyle(14, "#95bde7")
  );
  subtitle.setOrigin(0.5, 0.5);

  const actionY = px(bounds.y + 92);
  const newSlotBtn = createActionButton({
    x: px(centerX - 255),
    y: actionY,
    width: 150,
    height: 42,
    text: "신규 저장",
    onClick: onCreateNewSlot
  });
  const saveBtn = createActionButton({
    x: px(centerX - 85),
    y: actionY,
    width: 150,
    height: 42,
    text: "저장",
    onClick: onSaveSelected
  });
  const loadBtn = createActionButton({
    x: px(centerX + 85),
    y: actionY,
    width: 150,
    height: 42,
    text: "불러오기",
    onClick: onLoadSelected
  });
  const deleteBtn = createActionButton({
    x: px(centerX + 255),
    y: actionY,
    width: 150,
    height: 42,
    text: "삭제",
    onClick: onDeleteSelected
  });

  const sectionWidth = bounds.width - 48;
  const autoCenterY = px(bounds.y + 158);
  const sectionOuter = scene.add.rectangle(centerX, autoCenterY, sectionWidth + 6, 66, 0x05111f, 0.85);
  sectionOuter.setStrokeStyle(1, 0x7dc9ff, 1);
  const autoBg = scene.add.rectangle(centerX, autoCenterY, sectionWidth, 58, 0x1f3f64, 1);
  autoBg.setStrokeStyle(2, 0x4f98df, 1);
  autoBg.setInteractive({ useHandCursor: true });
  autoBg.on("pointerdown", () => onSelectSlot(autoSlotId));

  const autoTitle = scene.add.text(
    px(centerX - sectionWidth / 2 + 18),
    px(autoCenterY - 18),
    "",
    getBodyStyle(17, "#e8f4ff", "bold")
  );
  autoTitle.setOrigin(0, 0);
  const autoMeta = scene.add.text(
    px(centerX - sectionWidth / 2 + 18),
    px(autoCenterY + 4),
    "",
    getBodyStyle(13, "#9ec7f1")
  );
  autoMeta.setOrigin(0, 0);
  saveSlotViews.push({ slotId: autoSlotId, bg: autoBg, title: autoTitle, meta: autoMeta });

  const manualTitle = scene.add.text(px(bounds.x + 24), px(bounds.y + 206), "수동 저장 슬롯", getBodyStyle(18, "#e8f4ff", "bold"));
  manualTitle.setOrigin(0, 0);
  const pageText = scene.add.text(px(bounds.right - 24), px(bounds.y + 208), "", getBodyStyle(13, "#9ec7f1"));
  pageText.setOrigin(1, 0);

  const visibleManualSlots = manualSlotIds.slice(
    manualSlotPage * manualSlotPageSize,
    manualSlotPage * manualSlotPageSize + manualSlotPageSize
  );
  const totalPages = Math.max(1, Math.ceil(Math.max(manualSlotIds.length, 1) / manualSlotPageSize));
  pageText.setText(`${manualSlotPage + 1} / ${totalPages}`);

  const prevBtn = createActionButton({
    x: px(bounds.right - 156),
    y: px(bounds.y + 280),
    width: 72,
    height: 38,
    text: "이전",
    onClick: onPrevPage
  });
  const nextBtn = createActionButton({
    x: px(bounds.right - 68),
    y: px(bounds.y + 280),
    width: 72,
    height: 38,
    text: "다음",
    onClick: onNextPage
  });

  const slotWidth = px((bounds.width - 72) / 2);
  const slotHeight = 68;
  const gridStartX = px(bounds.x + 24 + slotWidth / 2);
  const gridStartY = px(bounds.y + 278);
  const colGap = 24;
  const rowGap = 16;

  visibleManualSlots.forEach((slotId, index) => {
    const col = index % 2;
    const row = Math.floor(index / 2);
    const x = px(gridStartX + col * (slotWidth + colGap));
    const y = px(gridStartY + row * (slotHeight + rowGap));
    const bg = scene.add.rectangle(x, y, slotWidth, slotHeight, 0x1f3f64, 1);
    bg.setStrokeStyle(2, 0x4f98df, 1);
    bg.setInteractive({ useHandCursor: true });
    bg.on("pointerdown", () => onSelectSlot(slotId));

    const titleText = scene.add.text(
      px(x - slotWidth / 2 + 16),
      px(y - 22),
      "",
      getBodyStyle(16, "#e8f4ff", "bold")
    );
    titleText.setOrigin(0, 0);
    const metaText = scene.add.text(
      px(x - slotWidth / 2 + 16),
      px(y + 2),
      "",
      getBodyStyle(12, "#9ec7f1")
    );
    metaText.setOrigin(0, 0);

    saveSlotViews.push({ slotId, bg, title: titleText, meta: metaText });
    container.add([bg, titleText, metaText]);
  });

  container.add([
    title,
    subtitle,
    newSlotBtn,
    saveBtn,
    loadBtn,
    deleteBtn,
    sectionOuter,
    autoBg,
    autoTitle,
    autoMeta,
    manualTitle,
    pageText,
    prevBtn,
    nextBtn
  ]);

  return {
    container,
    saveSlotViews
  };
}
