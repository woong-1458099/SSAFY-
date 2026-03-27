import Phaser from "phaser";
import { SceneKey } from "@shared/enums/sceneKey";
import { AudioManager } from "@core/managers/AudioManager";
import {
  preloadCharacterCreationAssets,
  CHARACTER_CREATION_ASSET_KEYS
} from "@features/character/characterCreationAssets";
import {
  CHARACTER_CREATION_DEFAULT_NAME,
  CHARACTER_CREATION_FONT_FAMILY,
  CHARACTER_CREATION_MAX_CLOTH,
  CHARACTER_CREATION_MAX_HAIR,
  CHARACTER_CREATION_TEXT
} from "@features/character/characterCreationConfig";
import { getCharacterCreationLayout, type CharacterCreationLayout } from "@features/character/characterCreationLayout";

export class NewCharacterScene extends Phaser.Scene {
  private readonly audioManager = new AudioManager();
  private userName: string = CHARACTER_CREATION_DEFAULT_NAME;
  private gender: 'male' | 'female' = 'male';
  private hairIndex: number = 1;
  private clothIndex: number = 1;

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
    super(SceneKey.NewCharacter);
  }

  preload(): void {
    preloadCharacterCreationAssets(this);
  }

  create(): void {
    const { width, height } = this.sys.canvas;
    const layout = getCharacterCreationLayout(width, height);
    this.cameras.main.setRoundPixels(true);

    const bg = this.add.image(width / 2, height / 2, CHARACTER_CREATION_ASSET_KEYS.background);
    bg.setScale(Math.max(width / bg.width, height / bg.height)).setScrollFactor(0);
    
    const uiBox = this.add.image(width / 2, height / 2, CHARACTER_CREATION_ASSET_KEYS.uiBox);
    uiBox.setDisplaySize(layout.uiBoxWidth, layout.uiBoxHeight).setAlpha(0.9);

    if (this.cache.audio.exists(CHARACTER_CREATION_ASSET_KEYS.bgm)) {
      const bgm = this.audioManager.add(this, CHARACTER_CREATION_ASSET_KEYS.bgm, 'bgm', { loop: true, volume: 0.8 });
      if (bgm) {
        this.bgm = bgm;
        this.bgm.play();
      }
    }
    
    this.add.text(width / 2, layout.titleY, CHARACTER_CREATION_TEXT.title, {
      fontSize: "42px", fontFamily: CHARACTER_CREATION_FONT_FAMILY, color: "#ffffff", stroke: "#000", strokeThickness: 6
    }).setOrigin(0.5);

    this.characterPreview = this.add.container(layout.previewX, layout.previewY);
    
    this.setupUI(layout, width);
    this.updateCharacterPreview();
  }

  private setupUI(layout: CharacterCreationLayout, width: number) {
    const uiX = layout.uiX;

    // 1. 이름 입력
    this.nameText = this.add.text(uiX, layout.nameY, this.getNameLabelText(), {
      fontSize: "24px", fontFamily: CHARACTER_CREATION_FONT_FAMILY, backgroundColor: "#333", padding: {x:15, y:10}
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    
    this.nameText.on('pointerdown', () => {
      this.playClick();
      const input = prompt(CHARACTER_CREATION_TEXT.namePrompt, this.userName);
      if (input) {
        this.userName = input.trim().substring(0, 6) || CHARACTER_CREATION_DEFAULT_NAME;
        this.nameText.setText(this.getNameLabelText());
      }
    });

    // 2. 성별 버튼
    this.add.text(uiX - layout.labelOffsetX, layout.genderY, CHARACTER_CREATION_TEXT.genderLabel, { fontSize: "22px", fontFamily: CHARACTER_CREATION_FONT_FAMILY }).setOrigin(0.5);
    this.maleBtn = this.add.image(uiX + layout.maleButtonOffsetX, layout.genderY, CHARACTER_CREATION_ASSET_KEYS.maleButton).setInteractive({ useHandCursor: true }).setScale(layout.genderButtonScale);
    this.femaleBtn = this.add.image(uiX + layout.femaleButtonOffsetX, layout.genderY, CHARACTER_CREATION_ASSET_KEYS.femaleButton).setInteractive({ useHandCursor: true }).setScale(layout.genderButtonScale);
    
    this.maleBtn.on('pointerdown', () => { this.playClick(); this.selectGender('male'); });
    this.femaleBtn.on('pointerdown', () => { this.playClick(); this.selectGender('female'); });
    this.updateGenderButtonUI();

    // 3. 헤어 선택
    this.add.text(uiX - layout.labelOffsetX, layout.selectorY.hair, CHARACTER_CREATION_TEXT.hairLabel, { fontSize: "22px", fontFamily: CHARACTER_CREATION_FONT_FAMILY }).setOrigin(0.5);
    this.hairButtons = this.createNumberButtons(uiX + layout.selectorStartOffsetX, layout.selectorY.hair, CHARACTER_CREATION_MAX_HAIR, layout.selectorSpacing, (idx) => {
      this.hairIndex = idx;
      this.updateButtonColors(this.hairButtons, this.hairIndex);
      this.updateCharacterPreview();
    });

    // 4. 의상 선택 (선택 시 성별에 맞는 의상 적용)
    this.add.text(uiX - layout.labelOffsetX, layout.selectorY.cloth, CHARACTER_CREATION_TEXT.clothLabel, { fontSize: "22px", fontFamily: CHARACTER_CREATION_FONT_FAMILY }).setOrigin(0.5);
    this.clothButtons = this.createNumberButtons(uiX + layout.selectorStartOffsetX, layout.selectorY.cloth, CHARACTER_CREATION_MAX_CLOTH, layout.selectorSpacing, (idx) => {
      this.clothIndex = idx;
      this.updateButtonColors(this.clothButtons, this.clothIndex);
      this.updateCharacterPreview();
    });

    // 5. 생성하기 버튼
    const startBtnBg = this.add.image(0, 0, CHARACTER_CREATION_ASSET_KEYS.uiBox).setDisplaySize(layout.startButtonWidth, layout.startButtonHeight).setInteractive({ useHandCursor: true });
    const startBtnText = this.add.text(0, 0, CHARACTER_CREATION_TEXT.createButton, {
      fontSize: "28px", fontFamily: CHARACTER_CREATION_FONT_FAMILY, color: "#fff"
    }).setOrigin(0.5);
    const startBtnContainer = this.add.container(width / 2, layout.startButtonY, [startBtnBg, startBtnText]);

    startBtnBg.on('pointerdown', () => {
      this.playClick();
      this.tweens.add({
        targets: startBtnContainer, scale: 0.95, duration: 80, yoyo: true,
        onComplete: () => {
          this.registry.set('playerData', { name: this.userName, gender: this.gender, hair: this.hairIndex, cloth: this.clothIndex });
          this.registry.set('isNewCharacter', true);
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

  private createNumberButtons(x: number, y: number, count: number, spacing: number, callback: (i: number) => void) {
    const btns: Phaser.GameObjects.Text[] = [];
    for (let i = 1; i <= count; i++) {
      const btn = this.add.text(x + (i - 1) * spacing, y, ` ${i} `, {
        fontSize: "20px", fontFamily: CHARACTER_CREATION_FONT_FAMILY, backgroundColor: "#444", padding: { x: 10, y: 5 }
      }).setOrigin(0.5).setInteractive({ useHandCursor: true });
      btn.on('pointerdown', () => { this.playClick(); callback(i); });
      btns.push(btn);
    }
    return btns;
  }

  private updateButtonColors(buttons: Phaser.GameObjects.Text[], current: number) {
    buttons.forEach((btn, i) => btn.setBackgroundColor(i + 1 === current ? '#e67e22' : '#444'));
  }

  private playClick() {
    this.audioManager.play(this, CHARACTER_CREATION_ASSET_KEYS.click, 'sfx');
  }

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

  private getNameLabelText(): string {
    return `이름: ${this.userName} ${CHARACTER_CREATION_TEXT.nameEditSuffix}`;
  }
}
