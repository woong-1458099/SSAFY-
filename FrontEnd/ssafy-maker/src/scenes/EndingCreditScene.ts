import Phaser from "phaser";
import type { EndingFlowPayload, EndingResult } from "@features/progression/types/ending";
import { SceneKey } from "@shared/enums/sceneKey";

type EndingCreditSceneData = {
  payload?: EndingFlowPayload;
  ending?: EndingResult;
};

type CreditTextItem = {
  type: "text";
  content: string;
  style?: Phaser.Types.GameObjects.Text.TextStyle;
};

type CreditImageItem = {
  type: "image";
  key: string;
  scale?: number;
};

type CreditSpriteItem = {
  type: "sprite";
  key: string;
  scale?: number;
};

type CreditSpacerItem = {
  type: "spacer";
  height: number;
};

type CreditItem = CreditTextItem | CreditImageItem | CreditSpriteItem | CreditSpacerItem;

const FONT_FAMILY = "\"PFStardustBold\", \"Malgun Gothic\", \"Apple SD Gothic Neo\", \"Noto Sans KR\", sans-serif";
const ENDING_BGM_KEY = "ending-credit-bgm";
const CREDIT_206_KEY = "ending-credit-206";
const CREDIT_LOGO_KEY = "ending-credit-logo-mini";
const CREDIT_BACKGROUND_KEY = "ending-credit-background";

const CREDIT_NPCS = [
  { key: "ending-credit-minsu", assetPath: "/assets/game/npc/walking-minsu.png", displayName: "김민수" },
  { key: "ending-credit-myungjin", assetPath: "/assets/game/npc/walking-myeongjin.png", displayName: "김명진" },
  { key: "ending-credit-jongmin", assetPath: "/assets/game/npc/walking-jongmin.png", displayName: "진종민" },
  { key: "ending-credit-hyoryeon", assetPath: "/assets/game/npc/walking-hyoryeon.png", displayName: "종효련" },
  { key: "ending-credit-jiwoo", assetPath: "/assets/game/npc/walking-jiwoo.png", displayName: "하지우" },
  { key: "ending-credit-yeonwoong", assetPath: "/assets/game/npc/walking-yeonwoong.png", displayName: "최연웅" },
  { key: "ending-credit-doyeon", assetPath: "/assets/game/npc/walking-doyeon.png", displayName: "김도연 프로님" },
  { key: "ending-credit-sunmi", assetPath: "/assets/game/npc/walking-sunmi.png", displayName: "조선미 프로님" },
  { key: "ending-credit-hyunseok", assetPath: "/assets/game/npc/walking-hyeonsok.png", displayName: "이현석 컨설턴트님" },
  { key: "ending-credit-hyewon", assetPath: "/assets/game/npc/walking-hyewon.png", displayName: "이혜원 실습코치님" },
  { key: "ending-credit-minseok", assetPath: "/assets/game/npc/walking-minsok.png", displayName: "최민석 실습코치님" }
] as const;

export class EndingCreditScene extends Phaser.Scene {
  private creditsContainer!: Phaser.GameObjects.Container;
  private payload!: EndingFlowPayload;
  private ending!: EndingResult;
  private scrollSpeed = 0.85;
  private contentHeight = 0;
  private isFinishing = false;

  constructor() {
    super(SceneKey.EndingCredit);
  }

  init(data: EndingCreditSceneData): void {
    if (!data.payload || !data.ending) {
      throw new Error("EndingCreditScene requires payload and ending data.");
    }

    this.payload = data.payload;
    this.ending = data.ending;
    this.isFinishing = false;
  }

