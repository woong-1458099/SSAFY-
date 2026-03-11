import Phaser from "phaser";
import { SceneKey } from "@shared/enums/sceneKey";
import { GAME_CONSTANTS } from "@core/constants/gameConstants";

export class TitleScene extends Phaser.Scene {
  private enterKey?: Phaser.Input.Keyboard.Key;

  constructor() {
    super(SceneKey.Title);
  }

  create(): void {
    this.cameras.main.setBackgroundColor("#2b2723");

    this.add.text(330, 230, "SSAFY Trainee Raising", {
      color: "#f8e2b7",
      fontSize: "54px"
    });

    this.add.text(420, 340, "Press ENTER or Click to Start", {
      color: "#ffffff",
      fontSize: "26px"
    });

    this.enterKey = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);
    this.input.once("pointerdown", () => this.startMain());
  }

  update(): void {
    if (this.enterKey && Phaser.Input.Keyboard.JustDown(this.enterKey)) {
      this.startMain();
    }
  }

  private startMain(): void {
    this.scene.start(SceneKey.Main);
  }
}

