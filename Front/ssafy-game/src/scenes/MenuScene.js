import Phaser from 'phaser';

export default class MenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MenuScene' });
  }

  create() {
    // 배경
    this.add.rectangle(400, 300, 800, 600, 0x1a1a2e);

    // 상단 장식 바
    this.add.rectangle(400, 8, 800, 16, 0x2E5F9F);

    // 타이틀
    this.add.text(400, 80, 'SSAFY생 키우기', {
      fontSize: '42px', color: '#FFD700',
      fontFamily: 'Arial', fontStyle: 'bold'
    }).setOrigin(0.5);

    this.add.text(400, 130, '⌨️  미니게임 센터', {
      fontSize: '22px', color: '#aaddff', fontFamily: 'Arial'
    }).setOrigin(0.5);

    // 구분선
    this.add.rectangle(400, 165, 600, 2, 0x333333);

    // 게임 카드 데이터
    const games = [
      {
        key: 'QuizScene',
        icon: '📝',
        title: '정처기 퀴즈',
        desc: '4지선다 문제를 풀어라!\n15초 안에 정답 선택',
        reward: '지능 +10  재화 +30',
        color: 0x2E5F9F,
        hoverColor: 0x3a6fc0,
        stroke: 0x4488cc
      },
      {
        key: 'TypingScene',
        icon: '⌨️',
        title: '알고리즘 타이핑',
        desc: '코드를 빠르게 타이핑!\n20초 안에 완성',
        reward: '지능 +7  재화 +20',
        color: 0x1E6F3F,
        hoverColor: 0x258a50,
        stroke: 0x44aa66
      },
      {
        key: 'DragScene',
        icon: '🧩',
        title: '코드 순서 맞추기',
        desc: '뒤섞인 코드를 드래그!\n60초 안에 정렬',
        reward: '지능 +10  재화 +30',
        color: 0x6B2E9F,
        hoverColor: 0x7d3ab5,
        stroke: 0x9944cc
      }
    ];

    // 카드 생성
    games.forEach((game, i) => {
      const y = 270 + i * 110;
      this.createGameCard(game, y);
    });

    // 하단 안내
    this.add.text(400, 575, '강의장에서 미니게임으로 능력치를 올려보세요!', {
      fontSize: '14px', color: '#555555', fontFamily: 'Arial'
    }).setOrigin(0.5);
  }

  createGameCard(game, y) {
    // 카드 배경
    const card = this.add.rectangle(400, y, 680, 95, game.color)
      .setStrokeStyle(2, game.stroke)
      .setInteractive();

    // 아이콘
    this.add.text(80, y, game.icon, {
      fontSize: '36px', fontFamily: 'Arial'
    }).setOrigin(0.5);

    // 제목
    this.add.text(160, y - 22, game.title, {
      fontSize: '20px', color: '#ffffff',
      fontFamily: 'Arial', fontStyle: 'bold'
    }).setOrigin(0, 0.5);

    // 설명
    this.add.text(160, y + 8, game.desc, {
      fontSize: '13px', color: '#cccccc',
      fontFamily: 'Arial', lineSpacing: 4
    }).setOrigin(0, 0.5);

    // 보상 텍스트
    this.add.text(690, y, '🎁 ' + game.reward, {
      fontSize: '13px', color: '#FFD700', fontFamily: 'Arial'
    }).setOrigin(1, 0.5);

    // 화살표
    this.add.text(745, y, '▶', {
      fontSize: '18px', color: '#ffffff', fontFamily: 'Arial'
    }).setOrigin(0.5);

    // 호버 효과
    card.on('pointerover', () => {
      card.setFillStyle(game.hoverColor);
      this.tweens.add({
        targets: card, scaleX: 1.02, scaleY: 1.02,
        duration: 100, ease: 'Power1'
      });
    });

    card.on('pointerout', () => {
      card.setFillStyle(game.color);
      this.tweens.add({
        targets: card, scaleX: 1, scaleY: 1,
        duration: 100, ease: 'Power1'
      });
    });

    card.on('pointerdown', () => {
      // 클릭 효과
      this.tweens.add({
        targets: card, scaleX: 0.97, scaleY: 0.97,
        duration: 80, yoyo: true, ease: 'Power1',
        onComplete: () => this.scene.start(game.key)
      });
    });
  }
}