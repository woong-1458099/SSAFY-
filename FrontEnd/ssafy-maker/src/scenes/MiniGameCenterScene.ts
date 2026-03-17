import Phaser from "phaser";
import { SceneKey } from "@shared/enums/sceneKey";
import { GAME_CONSTANTS } from "@core/constants/gameConstants";

type CenterSceneData = {
  returnSceneKey?: SceneKey;
};

export class MiniGameCenterScene extends Phaser.Scene {
  private escKey?: Phaser.Input.Keyboard.Key;
  private returnSceneKey: SceneKey = SceneKey.Main;

  constructor() {
    super(SceneKey.MiniGameCenter);
  }

  create(data: CenterSceneData = {}): void {
    this.returnSceneKey = data.returnSceneKey ?? SceneKey.Main;

    this.add.rectangle(
      this.px(GAME_CONSTANTS.WIDTH / 2),
      this.px(GAME_CONSTANTS.HEIGHT / 2),
      GAME_CONSTANTS.WIDTH,
      GAME_CONSTANTS.HEIGHT,
      0x000000,
      0.58
    );

    const panel = this.add.rectangle(this.px(GAME_CONSTANTS.WIDTH / 2), this.px(GAME_CONSTANTS.HEIGHT / 2), 700, 460, 0x16324b, 0.98);
    panel.setStrokeStyle(3, 0xd6ba86, 1);

    this.add.text(this.px(GAME_CONSTANTS.WIDTH / 2), 178, "미니게임 센터", {
      color: "#f8e4ba",
      fontSize: "42px"
    }).setOrigin(0.5);

    this.add.text(this.px(GAME_CONSTANTS.WIDTH / 2), 228, "원하는 훈련을 선택하세요.", {
      color: "#dbefff",
      fontSize: "22px"
    }).setOrigin(0.5);

    this.createActionButton(430, 302, "??댄븨 ?덈젴", () => this.openMiniGame(SceneKey.MiniGameTyping));
    this.createActionButton(730, 302, "?쒕컻???덈젴", () => this.openMiniGame(SceneKey.MiniGameReflex));
    this.createActionButton(580, 380, "돌아가기", () => this.closeCenter());

    this.escKey = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
  }

  update(): void {
    if (this.escKey && Phaser.Input.Keyboard.JustDown(this.escKey)) {
      this.closeCenter();
    }
  }

  private createActionButton(x: number, y: number, label: string, onClick: () => void): void {
    const bg = this.add.rectangle(this.px(x), this.px(y), 220, 54, 0x2e5a7d, 1);
    bg.setStrokeStyle(2, 0xc3a678, 1);
    bg.setInteractive({ useHandCursor: true });
    bg.on("pointerover", () => bg.setFillStyle(0x3a709a, 1));
    bg.on("pointerout", () => bg.setFillStyle(0x2e5a7d, 1));
    bg.on("pointerdown", onClick);

    this.add.text(this.px(x), this.px(y), label, {
      color: "#ffffff",
      fontSize: "22px"
    }).setOrigin(0.5);
  }

  private openMiniGame(sceneKey: SceneKey.MiniGameTyping | SceneKey.MiniGameReflex): void {
    this.scene.stop(SceneKey.MiniGameCenter);
    this.scene.launch(sceneKey, { returnSceneKey: this.returnSceneKey });
  }

  private closeCenter(): void {
    this.scene.stop(SceneKey.MiniGameCenter);
    if (this.scene.isPaused(this.returnSceneKey)) {
      this.scene.resume(this.returnSceneKey);
    }
  }

  private px(value: number): number {
    return Math.round(value);
  }
}

