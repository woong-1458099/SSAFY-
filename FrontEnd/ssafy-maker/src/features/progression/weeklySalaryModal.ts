import Phaser from "phaser";

const FONT_FAMILY =
  "\"PFStardustBold\", \"Malgun Gothic\", \"Apple SD Gothic Neo\", \"Noto Sans KR\", sans-serif";

export function createWeeklySalaryModal(
  scene: Phaser.Scene,
  options: {
    week: number;
    amount: number;
    onConfirm: () => void;
  }
): Phaser.GameObjects.Container {
  const { week, amount, onConfirm } = options;
  const centerX = Math.round(scene.scale.width / 2);
  const centerY = Math.round(scene.scale.height / 2);
  const root = scene.add.container(0, 0).setDepth(2000).setScrollFactor(0);

  const overlay = scene.add
    .rectangle(centerX, centerY, scene.scale.width, scene.scale.height, 0x04101d, 0.62)
    .setScrollFactor(0);
  const panel = scene.add
    .rectangle(centerX, centerY, 540, 280, 0x14314f, 0.98)
    .setScrollFactor(0);
  panel.setStrokeStyle(3, 0x8ed2ff, 1);

  const title = scene.add.text(centerX, centerY - 72, "주급 입금", {
    fontFamily: FONT_FAMILY,
    fontSize: "34px",
    fontStyle: "bold",
    color: "#eef7ff",
    resolution: 2
  }).setOrigin(0.5).setScrollFactor(0);

  const body = scene.add.text(
    centerX,
    centerY - 4,
    `${week}주차 주급 ${amount.toLocaleString("ko-KR")} G가 들어왔습니다.`,
    {
      fontFamily: FONT_FAMILY,
      fontSize: "22px",
      fontStyle: "bold",
      color: "#d9ebff",
      resolution: 2,
      align: "center"
    }
  ).setOrigin(0.5).setScrollFactor(0);

  const buttonBg = scene.add
    .rectangle(centerX, centerY + 78, 190, 54, 0x29527d, 1)
    .setScrollFactor(0);
  buttonBg.setStrokeStyle(2, 0x8ed2ff, 1);
  buttonBg.setInteractive({ useHandCursor: true });
  buttonBg.on("pointerdown", onConfirm);
  buttonBg.on("pointerover", () => buttonBg.setFillStyle(0x34679d, 1));
  buttonBg.on("pointerout", () => buttonBg.setFillStyle(0x29527d, 1));

  const buttonText = scene.add.text(centerX, centerY + 77, "확인", {
    fontFamily: FONT_FAMILY,
    fontSize: "21px",
    fontStyle: "bold",
    color: "#eef7ff",
    resolution: 2
  }).setOrigin(0.5).setScrollFactor(0);

  root.add([overlay, panel, title, body, buttonBg, buttonText]);
  return root;
}
