// @ts-nocheck
import Phaser from 'phaser';
import { applyLegacyViewport } from './viewport';
import { returnToScene } from '@features/minigame/minigameLauncher';

const PF = '"Press Start 2P"';
const W = 800;
const H = 600;

// 로또 번호 색상 (실제 로또와 동일)
const getBallColor = (num) => {
  if (num <= 10) return 0xfbc400; // 노랑
  if (num <= 20) return 0x69c8f2; // 파랑
  if (num <= 30) return 0xff7272; // 빨강
  if (num <= 40) return 0xaaaaaa; // 회색
  return 0xb0d840; // 초록
};

export default class LottoScene extends Phaser.Scene {
  private returnSceneKey = 'MainScene';

  constructor() { super({ key: 'LottoScene' }); }

  init(data) {
    this.returnSceneKey = data?.returnSceneKey || 'MainScene';
  }

  create() {
    applyLegacyViewport(this);

    this.selectedNumbers = [];
    this.drawnNumbers = [];
    this.bonusNumber = 0;
    this.isDrawing = false;
    this.phase = 'select'; // 'select', 'drawing', 'result'
    this.pendingTimers = []; // 타이머 추적용

    // 배경
    this.add.rectangle(W / 2, H / 2, W, H, 0x1a1a2e);

    // 상단 장식
    this.add.rectangle(W / 2, 0, W, 4, 0xffd700);

    // 제목
    this.add.text(W / 2, 30, '🎰 SSAFY 로또 6/45', {
      fontSize: '20px', color: '#ffd700', fontFamily: PF
    }).setOrigin(0.5);

    this.add.text(W / 2, 55, '구매 비용: 1,000 GP | 1~45 중 6개 선택', {
      fontSize: '9px', color: '#88ccff', fontFamily: PF
    }).setOrigin(0.5);

    // 당첨 확률 안내
    this.add.text(W / 2, 75, '1등: 6개 | 2등: 5개+보너스 | 3등: 5개 | 4등: 4개 | 5등: 3개', {
      fontSize: '7px', color: '#666688', fontFamily: PF
    }).setOrigin(0.5);

    // 번호 선택 영역
    this.createNumberGrid();

    // 선택된 번호 표시 영역
    this.add.rectangle(W / 2, 340, 500, 60, 0x0d1545).setStrokeStyle(3, 0xffd700);
    this.add.text(160, 320, '내 번호:', {
      fontSize: '10px', color: '#ffd700', fontFamily: PF
    });

    this.selectedBalls = [];
    for (let i = 0; i < 6; i++) {
      const x = 250 + i * 55;
      const ball = this.add.circle(x, 340, 22, 0x333355).setStrokeStyle(2, 0x555577);
      const txt = this.add.text(x, 340, '', {
        fontSize: '12px', color: '#ffffff', fontFamily: PF
      }).setOrigin(0.5);
      this.selectedBalls.push({ ball, txt });
    }

    // 추첨 결과 영역
    this.add.rectangle(W / 2, 420, 600, 80, 0x0d1545).setStrokeStyle(3, 0x44ff88);
    this.add.text(120, 395, '당첨 번호:', {
      fontSize: '10px', color: '#44ff88', fontFamily: PF
    });

    this.drawnBalls = [];
    for (let i = 0; i < 6; i++) {
      const x = 220 + i * 50;
      const ball = this.add.circle(x, 420, 20, 0x222244);
      const txt = this.add.text(x, 420, '?', {
        fontSize: '11px', color: '#444466', fontFamily: PF
      }).setOrigin(0.5);
      this.drawnBalls.push({ ball, txt });
    }

    // 보너스 번호
    this.add.text(545, 420, '+', {
      fontSize: '14px', color: '#ff6688', fontFamily: PF
    }).setOrigin(0.5);
    this.bonusBall = this.add.circle(590, 420, 20, 0x222244);
    this.bonusTxt = this.add.text(590, 420, '?', {
      fontSize: '11px', color: '#444466', fontFamily: PF
    }).setOrigin(0.5);

    // 결과 메시지
    this.resultTxt = this.add.text(W / 2, 480, '', {
      fontSize: '14px', color: '#ffffff', fontFamily: PF
    }).setOrigin(0.5);

    this.matchTxt = this.add.text(W / 2, 510, '', {
      fontSize: '10px', color: '#88ccff', fontFamily: PF
    }).setOrigin(0.5);

    // 버튼들
    this.createBtn(W / 2 - 150, 560, '자동 선택', 0x004466, 0x44aaff, () => this.autoSelect());
    this.purchaseBtn = this.createBtn(W / 2, 560, '구매하기 (1000GP)', 0x446600, 0x88ff44, () => this.purchase());
    this.createBtn(W / 2 + 150, 560, '초기화', 0x664400, 0xffaa44, () => this.resetSelection());

    // 나가기 버튼
    this.exitBtn = this.add.text(30, H - 25, '← EXIT', {
      fontSize: '10px', color: '#888888', fontFamily: PF
    }).setInteractive();
    this.exitBtn.on('pointerdown', () => {
      if (this.isDrawing) return; // 추첨 중에는 나갈 수 없음
      this.cleanup();
      returnToScene(this, this.returnSceneKey);
    });
    this.exitBtn.on('pointerover', () => this.exitBtn.setColor('#ffffff'));
    this.exitBtn.on('pointerout', () => this.exitBtn.setColor('#888888'));

    // 씬 종료 시 정리
    this.events.once('shutdown', this.shutdown, this);
    this.events.once('destroy', this.shutdown, this);
  }

