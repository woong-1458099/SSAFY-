import Phaser from "phaser";
import { SceneKey } from "@shared/enums/sceneKey";
import { GAME_CONSTANTS } from "@core/constants/gameConstants";
import { InputManager } from "@core/managers/InputManager";
import { AudioManager } from "@core/managers/AudioManager";
import { SaveManager, type SaveSlotData } from "@core/managers/SaveManager";
import { EventBus } from "@core/events/EventBus";
import { createBaseModal } from "@features/ui/components/BaseModal";
import { GameHud, type HudState } from "@features/ui/components/game-hud";
import {
  createPanelActionButton,
  createPanelCloseButton,
  createPanelOuterBorder,
  UI_PANEL_INNER_BORDER_COLOR,
  UI_PANEL_OUTER_BORDER_COLOR
} from "@features/ui/components/uiPrimitives";
import { PLACE_BACKGROUND_KEYS } from "@shared/constants/placeBackgroundKeys";
import {
  NPC_DIALOGUE_SCRIPTS,
  type DialogueAction,
  type DialogueChoice,
  type DialogueNode,
  type NpcDialogueId,
  type StoryStatKey
} from "@features/story/npcDialogueScripts";
import type { EndingFlowPayload } from "@features/progression/types/ending";

type TabKey = "inventory" | "stats" | "settings" | "save";
type EquipmentSlotKey = "keyboard" | "mouse";
type AreaId = "world" | "downtown" | "campus";
type WorldPlaceId = "home" | "downtown" | "campus" | "cafe" | "store";
type StatKey = "fe" | "be" | "teamwork" | "luck" | "stress";
type DowntownBuildingId = "ramenthings" | "gym" | "karaoke" | "hof" | "lottery";

type WorldPlaceNode = {
  id: WorldPlaceId;
  label: string;
  x: number;
  y: number;
  zoneWidth: number;
  zoneHeight: number;
  movable: boolean;
};

type InventoryItemTemplate = {
  templateId: string;
  name: string;
  shortLabel: string;
  kind: "equipment" | "consumable";
  equipSlot?: EquipmentSlotKey;
  price: number;
  sellPrice: number;
  effect: string;
  stackable: boolean;
  color: number;
};

type InventoryItemStack = {
  template: InventoryItemTemplate;
  quantity: number;
};

type SlotView = {
  bg: Phaser.GameObjects.Rectangle;
  icon: Phaser.GameObjects.Rectangle;
  iconText: Phaser.GameObjects.Text;
  stackText: Phaser.GameObjects.Text;
};

const SHOP_ITEM_TEMPLATES: InventoryItemTemplate[] = [
  {
    templateId: "kbd-basic",
    name: "\uAE30\uACC4\uC2DD \uD0A4\uBCF4\uB4DC",
    shortLabel: "KB",
    kind: "equipment",
    equipSlot: "keyboard",
    price: 3500,
    sellPrice: 1800,
    effect: "\uD0C0\uC774\uD551 \uC131\uB2A5 +5",
    stackable: false,
    color: 0x78a6d1
  },
  {
    templateId: "mouse-basic",
    name: "\uAC8C\uC774\uBC0D \uB9C8\uC6B0\uC2A4",
    shortLabel: "MS",
    kind: "equipment",
    equipSlot: "mouse",
    price: 2800,
    sellPrice: 1400,
    effect: "\uC791\uC5C5 \uC18D\uB3C4 +5%",
    stackable: false,
    color: 0x9a86d4
  },
  {
    templateId: "snack-energybar",
    name: "\uC5D0\uB108\uC9C0\uBC14",
    shortLabel: "SN",
    kind: "consumable",
    price: 900,
    sellPrice: 450,
    effect: "\uCCB4\uB825 +12, \uC2A4\uD2B8\uB808\uC2A4 -4",
    stackable: true,
    color: 0xd89a66
  },
  {
    templateId: "item-coffee",
    name: "\uCEE4\uD53C",
    shortLabel: "CF",
    kind: "consumable",
    price: 700,
    sellPrice: 350,
    effect: "\uCCB4\uB825 +7, \uC2A4\uD2B8\uB808\uC2A4 -2",
    stackable: true,
    color: 0xb17b4d
  }
];

const STARTER_ITEM_TEMPLATES: InventoryItemTemplate[] = [
  SHOP_ITEM_TEMPLATES[2],
  SHOP_ITEM_TEMPLATES[3]
];

const WORLD_PLACE_NODES: WorldPlaceNode[] = [
  { id: "campus", label: "\uCEA0\uD37C\uC2A4", x: 190, y: 180, zoneWidth: 190, zoneHeight: 150, movable: true },
  { id: "home", label: "\uC9D1", x: 500, y: 210, zoneWidth: 180, zoneHeight: 150, movable: false },
  { id: "store", label: "\uD3B8\uC758\uC810", x: 830, y: 250, zoneWidth: 150, zoneHeight: 120, movable: false },
  { id: "cafe", label: "\uCE74\uD398", x: 420, y: 520, zoneWidth: 150, zoneHeight: 120, movable: false },
  { id: "downtown", label: "\uBC88\uD654\uAC00", x: 730, y: 180, zoneWidth: 170, zoneHeight: 140, movable: true }
];

const AREA_LABEL: Record<AreaId, string> = {
  world: "\uC804\uCCB4 \uC9C0\uB3C4",
  downtown: "\uBC88\uD654\uAC00",
  campus: "\uCEA0\uD37C\uC2A4"
};

const AREA_ENTRY_POINT: Record<Exclude<AreaId, "world">, { x: number; y: number }> = {
  downtown: { x: 216, y: 520 },
  campus: { x: 220, y: 520 }
};

const DOWNTOWN_BUILDINGS: Array<{ id: DowntownBuildingId; label: string; x: number; y: number; w: number; h: number; color: number }> = [
  { id: "gym", label: "\uD5EC\uC2A4\uC7A5", x: 290, y: 278, w: 150, h: 106, color: 0xb79f86 },
  { id: "ramenthings", label: "라멘띵스", x: 492, y: 262, w: 166, h: 108, color: 0xd4a875 },
  { id: "hof", label: "\uD638\uD504", x: 712, y: 286, w: 160, h: 108, color: 0xb48a66 },
  { id: "karaoke", label: "\uB178\uB798\uBC29", x: 454, y: 406, w: 174, h: 116, color: 0xc495a3 },
  { id: "lottery", label: "\uBCF5\uAD8C\uD310\uB9E4\uC810", x: 696, y: 412, w: 190, h: 116, color: 0xbfad77 }
];

const TAB_ORDER: TabKey[] = ["inventory", "stats", "settings", "save"];
const TAB_LABEL: Record<TabKey, string> = {
  inventory: "\uAC00\uBC29",
  stats: "\uC2A4\uD0EF",
  settings: "\uC124\uC815",
  save: "\uC138\uC774\uBE0C"
};

type TabVisual = {
  bg: Phaser.GameObjects.Rectangle;
  label: Phaser.GameObjects.Text;
  lip: Phaser.GameObjects.Rectangle;
};

type StatView = {
  valueText: Phaser.GameObjects.Text;
  barFill: Phaser.GameObjects.Rectangle;
  maxFillWidth: number;
};

type ScrollableTabPage = {
  root: Phaser.GameObjects.Container;
  content: Phaser.GameObjects.Container;
  maskGraphics: Phaser.GameObjects.Graphics;
  scrollMaskGraphics: Phaser.GameObjects.Graphics;
  viewport: Phaser.Geom.Rectangle;
  track: Phaser.GameObjects.Rectangle;
  trackX: number;
  trackY: number;
  thumb: Phaser.GameObjects.Rectangle;
  thumbHeight: number;
  minOffset: number;
  maxOffset: number;
  offset: number;
};

type DialogueChoiceView = {
  text: Phaser.GameObjects.Text;
  choice: DialogueChoice;
  requirementText: string;
};

type SaveSlotView = {
  slotId: string;
  bg: Phaser.GameObjects.Rectangle;
  title: Phaser.GameObjects.Text;
  meta: Phaser.GameObjects.Text;
};

type ParsedTmxLayer = {
  name: string;
  visible: boolean;
  data: number[][];
};

type TmxSemanticCode = 0 | 1 | 2;

type TmxSemanticRule = {
  layerNames: string[];
  code: TmxSemanticCode;
};

type TmxRegion = {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
  area: number;
  centerX: number;
  centerY: number;
};

type InteractionZone = {
  centerX: number;
  centerY: number;
  width: number;
  height: number;
};

type ParsedTmxMap = {
  width: number;
  height: number;
  tileWidth: number;
  tileHeight: number;
  tilesets: Array<{ firstgid: number; name: string }>;
  layers: ParsedTmxLayer[];
};

type AreaRenderBounds = Phaser.Geom.Rectangle | null;

type AreaCollisionConfig = {
  bounds: Phaser.Geom.Rectangle;
  mapWidth: number;
  mapHeight: number;
  tileWidth: number;
  tileHeight: number;
  tileCodes: TmxSemanticCode[][];
  blocked: boolean[][];
};

type SerializedInventoryStack = {
  templateId: string;
  quantity: number;
};

type PlayerAvatarData = {
  gender: "male" | "female";
  hair: number;
  cloth: number;
};

type PlayerVisualParts = {
  root: Phaser.GameObjects.Container;
  base: Phaser.GameObjects.Sprite;
  clothes: Phaser.GameObjects.Sprite;
  hair: Phaser.GameObjects.Sprite;
};

type MainSavePayload = {
  currentArea: AreaId;
  lastSelectedWorldPlace: WorldPlaceId;
  playerPosition: { x: number; y: number };
  hudState: HudState;
  statsState: Record<StatKey, number>;
  actionPoint: number;
  timeCycleIndex: number;
  dayCycleIndex: number;
  inventorySlots: Array<SerializedInventoryStack | null>;
  equippedSlots: Record<EquipmentSlotKey, string | null>;
};

type MainSceneInitData = {
  saveSlotId?: string;
};

const STAT_ROW_DEFS: Array<{ key: StatKey; label: string }> = [
  { key: "fe", label: "FE" },
  { key: "be", label: "BE" },
  { key: "teamwork", label: "\uD611\uC5C5" },
  { key: "luck", label: "\uC6B4" },
  { key: "stress", label: "\uC2A4\uD2B8\uB808\uC2A4" }
];

const STAT_LABEL: Record<StatKey, string> = {
  fe: "FE",
  be: "BE",
  teamwork: "\uD611\uC5C5",
  luck: "\uC6B4",
  stress: "\uC2A4\uD2B8\uB808\uC2A4"
};

const AREA_NPC_CONFIG: Record<Exclude<AreaId, "world">, {
  dialogueId: NpcDialogueId;
  x: number;
  y: number;
  labelOffsetX: number;
  labelOffsetY: number;
  flashColor: number;
}> = {
  downtown: {
    dialogueId: "downtown_shopkeeper",
    x: 930,
    y: 404,
    labelOffsetX: -24,
    labelOffsetY: 24,
    flashColor: 0xb07a3c
  },
  campus: {
    dialogueId: "campus_senior",
    x: 924,
    y: 390,
    labelOffsetX: -36,
    labelOffsetY: 24,
    flashColor: 0x3f6e90
  }
};

const TIME_CYCLE = ["\uC624\uC804", "\uC624\uD6C4", "\uC800\uB141", "\uBC24"] as const;
const DAY_CYCLE = [
  "\uC6D4\uC694\uC77C",
  "\uD654\uC694\uC77C",
  "\uC218\uC694\uC77C",
  "\uBAA9\uC694\uC77C",
  "\uAE08\uC694\uC77C",
  "\uD1A0\uC694\uC77C",
  "\uC77C\uC694\uC77C"
] as const;

const AREA_TILESET_IMAGE_KEY = "map_tiles_full_asset";
const AREA_TMX_TEXT_KEYS: Record<AreaId, string> = {
  world: "map_tmx_world",
  downtown: "map_tmx_downtown",
  campus: "map_tmx_campus"
};

const AREA_COLLISION_LAYER_NAMES: Record<AreaId, string[]> = {
  world: ["tree", "build"],
  downtown: ["tile layer 5(4)", "tile layer 3"],
  campus: ["tile layer 4(2)", "tile layer 3"]
};

const AREA_INTERACTION_LAYER_NAMES: Record<AreaId, string[]> = {
  world: ["build"],
  downtown: ["tile layer 4", "tile layer 5(4)"],
  campus: ["tile layer 2", "tile layer 4(2)"]
};

const PLAYER_SPRITE_CONFIG = {
  frameWidth: 16,
  frameHeight: 32
} as const;
const PLAYER_DISPLAY_SCALE = 2.4;
const PLAYER_WALK_FRAME_DURATION = 120;
const PLAYER_DIRECTION_FRAMES = {
  right: { idle: 0, walk: [1, 2] },
  up: { idle: 3, walk: [4, 5, 6, 5] },
  left: { idle: 7, walk: [7, 8] },
  down: { idle: 9, walk: [10, 11, 12, 11] }
} as const;

const DOWNTOWN_TMX_SEMANTIC_RULES: TmxSemanticRule[] = [
  { layerNames: ["collision building"], code: 2 }
];

const CAMPUS_TMX_SEMANTIC_RULES: TmxSemanticRule[] = [
  { layerNames: ["collision building"], code: 2 }
];

export class MainScene extends Phaser.Scene {
  private initialSaveSlotId: string | null = null;
  private player!: Phaser.Physics.Arcade.Sprite;
  private playerAvatar: PlayerAvatarData = {
    gender: "male",
    hair: 1,
    cloth: 1
  };
  private playerVisual?: PlayerVisualParts;
  private playerFacing: "left" | "right" | "up" | "down" = "down";
  private interactionTarget!: Phaser.GameObjects.Rectangle;
  private interactionLabel!: Phaser.GameObjects.Text;
  private worldMapRoot?: Phaser.GameObjects.Container;
  private downtownMapRoot?: Phaser.GameObjects.Container;
  private campusMapRoot?: Phaser.GameObjects.Container;
  private worldPlaceInteractionZones: Partial<Record<WorldPlaceId, Phaser.Geom.Rectangle>> = {};
  private areaCollisionConfigs: Partial<Record<AreaId, AreaCollisionConfig>> = {};
  private lastSafePlayerPosition: { x: number; y: number } | null = null;
  private worldPlaceViews: Partial<Record<WorldPlaceId, { marker: Phaser.GameObjects.Rectangle; label: Phaser.GameObjects.Text }>> = {};
  private currentArea: AreaId = "world";
  private lastSelectedWorldPlace: WorldPlaceId = "downtown";
  private placePopupRoot?: Phaser.GameObjects.Container;
  private placePopupOpen = false;
  private controlHintText?: Phaser.GameObjects.Text;

  private inputManager!: InputManager;
  private escapeKey?: Phaser.Input.Keyboard.Key;
  private interactKey?: Phaser.Input.Keyboard.Key;
  private mapKey?: Phaser.Input.Keyboard.Key;
  private upKey?: Phaser.Input.Keyboard.Key;
  private downKey?: Phaser.Input.Keyboard.Key;
  private endingDebugKey?: Phaser.Input.Keyboard.Key;
  private endingFlowStarted = false;
  private readonly saveManager = new SaveManager(6);
  private saveSlots: Record<string, SaveSlotData | null> = {};
  private saveSlotViews: SaveSlotView[] = [];
  private savePinnedObjects: Phaser.GameObjects.GameObject[] = [];
  private selectedSaveSlotId = "slot-1";
  private readonly uiFontFamily = "\"PFStardustBold\", \"Malgun Gothic\", \"Apple SD Gothic Neo\", \"Noto Sans KR\", sans-serif";
  private readonly audioManager = new AudioManager();
  private readonly uiPanelInnerBorderColor = UI_PANEL_INNER_BORDER_COLOR;
  private readonly uiPanelOuterBorderColor = UI_PANEL_OUTER_BORDER_COLOR;
  private systemToastRoot?: Phaser.GameObjects.Container;
  private systemToastTimer?: Phaser.Time.TimerEvent;
  private tooltipRoot?: Phaser.GameObjects.Container;
  private carriedItemRoot?: Phaser.GameObjects.Container;
  private carriedItem: InventoryItemStack | null = null;
  private carriedFromIndex: number | null = null;
  private pendingInventoryPickup?: { index: number; at: number; timer: Phaser.Time.TimerEvent };
  private actionPoint = 4;
  private readonly maxActionPoint = 4;
  private timeCycleIndex = 0;
  private dayCycleIndex = 0;

  private readonly inventorySlots: Array<InventoryItemStack | null> = Array.from({ length: 16 }, () => null);
  private readonly equippedSlots: Record<EquipmentSlotKey, InventoryItemTemplate | null> = {
    keyboard: null,
    mouse: null
  };
  private inventorySlotViews: SlotView[] = [];
  private equipmentSlotViews: Record<EquipmentSlotKey, SlotView> | null = null;
  private slotClickAt: Record<string, number> = {};

  private shopRoot?: Phaser.GameObjects.Container;
  private shopOverlay?: Phaser.GameObjects.Rectangle;
  private shopBackgroundImage?: Phaser.GameObjects.Image;
  private shopOpen = false;
  private dialogueRoot?: Phaser.GameObjects.Container;
  private dialogueSpeakerText?: Phaser.GameObjects.Text;
  private dialogueBodyText?: Phaser.GameObjects.Text;
  private dialogueHintText?: Phaser.GameObjects.Text;
  private dialogueActionButtonBg?: Phaser.GameObjects.Rectangle;
  private dialogueActionButtonText?: Phaser.GameObjects.Text;
  private dialogueChoiceViews: DialogueChoiceView[] = [];
  private dialogueOpen = false;
  private activeDialogueId: NpcDialogueId | null = null;
  private activeDialogueNodeId: string | null = null;
  private dialogueChoiceIndex = 0;

  private hud!: GameHud;
  private hudState: HudState = {
    timeLabel: "\uC624\uC804",
    locationLabel: "\uC804\uCCB4 \uC9C0\uB3C4",
    week: 1,
    dayLabel: "\uC6D4\uC694\uC77C",
    hp: 82,
    hpMax: 100,
    money: 12000,
    stress: 20
  };

  private menuRoot?: Phaser.GameObjects.Container;
  private menuOpen = false;
  private pageRoot?: Phaser.GameObjects.Container;
  private menuContentBounds?: Phaser.Geom.Rectangle;

  private tabPages: Record<TabKey, Phaser.GameObjects.Container> = {} as Record<TabKey, Phaser.GameObjects.Container>;
  private tabScrollPages: Partial<Record<TabKey, ScrollableTabPage>> = {};
  private tabVisuals: Record<TabKey, TabVisual> = {} as Record<TabKey, TabVisual>;
  private activeTab: TabKey = "inventory";
  private statsState: Record<StatKey, number> = {
    fe: 20,
    be: 20,
    teamwork: 40,
    luck: 10,
    stress: 20
  };
  private statViews: Partial<Record<StatKey, StatView>> = {};

  constructor() {
    super(SceneKey.Main);
  }

  init(data: MainSceneInitData): void {
    this.initialSaveSlotId = typeof data?.saveSlotId === "string" ? data.saveSlotId : null;
  }

  preload(): void {
    this.preloadPlayerAvatarAssets();
  }

