// @ts-nocheck
import Phaser from 'phaser';

const PF = '"Press Start 2P"';

const GAME_CARDS = [
  { key: 'QuizScene', title: '퀴즈', sub: '정보처리 문제 풀이', desc: '15초 / 5문제', reward: '지능+10  골드+30', bgColor: 0x001888, borderColor: 0x4499ff, glowColor: 0x0033cc },
  { key: 'RhythmScene', title: '리듬', sub: '키보드 타이밍 게임', desc: 'A S D F 노트 입력', reward: '지능+7   골드+20', bgColor: 0x005518, borderColor: 0x33ff88, glowColor: 0x007722 },
  { key: 'DragScene', title: '정렬', sub: '코드 순서 맞추기', desc: '60초 / 드래그 앤 드롭', reward: '지능+10  골드+30', bgColor: 0x440088, borderColor: 0xcc55ff, glowColor: 0x6600aa },
  { key: 'BugScene', title: '버그잡기', sub: '버그를 빠르게 클릭', desc: '30초 / 콤보 누적', reward: '지능+7   골드+20', bgColor: 0x881100, borderColor: 0xff4466, glowColor: 0xaa1133 },
  { key: 'RunnerScene', title: '러너', sub: '장애물 점프 달리기', desc: '점프 / 회피 / 생존', reward: '민첩+7   골드+20', bgColor: 0x003322, borderColor: 0x33ffcc, glowColor: 0x006644 },
  { key: 'AimScene', title: '에임', sub: '표적 클릭 훈련', desc: '30초 / 정확도 측정', reward: '민첩+7   골드+20', bgColor: 0x220011, borderColor: 0xff4466, glowColor: 0x550022 },
  { key: 'TypingScene', title: '타이핑', sub: '코드 타이핑 레이스', desc: '20초 / 키보드 입력', reward: '지능+5   골드+10', bgColor: 0x0d2a1a, borderColor: 0x44ff88, glowColor: 0x116633 },
  { key: 'BusinessSmileScene', title: '비즈니스 웃음', sub: '웃음을 유지해 게이지 채우기', desc: '웃기 / 게이지 100 달성', reward: '매력+8   골드+20', bgColor: 0x003455, borderColor: 0x48d4ff, glowColor: 0x0d5c84 },
  { key: 'DontSmileScene', title: '웃음참기', sub: '정색 유지 챌린지', desc: '웃지 말고 끝까지 버티기', reward: '멘탈+8   골드+20', bgColor: 0x4d1020, borderColor: 0xff6a88, glowColor: 0x6d1830 },
];

