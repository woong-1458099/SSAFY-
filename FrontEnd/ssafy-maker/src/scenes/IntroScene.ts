import Phaser from "phaser";
import { SceneKey } from "@shared/enums/sceneKey";

export class IntroScene extends Phaser.Scene {
  private allElements: Phaser.GameObjects.GameObject[] = [];
  private dimOverlay!: Phaser.GameObjects.Rectangle;
  private skipText!: Phaser.GameObjects.Text;
  private introEnded = false;
  
  private readonly FONT_FAMILY = 'PFStardustBold'; 

  constructor() {
    super(SceneKey.Intro);
  }

  preload(): void {
    this.load.audio('type_sound', 'assets/game/audio/SoundEffect/type.mp3');
    this.load.audio('street_bgm', 'assets/game/audio/BGM/survive.mp3');
    this.load.audio('subway_arrival', 'assets/game/audio/SoundEffect/subway_come.mp3');
    this.load.audio('subway_train_snd', 'assets/game/audio/SoundEffect/train.mp3');
    this.load.audio('door_open_snd', 'assets/game/audio/SoundEffect/door_open.mp3');
    this.load.audio('crowded_snd', 'assets/game/audio/SoundEffect/crowded.mp3');
    this.load.audio('roomtone', 'assets/game/audio/BGM/roomtone.mp3');
    this.load.audio('voice_male', 'assets/game/audio/SoundEffect/voice_male.wav');
    this.load.audio('voice_female', 'assets/game/audio/SoundEffect/voice_female.wav');
    this.load.audio('panic_snd', 'assets/game/audio/SoundEffect/no.mp3');
    this.load.audio('click_snd', 'assets/game/audio/SoundEffect/click2.mp3');
    this.load.audio('thump_snd', 'assets/game/audio/SoundEffect/no.mp3');
    this.load.audio('victory_bgm', 'assets/game/audio/BGM/Event2.mp3');

    this.load.image('subway_bg', 'assets/game/backgrounds/subway_back.png');
    this.load.image('subway_train_img', 'assets/game/backgrounds/train.png');
    this.load.image('subway_train_open', 'assets/game/backgrounds/train_open.png');
    this.load.image('subway_fg', 'assets/game/backgrounds/subway_front.png');
    this.load.image('crowd1', 'assets/game/backgrounds/crowd1.png');
    this.load.image('crowd2', 'assets/game/backgrounds/crowd2.png');
    this.load.image('crowd3', 'assets/game/backgrounds/crowd3.png');
    this.load.image('yeoksam_outside', 'assets/game/backgrounds/yeoksam.png');
    this.load.image('yeoksam_inside', 'assets/game/backgrounds/yeoksam2.png');
    this.load.image('yeoksam3', 'assets/game/backgrounds/yeoksam3.png');
    this.load.image('pass_screen', 'assets/game/backgrounds/pass_SF.png');
    this.load.image('pass_screen2', 'assets/game/backgrounds/pass_SF2.png');
    this.load.image('victory_bg', 'assets/game/backgrounds/pass_SF2.png');
  }

  private safePlay(key: string, config?: Phaser.Types.Sound.SoundConfig) {
    if (this.cache.audio.exists(key)) {
      this.sound.play(key, config);
    } else {
      console.warn(`Sound key "${key}" not found in cache.`);
    }
  }

  create(): void {
    const { width, height } = this.sys.canvas;
    this.sound.stopAll();

    const skipToIntro = () => {
      this.startMainScene();
    };

    this.skipText = this.add.text(width - 20, 20, "클릭해서 스킵", {
      fontSize: "14px", color: "#ffffff", backgroundColor: "#00000055", padding: { x: 5, y: 2 },
      fontFamily: this.FONT_FAMILY 
    })
    .setOrigin(1, 0)
    .setDepth(200)
    .setAlpha(0.7)
    .setInteractive({ useHandCursor: true });

    this.skipText.on('pointerdown', (pointer: Phaser.Input.Pointer, localX: number, localY: number, event: Phaser.Types.Input.EventData) => {
      event.stopPropagation();
      skipToIntro();
    });

    this.dimOverlay = this.add.rectangle(0, 0, width, height, 0x000000)
      .setOrigin(0).setDepth(15).setAlpha(0);

    const blackBg = this.add.rectangle(0, 0, width, height, 0x000000).setOrigin(0).setDepth(10);
    const storyText = "202X년 6월,\nSSAFY 14기 면접을 앞둔 당신은\n역삼역에 도착했다.";

    const displayLabel = this.add.text(width / 2, height / 2, "", {
      fontSize: "24px", color: "#ffffff", align: "center", fontFamily: this.FONT_FAMILY 
    }).setOrigin(0.5).setDepth(20).setResolution(2);

    this.typewriteText(storyText, displayLabel, () => {
      this.time.delayedCall(1500, () => {
        this.tweens.add({
          targets: [displayLabel, blackBg], alpha: 0, duration: 1000,
          onComplete: () => {
            if (displayLabel.active) displayLabel.destroy();
            if (blackBg.active) blackBg.destroy();
            this.startSubwaySequence(width, height);
          }
        });
      });
    });
  }

