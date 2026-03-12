import Phaser from "phaser";
import { SceneKey } from "@shared/enums/sceneKey";

type RoleType = "backend" | "frontend" | "ai";
type TraitType = "focus" | "team" | "challenge";

const ROLE_LABEL: Record<RoleType, string> = {
  backend: "백엔드형",
  frontend: "프론트형",
  ai: "AI형"
};

const TRAIT_LABEL: Record<TraitType, string> = {
  focus: "집중형",
  team: "협업형",
  challenge: "도전형"
};

const ROLE_ORDER: RoleType[] = ["backend", "frontend", "ai"];
const TRAIT_ORDER: TraitType[] = ["focus", "team", "challenge"];

export class NewCharacterScene extends Phaser.Scene {
  private readonly fontFamily = "\"Malgun Gothic\", \"Apple SD Gothic Neo\", \"Noto Sans KR\", sans-serif";
  private readonly defaultName = "싸피생";

  private nickname = this.defaultName;
  private roleIndex = 0;
  private traitIndex = 0;

  private previewBody?: Phaser.GameObjects.Rectangle;
  private previewHead?: Phaser.GameObjects.Ellipse;
  private previewAccent?: Phaser.GameObjects.Rectangle;
  private nameText?: Phaser.GameObjects.Text;
  private roleValueText?: Phaser.GameObjects.Text;
  private traitValueText?: Phaser.GameObjects.Text;
  private helperText?: Phaser.GameObjects.Text;

  constructor() {
    super(SceneKey.NewCharacter);
  }

  preload(): void {
    this.load.image("char-create-bg", "assets/game/backgrounds/title_background.png");
    this.load.audio("char-create-click", "assets/game/audio/SoundEffect/click.wav");
    this.load.audio("char-create-bgm", "assets/game/audio/BGM/bye.mp3");
  }

