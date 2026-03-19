import Phaser from "phaser";
import { GAME_CONSTANTS } from "@core/constants/gameConstants";
import { DOWNTOWN_BUILDINGS } from "@features/place/downtownBuildings";
import type { DowntownBuildingId } from "@features/place/placeActions";
import {
  buildAreaCollisionConfigFromTmxText,
  buildInteractionZonesFromTmxText,
  mapPointToAreaBounds,
  mapSizeToAreaBounds,
  type AreaCollisionConfig,
  type AreaRenderBounds
} from "@features/world/tmxNavigation";
import {
  AREA_COLLISION_LAYER_NAMES,
  AREA_FOREGROUND_LAYER_DEPTH,
  AREA_INTERACTION_LAYER_NAMES,
  AREA_TMX_TEXT_KEYS,
  type AreaId,
  type WorldPlaceId,
  WORLD_PLACE_NODES
} from "./areaSceneConfig";

export type WorldPlaceView = {
  marker: Phaser.GameObjects.Rectangle;
  label: Phaser.GameObjects.Text;
};

export type DowntownBuildingView = {
  id: DowntownBuildingId;
  hitBox: Phaser.GameObjects.Rectangle;
  left: number;
  right: number;
  top: number;
  bottom: number;
  defaultFillColor: number;
  defaultFillAlpha: number;
  defaultStrokeColor: number;
  defaultStrokeAlpha: number;
};

type BuildAreaContext = {
  scene: Phaser.Scene;
  px: (value: number) => number;
  getBodyStyle: (
    sizePx: number,
    color?: string,
    fontStyle?: "normal" | "bold"
  ) => Phaser.Types.GameObjects.Text.TextStyle;
  buildAreaTmxBackground: (
    root: Phaser.GameObjects.Container,
    foregroundRoot: Phaser.GameObjects.Container,
    areaId: AreaId,
    textKey: string
  ) => AreaRenderBounds;
};

export type WorldAreaBuildResult = {
  root: Phaser.GameObjects.Container;
  foregroundRoot: Phaser.GameObjects.Container;
  collisionConfig?: AreaCollisionConfig;
  placeViews: Partial<Record<WorldPlaceId, WorldPlaceView>>;
  interactionZones: Partial<Record<WorldPlaceId, Phaser.Geom.Rectangle>>;
};

export type DowntownAreaBuildResult = {
  root: Phaser.GameObjects.Container;
  foregroundRoot: Phaser.GameObjects.Container;
  collisionConfig?: AreaCollisionConfig;
  buildingViews: DowntownBuildingView[];
};

export type CampusAreaBuildResult = {
  root: Phaser.GameObjects.Container;
  foregroundRoot: Phaser.GameObjects.Container;
  collisionConfig?: AreaCollisionConfig;
};

