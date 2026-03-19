// @ts-nocheck
import Phaser from 'phaser';
import { installMinigamePause } from './installMinigamePause';
import { applyLegacyViewport } from './viewport';

const PF = '"Press Start 2P"';
const W = 800;
const H = 600;

const INGREDIENTS = [
  { name: '수프', emoji: '🍜', color: 0xff4422, score: 30 },
  { name: '파', emoji: '🧅', color: 0x33cc33, score: 40 },
  { name: '계란', emoji: '🥚', color: 0xffff88, score: 50 },
  { name: '탄것', emoji: '💀', color: 0x222222, score: -80, bad: true }
];

// 점수에 따른 완성 요리
const DISHES = [
  { minScore: 800, name: '🏆 황금 라면', desc: '전설의 라면이 완성되었습니다!', color: '#FFD700', reward: '요리 +10, GP +40' },
  { minScore: 600, name: '🍜 특제 라면', desc: '정말 맛있는 라면이네요!', color: '#ff8844', reward: '요리 +7, GP +25' },
  { minScore: 400, name: '🍥 맛있는 라면', desc: '훌륭한 라면입니다!', color: '#44ff88', reward: '요리 +5, GP +15' },
  { minScore: 200, name: '🥢 평범한 라면', desc: '그럭저럭 먹을만 해요', color: '#88ccff', reward: '요리 +3, GP +5' },
  { minScore: 0, name: '😅 퍼진 라면', desc: '면이 좀 퍼졌네요...', color: '#aaaaaa', reward: '요리 +1' },
  { minScore: -999, name: '💀 실패한 요리', desc: '이건 먹을 수 없어요...', color: '#ff4466', reward: '스트레스 +5' }
];

export default class CookingScene extends Phaser.Scene {
  constructor() { super({ key: 'CookingScene' }); }

  create() {
    applyLegacyViewport(this);
    installMinigamePause(this);

    this.score = 0;
    this.timeLeft = 25;
    this.gameOver = false;
    this.caughtItems = { '수프': 0, '파': 0, '계란': 0, '탄것': 0 };

    // 배경
    this.add.rectangle(W / 2, H / 2, W, H, 0x2a1a0a);

    // 주방 타일 패턴
    const tiles = this.add.graphics();
    tiles.fillStyle(0x3a2a1a, 0.5);
    for (let i = 0; i < W; i += 60) {
      for (let j = 100; j < H - 80; j += 60) {
        if ((i / 60 + j / 60) % 2 === 0) {
          tiles.fillRect(i, j, 60, 60);
        }
      }
    }

    // 상단 UI 배경
    this.add.rectangle(W / 2, 45, W, 90, 0x1a0a00, 0.95);
    this.add.rectangle(W / 2, 0, W, 4, 0xff8822);
    this.add.rectangle(W / 2, 90, W, 3, 0x442200);

    // 제목
    this.add.text(W / 2, 22, '🍜 SSAFY 라면 장인', {
      fontSize: '20px', color: '#ffcc88', fontFamily: PF
    }).setOrigin(0.5);

    // 점수
    this.scoreTxt = this.add.text(30, 55, 'SCORE: 0', {
      fontSize: '12px', color: '#ffffff', fontFamily: PF
    });

    // 타이머
    this.timeTxt = this.add.text(W - 30, 55, 'TIME: 25', {
      fontSize: '12px', color: '#ff6644', fontFamily: PF
    }).setOrigin(1, 0);

    // 하단 안내
    this.add.rectangle(W / 2, H - 25, W, 50, 0x1a0a00, 0.9);
    this.add.text(W / 2, H - 25, '← → 방향키로 냄비 이동 | 수프/파/계란을 받으세요!', {
      fontSize: '10px', color: '#888866', fontFamily: PF
    }).setOrigin(0.5);

    // 냄비 (플레이어)
    this.pot = this.add.container(W / 2, H - 100);
    const potBody = this.add.rectangle(0, 0, 110, 55, 0x666666).setStrokeStyle(4, 0x444444);
    const potInner = this.add.rectangle(0, -5, 90, 40, 0x333333);
    const handleL = this.add.rectangle(-65, -5, 25, 12, 0x444444).setStrokeStyle(2, 0x333333);
    const handleR = this.add.rectangle(65, -5, 25, 12, 0x444444).setStrokeStyle(2, 0x333333);
    // 물 효과
    const water = this.add.rectangle(0, 0, 85, 35, 0x4488aa, 0.6);
    this.pot.add([potBody, potInner, water, handleL, handleR]);

    // 재료 배열
    this.ingredients = [];

    // 입력
    this.cursors = this.input.keyboard.createCursorKeys();

    // 타이머
    this.timerEvent = this.time.addEvent({
      delay: 1000, callback: this.tick, callbackScope: this, loop: true
    });

    // 재료 생성
    this.spawnEvent = this.time.addEvent({
      delay: 700, callback: this.spawnIngredient, callbackScope: this, loop: true
    });

    // 판정 메시지
    this.msgTxt = this.add.text(W / 2, H / 2, '', {
      fontSize: '24px', color: '#ffffff', fontFamily: PF
    }).setOrigin(0.5).setAlpha(0).setDepth(100);
  }

