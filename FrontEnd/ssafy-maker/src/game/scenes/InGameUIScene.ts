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
  private didCleanup = false;

  private readonly onPatchHud = (patch: Partial<HudState>) => this.hud?.applyState(patch);
  private readonly onUpdateGuide = (state: Partial<GuideState>) => this.gameGuide?.applyState(state);
  private readonly onSetGuideVisible = (visible: boolean) => this.gameGuide?.setVisible(visible);
  private readonly onShowNotice = (msg: string) => this.menuManager?.showNotice(msg);
  private readonly onToggleMenu = () => this.menuManager?.toggle();
  private readonly onCloseMenu = () => this.menuManager?.close();
  private readonly onRefreshStats = () => this.menuManager?.refreshStatsUi();
  private readonly onRefreshInventory = () => this.menuManager?.refreshInventoryUi();
  private readonly onOpenPlaceAction = (placeId: PlaceId) => this.placeActionManager?.open(placeId);
  private readonly onClosePlaceAction = () => this.placeActionManager?.close();
  private readonly onRenderTransitions = (targets: any[]) => this.areaTransitionOverlay?.render(targets);
  private readonly onSetTransitionsVisible = (visible: boolean) => this.areaTransitionOverlay?.setVisible(visible);
  private readonly onStartTutorial = (options: { onComplete: () => void }) => {
    this.tutorialManager?.destroy();
    this.tutorialManager = new TutorialManager({
      scene: this,
      onComplete: options.onComplete
    });
    this.tutorialManager.start();
  };

  constructor() {
    super(SCENE_KEYS.inGameUI);
  }

  create(data: UISceneData) {
    this.didCleanup = false;
    this.mainScene = data.mainScene;
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.handleSceneShutdown, this);
    this.events.once(Phaser.Scenes.Events.DESTROY, this.handleSceneShutdown, this);
    
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

    this.mainScene.events.on("ui:patchHud", this.onPatchHud);
    this.mainScene.events.on("ui:updateGuide", this.onUpdateGuide);
    this.mainScene.events.on("ui:setGuideVisible", this.onSetGuideVisible);
    this.mainScene.events.on("ui:showNotice", this.onShowNotice);
    this.mainScene.events.on("ui:toggleMenu", this.onToggleMenu);
    this.mainScene.events.on("ui:closeMenu", this.onCloseMenu);
    this.mainScene.events.on("ui:refreshStats", this.onRefreshStats);
    this.mainScene.events.on("ui:refreshInventory", this.onRefreshInventory);
    this.mainScene.events.on("ui:openPlaceAction", this.onOpenPlaceAction);
    this.mainScene.events.on("ui:closePlaceAction", this.onClosePlaceAction);
    this.mainScene.events.on("ui:setTransitionsVisible", this.onSetTransitionsVisible);
    this.mainScene.events.on("ui:renderTransitions", this.onRenderTransitions);
    this.mainScene.events.on("ui:startTutorial", this.onStartTutorial);
  }

  private cleanupEventListeners() {
    if (!this.mainScene) {
      return;
    }

    this.mainScene.events.off("ui:patchHud", this.onPatchHud);
    this.mainScene.events.off("ui:updateGuide", this.onUpdateGuide);
    this.mainScene.events.off("ui:setGuideVisible", this.onSetGuideVisible);
    this.mainScene.events.off("ui:showNotice", this.onShowNotice);
    this.mainScene.events.off("ui:toggleMenu", this.onToggleMenu);
    this.mainScene.events.off("ui:closeMenu", this.onCloseMenu);
    this.mainScene.events.off("ui:refreshStats", this.onRefreshStats);
    this.mainScene.events.off("ui:refreshInventory", this.onRefreshInventory);
    this.mainScene.events.off("ui:openPlaceAction", this.onOpenPlaceAction);
    this.mainScene.events.off("ui:closePlaceAction", this.onClosePlaceAction);
    this.mainScene.events.off("ui:setTransitionsVisible", this.onSetTransitionsVisible);
    this.mainScene.events.off("ui:renderTransitions", this.onRenderTransitions);
    this.mainScene.events.off("ui:startTutorial", this.onStartTutorial);
  }

  private handleSceneShutdown() {
    if (this.didCleanup) {
      return;
    }

    this.didCleanup = true;
    this.cleanupEventListeners();
    this.hud?.destroy();
    this.gameGuide?.destroy();
    this.dialogueBox?.destroy();
    this.menuManager?.destroy();
    this.placeActionManager?.destroy();
    this.areaTransitionOverlay?.destroy();
    this.tutorialManager?.destroy();
    this.hud = undefined;
    this.gameGuide = undefined;
    this.dialogueBox = undefined;
    this.menuManager = undefined;
    this.placeActionManager = undefined;
    this.areaTransitionOverlay = undefined;
    this.tutorialManager = undefined;
    this.mainScene = undefined;
  }

  public isMenuOpen() { return this.menuManager?.isOpen() ?? false; }
  public isPlaceActionOpen() { return this.placeActionManager?.isOpen() ?? false; }
  public getDialogueBox() { return this.dialogueBox!; }
  public getPlaceActionManager() { return this.placeActionManager!; }

  destroy() {
    this.handleSceneShutdown();
  }
}
