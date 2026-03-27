import Phaser from "phaser";
import { UI_DEPTH } from "../../../game/systems/uiDepth";

const HELP_COLORS = {
  overlay: 0x000000,
  panelBg: 0x1a2b44,
  panelBorder: 0x6ab8ff,
  titleText: "#ffd000",
  sectionTitle: "#6ab8ff",
  mainText: "#ffffff",
  subText: "#b9d6f6",
  accentText: "#ff9966",
  btnBg: 0x4a6fa5,
  btnHover: 0x6ab8ff,
  pageIndicator: "#b9d6f6"
} as const;

const HELP_PAGES = [
  {
    title: "진행 방법",
    content: `평일 오전/오후
→ 강의 & 이벤트 진행

오후/밤
→ 자유 행동 가능 (권장)

※ 이벤트는 반드시 진행해야 합니다

→ 집 / 번화가 / 편의점에서
스탯 성장 & 관리 가능

※ 번화가 활동이 전반적으로 효율이 좋습니다`
  },
  {
    title: "목표 & 엔딩",
    content: `📈 목표
스탯을 성장시켜 다양한 엔딩 달성

🎯 엔딩
일반 엔딩 + 히든 엔딩 존재

💡 힌트
게임 / 운동 / 로또

⚠️ 주의
체력 0 → 게임오버
스트레스 100 → 게임오버`
  },
  {
    title: "재화 & 로또",
    content: `💰 재화
매주 월요일 50,000G 지급

🎟️ 로또 확률
꽝: 0원
5등: 8,000원
4등: 16,000원
3등: 40,000원
2등: 240,000원
1등: ???원`
  },
  {
    title: "조작법 & 강의",
    content: `🎮 조작
이동: WASD / 방향키
상호작용: Space
주간 계획표: P
인벤토리 / 설정: ESC

📚 강의 시스템
일정표(P)에서 강의 클릭
→ 변경 가능

원하는 강의 선택 후 계획 저장
현재 시간 진행을 누르면 강의 진행`
  }
];

export class HelpModal {
  private readonly scene: Phaser.Scene;
  private readonly root: Phaser.GameObjects.Container;
  private readonly overlay: Phaser.GameObjects.Rectangle;
  private readonly panel: Phaser.GameObjects.Graphics;
  private readonly titleText: Phaser.GameObjects.Text;
  private readonly contentText: Phaser.GameObjects.Text;
  private readonly pageIndicator: Phaser.GameObjects.Text;
  private readonly prevButton: Phaser.GameObjects.Container;
  private readonly nextButton: Phaser.GameObjects.Container;
  private readonly closeButton: Phaser.GameObjects.Container;
  private readonly fontFamily =
    "\"PFStardustBold\", \"Malgun Gothic\", \"Apple SD Gothic Neo\", \"Noto Sans KR\", sans-serif";

  private visible = false;
  private currentPage = 0;
  private readonly panelWidth = 540;
  private readonly panelHeight = 480;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;

    this.root = scene.add.container(0, 0).setDepth(UI_DEPTH.placeModal + 50).setScrollFactor(0);
    this.root.setVisible(false);

    // Overlay
    this.overlay = scene.add.rectangle(0, 0, 1, 1, HELP_COLORS.overlay, 0.6);
    this.overlay.setOrigin(0, 0);
    this.overlay.setInteractive();
    this.overlay.on("pointerdown", () => this.hide());

    // Panel
    this.panel = scene.add.graphics();

    // Title
    this.titleText = scene.add.text(0, 0, "", {
      fontFamily: this.fontFamily,
      fontSize: "28px",
      fontStyle: "bold",
      color: HELP_COLORS.titleText,
      resolution: 2
    });
    this.titleText.setOrigin(0.5, 0);

    // Content
    this.contentText = scene.add.text(0, 0, "", {
      fontFamily: this.fontFamily,
      fontSize: "18px",
      color: HELP_COLORS.mainText,
      lineSpacing: 10,
      resolution: 2,
      wordWrap: { width: this.panelWidth - 80 }
    });
    this.contentText.setOrigin(0, 0);

    // Page indicator
    this.pageIndicator = scene.add.text(0, 0, "", {
      fontFamily: this.fontFamily,
      fontSize: "16px",
      color: HELP_COLORS.pageIndicator,
      resolution: 2
    });
    this.pageIndicator.setOrigin(0.5);

    // Navigation buttons
    this.prevButton = this.createNavButton("◀ 이전", () => this.prevPage());
    this.nextButton = this.createNavButton("다음 ▶", () => this.nextPage());
    this.closeButton = this.createCloseButton();

    this.root.add([
      this.overlay,
      this.panel,
      this.titleText,
      this.contentText,
      this.pageIndicator,
      this.prevButton,
      this.nextButton,
      this.closeButton
    ]);

