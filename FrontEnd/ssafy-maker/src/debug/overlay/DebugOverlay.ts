// 현재 씬, 지역, TMX 키, 맵 크기, 레이어 개수, 그리드 셀 개수, 플레이어 상태, 상호작용 대상 NPC를 화면에 표시하는 디버그 오버레이
import Phaser from "phaser";
import type { DebugEventLogger } from "../services/DebugEventLogger";
import type { NpcManager } from "../../game/managers/NpcManager";
import { UI_DEPTH } from "../../game/systems/uiDepth";

type InspectableGameObject = Phaser.GameObjects.GameObject & {
  active?: boolean;
  visible?: boolean;
  name?: string;
  depth?: number;
  parentContainer?: Phaser.GameObjects.Container | null;
  scrollFactorX?: number;
  scrollFactorY?: number;
  getBounds?: () => Phaser.Geom.Rectangle;
};

type UiHit = {
  object: InspectableGameObject;
  root: InspectableGameObject;
};

const UI_DEPTH_NAME_BY_VALUE = new Map<number, string>(
  Object.entries(UI_DEPTH).map(([name, value]) => [value, name])
);

export class DebugOverlay {
  private text: Phaser.GameObjects.Text;
  private helpText: Phaser.GameObjects.Text;
  private uiInspectText: Phaser.GameObjects.Text;
  private visible = true;

  constructor(
    private scene: Phaser.Scene,
    private logger: DebugEventLogger,
    private npcManager: NpcManager
  ) {
    this.text = scene.add.text(16, 16, "", {
      fontSize: "14px",
      color: "#00ff9c",
      backgroundColor: "#000000"
    }).setDepth(UI_DEPTH.debugOverlay).setScrollFactor(0);

    this.helpText = scene.add.text(0, 16, "", {
      fontSize: "14px",
      color: "#ffe082",
      backgroundColor: "#000000",
      align: "right"
    }).setDepth(UI_DEPTH.debugOverlay).setScrollFactor(0).setOrigin(1, 0);

    this.uiInspectText = scene.add.text(0, 0, "", {
      fontSize: "13px",
      color: "#7ce8ff",
      backgroundColor: "#000000",
      align: "left"
    }).setDepth(UI_DEPTH.debugOverlay).setScrollFactor(0).setOrigin(1, 1);
  }

  render() {
    if (!this.visible) {
      this.text.setVisible(false);
      this.helpText.setVisible(false);
      this.uiInspectText.setVisible(false);
      return;
    }

    this.text.setVisible(true);
    this.helpText.setVisible(true);
    this.uiInspectText.setVisible(true);
    const state = this.logger.getState();
    const npcs = this.npcManager.getSnapshot()
      .map((npc) => `${npc.id} (${Math.round(npc.x)}, ${Math.round(npc.y)}) ${npc.facing}`)
      .join("\n");

    this.text.setText([
      `[DEBUG]`,
      `area: ${state.currentAreaId ?? "-"}`,
      `tmx: ${state.currentTmxKey ?? "-"}`,
      `map: ${state.mapSize ?? "-"}`,
      `layers: c=${state.collisionLayerCount ?? 0}, i=${state.interactionLayerCount ?? 0}, f=${state.foregroundLayerCount ?? 0}`,
      `grid: blocked=${state.blockedCellCount ?? 0}, interaction=${state.interactionCellCount ?? 0}`,
      `player: ${state.playerPosition ?? "-"}`,
      `tile: ${state.playerTile ?? "-"}`,
      `targetNpc: ${state.targetNpcId ?? "-"}`,
      `sceneScript: ${state.currentSceneId}`,
      `action: ${state.currentAction}`,
      `npcs:`,
      npcs || "-",
      `events:`,
      ...state.events.slice(0, 5)
    ]);

    this.helpText.setPosition(this.scene.scale.width - 16, 16);
    this.helpText.setText([
      `[DEBUG KEYS]`,
      `F1 디버그 모드 ON/OFF`,
      `F2 히트박스 ON/OFF`,
      `F3 디버그 패널`,
      `T 마우스 위치로 순간이동`,
      `마우스 UI 레이어 확인`,
      `M 미니게임 HUD`,
      `1 전체지도 이동`,
      `2 번화가 이동`,
      `3 강의장 이동`
    ]);

    this.uiInspectText.setPosition(this.scene.scale.width - 16, this.scene.scale.height - 16);
    this.uiInspectText.setText(this.buildUiInspectorLines());
  }

  setVisible(visible: boolean) {
    this.visible = visible;
    this.text.setVisible(visible);
    this.helpText.setVisible(visible);
    this.uiInspectText.setVisible(visible);
  }

