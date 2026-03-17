import Phaser from "phaser";

export type StatView = {
  valueText: Phaser.GameObjects.Text;
  barFill: Phaser.GameObjects.Rectangle;
  maxFillWidth: number;
};

type TextStyleFactory = (
  size: number,
  color?: string,
  fontStyle?: "normal" | "bold"
) => Phaser.Types.GameObjects.Text.TextStyle;
type VolumeKey = "bgm" | "sfx" | "ambience";

export function createSettingsPage(scene: Phaser.Scene, options: {
  bounds: Phaser.Geom.Rectangle;
  px: (value: number) => number;
  getBodyStyle: TextStyleFactory;
  getVolumes: () => Record<VolumeKey, number>;
  setVolume: (key: VolumeKey, value: number) => void;
}): Phaser.GameObjects.Container {
  const { bounds, px, getBodyStyle, getVolumes, setVolume } = options;
  const container = scene.add.container(0, 0);

  const controlGuideTitle = scene.add.text(px(bounds.x + 24), px(bounds.y + 18), "조작 안내", getBodyStyle(28, "#4b351f", "bold"));
  const body = scene.add.text(
    px(bounds.x + 24),
    px(bounds.y + 58),
    "ESC: 메뉴 열기/닫기\nWASD/방향키: 이동\nE: NPC 대화\nQ: 전체 지도",
    getBodyStyle(23)
  );
  body.setLineSpacing(10);

  const sectionTitle = scene.add.text(px(bounds.x + 24), px(bounds.y + 206), "사운드 볼륨", getBodyStyle(28, "#4b351f", "bold"));
  const volume = getVolumes();
  const volumeState: Record<VolumeKey, number> = {
    bgm: Math.round(volume.bgm * 100),
    sfx: Math.round(volume.sfx * 100),
    ambience: Math.round(volume.ambience * 100)
  };

  const rows: Phaser.GameObjects.GameObject[] = [];
  const rowDefs: Array<{ key: VolumeKey; label: string }> = [
    { key: "bgm", label: "BGM" },
    { key: "sfx", label: "SFX" },
    { key: "ambience", label: "환경음" }
  ];

  rowDefs.forEach((row, idx) => {
    const y = px(bounds.y + 266 + idx * 62);
    const rowLabel = scene.add.text(px(bounds.x + 28), y - 12, row.label, getBodyStyle(21, "#4a371f", "bold"));
    const valueText = scene.add.text(px(bounds.x + 538), y - 12, `${volumeState[row.key]}%`, getBodyStyle(20, "#4a371f", "bold"));

    const trackLeft = px(bounds.x + 142);
    const trackWidth = 372;
    const trackBg = scene.add.rectangle(trackLeft, y + 1, trackWidth, 14, 0xd8c6a3, 1);
    trackBg.setOrigin(0, 0.5);
    trackBg.setStrokeStyle(1, 0x8f6c3c, 1);

    const fill = scene.add.rectangle(trackLeft + 2, y + 1, 0, 10, 0x9fbe7a, 1);
    fill.setOrigin(0, 0.5);

    const knob = scene.add.rectangle(trackLeft, y + 1, 14, 20, 0xc8ae82, 1);
    knob.setStrokeStyle(2, 0x725127, 1);
    knob.setInteractive({ draggable: true, useHandCursor: true });
    scene.input.setDraggable(knob);

    const applyFromValue = (next: number): void => {
      const clamped = Phaser.Math.Clamp(next, 0, 100);
      volumeState[row.key] = clamped;
      setVolume(row.key, clamped / 100);
      const ratio = volumeState[row.key] / 100;
      fill.width = px((trackWidth - 4) * ratio);
      knob.x = px(trackLeft + ratio * trackWidth);
      valueText.setText(`${volumeState[row.key]}%`);
    };

    const applyFromPointerX = (pointerX: number): void => {
      const clampedX = Phaser.Math.Clamp(pointerX, trackLeft, trackLeft + trackWidth);
      const ratio = (clampedX - trackLeft) / trackWidth;
      applyFromValue(Math.round(ratio * 100));
    };

    trackBg.setInteractive({ useHandCursor: true }).on("pointerdown", (pointer: Phaser.Input.Pointer) => {
      applyFromPointerX(pointer.worldX);
    });

    knob.on("drag", (_pointer: Phaser.Input.Pointer, dragX: number) => {
      applyFromPointerX(dragX);
    });

    applyFromValue(volumeState[row.key]);
    rows.push(rowLabel, trackBg, fill, knob, valueText);
  });

  container.add([controlGuideTitle, body, sectionTitle, ...rows]);
  return container;
}

export function createStatsPage<StatKey extends string>(scene: Phaser.Scene, options: {
  bounds: Phaser.Geom.Rectangle;
  px: (value: number) => number;
  getBodyStyle: TextStyleFactory;
  statRows: Array<{ key: StatKey; label: string }>;
  statsState: Record<StatKey, number>;
}): {
  container: Phaser.GameObjects.Container;
  statViews: Partial<Record<StatKey, StatView>>;
} {
  const { bounds, px, getBodyStyle, statRows, statsState } = options;
  const container = scene.add.container(0, 0);

  const rowStartY = px(bounds.y + 38);
  const rowGap = 52;
  const barCenterX = px(bounds.x + 390);
  const barW = 360;
  const statViews: Partial<Record<StatKey, StatView>> = {};

  statRows.forEach((stat, i) => {
    const y = px(rowStartY + i * rowGap);
    const label = scene.add.text(px(bounds.x + 24), y - 14, stat.label, getBodyStyle(22));
    const value = scene.add.text(px(bounds.x + 600), y - 14, `${statsState[stat.key]}`, getBodyStyle(22));

    const barBg = scene.add.rectangle(barCenterX, y + 2, barW, 16, 0x2c507a, 1);
    barBg.setStrokeStyle(1, 0x4f98df, 1);

    const barFillWidth = px((barW - 4) * Phaser.Math.Clamp(statsState[stat.key] / 100, 0, 1));
    const barFill = scene.add.rectangle(px(barCenterX - barW / 2 + 2), y + 2, barFillWidth, 12, 0x66d1c2, 1);
    barFill.setOrigin(0, 0.5);

    container.add([label, value, barBg, barFill]);
    statViews[stat.key] = {
      valueText: value,
      barFill,
      maxFillWidth: barW - 4
    };
  });

  return { container, statViews };
}
