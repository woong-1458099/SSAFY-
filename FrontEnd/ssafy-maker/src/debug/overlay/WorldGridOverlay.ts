// 충돌 그리드와 상호작용 그리드를 반투명 타일 오버레이로 시각화하는 디버그 오버레이
import Phaser from "phaser";
import type { TmxRuntimeGrids, ParsedTmxMap } from "../../game/systems/tmxNavigation";

export class WorldGridOverlay {
  private scene: Phaser.Scene;
  private blockedGraphics: Phaser.GameObjects.Graphics;
  private interactionGraphics: Phaser.GameObjects.Graphics;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.blockedGraphics = scene.add.graphics().setDepth(9000);
    this.interactionGraphics = scene.add.graphics().setDepth(9001);
  }

  render(runtimeGrids?: TmxRuntimeGrids, parsedMap?: ParsedTmxMap) {
    this.blockedGraphics.clear();
    this.interactionGraphics.clear();

    if (!runtimeGrids || !parsedMap) {
      return;
    }

    const tileWidth = parsedMap.tileWidth;
    const tileHeight = parsedMap.tileHeight;

    this.blockedGraphics.fillStyle(0xff4d4f, 0.25);
    this.interactionGraphics.fillStyle(0x4da6ff, 0.2);

    for (let y = 0; y < parsedMap.height; y += 1) {
      for (let x = 0; x < parsedMap.width; x += 1) {
        if (runtimeGrids.blockedGrid[y]?.[x]) {
          this.blockedGraphics.fillRect(
            x * tileWidth,
            y * tileHeight,
            tileWidth,
            tileHeight
          );
        }

        if (runtimeGrids.interactionGrid[y]?.[x]) {
          this.interactionGraphics.fillRect(
            x * tileWidth,
            y * tileHeight,
            tileWidth,
            tileHeight
          );
        }
      }
    }
  }
}
