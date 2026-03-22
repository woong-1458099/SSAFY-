import Phaser from 'phaser';
import { applyLegacyViewport } from './viewport';
import { installMinigamePause } from './installMinigamePause';
import { returnToScene } from '@features/minigame/minigameLauncher';
import {
  LEGACY_DRINKING_ASSET_KEYS,
  LEGACY_DRINKING_NPCS,
  LEGACY_DRINKING_PERFECT_RANGE,
  LEGACY_DRINKING_ROUNDS,
  preloadLegacyDrinkingAssets,
  resolveLegacyDrinkingJudge
} from '@features/minigame/legacy/legacyDrinkingConfig';
import { SCREEN, PIXEL_FONT, COLORS, createBackground, createButton } from './utils';

const { W, H } = SCREEN;

export default class DrinkingScene extends Phaser.Scene {
  private round = 1;
  private score = 0;
  private success = 0;
  private gameOver = false;

  private foamLevel = 0;
  private foamSpeed = 0;
  private foamDir = 1;
  private foamActive = false;
  private foamClicked = false;
  
  private bgm!: Phaser.Sound.BaseSound;
  private npcSprite!: Phaser.GameObjects.Sprite;
  private grandmaSprite!: Phaser.GameObjects.Sprite;
  
  private beerGlass!: Phaser.GameObjects.Sprite; 
  private beerFillGraphic!: Phaser.GameObjects.Graphics; 
  private foamBar!: Phaser.GameObjects.Rectangle;
  private roundTxt!: Phaser.GameObjects.Text;
  private scoreTxt!: Phaser.GameObjects.Text;
  private resultTxt!: Phaser.GameObjects.Text;
  
  private bubbleGroup!: Phaser.GameObjects.Container;
  private npcChatTxt!: Phaser.GameObjects.Text;
  private bubbleBg!: Phaser.GameObjects.Graphics;

  private returnSceneKey: string = 'MenuScene';

  constructor() {
    super({ key: 'DrinkingScene' });
  }

  init(data: any) {
    this.returnSceneKey = data?.returnSceneKey || 'MenuScene';
  }

  preload() {
    preloadLegacyDrinkingAssets(this);
  }

  create() {
    applyLegacyViewport(this);
    installMinigamePause(this, this.returnSceneKey);

    const W = 800, H = 600;

    this.sound.stopAll();
    this.bgm = this.sound.add(LEGACY_DRINKING_ASSET_KEYS.bgm, { loop: true, volume: 0.5 });
    if (!this.sound.locked) this.bgm.play();

    this.round = 1; this.score = 0; this.success = 0; this.gameOver = false;
  this.add.image(W / 2, H / 2, LEGACY_DRINKING_ASSET_KEYS.background).setDisplaySize(W, H).setDepth(1);

    this.add.image(W/2, H/2, LEGACY_DRINKING_ASSET_KEYS.tableBack).setDisplaySize(W, H-260).setDepth(2);

    this.grandmaSprite = this.add.sprite(200, H/2 + 40, LEGACY_DRINKING_ASSET_KEYS.grandma).setScale(1.5).setDepth(5);
    if (!this.anims.exists(LEGACY_DRINKING_ASSET_KEYS.grandmaWalkAnimation)) {
      this.anims.create({
        key: LEGACY_DRINKING_ASSET_KEYS.grandmaWalkAnimation,
        frames: this.anims.generateFrameNumbers(LEGACY_DRINKING_ASSET_KEYS.grandma, { start: 0, end: 4 }),
        frameRate: 10,
        repeat: -1
      });
    }
    this.grandmaSprite.play(LEGACY_DRINKING_ASSET_KEYS.grandmaWalkAnimation);

    this.npcSprite = this.add.sprite(W - 200, H/2 + 50, 'minsu').setScale(6).setFlipX(true).setDepth(5);

    this.add.image(W/2, H, LEGACY_DRINKING_ASSET_KEYS.tableFront).setOrigin(0.5, 1).setDisplaySize(W, 260).setDepth(10);
    this.beerFillGraphic = this.add.graphics().setDepth(14);
    this.beerGlass = this.add.sprite(W/2, 400, LEGACY_DRINKING_ASSET_KEYS.beerGlass, 0)
      .setDepth(15)
      .setScale(1.8);

    this.createSpeechBubble(W - 200, H/2 - 120);
    this.setupUI(W, H);

    this.input.keyboard?.on('keydown-SPACE', this.handleClick, this);
    this.add.rectangle(W/2, H/2, W, H, 0, 0).setInteractive().on('pointerdown', this.handleClick, this);

    this.time.delayedCall(800, () => this.startRound());
  }

