import Phaser from "phaser";
import { SceneKey } from "@shared/enums/sceneKey";
import { AudioManager } from "@core/managers/AudioManager";
import {
  applySessionToRegistry,
  beginLogout,
  clearStoredSession,
  fetchExistingSession,
  readStoredSession
} from "@features/auth/authSession";
import { SaveService, type SaveSlotData, type SaveSlotId, getSaveSlotMetaText, getSaveSlotLabel } from "@features/save/SaveService";
import {
  preloadStartSceneAssets,
  START_SCENE_ASSET_KEYS,
  START_SCENE_FONT_FAMILY
} from "@features/start/startSceneAssets";
import { START_SCENE_CONTINUE_MODAL } from "@features/start/startSceneUiConfig";
import { getDefaultSceneIdForArea } from "../game/scripts/scenes/sceneRegistry";


type ContinueSlotView = {
  slotId: SaveSlotId;
  data: SaveSlotData;
};

export class StartScene extends Phaser.Scene {
  private readonly audioManager = new AudioManager();
  private readonly saveService = new SaveService();
  private enterKey?: Phaser.Input.Keyboard.Key;
  private startArmed = false;
  private bgm?: Phaser.Sound.BaseSound;
  private logoutLabel?: Phaser.GameObjects.Text;
  private continueButton?: Phaser.GameObjects.Image;
  private continueSlots: ContinueSlotView[] = [];
  private continueModal?: Phaser.GameObjects.Container;
  private continueModalOpen = false;


  constructor() {
    super(SceneKey.Start);
  }

  preload(): void {
    preloadStartSceneAssets(this);
  }

  create(): void {
    void this.initializeScene();
  }

