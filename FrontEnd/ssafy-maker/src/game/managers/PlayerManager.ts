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
  private static readonly WORLD_BOUNDS_EPSILON = 2;
  private scene: Phaser.Scene;
  private player?: PlayerVisual;
  private cursors?: Phaser.Types.Input.Keyboard.CursorKeys;
  private moveKeys?: {
    up?: Phaser.Input.Keyboard.Key;
    down?: Phaser.Input.Keyboard.Key;
    left?: Phaser.Input.Keyboard.Key;
    right?: Phaser.Input.Keyboard.Key;
  };
  private isInputLocked = false;
  private tileSize = 32;
  private currentTileX = 0;
  private currentTileY = 0;
  private moveSpeed = 260;
  private renderBounds?: WorldRenderBounds;
  private currentFacing: Facing = "down";
  private appearance: PlayerAppearanceDefinition = getDefaultPlayerAppearanceDefinition();
  private runtimeGrids?: TmxRuntimeGrids;
  private parsedMap?: ParsedTmxMap;
  // `isMoving` means the player position changed during the latest completed update tick.
  private isMoving = false;
  // `isMoveInputActive` means directional input is currently being pressed, even if movement is blocked.
  private isMoveInputActive = false;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  setAppearance(appearance: PlayerAppearanceDefinition) {
    this.appearance = appearance;
  }

  destroy() {
    this.player?.root.destroy(true);
    this.player = undefined;
    this.cursors = undefined;
    this.moveKeys = undefined;
    this.isMoving = false;
    this.isMoveInputActive = false;
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
    this.moveKeys = {
      up: this.scene.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      down: this.scene.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      left: this.scene.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      right: this.scene.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.D)
    };
  }

  setInputLocked(locked: boolean) {
    this.isInputLocked = locked;
  }

  update(runtimeGrids?: TmxRuntimeGrids, parsedMap?: ParsedTmxMap) {
    this.runtimeGrids = runtimeGrids;
    this.parsedMap = parsedMap;
    let nextIsMoving = false;
    let nextIsMoveInputActive = false;

    if (
      !this.player ||
      !this.player.root.active ||
      !this.player.base.active ||
      !this.player.clothes.active ||
      !this.player.hair.active ||
      !runtimeGrids ||
      !parsedMap
    ) {
      return;
    }

    if (this.isInputLocked) {
      this.commitMovementState(nextIsMoving, nextIsMoveInputActive);
      updatePlayerVisualFrame(this.player, this.currentFacing, false, this.scene.time.now);
      return;
    }

    const moveVector = this.getRequestedMoveVector();
    nextIsMoveInputActive = moveVector.lengthSq() > 0;
    if (moveVector.lengthSq() === 0) {
      this.commitMovementState(nextIsMoving, nextIsMoveInputActive);
      updatePlayerVisualFrame(this.player, this.currentFacing, false, this.scene.time.now);
      return;
    }

    moveVector.normalize().scale(this.moveSpeed);
    this.currentFacing = this.resolveFacingFromVelocity(moveVector.x, moveVector.y);

    const deltaSeconds = this.scene.game.loop.delta / 1000;
    const targetX = this.player.root.x + moveVector.x * deltaSeconds;
    const targetY = this.player.root.y + moveVector.y * deltaSeconds;
    let nextX = this.player.root.x;
    let nextY = this.player.root.y;

    if (this.canOccupyWorldPosition(targetX, nextY, runtimeGrids, parsedMap)) {
      nextX = targetX;
    }

    if (this.canOccupyWorldPosition(nextX, targetY, runtimeGrids, parsedMap)) {
      nextY = targetY;
    }

    const didMove = nextX !== this.player.root.x || nextY !== this.player.root.y;
    nextIsMoving = didMove;
    this.player.root.setPosition(nextX, nextY);
    this.player.root.setDepth(getActorDepth(nextY));

    // Track tile position change for tutorial event
    const prevTileX = this.currentTileX;
    const prevTileY = this.currentTileY;
    this.syncTilePositionFromWorldPosition(nextX, nextY, parsedMap);
    this.commitMovementState(nextIsMoving, nextIsMoveInputActive);
    updatePlayerVisualFrame(this.player, this.currentFacing, didMove, this.scene.time.now);

    // Emit tutorial event only when tile position changes (not every frame)
    if (this.currentTileX !== prevTileX || this.currentTileY !== prevTileY) {
      this.scene.events.emit("tutorial:playerMoved");
    }
  }

  getSnapshot(): PlayerSnapshot | undefined {
    if (!this.player || !this.player.root.active) {
      return undefined;
    }

    return {
      x: this.player.root.x,
      y: this.player.root.y,
      tileX: this.currentTileX,
      tileY: this.currentTileY
    };
  }

  isPlayerMoving(): boolean {
    return this.isMoving;
  }

  isMoveInputInProgress(): boolean {
    return this.isMoveInputActive;
  }

  private commitMovementState(isMoving: boolean, isMoveInputActive: boolean) {
    this.isMoving = isMoving;
    this.isMoveInputActive = isMoveInputActive;
  }

  debugTeleportToTile(tileX: number, tileY: number) {
    if (!this.player || !this.player.root.active) {
      return false;
    }

    const { x, y } = this.getWorldPositionFromTile(tileX, tileY);
    this.currentTileX = tileX;
    this.currentTileY = tileY;
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

  private getRequestedMoveVector() {
    const horizontal =
      (this.cursors?.left?.isDown || this.moveKeys?.left?.isDown ? -1 : 0) +
      (this.cursors?.right?.isDown || this.moveKeys?.right?.isDown ? 1 : 0);
    const vertical =
      (this.cursors?.up?.isDown || this.moveKeys?.up?.isDown ? -1 : 0) +
      (this.cursors?.down?.isDown || this.moveKeys?.down?.isDown ? 1 : 0);

    return new Phaser.Math.Vector2(horizontal, vertical);
  }

  private resolveFacingFromVelocity(velocityX: number, velocityY: number): Facing {
    if (Math.abs(velocityX) > Math.abs(velocityY)) {
      return velocityX < 0 ? "left" : "right";
    }

    if (velocityY < 0) {
      return "up";
    }

    return "down";
  }

  private canOccupyWorldPosition(
    worldX: number,
    worldY: number,
    runtimeGrids: TmxRuntimeGrids,
    parsedMap: ParsedTmxMap
  ) {
    if (!this.isWithinWorldBounds(worldX, worldY, parsedMap)) {
      return false;
    }

    const { tileX, tileY } = this.getTilePositionFromWorld(worldX, worldY, parsedMap);
    return this.canMoveTo(tileX, tileY, runtimeGrids, parsedMap);
  }

  private syncTilePositionFromWorldPosition(worldX: number, worldY: number, parsedMap: ParsedTmxMap) {
    const { tileX, tileY } = this.getTilePositionFromWorld(worldX, worldY, parsedMap);
    this.currentTileX = tileX;
    this.currentTileY = tileY;
  }

  private getTilePositionFromWorld(worldX: number, worldY: number, parsedMap: ParsedTmxMap) {
    if (!this.renderBounds) {
      return {
        tileX: Phaser.Math.Clamp(Math.floor(worldX / this.tileSize), 0, parsedMap.width - 1),
        tileY: Phaser.Math.Clamp(Math.floor((worldY - 1) / this.tileSize), 0, parsedMap.height - 1)
      };
    }

    const scaledTileWidth = this.renderBounds.tileWidth * this.renderBounds.scale;
    const scaledTileHeight = this.renderBounds.tileHeight * this.renderBounds.scale;

    return {
      tileX: Phaser.Math.Clamp(
        Math.floor((worldX - this.renderBounds.offsetX) / scaledTileWidth),
        0,
        parsedMap.width - 1
      ),
      tileY: Phaser.Math.Clamp(
        Math.floor((worldY - this.renderBounds.offsetY - 1) / scaledTileHeight),
        0,
        parsedMap.height - 1
      )
    };
  }

  private isWithinWorldBounds(worldX: number, worldY: number, parsedMap: ParsedTmxMap) {
    const minPosition = this.getWorldPositionFromTile(0, 0);
    const maxPosition = this.getWorldPositionFromTile(parsedMap.width - 1, parsedMap.height - 1);
    const epsilon = PlayerManager.WORLD_BOUNDS_EPSILON;

    return (
      worldX >= minPosition.x - epsilon &&
      worldX <= maxPosition.x + epsilon &&
      worldY >= minPosition.y - epsilon &&
      worldY <= maxPosition.y + epsilon
    );
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
