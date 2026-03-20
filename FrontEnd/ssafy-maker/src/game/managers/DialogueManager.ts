// 등록된 대화 스크립트를 화면에 출력하고 노드 단위로 진행시키는 대화 실행 매니저
import Phaser from "phaser";
import type {
  DialogueChoice,
  DialogueNode,
  DialogueScript
} from "../../common/types/dialogue";
import { DIALOGUE_REGISTRY } from "../scripts/dialogues/dialogueRegistry";

export class DialogueManager {
  private scene: Phaser.Scene;
  private box?: Phaser.GameObjects.Rectangle;
  private text?: Phaser.GameObjects.Text;
  private isPlaying = false;
  private readonly uiDepth = 10000;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  async play(dialogueId: string) {
    const script = this.requireDialogue(dialogueId);
    this.ensureUi();
    this.isPlaying = true;
    this.box!.setVisible(true);
    this.text!.setVisible(true);

    let currentNode: DialogueNode | undefined = script.nodes[script.startNodeId];

    while (currentNode) {
      this.text!.setText(`${currentNode.speaker}: ${currentNode.text}\n\n[SPACE] 다음`);
      await this.waitForSpace();

      if (currentNode.choices && currentNode.choices.length > 0) {
        const firstChoice: DialogueChoice = currentNode.choices[0];
        currentNode = firstChoice.nextNodeId
          ? script.nodes[firstChoice.nextNodeId]
          : undefined;
        continue;
      }

      currentNode = currentNode.nextNodeId
        ? script.nodes[currentNode.nextNodeId]
        : undefined;
    }

    this.text!.setText("");
    this.text!.setVisible(false);
    this.box!.setVisible(false);
    this.isPlaying = false;
  }

  isDialoguePlaying() {
    return this.isPlaying;
  }

  private requireDialogue(dialogueId: string): DialogueScript {
    const script = DIALOGUE_REGISTRY[dialogueId];
    if (!script) {
      throw new Error(`Dialogue not found: ${dialogueId}`);
    }
    return script;
  }

  private waitForSpace() {
    return new Promise<void>((resolve) => {
      const key = this.scene.input.keyboard!.addKey(
        Phaser.Input.Keyboard.KeyCodes.SPACE
      );
      key.once("down", () => resolve());
    });
  }

  private ensureUi() {
    if (this.box && this.text) {
      return;
    }

    this.box = this.scene.add
      .rectangle(640, 610, 1100, 160, 0x000000, 0.75)
      .setStrokeStyle(2, 0xffffff)
      .setDepth(this.uiDepth)
      .setScrollFactor(0)
      .setVisible(false);

    this.text = this.scene.add.text(120, 560, "", {
      color: "#ffffff",
      fontSize: "22px",
      wordWrap: { width: 1000 }
    })
      .setDepth(this.uiDepth + 1)
      .setScrollFactor(0)
      .setVisible(false);
  }
}
