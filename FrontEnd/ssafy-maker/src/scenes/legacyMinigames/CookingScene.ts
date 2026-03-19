// @ts-nocheck
import Phaser from 'phaser';
import { installMinigamePause } from './installMinigamePause';
import { applyLegacyViewport } from './viewport';

const PF = '"Press Start 2P"';
const W = 800;
const H = 600;


const INGREDIENTS = [
  { name: '면', frame: 0, score: 30 },
  { name: '계란', frame: 1, score: 50 },
  { name: '파', frame: 2, score: 40 },
  { name: '차슈', frame: 3, score: 70 },
  { name: '수프', frame: 4, score: 30 },
  { name: '탄것', frame: 5, score: -80, bad: true }
];

const DISHES = [
  { minScore: 1100, name: '🏆 황금 라면', desc: '전설의 라면이 완성되었습니다!', color: '#FFD700', reward: '요리 +10, GP +40' },
  { minScore: 900, name: '🍜 특제 라면', desc: '정말 맛있는 라면이네요!', color: '#ff8844', reward: '요리 +7, GP +25' },
  { minScore: 700, name: '🍥 맛있는 라면', desc: '훌륭한 라면입니다!', color: '#44ff88', reward: '요리 +5, GP +15' },
  { minScore: 400, name: '🥢 평범한 라면', desc: '그럭저럭 먹을만 해요', color: '#88ccff', reward: '요리 +3, GP +5' },
  { minScore: 0, name: '😅 퍼진 라면', desc: '면이 좀 퍼졌네요...', color: '#aaaaaa', reward: '요리 +1' },
  { minScore: -999, name: '💀 실패한 요리', desc: '이건 먹을 수 없어요...', color: '#ff4466', reward: '스트레스 +5' }
];

export default class CookingScene extends Phaser.Scene {
  constructor() { super({ key: 'CookingScene' }); }

   private bgm!: Phaser.Sound.BaseSound;

  preload() {
    this.load.audio('bgm_ramen', 'assets/game/audio/BGM/ramen_game.mp3');
    this.load.image('cooking_bg', 'assets/game/minigame/ramen/cooking_bg.png');
    this.load.spritesheet('ingredients', 'assets/game/minigame/ramen/ramen_ing.png', {
      frameWidth: 128,
      frameHeight: 128
    });

    this.load.image('pot_img', 'assets/game/minigame/ramen/pot.png');
  }

  create() {
    applyLegacyViewport(this);
    installMinigamePause(this);

    this.score = 0;
    this.timeLeft = 25;
    this.gameOver = false;
    this.caughtItems = { '면': 0, '파': 0, '수프': 0, '차슈': 0, '계란': 0, '탄것': 0 };

    this.sound.stopAll();
    this.bgm = this.sound.add('bgm_ramen', { loop: true, volume: 0.5 });
    if (!this.sound.locked) this.bgm.play();

    this.add.image(W / 2, H / 2, 'cooking_bg').setDisplaySize(W, H);

    this.add.rectangle(W / 2, 45, W, 90, 0x1a0a00, 0.85); 
    this.add.rectangle(W / 2, 0, W, 4, 0xff8822);
    this.add.rectangle(W / 2, 90, W, 3, 0x442200);

    this.add.text(W / 2, 22, '🍜 SSAFY 라면 장인', {
      fontSize: '20px', color: '#ffcc88', fontFamily: PF
    }).setOrigin(0.5);

  
    this.scoreTxt = this.add.text(30, 55, 'SCORE: 0', {
      fontSize: '14px', color: '#ffffff', fontFamily: PF 
    });

    this.timeTxt = this.add.text(W - 30, 55, 'TIME: 25', {
      fontSize: '14px', color: '#ff6644', fontFamily: PF 
    }).setOrigin(1, 0);

    this.add.rectangle(W / 2, H - 25, W, 50, 0x1a0a00, 0.9);
    this.add.text(W / 2, H - 25, '← → 방향키로 냄비 이동 | 재료를 받으세요!', {
      fontSize: '11px', color: '#aaaa88', fontFamily: PF
    }).setOrigin(0.5);

    this.pot = this.add.container(W / 2, H - 100);
    const potSprite = this.add.image(0, 0, 'pot_img').setScale(0.4);
    potSprite.setY(-10);
    this.pot.add(potSprite);

    this.ingredients = [];
    this.cursors = this.input.keyboard.createCursorKeys();

    this.timerEvent = this.time.addEvent({
      delay: 1000, callback: this.tick, callbackScope: this, loop: true
    });

    this.spawnEvent = this.time.addEvent({
      delay: 750, callback: this.spawnIngredient, callbackScope: this, loop: true
    });

    this.msgTxt = this.add.text(W / 2, H / 2, '', {
      fontSize: '26px', color: '#ffffff', fontFamily: PF 
    }).setOrigin(0.5).setAlpha(0).setDepth(100);
    this.events.once('shutdown', this.shutdown, this);
    this.events.once('destroy', this.shutdown, this);
  }

