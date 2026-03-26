// @ts-nocheck
import Phaser from 'phaser';
import { installMinigamePause } from './installMinigamePause';
import { applyLegacyViewport } from './viewport';
import { returnToScene } from '@features/minigame/minigameLauncher';
import { emitMinigameReward } from '@features/minigame/minigameRewardEvents';
import { LEGACY_COOKING_SCENE_KEY } from '@features/minigame/minigameSceneKeys';
import {
  LEGACY_COOKING_ASSET_KEYS,
  LEGACY_COOKING_DISHES,
  LEGACY_COOKING_INGREDIENTS,
  preloadLegacyCookingAssets,
} from '@features/minigame/legacy/legacyCookingConfig';
import { SCREEN, PIXEL_FONT, COLORS, createBackground, createPanel, createButton } from './utils';
import { showMinigameTutorial } from './utils/minigameTutorial';
import { getMinigameCard } from '@features/minigame/minigameCatalog';

const { W, H } = SCREEN;
export default class CookingScene extends Phaser.Scene {
  private returnSceneKey = 'main';
  private completedRewardText = null;
  private rewardEmitted = false;
  private tutorialContainer = null;

  constructor() { super({ key: LEGACY_COOKING_SCENE_KEY }); }

  private bgm!: Phaser.Sound.BaseSound;

  init(data) {
    this.returnSceneKey = data?.returnSceneKey || 'main';
  }

  preload() {
    preloadLegacyCookingAssets(this);
  }

  create() {
    applyLegacyViewport(this);
    installMinigamePause(this, this.returnSceneKey);

    // 튜토리얼 표시
    const catalogData = getMinigameCard(this.scene.key);
    if (catalogData?.howToPlay) {
      this.tutorialContainer = showMinigameTutorial(this, {
        title: catalogData.title,
        howToPlay: catalogData.howToPlay,
        reward: catalogData.reward,
        onStart: () => {
          this.tutorialContainer?.destroy();
          this.tutorialContainer = null;
          this.startGame();
        },
        onBack: () => {
          returnToScene(this, this.returnSceneKey);
        }
      });
    } else {
      this.startGame();
    }
  }

