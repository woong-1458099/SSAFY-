import Phaser from "phaser";
import { SceneKey } from "@shared/enums/sceneKey";
import { GAME_CONSTANTS } from "@core/constants/gameConstants";
import { InputManager } from "@core/managers/InputManager";
import { AudioManager } from "@core/managers/AudioManager";
import { EventBus } from "@core/events/EventBus";
import { createBaseModal } from "@features/ui/components/BaseModal";
import { GameHud, type HudState } from "@features/ui/components/game-hud";

type TabKey = "inventory" | "stats" | "settings" | "save";
type EquipmentSlotKey = "keyboard" | "mouse";
type AreaId = "world" | "downtown" | "campus";
type WorldPlaceId = "home" | "downtown" | "campus" | "cafe" | "store";
type StatKey = "coding" | "presentation" | "teamwork" | "luck" | "stress";
type DowntownBuildingId = "ramenthings" | "gym" | "karaoke" | "hof" | "lottery";

type WorldPlaceNode = {
  id: WorldPlaceId;
  label: string;
  x: number;
  y: number;
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
  { id: "home", label: "\uC9D1", x: 190, y: 180, movable: false },
  { id: "downtown", label: "\uBC88\uD654\uAC00", x: 500, y: 210, movable: true },
  { id: "campus", label: "\uCEA0\uD37C\uC2A4", x: 830, y: 250, movable: true },
  { id: "cafe", label: "\uCE74\uD398", x: 420, y: 520, movable: false },
  { id: "store", label: "\uD3B8\uC758\uC810", x: 760, y: 520, movable: false }
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
  { id: "ramenthings", label: "라멘띵스", x: 290, y: 278, w: 150, h: 106, color: 0xd4a875 },
  { id: "gym", label: "\uD5EC\uC2A4\uC7A5", x: 492, y: 262, w: 166, h: 108, color: 0xb79f86 },
  { id: "karaoke", label: "\uB178\uB798\uBC29", x: 712, y: 286, w: 160, h: 108, color: 0xc495a3 },
  { id: "hof", label: "\uD638\uD504", x: 454, y: 406, w: 174, h: 116, color: 0xb48a66 },
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
  viewport: Phaser.Geom.Rectangle;
  track: Phaser.GameObjects.Rectangle;
  thumb: Phaser.GameObjects.Rectangle;
  thumbHeight: number;
  minOffset: number;
  maxOffset: number;
  offset: number;
};

const STAT_ROW_DEFS: Array<{ key: StatKey; label: string }> = [
  { key: "coding", label: "\uCF54\uB529\uB825" },
  { key: "presentation", label: "\uBC1C\uD45C\uB825" },
  { key: "teamwork", label: "\uD611\uC5C5\uB825" },
  { key: "luck", label: "\uC6B4" },
  { key: "stress", label: "\uC2A4\uD2B8\uB808\uC2A4" }
];

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