  create(): void {
    const { width, height } = this.scale;
    const authUser = this.registry.get("authUser") as { nickname?: string } | undefined;
    if (authUser?.nickname?.trim()) {
      this.nickname = authUser.nickname.trim().slice(0, 8);
    }

    this.cameras.main.setBackgroundColor("#101923");
    this.drawBackground(width, height);
    this.drawPanel(width, height);
    this.drawPreview(width, height);
    this.drawControls(width, height);
    this.refreshTexts();

    if (this.cache.audio.exists("char-create-bgm")) {
      const bgm = this.sound.add("char-create-bgm", { loop: true, volume: 0.4 });
      bgm.play();
      this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
        bgm.stop();
        bgm.destroy();
      });
    }
  }

  private drawBackground(width: number, height: number): void {
    if (this.textures.exists("char-create-bg")) {
      const bg = this.add.image(width / 2, height / 2, "char-create-bg");
      bg.setDisplaySize(width, height);
      bg.setAlpha(0.7);
    }

    this.add.rectangle(width / 2, height / 2, width, height, 0x0b121a, 0.46);
  }

  private drawPanel(width: number, height: number): void {
    this.add.rectangle(width / 2, height / 2, 960, 600, 0x08111a, 0.92).setStrokeStyle(2, 0x5a8db1, 0.85);
    this.add.text(width / 2, 120, "캐릭터 생성", {
      fontFamily: this.fontFamily,
      fontSize: "40px",
      color: "#f2f8ff"
    }).setOrigin(0.5);
  }

  private drawPreview(width: number, height: number): void {
    const previewX = width * 0.34;
    const previewY = height * 0.53;

    this.add.text(previewX, 192, "미리보기", {
      fontFamily: this.fontFamily,
      fontSize: "24px",
      color: "#a7d7f5"
    }).setOrigin(0.5);

    this.add.rectangle(previewX, previewY, 310, 390, 0x0e2031, 0.88).setStrokeStyle(2, 0x2f5f84, 0.9);
    this.previewBody = this.add.rectangle(previewX, previewY + 54, 112, 160, 0x4f8dbd, 1);
    this.previewHead = this.add.ellipse(previewX, previewY - 70, 110, 112, 0xf0d4b6, 1);
    this.previewAccent = this.add.rectangle(previewX, previewY + 4, 118, 24, 0x2c4d7b, 1);
  }

  private drawControls(width: number, height: number): void {
    const x = width * 0.66;
    const baseY = height * 0.36;

    this.nameText = this.add.text(x, baseY, "", {
      fontFamily: this.fontFamily,
      fontSize: "24px",
      color: "#ffffff",
      backgroundColor: "#1a344a",
      padding: { left: 14, right: 14, top: 10, bottom: 10 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    this.nameText.on("pointerdown", () => this.editNickname());

    this.add.text(x - 140, baseY + 110, "타입", {
      fontFamily: this.fontFamily,
      fontSize: "24px",
      color: "#c9e7ff"
    }).setOrigin(0.5);
    this.roleValueText = this.add.text(x + 10, baseY + 110, "", {
      fontFamily: this.fontFamily,
      fontSize: "24px",
      color: "#ffffff"
    }).setOrigin(0.5);
    this.createTextButton(x + 160, baseY + 110, "변경", () => {
      this.roleIndex = (this.roleIndex + 1) % ROLE_ORDER.length;
      this.refreshTexts();
    });

    this.add.text(x - 140, baseY + 190, "성향", {
      fontFamily: this.fontFamily,
      fontSize: "24px",
      color: "#c9e7ff"
    }).setOrigin(0.5);
    this.traitValueText = this.add.text(x + 10, baseY + 190, "", {
      fontFamily: this.fontFamily,
      fontSize: "24px",
      color: "#ffffff"
    }).setOrigin(0.5);
    this.createTextButton(x + 160, baseY + 190, "변경", () => {
      this.traitIndex = (this.traitIndex + 1) % TRAIT_ORDER.length;
      this.refreshTexts();
    });

    this.helperText = this.add.text(x, baseY + 265, "이름을 눌러 수정하고 시작하세요.", {
      fontFamily: this.fontFamily,
      fontSize: "18px",
      color: "#9fbdd2"
    }).setOrigin(0.5);

    const startBtn = this.createTextButton(x, baseY + 345, "게임 시작", () => this.startGame(), true);
    startBtn.setScale(1.15);

  }

  private createTextButton(
    x: number,
    y: number,
    label: string,
    onClick: () => void,
    emphasized = false
  ): Phaser.GameObjects.Text {
    const bgColor = emphasized ? "#2f9050" : "#2e4f6d";
    const hoverColor = emphasized ? "#38aa5e" : "#3e6588";
    const text = this.add.text(x, y, label, {
      fontFamily: this.fontFamily,
      fontSize: emphasized ? "28px" : "20px",
      color: "#ffffff",
      backgroundColor: bgColor,
      padding: { left: 20, right: 20, top: 10, bottom: 10 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    text.on("pointerover", () => text.setBackgroundColor(hoverColor));
    text.on("pointerout", () => text.setBackgroundColor(bgColor));
    text.on("pointerdown", () => {
      if (this.cache.audio.exists("char-create-click")) {
        this.sound.play("char-create-click");
      }
      onClick();
    });

    return text;
  }

  private editNickname(): void {
    const input = prompt("이름을 입력하세요 (최대 8자)", this.nickname);
    if (input === null) {
      return;
    }

    const trimmed = input.trim().slice(0, 8);
    this.nickname = trimmed || this.defaultName;
    this.refreshTexts();
  }

  private refreshTexts(): void {
    this.nameText?.setText(`이름: ${this.nickname} (클릭 수정)`);
    this.roleValueText?.setText(ROLE_LABEL[ROLE_ORDER[this.roleIndex]]);
    this.traitValueText?.setText(TRAIT_LABEL[TRAIT_ORDER[this.traitIndex]]);
    this.applyPreviewTheme();
  }

  private applyPreviewTheme(): void {
    if (!this.previewBody || !this.previewAccent) {
      return;
    }

    const role = ROLE_ORDER[this.roleIndex];
    const trait = TRAIT_ORDER[this.traitIndex];

    const bodyColorByRole: Record<RoleType, number> = {
      backend: 0x4a7db4,
      frontend: 0xbc6ea9,
      ai: 0x6b8a5f
    };
    const accentColorByTrait: Record<TraitType, number> = {
      focus: 0x354f78,
      team: 0x7a4a72,
      challenge: 0x5a7437
    };

    this.previewBody.setFillStyle(bodyColorByRole[role], 1);
    this.previewAccent.setFillStyle(accentColorByTrait[trait], 1);
  }

  private startGame(): void {
    const role = ROLE_ORDER[this.roleIndex];
    const trait = TRAIT_ORDER[this.traitIndex];
    this.registry.set("playerData", {
      name: this.nickname,
      role,
      trait
    });

    this.cameras.main.fadeOut(280, 0, 0, 0);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
      this.scene.start(SceneKey.Main);
    });
  }
}