  private showPassScreen(width: number, height: number, blackOverlay: Phaser.GameObjects.Rectangle) {
    const oldBg = this.children.getByName('current_bg');
    if (oldBg) oldBg.destroy();

    const passBg1 = this.add.image(width / 2, height / 2, 'pass_screen')
      .setOrigin(0.5).setDepth(0).setScale(1.0).setName('current_bg');

    const cursor = this.add.graphics().setDepth(110);
    cursor.fillStyle(0xffffff, 1).lineStyle(2, 0x000000, 1);
    const points = [0, 0, 0, 20, 5, 15, 10, 25, 13, 23, 8, 13, 15, 15];
    cursor.fillPoints(points, true).strokePoints(points, true);
    cursor.x = width / 2; cursor.y = height / 2; cursor.alpha = 0;

    this.tweens.add({
      targets: blackOverlay, alpha: 0, duration: 2000,
      onComplete: () => {
        if (blackOverlay.scene) blackOverlay.destroy();
        this.tweens.add({
          targets: cursor, alpha: 1, x: width * 0.8, y: height * 0.2, duration: 1500, ease: 'Cubic.easeInOut',
          onComplete: () => {
            this.safePlay('click_snd');
            this.tweens.add({
              targets: cursor, scale: 1, duration: 100, yoyo: true,
              onComplete: () => {
                this.time.delayedCall(300, () => {
                  cursor.destroy();
                  const passBg2 = this.add.image(width / 2, height / 2, 'pass_screen2')
                    .setOrigin(0.5).setDepth(1).setScale(0.8).setAlpha(0);
                  
                  this.tweens.add({
                    targets: passBg2, alpha: 1, duration: 200,
                    onComplete: () => {
                      passBg1.destroy();
                      this.cameras.main.shake(600, 0.03);
                      this.drawShoutBubble(width / 2, height / 2, "헉!!", true, 40, () => {
                        this.time.delayedCall(1500, () => {
                          this.showFinalVictory(width, height, passBg2);
                        });
                      });
                    }
                  });
                });
              }
            });
          }
        });
      }
    });
  }

  private showFinalVictory(width: number, height: number, oldBg: Phaser.GameObjects.Image) {
    this.allElements.forEach(el => el && el.destroy());
    this.allElements = [];

    this.safePlay('victory_bgm', { loop: true, volume: 0.6 });

    const victoryBg = this.add.image(width / 2, height / 2, 'victory_bg')
      .setOrigin(0.5).setDepth(2).setAlpha(0).setScale(1.2);

    this.tweens.add({
      targets: victoryBg, alpha: 1, duration: 1000,
      onComplete: () => {
        if (oldBg) oldBg.destroy();
        this.cameras.main.flash(1000, 255, 255, 255);
        
        this.drawShoutBubble(width / 2, height / 2 - 120, "됐다!!! 만세!!!", true, 45, () => {
            this.time.delayedCall(2000, () => {
                this.drawShoutBubble(width / 2, height / 2 + 100, "나도 이제 싸피생이야!!!", true, 35, () => {
                    this.time.delayedCall(1500, () => {
                        if(this.skipText) this.skipText.destroy();
                        const guideTxt = this.add.text(width / 2, height - 40, "- 클릭하여 시작 -", {
                          fontSize: "18px", color: "#ffffff", fontFamily: this.FONT_FAMILY
                        }).setOrigin(0.5).setDepth(100);
                        this.tweens.add({ targets: guideTxt, alpha: 0.3, duration: 800, yoyo: true, repeat: -1 });

                        this.input.once("pointerdown", () => this.startMainScene());
                        this.time.delayedCall(1800, () => this.startMainScene());
                    });
                });
            });
        });

        this.createHiddenEasterEgg(width, height);
      }
    });
  }