  startRound() {
    if (this.gameOver) return;
    const data = LEGACY_DRINKING_NPCS[(this.round - 1) % LEGACY_DRINKING_NPCS.length];
    this.npcSprite.setTexture(data.key);
    this.updateBubble(data.comment);

    this.beerGlass.setFrame(0);
    this.beerFillGraphic.clear(); 

    this.foamLevel = 475;
    this.foamDir = 1;
    this.foamActive = true;
    this.foamClicked = false;
    this.resultTxt.setText('');
    this.foamSpeed = 2.5 + this.round * 0.5;
    this.foamBar.setY(this.foamLevel);
    this.foamBar.setFillStyle(0xffaa00);
    this.roundTxt.setText(`ROUND ${this.round} / ${LEGACY_DRINKING_ROUNDS}`);
    this.tweens.add({ targets: this.npcSprite, y: this.npcSprite.y - 15, duration: 200, yoyo: true });
  }

  updateBeerFill() {
    if (!this.foamActive || this.gameOver) return;

    this.beerFillGraphic.clear();
    const progress = Phaser.Math.Clamp((475 - this.foamLevel) / (475 - 125), 0, 1);
    const glassW = 94 * 1.22;
    const glassH = 128 * 1.8;
    const fillW = glassW * 0.7; 
    const maxFillH = glassH * 0.8; 
    
    const currentH = maxFillH * progress;

    this.beerFillGraphic.fillStyle(0xFFCC00, 1); 
    this.beerFillGraphic.fillRect(
      this.beerGlass.x - fillW / 2 - 2, 
      this.beerGlass.y + (glassH / 2) - 20 - currentH, 
      fillW, 
      currentH
    );
  }

  handleClick() {
    if (!this.foamActive || this.foamClicked || this.gameOver) return;
    this.foamClicked = true; 
    this.foamActive = false;
    
    const pos = this.foamBar.y;
    this.beerFillGraphic.clear();
    const result = resolveLegacyDrinkingJudge(pos);
    if (result.success) {
      this.success++;
      this.score += result.score;
    } else if (result.shake) {
      this.cameras.main.shake(200, 0.01);
    }
    this.beerGlass.setFrame(result.frame);

    this.scoreTxt.setText(`SCORE: ${this.score}`);
    this.resultTxt.setColor(result.color).setText(result.message);

    this.time.delayedCall(1500, () => {
      this.round++;
      if (this.round > LEGACY_DRINKING_ROUNDS) { this.gameOver = true; this.endGame(); }
      else { this.startRound(); }
    });
  }

  update() {
    if (!this.foamActive || this.gameOver) return;
    
    this.foamLevel -= this.foamSpeed * this.foamDir;
    if (this.foamLevel <= 125 || this.foamLevel >= 475) {
      this.foamLevel = Phaser.Math.Clamp(this.foamLevel, 125, 475);
      this.foamDir *= -1;
    }
    this.foamBar.setY(this.foamLevel);
    this.foamBar.setFillStyle(this.foamLevel >= LEGACY_DRINKING_PERFECT_RANGE.min && this.foamLevel <= LEGACY_DRINKING_PERFECT_RANGE.max ? 0x44ff88 : 0xffaa00);
    this.updateBeerFill();
  }

