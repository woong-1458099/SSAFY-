// 등록된 대화 스크립트를 화면에 출력하고 노드 단위로 진행시키는 대화 실행 매니저
import Phaser from "phaser";
import type {
  DialogueAction,
  DialogueChoice,
  DialogueNode,
  DialogueRequirement,
  DialogueScript,
  DialogueStatKey
} from "../../common/types/dialogue";
import {
  isDialogueCurrencyStatKey,
  isRuntimeDialogueId,
  toDialogueCurrencyHudKey
} from "../../common/types/dialogue";
import type { DialogueBox } from "../../features/ui/components/DialogueBox";
import type { HudState, PlayerStatKey } from "../state/gameState";
import { resolveRegisteredDialogue } from "../scripts/dialogues/dialogueRegistry";

type DialogueRuntimeHooks = {
  getMetricValue?: (stat: DialogueStatKey) => number;
  applyStatDelta?: (delta: Partial<Record<PlayerStatKey, number>>, multiplier?: 1 | -1) => void;
  patchHudState?: (next: Partial<HudState>) => void;
  onNotice?: (message: string) => void;
  runAction?: (action: DialogueAction) => void;
};

export class DialogueManager {
  private scene: Phaser.Scene;
  private dialogueBox?: DialogueBox;
  private runtimeDialogueScripts: Record<string, DialogueScript> = {};
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
  private getMetricValue?: DialogueRuntimeHooks["getMetricValue"];
  private applyStatDelta?: DialogueRuntimeHooks["applyStatDelta"];
  private patchHudState?: DialogueRuntimeHooks["patchHudState"];
  private onNotice?: DialogueRuntimeHooks["onNotice"];
  private runAction?: DialogueRuntimeHooks["runAction"];

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

  setRuntimeDialogueScripts(scripts: Record<string, DialogueScript>): void {
    this.runtimeDialogueScripts = Object.fromEntries(
      Object.entries(scripts).filter(([id, script]) => isRuntimeDialogueId(id) && script.id === id)
    );
  }

  setRuntimeHooks(hooks: DialogueRuntimeHooks): void {
    this.getMetricValue = hooks.getMetricValue;
    this.applyStatDelta = hooks.applyStatDelta;
    this.patchHudState = hooks.patchHudState;
    this.onNotice = hooks.onNotice;
    this.runAction = hooks.runAction;
  }

  async play(dialogueId: string) {
    const script = this.resolveDialogue(dialogueId);
    if (!script) {
      this.onNotice?.(`대화 스크립트를 찾을 수 없습니다: ${dialogueId}`);
      return;
    }

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
          if (selectedChoice && !this.isChoiceAvailable(selectedChoice)) {
            const requirementText = this.getRequirementText(selectedChoice);
            this.onNotice?.(
              selectedChoice.lockedReason ??
                (requirementText || "선택 조건을 만족하지 못했습니다")
            );
            continue;
          }
          if (selectedChoice) {
            this.applyChoiceStatChanges(selectedChoice);
          }
          if (selectedChoice?.nextNodeId) {
            currentNode = script.nodes[selectedChoice.nextNodeId];
            continue;
          }
          if (selectedChoice?.feedbackText) {
            this.onNotice?.(selectedChoice.feedbackText);
          }
          if (selectedChoice?.action) {
            this.runAction?.(selectedChoice.action);
          }
          currentNode = undefined;
          continue;
        }

        this.dialogueBox?.renderNode(currentNode);
        await this.waitForAdvance();
        if (this.destroyed) {
          break;
        }

        if (currentNode.nextNodeId) {
          currentNode = script.nodes[currentNode.nextNodeId];
        } else {
          if (currentNode.action) {
            this.runAction?.(currentNode.action);
          }
          currentNode = undefined;
        }
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

