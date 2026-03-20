// 월드 TMX/TSX를 읽고 실제 타일맵 레이어를 렌더하는 매니저다.
import Phaser from "phaser";
import { ASSET_KEYS } from "../../common/assets/assetKeys";
import type { AreaId } from "../../common/enums/area";
import { AREA_DEFINITIONS, type AreaDefinition } from "../definitions/areas/areaDefinitions";
import type {
  ParsedTmxLayer,
  ParsedTmxMap,
  ParsedTmxTilesetRef,
  ParsedTsxTileset,
  ResolvedTmxLayers,
  TmxAreaConfig,
  TmxRuntimeGrids
} from "../systems/tmxNavigation";
import {
  buildRuntimeGrids,
  getTilesetSourceBasename,
  parseTmxMap,
  parseTsxTileset,
  resolveTmxLayers
} from "../systems/tmxNavigation";

const BASE_MAP_DEPTH = 0;
const FOREGROUND_MAP_DEPTH = 200;

export type WorldRenderBounds = {
  offsetX: number;
  offsetY: number;
  scale: number;
  tileWidth: number;
  tileHeight: number;
  mapWidth: number;
  mapHeight: number;
};

export class WorldManager {
  private scene: Phaser.Scene;
  private currentAreaId?: AreaId;
  private background?: Phaser.GameObjects.Rectangle;
  private areaLabel?: Phaser.GameObjects.Text;
  private currentParsedTmxMap?: ParsedTmxMap;
  private currentParsedTsxTileset?: ParsedTsxTileset;
  private currentResolvedTmxLayers?: ResolvedTmxLayers;
  private currentRuntimeGrids?: TmxRuntimeGrids;
  private currentRenderBounds?: WorldRenderBounds;
  private renderedTilemaps: Phaser.Tilemaps.Tilemap[] = [];
  private renderedLayers: Phaser.Tilemaps.TilemapLayer[] = [];

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  loadArea(areaId: AreaId) {
    const area = this.requireArea(areaId);
    this.currentAreaId = areaId;

    if (!this.background) {
      this.background = this.scene.add.rectangle(640, 360, 1280, 720, 0x31473a);
    }

    if (!this.areaLabel) {
      this.areaLabel = this.scene.add.text(24, 24, "", {
        fontSize: "28px",
        color: "#ffffff"
      });
    }

    // 타일 렌더가 실패할 때만 기본 배경이 보이게 한다.
    this.background.setFillStyle(this.resolveBackgroundColor(areaId));
    this.background.setVisible(true);
    this.areaLabel.setText(area.label);

    this.currentParsedTmxMap = this.parseCurrentAreaTmx(area);
    this.currentParsedTsxTileset = this.parseCurrentAreaTsx();
    this.currentResolvedTmxLayers = this.resolveCurrentAreaLayers();
    this.currentRuntimeGrids = this.buildCurrentRuntimeGrids();
    this.renderCurrentAreaMap();

    return area;
  }

  getCurrentAreaId() {
    return this.currentAreaId;
  }

  getCurrentAreaDefinition() {
    if (!this.currentAreaId) {
      return undefined;
    }

    return AREA_DEFINITIONS[this.currentAreaId];
  }

  getCurrentTmxConfig(): TmxAreaConfig | undefined {
    const area = this.getCurrentAreaDefinition();
    if (!area?.tmxKey) {
      return undefined;
    }

    return {
      tmxKey: area.tmxKey,
      collisionLayerNames: area.collisionLayerNames,
      interactionLayerNames: area.interactionLayerNames,
      foregroundLayerNames: area.foregroundLayerNames
    };
  }

  getCurrentParsedTmxMap() {
    return this.currentParsedTmxMap;
  }

  getCurrentResolvedTmxLayers() {
    return this.currentResolvedTmxLayers;
  }

  getCurrentRuntimeGrids() {
    return this.currentRuntimeGrids;
  }

  getCurrentRenderBounds() {
    return this.currentRenderBounds;
  }

  private parseCurrentAreaTmx(area: AreaDefinition) {
    if (!area.tmxKey) {
      return undefined;
    }

    const rawTmx = this.scene.cache.text.get(area.tmxKey) as string | undefined;
    if (!rawTmx) {
      return undefined;
    }

    return parseTmxMap(rawTmx) ?? undefined;
  }

  private parseCurrentAreaTsx() {
    const rawTsx = this.scene.cache.text.get(ASSET_KEYS.map.tilesetTsx) as string | undefined;
    if (!rawTsx) {
      return undefined;
    }

    return parseTsxTileset(rawTsx) ?? undefined;
  }

  private resolveCurrentAreaLayers() {
    const parsedMap = this.currentParsedTmxMap;
    const tmxConfig = this.getCurrentTmxConfig();

    if (!parsedMap || !tmxConfig) {
      return undefined;
    }

    return resolveTmxLayers(parsedMap, tmxConfig);
  }

  private buildCurrentRuntimeGrids() {
    if (!this.currentParsedTmxMap || !this.currentResolvedTmxLayers) {
      return undefined;
    }

    return buildRuntimeGrids(this.currentParsedTmxMap, this.currentResolvedTmxLayers);
  }

