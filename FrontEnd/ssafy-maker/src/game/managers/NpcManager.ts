import Phaser from "phaser";
import type { Facing } from "../../common/enums/facing";
import type { NpcId } from "../../common/enums/npc";
import { NPC_DEFINITIONS } from "../definitions/npcs/npcDefinitions";

type NpcView = {
  id: NpcId;
  sprite: Phaser.GameObjects.Rectangle;
  label: Phaser.GameObjects.Text;
  facing: Facing;
};

export class NpcManager {
  private scene: Phaser.Scene;
  private npcs = new Map<NpcId, NpcView>();

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  spawn(npcId: NpcId, x: number, y: number, facing?: Facing) {
    const def = NPC_DEFINITIONS[npcId];
    const sprite = this.scene.add.rectangle(x, y, 48, 64, 0x6aa9ff).setOrigin(0.5, 1);
    const label = this.scene.add.text(x, y - 80, def.label, { color: "#ffffff", fontSize: "16px" }).setOrigin(0.5);
    this.npcs.set(npcId, { id: npcId, sprite, label, facing: facing ?? def.defaultFacing });
  }

  moveTo(npcId: NpcId, toX: number, toY: number, duration: number) {
    const npc = this.requireNpc(npcId);
    return new Promise<void>((resolve) => {
      this.scene.tweens.add({
        targets: [npc.sprite, npc.label],
        x: toX,
        y: (_target: unknown, _key: string, value: number) => value,
        duration,
        onUpdate: () => npc.label.setPosition(npc.sprite.x, npc.sprite.y - 80),
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

  private requireNpc(npcId: NpcId) {
    const npc = this.npcs.get(npcId);
    if (!npc) throw new Error(`NPC not found: ${npcId}`);
    return npc;
  }
}
