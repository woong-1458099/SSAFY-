import Phaser from "phaser";
import { SceneKey } from "@shared/enums/sceneKey";
import { GAME_CONSTANTS } from "@core/constants/gameConstants";
import {
  buildPlayerVisual,
  getAvatarDataFromRegistry,
  type PlayerVisualParts,
} from "@features/avatar/playerAvatar";

type MiniGameData = {
  returnSceneKey?: SceneKey;
};

const WORD_POOL = ["typescript", "phaser", "algorithm", "debug", "function", "promise", "refactor", "frontend", "backend"];

export class MiniGameTypingScene extends Phaser.Scene {
  private returnSceneKey: SceneKey = SceneKey.Main;
  private escKey?: Phaser.Input.Keyboard.Key;
  private promptText?: Phaser.GameObjects.Text;
  private inputText?: Phaser.GameObjects.Text;
  private scoreText?: Phaser.GameObjects.Text;
  private timerText?: Phaser.GameObjects.Text;
  private finishText?: Phaser.GameObjects.Text;
  private timerEvent?: Phaser.Time.TimerEvent;
  private playerVisual?: PlayerVisualParts;
  private currentWord = "";
  private typed = "";
  private score = 0;
  private remainSec = 30;
  private finished = false;

  constructor() {
    super(SceneKey.MiniGameTyping);
  }

  create(data: MiniGameData = {}): void {
    this.returnSceneKey = data.returnSceneKey ?? SceneKey.Main;
    this.cameras.main.setBackgroundColor("#14253a");

    this.add.text(this.px(GAME_CONSTANTS.WIDTH / 2), 92, "미니게임: 타이핑 훈련", {
      color: "#f4e1b7",
      fontSize: "40px"
    }).setOrigin(0.5);

    this.add.text(this.px(GAME_CONSTANTS.WIDTH / 2), 138, "단어를 정확히 입력하세요. ESC로 즉시 복귀 가능합니다.", {
      color: "#d3ebff",
      fontSize: "20px"
    }).setOrigin(0.5);

    this.promptText = this.add.text(this.px(GAME_CONSTANTS.WIDTH / 2), 252, "", {
      color: "#ffffff",
      fontSize: "52px"
    }).setOrigin(0.5);

    this.inputText = this.add.text(this.px(GAME_CONSTANTS.WIDTH / 2), 336, "", {
      color: "#9df1b9",
      fontSize: "38px"
    }).setOrigin(0.5);

    this.scoreText = this.add.text(54, 54, "점수: 0 / 6", {
      color: "#ffffff",
      fontSize: "26px"
    });

    this.timerText = this.add.text(this.px(GAME_CONSTANTS.WIDTH - 190), 54, "남은 시간: 30", {
      color: "#ffffff",
      fontSize: "26px"
    });

    this.finishText = this.add.text(this.px(GAME_CONSTANTS.WIDTH / 2), 430, "", {
      color: "#ffd88e",
      fontSize: "28px"
    }).setOrigin(0.5);

    this.nextWord();
    this.refreshTypingUi();

    this.timerEvent = this.time.addEvent({
      delay: 1000,
      loop: true,
      callback: () => {
        if (this.finished) return;
        this.remainSec -= 1;
        this.timerText?.setText(`남은 시간: ${Math.max(0, this.remainSec)}`);
        if (this.remainSec <= 0) {
          this.finish(false);
        }
      }
    });

    this.input.keyboard?.on("keydown", this.handleKeyDown);
    this.escKey = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);

    // 플레이어 캐릭터 표시
    const avatarData = getAvatarDataFromRegistry(this.registry);
    const charX = GAME_CONSTANTS.WIDTH - 68;
    const charY = GAME_CONSTANTS.HEIGHT - 32;
    this.playerVisual = buildPlayerVisual(this, charX, charY, avatarData);
    this.playerVisual.root.setDepth(100);

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.input.keyboard?.off("keydown", this.handleKeyDown);
      this.timerEvent?.destroy();
      this.playerVisual?.root.destroy(true);
    });
  }

  update(): void {
    if (this.escKey && Phaser.Input.Keyboard.JustDown(this.escKey)) {
      this.returnToMain();
    }
  }

  private handleKeyDown = (event: KeyboardEvent): void => {
    if (this.finished) return;

    if (event.key === "Backspace") {
      this.typed = this.typed.slice(0, -1);
      this.refreshTypingUi();
      return;
    }

    if (event.key === "Enter" || event.key === " ") {
      this.commitWord();
      return;
    }

    if (event.key.length === 1 && /^[a-zA-Z]$/.test(event.key)) {
      this.typed += event.key.toLowerCase();
      this.refreshTypingUi();
    }
  };

  private commitWord(): void {
    if (this.typed.length === 0) return;

    if (this.typed === this.currentWord) {
      this.score += 1;
      if (this.score >= 6) {
        this.finish(true);
        return;
      }
      this.nextWord();
    }

    this.typed = "";
    this.refreshTypingUi();
  }

  private nextWord(): void {
    this.currentWord = Phaser.Utils.Array.GetRandom(WORD_POOL);
    this.promptText?.setText(this.currentWord);
  }

  private refreshTypingUi(): void {
    this.inputText?.setText(this.typed || "_");
    this.scoreText?.setText(`점수: ${this.score} / 6`);
  }

  private finish(success: boolean): void {
    this.finished = true;
    this.timerEvent?.destroy();
    this.finishText?.setText(success ? "성공! ENTER 또는 ESC로 복귀" : "시간 종료! ENTER 또는 ESC로 복귀");

    this.input.keyboard?.once("keydown-ENTER", () => this.returnToMain());
  }

  private returnToMain(): void {
    this.scene.stop(SceneKey.MiniGameTyping);
    if (this.scene.isPaused(this.returnSceneKey)) {
      this.scene.resume(this.returnSceneKey);
      return;
    }
    this.scene.start(this.returnSceneKey);
  }

  private px(value: number): number {
    return Math.round(value);
  }
}

