// 플레이어 타일 상태와 이동을 관리하고 렌더 bounds 기준으로 좌표를 변환한다.
import Phaser from "phaser";
import type { PlayerAppearanceDefinition, PlayerSnapshot } from "../../common/types/player";
import type { Facing } from "../../common/enums/facing";
import { getActorDepth } from "../systems/renderDepth";
import type { ParsedTmxMap, TmxRuntimeGrids } from "../systems/tmxNavigation";
import {
  createPlayerVisual,
  type PlayerVisual,
  updatePlayerVisualFrame
} from "../systems/playerVisual";
import { getDefaultPlayerAppearanceDefinition } from "../definitions/player/playerAppearanceDefinitions";
import type { WorldRenderBounds } from "./WorldManager";

export class PlayerManager {
  private scene: Phaser.Scene;
  private player?: PlayerVisual;
  private cursors?: Phaser.Types.Input.Keyboard.CursorKeys;
  private isMoving = false;
  private isInputLocked = false;
  private tileSize = 32;
  private currentTileX = 0;
  private currentTileY = 0;
  private moveRepeatDelay = 110;
  private lastMoveAt = 0;
  private renderBounds?: WorldRenderBounds;
  private currentFacing: Facing = "down";
  private appearance: PlayerAppearanceDefinition = getDefaultPlayerAppearanceDefinition();
  private runtimeGrids?: TmxRuntimeGrids;
  private parsedMap?: ParsedTmxMap;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  setAppearance(appearance: PlayerAppearanceDefinition) {
    this.appearance = appearance;
  }

  setRenderBounds(renderBounds?: WorldRenderBounds) {
    this.renderBounds = renderBounds;

    // 이미 생성된 플레이어가 있으면 현재 타일 기준 위치를 다시 맞춘다.
    if (!this.player) {
      return;
    }

    const { x, y } = this.getWorldPositionFromTile(this.currentTileX, this.currentTileY);
    this.player.root.setPosition(x, y);
    this.player.root.setDepth(getActorDepth(y));
  }

  create(startTileX: number, startTileY: number, tileSize = 32) {
    this.tileSize = tileSize;
    this.currentTileX = startTileX;
    this.currentTileY = startTileY;

    const { x, y } = this.getWorldPositionFromTile(startTileX, startTileY);

    this.player = createPlayerVisual(this.scene, x, y, this.appearance);
    this.player.root.setDepth(getActorDepth(y));
    updatePlayerVisualFrame(this.player, this.currentFacing, false, this.scene.time.now);
    this.cursors = this.scene.input.keyboard?.createCursorKeys();
  }

  setInputLocked(locked: boolean) {
    this.isInputLocked = locked;
  }

  update(runtimeGrids?: TmxRuntimeGrids, parsedMap?: ParsedTmxMap) {
    this.runtimeGrids = runtimeGrids;
    this.parsedMap = parsedMap;

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

    this.tryStartMoveFromInput(now);
  }

  getSnapshot(): PlayerSnapshot | undefined {
    if (!this.player) {
      return undefined;
    }

    return {
      x: this.player.root.x,
      y: this.player.root.y,
      tileX: this.currentTileX,
      tileY: this.currentTileY
    };
  }

  debugTeleportToTile(tileX: number, tileY: number) {
    if (!this.player) {
      return false;
    }

    const { x, y } = this.getWorldPositionFromTile(tileX, tileY);
    this.currentTileX = tileX;
    this.currentTileY = tileY;
    this.isMoving = false;
    this.player.root.setPosition(x, y);
    this.player.root.setDepth(getActorDepth(y));
    updatePlayerVisualFrame(this.player, this.currentFacing, false, this.scene.time.now);
    return true;
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

    // 한 줄 한글 설명: tween 첫 프레임 전에 이전 idle 방향이 비치지 않도록 즉시 이동 프레임으로 전환한다.
    updatePlayerVisualFrame(this.player, this.currentFacing, true, this.scene.time.now);

    this.scene.tweens.add({
      targets: this.player.root,
      x,
      y,
      duration: 120,
      onUpdate: () => {
        if (!this.player) {
          return;
        }

        updatePlayerVisualFrame(this.player, this.currentFacing, true, this.scene.time.now);
        this.player.root.setDepth(getActorDepth(this.player.root.y));
      },
      onComplete: () => {
        if (this.player) {
          this.player.root.setDepth(getActorDepth(y));
        }
        this.isMoving = false;

        // Emit tutorial event for player movement
        this.scene.events.emit("tutorial:playerMoved");

        // 한 줄 한글 설명: 입력이 유지되면 idle로 떨어지지 않고 다음 타일 이동을 바로 이어서 시작한다.
        if (this.tryStartMoveFromInput(this.scene.time.now, true)) {
          return;
        }

        if (this.player) {
          updatePlayerVisualFrame(this.player, this.currentFacing, false, this.scene.time.now);
        }
      }
    });
  }

  private tryStartMoveFromInput(now: number, isChainedMove = false) {
    if (!this.player || !this.cursors || !this.runtimeGrids || !this.parsedMap) {
      return false;
    }

    const nextMove = this.getRequestedMove();
    if (!nextMove) {
      return false;
    }

    if (!isChainedMove && now - this.lastMoveAt < this.moveRepeatDelay) {
      return false;
    }

    if (!this.canMoveTo(nextMove.tileX, nextMove.tileY, this.runtimeGrids, this.parsedMap)) {
      updatePlayerVisualFrame(this.player, nextMove.facing, false, now);
      this.currentFacing = nextMove.facing;
      return false;
    }

    this.lastMoveAt = now;
    this.currentFacing = nextMove.facing;
    this.currentTileX = nextMove.tileX;
    this.currentTileY = nextMove.tileY;
    this.moveToTile(nextMove.tileX, nextMove.tileY);
    return true;
  }

  private getRequestedMove() {
    if (!this.cursors) {
      return undefined;
    }

    if (this.cursors.left?.isDown) {
      return {
        tileX: this.currentTileX - 1,
        tileY: this.currentTileY,
        facing: "left" as const
      };
    }

    if (this.cursors.right?.isDown) {
      return {
        tileX: this.currentTileX + 1,
        tileY: this.currentTileY,
        facing: "right" as const
      };
    }

    if (this.cursors.up?.isDown) {
      return {
        tileX: this.currentTileX,
        tileY: this.currentTileY - 1,
        facing: "up" as const
      };
    }

    if (this.cursors.down?.isDown) {
      return {
        tileX: this.currentTileX,
        tileY: this.currentTileY + 1,
        facing: "down" as const
      };
    }

    return undefined;
  }

  private resolveFacing(nextTileX: number, nextTileY: number): Facing {
    if (nextTileX < this.currentTileX) {
      return "left";
    }

    if (nextTileX > this.currentTileX) {
      return "right";
    }

    if (nextTileY < this.currentTileY) {
      return "up";
    }

    return "down";
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
