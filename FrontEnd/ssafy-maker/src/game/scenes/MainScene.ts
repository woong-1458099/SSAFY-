// 씬 조립만 담당하고 디버그 오버레이에도 render bounds를 연결한다.
import Phaser from "phaser";
import { SCENE_KEYS } from "../../common/enums/scene";
import { DIALOGUE_IDS } from "../../common/enums/dialogue";
import { DebugOverlay } from "../../debug/overlay/DebugOverlay";
import { DebugPanel } from "../../debug/overlay/DebugPanel";
import { DebugMinigameHud } from "../../debug/overlay/DebugMinigameHud";
import { WorldGridOverlay } from "../../debug/overlay/WorldGridOverlay";
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
import { launchMinigame, openMinigameMenu } from "../../features/minigame/MinigameGateway";
import { buildHudPatchFromTimeState, DAY_CYCLE, TIME_CYCLE } from "../../features/progression/TimeService";
import type { EndingFlowPayload } from "../../features/progression/types/ending";
import type { EndingId } from "../../features/progression/types/ending";
import { resolveEnding } from "../../features/progression/services/endingResolver";
import { SceneKey } from "../../shared/enums/sceneKey";
import { SaveService, type SavePayload } from "../../features/save/SaveService";
import { DialogueBox } from "../../features/ui/components/DialogueBox";
import { GameHud } from "../../features/ui/components/GameHud";
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
import { InGameMenuManager } from "../managers/InGameMenuManager";
import {
  InteractionManager,
  type RuntimeStaticPlaceTarget
} from "../managers/InteractionManager";
import { NpcManager } from "../managers/NpcManager";
import { MinigameRewardManager } from "../managers/MinigameRewardManager";
import { PlaceActionManager } from "../managers/PlaceActionManager";
import { ProgressionManager } from "../managers/ProgressionManager";
import { PlayerManager } from "../managers/PlayerManager";
import { StatSystemManager } from "../managers/StatSystemManager";
import { StoryEventManager } from "../managers/StoryEventManager";
import { WorldManager } from "../managers/WorldManager";
import type { SceneId } from "../scripts/scenes/sceneIds";
import { playPlaceBgm, playWorldBgm, createSkyBackground, type TimeOfDay } from "../../features/place/placeBackgrounds";
import {
  DEFAULT_START_SCENE_ID,
  getDefaultSceneIdForArea,
  getSceneScript
} from "../scripts/scenes/sceneRegistry";
import { buildRuntimeSceneScript, normalizeSceneState } from "../systems/sceneStateRuntime";
import { countTrueCells, findFirstWalkableTile } from "../systems/tmxNavigation";
import {
  AreaTransitionOverlay,
  type RuntimeAreaTransitionTarget
} from "../view/AreaTransitionOverlay";

export class MainScene extends Phaser.Scene {
  private static readonly PENDING_START_TILE_KEY = "pendingStartTile";
  private static readonly PENDING_RESTORE_PAYLOAD_KEY = "pendingRestorePayload";
  private static readonly PENDING_DEBUG_FIXED_EVENT_KEY = "pendingDebugFixedEvent";
  private initialized = false;
  private debugLogger?: DebugEventLogger;
  private debugOverlay?: DebugOverlay;
  private debugPanel?: DebugPanel;
  private worldGridOverlay?: WorldGridOverlay;
  private debugMinigameHud?: DebugMinigameHud;
  private worldManager?: WorldManager;
  private playerManager?: PlayerManager;
  private npcManager?: NpcManager;
  private dialogueManager?: DialogueManager;
  private statSystemManager?: StatSystemManager;
  private inventoryService?: InventoryService;
  private saveService?: SaveService;
  private dialogueBox?: DialogueBox;
  private hud?: GameHud;
  private menuManager?: InGameMenuManager;
  private fixedEventNpcManager?: FixedEventNpcManager;
  private minigameRewardManager?: MinigameRewardManager;
  private placeActionManager?: PlaceActionManager;
  private progressionManager?: ProgressionManager;
  private interactionManager?: InteractionManager;
  private storyEventManager?: StoryEventManager;
  private areaTransitionOverlay?: AreaTransitionOverlay;
  private debugCommandBus?: DebugCommandBus;
  private debugInputController?: DebugInputController;
  private unsubscribeDebugCommandBus?: () => void;
  private escapeKey?: Phaser.Input.Keyboard.Key;
  private plannerKey?: Phaser.Input.Keyboard.Key;
  private currentSceneId?: SceneId;
  private currentSceneState?: SceneState;
  private runtimeDialogueScripts: Record<string, DialogueScript> = {};
  private destroySkyBackground?: () => void;
  private currentTimeOfDay?: TimeOfDay;
  private wasPlacePopupOpen = false;
  constructor() {
    super(SCENE_KEYS.main);
  }