  startGame() {
    this.score = 0;
    this.timeLeft = 25;
    this.gameOver = false;
    this.caughtItems = { '면': 0, '파': 0, '수프': 0, '차슈': 0, '계란': 0, '탄것': 0 };
    this.completedRewardText = null;
    this.rewardEmitted = false;

    this.sound.stopAll();
    this.bgm = this.sound.add(LEGACY_COOKING_ASSET_KEYS.bgm, { loop: true, volume: 0.5 });
    if (!this.sound.locked) this.bgm.play();

    this.add.image(W / 2, H / 2, LEGACY_COOKING_ASSET_KEYS.background).setDisplaySize(W, H);

    this.add.rectangle(W / 2, 45, W, 90, 0x1a0a00, 0.85); 
    this.add.rectangle(W / 2, 0, W, 4, 0xff8822);
    this.add.rectangle(W / 2, 90, W, 3, 0x442200);

    this.add.text(W / 2, 22, '🍜 SSAFY 라면 장인', {
      fontSize: '20px', color: '#ffcc88', fontFamily: PIXEL_FONT
    }).setOrigin(0.5);

  
    this.scoreTxt = this.add.text(30, 55, 'SCORE: 0', {
      fontSize: '14px', color: '#ffffff', fontFamily: PIXEL_FONT 
    });

    this.timeTxt = this.add.text(W - 30, 55, 'TIME: 25', {
      fontSize: '14px', color: '#ff6644', fontFamily: PIXEL_FONT 
    }).setOrigin(1, 0);

    this.add.rectangle(W / 2, H - 25, W, 50, 0x1a0a00, 0.9);
    this.add.text(W / 2, H - 25, '← → 방향키로 냄비 이동 | 재료를 받으세요!', {
      fontSize: '11px', color: '#aaaa88', fontFamily: PIXEL_FONT
    }).setOrigin(0.5);

    this.pot = this.add.container(W / 2, H - 100);
    const potSprite = this.add.image(0, 0, LEGACY_COOKING_ASSET_KEYS.pot).setScale(0.4);
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
      fontSize: '26px', color: '#ffffff', fontFamily: PIXEL_FONT 
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

    const data = Phaser.Utils.Array.GetRandom(LEGACY_COOKING_INGREDIENTS);
    const x = Phaser.Math.Between(80, W - 80);

    const obj = this.add.container(x, -40);
    const shadow = this.add.ellipse(0, 20, 35, 12, 0x000000, 0.2);

    const sprite = this.add.sprite(0, 0, LEGACY_COOKING_ASSET_KEYS.ingredients, data.frame);
    sprite.setScale(0.45); 

    obj.add([shadow, sprite]);

    const elapsed = 25 - this.timeLeft; 
    const baseSpeed = 2 + (elapsed / 25) * 4;
    const speed = baseSpeed + Phaser.Math.FloatBetween(0, 2);
    obj.setData('speed', speed);

    this.ingredients.push({ obj, data });
  }

update() {
    if (this.gameOver || !this.cursors) return;

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

    let dish = LEGACY_COOKING_DISHES[LEGACY_COOKING_DISHES.length - 1];
    for (const d of LEGACY_COOKING_DISHES) {
      if (this.score >= d.minScore) {
        dish = d;
        break;
      }
    }

 
    this.add.text(W / 2, 120, '🍳 요리 완성!', {
      fontSize: '24px', color: '#ffcc88', fontFamily: PIXEL_FONT
    }).setOrigin(0.5);


    this.add.text(W / 2, 180, dish.name, {
      fontSize: '28px', color: dish.color, fontFamily: PIXEL_FONT
    }).setOrigin(0.5);

  
    this.add.text(W / 2, 230, dish.desc, {
      fontSize: '12px', color: '#ffffff', fontFamily: PIXEL_FONT
    }).setOrigin(0.5);

  
    this.add.text(W / 2, 280, `최종 점수: ${this.score}`, {
      fontSize: '18px', color: '#ffff88', fontFamily: PIXEL_FONT
    }).setOrigin(0.5);

    const ingText = `면 ${this.caughtItems['면']} | 수프 ${this.caughtItems['수프']} | 파 ${this.caughtItems['파']} | 계란 ${this.caughtItems['계란']} | 차슈 ${this.caughtItems['차슈']}`;
    this.add.text(W / 2, 330, ingText, {
      fontSize: '10px', color: '#88ccff', fontFamily: PIXEL_FONT
    }).setOrigin(0.5);

    if (this.caughtItems['탄것'] > 0) {
      this.add.text(W / 2, 355, `탄 것 ${this.caughtItems['탄것']}개 받음...`, {
        fontSize: '10px', color: '#ff6666', fontFamily: PIXEL_FONT
      }).setOrigin(0.5);
    }

    this.add.text(W / 2, 400, `보상: ${dish.reward}`, {
      fontSize: '12px', color: '#FFD700', fontFamily: PIXEL_FONT
    }).setOrigin(0.5);
    this.completedRewardText = dish.reward;

    this.createBtn(W / 2 - 120, 470, '다시하기', 0x442200, 0xff8822, () => this.scene.restart());
    this.createBtn(W / 2 + 120, 470, '나가기', 0x222222, 0x666666, () => {
      this.emitRewardIfNeeded();
      returnToScene(this, this.returnSceneKey);
    });
  }

  createBtn(x, y, label, bg, border, cb) {
    this.add.rectangle(x + 2, y + 2, 180, 50, 0x000000, 0.5);
    const btn = this.add.rectangle(x, y, 180, 50, bg).setInteractive().setStrokeStyle(3, border);
    this.add.text(x, y, label, { fontSize: '14px', color: '#ffffff', fontFamily: PIXEL_FONT }).setOrigin(0.5);
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

  emitRewardIfNeeded() {
    if (!this.completedRewardText || this.rewardEmitted) return;
    emitMinigameReward(this, { sceneKey: this.scene.key, rewardText: this.completedRewardText });
    this.rewardEmitted = true;
  }
}
