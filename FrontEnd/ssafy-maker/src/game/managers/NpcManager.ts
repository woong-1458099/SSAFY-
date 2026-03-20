// NPC 생성과 이동을 관리하고 render bounds 기준으로 좌표를 변환한다.
import Phaser from "phaser";
import type { Facing } from "../../common/enums/facing";
import type { NpcId } from "../../common/enums/npc";
import { NPC_DEFINITIONS } from "../definitions/npcs/npcDefinitions";
import type { WorldRenderBounds } from "./WorldManager";

type NpcView = {
  id: NpcId;
  sprite: Phaser.GameObjects.Rectangle;
  label: Phaser.GameObjects.Text;
  facing: Facing;
  mapX: number;
  mapY: number;
};

export class NpcManager {
  private scene: Phaser.Scene;
  private npcs = new Map<NpcId, NpcView>();
  private renderBounds?: WorldRenderBounds;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  setRenderBounds(renderBounds?: WorldRenderBounds) {
    this.renderBounds = renderBounds;

    // 이미 생성된 NPC가 있으면 현재 맵 좌표 기준으로 다시 맞춘다.
    this.npcs.forEach((npc) => {
      const worldPosition = this.getWorldPositionFromMapPosition(npc.mapX, npc.mapY);
      npc.sprite.setPosition(worldPosition.x, worldPosition.y);
      npc.label.setPosition(worldPosition.x, worldPosition.y - 80);
    });
  }

  spawn(npcId: NpcId, x: number, y: number, facing?: Facing) {
    const def = NPC_DEFINITIONS[npcId];
    const worldPosition = this.getWorldPositionFromMapPosition(x, y);

    const sprite = this.scene.add
      .rectangle(worldPosition.x, worldPosition.y, 48, 64, 0x6aa9ff)
      .setOrigin(0.5, 1);

    const label = this.scene.add
      .text(worldPosition.x, worldPosition.y - 80, def.label, {
        color: "#ffffff",
        fontSize: "16px"
      })
      .setOrigin(0.5);

    this.npcs.set(npcId, {
      id: npcId,
      sprite,
      label,
      facing: facing ?? def.defaultFacing,
      mapX: x,
      mapY: y
    });
  }

  moveTo(npcId: NpcId, toX: number, toY: number, duration: number) {
    const npc = this.requireNpc(npcId);
    const worldPosition = this.getWorldPositionFromMapPosition(toX, toY);

    npc.mapX = toX;
    npc.mapY = toY;

    return new Promise<void>((resolve) => {
      this.scene.tweens.add({
        targets: npc.sprite,
        x: worldPosition.x,
        y: worldPosition.y,
        duration,
        onUpdate: () => {
          npc.label.setPosition(npc.sprite.x, npc.sprite.y - 80);
        },
        onComplete: () => resolve()
      });
    });
  }

  turn(npcId: NpcId, facing: Facing) {
    this.requireNpc(npcId).facing = facing;
  }

  getSnapshot() {
    return Array.from(this.npcs.values()).map((npc) => ({
      id: npc.id,
      x: npc.sprite.x,
      y: npc.sprite.y,
      facing: npc.facing
    }));
  }

  getNpcWorldPosition(npcId: NpcId) {
    const npc = this.npcs.get(npcId);
    if (!npc) {
      return undefined;
    }

    return {
      x: npc.sprite.x,
      y: npc.sprite.y
    };
  }

  private getWorldPositionFromMapPosition(mapX: number, mapY: number) {
    // render bounds가 없으면 기존 좌표를 그대로 쓴다.
    if (!this.renderBounds) {
      return {
        x: mapX,
        y: mapY
      };
    }

    return {
      x: this.renderBounds.offsetX + mapX * this.renderBounds.scale,
      y: this.renderBounds.offsetY + mapY * this.renderBounds.scale
    };
  }

  private requireNpc(npcId: NpcId) {
    const npc = this.npcs.get(npcId);
    if (!npc) {
      throw new Error(`NPC not found: ${npcId}`);
    }
    return npc;
  }
}
