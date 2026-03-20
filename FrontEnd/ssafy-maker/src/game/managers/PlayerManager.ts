// 임시 플레이어 엔티티를 생성하고 방향키 입력에 따라 타일 단위 이동을 처리하는 플레이어 매니저
import Phaser from "phaser";
import type { PlayerSnapshot } from "../../common/types/player";
import type { ParsedTmxMap, TmxRuntimeGrids } from "../systems/tmxNavigation";

export class PlayerManager {
  private scene: Phaser.Scene;
  private player?: Phaser.GameObjects.Rectangle;
  private cursors?: Phaser.Types.Input.Keyboard.CursorKeys;
  private isMoving = false;
  private tileSize = 32;
  private currentTileX = 0;
  private currentTileY = 0;
  private moveRepeatDelay = 140;
  private lastMoveAt = 0;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  create(startTileX: number, startTileY: number, tileSize = 32) {
    this.tileSize = tileSize;
    this.currentTileX = startTileX;
    this.currentTileY = startTileY;

    const { x, y } = this.getWorldPositionFromTile(startTileX, startTileY);

    this.player = this.scene.add.rectangle(x, y, 28, 40, 0xffd166).setOrigin(0.5, 1);
    this.cursors = this.scene.input.keyboard?.createCursorKeys();
  }

  update(runtimeGrids?: TmxRuntimeGrids, parsedMap?: ParsedTmxMap) {
    if (!this.player || !this.cursors || this.isMoving || !runtimeGrids || !parsedMap) {
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
      onComplete: () => {
        this.isMoving = false;
      }
    });
  }

  private getWorldPositionFromTile(tileX: number, tileY: number) {
    return {
      x: tileX * this.tileSize + this.tileSize / 2,
      y: tileY * this.tileSize + this.tileSize
    };
  }
}