  private async initializeScene(): Promise<void> {
    this.input.enabled = true;
    this.startArmed = false;
    this.continueModalOpen = false;
    this.continueSlots = [];

    const authToken = this.registry.get("authToken");
    const storedSession = readStoredSession({ allowExpired: true });
    if (!storedSession) {
      void this.recoverSessionOrRedirect();
      return;
    }

    if (authToken !== "bff-session") {
      applySessionToRegistry(this.registry, storedSession);
    }

    const { width, height } = this.scale;

    const bg = this.add.image(width / 2, height / 2, START_SCENE_ASSET_KEYS.background);
    bg.setDisplaySize(width, height);

    const logo = this.add.image(width / 2, 190, START_SCENE_ASSET_KEYS.logo);
    logo.setScale(0.72);

    this.playBackgroundMusic();
    this.createLogoutButton(width);
    this.continueSlots = this.getAvailableContinueSlots();

    this.createImageButton(width / 2, 430, START_SCENE_ASSET_KEYS.newButton, () => this.startIntro());
    this.continueButton = this.createImageButton(width / 2, 550, START_SCENE_ASSET_KEYS.continueButton, () => this.openContinueModal(), this.continueSlots.length > 0);
    void this.hydrateContinueSlots();



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

  private async hydrateContinueSlots(): Promise<void> {
    try {
      await this.saveService.hydrate(true);
    } catch (error) {
      console.error("[StartScene] continue slot hydrate failed", error);
      return;
    }

    if (!this.sys.isActive()) {
      return;
    }

    this.continueSlots = this.getAvailableContinueSlots();
    this.syncContinueButtonState();
    if (this.continueModalOpen && this.continueSlots.length === 0) {
      this.closeContinueModal();
    }
  }

  private createImageButton(x: number, y: number, key: string, onClick: () => void, enabled = true): Phaser.GameObjects.Image {
    const button = this.add.image(x, y, key);
    const baseWidth = 360;
    const baseHeight = 92;

    button.setDisplaySize(baseWidth, baseHeight);
    button.setData("baseWidth", baseWidth);
    button.setData("baseHeight", baseHeight);
    button.on("pointerover", () => {
      if (!button.getData("enabled")) {
        return;
      }

      button.setDisplaySize(baseWidth * 1.04, baseHeight * 1.04);
    });
    button.on("pointerout", () => button.setDisplaySize(baseWidth, baseHeight));
    button.on("pointerdown", () => {
      if (!button.getData("enabled")) {
        return;
      }

      this.audioManager.play(this, START_SCENE_ASSET_KEYS.click, "sfx");
      button.setDisplaySize(baseWidth * 0.98, baseHeight * 0.98);
      onClick();
    });
    button.on("pointerup", () => {
      if (!button.getData("enabled")) {
        button.setDisplaySize(baseWidth, baseHeight);
        return;
      }

      button.setDisplaySize(baseWidth * 1.04, baseHeight * 1.04);
    });
    this.setImageButtonEnabled(button, enabled);
    return button;
  }

  private setImageButtonEnabled(button: Phaser.GameObjects.Image, enabled: boolean): void {
    button.setData("enabled", enabled);
    const baseWidth = button.getData("baseWidth") as number;
    const baseHeight = button.getData("baseHeight") as number;
    button.setDisplaySize(baseWidth, baseHeight);

    if (enabled) {
      button.clearTint();
      button.setAlpha(1);
      button.setInteractive({ useHandCursor: true });
      return;
    }

    button.disableInteractive();
    button.setAlpha(0.42);
    button.setTint(0x555555);
  }

  private syncContinueButtonState(): void {
    if (!this.continueButton) {
      return;
    }

    this.setImageButtonEnabled(this.continueButton, this.continueSlots.length > 0);
  }

  private createLogoutButton(width: number): void {
    const label = this.add.text(width - 64, 48, "로그아웃", {
      fontFamily: START_SCENE_FONT_FAMILY,
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
      this.audioManager.play(this, START_SCENE_ASSET_KEYS.click, "sfx");
      void this.handleLogout();
    });

    this.logoutLabel = label;
  }

  private async handleLogout(): Promise<void> {
    this.startArmed = false;
    this.input.enabled = false;
    this.stopBackgroundMusic();
    this.sound.stopAll();

    this.clearAuthRegistry();
    clearStoredSession();

    try {
      await beginLogout();
    } catch (error) {
      console.error("[StartScene] logout failed, falling back to local logout", error);
      this.scene.start(SceneKey.Login);
    }
  }

  private clearAuthRegistry(): void {
    this.registry.remove("authToken");
    this.registry.remove("authUser");
  }

  private async recoverSessionOrRedirect(): Promise<void> {
    const storedSession = readStoredSession({ allowExpired: true });
    if (storedSession) {
      applySessionToRegistry(this.registry, storedSession);
      this.scene.restart();
      return;
    }

    const existingSession = await fetchExistingSession();
    if (!existingSession) {
      this.scene.start(SceneKey.Login);
      return;
    }

    applySessionToRegistry(this.registry, existingSession);
    this.scene.restart();
  }

  private getAvailableContinueSlots(): ContinueSlotView[] {
    const slots = this.saveService.loadSlots();
    return this.saveService
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
    this.audioManager.play(this, START_SCENE_ASSET_KEYS.click, "sfx");

    const { width, height } = this.scale;
    const centerX = width / 2;
    const centerY = height / 2;
    const modal = START_SCENE_CONTINUE_MODAL;

    const overlay = this.add.rectangle(centerX, centerY, width, height, modal.overlayColor, modal.overlayAlpha);
    overlay.setInteractive();
    overlay.on("pointerdown", () => this.closeContinueModal());

    const panel = this.add.rectangle(centerX, centerY, modal.panelWidth, modal.panelHeight, modal.panelColor, modal.panelAlpha);
    panel.setStrokeStyle(3, modal.panelBorderColor, 1);

    const title = this.add.text(centerX, centerY + modal.titleOffsetY, modal.title, {
      fontFamily: START_SCENE_FONT_FAMILY,
      fontSize: `${modal.titleFontSize}px`,
      color: modal.titleColor
    }).setOrigin(0.5);

    const subtitle = this.add.text(centerX, centerY + modal.subtitleOffsetY, modal.subtitle, {
      fontFamily: START_SCENE_FONT_FAMILY,
      fontSize: `${modal.subtitleFontSize}px`,
      color: modal.subtitleColor
    }).setOrigin(0.5);

    const closeLabel = this.add.text(centerX + modal.closeOffsetX, centerY + modal.closeOffsetY, modal.closeLabel, {
      fontFamily: START_SCENE_FONT_FAMILY,
      fontSize: `${modal.closeFontSize}px`,
      color: modal.closeColor,
      backgroundColor: modal.closeBackgroundColor,
      padding: modal.closePadding
    }).setOrigin(0.5);
    closeLabel.setInteractive({ useHandCursor: true });
    closeLabel.on("pointerdown", () => this.closeContinueModal());

    const slotNodes: Phaser.GameObjects.GameObject[] = [];
    const startY = centerY + modal.rowStartOffsetY;
    this.continueSlots.slice(0, 5).forEach((slot, index) => {
      const y = startY + index * modal.rowSpacing;
      const row = this.add.rectangle(centerX, y, modal.rowWidth, modal.rowHeight, modal.rowColor, modal.rowAlpha);
      row.setStrokeStyle(2, modal.rowBorderColor, 1);
      row.setInteractive({ useHandCursor: true });
      row.on("pointerover", () => row.setFillStyle(modal.rowHoverColor, 1));
      row.on("pointerout", () => row.setFillStyle(modal.rowColor, modal.rowAlpha));
      row.on("pointerdown", () => this.continueFromSlot(slot.slotId));

      const slotLabel = this.add.text(centerX + modal.rowTextOffsetX, y + modal.rowPrimaryTextOffsetY, this.getSaveSlotLabel(slot.slotId), {
        fontFamily: START_SCENE_FONT_FAMILY,
        fontSize: `${modal.rowPrimaryFontSize}px`,
        color: modal.rowPrimaryColor
      });

      const metaLabel = this.add.text(centerX + modal.rowTextOffsetX, y + modal.rowSecondaryTextOffsetY, this.getSaveSlotMetaText(slot.data), {
        fontFamily: START_SCENE_FONT_FAMILY,
        fontSize: `${modal.rowSecondaryFontSize}px`,
        color: modal.rowSecondaryColor
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

    const saveSlot = this.saveService.loadSlot(slotId as SaveSlotData["slotId"]);
    if (!saveSlot) {
      return;
    }

    this.closeContinueModal();
    this.startArmed = false;
    this.input.enabled = false;
    this.cameras.main.fadeOut(280, 0, 0, 0);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
      this.registry.set("pendingRestorePayload", saveSlot.payload);
      const restoreSceneId = saveSlot.payload.world?.sceneId ??
        (saveSlot.payload.world?.areaId ? getDefaultSceneIdForArea(saveSlot.payload.world.areaId) : undefined);
      if (restoreSceneId) {
        this.registry.set("startSceneId", restoreSceneId);
      }
      this.scene.start(SceneKey.Main);
    });
  }

  private getSaveSlotLabel(slotId: SaveSlotId): string {
    return getSaveSlotLabel(slotId);
  }

  private getSaveSlotMetaText(slotData: SaveSlotData): string {
    return getSaveSlotMetaText(slotData);
  }

  private startIntro(): void {
    if (!this.startArmed) {
      return;
    }

    this.startArmed = false;
    this.input.enabled = false;
    this.cameras.main.fadeOut(280, 0, 0, 0);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
      this.registry.remove("pendingRestorePayload");
      this.registry.remove("startSceneId");
      this.scene.start(SceneKey.Intro);
    });
  }

  private playBackgroundMusic(): void {
    if (!this.cache.audio.exists(START_SCENE_ASSET_KEYS.bgm)) {
      return;
    }

    this.bgm = this.audioManager.add(this, START_SCENE_ASSET_KEYS.bgm, "bgm", { loop: true, volume: 0.45 }) ?? undefined;
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


}
