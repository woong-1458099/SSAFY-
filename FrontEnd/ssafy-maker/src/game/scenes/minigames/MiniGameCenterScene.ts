import Phaser from "phaser";
import { LEGACY_MINIGAME_MENU_SCENE_KEY } from "../../../features/minigame/minigameSceneKeys";

type CenterSceneData = {
  returnSceneKey?: string;
};

const W = 1280;
const H = 720;

export class MiniGameCenterScene extends Phaser.Scene {
  private escKey?: Phaser.Input.Keyboard.Key;
  private returnSceneKey = "main";

  constructor() {
    super("MiniGameCenterScene");
  }

  create(data: CenterSceneData = {}): void {
    this.returnSceneKey = data.returnSceneKey ?? "main";

    this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.58);

    const panel = this.add.rectangle(W / 2, H / 2, 700, 460, 0x16324b, 0.98);
    panel.setStrokeStyle(3, 0xd6ba86, 1);

    this.add.text(W / 2, 178, "미니게임 센터", {
      color: "#f8e4ba",
      fontSize: "42px"
    }).setOrigin(0.5);

    this.add.text(W / 2, 228, "원하는 훈련을 선택하세요.", {
      color: "#dbefff",
      fontSize: "22px"
    }).setOrigin(0.5);

    this.createActionButton(430, 302, "타이핑 훈련", () => this.openMiniGame("MiniGameTypingScene"));
    this.createActionButton(730, 302, "순발력 훈련", () => this.openMiniGame("MiniGameReflexScene"));
    this.createActionButton(580, 380, "레거시 메뉴", () => this.openMiniGame(LEGACY_MINIGAME_MENU_SCENE_KEY));
    this.createActionButton(580, 458, "돌아가기", () => this.closeCenter());

    this.escKey = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
  }

  update(): void {
    if (this.escKey && Phaser.Input.Keyboard.JustDown(this.escKey)) {
      this.closeCenter();
    }
  }

  private createActionButton(x: number, y: number, label: string, onClick: () => void): void {
    const bg = this.add.rectangle(x, y, 220, 54, 0x2e5a7d, 1);
    bg.setStrokeStyle(2, 0xc3a678, 1);
    bg.setInteractive({ useHandCursor: true });
    bg.on("pointerover", () => bg.setFillStyle(0x3a709a, 1));
    bg.on("pointerout", () => bg.setFillStyle(0x2e5a7d, 1));
    bg.on("pointerdown", onClick);

    this.add.text(x, y, label, {
      color: "#ffffff",
      fontSize: "22px"
    }).setOrigin(0.5);
  }

  private openMiniGame(sceneKey: string): void {
    this.scene.stop("MiniGameCenterScene");
    this.scene.launch(sceneKey, { returnSceneKey: this.returnSceneKey });
  }

  private closeCenter(): void {
    this.scene.stop("MiniGameCenterScene");
    if (this.scene.isPaused(this.returnSceneKey)) {
      this.scene.resume(this.returnSceneKey);
      return;
    }
    this.scene.start(this.returnSceneKey);
  }
}