  tick() {
    if (this.gameOver) return;
    this.timeLeft--;
    this.timeTxt.setText(`TIME: ${this.timeLeft}`);

    if (this.timeLeft <= 5) {
      this.timeTxt.setColor('#ff0000');
    } else if (this.timeLeft <= 10) {
      this.timeTxt.setColor('#ff6644');
    }

    if (this.timeLeft <= 0) this.endGame();
  }

  spawnIngredient() {
    if (this.gameOver) return;

    const data = Phaser.Utils.Array.GetRandom(INGREDIENTS);
    const x = Phaser.Math.Between(80, W - 80);

    const obj = this.add.container(x, -40);
    const shadow = this.add.ellipse(0, 20, 35, 12, 0x000000, 0.2);

    const sprite = this.add.sprite(0, 0, 'ingredients', data.frame);
    sprite.setScale(0.45); 

    obj.add([shadow, sprite]);

    const elapsed = 25 - this.timeLeft; 
    const baseSpeed = 2 + (elapsed / 25) * 4;
    const speed = baseSpeed + Phaser.Math.FloatBetween(0, 2);
    obj.setData('speed', speed);

    this.ingredients.push({ obj, data });
  }

update() {
    if (this.gameOver) return;

    const speed = 8.5;
    if (this.cursors.left.isDown) this.pot.x -= speed;
    else if (this.cursors.right.isDown) this.pot.x += speed;
    this.pot.x = Phaser.Math.Clamp(this.pot.x, 80, W - 80);

    for (let i = this.ingredients.length - 1; i >= 0; i--) {
      const ing = this.ingredients[i];
      const fallSpeed = ing.obj.getData('speed') || 5;
      ing.obj.y += fallSpeed;

      const dx = Math.abs(ing.obj.x - this.pot.x);
      const dy = ing.obj.y - this.pot.y; 

      if (dx < 38 && dy > -45 && dy < 25) {
        this.catchIngredient(ing);
        this.ingredients.splice(i, 1);
      } else if (ing.obj.y > H + 50) {
        ing.obj.destroy();
        this.ingredients.splice(i, 1);
      }
    }
  }

  catchIngredient(ing) {
    this.score += ing.data.score;
    if (this.score < -200) this.score = -200; 
    this.scoreTxt.setText(`SCORE: ${this.score}`);

    this.caughtItems[ing.data.name]++;

    const isBad = ing.data.bad;
    const color = isBad ? '#ff4444' : '#44ff66'; 
    const scoreText = ing.data.score > 0 ? `+${ing.data.score}` : `${ing.data.score}`;
    this.showMsg(scoreText, color);

    if (isBad) {
      this.cameras.main.shake(150, 0.01);
      this.cameras.main.flash(100, 50, 0, 0);
    } else {
      this.cameras.main.shake(50, 0.001);
    }

    ing.obj.destroy();
  }

