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

  private characterPreview!: Phaser.GameObjects.Container;
  private charBase!: Phaser.GameObjects.Image;
  private charHair!: Phaser.GameObjects.Image;
  private charCloth!: Phaser.GameObjects.Image;

  private nameText!: Phaser.GameObjects.Text;
  private bgm!: Phaser.Sound.BaseSound;

  constructor() {
    super(SceneKey.NewCharacter || 'NewCharacterScene');
  }

  preload(): void {
    // 배경 및 UI
    this.load.image('title_bg', '../../assets/game/backgrounds/title_background.png');
    this.load.image('ui_box', '../../assets/game/ui/ui_frame.png');
    this.load.audio('create_bgm', '../../assets/game/audio/BGM/bye.mp3');

    // 캐릭터 파츠
    this.load.image('base_male', '../../assets/game/character/base_male.png');
    this.load.image('base_female', '../../assets/game/character/base_female.png');
    
    for (let i = 1; i <= this.MAX_HAIR; i++) {
      this.load.image(`hair_male_${i}`, `../../assets/game/character/hair_male_${i}.png`);
      this.load.image(`hair_female_${i}`, `../../assets/game/character/hair_female_${i}.png`);
    }
    for (let i = 1; i <= this.MAX_CLOTH; i++) {
      this.load.image(`cloth_male_${i}`, `../../assets/game/character/cloth_male_${i}.png`);
      this.load.image(`cloth_female_${i}`, `../../assets/game/character/cloth_female_${i}.png`);
    }
  }

  create(): void {
    const { width, height } = this.sys.canvas;

    // 1. 배경 설정
    const bg = this.add.image(width / 2, height / 2, 'title_bg');
    const bgScale = Math.max(width / bg.width, height / bg.height);
    bg.setScale(bgScale).setScrollFactor(0);

    // 2. UI 박스 (중앙 패널)
    const uiBox = this.add.image(width / 2, height / 2, 'ui_box');
    uiBox.setDisplaySize(width * 0.8, height * 0.75).setAlpha(0.9);

    // BGM
    if (this.cache.audio.exists('create_bgm')) {
      this.bgm = this.sound.add('create_bgm', { loop: true, volume: 0.5 });
      this.bgm.play();
    }

    this.add.text(width / 2, height * 0.18, "캐릭터 생성", {
      fontSize: "42px", fontFamily: this.FONT_FAMILY, color: "#ffffff", stroke: "#000", strokeThickness: 6
    }).setOrigin(0.5);

    // 3. 캐릭터 프리뷰 컨테이너 생성
    this.characterPreview = this.add.container(width * 0.35, height * 0.5);
    this.updateCharacterPreview();

    // 4. UI 컨트롤 영역
    const uiX = width * 0.65;
    
    // 이름 입력
    this.nameText = this.add.text(uiX, height * 0.35, `이름: ${this.userName} [수정]`, {
      fontSize: "24px", fontFamily: this.FONT_FAMILY, backgroundColor: "#333", padding: {x:15, y:10}
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    
    this.nameText.on('pointerdown', () => {
      const input = prompt("이름을 입력해주세요 (최대 6자)", this.userName);
      if (input) {
        this.userName = input.trim().substring(0, 6) || "싸피생";
        this.nameText.setText(`이름: ${this.userName} [수정]`);
      }
    });

    // 선택 버튼들
    this.createOptionRow(uiX, height * 0.47, "성별", () => {
      this.gender = this.gender === 'male' ? 'female' : 'male';
      this.updateCharacterPreview();
    });

    this.createOptionRow(uiX, height * 0.57, "헤어", () => {
      this.hairIndex = (this.hairIndex % this.MAX_HAIR) + 1;
      this.updateCharacterPreview();
    });

    this.createOptionRow(uiX, height * 0.67, "의상", () => {
      this.clothIndex = (this.clothIndex % this.MAX_CLOTH) + 1;
      this.updateCharacterPreview();
    });

    // 시작 버튼
    const startBtn = this.add.text(width / 2, height * 0.88, "이대로 시작하기", {
      fontSize: "30px", fontFamily: this.FONT_FAMILY, color: "#fff",
      backgroundColor: "#27ae60", padding: {x: 40, y: 15}
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    startBtn.on('pointerdown', () => {
      this.registry.set('playerData', { name: this.userName, gender: this.gender, hair: this.hairIndex, cloth: this.clothIndex });
      if (this.bgm) {
        this.tweens.add({ targets: this.bgm, volume: 0, duration: 500, onComplete: () => this.bgm.stop() });
      }
      this.cameras.main.fadeOut(500, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start(SceneKey.Main));
    });
  }

  private createOptionRow(x: number, y: number, label: string, callback: () => void) {
    this.add.text(x - 130, y, label, { fontSize: "22px", fontFamily: this.FONT_FAMILY }).setOrigin(0.5);
    const btn = this.add.text(x + 20, y, "< 변경하기 >", {
      fontSize: "20px", fontFamily: this.FONT_FAMILY, backgroundColor: "#444", padding: {x: 20, y: 8}
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    btn.on('pointerdown', callback);
    btn.on('pointerover', () => btn.setBackgroundColor('#666'));
    btn.on('pointerout', () => btn.setBackgroundColor('#444'));
  }

  private updateCharacterPreview() {
    // 기존에 돌고 있는 트윈들 제거 (메모리 관리 및 꼬임 방지)
    this.tweens.killTweensOf([this.charBase, this.charHair, this.charCloth].filter(Boolean));
    this.characterPreview.removeAll(true);

    // 1. 파츠 생성 (각각 개별 객체)
    this.charBase = this.add.image(0, 0, `base_${this.gender}`).setScale(3);
    this.charCloth = this.add.image(0, 0, `cloth_${this.gender}_${this.clothIndex}`).setScale(3);
    this.charHair = this.add.image(0, 0, `hair_${this.gender}_${this.hairIndex}`).setScale(3);

    // 2. 컨테이너에 추가 (순서 중요: 베이스 -> 옷 -> 머리)
    this.characterPreview.add([this.charBase, this.charCloth, this.charHair]);

    // 3. "들썩들썩" 애니메이션 적용
    // 몸과 옷은 같이 움직임
    this.tweens.add({
      targets: [this.charBase, this.charCloth],
      y: 5, // 5픽셀 아래로
      duration: 600,
      ease: 'Sine.easeInOut',
      yoyo: true,
      repeat: -1
    });

    // 머리카락은 아주 약간 늦게, 혹은 더 많이 움직여서 찰랑거리는 느낌 추가
    this.tweens.add({
      targets: this.charHair,
      y: 7, // 머리카락은 좀 더 들썩이게
      duration: 600,
      ease: 'Sine.easeInOut',
      yoyo: true,
      repeat: -1,
      delay: 50 // 0.05초 미세한 시간차
    });
  }
}