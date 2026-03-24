import Phaser from "phaser";
import type { PlayerStatsState, PlayerStatKey } from "../../../game/state/gameState";

const FONT_FAMILY =
  "\"PFStardustBold\", \"Malgun Gothic\", \"Apple SD Gothic Neo\", \"Noto Sans KR\", sans-serif";

export type StatRowView = {
  valueText: Phaser.GameObjects.Text;
  barFill: Phaser.GameObjects.Rectangle;
  maxFillWidth: number;
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
): Phaser.GameObjects.Container {
  const container = scene.add.container(0, 0).setScrollFactor(0);
  const title = scene.add.text(bounds.x + 24, bounds.y + 18, "설정", {
    fontFamily: FONT_FAMILY,
    fontSize: "24px",
    fontStyle: "bold",
    color: "#edf7ff",
    resolution: 2
  });
  const body = scene.add.text(bounds.x + 24, bounds.y + 64, "ESC: 메뉴 열기/닫기\nP: 주간 계획표 열기/닫기\nSPACE: 상호작용\nHUD에 행동력과 시간 진행 상태를 표시합니다.", {
    fontFamily: FONT_FAMILY,
    fontSize: "16px",
    color: "#cfe6ff",
    resolution: 2,
    lineSpacing: 8
  });

  const logoutGuide = scene.add.text(bounds.x + 24, bounds.y + 194, "현재 세션을 종료하고 로그인 화면으로 돌아갑니다.", {
    fontFamily: FONT_FAMILY,
    fontSize: "15px",
    color: "#a9d0f4",
    resolution: 2
  });

  const logoutButton = options.createActionButton({
    x: bounds.x + 134,
    y: bounds.y + 264,
    width: 220,
    height: 52,
    text: "로그아웃",
    onClick: options.onLogout
  });

  container.add([title, body, logoutGuide, logoutButton]);
  return container;
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
