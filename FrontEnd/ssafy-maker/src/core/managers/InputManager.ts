import Phaser from "phaser";

export class InputManager {
  private scene: Phaser.Scene;
  private cursors: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd: Record<string, Phaser.Input.Keyboard.Key>;

  constructor(scene: Phaser.Scene) {
    if (!scene.input.keyboard) {
      throw new Error("Keyboard input is unavailable.");
    }
    this.scene = scene;
    this.cursors = scene.input.keyboard.createCursorKeys();
    this.wasd = scene.input.keyboard.addKeys("W,A,S,D") as Record<string, Phaser.Input.Keyboard.Key>;
  }

  getMoveVector(): Phaser.Math.Vector2 {
    const left = this.wasd.A.isDown || this.cursors.left.isDown;
    const right = this.wasd.D.isDown || this.cursors.right.isDown;
    const up = this.wasd.W.isDown || this.cursors.up.isDown;
    const down = this.wasd.S.isDown || this.cursors.down.isDown;

    const vector = new Phaser.Math.Vector2((right ? 1 : 0) - (left ? 1 : 0), (down ? 1 : 0) - (up ? 1 : 0));
    if (vector.lengthSq() > 0) {
      vector.normalize();
    }
    return vector;
  }

  isKeyJustDown(keyCode: number): boolean {
    const keyboard = this.scene.input.keyboard;
    if (!keyboard) return false;
    return Phaser.Input.Keyboard.JustDown(keyboard.addKey(keyCode));
  }
}