  tick() {
    if (this.gameOver) return;
    this.timeLeft--;
    this.timeTxt.setText(`TIME: ${this.timeLeft}`);

    // 색상 변경
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

    // 그림자
    const shadow = this.add.ellipse(0, 5, 35, 15, 0x000000, 0.3);

    // 재료 원
    const shape = this.add.circle(0, 0, 22, data.color).setStrokeStyle(3, data.bad ? 0x000000 : 0xffffff);

    // 이모지
    const emoji = this.add.text(0, 0, data.emoji, {
      fontSize: '20px'
    }).setOrigin(0.5);

    obj.add([shadow, shape, emoji]);

    // 시간에 따라 속도 증가 (처음: 2~3, 끝: 6~8)
    const elapsed = 25 - this.timeLeft; // 경과 시간
    const baseSpeed = 2 + (elapsed / 25) * 4; // 2 -> 6
    const speed = baseSpeed + Phaser.Math.FloatBetween(0, 2);
    obj.setData('speed', speed);

    this.ingredients.push({ obj, data });
  }

  update() {
    if (this.gameOver) return;

    // 냄비 이동
    const speed = 10;
    if (this.cursors.left.isDown) this.pot.x -= speed;
    else if (this.cursors.right.isDown) this.pot.x += speed;
    this.pot.x = Phaser.Math.Clamp(this.pot.x, 80, W - 80);

    // 재료 이동 및 충돌
    for (let i = this.ingredients.length - 1; i >= 0; i--) {
      const ing = this.ingredients[i];
      const fallSpeed = ing.obj.getData('speed') || 5;
      ing.obj.y += fallSpeed;

      // 충돌 검사
      const dx = Math.abs(ing.obj.x - this.pot.x);
      const dy = Math.abs(ing.obj.y - this.pot.y);

      if (dy < 35 && dx < 55) {
        this.catchIngredient(ing);
        this.ingredients.splice(i, 1);
      } else if (ing.obj.y > H + 30) {
        ing.obj.destroy();
        this.ingredients.splice(i, 1);
      }
    }
  }

  catchIngredient(ing) {
    const prevScore = this.score;
    this.score += ing.data.score;
    if (this.score < -200) this.score = -200; // 최저 점수 제한
    this.scoreTxt.setText(`SCORE: ${this.score}`);

    // 획득 카운트
    this.caughtItems[ing.data.name]++;

    // 메시지
    const isBad = ing.data.bad;
    const color = isBad ? '#ff4444' : '#44ff44';
    const scoreText = ing.data.score > 0 ? `+${ing.data.score}` : `${ing.data.score}`;
    this.showMsg(`${ing.data.emoji} ${scoreText}`, color);

    // 효과
    if (isBad) {
      this.cameras.main.shake(150, 0.01);
      this.cameras.main.flash(100, 50, 0, 0);
    } else {
      this.cameras.main.shake(50, 0.003);
    }

    ing.obj.destroy();
  }

  showMsg(txt, color) {
    this.msgTxt.setText(txt).setColor(color).setAlpha(1).setY(this.pot.y - 70);
    this.tweens.add({
      targets: this.msgTxt,
      alpha: 0,
      y: this.pot.y - 130,
      duration: 600
    });
  }

  endGame() {
    this.gameOver = true;
    this.timerEvent.remove();
    this.spawnEvent.remove();
    this.children.removeAll();

    // 배경
    this.add.rectangle(W / 2, H / 2, W, H, 0x1a0a00);
    this.add.rectangle(W / 2, 0, W, 4, 0xff8822);

    // 결과 박스
    this.add.rectangle(W / 2, H / 2, 550, 420, 0x2a1a0a).setStrokeStyle(4, 0xff8822);

    // 완성된 요리 결정
    let dish = DISHES[DISHES.length - 1];
    for (const d of DISHES) {
      if (this.score >= d.minScore) {
        dish = d;
        break;
      }
    }

    // 제목
    this.add.text(W / 2, 120, '🍳 요리 완성!', {
      fontSize: '24px', color: '#ffcc88', fontFamily: PF
    }).setOrigin(0.5);

    // 완성된 요리 이름
    this.add.text(W / 2, 180, dish.name, {
      fontSize: '28px', color: dish.color, fontFamily: PF
    }).setOrigin(0.5);

    // 설명
    this.add.text(W / 2, 230, dish.desc, {
      fontSize: '12px', color: '#ffffff', fontFamily: PF
    }).setOrigin(0.5);

    // 점수
    this.add.text(W / 2, 290, `최종 점수: ${this.score}`, {
      fontSize: '18px', color: '#ffff88', fontFamily: PF
    }).setOrigin(0.5);

    // 획득한 재료
    this.add.text(W / 2, 340, `수프 ${this.caughtItems['수프']}개 | 파 ${this.caughtItems['파']}개 | 계란 ${this.caughtItems['계란']}개`, {
      fontSize: '11px', color: '#88ccff', fontFamily: PF
    }).setOrigin(0.5);

    if (this.caughtItems['탄것'] > 0) {
      this.add.text(W / 2, 365, `탄 것 ${this.caughtItems['탄것']}개 받음...`, {
        fontSize: '10px', color: '#ff6666', fontFamily: PF
      }).setOrigin(0.5);
    }

    // 보상
    this.add.text(W / 2, 400, `보상: ${dish.reward}`, {
      fontSize: '12px', color: '#FFD700', fontFamily: PF
    }).setOrigin(0.5);

    // 버튼
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
