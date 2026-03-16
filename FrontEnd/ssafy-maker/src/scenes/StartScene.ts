import Phaser from "phaser";
import { SceneKey } from "@shared/enums/sceneKey";
import { AudioManager } from "@core/managers/AudioManager";
import { SaveManager, type SaveSlotData } from "@core/managers/SaveManager";
import { beginLogout, clearStoredSession, fetchExistingSession, readStoredSession } from "@features/auth/authSession";
import { DialogBox } from "@features/ui/components/DialogBox";
import { DUMMY_DIALOGS } from "@features/ui/types/dialog";

type ContinueSlotView = {
  slotId: string;
  data: SaveSlotData;
};

export class StartScene extends Phaser.Scene {
  private readonly audioManager = new AudioManager();
  private readonly saveManager = new SaveManager(6);
  private enterKey?: Phaser.Input.Keyboard.Key;
  private startArmed = false;
  private bgm?: Phaser.Sound.BaseSound;
  private logoutLabel?: Phaser.GameObjects.Text;
  private continueButton?: Phaser.GameObjects.Image;
  private continueSlots: ContinueSlotView[] = [];
  private continueModal?: Phaser.GameObjects.Container;
  private continueModalOpen = false;
  private uiDialogBox?: DialogBox;

  constructor() {
    super(SceneKey.Start);
  }

  preload(): void {
    this.load.image("start-bg", "assets/game/backgrounds/title_background.png");
    this.load.image("start-logo", "assets/game/ui/logo.png");
    this.load.image("start-btn-new", "assets/game/ui/new_game.png");
    this.load.image("start-btn-old", "assets/game/ui/old_game.png");
    this.load.audio("start-bgm", "assets/game/audio/BGM/MainTheme.mp3");
    this.load.audio("start-click", "assets/game/audio/SoundEffect/click.wav");
  }

  create(): void {
    const authToken = this.registry.get("authToken");
    const storedSession = readStoredSession();
    if (!authToken && !storedSession) {
      void this.recoverSessionOrRedirect();
      return;
    }

    const { width, height } = this.scale;

    const bg = this.add.image(width / 2, height / 2, "start-bg");
    bg.setDisplaySize(width, height);

    const logo = this.add.image(width / 2, 190, "start-logo");
    logo.setScale(0.72);

    this.playBackgroundMusic();
    this.createLogoutButton(width);
    this.continueSlots = this.getAvailableContinueSlots();

    this.createImageButton(width / 2, 430, "start-btn-new", () => this.startIntro());
    this.continueButton = this.createImageButton(width / 2, 550, "start-btn-old", () => this.openContinueModal(), this.continueSlots.length > 0);

    // 공통 UI 컴포넌트 뼈대 테스트 버튼 추가 (S14P21E206-369)
    const uiTestLabel = this.add.text(width / 2, 650, "[ UI 뼈대 대화창 테스트 ]", {
      fontFamily: "PFStardustBold, Malgun Gothic, sans-serif",
      fontSize: "20px", color: "#ffd700", backgroundColor: "#333333", padding: { left: 10, right: 10, top: 10, bottom: 10 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    uiTestLabel.on("pointerdown", () => this.runUITestDialog());

    this.enterKey = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);
    this.input.on("pointerup", this.handlePointerUp, this);
    this.time.delayedCall(180, () => {
      this.startArmed = true;
    });

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.input.off("pointerup", this.handlePointerUp, this);
      this.stopBackgroundMusic();
      this.logoutLabel?.destroy();
      this.logoutLabel = undefined;
      this.continueModal?.destroy(true);
      this.continueModal = undefined;
      this.continueButton = undefined;
    });
  }

  update(): void {
    if (this.startArmed && this.enterKey && Phaser.Input.Keyboard.JustDown(this.enterKey)) {
      this.startIntro();
    }
  }

  private handlePointerUp(pointer: Phaser.Input.Pointer): void {
    if (!this.startArmed) {
      return;
    }
    if (pointer.y > this.scale.height - 120) {
      return;
    }
  }

  private createImageButton(x: number, y: number, key: string, onClick: () => void, enabled = true): Phaser.GameObjects.Image {
    const button = this.add.image(x, y, key);
    const baseWidth = 360;
    const baseHeight = 92;

    button.setDisplaySize(baseWidth, baseHeight);
    if (!enabled) {
      button.setAlpha(0.42);
      button.setTint(0x555555);
      return button;
    }

    button.setInteractive({ useHandCursor: true });
    button.on("pointerover", () => button.setDisplaySize(baseWidth * 1.04, baseHeight * 1.04));
    button.on("pointerout", () => button.setDisplaySize(baseWidth, baseHeight));
    button.on("pointerdown", () => {
      this.audioManager.play(this, "start-click", "sfx");
      button.setDisplaySize(baseWidth * 0.98, baseHeight * 0.98);
      onClick();
    });
    button.on("pointerup", () => button.setDisplaySize(baseWidth * 1.04, baseHeight * 1.04));
    return button;
  }

