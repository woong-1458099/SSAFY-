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
  const subtitle = scene.add.text(bounds.x + 24, bounds.y + 54, "shard 기준 기본 스탯 구조를 이식한 화면입니다.", {
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
  const settingsPanelLeft = bounds.x + 14;
  const settingsPanelRight = bounds.right - 14;
  const controlColumnStartX = settingsPanelLeft + 380;
  const rowStartY = bounds.y + 102;
  const rowGap = 70;
  const rowGuideOffsetY = 26;
  const bottomPanelY = bounds.y + 336;
  const layout = {
    titleX: bounds.x + 24,
    bodyX: bounds.x + 24,
    leftLabelX: settingsPanelLeft + 20,
    settingsPanelCenterX: bounds.centerX,
    settingsPanelCenterY: bounds.y + 186,
    settingsPanelWidth: bounds.width - 28,
    settingsPanelHeight: 214,
    controlMinusX: controlColumnStartX + 20,
    controlValueX: controlColumnStartX + 100,
    controlPlusX: controlColumnStartX + 180,
    controlToggleX: controlColumnStartX + 220,
    bottomPanelCenterX: bounds.centerX,
    bottomPanelY,
    bottomPanelWidth: bounds.width - 28,
    bottomGuideX: bounds.x + 24,
    bottomLogoutGuideX: settingsPanelLeft + 378,
    bottomLogoutButtonX: controlColumnStartX + 220,
    logoutGuideWidth: settingsPanelRight - (settingsPanelLeft + 378) - 150
  } as const;
  const title = scene.add.text(layout.titleX, bounds.y + 18, "설정", {
    fontFamily: FONT_FAMILY,
    fontSize: "24px",
    fontStyle: "bold",
    color: "#edf7ff",
    resolution: 2
  });
  const body = scene.add.text(layout.bodyX, bounds.y + 58, "배경음악, 화면 밝기, 로그아웃을 이 페이지에서 바로 조절할 수 있습니다.", {
    fontFamily: FONT_FAMILY,
    fontSize: "15px",
    color: "#cfe6ff",
    resolution: 2,
    wordWrap: { width: bounds.width - 48 }
  });

const settingsPanel = scene.add.rectangle(
    layout.settingsPanelCenterX,
    layout.settingsPanelCenterY,
    layout.settingsPanelWidth,
    layout.settingsPanelHeight,
    0x14314f,
    0.9
  )
    .setScrollFactor(0);
  settingsPanel.setStrokeStyle(2, 0x4f98df, 1);

  const bgmLabel = scene.add.text(layout.leftLabelX, rowStartY, "배경음악 볼륨", {
    fontFamily: FONT_FAMILY,
    fontSize: "18px",
    fontStyle: "bold",
    color: "#edf7ff",
    resolution: 2
  });
  const bgmGuide = scene.add.text(layout.leftLabelX, rowStartY + rowGuideOffsetY, "메인 필드에서 재생되는 BGM 음량을 조절합니다.", {
    fontFamily: FONT_FAMILY,
    fontSize: "14px",
    color: "#9ac6f3",
    resolution: 2
  });

  const musicLabel = scene.add.text(layout.leftLabelX, rowStartY + rowGap, "음악 재생", {
    fontFamily: FONT_FAMILY,
    fontSize: "18px",
    fontStyle: "bold",
    color: "#edf7ff",
    resolution: 2
  });
  const musicGuide = scene.add.text(layout.leftLabelX, rowStartY + rowGap + rowGuideOffsetY, "배경음악을 즉시 켜거나 꺼서 조용히 플레이할 수 있습니다.", {
    fontFamily: FONT_FAMILY,
    fontSize: "14px",
    color: "#9ac6f3",
    resolution: 2
  });

  const brightnessLabel = scene.add.text(layout.leftLabelX, rowStartY + rowGap * 2, "화면 밝기", {
    fontFamily: FONT_FAMILY,
    fontSize: "18px",
    fontStyle: "bold",
    color: "#edf7ff",
    resolution: 2
  });
  const brightnessGuide = scene.add.text(layout.leftLabelX, rowStartY + rowGap * 2 + rowGuideOffsetY, "필드 화면을 조금 더 밝거나 어둡게 맞춥니다.", {
    fontFamily: FONT_FAMILY,
    fontSize: "14px",
    color: "#9ac6f3",
    resolution: 2
  });

  const bgmValue = scene.add.text(layout.controlValueX, rowStartY + 10, "", {
    fontFamily: FONT_FAMILY,
    fontSize: "24px",
    fontStyle: "bold",
    color: "#ffe27a",
    resolution: 2
  }).setOrigin(0.5, 0.5);

  const musicValue = scene.add.text(layout.controlValueX, rowStartY + rowGap + 10, "", {
    fontFamily: FONT_FAMILY,
    fontSize: "24px",
    fontStyle: "bold",
    color: "#ffe27a",
    resolution: 2
  }).setOrigin(0.5, 0.5);

  const brightnessValue = scene.add.text(layout.controlValueX, rowStartY + rowGap * 2 + 10, "", {
    fontFamily: FONT_FAMILY,
    fontSize: "24px",
    fontStyle: "bold",
    color: "#ffe27a",
    resolution: 2
  }).setOrigin(0.5, 0.5);

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

  const refresh = () => {
    const state = options.getState();
    bgmValue.setText(`${Math.round(state.bgmVolume * 100)}%`);
    musicValue.setText(state.bgmEnabled ? "켜짐" : "꺼짐");
    musicValue.setColor(state.bgmEnabled ? "#8ff5b2" : "#ffb4c2");
    brightnessValue.setText(`${Math.round(state.brightness * 100)}%`);
  };

  const [bgmMinusBg, bgmMinusLabel] = makeMiniButton(layout.controlMinusX, rowStartY + 10, "-", () => {
    options.onAdjustBgmVolume(-0.1);
    refresh();
  });
  const [bgmPlusBg, bgmPlusLabel] = makeMiniButton(layout.controlPlusX, rowStartY + 10, "+", () => {
    options.onAdjustBgmVolume(0.1);
    refresh();
  });
  const [brightnessMinusBg, brightnessMinusLabel] = makeMiniButton(layout.controlMinusX, rowStartY + rowGap * 2 + 10, "-", () => {
    options.onAdjustBrightness(-0.1);
    refresh();
  });
  const [brightnessPlusBg, brightnessPlusLabel] = makeMiniButton(layout.controlPlusX, rowStartY + rowGap * 2 + 10, "+", () => {
    options.onAdjustBrightness(0.1);
    refresh();
  });

  const musicToggleButton = options.createActionButton({
    x: layout.controlToggleX,
    y: rowStartY + rowGap + 10,
    width: 128,
    height: 42,
    text: "켜기/끄기",
    onClick: () => {
      options.onToggleBgm();
      refresh();
    }
  });
  interactiveRoots.push(musicToggleButton);
  const bottomPanel = scene.add.rectangle(layout.bottomPanelCenterX, layout.bottomPanelY, layout.bottomPanelWidth, 70, 0x102842, 0.92)
    .setScrollFactor(0);
  bottomPanel.setStrokeStyle(2, 0x4f98df, 1);

  const keyGuide = scene.add.text(layout.bottomGuideX, bounds.y + 316, "ESC: 메뉴 열기/닫기\nP: 주간 계획표   SPACE: 상호작용", {
    fontFamily: FONT_FAMILY,
    fontSize: "14px",
    color: "#cfe6ff",
    resolution: 2,
    lineSpacing: 6
  });

  const logoutGuide = scene.add.text(layout.bottomLogoutGuideX, bounds.y + 316, "현재 세션을 종료하고 로그인 화면으로 돌아갑니다.", {
    fontFamily: FONT_FAMILY,
    fontSize: "14px",
    color: "#a9d0f4",
    resolution: 2,
    wordWrap: { width: layout.logoutGuideWidth }
  });

  const logoutButton = options.createActionButton({
    x: layout.bottomLogoutButtonX,
    y: layout.bottomPanelY,
    width: 138,
    height: 42,
    text: "로그아웃",
    onClick: options.onLogout
  });
  interactiveRoots.push(logoutButton);

  container.add([
    title,
    body,
    settingsPanel,
    bgmLabel,
    bgmGuide,
    musicLabel,
    musicGuide,
    brightnessLabel,
    brightnessGuide,
    bgmMinusBg,
    bgmMinusLabel,
    bgmValue,
    bgmPlusBg,
    bgmPlusLabel,
    musicValue,
    musicToggleButton,
    brightnessMinusBg,
    brightnessMinusLabel,
    brightnessValue,
    brightnessPlusBg,
    brightnessPlusLabel,
    bottomPanel,
    keyGuide,
    logoutGuide,
    logoutButton
  ]);

  refresh();

  const destroyInteractiveTree = (object: Phaser.GameObjects.GameObject): void => {
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
