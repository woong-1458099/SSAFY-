// 임시 플레이어 엔티티를 생성하고 방향키 입력에 따라 타일 단위 이동을 처리하는 플레이어 매니저
import Phaser from "phaser";
import type { PlayerSnapshot } from "../../common/types/player";
import type { TmxRuntimeGrids } from "../systems/tmxNavigation";
import type { ParsedTmxMap } from "../systems/tmxNavigation";

export class PlayerManager {
  private scene: Phaser.Scene;
  private player?: Phaser.GameObjects.Rectangle;
  private cursors?: Phaser.Types.Input.Keyboard.CursorKeys;
  private isMoving = false;
  private tileSize = 32;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  create(x: number, y: number, tileSize = 32) {
    this.tileSize = tileSize;
    this.player = this.scene.add.rectangle(x, y, 28, 40, 0xffd166).setOrigin(0.5, 1);
    this.cursors = this.scene.input.keyboard?.createCursorKeys();
  }

  update(runtimeGrids?: TmxRuntimeGrids, parsedMap?: ParsedTmxMap) {
    if (!this.player || !this.cursors || this.isMoving || !runtimeGrids || !parsedMap) {
      return;
    }

    let nextTileX = this.getTilePosition().tileX;
    let nextTileY = this.getTilePosition().tileY;

    if (Phaser.Input.Keyboard.JustDown(this.cursors.left!)) {
      nextTileX -= 1;
    } else if (Phaser.Input.Keyboard.JustDown(this.cursors.right!)) {
      nextTileX += 1;
    } else if (Phaser.Input.Keyboard.JustDown(this.cursors.up!)) {
      nextTileY -= 1;
    } else if (Phaser.Input.Keyboard.JustDown(this.cursors.down!)) {
      nextTileY += 1;
    } else {
      return;
    }

    if (!this.canMoveTo(nextTileX, nextTileY, runtimeGrids, parsedMap)) {
      return;
    }

    this.moveToTile(nextTileX, nextTileY);
  }

  getSnapshot(): PlayerSnapshot | undefined {
    if (!this.player) {
      return undefined;
    }

    const { tileX, tileY } = this.getTilePosition();

    return {
      x: this.player.x,
      y: this.player.y,
      tileX,
      tileY
    };
  }

  private getTilePosition() {
    if (!this.player) {
      return { tileX: 0, tileY: 0 };
    }

    return {
      tileX: Math.floor(this.player.x / this.tileSize),
      tileY: Math.floor(this.player.y / this.tileSize)
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

    const nextX = tileX * this.tileSize + this.tileSize / 2;
    const nextY = tileY * this.tileSize + this.tileSize;

    this.scene.tweens.add({
      targets: this.player,
      x: nextX,
      y: nextY,
      duration: 120,
      onComplete: () => {
        this.isMoving = false;
      }
    });
  }
}
