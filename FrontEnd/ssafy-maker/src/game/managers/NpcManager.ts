// NPC 생성과 이동을 sprite 기반으로 관리한다.
import Phaser from "phaser";
import type { AreaId } from "../../common/enums/area";
import type { Facing } from "../../common/enums/facing";
import type { NpcId } from "../../common/enums/npc";
import { getAreaNpcScale } from "../definitions/areas/areaDefinitions";
import { getNpcAssetDefinition } from "../definitions/assets/npcAssetCatalog";
import { NPC_DEFINITIONS } from "../definitions/npcs/npcDefinitions";
import { playNpcIdle, playNpcWalk } from "../systems/npcAnimation";
import { getActorDepth } from "../systems/renderDepth";

type NpcMotionState = "idle" | "walk";

type NpcView = {
  id: NpcId;
  sprite: Phaser.GameObjects.Sprite;
  label: Phaser.GameObjects.Text;
  facing: Facing;
  motion: NpcMotionState;
};

export class NpcManager {
  private scene: Phaser.Scene;
  private npcs = new Map<NpcId, NpcView>();
  private currentAreaId?: AreaId;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  setArea(areaId: AreaId) {
    this.currentAreaId = areaId;
    this.npcs.forEach((npc) => this.syncNpcPresentation(npc));
  }

  spawn(npcId: NpcId, x: number, y: number, facing?: Facing) {
    const def = NPC_DEFINITIONS[npcId];
    const asset = getNpcAssetDefinition(def.visualAssetId);
    const initialFacing = facing ?? def.defaultFacing;

    // NPC 본체는 rectangle 대신 실제 idle sprite를 사용한다.
    const sprite = this.scene.add
      .sprite(x, y, asset.idleTextureKey, asset.idleFrameRange.start)
      .setOrigin(0.5, 1)
      .setDepth(getActorDepth(y));

    // 이름표는 기존처럼 별도 text 오브젝트로 유지한다.
    const label = this.scene.add
      .text(x, y - 40, def.label, { color: "#ffffff", fontSize: "16px" })
      .setOrigin(0.5)
      .setDepth(getActorDepth(y) + 1);

    const npc: NpcView = {
      id: npcId,
      sprite,
      label,
      facing: initialFacing,
      motion: "idle"
    };

    playNpcIdle(sprite, asset);
    this.syncNpcPresentation(npc);
    this.npcs.set(npcId, npc);
  }

  moveTo(npcId: NpcId, toX: number, toY: number, duration: number) {
    const npc = this.requireNpc(npcId);
    const fromX = npc.sprite.x;
    const fromY = npc.sprite.y;

    // 이동량 기준으로 실제 walk 방향을 계산한다.
    npc.facing = this.resolveFacing(fromX, fromY, toX, toY, npc.facing);
    this.setMotion(npc, "walk");

    return new Promise<void>((resolve) => {
      this.scene.tweens.add({
        targets: npc.sprite,
        x: toX,
        y: toY,
        duration,
        onUpdate: () => {
          this.syncNpcPresentation(npc);
        },
        onComplete: () => {
          this.setMotion(npc, "idle");
          this.syncNpcPresentation(npc);
          resolve();
        }
      });
    });
  }

  turn(npcId: NpcId, facing: Facing) {
    const npc = this.requireNpc(npcId);
    npc.facing = facing;
    this.setMotion(npc, "idle");
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

  // idle과 walk 상태 전환을 manager 내부에서만 처리한다.
  private setMotion(npc: NpcView, motion: NpcMotionState) {
    const def = NPC_DEFINITIONS[npc.id];
    const asset = getNpcAssetDefinition(def.visualAssetId);

    npc.motion = motion;

    if (motion === "walk") {
      playNpcWalk(npc.sprite, asset, npc.facing);
      return;
    }

    playNpcIdle(npc.sprite, asset);
  }

  private syncNpcPresentation(npc: NpcView) {
    const scale = this.currentAreaId ? getAreaNpcScale(this.currentAreaId) : getAreaNpcScale("campus");
    const labelOffsetY = Math.max(10, npc.sprite.height * scale * 0.1);

    // 한 줄 한글 설명: 지역 정의의 NPC 배율과 이름표 표시 위치를 함께 반영합니다.
    npc.sprite.setScale(scale);
    npc.sprite.setDepth(getActorDepth(npc.sprite.y));
    npc.label.setPosition(npc.sprite.x, npc.sprite.y + labelOffsetY);
    npc.label.setDepth(getActorDepth(npc.sprite.y) + 1);
    npc.label.setStyle({
      backgroundColor: "rgba(36, 36, 36, 0.85)",
      padding: { left: 6, right: 6, top: 2, bottom: 2 }
    });
  }

  // 이동량이 가장 큰 축을 기준으로 상하좌우 방향을 결정한다.
  private resolveFacing(
    fromX: number,
    fromY: number,
    toX: number,
    toY: number,
    fallbackFacing: Facing
  ): Facing {
    const deltaX = toX - fromX;
    const deltaY = toY - fromY;

    if (Math.abs(deltaX) > Math.abs(deltaY) && deltaX !== 0) {
      return deltaX > 0 ? "right" : "left";
    }

    if (deltaY !== 0) {
      return deltaY > 0 ? "down" : "up";
    }

    return fallbackFacing;
  }

  private requireNpc(npcId: NpcId) {
    const npc = this.npcs.get(npcId);
    if (!npc) {
      throw new Error(`NPC not found: ${npcId}`);
    }
    return npc;
  }
}
