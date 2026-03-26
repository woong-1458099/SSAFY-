import Phaser from "phaser";
import type { EndingFlowPayload } from "@features/progression/types/ending";
import { SceneKey } from "@shared/enums/sceneKey";
import {
  COMPLETION_ASSET_KEYS,
  COMPLETION_FONT_FAMILY,
  getCompletionMemoryKey,
  preloadCompletionAssets
} from "@features/completion/completionAssets";
import {
  COMPLETION_NARRATION_TEXTS,
  COMPLETION_UI_TEXT
} from "@features/completion/completionContent";

export class CompletionScene extends Phaser.Scene {
  private resultData: EndingFlowPayload = {
    fe: 0,
    be: 0,
    teamwork: 0,
    luck: 0,
    hp: 0,
    hpMax: 100,
    stress: 0,
    gamePlayCount: 0,
    lottoRank: null,
    week: 6,
    dayLabel: "금요일",
    timeLabel: "밤"
  };
  private typewriterEvent?: Phaser.Time.TimerEvent;

  constructor() {
    super(SceneKey.Completion);
  }

  init(data?: Partial<EndingFlowPayload>): void {
    this.resultData = {
      fe: data?.fe ?? 0,
      be: data?.be ?? 0,
      teamwork: data?.teamwork ?? 0,
      luck: data?.luck ?? 0,
      hp: data?.hp ?? 0,
      hpMax: data?.hpMax ?? 100,
      stress: data?.stress ?? 0,
      gamePlayCount: data?.gamePlayCount ?? 0,
      lottoRank: typeof data?.lottoRank === "number" ? data.lottoRank : null,
      week: data?.week ?? 6,
      dayLabel: data?.dayLabel ?? "금요일",
      timeLabel: data?.timeLabel ?? "밤"
    };
  }

  preload(): void {
    preloadCompletionAssets(this);
  }

  create(): void {
    const { width, height } = this.scale;
    this.sound.stopAll(); 
    this.cameras.main.setBackgroundColor("#000000");

    if (!this.anims.exists(COMPLETION_ASSET_KEYS.animationOnce)) {
        this.anims.create({
            key: COMPLETION_ASSET_KEYS.animationOnce,
            frames: this.anims.generateFrameNumbers(COMPLETION_ASSET_KEYS.animationSheet, { start: 0, end: -1 }),
            frameRate: 12,
            repeat: 0 
        });
    }

    const titleText = this.add.text(width / 2, height / 2, "", {
      fontSize: "26px", color: "#ffffff", fontFamily: COMPLETION_FONT_FAMILY,
      align: "center", stroke: "#000000", strokeThickness: 4
    }).setOrigin(0.5).setDepth(100);

    this.startFlashbackSequence(titleText, 0);
    this.createSkipButton(width);
  }

  private startFlashbackSequence(targetText: Phaser.GameObjects.Text, index: number) {
    if (index >= COMPLETION_NARRATION_TEXTS.length) return;
    const { width, height } = this.scale;

    if (index === COMPLETION_NARRATION_TEXTS.length - 1) {
        this.playFinalCutscene(targetText, index);
        return; 
    }

    if (index === 1 && !this.sound.get(COMPLETION_ASSET_KEYS.bgm)?.isPlaying) {
      this.sound.play(COMPLETION_ASSET_KEYS.bgm, { loop: true, volume: 0.5 });
    }

    let flashbackImg: Phaser.GameObjects.Image | null = null;
    if (index >= 1 && index <= 7) {
      const imgKey = getCompletionMemoryKey(index); 
      if (this.textures.exists(imgKey)) {
        flashbackImg = this.add.image(width / 2, height / 2, imgKey).setAlpha(0).setScale(0.8); 
        flashbackImg.setTint(0xa28049);
      }
    }

    targetText.text = "";
    targetText.setAlpha(1);
    this.startTypewriter(targetText, COMPLETION_NARRATION_TEXTS[index] ?? "", () => {});

    if (flashbackImg) {
      this.tweens.chain({
        targets: flashbackImg,
        tweens: [
          { alpha: 0.6, scale: 1.0, duration: 1500, ease: 'Power1' },
          { alpha: 0.6, duration: 2500 },
          { 
            alpha: 0, duration: 1500, 
            onComplete: () => {
              flashbackImg?.destroy();
              this.startFlashbackSequence(targetText, index + 1);
            }
          }
        ]
      });
    } else {
      this.time.delayedCall(4000, () => {
        this.tweens.add({
            targets: targetText, alpha: 0, duration: 1000,
            onComplete: () => { this.startFlashbackSequence(targetText, index + 1); }
        });
      });
    }
  }