  showMsg(txt, color) {
    this.msgTxt.setText(txt).setColor(color).setAlpha(1).setY(this.pot.y - 70);
    this.tweens.add({
      targets: this.msgTxt,
      alpha: 0,
      y: this.pot.y - 120,
      duration: 600
    });
  }

  endGame() {
    this.gameOver = true;
    this.timerEvent.remove();
    this.spawnEvent.remove();
    this.children.removeAll();

    this.add.rectangle(W / 2, H / 2, W, H, 0x1a0a00);
    this.add.rectangle(W / 2, 0, W, 4, 0xff8822);

    this.add.rectangle(W / 2, H / 2, 580, 420, 0x2a1a0a).setStrokeStyle(4, 0xff8822); // 가로 살짝 늘림

    let dish = DISHES[DISHES.length - 1];
    for (const d of DISHES) {
      if (this.score >= d.minScore) {
        dish = d;
        break;
      }
    }

 
    this.add.text(W / 2, 120, '🍳 요리 완성!', {
      fontSize: '24px', color: '#ffcc88', fontFamily: PF
    }).setOrigin(0.5);


    this.add.text(W / 2, 180, dish.name, {
      fontSize: '28px', color: dish.color, fontFamily: PF
    }).setOrigin(0.5);

  
    this.add.text(W / 2, 230, dish.desc, {
      fontSize: '12px', color: '#ffffff', fontFamily: PF
    }).setOrigin(0.5);

  
    this.add.text(W / 2, 280, `최종 점수: ${this.score}`, {
      fontSize: '18px', color: '#ffff88', fontFamily: PF
    }).setOrigin(0.5);

    const ingText = `면 ${this.caughtItems['면']} | 수프 ${this.caughtItems['수프']} | 파 ${this.caughtItems['파']} | 계란 ${this.caughtItems['계란']} | 차슈 ${this.caughtItems['차슈']}`;
    this.add.text(W / 2, 330, ingText, {
      fontSize: '10px', color: '#88ccff', fontFamily: PF
    }).setOrigin(0.5);

    if (this.caughtItems['탄것'] > 0) {
      this.add.text(W / 2, 355, `탄 것 ${this.caughtItems['탄것']}개 받음...`, {
        fontSize: '10px', color: '#ff6666', fontFamily: PF
      }).setOrigin(0.5);
    }

    this.add.text(W / 2, 400, `보상: ${dish.reward}`, {
      fontSize: '12px', color: '#FFD700', fontFamily: PF
    }).setOrigin(0.5);

    this.createBtn(W / 2 - 120, 470, '다시하기', 0x442200, 0xff8822, () => this.scene.restart());
    this.createBtn(W / 2 + 120, 470, '메뉴', 0x222222, 0x666666, () => this.scene.start('MenuScene'));
  }

  createBtn(x, y, label, bg, border, cb) {
    this.add.rectangle(x + 2, y + 2, 180, 50, 0x000000, 0.5);
    const btn = this.add.rectangle(x, y, 180, 50, bg).setInteractive().setStrokeStyle(3, border);
    this.add.text(x, y, label, { fontSize: '14px', color: '#ffffff', fontFamily: PF }).setOrigin(0.5);
    btn.on('pointerover', () => btn.setFillStyle(border));
    btn.on('pointerout', () => btn.setFillStyle(bg));
    btn.on('pointerdown', () => {
      this.cameras.main.flash(100, 255, 255, 255, false);
      this.time.delayedCall(100, cb);
    });
  }

  shutdown() {
    if (this.timerEvent) this.timerEvent.remove();
    if (this.spawnEvent) this.spawnEvent.remove();
    if (this.cursors) {
      this.cursors.left.destroy();
      this.cursors.right.destroy();
    }
    this.ingredients = [];
  }
}