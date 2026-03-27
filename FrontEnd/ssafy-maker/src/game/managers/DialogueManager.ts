// 등록된 대화 스크립트를 화면에 출력하고 노드 단위로 진행시키는 대화 실행 매니저
import Phaser from "phaser";
import type {
  DialogueAction,
  DialogueChoice,
  DialogueNode,
  DialogueRequirement,
  AffectionRequirement,
  DialogueRequirementStatKey,
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
import { getCurrentLoadedWeek } from "../../infra/story/authoredStoryRepository";

type DialogueRuntimeHooks = {
  getMetricValue?: (stat: DialogueRequirementStatKey) => number | string;
  getAffectionValue?: (npcId: string) => number;
  applyStatDelta?: (delta: Partial<Record<PlayerStatKey, number>>, multiplier?: 1 | -1) => void;
  applyAffectionDelta?: (changes: Record<string, number>) => void;
  setFlags?: (flags: string[]) => void;
  patchHudState?: (next: Partial<HudState>) => void;
  onNotice?: (message: string) => void;
  runAction?: (action: DialogueAction) => void;
  getHudState?: () => HudState;
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
  private getAffectionValue?: DialogueRuntimeHooks["getAffectionValue"];
  private applyStatDelta?: DialogueRuntimeHooks["applyStatDelta"];
  private applyAffectionDelta?: DialogueRuntimeHooks["applyAffectionDelta"];
  private setFlags?: DialogueRuntimeHooks["setFlags"];
  private patchHudState?: DialogueRuntimeHooks["patchHudState"];
  private onNotice?: DialogueRuntimeHooks["onNotice"];
  private runAction?: DialogueRuntimeHooks["runAction"];
  private getHudState?: DialogueRuntimeHooks["getHudState"];

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
    this.getAffectionValue = hooks.getAffectionValue;
    this.applyStatDelta = hooks.applyStatDelta;
    this.applyAffectionDelta = hooks.applyAffectionDelta;
    this.setFlags = hooks.setFlags;
    this.patchHudState = hooks.patchHudState;
    this.onNotice = hooks.onNotice;
    this.runAction = hooks.runAction;
    this.getHudState = hooks.getHudState;
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
        // 만약 노드 자체에 조건이 붙어있다면 검사한다.
        // 조건이 충족되지 않으면 즉시 다음 노드로 건너뛴다.
        if (currentNode.requirements && !this.checkRequirements(currentNode.requirements)) {
          if (currentNode.nextNodeId) {
            currentNode = script.nodes[currentNode.nextNodeId];
            continue;
          } else {
            currentNode = undefined;
            break;
          }
        }

        if (currentNode.choices && currentNode.choices.length > 0) {
          const selectedIndex = await this.waitForChoice(currentNode);
          if (this.destroyed) {
            break;
          }
          const selectedChoice: DialogueChoice | undefined = currentNode.choices[selectedIndex] ?? currentNode.choices[0];
          if (selectedChoice && !this.checkRequirements(selectedChoice.requirements, selectedChoice.affectionRequirements)) {
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
          if (selectedChoice?.action) {
            this.runAction?.(selectedChoice.action);
            // action이 미니게임을 실행하면 씬이 pause되어 UPDATE 이벤트가 멈춤
            // 따라서 대화를 즉시 종료하고 feedbackDialogues/nextNodeId는 따라가지 않음
            currentNode = undefined;
            continue;
          }
          if (selectedChoice?.nextNodeId) {
            currentNode = script.nodes[selectedChoice.nextNodeId];
            continue;
          }
          if (selectedChoice?.feedbackText) {
            this.dialogueBox?.renderNode(this.createFeedbackNode(selectedChoice.feedbackText));
            await this.waitForAdvance();
            if (this.destroyed) {
              break;
            }
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

    // 주차별(Week) 가변 대화 지원: id_w1, id_w2 형태가 등록되어 있는지 우선 확인
    if (this.getHudState) {
      const hudWeek = this.getHudState().week;
      const loadedWeek = getCurrentLoadedWeek();

      // 로드된 주차와 HUD 주차가 다르면 경고 (주차 불일치 상태)
      if (loadedWeek !== null && loadedWeek !== hudWeek) {
        console.warn(`[Dialogue] Week mismatch! HUD: ${hudWeek}, Loaded: ${loadedWeek}. Using loaded week for dialogue lookup.`);
      }

      // 로드된 주차 데이터를 기준으로 대화를 찾음 (불일치 시 로드된 주차 우선)
      const effectiveWeek = loadedWeek ?? hudWeek;
      const weekSpecificId = `${normalizedDialogueId}_w${effectiveWeek}`;
      console.log(`[Dialogue] Resolving: ${normalizedDialogueId} (HUD Week ${hudWeek}, Loaded Week ${loadedWeek}) -> Checking: ${weekSpecificId}`);
      const weekScript = resolveRegisteredDialogue(weekSpecificId);
      if (weekScript) {
        console.log(`[Dialogue] Found Week-Specific: ${weekSpecificId}`);
        return weekScript;
      }
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
      isChoiceAvailable: (choice) => this.checkRequirements(choice.requirements, choice.affectionRequirements)
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
            isChoiceAvailable: (choice) => this.checkRequirements(choice.requirements, choice.affectionRequirements)
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
            isChoiceAvailable: (choice) => this.checkRequirements(choice.requirements, choice.affectionRequirements)
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

  private checkRequirements(
    requirements?: DialogueRequirement[],
    affectionRequirements?: AffectionRequirement[]
  ): boolean {
    const list = requirements ?? [];
    const statReqMet = list.every((req) => {
      const value = this.getMetricValue?.(req.stat) ?? 0;
      if (typeof req.equals === "string") {
        return String(value).toUpperCase() === req.equals.trim().toUpperCase();
      }
      if (typeof value !== "number") {
        return false;
      }
      if (typeof req.min === "number" && value < req.min) {
        return false;
      }
      if (typeof req.max === "number" && value > req.max) {
        return false;
      }
      return true;
    });

    if (!statReqMet) return false;

    const affList = affectionRequirements ?? [];
    return affList.every((req) => {
      const value = this.getAffectionValue?.(req.npcId) ?? 0;
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
    const affectionReqs = choice.affectionRequirements ?? [];
    
    if (requirements.length === 0 && affectionReqs.length === 0) {
      return "";
    }

    const reqTexts = requirements.map((req) => this.describeRequirement(req));
    const affTexts = affectionReqs.map((req) => req.label ?? `${req.npcId} 호감도 조건`);
    
    return [...reqTexts, ...affTexts].join(", ");
  }

  private describeRequirement(req: DialogueRequirement): string {
    if (req.label) {
      return req.label;
    }

    const label =
      req.stat === "hp"
        ? "HP"
        : req.stat === "week"
          ? "주차"
        : req.stat === "playerGender"
          ? "성별"
          : req.stat === "money"
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

    if (typeof req.equals === "string") {
      return `${label} ${req.equals}`;
    }
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
    const hudPatch: Partial<HudState> = {};
    const statDelta: Partial<Record<PlayerStatKey, number>> = {};
    const summary: string[] = [];

    if (choice.statChanges) {
      (Object.entries(choice.statChanges) as Array<[DialogueStatKey, number]>).forEach(([key, value]) => {
        if (!value) {
          return;
        }

        if (key === "hp") {
          const currentHp = Number(this.getMetricValue?.("hp") ?? 0);
          hudPatch.hp = currentHp + value;
          summary.push(`HP ${value > 0 ? "+" : ""}${value}`);
          return;
        }

        if (isDialogueCurrencyStatKey(key)) {
          const hudCurrencyKey = toDialogueCurrencyHudKey(key);
          const currentMoney = Number(this.getMetricValue?.(key) ?? 0);
          hudPatch[hudCurrencyKey] = Math.max(0, currentMoney + value);
          summary.push(`재화 ${value > 0 ? "+" : ""}${value}`);
          return;
        }

        statDelta[key] = value;
        summary.push(`${this.describeStatKey(key)} ${value > 0 ? "+" : ""}${value}`);
      });
    }

    if (choice.affectionChanges && this.applyAffectionDelta && Object.keys(choice.affectionChanges).length > 0) {
      this.applyAffectionDelta(choice.affectionChanges);
      Object.entries(choice.affectionChanges).forEach(([npcId, value]) => {
        if (value) {
          summary.push(`호감도 ${value > 0 ? "+" : ""}${value}`);
        }
      });
    }

    if (choice.setFlags && choice.setFlags.length > 0 && this.setFlags) {
      this.setFlags(choice.setFlags);
    }

    if (Object.keys(statDelta).length > 0) {
      this.applyStatDelta?.(statDelta, 1);
    }
    if (Object.keys(hudPatch).length > 0) {
      this.patchHudState?.(hudPatch);
    }
    if (summary.length > 0) {
      this.onNotice?.(`변화: ${summary.join(", ")}`);
    }
  }

  private describeStatKey(key: DialogueStatKey): string {
    switch (key) {
      case "hp":
        return "HP";
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
      default:
        return String(key);
    }
  }

  private createFeedbackNode(feedbackText: string): DialogueNode {
    return {
      id: "__choice_feedback__",
      speaker: "안내",
      speakerId: "SYSTEM",
      text: feedbackText
    };
  }
}
