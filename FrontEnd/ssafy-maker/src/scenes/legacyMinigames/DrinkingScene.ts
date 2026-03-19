import Phaser from 'phaser';
import { applyLegacyViewport } from './viewport';
import { installMinigamePause } from './installMinigamePause';
import { returnToScene } from '@features/minigame/minigameLauncher';

const PF = '"Press Start 2P"';

const NPCS = [
  { name: '민수', key: 'minsu', comment: '"오늘 3대 운동 했는데\n맥주는 괜찮아!"' },
  { name: '명진', key: 'thingham', comment: '"이 분위기... 내가\n살려볼게요~"' },
  { name: '종민', key: 'jin', comment: '"자자~ 다들 원샷\n가보자고!"' },
  { name: '지우', key: 'jyu', comment: '"오늘 하루도\n수고했습니다 🙏"' },
  { name: '효련', key: 'hyo', comment: '"코드보다 이게\n더 어렵네..."' },
  { name: '연웅', key: 'woong', comment: '"빠르게 마시고\n빠르게 귀가!"' },
];

const ROUNDS = 5;

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
    this.load.audio('bgm_halmac', 'assets/game/audio/BGM/beer_game.mp3');
    this.load.image('bg_table', 'assets/game/minigame/beer/beer_back.png');
    this.load.image('fg_table', 'assets/game/minigame/beer/beer_front.png');
    this.load.image('background', 'assets/game/minigame/beer/beer_background.png');

    this.load.spritesheet('beer_glass', 'assets/game/minigame/beer/beer_glass.png', { 
      frameWidth: 94, 
      frameHeight: 128 
    });

    this.load.spritesheet('halmi_anim', 'assets/game/minigame/beer/halmak.png', { 
      frameWidth: 96, 
      frameHeight: 136 
    });

    const npcList = [
      { key: "minsu", path: "assets/game/npc/minsu.png" },
      { key: "thingham", path: "assets/game/npc/myungjin.png" },
      { key: "jin", path: "assets/game/npc/jongmin.png" },
      { key: "hyo", path: "assets/game/npc/hyoryeon.png" },
      { key: "jyu", path: "assets/game/npc/jiwoo.png" },
      { key: "woong", path: "assets/game/npc/yeonwoong.png" },
    ];

    npcList.forEach(npc => {
      this.load.spritesheet(npc.key, npc.path, { frameWidth: 16, frameHeight: 32 });
    });
  }

  create() {
    applyLegacyViewport(this);
    installMinigamePause(this, this.returnSceneKey);

    const W = 800, H = 600;

    this.sound.stopAll();
    this.bgm = this.sound.add('bgm_halmac', { loop: true, volume: 0.5 });
    if (!this.sound.locked) this.bgm.play();

    this.round = 1; this.score = 0; this.success = 0; this.gameOver = false;
  this.add.image(W / 2, H / 2, 'background').setDisplaySize(W, H).setDepth(1);

    this.add.image(W/2, H/2, 'bg_table').setDisplaySize(W, H-260).setDepth(2);

    this.grandmaSprite = this.add.sprite(200, H/2 + 40, 'halmi_anim').setScale(1.5).setDepth(5);
    if (!this.anims.exists('halmi_walk')) {
      this.anims.create({
        key: 'halmi_walk',
        frames: this.anims.generateFrameNumbers('halmi_anim', { start: 0, end: 4 }),
        frameRate: 10,
        repeat: -1
      });
    }
    this.grandmaSprite.play('halmi_walk');

    this.npcSprite = this.add.sprite(W - 200, H/2 + 50, 'minsu').setScale(6).setFlipX(true).setDepth(5);

    this.add.image(W/2, H, 'fg_table').setOrigin(0.5, 1).setDisplaySize(W, 260).setDepth(10);
    this.beerFillGraphic = this.add.graphics().setDepth(14);
    this.beerGlass = this.add.sprite(W/2, 400, 'beer_glass', 0)
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
    const data = NPCS[(this.round - 1) % NPCS.length];
    this.npcSprite.setTexture(data.key);
    this.updateBubble(data.comment);

    this.beerGlass.setFrame(0);
    this.beerFillGraphic.clear(); 

    this.foamLevel = 475;
    this.foamActive = true;
    this.foamClicked = false;
    this.resultTxt.setText('');
    this.foamSpeed = 2.5 + this.round * 0.5;
    this.roundTxt.setText(`ROUND ${this.round} / ${ROUNDS}`);
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
    let msg = ''; 
    let color = '#ff4466';
    this.beerFillGraphic.clear();

    if (pos >= 195 && pos <= 245) {
      msg = '🍺 PERFECT!'; 
      color = '#FFD700'; this.success++; this.score += 300;
      this.beerGlass.setFrame(3);
    } else if (pos >= 150 && pos <= 300) {
      msg = '👍 GOOD!'; 
      color = '#44ff88'; this.success++; this.score += 150;
      this.beerGlass.setFrame(2);
    } else {
      msg = '💦 FAIL!'; 
      this.cameras.main.shake(200, 0.01);
      this.beerGlass.setFrame(1);
    }

    this.scoreTxt.setText(`SCORE: ${this.score}`);
    this.resultTxt.setColor(color).setText(msg);

    this.time.delayedCall(1500, () => {
      this.round++;
      if (this.round > ROUNDS) { this.gameOver = true; this.endGame(); }
      else { this.startRound(); }
    });
  }

  update() {
    if (!this.foamActive || this.gameOver) return;
    
    this.foamLevel -= this.foamSpeed * this.foamDir;
    if (this.foamLevel <= 125 || this.foamLevel >= 475) this.foamDir *= -1;
    this.foamBar.setY(this.foamLevel);
    this.foamBar.setFillStyle(this.foamLevel >= 195 && this.foamLevel <= 245 ? 0x44ff88 : 0xffaa00);
    this.updateBeerFill();
  }

  setupUI(W: number, H: number) {
    const hudDepth = 20;
    this.add.rectangle(W/2, 25, W, 50, 0x0d1545, 0.95).setDepth(hudDepth);
    this.scoreTxt = this.add.text(20, 15, 'SCORE: 0', { fontSize: '12px', color: '#ffffff', fontFamily: PF }).setDepth(hudDepth);
    this.roundTxt = this.add.text(W-20, 15, `ROUND 1 / ${ROUNDS}`, { fontSize: '12px', color: '#ffaa00', fontFamily: PF }).setOrigin(1,0).setDepth(hudDepth);
    this.add.rectangle(W-100, 300, 40, 350, 0x223355).setStrokeStyle(2, 0x445577).setDepth(hudDepth);
    this.add.rectangle(W-100, 220, 36, 50, 0x44ff88, 0.3).setDepth(hudDepth); 
    this.foamBar = this.add.rectangle(W-100, 475, 32, 12, 0xffaa00).setDepth(hudDepth+1);
    this.resultTxt = this.add.text(W/2, 550, '', { fontSize: '20px', color: '#FFD700', fontFamily: PF }).setOrigin(0.5).setDepth(hudDepth);
  }

  createSpeechBubble(x: number, y: number) {
    this.bubbleGroup = this.add.container(x, y).setDepth(30);
    this.bubbleBg = this.add.graphics();
    this.npcChatTxt = this.add.text(0, 0, '', {
      fontSize: '14px', color: '#000000', fontFamily: PF,
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
    this.add.text(W/2, H/2 - 50, 'FINISHED!', { fontSize: '40px', fontFamily: PF, color: '#FFD700' }).setOrigin(0.5).setDepth(101);
    this.add.text(W/2, H/2 + 30, `Score: ${this.score}`, { fontSize: '20px', fontFamily: PF }).setOrigin(0.5).setDepth(101);
    this.add.text(W/2, H/2 + 110, '[ RETRY ]', { fontSize: '20px', fontFamily: PF }).setOrigin(0.5).setDepth(101).setInteractive().on('pointerdown', () => this.scene.restart());
    this.add.text(W/2, H/2 + 160, '[ EXIT ]', { fontSize: '20px', fontFamily: PF }).setOrigin(0.5).setDepth(101).setInteractive().on('pointerdown', () => {
      this.sound.stopAll();
      returnToScene(this, this.returnSceneKey);
    });
  }
}