  private renderCurrentAreaMap() {
    this.renderedTilemaps.forEach((tilemap) => tilemap.destroy());
    this.renderedTilemaps = [];
    this.renderedLayers.forEach((layer) => layer.destroy());
    this.renderedLayers = [];
    this.currentRenderBounds = undefined;

    const parsedMap = this.currentParsedTmxMap;
    const parsedTsx = this.currentParsedTsxTileset;
    const area = this.getCurrentAreaDefinition();

    if (!parsedMap || !parsedTsx || !area) {
      return;
    }

    // 보이는 레이어는 전부 렌더한다.
    const visualLayers = parsedMap.layers.filter((layer) => layer.visible);

    if (visualLayers.length === 0) {
      return;
    }

    // 래퍼 구현처럼 맵 전체를 화면에 맞춰 스케일한다.
    const mapPixelWidth = parsedMap.width * parsedMap.tileWidth;
    const mapPixelHeight = parsedMap.height * parsedMap.tileHeight;
    const fitScaleX = this.scene.scale.width / mapPixelWidth;
    const fitScaleY = this.scene.scale.height / mapPixelHeight;
    const scale = Math.max(fitScaleX, fitScaleY);
    const renderWidth = mapPixelWidth * scale;
    const renderHeight = mapPixelHeight * scale;
    const offsetX = Math.round((this.scene.scale.width - renderWidth) / 2);
    const offsetY = Math.round((this.scene.scale.height - renderHeight) / 2);

    // 플레이어와 충돌이 같은 좌표계를 쓰도록 렌더 bounds를 저장한다.
    this.currentRenderBounds = {
      offsetX,
      offsetY,
      scale,
      tileWidth: parsedMap.tileWidth,
      tileHeight: parsedMap.tileHeight,
      mapWidth: parsedMap.width,
      mapHeight: parsedMap.height
    };

    visualLayers.forEach((layer, index) => {
      const tilemap = this.scene.make.tilemap({
        data: layer.data,
        tileWidth: parsedMap.tileWidth,
        tileHeight: parsedMap.tileHeight
      });

      const tilesets = parsedMap.tilesets
        .map((tilesetRef, tilesetIndex) =>
          this.addResolvedTileset(tilemap, parsedTsx, tilesetRef, tilesetIndex)
        )
        .filter((tileset): tileset is Phaser.Tilemaps.Tileset => Boolean(tileset));

      if (tilesets.length === 0) {
        tilemap.destroy();
        return;
      }

      const tilemapLayer = tilemap.createLayer(0, tilesets, 0, 0);
      if (!tilemapLayer) {
        tilemap.destroy();
        return;
      }

      // 타일 레이어에 렌더 좌표계를 적용한다.
      tilemapLayer.setVisible(layer.visible);
      tilemapLayer.setPosition(offsetX, offsetY);
      tilemapLayer.setScale(scale);
      tilemapLayer.setDepth(this.resolveLayerDepth(layer, area, index));

      this.renderedTilemaps.push(tilemap);
      this.renderedLayers.push(tilemapLayer);
    });

    if (this.renderedLayers.length > 0) {
      this.background?.setVisible(false);
    }
  }

  private addResolvedTileset(
    tilemap: Phaser.Tilemaps.Tilemap,
    parsedTsx: ParsedTsxTileset,
    tilesetRef: ParsedTmxTilesetRef,
    tilesetIndex: number
  ) {
    // TMX 외부 tileset source와 TSX 메타를 함께 써서 연결 이름을 안정화한다.
    const sourceBaseName = getTilesetSourceBasename(tilesetRef.source);
    const imageBaseName = getTilesetSourceBasename(parsedTsx.imageSource);
    const tilesetName =
      sourceBaseName ??
      parsedTsx.name ??
      imageBaseName ??
      tilesetRef.name;

    return tilemap.addTilesetImage(
      `${tilesetName}_${tilesetIndex}`,
      ASSET_KEYS.map.tilesetImage,
      parsedTsx.tileWidth,
      parsedTsx.tileHeight,
      parsedTsx.margin,
      parsedTsx.spacing,
      tilesetRef.firstgid
    );
  }

  private resolveLayerDepth(
    layer: ParsedTmxLayer,
    area: AreaDefinition,
    index: number
  ) {
    const normalized = layer.name.trim().toLowerCase();

    const isForegroundLayer = area.foregroundLayerNames.some(
      (name) => name.trim().toLowerCase() === normalized
    );

    if (isForegroundLayer) {
      return FOREGROUND_MAP_DEPTH + index;
    }

    return BASE_MAP_DEPTH + index;
  }

  private requireArea(areaId: AreaId): AreaDefinition {
    const area = AREA_DEFINITIONS[areaId];
    if (!area) {
      throw new Error(`Area not found: ${areaId}`);
    }
    return area;
  }

  private resolveBackgroundColor(areaId: AreaId) {
    switch (areaId) {
      case "world":
        return 0x2f3648;
      case "downtown":
        return 0x4a4032;
      case "campus":
        return 0x31473a;
      default:
        return 0x222222;
    }
  }
}