  private playFinalCutscene(targetText: Phaser.GameObjects.Text, index: number) {
    const { width, height } = this.scale;

    targetText.text = "";
    targetText.setAlpha(1);
    
    this.startTypewriter(targetText, COMPLETION_NARRATION_TEXTS[index] ?? "", () => {
      this.time.delayedCall(1500, () => {
        this.cameras.main.fadeOut(1000, 255, 255, 255);

        this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
            targetText.setAlpha(0);
            this.cameras.main.fadeIn(500, 255, 255, 255);
            this.showNextFinalImage(width, height);
        });
      });
    });
  }

  private showNextFinalImage(width: number, height: number) {
    if (this.textures.exists(COMPLETION_ASSET_KEYS.finalMemory)) {
      const finalImg = this.add.image(width / 2, height / 2, COMPLETION_ASSET_KEYS.finalMemory)
        .setOrigin(0.5)
        .setAlpha(0)
        .setScale(1.1);

      this.tweens.add({
        targets: finalImg,
        alpha: 1,
        scale: 1,
        duration: 1200,
        ease: 'Cubic.easeOut',
        onComplete: () => {
          const aniSprite = this.add.sprite(width / 2, height / 2+20, COMPLETION_ASSET_KEYS.animationSheet);
          aniSprite.setDepth(250).setScale(1.8);
          
          aniSprite.play(COMPLETION_ASSET_KEYS.animationOnce);
          aniSprite.once('animationcomplete', () => {
            this.time.delayedCall(1000, () => {
              this.showFinalUI();
            });
          });
        }
      });
    } else {
      this.showFinalUI();
    }
  }

  private startTypewriter(target: Phaser.GameObjects.Text, fullText: string, onComplete: Function) {
    let i = 0;
    if (this.typewriterEvent) this.typewriterEvent.destroy();
    this.typewriterEvent = this.time.addEvent({
      delay: 80, repeat: fullText.length - 1,
      callback: () => {
        target.text += fullText[i];
        if (fullText[i] !== " " && fullText[i] !== "\n") {
          this.sound.play(COMPLETION_ASSET_KEYS.typingSound, { volume: 0.1 });
        }
        if (i === fullText.length - 1) onComplete();
        i++;
      }
    });
  }

  private showFinalUI() {
    const { width, height } = this.scale;
    const uiContainer = this.add.container(0, 0).setAlpha(0).setDepth(300);

    const completeTitle = this.add.text(width / 2, height * 0.2, COMPLETION_UI_TEXT.title, {
      fontSize: "48px", fontStyle: "bold", color: "#ffffff", fontFamily: COMPLETION_FONT_FAMILY,
      stroke: "#1e3c6e", strokeThickness: 6
    }).setOrigin(0.5);

    const trueEndingBtn = this.add.text(width / 2, height-50, COMPLETION_UI_TEXT.trueEndingButton, {
      fontSize: "28px", backgroundColor: "#6098c2", padding: { x: 20, y: 10 }, fontFamily: COMPLETION_FONT_FAMILY,
      stroke: "#1e3c6e", strokeThickness: 4
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    trueEndingBtn.on("pointerdown", () => {
      this.sound.stopAll();
      this.scene.start(SceneKey.FinalSummary, this.resultData);
    });

    uiContainer.add([completeTitle, trueEndingBtn]);
    this.tweens.add({ targets: uiContainer, alpha: 1, duration: 1000 });
  }

  private createSkipButton(width: number) {
    const skipBtn = this.add.text(width - 20, 20, COMPLETION_UI_TEXT.skip, {
      fontSize: "14px", color: "#ffffff", backgroundColor: "#00000055", 
      padding: { x: 5, y: 2 }, fontFamily: COMPLETION_FONT_FAMILY 
    }).setOrigin(1, 0).setDepth(400).setAlpha(0.7).setInteractive({ useHandCursor: true });

    skipBtn.on('pointerdown', () => {
      this.sound.stopAll();
      if (this.typewriterEvent) this.typewriterEvent.destroy();
      this.scene.start(SceneKey.FinalSummary, this.resultData);
    });
  }
}
