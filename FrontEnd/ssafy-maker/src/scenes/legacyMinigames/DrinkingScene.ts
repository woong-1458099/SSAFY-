import Phaser from 'phaser';
import { applyLegacyViewport } from './viewport';
import { installMinigamePause } from './installMinigamePause';

const PF = '"Press Start 2P"';

const NPCS = [
  { name: '민수', color: 0x4499ff, comment: '"오늘 3대 운동 했는데\n맥주는 괜찮아!"' },
  { name: '명진', color: 0xff88aa, comment: '"이 분위기... 내가\n살려볼게요~"' },
  { name: '종민', color: 0xFFD700, comment: '"자자~ 다들 원샷\n가보자고!"' },
  { name: '지우', color: 0x44ff88, comment: '"오늘 하루도\n수고했습니다 🙏"' },
  { name: '효련', color: 0xcc55ff, comment: '"코드보다 이게\n더 어렵네..."' },
  { name: '연웅', color: 0xff8800, comment: '"빠르게 마시고\n빠르게 귀가!"' },
];

const ROUNDS = 5;

export default class DrinkingScene extends Phaser.Scene {
  private round = 1;
  private score = 0;
  private success = 0;
  private gameOver = false;

  private spaceKey!: Phaser.Input.Keyboard.Key;

  private foamLevel = 0;
  private foamSpeed = 0;
  private foamDir = 1;
  private foamActive = false;
  private foamClicked = false;

  private foamBar!: Phaser.GameObjects.Rectangle;
  private foamBarBg!: Phaser.GameObjects.Rectangle;
  private foamZoneTop!: Phaser.GameObjects.Rectangle;
  private foamZoneBot!: Phaser.GameObjects.Rectangle;
  private foamTxt!: Phaser.GameObjects.Text;
  private glassBody!: Phaser.GameObjects.Rectangle;
  private beerFill!: Phaser.GameObjects.Rectangle;
  private foamFill!: Phaser.GameObjects.Rectangle;
  private roundTxt!: Phaser.GameObjects.Text;
  private scoreTxt!: Phaser.GameObjects.Text;
  private instructTxt!: Phaser.GameObjects.Text;
  private resultTxt!: Phaser.GameObjects.Text;
  private npcTxt!: Phaser.GameObjects.Text;
  private npcNameTxt!: Phaser.GameObjects.Text;
  private npcBox!: Phaser.GameObjects.Rectangle;
  private npcBadge!: Phaser.GameObjects.Rectangle;
  private currentNpc = NPCS[0];
  private clickZone!: Phaser.GameObjects.Rectangle;

  constructor() {
    super({ key: 'DrinkingScene' });
  }

