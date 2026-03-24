// blocked / interaction grid를 현재 맵 렌더 좌표계 기준으로 시각화한다.
import Phaser from "phaser";
import type { PlayerSnapshot } from "../../common/types/player";
import type { ParsedTmxMap, TmxRuntimeGrids } from "../../game/systems/tmxNavigation";
import type { WorldRenderBounds } from "../../game/managers/WorldManager";
import { UI_DEPTH } from "../../game/systems/uiDepth";
import type { RuntimeStaticPlaceTarget } from "../../game/managers/InteractionManager";

export class WorldGridOverlay {
  private scene: Phaser.Scene;
  private walkableGraphics: Phaser.GameObjects.Graphics;
  private blockedGraphics: Phaser.GameObjects.Graphics;
  private manualBlockedGraphics: Phaser.GameObjects.Graphics;
  private interactionGraphics: Phaser.GameObjects.Graphics;
  private placePromptGraphics: Phaser.GameObjects.Graphics;
  private playerProbeGraphics: Phaser.GameObjects.Graphics;
  private visible = true;
  private destroyed = false;
  private lifecycleBound = false;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.walkableGraphics = scene.add.graphics().setDepth(UI_DEPTH.worldGridWalkable);
    this.blockedGraphics = scene.add.graphics().setDepth(UI_DEPTH.worldGridBlocked);
    this.manualBlockedGraphics = scene.add.graphics().setDepth(UI_DEPTH.worldGridManualBlocked);
    this.interactionGraphics = scene.add.graphics().setDepth(UI_DEPTH.worldGridInteraction);
    this.placePromptGraphics = scene.add.graphics().setDepth(UI_DEPTH.worldGridPlacePrompt);
    this.playerProbeGraphics = scene.add.graphics().setDepth(UI_DEPTH.worldGridPlayerProbe);
    this.bindSceneLifecycle();
  }

  render(
    runtimeGrids?: TmxRuntimeGrids,
    parsedMap?: ParsedTmxMap,
    renderBounds?: WorldRenderBounds,
    player?: PlayerSnapshot,
    staticPlaceTargets: RuntimeStaticPlaceTarget[] = []
  ) {
    this.walkableGraphics.clear();
    this.blockedGraphics.clear();
    this.manualBlockedGraphics.clear();
    this.interactionGraphics.clear();
    this.placePromptGraphics.clear();
    this.playerProbeGraphics.clear();

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
    this.manualBlockedGraphics.fillStyle(0xffc53d, 0.52);
    this.manualBlockedGraphics.lineStyle(2, 0xffec99, 0.9);
    this.interactionGraphics.fillStyle(0x4da6ff, 0.2);
    this.placePromptGraphics.fillStyle(0xb37feb, 0.36);
    this.placePromptGraphics.lineStyle(2, 0xe9d5ff, 0.95);

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

        if (runtimeGrids.manualBlockedGrid[y]?.[x]) {
          this.manualBlockedGraphics.fillRect(drawX, drawY, tileWidth, tileHeight);
          this.manualBlockedGraphics.strokeRect(drawX, drawY, tileWidth, tileHeight);
        }
      }
    }

    staticPlaceTargets.forEach((place) => {
      place.promptTiles?.forEach((tile) => {
        const drawX = offsetX + tile.tileX * tileWidth;
        const drawY = offsetY + tile.tileY * tileHeight;
        this.placePromptGraphics.fillRect(drawX, drawY, tileWidth, tileHeight);
        this.placePromptGraphics.strokeRect(drawX, drawY, tileWidth, tileHeight);
      });
    });

    if (player) {
      const probeTileX = Phaser.Math.Clamp(player.tileX, 0, parsedMap.width - 1);
      const probeTileY = Phaser.Math.Clamp(player.tileY, 0, parsedMap.height - 1);
      const probeX = player.x;
      const probeY = player.y - 1;
      const tileDrawX = offsetX + probeTileX * tileWidth;
      const tileDrawY = offsetY + probeTileY * tileHeight;

      this.playerProbeGraphics.lineStyle(2, 0x00ff99, 1);
      this.playerProbeGraphics.strokeRect(tileDrawX, tileDrawY, tileWidth, tileHeight);
      this.playerProbeGraphics.fillStyle(0x00ff99, 0.95);
      this.playerProbeGraphics.fillCircle(probeX, probeY, Math.max(3, Math.round(tileWidth * 0.08)));
    }
  }

  setVisible(visible: boolean) {
    if (this.destroyed) {
      return;
    }

    this.visible = visible;

    if (!visible) {
      this.walkableGraphics.clear();
      this.blockedGraphics.clear();
      this.manualBlockedGraphics.clear();
      this.interactionGraphics.clear();
      this.placePromptGraphics.clear();
      this.playerProbeGraphics.clear();
    }
  }

  isVisible() {
    return this.visible;
  }

  destroy(): void {
    if (this.destroyed) {
      return;
    }

    this.destroyed = true;
    this.walkableGraphics.destroy();
    this.blockedGraphics.destroy();
    this.manualBlockedGraphics.destroy();
    this.interactionGraphics.destroy();
    this.placePromptGraphics.destroy();
    this.playerProbeGraphics.destroy();
  }

  private bindSceneLifecycle(): void {
    if (this.lifecycleBound) {
      return;
    }

    this.lifecycleBound = true;
    this.scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.destroy();
    });
    this.scene.events.once(Phaser.Scenes.Events.DESTROY, () => {
      this.destroy();
    });
  }
}