export class MainScene extends Phaser.Scene {
  private player!: Phaser.Physics.Arcade.Image;
  private interactionTarget!: Phaser.GameObjects.Rectangle;
  private interactionLabel!: Phaser.GameObjects.Text;
  private worldMapRoot?: Phaser.GameObjects.Container;
  private downtownMapRoot?: Phaser.GameObjects.Container;
  private campusMapRoot?: Phaser.GameObjects.Container;
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
  private readonly uiFontFamily = "\"Malgun Gothic\", \"Apple SD Gothic Neo\", \"Noto Sans KR\", sans-serif";
  private readonly audioManager = new AudioManager();
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
  private shopOpen = false;

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
    coding: 30,
    presentation: 25,
    teamwork: 40,
    luck: 10,
    stress: 20
  };
  private statViews: Partial<Record<StatKey, StatView>> = {};

  constructor() {
    super(SceneKey.Main);
  }

  create(): void {
    this.cameras.main.setBackgroundColor("#3e7d4a");
    this.cameras.main.roundPixels = true;
    this.physics.world.setBounds(0, 0, GAME_CONSTANTS.WIDTH, GAME_CONSTANTS.HEIGHT);

    this.buildAreaMaps();

    if (!this.textures.exists("player-core")) {
      const g = this.add.graphics();
      g.fillStyle(0xffdd91, 1);
      g.fillRect(0, 0, 28, 28);
      g.generateTexture("player-core", 28, 28);
      g.destroy();
    }

    this.player = this.physics.add.image(this.px(GAME_CONSTANTS.WIDTH / 2), this.px(GAME_CONSTANTS.HEIGHT / 2), "player-core");
    this.player.setCollideWorldBounds(true);
    this.player.setDepth(30);

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

    this.buildEscapeMenu();
    this.buildShop();
    this.buildHud();
    this.seedDemoItems();
    this.createItemTooltip();
    this.createCarriedItemPreview();
    this.enterArea("world", "downtown");

    this.input.on("pointermove", (pointer: Phaser.Input.Pointer) => {
      this.updateCarriedItemPosition(pointer.worldX, pointer.worldY);
    });
    this.input.on("wheel", this.handleMenuWheel, this);

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.input.off("wheel", this.handleMenuWheel, this);
      this.hud.destroy();
      this.pendingInventoryPickup?.timer.destroy();
      this.pendingInventoryPickup = undefined;
      this.systemToastTimer?.destroy();
      this.systemToastRoot?.destroy();
      this.tooltipRoot?.destroy();
      this.carriedItemRoot?.destroy();
      this.shopRoot?.destroy();
      this.placePopupRoot?.destroy();
      Object.values(this.tabScrollPages).forEach((page) => {
        page?.maskGraphics.destroy();
      });
    });

    EventBus.emit("scene:entered", { scene: SceneKey.Main });
  }

  update(): void {
    if (this.escapeKey && Phaser.Input.Keyboard.JustDown(this.escapeKey)) {
      if (this.shopOpen) {
        this.closeShop();
        return;
      }
      if (this.placePopupOpen) {
        this.closePlacePopup();
        return;
      }
      this.toggleMenu();
      return;
    }

    if (this.menuOpen) {
      this.player.setVelocity(0, 0);
      this.hud.setInteractionPrompt(null);
      return;
    }

    if (this.shopOpen) {
      this.player.setVelocity(0, 0);
      this.hud.setInteractionPrompt(null);
      return;
    }

    if (this.placePopupOpen) {
      this.player.setVelocity(0, 0);
      this.hud.setInteractionPrompt(null);
      return;
    }

    if (this.currentArea !== "world" && this.mapKey && Phaser.Input.Keyboard.JustDown(this.mapKey)) {
      const returnPlace: WorldPlaceId = this.currentArea === "downtown" ? "downtown" : "campus";
      this.enterArea("world", returnPlace);
      this.showSystemToast("\uC804\uCCB4 \uC9C0\uB3C4\uB85C \uC774\uB3D9");
      return;
    }

    if (this.currentArea === "world") {
      this.player.setVelocity(0, 0);
      this.hud.setInteractionPrompt("\uC7A5\uC18C\uB97C \uD074\uB9AD\uD558\uC5EC \uC774\uB3D9/\uAE30\uB2A5 \uC0AC\uC6A9");
      return;
    }

    this.highlightWorldPlace(null);

    const move = this.inputManager.getMoveVector();
    this.player.setVelocity(move.x * GAME_CONSTANTS.PLAYER_SPEED, move.y * GAME_CONSTANTS.PLAYER_SPEED);

    const nearNpc = this.isNearPoint(this.interactionTarget.x, this.interactionTarget.y, 74);
    const prompt =
      this.currentArea === "downtown" && nearNpc
        ? "E \uC0C1\uC810 \uC5F4\uAE30  |  Q \uC804\uCCB4 \uC9C0\uB3C4"
        : this.currentArea === "campus" && nearNpc
          ? "E \uBBF8\uB2C8\uAC8C\uC784 \uC13C\uD130  |  Q \uC804\uCCB4 \uC9C0\uB3C4"
          : "Q \uC804\uCCB4 \uC9C0\uB3C4";
    this.hud.setInteractionPrompt(prompt);

    if (nearNpc && this.interactKey && Phaser.Input.Keyboard.JustDown(this.interactKey)) {
      if (this.currentArea === "downtown") {
        this.handleNpcInteraction();
        return;
      }

      if (this.currentArea === "campus") {
        this.handleMiniGameNpcInteraction();
      }
    }
  }

  private buildAreaMaps(): void {
    const worldObjects: Phaser.GameObjects.GameObject[] = [];
    const worldRoot = this.add.container(0, 0);
    worldRoot.setDepth(0);

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
    const title = this.add.text(this.px(GAME_CONSTANTS.WIDTH / 2), 86, "\uC804\uCCB4 \uC9C0\uB3C4", this.getBodyStyle(40, "#3e2d1a", "bold"));
    title.setOrigin(0.5);

    const horizontalRoad = this.add.rectangle(this.px(GAME_CONSTANTS.WIDTH / 2), this.px(GAME_CONSTANTS.HEIGHT / 2), 820, 56, 0xb6986f, 1);
    horizontalRoad.setStrokeStyle(2, 0x7d5f36, 1);
    const verticalRoad = this.add.rectangle(this.px(GAME_CONSTANTS.WIDTH / 2), this.px(GAME_CONSTANTS.HEIGHT / 2), 56, 430, 0xb6986f, 1);
    verticalRoad.setStrokeStyle(2, 0x7d5f36, 1);

    worldObjects.push(worldBg, worldBoard, horizontalRoad, verticalRoad, title);

    WORLD_PLACE_NODES.forEach((place) => {
      const marker = this.add.rectangle(
        this.px(place.x),
        this.px(place.y),
        40,
        28,
        place.movable ? 0xe7d593 : 0xc9a67f,
        1
      );
      marker.setStrokeStyle(2, 0x5d4426, 1);

      const label = this.add.text(this.px(place.x), this.px(place.y + 28), place.label, this.getBodyStyle(18, "#3d2d1d", "bold"));
      label.setOrigin(0.5, 0);

      const onClickPlace = (): void => {
        if (this.currentArea !== "world" || this.menuOpen || this.shopOpen || this.placePopupOpen) return;
        this.handleWorldPlaceInteraction(place);
      };
      const onOverPlace = (): void => {
        if (this.currentArea !== "world") return;
        this.highlightWorldPlace(place.id);
      };
      const onOutPlace = (): void => {
        if (this.currentArea !== "world") return;
        this.highlightWorldPlace(null);
      };

      marker.setInteractive({ useHandCursor: true });
      marker.on("pointerdown", onClickPlace);
      marker.on("pointerover", onOverPlace);
      marker.on("pointerout", onOutPlace);

      label.setInteractive({ useHandCursor: true });
      label.on("pointerdown", onClickPlace);
      label.on("pointerover", onOverPlace);
      label.on("pointerout", onOutPlace);

      this.worldPlaceViews[place.id] = { marker, label };
      worldObjects.push(marker, label);
    });

    worldRoot.add(worldObjects);
    this.worldMapRoot = worldRoot;

    const downtownRoot = this.add.container(0, 0);
    downtownRoot.setDepth(0);
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
    const areaTitle = this.add.text(this.px(GAME_CONSTANTS.WIDTH / 2), 82, "\uBC88\uD654\uAC00", this.getBodyStyle(38, "#f4ecd8", "bold"));
    areaTitle.setOrigin(0.5);
    const buildingObjects: Phaser.GameObjects.GameObject[] = [];

    DOWNTOWN_BUILDINGS.forEach((building) => {
      const base = this.add.rectangle(this.px(building.x), this.px(building.y), building.w, building.h, building.color, 1);
      base.setStrokeStyle(3, 0x6d522f, 1);
      const sign = this.add.rectangle(this.px(building.x), this.px(building.y - building.h / 2 + 16), this.px(building.w - 18), 24, 0xe8d1a7, 1);
      sign.setStrokeStyle(2, 0x7d5f36, 1);
      const signLabel = this.add.text(this.px(building.x), this.px(building.y - building.h / 2 + 16), building.label, this.getBodyStyle(15, "#3d2a16", "bold"));
      signLabel.setOrigin(0.5);

      base.setInteractive({ useHandCursor: true }).on("pointerdown", () => {
        if (this.currentArea !== "downtown" || this.menuOpen || this.shopOpen || this.placePopupOpen) return;
        this.openDowntownBuildingPopup(building.id);
      });

      buildingObjects.push(base, sign, signLabel);
    });

    downtownRoot.add([downtownBg, downtownRoad, ...buildingObjects, shopFront, shopSign, areaTitle]);
    downtownRoot.setVisible(false);
    this.downtownMapRoot = downtownRoot;

    const campusRoot = this.add.container(0, 0);
    campusRoot.setDepth(0);
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
    const campusTitle = this.add.text(this.px(GAME_CONSTANTS.WIDTH / 2), 82, "\uCEA0\uD37C\uC2A4", this.getBodyStyle(38, "#f2ead7", "bold"));
    campusTitle.setOrigin(0.5);
    const tree1 = this.add.rectangle(286, 280, 64, 64, 0x6f955f, 1).setStrokeStyle(2, 0x3f5f32, 1);
    const tree2 = this.add.rectangle(352, 330, 64, 64, 0x6f955f, 1).setStrokeStyle(2, 0x3f5f32, 1);
    campusRoot.add([campusBg, lawn, building, buildingLabel, campusTitle, tree1, tree2]);
    campusRoot.setVisible(false);
    this.campusMapRoot = campusRoot;
  }

  private enterArea(area: AreaId, worldPlace: WorldPlaceId = this.lastSelectedWorldPlace): void {
    this.currentArea = area;
    this.closeShop();
    this.closePlacePopup();
    this.player.setVelocity(0, 0);

    this.worldMapRoot?.setVisible(area === "world");
    this.downtownMapRoot?.setVisible(area === "downtown");
    this.campusMapRoot?.setVisible(area === "campus");

    if (area === "world") {
      const spawnFrom = WORLD_PLACE_NODES.find((node) => node.id === worldPlace) ?? WORLD_PLACE_NODES[1];
      this.lastSelectedWorldPlace = spawnFrom.id;
      this.player.setPosition(this.px(spawnFrom.x), this.px(spawnFrom.y + 52));
      this.player.setVisible(false);
      this.player.body.enable = false;
      this.highlightWorldPlace(spawnFrom.id);
      this.interactionTarget.setVisible(false);
      this.interactionLabel.setVisible(false);
      this.controlHintText?.setText("\uB9C8\uC6B0\uC2A4 \uD074\uB9AD: \uC7A5\uC18C \uC120\uD0DD  |  ESC: \uBA54\uB274");
      this.updateHudState({ locationLabel: AREA_LABEL.world });
      return;
    }

    this.lastSelectedWorldPlace = area === "downtown" ? "downtown" : "campus";
    const spawn = AREA_ENTRY_POINT[area];
    this.player.setVisible(true);
    this.player.body.enable = true;
    this.player.setPosition(this.px(spawn.x), this.px(spawn.y));
    this.highlightWorldPlace(null);
    this.controlHintText?.setText("WASD / Arrow: \uC774\uB3D9  |  E: \uC0C1\uD638\uC791\uC6A9  |  Q: \uC804\uCCB4 \uC9C0\uB3C4  |  ESC: \uBA54\uB274");
    this.updateHudState({ locationLabel: AREA_LABEL[area] });

    if (area === "downtown") {
      this.interactionTarget.setPosition(930, 404);
      this.interactionTarget.setVisible(true);
      this.interactionLabel.setText("SHOP NPC");
      this.interactionLabel.setPosition(this.px(this.interactionTarget.x - 16), this.px(this.interactionTarget.y + 24));
      this.interactionLabel.setVisible(true);
      return;
    }

    if (area === "campus") {
      this.interactionTarget.setPosition(924, 390);
      this.interactionTarget.setVisible(true);
      this.interactionLabel.setText("GAME NPC");
      this.interactionLabel.setPosition(this.px(this.interactionTarget.x - 34), this.px(this.interactionTarget.y + 24));
      this.interactionLabel.setVisible(true);
      return;
    }

    this.interactionTarget.setVisible(false);
    this.interactionLabel.setVisible(false);
  }

  private getNearestWorldPlace(maxDistance: number): WorldPlaceNode | null {
    let nearest: WorldPlaceNode | null = null;
    let nearestDistance = Number.POSITIVE_INFINITY;

    WORLD_PLACE_NODES.forEach((place) => {
      const distance = Phaser.Math.Distance.Between(this.player.x, this.player.y, place.x, place.y);
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

  private openPlacePopup(placeId: WorldPlaceId): void {
    if (placeId === "home") {
      this.openHomeActionPopup();
      return;
    }

    this.closePlacePopup();

    const centerX = this.px(GAME_CONSTANTS.WIDTH / 2);
    const centerY = this.px(GAME_CONSTANTS.HEIGHT / 2);
    const overlay = this.add.rectangle(centerX, centerY, GAME_CONSTANTS.WIDTH, GAME_CONSTANTS.HEIGHT, 0x000000, 0.36);
    overlay.setInteractive({ useHandCursor: true }).on("pointerdown", () => this.closePlacePopup());

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

    const panel = this.add.rectangle(centerX, centerY, 530, 290, 0xf0e3c8, 1);
    panel.setStrokeStyle(3, 0x8f6c3c, 1);
    const titleText = this.add.text(centerX, centerY - 92, title, this.getBodyStyle(34, "#3e2d1a", "bold"));
    titleText.setOrigin(0.5);
    const descText = this.add.text(centerX, centerY - 16, description, this.getBodyStyle(21, "#4b381f"));
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

    this.placePopupRoot = this.add.container(0, 0, [overlay, panel, titleText, descText, actionBtn, closeBtn]);
    this.placePopupRoot.setDepth(920);
    this.placePopupOpen = true;
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
    this.openShop();
    this.showSystemToast("\uD3B8\uC758\uC810 \uC0C1\uC810 \uC5F4\uAE30");
  }

  private openHomeActionPopup(): void {
    this.closePlacePopup();

    const centerX = this.px(GAME_CONSTANTS.WIDTH / 2);
    const centerY = this.px(GAME_CONSTANTS.HEIGHT / 2);
    const overlay = this.add.rectangle(centerX, centerY, GAME_CONSTANTS.WIDTH, GAME_CONSTANTS.HEIGHT, 0x000000, 0.36);
    overlay.setInteractive({ useHandCursor: true }).on("pointerdown", () => this.closePlacePopup());

    const panel = this.add.rectangle(centerX, centerY, 560, 460, 0xf0e3c8, 1);
    panel.setStrokeStyle(3, 0x8f6c3c, 1);
    const title = this.add.text(centerX, centerY - 190, "\uC9D1 \uD589\uB3D9", this.getBodyStyle(34, "#3e2d1a", "bold"));
    title.setOrigin(0.5);
    const apText = this.add.text(centerX, centerY - 146, `\uB0A8\uC740 AP: ${this.actionPoint}/${this.maxActionPoint}`, this.getBodyStyle(21, "#4b381f", "bold"));
    apText.setOrigin(0.5);

    const sleepBtn = this.createActionButton({
      x: centerX,
      y: centerY - 54,
      width: 390,
      height: 66,
      text: "\uC7A0\uC790\uAE30 (AP 1)  -  \uC2A4\uD2B8\uB808\uC2A4 \uAC10\uC18C, \uCCB4\uB825 \uD68C\uBCF5",
      onClick: () => this.useHomeAction("sleep")
    });
    const studyBtn = this.createActionButton({
      x: centerX,
      y: centerY + 32,
      width: 390,
      height: 66,
      text: "\uACF5\uBD80\uD558\uAE30 (AP 1)  -  \uCF54\uB529\uB825 \uC99D\uAC00, \uC2A4\uD2B8\uB808\uC2A4/\uCCB4\uB825 \uBCC0\uD654",
      onClick: () => this.useHomeAction("study")
    });
    const gameBtn = this.createActionButton({
      x: centerX,
      y: centerY + 118,
      width: 390,
      height: 66,
      text: "\uAC8C\uC784\uD558\uAE30 (AP 1)  -  \uCF54\uB529\uB825 \uC18C\uD3ED \uAC10\uC18C, \uC2A4\uD2B8\uB808\uC2A4 \uAC10\uC18C",
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

    this.placePopupRoot = this.add.container(0, 0, [overlay, panel, title, apText, sleepBtn, studyBtn, gameBtn, closeBtn]);
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
      this.applyStatDelta({ coding: 8 });
      this.updateHudState({ hp: nextHp, stress: nextStress });
      this.showSystemToast("\uACF5\uBD80\uD558\uAE30 \uC644\uB8CC");
    } else {
      const nextHp = Phaser.Math.Clamp(this.hudState.hp - 6, 0, this.hudState.hpMax);
      const nextStress = Phaser.Math.Clamp(this.hudState.stress - 12, 0, 100);
      this.applyStatDelta({ coding: -3 });
      this.updateHudState({ hp: nextHp, stress: nextStress });
      this.showSystemToast("\uAC8C\uC784\uD558\uAE30 \uC644\uB8CC");
    }

    this.openHomeActionPopup();
  }

  private openDowntownBuildingPopup(buildingId: DowntownBuildingId): void {
    this.closePlacePopup();

    const centerX = this.px(GAME_CONSTANTS.WIDTH / 2);
    const centerY = this.px(GAME_CONSTANTS.HEIGHT / 2);
    const overlay = this.add.rectangle(centerX, centerY, GAME_CONSTANTS.WIDTH, GAME_CONSTANTS.HEIGHT, 0x000000, 0.36);
    overlay.setInteractive({ useHandCursor: true }).on("pointerdown", () => this.closePlacePopup());

    const config = this.getDowntownBuildingConfig(buildingId);
    const panel = this.add.rectangle(centerX, centerY, 540, 296, 0xf0e3c8, 1);
    panel.setStrokeStyle(3, 0x8f6c3c, 1);
    const title = this.add.text(centerX, centerY - 90, config.title, this.getBodyStyle(34, "#3e2d1a", "bold"));
    title.setOrigin(0.5);
    const desc = this.add.text(centerX, centerY - 12, config.description, this.getBodyStyle(21, "#4b381f"));
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

    this.placePopupRoot = this.add.container(0, 0, [overlay, panel, title, desc, actionBtn, closeBtn]);
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
        description: "\uAC04\uB2E8 \uC6B4\uB3D9 \uD504\uB85C\uADF8\uB7A8 1,000G\n\uCCB4\uB825 \uC18C\uD3ED \uD68C\uBCF5 / \uC2A4\uD2B8\uB808\uC2A4 \uAC10\uC18C"
      };
    }
    if (buildingId === "karaoke") {
      return {
        title: "\uB178\uB798\uBC29",
        description: "\uB9C8\uC74C\uAECF \uB178\uB798\uD558\uAE30 1,300G\n\uC2A4\uD2B8\uB808\uC2A4 \uAC10\uC18C / \uBC1C\uD45C\uB825 \uC18C\uD3ED \uC99D\uAC00"
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
      this.updateHudState({
        hp: Phaser.Math.Clamp(this.hudState.hp + 7, 0, this.hudState.hpMax),
        stress: Phaser.Math.Clamp(this.hudState.stress - 7, 0, 100)
      });
      this.applyStatDelta({ teamwork: 2 });
      this.closePlacePopup();
      this.showSystemToast("\uC6B4\uB3D9 \uC644\uB8CC");
      return;
    }

    if (buildingId === "karaoke") {
      if (!spend(1300)) return;
      this.updateHudState({
        hp: Phaser.Math.Clamp(this.hudState.hp - 3, 0, this.hudState.hpMax),
        stress: Phaser.Math.Clamp(this.hudState.stress - 14, 0, 100)
      });
      this.applyStatDelta({ presentation: 4 });
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
        0xf3e6c7,
        1
      )
      .setStrokeStyle(2, 0x9f7a47, 1);

    this.menuRoot.add(contentFrame);

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
      this.tabScrollPages[tab] = scrollPage;
      this.tabPages[tab] = scrollPage.root;
      this.pageRoot?.add(scrollPage.root);
    });

    this.switchTab("inventory");
  }

  private createTab(tab: TabKey, x: number, y: number, width: number, height: number): void {
    const bg = this.add.rectangle(x, y, width, height, 0xb79a6f, 1);
    bg.setStrokeStyle(2, 0x6d522f, 1);

    const lip = this.add.rectangle(x, this.px(y + height / 2 - 1), width - 6, 4, 0xe7d9bc, 1);
    lip.setVisible(false);

    const label = this.add.text(x, y, TAB_LABEL[tab], {
      fontFamily: this.uiFontFamily,
      fontSize: "24px",
      fontStyle: "bold",
      color: "#5a4327",
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

    this.activeTab = tab;

    TAB_ORDER.forEach((key) => {
      const isActive = key === tab;
      this.tabPages[key].setVisible(isActive);

      const visual = this.tabVisuals[key];
      visual.bg.setFillStyle(isActive ? 0xf2e2bf : 0xb79a6f, 1);
      visual.bg.setStrokeStyle(2, isActive ? 0x8f6c3c : 0x6d522f, 1);
      visual.label.setColor(isActive ? "#3d2a16" : "#5a4327");
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

    const maskGraphics = this.make.graphics({ x: 0, y: 0, add: false });
    maskGraphics.fillStyle(0xffffff, 1);
    maskGraphics.fillRect(viewport.x, viewport.y, viewport.width, viewport.height);
    content.setMask(maskGraphics.createGeometryMask());

    const trackX = this.px(bounds.x + bounds.width - 22);
    const track = this.add.rectangle(trackX, this.px(viewport.y + viewport.height / 2), 8, viewport.height, 0xd9c7a2, 1);
    track.setStrokeStyle(1, 0x9f7a47, 1);
    track.setInteractive({ useHandCursor: true });

    const thumb = this.add.rectangle(trackX, viewport.y + 40, 14, 48, 0xc8ae82, 1);
    thumb.setStrokeStyle(2, 0x725127, 1);
    thumb.setInteractive({ draggable: true, useHandCursor: true });
    this.input.setDraggable(thumb);

    const page: ScrollableTabPage = {
      root,
      content,
      maskGraphics,
      viewport,
      track,
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

    const travel = Math.max(0, page.viewport.height - page.thumbHeight);
    const ratio = page.minOffset === page.maxOffset ? 0 : (page.offset - page.maxOffset) / (page.minOffset - page.maxOffset);
    page.thumb.y = this.px(page.viewport.y + page.thumbHeight / 2 + travel * ratio);
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

    const wheelArea = new Phaser.Geom.Rectangle(page.viewport.x, page.viewport.y, page.viewport.width + 24, page.viewport.height);
    if (!Phaser.Geom.Rectangle.Contains(wheelArea, pointer.worldX, pointer.worldY)) return;
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

    const equipPanel = this.add.rectangle(equipPanelCenterX, panelY + panelH / 2, equipPanelW, panelH, 0xe9dcc1, 0.8);
    equipPanel.setStrokeStyle(2, 0x9f7a47, 1);
    const inventoryPanel = this.add.rectangle(inventoryPanelCenterX, panelY + panelH / 2, inventoryPanelW, panelH, 0xe9dcc1, 0.8);
    inventoryPanel.setStrokeStyle(2, 0x9f7a47, 1);

    const equipLabel = this.add.text(
      equipPanelCenterX,
      this.px(panelY + 12),
      "\uC7A5\uBE44 \uCE78",
      this.getBodyStyle(20, "#5a4426")
    );
    equipLabel.setOrigin(0.5, 0);
    const inventoryLabel = this.add.text(
      inventoryPanelCenterX,
      this.px(panelY + 12),
      "\uC778\uBCA4\uD1A0\uB9AC",
      this.getBodyStyle(20, "#5a4426")
    );
    inventoryLabel.setOrigin(0.5, 0);

    const createSlotView = (x: number, y: number, size: number): SlotView => {
      const bg = this.add.rectangle(x, y, size, size, 0xd8c6a3, 1);
      bg.setStrokeStyle(2, 0x8f6c3c, 1);

      const icon = this.add.rectangle(x, y, this.px(size - 14), this.px(size - 14), 0xffffff, 1);
      icon.setStrokeStyle(1, 0x7a5a2e, 1);
      icon.setVisible(false);

      const iconText = this.add.text(x, y + 1, "", this.getBodyStyle(Math.max(12, Math.floor(size * 0.28)), "#2f2518", "bold"));
      iconText.setOrigin(0.5);
      iconText.setVisible(false);

      const stackText = this.add.text(x + size / 2 - 4, y + size / 2 - 3, "", this.getBodyStyle(13, "#2f2518", "bold"));
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

    const keyboardLabel = this.add.text(keyboardSlotX, this.px(equipSlotY + equipSlotSize / 2 + 16), "\uD0A4\uBCF4\uB4DC", this.getBodyStyle(19, "#4a371f"));
    keyboardLabel.setOrigin(0.5, 0.5);
    const mouseLabel = this.add.text(mouseSlotX, this.px(equipSlotY + equipSlotSize / 2 + 16), "\uB9C8\uC6B0\uC2A4", this.getBodyStyle(19, "#4a371f"));
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
      equipPanel,
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

      const barBg = this.add.rectangle(barCenterX, y + 2, barW, 16, 0xd9c7a2, 1);
      barBg.setStrokeStyle(1, 0x9f7a47, 1);

      const barFillWidth = this.px((barW - 4) * Phaser.Math.Clamp(this.statsState[stat.key] / 100, 0, 1));
      const barFill = this.add.rectangle(this.px(barCenterX - barW / 2 + 2), y + 2, barFillWidth, 12, 0x8dba63, 1);
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
    const centerY = this.px(bounds.y + bounds.height / 2);

    const title = this.add.text(centerX, this.px(bounds.y + 122), "\uC138\uC774\uBE0C \uBA54\uB274", this.getBodyStyle(28, "#4b351f", "bold"));
    title.setOrigin(0.5, 0.5);

    const saveBtn = this.createActionButton({
      x: this.px(centerX - 120),
      y: centerY,
      width: 180,
      height: 52,
      text: "\uC800\uC7A5",
      onClick: () => this.showSystemToast("\uC800\uC7A5 \uC644\uB8CC (MVP)")
    });

    const loadBtn = this.createActionButton({
      x: this.px(centerX + 120),
      y: centerY,
      width: 180,
      height: 52,
      text: "\uBD88\uB7EC\uC624\uAE30",
      onClick: () => this.showSystemToast("\uBD88\uB7EC\uC624\uAE30 \uC644\uB8CC (MVP)")
    });

    container.add([title, saveBtn, loadBtn]);
    return container;
  }

  private createActionButton(options: {
    x: number;
    y: number;
    width: number;
    height: number;
    text: string;
    onClick: () => void;
  }): Phaser.GameObjects.Container {
    const bg = this.add.rectangle(options.x, options.y, options.width, options.height, 0xc8ae82, 1);
    bg.setStrokeStyle(2, 0x7d5f36, 1);

    const label = this.add.text(options.x, options.y, options.text, {
      fontFamily: this.uiFontFamily,
      fontSize: "22px",
      fontStyle: "bold",
      color: "#3e2d1a",
      resolution: 2
    });
    label.setOrigin(0.5);

    bg.setInteractive({ useHandCursor: true });
    bg.on("pointerdown", options.onClick);
    bg.on("pointerover", () => bg.setFillStyle(0xd9bf93, 1));
    bg.on("pointerout", () => bg.setFillStyle(0xc8ae82, 1));

    return this.add.container(0, 0, [bg, label]);
  }

  private handleNpcInteraction(): void {
    this.interactionTarget.setFillStyle(0xb07a3c, 1);
    this.time.delayedCall(160, () => {
      this.interactionTarget.setFillStyle(0x6e4f2b, 1);
    });

    this.openShop();
    this.showSystemToast("\uC0C1\uC810\uC744 \uC5F4\uC5C8\uC2B5\uB2C8\uB2E4");
  }

  private handleMiniGameNpcInteraction(): void {
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

    this.interactionTarget.setFillStyle(0x3f6e90, 1);
    this.time.delayedCall(160, () => {
      this.interactionTarget.setFillStyle(0x6e4f2b, 1);
    });

    this.showSystemToast("\uBBF8\uB2C8\uAC8C\uC784 \uC13C\uD130 \uC785\uC7A5");
    this.scene.launch("MenuScene", { returnSceneKey: SceneKey.Main });
    this.scene.pause(SceneKey.Main);
  }

  private buildShop(): void {
    const centerX = this.px(GAME_CONSTANTS.WIDTH / 2);
    const centerY = this.px(GAME_CONSTANTS.HEIGHT / 2);

    const overlay = this.add.rectangle(centerX, centerY, GAME_CONSTANTS.WIDTH, GAME_CONSTANTS.HEIGHT, 0x000000, 0.35);
    overlay.setInteractive({ useHandCursor: true }).on("pointerdown", () => this.closeShop());

    const panel = this.add.rectangle(centerX, centerY, 760, 430, 0xe9dcc1, 1);
    panel.setStrokeStyle(3, 0x8f6c3c, 1);

    const title = this.add.text(centerX, centerY - 190, "NPC \uC0C1\uC810", this.getBodyStyle(30, "#3d2a16", "bold"));
    title.setOrigin(0.5);
    const hint = this.add.text(centerX, centerY + 176, "ESC \uB610\uB294 \uBC30\uACBD \uD074\uB9AD\uC73C\uB85C \uB2EB\uAE30", this.getBodyStyle(16, "#6b5434"));
    hint.setOrigin(0.5);

    const cards: Phaser.GameObjects.GameObject[] = [];

    SHOP_ITEM_TEMPLATES.forEach((item, idx) => {
      const col = idx % 2;
      const row = Math.floor(idx / 2);
      const x = this.px(centerX - 170 + col * 340);
      const y = this.px(centerY - 62 + row * 165);
      const card = this.add.rectangle(x, y, 300, 140, 0xf2e7cf, 1);
      card.setStrokeStyle(2, 0x9f7a47, 1);

      const icon = this.add.rectangle(x - 100, y, 66, 66, item.color, 1);
      icon.setStrokeStyle(2, 0x725127, 1);
      const iconLabel = this.add.text(x - 100, y + 1, item.shortLabel, this.getBodyStyle(22, "#2d2418", "bold"));
      iconLabel.setOrigin(0.5);

      const name = this.add.text(x - 22, y - 28, item.name, this.getBodyStyle(19, "#3e2d1a", "bold"));
      name.setOrigin(0, 0.5);
      const price = this.add.text(x - 22, y + 2, `${item.price.toLocaleString("ko-KR")} G`, this.getBodyStyle(18, "#5a4426", "bold"));
      price.setOrigin(0, 0.5);
      const buyHint = this.add.text(x - 22, y + 30, "\uD074\uB9AD \uAD6C\uB9E4", this.getBodyStyle(15, "#5a4426"));
      buyHint.setOrigin(0, 0.5);

      card.setInteractive({ useHandCursor: true });
      card.on("pointerover", () => card.setFillStyle(0xf7edd8, 1));
      card.on("pointerout", () => card.setFillStyle(0xf2e7cf, 1));
      card.on("pointerdown", () => this.purchaseFromShop(item));

      cards.push(card, icon, iconLabel, name, price, buyHint);
    });

    this.shopRoot = this.add.container(0, 0, [overlay, panel, title, hint, ...cards]);
    this.shopRoot.setDepth(900);
    this.shopRoot.setVisible(false);
  }

  private openShop(): void {
    if (!this.shopRoot) return;
    this.shopOpen = true;
    this.shopRoot.setVisible(true);
  }

  private closeShop(): void {
    this.shopOpen = false;
    this.shopRoot?.setVisible(false);
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
      return { coding: 5 };
    }
    if (item.templateId === "mouse-basic") {
      return { teamwork: 5 };
    }
    return {};
  }

  private getConsumableStatDelta(item: InventoryItemTemplate): Partial<Record<StatKey, number>> {
    if (item.templateId === "snack-energybar") {
      return { stress: -4 };
    }
    if (item.templateId === "item-coffee") {
      return { coding: 2, stress: -2 };
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
    view.bg.setFillStyle(0xd8c6a3, 1);
    view.bg.setStrokeStyle(2, 0x8f6c3c, 1);
  }

  private applySlotHoverStyle(view: SlotView): void {
    view.bg.setFillStyle(0xe3d2b2, 1);
    view.bg.setStrokeStyle(2, 0x8f6c3c, 1);
  }

  private applySlotSelectedStyle(view: SlotView): void {
    view.bg.setFillStyle(0xecd9b7, 1);
    view.bg.setStrokeStyle(3, 0x725127, 1);
  }

  private createItemTooltip(): void {
    const bg = this.add.rectangle(0, 0, 220, 90, 0x3e2d1a, 0.95);
    bg.setOrigin(0, 0);
    bg.setStrokeStyle(2, 0x9f7a47, 1);
    const text = this.add.text(10, 8, "", this.getBodyStyle(15, "#f8e8c7"));
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
    icon.setStrokeStyle(2, 0x725127, 1);
    const label = this.add.text(0, 0, "", this.getBodyStyle(16, "#2d2418", "bold"));
    label.setOrigin(0.5);
    const stackText = this.add.text(16, 14, "", this.getBodyStyle(13, "#2d2418", "bold"));
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
      const bg = this.add.rectangle(0, 0, 220, 34, 0x3e2d1a, 0.95);
      bg.setStrokeStyle(2, 0x9f7a47, 1);
      const text = this.add.text(0, 0, "", this.getBodyStyle(17, "#f8e8c7"));
      text.setOrigin(0.5);

      this.systemToastRoot = this.add.container(0, 0, [bg, text]);
      this.systemToastRoot.setDepth(1300);
    }

    const bg = this.systemToastRoot.list[0] as Phaser.GameObjects.Rectangle;
    const text = this.systemToastRoot.list[1] as Phaser.GameObjects.Text;
    text.setText(message);
    bg.width = Math.max(180, Math.ceil(text.width + 26));

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
      color: "#3d2a16",
      resolution: 2
    };
  }

  private getBodyStyle(
    sizePx: number,
    color = "#3e2d1a",
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
      this.showSystemToast("AP\uAC00 \uBD80\uC871\uD569\uB2C8\uB2E4");
      return false;
    }

    this.actionPoint = Phaser.Math.Clamp(this.actionPoint - 1, 0, this.maxActionPoint);
    this.timeCycleIndex = (this.timeCycleIndex + 1) % TIME_CYCLE.length;

    const patch: Partial<HudState> = {
      timeLabel: TIME_CYCLE[this.timeCycleIndex]
    };

    if (this.timeCycleIndex === 0) {
      this.actionPoint = this.maxActionPoint;
      this.dayCycleIndex = (this.dayCycleIndex + 1) % DAY_CYCLE.length;
      patch.dayLabel = DAY_CYCLE[this.dayCycleIndex];
      if (this.dayCycleIndex === 0) {
        patch.week = this.hudState.week + 1;
      }
      this.time.delayedCall(180, () => {
        this.showSystemToast("\uD558\uB8E8\uAC00 \uC9C0\uB0AC\uC2B5\uB2C8\uB2E4");
      });
    }

    this.updateHudState(patch);
    return true;
  }
}