  cleanup() {
    // 모든 타이머 정리
    this.pendingTimers.forEach(timer => {
      if (timer && timer.remove) timer.remove();
    });
    this.pendingTimers = [];
  }

  shutdown() {
    this.cleanup();
  }

  createNumberGrid() {
    this.numberButtons = [];
    const startX = 115;
    const startY = 115;
    const cols = 9;
    const spacing = 65;

    for (let num = 1; num <= 45; num++) {
      const col = (num - 1) % cols;
      const row = Math.floor((num - 1) / cols);
      const x = startX + col * spacing;
      const y = startY + row * 38;

      const color = getBallColor(num);
      const ball = this.add.circle(x, y, 16, color, 0.3).setInteractive().setStrokeStyle(2, color);
      const txt = this.add.text(x, y, `${num}`, {
        fontSize: '10px', color: '#ffffff', fontFamily: PF
      }).setOrigin(0.5);

      ball.on('pointerdown', () => this.toggleNumber(num));
      ball.on('pointerover', () => {
        if (!this.selectedNumbers.includes(num)) {
          ball.setAlpha(0.8);
        }
      });
      ball.on('pointerout', () => {
        if (!this.selectedNumbers.includes(num)) {
          ball.setAlpha(0.3);
        }
      });

      this.numberButtons.push({ num, ball, txt });
    }
  }

  toggleNumber(num) {
    if (this.phase !== 'select') return;

    const index = this.selectedNumbers.indexOf(num);
    const btnData = this.numberButtons.find(b => b.num === num);

    if (index > -1) {
      // 선택 해제
      this.selectedNumbers.splice(index, 1);
      btnData.ball.setAlpha(0.3);
      btnData.ball.setStrokeStyle(2, getBallColor(num));
    } else if (this.selectedNumbers.length < 6) {
      // 선택 추가
      this.selectedNumbers.push(num);
      btnData.ball.setAlpha(1);
      btnData.ball.setStrokeStyle(3, 0xffffff);
    }

    this.updateSelectedDisplay();
  }

  updateSelectedDisplay() {
    const sorted = [...this.selectedNumbers].sort((a, b) => a - b);

    for (let i = 0; i < 6; i++) {
      if (i < sorted.length) {
        const num = sorted[i];
        this.selectedBalls[i].ball.setFillStyle(getBallColor(num));
        this.selectedBalls[i].ball.setStrokeStyle(2, 0xffffff);
        this.selectedBalls[i].txt.setText(`${num}`);
      } else {
        this.selectedBalls[i].ball.setFillStyle(0x333355);
        this.selectedBalls[i].ball.setStrokeStyle(2, 0x555577);
        this.selectedBalls[i].txt.setText('');
      }
    }
  }

