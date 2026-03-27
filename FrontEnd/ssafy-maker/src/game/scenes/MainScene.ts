// 씬 조립만 담당하고 디버그 오버레이에도 render bounds를 연결한다.
import Phaser from "phaser";
import { SCENE_KEYS } from "../../common/enums/scene";
import { DIALOGUE_IDS } from "../../common/enums/dialogue";
import { AudioManager } from "../../core/managers/AudioManager";
import { DisplaySettingsManager } from "../../core/managers/DisplaySettingsManager";
import { DebugOverlay } from "../../debug/overlay/DebugOverlay";
import { DebugPanel } from "../../debug/overlay/DebugPanel";
import { DebugMinigameHud } from "../../debug/overlay/DebugMinigameHud";
import { WorldGridOverlay } from "../../debug/overlay/WorldGridOverlay";
import { WorldTileEditor } from "../../debug/editor/WorldTileEditor";
import { DEBUG_FLAGS } from "../../debug/config/debugFlags";
import { DebugCommandBus } from "../../debug/services/DebugCommandBus";
import { DebugEventLogger } from "../../debug/services/DebugEventLogger";
import { DebugInputController } from "../../debug/services/DebugInputController";
import type { DebugPanelState } from "../../debug/types/debugTypes";
import type { AreaId } from "../../common/enums/area";
import { isRuntimeDialogueId, type DialogueScript } from "../../common/types/dialogue";
import type { SceneState } from "../../common/types/sceneState";
import type { PlayerAppearanceSelection } from "../../common/types/player";
import { InventoryService } from "../../features/inventory/InventoryService";
import { createDialogueActionRunner } from "../../features/minigame/dialogueActionHandler";
import { buildMinigameUnlockFlag } from "../../features/minigame/minigameUnlocks";
import { buildHudPatchFromTimeState, DAY_CYCLE, TIME_CYCLE } from "../../features/progression/TimeService";
import type { EndingFlowPayload } from "../../features/progression/types/ending";
import type { EndingId } from "../../features/progression/types/ending";
import { resolveEnding } from "../../features/progression/services/endingResolver";
import { issueDeathRecordToken, recordCurrentUserDeath } from "../../features/auth/api";
import {
  applySessionToRegistry,
  beginLogout,
  clearAuthRegistry,
  clearStoredSession,
  fetchExistingSession,
  patchStoredSessionUser,
  readStoredSession
} from "../../features/auth/authSession";
import { SceneKey } from "../../shared/enums/sceneKey";
import { trackGameStart, trackWeeklyProgressSnapshot } from "../../shared/lib/analytics";
import { SaveService, type SavePayload } from "../../features/save/SaveService";
import { ensureAuthoredStoryLoaded } from "../../infra/story/authoredStoryRepository";
import { SceneDirector } from "../directors/SceneDirector";
import { getAreaEntryPoint } from "../definitions/areas/areaDefinitions";
import { getStaticPlaceDefinitions } from "../definitions/places/placeDefinitions";
import {
  getAreaTransitionDefinitions,
  type AreaTransitionDefinition,
  type AreaTransitionId
} from "../definitions/places/areaTransitionDefinitions";
import { resolvePlayerAppearanceDefinition } from "../definitions/player/playerAppearanceResolver";
import { getSceneState } from "../definitions/sceneStates/sceneStateRegistry";
import { DialogueManager } from "../managers/DialogueManager";
import { FixedEventNpcManager } from "../managers/FixedEventNpcManager";
import {
  InteractionManager,
  type RuntimeStaticPlaceTarget
} from "../managers/InteractionManager";
import { NpcManager } from "../managers/NpcManager";
import { MinigameRewardManager } from "../managers/MinigameRewardManager";
import { ProgressionManager } from "../managers/ProgressionManager";
import { PlayerManager } from "../managers/PlayerManager";
import { StatSystemManager } from "../managers/StatSystemManager";
import { StoryEventManager } from "../managers/StoryEventManager";
import { WorldManager } from "../managers/WorldManager";
import type { HudState } from "../state/gameState";
import { InGameUIScene } from "./InGameUIScene";
import { SCENE_IDS, type SceneId } from "../scripts/scenes/sceneIds";
import { playPlaceBgm, playWorldBgm, createSkyBackground, createCampusBackground, type TimeOfDay } from "../../features/place/placeBackgrounds";
import {
  DEFAULT_START_SCENE_ID,
  getDefaultSceneIdForArea,
  getSceneScript
} from "../scripts/scenes/sceneRegistry";
import { buildRuntimeSceneScript, normalizeSceneState } from "../systems/sceneStateRuntime";
import {
  buildAdjacentWalkableTiles,
  countTrueCells,
  extractConnectedRegionsFromGrid,
  findFirstWalkableTile,
  type ParsedTmxMap,
  type TmxRuntimeGrids
} from "../systems/tmxNavigation";
import {
  AreaTransitionOverlay,
  type RuntimeAreaTransitionTarget
} from "../view/AreaTransitionOverlay";
import { UI_DEPTH } from "../systems/uiDepth";
import type { LegacyMinigameSceneKey } from "../../features/minigame/minigameSceneKeys";

export class MainScene extends Phaser.Scene {
  private static readonly PENDING_START_TILE_KEY = "pendingStartTile";
  private static readonly PENDING_RESTORE_PAYLOAD_KEY = "pendingRestorePayload";
  private static readonly PENDING_DEBUG_FIXED_EVENT_KEY = "pendingDebugFixedEvent";
  // Keep the Arcade Physics debug toggle across scene restarts and area changes.
  private static readonly DEBUG_MODE_REGISTRY_KEY = "debug.arcadePhysics.enabled";
  private readonly audioManager = new AudioManager();
  private readonly displaySettingsManager = new DisplaySettingsManager();
  private initialized = false;
  private debugLogger?: DebugEventLogger;
  private debugOverlay?: DebugOverlay;
  private debugPanel?: DebugPanel;
  private worldGridOverlay?: WorldGridOverlay;
  private worldTileEditor?: WorldTileEditor;
  private debugMinigameHud?: DebugMinigameHud;
  private worldManager?: WorldManager;
  private playerManager?: PlayerManager;
  private npcManager?: NpcManager;
  private dialogueManager?: DialogueManager;
  private statSystemManager?: StatSystemManager;
  private inventoryService?: InventoryService;
  private saveService?: SaveService;
  private uiScene?: InGameUIScene;
  private fixedEventNpcManager?: FixedEventNpcManager;
  private minigameRewardManager?: MinigameRewardManager;
  private progressionManager?: ProgressionManager;
  private interactionManager?: InteractionManager;
  private storyEventManager?: StoryEventManager;
  private debugCommandBus?: DebugCommandBus;
  private debugInputController?: DebugInputController;
  private unsubscribeDebugCommandBus?: () => void;
  private escapeKey?: Phaser.Input.Keyboard.Key;
  private plannerKey?: Phaser.Input.Keyboard.Key;
  private currentSceneId?: SceneId;
  private currentSceneState?: SceneState;
  private logoutInProgress = false;
  private runtimeDialogueScripts: Record<string, DialogueScript> = {};
  private destroySkyBackground?: () => void;
  private currentTimeOfDay?: TimeOfDay;
  private wasPlacePopupOpen = false;
  private brightnessOverlay?: Phaser.GameObjects.Rectangle;
  private currentStaticPlaceTargets: RuntimeStaticPlaceTarget[] = [];
  private pendingInitialAreaRefreshHandler?: () => void;
  private pendingInitialAreaRefreshEventName?: string;
  private pendingInitialAreaRefreshRequestId = 0;
  private deathSequenceActive = false;
  private pendingDeathSceneExit?: Phaser.Time.TimerEvent;
  private endingFlowRequested = false;
  private pendingDialogueWeekMismatch?: {
    key: string;
    frame: number;
  };
  private hasLoggedDialogueWeekMismatch = false;
  constructor() {
    super(SCENE_KEYS.main);
  }

