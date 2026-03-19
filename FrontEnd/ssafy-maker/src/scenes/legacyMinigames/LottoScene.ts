// @ts-nocheck
import Phaser from 'phaser';
import { applyLegacyViewport } from './viewport';

const PF = '"Press Start 2P"';

export default class LottoScene extends Phaser.Scene {
  constructor() { super({ key: 'LottoScene' }); }

  create() {
    applyLegacyViewport(this);
    const W = 800, H = 600;
    
    this.isDrawing = false;
    this.result = null;

    // 배경
    this.add.rectangle(W/2, H/2, W, H, 0x112233);
    this.add.rectangle(W/2, 4, W, 6, 0xffff00);

    // 제목
    this.add.text(W/2, 80, '대박 기원! 복권방', { fontSize: '24px', color: '#ffcc00', fontFamily: PF }).setOrigin(0.5);
    this.add.text(W/2, 120, '1등 확률: 0.1% | 2등: 1% | 3등: 5%', { fontSize: '9px', color: '#ffffff', fontFamily: PF }).setOrigin(0.5);

    // 복권 카드 베이스
    this.card = this.add.container(W/2, H/2 + 20);
    const cardBg = this.add.rectangle(0, 0, 400, 250, 0xffffff).setStrokeStyle(5, 0xccaa00);
    const cardTitle = this.add.text(0, -90, 'SSAFY 로또 777', { fontSize: '15px', color: '#444444', fontFamily: PF, fontStyle: 'bold' }).setOrigin(0.5);
    
    // 번호판 (숨겨짐)
    this.numbers = [];
    for(let i=0; i<3; i++) {
        const box = this.add.rectangle(-100 + i*100, 10, 80, 80, 0xeeeeee).setStrokeStyle(2, 0x999999);
        const txt = this.add.text(-100 + i*100, 10, '?', { fontSize: '30px', color: '#888888', fontFamily: PF }).setOrigin(0.5);
        this.card.add([box, txt]);
        this.numbers.push(txt);
    }
    this.card.add([cardBg, cardTitle]);

    // 하단 결과 메시지
    this.resTxt = this.add.text(W/2, H - 120, '행운을 시험해보세요!', { fontSize: '12px', color: '#aaddff', fontFamily: PF }).setOrigin(0.5);

    // 뽑기 버튼
    this.btn = this.add.container(W/2, H - 60);
    const btnBg = this.add.rectangle(0, 0, 240, 50, 0xffaa00).setInteractive().setStrokeStyle(3, 0xffffff);
    const btnTxt = this.add.text(0, 0, '복권 구매 (100 GP)', { fontSize: '10px', color: '#ffffff', fontFamily: PF }).setOrigin(0.5);
    this.btn.add([btnBg, btnTxt]);

    btnBg.on('pointerdown', () => this.drawLotto());
    btnBg.on('pointerover', () => btnBg.setFillStyle(0xffcc00));
    btnBg.on('pointerout', () => btnBg.setFillStyle(0xffaa00));

    // 메뉴 버튼
    const menuBtn = this.add.text(30, H - 30, 'EXIT', { fontSize: '10px', color: '#ffffff', fontFamily: PF }).setInteractive();
    menuBtn.on('pointerdown', () => this.scene.start('MenuScene'));
  }

  drawLotto() {
    if (this.isDrawing) return;
    this.isDrawing = true;
    this.resTxt.setText('결과 확인 중...');
    
    // 번호 초기화
    this.numbers.forEach(t => t.setText('?').setColor('#888888'));

    // 확률 계산
    const rand = Math.random() * 1000; // 0 ~ 999
    let winningNums = [0, 0, 0];
    let prize = '낙첨';

    if (rand < 1) { // 0.1% : 0 (1/1000)
        winningNums = [7, 7, 7];
        prize = '★ 1등 (잭팟!) ★';
    } else if (rand < 11) { // 1% : 1~10 (10/1000)
        winningNums = [Phaser.Math.Between(1, 6), 7, 7];
        prize = '!! 2등 당첨 !!';
    } else if (rand < 61) { // 5% : 11~60 (50/1000)
        winningNums = [Phaser.Math.Between(1, 9), Phaser.Math.Between(1, 9), 7];
        prize = '3등 당첨';
    } else {
        winningNums = [Phaser.Math.Between(1, 6), Phaser.Math.Between(1, 6), Phaser.Math.Between(1, 6)];
        prize = '아쉽네요... 다음 기회에!';
    }

    // 연출: 번호 하나씩 공개
    this.numbers.forEach((txt, i) => {
        this.time.delayedCall(500 + i * 500, () => {
            txt.setText(winningNums[i]);
            if(winningNums[i] === 7) txt.setColor('#ff0000');
            else txt.setColor('#333333');
            
            this.cameras.main.shake(100, 0.005);
            
            if (i === 2) {
                this.isDrawing = false;
                this.resTxt.setText(prize);
                if (prize.includes('1등') || prize.includes('2등')) {
                    this.celebrate();
                }
            }
        });
    });
  }

  celebrate() {
    // 폭죽 효과 (간단히)
    for(let i=0; i<20; i++) {
        const x = Phaser.Math.Between(100, 700);
        const y = Phaser.Math.Between(100, 500);
        const star = this.add.star(x, y, 5, 5, 10, 0xffff00);
        this.tweens.add({
            targets: star,
            y: y - 100,
            alpha: 0,
            duration: 1000,
            onComplete: () => star.destroy()
        });
    }
  }
}