  create() {
    applyLegacyViewport(this);
    installMinigamePause(this);

    const W = 800, H = 600;

    this.round = 1;
    this.score = 0;
    this.success = 0;
    this.gameOver = false;

    // 배경 - 할맥 느낌
    this.add.rectangle(W/2, H/2, W, H, 0x0a0a1f);

    // 배경 테이블
    this.add.rectangle(W/2, H - 80, W, 160, 0x1a0d00);
    this.add.rectangle(W/2, H - 158, W, 6, 0x553300);

    // 그리드
    for (let x = 0; x < W; x += 40) {
      this.add.rectangle(x, H/2, 1, H, 0x112233, 0.3);
    }

    // 배경 조명 효과
    this.add.circle(W/2, 200, 300, 0xffaa00, 0.04);
    this.add.circle(W/2, 200, 200, 0xffaa00, 0.06);

    // 상단 HUD
    this.add.rectangle(W/2, 25, W, 50, 0x0d1545, 0.95);
    this.add.rectangle(W/2, 4, W, 6, 0xFFD700);
    this.add.rectangle(W/2, 50, W, 3, 0xffaa00);

    this.add.text(W/2, 10, '할맥 부어라 마시기', {
      fontSize: '13px', color: '#FFD700', fontFamily: PF
    }).setOrigin(0.5, 0);

    this.scoreTxt = this.add.text(20, 12, 'SCORE: 0', {
      fontSize: '9px', color: '#ffffff', fontFamily: PF
    });

    this.roundTxt = this.add.text(W - 20, 12, `ROUND 1 / ${ROUNDS}`, {
      fontSize: '9px', color: '#ffaa00', fontFamily: PF
    }).setOrigin(1, 0);

    // NPC 박스 (왼쪽)
    this.npcBox = this.add.rectangle(180, 300, 280, 200, 0x0d1545)
      .setStrokeStyle(3, 0xffaa00);
    this.add.rectangle(183, 303, 280, 200, 0x000000, 0.5).setDepth(-1);

    this.npcBadge = this.add.rectangle(180, 220, 100, 32, 0xffaa00);
    this.npcNameTxt = this.add.text(180, 220, '민수', {
      fontSize: '10px', color: '#000000', fontFamily: PF
    }).setOrigin(0.5);

    // NPC 픽셀 캐릭터
    this.drawNpc(180, 280);

    this.npcTxt = this.add.text(180, 360, '"오늘 3대 운동 했는데\n맥주는 괜찮아!"', {
      fontSize: '7px', color: '#ffcc88', fontFamily: PF,
      align: 'center', wordWrap: { width: 240 }
    }).setOrigin(0.5);

    // 맥주잔 (가운데)
    this.drawGlass(W/2, 300);

    // 거품 게이지 바 (오른쪽)
    this.add.text(W - 140, 80, 'FOAM', {
      fontSize: '8px', color: '#88aaff', fontFamily: PF
    }).setOrigin(0.5);

    this.add.rectangle(W - 140, 300, 40, 380, 0x223355)
      .setStrokeStyle(2, 0x445577);

    // 적정 구간 표시
    this.foamZoneTop = this.add.rectangle(W - 140, 195, 36, 4, 0x44ff88);
    this.foamZoneBot = this.add.rectangle(W - 140, 245, 36, 4, 0x44ff88);
    this.add.rectangle(W - 140, 220, 34, 46, 0x44ff88, 0.15);
    this.add.text(W - 140, 220, 'BEST\nZONE', {
      fontSize: '5px', color: '#44ff88', fontFamily: PF, align: 'center'
    }).setOrigin(0.5);

    // 거품 게이지 바 (움직이는 바)
    this.foamBar = this.add.rectangle(W - 140, 490, 32, 8, 0xffaa00);

    // 지시 텍스트
    this.instructTxt = this.add.text(W/2, 520, '거품이 적정 구간에 올 때 클릭!', {
      fontSize: '9px', color: '#aaddff', fontFamily: PF
    }).setOrigin(0.5);

    // 결과 텍스트
    this.resultTxt = this.add.text(W/2, 555, '', {
      fontSize: '13px', color: '#FFD700', fontFamily: PF
    }).setOrigin(0.5).setDepth(10);

    // 클릭 존 (마우스 클릭도 지원하되, 스페이스바를 주력으로)
    this.clickZone = this.add.rectangle(W/2, H/2, W, H, 0x000000, 0)
      .setInteractive();
    this.clickZone.on('pointerdown', this.handleClick, this);

    // 스페이스바 입력 추가
    if (this.input.keyboard) {
      this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
      this.input.keyboard.on('keydown-SPACE', this.handleClick, this);
    }

    // 씬 종료 시 정리
    this.events.once('shutdown', this.shutdown, this);
    this.events.once('destroy', this.shutdown, this);

    // 라운드 시작
    this.time.delayedCall(800, () => this.startRound());
  }

  shutdown() {
    if (this.input.keyboard) {
      this.input.keyboard.off('keydown-SPACE', this.handleClick, this);
    }
  }

  drawNpc(x: number, y: number) {
    const npc = this.currentNpc;
    // 몸통
    this.add.rectangle(x, y, 36, 44, npc.color).setStrokeStyle(2, 0xffffff);
    // 머리
    this.add.rectangle(x, y - 34, 26, 22, 0xffcc88).setStrokeStyle(2, 0xdd9944);
    // 눈
    this.add.rectangle(x + 6, y - 36, 5, 5, 0x000000);
    // 맥주잔 들기
    this.add.rectangle(x + 22, y - 4, 10, 20, npc.color);
    this.add.rectangle(x + 28, y - 4, 8, 16, 0xffdd44, 0.8)
      .setStrokeStyle(1, 0xffaa00);
  }