  async create() {
    if (!(await this.ensureAuthenticatedEntry())) {
      return;
    }

    this.initialized = false;
    this.logoutInProgress = false;
    this.deathSequenceActive = false;
    this.endingFlowRequested = false;
    this.pendingDeathSceneExit?.remove(false);
    this.pendingDeathSceneExit = undefined;
    this.clearPendingInitialAreaRefresh();
    this.cameras.main.setRoundPixels(true);
    // 초기 데이터 로드: 씬 재시작(구역 이동) 시 저장된 restore payload에서 현재 주차를 먼저 읽어,
    // 항상 week 1을 불러오는 버그를 방지합니다.
    const pendingPayload = this.registry.get(MainScene.PENDING_RESTORE_PAYLOAD_KEY) as { gameState?: { hud?: { week?: number } } } | undefined;
    const initialWeek =
      (pendingPayload?.gameState?.hud?.week) ??
      (this.registry.get("week") as number | undefined) ??
      1;
    await ensureAuthoredStoryLoaded(this, initialWeek);
    this.debugLogger = new DebugEventLogger();
    this.debugCommandBus = new DebugCommandBus();
      this.debugInputController = new DebugInputController(this, this.debugCommandBus, (command) => {
      const debugHudVisible = this.debugMinigameHud?.isVisible() === true;
      const debugPanelVisible = this.debugPanel?.isVisible() === true;
      const debugTileEditorVisible = this.worldTileEditor?.isVisible() === true;
      const menuOpen = this.uiScene?.isMenuOpen() === true;
      const placePopupOpen = this.uiScene?.isPlaceActionOpen() === true;
      const plannerOpen = this.progressionManager?.isPlannerOpen() === true;
      const dialoguePlaying = this.dialogueManager?.isDialoguePlaying() === true;

      

      if (
        command.type === "toggleDebugOverlay" ||
        command.type === "toggleWorldGrid" ||
        command.type === "toggleDebugPanel" ||
        command.type === "toggleWorldTileEditor"
      ) {
        return true;
      }

      if (command.type === "switchStartScene") {
        return !menuOpen && !placePopupOpen && !plannerOpen && !dialoguePlaying;
      }

      if (command.type === "toggleMinigameHud") {
        return !menuOpen && !placePopupOpen && !plannerOpen && !dialoguePlaying;
      }

      return !menuOpen && !placePopupOpen && !plannerOpen && !dialoguePlaying && !debugHudVisible && !debugPanelVisible && !debugTileEditorVisible;
    });
    this.worldManager = new WorldManager(this);
    this.playerManager = new PlayerManager(this);
    this.npcManager = new NpcManager(this);
    this.dialogueManager = new DialogueManager(this);
    this.dialogueManager.setRuntimeDialogueScripts(this.runtimeDialogueScripts);
    this.statSystemManager = new StatSystemManager();
    this.inventoryService = new InventoryService();
    this.saveService = new SaveService();
    void this.saveService.hydrate(true).catch((error) => {
      console.error("[MainScene] background save hydrate failed", error);
    });
    this.fixedEventNpcManager = new FixedEventNpcManager(this);
    this.dialogueManager.setRuntimeHooks({
      getMetricValue: (stat) => {
        const hudState = this.statSystemManager!.getHudState();
        const statsState = this.statSystemManager!.getStatsState();
        const playerData = this.registry.get("playerData") as { gender?: string } | undefined;
        switch (stat) {
          case "hp":
            return hudState.hp;
          case "money":
            return hudState.money;
          case "week":
            return this.resolveDialogueWeekMetric(hudState.week);
          case "playerGender":
            return typeof playerData?.gender === "string" ? playerData.gender.toUpperCase() : "";
          default:
            return statsState[stat];
        }
      },
      applyStatDelta: (delta, multiplier = 1) => this.statSystemManager!.applyStatDelta(delta, multiplier as 1 | -1),
      getAffectionValue: (npcId) => this.statSystemManager!.getAffection(npcId),
      applyAffectionDelta: (changes) => this.statSystemManager!.applyAffectionDelta(changes),
      setFlags: (flags) => this.statSystemManager!.addFlags(flags),
      patchHudState: (next) => this.statSystemManager!.patchHudState(next),
      onNotice: (message) => this.events.emit("ui:showNotice", message),
      runAction: createDialogueActionRunner({
        scene: this,
        returnSceneKey: SCENE_KEYS.main,
        openShop: () => this.events.emit("ui:openPlaceAction", "shop") // Adjusted if needed
      }),
      getHudState: () => this.statSystemManager!.getHudState()
    });
    this.statSystemManager.attachHud({
      applyState: (patch) => this.handleHudStateApplied(patch)
    });
    this.progressionManager = new ProgressionManager({
      scene: this,
      getHudState: () => this.statSystemManager!.getHudState(),
      patchHudState: (next) => this.statSystemManager!.patchHudState(next),
      applyStatDelta: (delta, multiplier = 1) => this.statSystemManager!.applyStatDelta(delta, multiplier),
      getFixedEventSlots: (week) => this.storyEventManager?.getFixedEventSlotsForWeek(week) ?? new Map(),
      getCompletedFixedEventSlotIndices: (week) => this.storyEventManager?.getCompletedFixedEventSlotIndicesForWeek(week) ?? new Set(),
      resolveTimeAdvanceBlockedMessage: () => this.storyEventManager?.resolveTimeAdvanceBlockedMessage() ?? null,
      onNotice: (message) => this.events.emit("ui:showNotice", message),
      onStartEndingFlow: () => this.startEndingFlow(),
      onDayPassed: () => this.inventoryService?.resetDailyConsumableUsage()
    });
    this.progressionManager.initialize();
    this.storyEventManager = new StoryEventManager({
      scene: this,
      getHudState: () => this.statSystemManager!.getHudState(),
      getCurrentArea: () => this.worldManager?.getCurrentAreaId() ?? "world",
      getCurrentLocation: () => this.statSystemManager!.getHudState().locationLabel,
      getPlayerGender: () => {
        const raw = this.registry.get("playerData") as { gender?: string } | undefined;
        return typeof raw?.gender === "string" ? raw.gender.toUpperCase() : "MALE";
      },
      getPlayerName: () => {
        const raw = this.registry.get("playerData") as { name?: string } | undefined;
        const name = typeof raw?.name === "string" ? raw.name.trim() : "";
        return name.length > 0 ? name : "플레이어";
      },
      setRuntimeDialogueScript: (script) => this.setRuntimeDialogueScript(script),
      removeRuntimeDialogueScript: (dialogueId) => this.removeRuntimeDialogueScript(dialogueId),
      playDialogue: (dialogueId) => this.dialogueManager!.play(dialogueId),
      advanceTimeAfterFixedEvent: () => {
        if (this.progressionManager?.consumeActionPoint()) {
          this.storyEventManager?.syncWeek(this.statSystemManager!.getHudState().week);
          this.progressionManager?.presentCurrentScheduledActivity();
        }
      },
      isTutorialActive: () => {
        const progress = this.registry.get("tutorialProgress");
        // 레지스트리에 데이터가 있고, 아직 완료되지 않았다면 활성 상태로 간주 (재시작 시 안정성 확보)
        return progress && !progress.completedAt;
      },
      onNotice: (message) => this.events.emit("ui:showNotice", message)
    });
    await this.storyEventManager.initialize(initialWeek);
    this.minigameRewardManager = new MinigameRewardManager({
      scene: this,
      getHudState: () => this.statSystemManager!.getHudState(),
      patchHudState: (next) => this.statSystemManager!.patchHudState(next),
      applyStatDelta: (delta, multiplier = 1) => this.statSystemManager!.applyStatDelta(delta, multiplier),
      unlockMinigame: (sceneKey) => this.applyCompletedMinigameUnlock(sceneKey)
    });
    // PlaceActionManager is now in InGameUIScene
    this.interactionManager = new InteractionManager(
      this,
      this.playerManager,
      this.npcManager,
      this.dialogueManager,
      this.debugLogger
    );
    this.interactionManager.setPlaceInteractHandler((placeId) => {
      if (this.storyEventManager?.tryStartFixedEventForLocation(placeId) === true) {
        return true;
      }

      this.events.emit("ui:openPlaceAction", placeId);
      return true;
    });
    this.escapeKey = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
    this.plannerKey = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.P);
    this.statSystemManager.setStatsChangedListener(() => {
      this.events.emit("ui:refreshStats");
    });
    this.statSystemManager.setStateChangedListener(() => {
      this.evaluateImmediateEndingTrigger();
    });
    this.inventoryService.setChangeListener(() => {
      this.events.emit("ui:refreshInventory");
    });

    // Launch UI Scene
    this.scene.launch(SCENE_KEYS.inGameUI, {
      mainScene: this,
      getHudState: () => this.statSystemManager!.getHudState(),
      patchHudState: (next: any) => this.statSystemManager!.patchHudState(next),
      getStatsState: () => this.statSystemManager!.getStatsState(),
      applyStatDelta: (delta: any, multiplier = 1) => this.statSystemManager!.applyStatDelta(delta, multiplier as 1 | -1),
      incrementGamePlayCount: () => {
        const endingProgress = this.statSystemManager!.getEndingProgress();
        this.statSystemManager!.patchEndingProgress({
          gamePlayCount: endingProgress.gamePlayCount + 1
        });
      },
      patchEndingProgress: (next: { lottoRank?: number | null }) => this.statSystemManager!.patchEndingProgress(next),
      inventoryService: this.inventoryService,
      saveService: this.saveService,
      audioManager: this.audioManager,
      displaySettingsManager: this.displaySettingsManager,
      progressionManager: this.progressionManager,
      storyEventManager: this.storyEventManager,
      buildSavePayload: () => this.buildSavePayload(),
      restoreSavePayload: (payload: any) => this.restoreSavePayload(payload),
      handleLogout: () => this.handleLogout(),
      adjustBgmVolume: (delta: number) => this.adjustBgmVolume(delta),
      toggleBgmEnabled: () => this.toggleBgmEnabled(),
      adjustSfxVolume: (delta: number) => this.adjustSfxVolume(delta),
      toggleSfxEnabled: () => this.toggleSfxEnabled(),
      adjustBrightness: (delta: number) => this.adjustBrightness(delta),
      startLottoEndingFlow: () => {
        void this.startEndingFlow(this.buildEndingPayload({ lottoRank: 1 }));
      }
    });

    this.events.once("ui:ready", (uiScene: InGameUIScene) => {
      this.uiScene = uiScene;
      this.dialogueManager?.setDialogueBox(uiScene.getDialogueBox());
    });

    const director = new SceneDirector(
      this.npcManager,
      this.dialogueManager,
      this.debugLogger
    );
    this.interactionManager.setTransitionInteractHandler((transitionId) => {
      this.handleAreaTransition(transitionId);
    });
    const pendingRestorePayload = this.getPendingRestorePayload();
    const startScene = this.resolveStartScene();
    this.currentSceneId = startScene.id;
    const initialSceneState = this.resolveInitialSceneState(startScene, pendingRestorePayload);
    this.currentSceneState = initialSceneState;
    const runtimeSceneScript = buildRuntimeSceneScript(startScene, initialSceneState);
    const playerAppearance = resolvePlayerAppearanceDefinition(
      this.registry.get("playerData") as Partial<PlayerAppearanceSelection> | undefined
    );

    this.worldManager.loadArea(runtimeSceneScript.area);
    this.playerManager.setAppearance(playerAppearance);
    this.npcManager.setArea(runtimeSceneScript.area);
    this.interactionManager.setArea(runtimeSceneScript.area);
    this.interactionManager.setSceneState(initialSceneState);
    this.statSystemManager.patchHudState({
      locationLabel: this.getAreaLabel(runtimeSceneScript.area)
    });
    this.storyEventManager?.requestFixedEventTrigger(this.getAreaLabel(runtimeSceneScript.area));

    const tmxConfig = this.worldManager.getCurrentTmxConfig();
    const parsedMap = this.worldManager.getCurrentParsedTmxMap();
    const runtimeGrids = this.worldManager.getCurrentRuntimeGrids();
    const renderBounds = this.worldManager.getCurrentRenderBounds();

    this.playerManager.setRenderBounds(renderBounds);
    const transitionTargets = this.resolveAreaTransitionTargets(runtimeSceneScript.area, renderBounds);
    const staticPlaceTargets = this.resolveStaticPlaceTargets(
      runtimeSceneScript.area,
      renderBounds,
      parsedMap,
      runtimeGrids
    );
    this.currentStaticPlaceTargets = staticPlaceTargets;
    this.interactionManager.setTransitionTargets(transitionTargets);
    this.interactionManager.setStaticPlaceTargets(staticPlaceTargets);

    this.syncDebugWorldState();

    if (parsedMap && runtimeGrids && this.playerManager) {
      const startTile = this.resolvePlayerStartTile(runtimeSceneScript.area, parsedMap, runtimeGrids);
      this.playerManager.create(startTile.tileX, startTile.tileY, parsedMap.tileWidth);
    }

    this.applyPendingRestorePayload();
    this.statSystemManager.patchHudState({
      locationLabel: this.getAreaLabel(runtimeSceneScript.area)
    });

    if (DEBUG_FLAGS.overlayEnabled && this.debugLogger && this.npcManager) {
      this.debugOverlay = new DebugOverlay(this, this.debugLogger, this.npcManager);
      this.debugPanel = new DebugPanel(this, this.debugCommandBus);
      this.debugMinigameHud = new DebugMinigameHud(this);
      this.worldTileEditor = new WorldTileEditor(this, {
        onApply: ({ collisionGrid, interactionGrid }) => {
          this.applyDebugTileEditorGrids(collisionGrid, interactionGrid);
        }
      });
    }

    if (DEBUG_FLAGS.worldGridEnabled) {
      this.worldGridOverlay = new WorldGridOverlay(this);
      this.worldGridOverlay.render(
        runtimeGrids,
        parsedMap,
        renderBounds,
        this.playerManager.getSnapshot(),
        this.currentStaticPlaceTargets
      );
    }

    this.events.emit("ui:renderTransitions", transitionTargets);
    this.ensureBrightnessOverlay();
    this.applyBrightnessOverlay();
    this.ensureDebugModeInitialized();
    this.applyDebugMode(this.isDebugModeEnabled(), { persist: false });
    this.scale.on(Phaser.Scale.Events.RESIZE, this.handleResize, this);

