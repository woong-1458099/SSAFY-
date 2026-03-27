/**
 * Tutorial System - Main Controller
 */

import Phaser from "phaser";
import { TutorialOverlay } from "./TutorialOverlay";
import { TUTORIAL_STEPS, getTutorialStep, TUTORIAL_STEP_COUNT } from "./TutorialStepConfig";
import {
  type TutorialStep,
  type TutorialProgress,
  type TutorialStepId,
  type TutorialStepStatus
} from "./TutorialState";
import { launchMinigame } from "../minigame/MinigameGateway";
import { SCENE_KEYS } from "../../common/enums/scene";

export interface TutorialManagerOptions {
  scene: Phaser.Scene;
  gameEvents: Phaser.Events.EventEmitter;
  onComplete?: () => void;
}

export class TutorialManager {
  private scene: Phaser.Scene;
  private gameEvents: Phaser.Events.EventEmitter;
  private overlay: TutorialOverlay;
  private progress: TutorialProgress;
  private isActive: boolean = false;
  private isPaused: boolean = false;
  private onComplete?: () => void;

  private autoAdvanceTimer?: Phaser.Time.TimerEvent;
  private moveCount: number = 0;

  constructor(options: TutorialManagerOptions) {
    this.scene = options.scene;
    this.gameEvents = options.gameEvents;
    this.onComplete = options.onComplete;

    // Initialize progress from registry or create new
    const savedProgress = this.scene.registry.get("tutorialProgress") as TutorialProgress | undefined;
    if (savedProgress && !savedProgress.completedAt) {
      this.progress = savedProgress;
    } else {
      this.progress = this.createInitialProgress();
      this.scene.registry.set("tutorialProgress", this.progress);
    }

    // Create overlay
    this.overlay = new TutorialOverlay(this.scene, {
      onSkip: () => this.skipTutorial(),
      onNext: () => this.advanceStep()
    });

    // Setup event listeners
    this.setupEventListeners();
  }

  private createInitialProgress(): TutorialProgress {
    const stepStatuses: Record<TutorialStepId, TutorialStepStatus> = {} as Record<
      TutorialStepId,
      TutorialStepStatus
    >;
    TUTORIAL_STEPS.forEach((step, index) => {
      stepStatuses[step.id] = index === 0 ? "active" : "pending";
    });

    return {
      currentStepIndex: 0,
      stepStatuses,
      moveCount: 0,
      startedAt: Date.now()
    };
  }

  private setupEventListeners(): void {
    // Listen for player movement
    this.gameEvents.on("tutorial:playerMoved", this.onPlayerMoved, this);

    // Listen for NPC interaction
    this.gameEvents.on("tutorial:npcInteraction", this.onNpcInteraction, this);

    // Listen for place interaction
    this.gameEvents.on("tutorial:placeInteraction", this.onPlaceInteraction, this);

    // Listen for area transition
    this.gameEvents.on("tutorial:areaTransition", this.onAreaTransition, this);

    // Listen for planner opened
    this.gameEvents.on("tutorial:plannerOpened", this.onPlannerOpened, this);

    // Listen for menu opened
    this.gameEvents.on("tutorial:menuOpened", this.onMenuOpened, this);
  }

  private removeEventListeners(): void {
    this.gameEvents.off("tutorial:playerMoved", this.onPlayerMoved, this);
    this.gameEvents.off("tutorial:npcInteraction", this.onNpcInteraction, this);
    this.gameEvents.off("tutorial:placeInteraction", this.onPlaceInteraction, this);
    this.gameEvents.off("tutorial:areaTransition", this.onAreaTransition, this);
    this.gameEvents.off("tutorial:plannerOpened", this.onPlannerOpened, this);
    this.gameEvents.off("tutorial:menuOpened", this.onMenuOpened, this);
  }

  start(): void {
    if (this.isActive) return;

    console.log("[TutorialManager] Starting tutorial...");
    this.isActive = true;
    this.overlay.show();
    this.showCurrentStep();
  }

  pause(): void {
    console.log("[TutorialManager] Pausing tutorial");
    this.isPaused = true;
    this.overlay.hide();
    this.cancelAutoAdvance();
  }

  resume(): void {
    if (!this.isActive) return;
    console.log("[TutorialManager] Resuming tutorial");
    this.isPaused = false;
    this.overlay.show();
    this.showCurrentStep();
  }

  private showCurrentStep(): void {
    const step = getTutorialStep(this.progress.currentStepIndex);
    if (!step) {
      console.log("[TutorialManager] No more steps, completing tutorial");
      this.completeTutorial();
      return;
    }

    console.log(`[TutorialManager] Showing step ${this.progress.currentStepIndex}: ${step.id} (${step.completionType})`);
    this.overlay.updateStep(step, this.progress.currentStepIndex);

    // Setup auto-advance if needed
    if (step.completionType === "auto" && step.autoAdvanceMs) {
      this.setupAutoAdvance(step.autoAdvanceMs);
    }
  }

  private setupAutoAdvance(delayMs: number): void {
    this.cancelAutoAdvance();
    console.log(`[TutorialManager] Auto-advance setup for ${delayMs}ms`);
    this.autoAdvanceTimer = this.scene.time.delayedCall(delayMs, () => {
      this.advanceStep();
    });
  }

