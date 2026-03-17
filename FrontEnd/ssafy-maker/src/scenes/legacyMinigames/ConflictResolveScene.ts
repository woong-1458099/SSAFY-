// @ts-nocheck
import Phaser from 'phaser';
import { installMinigamePause } from './installMinigamePause';
import { applyLegacyViewport } from './viewport';

const PF = '"Press Start 2P"';

interface CodeBlock {
  id: string;
  text: string;
  source: 'incoming' | 'current' | 'common';
}

const CHALLENGES = [
  {
    title: 'FIX PLAYER MOVEMENT',
    blocks: [
      { id: '1', text: 'function update() {', source: 'common' },
      { id: '2', text: '  const speed = 200;', source: 'current' },
      { id: '3', text: '  const speed = 250; // Buffed!', source: 'incoming' },
      { id: '4', text: '  move(speed);', source: 'common' },
      { id: '5', text: '}', source: 'common' }
    ],
    solution: ['1', '3', '4', '5'] // Choosing incoming speed
  },
  {
    title: 'REFAC AUDIO MANAGER',
    blocks: [
      { id: '1', text: 'class Audio {', source: 'common' },
      { id: '2', text: '  playBgm() {', source: 'current' },
      { id: '3', text: '  startMusic() { // Renamed', source: 'incoming' },
      { id: '4', text: '    this.sound.play();', source: 'common' },
      { id: '5', text: '  }', source: 'common' },
      { id: '6', text: '}', source: 'common' }
    ],
    solution: ['1', '3', '4', '5', '6']
  }
];

export default class ConflictResolveScene extends Phaser.Scene {
  private currentChallenge: any;
  private selectedBlocks: CodeBlock[] = [];
  private availableBlocks: CodeBlock[] = [];
  private blockObjects: Map<string, Phaser.GameObjects.Container> = new Map();
  private timeLeft = 40;
  private isEnded = false;
  private timerEvent!: Phaser.Time.TimerEvent;

  constructor() {
    super({ key: 'ConflictResolveScene' });
  }

  create() {
    applyLegacyViewport(this);
    installMinigamePause(this);

    const W = 800;
    const H = 600;

    this.currentChallenge = Phaser.Math.RND.pick(CHALLENGES);
    this.availableBlocks = [...this.currentChallenge.blocks];
    Phaser.Utils.Array.Shuffle(this.availableBlocks);

    // Background
    this.add.rectangle(W / 2, H / 2, W, H, 0x0a0a1f);
    
    // Header UI
    this.add.rectangle(W / 2, 25, W, 50, 0x1e1e3f, 0.95);
    this.add.rectangle(W / 2, 4, W, 6, 0xf14e32); // Git Orange
    this.add.text(W / 2, 10, 'GIT CONFLICT RESOLVER', { fontSize: '14px', color: '#f14e32', fontFamily: PF }).setOrigin(0.5, 0);
    
    this.timerTxt = this.add.text(W - 20, 12, `TIME: ${this.timeLeft}`, { fontSize: '9px', color: '#ffffff', fontFamily: PF }).setOrigin(1, 0);

    // Conflict Markers Info
    this.add.text(W / 2, 70, `FILE: ${this.currentChallenge.title}`, { fontSize: '10px', color: '#888888', fontFamily: PF }).setOrigin(0.5);

    // Drop Zone (Resolved Code)
    this.add.text(W / 2, 110, '--- STAGED FOR COMMIT ---', { fontSize: '8px', color: '#00ff88', fontFamily: PF }).setOrigin(0.5);
    this.dropZone = this.add.rectangle(W / 2, 250, 700, 260, 0x000000, 0.5).setStrokeStyle(2, 0x00ff88, 0.3);

    // Available Blocks UI
    this.add.text(W / 2, 400, '--- CONFLICTING CHUNKS ---', { fontSize: '8px', color: '#f14e32', fontFamily: PF }).setOrigin(0.5);
    
    this.renderAvailableBlocks();
    this.renderStagedBlocks();

    this.resultTxt = this.add.text(W / 2, 540, '', { fontSize: '14px', color: '#ffffff', fontFamily: PF }).setOrigin(0.5);
    
    // Commit Button
    this.commitBtn = this.add.container(W / 2, 575);
    const btnBg = this.add.rectangle(0, 0, 200, 36, 0xf14e32).setInteractive({ useHandCursor: true });
    const btnTxt = this.add.text(0, 0, 'PUSH CHANGES', { fontSize: '9px', color: '#ffffff', fontFamily: PF }).setOrigin(0.5);
    this.commitBtn.add([btnBg, btnTxt]);
    
    btnBg.on('pointerdown', () => this.checkSolution());
    btnBg.on('pointerover', () => btnBg.setFillStyle(0xff6b4a));
    btnBg.on('pointerout', () => btnBg.setFillStyle(0xf14e32));

    this.timerEvent = this.time.addEvent({
      delay: 1000,
      callback: () => {
          if (this.isEnded) return;
          this.timeLeft--;
          this.timerTxt.setText(`TIME: ${this.timeLeft}`);
          if (this.timeLeft <= 0) this.endGame(false);
      },
      loop: true
    });
  }

