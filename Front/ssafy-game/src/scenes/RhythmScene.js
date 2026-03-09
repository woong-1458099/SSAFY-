import Phaser from 'phaser';

const PF = '"Press Start 2P"';

const SONGS = [
  {
    title: 'SSAFY RHYTHIM',
    bpm: 120,
    notes: [
      { key: 'A', time: 1000 },
      { key: 'S', time: 1500 },
      { key: 'D', time: 2000 },
      { key: 'F', time: 2500 },
      { key: 'A', time: 3000 },
      { key: 'D', time: 3500 },
      { key: 'S', time: 4000 },
      { key: 'F', time: 4500 },
      { key: 'A', time: 5000 },
      { key: 'S', time: 5000 },
      { key: 'D', time: 5500 },
      { key: 'F', time: 6000 },
      { key: 'A', time: 6500 },
      { key: 'S', time: 7000 },
      { key: 'D', time: 7500 },
      { key: 'F', time: 7500 },
      { key: 'A', time: 8000 },
      { key: 'S', time: 8500 },
      { key: 'D', time: 9000 },
      { key: 'F', time: 9500 },
    ]
  }
];

const LANES = [
  { key: 'A', x: 200, color: 0xff4466, darkColor: 0x881133 },
  { key: 'S', x: 310, color: 0xffaa00, darkColor: 0x886600 },
  { key: 'D', x: 420, color: 0x44ff88, darkColor: 0x228844 },
  { key: 'F', x: 530, color: 0x4499ff, darkColor: 0x224488 },
];

const HIT_Y = 490;
const NOTE_SPEED = 300;
const PERFECT_RANGE = 50;
const GOOD_RANGE = 90;

export default class RhythmScene extends Phaser.Scene {
  constructor() {
    super({ key: 'RhythmScene' });
  }

  create() {
    const W = 800, H = 600;

    this.score = 0;
    this.combo = 0;
    this.maxCombo = 0;
    this.perfect = 0;
    this.good = 0;
    this.miss = 0;
    this.notes = [];
    this.noteObjects = [];
    this.startTime = null;
    this.gameOver = false;

    const song = SONGS[0];
    this.songNotes = [...song.notes];

    // 배경
    this.add.rectangle(W/2, H/2, W, H, 0x0a0a1f);

    // 별
    for (let i = 0; i < 30; i++) {
      const star = this.add.rectangle(
        Phaser.Math.Between(0, W),
        Phaser.Math.Between(0, H),
        Phaser.Math.Between(1, 2),
        Phaser.Math.Between(1, 2),
        0xffffff, 0.3
      );
      this.tweens.add({
        targets: star, alpha: 0.8,
        duration: Phaser.Math.Between(500, 1500),
        yoyo: true, repeat: -1
      });
    }

    // 레인 배경
    LANES.forEach(lane => {
      // 레인 배경선
      this.add.rectangle(lane.x, H/2, 90, H, lane.darkColor, 0.15);
      // 레인 구분선
      this.add.rectangle(lane.x - 45, H/2, 2, H, 0x333355, 0.8);
    });
    this.add.rectangle(LANES[3].x + 45, H/2, 2, H, 0x333355, 0.8);

    // HIT 라인
    this.add.rectangle(W/2, HIT_Y, W, 3, 0xffffff, 0.3);

    // 판정 존 (반투명)
    LANES.forEach(lane => {
      this.add.rectangle(lane.x, HIT_Y, 80, 80, lane.color, 0.1)
        .setStrokeStyle(2, lane.color, 0.5);
    });

    // 키 버튼 (하단)
    this.keyBtns = {};
    LANES.forEach(lane => {
      const bg = this.add.rectangle(lane.x, HIT_Y + 2, 78, 76, lane.darkColor)
        .setStrokeStyle(3, lane.color);
      const label = this.add.text(lane.x, HIT_Y + 2, lane.key, {
        fontSize: '20px', color: '#ffffff', fontFamily: PF
      }).setOrigin(0.5);
      this.keyBtns[lane.key] = { bg, label };
    });

    // 상단 HUD
    this.add.rectangle(W/2, 30, W, 60, 0x0d1545, 0.9);
    this.add.rectangle(W/2, 4, W, 6, 0xFFD700);

    // 타이틀
    this.add.text(W/2, 18, song.title, {
      fontSize: '12px', color: '#FFD700', fontFamily: PF
    }).setOrigin(0.5, 0);

    // 점수
    this.scoreTxt = this.add.text(W - 20, 10, 'SCORE\n0', {
      fontSize: '9px', color: '#ffffff',
      fontFamily: PF, align: 'right'
    }).setOrigin(1, 0);

    // 콤보
    this.comboTxt = this.add.text(W/2, 50, '', {
      fontSize: '9px', color: '#FFD700', fontFamily: PF
    }).setOrigin(0.5, 0);

    // 판정 텍스트
    this.judgeTxt = this.add.text(W/2, 420, '', {
      fontSize: '14px', color: '#ffffff', fontFamily: PF
    }).setOrigin(0.5).setAlpha(0);

    // 카운트다운
    this.showCountdown();

    // 키 입력
    this.input.keyboard.on('keydown', this.handleKey, this);
  }

