import Phaser from "phaser";
import { SceneKey } from "@shared/enums/sceneKey";

export class NewCharacterScene extends Phaser.Scene {
  private userName: string = "싸피생";
  private gender: 'male' | 'female' = 'male';
  private hairIndex: number = 1;
  private clothIndex: number = 1;

  private readonly MAX_HAIR = 3;
  private readonly MAX_CLOTH = 3;
  private readonly FONT_FAMILY = 'PFStardustBold';

  private readonly FRAME_WIDTH = 16; 
  private readonly FRAME_HEIGHT = 32;

  private characterPreview!: Phaser.GameObjects.Container;
  private charBase!: Phaser.GameObjects.Sprite;
  private charCloth!: Phaser.GameObjects.Sprite; 
  private charHair!: Phaser.GameObjects.Sprite; 
  
  private bgm!: Phaser.Sound.BaseSound;
  private nameText!: Phaser.GameObjects.Text;
  private maleBtn!: Phaser.GameObjects.Image;
  private femaleBtn!: Phaser.GameObjects.Image;
  private hairButtons: Phaser.GameObjects.Text[] = [];
  private clothButtons: Phaser.GameObjects.Text[] = [];

  constructor() {
    super(SceneKey.NewCharacter || 'NewCharacterScene');
  }

  preload(): void {
    // 1. 공통 UI 리소스
    this.load.image('title_bg', '../../assets/game/backgrounds/title_background.png');
    this.load.image('ui_box', '../../assets/game/ui/medium_ui_box.png');
    this.load.image('male_button', '../../assets/game/ui/male.png');
    this.load.image('female_button', '../../assets/game/ui/female.png');
    this.load.audio('create_bgm', '../../assets/game/audio/BGM/bye.mp3');
    this.load.audio('click_sfx', '../../assets/game/audio/SoundEffect/click.wav');

    const spriteConfig = { frameWidth: this.FRAME_WIDTH, frameHeight: this.FRAME_HEIGHT };
    
    // 2. 캐릭터 베이스 로드
    this.load.spritesheet('base_male', '../../assets/game/character/base_male.png', spriteConfig);
    this.load.spritesheet('base_female', '../../assets/game/character/base_female.png', spriteConfig);

    // 3. 성별별 헤어 리소스 로드 (male_hair_1~3, female_hair_1~3)
    for (let i = 1; i <= this.MAX_HAIR; i++) {
      this.load.spritesheet(`male_hair_${i}`, `../../assets/game/character/male_hair_${i}.png`, spriteConfig);
      this.load.spritesheet(`female_hair_${i}`, `../../assets/game/character/female_hair_${i}.png`, spriteConfig);
    }

    // 4. 성별별 의상 리소스 로드 (male_clothes_1~3, female_clothes_1~3)
    for (let i = 1; i <= this.MAX_CLOTH; i++) {
      this.load.spritesheet(`male_clothes_${i}`, `../../assets/game/character/male_clothes_${i}.png`, spriteConfig);
      this.load.spritesheet(`female_clothes_${i}`, `../../assets/game/character/female_clothes_${i}.png`, spriteConfig);
    }
  }

  create(): void {
    const { width, height } = this.sys.canvas;
    this.cameras.main.setRoundPixels(true);

    const bg = this.add.image(width / 2, height / 2, 'title_bg');
    bg.setScale(Math.max(width / bg.width, height / bg.height)).setScrollFactor(0);
    
    const uiBox = this.add.image(width / 2, height / 2, 'ui_box');
    uiBox.setDisplaySize(width * 0.9, height * 0.8).setAlpha(0.9);

    if (this.cache.audio.exists('create_bgm')) {
      this.bgm = this.sound.add('create_bgm', { loop: true, volume: 0.8 });
      this.bgm.play();
    }
    
    this.add.text(width / 2, height * 0.18, "캐릭터 생성", {
      fontSize: "42px", fontFamily: this.FONT_FAMILY, color: "#ffffff", stroke: "#000", strokeThickness: 6
    }).setOrigin(0.5);

    this.characterPreview = this.add.container(Math.floor(width * 0.35), Math.floor(height * 0.5));
    
    const uiX = width * 0.65;
    this.setupUI(uiX, width, height);
    this.updateCharacterPreview();
  }