  drawGlass(x: number, y: number) {
    // 잔 테두리
    this.add.rectangle(x + 3, y + 3, 114, 264, 0x000000, 0.6);
    this.add.rectangle(x, y, 110, 260, 0x223355)
      .setStrokeStyle(3, 0x4488cc);

    // 맥주 채움 (노란색)
    this.beerFill = this.add.rectangle(x, y + 40, 100, 160, 0xffcc00, 0.85);

    // 거품 채움 (흰색)
    this.foamFill = this.add.rectangle(x, y - 60, 100, 40, 0xffffff, 0.9);

    // 잔 하이라이트
    this.add.rectangle(x - 38, y, 8, 220, 0xffffff, 0.1);

    // 잔 손잡이
    this.add.rectangle(x + 68, y + 40, 20, 60, 0x223355)
      .setStrokeStyle(2, 0x4488cc);

    // 거품 라벨
    this.foamTxt = this.add.text(x, y - 60, '🍺', {
      fontSize: '20px'
    }).setOrigin(0.5);
  }

  startRound() {
    if (this.gameOver) return;

    // NPC 랜덤 변경
    this.currentNpc = NPCS[(this.round - 1) % NPCS.length];
    this.npcBadge.setFillStyle(this.currentNpc.color);
    this.npcNameTxt.setText(this.currentNpc.name);
    this.npcTxt.setText(this.currentNpc.comment);

    this.foamLevel = 490; // 바닥에서 시작
    this.foamActive = true;
    this.foamClicked = false;
    this.resultTxt.setText('');

    // 라운드마다 속도 증가
    this.foamSpeed = 1.5 + this.round * 0.4;

    this.instructTxt.setText('👆 [SPACE] 를 눌러 거품을 멈춰라!');
    this.roundTxt.setText(`ROUND ${this.round} / ${ROUNDS}`);
  }

  handleClick() {
    if (!this.foamActive || this.foamClicked || this.gameOver) return;
    this.foamClicked = true;
    this.foamActive = false;

    // 판정 (195~245 사이가 BEST ZONE)
    const pos = this.foamBar.y;
    let pts = 0;
    let msg = '';
    let color = '#ffffff';

    if (pos >= 195 && pos <= 245) {
      pts = 300;
      msg = '🍺 PERFECT!';
      color = '#FFD700';
      this.success++;
      this.cameras.main.flash(150, 255, 200, 0, false);
      this.animateBeerFill(true);
    } else if (pos >= 170 && pos <= 270) {
      pts = 150;
      msg = '👍 GOOD!';
      color = '#44ff88';
      this.success++;
      this.animateBeerFill(true);
    } else if (pos >= 140 && pos <= 300) {
      pts = 50;
      msg = '😅 OKAY...';
      color = '#ffaa00';
      this.animateBeerFill(false);
    } else {
      pts = 0;
      msg = '💦 거품 폭발!';
      color = '#ff4466';
      this.cameras.main.shake(200, 0.008);
      this.animateBeerFill(false);
    }

    this.score += pts;
    this.scoreTxt.setText(`SCORE: ${this.score}`);
    this.resultTxt.setColor(color).setText(msg);

    this.time.delayedCall(1000, () => {
      this.round++;
      if (this.round > ROUNDS) {
        this.gameOver = true;
        this.time.delayedCall(500, () => this.endGame());
      } else {
        this.startRound();
      }
    });
  }

  animateBeerFill(success: boolean) {
    if (success) {
      this.tweens.add({
        targets: this.foamFill,
        scaleX: 1.1, scaleY: 1.1,
        duration: 200, yoyo: true
      });
    } else {
      this.tweens.add({
        targets: this.foamFill,
        alpha: 0.3,
        duration: 300, yoyo: true
      });
    }
  }

  update() {
    if (!this.foamActive || this.gameOver) return;

    // 거품 바 위아래 이동
    this.foamLevel -= this.foamSpeed * this.foamDir;

    if (this.foamLevel <= 110) {
      this.foamDir = -1;
    } else if (this.foamLevel >= 490) {
      this.foamDir = 1;
    }

    this.foamBar.setY(this.foamLevel);

    // 적정 구간에 있을 때 색상 변경
    if (this.foamLevel >= 195 && this.foamLevel <= 245) {
      this.foamBar.setFillStyle(0x44ff88);
      this.foamBar.setScale(1.3, 1);
    } else if (this.foamLevel >= 140 && this.foamLevel <= 300) {
      this.foamBar.setFillStyle(0xffaa00);
      this.foamBar.setScale(1.1, 1);
    } else {
      this.foamBar.setFillStyle(0xff4466);
      this.foamBar.setScale(1, 1);
    }
  }