  async create() {
    this.initialized = false;
    await ensureAuthoredStoryLoaded(this);
    this.debugLogger = new DebugEventLogger();
    this.debugCommandBus = new DebugCommandBus();
    this.debugInputController = new DebugInputController(this, this.debugCommandBus, (command) => {
      const debugHudVisible = this.debugMinigameHud?.isVisible() === true;
      const debugPanelVisible = this.debugPanel?.isVisible() === true;
      const menuOpen = this.menuManager?.isOpen() === true;
      const placePopupOpen = this.placeActionManager?.isOpen() === true;
      const plannerOpen = this.progressionManager?.isPlannerOpen() === true;
      const dialoguePlaying = this.dialogueManager?.isDialoguePlaying() === true;

      

      if (
        command.type === "toggleDebugOverlay" ||
        command.type === "toggleWorldGrid" ||
        command.type === "toggleDebugPanel"
      ) {
        return true;
      }

      if (command.type === "switchStartScene") {
        return !menuOpen && !placePopupOpen && !plannerOpen && !dialoguePlaying;
      }

      if (command.type === "toggleMinigameHud") {
        return !menuOpen && !placePopupOpen && !plannerOpen && !dialoguePlaying;
      }

      return !menuOpen && !placePopupOpen && !plannerOpen && !dialoguePlaying && !debugHudVisible && !debugPanelVisible;
    });
    this.worldManager = new WorldManager(this);
    this.playerManager = new PlayerManager(this);
    this.npcManager = new NpcManager(this);
    this.dialogueManager = new DialogueManager(this);
    this.dialogueManager.setRuntimeDialogueScripts(this.runtimeDialogueScripts);
    this.statSystemManager = new StatSystemManager();
    this.inventoryService = new InventoryService();
    this.saveService = new SaveService();
    await this.saveService.hydrate(true);
    this.dialogueBox = new DialogueBox(this);
    this.hud = new GameHud(this);
    this.fixedEventNpcManager = new FixedEventNpcManager(this);
    this.dialogueManager.setDialogueBox(this.dialogueBox);
    this.dialogueManager.setRuntimeHooks({
      getMetricValue: (stat) => {
        const hudState = this.statSystemManager!.getHudState();
        const statsState = this.statSystemManager!.getStatsState();
        const playerData = this.registry.get("playerData") as { gender?: string } | undefined;
        switch (stat) {
          case "hp":
            return hudState.hp;
          case "gold":
          case "money":
            return hudState.money;
          case "playerGender":
            return typeof playerData?.gender === "string" ? playerData.gender.toUpperCase() : "";
          default:
            return statsState[stat];
        }
      },
      applyStatDelta: (delta, multiplier = 1) => this.statSystemManager!.applyStatDelta(delta, multiplier),
      getAffectionValue: (npcId) => this.statSystemManager!.getAffection(npcId),
      applyAffectionDelta: (changes) => this.statSystemManager!.applyAffectionDelta(changes),
      setFlags: (flags) => this.statSystemManager!.addFlags(flags),
      patchHudState: (next) => this.statSystemManager!.patchHudState(next),
      onNotice: (message) => this.menuManager?.showNotice(message),
      runAction: (action) => {
        switch (action) {
          case "openShop":
            this.placeActionManager?.openShop();
            return;
          case "openMiniGame":
            openMinigameMenu(this, SCENE_KEYS.main);
            return;
          case "playDrinking":
            launchMinigame(this, "DrinkingScene", SCENE_KEYS.main);
            return;
          case "playInterview":
            launchMinigame(this, "InterviewScene", SCENE_KEYS.main);
            return;
          case "playGym":
            launchMinigame(this, "GymScene", SCENE_KEYS.main);
            return;
          case "playRhythm":
            launchMinigame(this, "RhythmScene", SCENE_KEYS.main);
            return;
          case "playCooking":
            launchMinigame(this, "CookingScene", SCENE_KEYS.main);
            return;
        }
      }
      
    });
    this.menuManager = new InGameMenuManager({
      scene: this,
      getStatsState: () => this.statSystemManager!.getStatsState(),
      getHudState: () => this.statSystemManager!.getHudState(),
      patchHudState: (next) => this.statSystemManager!.patchHudState(next),
      applyStatDelta: (delta, multiplier = 1) => this.statSystemManager!.applyStatDelta(delta, multiplier),
      inventoryService: this.inventoryService,
      saveService: this.saveService,
      buildSavePayload: () => this.buildSavePayload(),
      restoreSavePayload: (payload) => this.restoreSavePayload(payload)
    });
    this.statSystemManager.attachHud(this.hud);
    this.progressionManager = new ProgressionManager({
      scene: this,
      getHudState: () => this.statSystemManager!.getHudState(),
      patchHudState: (next) => this.statSystemManager!.patchHudState(next),
      applyStatDelta: (delta, multiplier = 1) => this.statSystemManager!.applyStatDelta(delta, multiplier),
      getFixedEventSlots: (week) => this.storyEventManager?.getFixedEventSlotsForWeek(week) ?? new Map(),
      onNotice: (message) => this.menuManager?.showNotice(message),
      onStartEndingFlow: () => this.startEndingFlow()
    });
    this.progressionManager.initialize();
    this.storyEventManager = new StoryEventManager({
      scene: this,
      getHudState: () => this.statSystemManager!.getHudState(),
      getCurrentArea: () => this.worldManager?.getCurrentAreaId() ?? "world",
      getCurrentLocation: () => this.statSystemManager!.getHudState().locationLabel,
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
        }
      },
      onNotice: (message) => this.menuManager?.showNotice(message)
    });
    await this.storyEventManager.initialize(this.statSystemManager.getHudState().week);
    this.minigameRewardManager = new MinigameRewardManager({
      scene: this,
      getHudState: () => this.statSystemManager!.getHudState(),
      patchHudState: (next) => this.statSystemManager!.patchHudState(next),
      applyStatDelta: (delta, multiplier = 1) => this.statSystemManager!.applyStatDelta(delta, multiplier)
    });
    this.placeActionManager = new PlaceActionManager({
      scene: this,
      getHudState: () => this.statSystemManager!.getHudState(),
      patchHudState: (next) => this.statSystemManager!.patchHudState(next),
      applyStatDelta: (delta, multiplier = 1) => this.statSystemManager!.applyStatDelta(delta, multiplier),
      inventoryService: this.inventoryService,
      getTimeCycleIndex: () => this.progressionManager!.getTimeCycleIndex(),
      getActionPoint: () => this.progressionManager!.getActionPoint(),
      getMaxActionPoint: () => this.progressionManager!.getMaxActionPoint(),
      consumeActionPoint: () => this.progressionManager!.consumeActionPoint()
    });
    this.interactionManager = new InteractionManager(
      this,
      this.playerManager,
      this.npcManager,
      this.dialogueManager,
      this.debugLogger
    );
    this.interactionManager.setHud(this.hud);
    this.interactionManager.setPlaceInteractHandler((placeId) => {
      if (this.storyEventManager?.tryStartFixedEventForLocation(placeId) === true) {
        return true;
      }

      return this.placeActionManager?.open(placeId) === true;
    });
    this.escapeKey = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
    this.plannerKey = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.P);
    this.statSystemManager.setStatsChangedListener(() => {
      this.menuManager?.refreshStatsUi();
    });
    this.inventoryService.setChangeListener(() => {
      this.menuManager?.refreshInventoryUi();
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
    const initialSceneState = normalizeSceneState(
      pendingRestorePayload?.world?.sceneState ?? getSceneState(startScene.initialStateId)
    );
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

    const tmxConfig = this.worldManager.getCurrentTmxConfig();
    const parsedMap = this.worldManager.getCurrentParsedTmxMap();
    const resolvedLayers = this.worldManager.getCurrentResolvedTmxLayers();
    const runtimeGrids = this.worldManager.getCurrentRuntimeGrids();
    const renderBounds = this.worldManager.getCurrentRenderBounds();

    this.playerManager.setRenderBounds(renderBounds);
    const transitionTargets = this.resolveAreaTransitionTargets(runtimeSceneScript.area, renderBounds);
    const staticPlaceTargets = this.resolveStaticPlaceTargets(runtimeSceneScript.area, renderBounds);
    this.interactionManager.setTransitionTargets(transitionTargets);
    this.interactionManager.setStaticPlaceTargets(staticPlaceTargets);

    const mapSize = parsedMap
      ? `${parsedMap.width}x${parsedMap.height} (${parsedMap.tileWidth}x${parsedMap.tileHeight})`
      : undefined;

    this.debugLogger.setArea(
      runtimeSceneScript.area,
      tmxConfig?.tmxKey,
      mapSize,
      resolvedLayers?.collisionLayers.length,
      resolvedLayers?.interactionLayers.length,
      resolvedLayers?.foregroundLayers.length,
      runtimeGrids ? countTrueCells(runtimeGrids.blockedGrid) : 0,
      runtimeGrids ? countTrueCells(runtimeGrids.interactionGrid) : 0
    );

    if (parsedMap && runtimeGrids && this.playerManager) {
      const startTile = this.resolvePlayerStartTile(runtimeSceneScript.area, parsedMap, runtimeGrids);
      this.playerManager.create(startTile.tileX, startTile.tileY, parsedMap.tileWidth);
    }

    this.applyPendingRestorePayload();

    if (DEBUG_FLAGS.overlayEnabled && this.debugLogger && this.npcManager) {
      this.debugOverlay = new DebugOverlay(this, this.debugLogger, this.npcManager);
      this.debugPanel = new DebugPanel(this, this.debugCommandBus);
      this.debugMinigameHud = new DebugMinigameHud(this);
    }

    if (DEBUG_FLAGS.worldGridEnabled) {
      this.worldGridOverlay = new WorldGridOverlay(this);
      this.worldGridOverlay.render(runtimeGrids, parsedMap, renderBounds);
    }

    this.areaTransitionOverlay = new AreaTransitionOverlay(this);
    this.areaTransitionOverlay.render(transitionTargets);

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
      this.debugInputController?.destroy();
      this.dialogueManager?.destroy();
      this.dialogueBox?.destroy();
      this.fixedEventNpcManager?.destroy();
      this.minigameRewardManager?.destroy();
      this.placeActionManager?.destroy();
      this.progressionManager?.destroy();
      this.storyEventManager?.destroy();
      this.menuManager?.destroy();
      this.hud?.destroy();
      this.destroySkyBackground?.();
      this.destroySkyBackground = undefined;
    };
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, cleanupSceneResources);
    this.events.once(Phaser.Scenes.Events.DESTROY, cleanupSceneResources);

    this.initialized = true;