  private createLogoutButton(width: number): void {
    const label = this.add.text(width - 64, 48, "로그아웃", {
      fontFamily: "PFStardustBold, Malgun Gothic, Apple SD Gothic Neo, Noto Sans KR, sans-serif",
      fontSize: "20px",
      color: "#f4fbff",
      backgroundColor: "#143149",
      padding: {
        left: 14,
        right: 14,
        top: 8,
        bottom: 8
      }
    });

    label.setOrigin(1, 0.5);
    label.setInteractive({ useHandCursor: true });
    label.on("pointerover", () => label.setStyle({ backgroundColor: "#1b496d" }));
    label.on("pointerout", () => label.setStyle({ backgroundColor: "#143149" }));
    label.on("pointerdown", () => {
      this.audioManager.play(this, "start-click", "sfx");
      void this.handleLogout();
    });

    this.logoutLabel = label;
  }

  private async handleLogout(): Promise<void> {
    this.startArmed = false;
    this.input.enabled = false;

    this.clearAuthRegistry();

    try {
      await beginLogout();
    } catch (error) {
      console.error("[StartScene] logout failed, falling back to local logout", error);
      clearStoredSession();
      this.scene.start(SceneKey.Login);
    }
  }

  private clearAuthRegistry(): void {
    this.registry.remove("authToken");
    this.registry.remove("authUser");
  }

  private async recoverSessionOrRedirect(): Promise<void> {
    const existingSession = await fetchExistingSession();
    if (!existingSession) {
      this.scene.start(SceneKey.Login);
      return;
    }

    this.registry.set("authToken", "bff-session");
    this.registry.set("authUser", {
      id: existingSession.user.id,
      email: existingSession.user.email,
      nickname: existingSession.user.email.split("@")[0]?.slice(0, 8) ?? "player"
    });
    this.scene.restart();
  }

  private getAvailableContinueSlots(): ContinueSlotView[] {
    const slots = this.saveManager.loadSlots();
    return this.saveManager
      .getSlotIds()
      .map((slotId) => {
        const data = slots[slotId];
        return data ? { slotId, data } : null;
      })
      .filter((entry): entry is ContinueSlotView => entry !== null);
  }

  private openContinueModal(): void {
    if (!this.startArmed || this.continueSlots.length === 0 || this.continueModalOpen) {
      return;
    }

    this.continueModalOpen = true;
    this.audioManager.play(this, "start-click", "sfx");

    const { width, height } = this.scale;
    const overlay = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.62);
    overlay.setInteractive();
    overlay.on("pointerdown", () => this.closeContinueModal());

    const panel = this.add.rectangle(width / 2, height / 2, 720, 430, 0x11263d, 0.96);
    panel.setStrokeStyle(3, 0x7dc9ff, 1);

    const title = this.add.text(width / 2, height / 2 - 160, "Continue", {
      fontFamily: "PFStardustBold, Malgun Gothic, Apple SD Gothic Neo, Noto Sans KR, sans-serif",
      fontSize: "34px",
      color: "#f4fbff"
    }).setOrigin(0.5);

    const subtitle = this.add.text(width / 2, height / 2 - 122, "저장된 슬롯을 선택하세요", {
      fontFamily: "PFStardustBold, Malgun Gothic, Apple SD Gothic Neo, Noto Sans KR, sans-serif",
      fontSize: "18px",
      color: "#b9d6f6"
    }).setOrigin(0.5);

    const closeLabel = this.add.text(width / 2 + 304, height / 2 - 180, "X", {
      fontFamily: "PFStardustBold, Malgun Gothic, Apple SD Gothic Neo, Noto Sans KR, sans-serif",
      fontSize: "24px",
      color: "#f4fbff",
      backgroundColor: "#1a4467",
      padding: { left: 10, right: 10, top: 6, bottom: 6 }
    }).setOrigin(0.5);
    closeLabel.setInteractive({ useHandCursor: true });
    closeLabel.on("pointerdown", () => this.closeContinueModal());