  private createHiddenEasterEgg(width: number, height: number) {
    const hoverZone = this.add.zone(width - 600, height - 100, 100, 100)
      .setOrigin(0.5).setInteractive({ useHandCursor: true });

    let eggBubble: Phaser.GameObjects.Container | null = null;

    hoverZone.on('pointerover', () => {
      if (!eggBubble) {
        this.drawShoutBubble(width - 150, height - 150, "안돼!!!", true, 28, (container) => {
          eggBubble = container;
        });
      }
    });

    hoverZone.on('pointerout', () => {
      if (eggBubble) {
        const target = eggBubble;
        eggBubble = null; 
        this.tweens.add({
          targets: target,
          alpha: 0,
          scale: 0.3,
          duration: 200,
          onComplete: () => target.destroy()
        });
      }
    });
  }

  private drawShoutBubble(x: number, y: number, message: string, isSharp: boolean = true, fontSize: number = 20, onComplete?: (container: Phaser.GameObjects.Container) => void) {
    const container = this.add.container(x, y).setDepth(60);
    this.allElements.push(container);

    const txt = this.add.text(0, 0, message, {
      fontSize: `${fontSize}px`, 
      color: "#000000", 
      fontFamily: this.FONT_FAMILY, 
      align: "center",
      padding: { left: 25, right: 25, top: 25, bottom: 25 }, 
      wordWrap: { width: 400 }
    }).setOrigin(0.5).setResolution(3);

    const bubble = this.add.graphics();
    const w = txt.width; 
    const h = txt.height;

    if (isSharp) {
      const spikeCount = 15; const points: Phaser.Math.Vector2[] = [];
      const outerW = w / 1.5; const outerH = h / 1.5;
      const innerW = w / 2.1; const innerH = h / 2.1;
      
      for (let i = 0; i < spikeCount; i++) {
        const angle = (i / spikeCount) * Math.PI * 2;
        const nextHalfAngle = ((i + 0.5) / spikeCount) * Math.PI * 2;
        points.push(new Phaser.Math.Vector2(Math.cos(angle) * outerW, Math.sin(angle) * outerH));
        points.push(new Phaser.Math.Vector2(Math.cos(nextHalfAngle) * innerW, Math.sin(nextHalfAngle) * innerH));
      }
      bubble.lineStyle(4, 0x000000, 1).fillStyle(0xffffff, 1).beginPath().moveTo(points[0].x, points[0].y);
      for (let i = 1; i < points.length; i++) bubble.lineTo(points[i].x, points[i].y);
      bubble.closePath().fillPath().strokePath();
    } else {
      bubble.lineStyle(4, 0x000000, 1).fillStyle(0xffffff, 1).fillEllipse(0, 0, w + 50, h + 50).strokeEllipse(0, 0, w + 50, h + 50);
    }

    container.add([bubble, txt]);
    container.setAlpha(0).setScale(0.4);

    this.tweens.add({ 
      targets: container, 
      alpha: 1, 
      scale: 1, 
      duration: 350, 
      ease: 'Back.out', 
      onComplete: () => {
        if (onComplete) onComplete(container);
      }
    });
    
    if (isSharp) {
      this.tweens.add({ 
        targets: container, 
        x: '+=3', 
        y: '-=2', 
        duration: 40, 
        yoyo: true, 
        repeat: -1 
      });
    }
  }

  private setDim(isDim: boolean, duration: number = 500) {
    this.tweens.add({ targets: this.dimOverlay, alpha: isDim ? 0.6 : 0, duration: duration });
  }

  private startSubwaySequence(width: number, height: number) {
    const bg = this.add.image(width / 2, height / 2, 'subway_bg').setOrigin(0.5).setDepth(0).setScale(0.6);
    const train = this.add.image(width + 1200, (height / 2) + 120, 'subway_train_img').setOrigin(0.5).setDepth(1).setScale(1.8);
    const fg = this.add.image(width / 2, (height / 2) + 20, 'subway_fg').setOrigin(0.5).setDepth(3);
    this.allElements.push(bg, train, fg);
    if (this.cache.audio.exists('subway_arrival')) {
        const arrivalSound = this.sound.add('subway_arrival', { volume: 0.6 });
        arrivalSound.once('complete', () => this.moveTrain(train, width));
        arrivalSound.play();
    } else { this.moveTrain(train, width); }
  }

  private moveTrain(train: Phaser.GameObjects.Image, width: number) {
    const trainSoundKey = 'subway_train_snd';
    let trainSound: any = null;
    if (this.cache.audio.exists(trainSoundKey)) {
        trainSound = this.sound.add(trainSoundKey, { volume: 0.6 });
        trainSound.play();
    }
    this.tweens.add({
      targets: train, x: width / 2, duration: 8000, ease: 'Cubic.out',
      onComplete: () => {
        if (trainSound) {
            this.tweens.add({ targets: trainSound, volume: 0, duration: 1500, onComplete: () => { trainSound.stop(); this.handleDoorOpen(train); } });
        } else { this.handleDoorOpen(train); }
      }
    });
  }