  private cancelAutoAdvance(): void {
    if (this.autoAdvanceTimer) {
      this.autoAdvanceTimer.destroy();
      this.autoAdvanceTimer = undefined;
    }
  }

  private advanceStep(): void {
    if (!this.isActive || this.isPaused) return;

    const currentStep = getTutorialStep(this.progress.currentStepIndex);
    if (currentStep) {
      console.log(`[TutorialManager] Advancing from step ${this.progress.currentStepIndex} (${currentStep.id})`);
      this.progress.stepStatuses[currentStep.id] = "completed";
    }

    this.progress.currentStepIndex++;
    this.scene.registry.set("tutorialProgress", this.progress);

    if (this.progress.currentStepIndex >= TUTORIAL_STEP_COUNT) {
      this.completeTutorial();
      return;
    }

    const nextStep = getTutorialStep(this.progress.currentStepIndex);
    if (nextStep) {
      this.progress.stepStatuses[nextStep.id] = "active";
    }

    this.scene.registry.set("tutorialProgress", this.progress);
    this.showCurrentStep();
  }

  private skipTutorial(): void {
    console.log("[TutorialManager] Skipping tutorial");
    // Mark all remaining steps as skipped
    TUTORIAL_STEPS.forEach((step) => {
      if (this.progress.stepStatuses[step.id] === "pending" ||
          this.progress.stepStatuses[step.id] === "active") {
        this.progress.stepStatuses[step.id] = "skipped";
      }
    });

    this.completeTutorial();
  }

  private completeTutorial(): void {
    console.log("[TutorialManager] Tutorial completed!");
    this.isActive = false;
    this.progress.completedAt = Date.now();
    this.scene.registry.set("tutorialProgress", this.progress);
    this.cancelAutoAdvance();
    this.overlay.hide();
    this.removeEventListeners();

    // Callback
    this.onComplete?.();
  }

  // Event handlers
  private onPlayerMoved(): void {
    if (!this.isActive || this.isPaused) return;

    const step = getTutorialStep(this.progress.currentStepIndex);
    if (step?.completionType === "playerMoved") {
      this.moveCount++;
      if (step.moveCountRequired && this.moveCount >= step.moveCountRequired) {
        console.log(`[TutorialManager] Player moved enough (${this.moveCount}/${step.moveCountRequired}). Advancing.`);
        this.advanceStep();
      }
    }
  }

  private onNpcInteraction(eventInfo?: { npcId: string, handled: boolean }): void {
    if (!this.isActive || this.isPaused) return;

    const step = getTutorialStep(this.progress.currentStepIndex);
    console.log(`[TutorialManager] NPC interaction: ${eventInfo?.npcId}. Current step: ${step?.id}`);
    
    if (step?.completionType === "npcInteraction") {
      if (eventInfo) {
        eventInfo.handled = true;
      }
      
      console.log("[TutorialManager] Handling tutorial NPC interaction. Waiting for resume to advance.");
      // 미니게임에서 돌아왔을 때 다음 튜토리얼 단계로 넘어가도록 이벤트 등록
      // UI씬은 일시정지되지 않으므로, 메인씬의 RESUME 이벤트를 구독해야 함
      this.gameEvents.once(Phaser.Scenes.Events.RESUME, () => {
        console.log("[TutorialManager] Main scene resumed after NPC interaction. Advancing.");
        this.advanceStep();
      });

      launchMinigame(this.scene, "DontSmileScene", SCENE_KEYS.main);
    }
  }

  private onPlaceInteraction(): void {
    if (!this.isActive || this.isPaused) return;

    const step = getTutorialStep(this.progress.currentStepIndex);
    console.log(`[TutorialManager] Place interaction. Current step: ${step?.id}`);

    if (step?.completionType === "placeInteraction") {
      this.advanceStep();
    }
  }

  private onAreaTransition(): void {
    if (!this.isActive || this.isPaused) return;

    const step = getTutorialStep(this.progress.currentStepIndex);
    console.log(`[TutorialManager] Area transition. Current step: ${step?.id}`);

    if (step?.completionType === "areaTransition") {
      this.advanceStep();
    }
  }

  private onPlannerOpened(): void {
    if (!this.isActive || this.isPaused) return;

    const step = getTutorialStep(this.progress.currentStepIndex);
    console.log(`[TutorialManager] Planner opened. Current step: ${step?.id}`);

    if (step?.completionType === "plannerOpened") {
      this.advanceStep();
    }
  }

  private onMenuOpened(): void {
    if (!this.isActive || this.isPaused) return;

    const step = getTutorialStep(this.progress.currentStepIndex);
    console.log(`[TutorialManager] Menu opened. Current step: ${step?.id}`);

    if (step?.completionType === "menuOpened") {
      this.advanceStep();
    }
  }

  // Public getters
  getIsActive(): boolean {
    return this.isActive;
  }

  getIsPaused(): boolean {
    return this.isPaused;
  }

  getCurrentStepIndex(): number {
    return this.progress.currentStepIndex;
  }

  destroy(): void {
    this.cancelAutoAdvance();
    this.removeEventListeners();
    this.overlay.destroy();
  }
}