    this.bindDebugControls();
    this.debugInputController.bind();
    let cleanedUp = false;
    const cleanupSceneResources = () => {
      if (cleanedUp) {
        return;
      }

      cleanedUp = true;
      this.unsubscribeDebugCommandBus?.();
      this.unsubscribeDebugCommandBus = undefined;
      this.debugCommandBus?.destroy();
      this.debugMinigameHud?.destroy();
      this.debugPanel?.destroy();
      this.worldGridOverlay?.destroy();
      this.worldGridOverlay = undefined;
      this.worldTileEditor?.destroy();
      this.debugInputController?.destroy();
      this.dialogueManager?.destroy();
      this.fixedEventNpcManager?.destroy();
      this.minigameRewardManager?.destroy();
      this.progressionManager?.destroy();
      this.storyEventManager?.destroy();
      this.scale.off(Phaser.Scale.Events.RESIZE, this.handleResize, this);
      this.clearPendingInitialAreaRefresh();
      this.pendingDeathSceneExit?.remove(false);
      this.pendingDeathSceneExit = undefined;
      this.deathSequenceActive = false;
      this.brightnessOverlay?.destroy();
      this.brightnessOverlay = undefined;
      this.destroySkyBackground?.();
      this.destroySkyBackground = undefined;

      // Stop the UI scene if it's running
      if (this.scene.isActive(SCENE_KEYS.inGameUI)) {
        this.scene.stop(SCENE_KEYS.inGameUI);
      }
    };
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, cleanupSceneResources);
    this.events.once(Phaser.Scenes.Events.DESTROY, cleanupSceneResources);

    this.initialized = true;
    await director.run(runtimeSceneScript);
    this.applyPendingDebugFixedEvent();
    this.time.delayedCall(0, () => {
      this.storyEventManager?.refreshCurrentWeekLoadState();
      this.storyEventManager?.tryStartQueuedOrCurrentFixedEvent();
    });
    this.trackAnalyticsGameStart();
    this.trackAnalyticsWeeklyProgress();

    const currentArea = this.worldManager.getCurrentAreaId() ?? "world";
    const cycle: TimeOfDay[] = ["오전", "오후", "저녁", "밤"];
    const timeOfDay = cycle[(this.progressionManager?.getTimeCycleIndex() ?? 0) % cycle.length];

    const mapPixelWidth = renderBounds && parsedMap
      ? parsedMap.width * renderBounds.tileWidth * renderBounds.scale
      : undefined;
    const mapPixelHeight = renderBounds && parsedMap
      ? parsedMap.height * renderBounds.tileHeight * renderBounds.scale
      : undefined;

    this.destroySkyBackground?.();
    if (currentArea === "world") {
      void playWorldBgm(this, timeOfDay, this.audioManager);
      this.destroySkyBackground = createSkyBackground(this, timeOfDay, mapPixelWidth, mapPixelHeight);
    } else if (currentArea === "downtown") {
      void playPlaceBgm(this, "downtown" as any, this.audioManager);
      this.destroySkyBackground = createSkyBackground(this, timeOfDay, mapPixelWidth, mapPixelHeight);
    } else if (currentArea === "campus" || currentArea === "classroom") {
      void playPlaceBgm(this, "campus" as any, this.audioManager);
      this.destroySkyBackground = createCampusBackground(this, -10);
    } else {
      void playPlaceBgm(this, currentArea as any, this.audioManager);
    }

    // Initialize tutorial for new games (after scene is fully set up)
    // Tutorial is now handled by InGameUIScene via events
    if (this.shouldStartTutorial()) {
      const isNewCharacter = this.registry.get("isNewCharacter") === true;
      this.registry.set("isNewCharacter", false);

      const startTutorial = () => {
        this.events.emit("ui:startTutorial", {
          onComplete: () => { /* Tutorial completed */ }
        });
      };

      if (isNewCharacter) {
        this.events.once("tutorial:plannerClosed", startTutorial);
      } else {
        this.time.delayedCall(200, startTutorial);
      }
    }

    // 첫 진입 직후 한 프레임 뒤에 현재 맵을 같은 좌표계로 다시 맞춘다.
    // 다른 맵을 갔다 돌아오면 정상화되던 초기 렌더 불안정을 여기서 흡수한다.
    this.queueInitialAreaRefresh(currentArea, this.playerManager.getSnapshot());
  }

  private async ensureAuthenticatedEntry(): Promise<boolean> {
    const storedSession = readStoredSession();
    if (this.registry.get("authToken") === "bff-session" && storedSession) {
      return true;
    }

    const existingSession = await fetchExistingSession();
    if (!existingSession) {
      clearAuthRegistry(this.registry);
      clearStoredSession();
      this.scene.start(SceneKey.Login);
      return false;
    }

    applySessionToRegistry(this.registry, existingSession);
    return true;
  }

  private async handleLogout(): Promise<void> {
    if (this.logoutInProgress) {
      return;
    }

    this.logoutInProgress = true;
    this.input.enabled = false;
    this.events.emit("ui:closeMenu");
    this.sound.stopAll();
    clearAuthRegistry(this.registry);
    clearStoredSession();

    try {
      await beginLogout();
    } catch (error) {
      console.error("[MainScene] logout failed, falling back to local logout", error);
      this.registry.remove(MainScene.PENDING_RESTORE_PAYLOAD_KEY);
      this.registry.remove(MainScene.PENDING_START_TILE_KEY);
      this.registry.remove("startSceneId");
      this.clearPendingInitialAreaRefresh();
      this.scene.start(SceneKey.Login);
    }
  }

  private handleResize(): void {
    this.layoutBrightnessOverlay();
  }

  private handleHudStateApplied(hudState: Partial<HudState>): void {
    this.events.emit("ui:patchHud", hudState);
    this.trackAnalyticsWeeklyProgress();
    if (typeof hudState.hp === "number") {
      this.maybeTriggerPlayerDeath(hudState.hp);
    }
  }

  private trackAnalyticsGameStart(): void {
    const hudState = this.statSystemManager?.getHudState();
    if (!hudState) {
      return;
    }

    trackGameStart({
      week: hudState.week,
      authenticated: readStoredSession() !== null
    });
  }

  private trackAnalyticsWeeklyProgress(): void {
    const hudState = this.statSystemManager?.getHudState();
    const statsState = this.statSystemManager?.getStatsState();
    const endingProgress = this.statSystemManager?.getEndingProgress();
    if (!hudState || !statsState || !endingProgress) {
      return;
    }

    trackWeeklyProgressSnapshot({
      week: hudState.week,
      money: hudState.money,
      fe: statsState.fe,
      be: statsState.be,
      teamwork: statsState.teamwork,
      luck: statsState.luck,
      hp: hudState.hp,
      stress: hudState.stress,
      game_play_count: endingProgress.gamePlayCount
    });
  }

  private maybeTriggerPlayerDeath(hp: number): void {
    if (!this.initialized || this.deathSequenceActive || hp > 0) {
      return;
    }

    this.deathSequenceActive = true;
    this.pendingDeathSceneExit?.remove(false);
    this.pendingDeathSceneExit = undefined;
    this.clearPendingInitialAreaRefresh();
    this.events.emit("ui:closeMenu");
    this.events.emit("ui:closePlaceAction");
    this.events.emit("ui:setInteractionPrompt", null);
    if (this.progressionManager?.isPlannerOpen()) {
      this.progressionManager.togglePlanner();
    }
    this.events.emit("ui:showDeathOverlay", {
      title: "WASTED",
      subtitle: "HP가 모두 소진되었습니다."
    });
    void this.recordCurrentUserDeathIfAvailable();

    this.pendingDeathSceneExit = this.time.delayedCall(1800, () => {
      this.pendingDeathSceneExit = undefined;
      if (!this.sys.isActive()) {
        return;
      }

      this.clearPendingInitialAreaRefresh();
      this.scene.start(SceneKey.Start);
    });
  }

  private async recordCurrentUserDeathIfAvailable(): Promise<void> {
    const session = readStoredSession();
    if (!session || this.registry.get("authToken") !== "bff-session") {
      return;
    }

    try {
      const { token } = await issueDeathRecordToken();
      const updatedUser = await recordCurrentUserDeath(token, {
        areaId: this.worldManager?.getCurrentAreaId(),
        sceneId: this.currentSceneId,
        cause: "HP_ZERO"
      });
      patchStoredSessionUser(updatedUser);
      this.registry.set("authUser", {
        id: updatedUser.id,
        email: updatedUser.email,
        nickname: updatedUser.username?.trim() || updatedUser.email.split("@")[0]?.slice(0, 8) || "player"
      });
    } catch (error) {
      console.error("[MainScene] failed to record player death", error);
    }
  }

  private ensureBrightnessOverlay(): void {
    if (this.brightnessOverlay) {
      return;
    }

    this.brightnessOverlay = this.add
      .rectangle(0, 0, this.scale.width, this.scale.height, 0x000000, 1)
      .setScrollFactor(0)
      .setDepth(UI_DEPTH.hud - 1);
    this.layoutBrightnessOverlay();
  }

  private layoutBrightnessOverlay(): void {
    if (!this.brightnessOverlay) {
      return;
    }

    this.brightnessOverlay.setPosition(this.scale.width / 2, this.scale.height / 2);
    this.brightnessOverlay.setSize(this.scale.width, this.scale.height);
    this.brightnessOverlay.setDisplaySize(this.scale.width, this.scale.height);
  }

  private applyBrightnessOverlay(): void {
    this.ensureBrightnessOverlay();
    if (!this.brightnessOverlay) {
      return;
    }

    const brightness = this.displaySettingsManager.getBrightness();
    const overlayAlpha = Phaser.Math.Clamp(1 - brightness, 0, 0.45);
    this.brightnessOverlay.setAlpha(overlayAlpha);
    this.brightnessOverlay.setVisible(overlayAlpha > 0.001);
  }

  private refreshCurrentAreaPresentation(
    expectedAreaId?: AreaId,
    expectedPlayerSnapshot?: { tileX: number; tileY: number },
    requestId?: number
  ): void {
    if (!this.sys.isActive() || !this.worldManager || !this.playerManager || !this.interactionManager) {
      return;
    }

    if (requestId !== undefined && this.pendingInitialAreaRefreshRequestId !== requestId) {
      return;
    }

    const areaId = this.worldManager.getCurrentAreaId();
    if (!areaId || (expectedAreaId && areaId !== expectedAreaId)) {
      return;
    }

    const playerSnapshot = this.playerManager.getSnapshot();
    if (!playerSnapshot) {
      return;
    }

    if (
      expectedPlayerSnapshot &&
      (
        playerSnapshot.tileX !== expectedPlayerSnapshot.tileX ||
        playerSnapshot.tileY !== expectedPlayerSnapshot.tileY
      )
    ) {
      return;
    }

    if (!this.worldManager.rerenderCurrentArea()) {
      return;
    }

    this.syncAreaPresentationAfterRerender(areaId, playerSnapshot);
  }

  private queueInitialAreaRefresh(
    expectedAreaId: AreaId,
    expectedPlayerSnapshot?: { tileX: number; tileY: number }
  ): void {
    this.clearPendingInitialAreaRefresh();
    const requestId = this.pendingInitialAreaRefreshRequestId;
    const eventName = Phaser.Scenes.Events.RENDER;

    const handler = () => {
      try {
        if (this.pendingInitialAreaRefreshRequestId !== requestId) {
          return;
        }

        if (!this.sys.isActive() || !this.worldManager || !this.playerManager || !this.interactionManager) {
          return;
        }

        this.refreshCurrentAreaPresentation(expectedAreaId, expectedPlayerSnapshot, requestId);
      } finally {
        this.finalizePendingInitialAreaRefresh(requestId);
      }
    };

    this.pendingInitialAreaRefreshEventName = eventName;
    this.pendingInitialAreaRefreshHandler = handler;
    this.events.once(eventName, handler);
  }

  private clearPendingInitialAreaRefresh(): void {
    this.finalizePendingInitialAreaRefresh();
  }

  private finalizePendingInitialAreaRefresh(requestId?: number): void {
    const activeRequestId = this.pendingInitialAreaRefreshRequestId;
    if (requestId !== undefined && requestId !== activeRequestId) {
      return;
    }

    if (this.pendingInitialAreaRefreshEventName) {
      this.events.off(this.pendingInitialAreaRefreshEventName, this.pendingInitialAreaRefreshHandler);
    }

    this.pendingInitialAreaRefreshHandler = undefined;
    this.pendingInitialAreaRefreshEventName = undefined;
    this.pendingInitialAreaRefreshRequestId = activeRequestId + 1;
  }

  private syncAreaPresentationAfterRerender(
    areaId: AreaId,
    playerSnapshot?: { tileX: number; tileY: number }
  ): void {
    if (!this.worldManager || !this.playerManager || !this.interactionManager) {
      return;
    }

    const parsedMap = this.worldManager.getCurrentParsedTmxMap();
    const runtimeGrids = this.worldManager.getCurrentRuntimeGrids();
    const renderBounds = this.worldManager.getCurrentRenderBounds();

    this.playerManager.setRenderBounds(renderBounds);

    const safePlayerTile = this.resolveSafeRefreshTile(playerSnapshot, runtimeGrids, parsedMap);
    if (safePlayerTile) {
      this.playerManager.debugTeleportToTile(safePlayerTile.tileX, safePlayerTile.tileY);
    }

    const transitionTargets = this.resolveAreaTransitionTargets(areaId, renderBounds);
    const staticPlaceTargets = this.resolveStaticPlaceTargets(
      areaId,
      renderBounds,
      parsedMap,
      runtimeGrids
    );

    this.interactionManager.setArea(areaId);
    this.interactionManager.setSceneState(this.currentSceneState);
    this.currentStaticPlaceTargets = staticPlaceTargets;
    this.interactionManager.setTransitionTargets(transitionTargets);
    this.interactionManager.setStaticPlaceTargets(staticPlaceTargets);
    this.resyncHudLocationLabel(areaId);
    this.syncDebugWorldState();
    this.applyBrightnessOverlay();

    if (this.worldGridOverlay) {
      this.worldGridOverlay.render(
        runtimeGrids,
        parsedMap,
        renderBounds,
        this.playerManager.getSnapshot(),
        this.currentStaticPlaceTargets
      );
    }

    this.events.emit("ui:renderTransitions", transitionTargets);
  }

  private resolveSafeRefreshTile(
    playerSnapshot: { tileX: number; tileY: number } | undefined,
    runtimeGrids?: NonNullable<ReturnType<WorldManager["getCurrentRuntimeGrids"]>>,
    parsedMap?: NonNullable<ReturnType<WorldManager["getCurrentParsedTmxMap"]>>
  ) {
    if (!playerSnapshot || !runtimeGrids || !parsedMap) {
      return undefined;
    }

    if (this.isWalkableTile(playerSnapshot.tileX, playerSnapshot.tileY, runtimeGrids, parsedMap)) {
      return {
        tileX: playerSnapshot.tileX,
        tileY: playerSnapshot.tileY
      };
    }

    return this.findNearestWalkableTile(playerSnapshot.tileX, playerSnapshot.tileY, runtimeGrids, parsedMap);
  }

  private isWalkableTile(
    tileX: number,
    tileY: number,
    runtimeGrids: NonNullable<ReturnType<WorldManager["getCurrentRuntimeGrids"]>>,
    parsedMap: NonNullable<ReturnType<WorldManager["getCurrentParsedTmxMap"]>>
  ) {
    if (tileX < 0 || tileY < 0 || tileX >= parsedMap.width || tileY >= parsedMap.height) {
      return false;
    }

    return runtimeGrids.blockedGrid[tileY]?.[tileX] !== true;
  }

  private findNearestWalkableTile(
    originTileX: number,
    originTileY: number,
    runtimeGrids: NonNullable<ReturnType<WorldManager["getCurrentRuntimeGrids"]>>,
    parsedMap: NonNullable<ReturnType<WorldManager["getCurrentParsedTmxMap"]>>
  ) {
    const maxRadius = Math.max(parsedMap.width, parsedMap.height);

    for (let radius = 1; radius <= maxRadius; radius += 1) {
      for (let dy = -radius; dy <= radius; dy += 1) {
        for (let dx = -radius; dx <= radius; dx += 1) {
          if (Math.max(Math.abs(dx), Math.abs(dy)) !== radius) {
            continue;
          }

          const tileX = originTileX + dx;
          const tileY = originTileY + dy;
          if (this.isWalkableTile(tileX, tileY, runtimeGrids, parsedMap)) {
            return { tileX, tileY };
          }
        }
      }
    }

    return findFirstWalkableTile(runtimeGrids.blockedGrid);
  }

  private adjustBgmVolume(delta: number): void {
    const current = this.audioManager.getVolumes().bgm;
    this.audioManager.setBgmVolume(current + delta);
    this.refreshCurrentAreaBgm();
  }

  private toggleBgmEnabled(): void {
    const next = !this.audioManager.isBgmEnabled();
    console.log(`[MainScene] Toggling BGM Enabled: ${next}`);
    this.audioManager.setBgmEnabled(next);
    this.refreshCurrentAreaBgm();
  }

  private adjustSfxVolume(delta: number): void {
    const current = this.audioManager.getVolumes().sfx;
    this.audioManager.setSfxVolume(current + delta);
  }

  private toggleSfxEnabled(): void {
    this.audioManager.setSfxEnabled(!this.audioManager.isSfxEnabled());
  }

  private adjustBrightness(delta: number): void {
    const current = this.displaySettingsManager.getBrightness();
    this.displaySettingsManager.setBrightness(current + delta);
    this.applyBrightnessOverlay();
  }

  private refreshCurrentAreaBgm(): void {
    const currentArea = this.worldManager?.getCurrentAreaId() ?? "world";
    const cycle: TimeOfDay[] = ["오전", "오후", "저녁", "밤"];
    const timeOfDay = cycle[(this.progressionManager?.getTimeCycleIndex() ?? 0) % cycle.length];

    if (currentArea === "world") {
      void playWorldBgm(this, timeOfDay, this.audioManager);
      return;
    }

    if (currentArea === "classroom") {
      void playPlaceBgm(this, "campus" as any, this.audioManager);
      return;
    }

    void playPlaceBgm(this, currentArea as any, this.audioManager);
  }

  update() {
    if (!this.initialized) {
      return;
    }

    if (
      !this.worldManager ||
      !this.playerManager ||
      !this.debugLogger ||
      !this.interactionManager
    ) {
      return;
    }

    const parsedMap = this.worldManager.getCurrentParsedTmxMap();
    const runtimeGrids = this.worldManager.getCurrentRuntimeGrids();
    const renderBounds = this.worldManager.getCurrentRenderBounds();
    this.worldTileEditor?.setWorldState({
      areaId: this.worldManager.getCurrentAreaId(),
      tmxKey: this.worldManager.getCurrentTmxConfig()?.tmxKey,
      parsedMap,
      runtimeGrids,
      renderBounds
    });
    const debugHudVisible = this.debugMinigameHud?.isVisible() === true;
    const debugPanelVisible = this.debugPanel?.isVisible() === true;
    const debugTileEditorVisible = this.worldTileEditor?.isVisible() === true;
    const menuOpen = this.uiScene?.isMenuOpen() === true;
    const placePopupOpen = this.uiScene?.isPlaceActionOpen() === true;

    if (this.wasPlacePopupOpen && !placePopupOpen) {
      const area = this.worldManager?.getCurrentAreaId() ?? "world";
      const cycle: TimeOfDay[] = ["오전", "오후", "저녁", "밤"];
      const timeOfDay = cycle[(this.progressionManager?.getTimeCycleIndex() ?? 0) % cycle.length];

      if (area === "world") {
        void playWorldBgm(this, timeOfDay, this.audioManager);
      } else if (area === "classroom") {
        void playPlaceBgm(this, "campus" as any, this.audioManager);
      } else {
        void playPlaceBgm(this, area as any, this.audioManager);
      }
    }
    this.wasPlacePopupOpen = placePopupOpen;

    const plannerOpen = this.progressionManager?.isPlannerOpen() === true;
    const dialoguePlaying = this.dialogueManager?.isDialoguePlaying() === true;
    const deathSequenceActive = this.deathSequenceActive;
    const transitionsVisible =
      !menuOpen &&
      !placePopupOpen &&
      !plannerOpen &&
      !dialoguePlaying &&
      !deathSequenceActive &&
      !debugHudVisible &&
      !debugPanelVisible &&
      !debugTileEditorVisible;

    this.interactionManager.setOverlayBlocked(
      menuOpen ||
        placePopupOpen ||
        plannerOpen ||
        deathSequenceActive ||
        debugHudVisible ||
        debugPanelVisible ||
        debugTileEditorVisible
    );
    this.playerManager.setInputLocked(
      this.interactionManager.isInputLocked() ||
        deathSequenceActive ||
        debugHudVisible ||
        debugPanelVisible ||
        debugTileEditorVisible ||
        menuOpen ||
        placePopupOpen ||
        plannerOpen
    );

    if (
      this.escapeKey &&
      Phaser.Input.Keyboard.JustDown(this.escapeKey) &&
      !deathSequenceActive &&
      !dialoguePlaying &&
      !plannerOpen
    ) {
      if (debugTileEditorVisible) {
        this.worldTileEditor?.setVisible(false);
        return;
      }
      if (debugPanelVisible) {
        this.debugPanel?.hide();
        return;
      }
      if (placePopupOpen) {
        this.events.emit("ui:closePlaceAction");
        return;
      }
      this.events.emit("ui:toggleMenu");
    }

    if (
      this.plannerKey &&
      Phaser.Input.Keyboard.JustDown(this.plannerKey) &&
      !deathSequenceActive &&
      !dialoguePlaying &&
      !menuOpen &&
      !placePopupOpen &&
      !debugHudVisible &&
      !debugPanelVisible &&
      !debugTileEditorVisible
    ) {
      this.progressionManager?.togglePlanner();
    }

    let fixedEventStarted = false;
    if (
      !menuOpen &&
      !placePopupOpen &&
      !plannerOpen &&
      !debugHudVisible &&
      !debugPanelVisible &&
      !debugTileEditorVisible &&
      !dialoguePlaying
    ) {
      this.storyEventManager?.refreshCurrentWeekLoadState();
      fixedEventStarted = this.storyEventManager?.tryStartQueuedOrCurrentFixedEvent() === true;
    }

    const automaticProgressionFlowOpened =
      !fixedEventStarted && this.progressionManager?.processAutomaticFlow() === true;
    this.syncDebugWorldState();
    this.fixedEventNpcManager?.render({
      presentation: this.storyEventManager?.getCurrentFixedEventPresentation() ?? null,
      areaId: this.worldManager.getCurrentAreaId() ?? "world",
      visible: !menuOpen && !placePopupOpen && !plannerOpen && !debugHudVisible && !debugPanelVisible && !debugTileEditorVisible && !dialoguePlaying
    });
    this.debugPanel?.render(this.buildDebugPanelState());

    this.playerManager.update(runtimeGrids, parsedMap);
    this.interactionManager.update();
    this.debugInputController?.update();
    this.worldTileEditor?.update();
    if (this.worldGridOverlay) {
      this.worldGridOverlay.render(
        runtimeGrids,
        parsedMap,
        renderBounds,
        this.playerManager.getSnapshot(),
        this.currentStaticPlaceTargets
      );
    }

    this.events.emit("ui:setTransitionsVisible", transitionsVisible);
    this.events.emit("ui:renderTransitions", this.resolveAreaTransitionTargets(this.worldManager.getCurrentAreaId() ?? "world", renderBounds));

    const player = this.playerManager.getSnapshot();
    if (player) {
      this.debugLogger.setPlayer(
        `${Math.round(player.x)}, ${Math.round(player.y)}`,
        `${player.tileX}, ${player.tileY}`
      );
    }

    const currentArea = this.worldManager.getCurrentAreaId();
    if (
      currentArea === "world" ||
      currentArea === "downtown" ||
      currentArea === "campus" ||
      currentArea === "classroom"
    ) {
      const cycle: TimeOfDay[] = ["오전", "오후", "저녁", "밤"];
      const newTimeOfDay = cycle[(this.progressionManager?.getTimeCycleIndex() ?? 0) % cycle.length];

      if (newTimeOfDay !== this.currentTimeOfDay) {
        this.currentTimeOfDay = newTimeOfDay;

        const rb = this.worldManager.getCurrentRenderBounds();
        const pm = this.worldManager.getCurrentParsedTmxMap();
        const mapPixelWidth = rb && pm ? pm.width * rb.tileWidth * rb.scale : undefined;
        const mapPixelHeight = rb && pm ? pm.height * rb.tileHeight * rb.scale : undefined;

        this.destroySkyBackground?.();
        if (currentArea === "world" || currentArea === "downtown") {
          this.destroySkyBackground = createSkyBackground(this, newTimeOfDay, mapPixelWidth, mapPixelHeight);
        } else if (currentArea === "campus" || currentArea === "classroom") {
          this.destroySkyBackground = createCampusBackground(this, -10);
        }

        if (currentArea === "world") {
          void playWorldBgm(this, newTimeOfDay, this.audioManager);
        }
      }
    }

    this.debugOverlay?.render();
    this.updateGameGuide();
  }

  private updateGameGuide(): void {
    if (!this.progressionManager || !this.storyEventManager) {
      return;
    }

    const debugHudVisible = this.debugMinigameHud?.isVisible() === true;
    const debugPanelVisible = this.debugPanel?.isVisible() === true;
    const debugTileEditorVisible = this.worldTileEditor?.isVisible() === true;
    const menuOpen = this.uiScene?.isMenuOpen() === true;
    const placePopupOpen = this.uiScene?.isPlaceActionOpen() === true;
    const plannerOpen = this.progressionManager?.isPlannerOpen() === true;
    const dialoguePlaying = this.dialogueManager?.isDialoguePlaying() === true;
    const deathSequenceActive = this.deathSequenceActive;

    this.events.emit(
      "ui:setGuideVisible",
      !menuOpen &&
        !placePopupOpen &&
        !plannerOpen &&
        !dialoguePlaying &&
        !deathSequenceActive &&
        !debugHudVisible &&
        !debugPanelVisible &&
        !debugTileEditorVisible
    );

    const tutorialProgress = this.registry.get("tutorialProgress");
    if (tutorialProgress && !tutorialProgress.completedAt) {
      this.events.emit("ui:updateGuide", {
        objective: "튜토리얼 진행 중",
        action: "튜토리얼 단계를 따르세요"
      });
      return;
    }

    if (this.progressionManager.isPlannerOpen()) {
      this.events.emit("ui:updateGuide", {
        objective: "주간 계획 세우기",
        action: "이번 주 일정을 계획하세요"
      });
      return;
    }

    const pendingEvent = this.storyEventManager.getPendingFixedEventInfo();
    if (pendingEvent) {
      const isRomance = (pendingEvent as any).isRomance === true;
      this.events.emit("ui:updateGuide", {
        objective: isRomance ? "❤️ 특별한 예감" : pendingEvent.eventName,
        location: pendingEvent.location,
        npc: isRomance ? "누군가 당신을 기다릴지도...?" : pendingEvent.participants.join(", "),
        action: isRomance ? "❤️ 설레는 만남을 준비하세요" : "고정 이벤트를 진행하세요"
      });
      return;
    }

    if (this.progressionManager.getActionPoint() <= 0) {
      this.events.emit("ui:updateGuide", {
        objective: "하루 일과 마무리",
        location: "집",
        action: "집으로 가서 휴식하세요"
      });
      return;
    }

    this.events.emit("ui:updateGuide", {
      objective: "자유 시간",
      location: "전체 지도",
      action: "NPC와 대화하거나 장소를 방문하세요"
    });
  }

  private syncDebugWorldState(): void {
    if (!this.debugLogger || !this.worldManager) {
      return;
    }

    const currentAreaId = this.worldManager.getCurrentAreaId() ?? this.currentSceneState?.area ?? "world";
    const tmxConfig = this.worldManager.getCurrentTmxConfig();
    const parsedMap = this.worldManager.getCurrentParsedTmxMap();
    const resolvedLayers = this.worldManager.getCurrentResolvedTmxLayers();
    const runtimeGrids = this.worldManager.getCurrentRuntimeGrids();
    const mapSize = parsedMap
      ? `${parsedMap.width}x${parsedMap.height} (${parsedMap.tileWidth}x${parsedMap.tileHeight})`
      : undefined;

    this.debugLogger.setArea(
      currentAreaId,
      tmxConfig?.tmxKey,
      mapSize,
      resolvedLayers?.collisionLayers.length,
      resolvedLayers?.interactionLayers.length,
      resolvedLayers?.foregroundLayers.length,
      runtimeGrids ? countTrueCells(runtimeGrids.blockedGrid) : 0,
      runtimeGrids ? countTrueCells(runtimeGrids.interactionGrid) : 0
    );
  }

  private bindDebugControls() {
    this.unsubscribeDebugCommandBus?.();
    this.unsubscribeDebugCommandBus = this.debugCommandBus?.subscribe((command) => {
      switch (command.type) {
        case "toggleDebugOverlay": {
          const nextEnabled = this.debugOverlay
            ? !this.debugOverlay.isVisible()
            : !this.isDebugModeEnabled();
          this.applyDebugMode(nextEnabled);
          break;
        }
        case "toggleDebugPanel":
          this.debugPanel?.toggle();
          if (this.debugPanel?.isVisible()) {
            // this.storyEventManager?.debugSyncAllWeeks();
          }
          break;
        case "toggleWorldTileEditor":
          this.worldTileEditor?.toggle();
          break;
        case "toggleWorldGrid":
          if (this.worldGridOverlay) {
            this.worldGridOverlay.setVisible(!this.worldGridOverlay.isVisible());
          }
          break;
        case "toggleMinigameHud":
          if (this.debugOverlay?.isVisible()) {
            this.debugMinigameHud?.toggle();
          }
          break;
        case "teleportPlayerToWorld":
          this.handleDebugTeleport(command.worldX, command.worldY);
          break;
        case "switchStartScene":
          this.restartWithDebugScene(command.sceneId);
          break;
        case "adjustHudValue": {
          const hudState = this.statSystemManager?.getHudState();
          if (!hudState || !this.statSystemManager) {
            break;
          }
          this.statSystemManager.patchHudState({
            [command.key]: hudState[command.key] + command.delta
          });
          this.events.emit("ui:showNotice", `디버그 ${command.key} ${command.delta > 0 ? "+" : ""}${command.delta}`);
          break;
        }
        case "adjustStatValue":
          this.statSystemManager?.applyStatDelta({ [command.key]: command.delta });
          this.events.emit("ui:showNotice", `디버그 ${command.key} ${command.delta > 0 ? "+" : ""}${command.delta}`);
          break;
        case "advanceTime":
          this.progressionManager?.debugAdvanceTime();
          this.storyEventManager?.syncWeek(this.statSystemManager!.getHudState().week);
          this.events.emit("ui:showNotice", "디버그 시간 진행");
          break;
        case "adjustWeek": {
          const timeState = this.progressionManager?.getTimeState();
          if (!timeState) {
            break;
          }
          this.progressionManager?.debugPatchTimeState({
            week: timeState.week + command.delta
          });
          // 주차 변경 시 force: true로 대화 데이터를 강제 재로드하여 주차 불일치 방지
          this.storyEventManager?.syncWeek(this.statSystemManager!.getHudState().week, { force: true });
          this.events.emit("ui:showNotice", `디버그 주차 ${command.delta > 0 ? "+" : ""}${command.delta}`);
          break;
        }
        case "adjustActionPoint": {
          const timeState = this.progressionManager?.getTimeState();
          if (!timeState) {
            break;
          }
          this.progressionManager?.debugPatchTimeState({
            actionPoint: timeState.actionPoint + command.delta
          });
          this.events.emit("ui:showNotice", `디버그 행동력 ${command.delta > 0 ? "+" : ""}${command.delta}`);
          break;
        }
        case "refillActionPoint": {
          const timeState = this.progressionManager?.getTimeState();
          if (!timeState) {
            break;
          }
          this.progressionManager?.debugPatchTimeState({
            actionPoint: timeState.maxActionPoint
          });
          this.events.emit("ui:showNotice", "디버그 행동력 최대치");
          break;
        }
        case "giveInventoryItem": {
          const result = this.inventoryService?.debugGrantItem(command.templateId);
          if (result) {
            this.events.emit("ui:showNotice", result.message);
          }
          break;
        }
        case "triggerCurrentFixedEvent":
          this.events.emit("ui:showNotice", 
            this.storyEventManager?.tryStartQueuedOrCurrentFixedEvent() ? "고정 이벤트 실행" : "실행 가능한 고정 이벤트가 없습니다"
          );
          break;
        case "jumpToFixedEvent":
          this.handleDebugFixedEventJump(command.week, command.eventId, {
            resetCompletion: command.resetCompletion === true,
            runImmediately: false
          });
          break;
        case "runFixedEvent":
          this.handleDebugFixedEventJump(command.week, command.eventId, {
            resetCompletion: command.resetCompletion === true,
            runImmediately: true
          });
          break;
        case "resetFixedEventCompletion": {
          const changed = this.storyEventManager?.debugResetFixedEventCompletion(command.eventId) === true;
          this.events.emit("ui:showNotice", changed ? `이벤트 완료 기록 초기화: ${command.eventId}` : `완료 기록이 없습니다: ${command.eventId}`);
          break;
        }
        case "resetFixedEventCompletionsForWeek": {
          const cleared = this.storyEventManager?.debugResetFixedEventCompletionsForWeek(command.week) ?? 0;
          this.events.emit("ui:showNotice", cleared > 0 ? `${command.week}주차 완료 기록 ${cleared}건 초기화` : `${command.week}주차 완료 기록이 없습니다`);
          break;
        }
        case "saveAuto":
          if (this.saveService) {
            void this.saveAutoWithNotice();
          }
          break;
        case "startEndingFlow":
          this.startDebugEndingFlow();
          this.events.emit("ui:showNotice", "디버그 엔딩 진입");
          break;
        case "startEndingFlowPreset":
          this.startDebugEndingFlow(command.endingId);
          this.events.emit("ui:showNotice", `디버그 엔딩 진입: ${command.endingId}`);
          break;
        default:
          this.assertNeverDebugCommand(command);
      }
    });
  }

  private assertNeverDebugCommand(command: never): never {
    throw new Error(`Unhandled debug command: ${JSON.stringify(command)}`);
  }

  private ensureDebugModeInitialized(): void {
    if (typeof this.registry.get(MainScene.DEBUG_MODE_REGISTRY_KEY) !== "boolean") {
      this.registry.set(MainScene.DEBUG_MODE_REGISTRY_KEY, false);
    }
  }

  private isDebugModeEnabled(): boolean {
    return this.registry.get(MainScene.DEBUG_MODE_REGISTRY_KEY) === true;
  }

  private applyDebugMode(enabled: boolean, options: { persist?: boolean } = {}): void {
    if (options.persist !== false) {
      this.registry.set(MainScene.DEBUG_MODE_REGISTRY_KEY, enabled);
    }

    const physicsWorld = this.physics?.world;
    if (physicsWorld) {
      // Sync Phaser Arcade Physics' built-in debug renderer with the global flag.
      physicsWorld.drawDebug = enabled;

      if (enabled) {
        if (!physicsWorld.debugGraphic || !physicsWorld.debugGraphic.scene) {
          physicsWorld.createDebugGraphic();
        }
        physicsWorld.debugGraphic?.setVisible(true);
      } else {
        physicsWorld.debugGraphic?.clear();
        physicsWorld.debugGraphic?.setVisible(false);
      }
    }

    if (this.debugOverlay) {
      this.debugOverlay.setVisible(enabled);
    }

    if (!enabled) {
      this.debugMinigameHud?.hide();
      this.debugPanel?.hide();
      this.worldTileEditor?.setVisible(false);
      this.worldGridOverlay?.setVisible(false);
    }
  }

  private handleDebugTeleport(worldX: number, worldY: number) {
    if (!this.playerManager || !this.worldManager) {
      return;
    }

    const parsedMap = this.worldManager.getCurrentParsedTmxMap();
    const renderBounds = this.worldManager.getCurrentRenderBounds();
    const runtimeGrids = this.worldManager.getCurrentRuntimeGrids();

    if (!parsedMap || !renderBounds || !runtimeGrids) {
      return;
    }

    const tileX = Math.floor((worldX - renderBounds.offsetX) / (renderBounds.tileWidth * renderBounds.scale));
    const tileY = Math.floor((worldY - renderBounds.offsetY) / (renderBounds.tileHeight * renderBounds.scale));

    if (tileX < 0 || tileY < 0 || tileX >= parsedMap.width || tileY >= parsedMap.height) {
      return;
    }

    if (runtimeGrids.blockedGrid[tileY]?.[tileX]) {
      this.debugLogger?.log(`debug:blocked-teleport:${tileX},${tileY}`);
      return;
    }

    if (this.playerManager.debugTeleportToTile(tileX, tileY)) {
      this.debugLogger?.log(`debug:teleport:${tileX},${tileY}`);
    }
  }

  private resolveStartScene() {
    const pendingRestorePayload = this.getPendingRestorePayload();
    const restoredSceneId = pendingRestorePayload?.world?.sceneId ??
      (pendingRestorePayload?.world?.areaId ? getDefaultSceneIdForArea(pendingRestorePayload.world.areaId) : undefined);
    const sceneId =
      (this.registry.get("startSceneId") as SceneId | undefined) ??
      restoredSceneId ??
      DEFAULT_START_SCENE_ID;
    return getSceneScript(sceneId) ?? getSceneScript(DEFAULT_START_SCENE_ID);
  }

  private resolveInitialSceneState(
    startScene: NonNullable<ReturnType<MainScene["resolveStartScene"]>>,
    pendingRestorePayload?: SavePayload
  ): SceneState | undefined {
    const defaultSceneState = normalizeSceneState(getSceneState(startScene.initialStateId));
    const restoredSceneState = this.reconcileCanonicalNpcPlacements(
      defaultSceneState,
      normalizeSceneState(pendingRestorePayload?.world?.sceneState)
    );

    if (!restoredSceneState) {
      return defaultSceneState;
    }

    if (!defaultSceneState) {
      return restoredSceneState;
    }

    if (restoredSceneState.npcs.length > 0 || defaultSceneState.npcs.length === 0) {
      return restoredSceneState;
    }

    return {
      ...defaultSceneState,
      area: restoredSceneState.area ?? defaultSceneState.area,
      id: restoredSceneState.id ?? defaultSceneState.id
    };
  }

  private reconcileCanonicalNpcPlacements(
    defaultSceneState?: SceneState,
    restoredSceneState?: SceneState
  ): SceneState | undefined {
    if (!defaultSceneState || !restoredSceneState) {
      return restoredSceneState;
    }

    const canonicalNpcIds = new Set(["minigame_npc", "nayool"]);
    const canonicalNpcById = new Map(
      defaultSceneState.npcs
        .filter((npc) => canonicalNpcIds.has(npc.npcId))
        .map((npc) => [npc.npcId, npc] as const)
    );

    if (canonicalNpcById.size === 0) {
      return restoredSceneState;
    }

    const restoredNpcById = new Map(
      restoredSceneState.npcs.map((npc) => [npc.npcId, npc] as const)
    );

    const reconciledNpcs = restoredSceneState.npcs
      .filter((npc) => {
        if (!canonicalNpcIds.has(npc.npcId)) {
          return true;
        }

        // 캠퍼스/교실 기본 roster에 없는 특수 NPC는 오래된 저장 데이터에서 제거한다.
        return canonicalNpcById.has(npc.npcId);
      })
      .map((npc) => {
        const canonicalNpc = canonicalNpcById.get(npc.npcId);
        if (!canonicalNpc) {
          return npc;
        }

        return {
          ...npc,
          x: canonicalNpc.x,
          y: canonicalNpc.y,
          facing: canonicalNpc.facing ?? npc.facing,
          dialogueId: canonicalNpc.dialogueId
        };
      });

    canonicalNpcById.forEach((canonicalNpc, npcId) => {
      if (restoredNpcById.has(npcId)) {
        return;
      }

      reconciledNpcs.push(canonicalNpc);
    });

    return {
      ...restoredSceneState,
      npcs: reconciledNpcs
    };
  }

  private restartWithScene(sceneId: SceneId) {
    if (!this.prepareSceneRestart(sceneId, { preservePendingStartTile: true })) {
      return;
    }
    this.scene.restart();
  }

  private restartWithDebugScene(sceneId: SceneId) {
    if (!this.prepareSceneRestart(sceneId, { preservePendingStartTile: false })) {
      return;
    }

    const debugStartTile = this.resolveDebugSceneStartTile(sceneId);
    if (debugStartTile) {
      this.registry.set(MainScene.PENDING_START_TILE_KEY, debugStartTile);
    }

    this.debugLogger?.log(`debug:switch-scene:${sceneId}`);
    this.scene.restart();
  }

  private resolveDebugSceneStartTile(sceneId: SceneId) {
    switch (sceneId) {
      case SCENE_IDS.classroomDefault:
        // Match the requested classroom debug spawn near screen position 1105, 535.
        return { tileX: 27, tileY: 12 };
      default:
        return undefined;
    }
  }

  private prepareSceneRestart(
    sceneId: SceneId,
    options: {
      preservePendingStartTile: boolean;
    }
  ): boolean {
    this.clearPendingInitialAreaRefresh();

    const nextSceneScript = getSceneScript(sceneId);
    if (!nextSceneScript) {
      return false;
    }

    const payload = this.buildSavePayload();

    if (!options.preservePendingStartTile) {
      this.registry.remove(MainScene.PENDING_START_TILE_KEY);
    }

    this.registry.set(MainScene.PENDING_RESTORE_PAYLOAD_KEY, {
      ...payload,
      gameState: {
        ...payload.gameState,
        hud: {
          ...payload.gameState.hud,
          locationLabel: this.getAreaLabel(nextSceneScript.area)
        }
      },
      world: {
        ...payload.world,
        areaId: nextSceneScript.area,
        sceneId,
        sceneState: undefined,
        playerTile: undefined
      }
    });
    this.registry.set("startSceneId", sceneId);

    return true;
  }

  private resyncHudLocationLabel(areaId?: AreaId): void {
    const resolvedAreaId = areaId ?? this.worldManager?.getCurrentAreaId();
    if (!resolvedAreaId || !this.statSystemManager) {
      return;
    }

    this.statSystemManager.patchHudState({
      locationLabel: this.getAreaLabel(resolvedAreaId)
    });
  }

  private handleAreaTransition(transitionId: AreaTransitionId) {
    const transition = getAreaTransitionDefinitions(this.worldManager?.getCurrentAreaId() ?? "world").find(
      (item) => item.id === transitionId
    );

    if (!transition) {
      this.debugLogger?.log(`debug:unhandled-transition:${transitionId}`);
      return;
    }

    const returnTransition = getAreaTransitionDefinitions(transition.toArea).find(
      (item) => item.toArea === transition.fromArea
    );

    if (returnTransition) {
      this.registry.set(
        MainScene.PENDING_START_TILE_KEY,
        this.resolveTransitionSpawnSeed(returnTransition)
      );
    }

    this.restartWithScene(getDefaultSceneIdForArea(transition.toArea));
  }

  private resolvePlayerStartTile(
    areaId: AreaId,
    parsedMap: NonNullable<ReturnType<WorldManager["getCurrentParsedTmxMap"]>>,
    runtimeGrids: NonNullable<ReturnType<WorldManager["getCurrentRuntimeGrids"]>>
  ) {
    const pendingStartTile = this.registry.get(MainScene.PENDING_START_TILE_KEY) as
      | { tileX: number; tileY: number }
      | undefined;

    if (pendingStartTile) {
      this.registry.remove(MainScene.PENDING_START_TILE_KEY);

      if (!runtimeGrids.blockedGrid[pendingStartTile.tileY]?.[pendingStartTile.tileX]) {
        return pendingStartTile;
      }
    }

    const entryPoint = getAreaEntryPoint(areaId);

    if (!entryPoint) {
      return findFirstWalkableTile(runtimeGrids.blockedGrid);
    }

    const tileX = Phaser.Math.Clamp(
      Math.floor(entryPoint.x / parsedMap.tileWidth),
      0,
      parsedMap.width - 1
    );
    const tileY = Phaser.Math.Clamp(
      Math.floor(entryPoint.y / parsedMap.tileHeight),
      0,
      parsedMap.height - 1
    );

    if (!runtimeGrids.blockedGrid[tileY]?.[tileX]) {
      return { tileX, tileY };
    }

    return findFirstWalkableTile(runtimeGrids.blockedGrid);
  }

  private resolveTransitionSpawnSeed(transition: AreaTransitionDefinition) {
    return {
      tileX: transition.tileX,
      tileY: transition.tileY
    };
  }

  private resolveAreaTransitionTargets(
    areaId: AreaId,
    renderBounds?: ReturnType<WorldManager["getCurrentRenderBounds"]>
  ): RuntimeAreaTransitionTarget[] {
    if (!renderBounds) {
      return [];
    }

    return getAreaTransitionDefinitions(areaId).map((transition) => ({
      id: transition.id,
      label: transition.label,
      isRomance: this.storyEventManager?.hasRomanceEventForArea(transition.toArea) === true,
      centerX:
        renderBounds.offsetX +
        (transition.tileX + (transition.tileWidth ?? 1) / 2) *
          renderBounds.tileWidth *
          renderBounds.scale,
      centerY:
        renderBounds.offsetY +
        (transition.tileY + (transition.tileHeight ?? 1) / 2) *
          renderBounds.tileHeight *
          renderBounds.scale,
      zoneX:
        renderBounds.offsetX +
        transition.tileX * renderBounds.tileWidth * renderBounds.scale,
      zoneY:
        renderBounds.offsetY +
        transition.tileY * renderBounds.tileHeight * renderBounds.scale,
      zoneWidth:
        (transition.tileWidth ?? 1) * renderBounds.tileWidth * renderBounds.scale,
      zoneHeight:
        (transition.tileHeight ?? 1) * renderBounds.tileHeight * renderBounds.scale,
      tileX: transition.tileX,
      tileY: transition.tileY,
      tileWidth: transition.tileWidth ?? 1,
      tileHeight: transition.tileHeight ?? 1,
      arrowDirection: transition.arrowDirection ?? "up",
      labelPlacement: transition.labelPlacement ?? "below"
    }));
  }

  private resolveStaticPlaceTargets(
    areaId: AreaId,
    renderBounds?: ReturnType<WorldManager["getCurrentRenderBounds"]>,
    parsedMap?: ParsedTmxMap,
    runtimeGrids?: TmxRuntimeGrids
  ): RuntimeStaticPlaceTarget[] {
    if (!renderBounds) {
      return [];
    }

    const staticPlaces = getStaticPlaceDefinitions(areaId);
    const tmxDerivedTargets = this.resolveTmxStaticPlaceTargets(
      staticPlaces,
      renderBounds,
      parsedMap,
      runtimeGrids
    );

    return staticPlaces.map((place) => {
      const tmxTarget = tmxDerivedTargets.get(place.id);
      if (tmxTarget) {
        return tmxTarget;
      }

      const interactionZone = place.interactionZone ?? place.zone;

      return {
        id: place.id,
        label: place.label,
        dialogueId: place.dialogueId!,
        x: renderBounds.offsetX + (interactionZone.x + interactionZone.width / 2) * renderBounds.scale,
        y: renderBounds.offsetY + (interactionZone.y + interactionZone.height / 2) * renderBounds.scale,
        zoneX: renderBounds.offsetX + interactionZone.x * renderBounds.scale,
        zoneY: renderBounds.offsetY + interactionZone.y * renderBounds.scale,
        zoneWidth: interactionZone.width * renderBounds.scale,
        zoneHeight: interactionZone.height * renderBounds.scale
      };
    });
  }

  private resolveTmxStaticPlaceTargets(
    staticPlaces: ReturnType<typeof getStaticPlaceDefinitions>,
    renderBounds?: ReturnType<WorldManager["getCurrentRenderBounds"]>,
    parsedMap?: ParsedTmxMap,
    runtimeGrids?: TmxRuntimeGrids
  ) {
    const targets = new Map<RuntimeStaticPlaceTarget["id"], RuntimeStaticPlaceTarget>();

    if (
      !renderBounds ||
      !parsedMap ||
      !runtimeGrids ||
      staticPlaces.length === 0
    ) {
      return targets;
    }

    const availableRegions = extractConnectedRegionsFromGrid(runtimeGrids.interactionGrid, 2);

    if (availableRegions.length === 0) {
      return targets;
    }

    staticPlaces.forEach((place) => {
      if (availableRegions.length === 0) {
        return;
      }

      const anchorTileX = Phaser.Math.Clamp(
        Math.floor((place.zone.x + place.zone.width / 2) / parsedMap.tileWidth),
        0,
        parsedMap.width - 1
      );
      const anchorTileY = Phaser.Math.Clamp(
        Math.floor((place.zone.y + place.zone.height / 2) / parsedMap.tileHeight),
        0,
        parsedMap.height - 1
      );

      let bestRegionIndex = -1;
      let bestDistance = Number.POSITIVE_INFINITY;

      availableRegions.forEach((region, index) => {
        const dx = region.centerX - anchorTileX;
        const dy = region.centerY - anchorTileY;
        const distance = dx * dx + dy * dy;

        if (distance < bestDistance) {
          bestDistance = distance;
          bestRegionIndex = index;
        }
      });

      if (bestRegionIndex < 0) {
        return;
      }

      const [region] = availableRegions.splice(bestRegionIndex, 1);
      if (!region) {
        return;
      }

      const promptTiles = buildAdjacentWalkableTiles(region, runtimeGrids.blockedGrid).map((tile) => ({
        tileX: tile.x,
        tileY: tile.y
      }));

      if (promptTiles.length === 0) {
        return;
      }

      const minTileX = Math.min(...promptTiles.map((tile) => tile.tileX));
      const maxTileX = Math.max(...promptTiles.map((tile) => tile.tileX));
      const minTileY = Math.min(...promptTiles.map((tile) => tile.tileY));
      const maxTileY = Math.max(...promptTiles.map((tile) => tile.tileY));
      const scaledTileWidth = renderBounds.tileWidth * renderBounds.scale;
      const scaledTileHeight = renderBounds.tileHeight * renderBounds.scale;
      const zoneX = renderBounds.offsetX + minTileX * scaledTileWidth;
      const zoneY = renderBounds.offsetY + minTileY * scaledTileHeight;
      const zoneWidth = (maxTileX - minTileX + 1) * scaledTileWidth;
      const zoneHeight = (maxTileY - minTileY + 1) * scaledTileHeight;

      targets.set(place.id, {
        id: place.id,
        label: place.label,
        dialogueId: place.dialogueId!,
        x: zoneX + zoneWidth / 2,
        y: zoneY + zoneHeight / 2,
        zoneX,
        zoneY,
        zoneWidth,
        zoneHeight,
        promptTiles
      });
    });

    return targets;
  }

  private applyDebugTileEditorGrids(collisionGrid: boolean[][], interactionGrid: boolean[][]) {
    const runtimeGrids = this.worldManager?.getCurrentRuntimeGrids();
    const areaId = this.worldManager?.getCurrentAreaId();
    const renderBounds = this.worldManager?.getCurrentRenderBounds();
    const parsedMap = this.worldManager?.getCurrentParsedTmxMap();

    if (!runtimeGrids || !areaId) {
      return;
    }

    runtimeGrids.blockedGrid = collisionGrid;
    runtimeGrids.interactionGrid = interactionGrid;
    this.currentStaticPlaceTargets = this.resolveStaticPlaceTargets(
      areaId,
      renderBounds,
      parsedMap,
      runtimeGrids
    );
    this.interactionManager?.setStaticPlaceTargets(this.currentStaticPlaceTargets);
  }

  private getAreaLabel(areaId: AreaId): string {
    switch (areaId) {
      case "campus":
        return "캠퍼스";
      case "classroom":
        return "교실";
      case "downtown":
        return "번화가";
      case "world":
      default:
        return "전체 지도";
    }
  }

  private resolveDialogueWeekMetric(hudWeek: number): number {
    const progressionWeek = this.progressionManager?.getTimeState().week;
    if (typeof progressionWeek !== "number") {
      return hudWeek;
    }

    if (progressionWeek === hudWeek) {
      this.pendingDialogueWeekMismatch = undefined;
      this.hasLoggedDialogueWeekMismatch = false;
      return progressionWeek;
    }

    const mismatchKey = `${progressionWeek}:${hudWeek}`;
    const currentFrame = this.game.getFrame();
    const pendingMismatch = this.pendingDialogueWeekMismatch;

    if (pendingMismatch?.key === mismatchKey && currentFrame > pendingMismatch.frame) {
      if (import.meta.env.DEV && !this.hasLoggedDialogueWeekMismatch) {
        this.hasLoggedDialogueWeekMismatch = true;
        console.warn(
          `[dialogue] week metric mismatch persisted across frames. progressionManager=${progressionWeek}, hud=${hudWeek}. Using progressionManager as source of truth.`
        );
      }
      return progressionWeek;
    }

    this.pendingDialogueWeekMismatch = {
      key: mismatchKey,
      frame: currentFrame
    };

    return hudWeek;
  }

  private buildEndingPayload(overrides: Partial<EndingFlowPayload> = {}): EndingFlowPayload {
    const hudState = this.statSystemManager?.getHudState() ?? this.statSystemManager!.getHudState();
    const statsState = this.statSystemManager?.getStatsState() ?? this.statSystemManager!.getStatsState();
    const endingProgress = this.statSystemManager?.getEndingProgress() ?? this.statSystemManager!.getEndingProgress();

    return {
      fe: statsState.fe,
      be: statsState.be,
      teamwork: statsState.teamwork,
      luck: statsState.luck,
      hp: hudState.hp,
      hpMax: hudState.hpMax,
      stress: hudState.stress,
      gamePlayCount: endingProgress.gamePlayCount,
      lottoRank: endingProgress.lottoRank,
      week: hudState.week,
      dayLabel: hudState.dayLabel,
      timeLabel: hudState.timeLabel,
      ...overrides
    };
  }

  private evaluateImmediateEndingTrigger(): void {
    if (this.endingFlowRequested) {
      return;
    }

    const payload = this.buildEndingPayload();
    const ending = resolveEnding(payload);
    if (ending.triggerMode !== "immediate") {
      return;
    }

    this.endingFlowRequested = true;
    void this.startEndingFlow(payload);
  }

  private async startEndingFlow(payload = this.buildEndingPayload()): Promise<void> {
    const ending = resolveEnding(payload);
    const entrySceneKey = ending.entryMode === "directSummary" ? SceneKey.FinalSummary : SceneKey.Completion;

    if (this.endingFlowRequested && this.scene.isActive(entrySceneKey)) {
      return;
    }
    this.endingFlowRequested = true;

    if (!this.saveService) {
      return;
    }

    try {
      await this.saveService.saveSlot("auto", this.buildEndingAutoSavePayload(ending));
    } catch (error) {
      console.error("[MainScene] ending auto save failed", error);
      this.events.emit("ui:showNotice", "엔딩 진입 전 오토 세이브에 실패했습니다.");
    }

    this.clearPendingInitialAreaRefresh();
    this.scene.start(entrySceneKey, payload);
  }

  private async saveAutoWithNotice(): Promise<void> {
    if (!this.saveService) {
      return;
    }

    try {
      await this.saveService.saveSlot("auto", this.buildSavePayload());
      this.events.emit("ui:showNotice", "오토 세이브 완료");
    } catch (error) {
      console.error("[MainScene] auto save failed", error);
      this.events.emit("ui:showNotice", "오토 세이브에 실패했습니다.");
    }
  }

  private startDebugEndingFlow(endingId?: EndingId): void {
    const payload = endingId ? this.buildEndingPresetPayload(endingId) : this.buildEndingPayload();
    const ending = resolveEnding(payload);
    const entrySceneKey = ending.entryMode === "directSummary" ? SceneKey.FinalSummary : SceneKey.Completion;
    this.clearPendingInitialAreaRefresh();
    this.scene.start(entrySceneKey, payload);
  }

  private buildEndingPresetPayload(endingId: EndingId): EndingFlowPayload {
    const base: Pick<EndingFlowPayload, "week" | "dayLabel" | "timeLabel" | "hpMax" | "stress" | "gamePlayCount" | "lottoRank"> = {
      week: 6,
      hpMax: 100,
      stress: 24,
      gamePlayCount: 0,
      lottoRank: null,
      dayLabel: "금요일",
      timeLabel: "밤"
    };

    switch (endingId) {
      case "lotto":
        return { ...base, fe: 30, be: 24, teamwork: 28, luck: 200, hp: 84, lottoRank: 1 };
      case "game_over":
        return { ...base, fe: 90, be: 84, teamwork: 72, luck: 40, hp: 0, stress: 92 };
      case "runaway":
        return { ...base, fe: 110, be: 106, teamwork: 104, luck: 52, hp: 38, stress: 100 };
      case "largecompany":
        return { ...base, fe: 180, be: 170, teamwork: 165, luck: 58, hp: 72 };
      case "lucky_job":
        return { ...base, fe: 88, be: 74, teamwork: 80, luck: 190, hp: 70 };
      case "gamer":
        return { ...base, fe: 70, be: 52, teamwork: 64, luck: 162, hp: 76, gamePlayCount: 18 };
      case "frontend_master":
        return { ...base, fe: 260, be: 92, teamwork: 118, luck: 46, hp: 68 };
      case "backend_master":
        return { ...base, fe: 82, be: 220, teamwork: 94, luck: 42, hp: 66 };
      case "collaborative_dev":
        return { ...base, fe: 170, be: 160, teamwork: 220, luck: 44, hp: 82 };
      case "leader_type":
        return { ...base, fe: 120, be: 118, teamwork: 260, luck: 40, hp: 88 };
      case "health_trainer":
        return { ...base, fe: 70, be: 68, teamwork: 108, luck: 34, hp: 96, hpMax: 210 };
      case "normal":
        return { ...base, fe: 118, be: 112, teamwork: 124, luck: 78, hp: 74 };
      default:
        return this.buildEndingPayload();
    }
  }

  private buildDebugPanelState(): DebugPanelState {
    const hud = this.statSystemManager?.getHudState() ?? this.statSystemManager!.getHudState();
    const stats = this.statSystemManager?.getStatsState() ?? this.statSystemManager!.getStatsState();
    const ending = resolveEnding(this.buildEndingPayload());
    const usedSlotCount = this.inventoryService?.getInventorySlots().filter((slot) => slot !== null).length ?? 0;
    const totalSlotCount = this.inventoryService?.getInventorySlots().length ?? 0;
    const storyWeeks = Array.from({ length: 6 }, (_, index) => {
      const week = index + 1;
      return {
        week,
        loaded: this.storyEventManager?.hasWeekLoaded(week) === true,
        events: this.storyEventManager?.getFixedEventDebugEntriesForWeek(week) ?? []
      };
    });

    return {
      currentSceneId: this.currentSceneId ?? "-",
      currentAreaId: this.worldManager?.getCurrentAreaId(),
      currentLocationLabel: hud.locationLabel,
      inventoryUsageText: `${usedSlotCount}/${totalSlotCount}`,
      fixedEventId: this.storyEventManager?.getCurrentFixedEventPresentation()?.eventId,
      hud,
      stats,
      endingDebug: {
        endingId: ending.endingId,
        title: ending.title,
        shortDescription: ending.shortDescription,
        dominantLabels: ending.dominantLabels,
        summaryStats: ending.summaryStats,
        introLines: ending.introLines,
        npcLine: ending.npcLine
      },
      storyDebug: {
        currentWeek: hud.week,
        weeks: storyWeeks
      }
    };
  }

  private buildSavePayload(): SavePayload {
    const playerSnapshot = this.playerManager?.getSnapshot();
    return {
      gameState: this.statSystemManager!.getState(),
      inventory: this.inventoryService!.serialize(),
      progression: this.progressionManager?.getSnapshot(),
      world: {
        areaId: this.worldManager?.getCurrentAreaId() ?? "world",
        sceneId: this.currentSceneId,
        sceneState: this.buildCurrentSceneStateSnapshot(),
        playerTile: playerSnapshot
          ? {
              tileX: playerSnapshot.tileX,
              tileY: playerSnapshot.tileY
            }
          : undefined
      },
      story: this.storyEventManager?.getSnapshot()
    };
  }

  private buildEndingAutoSavePayload(ending: ReturnType<typeof resolveEnding>): SavePayload {
    const payload = this.buildSavePayload();
    if (ending.autoSaveMode !== "recoverable" || !ending.autoSaveRestoreOverrides) {
      return payload;
    }

    const overrides = ending.autoSaveRestoreOverrides;
    const nextHud = { ...payload.gameState.hud };
    const nextStats = { ...payload.gameState.stats };
    const nextEndingProgress = { ...payload.gameState.endingProgress };

    if (typeof overrides.hp === "number") {
      nextHud.hp = overrides.hp;
    }
    if (typeof overrides.hpMax === "number") {
      nextHud.hpMax = overrides.hpMax;
    }
    if (typeof overrides.stress === "number") {
      nextHud.stress = overrides.stress;
      nextStats.stress = overrides.stress;
    }
    if (typeof overrides.fe === "number") {
      nextStats.fe = overrides.fe;
    }
    if (typeof overrides.be === "number") {
      nextStats.be = overrides.be;
    }
    if (typeof overrides.teamwork === "number") {
      nextStats.teamwork = overrides.teamwork;
    }
    if (typeof overrides.luck === "number") {
      nextStats.luck = overrides.luck;
    }
    if (typeof overrides.gamePlayCount === "number") {
      nextEndingProgress.gamePlayCount = overrides.gamePlayCount;
    }
    if ("lottoRank" in overrides) {
      nextEndingProgress.lottoRank = overrides.lottoRank ?? null;
    }

    return {
      ...payload,
      gameState: {
        ...payload.gameState,
        hud: nextHud,
        stats: nextStats,
        endingProgress: nextEndingProgress
      }
    };
  }

  private restoreSavePayload(payload: SavePayload): boolean {
    if (!this.statSystemManager || !this.inventoryService || !this.progressionManager || !this.storyEventManager) {
      return false;
    }

    this.clearPendingInitialAreaRefresh();

    if (payload.world?.playerTile) {
      this.registry.set(MainScene.PENDING_START_TILE_KEY, payload.world.playerTile);
    }
    this.registry.set(MainScene.PENDING_RESTORE_PAYLOAD_KEY, payload);

    if (payload.world?.sceneId || payload.world?.areaId) {
      this.registry.set(
        "startSceneId",
        payload.world.sceneId ?? getDefaultSceneIdForArea(payload.world.areaId)
      );
      this.scene.restart();
      return true;
    }

    this.statSystemManager.restore(payload.gameState);
    this.inventoryService.restore(payload.inventory);
    this.progressionManager.restore(payload.progression);
    this.storyEventManager.restore(payload.story);
    this.resyncHudLocationLabel(payload.world?.areaId);
    this.storyEventManager.syncWeek(payload.gameState.hud.week);
    this.events.emit("ui:refreshStats");
    this.events.emit("ui:refreshInventory");
    return true;
  }

  private buildCurrentSceneStateSnapshot(): SceneState | undefined {
    const baseSceneState = this.currentSceneState;
    const npcSnapshots = this.npcManager?.getSnapshot();

    if (!baseSceneState || !npcSnapshots?.length) {
      return baseSceneState;
    }

    const dialogueIdByNpcId = new Map(
      baseSceneState.npcs.map((npc) => [npc.npcId, npc.dialogueId] as const)
    );
    const fallbackDialogueId = baseSceneState.npcs[0]?.dialogueId ?? DIALOGUE_IDS.minsuIntro;

    return normalizeSceneState({
      ...baseSceneState,
      npcs: npcSnapshots.map((npc) => ({
        npcId: npc.id,
        x: npc.x,
        y: npc.y,
        facing: npc.facing,
        dialogueId: dialogueIdByNpcId.get(npc.id) ?? fallbackDialogueId
      }))
    });
  }

  private getPendingRestorePayload(): SavePayload | undefined {
    return this.registry.get(MainScene.PENDING_RESTORE_PAYLOAD_KEY) as SavePayload | undefined;
  }

  setRuntimeDialogueScript(script: DialogueScript): void {
    if (!isRuntimeDialogueId(script.id)) {
      this.debugLogger?.log(`debug:invalid-runtime-dialogue:${script.id}`);
      return;
    }

    this.runtimeDialogueScripts[script.id] = script;
    this.dialogueManager?.setRuntimeDialogueScripts(this.runtimeDialogueScripts);
  }

  removeRuntimeDialogueScript(dialogueId: string): void {
    const normalizedDialogueId = dialogueId.trim();
    if (!isRuntimeDialogueId(normalizedDialogueId)) {
      return;
    }

    delete this.runtimeDialogueScripts[normalizedDialogueId];
    this.dialogueManager?.setRuntimeDialogueScripts(this.runtimeDialogueScripts);
  }

  clearRuntimeDialogueScripts(): void {
    this.runtimeDialogueScripts = {};
    this.dialogueManager?.setRuntimeDialogueScripts(this.runtimeDialogueScripts);
  }

  hasGameFlag(flag: string): boolean {
    return this.statSystemManager?.hasFlag(flag) === true;
  }

  addGameFlags(flags: string[]): void {
    this.statSystemManager?.addFlags(flags);
  }

  private applyCompletedMinigameUnlock(sceneKey: LegacyMinigameSceneKey): void {
    this.statSystemManager?.addFlags([buildMinigameUnlockFlag(sceneKey)]);
  }

  private applyPendingRestorePayload(): void {
    const payload = this.getPendingRestorePayload();
    if (!payload || !this.statSystemManager || !this.inventoryService || !this.progressionManager || !this.storyEventManager) {
      return;
    }

    this.registry.remove(MainScene.PENDING_RESTORE_PAYLOAD_KEY);
    this.statSystemManager.restore(payload.gameState);
    this.inventoryService.restore(payload.inventory);
    this.progressionManager.restore(payload.progression);
    this.storyEventManager.restore(payload.story);
    this.resyncHudLocationLabel(payload.world?.areaId);
    this.storyEventManager.syncWeek(payload.gameState.hud.week);
    if (payload.world?.playerTile) {
      this.playerManager?.debugTeleportToTile(payload.world.playerTile.tileX, payload.world.playerTile.tileY);
    }
    this.events.emit("ui:refreshStats");
    this.events.emit("ui:refreshInventory");
  }
  private handleDebugFixedEventJump(
    week: number,
    eventId: string,
    options: {
      resetCompletion: boolean;
      runImmediately: boolean;
    }
  ): void {
    const event = this.storyEventManager?.getFixedEventDebugEntry(week, eventId);
    if (!event) {
      this.events.emit("ui:showNotice", "선택한 이벤트 데이터를 아직 불러오지 못했습니다");
      this.storyEventManager?.syncWeek(week);
      return;
    }

    const payload = this.buildSavePayload();
    const targetSceneId = getDefaultSceneIdForArea(event.areaId);
    const timeCycleIndex = Math.max(0, TIME_CYCLE.findIndex((label) => label === event.timeOfDay));
    const dayCycleIndex = Phaser.Math.Clamp(event.day - 1, 0, DAY_CYCLE.length - 1);

    if (payload.progression) {
      payload.progression.timeState = {
        ...payload.progression.timeState,
        week: event.week,
        dayCycleIndex,
        timeCycleIndex,
        actionPoint: payload.progression.timeState.maxActionPoint
      };
      payload.progression.weeklyPlanWeek = event.week;
      payload.progression.lastPaidWeeklySalaryWeek = Math.max(payload.progression.lastPaidWeeklySalaryWeek, event.week);
    }

    payload.gameState.hud = {
      ...payload.gameState.hud,
      ...buildHudPatchFromTimeState(payload.progression?.timeState ?? {
        actionPoint: payload.gameState.hud.actionPoint,
        maxActionPoint: payload.gameState.hud.maxActionPoint,
        timeCycleIndex,
        dayCycleIndex,
        week: event.week
      }),
      locationLabel: event.locationLabel
    };

    if (options.resetCompletion) {
      payload.story = {
        completedFixedEventIds: (payload.story?.completedFixedEventIds ?? []).filter((completedEventId) => completedEventId !== event.eventId)
      };
    }

    payload.world = {
      areaId: event.areaId,
      sceneId: targetSceneId
    };

    if (options.runImmediately) {
      this.registry.set(MainScene.PENDING_DEBUG_FIXED_EVENT_KEY, {
        week: event.week,
        eventId: event.eventId
      });
    } else {
      this.registry.remove(MainScene.PENDING_DEBUG_FIXED_EVENT_KEY);
    }

    const moved = this.restoreSavePayload(payload);
    if (moved) {
      this.events.emit("ui:showNotice", 
        options.runImmediately
          ? `이벤트 실행 준비: ${event.eventName}`
          : `이벤트 조건으로 이동: ${event.eventName}`
      );
    }
  }

  private applyPendingDebugFixedEvent(): void {
    const pending = this.registry.get(MainScene.PENDING_DEBUG_FIXED_EVENT_KEY) as
      | {
          week: number;
          eventId: string;
        }
      | undefined;

    if (!pending) {
      return;
    }

    this.registry.remove(MainScene.PENDING_DEBUG_FIXED_EVENT_KEY);
    const started = this.storyEventManager?.debugStartFixedEventById(pending.week, pending.eventId) === true;
    this.events.emit("ui:showNotice", started ? `고정 이벤트 실행: ${pending.eventId}` : `고정 이벤트 실행 실패: ${pending.eventId}`);
  }

  private shouldStartTutorial(): boolean {
    // Skip if loading from a save
    const pendingRestorePayload = this.getPendingRestorePayload();
    if (pendingRestorePayload) {
      return false;
    }

    // Start tutorial for every new character creation
    if (this.registry.get("isNewCharacter") === true) {
      return true;
    }

    // Continue tutorial if it's currently in progress
    const tutorialProgress = this.registry.get("tutorialProgress");
    if (tutorialProgress && !tutorialProgress.completedAt) {
      return true;
    }

    return false;
  }
}
