// 지역 정의와 TMX 설정을 읽어 현재 월드 상태, 기본 배경 표시, TMX 파싱 결과와 레이어 조회 결과를 관리하는 월드 매니저
import Phaser from "phaser";
import type { AreaId } from "../../common/enums/area";
import { AREA_DEFINITIONS, type AreaDefinition } from "../definitions/areas/areaDefinitions";
import type {
  ParsedTmxMap,
  ResolvedTmxLayers,
  TmxAreaConfig
} from "../systems/tmxNavigation";
import { parseTmxMap, resolveTmxLayers } from "../systems/tmxNavigation";

export class WorldManager {
  private scene: Phaser.Scene;
  private currentAreaId?: AreaId;
  private background?: Phaser.GameObjects.Rectangle;
  private areaLabel?: Phaser.GameObjects.Text;
  private currentParsedTmxMap?: ParsedTmxMap;
  private currentResolvedTmxLayers?: ResolvedTmxLayers;

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
    this.currentResolvedTmxLayers = this.resolveCurrentAreaLayers();

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

  private resolveCurrentAreaLayers() {
    const parsedMap = this.currentParsedTmxMap;
    const tmxConfig = this.getCurrentTmxConfig();

    if (!parsedMap || !tmxConfig) {
      return undefined;
    }

    return resolveTmxLayers(parsedMap, tmxConfig);
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