  private setupUI(uiX: number, width: number, height: number) {
    // 1. 이름 입력
    this.nameText = this.add.text(uiX, height * 0.35, `이름: ${this.userName} [수정]`, {
      fontSize: "24px", fontFamily: this.FONT_FAMILY, backgroundColor: "#333", padding: {x:15, y:10}
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    
    this.nameText.on('pointerdown', () => {
      this.playClick();
      const input = prompt("이름을 입력해주세요", this.userName);
      if (input) {
        this.userName = input.trim().substring(0, 6) || "싸피생";
        this.nameText.setText(`이름: ${this.userName} [수정]`);
      }
    });

    // 2. 성별 버튼
    this.add.text(uiX - 130, height * 0.47, "성별", { fontSize: "22px", fontFamily: this.FONT_FAMILY }).setOrigin(0.5);
    this.maleBtn = this.add.image(uiX - 20, height * 0.47, 'male_button').setInteractive({ useHandCursor: true }).setScale(1.2);
    this.femaleBtn = this.add.image(uiX + 60, height * 0.47, 'female_button').setInteractive({ useHandCursor: true }).setScale(1.2);
    
    this.maleBtn.on('pointerdown', () => { this.playClick(); this.selectGender('male'); });
    this.femaleBtn.on('pointerdown', () => { this.playClick(); this.selectGender('female'); });
    this.updateGenderButtonUI();

    // 3. 헤어 선택
    this.add.text(uiX - 130, height * 0.57, "헤어", { fontSize: "22px", fontFamily: this.FONT_FAMILY }).setOrigin(0.5);
    this.hairButtons = this.createNumberButtons(uiX - 40, height * 0.57, this.MAX_HAIR, (idx) => {
      this.hairIndex = idx;
      this.updateButtonColors(this.hairButtons, this.hairIndex);
      this.updateCharacterPreview();
    });

    // 4. 의상 선택 (선택 시 성별에 맞는 의상 적용)
    this.add.text(uiX - 130, height * 0.67, "의상", { fontSize: "22px", fontFamily: this.FONT_FAMILY }).setOrigin(0.5);
    this.clothButtons = this.createNumberButtons(uiX - 40, height * 0.67, this.MAX_CLOTH, (idx) => {
      this.clothIndex = idx;
      this.updateButtonColors(this.clothButtons, this.clothIndex);
      this.updateCharacterPreview();
    });

    // 5. 생성하기 버튼
    const startBtnBg = this.add.image(0, 0, 'ui_box').setDisplaySize(200, 60).setInteractive({ useHandCursor: true });
    const startBtnText = this.add.text(0, 0, "생성하기", {
      fontSize: "28px", fontFamily: this.FONT_FAMILY, color: "#fff"
    }).setOrigin(0.5);
    const startBtnContainer = this.add.container(width / 2, height * 0.94, [startBtnBg, startBtnText]);

    startBtnBg.on('pointerdown', () => {
      this.playClick();
      this.tweens.add({
        targets: startBtnContainer, scale: 0.95, duration: 80, yoyo: true,
        onComplete: () => {
          this.registry.set('playerData', { name: this.userName, gender: this.gender, hair: this.hairIndex, cloth: this.clothIndex });
          this.scene.start(SceneKey.Main);
        }
      });
    });

    this.updateButtonColors(this.hairButtons, this.hairIndex);
    this.updateButtonColors(this.clothButtons, this.clothIndex);
  }

  /**
   * 베이스 + 성별 맞춤 의상 + 성별 맞춤 헤어 레이어링 업데이트
   */
  private updateCharacterPreview() {
    this.characterPreview.removeAll(true);
    const g = this.gender;

    // 1. 캐릭터 몸체 생성
    this.charBase = this.add.sprite(0, 0, `base_${g}`).setScale(4).setOrigin(0.5);
    this.charBase.texture.setFilter(Phaser.Textures.FilterMode.NEAREST);

    // 2. 의상 생성 (성별에 따른 리소스 선택)
    const clothKey = `${g}_clothes_${this.clothIndex}`;
    this.charCloth = this.add.sprite(0, 0, clothKey).setScale(4).setOrigin(0.5);
    this.charCloth.texture.setFilter(Phaser.Textures.FilterMode.NEAREST);

    // 3. 헤어 생성 (성별에 따른 리소스 선택)
    const hairKey = `${g}_hair_${this.hairIndex}`;
    this.charHair = this.add.sprite(0, 0, hairKey).setScale(4).setOrigin(0.5);
    this.charHair.texture.setFilter(Phaser.Textures.FilterMode.NEAREST);

    // 레이어 순서: 베이스 -> 의상 -> 헤어 (머리카락이 가장 위)
    this.characterPreview.add([this.charBase, this.charCloth, this.charHair]);

    // 4. 애니메이션 처리
    const baseAnimKey = `base_${g}_idle_anim`;
    const clothAnimKey = `${g}_clothes_${this.clothIndex}_idle_anim`; // 의상 애니메이션 키 수정
    const hairAnimKey = `${g}_hair_${this.hairIndex}_idle_anim`;

    // 몸체 애니메이션
    if (!this.anims.exists(baseAnimKey)) {
      this.anims.create({
        key: baseAnimKey,
        frames: this.anims.generateFrameNumbers(`base_${g}`, { start: 0, end: 3 }),
        frameRate: 8,
        repeat: -1
      });
    }

    // 의상 애니메이션 (성별+인덱스 조합으로 고유 키 생성)
    if (!this.anims.exists(clothAnimKey)) {
      this.anims.create({
        key: clothAnimKey,
        frames: this.anims.generateFrameNumbers(clothKey, { start: 0, end: 3 }),
        frameRate: 8,
        repeat: -1
      });
    }

    // 헤어 애니메이션 (성별+인덱스 조합으로 고유 키 생성)
    if (!this.anims.exists(hairAnimKey)) {
      this.anims.create({
        key: hairAnimKey,
        frames: this.anims.generateFrameNumbers(hairKey, { start: 0, end: 3 }),
        frameRate: 8,
        repeat: -1
      });
    }

    // 모든 레이어 동시 재생
    this.charBase.play(baseAnimKey);
    this.charCloth.play(clothAnimKey);
    this.charHair.play(hairAnimKey);
  }

  private createNumberButtons(x: number, y: number, count: number, callback: (i: number) => void) {
    const btns: Phaser.GameObjects.Text[] = [];
    for (let i = 1; i <= count; i++) {
      const btn = this.add.text(x + (i - 1) * 60, y, ` ${i} `, {
        fontSize: "20px", fontFamily: this.FONT_FAMILY, backgroundColor: "#444", padding: { x: 10, y: 5 }
      }).setOrigin(0.5).setInteractive({ useHandCursor: true });
      btn.on('pointerdown', () => { this.playClick(); callback(i); });
      btns.push(btn);
    }
    return btns;
  }

  private updateButtonColors(buttons: Phaser.GameObjects.Text[], current: number) {
    buttons.forEach((btn, i) => btn.setBackgroundColor(i + 1 === current ? '#e67e22' : '#444'));
  }

  private playClick() { if (this.cache.audio.exists('click_sfx')) this.sound.play('click_sfx'); }

  private selectGender(gender: 'male' | 'female') {
    if (this.gender !== gender) {
      this.gender = gender;
      this.updateGenderButtonUI();
      // 성별 변경 시 헤어와 의상 리소스도 자동으로 성별에 맞게 교체됨
      this.updateCharacterPreview(); 
    }
  }

  private updateGenderButtonUI() {
    this.maleBtn.setAlpha(this.gender === 'male' ? 1 : 0.5);
    this.femaleBtn.setAlpha(this.gender === 'female' ? 1 : 0.5);
  }
}