  preload(): void {
    if (!this.cache.audio.exists(ENDING_BGM_KEY)) {
      this.load.audio(ENDING_BGM_KEY, "/assets/game/audio/BGM/EndingCredit.mp3");
    }

    if (!this.textures.exists(CREDIT_206_KEY)) {
      this.load.image(CREDIT_206_KEY, "/assets/game/ui/206.png");
    }

    if (!this.textures.exists(CREDIT_LOGO_KEY)) {
      this.load.image(CREDIT_LOGO_KEY, "/assets/game/ui/logo-mini.png");
    }

    if (!this.textures.exists(CREDIT_BACKGROUND_KEY)) {
      this.load.image(CREDIT_BACKGROUND_KEY, "/assets/game/backgrounds/title_background.png");
    }

    CREDIT_NPCS.forEach((npc) => {
      if (this.textures.exists(npc.key)) {
        return;
      }

      this.load.spritesheet(npc.key, npc.assetPath, {
        frameWidth: 16,
        frameHeight: 32
      });
    });
  }

  create(): void {
    const { width, height } = this.scale;

    this.sound.stopAll();
    this.cameras.main.setBackgroundColor("#000000");
    this.add.image(width / 2, height / 2, CREDIT_BACKGROUND_KEY)
      .setDisplaySize(width, height)
      .setAlpha(0.18);
    this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.82);

    this.sound.play(ENDING_BGM_KEY, { loop: true, volume: 0.45 });

    this.createAnimations();