  autoSelect() {
    if (this.phase !== 'select') return;

    // 기존 선택 초기화
    this.selectedNumbers.forEach(num => {
      const btnData = this.numberButtons.find(b => b.num === num);
      btnData.ball.setAlpha(0.3);
      btnData.ball.setStrokeStyle(2, getBallColor(num));
    });
    this.selectedNumbers = [];

    // 랜덤 6개 선택
    const available = Array.from({ length: 45 }, (_, i) => i + 1);
    Phaser.Utils.Array.Shuffle(available);
    const selected = available.slice(0, 6);

    selected.forEach(num => {
      this.selectedNumbers.push(num);
      const btnData = this.numberButtons.find(b => b.num === num);
      btnData.ball.setAlpha(1);
      btnData.ball.setStrokeStyle(3, 0xffffff);
    });

    this.updateSelectedDisplay();
  }

  resetSelection() {
    if (this.isDrawing) return;

    // 타이머 정리
    this.cleanup();

    // 번호 선택 초기화
    this.selectedNumbers.forEach(num => {
      const btnData = this.numberButtons.find(b => b.num === num);
      if (btnData) {
        btnData.ball.setAlpha(0.3);
        btnData.ball.setStrokeStyle(2, getBallColor(num));
      }
    });
    this.selectedNumbers = [];
    this.updateSelectedDisplay();

    // 추첨 결과 초기화
    this.drawnBalls.forEach(({ ball, txt }) => {
      ball.setFillStyle(0x222244);
      ball.setStrokeStyle(0);
      txt.setText('?').setColor('#444466');
    });
    this.bonusBall.setFillStyle(0x222244);
    this.bonusBall.setStrokeStyle(0);
    this.bonusTxt.setText('?').setColor('#444466');

    // 선택된 공 스트로크 초기화
    this.selectedBalls.forEach(({ ball }) => {
      ball.setStrokeStyle(2, 0x555577);
    });

    this.resultTxt.setText('');
    this.matchTxt.setText('');
    this.phase = 'select';
  }

  purchase() {
    if (this.phase !== 'select') return;
    if (this.selectedNumbers.length !== 6) {
      this.resultTxt.setText('6개 번호를 모두 선택해주세요!').setColor('#ff6666');
      return;
    }
    if (this.isDrawing) return;

    this.isDrawing = true;
    this.phase = 'drawing';
    this.resultTxt.setText('추첨 중...').setColor('#ffff88');

    // 당첨 번호 생성 (실제 로또와 동일한 방식)
    const available = Array.from({ length: 45 }, (_, i) => i + 1);
    Phaser.Utils.Array.Shuffle(available);
    this.drawnNumbers = available.slice(0, 6).sort((a, b) => a - b);
    this.bonusNumber = available[6]; // 7번째가 보너스

    // 추첨 애니메이션
    this.animateDraw();
  }

  animateDraw() {
    // 각 공을 순차적으로 공개
    this.drawnNumbers.forEach((num, i) => {
      const timer = this.time.delayedCall(600 + i * 500, () => {
        if (!this.scene.isActive()) return; // 씬이 비활성화되면 중단
        if (!this.drawnBalls[i]) return; // 객체가 없으면 중단

        const color = getBallColor(num);
        this.drawnBalls[i].ball.setFillStyle(color);
        this.drawnBalls[i].txt.setText(`${num}`).setColor('#ffffff');

        // 일치 여부 확인
        if (this.selectedNumbers.includes(num)) {
          this.drawnBalls[i].ball.setStrokeStyle(3, 0xffffff);
          this.cameras.main.shake(100, 0.008);
        }

        // 효과음 대신 카메라 효과
        this.cameras.main.flash(50, 255, 255, 255);
      });
      this.pendingTimers.push(timer);
    });

    // 보너스 번호 공개
    const bonusTimer = this.time.delayedCall(600 + 6 * 500, () => {
      if (!this.scene.isActive()) return;
      if (!this.bonusBall) return;

      const color = getBallColor(this.bonusNumber);
      this.bonusBall.setFillStyle(color);
      this.bonusTxt.setText(`${this.bonusNumber}`).setColor('#ffffff');

      if (this.selectedNumbers.includes(this.bonusNumber)) {
        this.bonusBall.setStrokeStyle(3, 0xff6688);
      }

      this.cameras.main.flash(100, 255, 200, 100);
    });
    this.pendingTimers.push(bonusTimer);

    // 결과 표시
    const resultTimer = this.time.delayedCall(600 + 7 * 500, () => {
      if (!this.scene.isActive()) return;
      this.showResult();
    });
    this.pendingTimers.push(resultTimer);
  }

