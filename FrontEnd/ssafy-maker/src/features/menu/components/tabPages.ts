import Phaser from "phaser";
import type { PlayerStatsState, PlayerStatKey } from "../../../game/state/gameState";

const FONT_FAMILY =
  "\"PFStardustBold\", \"Malgun Gothic\", \"Apple SD Gothic Neo\", \"Noto Sans KR\", sans-serif";

export type StatRowView = {
  valueText: Phaser.GameObjects.Text;
  barFill: Phaser.GameObjects.Rectangle;
  maxFillWidth: number;
};

export type SettingsPageState = {
  bgmVolume: number;
  bgmEnabled: boolean;
  sfxVolume: number;
  sfxEnabled: boolean;
  brightness: number;
};

export type SettingsPageView = {
  container: Phaser.GameObjects.Container;
  refresh: () => void;
  destroy: () => void;
};

export function createStatsPage(
  scene: Phaser.Scene,
  bounds: Phaser.Geom.Rectangle,
  statsState: PlayerStatsState
): {
  container: Phaser.GameObjects.Container;
  statViews: Record<PlayerStatKey, StatRowView>;
} {
  const container = scene.add.container(0, 0).setScrollFactor(0);
  const statViews = {} as Record<PlayerStatKey, StatRowView>;
  const rowDefs: Array<{ key: PlayerStatKey; label: string }> = [
    { key: "fe", label: "FE" },
    { key: "be", label: "BE" },
    { key: "teamwork", label: "협업" },
    { key: "luck", label: "운" },
    { key: "stress", label: "스트레스" }
  ];

  const title = scene.add.text(bounds.x + 24, bounds.y + 18, "현재 스탯", {
    fontFamily: FONT_FAMILY,
    fontSize: "24px",
    fontStyle: "bold",
    color: "#edf7ff",
    resolution: 2
  });
  const subtitle = scene.add.text(bounds.x + 24, bounds.y + 54, "shard 기준 기본 스탯 구조를 확인할 수 있습니다.", {
    fontFamily: FONT_FAMILY,
    fontSize: "14px",
    color: "#9ac6f3",
    resolution: 2
  });
  container.add([title, subtitle]);

  const barWidth = 360;
  rowDefs.forEach((row, index) => {
    const y = bounds.y + 116 + index * 56;
    const label = scene.add.text(bounds.x + 24, y - 14, row.label, {
      fontFamily: FONT_FAMILY,
      fontSize: "19px",
      color: "#d7ecff",
      resolution: 2
    });
    const valueText = scene.add.text(bounds.x + 600, y - 14, `${statsState[row.key]}`, {
      fontFamily: FONT_FAMILY,
      fontSize: "19px",
      fontStyle: "bold",
      color: "#f4fbff",
      resolution: 2
    });

    const barBg = scene.add.rectangle(bounds.x + 392, y + 3, barWidth, 16, 0x264768, 1);
    barBg.setStrokeStyle(1, 0x5aa8ee, 1);
    const barFillWidth = Math.round((barWidth - 4) * Phaser.Math.Clamp(statsState[row.key] / 100, 0, 1));
    const barFill = scene.add.rectangle(bounds.x + 214, y + 3, barFillWidth, 12, 0x66d1c2, 1);
    barFill.setOrigin(0, 0.5);

    container.add([label, valueText, barBg, barFill]);
    statViews[row.key] = {
      valueText,
      barFill,
      maxFillWidth: barWidth - 4
    };
  });

  return { container, statViews };
}

export function refreshStatsPage(statViews: Record<PlayerStatKey, StatRowView>, statsState: PlayerStatsState): void {
  (Object.keys(statViews) as PlayerStatKey[]).forEach((key) => {
    const view = statViews[key];
    const value = Phaser.Math.Clamp(Math.round(statsState[key]), 0, 100);
    view.valueText.setText(`${value}`);
    view.barFill.width = Math.round(view.maxFillWidth * (value / 100));
  });
}