    this.creditsContainer = this.add.container(0, height + 64);
    this.buildCredits(width);
    this.createOverlay(width, height);
    this.registerInput();

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.input.keyboard?.off("keydown-ESC");
      this.input.keyboard?.off("keydown-ENTER");
      this.input.keyboard?.off("keydown-SPACE");
      this.sound.stopByKey(ENDING_BGM_KEY);
    });
  }

  update(): void {
    if (this.isFinishing) {
      return;
    }

    this.creditsContainer.y -= this.scrollSpeed;
    if (this.creditsContainer.y + this.contentHeight < -80) {
      this.finishCredits();
    }
  }

  private createAnimations(): void {
    CREDIT_NPCS.forEach((npc) => {
      const animationKey = this.getAnimationKey(npc.key);
      if (this.anims.exists(animationKey)) {
        return;
      }

      this.anims.create({
        key: animationKey,
        frames: this.anims.generateFrameNumbers(npc.key, { start: 9, end: 12 }),
        frameRate: 7,
        repeat: -1
      });
    });
  }

  private buildCredits(width: number): void {
    const items: CreditItem[] = [
      { type: "image", key: CREDIT_206_KEY, scale: 1 },
      { type: "image", key: CREDIT_LOGO_KEY, scale: 1.15 },
      { type: "text", content: "부울경 2반 특화 TEAM E206", style: { fontSize: "40px", color: "#ffffff" } },
      { type: "spacer", height: 44 },
      { type: "text", content: `획득 엔딩 · ${this.ending.title}`, style: { fontSize: "30px", color: "#f4d35e" } },
      {
        type: "text",
        content: this.ending.shortDescription,
        style: { fontSize: "22px", color: "#d9ebff", wordWrap: { width: 820 }, align: "center" }
      },
      {
        type: "text",
        content: `최종 정산  FE ${this.payload.fe}  /  BE ${this.payload.be}  /  협업 ${this.payload.teamwork}  /  체력 ${this.payload.hp}  /  운 ${this.payload.luck}`,
        style: { fontSize: "20px", color: "#9cc8ff" }
      },
      { type: "spacer", height: 60 },

      { type: "text", content: "TEAM LEADER", style: { fontSize: "30px", color: "#a8c7f0" } },
      { type: "sprite", key: "ending-credit-jongmin", scale: 2.2 },
      { type: "text", content: "진종민", style: { fontSize: "24px", color: "#ffffff" } },
      { type: "spacer", height: 34 },

      { type: "text", content: "BACKEND & INFRA", style: { fontSize: "30px", color: "#a8c7f0" } },
      { type: "sprite", key: "ending-credit-minsu", scale: 2.2 },
      { type: "text", content: "김민수", style: { fontSize: "24px", color: "#ffffff" } },
      { type: "sprite", key: "ending-credit-myungjin", scale: 2.2 },
      { type: "text", content: "김명진", style: { fontSize: "24px", color: "#ffffff" } },
      { type: "spacer", height: 34 },

      { type: "text", content: "FRONTEND", style: { fontSize: "30px", color: "#a8c7f0" } },
      { type: "sprite", key: "ending-credit-hyoryeon", scale: 2.2 },
      { type: "text", content: "종효련", style: { fontSize: "24px", color: "#ffffff" } },
      { type: "sprite", key: "ending-credit-jongmin", scale: 2.2 },
      { type: "text", content: "진종민", style: { fontSize: "24px", color: "#ffffff" } },
      { type: "sprite", key: "ending-credit-yeonwoong", scale: 2.2 },
      { type: "text", content: "최연웅", style: { fontSize: "24px", color: "#ffffff" } },
      { type: "sprite", key: "ending-credit-jiwoo", scale: 2.2 },
      { type: "text", content: "하지우", style: { fontSize: "24px", color: "#ffffff" } },
      { type: "spacer", height: 34 },

      { type: "text", content: "ART & MUSIC", style: { fontSize: "30px", color: "#a8c7f0" } },
      { type: "sprite", key: "ending-credit-hyoryeon", scale: 2.2 },
      { type: "text", content: "종효련", style: { fontSize: "24px", color: "#ffffff" } },
      { type: "text", content: "직접 안그린 그림들 with 나노바나나", style: { fontSize: "24px", color: "#ffffff" } },
      { type: "spacer", height: 34 },

      { type: "text", content: "교육진", style: { fontSize: "30px", color: "#a8c7f0" } },
      { type: "sprite", key: "ending-credit-sunmi", scale: 2.2 },
      { type: "text", content: "조선미 프로님", style: { fontSize: "24px", color: "#ffffff" } },
      { type: "sprite", key: "ending-credit-doyeon", scale: 2.2 },
      { type: "text", content: "김도연 프로님", style: { fontSize: "24px", color: "#ffffff" } },
      { type: "sprite", key: "ending-credit-hyunseok", scale: 2.2 },
      { type: "text", content: "이현석 컨설턴트님", style: { fontSize: "24px", color: "#ffffff" } },
      { type: "sprite", key: "ending-credit-hyewon", scale: 2.2 },
      { type: "text", content: "이혜원 실습코치님", style: { fontSize: "24px", color: "#ffffff" } },
      { type: "sprite", key: "ending-credit-minseok", scale: 2.2 },
      { type: "text", content: "최민석 실습코치님", style: { fontSize: "24px", color: "#ffffff" } },
      { type: "spacer", height: 34 },

      { type: "text", content: "사용한 툴", style: { fontSize: "35px", color: "#a8c7f0" } },
      { type: "text", content: "FRONTEND", style: { fontSize: "28px", color: "#ffffff" } },
      { type: "text", content: "Phaser 3\nReact\nTypeScript", style: { fontSize: "24px", color: "#ffffff", align: "center" } },
      { type: "spacer", height: 24 },
      { type: "text", content: "BACKEND", style: { fontSize: "28px", color: "#ffffff" } },
      {
        type: "text",
        content: "Java 25\nSpring Boot 4.0.3\nOAuth2\nPostgreSQL\nRedis\nRabbitMQ\nJUnit\nMockito\nTestcontainers",
        style: { fontSize: "24px", color: "#ffffff", align: "center" }
      },
      { type: "spacer", height: 34 },

      { type: "text", content: "TMI", style: { fontSize: "35px", color: "#a8c7f0" } },
      { type: "text", content: "밥은 부울경이 제일 맛있습니다", style: { fontSize: "24px", color: "#ffffff" } },
      { type: "text", content: "아 이럴줄 알았으면 메타버스 할걸", style: { fontSize: "24px", color: "#ffffff" } },
      { type: "text", content: "최연웅씨는 부산 사람인데도 참이슬밖에 안마십니다", style: { fontSize: "24px", color: "#ffffff" } },
      { type: "text", content: "김민수씨는 사실 포켓몬을 아주 좋아합니다.", style: { fontSize: "24px", color: "#ffffff" } },
      { type: "text", content: "쓸 데 없이 이런걸 왜 넣었냐면 엔딩 크레딧 BGM이 제일 작곡자 맘에 들어서입니다.", style: { fontSize: "24px", color: "#ffffff" } },
      { type: "text", content: "격기 3반 읽어주세요", style: { fontSize: "24px", color: "#ffffff" } },
      { type: "text", content: "진종민씨는 겉과 다르게 뽀얀 토끼를 좋아합니다.", style: { fontSize: "24px", color: "#ffffff" } },
      { type: "text", content: "가위바위보에 져서 미연시 공략 대상이 되는것을 경계하세요", style: { fontSize: "24px", color: "#ffffff" } },
      { type: "text", content: "15기에게 할말이 있다면... 자격증을 미리 따두자...", style: { fontSize: "24px", color: "#ffffff" } },
      { type: "spacer", height: 72 },
      { type: "text", content: "THANK YOU FOR PLAYING!", style: { fontSize: "34px", color: "#f1c40f" } },
      {
        type: "text",
        content: `이번 플레이 키워드 · ${this.ending.dominantLabels.join(" / ")}`,
        style: { fontSize: "22px", color: "#d9ebff" }
      },
      { type: "spacer", height: 120 }
    ];

    let currentY = 0;

    items.forEach((item) => {
      if (item.type === "text") {
        const text = this.add.text(width / 2, currentY, item.content, {
          fontFamily: FONT_FAMILY,
          align: "center",
          resolution: 2,
          ...item.style
        }).setOrigin(0.5, 0);
        this.creditsContainer.add(text);
        currentY += text.height + 18;
        return;
      }

      if (item.type === "image") {
        const image = this.add.image(width / 2, currentY, item.key)
          .setScale(item.scale ?? 1)
          .setOrigin(0.5, 0);
        this.creditsContainer.add(image);
        currentY += image.displayHeight + 28;
        return;
      }

      if (item.type === "sprite") {
        const sprite = this.add.sprite(width / 2, currentY, item.key)
          .setScale(item.scale ?? 1)
          .setOrigin(0.5, 0);
        sprite.play(this.getAnimationKey(item.key));
        this.creditsContainer.add(sprite);

        currentY += sprite.displayHeight + 22;
        return;
      }

      currentY += item.height;
    });

    this.contentHeight = currentY;
  }

  private createOverlay(width: number, height: number): void {
    this.add.rectangle(width / 2, 42, width, 84, 0x000000, 0.74).setDepth(100);
    this.add.text(width / 2, 30, "ENDING CREDIT", {
      fontFamily: FONT_FAMILY,
      fontSize: "26px",
      fontStyle: "bold",
      color: "#ffffff",
      resolution: 2
    }).setOrigin(0.5).setDepth(101);
    this.add.text(width / 2, 58, `${this.ending.title} 이후 기록`, {
      fontFamily: FONT_FAMILY,
      fontSize: "16px",
      color: "#9cc8ff",
      resolution: 2
    }).setOrigin(0.5).setDepth(101);

    this.add.rectangle(width / 2, height - 24, width, 48, 0x000000, 0.78).setDepth(100);
    this.add.text(width - 20, height - 24, "ESC / ENTER / SPACE 로 종료", {
      fontFamily: FONT_FAMILY,
      fontSize: "16px",
      color: "#8c8c8c",
      resolution: 2
    }).setOrigin(1, 0.5).setDepth(101);
  }

  private registerInput(): void {
    this.input.keyboard?.once("keydown-ESC", () => this.finishCredits());
    this.input.keyboard?.once("keydown-ENTER", () => this.finishCredits());
    this.input.keyboard?.once("keydown-SPACE", () => this.finishCredits());
    this.input.once("pointerdown", () => this.finishCredits());
  }

  private getAnimationKey(spriteKey: string): string {
    return `${spriteKey}-walk-down`;
  }

  private finishCredits(): void {
    if (this.isFinishing) {
      return;
    }

    this.isFinishing = true;
    this.sound.stopByKey(ENDING_BGM_KEY);
    this.cameras.main.fadeOut(900, 0, 0, 0);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
      this.scene.start(SceneKey.Start);
    });
  }
}