  private resolveDialogue(dialogueId: string): DialogueScript | null {
    const normalizedDialogueId = dialogueId.trim();
    if (!normalizedDialogueId) {
      return null;
    }

    if (isRuntimeDialogueId(normalizedDialogueId)) {
      return this.runtimeDialogueScripts[normalizedDialogueId] ?? null;
    }

    return resolveRegisteredDialogue(normalizedDialogueId);
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
    this.dialogueBox?.renderNode(node, {
      selectedChoiceIndex: selectedIndex,
      getRequirementText: (choice) => this.getRequirementText(choice),
      isChoiceAvailable: (choice) => this.isChoiceAvailable(choice)
    });

    return new Promise<number>((resolve) => {
      let cancel = () => {};
      const onUpdate = () => {
        if (
          (this.upKey && Phaser.Input.Keyboard.JustDown(this.upKey)) ||
          (this.wKey && Phaser.Input.Keyboard.JustDown(this.wKey))
        ) {
          selectedIndex = Phaser.Math.Wrap(selectedIndex - 1, 0, node.choices!.length);
          this.dialogueBox?.renderNode(node, {
            selectedChoiceIndex: selectedIndex,
            getRequirementText: (choice) => this.getRequirementText(choice),
            isChoiceAvailable: (choice) => this.isChoiceAvailable(choice)
          });
          return;
        }

        if (
          (this.downKey && Phaser.Input.Keyboard.JustDown(this.downKey)) ||
          (this.sKey && Phaser.Input.Keyboard.JustDown(this.sKey))
        ) {
          selectedIndex = Phaser.Math.Wrap(selectedIndex + 1, 0, node.choices!.length);
          this.dialogueBox?.renderNode(node, {
            selectedChoiceIndex: selectedIndex,
            getRequirementText: (choice) => this.getRequirementText(choice),
            isChoiceAvailable: (choice) => this.isChoiceAvailable(choice)
          });
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

  private isChoiceAvailable(choice: DialogueChoice): boolean {
    const requirements = choice.requirements ?? [];
    return requirements.every((req) => {
      const value = this.getMetricValue?.(req.stat) ?? 0;
      if (typeof req.min === "number" && value < req.min) {
        return false;
      }
      if (typeof req.max === "number" && value > req.max) {
        return false;
      }
      return true;
    });
  }

  private getRequirementText(choice: DialogueChoice): string {
    const requirements = choice.requirements ?? [];
    if (requirements.length === 0) {
      return "";
    }

    return requirements.map((req) => this.describeRequirement(req)).join(", ");
  }

  private describeRequirement(req: DialogueRequirement): string {
    if (req.label) {
      return req.label;
    }

    const label =
      req.stat === "hp"
        ? "HP"
        : isDialogueCurrencyStatKey(req.stat)
          ? "재화"
          : req.stat === "fe"
            ? "FE"
            : req.stat === "be"
              ? "BE"
              : req.stat === "teamwork"
                ? "협업"
                : req.stat === "luck"
                  ? "운"
                  : "스트레스";

    if (typeof req.min === "number" && typeof req.max === "number") {
      return `${label} ${req.min}~${req.max}`;
    }
    if (typeof req.min === "number") {
      return `${label} ${req.min} 이상`;
    }
    if (typeof req.max === "number") {
      return `${label} ${req.max} 이하`;
    }
    return label;
  }

  private applyChoiceStatChanges(choice: DialogueChoice): void {
    if (!choice.statChanges) {
      return;
    }

    const hudPatch: Partial<HudState> = {};
    const statDelta: Partial<Record<PlayerStatKey, number>> = {};
    const summary: string[] = [];

    (Object.entries(choice.statChanges) as Array<[DialogueStatKey, number]>).forEach(([key, value]) => {
      if (!value) {
        return;
      }

      if (key === "hp") {
        const currentHp = this.getMetricValue?.("hp") ?? 0;
        hudPatch.hp = currentHp + value;
        summary.push(`HP ${value > 0 ? "+" : ""}${value}`);
        return;
      }

      if (isDialogueCurrencyStatKey(key)) {
        const hudCurrencyKey = toDialogueCurrencyHudKey(key);
        const currentMoney = this.getMetricValue?.(key) ?? 0;
        hudPatch[hudCurrencyKey] = Math.max(0, currentMoney + value);
        summary.push(`재화 ${value > 0 ? "+" : ""}${value}`);
        return;
      }

      statDelta[key] = value;
      summary.push(`${this.describeStatKey(key)} ${value > 0 ? "+" : ""}${value}`);
    });

    if (Object.keys(statDelta).length > 0) {
      this.applyStatDelta?.(statDelta, 1);
    }
    if (Object.keys(hudPatch).length > 0) {
      this.patchHudState?.(hudPatch);
    }
    if (summary.length > 0) {
      this.onNotice?.(`능력치 변화: ${summary.join(", ")}`);
    }
  }

  private describeStatKey(key: DialogueStatKey): string {
    switch (key) {
      case "hp":
        return "HP";
      case "gold":
      case "money":
        return "재화";
      case "fe":
        return "FE";
      case "be":
        return "BE";
      case "teamwork":
        return "협업";
      case "luck":
        return "운";
      case "stress":
        return "스트레스";
    }
  }
}
