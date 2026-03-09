// @ts-nocheck
import Phaser from 'phaser';

const PF = '"Press Start 2P"';

export default class MenuScene extends Phaser.Scene {
  constructor() { super({ key: 'MenuScene' }); }

  create() {
    const W = 800, H = 600;
    this.add.rectangle(W / 2, H / 2, W, H, 0x0a0a1f);
    this.createStars();
    this.add.rectangle(W / 2, 6, W, 6, 0xFFD700);
    this.add.rectangle(W / 2, 68, W, 118, 0x0d1545);
    this.add.text(W / 2 + 3, 38, 'SSAFY LIFE', { fontSize: '32px', color: '#7a5f00', fontFamily: PF }).setOrigin(0.5);
    this.add.text(W / 2, 36, 'SSAFY LIFE', { fontSize: '32px', color: '#FFD700', fontFamily: PF }).setOrigin(0.5);
    this.add.text(W / 2, 82, '- MINI GAME CENTER -', { fontSize: '10px', color: '#88aaff', fontFamily: PF }).setOrigin(0.5);
    const pressText = this.add.text(W / 2, 108, '▼  SELECT GAME  ▼', { fontSize: '8px', color: '#ffffff', fontFamily: PF }).setOrigin(0.5);
    this.time.addEvent({ delay: 700, loop: true, callback: () => pressText.setVisible(!pressText.visible) });
    this.add.rectangle(W / 2, 127, W, 3, 0xFFD700);

    const randomPool = ['QuizScene', 'RhythmScene', 'DragScene', 'BugScene', 'RunnerScene', 'AimScene', 'TypingScene'];
    const games = [
      { key: 'QuizScene', title: 'QUIZ', sub: 'INFORMATION PROCESSING', desc: '15 SEC / 5 QUESTIONS', reward: 'INT+10  GP+30', level: 'EASY', levelColor: 0x00bb44, bgColor: 0x001888, borderColor: 0x4499ff, glowColor: 0x0033cc },
      { key: 'RhythmScene', title: 'RHYTHM', sub: 'KEYBOARD TIMING GAME', desc: 'A S D F / HIT NOTES', reward: 'INT+7   GP+20', level: 'NORMAL', levelColor: 0xdd8800, bgColor: 0x005518, borderColor: 0x33ff88, glowColor: 0x007722 },
      { key: 'DragScene', title: 'SORT', sub: 'CODE ORDER PUZZLE', desc: '60 SEC / DRAG & DROP', reward: 'INT+10  GP+30', level: 'HARD', levelColor: 0xcc2222, bgColor: 0x440088, borderColor: 0xcc55ff, glowColor: 0x6600aa },
      { key: 'BugScene', title: 'BUG CRUSH', sub: 'CLICK THE BUGS!', desc: '30 SEC / COMBO ATTACK', reward: 'INT+7   GP+20', level: 'NORMAL', levelColor: 0xdd8800, bgColor: 0x881100, borderColor: 0xff4466, glowColor: 0xaa1133 },
      { key: 'RunnerScene', title: 'RUNNER', sub: 'BUS STOP RUNNER', desc: 'JUMP & DODGE / ENDLESS', reward: 'AGI+7   GP+20', level: 'NORMAL', levelColor: 0xdd8800, bgColor: 0x003322, borderColor: 0x33ffcc, glowColor: 0x006644 },
      { key: 'AimScene', title: 'AIM', sub: 'AIM TRAINER', desc: '30 SEC / CLICK TARGETS', reward: 'AGI+7   GP+20', level: 'NORMAL', levelColor: 0xdd8800, bgColor: 0x220011, borderColor: 0xff4466, glowColor: 0x550022 },
      { key: 'TypingScene', title: 'TYPE', sub: 'CODE TYPING RACE', desc: '20 SEC / KEYBOARD', reward: 'INT+5   GP+10', level: 'NORMAL', levelColor: 0xdd8800, bgColor: 0x0d2a1a, borderColor: 0x44ff88, glowColor: 0x116633 },
      { key: 'RandomScene', title: 'RANDOM', sub: 'SURPRISE GAME PICK', desc: 'START A RANDOM MODE', reward: 'BONUS RUN', level: 'EVENT', levelColor: 0x3366ff, bgColor: 0x1f244f, borderColor: 0x8bb3ff, glowColor: 0x304fa3, randomPool },
    ];

    games.forEach((game, i) => {
      const col = i % 4;
      const row = Math.floor(i / 4);
      const x = 114 + col * 190;
      const y = 250 + row * 178;
      this.createSquareCard(game, x, y);
    });

    this.add.rectangle(W / 2, H - 3, W, 6, 0xFFD700);
    this.add.rectangle(W / 2, H - 16, W, 22, 0x0d1545);
    this.add.text(W / 2, H - 16, 'SSAFY 14th  S14P21E206', { fontSize: '7px', color: '#445577', fontFamily: PF }).setOrigin(0.5);
  }

