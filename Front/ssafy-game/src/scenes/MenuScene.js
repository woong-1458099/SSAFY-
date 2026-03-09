import Phaser from 'phaser';

const PIXEL_FONT = '"Press Start 2P"';

export default class MenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MenuScene' });
  }

  create() {
    const W = 800, H = 600;

    // 배경 - 체커보드 패턴
    for (let x = 0; x < W; x += 32) {
      for (let y = 0; y < H; y += 32) {
        const color = ((x + y) / 32) % 2 === 0 ? 0x1a1a2e : 0x16213e;
        this.add.rectangle(x + 16, y + 16, 32, 32, color);
      }
    }

    // 상단 타이틀 배경
    this.add.rectangle(W/2, H/2, W, H, 0x0a0a1f);
    // 픽셀 테두리 효과 (상하)
    this.add.rectangle(W/2, 10, W, 8, 0xFFD700);
    this.add.rectangle(W/2, 130, W, 4, 0xFFD700);

    // 타이틀 그림자 효과
    this.add.text(W/2 + 4, 44, 'SSAFY LIFE', {
      fontSize: '28px', color: '#8B6914',
      fontFamily: PIXEL_FONT
    }).setOrigin(0.5);
    this.add.text(W/2, 40, 'SSAFY LIFE', {
      fontSize: '28px', color: '#FFD700',
      fontFamily: PIXEL_FONT
    }).setOrigin(0.5);

    // 서브타이틀
    this.add.text(W/2, 90, '- MINI GAME CENTER -', {
      fontSize: '10px', color: '#aaddff',
      fontFamily: PIXEL_FONT
    }).setOrigin(0.5);

    // 깜빡이는 Press Start 텍스트
    const pressText = this.add.text(W/2, 118, '▼ SELECT GAME ▼', {
      fontSize: '8px', color: '#ffffff',
      fontFamily: PIXEL_FONT
    }).setOrigin(0.5);
    this.time.addEvent({
      delay: 600, loop: true,
      callback: () => pressText.setVisible(!pressText.visible)
    });

    // 게임 카드 데이터
    const games = [
      {
        key: 'QuizScene',
        icon: '📝',
        title: 'QUIZ',
        subtitle: '정처기 퀴즈',
        desc: '15SEC / 5 QUESTIONS',
        reward: 'INT+10  GP+30',
        bgColor: 0x0f3460,
        borderColor: 0x4488ff,
        glowColor: 0x2255cc,
        level: 'EASY'
      },
      {
        key: 'TypingScene',
        icon: '⌨️',
        title: 'TYPING',
        subtitle: '알고리즘 타이핑',
        desc: '20SEC / CODE INPUT',
        reward: 'INT+7  GP+20',
        bgColor: 0x0f3d1f,
        borderColor: 0x44ff88,
        glowColor: 0x226633,
        level: 'NORMAL'
      },
      {
        key: 'DragScene',
        icon: '🧩',
        title: 'SORT',
        subtitle: '코드 순서 맞추기',
        desc: '60SEC / DRAG & DROP',
        reward: 'INT+10  GP+30',
        bgColor: 0x2d0f3d,
        borderColor: 0xcc44ff,
        glowColor: 0x661199,
        level: 'HARD'
      }
    ];

    games.forEach((game, i) => {
      this.createPixelCard(game, 210 + i * 130);
    });

    // 하단 바
    this.add.rectangle(W/2, 590, W, 20, 0x0f3460);
    this.add.rectangle(W/2, 581, W, 2, 0xFFD700);
    this.add.text(W/2, 590, 'SSAFY 14th  S14P21E206', {
      fontSize: '7px', color: '#555577',
      fontFamily: PIXEL_FONT
    }).setOrigin(0.5);

    // 별 파티클 효과
    this.createStars();
  }

  createPixelCard(game, y) {
    const x = 400;

    // 카드 외곽 테두리 (픽셀 느낌)
    this.add.rectangle(x + 3, y + 3, 700, 110, 0x000000); // 그림자
    const cardBg = this.add.rectangle(x, y, 700, 110, game.bgColor);

    // 픽셀 테두리 (4면)
    this.add.rectangle(x, y - 53, 700, 4, game.borderColor); // 상
    this.add.rectangle(x, y + 53, 700, 4, game.borderColor); // 하
    this.add.rectangle(x - 348, y, 4, 110, game.borderColor); // 좌
    this.add.rectangle(x + 348, y, 4, 110, game.borderColor); // 우

    // 코너 픽셀 (포켓몬 스타일)
    const corners = [
      [x - 348, y - 53], [x + 348, y - 53],
      [x - 348, y + 53], [x + 348, y + 53]
    ];
    corners.forEach(([cx, cy]) => {
      this.add.rectangle(cx, cy, 8, 8, 0xFFD700);
    });

    // 레벨 배지
    const levelColor = game.level === 'EASY' ? 0x00cc44
      : game.level === 'NORMAL' ? 0xffaa00 : 0xff4444;
    this.add.rectangle(x - 270, y - 32, 70, 20, levelColor);
    this.add.text(x - 270, y - 32, game.level, {
      fontSize: '7px', color: '#ffffff',
      fontFamily: PIXEL_FONT
    }).setOrigin(0.5);

    // 아이콘
    this.add.text(x - 300, y + 5, game.icon, {
      fontSize: '30px'
    }).setOrigin(0.5);

    // 제목 (그림자 효과)
    this.add.text(x - 181, y - 18, game.title, {
      fontSize: '16px', color: '#000000',
      fontFamily: PIXEL_FONT
    }).setOrigin(0, 0.5);
    this.add.text(x - 183, y - 20, game.title, {
      fontSize: '16px', color: '#ffffff',
      fontFamily: PIXEL_FONT
    }).setOrigin(0, 0.5);

    // 서브타이틀
    this.add.text(x - 183, y + 5, game.subtitle, {
      fontSize: '9px', color: '#aaaaaa',
      fontFamily: PIXEL_FONT
    }).setOrigin(0, 0.5);

    // 설명
    this.add.text(x - 183, y + 28, game.desc, {
      fontSize: '8px', color: '#666688',
      fontFamily: PIXEL_FONT
    }).setOrigin(0, 0.5);

    // 보상
    this.add.text(x + 290, y - 10, 'REWARD', {
      fontSize: '7px', color: '#888888',
      fontFamily: PIXEL_FONT
    }).setOrigin(1, 0.5);
    this.add.text(x + 290, y + 12, game.reward, {
      fontSize: '8px', color: '#FFD700',
      fontFamily: PIXEL_FONT
    }).setOrigin(1, 0.5);

    // 화살표 (깜빡임)
    const arrow = this.add.text(x + 320, y, '►', {
      fontSize: '16px', color: game.borderColor === 0x4488ff ? '#4488ff'
        : game.borderColor === 0x44ff88 ? '#44ff88' : '#cc44ff',
      fontFamily: PIXEL_FONT
    }).setOrigin(0.5);

    this.time.addEvent({
      delay: 500 + Math.random() * 300, loop: true,
      callback: () => arrow.setVisible(!arrow.visible)
    });

    // 인터랙션
    cardBg.setInteractive();

    cardBg.on('pointerover', () => {
      cardBg.setFillStyle(game.glowColor);
      this.tweens.add({
        targets: cardBg, scaleX: 1.01, scaleY: 1.05,
        duration: 80, ease: 'Power1'
      });
    });

    cardBg.on('pointerout', () => {
      cardBg.setFillStyle(game.bgColor);
      this.tweens.add({
        targets: cardBg, scaleX: 1, scaleY: 1,
        duration: 80, ease: 'Power1'
      });
    });

    cardBg.on('pointerdown', () => {
      this.cameras.main.flash(200, 255, 255, 255, false);
      this.time.delayedCall(200, () => this.scene.start(game.key));
    });
  }

  createStars() {
    for (let i = 0; i < 30; i++) {
      const x = Phaser.Math.Between(0, 800);
      const y = Phaser.Math.Between(0, 600);
      const size = Phaser.Math.Between(1, 3);
      const star = this.add.rectangle(x, y, size, size, 0xffffff, 0.4);

      this.time.addEvent({
        delay: Phaser.Math.Between(500, 2000),
        loop: true,
        callback: () => {
          this.tweens.add({
            targets: star, alpha: Phaser.Math.FloatBetween(0.1, 0.8),
            duration: 400, yoyo: true
          });
        }
      });
    }
  }
}