  showCountdown() {
    const W = 800;
    let count = 3;

    const countTxt = this.add.text(W/2, 280, '3', {
      fontSize: '60px', color: '#FFD700', fontFamily: PF
    }).setOrigin(0.5);

    const countDown = this.time.addEvent({
      delay: 800,
      repeat: 2,
      callback: () => {
        count--;
        if (count > 0) {
          countTxt.setText(String(count));
          this.tweens.add({
            targets: countTxt, scaleX: 1.3, scaleY: 1.3,
            duration: 100, yoyo: true
          });
        } else {
          countTxt.setText('GO!').setColor('#00ff88');
          this.tweens.add({
            targets: countTxt, alpha: 0,
            duration: 500,
            onComplete: () => {
              countTxt.destroy();
              this.startGame();
            }
          });
        }
      }
    });
  }

  startGame() {
    this.startTime = this.time.now;
  }

  handleKey(event) {
    if (this.gameOver || !this.startTime) return;

    const key = event.key.toUpperCase();
    const lane = LANES.find(l => l.key === key);
    if (!lane) return;

    // 키 눌림 효과
    this.keyBtns[key].bg.setFillStyle(lane.color);
    this.time.delayedCall(100, () => {
      this.keyBtns[key].bg.setFillStyle(lane.darkColor);
    });

    // 해당 레인에서 가장 가까운 노트 찾기
    const currentTime = this.time.now - this.startTime;
    const laneNotes = this.noteObjects.filter(
      n => n.laneKey === key && !n.hit
    );

    if (laneNotes.length === 0) {
      this.showJudge('MISS', 0xff4444);
      this.miss++;
      this.combo = 0;
      this.updateHUD();
      return;
    }

    // 가장 가까운 노트
    const closest = laneNotes.reduce((a, b) =>
      Math.abs(a.noteTime - currentTime) < Math.abs(b.noteTime - currentTime) ? a : b
    );

    const diff = Math.abs(closest.noteTime - currentTime);

    if (diff < PERFECT_RANGE) {
      closest.hit = true;
      closest.obj.destroy();
      this.showJudge('PERFECT!', 0xFFD700);
      this.score += 300 + this.combo * 10;
      this.perfect++;
      this.combo++;
      this.flashLane(lane);
    } else if (diff < GOOD_RANGE) {
      closest.hit = true;
      closest.obj.destroy();
      this.showJudge('GOOD', 0x44ff88);
      this.score += 100 + this.combo * 5;
      this.good++;
      this.combo++;
    } else {
      this.showJudge('MISS', 0xff4444);
      this.miss++;
      this.combo = 0;
    }

    this.maxCombo = Math.max(this.maxCombo, this.combo);
    this.updateHUD();
  }

  flashLane(lane) {
    const flash = this.add.rectangle(lane.x, 300, 90, 600, lane.color, 0.3);
    this.tweens.add({
      targets: flash, alpha: 0, duration: 150,
      onComplete: () => flash.destroy()
    });
  }

  showJudge(text, color) {
    this.judgeTxt.setText(text).setColor(
      color === 0xFFD700 ? '#FFD700' :
      color === 0x44ff88 ? '#44ff88' : '#ff4444'
    ).setAlpha(1).setScale(1);

    this.tweens.add({
      targets: this.judgeTxt,
      alpha: 0, y: 400, scaleX: 1.3, scaleY: 1.3,
      duration: 600, ease: 'Power2',
      onComplete: () => {
        this.judgeTxt.setY(420).setScale(1);
      }
    });
  }

  updateHUD() {
    this.scoreTxt.setText(`SCORE\n${this.score}`);
    this.comboTxt.setText(this.combo > 1 ? `${this.combo} COMBO!` : '');
  }

  update() {
    if (this.gameOver || !this.startTime) return;

    const currentTime = this.time.now - this.startTime;

    // 노트 스폰
    while (
      this.songNotes.length > 0 &&
      this.songNotes[0].time <= currentTime + (HIT_Y / NOTE_SPEED) * 1000
    ) {
      const noteData = this.songNotes.shift();
      this.spawnNote(noteData);
    }

    // 노트 이동
    this.noteObjects.forEach(note => {
      if (note.hit) return;
      const elapsed = currentTime - note.noteTime;
      const y = HIT_Y + (elapsed / 1000) * NOTE_SPEED;
      note.obj.setY(y);

      // 놓친 노트 처리
      if (y > 580 && !note.hit) {
        note.hit = true;
        note.obj.destroy();
        this.showJudge('MISS', 0xff4444);
        this.miss++;
        this.combo = 0;
        this.updateHUD();
      }
    });

    // 게임 종료 체크
    if (
      this.songNotes.length === 0 &&
      this.noteObjects.every(n => n.hit) &&
      currentTime > 1000
    ) {
      this.gameOver = true;
      this.time.delayedCall(1000, () => this.endGame());
    }
  }