  private renderAvailableBlocks() {
    const W = 800;
    const startY = 430;
    
    this.availableBlocks.forEach((block, i) => {
        const x = W / 2;
        const y = startY + i * 32;
        
        const container = this.add.container(x, y);
        let color = 0x333333;
        if (block.source === 'current') color = 0x243a24; // Greenish
        if (block.source === 'incoming') color = 0x24243a; // Blueish
        
        const bg = this.add.rectangle(0, 0, 680, 28, color).setStrokeStyle(1, 0x666666);
        const prefix = block.source === 'current' ? '<<<< ' : (block.source === 'incoming' ? '>>>> ' : '     ');
        const txt = this.add.text(-330, 0, prefix + block.text, { fontSize: '10px', color: '#ffffff', fontFamily: 'monospace' }).setOrigin(0, 0.5);
        
        container.add([bg, txt]);
        bg.setInteractive({ useHandCursor: true });
        bg.on('pointerdown', () => this.stageBlock(block));
        
        this.blockObjects.set(block.id + '_avail', container);
    });
  }

  private renderStagedBlocks() {
    // Clear previous staged objects
    this.selectedBlocks.forEach((_, i) => {
        const obj = this.blockObjects.get(i + '_staged');
        if (obj) obj.destroy();
    });

    const W = 800;
    const startY = 140;

    this.selectedBlocks.forEach((block, i) => {
        const container = this.add.container(W / 2, startY + i * 30);
        const bg = this.add.rectangle(0, 0, 680, 26, 0x1a1a1a).setStrokeStyle(1, 0x00ff88, 0.5);
        const txt = this.add.text(-330, 0, block.text, { fontSize: '10px', color: '#00ff88', fontFamily: 'monospace' }).setOrigin(0, 0.5);
        const removeBtn = this.add.text(320, 0, '×', { fontSize: '16px', color: '#ff4444' }).setOrigin(0.5).setInteractive({ useHandCursor: true });
        
        container.add([bg, txt, removeBtn]);
        removeBtn.on('pointerdown', () => this.unstageBlock(i));
        
        this.blockObjects.set(i + '_staged', container);
    });
  }

  private stageBlock(block: CodeBlock) {
    if (this.selectedBlocks.length >= 8) return;
    this.selectedBlocks.push(block);
    this.renderStagedBlocks();
    this.sound.play('click'); // Assuming global
  }

  private unstageBlock(index: number) {
    this.selectedBlocks.splice(index, 1);
    this.renderStagedBlocks();
  }

  private checkSolution() {
    if (this.isEnded) return;
    
    const isCorrect = this.selectedBlocks.length === this.currentChallenge.solution.length &&
                      this.selectedBlocks.every((b, i) => b.id === this.currentChallenge.solution[i]);

    if (isCorrect) {
        this.endGame(true);
    } else {
        this.cameras.main.shake(200, 0.01);
        this.resultTxt.setText('CONFLICT PERSISTS! CHECK ORDER').setColor('#ff4444');
        this.time.delayedCall(1500, () => this.resultTxt.setText(''));
    }
  }

  private endGame(success: boolean) {
    this.isEnded = true;
    this.timerEvent.remove();
    this.commitBtn.setVisible(false);

    if (success) {
        this.resultTxt.setText('SUCCESSFULLY MERGED!').setColor('#00ff88');
        this.cameras.main.flash(500, 0, 255, 0, 0.2);
    } else {
        this.resultTxt.setText('TIMEOUT: DETACHED HEAD').setColor('#ff4444');
        this.cameras.main.shake(500, 0.02);
    }

    this.time.delayedCall(1500, () => {
        this.createBtn(300, 520, 'RETRY', () => this.scene.restart());
        this.createBtn(500, 520, 'BACK TO MENU', () => this.scene.start('MenuScene'));
    });
  }

  private createBtn(x: number, y: number, label: string, callback: () => void) {
      const bg = this.add.rectangle(x, y, 160, 40, 0x334466).setInteractive({ useHandCursor: true });
      const txt = this.add.text(x, y, label, { fontSize: '9px', color: '#ffffff', fontFamily: PF }).setOrigin(0.5);
      bg.on('pointerdown', callback);
      bg.on('pointerover', () => bg.setFillStyle(0x446688));
      bg.on('pointerout', () => bg.setFillStyle(0x334466));
  }
}
