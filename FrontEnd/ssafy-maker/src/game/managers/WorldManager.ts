// 지역 정의와 TMX/TSX 메타를 읽어 현재 월드 상태, TMX 파싱 결과, 런타임 그리드, 맵 렌더를 관리하는 월드 매니저
import Phaser from "phaser";
import { ASSET_KEYS } from "../../common/assets/assetKeys";
import type { AreaId } from "../../common/enums/area";
import { AREA_DEFINITIONS, type AreaDefinition } from "../definitions/areas/areaDefinitions";
import type {
  ParsedTmxLayer,
  ParsedTmxMap,
  ParsedTsxTileset,
  ResolvedTmxLayers,
  TmxAreaConfig,
  TmxRuntimeGrids
} from "../systems/tmxNavigation";
import {
  buildRuntimeGrids,
  parseTmxMap,
  parseTsxTileset,
  resolveTmxLayers
} from "../systems/tmxNavigation";

const BASE_MAP_DEPTH = 0;
const FOREGROUND_MAP_DEPTH = 200;

export class WorldManager {
  private scene: Phaser.Scene;
  private currentAreaId?: AreaId;
  private background?: Phaser.GameObjects.Rectangle;
  private areaLabel?: Phaser.GameObjects.Text;
  private currentParsedTmxMap?: ParsedTmxMap;
  private currentParsedTsxTileset?: ParsedTsxTileset;
  private currentResolvedTmxLayers?: ResolvedTmxLayers;
  private currentRuntimeGrids?: TmxRuntimeGrids;
  private currentTilemap?: Phaser.Tilemaps.Tilemap;
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

    this.background.setFillStyle(this.resolveBackgroundColor(areaId));
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
    this.renderedLayers.forEach((layer) => layer.destroy());
    this.renderedLayers = [];
    this.currentTilemap?.destroy();
    this.currentTilemap = undefined;

    const parsedMap = this.currentParsedTmxMap;
    const parsedTsx = this.currentParsedTsxTileset;
    const area = this.getCurrentAreaDefinition();

    if (!parsedMap || !parsedTsx || !area) {
      return;
    }

    const visualLayers = parsedMap.layers.filter((layer) =>
      this.shouldRenderLayer(layer.name, area)
    );

    if (visualLayers.length === 0) {
      return;
    }

    this.currentTilemap = this.scene.make.tilemap({
      width: parsedMap.width,
      height: parsedMap.height,
      tileWidth: parsedMap.tileWidth,
      tileHeight: parsedMap.tileHeight
    });

    const tilesets = parsedMap.tilesets
      .map((tilesetRef) =>
        this.currentTilemap!.addTilesetImage(
          tilesetRef.name,
          ASSET_KEYS.map.tilesetImage,
          parsedTsx.tileWidth,
          parsedTsx.tileHeight,
          parsedTsx.margin,
          parsedTsx.spacing,
          tilesetRef.firstgid
        )
      )
      .filter((tileset): tileset is Phaser.Tilemaps.Tileset => Boolean(tileset));

    if (tilesets.length === 0) {
      return;
    }

    visualLayers.forEach((layer, index) => {
      const tilemapLayer = this.currentTilemap!.createBlankLayer(
        layer.name,
        tilesets,
        0,
        0,
        parsedMap.width,
        parsedMap.height,
        parsedMap.tileWidth,
        parsedMap.tileHeight
      );

      if (!tilemapLayer) {
        return;
      }

      tilemapLayer.putTilesAt(layer.data, 0, 0);
      tilemapLayer.setVisible(layer.visible);
      tilemapLayer.setDepth(this.resolveLayerDepth(layer, area, index));

      this.renderedLayers.push(tilemapLayer);
    });

    if (this.background) {
      this.background.setVisible(false);
    }
  }

  private shouldRenderLayer(layerName: string, area: AreaDefinition) {
    const normalized = layerName.trim().toLowerCase();

    const isCollisionLayer = area.collisionLayerNames.some(
      (name) => name.trim().toLowerCase() === normalized
    );
    if (isCollisionLayer) {
      return false;
    }

    const isInteractionLayer = area.interactionLayerNames.some(
      (name) => name.trim().toLowerCase() === normalized
    );
    if (isInteractionLayer) {
      return false;
    }

    return true;
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
