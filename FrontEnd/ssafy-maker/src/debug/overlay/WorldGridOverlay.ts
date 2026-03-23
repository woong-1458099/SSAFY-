// blocked / interaction grid를 현재 맵 렌더 좌표계 기준으로 시각화한다.
import Phaser from "phaser";
import type { ParsedTmxMap, TmxRuntimeGrids } from "../../game/systems/tmxNavigation";
import type { WorldRenderBounds } from "../../game/managers/WorldManager";
import { UI_DEPTH } from "../../game/systems/uiDepth";

export class WorldGridOverlay {
  private scene: Phaser.Scene;
  private walkableGraphics: Phaser.GameObjects.Graphics;
  private blockedGraphics: Phaser.GameObjects.Graphics;
  private interactionGraphics: Phaser.GameObjects.Graphics;
  private visible = true;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.walkableGraphics = scene.add.graphics().setDepth(UI_DEPTH.worldGridWalkable);
    this.blockedGraphics = scene.add.graphics().setDepth(UI_DEPTH.worldGridBlocked);
    this.interactionGraphics = scene.add.graphics().setDepth(UI_DEPTH.worldGridInteraction);
  }

  render(
    runtimeGrids?: TmxRuntimeGrids,
    parsedMap?: ParsedTmxMap,
    renderBounds?: WorldRenderBounds
  ) {
    this.walkableGraphics.clear();
    this.blockedGraphics.clear();
    this.interactionGraphics.clear();

    if (!this.visible || !runtimeGrids || !parsedMap) {
      return;
    }

    // render bounds가 있으면 실제 타일맵 렌더와 같은 좌표계를 사용한다.
    const scale = renderBounds?.scale ?? 1;
    const offsetX = renderBounds?.offsetX ?? 0;
    const offsetY = renderBounds?.offsetY ?? 0;
    const tileWidth = (renderBounds?.tileWidth ?? parsedMap.tileWidth) * scale;
    const tileHeight = (renderBounds?.tileHeight ?? parsedMap.tileHeight) * scale;

    this.walkableGraphics.fillStyle(0x8c8c8c, 0.16);
    this.blockedGraphics.fillStyle(0xff4d4f, 0.25);
    this.interactionGraphics.fillStyle(0x4da6ff, 0.2);

    for (let y = 0; y < parsedMap.height; y += 1) {
      for (let x = 0; x < parsedMap.width; x += 1) {
        const drawX = offsetX + x * tileWidth;
        const drawY = offsetY + y * tileHeight;

        if (runtimeGrids.blockedGrid[y]?.[x]) {
          this.blockedGraphics.fillRect(drawX, drawY, tileWidth, tileHeight);
        } else {
          this.walkableGraphics.fillRect(drawX, drawY, tileWidth, tileHeight);
        }

        if (runtimeGrids.interactionGrid[y]?.[x]) {
          this.interactionGraphics.fillRect(drawX, drawY, tileWidth, tileHeight);
        }
      }
    }
  }

  setVisible(visible: boolean) {
    this.visible = visible;

    if (!visible) {
      this.walkableGraphics.clear();
      this.blockedGraphics.clear();
      this.interactionGraphics.clear();
    }
  }

  isVisible() {
    return this.visible;
  }
}