  isVisible() {
    return this.visible;
  }

  private buildUiInspectorLines(): string[] {
    const pointer = this.scene.input.activePointer;
    const hits = this.collectUiHits(pointer.x, pointer.y);

    if (hits.length === 0) {
      return [
        `[UI HOVER] (${Math.round(pointer.x)}, ${Math.round(pointer.y)})`,
        `- 고정 UI 위에 마우스를 올리세요`,
        `depth: hud=${UI_DEPTH.hud}, menu=${UI_DEPTH.menu}, placeModal=${UI_DEPTH.placeModal}, dialogue=${UI_DEPTH.dialogue}`
      ];
    }

    return [
      `[UI HOVER] (${Math.round(pointer.x)}, ${Math.round(pointer.y)})`,
      ...hits.slice(0, 6).map((hit, index) => `${index + 1}. ${this.formatUiHit(hit)}`)
    ];
  }

  private collectUiHits(pointerX: number, pointerY: number): UiHit[] {
    const hits: UiHit[] = [];
    const children = this.scene.children.list as InspectableGameObject[];

    children.forEach((child) => {
      this.collectUiHitsFromObject(child, pointerX, pointerY, hits);
    });

    return hits.sort((a, b) => {
      const depthDiff = (b.root.depth ?? 0) - (a.root.depth ?? 0);
      if (depthDiff !== 0) {
        return depthDiff;
      }

      return (b.object.depth ?? 0) - (a.object.depth ?? 0);
    });
  }

  private collectUiHitsFromObject(
    object: InspectableGameObject,
    pointerX: number,
    pointerY: number,
    hits: UiHit[]
  ): void {
    if (object.active === false || object.visible === false) {
      return;
    }

    if (object === this.text || object === this.helpText || object === this.uiInspectText) {
      return;
    }

    const root = this.resolveRootObject(object);
    if (!this.isInspectableUiRoot(root)) {
      return;
    }

    if (this.containsPoint(object, pointerX, pointerY)) {
      hits.push({ object, root });
    }

    if (object instanceof Phaser.GameObjects.Container) {
      object.list.forEach((child) => {
        this.collectUiHitsFromObject(child as InspectableGameObject, pointerX, pointerY, hits);
      });
    }
  }

  private resolveRootObject(object: InspectableGameObject): InspectableGameObject {
    let current = object;

    while (current.parentContainer) {
      current = current.parentContainer as InspectableGameObject;
    }

    return current;
  }

  private isInspectableUiRoot(root: InspectableGameObject): boolean {
    return (
      (root.scrollFactorX ?? 1) === 0 &&
      (root.scrollFactorY ?? 1) === 0 &&
      (root.depth ?? -Infinity) >= UI_DEPTH.fixedEventNpcSprite
    );
  }

  private containsPoint(object: InspectableGameObject, pointerX: number, pointerY: number): boolean {
    if (typeof object.getBounds !== "function") {
      return false;
    }

    try {
      const bounds = object.getBounds();
      return Phaser.Geom.Rectangle.Contains(bounds, pointerX, pointerY);
    } catch {
      return false;
    }
  }

  private formatUiHit(hit: UiHit): string {
    const rootDepth = hit.root.depth ?? 0;
    const layerName = UI_DEPTH_NAME_BY_VALUE.get(rootDepth) ?? `depth-${rootDepth}`;
    const objectLabel = this.describeObject(hit.object);
    const rootLabel = hit.root === hit.object ? "self" : this.describeObject(hit.root);

    return `${objectLabel} -> ${layerName} (${rootDepth}) | root=${rootLabel}`;
  }

  private describeObject(object: InspectableGameObject): string {
    if (object instanceof Phaser.GameObjects.Text) {
      const text = object.text.replace(/\s+/g, " ").trim();
      return `Text "${text.slice(0, 18)}${text.length > 18 ? "..." : ""}"`;
    }

    if (object instanceof Phaser.GameObjects.Rectangle) {
      return `Rectangle ${Math.round(object.width)}x${Math.round(object.height)}`;
    }

    if (object instanceof Phaser.GameObjects.Container) {
      return object.name ? `Container ${object.name}` : "Container";
    }

    if (object instanceof Phaser.GameObjects.Image) {
      return object.name ? `Image ${object.name}` : "Image";
    }

    if (object instanceof Phaser.GameObjects.Sprite) {
      return object.name ? `Sprite ${object.name}` : "Sprite";
    }

    return object.name ? `${object.type} ${object.name}` : object.type;
  }
}