  showResult() {
    if (!this.scene.isActive()) return;

    this.isDrawing = false;
    this.phase = 'result';

    // 일치 개수 계산
    const matchCount = this.selectedNumbers.filter(n => this.drawnNumbers.includes(n)).length;
    const bonusMatch = this.selectedNumbers.includes(this.bonusNumber);

    let prize = '';
    let prizeColor = '#ffffff';
    let reward = '';

    // 실제 로또 당첨 기준
    if (matchCount === 6) {
      prize = '🏆 1등 당첨!!! 🏆';
      prizeColor = '#ffd700';
      reward = 'GP +1,000,000';
      this.celebrate(true);
    } else if (matchCount === 5 && bonusMatch) {
      prize = '🎉 2등 당첨!! 🎉';
      prizeColor = '#ff88ff';
      reward = 'GP +50,000';
      this.celebrate(true);
    } else if (matchCount === 5) {
      prize = '🎊 3등 당첨! 🎊';
      prizeColor = '#88ff88';
      reward = 'GP +10,000';
      this.celebrate(false);
    } else if (matchCount === 4) {
      prize = '✨ 4등 당첨 ✨';
      prizeColor = '#88ccff';
      reward = 'GP +5,000';
      this.celebrate(false);
    } else if (matchCount === 3) {
      prize = '⭐ 5등 당첨 ⭐';
      prizeColor = '#aaffaa';
      reward = 'GP +1,000 (본전)';
    } else {
      prize = '😢 낙첨...';
      prizeColor = '#888888';
      reward = '-1,000 GP';
    }

    this.resultTxt.setText(prize).setColor(prizeColor);
    this.matchTxt.setText(`일치: ${matchCount}개 ${bonusMatch ? '(+보너스)' : ''} | ${reward}`);

    // 일치하는 번호 하이라이트 (정렬된 순서로)
    const sorted = [...this.selectedNumbers].sort((a, b) => a - b);
    sorted.forEach((num, i) => {
      const isMatch = this.drawnNumbers.includes(num);
      const isBonusMatch = num === this.bonusNumber;

      if (this.selectedBalls[i]) {
        if (isMatch) {
          this.selectedBalls[i].ball.setStrokeStyle(4, 0x00ff00);
        } else if (isBonusMatch) {
          this.selectedBalls[i].ball.setStrokeStyle(4, 0xff6688);
        }
      }
    });
  }

  celebrate(big) {
    if (!this.scene.isActive()) return;

    const count = big ? 40 : 15;
    const colors = [0xffd700, 0xff6688, 0x88ff88, 0x88ccff, 0xff88ff];

    for (let i = 0; i < count; i++) {
      const x = Phaser.Math.Between(50, W - 50);
      const y = Phaser.Math.Between(100, H - 100);
      const color = Phaser.Utils.Array.GetRandom(colors);
      const star = this.add.star(x, y, 5, 4, 8, color);

      this.tweens.add({
        targets: star,
        y: y - Phaser.Math.Between(50, 150),
        alpha: 0,
        angle: Phaser.Math.Between(-180, 180),
        duration: Phaser.Math.Between(800, 1500),
        onComplete: () => {
          if (star && star.active) star.destroy();
        }
      });
    }

    if (big) {
      this.cameras.main.shake(500, 0.015);
      this.cameras.main.flash(300, 255, 215, 0);
    } else {
      this.cameras.main.shake(200, 0.008);
    }
  }

  createBtn(x, y, label, bg, border, cb) {
    const shadow = this.add.rectangle(x + 2, y + 2, 140, 36, 0x000000, 0.4);
    const btn = this.add.rectangle(x, y, 140, 36, bg).setInteractive().setStrokeStyle(2, border);
    const txt = this.add.text(x, y, label, {
      fontSize: '8px', color: '#ffffff', fontFamily: PF
    }).setOrigin(0.5);

    btn.on('pointerover', () => btn.setFillStyle(border));
    btn.on('pointerout', () => btn.setFillStyle(bg));
    btn.on('pointerdown', () => {
      this.cameras.main.flash(50, 255, 255, 255);
      cb();
    });

    return btn;
  }
}
