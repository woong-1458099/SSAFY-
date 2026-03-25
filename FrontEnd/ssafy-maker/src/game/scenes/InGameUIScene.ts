import Phaser from "phaser";
import { SCENE_KEYS } from "../../common/enums/scene";
import { GameHud } from "../../features/ui/components/GameHud";
import { GameGuideUI, type GuideState } from "../../features/ui/components/GameGuideUI";
import { DialogueBox } from "../../features/ui/components/DialogueBox";
import { InGameMenuManager } from "../managers/InGameMenuManager";
import { PlaceActionManager } from "../managers/PlaceActionManager";
import { AreaTransitionOverlay } from "../view/AreaTransitionOverlay";
import { TutorialManager } from "../../features/tutorial";
import type { PlaceId } from "../../common/enums/area";
import type { HudState, PlayerStatsState, PlayerStatKey } from "../state/gameState";
import type { SavePayload } from "../../features/save/SaveService";
import type { SettingsPageState } from "../../features/menu/components/tabPages";

export interface UISceneData {
  mainScene: Phaser.Scene;
  getHudState: () => HudState;
  patchHudState: (next: Partial<HudState>) => void;
  getStatsState: () => PlayerStatsState;
  applyStatDelta: (delta: Partial<Record<PlayerStatKey, number>>, multiplier?: 1 | -1) => void;
  inventoryService: any;
  saveService: any;
  audioManager: any;
  displaySettingsManager: any;
  progressionManager: any;
  storyEventManager: any;
  buildSavePayload: () => SavePayload;
  restoreSavePayload: (payload: SavePayload) => boolean;
  handleLogout: () => void;
  adjustBgmVolume: (delta: number) => void;
  toggleBgmEnabled: () => void;
  adjustSfxVolume: (delta: number) => void;
  toggleSfxEnabled: () => void;
  adjustBrightness: (delta: number) => void;
}

export class InGameUIScene extends Phaser.Scene {
  private mainScene?: Phaser.Scene;
  private hud?: GameHud;
  private gameGuide?: GameGuideUI;
  private dialogueBox?: DialogueBox;
  private menuManager?: InGameMenuManager;
  private placeActionManager?: PlaceActionManager;
  private areaTransitionOverlay?: AreaTransitionOverlay;
  private tutorialManager?: TutorialManager;

  constructor() {
    super(SCENE_KEYS.inGameUI);
  }

  create(data: UISceneData) {
    this.mainScene = data.mainScene;
    
    // 1. HUD & Guide
    this.hud = new GameHud(this);
    this.hud.applyState(data.getHudState());
    this.gameGuide = new GameGuideUI(this);
    
    // 2. Dialogue & Overlay
    this.dialogueBox = new DialogueBox(this);
    this.areaTransitionOverlay = new AreaTransitionOverlay(this);
    
    // 3. Menu Manager
    this.menuManager = new InGameMenuManager({
      scene: this,
      getStatsState: data.getStatsState,
      getHudState: data.getHudState,
      patchHudState: data.patchHudState,
      applyStatDelta: data.applyStatDelta,
      inventoryService: data.inventoryService,
      saveService: data.saveService,
      buildSavePayload: data.buildSavePayload,
      restoreSavePayload: data.restoreSavePayload,
      getSettingsState: (): SettingsPageState => ({
        bgmVolume: data.audioManager.getVolumes().bgm,
        bgmEnabled: data.audioManager.isBgmEnabled(),
        sfxVolume: data.audioManager.getVolumes().sfx,
        sfxEnabled: data.audioManager.isSfxEnabled(),
        brightness: data.displaySettingsManager.getBrightness()
      }),
      onAdjustBgmVolume: data.adjustBgmVolume,
      onToggleBgm: data.toggleBgmEnabled,
      onAdjustSfxVolume: data.adjustSfxVolume,
      onToggleSfx: data.toggleSfxEnabled,
      onAdjustBrightness: data.adjustBrightness,
      onLogout: data.handleLogout
    });

    // 4. Place Action Manager
    this.placeActionManager = new PlaceActionManager({
      scene: this,
      audioManager: data.audioManager,
      getHudState: data.getHudState,
      patchHudState: data.patchHudState,
      applyStatDelta: data.applyStatDelta,
      inventoryService: data.inventoryService,
      getTimeCycleIndex: () => data.progressionManager.getTimeCycleIndex(),
      getActionPoint: () => data.progressionManager.getActionPoint(),
      getMaxActionPoint: () => data.progressionManager.getMaxActionPoint(),
      tryConsumeActionPoint: () => data.progressionManager.tryConsumeActionPoint({ notifyOnFailure: false }),
      onHomeTimeAdvanced: () => data.storyEventManager.requestFixedEventTrigger("home")
    });
    
    this.setupEventListeners();
    
    // Emit that UI is ready
    this.mainScene.events.emit("ui:ready", this);
  }

  private setupEventListeners() {
    if (!this.mainScene) return;

    this.mainScene.events.on("ui:patchHud", (patch: Partial<HudState>) => this.hud?.applyState(patch));
    this.mainScene.events.on("ui:updateGuide", (state: Partial<GuideState>) => this.gameGuide?.applyState(state));
    this.mainScene.events.on("ui:setGuideVisible", (visible: boolean) => this.gameGuide?.setVisible(visible));
    this.mainScene.events.on("ui:showNotice", (msg: string) => this.menuManager?.showNotice(msg));
    this.mainScene.events.on("ui:toggleMenu", () => this.menuManager?.toggle());
    this.mainScene.events.on("ui:closeMenu", () => this.menuManager?.close());
    this.mainScene.events.on("ui:refreshStats", () => this.menuManager?.refreshStatsUi());
    this.mainScene.events.on("ui:refreshInventory", () => this.menuManager?.refreshInventoryUi());
    this.mainScene.events.on("ui:openPlaceAction", (placeId: PlaceId) => this.placeActionManager?.open(placeId));
    this.mainScene.events.on("ui:closePlaceAction", () => this.placeActionManager?.close());
    this.mainScene.events.on("ui:renderTransitions", (targets: any[]) => this.areaTransitionOverlay?.render(targets));
    
    this.mainScene.events.on("ui:startTutorial", (options: { onComplete: () => void }) => {
      this.tutorialManager = new TutorialManager({
        scene: this,
        onComplete: options.onComplete
      });
      this.tutorialManager.start();
    });
  }

  public isMenuOpen() { return this.menuManager?.isOpen() ?? false; }
  public isPlaceActionOpen() { return this.placeActionManager?.isOpen() ?? false; }
  public getDialogueBox() { return this.dialogueBox!; }
  public getPlaceActionManager() { return this.placeActionManager!; }

  destroy() {
    this.hud?.destroy();
    this.gameGuide?.destroy();
    this.dialogueBox?.destroy();
    this.menuManager?.destroy();
    this.placeActionManager?.destroy();
    this.areaTransitionOverlay?.destroy();
    this.tutorialManager?.destroy();
  }
}