  setupUI(W: number, H: number) {
    const hudDepth = 20;
    this.add.rectangle(W/2, 25, W, 50, 0x0d1545, 0.95).setDepth(hudDepth);
    this.scoreTxt = this.add.text(20, 15, 'SCORE: 0', { fontSize: '12px', color: '#ffffff', fontFamily: PIXEL_FONT }).setDepth(hudDepth);
    this.roundTxt = this.add.text(W-20, 15, `ROUND 1 / ${LEGACY_DRINKING_ROUNDS}`, { fontSize: '12px', color: '#ffaa00', fontFamily: PIXEL_FONT }).setOrigin(1,0).setDepth(hudDepth);
    this.add.rectangle(W-100, 300, 40, 350, 0x223355).setStrokeStyle(2, 0x445577).setDepth(hudDepth);
    this.add.rectangle(W-100, 220, 36, 50, 0x44ff88, 0.3).setDepth(hudDepth); 
    this.foamBar = this.add.rectangle(W-100, 475, 32, 12, 0xffaa00).setDepth(hudDepth+1);
    this.resultTxt = this.add.text(W/2, 550, '', { fontSize: '20px', color: '#FFD700', fontFamily: PIXEL_FONT }).setOrigin(0.5).setDepth(hudDepth);
  }

  createSpeechBubble(x: number, y: number) {
    this.bubbleGroup = this.add.container(x, y).setDepth(30);
    this.bubbleBg = this.add.graphics();
    this.npcChatTxt = this.add.text(0, 0, '', {
      fontSize: '14px', color: '#000000', fontFamily: PIXEL_FONT,
      align: 'center', wordWrap: { width: 250 }
    }).setOrigin(0.5);
    this.bubbleGroup.add([this.bubbleBg, this.npcChatTxt]);
    this.bubbleGroup.setVisible(false);
  }

  updateBubble(content: string) {
    this.npcChatTxt.setText(content);
    const bounds = this.npcChatTxt.getBounds();
    const padding = 20;
    this.bubbleBg.clear().fillStyle(0xffffff, 1).lineStyle(3, 0x000000, 1);
    this.bubbleBg.fillRoundedRect(-(bounds.width/2+padding), -(bounds.height/2+padding), bounds.width+padding*2, bounds.height+padding*2, 15);
    this.bubbleBg.strokeRoundedRect(-(bounds.width/2+padding), -(bounds.height/2+padding), bounds.width+padding*2, bounds.height+padding*2, 15);
    const by = bounds.height/2 + padding;
    this.bubbleBg.beginPath().moveTo(-15, by).lineTo(0, by+15).lineTo(15, by).closePath().fillPath().strokePath();
    this.bubbleGroup.setVisible(true);
  }

  endGame() {
    this.bubbleGroup.setVisible(false);
    const W = 800, H = 600;
    this.add.rectangle(W/2, H/2, W, H, 0x000000, 0.8).setDepth(100);
    this.add.text(W/2, H/2 - 50, 'FINISHED!', { fontSize: '40px', fontFamily: PIXEL_FONT, color: '#FFD700' }).setOrigin(0.5).setDepth(101);
    this.add.text(W/2, H/2 + 30, `Score: ${this.score}`, { fontSize: '20px', fontFamily: PIXEL_FONT }).setOrigin(0.5).setDepth(101);
    this.add.text(W/2, H/2 + 110, '[ RETRY ]', { fontSize: '20px', fontFamily: PIXEL_FONT }).setOrigin(0.5).setDepth(101).setInteractive().on('pointerdown', () => this.scene.restart());
    this.add.text(W/2, H/2 + 160, '[ EXIT ]', { fontSize: '20px', fontFamily: PIXEL_FONT }).setOrigin(0.5).setDepth(101).setInteractive().on('pointerdown', () => {
      this.sound.stopAll();
      returnToScene(this, this.returnSceneKey);
    });
  }
}