  createSquareCard(game, x, y) {
    const cardW = 168, cardH = 142, hw = cardW / 2, hh = cardH / 2;
    this.add.rectangle(x + 4, y + 4, cardW, cardH, 0x000000, 0.9);
    const card = this.add.rectangle(x, y, cardW, cardH, game.bgColor).setInteractive();
    this.add.rectangle(x, y - hh, cardW + 4, 4, game.borderColor);
    this.add.rectangle(x, y + hh, cardW + 4, 4, game.borderColor);
    this.add.rectangle(x - hw, y, 4, cardH, game.borderColor);
    this.add.rectangle(x + hw, y, 4, cardH, game.borderColor);
    [[x - hw, y - hh], [x + hw, y - hh], [x - hw, y + hh], [x + hw, y + hh]].forEach(([cx, cy]) => this.add.rectangle(cx, cy, 8, 8, 0xFFD700));
    this.add.rectangle(x - 46, y - hh + 14, 66, 16, game.levelColor);
    this.add.text(x - 46, y - hh + 14, game.level, { fontSize: '5px', color: '#ffffff', fontFamily: PF }).setOrigin(0.5);
    this.add.rectangle(x - hw + 8, y + 6, 5, cardH - 40, game.borderColor, 0.35);
    this.add.text(x + 2, y - 36, game.title, { fontSize: '11px', color: '#000000', fontFamily: PF }).setOrigin(0.5);
    this.add.text(x, y - 38, game.title, { fontSize: '11px', color: '#ffffff', fontFamily: PF }).setOrigin(0.5);
    this.add.text(x, y - 15, game.sub, { fontSize: '5px', color: '#aaccff', fontFamily: PF, align: 'center', wordWrap: { width: 132 } }).setOrigin(0.5);
    this.add.rectangle(x, y - 1, cardW - 24, 2, game.borderColor, 0.4);
    this.add.text(x, y + 18, game.desc, { fontSize: '5px', color: '#556688', fontFamily: PF, align: 'center', wordWrap: { width: 128 } }).setOrigin(0.5);
    this.add.text(x, y + 44, game.reward, { fontSize: '6px', color: '#FFD700', fontFamily: PF, align: 'center' }).setOrigin(0.5);

    const arrow = this.add.text(x + hw - 16, y + hh - 14, '►', { fontSize: '11px', color: '#FFD700', fontFamily: PF }).setOrigin(0.5);
    this.time.addEvent({ delay: 500 + Math.random() * 400, loop: true, callback: () => arrow.setVisible(!arrow.visible) });

    card.on('pointerover', () => {
      card.setFillStyle(game.glowColor);
      this.tweens.add({ targets: card, scaleX: 1.03, scaleY: 1.03, duration: 80, ease: 'Power1' });
    });
    card.on('pointerout', () => {
      card.setFillStyle(game.bgColor);
      this.tweens.add({ targets: card, scaleX: 1, scaleY: 1, duration: 80, ease: 'Power1' });
    });
    card.on('pointerdown', () => {
      this.cameras.main.flash(150, 255, 255, 255, false);
      this.time.delayedCall(150, () => {
        if (game.randomPool) {
          this.scene.start(Phaser.Math.RND.pick(game.randomPool));
          return;
        }
        this.scene.start(game.key);
      });
    });
  }

  createStars() {
    for (let i = 0; i < 40; i += 1) {
      const x = Phaser.Math.Between(0, 800), y = Phaser.Math.Between(0, 600), size = Phaser.Math.Between(1, 3);
      const star = this.add.rectangle(x, y, size, size, 0xffffff, 0.5);
      this.time.addEvent({
        delay: Phaser.Math.Between(800, 2500),
        loop: true,
        callback: () => this.tweens.add({ targets: star, alpha: Phaser.Math.FloatBetween(0.1, 0.9), duration: 400, yoyo: true }),
      });
    }
  }
}