export default class MenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MenuScene' });
  }

  create() {
    this.moveSpeed = 2.6;
    this.selectorOpen = false;

    this.drawCampus();
    this.createPlayer();
    this.createNpc();
    this.createHud();
    this.createSelector();

    this.cursors = this.input.keyboard.createCursorKeys();
    this.wasd = this.input.keyboard.addKeys('W,A,S,D,E,ESC');
  }

  update() {
    const nearNpc = Phaser.Math.Distance.Between(this.player.x, this.player.y, this.npc.x, this.npc.y) < 86;

    if (this.selectorOpen) {
      this.playerShadow.setVisible(false);
      this.playerPrompt.setVisible(false);

      if (Phaser.Input.Keyboard.JustDown(this.wasd.ESC)) {
        this.closeSelector();
      }
      return;
    }

    const direction = new Phaser.Math.Vector2(
      (this.wasd.D.isDown || this.cursors.right.isDown ? 1 : 0) - (this.wasd.A.isDown || this.cursors.left.isDown ? 1 : 0),
      (this.wasd.S.isDown || this.cursors.down.isDown ? 1 : 0) - (this.wasd.W.isDown || this.cursors.up.isDown ? 1 : 0),
    );

    if (direction.lengthSq() > 0) {
      direction.normalize().scale(this.moveSpeed);
      this.player.x = Phaser.Math.Clamp(this.player.x + direction.x, 42, 758);
      this.player.y = Phaser.Math.Clamp(this.player.y + direction.y, 132, 540);
      this.playerShadow.setPosition(this.player.x, this.player.y + 24).setVisible(true);
      this.animatePlayerWalk();
    } else {
      this.stopPlayerWalk();
    }

    this.playerPrompt.setVisible(nearNpc);
    if (nearNpc && Phaser.Input.Keyboard.JustDown(this.wasd.E)) {
      this.openSelector();
    }
  }

  drawCampus() {
    const W = 800;
    const H = 600;

    this.add.rectangle(W / 2, H / 2, W, H, 0x316f42);
    for (let i = 0; i < 32; i += 1) {
      this.add.circle(Phaser.Math.Between(0, W), Phaser.Math.Between(120, H), Phaser.Math.Between(18, 42), 0x3b824a, 0.18);
    }

    this.add.rectangle(W / 2, 6, W, 6, 0xffd700);
    this.add.rectangle(W / 2, 48, W, 84, 0x10243d, 0.96);
    this.add.text(28, 20, 'WASD / 방향키 이동   E 상호작용   ESC 창 닫기', {
      fontSize: '10px',
      color: '#dff8ff',
      fontFamily: PF,
    });
    this.add.text(28, 52, 'SSAFY 캠퍼스 필드', {
      fontSize: '18px',
      color: '#FFD700',
      fontFamily: PF,
    });
    this.add.text(772, 24, 'NPC 게임 마스터', {
      fontSize: '9px',
      color: '#9fd8ff',
      fontFamily: PF,
    }).setOrigin(1, 0);
    this.add.text(772, 52, '미니게임 9종 준비 완료', {
      fontSize: '9px',
      color: '#ffffff',
      fontFamily: PF,
    }).setOrigin(1, 0);

    this.add.rectangle(400, 378, 520, 136, 0xc7b98f).setStrokeStyle(4, 0x8f7a4d);
    this.add.rectangle(400, 378, 454, 74, 0xb8d4ea, 1).setStrokeStyle(3, 0x7aa2bf);
    this.add.text(400, 382, 'SSAFY 미니게임 연구실', {
      fontSize: '18px',
      color: '#22384d',
      fontFamily: PF,
    }).setOrigin(0.5);

    this.add.rectangle(128, 482, 180, 92, 0x4f3e2d).setStrokeStyle(4, 0x2e241a);
    this.add.rectangle(128, 454, 124, 46, 0x8dd0f8).setStrokeStyle(3, 0xeaf8ff);
    this.add.rectangle(128, 505, 196, 18, 0x775c41);
    this.add.rectangle(664, 474, 158, 108, 0x52392c).setStrokeStyle(4, 0x301d15);
    this.add.rectangle(664, 444, 108, 44, 0x8dd0f8).setStrokeStyle(3, 0xeaf8ff);
    this.add.rectangle(664, 509, 172, 18, 0x775c41);
    this.add.rectangle(690, 206, 120, 54, 0x1d3045).setStrokeStyle(4, 0x88d7ff);
    this.add.text(690, 206, '게임\n구역', {
      fontSize: '11px',
      color: '#ffffff',
      fontFamily: PF,
      align: 'center',
    }).setOrigin(0.5);

    this.add.rectangle(595, 332, 138, 80, 0x6b5630).setStrokeStyle(4, 0x3e2d18);
    this.add.rectangle(595, 302, 96, 18, 0xecd99a);
    this.add.text(595, 301, 'NPC 데스크', {
      fontSize: '8px',
      color: '#4a361d',
      fontFamily: PF,
    }).setOrigin(0.5);
  }

  createPlayer() {
    this.player = this.add.container(170, 420);
    const body = this.add.rectangle(0, 0, 22, 26, 0x4da3ff).setStrokeStyle(3, 0xd7f0ff);
    const head = this.add.rectangle(0, -22, 18, 18, 0xffd39f).setStrokeStyle(2, 0xbe864f);
    const hair = this.add.rectangle(0, -28, 20, 8, 0x1b2330);
    const eyeL = this.add.rectangle(-4, -22, 2, 2, 0x000000);
    const eyeR = this.add.rectangle(4, -22, 2, 2, 0x000000);
    this.legL = this.add.rectangle(-5, 20, 6, 18, 0x233a68);
    this.legR = this.add.rectangle(5, 20, 6, 18, 0x233a68);
    this.player.add([this.legL, this.legR, body, head, hair, eyeL, eyeR]);
    this.playerShadow = this.add.ellipse(170, 444, 30, 10, 0x000000, 0.25);
  }

  createNpc() {
    this.npc = this.add.container(595, 336);
    const body = this.add.rectangle(0, 0, 24, 28, 0xff8b3d).setStrokeStyle(3, 0xffd3b0);
    const head = this.add.rectangle(0, -24, 20, 18, 0xffd39f).setStrokeStyle(2, 0xbe864f);
    const visor = this.add.rectangle(0, -30, 24, 8, 0x1e3b5c);
    const badge = this.add.rectangle(0, 4, 10, 10, 0xffd700);
    this.npc.add([body, head, visor, badge]);

    this.add.text(595, 368, '게임 마스터', {
      fontSize: '7px',
      color: '#fff2cf',
      fontFamily: PF,
    }).setOrigin(0.5);

    this.playerPrompt = this.add.text(595, 402, 'E를 눌러 대화하기', {
      fontSize: '8px',
      color: '#ffffff',
      fontFamily: PF,
      backgroundColor: '#10243d',
      padding: { left: 8, right: 8, top: 6, bottom: 6 },
    }).setOrigin(0.5).setVisible(false);
  }

  createHud() {
    this.add.rectangle(400, 576, 800, 48, 0x08111f, 0.96);
    this.add.text(24, 560, 'NPC에게 다가가 E를 누르면 미니게임 목록이 열립니다.', {
      fontSize: '9px',
      color: '#d9f2ff',
      fontFamily: PF,
    });
    this.add.text(24, 578, '미니게임 중 ESC는 일시정지, Pause 상태에서 E는 재개, ESC는 종료입니다.', {
      fontSize: '8px',
      color: '#88c7e9',
      fontFamily: PF,
    });
  }

  createSelector() {
    this.selectorRoot = this.add.container(0, 0).setDepth(30).setVisible(false);
    const overlay = this.add.rectangle(400, 300, 800, 600, 0x02050b, 0.72);
    const panel = this.add.rectangle(400, 300, 726, 454, 0x0d1545, 0.98).setStrokeStyle(4, 0xffd700);
    const title = this.add.text(400, 108, 'NPC 미니게임 선택', {
      fontSize: '18px',
      color: '#FFD700',
      fontFamily: PF,
    }).setOrigin(0.5);
    const guide = this.add.text(400, 142, '카드를 클릭하면 시작합니다. ESC를 누르면 창이 닫힙니다.', {
      fontSize: '8px',
      color: '#dff8ff',
      fontFamily: PF,
    }).setOrigin(0.5);

    this.selectorRoot.add([overlay, panel, title, guide]);

    GAME_CARDS.forEach((game, index) => {
      const col = index % 3;
      const row = Math.floor(index / 3);
      const x = 182 + col * 218;
      const y = 238 + row * 112;
      this.selectorRoot.add(this.createCard(game, x, y));
    });
  }

  createCard(game, x, y) {
    const container = this.add.container(0, 0);
    const shadow = this.add.rectangle(x + 4, y + 4, 188, 88, 0x000000, 0.66);
    const card = this.add.rectangle(x, y, 188, 88, game.bgColor).setInteractive().setStrokeStyle(3, game.borderColor);
    const title = this.add.text(x, y - 18, game.title, { fontSize: '10px', color: '#ffffff', fontFamily: PF }).setOrigin(0.5);
    const sub = this.add.text(x, y + 1, game.sub, {
      fontSize: '5px',
      color: '#bfe4ff',
      fontFamily: PF,
      align: 'center',
      wordWrap: { width: 164 },
    }).setOrigin(0.5);
    const desc = this.add.text(x, y + 22, game.desc, {
      fontSize: '4px',
      color: '#d8e7f8',
      fontFamily: PF,
      align: 'center',
      wordWrap: { width: 166 },
    }).setOrigin(0.5);
    const reward = this.add.text(x, y + 34, game.reward, {
      fontSize: '4px',
      color: '#FFD700',
      fontFamily: PF,
    }).setOrigin(0.5);

    card.on('pointerover', () => {
      card.setFillStyle(game.glowColor);
      this.tweens.add({ targets: card, scaleX: 1.03, scaleY: 1.03, duration: 80 });
    });
    card.on('pointerout', () => {
      card.setFillStyle(game.bgColor);
      this.tweens.add({ targets: card, scaleX: 1, scaleY: 1, duration: 80 });
    });
    card.on('pointerdown', () => this.startSelectedGame(game.key));

    container.add([shadow, card, title, sub, desc, reward]);
    return container;
  }

  animatePlayerWalk() {
    if (this.walkTween) {
      return;
    }

    this.walkTween = this.tweens.add({
      targets: [this.legL, this.legR],
      angle: { from: -12, to: 12 },
      duration: 160,
      yoyo: true,
      repeat: -1,
    });
  }

  stopPlayerWalk() {
    if (!this.walkTween) {
      return;
    }

    this.walkTween.stop();
    this.walkTween = null;
    this.legL.setAngle(0);
    this.legR.setAngle(0);
  }

  openSelector() {
    this.selectorOpen = true;
    this.selectorRoot.setVisible(true);
  }

  closeSelector() {
    this.selectorOpen = false;
    this.selectorRoot.setVisible(false);
  }

  startSelectedGame(sceneKey) {
    this.cameras.main.flash(160, 255, 255, 255, false);
    this.time.delayedCall(160, () => this.scene.start(sceneKey));
  }
}
