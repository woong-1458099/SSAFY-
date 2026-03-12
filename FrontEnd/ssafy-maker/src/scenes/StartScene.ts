import Phaser from "phaser";
import { SceneKey } from "@shared/enums/sceneKey";

export class StartScene extends Phaser.Scene {
  private enterKey?: Phaser.Input.Keyboard.Key;
  private startArmed = false;
  private bgm?: Phaser.Sound.BaseSound;

  constructor() {
    super(SceneKey.Start);
  }

  preload(): void {
    this.load.image("start-bg", "assets/game/backgrounds/title_background.png");
    this.load.image("start-logo", "assets/game/ui/logo.png");
    this.load.image("start-btn-new", "assets/game/ui/new_game.png");
    this.load.image("start-btn-old", "assets/game/ui/old_game.png");
    this.load.audio("start-bgm", "assets/game/audio/BGM/MainTheme.mp3");
    this.load.audio("start-click", "assets/game/audio/SoundEffect/click.wav");
  }

  create(): void {
    const { width, height } = this.scale;

    const bg = this.add.image(width / 2, height / 2, "start-bg");
    bg.setDisplaySize(width, height);

    const logo = this.add.image(width / 2, 190, "start-logo");
    logo.setScale(0.72);

    this.playBackgroundMusic();

    this.createImageButton(width / 2, 430, "start-btn-new", () => this.startIntro());
    this.createImageButton(width / 2, 550, "start-btn-old", () => this.startIntro());

    this.enterKey = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);
    this.input.on("pointerup", this.handlePointerUp, this);
    this.time.delayedCall(180, () => {
      this.startArmed = true;
    });

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.input.off("pointerup", this.handlePointerUp, this);
      this.stopBackgroundMusic();
    });
  }

  update(): void {
    if (this.startArmed && this.enterKey && Phaser.Input.Keyboard.JustDown(this.enterKey)) {
      this.startIntro();
    }
  }

  private handlePointerUp(pointer: Phaser.Input.Pointer): void {
    if (!this.startArmed) {
      return;
    }
    if (pointer.y > this.scale.height - 120) {
      return;
    }
  }

  private createImageButton(x: number, y: number, key: string, onClick: () => void): void {
    const button = this.add.image(x, y, key).setInteractive({ useHandCursor: true });
    const baseWidth = 360;
    const baseHeight = 92;

    button.setDisplaySize(baseWidth, baseHeight);
    button.on("pointerover", () => button.setDisplaySize(baseWidth * 1.04, baseHeight * 1.04));
    button.on("pointerout", () => button.setDisplaySize(baseWidth, baseHeight));
    button.on("pointerdown", () => {
      this.sound.play("start-click");
      button.setDisplaySize(baseWidth * 0.98, baseHeight * 0.98);
      onClick();
    });
    button.on("pointerup", () => button.setDisplaySize(baseWidth * 1.04, baseHeight * 1.04));
  }

  private startIntro(): void {
    if (!this.startArmed) {
      return;
    }

    this.startArmed = false;
    this.input.enabled = false;
    this.cameras.main.fadeOut(280, 0, 0, 0);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
      this.scene.start(SceneKey.Intro);
    });
  }

  private playBackgroundMusic(): void {
    if (!this.cache.audio.exists("start-bgm")) {
      return;
    }

    this.bgm = this.sound.add("start-bgm", { loop: true, volume: 0.45 });
    if (!this.sound.locked) {
      this.bgm.play();
      return;
    }

    this.sound.once(Phaser.Sound.Events.UNLOCKED, () => {
      if (this.bgm && !this.bgm.isPlaying) {
        this.bgm.play();
      }
    });
  }

  private stopBackgroundMusic(): void {
    if (!this.bgm) {
      return;
    }
    this.bgm.stop();
    this.bgm.destroy();
    this.bgm = undefined;
  }
}
