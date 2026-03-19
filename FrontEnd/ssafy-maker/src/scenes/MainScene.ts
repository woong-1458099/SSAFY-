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
  type DialogueStatKey,
  type DialogueNode,
  type NpcDialogueId,
  type NpcDialogueScript
} from "@features/story/npcDialogueScripts";
import {
  buildDialogueScriptFromFixedEventEntry,
  buildDialogueScriptFromFixedEventJson,
  findMatchingFixedEvent,
  getFixedEventEntries
} from "@features/story/jsonDialogueAdapter";
import {
  buildFixedEventNpcPresentation,
  getDefaultFixedEventNpcSlotsForArea,
  getFixedEventPresentNpcs,
  resolveCurrentFixedEventLocation,
  type FixedEventNpcSlot,
  type FixedEventRenderArea
} from "@features/story/fixedEventNpcPresence";
import {
  clearDialogueChoices,
  createDialogueUi,
  refreshDialogueChoiceStyles,
  renderDialogueNode,
  type DialogueChoiceView
} from "@features/story/dialogueUi";
import {
  buildAreaCollisionConfigFromTmxText,
  buildInteractionZonesFromTmxText,
  findNearestWalkablePoint,
  isBlockedByAreaCollision,
  mapPointToAreaBounds,
  mapSizeToAreaBounds,
  parseTmxMap,
  type AreaCollisionConfig,
  type AreaRenderBounds
} from "@features/world/tmxNavigation";
import type { EndingFlowPayload } from "@features/progression/types/ending";
import {
  buildPlayerVisual,
  PLAYER_DISPLAY_SCALE,
  preloadPlayerAvatarAssets,
  syncPlayerAvatarVisuals as syncPlayerAvatarVisualsFn,
  updatePlayerAvatarAnimation as updatePlayerAvatarAnimationFn,
  type PlayerAvatarData,
  type PlayerVisualParts,
} from "@features/avatar/playerAvatar";
import { openLegacyMinigameMenu } from "@features/minigame/minigameLauncher";
import { createHomeActionModal } from "@features/home/homeActionModal";
import { resolveHomeAction, type HomeActionId } from "@features/home/homeActions";
import {
  advanceTimeProgress,
  DAY_CYCLE,
  shouldTriggerEndingFlow,
  TIME_CYCLE
} from "@features/progression/services/timeProgression";
import {
  createDefaultWeeklyPlan,
  WEEKLY_PLAN_ACTIVITY_TEXTURE_KEYS,
  WEEKLY_PLAN_DAY_INDICES,
  WEEKLY_PLAN_TIME_LABELS,
  getCurrentWeeklyPlanSlotKey,
  getWeeklyPlanOption,
  getWeeklyPlanSlotIndex,
  parseWeeklyPlanSlotKey,
  parseWeeklyPlanOptionId,
  WEEKLY_PLAN_OPTIONS,
  type WeeklyPlanOption,
  type WeeklyPlanOptionId,
} from "@features/planning/weeklyPlan";
import { createWeeklyPlannerModal } from "@features/planning/weeklyPlannerModal";
import { createWeeklyPlanActivityModal } from "@features/planning/weeklyPlanActivityModal";
import { findNearestDowntownBuilding } from "@features/place/downtownBuildings";
import {
  getDowntownBuildingBackgroundTextureKey,
  getDowntownBuildingConfig,
  getPlaceBackgroundTextureKey,
  getPlacePopupContent,
  resolveDowntownBuildingAction,
  resolvePlaceAction,
  type DowntownBuildingId
} from "@features/place/placeActions";
import { createPlaceActionModal } from "@features/place/placeModal";
import {
  captureGameSavePayload,
  getSaveSlotMetaText,
  restoreInventoryFromSave,
  restoreStatsFromSave,
  type SaveGamePayload
} from "@features/save/saveGameState";
import { createSavePage as createSavePageContent, type SaveSlotView } from "@features/save/saveMenu";
import { createInventoryPage as createInventoryPageContent, type SlotView } from "@features/inventory/inventoryMenu";
import { createSettingsPage as createSettingsPageContent, createStatsPage as createStatsPageContent, type StatView } from "@features/menu/tabPages";

type TabKey = "inventory" | "stats" | "settings" | "save";
type EquipmentSlotKey = "keyboard" | "mouse";
type AreaId = "world" | "downtown" | "campus";
type WorldPlaceId = "home" | "downtown" | "campus" | "cafe" | "store";
type StatKey = "fe" | "be" | "teamwork" | "luck" | "stress";

type WorldPlaceNode = {
  id: WorldPlaceId;
  label: string;
  x: number;
  y: number;
  zoneWidth: number;
  zoneHeight: number;
  movable: boolean;
};

type AreaNpcConfig = {
  dialogueId: NpcDialogueId;
  x: number;
  y: number;
  labelOffsetX: number;
  labelOffsetY: number;
  flashColor: number;
  textureKey?: string;
};

type AreaNpcView = {
  area: AreaId;
  config: AreaNpcConfig;
  marker: Phaser.GameObjects.Shape | Phaser.GameObjects.Sprite;
  label: Phaser.GameObjects.Text;
  portrait?: Phaser.GameObjects.Image;
  eventId?: string;
  isScheduled?: boolean;
};

type ScheduledNpcSlot = FixedEventNpcSlot;
type ScheduledNpcArea = FixedEventRenderArea;
type ScheduledNpcPositionMap = Record<ScheduledNpcArea, Record<(typeof TIME_CYCLE)[number], ScheduledNpcSlot[]>>;
type DowntownBuildingView = {
  id: DowntownBuildingId;
  hitBox: Phaser.GameObjects.Rectangle;
  left: number;
  right: number;
  top: number;
  bottom: number;
  defaultStrokeColor: number;
  defaultStrokeAlpha: number;
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
  iconKey: string;
  hpDelta?: number;
  stressDelta?: number;
  statDelta?: Partial<Record<StatKey, number>>;
};

type InventoryItemStack = {
  template: InventoryItemTemplate;
  quantity: number;
};

const SHOP_ITEM_TEMPLATES: InventoryItemTemplate[] = [
  {
    templateId: "kbd-gaming",
    name: "\uAC8C\uC774\uBC0D \uD0A4\uBCF4\uB4DC",
    shortLabel: "KB",
    kind: "equipment",
    equipSlot: "keyboard",
    price: 4200,
    sellPrice: 2100,
    effect: "FE \uB2A5\uB825\uCE58 +5",
    stackable: false,
    color: 0x78a6d1,
    iconKey: "shop-item-keyboard",
    statDelta: { fe: 5 }
  },
  {
    templateId: "mouse-gaming",
    name: "\uAC8C\uC774\uBC0D \uB9C8\uC6B0\uC2A4",
    shortLabel: "MS",
    kind: "equipment",
    equipSlot: "mouse",
    price: 3200,
    sellPrice: 1600,
    effect: "BE \uB2A5\uB825\uCE58 +5",
    stackable: false,
    color: 0x9a86d4,
    iconKey: "shop-item-mouse",
    statDelta: { be: 5 }
  },
  {
    templateId: "item-chocolate",
    name: "\uCD08\uCF54\uB9BF",
    shortLabel: "CH",
    kind: "consumable",
    price: 500,
    sellPrice: 250,
    effect: "HP +5, \uC2A4\uD2B8\uB808\uC2A4 -3",
    stackable: true,
    color: 0xd89a66,
    iconKey: "shop-item-chocolate",
    hpDelta: 5,
    stressDelta: -3
  },
  {
    templateId: "item-ramen",
    name: "\uB77C\uBA74",
    shortLabel: "RA",
    kind: "consumable",
    price: 1200,
    sellPrice: 600,
    effect: "HP +12, \uC2A4\uD2B8\uB808\uC2A4 -2",
    stackable: true,
    color: 0xb17b4d,
    iconKey: "shop-item-ramen",
    hpDelta: 12,
    stressDelta: -2
  },
  {
    templateId: "item-dosirak",
    name: "\uB3C4\uC2DC\uB77D",
    shortLabel: "DO",
    kind: "consumable",
    price: 1800,
    sellPrice: 900,
    effect: "HP +18, \uC2A4\uD2B8\uB808\uC2A4 -5",
    stackable: true,
    color: 0xc9936a,
    iconKey: "shop-item-dosirak",
    hpDelta: 18,
    stressDelta: -5
  },
  {
    templateId: "item-energy-drink",
    name: "\uC5D0\uB108\uC9C0 \uB4DC\uB9C1\uD06C",
    shortLabel: "ED",
    kind: "consumable",
    price: 1300,
    sellPrice: 650,
    effect: "HP +9, \uC2A4\uD2B8\uB808\uC2A4 +6",
    stackable: true,
    color: 0x7dd2d4,
    iconKey: "shop-item-energy-drink",
    hpDelta: 9,
    stressDelta: 6
  },
  {
    templateId: "item-snack",
    name: "\uACFC\uC790",
    shortLabel: "SN",
    kind: "consumable",
    price: 800,
    sellPrice: 400,
    effect: "HP +6, \uC2A4\uD2B8\uB808\uC2A4 -1",
    stackable: true,
    color: 0xf0b75d,
    iconKey: "shop-item-snack",
    hpDelta: 6,
    stressDelta: -1
  },
  {
    templateId: "item-cigarette",
    name: "\uB2F4\uBC30",
    shortLabel: "CG",
    kind: "consumable",
    price: 900,
    sellPrice: 450,
    effect: "HP -7, \uC2A4\uD2B8\uB808\uC2A4 -10",
    stackable: true,
    color: 0xb7bcc9,
    iconKey: "shop-item-cigarette",
    hpDelta: -7,
    stressDelta: -10
  },
  {
    templateId: "item-soju",
    name: "\uC18C\uC8FC",
    shortLabel: "SJ",
    kind: "consumable",
    price: 1100,
    sellPrice: 550,
    effect: "HP -4, \uC2A4\uD2B8\uB808\uC2A4 -12, \uD611\uC5C5 +2",
    stackable: true,
    color: 0x85d5b8,
    iconKey: "shop-item-soju",
    hpDelta: -4,
    stressDelta: -12,
    statDelta: { teamwork: 2 }
  }
];