  create(): void {
    this.cameras.main.setBackgroundColor("#3e7d4a");
    this.cameras.main.roundPixels = true;
    this.physics.world.setBounds(0, 0, GAME_CONSTANTS.WIDTH, GAME_CONSTANTS.HEIGHT);

    this.buildAreaMaps();

    this.playerAvatar = this.getSelectedPlayerAvatar();
    this.createPlayerAvatar();

    this.interactionTarget = this.add.rectangle(0, 0, 28, 34, 0x6e4f2b, 1);
    this.interactionTarget.setStrokeStyle(2, 0x4b351b, 1);
    this.interactionTarget.setDepth(32);
    this.interactionTarget.setVisible(false);
    this.interactionLabel = this.add.text(0, 0, "", {
      fontFamily: this.uiFontFamily,
      color: "#f6e6c8",
      fontSize: "14px",
      resolution: 2
    });
    this.interactionLabel.setDepth(33);
    this.interactionLabel.setVisible(false);

    this.inputManager = new InputManager(this);
    this.escapeKey = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
    this.interactKey = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.E);
    this.mapKey = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.Q);
    this.upKey = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.UP);
    this.downKey = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.DOWN);
    // Development shortcut for verifying the ending flow without waiting for week 6.
    this.endingDebugKey = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.F8);

    this.buildEscapeMenu();
    this.buildShop();
    this.buildDialogueUi();
    this.buildHud();
    this.createItemTooltip();
    this.createCarriedItemPreview();

    const initialSaveApplied = this.tryApplyInitialSave();
    if (!initialSaveApplied) {
      this.seedDemoItems();
      this.enterArea("world", "downtown");
    }

    this.input.on("pointermove", (pointer: Phaser.Input.Pointer) => {
      this.updateCarriedItemPosition(pointer.worldX, pointer.worldY);
    });
    this.input.on("wheel", this.handleMenuWheel, this);
    this.events.on(Phaser.Scenes.Events.POST_UPDATE, this.syncPlayerAvatarVisuals, this);

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.events.off(Phaser.Scenes.Events.POST_UPDATE, this.syncPlayerAvatarVisuals, this);
      this.input.off("wheel", this.handleMenuWheel, this);
      this.hud.destroy();
      this.pendingInventoryPickup?.timer.destroy();
      this.pendingInventoryPickup = undefined;
      this.systemToastTimer?.destroy();
      this.systemToastRoot?.destroy();
      this.tooltipRoot?.destroy();
      this.carriedItemRoot?.destroy();
      this.shopRoot?.destroy();
      this.dialogueRoot?.destroy();
      this.placePopupRoot?.destroy();
      Object.values(this.tabScrollPages).forEach((page) => {
        page?.maskGraphics.destroy();
        page?.scrollMaskGraphics.destroy();
      });
    });

    EventBus.emit("scene:entered", { scene: SceneKey.Main });
  }

  private tryApplyInitialSave(): boolean {
    if (!this.initialSaveSlotId) {
      return false;
    }

    const slotData = this.saveManager.loadSlot(this.initialSaveSlotId);
    if (!slotData) {
      this.initialSaveSlotId = null;
      return false;
    }

    this.selectedSaveSlotId = this.initialSaveSlotId;
    const applied = this.applyGameSavePayload(slotData.payload);
    this.refreshSaveSlotUi();
    this.initialSaveSlotId = null;
    return applied;
  }

  update(): void {
    if (this.endingDebugKey && Phaser.Input.Keyboard.JustDown(this.endingDebugKey)) {
      this.startEndingFlow();
      return;
    }

    if (this.escapeKey && Phaser.Input.Keyboard.JustDown(this.escapeKey)) {
      if (this.dialogueOpen) {
        this.closeDialogue();
        return;
      }
      if (this.shopOpen) {
        this.closeShop();
        return;
      }
      if (this.placePopupOpen) {
        return;
      }
      this.toggleMenu();
      return;
    }

    if (this.dialogueOpen) {
      this.player.setVelocity(0, 0);
      this.updatePlayerAvatarAnimation({ x: 0, y: 0 });
      this.hud.setInteractionPrompt("E \uB300\uD654 \uC9C4\uD589 / \uC120\uD0DD  |  ESC \uC885\uB8CC");
      this.handleDialogueInput();
      return;
    }

    if (this.menuOpen) {
      this.player.setVelocity(0, 0);
      this.updatePlayerAvatarAnimation({ x: 0, y: 0 });
      this.hud.setInteractionPrompt(null);
      return;
    }

    if (this.shopOpen) {
      this.player.setVelocity(0, 0);
      this.updatePlayerAvatarAnimation({ x: 0, y: 0 });
      if (this.interactKey && Phaser.Input.Keyboard.JustDown(this.interactKey)) {
        this.closeShop();
        return;
      }
      this.hud.setInteractionPrompt("E / ESC 닫기");
      return;
    }

    if (this.placePopupOpen) {
      this.player.setVelocity(0, 0);
      this.updatePlayerAvatarAnimation({ x: 0, y: 0 });
      if (this.interactKey && Phaser.Input.Keyboard.JustDown(this.interactKey)) {
        this.closePlacePopup();
        return;
      }
      this.hud.setInteractionPrompt("E 닫기");
      return;
    }

    if (this.currentArea !== "world" && this.mapKey && Phaser.Input.Keyboard.JustDown(this.mapKey)) {
      const returnPlace: WorldPlaceId = this.currentArea === "downtown" ? "downtown" : "campus";
      this.enterArea("world", returnPlace);
      this.showSystemToast("\uC804\uCCB4 \uC9C0\uB3C4\uB85C \uC774\uB3D9");
      return;
    }

    const move = this.inputManager.getMoveVector();

    if (this.currentArea === "world") {
      this.player.setVelocity(move.x * GAME_CONSTANTS.PLAYER_SPEED, move.y * GAME_CONSTANTS.PLAYER_SPEED);
      this.updatePlayerAvatarAnimation(move);
      const nearbyPlace = this.getNearestWorldPlace(74);
      this.highlightWorldPlace(nearbyPlace?.id ?? null);
      this.hud.setInteractionPrompt(
        nearbyPlace
          ? "E \uC7A5\uC18C \uC774\uB3D9/\uAE30\uB2A5 \uC0AC\uC6A9  |  WASD / Arrow \uC774\uB3D9  |  ESC \uBA54\uB274"
          : "WASD / Arrow \uC774\uB3D9  |  ESC \uBA54\uB274"
      );
      if (nearbyPlace && this.interactKey && Phaser.Input.Keyboard.JustDown(this.interactKey)) {
        this.handleWorldPlaceInteraction(nearbyPlace);
      }
      this.enforceAreaCollision();
      return;
    }

    this.highlightWorldPlace(null);
    this.player.setVelocity(move.x * GAME_CONSTANTS.PLAYER_SPEED, move.y * GAME_CONSTANTS.PLAYER_SPEED);
    this.updatePlayerAvatarAnimation(move);

    const areaNpcConfig = this.getAreaNpcConfig(this.currentArea);
    const nearNpc = this.isNearPoint(this.interactionTarget.x, this.interactionTarget.y, 74);
    const prompt = nearNpc && areaNpcConfig ? "E \uB300\uD654\uD558\uAE30  |  Q \uC804\uCCB4 \uC9C0\uB3C4" : "Q \uC804\uCCB4 \uC9C0\uB3C4";
    this.hud.setInteractionPrompt(prompt);

    if (nearNpc && this.interactKey && Phaser.Input.Keyboard.JustDown(this.interactKey)) {
      if (!areaNpcConfig) return;
      this.handleNpcInteraction(areaNpcConfig.dialogueId);
    }

    this.enforceAreaCollision();
  }

  private buildAreaMaps(): void {
    const worldObjects: Phaser.GameObjects.GameObject[] = [];
    const worldRoot = this.add.container(0, 0);
    worldRoot.setDepth(0);
    const worldTmxBounds = this.buildAreaTmxBackground(worldRoot, AREA_TMX_TEXT_KEYS.world);
    const worldUsesTmx = Boolean(worldTmxBounds);
    this.areaCollisionConfigs.world = worldTmxBounds
      ? this.buildAreaCollisionConfigFromTmx(AREA_TMX_TEXT_KEYS.world, worldTmxBounds, AREA_COLLISION_LAYER_NAMES.world) ?? undefined
      : undefined;

    if (!worldUsesTmx) {
      const worldBg = this.add.rectangle(
        this.px(GAME_CONSTANTS.WIDTH / 2),
        this.px(GAME_CONSTANTS.HEIGHT / 2),
        GAME_CONSTANTS.WIDTH,
        GAME_CONSTANTS.HEIGHT,
        0x8aaa73,
        1
      );
      const worldBoard = this.add.rectangle(
        this.px(GAME_CONSTANTS.WIDTH / 2),
        this.px(GAME_CONSTANTS.HEIGHT / 2),
        this.px(GAME_CONSTANTS.WIDTH - 150),
        this.px(GAME_CONSTANTS.HEIGHT - 120),
        0xd6c49e,
        1
      );
      worldBoard.setStrokeStyle(4, 0x7d5f36, 1);
      const horizontalRoad = this.add.rectangle(this.px(GAME_CONSTANTS.WIDTH / 2), this.px(GAME_CONSTANTS.HEIGHT / 2), 820, 56, 0xb6986f, 1);
      horizontalRoad.setStrokeStyle(2, 0x7d5f36, 1);
      const verticalRoad = this.add.rectangle(this.px(GAME_CONSTANTS.WIDTH / 2), this.px(GAME_CONSTANTS.HEIGHT / 2), 56, 430, 0xb6986f, 1);
      verticalRoad.setStrokeStyle(2, 0x7d5f36, 1);
      worldObjects.push(worldBg, worldBoard, horizontalRoad, verticalRoad);
    }

    const tmxWorldZones = worldTmxBounds
      ? this.buildInteractionZonesFromTmx(
          AREA_TMX_TEXT_KEYS.world,
          worldTmxBounds,
          AREA_INTERACTION_LAYER_NAMES.world,
          WORLD_PLACE_NODES.map((node) => ({ id: node.id, x: node.x, y: node.y })),
          4,
          128
        )
      : null;

    const title = this.add.text(
      this.px(GAME_CONSTANTS.WIDTH / 2),
      86,
      "\uC804\uCCB4 \uC9C0\uB3C4",
      this.getBodyStyle(40, worldUsesTmx ? "#f2ead7" : "#3e2d1a", "bold")
    );
    title.setOrigin(0.5);
    worldObjects.push(title);

    WORLD_PLACE_NODES.forEach((place) => {
      const mapped = this.mapPointToAreaBounds(place.x, place.y, worldTmxBounds);
      const zone = tmxWorldZones?.[place.id];
      const mappedZoneSize = zone
        ? { width: zone.width, height: zone.height }
        : this.mapSizeToAreaBounds(place.zoneWidth, place.zoneHeight, worldTmxBounds);
      const zoneCenter = zone ? { x: zone.centerX, y: zone.centerY } : mapped;
      const markerSize = this.mapSizeToAreaBounds(40, 28, worldTmxBounds);
      const marker = this.add.rectangle(zoneCenter.x, zoneCenter.y, markerSize.width, markerSize.height, place.movable ? 0xe7d593 : 0xc9a67f, 1);
      marker.setStrokeStyle(2, 0x5d4426, 1);
      marker.setVisible(false);

      const mappedLabel = zone
        ? { x: zone.centerX, y: zone.centerY + mappedZoneSize.height / 2 + 8 }
        : this.mapPointToAreaBounds(place.x, place.y + 28, worldTmxBounds);
      const label = this.add.text(mappedLabel.x, mappedLabel.y, place.label, this.getBodyStyle(18, "#3d2d1d", "bold"));
      label.setOrigin(0.5, 0);
      label.setVisible(false);

      this.worldPlaceViews[place.id] = { marker, label };
      this.worldPlaceInteractionZones[place.id] = new Phaser.Geom.Rectangle(
        this.px(zoneCenter.x - mappedZoneSize.width / 2),
        this.px(zoneCenter.y - mappedZoneSize.height / 2),
        this.px(mappedZoneSize.width),
        this.px(mappedZoneSize.height)
      );
      worldObjects.push(marker, label);
    });

    worldRoot.add(worldObjects);
    this.worldMapRoot = worldRoot;

    const downtownRoot = this.add.container(0, 0);
    downtownRoot.setDepth(0);
    const downtownTmxBounds = this.buildAreaTmxBackground(downtownRoot, AREA_TMX_TEXT_KEYS.downtown);
    const downtownUsesTmx = Boolean(downtownTmxBounds);
    this.areaCollisionConfigs.downtown = downtownTmxBounds
      ? this.buildAreaCollisionConfigFromTmx(AREA_TMX_TEXT_KEYS.downtown, downtownTmxBounds, AREA_COLLISION_LAYER_NAMES.downtown) ?? undefined
      : undefined;
    const downtownZones = downtownTmxBounds
      ? this.buildInteractionZonesFromTmx(
          AREA_TMX_TEXT_KEYS.downtown,
          downtownTmxBounds,
          AREA_INTERACTION_LAYER_NAMES.downtown,
          DOWNTOWN_BUILDINGS.map((building) => ({ id: building.id, x: building.x, y: building.y })),
          4,
          96
        )
      : null;
    const areaTitle = this.add.text(
      this.px(GAME_CONSTANTS.WIDTH / 2),
      82,
      "\uBC88\uD654\uAC00",
      this.getBodyStyle(38, downtownUsesTmx ? "#f2ead7" : "#f4ecd8", "bold")
    );
    areaTitle.setOrigin(0.5);
    const buildingObjects: Phaser.GameObjects.GameObject[] = [];
    const downtownDecorObjects: Phaser.GameObjects.GameObject[] = [];

    if (!downtownUsesTmx) {
      const downtownBg = this.add.rectangle(
        this.px(GAME_CONSTANTS.WIDTH / 2),
        this.px(GAME_CONSTANTS.HEIGHT / 2),
        GAME_CONSTANTS.WIDTH,
        GAME_CONSTANTS.HEIGHT,
        0x7ea274,
        1
      );
      const downtownRoad = this.add.rectangle(this.px(GAME_CONSTANTS.WIDTH / 2), this.px(GAME_CONSTANTS.HEIGHT * 0.63), 1120, 170, 0xa78c68, 1);
      downtownRoad.setStrokeStyle(3, 0x6d522f, 1);
      const shopFront = this.add.rectangle(this.px(930), this.px(332), 190, 140, 0xd6b98a, 1);
      shopFront.setStrokeStyle(3, 0x6d522f, 1);
      const shopSign = this.add.text(930, 332, "\uC0C1\uC810", this.getBodyStyle(27, "#3e2d1a", "bold"));
      shopSign.setOrigin(0.5);
      downtownDecorObjects.push(downtownBg, downtownRoad, shopFront, shopSign);
    }

    DOWNTOWN_BUILDINGS.forEach((building) => {
      const zone = downtownZones?.[building.id];
      const mappedCenter = zone
        ? { x: zone.centerX, y: zone.centerY }
        : this.mapPointToAreaBounds(building.x, building.y, downtownTmxBounds);
      const mappedSize = zone
        ? { width: zone.width, height: zone.height }
        : this.mapSizeToAreaBounds(building.w, building.h, downtownTmxBounds);

      const hitBox = this.add.rectangle(
        mappedCenter.x,
        mappedCenter.y,
        mappedSize.width,
        mappedSize.height,
        downtownUsesTmx ? 0x000000 : building.color,
        downtownUsesTmx ? 0.001 : 1
      );
      if (!downtownUsesTmx) {
        hitBox.setStrokeStyle(3, 0x6d522f, 1);
      }
      hitBox.setInteractive({ useHandCursor: true }).on("pointerdown", () => {
        if (this.currentArea !== "downtown" || this.menuOpen || this.shopOpen || this.placePopupOpen) return;
        this.openDowntownBuildingPopup(building.id);
      });

      buildingObjects.push(hitBox);

      if (!downtownUsesTmx) {
        const sign = this.add.rectangle(this.px(building.x), this.px(building.y - building.h / 2 + 16), this.px(building.w - 18), 24, 0xe8d1a7, 1);
        sign.setStrokeStyle(2, 0x7d5f36, 1);
        const signLabel = this.add.text(this.px(building.x), this.px(building.y - building.h / 2 + 16), building.label, this.getBodyStyle(15, "#3d2a16", "bold"));
        signLabel.setOrigin(0.5);
        buildingObjects.push(sign, signLabel);
      }
    });

    downtownRoot.add([...downtownDecorObjects, ...buildingObjects, areaTitle]);
    downtownRoot.setVisible(false);
    this.downtownMapRoot = downtownRoot;

    const campusRoot = this.add.container(0, 0);
    campusRoot.setDepth(0);
    const campusTmxBounds = this.buildAreaTmxBackground(campusRoot, AREA_TMX_TEXT_KEYS.campus);
    const campusUsesTmx = Boolean(campusTmxBounds);
    this.areaCollisionConfigs.campus = campusTmxBounds
      ? this.buildAreaCollisionConfigFromTmx(AREA_TMX_TEXT_KEYS.campus, campusTmxBounds, AREA_COLLISION_LAYER_NAMES.campus) ?? undefined
      : undefined;
    const campusObjects: Phaser.GameObjects.GameObject[] = [];
    if (!campusUsesTmx) {
      const campusBg = this.add.rectangle(
        this.px(GAME_CONSTANTS.WIDTH / 2),
        this.px(GAME_CONSTANTS.HEIGHT / 2),
        GAME_CONSTANTS.WIDTH,
        GAME_CONSTANTS.HEIGHT,
        0x86ad82,
        1
      );
      const lawn = this.add.rectangle(this.px(GAME_CONSTANTS.WIDTH / 2), this.px(GAME_CONSTANTS.HEIGHT * 0.62), 980, 280, 0x9dc08a, 1);
      lawn.setStrokeStyle(3, 0x5a7e4f, 1);
      const building = this.add.rectangle(this.px(920), this.px(300), 280, 180, 0xd7c9a9, 1);
      building.setStrokeStyle(3, 0x7d5f36, 1);
      const buildingLabel = this.add.text(920, 300, "\uAC15\uC758\uB3D9", this.getBodyStyle(30, "#3e2d1a", "bold"));
      buildingLabel.setOrigin(0.5);
      const tree1 = this.add.rectangle(286, 280, 64, 64, 0x6f955f, 1).setStrokeStyle(2, 0x3f5f32, 1);
      const tree2 = this.add.rectangle(352, 330, 64, 64, 0x6f955f, 1).setStrokeStyle(2, 0x3f5f32, 1);
      campusObjects.push(campusBg, lawn, building, buildingLabel, tree1, tree2);
    }
    const campusTitle = this.add.text(this.px(GAME_CONSTANTS.WIDTH / 2), 82, "\uCEA0\uD37C\uC2A4", this.getBodyStyle(38, "#f2ead7", "bold"));
    campusTitle.setOrigin(0.5);
    campusObjects.push(campusTitle);
    campusRoot.add(campusObjects);
    campusRoot.setVisible(false);
    this.campusMapRoot = campusRoot;
  }

  private preloadPlayerAvatarAssets(): void {
    this.load.spritesheet("base_male", "../../assets/game/character/base_male.png", PLAYER_SPRITE_CONFIG);
    this.load.spritesheet("base_female", "../../assets/game/character/base_female.png", PLAYER_SPRITE_CONFIG);
    this.load.spritesheet("base_male_walk", "../../assets/game/character/base_male_walk.png", PLAYER_SPRITE_CONFIG);
    this.load.spritesheet("base_female_walk", "../../assets/game/character/base_female_walk.png", PLAYER_SPRITE_CONFIG);

    for (let i = 1; i <= 3; i += 1) {
      this.load.spritesheet(`male_hair_${i}`, `../../assets/game/character/male_hair_${i}.png`, PLAYER_SPRITE_CONFIG);
      this.load.spritesheet(`female_hair_${i}`, `../../assets/game/character/female_hair_${i}.png`, PLAYER_SPRITE_CONFIG);
      this.load.spritesheet(`male_clothes_${i}`, `../../assets/game/character/male_clothes_${i}.png`, PLAYER_SPRITE_CONFIG);
      this.load.spritesheet(`female_clothes_${i}`, `../../assets/game/character/female_clothes_${i}.png`, PLAYER_SPRITE_CONFIG);
      this.load.spritesheet(`male_hair_${i}_walk`, `../../assets/game/character/male_hair_${i}_walk.png`, PLAYER_SPRITE_CONFIG);
      this.load.spritesheet(`female_hair_${i}_walk`, `../../assets/game/character/female_hair_${i}_walk.png`, PLAYER_SPRITE_CONFIG);
      this.load.spritesheet(`male_clothes_${i}_walk`, `../../assets/game/character/male_clothes_${i}_walk.png`, PLAYER_SPRITE_CONFIG);
      this.load.spritesheet(`female_clothes_${i}_walk`, `../../assets/game/character/female_clothes_${i}_walk.png`, PLAYER_SPRITE_CONFIG);
    }
  }

  private getSelectedPlayerAvatar(): PlayerAvatarData {
    const raw = this.registry.get("playerData");
    const playerData = raw as Partial<PlayerAvatarData> | undefined;
    const gender = playerData?.gender === "female" ? "female" : "male";
    const hair = Phaser.Math.Clamp(Math.round(playerData?.hair ?? 1), 1, 3);
    const cloth = Phaser.Math.Clamp(Math.round(playerData?.cloth ?? 1), 1, 3);
    return { gender, hair, cloth };
  }

  private createPlayerAvatar(): void {
    const x = this.px(GAME_CONSTANTS.WIDTH / 2);
    const y = this.px(GAME_CONSTANTS.HEIGHT / 2);
    const baseKey = `base_${this.playerAvatar.gender}`;

    this.player = this.physics.add.sprite(x, y, baseKey, 0);
    this.player.setCollideWorldBounds(true);
    this.player.setDepth(29);
    this.player.setAlpha(0.01);
    this.player.setScale(1);
    this.player.setOrigin(0.5, 0.72);
    this.player.setSize(18, 12);
    this.player.setOffset(7, 20);
    this.player.texture.setFilter(Phaser.Textures.FilterMode.NEAREST);

    this.playerVisual = this.buildPlayerVisual(x, y);
    this.syncPlayerAvatarVisuals();
    this.updatePlayerAvatarAnimation({ x: 0, y: 0 });
  }

  private syncPlayerAvatarVisuals(): void {
    if (!this.player || !this.playerVisual) return;

    this.playerVisual.root.setPosition(this.player.x, this.player.y + 10);
    this.playerVisual.root.setVisible(this.player.visible);
  }

  private updatePlayerAvatarAnimation(move: { x: number; y: number }): void {
    if (!this.playerVisual) return;

    const isMoving = Math.abs(move.x) > 0.01 || Math.abs(move.y) > 0.01;
    const gender = this.playerAvatar.gender;
    if (Math.abs(move.x) > Math.abs(move.y) && Math.abs(move.x) > 0.01) {
      this.playerFacing = move.x < 0 ? "left" : "right";
    } else if (Math.abs(move.y) > 0.01) {
      this.playerFacing = move.y < 0 ? "up" : "down";
    }

    const visual = this.playerVisual;
    const walkBaseKey = `base_${gender}_walk`;
    const walkClothesKey = `${gender}_clothes_${this.playerAvatar.cloth}_walk`;
    const walkHairKey = `${gender}_hair_${this.playerAvatar.hair}_walk`;
    const facingFrames = PLAYER_DIRECTION_FRAMES[this.playerFacing];
    const walkFrame =
      facingFrames.walk.length === 1
        ? facingFrames.walk[0]
        : facingFrames.walk[Math.floor(this.time.now / PLAYER_WALK_FRAME_DURATION) % facingFrames.walk.length];
    const targetFrame = isMoving ? walkFrame : facingFrames.idle;

    visual.root.setScale(PLAYER_DISPLAY_SCALE);

    if (visual.base.texture.key !== walkBaseKey) {
      visual.base.setTexture(walkBaseKey, targetFrame);
    } else {
      visual.base.setFrame(targetFrame);
    }
    if (visual.clothes.texture.key !== walkClothesKey) {
      visual.clothes.setTexture(walkClothesKey, targetFrame);
    } else {
      visual.clothes.setFrame(targetFrame);
    }
    if (visual.hair.texture.key !== walkHairKey) {
      visual.hair.setTexture(walkHairKey, targetFrame);
    } else {
      visual.hair.setFrame(targetFrame);
    }
  }

  private buildPlayerVisual(x: number, y: number): PlayerVisualParts {
    const gender = this.playerAvatar.gender;
    const base = this.add.sprite(0, 0, `base_${gender}`, 0).setOrigin(0.5, 1);
    const clothes = this.add
      .sprite(0, 0, `${gender}_clothes_${this.playerAvatar.cloth}`, 0)
      .setOrigin(0.5, 1);
    const hair = this.add
      .sprite(0, 0, `${gender}_hair_${this.playerAvatar.hair}`, 0)
      .setOrigin(0.5, 1);

    base.texture.setFilter(Phaser.Textures.FilterMode.NEAREST);
    clothes.texture.setFilter(Phaser.Textures.FilterMode.NEAREST);
    hair.texture.setFilter(Phaser.Textures.FilterMode.NEAREST);

    base.name = "base";
    clothes.name = "clothes";
    hair.name = "hair";

    const root = this.add.container(x, y + 10, [base, clothes, hair]);
    root.setDepth(32);
    root.setScale(PLAYER_DISPLAY_SCALE);

    return {
      root,
      base,
      clothes,
      hair,
    };
  }

  private buildAreaTmxBackground(root: Phaser.GameObjects.Container, textKey: string): AreaRenderBounds {
    const tmxText = this.cache.text.get(textKey);
    if (typeof tmxText !== "string" || tmxText.length === 0) {
      return null;
    }
    if (!this.textures.exists(AREA_TILESET_IMAGE_KEY)) {
      return null;
    }

    const parsed = this.parseTmxMap(tmxText);
    if (!parsed) {
      return null;
    }

    const layersToRender = parsed.layers.filter((layer) => layer.visible);
    if (layersToRender.length === 0) {
      return null;
    }

    const mapPixelWidth = parsed.width * parsed.tileWidth;
    const mapPixelHeight = parsed.height * parsed.tileHeight;
    const fitScaleX = GAME_CONSTANTS.WIDTH / mapPixelWidth;
    const fitScaleY = GAME_CONSTANTS.HEIGHT / mapPixelHeight;
    const scale = Math.max(fitScaleX, fitScaleY);
    const renderWidth = mapPixelWidth * scale;
    const renderHeight = mapPixelHeight * scale;
    const offsetX = this.px((GAME_CONSTANTS.WIDTH - renderWidth) / 2);
    const offsetY = this.px((GAME_CONSTANTS.HEIGHT - renderHeight) / 2);
    const renderedBounds = new Phaser.Geom.Rectangle(offsetX, offsetY, renderWidth, renderHeight);

    layersToRender.forEach((layer, layerIndex) => {
      const map = this.make.tilemap({
        data: layer.data,
        tileWidth: parsed.tileWidth,
        tileHeight: parsed.tileHeight
      });

      const tilesets: Phaser.Tilemaps.Tileset[] = parsed.tilesets
        .map((tileset, idx) =>
          map.addTilesetImage(
            `${textKey}_tileset_${idx}_${tileset.name}`,
            AREA_TILESET_IMAGE_KEY,
            parsed.tileWidth,
            parsed.tileHeight,
            0,
            0,
            tileset.firstgid
          )
        )
        .filter((tileset): tileset is Phaser.Tilemaps.Tileset => Boolean(tileset));

      if (tilesets.length === 0) {
        const fallbackTileset = map.addTilesetImage(`${textKey}_tileset_fallback`, AREA_TILESET_IMAGE_KEY, parsed.tileWidth, parsed.tileHeight, 0, 0, 1);
        if (fallbackTileset) {
          tilesets.push(fallbackTileset);
        }
      }

      const tileLayer = map.createLayer(0, tilesets, 0, 0);
      if (!tileLayer) {
        return;
      }
      tileLayer.setPosition(offsetX, offsetY);
      tileLayer.setScale(scale);
      tileLayer.setDepth(layerIndex);
      root.add(tileLayer);
    });

    return renderedBounds;
  }

  private parseTmxMap(rawTmx: string): ParsedTmxMap | null {
    const parser = new DOMParser();
    const doc = parser.parseFromString(rawTmx, "application/xml");
    if (doc.getElementsByTagName("parsererror").length > 0) {
      return null;
    }

    const mapNode = doc.getElementsByTagName("map")[0];
    if (!mapNode) return null;

    const width = Number.parseInt(mapNode.getAttribute("width") ?? "0", 10);
    const height = Number.parseInt(mapNode.getAttribute("height") ?? "0", 10);
    const tileWidth = Number.parseInt(mapNode.getAttribute("tilewidth") ?? "32", 10);
    const tileHeight = Number.parseInt(mapNode.getAttribute("tileheight") ?? "32", 10);
    if (width <= 0 || height <= 0 || tileWidth <= 0 || tileHeight <= 0) return null;

    const tilesets = Array.from(mapNode.getElementsByTagName("tileset"))
      .map((tilesetNode, idx) => {
        const firstgid = Number.parseInt(tilesetNode.getAttribute("firstgid") ?? `${idx + 1}`, 10);
        const name = tilesetNode.getAttribute("name") ?? tilesetNode.getAttribute("source") ?? `tileset_${idx + 1}`;
        if (!Number.isFinite(firstgid)) return null;
        return { firstgid, name };
      })
      .filter((tileset): tileset is { firstgid: number; name: string } => Boolean(tileset))
      .sort((a, b) => a.firstgid - b.firstgid);

    const layers: ParsedTmxLayer[] = [];
    Array.from(mapNode.getElementsByTagName("layer")).forEach((layerNode, idx) => {
      const dataNode = layerNode.getElementsByTagName("data")[0];
      if (!dataNode) return;
      const encoding = dataNode.getAttribute("encoding");
      if (encoding !== "csv") return;

      const values = (dataNode.textContent ?? "")
        .split(",")
        .map((value) => value.trim())
        .filter((value) => value.length > 0)
        .map((value) => {
          const parsedValue = Number.parseInt(value, 10);
          if (!Number.isFinite(parsedValue)) return 0;
          const gid = (parsedValue >>> 0) & 0x1fffffff;
          return gid;
        });

      const required = width * height;
      if (values.length < required) {
        values.push(...Array.from({ length: required - values.length }, () => 0));
      }

      const rowData: number[][] = [];
      for (let y = 0; y < height; y += 1) {
        const start = y * width;
        rowData.push(values.slice(start, start + width));
      }

      layers.push({
        name: layerNode.getAttribute("name") ?? `layer_${idx + 1}`,
        visible: layerNode.getAttribute("visible") !== "0",
        data: rowData
      });
    });

    if (layers.length === 0) return null;
    return { width, height, tileWidth, tileHeight, tilesets, layers };
  }

  private buildInteractionZonesFromTmx<T extends string>(
    textKey: string,
    bounds: AreaRenderBounds,
    layerNames: string[],
    targets: Array<{ id: T; x: number; y: number }>,
    minAreaTiles: number,
    maxAreaTiles: number
  ): Partial<Record<T, InteractionZone>> | null {
    if (!bounds) return null;
    const tmxText = this.cache.text.get(textKey);
    if (typeof tmxText !== "string" || tmxText.length === 0) return null;

    const parsed = this.parseTmxMap(tmxText);
    if (!parsed) return null;

    const combined = this.combineLayersByNames(parsed, layerNames);
    if (!combined) return null;
    const targetIds = targets.map((target) => target.id);
    const baseTargets = targets.reduce(
      (acc, target) => {
        acc[target.id] = this.screenPointToMapTile(target.x, target.y, bounds, parsed);
        return acc;
      },
      {} as Record<T, { tileX: number; tileY: number }>
    );

    const regions = this.expandInteractionRegions(
      this.extractTmxConnectedRegions(combined, minAreaTiles).filter((region) => region.area >= minAreaTiles && region.area <= maxAreaTiles),
      baseTargets
    );
    if (regions.length === 0) return null;

    const mapPixelWidth = parsed.width * parsed.tileWidth;
    const mapPixelHeight = parsed.height * parsed.tileHeight;
    const scaleX = bounds.width / mapPixelWidth;
    const scaleY = bounds.height / mapPixelHeight;

    const remaining = [...regions];
    const zones: Partial<Record<T, InteractionZone>> = {};

    targetIds.forEach((id) => {
      const target = baseTargets[id];
      if (!target || remaining.length === 0) return;
      let bestIdx = 0;
      let bestDist = Number.POSITIVE_INFINITY;
      remaining.forEach((region, idx) => {
        const dx = region.centerX - target.tileX;
        const dy = region.centerY - target.tileY;
        const dist = dx * dx + dy * dy;
        if (dist < bestDist) {
          bestDist = dist;
          bestIdx = idx;
        }
      });
      const [region] = remaining.splice(bestIdx, 1);
      if (!region) return;

      const paddingTiles = 0.35;
      const minTileX = Math.max(0, region.minX - paddingTiles);
      const maxTileX = Math.min(parsed.width, region.maxX + 1 + paddingTiles);
      const minTileY = Math.max(0, region.minY - paddingTiles);
      const maxTileY = Math.min(parsed.height, region.maxY + 1 + paddingTiles);
      const x = bounds.x + minTileX * parsed.tileWidth * scaleX;
      const y = bounds.y + minTileY * parsed.tileHeight * scaleY;
      const width = (maxTileX - minTileX) * parsed.tileWidth * scaleX;
      const height = (maxTileY - minTileY) * parsed.tileHeight * scaleY;
      zones[id] = {
        centerX: x + width / 2,
        centerY: y + height / 2,
        width,
        height
      };
    });

    return zones;
  }

  private expandInteractionRegions<T extends string>(
    regions: TmxRegion[],
    targets: Record<T, { tileX: number; tileY: number }>
  ): TmxRegion[] {
    const expanded: TmxRegion[] = [];

    regions.forEach((region) => {
      const targetValues = Object.values(targets) as Array<{ tileX: number; tileY: number }>;
      const containedTargets = targetValues
        .filter(
          (target) =>
            target.tileX >= region.minX &&
            target.tileX <= region.maxX &&
            target.tileY >= region.minY &&
            target.tileY <= region.maxY
        )
        .sort((a, b) => a.tileX - b.tileX);

      if (containedTargets.length <= 1 || region.maxX <= region.minX) {
        expanded.push(region);
        return;
      }

      const splitEdges = [region.minX];
      for (let i = 0; i < containedTargets.length - 1; i += 1) {
        splitEdges.push(Math.floor((containedTargets[i].tileX + containedTargets[i + 1].tileX) / 2));
      }
      splitEdges.push(region.maxX + 1);

      for (let i = 0; i < containedTargets.length; i += 1) {
        const minX = splitEdges[i];
        const maxX = splitEdges[i + 1] - 1;
        const centerX = (minX + maxX) / 2;
        expanded.push({
          minX,
          maxX,
          minY: region.minY,
          maxY: region.maxY,
          area: Math.max(1, (maxX - minX + 1) * (region.maxY - region.minY + 1)),
          centerX,
          centerY: region.centerY
        });
      }
    });

    return expanded;
  }

  private combineLayersByNames(parsed: ParsedTmxMap, layerNames: string[]): number[][] | null {
    const names = new Set(layerNames.map((name) => name.trim().toLowerCase()));
    const layers = parsed.layers.filter((layer) => names.has(layer.name.trim().toLowerCase()));
    if (layers.length === 0) return null;
    const combined = Array.from({ length: parsed.height }, () => Array.from({ length: parsed.width }, () => 0));
    layers.forEach((layer) => {
      for (let y = 0; y < parsed.height; y += 1) {
        for (let x = 0; x < parsed.width; x += 1) {
          if ((layer.data[y]?.[x] ?? 0) !== 0) combined[y][x] = 1;
        }
      }
    });
    return combined;
  }

  private buildTmxSemanticGrid(parsed: ParsedTmxMap, rules: TmxSemanticRule[]): TmxSemanticCode[][] | null {
    const grid = Array.from({ length: parsed.height }, () =>
      Array.from({ length: parsed.width }, () => 0 as TmxSemanticCode)
    );
    let matchedLayer = false;

    rules.forEach((rule) => {
      const combined = this.combineLayersByNames(parsed, rule.layerNames);
      if (!combined) return;
      matchedLayer = true;

      for (let y = 0; y < parsed.height; y += 1) {
        for (let x = 0; x < parsed.width; x += 1) {
          if (combined[y]?.[x]) {
            grid[y][x] = rule.code;
          }
        }
      }
    });

    return matchedLayer ? grid : null;
  }

  private createAreaCollisionConfigFromSemanticGrid(
    bounds: Phaser.Geom.Rectangle,
    parsed: ParsedTmxMap,
    tileCodes: TmxSemanticCode[][],
    blockedCodes: TmxSemanticCode[]
  ): AreaCollisionConfig {
    const blockedCodeSet = new Set<TmxSemanticCode>(blockedCodes);

    return {
      bounds,
      mapWidth: parsed.width,
      mapHeight: parsed.height,
      tileWidth: parsed.tileWidth,
      tileHeight: parsed.tileHeight,
      tileCodes,
      blocked: tileCodes.map((row) => row.map((cell) => blockedCodeSet.has(cell)))
    };
  }

  private buildAreaCollisionConfigFromTmxSemanticRules(
    textKey: string,
    bounds: Phaser.Geom.Rectangle,
    rules: TmxSemanticRule[],
    blockedCodes: TmxSemanticCode[]
  ): AreaCollisionConfig | null {
    const tmxText = this.cache.text.get(textKey);
    if (typeof tmxText !== "string" || tmxText.length === 0) return null;
    const parsed = this.parseTmxMap(tmxText);
    if (!parsed) return null;
    const tileCodes = this.buildTmxSemanticGrid(parsed, rules);
    if (!tileCodes) return null;
    return this.createAreaCollisionConfigFromSemanticGrid(bounds, parsed, tileCodes, blockedCodes);
  }

  private buildAreaCollisionConfigFromTmx(textKey: string, bounds: Phaser.Geom.Rectangle, layerNames: string[]): AreaCollisionConfig | null {
    const tmxText = this.cache.text.get(textKey);
    if (typeof tmxText !== "string" || tmxText.length === 0) return null;
    const parsed = this.parseTmxMap(tmxText);
    if (!parsed) return null;
    const combined = this.combineLayersByNames(parsed, layerNames);
    if (!combined) return null;

    return {
      bounds,
      mapWidth: parsed.width,
      mapHeight: parsed.height,
      tileWidth: parsed.tileWidth,
      tileHeight: parsed.tileHeight,
      tileCodes: combined.map((row) => row.map((cell) => (cell !== 0 ? 1 : 0 as TmxSemanticCode))),
      blocked: combined.map((row) => row.map((cell) => cell !== 0))
    };
  }

  private screenPointToMapTile(
    screenX: number,
    screenY: number,
    bounds: Phaser.Geom.Rectangle,
    parsed: Pick<ParsedTmxMap, "width" | "height" | "tileWidth" | "tileHeight">
  ): { tileX: number; tileY: number } {
    const mapPixelWidth = parsed.width * parsed.tileWidth;
    const mapPixelHeight = parsed.height * parsed.tileHeight;
    const localX = Phaser.Math.Clamp((screenX - bounds.x) / bounds.width, 0, 0.9999) * mapPixelWidth;
    const localY = Phaser.Math.Clamp((screenY - bounds.y) / bounds.height, 0, 0.9999) * mapPixelHeight;
    return {
      tileX: Math.floor(localX / parsed.tileWidth),
      tileY: Math.floor(localY / parsed.tileHeight)
    };
  }

  private findNearestWalkablePoint(area: AreaId, desiredX: number, desiredY: number): { x: number; y: number } {
    const config = this.areaCollisionConfigs[area];
    if (!config) {
      return { x: this.px(desiredX), y: this.px(desiredY) };
    }

    const desiredTile = this.screenPointToMapTile(desiredX, desiredY, config.bounds, {
      width: config.mapWidth,
      height: config.mapHeight,
      tileWidth: config.tileWidth,
      tileHeight: config.tileHeight
    });

    const clampTileX = Phaser.Math.Clamp(desiredTile.tileX, 0, config.mapWidth - 1);
    const clampTileY = Phaser.Math.Clamp(desiredTile.tileY, 0, config.mapHeight - 1);
    if (!config.blocked[clampTileY]?.[clampTileX]) {
      return { x: this.px(desiredX), y: this.px(desiredY) };
    }

    const maxRadius = Math.max(config.mapWidth, config.mapHeight);
    for (let radius = 1; radius <= maxRadius; radius += 1) {
      for (let tileY = Math.max(0, clampTileY - radius); tileY <= Math.min(config.mapHeight - 1, clampTileY + radius); tileY += 1) {
        for (let tileX = Math.max(0, clampTileX - radius); tileX <= Math.min(config.mapWidth - 1, clampTileX + radius); tileX += 1) {
          if (config.blocked[tileY]?.[tileX]) continue;

          const screenX = config.bounds.x + ((tileX + 0.5) * config.tileWidth * config.bounds.width) / (config.mapWidth * config.tileWidth);
          const screenY = config.bounds.y + ((tileY + 0.5) * config.tileHeight * config.bounds.height) / (config.mapHeight * config.tileHeight);
          return { x: this.px(screenX), y: this.px(screenY) };
        }
      }
    }

    return { x: this.px(desiredX), y: this.px(desiredY) };
  }

  private isBlockedByAreaCollision(area: AreaId, x: number, y: number): boolean {
    const config = this.areaCollisionConfigs[area];
    if (!config) return false;
    const { bounds, mapWidth, mapHeight, tileWidth, tileHeight, blocked } = config;
    const mapPixelWidth = mapWidth * tileWidth;
    const mapPixelHeight = mapHeight * tileHeight;
    const localX = ((x - bounds.x) / bounds.width) * mapPixelWidth;
    const localY = ((y - bounds.y) / bounds.height) * mapPixelHeight;
    const tileX = Math.floor(localX / tileWidth);
    const tileY = Math.floor(localY / tileHeight);
    if (tileX < 0 || tileY < 0 || tileX >= mapWidth || tileY >= mapHeight) return false;
    return Boolean(blocked[tileY]?.[tileX]);
  }

  private enforceAreaCollision(): void {
    const playerBody = this.player.body;
    if (!playerBody?.enable || this.currentArea === "world" && !this.worldMapRoot?.visible) return;
    if (this.menuOpen || this.dialogueOpen || this.placePopupOpen || this.shopOpen) return;
    const x = this.player.x;
    const y = this.player.y;
    if (!this.isBlockedByAreaCollision(this.currentArea, x, y)) {
      this.lastSafePlayerPosition = { x, y };
      return;
    }
    if (!this.lastSafePlayerPosition) return;
    this.player.setPosition(this.lastSafePlayerPosition.x, this.lastSafePlayerPosition.y);
    this.player.setVelocity(0, 0);
  }

  private extractTmxConnectedRegions(data: number[][], minAreaTiles: number): TmxRegion[] {
    const height = data.length;
    if (height === 0) return [];
    const width = data[0]?.length ?? 0;
    if (width === 0) return [];

    const visited = Array.from({ length: height }, () => Array.from({ length: width }, () => false));
    const dirs: Array<[number, number]> = [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1]
    ];
    const regions: TmxRegion[] = [];

    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        if (visited[y][x] || data[y][x] === 0) continue;

        const queue: Array<[number, number]> = [[x, y]];
        visited[y][x] = true;
        let qi = 0;
        let minX = x;
        let maxX = x;
        let minY = y;
        let maxY = y;
        let area = 0;
        let sumX = 0;
        let sumY = 0;

        while (qi < queue.length) {
          const [cx, cy] = queue[qi];
          qi += 1;
          area += 1;
          sumX += cx;
          sumY += cy;
          minX = Math.min(minX, cx);
          maxX = Math.max(maxX, cx);
          minY = Math.min(minY, cy);
          maxY = Math.max(maxY, cy);

          dirs.forEach(([dx, dy]) => {
            const nx = cx + dx;
            const ny = cy + dy;
            if (nx < 0 || ny < 0 || nx >= width || ny >= height) return;
            if (visited[ny][nx] || data[ny][nx] === 0) return;
            visited[ny][nx] = true;
            queue.push([nx, ny]);
          });
        }

        if (area >= minAreaTiles) {
          regions.push({
            minX,
            maxX,
            minY,
            maxY,
            area,
            centerX: sumX / area,
            centerY: sumY / area
          });
        }
      }
    }

    return regions;
  }

  private mapPointToAreaBounds(x: number, y: number, bounds: AreaRenderBounds): { x: number; y: number } {
    if (!bounds) {
      return { x: this.px(x), y: this.px(y) };
    }
    return {
      x: this.px(bounds.x + (x / GAME_CONSTANTS.WIDTH) * bounds.width),
      y: this.px(bounds.y + (y / GAME_CONSTANTS.HEIGHT) * bounds.height)
    };
  }

  private mapSizeToAreaBounds(width: number, height: number, bounds: AreaRenderBounds): { width: number; height: number } {
    if (!bounds) {
      return { width: this.px(width), height: this.px(height) };
    }
    return {
      width: this.px((width / GAME_CONSTANTS.WIDTH) * bounds.width),
      height: this.px((height / GAME_CONSTANTS.HEIGHT) * bounds.height)
    };
  }

  private enterArea(area: AreaId, worldPlace: WorldPlaceId = this.lastSelectedWorldPlace): void {
    this.currentArea = area;
    this.closeShop();
    this.closeDialogue();
    this.closePlacePopup();
    this.player.setVelocity(0, 0);

    this.worldMapRoot?.setVisible(area === "world");
    this.downtownMapRoot?.setVisible(area === "downtown");
    this.campusMapRoot?.setVisible(area === "campus");

    if (area === "world") {
      const spawnFrom = WORLD_PLACE_NODES.find((node) => node.id === worldPlace) ?? WORLD_PLACE_NODES[1];
      this.lastSelectedWorldPlace = spawnFrom.id;
      this.player.setVisible(true);
      const worldBody = this.player.body;
      if (worldBody) worldBody.enable = true;
      const worldSpawn = this.buildWorldSpawnPoint(spawnFrom.id, spawnFrom.x, spawnFrom.y + 52);
      this.player.setPosition(worldSpawn.x, worldSpawn.y);
      this.highlightWorldPlace(spawnFrom.id);
      this.interactionTarget.setVisible(false);
      this.interactionLabel.setVisible(false);
      this.controlHintText?.setText("WASD / Arrow: \uC774\uB3D9  |  E: \uC7A5\uC18C \uC0C1\uD638\uC791\uC6A9  |  ESC: \uBA54\uB274");
      this.updateHudState({ locationLabel: AREA_LABEL.world });
      this.lastSafePlayerPosition = { x: this.player.x, y: this.player.y };
      return;
    }

    this.lastSelectedWorldPlace = area === "downtown" ? "downtown" : "campus";
    const spawn = AREA_ENTRY_POINT[area];
    this.player.setVisible(true);
    const areaBody = this.player.body;
    if (areaBody) areaBody.enable = true;
    const resolvedSpawn = this.findNearestWalkablePoint(area, spawn.x, spawn.y);
    this.player.setPosition(resolvedSpawn.x, resolvedSpawn.y);
    this.highlightWorldPlace(null);
    this.controlHintText?.setText("WASD / Arrow: \uC774\uB3D9  |  E: \uC0C1\uD638\uC791\uC6A9  |  Q: \uC804\uCCB4 \uC9C0\uB3C4  |  ESC: \uBA54\uB274");
    this.updateHudState({ locationLabel: AREA_LABEL[area] });
    this.lastSafePlayerPosition = { x: this.player.x, y: this.player.y };
    const npcConfig = this.getAreaNpcConfig(area);
    if (!npcConfig) {
      this.interactionTarget.setVisible(false);
      this.interactionLabel.setVisible(false);
      return;
    }

    this.interactionTarget.setPosition(npcConfig.x, npcConfig.y);
    this.interactionTarget.setFillStyle(0x6e4f2b, 1);
    this.interactionTarget.setVisible(true);
    this.interactionLabel.setText(NPC_DIALOGUE_SCRIPTS[npcConfig.dialogueId]?.npcLabel ?? "NPC");
    this.interactionLabel.setPosition(
      this.px(this.interactionTarget.x + npcConfig.labelOffsetX),
      this.px(this.interactionTarget.y + npcConfig.labelOffsetY)
    );
    this.interactionLabel.setVisible(true);
  }

  private buildWorldSpawnPoint(placeId: WorldPlaceId, fallbackX: number, fallbackY: number): { x: number; y: number } {
    const zone = this.worldPlaceInteractionZones[placeId];
    if (zone) {
      const centerX = zone.centerX;
      const belowZoneY = zone.bottom + this.px(28);
      return this.findNearestWalkablePoint("world", centerX, belowZoneY);
    }

    return this.findNearestWalkablePoint("world", this.px(fallbackX), this.px(fallbackY));
  }

  private getNearestWorldPlace(maxDistance: number): WorldPlaceNode | null {
    let nearest: WorldPlaceNode | null = null;
    let nearestDistance = Number.POSITIVE_INFINITY;

    WORLD_PLACE_NODES.forEach((place) => {
      const zone = this.worldPlaceInteractionZones[place.id];
      const distance = zone
        ? Phaser.Math.Distance.Between(
            this.player.x,
            this.player.y,
            Phaser.Math.Clamp(this.player.x, zone.left, zone.right),
            Phaser.Math.Clamp(this.player.y, zone.top, zone.bottom)
          )
        : Phaser.Math.Distance.Between(this.player.x, this.player.y, place.x, place.y);
      if (distance <= maxDistance && distance < nearestDistance) {
        nearest = place;
        nearestDistance = distance;
      }
    });

    return nearest;
  }

  private handleWorldPlaceInteraction(place: WorldPlaceNode): void {
    this.lastSelectedWorldPlace = place.id;

    if (place.movable) {
      const nextArea: AreaId = place.id === "downtown" ? "downtown" : "campus";
      this.enterArea(nextArea, place.id);
      this.showSystemToast(`${place.label}\uB85C \uC774\uB3D9`);
      return;
    }

    this.openPlacePopup(place.id);
  }

  private highlightWorldPlace(active: WorldPlaceId | null): void {
    WORLD_PLACE_NODES.forEach((place) => {
      const view = this.worldPlaceViews[place.id];
      if (!view) return;

      const isActive = place.id === active;
      const baseColor = place.movable ? 0xe7d593 : 0xc9a67f;
      view.marker.setFillStyle(isActive ? 0xf4e2a5 : baseColor, 1);
      view.marker.setStrokeStyle(2, isActive ? 0x7a5a2e : 0x5d4426, 1);
      view.label.setColor(isActive ? "#2e220f" : "#3d2d1d");
    });
  }

  private isNearPoint(targetX: number, targetY: number, distance: number): boolean {
    return Phaser.Math.Distance.Between(this.player.x, this.player.y, targetX, targetY) <= distance;
  }

  private getAreaNpcConfig(area: AreaId): (typeof AREA_NPC_CONFIG)["downtown"] | null {
    if (area === "world") return null;
    return AREA_NPC_CONFIG[area];
  }

  private openPlacePopup(placeId: WorldPlaceId): void {
    if (placeId === "home") {
      this.openHomeActionPopup();
      return;
    }

    this.closePlacePopup();

    const centerX = this.px(GAME_CONSTANTS.WIDTH / 2);
    const centerY = this.px(GAME_CONSTANTS.HEIGHT / 2);
    const placeBackgroundKey = this.getPlaceBackgroundTextureKey(placeId);
    const placeBackgroundImage =
      placeBackgroundKey && this.textures.exists(placeBackgroundKey)
        ? this.add.image(centerX, centerY, placeBackgroundKey).setDisplaySize(GAME_CONSTANTS.WIDTH, GAME_CONSTANTS.HEIGHT)
        : null;
    const overlay = this.add.rectangle(
      centerX,
      centerY,
      GAME_CONSTANTS.WIDTH,
      GAME_CONSTANTS.HEIGHT,
      0x000000,
      placeBackgroundImage ? 0.42 : 0.36
    );
    let title = "";
    let description = "";
    let actionText = "";

    if (placeId === "cafe") {
      title = "\uCE74\uD398";
      description = "\uCEE4\uD53C \uD55C \uC794 1,200G\n\uC2A4\uD2B8\uB808\uC2A4 \uAC10\uC18C / \uCCB4\uB825 \uC18C\uD3ED \uD68C\uBCF5";
      actionText = "\uCEE4\uD53C \uB9C8\uC2DC\uAE30";
    } else {
      title = "\uD3B8\uC758\uC810";
      description = "\uD544\uC694\uD55C \uBB3C\uD488\uC744 \uAD6C\uB9E4\uD560 \uC218 \uC788\uC2B5\uB2C8\uB2E4.";
      actionText = "\uC0C1\uC810 \uC5F4\uAE30";
    }

    const panelOuter = this.createPanelOuterBorder(centerX, centerY, 530, 290);
    const panel = this.add.rectangle(centerX, centerY, 530, 290, 0x1a375c, 0.95);
    panel.setStrokeStyle(2, this.uiPanelInnerBorderColor, 1);
    const titleText = this.add.text(centerX, centerY - 92, title, this.getBodyStyle(34, "#e6f3ff", "bold"));
    titleText.setOrigin(0.5);
    const descText = this.add.text(centerX, centerY - 16, description, this.getBodyStyle(21, "#b6d6fb"));
    descText.setOrigin(0.5);
    descText.setAlign("center");
    descText.setLineSpacing(8);

    const actionBtn = this.createActionButton({
      x: centerX - 96,
      y: centerY + 86,
      width: 170,
      height: 52,
      text: actionText,
      onClick: () => this.usePlaceFeature(placeId)
    });
    const closeBtn = this.createActionButton({
      x: centerX + 96,
      y: centerY + 86,
      width: 170,
      height: 52,
      text: "\uB2EB\uAE30",
      onClick: () => this.closePlacePopup()
    });

    const popupObjects: Phaser.GameObjects.GameObject[] = [overlay, panelOuter, panel, titleText, descText, actionBtn, closeBtn];
    if (placeBackgroundImage) {
      popupObjects.unshift(placeBackgroundImage);
    }

    this.placePopupRoot = this.add.container(0, 0, popupObjects);
    this.placePopupRoot.setDepth(920);
    this.placePopupOpen = true;
  }

  private getPlaceBackgroundTextureKey(placeId: WorldPlaceId): string | null {
    if (placeId === "home") return PLACE_BACKGROUND_KEYS.home;
    if (placeId === "cafe") return PLACE_BACKGROUND_KEYS.cafe;
    if (placeId === "store") return PLACE_BACKGROUND_KEYS.store;
    return null;
  }

  private getDowntownBuildingBackgroundTextureKey(buildingId: DowntownBuildingId): string | null {
    if (buildingId === "gym") return PLACE_BACKGROUND_KEYS.gym;
    if (buildingId === "ramenthings") return PLACE_BACKGROUND_KEYS.ramenthings;
    if (buildingId === "karaoke") return PLACE_BACKGROUND_KEYS.karaoke;
    if (buildingId === "hof") return PLACE_BACKGROUND_KEYS.hof;
    if (buildingId === "lottery") return PLACE_BACKGROUND_KEYS.lottery;
    return null;
  }

  private createPlaceBackgroundImage(textureKey: string | null): Phaser.GameObjects.Image | null {
    if (!textureKey || !this.textures.exists(textureKey)) return null;
    return this.add
      .image(this.px(GAME_CONSTANTS.WIDTH / 2), this.px(GAME_CONSTANTS.HEIGHT / 2), textureKey)
      .setDisplaySize(GAME_CONSTANTS.WIDTH, GAME_CONSTANTS.HEIGHT);
  }

  private closePlacePopup(): void {
    this.placePopupOpen = false;
    this.placePopupRoot?.destroy(true);
    this.placePopupRoot = undefined;
  }

  private usePlaceFeature(placeId: WorldPlaceId): void {
    if (placeId === "cafe") {
      const cost = 1200;
      if (this.hudState.money < cost) {
        this.showSystemToast("\uB3C8\uC774 \uBD80\uC871\uD569\uB2C8\uB2E4");
        return;
      }
      if (!this.spendActionPoint()) {
        return;
      }

      const nextHp = Phaser.Math.Clamp(this.hudState.hp + 8, 0, this.hudState.hpMax);
      const nextStress = Phaser.Math.Clamp(this.hudState.stress - 12, 0, 100);
      this.updateHudState({
        hp: nextHp,
        stress: nextStress,
        money: this.hudState.money - cost
      });
      this.closePlacePopup();
      this.showSystemToast("\uCE74\uD398\uC5D0\uC11C \uD734\uC2DD\uD588\uC2B5\uB2C8\uB2E4");
      return;
    }

    this.closePlacePopup();
    this.openShop(this.getPlaceBackgroundTextureKey("store"));
    this.showSystemToast("\uD3B8\uC758\uC810 \uC0C1\uC810 \uC5F4\uAE30");
  }

  private openHomeActionPopup(): void {
    this.closePlacePopup();

    const centerX = this.px(GAME_CONSTANTS.WIDTH / 2);
    const centerY = this.px(GAME_CONSTANTS.HEIGHT / 2);
    const homeBackgroundImage = this.createPlaceBackgroundImage(this.getPlaceBackgroundTextureKey("home"));
    const overlay = this.add.rectangle(
      centerX,
      centerY,
      GAME_CONSTANTS.WIDTH,
      GAME_CONSTANTS.HEIGHT,
      0x000000,
      homeBackgroundImage ? 0.42 : 0.36
    );
    const panelOuter = this.createPanelOuterBorder(centerX, centerY, 560, 460);
    const panel = this.add.rectangle(centerX, centerY, 560, 460, 0x1a375c, 0.95);
    panel.setStrokeStyle(2, this.uiPanelInnerBorderColor, 1);
    const title = this.add.text(centerX, centerY - 190, "\uC9D1 \uD589\uB3D9", this.getBodyStyle(34, "#e6f3ff", "bold"));
    title.setOrigin(0.5);
    const apText = this.add.text(
      centerX,
      centerY - 146,
      `\uB0A8\uC740 \uD589\uB3D9\uB825: ${this.actionPoint}/${this.maxActionPoint}`,
      this.getBodyStyle(21, "#b6d6fb", "bold")
    );
    apText.setOrigin(0.5);

    const sleepBtn = this.createActionButton({
      x: centerX,
      y: centerY - 54,
      width: 390,
      height: 66,
      text: "\uC7A0\uC790\uAE30 (행동력 1)  -  \uC2A4\uD2B8\uB808\uC2A4 \uAC10\uC18C, \uCCB4\uB825 \uD68C\uBCF5",
      onClick: () => this.useHomeAction("sleep")
    });
    const studyBtn = this.createActionButton({
      x: centerX,
      y: centerY + 32,
      width: 390,
      height: 66,
      text: "\uACF5\uBD80\uD558\uAE30 (행동력 1)  -  FE/BE \uC99D\uAC00, \uC2A4\uD2B8\uB808\uC2A4/\uCCB4\uB825 \uBCC0\uD654",
      onClick: () => this.useHomeAction("study")
    });
    const gameBtn = this.createActionButton({
      x: centerX,
      y: centerY + 118,
      width: 390,
      height: 66,
      text: "\uAC8C\uC784\uD558\uAE30 (행동력 1)  -  FE/BE \uC18C\uD3ED \uAC10\uC18C, \uC2A4\uD2B8\uB808\uC2A4 \uAC10\uC18C",
      onClick: () => this.useHomeAction("game")
    });
    const closeBtn = this.createActionButton({
      x: centerX,
      y: centerY + 196,
      width: 210,
      height: 52,
      text: "\uB2EB\uAE30",
      onClick: () => this.closePlacePopup()
    });

    const popupObjects: Phaser.GameObjects.GameObject[] = [overlay, panelOuter, panel, title, apText, sleepBtn, studyBtn, gameBtn, closeBtn];
    if (homeBackgroundImage) {
      popupObjects.unshift(homeBackgroundImage);
    }

    this.placePopupRoot = this.add.container(0, 0, popupObjects);
    this.placePopupRoot.setDepth(920);
    this.placePopupOpen = true;
  }

  private useHomeAction(action: "sleep" | "study" | "game"): void {
    if (!this.spendActionPoint()) {
      return;
    }

    if (action === "sleep") {
      const nextHp = Phaser.Math.Clamp(this.hudState.hp + 22, 0, this.hudState.hpMax);
      const nextStress = Phaser.Math.Clamp(this.hudState.stress - 20, 0, 100);
      this.updateHudState({ hp: nextHp, stress: nextStress });
      this.showSystemToast("\uC7A0\uC790\uAE30 \uC644\uB8CC");
    } else if (action === "study") {
      const nextHp = Phaser.Math.Clamp(this.hudState.hp - 12, 0, this.hudState.hpMax);
      const nextStress = Phaser.Math.Clamp(this.hudState.stress + 10, 0, 100);
      this.applyStatDelta({ fe: 4, be: 4 });
      this.updateHudState({ hp: nextHp, stress: nextStress });
      this.showSystemToast("\uACF5\uBD80\uD558\uAE30 \uC644\uB8CC");
    } else {
      const nextHp = Phaser.Math.Clamp(this.hudState.hp - 6, 0, this.hudState.hpMax);
      const nextStress = Phaser.Math.Clamp(this.hudState.stress - 12, 0, 100);
      this.applyStatDelta({ fe: -2, be: -2 });
      this.updateHudState({ hp: nextHp, stress: nextStress });
      this.showSystemToast("\uAC8C\uC784\uD558\uAE30 \uC644\uB8CC");
    }

    this.openHomeActionPopup();
  }

  private openDowntownBuildingPopup(buildingId: DowntownBuildingId): void {
    this.closePlacePopup();

    const centerX = this.px(GAME_CONSTANTS.WIDTH / 2);
    const centerY = this.px(GAME_CONSTANTS.HEIGHT / 2);
    const buildingBackgroundImage = this.createPlaceBackgroundImage(this.getDowntownBuildingBackgroundTextureKey(buildingId));
    const overlay = this.add.rectangle(
      centerX,
      centerY,
      GAME_CONSTANTS.WIDTH,
      GAME_CONSTANTS.HEIGHT,
      0x000000,
      buildingBackgroundImage ? 0.42 : 0.36
    );
    const config = this.getDowntownBuildingConfig(buildingId);
    const panelOuter = this.createPanelOuterBorder(centerX, centerY, 540, 296);
    const panel = this.add.rectangle(centerX, centerY, 540, 296, 0x1a375c, 0.95);
    panel.setStrokeStyle(2, this.uiPanelInnerBorderColor, 1);
    const title = this.add.text(centerX, centerY - 90, config.title, this.getBodyStyle(34, "#e6f3ff", "bold"));
    title.setOrigin(0.5);
    const desc = this.add.text(centerX, centerY - 12, config.description, this.getBodyStyle(21, "#b6d6fb"));
    desc.setOrigin(0.5);
    desc.setAlign("center");
    desc.setLineSpacing(8);

    const actionBtn = this.createActionButton({
      x: centerX - 96,
      y: centerY + 92,
      width: 170,
      height: 52,
      text: "\uC774\uC6A9\uD558\uAE30",
      onClick: () => this.useDowntownBuilding(buildingId)
    });
    const closeBtn = this.createActionButton({
      x: centerX + 96,
      y: centerY + 92,
      width: 170,
      height: 52,
      text: "\uB2EB\uAE30",
      onClick: () => this.closePlacePopup()
    });

    const popupObjects: Phaser.GameObjects.GameObject[] = [overlay, panelOuter, panel, title, desc, actionBtn, closeBtn];
    if (buildingBackgroundImage) {
      popupObjects.unshift(buildingBackgroundImage);
    }

    this.placePopupRoot = this.add.container(0, 0, popupObjects);
    this.placePopupRoot.setDepth(920);
    this.placePopupOpen = true;
  }

  private getDowntownBuildingConfig(buildingId: DowntownBuildingId): { title: string; description: string } {
    if (buildingId === "ramenthings") {
      return {
        title: "라멘띵스",
        description: "\uB530\uB73B\uD55C \uB77C\uBA58 \uD55C \uADF8\uB987 1,400G\n\uCCB4\uB825 \uD68C\uBCF5 / \uC2A4\uD2B8\uB808\uC2A4 \uAC10\uC18C"
      };
    }
    if (buildingId === "gym") {
      return {
        title: "\uD5EC\uC2A4\uC7A5",
        description: "\uAC04\uB2E8 \uC6B4\uB3D9 \uD504\uB85C\uADF8\uB7A8 1,000G\n\uCD5C\uB300 \uCCB4\uB825 +10 / \uC2A4\uD2B8\uB808\uC2A4 \uAC10\uC18C"
      };
    }
    if (buildingId === "karaoke") {
      return {
        title: "\uB178\uB798\uBC29",
        description: "\uB9C8\uC74C\uAECF \uB178\uB798\uD558\uAE30 1,300G\n\uC2A4\uD2B8\uB808\uC2A4 \uAC10\uC18C / \uD611\uC5C5 \uC18C\uD3ED \uC99D\uAC00"
      };
    }
    if (buildingId === "hof") {
      return {
        title: "\uD638\uD504",
        description: "\uCE5C\uAD6C\uB4E4\uACFC \uD55C \uC794 1,600G\n\uC2A4\uD2B8\uB808\uC2A4 \uAC10\uC18C / \uCCB4\uB825 \uAC10\uC18C"
      };
    }
    return {
      title: "\uBCF5\uAD8C\uD310\uB9E4\uC810",
      description: "\uBCF5\uAD8C 1\uC7A5 800G\n\uD589\uC6B4\uC5D0 \uB530\uB77C \uB3C8\uC744 \uC783\uAC70\uB098 \uBC8C \uC218 \uC788\uC2B5\uB2C8\uB2E4."
    };
  }

  private useDowntownBuilding(buildingId: DowntownBuildingId): void {
    const spend = (cost: number): boolean => {
      if (this.hudState.money < cost) {
        this.showSystemToast("\uB3C8\uC774 \uBD80\uC871\uD569\uB2C8\uB2E4");
        return false;
      }
      if (!this.spendActionPoint()) {
        return false;
      }
      this.updateHudState({ money: this.hudState.money - cost });
      return true;
    };

    if (buildingId === "ramenthings") {
      if (!spend(1400)) return;
      this.updateHudState({
        hp: Phaser.Math.Clamp(this.hudState.hp + 12, 0, this.hudState.hpMax),
        stress: Phaser.Math.Clamp(this.hudState.stress - 8, 0, 100)
      });
      this.closePlacePopup();
      this.showSystemToast("\uB77C\uBA58\uC744 \uBA39\uACE0 \uD68C\uBCF5\uD588\uC2B5\uB2C8\uB2E4");
      return;
    }

    if (buildingId === "gym") {
      if (!spend(1000)) return;
      const nextHpMax = Math.max(1, Math.round(this.hudState.hpMax + 10));
      this.updateHudState({
        hpMax: nextHpMax,
        hp: Phaser.Math.Clamp(this.hudState.hp, 0, nextHpMax),
        stress: Phaser.Math.Clamp(this.hudState.stress - 7, 0, 100)
      });
      this.applyStatDelta({ teamwork: 2 });
      this.closePlacePopup();
      this.showSystemToast("\uC6B4\uB3D9 \uC644\uB8CC (\uCD5C\uB300 \uCCB4\uB825 +10)");
      return;
    }

    if (buildingId === "karaoke") {
      if (!spend(1300)) return;
      this.updateHudState({
        hp: Phaser.Math.Clamp(this.hudState.hp - 3, 0, this.hudState.hpMax),
        stress: Phaser.Math.Clamp(this.hudState.stress - 14, 0, 100)
      });
      this.applyStatDelta({ teamwork: 4 });
      this.closePlacePopup();
      this.showSystemToast("\uB178\uB798\uBC29 \uC774\uC6A9 \uC644\uB8CC");
      return;
    }

    if (buildingId === "hof") {
      if (!spend(1600)) return;
      this.updateHudState({
        hp: Phaser.Math.Clamp(this.hudState.hp - 10, 0, this.hudState.hpMax),
        stress: Phaser.Math.Clamp(this.hudState.stress - 12, 0, 100)
      });
      this.applyStatDelta({ luck: 2 });
      this.closePlacePopup();
      this.showSystemToast("\uD638\uD504 \uC774\uC6A9 \uC644\uB8CC");
      return;
    }

    if (!spend(800)) return;
    const delta = Phaser.Utils.Array.GetRandom([-1200, -500, 0, 700, 1800, 3200]);
    this.updateHudState({ money: Math.max(0, this.hudState.money + delta) });
    this.applyStatDelta({ luck: 1 });
    this.closePlacePopup();
    this.showSystemToast(delta >= 0 ? `\uBCF5\uAD8C \uB2F9\uCCA8! +${delta}G` : `\uC544\uC26C\uC6CC\uC694 ${delta}G`);
  }

  private toggleMenu(): void {
    this.cancelPendingInventoryPickup();
    this.menuOpen = !this.menuOpen;
    this.menuRoot?.setVisible(this.menuOpen);

    if (!this.menuOpen) {
      this.returnCarriedItemToInventory();
    }

    if (this.menuOpen) {
      this.switchTab(this.activeTab);
    }
  }

  private closeMenu(): void {
    if (!this.menuOpen) return;
    this.toggleMenu();
  }

  private buildEscapeMenu(): void {
    const menuWidth = 900;
    const menuHeight = 530;

    const centerX = this.px(GAME_CONSTANTS.WIDTH / 2);
    const centerY = this.px(GAME_CONSTANTS.HEIGHT / 2);
    const panelLeft = this.px(centerX - menuWidth / 2);
    const panelTop = this.px(centerY - menuHeight / 2);

    const modal = createBaseModal(this, menuWidth, menuHeight);
    this.menuRoot = modal.root;
    this.menuRoot.setDepth(1000);
    this.menuRoot.setVisible(false);
    this.menuRoot.add(this.createPanelCloseButton(centerX, centerY, menuWidth, menuHeight, () => this.closeMenu()));

    const tabWidth = 170;
    const tabHeight = 50;
    const tabGap = 10;
    const totalTabsWidth = tabWidth * TAB_ORDER.length + tabGap * (TAB_ORDER.length - 1);
    const firstTabCenterX = this.px(centerX - totalTabsWidth / 2 + tabWidth / 2);
    const tabCenterY = this.px(panelTop + 24);

    TAB_ORDER.forEach((tab, idx) => {
      const x = this.px(firstTabCenterX + idx * (tabWidth + tabGap));
      this.createTab(tab, x, tabCenterY, tabWidth, tabHeight);
    });

    const contentX = this.px(panelLeft + 30);
    const contentY = this.px(panelTop + 98);
    const contentWidth = this.px(menuWidth - 60);
    const contentHeight = this.px(menuHeight - 130);

    const contentFrame = this.add
      .rectangle(
        this.px(contentX + contentWidth / 2),
        this.px(contentY + contentHeight / 2),
        contentWidth,
        contentHeight,
        0x0f2947,
        1
      )
      .setStrokeStyle(2, this.uiPanelInnerBorderColor, 1);
    const contentOuterFrame = this.createPanelOuterBorder(
      this.px(contentX + contentWidth / 2),
      this.px(contentY + contentHeight / 2),
      contentWidth,
      contentHeight
    );

    this.menuRoot.add([contentOuterFrame, contentFrame]);

    this.menuContentBounds = new Phaser.Geom.Rectangle(contentX, contentY, contentWidth, contentHeight);
    this.pageRoot = this.add.container(0, 0);
    this.menuRoot.add(this.pageRoot);

    const basePages: Record<TabKey, Phaser.GameObjects.Container> = {
      inventory: this.createInventoryPage(this.menuContentBounds),
      stats: this.createStatsPage(this.menuContentBounds),
      settings: this.createSettingsPage(this.menuContentBounds),
      save: this.createSavePage(this.menuContentBounds)
    };

    TAB_ORDER.forEach((tab) => {
      const scrollPage = this.createScrollableTabPage(basePages[tab], this.menuContentBounds!);
      if (tab === "save") {
        this.pinSaveHeaderToTop(scrollPage, basePages[tab]);
      }
      this.tabScrollPages[tab] = scrollPage;
      this.tabPages[tab] = scrollPage.root;
      this.pageRoot?.add(scrollPage.root);
    });

    this.switchTab("inventory");
  }

  private createTab(tab: TabKey, x: number, y: number, width: number, height: number): void {
    const bg = this.add.rectangle(x, y, width, height, 0x254a76, 1);
    bg.setStrokeStyle(2, 0x4f98df, 1);

    const lip = this.add.rectangle(x, this.px(y + height / 2 - 1), width - 6, 4, 0xb6dcff, 1);
    lip.setVisible(false);

    const label = this.add.text(x, y, TAB_LABEL[tab], {
      fontFamily: this.uiFontFamily,
      fontSize: "24px",
      fontStyle: "bold",
      color: "#b8d7fb",
      resolution: 2
    });
    label.setOrigin(0.5);

    bg.setInteractive({ useHandCursor: true }).on("pointerdown", () => this.switchTab(tab));

    this.menuRoot?.add([bg, lip, label]);
    this.tabVisuals[tab] = { bg, label, lip };
  }

  private switchTab(tab: TabKey): void {
    if (this.activeTab === "inventory" && tab !== "inventory") {
      this.returnCarriedItemToInventory();
    }

    if (tab === "save") {
      this.refreshSaveSlotUi();
    }

    this.activeTab = tab;

    TAB_ORDER.forEach((key) => {
      const isActive = key === tab;
      this.tabPages[key].setVisible(isActive);

      const visual = this.tabVisuals[key];
      visual.bg.setFillStyle(isActive ? 0x34679d : 0x254a76, 1);
      visual.bg.setStrokeStyle(2, isActive ? 0x78c6ff : 0x4f98df, 1);
      visual.label.setColor(isActive ? "#eaf6ff" : "#b8d7fb");
      visual.lip.setVisible(isActive);
    });

    this.refreshActiveTabScrollState();
  }

  private createScrollableTabPage(content: Phaser.GameObjects.Container, bounds: Phaser.Geom.Rectangle): ScrollableTabPage {
    const root = this.add.container(0, 0);
    const viewport = new Phaser.Geom.Rectangle(
      this.px(bounds.x + 18),
      this.px(bounds.y + 16),
      this.px(bounds.width - 62),
      this.px(bounds.height - 32)
    );

    const maskGraphics = this.make.graphics({ x: 0, y: 0 }, false);
    maskGraphics.fillStyle(0xffffff, 1);
    maskGraphics.fillRect(viewport.x, viewport.y, viewport.width, viewport.height);
    content.setMask(maskGraphics.createGeometryMask());

    const trackX = this.px(bounds.x + bounds.width - 22);
    const trackY = this.px(viewport.y + viewport.height / 2);
    const track = this.add.rectangle(trackX, trackY, 8, viewport.height, 0x335982, 1);
    track.setStrokeStyle(1, 0x4f98df, 1);
    track.setInteractive({ useHandCursor: true });

    const thumb = this.add.rectangle(trackX, this.px(viewport.y + 24), 14, 48, 0x4b84be, 1);
    thumb.setStrokeStyle(2, 0x79c7ff, 1);
    thumb.setInteractive({ draggable: true, useHandCursor: true });
    this.input.setDraggable(thumb);

    const scrollMaskGraphics = this.make.graphics({ x: 0, y: 0 }, false);
    scrollMaskGraphics.fillStyle(0xffffff, 1);
    scrollMaskGraphics.fillRect(trackX - 14, viewport.y, 28, viewport.height);
    const scrollMask = scrollMaskGraphics.createGeometryMask();
    track.setMask(scrollMask);
    thumb.setMask(scrollMask);

    const page: ScrollableTabPage = {
      root,
      content,
      maskGraphics,
      scrollMaskGraphics,
      viewport,
      track,
      trackX,
      trackY,
      thumb,
      thumbHeight: 48,
      minOffset: 0,
      maxOffset: 0,
      offset: 0
    };

    track.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
      this.setScrollablePageOffsetFromRatio(page, this.getScrollableRatioFromPointerY(page, pointer.worldY));
    });

    thumb.on("drag", (_pointer: Phaser.Input.Pointer, _dragX: number, dragY: number) => {
      this.setScrollablePageOffsetFromRatio(page, this.getScrollableRatioFromPointerY(page, dragY));
    });

    root.add([content, track, thumb]);
    this.refreshScrollableTabPage(page);
    return page;
  }

  private refreshScrollableTabPage(page: ScrollableTabPage): void {
    const contentBounds = page.content.getBounds();
    const normalizedTop = contentBounds.top - page.offset;
    const normalizedBottom = contentBounds.bottom - page.offset;
    const topOverflow = Math.max(0, page.viewport.top - normalizedTop);
    const bottomOverflow = Math.max(0, normalizedBottom - page.viewport.bottom);
    const scrollRange = topOverflow + bottomOverflow;
    const canScroll = scrollRange > 1;

    page.maxOffset = topOverflow;
    page.minOffset = -bottomOverflow;
    const virtualContentHeight = page.viewport.height + scrollRange;
    page.thumbHeight = Phaser.Math.Clamp(
      Math.round((page.viewport.height / virtualContentHeight) * page.viewport.height),
      44,
      page.viewport.height
    );
    page.thumb.height = page.thumbHeight;

    this.setScrollablePageOffset(page, page.offset === 0 ? page.maxOffset : page.offset);

    page.track.setVisible(canScroll);
    page.thumb.setVisible(canScroll);
    if (page.track.input) page.track.input.enabled = canScroll;
    if (page.thumb.input) page.thumb.input.enabled = canScroll;
  }

  private setScrollablePageOffsetFromRatio(page: ScrollableTabPage, ratio: number): void {
    const next = Phaser.Math.Linear(page.maxOffset, page.minOffset, Phaser.Math.Clamp(ratio, 0, 1));
    this.setScrollablePageOffset(page, next);
  }

  private setScrollablePageOffset(page: ScrollableTabPage, nextOffset: number): void {
    const clamped = Phaser.Math.Clamp(nextOffset, page.minOffset, page.maxOffset);
    page.offset = clamped;
    page.content.y = this.px(clamped);
    page.track.x = page.trackX;
    page.track.y = page.trackY;

    const ratio = page.minOffset === page.maxOffset ? 0 : (page.offset - page.maxOffset) / (page.minOffset - page.maxOffset);
    const top = page.viewport.y + page.thumbHeight / 2;
    const bottom = page.viewport.bottom - page.thumbHeight / 2;
    const nextThumbY = this.px(Phaser.Math.Linear(top, bottom, ratio));
    page.thumb.y = Phaser.Math.Clamp(nextThumbY, this.px(top), this.px(bottom));
  }

  private pinSaveHeaderToTop(page: ScrollableTabPage, content: Phaser.GameObjects.Container): void {
    this.savePinnedObjects.forEach((obj) => {
      if (content.list.includes(obj)) {
        content.remove(obj);
      }
      page.root.add(obj);
    });
  }

  private getScrollableRatioFromPointerY(page: ScrollableTabPage, pointerY: number): number {
    const top = page.viewport.y + page.thumbHeight / 2;
    const bottom = page.viewport.bottom - page.thumbHeight / 2;
    if (bottom <= top) return 0;
    return (Phaser.Math.Clamp(pointerY, top, bottom) - top) / (bottom - top);
  }

  private refreshActiveTabScrollState(): void {
    const page = this.tabScrollPages[this.activeTab];
    if (!page) return;
    this.refreshScrollableTabPage(page);
    this.setScrollablePageOffset(page, page.maxOffset);
  }

  private handleMenuWheel(
    pointer: Phaser.Input.Pointer,
    _over: Phaser.GameObjects.GameObject[],
    _deltaX: number,
    deltaY: number
  ): void {
    if (!this.menuOpen) return;

    const page = this.tabScrollPages[this.activeTab];
    if (!page) return;

    if (page.minOffset === page.maxOffset) return;

    this.setScrollablePageOffset(page, page.offset - deltaY * 0.45);
  }

  private createSettingsPage(bounds: Phaser.Geom.Rectangle): Phaser.GameObjects.Container {
    const container = this.add.container(0, 0);

    const controlGuideTitle = this.add.text(
      this.px(bounds.x + 24),
      this.px(bounds.y + 18),
      "\uC870\uC791 \uC548\uB0B4",
      this.getBodyStyle(28, "#4b351f", "bold")
    );

    const body = this.add.text(
      this.px(bounds.x + 24),
      this.px(bounds.y + 58),
      "ESC: \uBA54\uB274 \uC5F4\uAE30/\uB2EB\uAE30\nWASD/\uBC29\uD5A5\uD0A4: \uC774\uB3D9\nE: NPC \uB300\uD654\nQ: \uC804\uCCB4 \uC9C0\uB3C4",
      this.getBodyStyle(23)
    );
    body.setLineSpacing(10);

    const sectionTitle = this.add.text(
      this.px(bounds.x + 24),
      this.px(bounds.y + 206),
      "\uC0AC\uC6B4\uB4DC \uBCFC\uB968",
      this.getBodyStyle(28, "#4b351f", "bold")
    );

    const volume = this.audioManager.getVolumes();
    const volumeState: Record<"bgm" | "sfx" | "ambience", number> = {
      bgm: Math.round(volume.bgm * 100),
      sfx: Math.round(volume.sfx * 100),
      ambience: Math.round(volume.ambience * 100)
    };

    const setVolume = (key: "bgm" | "sfx" | "ambience", value: number): void => {
      const next = Phaser.Math.Clamp(value, 0, 100);
      volumeState[key] = next;
      const normalized = next / 100;

      if (key === "bgm") this.audioManager.setBgmVolume(normalized);
      if (key === "sfx") this.audioManager.setSfxVolume(normalized);
      if (key === "ambience") this.audioManager.setAmbienceVolume(normalized);
    };

    const rows: Phaser.GameObjects.GameObject[] = [];
    const rowDefs: Array<{ key: "bgm" | "sfx" | "ambience"; label: string }> = [
      { key: "bgm", label: "BGM" },
      { key: "sfx", label: "SFX" },
      { key: "ambience", label: "\uD658\uACBD\uC74C" }
    ];

    rowDefs.forEach((row, idx) => {
      const y = this.px(bounds.y + 266 + idx * 62);
      const rowLabel = this.add.text(this.px(bounds.x + 28), y - 12, row.label, this.getBodyStyle(21, "#4a371f", "bold"));
      const valueText = this.add.text(this.px(bounds.x + 538), y - 12, `${volumeState[row.key]}%`, this.getBodyStyle(20, "#4a371f", "bold"));

      const trackLeft = this.px(bounds.x + 142);
      const trackWidth = 372;
      const trackBg = this.add.rectangle(trackLeft, y + 1, trackWidth, 14, 0xd8c6a3, 1);
      trackBg.setOrigin(0, 0.5);
      trackBg.setStrokeStyle(1, 0x8f6c3c, 1);

      const fill = this.add.rectangle(trackLeft + 2, y + 1, 0, 10, 0x9fbe7a, 1);
      fill.setOrigin(0, 0.5);

      const knob = this.add.rectangle(trackLeft, y + 1, 14, 20, 0xc8ae82, 1);
      knob.setStrokeStyle(2, 0x725127, 1);
      knob.setInteractive({ draggable: true, useHandCursor: true });
      this.input.setDraggable(knob);

      const applyFromValue = (next: number): void => {
        setVolume(row.key, next);
        const ratio = volumeState[row.key] / 100;
        fill.width = this.px((trackWidth - 4) * ratio);
        knob.x = this.px(trackLeft + ratio * trackWidth);
        valueText.setText(`${volumeState[row.key]}%`);
      };

      const applyFromPointerX = (pointerX: number): void => {
        const clampedX = Phaser.Math.Clamp(pointerX, trackLeft, trackLeft + trackWidth);
        const ratio = (clampedX - trackLeft) / trackWidth;
        applyFromValue(Math.round(ratio * 100));
      };

      trackBg.setInteractive({ useHandCursor: true }).on("pointerdown", (pointer: Phaser.Input.Pointer) => {
        applyFromPointerX(pointer.worldX);
      });

      knob.on("drag", (_pointer: Phaser.Input.Pointer, dragX: number) => {
        applyFromPointerX(dragX);
      });

      applyFromValue(volumeState[row.key]);
      rows.push(rowLabel, trackBg, fill, knob, valueText);
    });

    container.add([controlGuideTitle, body, sectionTitle, ...rows]);
    return container;
  }

  private createInventoryPage(bounds: Phaser.Geom.Rectangle): Phaser.GameObjects.Container {
    const container = this.add.container(0, 0);
    const panelY = this.px(bounds.y + 28);
    const panelH = 300;

    const equipPanelX = this.px(bounds.x + 24);
    const equipPanelW = 300;
    const equipPanelCenterX = this.px(equipPanelX + equipPanelW / 2);

    const inventoryPanelX = this.px(equipPanelX + equipPanelW + 16);
    const inventoryPanelW = this.px(bounds.width - (inventoryPanelX - bounds.x) - 24);
    const inventoryPanelCenterX = this.px(inventoryPanelX + inventoryPanelW / 2);

    const equipPanelOuter = this.createPanelOuterBorder(equipPanelCenterX, panelY + panelH / 2, equipPanelW, panelH);
    const equipPanel = this.add.rectangle(equipPanelCenterX, panelY + panelH / 2, equipPanelW, panelH, 0x17355a, 0.86);
    equipPanel.setStrokeStyle(2, this.uiPanelInnerBorderColor, 1);
    const inventoryPanelOuter = this.createPanelOuterBorder(inventoryPanelCenterX, panelY + panelH / 2, inventoryPanelW, panelH);
    const inventoryPanel = this.add.rectangle(inventoryPanelCenterX, panelY + panelH / 2, inventoryPanelW, panelH, 0x17355a, 0.86);
    inventoryPanel.setStrokeStyle(2, this.uiPanelInnerBorderColor, 1);

    const equipLabel = this.add.text(
      equipPanelCenterX,
      this.px(panelY + 12),
      "\uC7A5\uBE44 \uCE78",
      this.getBodyStyle(20, "#b9d8fb")
    );
    equipLabel.setOrigin(0.5, 0);
    const inventoryLabel = this.add.text(
      inventoryPanelCenterX,
      this.px(panelY + 12),
      "\uC778\uBCA4\uD1A0\uB9AC",
      this.getBodyStyle(20, "#b9d8fb")
    );
    inventoryLabel.setOrigin(0.5, 0);

    const createSlotView = (x: number, y: number, size: number): SlotView => {
      const bg = this.add.rectangle(x, y, size, size, 0x2e527d, 1);
      bg.setStrokeStyle(2, 0x5aa8ee, 1);

      const icon = this.add.rectangle(x, y, this.px(size - 14), this.px(size - 14), 0xffffff, 1);
      icon.setStrokeStyle(1, 0x4f98df, 1);
      icon.setVisible(false);

      const iconText = this.add.text(x, y + 1, "", this.getBodyStyle(Math.max(12, Math.floor(size * 0.28)), "#e8f4ff", "bold"));
      iconText.setOrigin(0.5);
      iconText.setVisible(false);

      const stackText = this.add.text(x + size / 2 - 4, y + size / 2 - 3, "", this.getBodyStyle(13, "#e8f4ff", "bold"));
      stackText.setOrigin(1, 1);
      stackText.setVisible(false);

      return { bg, icon, iconText, stackText };
    };

    const equipSlotSize = 102;
    const equipSlotY = this.px(panelY + 156);
    const equipSlotGap = 156;
    const keyboardSlotX = this.px(equipPanelCenterX - equipSlotGap / 2);
    const mouseSlotX = this.px(equipPanelCenterX + equipSlotGap / 2);

    const keyboardView = createSlotView(keyboardSlotX, equipSlotY, equipSlotSize);
    const mouseView = createSlotView(mouseSlotX, equipSlotY, equipSlotSize);

    const keyboardLabel = this.add.text(keyboardSlotX, this.px(equipSlotY + equipSlotSize / 2 + 16), "\uD0A4\uBCF4\uB4DC", this.getBodyStyle(19, "#b9d8fb"));
    keyboardLabel.setOrigin(0.5, 0.5);
    const mouseLabel = this.add.text(mouseSlotX, this.px(equipSlotY + equipSlotSize / 2 + 16), "\uB9C8\uC6B0\uC2A4", this.getBodyStyle(19, "#b9d8fb"));
    mouseLabel.setOrigin(0.5, 0.5);

    const bindEquipSlot = (slot: EquipmentSlotKey, view: SlotView): void => {
      view.bg.setInteractive({ useHandCursor: true });
      view.bg.on("pointerover", () => {
        this.applySlotHoverStyle(view);
        this.showItemTooltip(this.equippedSlots[slot], this.input.activePointer.worldX, this.input.activePointer.worldY);
      });
      view.bg.on("pointerout", () => {
        this.applySlotIdleStyle(view);
        this.hideItemTooltip();
      });
      view.bg.on("pointerdown", () => {
        if (this.isDoubleClick(`equip-${slot}`)) {
          this.unequipItem(slot);
          return;
        }
        this.applySlotSelectedStyle(view);
      });
    };

    bindEquipSlot("keyboard", keyboardView);
    bindEquipSlot("mouse", mouseView);

    const inventorySlotSize = 54;
    const inventorySlotGap = 10;
    const gridTotalW = inventorySlotSize * 4 + inventorySlotGap * 3;
    const gridTotalH = inventorySlotSize * 4 + inventorySlotGap * 3;
    const gridStartX = this.px(inventoryPanelCenterX - gridTotalW / 2 + inventorySlotSize / 2);
    const gridStartY = this.px(panelY + 48 + (panelH - 72 - gridTotalH) / 2 + inventorySlotSize / 2);
    const inventorySlots: Phaser.GameObjects.Container[] = [];
    this.inventorySlotViews = [];

    for (let row = 0; row < 4; row += 1) {
      for (let col = 0; col < 4; col += 1) {
        const x = this.px(gridStartX + col * (inventorySlotSize + inventorySlotGap));
        const y = this.px(gridStartY + row * (inventorySlotSize + inventorySlotGap));
        const slotIndex = row * 4 + col;
        const view = createSlotView(x, y, inventorySlotSize);
        this.inventorySlotViews.push(view);

        view.bg.setInteractive({ useHandCursor: true });
        view.bg.on("pointerover", () => {
          this.applySlotHoverStyle(view);
          this.showItemTooltip(this.inventorySlots[slotIndex], this.input.activePointer.worldX, this.input.activePointer.worldY);
        });
        view.bg.on("pointerout", () => {
          this.applySlotIdleStyle(view);
          this.hideItemTooltip();
        });
        view.bg.on("pointerdown", () => {
          this.onInventorySlotClick(slotIndex, view);
        });

        inventorySlots.push(this.add.container(0, 0, [view.bg, view.icon, view.iconText, view.stackText]));
      }
    }

    this.equipmentSlotViews = {
      keyboard: keyboardView,
      mouse: mouseView
    };

    container.add([
      equipPanelOuter,
      equipPanel,
      inventoryPanelOuter,
      inventoryPanel,
      equipLabel,
      inventoryLabel,
      keyboardView.bg,
      keyboardView.icon,
      keyboardView.iconText,
      keyboardView.stackText,
      mouseView.bg,
      mouseView.icon,
      mouseView.iconText,
      mouseView.stackText,
      keyboardLabel,
      mouseLabel,
      ...inventorySlots
    ]);
    this.refreshInventoryUi();
    return container;
  }

  private createStatsPage(bounds: Phaser.Geom.Rectangle): Phaser.GameObjects.Container {
    const container = this.add.container(0, 0);

    const rowStartY = this.px(bounds.y + 38);
    const rowGap = 52;
    const barCenterX = this.px(bounds.x + 390);
    const barW = 360;

    STAT_ROW_DEFS.forEach((stat, i) => {
      const y = this.px(rowStartY + i * rowGap);

      const label = this.add.text(this.px(bounds.x + 24), y - 14, stat.label, this.getBodyStyle(22));
      const value = this.add.text(this.px(bounds.x + 600), y - 14, `${this.statsState[stat.key]}`, this.getBodyStyle(22));

      const barBg = this.add.rectangle(barCenterX, y + 2, barW, 16, 0x2c507a, 1);
      barBg.setStrokeStyle(1, 0x4f98df, 1);

      const barFillWidth = this.px((barW - 4) * Phaser.Math.Clamp(this.statsState[stat.key] / 100, 0, 1));
      const barFill = this.add.rectangle(this.px(barCenterX - barW / 2 + 2), y + 2, barFillWidth, 12, 0x66d1c2, 1);
      barFill.setOrigin(0, 0.5);

      container.add([label, value, barBg, barFill]);
      this.statViews[stat.key] = {
        valueText: value,
        barFill,
        maxFillWidth: barW - 4
      };
    });

    this.refreshStatsUi();
    return container;
  }

  private createSavePage(bounds: Phaser.Geom.Rectangle): Phaser.GameObjects.Container {
    const container = this.add.container(0, 0);
    const centerX = this.px(bounds.x + bounds.width / 2);
    this.savePinnedObjects = [];

    const title = this.add.text(centerX, this.px(bounds.y + 34), "\uC138\uC774\uBE0C / \uBD88\uB7EC\uC624\uAE30", this.getBodyStyle(28, "#d7ecff", "bold"));
    title.setOrigin(0.5, 0.5);
    const subtitle = this.add.text(
      centerX,
      this.px(bounds.y + 64),
      "\uB9E8 \uC704 auto\uB294 \uD558\uB8E8\uAC00 \uC9C0\uB098\uBA74 \uC790\uB3D9 \uC800\uC7A5 \uB429\uB2C8\uB2E4.",
      this.getBodyStyle(16, "#95bde7")
    );
    subtitle.setOrigin(0.5, 0.5);

    const actionY = this.px(bounds.y + 106);
    const slotStartY = this.px(bounds.y + 172);
    const slotGap = 58;
    const slotWidth = this.px(bounds.width - 120);
    const slotHeight = 48;
    const slotIds = this.saveManager.getSlotIds();

    this.saveSlotViews = [];
    this.saveSlots = this.saveManager.loadSlots();

    slotIds.forEach((slotId, index) => {
      const y = this.px(slotStartY + index * slotGap);
      const bg = this.add.rectangle(centerX, y, slotWidth, slotHeight, 0x1f3f64, 1);
      bg.setStrokeStyle(2, 0x4f98df, 1);

      const titleText = this.add.text(this.px(centerX - slotWidth / 2 + 18), this.px(y - 10), "", this.getBodyStyle(18, "#e8f4ff", "bold"));
      titleText.setOrigin(0, 0);
      const metaText = this.add.text(this.px(centerX - slotWidth / 2 + 18), this.px(y + 8), "", this.getBodyStyle(14, "#9ec7f1"));
      metaText.setOrigin(0, 0);

      bg.setInteractive({ useHandCursor: true });
      bg.on("pointerdown", () => {
        this.selectedSaveSlotId = slotId;
        this.refreshSaveSlotUi();
      });

      this.saveSlotViews.push({
        slotId,
        bg,
        title: titleText,
        meta: metaText
      });

      container.add([bg, titleText, metaText]);
    });

    const saveBtn = this.createActionButton({
      x: this.px(centerX - 130),
      y: actionY,
      width: 200,
      height: 48,
      text: "\uC800\uC7A5\uD558\uAE30",
      onClick: () => this.saveToSelectedSlot()
    });

    const loadBtn = this.createActionButton({
      x: this.px(centerX + 130),
      y: actionY,
      width: 200,
      height: 48,
      text: "\uBD88\uB7EC\uC624\uAE30",
      onClick: () => this.loadFromSelectedSlot()
    });

    container.add([title, subtitle, saveBtn, loadBtn]);
    this.savePinnedObjects = [title, subtitle, saveBtn, loadBtn];
    this.refreshSaveSlotUi();
    return container;
  }

  private saveToSelectedSlot(): void {
    if (this.selectedSaveSlotId === "auto") {
      this.showSystemToast("auto \uC2AC\uB86F\uC740 \uC790\uB3D9 \uC800\uC7A5 \uC804\uC6A9\uC785\uB2C8\uB2E4");
      return;
    }
    this.saveGameToSlot(this.selectedSaveSlotId, false);
  }

  private loadFromSelectedSlot(): void {
    const slotData = this.saveManager.loadSlot(this.selectedSaveSlotId);
    if (!slotData) {
      this.showSystemToast("\uBE48\uCE78\uC785\uB2C8\uB2E4");
      return;
    }

    const applied = this.applyGameSavePayload(slotData.payload);
    if (!applied) {
      this.showSystemToast("\uC800\uC7A5 \uB370\uC774\uD130 \uD615\uC2DD\uC774 \uC798\uBABB\uB418\uC5C8\uC2B5\uB2C8\uB2E4");
      return;
    }

    this.refreshSaveSlotUi();
    if (this.menuOpen) {
      this.toggleMenu();
    }
    this.showSystemToast(`${this.getSaveSlotLabel(this.selectedSaveSlotId)} \uBD88\uB7EC\uC624\uAE30 \uC644\uB8CC`);
  }

  private saveGameToSlot(slotId: string, isAuto: boolean): void {
    const payload = this.captureGameSavePayload();
    this.saveManager.saveSlot(slotId, payload as unknown as Record<string, unknown>);
    this.refreshSaveSlotUi();
    if (!isAuto) {
      this.showSystemToast(`${this.getSaveSlotLabel(slotId)} \uC800\uC7A5 \uC644\uB8CC`);
    }
  }

  private refreshSaveSlotUi(): void {
    this.saveSlots = this.saveManager.loadSlots();
    if (this.saveSlotViews.length === 0) return;

    const validSlotIds = this.saveManager.getSlotIds();
    if (!validSlotIds.includes(this.selectedSaveSlotId)) {
      this.selectedSaveSlotId = validSlotIds[1] ?? "auto";
    }

    this.saveSlotViews.forEach((view) => {
      const selected = view.slotId === this.selectedSaveSlotId;
      const slotData = this.saveSlots[view.slotId];
      view.title.setText(this.getSaveSlotLabel(view.slotId));
      view.meta.setText(this.getSaveSlotMetaText(slotData));
      view.bg.setFillStyle(selected ? 0x34679d : 0x1f3f64, 1);
      view.bg.setStrokeStyle(2, selected ? 0x7dc9ff : 0x4f98df, 1);
    });
  }

  private getSaveSlotLabel(slotId: string): string {
    if (slotId === "auto") return "auto";
    const index = Number(slotId.replace("slot-", ""));
    return Number.isFinite(index) ? `\uC800\uC7A5 \uC2AC\uB86F ${index}` : slotId;
  }

  private getSaveSlotMetaText(slotData: SaveSlotData | null): string {
    if (!slotData) return "\uBE48\uCE78";

    const payload = slotData.payload as Partial<MainSavePayload>;
    const hud = payload.hudState as Partial<HudState> | undefined;
    const weekText = typeof hud?.week === "number" ? `${hud.week}\uC8FC\uCC28` : "";
    const dayText = typeof hud?.dayLabel === "string" ? hud.dayLabel : "";
    const timeText = typeof hud?.timeLabel === "string" ? hud.timeLabel : "";
    const locationText = typeof hud?.locationLabel === "string" ? hud.locationLabel : "";
    const summary = [weekText, dayText, timeText].filter((entry) => entry.length > 0).join(" ");
    const savedAt = this.formatSaveTime(slotData.savedAt);

    if (summary && locationText) {
      return `${summary} | ${locationText} | ${savedAt}`;
    }
    if (summary) {
      return `${summary} | ${savedAt}`;
    }
    return savedAt;
  }

  private formatSaveTime(iso: string): string {
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return "\uC800\uC7A5 \uB370\uC774\uD130";
    return date.toLocaleString("ko-KR", {
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit"
    });
  }

  private captureGameSavePayload(): MainSavePayload {
    return {
      currentArea: this.currentArea,
      lastSelectedWorldPlace: this.lastSelectedWorldPlace,
      playerPosition: { x: this.player.x, y: this.player.y },
      hudState: { ...this.hudState },
      statsState: { ...this.statsState },
      actionPoint: this.actionPoint,
      timeCycleIndex: this.timeCycleIndex,
      dayCycleIndex: this.dayCycleIndex,
      inventorySlots: this.inventorySlots.map((slot) =>
        slot
          ? {
              templateId: slot.template.templateId,
              quantity: slot.quantity
            }
          : null
      ),
      equippedSlots: {
        keyboard: this.equippedSlots.keyboard?.templateId ?? null,
        mouse: this.equippedSlots.mouse?.templateId ?? null
      }
    };
  }

  private applyGameSavePayload(rawPayload: Record<string, unknown>): boolean {
    const payload = rawPayload as Partial<MainSavePayload>;
    const area = this.parseAreaId(payload.currentArea);
    const worldPlace = this.parseWorldPlaceId(payload.lastSelectedWorldPlace);
    if (!area || !worldPlace) {
      return false;
    }

    if (typeof payload.actionPoint === "number") {
      this.actionPoint = Phaser.Math.Clamp(Math.round(payload.actionPoint), 0, this.maxActionPoint);
    }

    if (typeof payload.timeCycleIndex === "number") {
      this.timeCycleIndex = Phaser.Math.Wrap(Math.round(payload.timeCycleIndex), 0, TIME_CYCLE.length);
    }
    if (typeof payload.dayCycleIndex === "number") {
      this.dayCycleIndex = Phaser.Math.Wrap(Math.round(payload.dayCycleIndex), 0, DAY_CYCLE.length);
    }

    this.restoreStatsFromSave(payload.statsState);
    this.restoreInventoryFromSave(payload);
    this.refreshStatsUi();
    this.refreshInventoryUi();

    this.enterArea(area, worldPlace);

    const position = payload.playerPosition;
    const playerBody = this.player.body;
    if (position && typeof position.x === "number" && typeof position.y === "number" && playerBody?.enable) {
      this.player.setPosition(
        Phaser.Math.Clamp(position.x, 0, GAME_CONSTANTS.WIDTH),
        Phaser.Math.Clamp(position.y, 0, GAME_CONSTANTS.HEIGHT)
      );
    }

    if (payload.hudState && typeof payload.hudState === "object") {
      this.updateHudState(payload.hudState as Partial<HudState>);
    }

    return true;
  }

  private restoreStatsFromSave(stats: unknown): void {
    if (!stats || typeof stats !== "object") return;
    const saved = stats as Partial<Record<StatKey, number>>;

    // Backward compatibility: old saves used "coding" instead of FE/BE.
    const legacyCoding = (stats as Partial<Record<"coding", number>>).coding;
    if (typeof legacyCoding === "number") {
      const next = Phaser.Math.Clamp(Math.round(legacyCoding), 0, 100);
      if (typeof saved.fe !== "number") this.statsState.fe = next;
      if (typeof saved.be !== "number") this.statsState.be = next;
    }

    (Object.keys(this.statsState) as StatKey[]).forEach((key) => {
      const next = saved[key];
      if (typeof next !== "number") return;
      this.statsState[key] = Phaser.Math.Clamp(Math.round(next), 0, 100);
    });
  }

  private restoreInventoryFromSave(payload: Partial<MainSavePayload>): void {
    const templateMap = new Map<string, InventoryItemTemplate>();
    SHOP_ITEM_TEMPLATES.forEach((template) => {
      templateMap.set(template.templateId, template);
    });

    for (let i = 0; i < this.inventorySlots.length; i += 1) {
      this.inventorySlots[i] = null;
    }

    const savedInventory = Array.isArray(payload.inventorySlots) ? payload.inventorySlots : [];
    for (let i = 0; i < this.inventorySlots.length; i += 1) {
      const row = savedInventory[i];
      if (!row || typeof row !== "object") continue;
      const item = row as Partial<SerializedInventoryStack>;
      if (typeof item.templateId !== "string") continue;
      const template = templateMap.get(item.templateId);
      if (!template) continue;
      const quantity = Math.max(1, Math.round(item.quantity ?? 1));
      this.inventorySlots[i] = { template, quantity };
    }

    this.equippedSlots.keyboard = null;
    this.equippedSlots.mouse = null;

    const savedEquipped = payload.equippedSlots;
    if (!savedEquipped || typeof savedEquipped !== "object") return;

    const keyboardId = (savedEquipped as Partial<Record<EquipmentSlotKey, string | null>>).keyboard;
    const mouseId = (savedEquipped as Partial<Record<EquipmentSlotKey, string | null>>).mouse;
    const keyboardTemplate = typeof keyboardId === "string" ? templateMap.get(keyboardId) ?? null : null;
    const mouseTemplate = typeof mouseId === "string" ? templateMap.get(mouseId) ?? null : null;
    this.equippedSlots.keyboard = keyboardTemplate;
    this.equippedSlots.mouse = mouseTemplate;
  }

  private parseAreaId(value: unknown): AreaId | null {
    if (value === "world" || value === "downtown" || value === "campus") return value;
    return null;
  }

  private parseWorldPlaceId(value: unknown): WorldPlaceId | null {
    if (value === "home" || value === "downtown" || value === "campus" || value === "cafe" || value === "store") return value;
    return null;
  }

  private createActionButton(options: {
    x: number;
    y: number;
    width: number;
    height: number;
    text: string;
    onClick: () => void;
  }): Phaser.GameObjects.Container {
    return createPanelActionButton(this, {
      ...options,
      textStyle: this.getBodyStyle(22, "#e8f4ff", "bold")
    });
  }

  private createPanelCloseButton(
    centerX: number,
    centerY: number,
    panelWidth: number,
    panelHeight: number,
    onClick: () => void
  ): Phaser.GameObjects.Container {
    return createPanelCloseButton(this, centerX, centerY, panelWidth, panelHeight, onClick);
  }

  private createPanelOuterBorder(
    centerX: number,
    centerY: number,
    panelWidth: number,
    panelHeight: number
  ): Phaser.GameObjects.Rectangle {
    return createPanelOuterBorder(this, centerX, centerY, panelWidth, panelHeight);
  }

  private buildDialogueUi(): void {
    const panelWidth = this.px(GAME_CONSTANTS.WIDTH - 84);
    const panelHeight = 220;
    const centerX = this.px(GAME_CONSTANTS.WIDTH / 2);
    const panelCenterY = this.px(GAME_CONSTANTS.HEIGHT - 132);
    const panelLeft = this.px(centerX - panelWidth / 2);
    const panelTop = this.px(panelCenterY - panelHeight / 2);

    const panelOuter = this.createPanelOuterBorder(centerX, panelCenterY, panelWidth, panelHeight);
    const panel = this.add.rectangle(centerX, panelCenterY, panelWidth, panelHeight, 0x132e4f, 0.94);
    panel.setStrokeStyle(2, this.uiPanelInnerBorderColor, 1);

    const speaker = this.add.text(panelLeft + 22, panelTop + 16, "", this.getBodyStyle(21, "#e8f4ff", "bold"));
    speaker.setOrigin(0, 0);

    const body = this.add.text(panelLeft + 22, panelTop + 52, "", this.getBodyStyle(19, "#cde3ff"));
    body.setOrigin(0, 0);
    body.setWordWrapWidth(this.px(panelWidth - 44), true);
    body.setLineSpacing(8);

    const actionButtonBg = this.add.rectangle(panelLeft + panelWidth - 90, panelTop + panelHeight - 38, 132, 34, 0x2c5888, 1);
    actionButtonBg.setStrokeStyle(2, 0x78c3ff, 1);
    actionButtonBg.setInteractive({ useHandCursor: true });
    actionButtonBg.on("pointerover", () => actionButtonBg.setFillStyle(0x34669c, 1));
    actionButtonBg.on("pointerout", () => actionButtonBg.setFillStyle(0x2c5888, 1));
    actionButtonBg.on("pointerdown", () => {
      const node = this.getCurrentDialogueNode();
      if (!node) return;
      this.resolveDialogueAdvance(node);
    });

    const actionButtonText = this.add.text(
      panelLeft + panelWidth - 90,
      panelTop + panelHeight - 39,
      "E \uB2E4\uC74C",
      this.getBodyStyle(16, "#e6f3ff", "bold")
    );
    actionButtonText.setOrigin(0.5);

    const hint = this.add.text(panelLeft + panelWidth - 20, panelTop + panelHeight - 68, "", this.getBodyStyle(14, "#99c4f3"));
    hint.setOrigin(1, 1);

    this.dialogueRoot = this.add.container(0, 0, [panelOuter, panel, speaker, body, actionButtonBg, actionButtonText, hint]);
    this.dialogueRoot.setDepth(1150);
    this.dialogueRoot.setVisible(false);
    this.dialogueSpeakerText = speaker;
    this.dialogueBodyText = body;
    this.dialogueHintText = hint;
    this.dialogueActionButtonBg = actionButtonBg;
    this.dialogueActionButtonText = actionButtonText;
  }

  private handleNpcInteraction(dialogueId: NpcDialogueId): void {
    const npcConfig = this.getAreaNpcConfig(this.currentArea);
    const flashColor = npcConfig?.flashColor ?? 0xb07a3c;

    this.interactionTarget.setFillStyle(flashColor, 1);
    this.time.delayedCall(160, () => {
      this.interactionTarget.setFillStyle(0x6e4f2b, 1);
    });

    this.startNpcDialogue(dialogueId);
  }

  private startNpcDialogue(dialogueId: NpcDialogueId): void {
    const script = NPC_DIALOGUE_SCRIPTS[dialogueId];
    if (!script) {
      this.showSystemToast("\uB300\uD654 \uC2A4\uD06C\uB9BD\uD2B8\uAC00 \uC5C6\uC2B5\uB2C8\uB2E4");
      return;
    }

    const startNode = script.nodes[script.startNodeId];
    if (!startNode) {
      this.showSystemToast("\uB300\uD654 \uC2DC\uC791 \uB178\uB4DC\uAC00 \uC5C6\uC2B5\uB2C8\uB2E4");
      return;
    }

    this.activeDialogueId = dialogueId;
    this.activeDialogueNodeId = startNode.id;
    this.dialogueChoiceIndex = 0;
    this.dialogueOpen = true;
    this.dialogueRoot?.setVisible(true);
    this.renderDialogueNode();
  }

  private handleDialogueInput(): void {
    if (!this.dialogueOpen) return;
    const node = this.getCurrentDialogueNode();
    if (!node) return;

    const hasChoices = Boolean(node.choices?.length);

    if (hasChoices) {
      const choices = node.choices ?? [];
      if (choices.length > 1 && this.upKey && Phaser.Input.Keyboard.JustDown(this.upKey)) {
        this.dialogueChoiceIndex = Phaser.Math.Wrap(this.dialogueChoiceIndex - 1, 0, choices.length);
        this.refreshDialogueChoiceStyles();
      }
      if (choices.length > 1 && this.downKey && Phaser.Input.Keyboard.JustDown(this.downKey)) {
        this.dialogueChoiceIndex = Phaser.Math.Wrap(this.dialogueChoiceIndex + 1, 0, choices.length);
        this.refreshDialogueChoiceStyles();
      }
    }

    if (this.interactKey && Phaser.Input.Keyboard.JustDown(this.interactKey)) {
      this.resolveDialogueAdvance(node);
    }
  }

  private resolveDialogueAdvance(node: DialogueNode): void {
    if (node.choices?.length) {
      const selectedChoice = node.choices[this.dialogueChoiceIndex];
      if (!selectedChoice) return;

      if (!this.isDialogueChoiceAvailable(selectedChoice)) {
        this.showSystemToast(selectedChoice.lockedReason ?? "\uC120\uD0DD \uC870\uAC74\uC744 \uB9CC\uC871\uD558\uC9C0 \uBABB\uD588\uC2B5\uB2C8\uB2E4");
        return;
      }

      this.applyDialogueChoiceStatChanges(selectedChoice);

      if (selectedChoice.nextNodeId) {
        this.activeDialogueNodeId = selectedChoice.nextNodeId;
        this.dialogueChoiceIndex = 0;
        this.renderDialogueNode();
        return;
      }

      this.closeDialogue();
      if (selectedChoice.action) {
        this.runDialogueAction(selectedChoice.action);
      }
      return;
    }

    if (node.nextNodeId) {
      this.activeDialogueNodeId = node.nextNodeId;
      this.dialogueChoiceIndex = 0;
      this.renderDialogueNode();
      return;
    }

    const action = node.action;
    this.closeDialogue();
    if (action) {
      this.runDialogueAction(action);
    }
  }

  private renderDialogueNode(): void {
    const node = this.getCurrentDialogueNode();
    if (!node) {
      this.closeDialogue();
      return;
    }

    this.dialogueSpeakerText?.setText(node.speaker);
    this.dialogueBodyText?.setText(node.text);
    this.clearDialogueChoices();

    if (node.choices?.length) {
      const choiceStartY = this.px(GAME_CONSTANTS.HEIGHT - 122);
      const choiceSpacing = 26;
      const choiceX = this.px(74);
      const wrapWidth = this.px(GAME_CONSTANTS.WIDTH - 148);

      node.choices.forEach((choice, index) => {
        const line = this.add.text(choiceX, choiceStartY + index * choiceSpacing, "", this.getBodyStyle(17, "#d2e7ff"));
        line.setOrigin(0, 0);
        line.setWordWrapWidth(wrapWidth, true);
        this.dialogueRoot?.add(line);
        this.dialogueChoiceViews.push({
          text: line,
          choice,
          requirementText: this.getDialogueRequirementText(choice)
        });
      });

      if (this.dialogueChoiceIndex >= node.choices.length) {
        this.dialogueChoiceIndex = 0;
      }

      this.dialogueHintText?.setText("\u2191/\u2193 \uC120\uD0DD  |  E \uB610\uB294 \uBC84\uD2BC \uACB0\uC815  |  ESC \uC885\uB8CC");
      this.dialogueActionButtonText?.setText("E \uC120\uD0DD");
      this.refreshDialogueChoiceStyles();
      return;
    }

    this.dialogueActionButtonText?.setText((node.nextNodeId || node.action ? "E \uB2E4\uC74C" : "E \uC885\uB8CC"));
    this.dialogueHintText?.setText((node.nextNodeId || node.action ? "E \uB2E4\uC74C" : "E \uC885\uB8CC") + "  |  ESC \uC885\uB8CC");
  }

  private refreshDialogueChoiceStyles(): void {
    this.dialogueChoiceViews.forEach((view, index) => {
      const selected = index === this.dialogueChoiceIndex;
      const available = this.isDialogueChoiceAvailable(view.choice);
      const prefix = selected ? "\u25B6 " : "   ";
      let text = `${prefix}${view.choice.text}`;
      if (view.requirementText.length > 0) {
        text += ` (${view.requirementText})`;
      }
      if (!available) {
        text += " [\uC870\uAC74 \uBBF8\uCDA9\uC871]";
      }
      view.text.setText(text);
      view.text.setColor(available ? (selected ? "#f0f8ff" : "#bfd9f8") : "#7f9cbc");
      view.text.setAlpha(available ? 1 : 0.78);
    });
  }

  private clearDialogueChoices(): void {
    this.dialogueChoiceViews.forEach((view) => view.text.destroy());
    this.dialogueChoiceViews = [];
  }

  private closeDialogue(): void {
    this.dialogueOpen = false;
    this.activeDialogueId = null;
    this.activeDialogueNodeId = null;
    this.dialogueChoiceIndex = 0;
    this.clearDialogueChoices();
    this.dialogueRoot?.setVisible(false);
  }

  private getCurrentDialogueNode(): DialogueNode | null {
    if (!this.activeDialogueId || !this.activeDialogueNodeId) return null;
    const script = NPC_DIALOGUE_SCRIPTS[this.activeDialogueId];
    if (!script) return null;
    return script.nodes[this.activeDialogueNodeId] ?? null;
  }

  private isDialogueChoiceAvailable(choice: DialogueChoice): boolean {
    const requirements = choice.requirements ?? [];
    return requirements.every((req) => {
      const value = this.statsState[req.stat as StatKey];
      if (typeof req.min === "number" && value < req.min) return false;
      if (typeof req.max === "number" && value > req.max) return false;
      return true;
    });
  }

  private getDialogueRequirementText(choice: DialogueChoice): string {
    const requirements = choice.requirements ?? [];
    if (requirements.length === 0) return "";

    return requirements
      .map((req) => {
        if (req.label) return req.label;
        const label = STAT_LABEL[req.stat as StatKey];
        if (typeof req.min === "number" && typeof req.max === "number") {
          return `${label} ${req.min}~${req.max}`;
        }
        if (typeof req.min === "number") {
          return `${label} ${req.min} \uC774\uC0C1`;
        }
        if (typeof req.max === "number") {
          return `${label} ${req.max} \uC774\uD558`;
        }
        return label;
      })
      .join(", ");
  }

  private applyDialogueChoiceStatChanges(choice: DialogueChoice): void {
    if (!choice.statChanges) return;
    const entries = Object.entries(choice.statChanges) as Array<[StoryStatKey, number]>;
    if (entries.length === 0) return;

    this.applyStatDelta(choice.statChanges as Partial<Record<StatKey, number>>, 1);
    const summary = entries
      .map(([key, value]) => `${STAT_LABEL[key as StatKey]} ${value > 0 ? "+" : ""}${value}`)
      .join(", ");
    this.showSystemToast(`\uB2A5\uB825\uCE58 \uBCC0\uD654: ${summary}`);
  }

  private runDialogueAction(action: DialogueAction): void {
    if (action === "openShop") {
      this.openShop();
      this.showSystemToast("\uC0C1\uC810\uC744 \uC5F4\uC5C8\uC2B5\uB2C8\uB2E4");
      return;
    }
    if (action === "openMiniGame") {
      this.launchMiniGameCenter();
    }
  }

  private launchMiniGameCenter(): void {
    if (
      this.scene.isActive("MenuScene") ||
      this.scene.isActive("MinigamePauseScene") ||
      this.scene.isActive("QuizScene") ||
      this.scene.isActive("RhythmScene") ||
      this.scene.isActive("DragScene") ||
      this.scene.isActive("BugScene") ||
      this.scene.isActive("RunnerScene") ||
      this.scene.isActive("AimScene") ||
      this.scene.isActive("TypingScene") ||
      this.scene.isActive("BusinessSmileScene") ||
      this.scene.isActive("DontSmileScene")
    ) {
      return;
    }

    this.showSystemToast("\uBBF8\uB2C8\uAC8C\uC784 \uC13C\uD130 \uC785\uC7A5");
    this.scene.launch("MenuScene", { returnSceneKey: SceneKey.Main });
    this.scene.pause(SceneKey.Main);
  }

  private buildShop(): void {
    const centerX = this.px(GAME_CONSTANTS.WIDTH / 2);
    const centerY = this.px(GAME_CONSTANTS.HEIGHT / 2);

    const backgroundImage = this.createPlaceBackgroundImage(PLACE_BACKGROUND_KEYS.store);
    if (backgroundImage) {
      backgroundImage.setVisible(false);
    }

    const overlay = this.add.rectangle(centerX, centerY, GAME_CONSTANTS.WIDTH, GAME_CONSTANTS.HEIGHT, 0x000000, 0.35);

    const panelOuter = this.createPanelOuterBorder(centerX, centerY, 760, 430);
    const panel = this.add.rectangle(centerX, centerY, 760, 430, 0x163357, 0.96);
    panel.setStrokeStyle(2, this.uiPanelInnerBorderColor, 1);

    const title = this.add.text(centerX, centerY - 190, "NPC \uC0C1\uC810", this.getBodyStyle(30, "#e6f3ff", "bold"));
    title.setOrigin(0.5);
    const hint = this.add.text(centerX, centerY + 176, "E / ESC\uB85C \uB2EB\uAE30", this.getBodyStyle(16, "#a8c9ef"));
    hint.setOrigin(0.5);

    const cards: Phaser.GameObjects.GameObject[] = [];

    SHOP_ITEM_TEMPLATES.forEach((item, idx) => {
      const col = idx % 2;
      const row = Math.floor(idx / 2);
      const x = this.px(centerX - 170 + col * 340);
      const y = this.px(centerY - 62 + row * 165);
      const card = this.add.rectangle(x, y, 300, 140, 0x234873, 1);
      card.setStrokeStyle(2, 0x5cb0ff, 1);

      const icon = this.add.rectangle(x - 100, y, 66, 66, item.color, 1);
      icon.setStrokeStyle(2, 0x5cb0ff, 1);
      const iconLabel = this.add.text(x - 100, y + 1, item.shortLabel, this.getBodyStyle(22, "#f0f8ff", "bold"));
      iconLabel.setOrigin(0.5);

      const name = this.add.text(x - 22, y - 28, item.name, this.getBodyStyle(19, "#e6f3ff", "bold"));
      name.setOrigin(0, 0.5);
      const price = this.add.text(x - 22, y + 2, `${item.price.toLocaleString("ko-KR")} G`, this.getBodyStyle(18, "#b6d6fb", "bold"));
      price.setOrigin(0, 0.5);
      const buyHint = this.add.text(x - 22, y + 30, "\uD074\uB9AD \uAD6C\uB9E4", this.getBodyStyle(15, "#a1c5ef"));
      buyHint.setOrigin(0, 0.5);

      card.setInteractive({ useHandCursor: true });
      card.on("pointerover", (pointer: Phaser.Input.Pointer) => {
        card.setFillStyle(0x2c5a8f, 1);
        this.showItemTooltip(item, pointer.worldX, pointer.worldY);
      });
      card.on("pointermove", (pointer: Phaser.Input.Pointer) => {
        this.showItemTooltip(item, pointer.worldX, pointer.worldY);
      });
      card.on("pointerout", () => {
        card.setFillStyle(0x234873, 1);
        this.hideItemTooltip();
      });
      card.on("pointerdown", () => this.purchaseFromShop(item));

      cards.push(card, icon, iconLabel, name, price, buyHint);
    });

    const objects: Phaser.GameObjects.GameObject[] = [overlay, panelOuter, panel, title, hint, ...cards];
    if (backgroundImage) {
      objects.unshift(backgroundImage);
    }

    this.shopRoot = this.add.container(0, 0, objects);
    this.shopRoot.setDepth(900);
    this.shopRoot.setVisible(false);
    this.shopOverlay = overlay;
    this.shopBackgroundImage = backgroundImage ?? undefined;
  }

  private openShop(backgroundTextureKey: string | null = null): void {
    if (!this.shopRoot) return;

    if (this.shopBackgroundImage) {
      if (backgroundTextureKey && this.textures.exists(backgroundTextureKey)) {
        this.shopBackgroundImage.setTexture(backgroundTextureKey);
        this.shopBackgroundImage.setDisplaySize(GAME_CONSTANTS.WIDTH, GAME_CONSTANTS.HEIGHT);
        this.shopBackgroundImage.setVisible(true);
        this.shopOverlay?.setFillStyle(0x000000, 0.42);
      } else {
        this.shopBackgroundImage.setVisible(false);
        this.shopOverlay?.setFillStyle(0x000000, 0.35);
      }
    } else {
      this.shopOverlay?.setFillStyle(0x000000, 0.35);
    }

    this.shopOpen = true;
    this.shopRoot.setVisible(true);
  }

  private closeShop(): void {
    this.shopOpen = false;
    this.shopRoot?.setVisible(false);
    this.shopBackgroundImage?.setVisible(false);
    this.shopOverlay?.setFillStyle(0x000000, 0.35);
    this.hideItemTooltip();
  }

  private addItemToInventory(template: InventoryItemTemplate, amount = 1, showFullToast = true): boolean {
    if (amount <= 0) return true;

    if (template.stackable) {
      const stackIndex = this.inventorySlots.findIndex((slot) => slot?.template.templateId === template.templateId);
      if (stackIndex >= 0) {
        this.inventorySlots[stackIndex]!.quantity += amount;
        this.refreshInventoryUi();
        return true;
      }
    }

    const emptyIndex = this.inventorySlots.findIndex((slot) => slot === null);
    if (emptyIndex === -1) {
      if (showFullToast) {
        this.showSystemToast("\uC778\uBCA4\uD1A0\uB9AC \uCE78\uC774 \uB2E4 \uCC3C\uB2E4");
      }
      return false;
    }

    this.inventorySlots[emptyIndex] = {
      template,
      quantity: amount
    };
    this.refreshInventoryUi();
    return true;
  }

  private refreshInventoryUi(): void {
    const renderItem = (view: SlotView, item: InventoryItemStack | InventoryItemTemplate | null): void => {
      const template = item && "template" in item ? item.template : item;
      const quantity = item && "template" in item ? item.quantity : 1;

      if (!template) {
        view.icon.setVisible(false);
        view.iconText.setVisible(false);
        view.stackText.setVisible(false);
        return;
      }

      view.icon.setFillStyle(template.color, 1);
      view.icon.setVisible(true);
      view.iconText.setText(template.shortLabel);
      view.iconText.setVisible(true);
      view.stackText.setText(quantity > 1 ? `${quantity}` : "");
      view.stackText.setVisible(quantity > 1);
    };

    this.inventorySlotViews.forEach((view, index) => {
      renderItem(view, this.inventorySlots[index] ?? null);
    });

    if (this.equipmentSlotViews) {
      renderItem(this.equipmentSlotViews.keyboard, this.equippedSlots.keyboard);
      renderItem(this.equipmentSlotViews.mouse, this.equippedSlots.mouse);
    }
  }

  private isDoubleClick(key: string): boolean {
    const now = this.time.now;
    const last = this.slotClickAt[key] ?? -9999;
    this.slotClickAt[key] = now;
    return now - last <= 260;
  }

  private equipFromInventory(index: number): void {
    const stack = this.inventorySlots[index];
    if (!stack) return;
    const item = stack.template;

    if (item.kind !== "equipment" || !item.equipSlot) {
      this.showSystemToast("\uC7A5\uCC29\uD560 \uC218 \uC5C6\uB294 \uC544\uC774\uD15C\uC785\uB2C8\uB2E4");
      return;
    }

    if (this.equippedSlots[item.equipSlot]) {
      this.showSystemToast("\uD574\uB2F9 \uC7A5\uBE44\uCE78\uC774 \uC774\uBBF8 \uC0AC\uC6A9 \uC911\uC785\uB2C8\uB2E4");
      return;
    }

    this.equippedSlots[item.equipSlot] = item;
    stack.quantity -= 1;
    if (stack.quantity <= 0) {
      this.inventorySlots[index] = null;
    }
    this.applyStatDelta(this.getEquipmentStatDelta(item), 1);
    this.refreshInventoryUi();
    this.showSystemToast(`${item.name} \uC7A5\uCC29`);
  }

  private unequipItem(slot: EquipmentSlotKey): void {
    const item = this.equippedSlots[slot];
    if (!item) return;

    if (!this.addItemToInventory(item, 1, false)) {
      this.showSystemToast("\uC778\uBCA4\uD1A0\uB9AC \uCE78\uC774 \uB2E4 \uCC3C\uB2E4");
      return;
    }

    this.equippedSlots[slot] = null;
    this.applyStatDelta(this.getEquipmentStatDelta(item), -1);
    this.refreshInventoryUi();
    this.showSystemToast(`${item.name} \uCC29\uC6A9 \uD574\uC81C`);
  }

  private purchaseFromShop(template: InventoryItemTemplate): void {
    if (this.hudState.money < template.price) {
      this.showSystemToast("\uB3C8\uC774 \uBD80\uC871\uD569\uB2C8\uB2E4");
      return;
    }

    const inserted = this.addItemToInventory(template);
    if (!inserted) {
      return;
    }

    this.updateHudState({ money: this.hudState.money - template.price });
    this.showSystemToast(`${template.name} \uAD6C\uB9E4 \uC644\uB8CC`);
  }

  private seedDemoItems(): void {
    this.addItemToInventory(STARTER_ITEM_TEMPLATES[0], 3, false);
    this.addItemToInventory(STARTER_ITEM_TEMPLATES[1], 2, false);
  }

  private refreshStatsUi(): void {
    STAT_ROW_DEFS.forEach((stat) => {
      this.statsState[stat.key] = Phaser.Math.Clamp(Math.round(this.statsState[stat.key]), 0, 100);
      const view = this.statViews[stat.key];
      if (!view) return;

      const value = this.statsState[stat.key];
      view.valueText.setText(`${value}`);
      view.barFill.width = this.px(view.maxFillWidth * (value / 100));
    });
  }

  private getEquipmentStatDelta(item: InventoryItemTemplate): Partial<Record<StatKey, number>> {
    if (item.templateId === "kbd-basic") {
      return { fe: 5 };
    }
    if (item.templateId === "mouse-basic") {
      return { be: 5 };
    }
    return {};
  }

  private getConsumableStatDelta(item: InventoryItemTemplate): Partial<Record<StatKey, number>> {
    if (item.templateId === "snack-energybar") {
      return { stress: -4 };
    }
    if (item.templateId === "item-coffee") {
      return { fe: 1, be: 1, stress: -2 };
    }
    return {};
  }

  private applyStatDelta(delta: Partial<Record<StatKey, number>>, multiplier: 1 | -1 = 1): void {
    let changed = false;

    (Object.keys(delta) as StatKey[]).forEach((key) => {
      const value = delta[key];
      if (!value) return;
      this.statsState[key] = Phaser.Math.Clamp(this.statsState[key] + value * multiplier, 0, 100);
      changed = true;
    });

    if (changed) {
      this.refreshStatsUi();
    }
  }

  private consumeFromInventory(index: number): void {
    const stack = this.inventorySlots[index];
    if (!stack) return;
    if (stack.template.kind !== "consumable") return;

    stack.quantity -= 1;
    if (stack.quantity <= 0) {
      this.inventorySlots[index] = null;
    }

    const nextHp = Phaser.Math.Clamp(this.hudState.hp + (stack.template.templateId === "snack-energybar" ? 12 : 7), 0, this.hudState.hpMax);
    const nextStress = Phaser.Math.Clamp(this.hudState.stress - (stack.template.templateId === "snack-energybar" ? 4 : 2), 0, 100);
    this.applyStatDelta(this.getConsumableStatDelta(stack.template), 1);
    this.updateHudState({ hp: nextHp, stress: nextStress });
    this.refreshInventoryUi();
    this.showSystemToast(`${stack.template.name} \uC0AC\uC6A9`);
  }

  private cancelPendingInventoryPickup(): void {
    if (!this.pendingInventoryPickup) return;
    this.pendingInventoryPickup.timer.destroy();
    this.pendingInventoryPickup = undefined;
  }

  private onInventorySlotClick(index: number, view: SlotView): void {
    this.cancelPendingInventoryPickup();
    const slot = this.inventorySlots[index];
    const clickKey = `inv-${index}`;
    const now = this.time.now;
    const last = this.slotClickAt[clickKey] ?? -9999;
    this.slotClickAt[clickKey] = now;

    if (!this.carriedItem) {
      if (!slot) return;

      if (now - last <= 260) {
        if (slot.template.kind === "equipment") {
          this.equipFromInventory(index);
        } else if (slot.template.kind === "consumable") {
          this.consumeFromInventory(index);
        }
        this.hideCarriedItem();
        this.hideItemTooltip();
        return;
      }

      const pickupAt = now;
      const timer = this.time.delayedCall(270, () => {
        if (!this.pendingInventoryPickup) return;
        if (this.pendingInventoryPickup.index !== index || this.pendingInventoryPickup.at !== pickupAt) return;
        const latest = this.inventorySlots[index];
        if (!latest || this.carriedItem) {
          this.pendingInventoryPickup = undefined;
          return;
        }
        this.carriedItem = { ...latest };
        this.carriedFromIndex = index;
        this.inventorySlots[index] = null;
        this.refreshInventoryUi();
        this.showCarriedItem(this.carriedItem);
        this.applySlotSelectedStyle(view);
        this.hideItemTooltip();
        this.pendingInventoryPickup = undefined;
      });
      this.pendingInventoryPickup = { index, at: pickupAt, timer };
      return;
    }

    const held = this.carriedItem;
    const target = this.inventorySlots[index];

    if (!target) {
      this.inventorySlots[index] = held;
      this.clearCarriedItem();
      this.refreshInventoryUi();
      this.hideItemTooltip();
      return;
    }

    if (held.template.stackable && target.template.templateId === held.template.templateId) {
      target.quantity += held.quantity;
      this.clearCarriedItem();
      this.refreshInventoryUi();
      this.hideItemTooltip();
      return;
    }

    this.inventorySlots[index] = held;
    this.carriedItem = target;
    this.carriedFromIndex = index;
    this.showCarriedItem(this.carriedItem);
    this.refreshInventoryUi();
    this.hideItemTooltip();
  }

  private applySlotIdleStyle(view: SlotView): void {
    view.bg.setFillStyle(0x2e527d, 1);
    view.bg.setStrokeStyle(2, 0x5aa8ee, 1);
  }

  private applySlotHoverStyle(view: SlotView): void {
    view.bg.setFillStyle(0x396392, 1);
    view.bg.setStrokeStyle(2, 0x5aa8ee, 1);
  }

  private applySlotSelectedStyle(view: SlotView): void {
    view.bg.setFillStyle(0x4473a7, 1);
    view.bg.setStrokeStyle(3, 0x79c7ff, 1);
  }

  private createItemTooltip(): void {
    const bg = this.add.rectangle(0, 0, 220, 90, 0x153253, 0.95);
    bg.setOrigin(0, 0);
    bg.setStrokeStyle(2, 0x5aa8ee, 1);
    const text = this.add.text(10, 8, "", this.getBodyStyle(15, "#e6f3ff"));
    this.tooltipRoot = this.add.container(0, 0, [bg, text]);
    this.tooltipRoot.setDepth(1300);
    this.tooltipRoot.setVisible(false);
  }

  private showItemTooltip(item: InventoryItemStack | InventoryItemTemplate | null, pointerX: number, pointerY: number): void {
    if (!item || !this.tooltipRoot) return;
    const template = "template" in item ? item.template : item;

    const text = this.tooltipRoot.list[1] as Phaser.GameObjects.Text;
    const bg = this.tooltipRoot.list[0] as Phaser.GameObjects.Rectangle;
    const kindText = template.kind === "equipment" ? "\uC7A5\uBE44" : "\uC18C\uBE44";
    text.setText(
      `\uC774\uB984: ${template.name}\n\uC885\uB958: ${kindText}\n\uD6A8\uACFC: ${template.effect}\n\uD310\uB9E4 \uAE08\uC561: ${template.sellPrice.toLocaleString("ko-KR")} G`
    );
    bg.width = Math.max(220, Math.ceil(text.width + 20));
    bg.height = Math.max(90, Math.ceil(text.height + 16));
    this.tooltipRoot.setPosition(this.px(pointerX + 14), this.px(pointerY + 14));
    this.tooltipRoot.setVisible(true);
  }

  private hideItemTooltip(): void {
    this.tooltipRoot?.setVisible(false);
  }

  private createCarriedItemPreview(): void {
    const icon = this.add.rectangle(0, 0, 38, 38, 0xffffff, 1);
    icon.setStrokeStyle(2, 0x5aa8ee, 1);
    const label = this.add.text(0, 0, "", this.getBodyStyle(16, "#e6f3ff", "bold"));
    label.setOrigin(0.5);
    const stackText = this.add.text(16, 14, "", this.getBodyStyle(13, "#e6f3ff", "bold"));
    stackText.setOrigin(1, 1);

    this.carriedItemRoot = this.add.container(0, 0, [icon, label, stackText]);
    this.carriedItemRoot.setAlpha(0.55);
    this.carriedItemRoot.setDepth(1400);
    this.carriedItemRoot.setVisible(false);
  }

  private showCarriedItem(stack: InventoryItemStack): void {
    if (!this.carriedItemRoot) return;
    const icon = this.carriedItemRoot.list[0] as Phaser.GameObjects.Rectangle;
    const label = this.carriedItemRoot.list[1] as Phaser.GameObjects.Text;
    const stackText = this.carriedItemRoot.list[2] as Phaser.GameObjects.Text;

    icon.setFillStyle(stack.template.color, 1);
    label.setText(stack.template.shortLabel);
    stackText.setText(stack.quantity > 1 ? `${stack.quantity}` : "");
    this.carriedItemRoot.setVisible(true);
    this.updateCarriedItemPosition(this.input.activePointer.worldX, this.input.activePointer.worldY);
  }

  private updateCarriedItemPosition(x: number, y: number): void {
    this.carriedItemRoot?.setPosition(this.px(x), this.px(y));
  }

  private hideCarriedItem(): void {
    this.carriedItemRoot?.setVisible(false);
  }

  private clearCarriedItem(): void {
    this.carriedItem = null;
    this.carriedFromIndex = null;
    this.hideCarriedItem();
  }

  private returnCarriedItemToInventory(): void {
    if (!this.carriedItem) return;

    if (this.carriedFromIndex !== null && this.inventorySlots[this.carriedFromIndex] === null) {
      this.inventorySlots[this.carriedFromIndex] = this.carriedItem;
      this.clearCarriedItem();
      this.refreshInventoryUi();
      return;
    }

    const empty = this.inventorySlots.findIndex((slot) => slot === null);
    if (empty >= 0) {
      this.inventorySlots[empty] = this.carriedItem;
      this.clearCarriedItem();
      this.refreshInventoryUi();
      return;
    }

    this.showSystemToast("\uC778\uBCA4\uD1A0\uB9AC \uCE78\uC774 \uB2E4 \uCC3C\uB2E4");
  }

  private showSystemToast(message: string): void {
    if (!this.systemToastRoot) {
      const outer = this.add.rectangle(0, 0, 228, 42, 0x000000, 0);
      outer.setStrokeStyle(3, this.uiPanelOuterBorderColor, 1);
      const bg = this.add.rectangle(0, 0, 220, 34, 0x163357, 0.95);
      bg.setStrokeStyle(2, this.uiPanelInnerBorderColor, 1);
      const text = this.add.text(0, 0, "", this.getBodyStyle(17, "#e8f4ff"));
      text.setOrigin(0.5);

      this.systemToastRoot = this.add.container(0, 0, [outer, bg, text]);
      this.systemToastRoot.setDepth(1300);
    }

    const outer = this.systemToastRoot.list[0] as Phaser.GameObjects.Rectangle;
    const bg = this.systemToastRoot.list[1] as Phaser.GameObjects.Rectangle;
    const text = this.systemToastRoot.list[2] as Phaser.GameObjects.Text;
    text.setText(message);
    bg.width = Math.max(180, Math.ceil(text.width + 26));
    outer.width = bg.width + 8;

    this.systemToastRoot.setPosition(this.px(GAME_CONSTANTS.WIDTH / 2), 62);
    this.systemToastRoot.setVisible(true);

    this.systemToastTimer?.destroy();
    this.systemToastTimer = this.time.delayedCall(1100, () => {
      this.systemToastRoot?.setVisible(false);
    });
  }

  private getTitleStyle(): Phaser.Types.GameObjects.Text.TextStyle {
    return {
      fontFamily: this.uiFontFamily,
      fontSize: "34px",
      fontStyle: "bold",
      color: "#e6f3ff",
      resolution: 2
    };
  }

  private getBodyStyle(
    sizePx: number,
    color = "#d6e8ff",
    fontStyle: "normal" | "bold" = "normal"
  ): Phaser.Types.GameObjects.Text.TextStyle {
    return {
      fontFamily: this.uiFontFamily,
      fontSize: `${sizePx}px`,
      fontStyle,
      color,
      resolution: 2
    };
  }

  private px(value: number): number {
    return Math.round(value);
  }

  private buildHud(): void {
    this.hud = new GameHud(this);
    this.updateHudState({});
  }

  private updateHudState(next: Partial<HudState>): void {
    this.hudState = { ...this.hudState, ...next };
    if (typeof next.timeLabel === "string") {
      const nextTimeIndex = TIME_CYCLE.indexOf(next.timeLabel as (typeof TIME_CYCLE)[number]);
      if (nextTimeIndex >= 0) {
        this.timeCycleIndex = nextTimeIndex;
      }
    }
    if (typeof next.dayLabel === "string") {
      const nextDayIndex = DAY_CYCLE.indexOf(next.dayLabel as (typeof DAY_CYCLE)[number]);
      if (nextDayIndex >= 0) {
        this.dayCycleIndex = nextDayIndex;
      }
    }
    if (typeof next.stress === "number") {
      this.statsState.stress = Phaser.Math.Clamp(this.hudState.stress, 0, 100);
      this.refreshStatsUi();
    }
    this.hud.applyState(this.hudState);
  }

  private spendActionPoint(): boolean {
    if (this.actionPoint <= 0) {
      this.showSystemToast("\uD589\uB3D9\uB825\uC774 \uBD80\uC871\uD569\uB2C8\uB2E4");
      return false;
    }

    let dayPassed = false;
    let shouldStartEndingAfterUpdate = false;
    this.actionPoint = Phaser.Math.Clamp(this.actionPoint - 1, 0, this.maxActionPoint);
    this.timeCycleIndex = (this.timeCycleIndex + 1) % TIME_CYCLE.length;

    const patch: Partial<HudState> = {
      timeLabel: TIME_CYCLE[this.timeCycleIndex]
    };

    if (this.timeCycleIndex === 0) {
      dayPassed = true;
      this.actionPoint = this.maxActionPoint;
      this.dayCycleIndex = (this.dayCycleIndex + 1) % DAY_CYCLE.length;
      patch.dayLabel = DAY_CYCLE[this.dayCycleIndex];
      if (this.dayCycleIndex === 0) {
        if (this.hudState.week >= 6) {
          shouldStartEndingAfterUpdate = true;
        } else {
          patch.week = this.hudState.week + 1;
        }
      }
      this.time.delayedCall(180, () => {
        this.showSystemToast("\uD558\uB8E8\uAC00 \uC9C0\uB0AC\uC2B5\uB2C8\uB2E4");
      });
    }

    this.updateHudState(patch);
    if (dayPassed) {
      this.saveGameToSlot("auto", true);
      if (shouldStartEndingAfterUpdate || this.shouldTriggerEndingFlow(patch.week)) {
        this.time.delayedCall(240, () => {
          this.startEndingFlow();
        });
      }
    }
    return true;
  }

  private shouldTriggerEndingFlow(nextWeek?: number): boolean {
    return typeof nextWeek === "number" && this.hudState.week <= 6 && nextWeek > 6;
  }

  private buildEndingPayload(): EndingFlowPayload {
    return {
      fe: this.statsState.fe,
      be: this.statsState.be,
      teamwork: this.statsState.teamwork,
      luck: this.statsState.luck,
      hp: this.hudState.hp,
      week: this.hudState.week,
      dayLabel: this.hudState.dayLabel,
      timeLabel: this.hudState.timeLabel
    };
  }

  private startEndingFlow(): void {
    if (this.endingFlowStarted) {
      return;
    }

    this.endingFlowStarted = true;
    this.player.setVelocity(0, 0);
    this.saveGameToSlot("auto", true);
    this.scene.start(SceneKey.FinalSummary, this.buildEndingPayload());
  }
}
