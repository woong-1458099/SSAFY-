// 등록된 대화 스크립트를 화면에 출력하고 노드 단위로 진행시키는 대화 실행 매니저
import Phaser from "phaser";
import type {
  DialogueNode,
  DialogueScript
} from "../../common/types/dialogue";
import type { DialogueBox } from "../../features/ui/components/DialogueBox";
import { DIALOGUE_REGISTRY } from "../scripts/dialogues/dialogueRegistry";

export class DialogueManager {
  private scene: Phaser.Scene;
  private dialogueBox?: DialogueBox;
  private isPlaying = false;
  private destroyed = false;
  private advanceKey?: Phaser.Input.Keyboard.Key;
  private confirmKey?: Phaser.Input.Keyboard.Key;
  private upKey?: Phaser.Input.Keyboard.Key;
  private downKey?: Phaser.Input.Keyboard.Key;
  private wKey?: Phaser.Input.Keyboard.Key;
  private sKey?: Phaser.Input.Keyboard.Key;
  private digitKeys: Phaser.Input.Keyboard.Key[] = [];
  private pendingWaitCancel?: () => void;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.advanceKey = scene.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    this.confirmKey = scene.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);
    this.upKey = scene.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.UP);
    this.downKey = scene.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.DOWN);
    this.wKey = scene.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.W);
    this.sKey = scene.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.S);
    this.digitKeys = [
      Phaser.Input.Keyboard.KeyCodes.ONE,
      Phaser.Input.Keyboard.KeyCodes.TWO,
      Phaser.Input.Keyboard.KeyCodes.THREE,
      Phaser.Input.Keyboard.KeyCodes.FOUR
    ]
      .map((keyCode) => scene.input.keyboard?.addKey(keyCode))
      .filter((key): key is Phaser.Input.Keyboard.Key => Boolean(key));
  }

  setDialogueBox(dialogueBox?: DialogueBox): void {
    this.dialogueBox = dialogueBox;
  }

  async play(dialogueId: string) {
    const script = this.requireDialogue(dialogueId);
    this.destroyed = false;
    this.isPlaying = true;

    let currentNode: DialogueNode | undefined = script.nodes[script.startNodeId];

    try {
      while (currentNode && !this.destroyed) {
        if (currentNode.choices && currentNode.choices.length > 0) {
          const selectedIndex = await this.waitForChoice(currentNode);
          if (this.destroyed) {
            break;
          }
          const selectedChoice = currentNode.choices[selectedIndex] ?? currentNode.choices[0];
          currentNode = selectedChoice?.nextNodeId
            ? script.nodes[selectedChoice.nextNodeId]
            : undefined;
          continue;
        }

        this.dialogueBox?.renderNode(currentNode);
        await this.waitForAdvance();
        if (this.destroyed) {
          break;
        }

        currentNode = currentNode.nextNodeId
          ? script.nodes[currentNode.nextNodeId]
          : undefined;
      }
    } finally {
      this.pendingWaitCancel?.();
      this.pendingWaitCancel = undefined;
      this.dialogueBox?.hide();
      this.isPlaying = false;
    }
  }

  isDialoguePlaying() {
    return this.isPlaying;
  }

  destroy(): void {
    this.destroyed = true;
    this.pendingWaitCancel?.();
    this.pendingWaitCancel = undefined;
    this.dialogueBox?.hide();
    this.isPlaying = false;
  }

  private requireDialogue(dialogueId: string): DialogueScript {
    const script = DIALOGUE_REGISTRY[dialogueId];
    if (!script) {
      throw new Error(`Dialogue not found: ${dialogueId}`);
    }
    return script;
  }

  private waitForAdvance() {
    return new Promise<void>((resolve) => {
      let cancel = () => {};
      const onUpdate = () => {
        if (
          (this.advanceKey && Phaser.Input.Keyboard.JustDown(this.advanceKey)) ||
          (this.confirmKey && Phaser.Input.Keyboard.JustDown(this.confirmKey))
        ) {
          cleanup();
          resolve();
        }
      };
      const cleanup = () => {
        this.scene.events.off(Phaser.Scenes.Events.UPDATE, onUpdate);
        if (this.pendingWaitCancel === cancel) {
          this.pendingWaitCancel = undefined;
        }
      };
      cancel = () => {
        cleanup();
        resolve();
      };
      this.pendingWaitCancel?.();
      this.pendingWaitCancel = cancel;
      this.scene.events.on(Phaser.Scenes.Events.UPDATE, onUpdate);
    });
  }

  private waitForChoice(node: DialogueNode): Promise<number> {
    let selectedIndex = 0;
    this.dialogueBox?.renderNode(node, selectedIndex);

    return new Promise<number>((resolve) => {
      let cancel = () => {};
      const onUpdate = () => {
        if (
          (this.upKey && Phaser.Input.Keyboard.JustDown(this.upKey)) ||
          (this.wKey && Phaser.Input.Keyboard.JustDown(this.wKey))
        ) {
          selectedIndex = Phaser.Math.Wrap(selectedIndex - 1, 0, node.choices!.length);
          this.dialogueBox?.renderNode(node, selectedIndex);
          return;
        }

        if (
          (this.downKey && Phaser.Input.Keyboard.JustDown(this.downKey)) ||
          (this.sKey && Phaser.Input.Keyboard.JustDown(this.sKey))
        ) {
          selectedIndex = Phaser.Math.Wrap(selectedIndex + 1, 0, node.choices!.length);
          this.dialogueBox?.renderNode(node, selectedIndex);
          return;
        }

        const digitSelection = this.digitKeys.findIndex(
          (key, index) => index < node.choices!.length && Phaser.Input.Keyboard.JustDown(key)
        );
        if (digitSelection >= 0) {
          cleanup();
          resolve(digitSelection);
          return;
        }

        if (
          (this.advanceKey && Phaser.Input.Keyboard.JustDown(this.advanceKey)) ||
          (this.confirmKey && Phaser.Input.Keyboard.JustDown(this.confirmKey))
        ) {
          cleanup();
          resolve(selectedIndex);
        }
      };

      const cleanup = () => {
        this.scene.events.off(Phaser.Scenes.Events.UPDATE, onUpdate);
        if (this.pendingWaitCancel === cancel) {
          this.pendingWaitCancel = undefined;
        }
      };
      cancel = () => {
        cleanup();
        resolve(selectedIndex);
      };

      this.pendingWaitCancel?.();
      this.pendingWaitCancel = cancel;
      this.scene.events.on(Phaser.Scenes.Events.UPDATE, onUpdate);
    });
  }
}
