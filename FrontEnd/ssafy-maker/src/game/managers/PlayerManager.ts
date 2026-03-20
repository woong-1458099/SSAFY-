// 플레이어 타일 상태와 이동을 관리하고 렌더 bounds 기준으로 좌표를 변환한다.
import Phaser from "phaser";
import type { PlayerSnapshot } from "../../common/types/player";
import { getActorDepth } from "../systems/renderDepth";
import type { ParsedTmxMap, TmxRuntimeGrids } from "../systems/tmxNavigation";
import type { WorldRenderBounds } from "./WorldManager";

export class PlayerManager {
  private scene: Phaser.Scene;
  private player?: Phaser.GameObjects.Rectangle;
  private cursors?: Phaser.Types.Input.Keyboard.CursorKeys;
  private isMoving = false;
  private isInputLocked = false;
  private tileSize = 32;
  private currentTileX = 0;
  private currentTileY = 0;
  private moveRepeatDelay = 140;
  private lastMoveAt = 0;
  private renderBounds?: WorldRenderBounds;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  setRenderBounds(renderBounds?: WorldRenderBounds) {
    this.renderBounds = renderBounds;

    // 이미 생성된 플레이어가 있으면 현재 타일 기준 위치를 다시 맞춘다.
    if (!this.player) {
      return;
    }

    const { x, y } = this.getWorldPositionFromTile(this.currentTileX, this.currentTileY);
    this.player.setPosition(x, y);
  }

  create(startTileX: number, startTileY: number, tileSize = 32) {
    this.tileSize = tileSize;
    this.currentTileX = startTileX;
    this.currentTileY = startTileY;

    const { x, y } = this.getWorldPositionFromTile(startTileX, startTileY);

    this.player = this.scene.add.rectangle(x, y, 28, 40, 0xffd166).setOrigin(0.5, 1);
    this.player.setDepth(getActorDepth(y));
    this.cursors = this.scene.input.keyboard?.createCursorKeys();
  }

  setInputLocked(locked: boolean) {
    this.isInputLocked = locked;
  }

  update(runtimeGrids?: TmxRuntimeGrids, parsedMap?: ParsedTmxMap) {
    if (
      !this.player ||
      !this.cursors ||
      this.isMoving ||
      this.isInputLocked ||
      !runtimeGrids ||
      !parsedMap
    ) {
      return;
    }

    const now = this.scene.time.now;
    if (now - this.lastMoveAt < this.moveRepeatDelay) {
      return;
    }

    let nextTileX = this.currentTileX;
    let nextTileY = this.currentTileY;
    let hasInput = false;

    if (this.cursors.left?.isDown) {
      nextTileX -= 1;
      hasInput = true;
    } else if (this.cursors.right?.isDown) {
      nextTileX += 1;
      hasInput = true;
    } else if (this.cursors.up?.isDown) {
      nextTileY -= 1;
      hasInput = true;
    } else if (this.cursors.down?.isDown) {
      nextTileY += 1;
      hasInput = true;
    }

    if (!hasInput) {
      return;
    }

    this.lastMoveAt = now;

    if (!this.canMoveTo(nextTileX, nextTileY, runtimeGrids, parsedMap)) {
      return;
    }

    this.currentTileX = nextTileX;
    this.currentTileY = nextTileY;
    this.moveToTile(nextTileX, nextTileY);
  }

  getSnapshot(): PlayerSnapshot | undefined {
    if (!this.player) {
      return undefined;
    }

    return {
      x: this.player.x,
      y: this.player.y,
      tileX: this.currentTileX,
      tileY: this.currentTileY
    };
  }

  private canMoveTo(
    tileX: number,
    tileY: number,
    runtimeGrids: TmxRuntimeGrids,
    parsedMap: ParsedTmxMap
  ) {
    if (tileX < 0 || tileY < 0 || tileX >= parsedMap.width || tileY >= parsedMap.height) {
      return false;
    }

    return !runtimeGrids.blockedGrid[tileY]?.[tileX];
  }

  private moveToTile(tileX: number, tileY: number) {
    if (!this.player) {
      return;
    }

    this.isMoving = true;

    const { x, y } = this.getWorldPositionFromTile(tileX, tileY);

    this.scene.tweens.add({
      targets: this.player,
      x,
      y,
      duration: 120,
      onUpdate: () => {
        if (!this.player) {
          return;
        }

        this.player.setDepth(getActorDepth(this.player.y));
      },
      onComplete: () => {
        this.player?.setDepth(getActorDepth(y));
        this.isMoving = false;
      }
    });
  }

  private getWorldPositionFromTile(tileX: number, tileY: number) {
    // 렌더 bounds가 없으면 기존 원본 타일 좌표계를 fallback으로 쓴다.
    if (!this.renderBounds) {
      return {
        x: tileX * this.tileSize + this.tileSize / 2,
        y: tileY * this.tileSize + this.tileSize
      };
    }

    const scaledTileWidth = this.renderBounds.tileWidth * this.renderBounds.scale;
    const scaledTileHeight = this.renderBounds.tileHeight * this.renderBounds.scale;

    return {
      x: this.renderBounds.offsetX + tileX * scaledTileWidth + scaledTileWidth / 2,
      y: this.renderBounds.offsetY + tileY * scaledTileHeight + scaledTileHeight
    };
  }
}