    const slotNodes: Phaser.GameObjects.GameObject[] = [];
    const startY = height / 2 - 62;
    const rowHeight = 72;
    this.continueSlots.slice(0, 5).forEach((slot, index) => {
      const y = startY + index * rowHeight;
      const row = this.add.rectangle(width / 2, y, 620, 56, 0x1c3f64, 0.96);
      row.setStrokeStyle(2, 0x4f98df, 1);
      row.setInteractive({ useHandCursor: true });
      row.on("pointerover", () => row.setFillStyle(0x28547f, 1));
      row.on("pointerout", () => row.setFillStyle(0x1c3f64, 0.96));
      row.on("pointerdown", () => this.continueFromSlot(slot.slotId));

      const slotLabel = this.add.text(width / 2 - 284, y - 14, this.getSaveSlotLabel(slot.slotId), {
        fontFamily: "PFStardustBold, Malgun Gothic, Apple SD Gothic Neo, Noto Sans KR, sans-serif",
        fontSize: "22px",
        color: "#f4fbff"
      });

      const metaLabel = this.add.text(width / 2 - 284, y + 10, this.getSaveSlotMetaText(slot.data), {
        fontFamily: "PFStardustBold, Malgun Gothic, Apple SD Gothic Neo, Noto Sans KR, sans-serif",
        fontSize: "14px",
        color: "#b9d6f6"
      });

      slotNodes.push(row, slotLabel, metaLabel);
    });

    this.continueModal = this.add.container(0, 0, [overlay, panel, title, subtitle, closeLabel, ...slotNodes]);
    this.continueModal.setDepth(1000);
  }

  private closeContinueModal(): void {
    if (!this.continueModalOpen) {
      return;
    }

    this.continueModalOpen = false;
    this.continueModal?.destroy(true);
    this.continueModal = undefined;
  }

  private continueFromSlot(slotId: string): void {
    if (!this.startArmed) {
      return;
    }

    this.closeContinueModal();
    this.startArmed = false;
    this.input.enabled = false;
    this.cameras.main.fadeOut(280, 0, 0, 0);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
      this.scene.start(SceneKey.Main, { saveSlotId: slotId });
    });
  }

  private getSaveSlotLabel(slotId: string): string {
    if (slotId === "auto") {
      return "auto";
    }

    const index = Number(slotId.replace("slot-", ""));
    return Number.isFinite(index) ? `저장 슬롯 ${index}` : slotId;
  }

  private getSaveSlotMetaText(slotData: SaveSlotData): string {
    const payload = slotData.payload as {
      hudState?: { week?: number; dayLabel?: string; timeLabel?: string; locationLabel?: string };
    };
    const hud = payload.hudState;
    const weekText = typeof hud?.week === "number" ? `${hud.week}주차` : "";
    const dayText = typeof hud?.dayLabel === "string" ? hud.dayLabel : "";
    const timeText = typeof hud?.timeLabel === "string" ? hud.timeLabel : "";
    const locationText = typeof hud?.locationLabel === "string" ? hud.locationLabel : "";
    const summary = [weekText, dayText, timeText].filter((entry) => entry.length > 0).join(" ");
    const savedAt = this.formatSaveTime(slotData.savedAt);
    return [summary, locationText, savedAt].filter((entry) => entry.length > 0).join(" | ");
  }

  private formatSaveTime(iso: string): string {
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) {
      return "저장 데이터";
    }

    return date.toLocaleString("ko-KR", {
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit"
    });
  }

  private startIntro(): void {
    if (!this.startArmed) {
      return;
    }

    this.startArmed = false;
    this.input.enabled = false;
    this.cameras.main.fadeOut(280, 0, 0, 0);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
      this.scene.start(SceneKey.Intro);
    });
  }

  private playBackgroundMusic(): void {
    if (!this.cache.audio.exists("start-bgm")) {
      return;
    }

    this.bgm = this.audioManager.add(this, "start-bgm", "bgm", { loop: true, volume: 0.45 }) ?? undefined;
    if (!this.bgm) {
      return;
    }
    if (!this.sound.locked) {
      this.bgm.play();
      return;
    }

    this.sound.once(Phaser.Sound.Events.UNLOCKED, () => {
      if (this.bgm && !this.bgm.isPlaying) {
        this.bgm.play();
      }
    });
  }

  private stopBackgroundMusic(): void {
    if (!this.bgm) {
      return;
    }
    this.bgm.stop();
    this.bgm.destroy();
    this.bgm = undefined;
  }

  /**
   * UI 뼈대 테스트 시작 (S14P21E206-369)
   */
  private runUITestDialog(): void {
    if (!this.uiDialogBox) {
      const { width, height } = this.scale;
      this.uiDialogBox = new DialogBox(this, width / 2, height - 160, 800, 240);
      this.uiDialogBox.setDepth(2000);
    }
    
    let index = 0;
    const playNext = () => {
      if (index >= DUMMY_DIALOGS.length) {
        this.uiDialogBox?.hideDialog();
        return;
      }
      
      const data = { ...DUMMY_DIALOGS[index] };
      data.action = () => {
        this.audioManager.play(this, "start-click", "sfx");
        playNext();
      };
      
      this.uiDialogBox?.showDialog(data);
      index++;
    };
    
    this.audioManager.play(this, "start-click", "sfx");
    playNext();
  }
}