  spawnNote(noteData) {
    const lane = LANES.find(l => l.key === noteData.key);
    if (!lane) return;

    const startY = HIT_Y - (noteData.time / 1000) * NOTE_SPEED
      + (this.time.now - this.startTime) / 1000 * NOTE_SPEED;

    // 노트 모양 (픽셀 느낌)
    const noteGroup = this.add.container(lane.x, startY);

    const shadow = this.add.rectangle(3, 3, 72, 28, 0x000000, 0.5);
    const body = this.add.rectangle(0, 0, 72, 28, lane.color);
    const shine = this.add.rectangle(-18, -6, 24, 6, 0xffffff, 0.3);
    const keyTxt = this.add.text(0, 0, noteData.key, {
      fontSize: '11px', color: '#ffffff', fontFamily: PF
    }).setOrigin(0.5);

    noteGroup.add([shadow, body, shine, keyTxt]);

    this.noteObjects.push({
      obj: noteGroup,
      laneKey: noteData.key,
      noteTime: noteData.time,
      hit: false
    });
  }

  endGame() {
    this.input.keyboard.off('keydown', this.handleKey, this);
    this.children.removeAll();

    const W = 800, H = 600;
    this.add.rectangle(W/2, H/2, W, H, 0x0a0a1f);
    this.add.rectangle(W/2, 4, W, 6, 0xFFD700);

    // 결과 박스
    this.add.rectangle(W/2 + 3, H/2 + 3, 620, 420, 0x000000, 0.8);
    this.add.rectangle(W/2, H/2, 620, 420, 0x0d1545);
    this.add.rectangle(W/2, H/2 - 208, 620, 4, 0xFFD700);
    this.add.rectangle(W/2, H/2 + 208, 620, 4, 0xFFD700);
    this.add.rectangle(W/2 - 308, H/2, 4, 420, 0xFFD700);
    this.add.rectangle(W/2 + 308, H/2, 4, 420, 0xFFD700);

    this.add.text(W/2, 110, 'RESULT', {
      fontSize: '22px', color: '#FFD700', fontFamily: PF
    }).setOrigin(0.5);

    // 점수
    this.add.text(W/2, 175, `${this.score}`, {
      fontSize: '32px', color: '#ffffff', fontFamily: PF
    }).setOrigin(0.5);

    // 판정 통계
    const stats = [
      { label: 'PERFECT', value: this.perfect, color: '#FFD700' },
      { label: 'GOOD',    value: this.good,    color: '#44ff88' },
      { label: 'MISS',    value: this.miss,    color: '#ff4466' },
      { label: 'MAX COMBO', value: this.maxCombo, color: '#aaddff' },
    ];

    stats.forEach((s, i) => {
      this.add.text(W/2 - 120, 240 + i * 40, s.label, {
        fontSize: '9px', color: '#888888', fontFamily: PF
      }).setOrigin(0, 0.5);
      this.add.text(W/2 + 120, 240 + i * 40, String(s.value), {
        fontSize: '11px', color: s.color, fontFamily: PF
      }).setOrigin(1, 0.5);
    });

    // 등급
    const total = this.perfect + this.good + this.miss;
    const acc = total > 0 ? (this.perfect + this.good * 0.5) / total : 0;
    let grade, gradeColor;
    if (acc >= 0.95) { grade = 'S'; gradeColor = '#FFD700'; }
    else if (acc >= 0.8) { grade = 'A'; gradeColor = '#00ff88'; }
    else if (acc >= 0.6) { grade = 'B'; gradeColor = '#4499ff'; }
    else { grade = 'C'; gradeColor = '#ff4466'; }

    this.add.text(W/2 + 200, 270, grade, {
      fontSize: '60px', color: gradeColor, fontFamily: PF
    }).setOrigin(0.5);

    // 보상
    const reward = acc >= 0.8 ? 'INT +7    GP +20' : 'INT +3    GP +5';
    this.add.text(W/2, 415, reward, {
      fontSize: '10px', color: '#aaddff', fontFamily: PF
    }).setOrigin(0.5);

    // 버튼
    this.createBtn(270, 490, 'RETRY', 0x001888, 0x4499ff, () => this.scene.restart());
    this.createBtn(530, 490, 'MENU',  0x440088, 0xcc55ff, () => this.scene.start('MenuScene'));
  }

  createBtn(x, y, label, bg, border, cb) {
    this.add.rectangle(x + 3, y + 3, 200, 52, 0x000000, 0.8);
    const btn = this.add.rectangle(x, y, 200, 52, bg)
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