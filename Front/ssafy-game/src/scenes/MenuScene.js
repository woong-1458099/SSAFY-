import Phaser from 'phaser';

const PF = '"Press Start 2P"';

export default class MenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MenuScene' });
  }

  create() {
    const W = 800, H = 600;

    // 배경
    this.add.rectangle(W/2, H/2, W, H, 0x0a0a1f);

    // 별
    this.createStars();

    // 상단 골드 라인
    this.add.rectangle(W/2, 6, W, 6, 0xFFD700);

    // 타이틀 배경
    this.add.rectangle(W/2, 75, W, 130, 0x0d1545);

    // 타이틀 그림자
    this.add.text(W/2 + 3, 48, 'SSAFY LIFE', {
      fontSize: '36px', color: '#7a5f00', fontFamily: PF
    }).setOrigin(0.5);
    // 타이틀
    this.add.text(W/2, 45, 'SSAFY LIFE', {
      fontSize: '36px', color: '#FFD700', fontFamily: PF
    }).setOrigin(0.5);

    // 서브타이틀
    this.add.text(W/2, 95, '- MINI GAME CENTER -', {
      fontSize: '11px', color: '#88aaff', fontFamily: PF
    }).setOrigin(0.5);

    // 깜빡이는 안내
    const pressText = this.add.text(W/2, 125, '▼  SELECT GAME  ▼', {
      fontSize: '9px', color: '#ffffff', fontFamily: PF
    }).setOrigin(0.5);
    this.time.addEvent({
      delay: 700, loop: true,
      callback: () => pressText.setVisible(!pressText.visible)
    });

    // 하단 골드 라인
    this.add.rectangle(W/2, 140, W, 3, 0xFFD700);

    // 게임 카드
    const games = [
      {
        key: 'QuizScene',
        title: 'QUIZ',
        sub: 'INFORMATION PROCESSING',
        desc: '15 SEC  /  5 QUESTIONS',
        reward: 'INT +10    GP +30',
        level: 'EASY',
        levelColor: 0x00bb44,
        bgColor: 0x001888,
        borderColor: 0x4499ff,
        glowColor: 0x0033cc,
      },
      {
        key: 'TypingScene',
        title: 'TYPING',
        sub: 'ALGORITHM CODE INPUT',
        desc: '20 SEC  /  SPEED TYPING',
        reward: 'INT +7     GP +20',
        level: 'NORMAL',
        levelColor: 0xdd8800,
        bgColor: 0x005518,
        borderColor: 0x33ff88,
        glowColor: 0x007722,
      },
      {
        key: 'DragScene',
        title: 'SORT',
        sub: 'CODE ORDER PUZZLE',
        desc: '60 SEC  /  DRAG & DROP',
        reward: 'INT +10    GP +30',
        level: 'HARD',
        levelColor: 0xcc2222,
        bgColor: 0x440088,
        borderColor: 0xcc55ff,
        glowColor: 0x6600aa,
      }
    ];

    games.forEach((game, i) => {
      this.createCard(game, 225 + i * 135);
    });

    // 하단 바
    this.add.rectangle(W/2, H - 3, W, 6, 0xFFD700);
    this.add.rectangle(W/2, H - 18, W, 24, 0x0d1545);
    this.add.text(W/2, H - 18, 'SSAFY 14th  S14P21E206', {
      fontSize: '8px', color: '#445577', fontFamily: PF
    }).setOrigin(0.5);
  }

  createCard(game, y) {
    const W = 800;
    const cardW = 720, cardH = 115;

    // 그림자
    this.add.rectangle(W/2 + 4, y + 4, cardW, cardH, 0x000000, 0.8);

    // 카드 배경
    const card = this.add.rectangle(W/2, y, cardW, cardH, game.bgColor)
      .setInteractive();

    // 테두리 4면
    const half = cardW / 2;
    const halfH = cardH / 2;
    this.add.rectangle(W/2, y - halfH, cardW, 4, game.borderColor); // 상
    this.add.rectangle(W/2, y + halfH, cardW, 4, game.borderColor); // 하
    this.add.rectangle(W/2 - half, y, 4, cardH, game.borderColor);  // 좌
    this.add.rectangle(W/2 + half, y, 4, cardH, game.borderColor);  // 우

    // 코너 장식
    [
      [W/2 - half, y - halfH],
      [W/2 + half, y - halfH],
      [W/2 - half, y + halfH],
      [W/2 + half, y + halfH],
    ].forEach(([cx, cy]) => {
      this.add.rectangle(cx, cy, 10, 10, 0xFFD700);
    });

    // 레벨 배지
    this.add.rectangle(W/2 - 270, y - 32, 90, 24, game.levelColor);
    this.add.text(W/2 - 270, y - 32, game.level, {
      fontSize: '9px', color: '#ffffff', fontFamily: PF
    }).setOrigin(0.5);

    // 제목 그림자
    this.add.text(W/2 - 156, y - 12, game.title, {
      fontSize: '22px', color: '#000000', fontFamily: PF
    }).setOrigin(0, 0.5);
    // 제목
    this.add.text(W/2 - 158, y - 14, game.title, {
      fontSize: '22px', color: '#ffffff', fontFamily: PF
    }).setOrigin(0, 0.5);

    // 서브타이틀
    this.add.text(W/2 - 158, y + 14, game.sub, {
      fontSize: '8px', color: '#aaccff', fontFamily: PF
    }).setOrigin(0, 0.5);

    // 설명
    this.add.text(W/2 - 158, y + 36, game.desc, {
      fontSize: '8px', color: '#556688', fontFamily: PF
    }).setOrigin(0, 0.5);

    // REWARD 라벨
    this.add.text(W/2 + 295, y - 20, 'REWARD', {
      fontSize: '8px', color: '#888888', fontFamily: PF
    }).setOrigin(1, 0.5);

    // 보상 값
    this.add.text(W/2 + 295, y + 5, game.reward, {
      fontSize: '9px', color: '#FFD700', fontFamily: PF
    }).setOrigin(1, 0.5);

    // 화살표 (크고 선명하게)
    const arrow = this.add.text(W/2 + 330, y, '►', {
      fontSize: '24px', color: '#FFD700', fontFamily: PF
    }).setOrigin(0.5);

    // 화살표 깜빡임
    this.time.addEvent({
      delay: 600, loop: true,
      callback: () => arrow.setVisible(!arrow.visible)
    });

    // 왼쪽 컬러 세로 바
    this.add.rectangle(W/2 - half + 30, y, 12, cardH - 8, game.borderColor, 0.4);

    // 호버 효과
    card.on('pointerover', () => {
      card.setFillStyle(game.glowColor);
      this.tweens.add({
        targets: card, scaleX: 1.01, scaleY: 1.04,
        duration: 80, ease: 'Power1'
      });
    });
    card.on('pointerout', () => {
      card.setFillStyle(game.bgColor);
      this.tweens.add({
        targets: card, scaleX: 1, scaleY: 1,
        duration: 80, ease: 'Power1'
      });
    });
    card.on('pointerdown', () => {
      this.cameras.main.flash(150, 255, 255, 255, false);
      this.time.delayedCall(150, () => this.scene.start(game.key));
    });
  }

  createStars() {
    for (let i = 0; i < 40; i++) {
      const x = Phaser.Math.Between(0, 800);
      const y = Phaser.Math.Between(0, 600);
      const size = Phaser.Math.Between(1, 3);
      const star = this.add.rectangle(x, y, size, size, 0xffffff, 0.5);
      this.time.addEvent({
        delay: Phaser.Math.Between(800, 2500), loop: true,
        callback: () => {
          this.tweens.add({
            targets: star,
            alpha: Phaser.Math.FloatBetween(0.1, 0.9),
            duration: 400, yoyo: true
          });
        }
      });
    }
  }
}