// 지역 정의를 읽어 현재 월드 상태와 기본 배경 표시를 관리하는 월드 매니저
import Phaser from "phaser";
import type { AreaId } from "../../common/enums/area";
import { AREA_DEFINITIONS, type AreaDefinition } from "../definitions/areas/areaDefinitions";

export class WorldManager {
  private scene: Phaser.Scene;
  private currentAreaId?: AreaId;
  private background?: Phaser.GameObjects.Rectangle;
  private areaLabel?: Phaser.GameObjects.Text;

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
