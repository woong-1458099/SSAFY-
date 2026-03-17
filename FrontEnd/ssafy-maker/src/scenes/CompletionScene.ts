import Phaser from "phaser";
import type { EndingFlowPayload } from "@features/progression/types/ending";
import { SceneKey } from "@shared/enums/sceneKey";

export class CompletionScene extends Phaser.Scene {
  private resultData: Partial<EndingFlowPayload> = {};
  private FONT_FAMILY = 'PFStardustBold';
  
  private readonly narrationTexts = [
    "저번달에 입과한 것 같은데... \n 시간은 정말 쏜살같이 흘러갔다.",         
    "힘들지 않았다고 한다면 거짓말이겠지.",               
    "...하지만 함께해 준 친구들이 있어서 즐겁게 지낼 수 있었다.",               
    "같이 평가를 보고 머리를 싸메던 일, ",    
    "퇴실하고 함께 나가서 라멘을 먹고, 맥주 한 잔 하기도 하고. ",    
    "점심시간에 가끔 하던 커피 내기",  
    "알고리즘 공부 한다고 머리가 터질 뻔 하기도 했지!", 
    "아, 맞다 입실체크.", 
    "아무래도 잊기 힘든 추억이 된 것 같다",
    "나도 친구들도 이제 새로운 시작을 앞두고 있다.",    
    "나의 성장은 계속될 것이다.", 
    "앞으로도 쭉",
    "너도 마찬가지겠지?",
    "너의 새로운 시작도 우리가 응원할게." 
  ];
  
  private typewriterEvent?: Phaser.Time.TimerEvent;

  constructor() {
    super(SceneKey.Completion);
  }

  init(data: Partial<EndingFlowPayload>): void {
    this.resultData = data;
  }

  preload(): void {
    this.load.audio("completion_bgm", "assets/game/audio/BGM/Completion.mp3");
    this.load.audio("typing_sound", "assets/game/audio/SoundEffect/type.mp3"); 

    for(let i = 1; i <= 7; i++) {
        this.load.image(`memory_${i}`, `assets/game/backgrounds/flashback/${i}.png`);
    }
    this.load.image('final_memory', 'assets/game/backgrounds/pass_SF.png'); 
    this.load.spritesheet('ending_ani', 'assets/game/backgrounds/flashback/completion_book.png', {
        frameWidth: 372, 
        frameHeight: 318 
    });
  }

  create(): void {
    const { width, height } = this.scale;
    this.sound.stopAll(); 
    this.cameras.main.setBackgroundColor("#000000");

    if (!this.anims.exists('ending_once')) {
        this.anims.create({
            key: 'ending_once',
            frames: this.anims.generateFrameNumbers('ending_ani', { start: 0, end: -1 }),
            frameRate: 12,
            repeat: 0 
        });
    }

    const titleText = this.add.text(width / 2, height / 2, "", {
      fontSize: "26px", color: "#ffffff", fontFamily: this.FONT_FAMILY,
      align: "center", stroke: "#000000", strokeThickness: 4
    }).setOrigin(0.5).setDepth(100);

    this.startFlashbackSequence(titleText, 0);
    this.createSkipButton(width);
  }

  private startFlashbackSequence(targetText: Phaser.GameObjects.Text, index: number) {
    if (index >= this.narrationTexts.length) return;
    const { width, height } = this.scale;

    if (index === this.narrationTexts.length - 1) {
        this.playFinalCutscene(targetText, index);
        return; 
    }

    if (index === 1 && !this.sound.get("completion_bgm")?.isPlaying) {
      this.sound.play("completion_bgm", { loop: true, volume: 0.5 });
    }

    let flashbackImg: Phaser.GameObjects.Image | null = null;
    if (index >= 1 && index <= 7) {
      const imgKey = `memory_${index}`; 
      if (this.textures.exists(imgKey)) {
        flashbackImg = this.add.image(width / 2, height / 2, imgKey).setAlpha(0).setScale(0.8); 
        flashbackImg.setTint(0xa28049);
      }
    }

    targetText.text = "";
    targetText.setAlpha(1);
    this.startTypewriter(targetText, this.narrationTexts[index], () => {});

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
    
    this.startTypewriter(targetText, this.narrationTexts[index], () => {
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
    if (this.textures.exists('final_memory')) {
      const finalImg = this.add.image(width / 2, height / 2, 'final_memory')
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
          const aniSprite = this.add.sprite(width / 2, height / 2+20, 'ending_ani');
          aniSprite.setDepth(250).setScale(1.8);
          
          aniSprite.play('ending_once');
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
          this.sound.play("typing_sound", { volume: 0.1 });
        }
        if (i === fullText.length - 1) onComplete();
        i++;
      }
    });
  }

  private showFinalUI() {
    const { width, height } = this.scale;
    const uiContainer = this.add.container(0, 0).setAlpha(0).setDepth(300);

    const completeTitle = this.add.text(width / 2, height * 0.2, "SEASON 1. 1학기 COMPLETE", {
      fontSize: "48px", fontStyle: "bold", color: "#ffffff", fontFamily: this.FONT_FAMILY,
      stroke: "#1e3c6e", strokeThickness: 6
    }).setOrigin(0.5);

    const trueEndingBtn = this.add.text(width / 2, height-50, "[ 진엔딩 보러가기 ]", {
      fontSize: "28px", backgroundColor: "#6098c2", padding: { x: 20, y: 10 }, fontFamily: this.FONT_FAMILY,
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
    const skipBtn = this.add.text(width - 20, 20, "클릭해서 스킵", {
      fontSize: "14px", color: "#ffffff", backgroundColor: "#00000055", 
      padding: { x: 5, y: 2 }, fontFamily: this.FONT_FAMILY 
    }).setOrigin(1, 0).setDepth(400).setAlpha(0.7).setInteractive({ useHandCursor: true });

    skipBtn.on('pointerdown', () => {
      this.sound.stopAll();
      if (this.typewriterEvent) this.typewriterEvent.destroy();
      this.scene.start(SceneKey.FinalSummary, this.resultData);
    });
  }
}
