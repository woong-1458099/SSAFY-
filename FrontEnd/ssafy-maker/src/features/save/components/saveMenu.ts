import Phaser from "phaser";

export type SaveSlotView = {
  slotId: string;
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
  slotIds: string[];
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
  onSelectSlot: (slotId: string) => void;
  onSave: () => void;
  onLoad: () => void;
}): {
  container: Phaser.GameObjects.Container;
  pinnedObjects: Phaser.GameObjects.GameObject[];
  saveSlotViews: SaveSlotView[];
} {
  const { bounds, slotIds, px, getBodyStyle, createActionButton, onSelectSlot, onSave, onLoad } = options;
  const container = scene.add.container(0, 0).setScrollFactor(0);
  const centerX = px(bounds.x + bounds.width / 2);

  const title = scene.add.text(centerX, px(bounds.y + 34), "세이브 / 불러오기", getBodyStyle(28, "#d7ecff", "bold"));
  title.setOrigin(0.5, 0.5);
  const subtitle = scene.add.text(
    centerX,
    px(bounds.y + 64),
    "auto 슬롯은 자동 저장 예약 슬롯으로 사용합니다.",
    getBodyStyle(16, "#95bde7")
  );
  subtitle.setOrigin(0.5, 0.5);

  const actionY = px(bounds.y + 106);
  const slotStartY = px(bounds.y + 172);
  const slotGap = 58;
  const slotWidth = px(bounds.width - 120);
  const slotHeight = 48;
  const saveSlotViews: SaveSlotView[] = [];

  slotIds.forEach((slotId, index) => {
    const y = px(slotStartY + index * slotGap);
    const bg = scene.add.rectangle(centerX, y, slotWidth, slotHeight, 0x1f3f64, 1);
    bg.setStrokeStyle(2, 0x4f98df, 1);

    const titleText = scene.add.text(px(centerX - slotWidth / 2 + 18), px(y - 10), "", getBodyStyle(18, "#e8f4ff", "bold"));
    titleText.setOrigin(0, 0);
    const metaText = scene.add.text(px(centerX - slotWidth / 2 + 18), px(y + 8), "", getBodyStyle(14, "#9ec7f1"));
    metaText.setOrigin(0, 0);

    bg.setInteractive({ useHandCursor: true });
    bg.on("pointerdown", () => {
      onSelectSlot(slotId);
    });

    saveSlotViews.push({
      slotId,
      bg,
      title: titleText,
      meta: metaText
    });

    container.add([bg, titleText, metaText]);
  });

  const saveBtn = createActionButton({
    x: px(centerX - 130),
    y: actionY,
    width: 200,
    height: 48,
    text: "저장하기",
    onClick: onSave
  });

  const loadBtn = createActionButton({
    x: px(centerX + 130),
    y: actionY,
    width: 200,
    height: 48,
    text: "불러오기",
    onClick: onLoad
  });

  container.add([title, subtitle, saveBtn, loadBtn]);
  return {
    container,
    pinnedObjects: [title, subtitle, saveBtn, loadBtn],
    saveSlotViews
  };
}