    this.updateLayout();
    this.scene.scale.on(Phaser.Scale.Events.RESIZE, this.updateLayout, this);
  }

  private createNavButton(label: string, onClick: () => void): Phaser.GameObjects.Container {
    const container = this.scene.add.container(0, 0);

    const bg = this.scene.add.graphics();
    bg.fillStyle(HELP_COLORS.btnBg, 1);
    bg.fillRoundedRect(-50, -18, 100, 36, 6);

    const text = this.scene.add.text(0, 0, label, {
      fontFamily: this.fontFamily,
      fontSize: "16px",
      fontStyle: "bold",
      color: "#ffffff",
      resolution: 2
    });
    text.setOrigin(0.5);

    container.add([bg, text]);
    container.setSize(100, 36);
    container.setInteractive({ useHandCursor: true });

    container.on("pointerover", () => {
      bg.clear();
      bg.fillStyle(HELP_COLORS.btnHover, 1);
      bg.fillRoundedRect(-50, -18, 100, 36, 6);
    });

    container.on("pointerout", () => {
      bg.clear();
      bg.fillStyle(HELP_COLORS.btnBg, 1);
      bg.fillRoundedRect(-50, -18, 100, 36, 6);
    });

    container.on("pointerdown", onClick);

    return container;
  }

  private createCloseButton(): Phaser.GameObjects.Container {
    const container = this.scene.add.container(0, 0);

    const bg = this.scene.add.graphics();
    bg.fillStyle(0x8b4513, 1);
    bg.fillRoundedRect(-60, -18, 120, 36, 6);

    const text = this.scene.add.text(0, 0, "닫기", {
      fontFamily: this.fontFamily,
      fontSize: "16px",
      fontStyle: "bold",
      color: "#ffffff",
      resolution: 2
    });
    text.setOrigin(0.5);

    container.add([bg, text]);
    container.setSize(120, 36);
    container.setInteractive({ useHandCursor: true });

    container.on("pointerover", () => {
      bg.clear();
      bg.fillStyle(0xa0522d, 1);
      bg.fillRoundedRect(-60, -18, 120, 36, 6);
    });

    container.on("pointerout", () => {
      bg.clear();
      bg.fillStyle(0x8b4513, 1);
      bg.fillRoundedRect(-60, -18, 120, 36, 6);
    });

    container.on("pointerdown", () => this.hide());

    return container;
  }

  private updatePageContent(): void {
    const page = HELP_PAGES[this.currentPage];
    this.titleText.setText(`🎮 ${page.title}`);
    this.contentText.setText(page.content);
    this.pageIndicator.setText(`${this.currentPage + 1} / ${HELP_PAGES.length}`);

    // Update button visibility
    this.prevButton.setVisible(this.currentPage > 0);
    this.nextButton.setVisible(this.currentPage < HELP_PAGES.length - 1);
  }

  private prevPage(): void {
    if (this.currentPage > 0) {
      this.currentPage--;
      this.updatePageContent();
    }
  }

  private nextPage(): void {
    if (this.currentPage < HELP_PAGES.length - 1) {
      this.currentPage++;
      this.updatePageContent();
    }
  }

  show(): void {
    if (this.visible) return;
    this.visible = true;
    this.currentPage = 0;
    this.updatePageContent();
    this.root.setVisible(true);
    this.root.alpha = 0;
    this.scene.tweens.add({
      targets: this.root,
      alpha: 1,
      duration: 150,
      ease: "Power2"
    });
  }

  hide(): void {
    if (!this.visible) return;
    this.visible = false;
    this.scene.tweens.add({
      targets: this.root,
      alpha: 0,
      duration: 100,
      ease: "Power2",
      onComplete: () => this.root.setVisible(false)
    });
  }

  toggle(): void {
    if (this.visible) {
      this.hide();
    } else {
      this.show();
    }
  }

  isVisible(): boolean {
    return this.visible;
  }

  destroy(): void {
    this.scene.scale.off(Phaser.Scale.Events.RESIZE, this.updateLayout, this);
    this.root.destroy(true);
  }

  private updateLayout(): void {
    const width = this.scene.scale.width;
    const height = this.scene.scale.height;

    // Overlay
    this.overlay.setSize(width, height);

    // Panel position
    const panelX = Math.round((width - this.panelWidth) / 2);
    const panelY = Math.round((height - this.panelHeight) / 2);

    // Draw panel
    this.panel.clear();
    this.panel.fillStyle(0x000000, 0.5);
    this.panel.fillRoundedRect(panelX + 4, panelY + 4, this.panelWidth, this.panelHeight, 12);
    this.panel.fillStyle(HELP_COLORS.panelBg, 0.95);
    this.panel.fillRoundedRect(panelX, panelY, this.panelWidth, this.panelHeight, 12);
    this.panel.lineStyle(3, HELP_COLORS.panelBorder, 1);
    this.panel.strokeRoundedRect(panelX, panelY, this.panelWidth, this.panelHeight, 12);

    // Title
    this.titleText.setPosition(panelX + this.panelWidth / 2, panelY + 24);

    // Content
    this.contentText.setPosition(panelX + 40, panelY + 80);

    // Page indicator
    this.pageIndicator.setPosition(panelX + this.panelWidth / 2, panelY + this.panelHeight - 62);

    // Navigation buttons
    this.prevButton.setPosition(panelX + 70, panelY + this.panelHeight - 28);
    this.nextButton.setPosition(panelX + this.panelWidth - 70, panelY + this.panelHeight - 28);
    this.closeButton.setPosition(panelX + this.panelWidth / 2, panelY + this.panelHeight - 28);
  }
}