export function createSettingsPage(
  scene: Phaser.Scene,
  bounds: Phaser.Geom.Rectangle,
  options: {
    getState: () => SettingsPageState;
    onAdjustBgmVolume: (delta: number) => void;
    onToggleBgm: () => void;
    onAdjustSfxVolume: (delta: number) => void;
    onToggleSfx: () => void;
    onAdjustBrightness: (delta: number) => void;
    createActionButton: (args: {
      x: number;
      y: number;
      width: number;
      height: number;
      text: string;
      onClick: () => void;
    }) => Phaser.GameObjects.Container;
    onLogout: () => void;
  }
): SettingsPageView {
  const container = scene.add.container(0, 0).setScrollFactor(0);
  const interactiveRoots: Phaser.GameObjects.GameObject[] = [];

  const paddingX = 20;
  const topPadding = 18;
  const bottomPadding = 18;
  const sectionGap = 14;
  const headerHeight = 66;
  const footerHeight = 84;
  const headerTop = bounds.y + topPadding;
  const headerBottom = headerTop + headerHeight;
  const footerTop = bounds.bottom - bottomPadding - footerHeight;
  const footerBottom = footerTop + footerHeight;
  const contentTop = headerBottom + sectionGap;
  const contentHeight = footerTop - contentTop - sectionGap;
  const contentLeft = bounds.x + paddingX;
  const contentWidth = bounds.width - paddingX * 2;
  const contentRight = contentLeft + contentWidth;

  const title = scene.add.text(bounds.x + 24, headerTop, "설정", {
    fontFamily: FONT_FAMILY,
    fontSize: "24px",
    fontStyle: "bold",
    color: "#edf7ff",
    resolution: 2
  });
  const body = scene.add.text(bounds.x + 24, headerTop + 36, "배경음, 효과음, 화면 밝기와 로그아웃을 여기서 바로 조절할 수 있습니다.", {
    fontFamily: FONT_FAMILY,
    fontSize: "15px",
    color: "#cfe6ff",
    resolution: 2,
    wordWrap: { width: bounds.width - 48 }
  });

  const contentPanel = scene.add.rectangle(bounds.centerX, contentTop + contentHeight / 2, contentWidth, contentHeight, 0x14314f, 0.9).setScrollFactor(0);
  contentPanel.setStrokeStyle(2, 0x4f98df, 1);

  const footerPanel = scene.add.rectangle(bounds.centerX, footerTop + footerHeight / 2, contentWidth, footerHeight, 0x102842, 0.92).setScrollFactor(0);
  footerPanel.setStrokeStyle(2, 0x4f98df, 1);

  const contentMaskShape = scene.add.graphics().setScrollFactor(0);
  contentMaskShape.fillStyle(0xffffff, 1);
  contentMaskShape.fillRect(contentLeft, contentTop, contentWidth, contentHeight);
  contentMaskShape.setVisible(false);
  const contentMask = contentMaskShape.createGeometryMask();

  const contentRoot = scene.add.container(0, 0).setScrollFactor(0);
  contentRoot.setMask(contentMask);

  const rows: Array<{
    title: string;
    description: string;
    kind: "slider" | "toggle";
    getValueText: (state: SettingsPageState) => string;
    getValueColor?: (state: SettingsPageState) => string;
    onMinus?: () => void;
    onPlus?: () => void;
    onToggle?: () => void;
  }> = [
    {
      title: "배경음 볼륨",
      description: "월드와 장소에서 재생되는 BGM 볼륨을 조절합니다.",
      kind: "slider",
      getValueText: (state) => `${Math.round(state.bgmVolume * 100)}%`,
      onMinus: () => options.onAdjustBgmVolume(-0.1),
      onPlus: () => options.onAdjustBgmVolume(0.1)
    },
    {
      title: "배경음 재생",
      description: "배경음을 즉시 끄거나 켤 수 있습니다.",
      kind: "toggle",
      getValueText: (state) => (state.bgmEnabled ? "켜짐" : "꺼짐"),
      getValueColor: (state) => (state.bgmEnabled ? "#8ff5b2" : "#ffb4c2"),
      onToggle: () => options.onToggleBgm()
    },
    {
      title: "효과음 볼륨",
      description: "대화, 클릭, 상호작용 효과음 볼륨을 조절합니다.",
      kind: "slider",
      getValueText: (state) => `${Math.round(state.sfxVolume * 100)}%`,
      onMinus: () => options.onAdjustSfxVolume(-0.1),
      onPlus: () => options.onAdjustSfxVolume(0.1)
    },
    {
      title: "효과음 재생",
      description: "효과음을 즉시 끄거나 켤 수 있습니다.",
      kind: "toggle",
      getValueText: (state) => (state.sfxEnabled ? "켜짐" : "꺼짐"),
      getValueColor: (state) => (state.sfxEnabled ? "#8ff5b2" : "#ffb4c2"),
      onToggle: () => options.onToggleSfx()
    },
    {
      title: "화면 밝기",
      description: "인게임 화면을 조금 더 밝거나 어둡게 맞춥니다.",
      kind: "slider",
      getValueText: (state) => `${Math.round(state.brightness * 100)}%`,
      onMinus: () => options.onAdjustBrightness(-0.1),
      onPlus: () => options.onAdjustBrightness(0.1)
    }
  ];

  const rowHeight = 86;
  const rowGap = 14;
  const valueViews: Array<{
    valueText: Phaser.GameObjects.Text;
    getText: (state: SettingsPageState) => string;
    getColor?: (state: SettingsPageState) => string;
  }> = [];

  const makeMiniButton = (
    x: number,
    y: number,
    text: string,
    onClick: () => void,
    width = 52
  ) => {
    const bg = scene.add.rectangle(x, y, width, 40, 0x29527d, 1).setScrollFactor(0);
    bg.setStrokeStyle(2, 0x8ed2ff, 1);
    const label = scene.add.text(x, y - 1, text, {
      fontFamily: FONT_FAMILY,
      fontSize: "22px",
      fontStyle: "bold",
      color: "#eef7ff",
      resolution: 2
    }).setOrigin(0.5);

    bg.setInteractive({ useHandCursor: true });
    bg.on("pointerdown", onClick);
    bg.on("pointerover", () => bg.setFillStyle(0x34679d, 1));
    bg.on("pointerout", () => bg.setFillStyle(0x29527d, 1));
    interactiveRoots.push(bg);
    return [bg, label] as const;
  };

  rows.forEach((row, index) => {
    const rowTop = contentTop + 14 + index * (rowHeight + rowGap);
    const rowCenterY = rowTop + rowHeight / 2;
    const rowBg = scene.add.rectangle(bounds.centerX, rowCenterY, contentWidth - 18, rowHeight, 0x102842, 0.84).setScrollFactor(0);
    rowBg.setStrokeStyle(1, 0x3f78a7, 1);

    const titleText = scene.add.text(contentLeft + 18, rowTop + 12, row.title, {
      fontFamily: FONT_FAMILY,
      fontSize: "18px",
      fontStyle: "bold",
      color: "#edf7ff",
      resolution: 2
    });
    const descText = scene.add.text(contentLeft + 18, rowTop + 40, row.description, {
      fontFamily: FONT_FAMILY,
      fontSize: "14px",
      color: "#9ac6f3",
      resolution: 2,
      wordWrap: { width: 470 }
    });

    const valueText = scene.add.text(contentRight - 230, rowTop + 28, "", {
      fontFamily: FONT_FAMILY,
      fontSize: "24px",
      fontStyle: "bold",
      color: "#ffe27a",
      resolution: 2
    }).setOrigin(0.5, 0.5);

    valueViews.push({
      valueText,
      getText: row.getValueText,
      getColor: row.getValueColor
    });

    contentRoot.add([rowBg, titleText, descText, valueText]);

    if (row.kind === "slider" && row.onMinus && row.onPlus) {
      const [minusBg, minusLabel] = makeMiniButton(contentRight - 120, rowTop + 28, "-", () => {
        row.onMinus?.();
        refresh();
      });
      const [plusBg, plusLabel] = makeMiniButton(contentRight - 52, rowTop + 28, "+", () => {
        row.onPlus?.();
        refresh();
      });
      contentRoot.add([minusBg, minusLabel, plusBg, plusLabel]);
    }

    if (row.kind === "toggle" && row.onToggle) {
      const toggleButton = options.createActionButton({
        x: contentRight - 86,
        y: rowTop + 28,
        width: 128,
        height: 42,
        text: "켜기/끄기",
        onClick: () => {
          row.onToggle?.();
          refresh();
        }
      });
      interactiveRoots.push(toggleButton);
      contentRoot.add(toggleButton);
    }
  });

  const totalContentHeight = 14 + rows.length * rowHeight + Math.max(0, rows.length - 1) * rowGap + 14;
  let scrollOffset = 0;
  const maxScroll = Math.max(0, totalContentHeight - contentHeight);

  const applyScroll = () => {
    contentRoot.y = -scrollOffset;
  };

  const refresh = () => {
    const state = options.getState();
    valueViews.forEach((view) => {
      view.valueText.setText(view.getText(state));
      view.valueText.setColor(view.getColor?.(state) ?? "#ffe27a");
    });
  };

  const wheelHandler = (
    pointer: Phaser.Input.Pointer,
    _gameObjects: Phaser.GameObjects.GameObject[],
    _deltaX: number,
    deltaY: number
  ) => {
    if (!Phaser.Geom.Rectangle.Contains(new Phaser.Geom.Rectangle(contentLeft, contentTop, contentWidth, contentHeight), pointer.x, pointer.y)) {
      return;
    }
    if (maxScroll <= 0) {
      return;
    }

    scrollOffset = Phaser.Math.Clamp(scrollOffset + deltaY * 0.35, 0, maxScroll);
    applyScroll();
  };

  scene.input.on("wheel", wheelHandler);

  const shortcutText = scene.add.text(bounds.x + 24, footerBottom - 14, "ESC: 메뉴 열기/닫기\nP: 주간 계획표  SPACE: 상호작용", {
    fontFamily: FONT_FAMILY,
    fontSize: "14px",
    color: "#cfe6ff",
    resolution: 2,
    lineSpacing: 6
  }).setOrigin(0, 1);

  const logoutButton = options.createActionButton({
    x: bounds.right - 92,
    y: footerBottom - 24,
    width: 138,
    height: 42,
    text: "로그아웃",
    onClick: options.onLogout
  });
  interactiveRoots.push(logoutButton);

  container.add([
    title,
    body,
    contentPanel,
    contentRoot,
    footerPanel,
    shortcutText,
    logoutButton
  ]);

  refresh();
  applyScroll();

  const destroyInteractiveTree = (object: Phaser.GameObjects.GameObject): void => {
    // 객체의 scene이 유효한지 확인 (이미 파괴된 객체는 건너뜀)
    if (!object || !object.scene?.sys) {
      return;
    }

    if ("removeAllListeners" in object && typeof object.removeAllListeners === "function") {
      object.removeAllListeners();
    }

    if ("disableInteractive" in object && typeof object.disableInteractive === "function") {
      object.disableInteractive();
    }

    if (object instanceof Phaser.GameObjects.Container) {
      object.list.forEach((child) => {
        destroyInteractiveTree(child as Phaser.GameObjects.GameObject);
      });
    }
  };

  const destroy = () => {
    scene.input.off("wheel", wheelHandler);
    contentRoot.clearMask(true);
    contentMaskShape.destroy();
    interactiveRoots.forEach((root) => destroyInteractiveTree(root));
  };

  return { container, refresh, destroy };
}

export function createPlaceholderPage(
  scene: Phaser.Scene,
  bounds: Phaser.Geom.Rectangle,
  titleText: string,
  description: string
): Phaser.GameObjects.Container {
  const container = scene.add.container(0, 0).setScrollFactor(0);
  const title = scene.add.text(bounds.x + 24, bounds.y + 18, titleText, {
    fontFamily: FONT_FAMILY,
    fontSize: "24px",
    fontStyle: "bold",
    color: "#edf7ff",
    resolution: 2
  });
  const body = scene.add.text(bounds.x + 24, bounds.y + 76, description, {
    fontFamily: FONT_FAMILY,
    fontSize: "16px",
    color: "#a9d0f4",
    resolution: 2,
    wordWrap: { width: bounds.width - 48 }
  });
  container.add([title, body]);
  return container;
}