await director.run(runtimeSceneScript);
    this.applyPendingDebugFixedEvent();

    const currentArea = this.worldManager.getCurrentAreaId() ?? "world";
    const cycle: TimeOfDay[] = ["오전", "오후", "저녁", "밤"];
    const timeOfDay = cycle[(this.progressionManager?.getTimeCycleIndex() ?? 0) % cycle.length];

    const mapPixelWidth = renderBounds && parsedMap
      ? parsedMap.width * renderBounds.tileWidth * renderBounds.scale
      : undefined;
    const mapPixelHeight = renderBounds && parsedMap
      ? parsedMap.height * renderBounds.tileHeight * renderBounds.scale
      : undefined;

    if (currentArea === "world") {
      playWorldBgm(this, timeOfDay);
      this.destroySkyBackground?.();
      this.destroySkyBackground = createSkyBackground(this, timeOfDay, mapPixelWidth, mapPixelHeight);
    } else if (currentArea === "downtown") {
      playPlaceBgm(this, currentArea as any);
      this.destroySkyBackground?.();
      this.destroySkyBackground = createSkyBackground(this, timeOfDay, mapPixelWidth, mapPixelHeight);
    } else {
      playPlaceBgm(this, currentArea as any);
    }

    
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
    const debugHudVisible = this.debugMinigameHud?.isVisible() === true;
    const debugPanelVisible = this.debugPanel?.isVisible() === true;
    const menuOpen = this.menuManager?.isOpen() === true;
    const placePopupOpen = this.placeActionManager?.isOpen() === true;

    if (this.wasPlacePopupOpen && !placePopupOpen) {
      const area = this.worldManager?.getCurrentAreaId() ?? "world";
      const cycle: TimeOfDay[] = ["오전", "오후", "저녁", "밤"];
      const timeOfDay = cycle[(this.progressionManager?.getTimeCycleIndex() ?? 0) % cycle.length];

      if (area === "world") {
        playWorldBgm(this, timeOfDay);
      } else {
        playPlaceBgm(this, area as any);
      }
    }
    this.wasPlacePopupOpen = placePopupOpen;

    const plannerOpen = this.progressionManager?.isPlannerOpen() === true;
    const dialoguePlaying = this.dialogueManager?.isDialoguePlaying() === true;

    this.interactionManager.setOverlayBlocked(menuOpen || placePopupOpen || plannerOpen || debugHudVisible || debugPanelVisible);
    this.playerManager.setInputLocked(
      this.interactionManager.isInputLocked() || debugHudVisible || debugPanelVisible || menuOpen || placePopupOpen || plannerOpen
    );

    if (
      this.escapeKey &&
      Phaser.Input.Keyboard.JustDown(this.escapeKey) &&
      !dialoguePlaying &&
      !plannerOpen
    ) {
      if (debugPanelVisible) {
        this.debugPanel?.hide();
        return;
      }
      if (placePopupOpen) {
        this.placeActionManager?.close();
        return;
      }
      this.menuManager?.toggle();
    }

    if (
      this.plannerKey &&
      Phaser.Input.Keyboard.JustDown(this.plannerKey) &&
      !dialoguePlaying &&
      !menuOpen &&
      !placePopupOpen &&
      !debugHudVisible &&
      !debugPanelVisible
    ) {
      this.progressionManager?.togglePlanner();
    }

    const automaticProgressionFlowOpened = this.progressionManager?.processAutomaticFlow() === true;
    this.fixedEventNpcManager?.render({
      presentation: this.storyEventManager?.getCurrentFixedEventPresentation() ?? null,
      areaId: this.worldManager.getCurrentAreaId() ?? "world",
      visible: !menuOpen && !placePopupOpen && !plannerOpen && !debugHudVisible && !debugPanelVisible && !dialoguePlaying
    });
    this.debugPanel?.render(this.buildDebugPanelState());

    if (
      !automaticProgressionFlowOpened &&
      !menuOpen &&
      !placePopupOpen &&
      !plannerOpen &&
      !debugHudVisible &&
      !debugPanelVisible &&
      !dialoguePlaying
    ) {
      this.storyEventManager?.syncWeek(this.statSystemManager!.getHudState().week);
      this.storyEventManager?.tryStartCurrentFixedEvent();
    }

    this.playerManager.update(runtimeGrids, parsedMap);
    this.interactionManager.update();
    this.debugInputController?.update();
    if (this.worldGridOverlay) {
      this.worldGridOverlay.render(runtimeGrids, parsedMap, renderBounds);
    }

    this.areaTransitionOverlay?.render(
      this.resolveAreaTransitionTargets(this.worldManager.getCurrentAreaId() ?? "world", renderBounds),
      this.interactionManager.getCurrentTargetTransitionId()
    );

    const player = this.playerManager.getSnapshot();
    if (player) {
      this.debugLogger.setPlayer(
        `${Math.round(player.x)}, ${Math.round(player.y)}`,
        `${player.tileX}, ${player.tileY}`
      );
    }

    const currentArea = this.worldManager.getCurrentAreaId();
    if (currentArea === "world" || currentArea === "downtown") {
      const cycle: TimeOfDay[] = ["오전", "오후", "저녁", "밤"];
      const newTimeOfDay = cycle[(this.progressionManager?.getTimeCycleIndex() ?? 0) % cycle.length];

      if (newTimeOfDay !== this.currentTimeOfDay) {
        this.currentTimeOfDay = newTimeOfDay;

        const rb = this.worldManager.getCurrentRenderBounds();
        const pm = this.worldManager.getCurrentParsedTmxMap();
        const mapPixelWidth = rb && pm ? pm.width * rb.tileWidth * rb.scale : undefined;
        const mapPixelHeight = rb && pm ? pm.height * rb.tileHeight * rb.scale : undefined;

        this.destroySkyBackground?.();
        this.destroySkyBackground = createSkyBackground(this, newTimeOfDay, mapPixelWidth, mapPixelHeight);

        if (currentArea === "world") {
          playWorldBgm(this, newTimeOfDay);
        }
      }
    }

    this.debugOverlay?.render();
  }

  private bindDebugControls() {
    this.unsubscribeDebugCommandBus?.();
    this.unsubscribeDebugCommandBus = this.debugCommandBus?.subscribe((command) => {
      switch (command.type) {
        case "toggleDebugOverlay":
          if (this.debugOverlay) {
            const nextVisible = !this.debugOverlay.isVisible();
            this.debugOverlay.setVisible(nextVisible);
            if (!nextVisible) {
              this.debugMinigameHud?.hide();
            }
          }
          break;
        case "toggleDebugPanel":
          this.debugPanel?.toggle();
          if (this.debugPanel?.isVisible()) {
            this.storyEventManager?.debugSyncAllWeeks();
          }
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
          this.menuManager?.showNotice(`디버그 ${command.key} ${command.delta > 0 ? "+" : ""}${command.delta}`);
          break;
        }
        case "adjustStatValue":
          this.statSystemManager?.applyStatDelta({ [command.key]: command.delta });
          this.menuManager?.showNotice(`디버그 ${command.key} ${command.delta > 0 ? "+" : ""}${command.delta}`);
          break;
        case "advanceTime":
          this.progressionManager?.debugAdvanceTime();
          this.storyEventManager?.syncWeek(this.statSystemManager!.getHudState().week);
          this.menuManager?.showNotice("디버그 시간 진행");
          break;
        case "adjustWeek": {
          const timeState = this.progressionManager?.getTimeState();
          if (!timeState) {
            break;
          }
          this.progressionManager?.debugPatchTimeState({
            week: timeState.week + command.delta
          });
          this.storyEventManager?.syncWeek(this.statSystemManager!.getHudState().week);
          this.menuManager?.showNotice(`디버그 주차 ${command.delta > 0 ? "+" : ""}${command.delta}`);
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
          this.menuManager?.showNotice(`디버그 행동력 ${command.delta > 0 ? "+" : ""}${command.delta}`);
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
          this.menuManager?.showNotice("디버그 행동력 최대치");
          break;
        }
        case "giveInventoryItem": {
          const result = this.inventoryService?.debugGrantItem(command.templateId);
          if (result) {
            this.menuManager?.showNotice(result.message);
          }
          break;
        }
        case "triggerCurrentFixedEvent":
          this.menuManager?.showNotice(
            this.storyEventManager?.tryStartCurrentFixedEvent() ? "고정 이벤트 실행" : "실행 가능한 고정 이벤트가 없습니다"
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
          this.menuManager?.showNotice(changed ? `이벤트 완료 기록 초기화: ${command.eventId}` : `완료 기록이 없습니다: ${command.eventId}`);
          break;
        }
        case "resetFixedEventCompletionsForWeek": {
          const cleared = this.storyEventManager?.debugResetFixedEventCompletionsForWeek(command.week) ?? 0;
          this.menuManager?.showNotice(cleared > 0 ? `${command.week}주차 완료 기록 ${cleared}건 초기화` : `${command.week}주차 완료 기록이 없습니다`);
          break;
        }
        case "saveAuto":
          if (this.saveService) {
            void this.saveAutoWithNotice();
          }
          break;
        case "startEndingFlow":
          this.startDebugEndingFlow();
          this.menuManager?.showNotice("디버그 엔딩 진입");
          break;
        case "startEndingFlowPreset":
          this.startDebugEndingFlow(command.endingId);
          this.menuManager?.showNotice(`디버그 엔딩 진입: ${command.endingId}`);
          break;
        default:
          this.assertNeverDebugCommand(command);
      }
    });
  }

  private assertNeverDebugCommand(command: never): never {
    throw new Error(`Unhandled debug command: ${JSON.stringify(command)}`);
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
    const sceneId = (this.registry.get("startSceneId") as SceneId | undefined) ?? DEFAULT_START_SCENE_ID;
    return getSceneScript(sceneId) ?? getSceneScript(DEFAULT_START_SCENE_ID);
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

    this.debugLogger?.log(`debug:switch-scene:${sceneId}`);
    this.scene.restart();
  }

  private prepareSceneRestart(
    sceneId: SceneId,
    options: {
      preservePendingStartTile: boolean;
    }
  ): boolean {
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
      tileHeight: transition.tileHeight ?? 1
    }));
  }

  private resolveStaticPlaceTargets(
    areaId: AreaId,
    renderBounds?: ReturnType<WorldManager["getCurrentRenderBounds"]>
  ): RuntimeStaticPlaceTarget[] {
    if (!renderBounds) {
      return [];
    }

    return getStaticPlaceDefinitions(areaId).map((place) => {
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

  private getAreaLabel(areaId: AreaId): string {
    switch (areaId) {
      case "campus":
        return "캠퍼스";
      case "downtown":
        return "번화가";
      case "world":
      default:
        return "전체 지도";
    }
  }

  private buildEndingPayload(): EndingFlowPayload {
    const hudState = this.statSystemManager?.getHudState() ?? this.statSystemManager!.getHudState();
    const statsState = this.statSystemManager?.getStatsState() ?? this.statSystemManager!.getStatsState();

    return {
      fe: statsState.fe,
      be: statsState.be,
      teamwork: statsState.teamwork,
      luck: statsState.luck,
      hp: hudState.hp,
      week: hudState.week,
      dayLabel: hudState.dayLabel,
      timeLabel: hudState.timeLabel
    };
  }

  private async startEndingFlow(): Promise<void> {
    if (!this.saveService) {
      return;
    }

    try {
      await this.saveService.saveSlot("auto", this.buildSavePayload());
    } catch (error) {
      console.error("[MainScene] ending auto save failed", error);
      this.menuManager?.showNotice("엔딩 진입 전 오토 세이브에 실패했습니다.");
    }

    this.scene.start(SceneKey.Completion, this.buildEndingPayload());
  }

  private async saveAutoWithNotice(): Promise<void> {
    if (!this.saveService) {
      return;
    }

    try {
      await this.saveService.saveSlot("auto", this.buildSavePayload());
      this.menuManager?.showNotice("오토 세이브 완료");
    } catch (error) {
      console.error("[MainScene] auto save failed", error);
      this.menuManager?.showNotice("오토 세이브에 실패했습니다.");
    }
  }

  private startDebugEndingFlow(endingId?: EndingId): void {
    const payload = endingId ? this.buildEndingPresetPayload(endingId) : this.buildEndingPayload();
    this.scene.start(SceneKey.Completion, payload);
  }

  private buildEndingPresetPayload(endingId: EndingId): EndingFlowPayload {
    const base: Pick<EndingFlowPayload, "week" | "dayLabel" | "timeLabel"> = {
      week: 6,
      dayLabel: "금요일",
      timeLabel: "밤"
    };

    switch (endingId) {
      case "frontend-developer":
        return { ...base, fe: 92, be: 36, teamwork: 58, luck: 28, hp: 62 };
      case "backend-developer":
        return { ...base, fe: 34, be: 92, teamwork: 56, luck: 30, hp: 60 };
      case "team-player":
        return { ...base, fe: 46, be: 40, teamwork: 91, luck: 36, hp: 63 };
      case "stamina-survivor":
        return { ...base, fe: 38, be: 36, teamwork: 44, luck: 30, hp: 95 };
      case "lucky-break":
        return { ...base, fe: 34, be: 32, teamwork: 42, luck: 96, hp: 58 };
      case "frontend-leader":
        return { ...base, fe: 88, be: 52, teamwork: 86, luck: 40, hp: 68 };
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

  private restoreSavePayload(payload: SavePayload): boolean {
    if (!this.statSystemManager || !this.inventoryService || !this.progressionManager || !this.storyEventManager) {
      return false;
    }

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
    this.storyEventManager.syncWeek(payload.gameState.hud.week);
    this.menuManager?.refreshStatsUi();
    this.menuManager?.refreshInventoryUi();
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
    this.storyEventManager.syncWeek(payload.gameState.hud.week);
    if (payload.world?.playerTile) {
      this.playerManager?.debugTeleportToTile(payload.world.playerTile.tileX, payload.world.playerTile.tileY);
    }
    this.menuManager?.refreshStatsUi();
    this.menuManager?.refreshInventoryUi();
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
      this.menuManager?.showNotice("선택한 이벤트 데이터를 아직 불러오지 못했습니다");
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
      this.menuManager?.showNotice(
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
    this.menuManager?.showNotice(started ? `고정 이벤트 실행: ${pending.eventId}` : `고정 이벤트 실행 실패: ${pending.eventId}`);
  }
}
