import Phaser from "phaser";

type MiniGameData = {
  returnSceneKey?: string;
};

const W = 1280;
const H = 720;

export class MiniGameReflexScene extends Phaser.Scene {
  private returnSceneKey = "main";
  private escKey?: Phaser.Input.Keyboard.Key;
  private target?: Phaser.GameObjects.Ellipse;
  private scoreText?: Phaser.GameObjects.Text;
  private timerText?: Phaser.GameObjects.Text;
  private infoText?: Phaser.GameObjects.Text;
  private timerEvent?: Phaser.Time.TimerEvent;
  private score = 0;
  private remainSec = 25;
  private finished = false;

  constructor() {
    super("MiniGameReflexScene");
  }

  create(data: MiniGameData = {}): void {
    this.returnSceneKey = data.returnSceneKey ?? "main";
    this.cameras.main.setBackgroundColor("#1d2d20");

    this.add.text(W / 2, 92, "미니게임: 순발력 훈련", {
      color: "#f7e5b7",
      fontSize: "40px"
    }).setOrigin(0.5);

    this.add.text(W / 2, 138, "원형 표적을 빠르게 클릭하세요. ESC로 즉시 복귀 가능합니다.", {
      color: "#d5f2e0",
      fontSize: "20px"
    }).setOrigin(0.5);

    this.scoreText = this.add.text(54, 54, "점수: 0 / 10", {
      color: "#ffffff",
      fontSize: "26px"
    });
    this.timerText = this.add.text(W - 190, 54, "남은 시간: 25", {
      color: "#ffffff",
      fontSize: "26px"
    });

    this.infoText = this.add.text(W / 2, 442, "", {
      color: "#ffd88e",
      fontSize: "28px"
    }).setOrigin(0.5);

    this.target = this.add.ellipse(0, 0, 92, 92, 0xe75d5d, 1);
    this.target.setStrokeStyle(4, 0xfff1f1, 1);
    this.target.setInteractive({ useHandCursor: true });
    this.target.on("pointerdown", () => this.hitTarget());
    this.moveTarget();

    this.timerEvent = this.time.addEvent({
      delay: 1000,
      loop: true,
      callback: () => {
        if (this.finished) {
          return;
        }
        this.remainSec -= 1;
        this.timerText?.setText(`남은 시간: ${Math.max(0, this.remainSec)}`);
        if (this.remainSec <= 0) {
          this.finish(false);
        }
      }
    });

    this.escKey = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.timerEvent?.destroy();
      this.target?.removeAllListeners();
    });
  }

  update(): void {
    if (this.escKey && Phaser.Input.Keyboard.JustDown(this.escKey)) {
      this.returnToMain();
    }
  }

  private hitTarget(): void {
    if (this.finished) {
      return;
    }
    this.score += 1;
    this.scoreText?.setText(`점수: ${this.score} / 10`);

    if (this.score >= 10) {
      this.finish(true);
      return;
    }

    this.moveTarget();
  }

  private moveTarget(): void {
    this.target?.setPosition(
      Phaser.Math.Between(120, W - 120),
      Phaser.Math.Between(200, H - 140)
    );
  }

  private finish(success: boolean): void {
    this.finished = true;
    this.timerEvent?.destroy();
    this.infoText?.setText(success ? "성공! ENTER 또는 ESC로 복귀" : "시간 종료! ENTER 또는 ESC로 복귀");
    this.target?.disableInteractive();
    this.input.keyboard?.once("keydown-ENTER", () => this.returnToMain());
  }

  private returnToMain(): void {
    this.scene.stop("MiniGameReflexScene");
    if (this.scene.isPaused(this.returnSceneKey)) {
      this.scene.resume(this.returnSceneKey);
      return;
    }
    this.scene.start(this.returnSceneKey);
  }
}