const STARTER_ITEM_TEMPLATES: InventoryItemTemplate[] = [
  SHOP_ITEM_TEMPLATES[2],
  SHOP_ITEM_TEMPLATES[5]
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

type MainSavePayload = SaveGamePayload<AreaId, WorldPlaceId, StatKey, EquipmentSlotKey, WeeklyPlanOptionId> & {
  completedFixedEventIds: string[];
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

const MINIGAME_SCENE_MAP: Record<string, string> = {
  gym: "GymScene",
  hof: "DrinkingScene",
  ramenthings: "CookingScene",
  lottery: "LottoScene",
  playDrinking: "DrinkingScene",
  playInterview: "InterviewScene",
  playGym: "GymScene",
  playRhythm: "RhythmScene",
  playConflict: "ConflictResolveScene",
  playCooking: "CookingScene"
};

const AREA_NPC_CONFIGS: Record<Exclude<AreaId, "world">, AreaNpcConfig[]> = {
  downtown: [
    {
      dialogueId: "downtown_shopkeeper",
      x: 930,
      y: 404,
      labelOffsetX: -24,
      labelOffsetY: 24,
      flashColor: 0xb07a3c
    }
  ],
  campus: [
    { dialogueId: "campus_senior", x: 924, y: 390, labelOffsetX: -36, labelOffsetY: 24, flashColor: 0x3f6e90 }
  ]
};

const FIXED_EVENT_NPC_ASSET_KEYS: Partial<Record<string, string>> = {
  NPC_CLASSMATE_MYUNGJIN: "fixed-npc-myungjin",
  NPC_CLASSMATE_JIWOO: "fixed-npc-jiwoo",
  NPC_CLASSMATE_YEONWOONG: "fixed-npc-yeonwoong",
  NPC_CLASSMATE_HYORYEON: "fixed-npc-hyoryeon",
  NPC_CLASSMATE_JONGMIN: "fixed-npc-jongmin",
  NPC_PRO_SUNMI: "fixed-npc-sunmi",
  NPC_PRO_DOYEON: "fixed-npc-doyeon",
  NPC_CONSULTANT_HYUNSEOK: "fixed-npc-hyunseok",
};

const FIXED_EVENT_NPC_LABELS: Partial<Record<string, string>> = {
  NPC_CLASSMATE_MYUNGJIN: "명진",
  NPC_CLASSMATE_JIWOO: "지우",
  NPC_CLASSMATE_YEONWOONG: "연웅",
  NPC_CLASSMATE_HYORYEON: "효련",
  NPC_CLASSMATE_JONGMIN: "종민",
  NPC_PRO_SUNMI: "조선미 프로",
  NPC_PRO_DOYEON: "김도연 프로",
  NPC_CONSULTANT_HYUNSEOK: "이현석 컨설턴트",
};

const FIXED_EVENT_NPC_DISPLAY_LABELS: Partial<Record<string, string>> = {
  NPC_CLASSMATE_MYUNGJIN: "명진",
  NPC_CLASSMATE_JIWOO: "지우",
  NPC_CLASSMATE_YEONWOONG: "연웅",
  NPC_CLASSMATE_HYORYEON: "효련",
  NPC_CLASSMATE_JONGMIN: "종민",
  NPC_PRO_SUNMI: "조선미 프로",
  NPC_PRO_DOYEON: "김도연 프로",
  NPC_CONSULTANT_HYUNSEOK: "이현석 컨설턴트",
};

const SCHEDULED_NPC_SLOT_COUNT = 4;
const SCHEDULED_NPC_POSITION_MAP: ScheduledNpcPositionMap = {
  campus: {
    [TIME_CYCLE[0]]: [
      { x: 250, y: 214, labelOffsetX: -34, labelOffsetY: 34, flashColor: 0xb97ad8 },
      { x: 330, y: 238, labelOffsetX: -34, labelOffsetY: 34, flashColor: 0x6cb5ff },
      { x: 410, y: 214, labelOffsetX: -34, labelOffsetY: 34, flashColor: 0x8bd676 },
      { x: 490, y: 238, labelOffsetX: -34, labelOffsetY: 34, flashColor: 0xffb870 },
    ],
    [TIME_CYCLE[1]]: [
      { x: 600, y: 292, labelOffsetX: -34, labelOffsetY: 34, flashColor: 0xb97ad8 },
      { x: 678, y: 318, labelOffsetX: -34, labelOffsetY: 34, flashColor: 0x6cb5ff },
      { x: 756, y: 292, labelOffsetX: -34, labelOffsetY: 34, flashColor: 0x8bd676 },
      { x: 834, y: 318, labelOffsetX: -34, labelOffsetY: 34, flashColor: 0xffb870 },
    ],
    [TIME_CYCLE[2]]: [
      { x: 280, y: 404, labelOffsetX: -34, labelOffsetY: 34, flashColor: 0xb97ad8 },
      { x: 360, y: 430, labelOffsetX: -34, labelOffsetY: 34, flashColor: 0x6cb5ff },
      { x: 440, y: 404, labelOffsetX: -34, labelOffsetY: 34, flashColor: 0x8bd676 },
      { x: 520, y: 430, labelOffsetX: -34, labelOffsetY: 34, flashColor: 0xffb870 },
    ],
    [TIME_CYCLE[3]]: [
      { x: 690, y: 418, labelOffsetX: -34, labelOffsetY: 34, flashColor: 0xb97ad8 },
      { x: 764, y: 444, labelOffsetX: -34, labelOffsetY: 34, flashColor: 0x6cb5ff },
      { x: 838, y: 418, labelOffsetX: -34, labelOffsetY: 34, flashColor: 0x8bd676 },
      { x: 912, y: 444, labelOffsetX: -34, labelOffsetY: 34, flashColor: 0xffb870 },
    ],
  },
  downtown: {
    [TIME_CYCLE[0]]: [
      { x: 272, y: 248, labelOffsetX: -34, labelOffsetY: 34, flashColor: 0xb97ad8 },
      { x: 350, y: 274, labelOffsetX: -34, labelOffsetY: 34, flashColor: 0x6cb5ff },
      { x: 428, y: 248, labelOffsetX: -34, labelOffsetY: 34, flashColor: 0x8bd676 },
      { x: 506, y: 274, labelOffsetX: -34, labelOffsetY: 34, flashColor: 0xffb870 },
    ],
    [TIME_CYCLE[1]]: [
      { x: 520, y: 332, labelOffsetX: -34, labelOffsetY: 34, flashColor: 0xb97ad8 },
      { x: 598, y: 358, labelOffsetX: -34, labelOffsetY: 34, flashColor: 0x6cb5ff },
      { x: 676, y: 332, labelOffsetX: -34, labelOffsetY: 34, flashColor: 0x8bd676 },
      { x: 754, y: 358, labelOffsetX: -34, labelOffsetY: 34, flashColor: 0xffb870 },
    ],
    [TIME_CYCLE[2]]: [
      { x: 346, y: 438, labelOffsetX: -34, labelOffsetY: 34, flashColor: 0xb97ad8 },
      { x: 424, y: 464, labelOffsetX: -34, labelOffsetY: 34, flashColor: 0x6cb5ff },
      { x: 502, y: 438, labelOffsetX: -34, labelOffsetY: 34, flashColor: 0x8bd676 },
      { x: 580, y: 464, labelOffsetX: -34, labelOffsetY: 34, flashColor: 0xffb870 },
    ],
    [TIME_CYCLE[3]]: [
      { x: 688, y: 432, labelOffsetX: -34, labelOffsetY: 34, flashColor: 0xb97ad8 },
      { x: 762, y: 456, labelOffsetX: -34, labelOffsetY: 34, flashColor: 0x6cb5ff },
      { x: 836, y: 432, labelOffsetX: -34, labelOffsetY: 34, flashColor: 0x8bd676 },
      { x: 910, y: 456, labelOffsetX: -34, labelOffsetY: 34, flashColor: 0xffb870 },
    ],
  },
  world: {
    [TIME_CYCLE[0]]: [
      { x: 448, y: 246, labelOffsetX: -34, labelOffsetY: 34, flashColor: 0xb97ad8 },
      { x: 510, y: 272, labelOffsetX: -34, labelOffsetY: 34, flashColor: 0x6cb5ff },
      { x: 572, y: 246, labelOffsetX: -34, labelOffsetY: 34, flashColor: 0x8bd676 },
      { x: 634, y: 272, labelOffsetX: -34, labelOffsetY: 34, flashColor: 0xffb870 },
    ],
    [TIME_CYCLE[1]]: [
      { x: 452, y: 286, labelOffsetX: -34, labelOffsetY: 34, flashColor: 0xb97ad8 },
      { x: 514, y: 312, labelOffsetX: -34, labelOffsetY: 34, flashColor: 0x6cb5ff },
      { x: 576, y: 286, labelOffsetX: -34, labelOffsetY: 34, flashColor: 0x8bd676 },
      { x: 638, y: 312, labelOffsetX: -34, labelOffsetY: 34, flashColor: 0xffb870 },
    ],
    [TIME_CYCLE[2]]: [
      { x: 444, y: 332, labelOffsetX: -34, labelOffsetY: 34, flashColor: 0xb97ad8 },
      { x: 506, y: 356, labelOffsetX: -34, labelOffsetY: 34, flashColor: 0x6cb5ff },
      { x: 568, y: 332, labelOffsetX: -34, labelOffsetY: 34, flashColor: 0x8bd676 },
      { x: 630, y: 356, labelOffsetX: -34, labelOffsetY: 34, flashColor: 0xffb870 },
    ],
    [TIME_CYCLE[3]]: [
      { x: 438, y: 380, labelOffsetX: -34, labelOffsetY: 34, flashColor: 0xb97ad8 },
      { x: 500, y: 404, labelOffsetX: -34, labelOffsetY: 34, flashColor: 0x6cb5ff },
      { x: 562, y: 380, labelOffsetX: -34, labelOffsetY: 34, flashColor: 0x8bd676 },
      { x: 624, y: 404, labelOffsetX: -34, labelOffsetY: 34, flashColor: 0xffb870 },
    ],
  },
};

const AREA_TILESET_IMAGE_KEY = "map_tiles_full_asset";
const AREA_TILESET_MARGIN = 0;
const AREA_TMX_TEXT_KEYS: Record<AreaId, string> = {
  world: "map_tmx_world",
  downtown: "map_tmx_downtown",
  campus: "map_tmx_campus"
};

const AREA_COLLISION_LAYER_NAMES: Record<AreaId, string[]> = {
  world: ["root", "build"],
  downtown: ["tile layer 5(4)", "tile layer 3", "build(foul)"],
  campus: ["tile layer 4(2)", "tile layer 3"]
};

const AREA_INTERACTION_LAYER_NAMES: Record<AreaId, string[]> = {
  world: ["build"],
  downtown: ["build(total)"],
  campus: ["tile layer 2", "tile layer 4(2)"]
};

const AREA_FOREGROUND_LAYER_NAMES: Partial<Record<AreaId, string[]>> = {
  world: ["tree"],
  downtown: ["build(hide)"]
};

const FOREGROUND_TILE_LAYER_DEPTH = 31;

const EVENING_TIME_INDEX = 2;
const NIGHT_TIME_INDEX = 3;

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
  private areaNpcViews: AreaNpcView[] = [];
  private activeAreaNpcView: AreaNpcView | null = null;
  private scheduledNpcViews: AreaNpcView[] = [];
  private downtownBuildingViews: DowntownBuildingView[] = [];
  private worldMapRoot?: Phaser.GameObjects.Container;
  private worldForegroundRoot?: Phaser.GameObjects.Container;
  private downtownMapRoot?: Phaser.GameObjects.Container;
  private downtownForegroundRoot?: Phaser.GameObjects.Container;
  private campusMapRoot?: Phaser.GameObjects.Container;
  private campusForegroundRoot?: Phaser.GameObjects.Container;
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
  private plannerKey?: Phaser.Input.Keyboard.Key;
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
  private weeklyPlanActivityRoot?: Phaser.GameObjects.Container;
  private weeklyPlanActivityTimer?: Phaser.Time.TimerEvent;
  private weeklyPlanActivityOpen = false;
  private weeklyPlannerPopupOpen = false;
  private tooltipRoot?: Phaser.GameObjects.Container;
  private carriedItemRoot?: Phaser.GameObjects.Container;
  private carriedItem: InventoryItemStack | null = null;
  private carriedFromIndex: number | null = null;
  private pendingInventoryPickup?: { index: number; at: number; timer: Phaser.Time.TimerEvent };
  private actionPoint = 4;
  private readonly maxActionPoint = 4;
  private timeCycleIndex = 0;
  private dayCycleIndex = 0;
  private weeklyPlan: WeeklyPlanOptionId[] = createDefaultWeeklyPlan();
  private weeklyPlanWeek = 0;
  private lastAppliedWeeklyPlanSlotKey: string | null = null;
  private completedFixedEventIds: string[] = [];
  private activeFixedEventId: string | null = null;

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
  private runtimeDialogueScripts: Partial<Record<NpcDialogueId, NpcDialogueScript>> = {};

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
    preloadPlayerAvatarAssets(this);
    this.load.image("fixed-npc-myungjin", "assets/game/npc/myungjin.png");
    this.load.image("fixed-npc-jiwoo", "assets/game/npc/jiwoo.png");
    this.load.image("fixed-npc-yeonwoong", "assets/game/npc/yeonwoong.png");
    this.load.image("fixed-npc-hyoryeon", "assets/game/npc/hyoryeon.png");
    this.load.image("fixed-npc-jongmin", "assets/game/npc/jongmin.png");
    this.load.image("fixed-npc-sunmi", "assets/game/npc/sunmi-pro.png");
    this.load.image("fixed-npc-doyeon", "assets/game/npc/doyeon-pro.png");
    this.load.image("fixed-npc-hyunseok", "assets/game/npc/hyunseok-consultant.png");
    this.load.image(WEEKLY_PLAN_ACTIVITY_TEXTURE_KEYS.ui_practice, "assets/game/ui/UIpractice.png");
    this.load.image(WEEKLY_PLAN_ACTIVITY_TEXTURE_KEYS.rest_api_db, "assets/game/ui/DBconsult.png");
    this.load.image(WEEKLY_PLAN_ACTIVITY_TEXTURE_KEYS.team_project, "assets/game/ui/TeamPJT.png");
    this.load.image("shop-item-chocolate", "assets/game/ui/conv_items/chocolate.png");
    this.load.image("shop-item-ramen", "assets/game/ui/conv_items/ramen.png");
    this.load.image("shop-item-dosirak", "assets/game/ui/conv_items/dosirak.png");
    this.load.image("shop-item-energy-drink", "assets/game/ui/conv_items/energy_drink.png");
    this.load.image("shop-item-snack", "assets/game/ui/conv_items/snack.png");
    this.load.image("shop-item-cigarette", "assets/game/ui/conv_items/cigarette.png");
    this.load.image("shop-item-soju", "assets/game/ui/conv_items/soju.png");
    this.load.image("shop-item-keyboard", "assets/game/ui/conv_items/keyboard.png");
    this.load.image("shop-item-mouse", "assets/game/ui/conv_items/mouse.png");

  }

  create(): void {
    this.cameras.main.setBackgroundColor("#3e7d4a");
    this.cameras.main.roundPixels = true;
    this.physics.world.setBounds(0, 0, GAME_CONSTANTS.WIDTH, GAME_CONSTANTS.HEIGHT);

    this.buildAreaMaps();
    this.createAreaNpcViews();
    this.createScheduledNpcViews();

    this.playerAvatar = this.getSelectedPlayerAvatar();
    this.createPlayerAvatar();

    this.inputManager = new InputManager(this);
    this.escapeKey = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
    this.interactKey = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.E);
    this.mapKey = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.Q);
    this.plannerKey = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.P);
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

    this.time.delayedCall(120, () => {
      this.maybeOpenWeeklyPlanner();
      this.maybeStartWeeklyPlanActivity();
    });

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
      this.weeklyPlanActivityTimer?.destroy();
      this.weeklyPlanActivityRoot?.destroy();
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

    if (this.weeklyPlanActivityOpen) {
      this.player.setVelocity(0, 0);
      this.updatePlayerAvatarAnimation({ x: 0, y: 0 });
      this.hud.setInteractionPrompt(null);
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
      this.hud.setInteractionPrompt("E / ESC로 닫기");
      return;
    }

    if (this.placePopupOpen) {
      this.player.setVelocity(0, 0);
      this.updatePlayerAvatarAnimation({ x: 0, y: 0 });
      if (this.interactKey && Phaser.Input.Keyboard.JustDown(this.interactKey)) {
        this.closePlacePopup();
        return;
      }
      this.hud.setInteractionPrompt("E로 닫기");
      return;
    }

    if (!this.endingFlowStarted && this.plannerKey && Phaser.Input.Keyboard.JustDown(this.plannerKey)) {
      this.openWeeklyPlannerPopup();
      return;
    }

    if (this.maybeStartFixedEvent()) {
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
      const nearbyNpcView = this.getNearestAreaNpcView(this.currentArea, 74);
      this.refreshAreaNpcHighlight(nearbyNpcView);
      const nearbyPlace = this.getNearestWorldPlace(74);
      this.highlightWorldPlace(nearbyPlace?.id ?? null);
      this.hud.setInteractionPrompt(
        nearbyNpcView
          ? this.withPlannerPrompt("E 대화하기  |  WASD / Arrow 이동  |  ESC 메뉴")
          : nearbyPlace
            ? this.withPlannerPrompt("E 장소 이동/상호작용  |  WASD / Arrow 이동  |  ESC 메뉴")
            : this.withPlannerPrompt("WASD / Arrow 이동  |  ESC 메뉴")
      );
      if (nearbyNpcView && this.interactKey && Phaser.Input.Keyboard.JustDown(this.interactKey)) {
        this.handleNpcInteraction(nearbyNpcView);
      } else if (nearbyPlace && this.interactKey && Phaser.Input.Keyboard.JustDown(this.interactKey)) {
        this.handleWorldPlaceInteraction(nearbyPlace);
      }
      this.enforceAreaCollision();
      return;
    }

    this.highlightWorldPlace(null);
    this.player.setVelocity(move.x * GAME_CONSTANTS.PLAYER_SPEED, move.y * GAME_CONSTANTS.PLAYER_SPEED);
    this.updatePlayerAvatarAnimation(move);

    const nearbyNpcView = this.getNearestAreaNpcView(this.currentArea, 74);
    const nearbyDowntownBuilding = this.currentArea === "downtown" ? this.getNearestDowntownBuilding(96) : null;
    this.refreshAreaNpcHighlight(nearbyNpcView);
    this.refreshDowntownBuildingHighlight(nearbyDowntownBuilding);
    const prompt = nearbyNpcView
      ? "E \uB300\uD654\uD558\uAE30  |  Q \uC804\uCCB4 \uC9C0\uB3C4"
      : nearbyDowntownBuilding
        ? "E \uAC74\uBB3C \uC0C1\uD638\uC791\uC6A9  |  Q \uC804\uCCB4 \uC9C0\uB3C4"
        : "Q \uC804\uCCB4 \uC9C0\uB3C4";
    this.hud.setInteractionPrompt(this.withPlannerPrompt(prompt));

    if (nearbyNpcView && this.interactKey && Phaser.Input.Keyboard.JustDown(this.interactKey)) {
      this.handleNpcInteraction(nearbyNpcView);
    } else if (nearbyDowntownBuilding && this.interactKey && Phaser.Input.Keyboard.JustDown(this.interactKey)) {
      this.openDowntownBuildingPopup(nearbyDowntownBuilding);
    }

    this.enforceAreaCollision();
  }

  private buildAreaMaps(): void {
    const worldRoot = this.add.container(0, 0);
    worldRoot.setDepth(0);
    const worldForegroundRoot = this.add.container(0, 0);
    worldForegroundRoot.setDepth(FOREGROUND_TILE_LAYER_DEPTH);
    const worldObjects: Phaser.GameObjects.GameObject[] = [];
    const worldTmxBounds = this.buildAreaTmxBackground(worldRoot, worldForegroundRoot, "world", AREA_TMX_TEXT_KEYS.world);
    const worldUsesTmx = Boolean(worldTmxBounds);
    const worldTmxText = worldTmxBounds ? this.cache.text.get(AREA_TMX_TEXT_KEYS.world) : "";
    this.areaCollisionConfigs.world = worldTmxBounds
      ? buildAreaCollisionConfigFromTmxText(
          typeof worldTmxText === "string" ? worldTmxText : "",
          worldTmxBounds,
          AREA_COLLISION_LAYER_NAMES.world
        ) ?? undefined
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
      ? buildInteractionZonesFromTmxText(
          typeof worldTmxText === "string" ? worldTmxText : "",
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
      const mapped = mapPointToAreaBounds(place.x, place.y, worldTmxBounds, (value) => this.px(value));
      const zone = tmxWorldZones?.[place.id];
      const mappedZoneSize = zone
        ? { width: zone.width, height: zone.height }
        : mapSizeToAreaBounds(place.zoneWidth, place.zoneHeight, worldTmxBounds, (value) => this.px(value));
      const zoneCenter = zone ? { x: zone.centerX, y: zone.centerY } : mapped;
      const markerSize = mapSizeToAreaBounds(40, 28, worldTmxBounds, (value) => this.px(value));
      const marker = this.add.rectangle(zoneCenter.x, zoneCenter.y, markerSize.width, markerSize.height, place.movable ? 0xe7d593 : 0xc9a67f, 1);
      marker.setStrokeStyle(2, 0x5d4426, 1);
      marker.setVisible(false);

      const mappedLabel = zone
        ? { x: zone.centerX, y: zone.centerY + mappedZoneSize.height / 2 + 8 }
        : mapPointToAreaBounds(place.x, place.y + 28, worldTmxBounds, (value) => this.px(value));
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
    this.worldForegroundRoot = worldForegroundRoot;

    const downtownRoot = this.add.container(0, 0);
    downtownRoot.setDepth(0);
    const downtownForegroundRoot = this.add.container(0, 0);
    downtownForegroundRoot.setDepth(FOREGROUND_TILE_LAYER_DEPTH);
    const downtownTmxBounds = this.buildAreaTmxBackground(downtownRoot, downtownForegroundRoot, "downtown", AREA_TMX_TEXT_KEYS.downtown);
    const downtownUsesTmx = Boolean(downtownTmxBounds);
    const downtownTmxText = downtownTmxBounds ? this.cache.text.get(AREA_TMX_TEXT_KEYS.downtown) : "";
    this.areaCollisionConfigs.downtown = downtownTmxBounds
      ? buildAreaCollisionConfigFromTmxText(
          typeof downtownTmxText === "string" ? downtownTmxText : "",
          downtownTmxBounds,
          AREA_COLLISION_LAYER_NAMES.downtown
        ) ?? undefined
      : undefined;
    const downtownZones = downtownTmxBounds
      ? buildInteractionZonesFromTmxText(
          typeof downtownTmxText === "string" ? downtownTmxText : "",
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
        : mapPointToAreaBounds(building.x, building.y, downtownTmxBounds, (value) => this.px(value));
      const mappedSize = zone
        ? { width: zone.width, height: zone.height }
        : mapSizeToAreaBounds(building.w, building.h, downtownTmxBounds, (value) => this.px(value));

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
      this.downtownBuildingViews.push({
        id: building.id,
        hitBox,
        left: mappedCenter.x - mappedSize.width / 2,
        right: mappedCenter.x + mappedSize.width / 2,
        top: mappedCenter.y - mappedSize.height / 2,
        bottom: mappedCenter.y + mappedSize.height / 2,
        defaultStrokeColor: downtownUsesTmx ? 0x6d522f : 0x6d522f,
        defaultStrokeAlpha: downtownUsesTmx ? 0 : 1
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
    this.downtownForegroundRoot = downtownForegroundRoot;

    const campusRoot = this.add.container(0, 0);
    campusRoot.setDepth(0);
    const campusForegroundRoot = this.add.container(0, 0);
    campusForegroundRoot.setDepth(FOREGROUND_TILE_LAYER_DEPTH);
    const campusTmxBounds = this.buildAreaTmxBackground(campusRoot, campusForegroundRoot, "campus", AREA_TMX_TEXT_KEYS.campus);
    const campusUsesTmx = Boolean(campusTmxBounds);
    const campusTmxText = campusTmxBounds ? this.cache.text.get(AREA_TMX_TEXT_KEYS.campus) : "";
    this.areaCollisionConfigs.campus = campusTmxBounds
      ? buildAreaCollisionConfigFromTmxText(
          typeof campusTmxText === "string" ? campusTmxText : "",
          campusTmxBounds,
          AREA_COLLISION_LAYER_NAMES.campus
        ) ?? undefined
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
    this.campusForegroundRoot = campusForegroundRoot;
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

    this.playerVisual = buildPlayerVisual(this, x, y, this.playerAvatar);
    this.syncPlayerAvatarVisuals();
    this.updatePlayerAvatarAnimation({ x: 0, y: 0 });
  }

  private syncPlayerAvatarVisuals(): void {
    syncPlayerAvatarVisualsFn(this.player, this.playerVisual);
  }

  private updatePlayerAvatarAnimation(move: { x: number; y: number }): void {
    this.playerFacing = updatePlayerAvatarAnimationFn({
      visual: this.playerVisual,
      avatar: this.playerAvatar,
      currentFacing: this.playerFacing,
      move,
      timeNow: this.time.now
    });
  }

  private buildAreaTmxBackground(
    root: Phaser.GameObjects.Container,
    foregroundRoot: Phaser.GameObjects.Container,
    areaId: AreaId,
    textKey: string
  ): AreaRenderBounds {
    const tmxText = this.cache.text.get(textKey);
    if (typeof tmxText !== "string" || tmxText.length === 0) {
      return null;
    }
    if (!this.textures.exists(AREA_TILESET_IMAGE_KEY)) {
      return null;
    }

    const parsed = parseTmxMap(tmxText);
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
    const foregroundLayerNames = new Set(
      (AREA_FOREGROUND_LAYER_NAMES[areaId] ?? []).map((name) => name.toLowerCase())
    );

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
            AREA_TILESET_MARGIN,
            0,
            tileset.firstgid
          )
        )
        .filter((tileset): tileset is Phaser.Tilemaps.Tileset => Boolean(tileset));

      if (tilesets.length === 0) {
        const fallbackTileset = map.addTilesetImage(
          `${textKey}_tileset_fallback`,
          AREA_TILESET_IMAGE_KEY,
          parsed.tileWidth,
          parsed.tileHeight,
          AREA_TILESET_MARGIN,
          0,
          1
        );
        if (fallbackTileset) {
          tilesets.push(fallbackTileset);
        }
      }

      const tileLayer = map.createLayer(0, tilesets, 0, 0);
      if (!tileLayer) {
        return;
      }
      const isForegroundLayer = foregroundLayerNames.has(layer.name.toLowerCase());
      tileLayer.setPosition(offsetX, offsetY);
      tileLayer.setScale(scale);
      tileLayer.setDepth(layerIndex);
      (isForegroundLayer ? foregroundRoot : root).add(tileLayer);
    });

    return renderedBounds;
  }

  private enforceAreaCollision(): void {
    const playerBody = this.player.body;
    if (!playerBody?.enable || this.currentArea === "world" && !this.worldMapRoot?.visible) return;
    if (this.menuOpen || this.dialogueOpen || this.placePopupOpen || this.shopOpen) return;
    const x = this.player.x;
    const y = this.player.y;
    if (!isBlockedByAreaCollision(this.areaCollisionConfigs[this.currentArea], x, y)) {
      this.lastSafePlayerPosition = { x, y };
      return;
    }
    if (!this.lastSafePlayerPosition) return;
    this.player.setPosition(this.lastSafePlayerPosition.x, this.lastSafePlayerPosition.y);
    this.player.setVelocity(0, 0);
  }

  private enterArea(area: AreaId, worldPlace: WorldPlaceId = this.lastSelectedWorldPlace): void {
    this.currentArea = area;
    this.closeShop();
    this.closeDialogue();
    this.closePlacePopup();
    this.player.setVelocity(0, 0);

    this.worldMapRoot?.setVisible(area === "world");
    this.worldForegroundRoot?.setVisible(area === "world");
    this.downtownMapRoot?.setVisible(area === "downtown");
    this.downtownForegroundRoot?.setVisible(area === "downtown");
    this.campusMapRoot?.setVisible(area === "campus");
    this.campusForegroundRoot?.setVisible(area === "campus");

    if (area === "world") {
      const spawnFrom = WORLD_PLACE_NODES.find((node) => node.id === worldPlace) ?? WORLD_PLACE_NODES[1];
      this.lastSelectedWorldPlace = spawnFrom.id;
      this.player.setVisible(true);
      const worldBody = this.player.body;
      if (worldBody) worldBody.enable = true;
      const worldSpawn = this.buildWorldSpawnPoint(spawnFrom.id, spawnFrom.x, spawnFrom.y + 52);
      this.player.setPosition(worldSpawn.x, worldSpawn.y);
      this.highlightWorldPlace(spawnFrom.id);
      this.refreshAreaNpcVisibility(area);
      this.refreshAreaNpcHighlight(null);
      this.refreshDowntownBuildingHighlight(null);
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
    const resolvedSpawn = findNearestWalkablePoint(this.areaCollisionConfigs[area], spawn.x, spawn.y, (value) => this.px(value));
    this.player.setPosition(resolvedSpawn.x, resolvedSpawn.y);
    this.highlightWorldPlace(null);
    this.controlHintText?.setText("WASD / Arrow: \uC774\uB3D9  |  E: \uC0C1\uD638\uC791\uC6A9  |  Q: \uC804\uCCB4 \uC9C0\uB3C4  |  ESC: \uBA54\uB274");
    this.updateHudState({ locationLabel: AREA_LABEL[area] });
    this.lastSafePlayerPosition = { x: this.player.x, y: this.player.y };
    this.refreshAreaNpcVisibility(area);
    this.refreshAreaNpcHighlight(null);
    this.refreshDowntownBuildingHighlight(null);
  }

  private buildWorldSpawnPoint(placeId: WorldPlaceId, fallbackX: number, fallbackY: number): { x: number; y: number } {
    const zone = this.worldPlaceInteractionZones[placeId];
    if (zone) {
      const centerX = zone.centerX;
      const belowZoneY = zone.bottom + this.px(28);
      return findNearestWalkablePoint(this.areaCollisionConfigs.world, centerX, belowZoneY, (value) => this.px(value));
    }

    return findNearestWalkablePoint(this.areaCollisionConfigs.world, this.px(fallbackX), this.px(fallbackY), (value) => this.px(value));
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

  private getAreaRoot(area: Exclude<AreaId, "world">): Phaser.GameObjects.Container | undefined {
    if (area === "downtown") return this.downtownMapRoot;
    return this.campusMapRoot;
  }

  private createAreaNpcViews(): void {
    (Object.entries(AREA_NPC_CONFIGS) as Array<[Exclude<AreaId, "world">, AreaNpcConfig[]]>).forEach(([area, configs]) => {
      const root = this.getAreaRoot(area);
      if (!root) return;

      configs.forEach((config) => {
        const script = this.getDialogueScript(config.dialogueId);
        let marker: Phaser.GameObjects.Shape | Phaser.GameObjects.Sprite;

        if (config.textureKey) {
          const sprite = this.add.sprite(config.x, config.y, config.textureKey);
          sprite.setScale(2); // 에셋 크기에 따라 조정 필요할 수 있음
          marker = sprite;
        } else {
          const rect = this.add.rectangle(config.x, config.y, 28, 34, 0x6e4f2b, 1);
          rect.setStrokeStyle(2, 0x4b351b, 1);
          marker = rect;
        }

        const label = this.add.text(
          this.px(config.x + config.labelOffsetX),
          this.px(config.y + config.labelOffsetY),
          script?.npcLabel ?? "NPC",
          {
            fontFamily: this.uiFontFamily,
            color: "#f6e6c8",
            fontSize: "14px",
            resolution: 2
          }
        );
        label.setVisible(true);
        root.add([marker, label]);
        this.areaNpcViews.push({ area, config, marker, label });
      });
    });
  }

  private createScheduledNpcViews(): void {
    (["campus", "downtown", "world"] as const).forEach((area) => {
      const root = area === "world" ? this.worldMapRoot : this.getAreaRoot(area);
      if (!root) return;

      const defaultSlots = getDefaultFixedEventNpcSlotsForArea(area, TIME_CYCLE[0]);
      defaultSlots.forEach((position, index) => {
        const marker = this.add.rectangle(position.x, position.y, 34, 42, 0x6e4f2b, 0.15);
        marker.setStrokeStyle(2, 0x4b351b, 1);
        marker.setVisible(false);

        const portrait = this.add.image(position.x, position.y - 6, "fixed-npc-myungjin");
        portrait.setScale(1.6);
        portrait.setVisible(false);

        const label = this.add.text(
          this.px(position.x + position.labelOffsetX),
          this.px(position.y + position.labelOffsetY),
          "",
          {
            fontFamily: this.uiFontFamily,
            color: "#f6e6c8",
            fontSize: "14px",
            resolution: 2
          }
        );
        label.setVisible(false);
        root.add([marker, portrait, label]);
        this.scheduledNpcViews.push({
          area,
          config: {
            dialogueId: "fixed_event_runtime",
            x: position.x,
            y: position.y,
            labelOffsetX: position.labelOffsetX,
            labelOffsetY: position.labelOffsetY,
            flashColor: position.flashColor
          },
          marker,
          portrait,
          label,
          isScheduled: true,
          eventId: `scheduled-slot-${area}-${index}`
        });
      });
    });
    this.refreshScheduledNpcViews();
  }

  private getDialogueScript(dialogueId: NpcDialogueId): NpcDialogueScript | null {
    if (this.runtimeDialogueScripts[dialogueId]) {
      return this.runtimeDialogueScripts[dialogueId] ?? null;
    }

    if (dialogueId === "campus_script_npc") {
      const rawJson = this.getFixedEventDataForWeek(this.hudState.week);
      const jsonScript = buildDialogueScriptFromFixedEventJson(dialogueId, rawJson, "스크립트 NPC", this.getPlayerName());
      if (jsonScript) {
        this.runtimeDialogueScripts[dialogueId] = jsonScript;
        return jsonScript;
      }
    }

    return NPC_DIALOGUE_SCRIPTS[dialogueId] ?? null;
  }

  private getPlayerName(): string {
    const raw = this.registry.get("playerData") as { name?: string } | undefined;
    const name = typeof raw?.name === "string" ? raw.name.trim() : "";
    return name.length > 0 ? name : "플레이어";
  }

  private getFixedEventCacheKey(week: number): string {
    const clampedWeek = Phaser.Math.Clamp(Math.round(week), 1, 4);
    return `story_fixed_week${clampedWeek}`;
  }

  private getFixedEventDataForWeek(week: number): unknown {
    return this.cache.json.get(this.getFixedEventCacheKey(week));
  }

  private maybeStartFixedEvent(): boolean {
    if (this.dialogueOpen || this.menuOpen || this.shopOpen || this.placePopupOpen || this.weeklyPlanActivityOpen || this.weeklyPlannerPopupOpen || this.endingFlowStarted) {
      return false;
    }

    const matchingEvent = this.getCurrentFixedEventEntry();
    if (!matchingEvent) {
      return false;
    }

    if (getFixedEventPresentNpcs(matchingEvent).length > 0) {
      return false;
    }

    return this.startCurrentFixedEventDialogue(matchingEvent);
  }

  private getCurrentFixedEventEntry(): ReturnType<typeof findMatchingFixedEvent> {
    const currentLocation = resolveCurrentFixedEventLocation(this.currentArea, this.lastSelectedWorldPlace);
    return findMatchingFixedEvent(
      this.getFixedEventDataForWeek(this.hudState.week),
      {
        week: this.hudState.week,
        day: this.dayCycleIndex + 1,
        timeOfDay: this.hudState.timeLabel,
        location: currentLocation
      },
      this.completedFixedEventIds
    );
  }

  private refreshScheduledNpcViews(): void {
    const event = this.getCurrentFixedEventEntry();
    const currentLocation = resolveCurrentFixedEventLocation(this.currentArea, this.lastSelectedWorldPlace);
    const presentation = buildFixedEventNpcPresentation(event, {
      currentLocation,
      timeOfDay: this.hudState.timeLabel
    });

    this.scheduledNpcViews.forEach((view, index) => {
      const fallbackSlot = getDefaultFixedEventNpcSlotsForArea(view.area, this.hudState.timeLabel)[index];
      const participant = presentation?.renderArea === view.area ? presentation.participants[index] : undefined;
      const slot = participant?.slot ?? fallbackSlot;
      const visible = Boolean(participant && slot);

      if (slot) {
        view.config.x = slot.x;
        view.config.y = slot.y;
        view.config.labelOffsetX = slot.labelOffsetX;
        view.config.labelOffsetY = slot.labelOffsetY;
        view.config.flashColor = slot.flashColor;
        view.marker.setPosition(slot.x, slot.y);
        view.label.setPosition(this.px(slot.x + slot.labelOffsetX), this.px(slot.y + slot.labelOffsetY));
        view.portrait?.setPosition(slot.x, slot.y - 6);
      }

      view.eventId = visible ? presentation?.eventId : undefined;
      view.marker.setVisible(visible && this.currentArea === view.area);
      view.label.setVisible(visible && this.currentArea === view.area);
      view.portrait?.setVisible(visible && this.currentArea === view.area);
      if (!visible || !participant) {
        return;
      }

      view.label.setText(participant.label);
      view.portrait?.setTexture(participant.textureKey);
      view.portrait?.setScale(1.6);
    });
  }

  private startCurrentFixedEventDialogue(event: ReturnType<typeof findMatchingFixedEvent>): boolean {
    if (!event) return false;
    const runtimeScript = buildDialogueScriptFromFixedEventEntry("fixed_event_runtime", event, {
      fallbackNpcLabel: "이벤트",
      playerName: this.getPlayerName()
    });
    if (!runtimeScript) return false;
    this.runtimeDialogueScripts.fixed_event_runtime = runtimeScript;
    this.activeFixedEventId = typeof event.eventId === "string" ? event.eventId : null;
    this.startNpcDialogue("fixed_event_runtime");
    return true;
  }

  private refreshAreaNpcVisibility(area: AreaId): void {
    this.areaNpcViews.forEach((view) => {
      const visible = area !== "world" && view.area === area;
      view.marker.setVisible(visible);
      view.label.setVisible(visible);
      view.portrait?.setVisible(visible);
      if (visible) {
        if (view.marker instanceof Phaser.GameObjects.Shape) {
          view.marker.setFillStyle(0x6e4f2b, 1);
          view.marker.setStrokeStyle(2, 0x4b351b, 1);
        } else if (view.marker instanceof Phaser.GameObjects.Sprite) {
          view.marker.clearTint();
        }
      }
    });
    this.refreshScheduledNpcViews();
  }

  private getNearestDowntownBuilding(maxDistance: number): DowntownBuildingId | null {
    return findNearestDowntownBuilding(
      this.downtownBuildingViews.map((view) => ({
        id: view.id,
        left: view.left,
        right: view.right,
        top: view.top,
        bottom: view.bottom
      })),
      this.player.x,
      this.player.y,
      maxDistance
    );
  }

  private refreshDowntownBuildingHighlight(activeId: DowntownBuildingId | null): void {
    this.downtownBuildingViews.forEach((view) => {
      const isActive = activeId === view.id && this.currentArea === "downtown";
      view.hitBox.setStrokeStyle(
        isActive ? 4 : 3,
        isActive ? 0xf2e8b6 : view.defaultStrokeColor,
        isActive ? 1 : view.defaultStrokeAlpha
      );
    });
  }

  private getNearestAreaNpcView(area: AreaId, maxDistance: number): AreaNpcView | null {
    let nearestView: AreaNpcView | null = null;
    let nearestDistance = Number.POSITIVE_INFINITY;

    [...this.areaNpcViews, ...this.scheduledNpcViews].forEach((view) => {
      if (view.area !== area || !view.marker.visible) return;
      const distance = Phaser.Math.Distance.Between(this.player.x, this.player.y, view.config.x, view.config.y);
      if (distance <= maxDistance && distance < nearestDistance) {
        nearestView = view;
        nearestDistance = distance;
      }
    });

    return nearestView;
  }

  private refreshAreaNpcHighlight(activeView: AreaNpcView | null): void {
    this.activeAreaNpcView = activeView;
    [...this.areaNpcViews, ...this.scheduledNpcViews].forEach((view) => {
      const isActive = activeView?.config.dialogueId === view.config.dialogueId && activeView.area === view.area;
      if (view.marker instanceof Phaser.GameObjects.Shape) {
        view.marker.setFillStyle(isActive ? view.config.flashColor : 0x6e4f2b, 1);
        view.marker.setStrokeStyle(2, isActive ? 0xf2e8b6 : 0x4b351b, 1);
      } else if (view.marker instanceof Phaser.GameObjects.Sprite) {
        if (isActive) {
          view.marker.setTint(view.config.flashColor);
        } else {
          view.marker.clearTint();
        }
      }
      view.label.setColor(isActive ? "#fff6d0" : "#f6e6c8");
      view.portrait?.setScale(isActive ? 1.72 : 1.6);
    });
  }

  private isNightTime(): boolean {
    return this.timeCycleIndex === NIGHT_TIME_INDEX;
  }

  private isEveningOrNight(): boolean {
    return this.timeCycleIndex === EVENING_TIME_INDEX || this.timeCycleIndex === NIGHT_TIME_INDEX;
  }

  private getPlaceUnavailableMessage(placeId: WorldPlaceId): { title: string; description: string } | null {
    if (placeId === "cafe" && this.isNightTime()) {
      return {
        title: "영업 종료",
        description: "지금은 이용할 수 없습니다.\n밤에는 카페를 이용할 수 없습니다."
      };
    }

    return null;
  }

  private getDowntownBuildingUnavailableMessage(
    buildingId: DowntownBuildingId
  ): { title: string; description: string } | null {
    const config = getDowntownBuildingConfig(buildingId);

    if (buildingId === "hof" && !this.isEveningOrNight()) {
      return {
        title: config.title,
        description: "지금은 이용할 수 없습니다.\n호프는 저녁과 밤에만 이용할 수 있습니다."
      };
    }

    if (this.isNightTime() && (buildingId === "gym" || buildingId === "ramenthings" || buildingId === "lottery")) {
      return {
        title: config.title,
        description: "지금은 이용할 수 없습니다.\n밤에는 해당 장소를 이용할 수 없습니다."
      };
    }

    return null;
  }

  private openUnavailablePlacePopup(title: string, description: string, backgroundKey: string | null): void {
    this.closePlacePopup();
    const backgroundImage = this.createPlaceBackgroundImage(backgroundKey);
    this.placePopupRoot = createPlaceActionModal({
      scene: this,
      width: 500,
      height: 270,
      title,
      description,
      actionText: "확인",
      showCloseButton: false,
      backgroundImage,
      getBodyStyle: this.getBodyStyle.bind(this),
      createActionButton: this.createActionButton.bind(this),
      uiPanelInnerBorderColor: this.uiPanelInnerBorderColor,
      uiPanelOuterBorderColor: this.uiPanelOuterBorderColor,
      onAction: () => this.closePlacePopup(),
      onClose: () => this.closePlacePopup()
    });
    this.placePopupRoot.setDepth(920);
    this.placePopupOpen = true;
  }

  private openPlacePopup(placeId: WorldPlaceId): void {
    if (placeId === "home") {
      this.openHomeActionPopup();
      return;
    }
    if (placeId !== "cafe" && placeId !== "store") {
      return;
    }

    const unavailable = this.getPlaceUnavailableMessage(placeId);
    if (unavailable) {
      this.openUnavailablePlacePopup(unavailable.title, unavailable.description, getPlaceBackgroundTextureKey(placeId));
      return;
    }

    this.closePlacePopup();

    const centerX = this.px(GAME_CONSTANTS.WIDTH / 2);
    const centerY = this.px(GAME_CONSTANTS.HEIGHT / 2);
    const placeBackgroundKey = getPlaceBackgroundTextureKey(placeId);
    const placeBackgroundImage =
      placeBackgroundKey && this.textures.exists(placeBackgroundKey)
        ? this.add.image(centerX, centerY, placeBackgroundKey).setDisplaySize(GAME_CONSTANTS.WIDTH, GAME_CONSTANTS.HEIGHT)
        : null;
    const content =
      placeId === "cafe" || placeId === "store"
        ? getPlacePopupContent(placeId)
        : getDowntownBuildingConfig(placeId as DowntownBuildingId);
    this.placePopupRoot = createPlaceActionModal({
      scene: this,
      width: 530,
      height: 290,
      title: content.title,
      description: content.description,
      actionText: content.actionText ?? "이용하기",
      backgroundImage: placeBackgroundImage,
      getBodyStyle: this.getBodyStyle.bind(this),
      createActionButton: this.createActionButton.bind(this),
      uiPanelInnerBorderColor: this.uiPanelInnerBorderColor,
      uiPanelOuterBorderColor: this.uiPanelOuterBorderColor,
      onAction: () => this.usePlaceFeature(placeId),
      onClose: () => this.closePlacePopup()
    });
    if (this.placePopupRoot) {
      this.placePopupRoot.setDepth(920);
    }
    this.placePopupOpen = true;
  }

  private createPlaceBackgroundImage(textureKey: string | null): Phaser.GameObjects.Image | null {
    if (!textureKey || !this.textures.exists(textureKey)) return null;
    return this.add
      .image(this.px(GAME_CONSTANTS.WIDTH / 2), this.px(GAME_CONSTANTS.HEIGHT / 2), textureKey)
      .setDisplaySize(GAME_CONSTANTS.WIDTH, GAME_CONSTANTS.HEIGHT);
  }

  private createTextureImage(textureKey: string | null): Phaser.GameObjects.Image | null {
    if (!textureKey || !this.textures.exists(textureKey)) return null;
    return this.add.image(this.px(GAME_CONSTANTS.WIDTH / 2), this.px(GAME_CONSTANTS.HEIGHT / 2), textureKey);
  }

  private applyItemIconImage(
    image: Phaser.GameObjects.Image,
    template: InventoryItemTemplate,
    maxWidth: number,
    maxHeight: number
  ): boolean {
    if (!template.iconKey || !this.textures.exists(template.iconKey)) {
      image.setVisible(false);
      return false;
    }

    image.setTexture(template.iconKey);
    const frameWidth = Math.max(1, image.width);
    const frameHeight = Math.max(1, image.height);
    const scale = Math.min(maxWidth / frameWidth, maxHeight / frameHeight);
    image.setScale(scale);
    image.setTint(0xffffff);
    image.setVisible(true);
    return true;
  }

  private closePlacePopup(): void {
    if (this.weeklyPlannerPopupOpen) {
      this.weeklyPlannerPopupOpen = false;
      this.hud.setStatusPanelsVisible(true);
    }
    this.placePopupOpen = false;
    this.placePopupRoot?.destroy(true);
    this.placePopupRoot = undefined;
  }

  private usePlaceFeature(placeId: WorldPlaceId): void {
    if (placeId !== "cafe" && placeId !== "store") {
      return;
    }
    const unavailable = this.getPlaceUnavailableMessage(placeId);
    if (unavailable) {
      this.openUnavailablePlacePopup(unavailable.title, unavailable.description, getPlaceBackgroundTextureKey(placeId));
      return;
    }
    const result = resolvePlaceAction(placeId);
    if (result.kind === "cafe") {
      const cost = result.cost;
      if (this.hudState.money < cost) {
        this.showSystemToast("돈이 부족합니다");
        return;
      }
      if (!this.spendActionPoint()) {
        return;
      }

      const nextHp = Phaser.Math.Clamp(this.hudState.hp + result.hpDelta, 0, this.hudState.hpMax);
      const nextStress = Phaser.Math.Clamp(this.hudState.stress + result.stressDelta, 0, 100);
      this.closePlacePopup();
      this.showSystemToast(result.toastMessage);
      return;
    }

    this.closePlacePopup();
    this.openShop(getPlaceBackgroundTextureKey("store"));
    this.showSystemToast(result.toastMessage);
  }

  private openHomeActionPopup(): void {
    this.closePlacePopup();
    const homeBackgroundImage = this.createPlaceBackgroundImage(getPlaceBackgroundTextureKey("home"));
    this.placePopupRoot = createHomeActionModal({
      scene: this,
      actionPoint: this.actionPoint,
      maxActionPoint: this.maxActionPoint,
      backgroundImage: homeBackgroundImage,
      getBodyStyle: this.getBodyStyle.bind(this),
      createActionButton: this.createActionButton.bind(this),
      uiPanelInnerBorderColor: this.uiPanelInnerBorderColor,
      uiPanelOuterBorderColor: this.uiPanelOuterBorderColor,
      onAction: (action) => this.useHomeAction(action),
      onClose: () => this.closePlacePopup(),
    });
    this.placePopupRoot.setDepth(920);
    this.placePopupOpen = true;
  }

  private useHomeAction(action: HomeActionId): void {
    if (!this.spendActionPointAfter(() => this.openHomeActionPopup())) {
      return;
    }

    const result = resolveHomeAction(action);
    const nextHp = Phaser.Math.Clamp(this.hudState.hp + result.hpDelta, 0, this.hudState.hpMax);
    const nextStress = Phaser.Math.Clamp(this.hudState.stress + result.stressDelta, 0, 100);
    this.applyStatDelta(result.statDelta);
    this.updateHudState({ hp: nextHp, stress: nextStress });
    this.showSystemToast(result.toastMessage);
    this.closePlacePopup();
  }

  private getCurrentWeeklyPlanSlotKey(): string | null {
    return getCurrentWeeklyPlanSlotKey(this.hudState.week, this.dayCycleIndex, this.timeCycleIndex);
  }

  private applyWeeklyPlanForCurrentSlot(): WeeklyPlanOption | null {
    if (this.weeklyPlanWeek < this.hudState.week) return null;
    const slotKey = this.getCurrentWeeklyPlanSlotKey();
    if (!slotKey || this.lastAppliedWeeklyPlanSlotKey === slotKey) return null;

    const slotIndex = getWeeklyPlanSlotIndex(this.dayCycleIndex, this.timeCycleIndex);
    const option = getWeeklyPlanOption(this.weeklyPlan[slotIndex] ?? WEEKLY_PLAN_OPTIONS[0].id);
    this.applyStatDelta(option.statDelta);
    this.lastAppliedWeeklyPlanSlotKey = slotKey;
    return option;
  }

  private closeWeeklyPlanActivity(): void {
    this.weeklyPlanActivityOpen = false;
    this.weeklyPlanActivityTimer?.destroy();
    this.weeklyPlanActivityTimer = undefined;
    this.weeklyPlanActivityRoot?.destroy(true);
    this.weeklyPlanActivityRoot = undefined;
  }

  private maybeStartWeeklyPlanActivity(onSettled?: () => void): boolean {
    if (this.weeklyPlanActivityOpen || this.weeklyPlanWeek < this.hudState.week) {
      return false;
    }
    if (this.getCurrentFixedEventSlotName()) {
      return false;
    }

    const slotKey = this.getCurrentWeeklyPlanSlotKey();
    if (!slotKey || this.lastAppliedWeeklyPlanSlotKey === slotKey) {
      return false;
    }

    const slotIndex = getWeeklyPlanSlotIndex(this.dayCycleIndex, this.timeCycleIndex);
    const option = getWeeklyPlanOption(this.weeklyPlan[slotIndex] ?? WEEKLY_PLAN_OPTIONS[0].id);
    const backgroundImage = this.createTextureImage(WEEKLY_PLAN_ACTIVITY_TEXTURE_KEYS[option.id]);
    const title = `${DAY_CYCLE[this.dayCycleIndex]} ${TIME_CYCLE[this.timeCycleIndex]}`;
    this.closeWeeklyPlanActivity();
    this.weeklyPlanActivityRoot = createWeeklyPlanActivityModal(this, {
      title,
      statusText: `${option.label} 하는 중...`, 
      description: option.description,
      accentColor: option.color,
      backgroundImage,
      getBodyStyle: this.getBodyStyle.bind(this),
      uiPanelInnerBorderColor: this.uiPanelInnerBorderColor,
      uiPanelOuterBorderColor: this.uiPanelOuterBorderColor
    });
    this.weeklyPlanActivityOpen = true;
    this.weeklyPlanActivityTimer = this.time.delayedCall(3000, () => {
      this.closeWeeklyPlanActivity();
      this.applyWeeklyPlanForCurrentSlot();

      const result = advanceTimeProgress({
        actionPoint: this.actionPoint,
        maxActionPoint: this.maxActionPoint,
        timeCycleIndex: this.timeCycleIndex,
        dayCycleIndex: this.dayCycleIndex,
        week: this.hudState.week,
        endingWeek: 6
      });
      this.applyTimeProgressResult(result, onSettled);
    });
    return true;
  }

  private maybeOpenWeeklyPlanner(): void {
    if (this.endingFlowStarted) return;
    if (this.dayCycleIndex !== 0) return;
    if (this.weeklyPlanWeek >= this.hudState.week) return;

    this.time.delayedCall(120, () => {
      if (this.dayCycleIndex !== 0 || this.weeklyPlanWeek >= this.hudState.week || this.endingFlowStarted) return;
      this.openWeeklyPlannerPopup();
    });
  }

  private withPlannerPrompt(message: string): string {
    return `${message}  |  P 계획표`;
  }
  private getCompletedWeeklyPlanSlotIndices(): Set<number> {
    const completed = new Set<number>();
    if (this.weeklyPlanWeek !== this.hudState.week || !this.lastAppliedWeeklyPlanSlotKey) {
      return completed;
    }

    const parsedSlot = parseWeeklyPlanSlotKey(this.lastAppliedWeeklyPlanSlotKey);
    if (!parsedSlot || parsedSlot.week !== this.hudState.week) {
      return completed;
    }

    const lastCompletedIndex = getWeeklyPlanSlotIndex(parsedSlot.dayIndex, parsedSlot.timeIndex);
    for (let slotIndex = 0; slotIndex <= lastCompletedIndex; slotIndex += 1) {
      completed.add(slotIndex);
    }
    return completed;
  }

  private getFixedEventSlotsForWeek(week: number): Map<number, string> {
    const fixedEventSlots = new Map<number, string>();
    const fixedEvents = getFixedEventEntries(this.getFixedEventDataForWeek(week));

    fixedEvents.forEach((event) => {
      if (event.eventType !== "FIXED") return;

      const timing = event.triggerTiming;
      if (!timing) return;
      if (Math.round(timing.week ?? -1) !== week) return;

      const day = Math.round(timing.day ?? -1);
      if (day < 1 || day > WEEKLY_PLAN_DAY_INDICES.length) return;

      const normalizedTime = typeof timing.timeOfDay === "string" ? timing.timeOfDay.trim() : "";
      const timeIndex = TIME_CYCLE.findIndex((label) => label.trim() === normalizedTime);
      if (timeIndex < 0 || timeIndex >= WEEKLY_PLAN_TIME_LABELS.length) return;

      const slotIndex = getWeeklyPlanSlotIndex(day - 1, timeIndex);
      const eventName =
        typeof event.eventName === "string" && event.eventName.trim().length > 0
          ? event.eventName.trim()
          : "이벤트";
      fixedEventSlots.set(slotIndex, eventName);
    });

    return fixedEventSlots;
  }

  private getCurrentFixedEventSlotName(): string | null {
    if (!this.getCurrentWeeklyPlanSlotKey()) return null;

    const slotIndex = getWeeklyPlanSlotIndex(this.dayCycleIndex, this.timeCycleIndex);
    return this.getFixedEventSlotsForWeek(this.hudState.week).get(slotIndex) ?? null;
  }

  private openWeeklyPlannerPopup(): void {
    this.closePlacePopup();
    this.weeklyPlannerPopupOpen = true;
    this.hud.setStatusPanelsVisible(false);
    this.placePopupRoot = createWeeklyPlannerModal({
      scene: this,
      week: this.hudState.week,
      dayLabels: DAY_CYCLE,
      initialPlan: this.weeklyPlan,
      completedSlotIndices: this.getCompletedWeeklyPlanSlotIndices(),
      fixedEventSlots: this.getFixedEventSlotsForWeek(this.hudState.week),
      getBodyStyle: this.getBodyStyle.bind(this),
      createActionButton: this.createActionButton.bind(this),
      uiPanelInnerBorderColor: this.uiPanelInnerBorderColor,
      uiPanelOuterBorderColor: this.uiPanelOuterBorderColor,
      onConfirm: (draftPlan) => {
        const isPlanningNewWeek = this.weeklyPlanWeek < this.hudState.week;
        this.weeklyPlan = [...draftPlan];
        this.weeklyPlanWeek = this.hudState.week;
        if (isPlanningNewWeek) {
          this.lastAppliedWeeklyPlanSlotKey = null;
        }
        this.closePlacePopup();
        this.showSystemToast(isPlanningNewWeek
          ? String(this.hudState.week) + "주차 계획표를 확정했습니다"
          : String(this.hudState.week) + "주차 계획표를 수정했습니다"
        );
        if (isPlanningNewWeek) {
          this.maybeStartWeeklyPlanActivity();
        }
      },
    });
    this.placePopupRoot.setDepth(920);
    this.placePopupOpen = true;
  }

  private openDowntownBuildingPopup(buildingId: DowntownBuildingId): void {
    const unavailable = this.getDowntownBuildingUnavailableMessage(buildingId);
    if (unavailable) {
      this.openUnavailablePlacePopup(
        unavailable.title,
        unavailable.description,
        getDowntownBuildingBackgroundTextureKey(buildingId)
      );
      return;
    }

    this.closePlacePopup();
    const buildingBackgroundImage = this.createPlaceBackgroundImage(getDowntownBuildingBackgroundTextureKey(buildingId));
    const config = getDowntownBuildingConfig(buildingId);
    this.placePopupRoot = createPlaceActionModal({
      scene: this,
      width: 540,
      height: 296,
      title: config.title,
      description: config.description,
      actionText: config.actionText ?? "\uC774\uC6A9\uD558\uAE30",
      backgroundImage: buildingBackgroundImage,
      getBodyStyle: this.getBodyStyle.bind(this),
      createActionButton: this.createActionButton.bind(this),
      uiPanelInnerBorderColor: this.uiPanelInnerBorderColor,
      uiPanelOuterBorderColor: this.uiPanelOuterBorderColor,
      onAction: () => this.useDowntownBuilding(buildingId),
      onClose: () => this.closePlacePopup()
    });
    this.placePopupRoot.setDepth(920);
    this.placePopupOpen = true;
  }

  private useDowntownBuilding(buildingId: DowntownBuildingId): void {
    const unavailable = this.getDowntownBuildingUnavailableMessage(buildingId);
    if (unavailable) {
      this.openUnavailablePlacePopup(
        unavailable.title,
        unavailable.description,
        getDowntownBuildingBackgroundTextureKey(buildingId)
      );
      return;
    }

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
    const lotteryDelta = buildingId === "lottery" ? Phaser.Utils.Array.GetRandom([-1200, -500, 0, 700, 1800, 3200]) : 0;
    const result = resolveDowntownBuildingAction(buildingId, lotteryDelta);
    if (!spend(result.cost)) return;

    const patch: Partial<HudState> = {};
    if (typeof result.hpMaxDelta === "number") {
      const nextHpMax = Math.max(1, Math.round(this.hudState.hpMax + result.hpMaxDelta));
      patch.hpMax = nextHpMax;
    }
    if (typeof result.hpDelta === "number") {
      patch.hp = Phaser.Math.Clamp(this.hudState.hp + result.hpDelta, 0, patch.hpMax ?? this.hudState.hpMax);
    }
    if (typeof result.stressDelta === "number") {
      patch.stress = Phaser.Math.Clamp(this.hudState.stress + result.stressDelta, 0, 100);
    }
    if (typeof result.moneyDelta === "number") {
      patch.money = this.hudState.money + result.moneyDelta;
    }
    if (result.statDelta) {
      this.applyStatDelta(result.statDelta);
    }

    this.updateHudState(patch);
    this.showSystemToast(result.toastMessage);

    // 미니게임 연동 (중앙 런처 사용)
    this.startMinigame(buildingId);
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
    return createSettingsPageContent(this, {
      bounds,
      px: (value) => this.px(value),
      getBodyStyle: (size, color, fontStyle) => this.getBodyStyle(size, color, fontStyle),
      getVolumes: () => this.audioManager.getVolumes(),
      setVolume: (key, value) => {
        if (key === "bgm") this.audioManager.setBgmVolume(value);
        if (key === "sfx") this.audioManager.setSfxVolume(value);
        if (key === "ambience") this.audioManager.setAmbienceVolume(value);
      }
    });
  }

  private createInventoryPage(bounds: Phaser.Geom.Rectangle): Phaser.GameObjects.Container {
    const inventoryPage = createInventoryPageContent(this, {
      bounds,
      px: (value) => this.px(value),
      getBodyStyle: (size, color, fontStyle) => this.getBodyStyle(size, color, fontStyle),
      createPanelOuterBorder: (centerX, centerY, width, height) =>
        this.createPanelOuterBorder(centerX, centerY, width, height),
      panelInnerBorderColor: this.uiPanelInnerBorderColor,
      equipmentDefs: [
        { key: "keyboard", label: "\uD0A4\uBCF4\uB4DC" },
        { key: "mouse", label: "\uB9C8\uC6B0\uC2A4" }
      ],
      onEquipHover: (slot, view) => {
        this.applySlotHoverStyle(view);
        this.showItemTooltip(this.equippedSlots[slot], this.input.activePointer.worldX, this.input.activePointer.worldY);
      },
      onEquipOut: (_slot, view) => {
        this.applySlotIdleStyle(view);
        this.hideItemTooltip();
      },
      onEquipDown: (slot, view) => {
        if (this.isDoubleClick(`equip-${slot}`)) {
          this.unequipItem(slot);
          return;
        }
        this.applySlotSelectedStyle(view);
      },
      onInventoryHover: (slotIndex, view) => {
        this.applySlotHoverStyle(view);
        this.showItemTooltip(this.inventorySlots[slotIndex], this.input.activePointer.worldX, this.input.activePointer.worldY);
      },
      onInventoryOut: (_slotIndex, view) => {
        this.applySlotIdleStyle(view);
        this.hideItemTooltip();
      },
      onInventoryDown: (slotIndex, view) => {
        this.onInventorySlotClick(slotIndex, view);
      }
    });
    this.inventorySlotViews = inventoryPage.inventorySlotViews;
    this.equipmentSlotViews = inventoryPage.equipmentSlotViews;
    this.refreshInventoryUi();
    return inventoryPage.container;
  }

  private createStatsPage(bounds: Phaser.Geom.Rectangle): Phaser.GameObjects.Container {
    const statsPage = createStatsPageContent(this, {
      bounds,
      px: (value) => this.px(value),
      getBodyStyle: (size, color, fontStyle) => this.getBodyStyle(size, color, fontStyle),
      statRows: STAT_ROW_DEFS,
      statsState: this.statsState
    });
    this.statViews = statsPage.statViews;
    this.refreshStatsUi();
    return statsPage.container;
  }

  private createSavePage(bounds: Phaser.Geom.Rectangle): Phaser.GameObjects.Container {
    this.savePinnedObjects = [];
    const slotIds = this.saveManager.getSlotIds();
    this.saveSlots = this.saveManager.loadSlots();
    const savePage = createSavePageContent(this, {
      bounds,
      slotIds,
      px: (value) => this.px(value),
      getBodyStyle: (size, color, fontStyle) => this.getBodyStyle(size, color, fontStyle),
      createActionButton: (params) => this.createActionButton(params),
      onSelectSlot: (slotId) => {
        this.selectedSaveSlotId = slotId;
        this.refreshSaveSlotUi();
      },
      onSave: () => this.saveToSelectedSlot(),
      onLoad: () => this.loadFromSelectedSlot()
    });
    this.saveSlotViews = savePage.saveSlotViews;
    this.savePinnedObjects = savePage.pinnedObjects;
    this.refreshSaveSlotUi();
    return savePage.container;
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
    return getSaveSlotMetaText<AreaId, WorldPlaceId, StatKey, EquipmentSlotKey, WeeklyPlanOptionId>(slotData);
  }

  private captureGameSavePayload(): MainSavePayload {
    return {
      ...captureGameSavePayload({
        currentArea: this.currentArea,
        lastSelectedWorldPlace: this.lastSelectedWorldPlace,
        playerPosition: { x: this.player.x, y: this.player.y },
        hudState: this.hudState,
        statsState: this.statsState,
        actionPoint: this.actionPoint,
        timeCycleIndex: this.timeCycleIndex,
        dayCycleIndex: this.dayCycleIndex,
        weeklyPlan: this.weeklyPlan,
        weeklyPlanWeek: this.weeklyPlanWeek,
        lastAppliedWeeklyPlanSlotKey: this.lastAppliedWeeklyPlanSlotKey,
        inventorySlots: this.inventorySlots,
        equippedSlots: this.equippedSlots
      }),
      completedFixedEventIds: [...this.completedFixedEventIds]
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
    if (Array.isArray(payload.weeklyPlan) && payload.weeklyPlan.length === this.weeklyPlan.length) {
      this.weeklyPlan = payload.weeklyPlan.map((entry) => parseWeeklyPlanOptionId(entry) ?? WEEKLY_PLAN_OPTIONS[0].id);
    }
    if (typeof payload.weeklyPlanWeek === "number") {
      this.weeklyPlanWeek = Math.max(0, Math.round(payload.weeklyPlanWeek));
    }
    if (typeof payload.lastAppliedWeeklyPlanSlotKey === "string" || payload.lastAppliedWeeklyPlanSlotKey === null) {
      this.lastAppliedWeeklyPlanSlotKey = payload.lastAppliedWeeklyPlanSlotKey ?? null;
    }
    this.completedFixedEventIds = Array.isArray(payload.completedFixedEventIds)
      ? payload.completedFixedEventIds.filter((entry): entry is string => typeof entry === "string" && entry.length > 0)
      : [];

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
    restoreStatsFromSave({
      stats,
      statsState: this.statsState,
      statKeys: Object.keys(this.statsState) as StatKey[],
      legacyCodingTargets: ["fe", "be"]
    });
  }

  private restoreInventoryFromSave(payload: Partial<MainSavePayload>): void {
    restoreInventoryFromSave({
      payload,
      inventorySlots: this.inventorySlots,
      equippedSlots: this.equippedSlots,
      templates: SHOP_ITEM_TEMPLATES
    });
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
    const ui = createDialogueUi(this, {
      px: (value) => this.px(value),
      getBodyStyle: (size, color, fontStyle) => this.getBodyStyle(size, color, fontStyle),
      createPanelOuterBorder: (centerX, centerY, panelWidth, panelHeight) =>
        this.createPanelOuterBorder(centerX, centerY, panelWidth, panelHeight),
      panelInnerBorderColor: this.uiPanelInnerBorderColor,
      onAction: () => {
        const node = this.getCurrentDialogueNode();
        if (!node) return;
        this.resolveDialogueAdvance(node);
      }
    });
    this.dialogueRoot = ui.root;
    this.dialogueSpeakerText = ui.speakerText;
    this.dialogueBodyText = ui.bodyText;
    this.dialogueHintText = ui.hintText;
    this.dialogueActionButtonBg = ui.actionButtonBg;
    this.dialogueActionButtonText = ui.actionButtonText;
  }

  private handleNpcInteraction(npcView: AreaNpcView): void {
    if (npcView.marker instanceof Phaser.GameObjects.Shape) {
      npcView.marker.setFillStyle(npcView.config.flashColor, 1);
    } else if (npcView.marker instanceof Phaser.GameObjects.Sprite) {
      npcView.marker.setTint(npcView.config.flashColor);
    }
    this.time.delayedCall(160, () => {
      this.refreshAreaNpcHighlight(this.activeAreaNpcView);
    });

    if (npcView.isScheduled) {
      const event = this.getCurrentFixedEventEntry();
      if (!event || npcView.eventId !== event.eventId) {
        this.showSystemToast("진행할 이벤트가 없습니다");
        return;
      }
      this.startCurrentFixedEventDialogue(event);
      return;
    }

    this.startNpcDialogue(npcView.config.dialogueId);
  }

  private startNpcDialogue(dialogueId: NpcDialogueId): void {
    const script = this.getDialogueScript(dialogueId);
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

      if (selectedChoice.feedbackText) {
        this.showSystemToast(selectedChoice.feedbackText);
      }
      if (this.activeDialogueId === "fixed_event_runtime" && this.activeFixedEventId && !this.completedFixedEventIds.includes(this.activeFixedEventId)) {
        this.completedFixedEventIds.push(this.activeFixedEventId);
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
    if (this.activeDialogueId === "fixed_event_runtime" && this.activeFixedEventId && !this.completedFixedEventIds.includes(this.activeFixedEventId)) {
      this.completedFixedEventIds.push(this.activeFixedEventId);
    }
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

    this.clearDialogueChoices();
    if (!this.dialogueSpeakerText || !this.dialogueBodyText || !this.dialogueHintText || !this.dialogueActionButtonText) {
      return;
    }

    const rendered = renderDialogueNode(this, {
      node,
      root: this.dialogueRoot,
      px: (value) => this.px(value),
      getBodyStyle: (size, color, fontStyle) => this.getBodyStyle(size, color, fontStyle),
      ui: {
        speakerText: this.dialogueSpeakerText,
        bodyText: this.dialogueBodyText,
        hintText: this.dialogueHintText,
        actionButtonText: this.dialogueActionButtonText
      },
      dialogueChoiceIndex: this.dialogueChoiceIndex,
      getRequirementText: (choice) => this.getDialogueRequirementText(choice),
      isChoiceAvailable: (choice) => this.isDialogueChoiceAvailable(choice)
    });
    this.dialogueChoiceViews = rendered.choiceViews;
    this.dialogueChoiceIndex = rendered.dialogueChoiceIndex;
  }

  private refreshDialogueChoiceStyles(): void {
    refreshDialogueChoiceStyles(this.dialogueChoiceViews, this.dialogueChoiceIndex, (choice) =>
      this.isDialogueChoiceAvailable(choice)
    );
  }

  private clearDialogueChoices(): void {
    this.dialogueChoiceViews = clearDialogueChoices(this.dialogueChoiceViews);
  }

  private closeDialogue(): void {
    this.dialogueOpen = false;
    this.activeDialogueId = null;
    this.activeDialogueNodeId = null;
    this.activeFixedEventId = null;
    this.dialogueChoiceIndex = 0;
    this.clearDialogueChoices();
    this.dialogueRoot?.setVisible(false);
  }

  private getCurrentDialogueNode(): DialogueNode | null {
    if (!this.activeDialogueId || !this.activeDialogueNodeId) return null;
    const script = this.getDialogueScript(this.activeDialogueId);
    if (!script) return null;
    return script.nodes[this.activeDialogueNodeId] ?? null;
  }

  private getDialogueMetricValue(stat: DialogueStatKey): number {
    if (stat === "hp") {
      return this.hudState.hp;
    }
    if (stat === "gold") {
      return this.hudState.money;
    }
    return this.statsState[stat as StatKey];
  }

  private isDialogueChoiceAvailable(choice: DialogueChoice): boolean {
    const requirements = choice.requirements ?? [];
    return requirements.every((req) => {
      const value = this.getDialogueMetricValue(req.stat);
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
        const label =
          req.stat === "hp"
            ? "HP"
            : req.stat === "gold"
              ? "돈"
              : STAT_LABEL[req.stat as StatKey];
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
    const entries = Object.entries(choice.statChanges) as Array<[DialogueStatKey, number]>;
    if (entries.length === 0) return;

    const statDelta: Partial<Record<StatKey, number>> = {};
    const hudPatch: Partial<HudState> = {};

    entries.forEach(([key, value]) => {
      if (key === "hp") {
        hudPatch.hp = Phaser.Math.Clamp(this.hudState.hp + value, 0, this.hudState.hpMax);
        return;
      }
      if (key === "gold") {
        hudPatch.money = Math.max(0, this.hudState.money + value);
        return;
      }
      statDelta[key as StatKey] = value;
    });

    if (Object.keys(statDelta).length > 0) {
      this.applyStatDelta(statDelta, 1);
    }
    if (Object.keys(hudPatch).length > 0) {
      this.updateHudState(hudPatch);
    }

    const summary = entries
      .map(([key, value]) => {
        const label =
          key === "hp"
            ? "HP"
            : key === "gold"
              ? "돈"
              : STAT_LABEL[key as StatKey];
        return `${label} ${value > 0 ? "+" : ""}${value}`;
      })
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
      openLegacyMinigameMenu(this, SceneKey.Main, () => {
        this.showSystemToast("미니게임 센터 입장");
      });
      return;
    }

    // 미니게임 연동 (중앙 런처 사용)
    if (action && action.startsWith("play")) {
      this.startMinigame(action);
    }
  }

  private startMinigame(key: string): void {
    const sceneKey = MINIGAME_SCENE_MAP[key];
    if (sceneKey) {
      this.scene.start(sceneKey, { returnSceneKey: SceneKey.Main });
    }
  }

  private buildShop(): void {
    const centerX = this.px(GAME_CONSTANTS.WIDTH / 2);
    const centerY = this.px(GAME_CONSTANTS.HEIGHT / 2);

    const backgroundImage = this.createPlaceBackgroundImage(PLACE_BACKGROUND_KEYS.store);
    if (backgroundImage) {
      backgroundImage.setVisible(false);
    }

    const overlay = this.add.rectangle(centerX, centerY, GAME_CONSTANTS.WIDTH, GAME_CONSTANTS.HEIGHT, 0x000000, 0.35);

    const panelOuter = this.createPanelOuterBorder(centerX, centerY, 820, 620);
    const panel = this.add.rectangle(centerX, centerY, 820, 620, 0x163357, 0.96);
    panel.setStrokeStyle(2, this.uiPanelInnerBorderColor, 1);

    const title = this.add.text(centerX, centerY - 282, "\uD3B8\uC758\uC810", this.getBodyStyle(30, "#e6f3ff", "bold"));
    title.setOrigin(0.5);
    const hint = this.add.text(centerX, centerY + 274, "E / ESC\uB85C \uB2EB\uAE30", this.getBodyStyle(16, "#a8c9ef"));
    hint.setOrigin(0.5);

    const cards: Phaser.GameObjects.GameObject[] = [];

    SHOP_ITEM_TEMPLATES.forEach((item, idx) => {
      const col = idx % 3;
      const row = Math.floor(idx / 3);
      const x = this.px(centerX - 248 + col * 248);
      const y = this.px(centerY - 148 + row * 178);
      const card = this.add.rectangle(x, y, 220, 152, 0x234873, 1);
      card.setStrokeStyle(2, 0x5cb0ff, 1);

      const icon = this.add.rectangle(x, y - 30, 74, 74, 0xf5fbff, 1);
      icon.setStrokeStyle(2, 0x5cb0ff, 1);
      const iconImage = this.add.image(x, y - 30, "__WHITE");
      const hasIconImage = this.applyItemIconImage(iconImage, item, 62, 62);
      icon.setFillStyle(0xf5fbff, hasIconImage ? 0 : 1);
      const iconLabel = this.add.text(x, y - 29, item.shortLabel, this.getBodyStyle(22, "#234873", "bold"));
      iconLabel.setOrigin(0.5);
      iconLabel.setVisible(!hasIconImage);

      const name = this.add.text(x, y + 20, item.name, this.getBodyStyle(16, "#e6f3ff", "bold"));
      name.setOrigin(0.5);
      const price = this.add.text(x, y + 50, `${item.price.toLocaleString("ko-KR")} G`, this.getBodyStyle(17, "#b6d6fb", "bold"));
      price.setOrigin(0.5);
      const buyHint = this.add.text(x, y + 75, "\uD074\uB9AD \uAD6C\uB9E4", this.getBodyStyle(14, "#a1c5ef"));
      buyHint.setOrigin(0.5);

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

      cards.push(card, icon, iconImage, iconLabel, name, price, buyHint);
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
        view.iconImage.setVisible(false);
        view.iconText.setVisible(false);
        view.stackText.setVisible(false);
        return;
      }

      const hasIconImage = this.applyItemIconImage(view.iconImage, template, view.icon.width - 10, view.icon.height - 10);
      view.icon.setFillStyle(0xf5fbff, hasIconImage ? 0 : 1);
      view.icon.setVisible(true);
      view.iconText.setText(template.shortLabel);
      view.iconText.setColor(hasIconImage ? "#e8f4ff" : "#234873");
      view.iconText.setVisible(!hasIconImage);
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
    STARTER_ITEM_TEMPLATES.forEach((template, index) => {
      this.addItemToInventory(template, index === 0 ? 2 : 1, false);
    });
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
    return item.statDelta ?? {};
  }

  private getConsumableStatDelta(item: InventoryItemTemplate): Partial<Record<StatKey, number>> {
    return item.statDelta ?? {};
  }

  private applyStatDelta(delta: Partial<Record<StatKey, number>>, multiplier: 1 | -1 = 1): void {
    let changed = false;
    let stressChanged = false;

    (Object.keys(delta) as StatKey[]).forEach((key) => {
      const value = delta[key];
      if (!value) return;
      this.statsState[key] = Phaser.Math.Clamp(this.statsState[key] + value * multiplier, 0, 100);
      changed = true;
      if (key === "stress") {
        stressChanged = true;
      }
    });

    if (changed) {
      this.refreshStatsUi();
      if (stressChanged) {
        this.hudState.stress = this.statsState.stress;
        this.hud.applyState({ stress: this.hudState.stress });
      }
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

    const nextHp = Phaser.Math.Clamp(this.hudState.hp + (stack.template.hpDelta ?? 0), 0, this.hudState.hpMax);
    const nextStress = Phaser.Math.Clamp(this.hudState.stress + (stack.template.stressDelta ?? 0), 0, 100);
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
    const iconImage = this.add.image(0, 0, "__WHITE");
    iconImage.setVisible(false);
    const label = this.add.text(0, 0, "", this.getBodyStyle(16, "#e6f3ff", "bold"));
    label.setOrigin(0.5);
    const stackText = this.add.text(16, 14, "", this.getBodyStyle(13, "#e6f3ff", "bold"));
    stackText.setOrigin(1, 1);

    this.carriedItemRoot = this.add.container(0, 0, [icon, iconImage, label, stackText]);
    this.carriedItemRoot.setAlpha(0.55);
    this.carriedItemRoot.setDepth(1400);
    this.carriedItemRoot.setVisible(false);
  }

  private showCarriedItem(stack: InventoryItemStack): void {
    if (!this.carriedItemRoot) return;
    const icon = this.carriedItemRoot.list[0] as Phaser.GameObjects.Rectangle;
    const iconImage = this.carriedItemRoot.list[1] as Phaser.GameObjects.Image;
    const label = this.carriedItemRoot.list[2] as Phaser.GameObjects.Text;
    const stackText = this.carriedItemRoot.list[3] as Phaser.GameObjects.Text;

    const hasIconImage = this.applyItemIconImage(iconImage, stack.template, 30, 30);
    icon.setFillStyle(0xf5fbff, hasIconImage ? 0 : 1);
    label.setText(stack.template.shortLabel);
    label.setColor(hasIconImage ? "#e6f3ff" : "#234873");
    label.setVisible(!hasIconImage);
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
    if (this.scheduledNpcViews.length > 0) {
      this.refreshScheduledNpcViews();
    }
  }

  private spendActionPoint(): boolean {
    return this.spendActionPointAfter();
  }

  private spendActionPointAfter(onSettled?: () => void): boolean {
    if (this.actionPoint <= 0) {
      this.showSystemToast("\uD589\uB3D9\uB825\uC774 \uBD80\uC871\uD569\uB2C8\uB2E4");
      return false;
    }
    if (this.weeklyPlanActivityOpen) {
      return false;
    }

    const result = advanceTimeProgress({
      actionPoint: this.actionPoint,
      maxActionPoint: this.maxActionPoint,
      timeCycleIndex: this.timeCycleIndex,
      dayCycleIndex: this.dayCycleIndex,
      week: this.hudState.week,
      endingWeek: 6
    });
    this.applyTimeProgressResult(result, onSettled);
    return true;
  }

  private applyTimeProgressResult(
    result: ReturnType<typeof advanceTimeProgress>,
    onSettled?: () => void
  ): void {
    this.actionPoint = result.actionPoint;
    this.timeCycleIndex = result.timeCycleIndex;
    this.dayCycleIndex = result.dayCycleIndex;

    this.updateHudState(result.patch);

    if (result.dayPassed) {
      this.enterArea("world", "home");
      this.time.delayedCall(180, () => {
        this.showSystemToast("\uD558\uB8E8\uAC00 \uC9C0\uB0AC\uC2B5\uB2C8\uB2E4");
      });
      this.saveGameToSlot("auto", true);
      this.maybeOpenWeeklyPlanner();
      if (result.shouldStartEndingAfterUpdate || shouldTriggerEndingFlow(this.hudState.week, result.patch.week)) {
        this.time.delayedCall(240, () => {
          this.startEndingFlow();
        });
      }
    }

    if (this.maybeStartWeeklyPlanActivity(onSettled)) {
      return;
    }
    onSettled?.();
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
    this.scene.start(SceneKey.Completion, this.buildEndingPayload());
  }
}