export function buildWorldArea(context: BuildAreaContext): WorldAreaBuildResult {
  const { scene, px, getBodyStyle, buildAreaTmxBackground } = context;
  const worldRoot = scene.add.container(0, 0);
  worldRoot.setDepth(0);
  const worldForegroundRoot = scene.add.container(0, 0);
  worldForegroundRoot.setDepth(AREA_FOREGROUND_LAYER_DEPTH);
  const worldObjects: Phaser.GameObjects.GameObject[] = [];
  const worldTmxBounds = buildAreaTmxBackground(worldRoot, worldForegroundRoot, "world", AREA_TMX_TEXT_KEYS.world);
  const worldUsesTmx = Boolean(worldTmxBounds);
  const worldTmxText = worldTmxBounds ? scene.cache.text.get(AREA_TMX_TEXT_KEYS.world) : "";
  const collisionConfig = worldTmxBounds
    ? buildAreaCollisionConfigFromTmxText(
        typeof worldTmxText === "string" ? worldTmxText : "",
        worldTmxBounds,
        AREA_COLLISION_LAYER_NAMES.world
      ) ?? undefined
    : undefined;

  if (!worldUsesTmx) {
    const worldBg = scene.add.rectangle(
      px(GAME_CONSTANTS.WIDTH / 2),
      px(GAME_CONSTANTS.HEIGHT / 2),
      GAME_CONSTANTS.WIDTH,
      GAME_CONSTANTS.HEIGHT,
      0x8aaa73,
      1
    );
    const worldBoard = scene.add.rectangle(
      px(GAME_CONSTANTS.WIDTH / 2),
      px(GAME_CONSTANTS.HEIGHT / 2),
      px(GAME_CONSTANTS.WIDTH - 150),
      px(GAME_CONSTANTS.HEIGHT - 120),
      0xd6c49e,
      1
    );
    worldBoard.setStrokeStyle(4, 0x7d5f36, 1);
    const horizontalRoad = scene.add.rectangle(px(GAME_CONSTANTS.WIDTH / 2), px(GAME_CONSTANTS.HEIGHT / 2), 820, 56, 0xb6986f, 1);
    horizontalRoad.setStrokeStyle(2, 0x7d5f36, 1);
    const verticalRoad = scene.add.rectangle(px(GAME_CONSTANTS.WIDTH / 2), px(GAME_CONSTANTS.HEIGHT / 2), 56, 430, 0xb6986f, 1);
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

  const title = scene.add.text(
    px(GAME_CONSTANTS.WIDTH / 2),
    86,
    "\uC804\uCCB4 \uC9C0\uB3C4",
    getBodyStyle(40, worldUsesTmx ? "#f2ead7" : "#3e2d1a", "bold")
  );
  title.setOrigin(0.5);
  worldObjects.push(title);

  const placeViews: Partial<Record<WorldPlaceId, WorldPlaceView>> = {};
  const interactionZones: Partial<Record<WorldPlaceId, Phaser.Geom.Rectangle>> = {};

  WORLD_PLACE_NODES.forEach((place) => {
    const mapped = mapPointToAreaBounds(place.x, place.y, worldTmxBounds, (value) => px(value));
    const zone = tmxWorldZones?.[place.id];
    const mappedZoneSize = zone
      ? { width: zone.width, height: zone.height }
      : mapSizeToAreaBounds(place.zoneWidth, place.zoneHeight, worldTmxBounds, (value) => px(value));
    const zoneCenter = zone ? { x: zone.centerX, y: zone.centerY } : mapped;
    const markerSize = mapSizeToAreaBounds(40, 28, worldTmxBounds, (value) => px(value));
    const marker = scene.add.rectangle(zoneCenter.x, zoneCenter.y, markerSize.width, markerSize.height, place.movable ? 0xe7d593 : 0xc9a67f, 1);
    marker.setStrokeStyle(2, 0x5d4426, 1);
    marker.setVisible(false);

    const mappedLabel = zone
      ? { x: zone.centerX, y: zone.centerY + mappedZoneSize.height / 2 + 8 }
      : mapPointToAreaBounds(place.x, place.y + 28, worldTmxBounds, (value) => px(value));
    const label = scene.add.text(mappedLabel.x, mappedLabel.y, place.label, getBodyStyle(18, "#3d2d1d", "bold"));
    label.setOrigin(0.5, 0);
    label.setVisible(false);

    placeViews[place.id] = { marker, label };
    interactionZones[place.id] = new Phaser.Geom.Rectangle(
      px(zoneCenter.x - mappedZoneSize.width / 2),
      px(zoneCenter.y - mappedZoneSize.height / 2),
      px(mappedZoneSize.width),
      px(mappedZoneSize.height)
    );
    worldObjects.push(marker, label);
  });

  worldRoot.add(worldObjects);

  return {
    root: worldRoot,
    foregroundRoot: worldForegroundRoot,
    collisionConfig,
    placeViews,
    interactionZones
  };
}

export function buildDowntownArea(context: BuildAreaContext): DowntownAreaBuildResult {
  const { scene, px, getBodyStyle, buildAreaTmxBackground } = context;
  const downtownRoot = scene.add.container(0, 0);
  downtownRoot.setDepth(0);
  const downtownForegroundRoot = scene.add.container(0, 0);
  downtownForegroundRoot.setDepth(AREA_FOREGROUND_LAYER_DEPTH);
  const downtownTmxBounds = buildAreaTmxBackground(downtownRoot, downtownForegroundRoot, "downtown", AREA_TMX_TEXT_KEYS.downtown);
  const downtownUsesTmx = Boolean(downtownTmxBounds);
  const downtownTmxText = downtownTmxBounds ? scene.cache.text.get(AREA_TMX_TEXT_KEYS.downtown) : "";
  const collisionConfig = downtownTmxBounds
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
  const areaTitle = scene.add.text(
    px(GAME_CONSTANTS.WIDTH / 2),
    82,
    "\uBC88\uD654\uAC00",
    getBodyStyle(38, downtownUsesTmx ? "#f2ead7" : "#f4ecd8", "bold")
  );
  areaTitle.setOrigin(0.5);
  const buildingObjects: Phaser.GameObjects.GameObject[] = [];
  const downtownDecorObjects: Phaser.GameObjects.GameObject[] = [];

  if (!downtownUsesTmx) {
    const downtownBg = scene.add.rectangle(
      px(GAME_CONSTANTS.WIDTH / 2),
      px(GAME_CONSTANTS.HEIGHT / 2),
      GAME_CONSTANTS.WIDTH,
      GAME_CONSTANTS.HEIGHT,
      0x7ea274,
      1
    );
    const downtownRoad = scene.add.rectangle(px(GAME_CONSTANTS.WIDTH / 2), px(GAME_CONSTANTS.HEIGHT * 0.63), 1120, 170, 0xa78c68, 1);
    downtownRoad.setStrokeStyle(3, 0x6d522f, 1);
    const shopFront = scene.add.rectangle(px(930), px(332), 190, 140, 0xd6b98a, 1);
    shopFront.setStrokeStyle(3, 0x6d522f, 1);
    const shopSign = scene.add.text(930, 332, "\uC0C1\uC810", getBodyStyle(27, "#3e2d1a", "bold"));
    shopSign.setOrigin(0.5);
    downtownDecorObjects.push(downtownBg, downtownRoad, shopFront, shopSign);
  }

  const buildingViews: DowntownBuildingView[] = [];

  DOWNTOWN_BUILDINGS.forEach((building) => {
    const zone = downtownZones?.[building.id];
    const mappedCenter = zone
      ? { x: zone.centerX, y: zone.centerY }
      : mapPointToAreaBounds(building.x, building.y, downtownTmxBounds, (value) => px(value));
    const mappedSize = zone
      ? { width: zone.width, height: zone.height }
      : mapSizeToAreaBounds(building.w, building.h, downtownTmxBounds, (value) => px(value));

    const hitBox = scene.add.rectangle(
      mappedCenter.x,
      mappedCenter.y,
      mappedSize.width,
      mappedSize.height,
      downtownUsesTmx ? 0x000000 : building.color,
      downtownUsesTmx ? 0.001 : 1
    );
    const defaultFillColor = downtownUsesTmx ? 0x000000 : building.color;
    const defaultFillAlpha = downtownUsesTmx ? 0.001 : 1;
    if (!downtownUsesTmx) {
      hitBox.setStrokeStyle(3, 0x6d522f, 1);
    }
    buildingViews.push({
      id: building.id,
      hitBox,
      left: mappedCenter.x - mappedSize.width / 2,
      right: mappedCenter.x + mappedSize.width / 2,
      top: mappedCenter.y - mappedSize.height / 2,
      bottom: mappedCenter.y + mappedSize.height / 2,
      defaultFillColor,
      defaultFillAlpha,
      defaultStrokeColor: 0x6d522f,
      defaultStrokeAlpha: downtownUsesTmx ? 0 : 1
    });

    buildingObjects.push(hitBox);

    if (!downtownUsesTmx) {
      const sign = scene.add.rectangle(px(building.x), px(building.y - building.h / 2 + 16), px(building.w - 18), 24, 0xe8d1a7, 1);
      sign.setStrokeStyle(2, 0x7d5f36, 1);
      const signLabel = scene.add.text(px(building.x), px(building.y - building.h / 2 + 16), building.label, getBodyStyle(15, "#3d2a16", "bold"));
      signLabel.setOrigin(0.5);
      buildingObjects.push(sign, signLabel);
    }
  });

  downtownRoot.add([...downtownDecorObjects, ...buildingObjects, areaTitle]);
  downtownRoot.setVisible(false);

  return {
    root: downtownRoot,
    foregroundRoot: downtownForegroundRoot,
    collisionConfig,
    buildingViews
  };
}

export function buildCampusArea(context: BuildAreaContext): CampusAreaBuildResult {
  const { scene, px, getBodyStyle, buildAreaTmxBackground } = context;
  const campusRoot = scene.add.container(0, 0);
  campusRoot.setDepth(0);
  const campusForegroundRoot = scene.add.container(0, 0);
  campusForegroundRoot.setDepth(AREA_FOREGROUND_LAYER_DEPTH);
  const campusTmxBounds = buildAreaTmxBackground(campusRoot, campusForegroundRoot, "campus", AREA_TMX_TEXT_KEYS.campus);
  const campusUsesTmx = Boolean(campusTmxBounds);
  const campusTmxText = campusTmxBounds ? scene.cache.text.get(AREA_TMX_TEXT_KEYS.campus) : "";
  const collisionConfig = campusTmxBounds
    ? buildAreaCollisionConfigFromTmxText(
        typeof campusTmxText === "string" ? campusTmxText : "",
        campusTmxBounds,
        AREA_COLLISION_LAYER_NAMES.campus
      ) ?? undefined
    : undefined;
  const campusObjects: Phaser.GameObjects.GameObject[] = [];

  if (!campusUsesTmx) {
    const campusBg = scene.add.rectangle(
      px(GAME_CONSTANTS.WIDTH / 2),
      px(GAME_CONSTANTS.HEIGHT / 2),
      GAME_CONSTANTS.WIDTH,
      GAME_CONSTANTS.HEIGHT,
      0x86ad82,
      1
    );
    const lawn = scene.add.rectangle(px(GAME_CONSTANTS.WIDTH / 2), px(GAME_CONSTANTS.HEIGHT * 0.62), 980, 280, 0x9dc08a, 1);
    lawn.setStrokeStyle(3, 0x5a7e4f, 1);
    const building = scene.add.rectangle(px(920), px(300), 280, 180, 0xd7c9a9, 1);
    building.setStrokeStyle(3, 0x7d5f36, 1);
    const buildingLabel = scene.add.text(920, 300, "\uAC15\uC758\uB3D9", getBodyStyle(30, "#3e2d1a", "bold"));
    buildingLabel.setOrigin(0.5);
    const tree1 = scene.add.rectangle(286, 280, 64, 64, 0x6f955f, 1).setStrokeStyle(2, 0x3f5f32, 1);
    const tree2 = scene.add.rectangle(352, 330, 64, 64, 0x6f955f, 1).setStrokeStyle(2, 0x3f5f32, 1);
    campusObjects.push(campusBg, lawn, building, buildingLabel, tree1, tree2);
  }

  const campusTitle = scene.add.text(px(GAME_CONSTANTS.WIDTH / 2), 82, "\uCEA0\uD37C\uC2A4", getBodyStyle(38, "#f2ead7", "bold"));
  campusTitle.setOrigin(0.5);
  campusObjects.push(campusTitle);
  campusRoot.add(campusObjects);
  campusRoot.setVisible(false);

  return {
    root: campusRoot,
    foregroundRoot: campusForegroundRoot,
    collisionConfig
  };
}