  endGame() {
    this.children.removeAll();
    const W = 800, H = 600;

    this.add.rectangle(W/2, H/2, W, H, 0x0a0a1f);
    this.add.rectangle(W/2, 4, W, 6, 0xFFD700);

    this.add.rectangle(W/2 + 3, H/2 + 3, 640, 430, 0x000000, 0.8);
    this.add.rectangle(W/2, H/2, 640, 430, 0x0d1545);
    this.add.rectangle(W/2, H/2 - 213, 640, 4, 0xFFD700);
    this.add.rectangle(W/2, H/2 + 213, 640, 4, 0xFFD700);
    this.add.rectangle(W/2 - 318, H/2, 4, 430, 0xFFD700);
    this.add.rectangle(W/2 + 318, H/2, 4, 430, 0xFFD700);

    this.add.text(W/2, 112, '할맥 부어라 마시기', {
      fontSize: '14px', color: '#FFD700', fontFamily: PF
    }).setOrigin(0.5);
    this.add.text(W/2, 144, 'RESULT', {
      fontSize: '9px', color: '#888888', fontFamily: PF
    }).setOrigin(0.5);

    this.add.text(W/2, 205, `${this.score}`, {
      fontSize: '48px', color: '#ffffff', fontFamily: PF
    }).setOrigin(0.5);

    let grade, gradeColor, msg, reward;
    if (this.success === 5) {
      grade = 'S'; gradeColor = '#FFD700';
      msg = '🍺 주량왕 등극!';
      reward = '스트레스 -30    GP +20';
    } else if (this.success >= 4) {
      grade = 'A'; gradeColor = '#00ff88';
      msg = '👍 훌륭한 음주가!';
      reward = '스트레스 -20    GP +15';
    } else if (this.success >= 3) {
      grade = 'B'; gradeColor = '#4499ff';
      msg = '😄 즐거운 회식!';
      reward = '스트레스 -10    GP +10';
    } else {
      grade = 'C'; gradeColor = '#ff4466';
      msg = '💦 거품만 마셨다...';
      reward = '스트레스 -5';
    }

    this.add.text(W/2 + 200, 215, grade, {
      fontSize: '70px', color: gradeColor, fontFamily: PF
    }).setOrigin(0.5);

    this.add.text(W/2, 272, msg, {
      fontSize: '11px', color: gradeColor, fontFamily: PF
    }).setOrigin(0.5);

    const stats = [
      { label: 'PERFECT',  value: `${this.success} / ${ROUNDS}`, color: '#44ff88' },
      { label: 'SCORE',    value: this.score,                     color: '#ffffff' },
      { label: 'REWARD',   value: reward,                         color: '#FFD700' },
    ];

    stats.forEach((s, i) => {
      this.add.text(W/2 - 180, 325 + i * 42, s.label, {
        fontSize: '8px', color: '#888888', fontFamily: PF
      }).setOrigin(0, 0.5);
      this.add.text(W/2 + 180, 325 + i * 42, String(s.value), {
        fontSize: '9px', color: s.color, fontFamily: PF
      }).setOrigin(1, 0.5);
    });

    this.add.text(W/2, 455, 'TIP: BEST ZONE에서 클릭할수록 점수가 높아요!', {
      fontSize: '6px', color: '#445566', fontFamily: PF
    }).setOrigin(0.5);

    this.createBtn(270, 500, 'RETRY', 0x881100, 0xff4466,
      () => this.scene.restart());
    this.createBtn(530, 500, 'MENU',  0x440088, 0xcc55ff,
      () => this.scene.start('MenuScene'));
  }

  createBtn(x: number, y: number, label: string, bg: number, border: number, cb: () => void) {
    this.add.rectangle(x + 3, y + 3, 200, 48, 0x000000, 0.8);
    const btn = this.add.rectangle(x, y, 200, 44, bg)
      .setInteractive().setStrokeStyle(3, border);
    this.add.text(x, y, label, {
      fontSize: '12px', color: '#ffffff', fontFamily: PF
    }).setOrigin(0.5);
    btn.on('pointerover', () => btn.setFillStyle(border));
    btn.on('pointerout', () => btn.setFillStyle(bg));
    btn.on('pointerdown', () => {
      this.cameras.main.flash(150, 255, 255, 255, false);
      this.time.delayedCall(150, cb);
    });
  }
}