  private handleDoorOpen(train: Phaser.GameObjects.Image) {
    const { width, height } = this.sys.canvas;
    this.safePlay('door_open_snd');
    if (this.cache.audio.exists('crowded_snd')) this.sound.add('crowded_snd', { loop: true, volume: 0.5 }).play();
    train.setTexture('subway_train_open');
    ['crowd1', 'crowd2', 'crowd3'].forEach((key, i) => {
      this.time.delayedCall(500 * (i + 1), () => {
        const crowd = this.add.image(width * (0.25 + i * 0.25), (height / 2) + 200, key).setOrigin(0.5).setDepth(4).setAlpha(0).setScale(0.7);
        this.allElements.push(crowd);
        this.tweens.add({ targets: crowd, alpha: 1, duration: 1500 });
      });
    });
    this.time.delayedCall(2500, () => { 
        this.drawShoutBubble(width / 2 + 150, height / 2 + 50, "잠시만요! 내릴게요!!", true, 20, () => {
            this.time.delayedCall(3000, () => { this.cleanupAndNextStep(this.sound.get('crowded_snd')); });
        });
    });
  }

  private startInterviewPanic(width: number, height: number, narrativeLabel: Phaser.GameObjects.Text) {
    const roomtone = this.sound.add('roomtone', { loop: true, volume: 0.5 });
    roomtone.play();
    const questions = ["지원자분은 왜 SSAFY에 지원하셨죠?", "자신의 가장 큰 단점이 뭐라고 생각하세요?", "백준 레벨이 어떻게 되시나요?", "갈등 상황 해결 방법은?", "팀 프로젝트 경험은?", "본인의 기술적 강점은?", "협업 시 중요한 점은?", "본인이 생각하는 10년 후 모습은?"];
    const gridPositions = [{ x: width * 0.25, y: height * 0.2 }, { x: width * 0.75, y: height * 0.2 }, { x: width * 0.2, y: height * 0.45 }, { x: width * 0.8, y: height * 0.45 }, { x: width * 0.5, y: height * 0.15 }, { x: width * 0.5, y: height * 0.55 }, { x: width * 0.15, y: height * 0.7 }, { x: width * 0.85, y: height * 0.7 }];
    let count = 0;
    const timer = this.time.addEvent({
      delay: 150,
      callback: () => {
        const voiceKey = count % 2 === 0 ? 'voice_male' : 'voice_female';
        this.cameras.main.shake(200, 0.003);
        const pos = gridPositions[count];
        this.safePlay(voiceKey, { volume: 0.6 });
        this.drawShoutBubble(pos.x, pos.y, questions[count], false, 18);
        count++;
        if (count >= 8) {
          timer.remove();
          this.time.delayedCall(2500, () => {
            this.tweens.add({ targets: this.allElements, alpha: 0, duration: 500, onComplete: () => {
              this.allElements.forEach(el => el.destroy()); this.allElements = [];
              this.setDim(true);
              this.typewriteText("그... 그게...", narrativeLabel, () => {
                this.time.delayedCall(1500, () => {
                  narrativeLabel.text = "";
                  this.typewriteText("어떡하지...? 망쳤나?", narrativeLabel, () => {
                    this.time.delayedCall(3000, () => {
                      this.safePlay('thump_snd', { volume: 1.0 });
                      this.cameras.main.shake(500, 0.02);
                      const finalBlackBg = this.add.rectangle(0, 0, width, height, 0x000000).setOrigin(0).setDepth(100).setAlpha(0);
                      this.tweens.add({ targets: finalBlackBg, alpha: 1, duration: 2500, onComplete: () => {
                        this.sound.stopAll(); this.setDim(false, 0);
                        narrativeLabel.text = "며칠 후..."; narrativeLabel.setDepth(101);
                        this.time.delayedCall(3500, () => {
                          this.tweens.add({ targets: narrativeLabel, alpha: 0, duration: 1000, onComplete: () => this.showPassScreen(width, height, finalBlackBg) });
                        });
                      }});
                    });
                  });
                });
              });
            }});
          });
        }
      },
      repeat: 7
    });
  }

  private cleanupAndNextStep(loopSound: any) {
    const { width, height } = this.sys.canvas;
    if (loopSound) this.tweens.add({ targets: loopSound, volume: 0, duration: 1000, onComplete: () => loopSound.stop() });
    this.tweens.add({ targets: this.allElements, alpha: 0, duration: 1000, onComplete: () => {
      this.allElements.forEach(obj => obj.destroy()); this.allElements = [];
      this.startNextSequence(width, height);
    }});
  }

