// 월드 TMX/TSX를 읽고 실제 타일맵 레이어를 렌더하는 매니저다.
import Phaser from "phaser";
import { getMapTilesetAssetBySource } from "../../common/assets/assetKeys";
import type { AreaId } from "../../common/enums/area";
import {
  getAreaDefinition,
  getAreaTmxConfig,
  type AreaDefinition
} from "../definitions/areas/areaDefinitions";
import { RENDER_DEPTH } from "../systems/renderDepth";
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
  private currentParsedTmxMap?: ParsedTmxMap;
  private currentParsedTsxTilesets = new Map<string, ParsedTsxTileset>();
  private currentResolvedTmxLayers?: ResolvedTmxLayers;
  private currentRuntimeGrids?: TmxRuntimeGrids;
  private currentRenderBounds?: WorldRenderBounds;
  private renderedTilemaps: Phaser.Tilemaps.Tilemap[] = [];
  private renderedLayers: Phaser.Tilemaps.TilemapLayer[] = [];
  private blockedOverlayGraphics: Phaser.GameObjects.Graphics[] = [];

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  loadArea(areaId: AreaId) {
    const area = this.requireArea(areaId);
    this.currentAreaId = areaId;

    if (!this.background) {
      this.background = this.scene.add.rectangle(640, 360, 1280, 720, 0x31473a);
    }

    // 타일 렌더가 실패할 때만 기본 배경이 보이게 한다.
    this.background.setFillStyle(this.resolveBackgroundColor(areaId));
    this.background.setVisible(true);
    this.currentParsedTmxMap = this.parseCurrentAreaTmx(area);
    this.currentParsedTsxTilesets = this.parseCurrentAreaTilesets();
    this.currentResolvedTmxLayers = this.resolveCurrentAreaLayers();
    this.currentRuntimeGrids = this.buildCurrentRuntimeGrids();
    this.renderCurrentAreaMap();

    return area;
  }

  rerenderCurrentArea() {
    if (!this.currentAreaId || !this.currentParsedTmxMap || !this.currentResolvedTmxLayers || !this.currentRuntimeGrids) {
      return false;
    }

    this.background?.setFillStyle(this.resolveBackgroundColor(this.currentAreaId));
    this.background?.setVisible(true);
    this.renderCurrentAreaMap();
    return true;
  }

  getCurrentAreaId() {
    return this.currentAreaId;
  }

  getCurrentAreaDefinition() {
    if (!this.currentAreaId) {
      return undefined;
    }

    return getAreaDefinition(this.currentAreaId);
  }

  getCurrentTmxConfig(): TmxAreaConfig | undefined {
    if (!this.currentAreaId) {
      return undefined;
    }

    return getAreaTmxConfig(this.currentAreaId);
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
    if (!area.map.tmxKey) {
      return undefined;
    }

    const rawTmx = this.scene.cache.text.get(area.map.tmxKey) as string | undefined;
    if (!rawTmx) {
      return undefined;
    }

    return parseTmxMap(rawTmx) ?? undefined;
  }

  private parseCurrentAreaTilesets() {
    const parsedTilesets = new Map<string, ParsedTsxTileset>();
    const parsedMap = this.currentParsedTmxMap;

    parsedMap?.tilesets.forEach((tilesetRef) => {
      const source = getTilesetSourceBasename(tilesetRef.source);
      if (!source || parsedTilesets.has(source)) {
        return;
      }

      const tilesetAsset = getMapTilesetAssetBySource(tilesetRef.source);
      if (!tilesetAsset) {
        return;
      }

      const rawTsx = this.scene.cache.text.get(tilesetAsset.tsxKey) as string | undefined;
      if (!rawTsx) {
        return;
      }

      const parsedTsx = parseTsxTileset(rawTsx);
      if (parsedTsx) {
        parsedTilesets.set(source, parsedTsx);
      }
    });

    return parsedTilesets;
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
    const area = this.getCurrentAreaDefinition();

    if (!this.currentParsedTmxMap || !this.currentResolvedTmxLayers || !area) {
      return undefined;
    }

    return buildRuntimeGrids(
      this.currentParsedTmxMap,
      this.currentResolvedTmxLayers,
      area.map.walkableTileZones,
      area.map.blockedTileZones,
      area.map.blockedTiles,
      area.map.walkableTiles
    );
  }

  private clearRenderedAreaMap() {
    this.renderedTilemaps.forEach((tilemap) => tilemap.destroy());
    this.renderedTilemaps = [];
    this.renderedLayers.forEach((layer) => layer.destroy());
    this.renderedLayers = [];
    this.blockedOverlayGraphics.forEach((overlay) => overlay.destroy());
    this.blockedOverlayGraphics = [];
    this.currentRenderBounds = undefined;
  }

  private renderCurrentAreaMap() {
    this.clearRenderedAreaMap();

    const parsedMap = this.currentParsedTmxMap;
    const area = this.getCurrentAreaDefinition();

    if (!parsedMap || !area) {
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
    const scale = this.resolvePixelPerfectScale(fitScaleX, fitScaleY);
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
          this.addResolvedTileset(tilemap, tilesetRef, tilesetIndex)
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

    this.renderBlockedOverlays(area);
  }

  private addResolvedTileset(
    tilemap: Phaser.Tilemaps.Tilemap,
    tilesetRef: ParsedTmxTilesetRef,
    tilesetIndex: number
  ) {
    const tilesetAsset = getMapTilesetAssetBySource(tilesetRef.source);
    const sourceBaseName = getTilesetSourceBasename(tilesetRef.source);
    const parsedTsx = sourceBaseName ? this.currentParsedTsxTilesets.get(sourceBaseName) : undefined;

    if (!tilesetAsset || !parsedTsx) {
      return null;
    }

    // TMX 외부 tileset source와 TSX 메타를 함께 써서 연결 이름을 안정화한다.
    const imageBaseName = getTilesetSourceBasename(parsedTsx.imageSource);
    const tilesetName =
      sourceBaseName ??
      parsedTsx.name ??
      imageBaseName ??
      tilesetRef.name;

    return tilemap.addTilesetImage(
      `${tilesetName}_${tilesetIndex}`,
      tilesetAsset.imageKey,
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

    const isForegroundLayer = area.map.foregroundLayerNames.some(
      (name) => name.trim().toLowerCase() === normalized
    );

    if (isForegroundLayer) {
      return RENDER_DEPTH.foregroundMap + index;
    }

    return RENDER_DEPTH.baseMap + index;
  }

  private renderBlockedOverlays(area: AreaDefinition) {
    const renderBounds = this.currentRenderBounds;
    const blockedOverlays = area.presentation.blockedOverlays;

    if (!renderBounds || !blockedOverlays || blockedOverlays.length === 0) {
      return;
    }

    blockedOverlays.forEach((overlay) => {
      const graphics = this.scene.add.graphics().setDepth(RENDER_DEPTH.baseMap - 1);
      const zoneX = renderBounds.offsetX + overlay.tileRect.x * renderBounds.tileWidth * renderBounds.scale;
      const zoneY = renderBounds.offsetY + overlay.tileRect.y * renderBounds.tileHeight * renderBounds.scale;
      const zoneWidth = overlay.tileRect.width * renderBounds.tileWidth * renderBounds.scale;
      const zoneHeight = overlay.tileRect.height * renderBounds.tileHeight * renderBounds.scale;

      graphics.fillStyle(overlay.color, overlay.alpha);
      graphics.fillRect(zoneX, zoneY, zoneWidth, zoneHeight);
      this.blockedOverlayGraphics.push(graphics);
    });
  }

  private requireArea(areaId: AreaId): AreaDefinition {
    return getAreaDefinition(areaId);
  }

  private resolveBackgroundColor(areaId: AreaId) {
    switch (areaId) {
      case "world":
        return 0x2f3648;
      case "downtown":
        return 0x4a4032;
      case "campus":
        return 0x31473a;
      case "classroom":
        return 0x31473a;
      default:
        return 0x222222;
    }
  }

private resolvePixelPerfectScale(fitScaleX: number, fitScaleY: number) {
  return fitScaleX;
}
}