  private startNextSequence(width: number, height: number) {
    const narrativeText = this.add.text(width / 2, height / 2, "", { 
      fontSize: "24px", color: "#ffffff", align: "center", fontFamily: this.FONT_FAMILY, lineSpacing: 10 
    }).setOrigin(0.5).setDepth(20).setResolution(2);
    
    this.setDim(true);
    this.typewriteText("겨우 역삼역에 내렸다.\n 사람 사이에 끼여 죽는 줄 알았네. \n 서울은 정말 무서운 곳이구나.", narrativeText, () => {
      this.time.delayedCall(2000, () => {
        this.setDim(false);
        this.tweens.add({ targets: narrativeText, alpha: 0, duration: 1000, onComplete: () => {
          narrativeText.text = ""; narrativeText.alpha = 1;
          this.changeBackground(width, height, 'yeoksam_outside');
          this.time.delayedCall(1500, () => {
            this.setDim(true);
            this.typewriteText("다행히 면접시간까지는 꽤 시간이 남았으니... \n 잠시 앉아서 서류도 확인하고, 예상 질문도 다시 읽어보고...", narrativeText, () => {
              this.time.delayedCall(2000, () => {
                this.setDim(false);
                this.tweens.add({ targets: narrativeText, alpha: 0, duration: 1000, onComplete: () => {
                  narrativeText.text = ""; narrativeText.alpha = 1;
                  this.changeBackground(width, height, 'yeoksam_inside');
                  this.time.delayedCall(1500, () => {
                    this.setDim(true);
                    this.typewriteText("...그렇게 하려고 했는데...", narrativeText, () => {
                      this.time.delayedCall(1500, () => {
                        const streetBgm = this.sound.get('street_bgm');
                        if (streetBgm) this.tweens.add({ targets: streetBgm, volume: 0, duration: 1000, onComplete: () => streetBgm.stop() });
                        const fadeOverlay = this.add.rectangle(0, 0, width, height, 0x000000).setOrigin(0).setDepth(50).setAlpha(0);
                        this.tweens.add({ targets: fadeOverlay, alpha: 1, duration: 1000, onComplete: () => {
                          this.setDim(false, 0); this.changeBackground(width, height, 'yeoksam3');
                          this.tweens.add({ targets: fadeOverlay, alpha: 0, duration: 1000, onComplete: () => {
                            fadeOverlay.destroy(); this.setDim(true); narrativeText.text = ""; narrativeText.alpha = 1;
                            this.typewriteText("어... 왜 내가 벌써 면접장 안이지...?", narrativeText, () => {
                              this.time.delayedCall(1500, () => {
                                this.setDim(false);
                                this.tweens.add({ targets: narrativeText, alpha: 0, duration: 800, onComplete: () => {
                                  narrativeText.text = ""; narrativeText.alpha = 1;
                                  this.startInterviewPanic(width, height, narrativeText);
                                }});
                              });
                            });
                          }});
                        }});
                      });
                    });
                  });
                }});
              });
            });
          });
        }});
      });
    });
  }

  private changeBackground(width: number, height: number, textureKey: string) {
    const oldBg = this.children.getByName('current_bg');
    if (oldBg) this.tweens.add({ targets: oldBg, alpha: 0, duration: 800, onComplete: () => oldBg.destroy() });
    const newBg = this.add.image(width / 2, height / 2, textureKey).setOrigin(0.5).setAlpha(0).setDepth(0).setScale(0.6).setName('current_bg');
    if (textureKey === 'yeoksam_outside' && this.cache.audio.exists('street_bgm')) {
        const bgm = this.sound.add('street_bgm', { loop: true, volume: 0 }); bgm.play();
        this.tweens.add({ targets: bgm, volume: 0.5, duration: 2000 });
    }
    this.tweens.add({ targets: newBg, alpha: 1, duration: 1500 });
  }

  private startMainScene(): void {
    if (this.introEnded) {
      return;
    }

    this.introEnded = true;
    this.sound.stopAll();
    this.time.removeAllEvents();
    this.tweens.killAll();
    this.scene.start(SceneKey.NewCharacter);
  }

  private typewriteText(text: string, label: Phaser.GameObjects.Text, onComplete: () => void) {
    label.setFontFamily(this.FONT_FAMILY); 
    let i = 0;
    this.time.addEvent({
      callback: () => {
        label.text += text[i];
        if (text[i] !== " " && text[i] !== "\n") this.safePlay('type_sound', { volume: 0.3 });
        i++; if (i === text.length) onComplete();
      },
      repeat: text.length - 1, delay: 100
    });
  }
}
