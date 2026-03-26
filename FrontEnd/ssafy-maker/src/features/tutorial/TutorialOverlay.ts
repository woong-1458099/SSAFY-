/**
 * Tutorial System - UI Overlay Component
 */

import Phaser from "phaser";
import { UI_DEPTH } from "../../game/systems/uiDepth";
import type { TutorialStep, TutorialHighlightTarget } from "./TutorialState";
import { TUTORIAL_STEP_COUNT } from "./TutorialStepConfig";

const FONT_FAMILY =
  '"PFStardustBold", "Malgun Gothic", "Apple SD Gothic Neo", "Noto Sans KR", sans-serif';

const COLORS = {
  overlay: 0x04101d,
  panel: 0x14314f,
  border: 0x8ed2ff,
  button: 0x29527d,
  buttonHover: 0x34679d,
  textMain: "#eef7ff",
  textSoft: "#b8d8f7",
  highlight: 0xffe066
};

export interface TutorialOverlayCallbacks {
  onSkip: () => void;
  onNext: () => void;
}

export class TutorialOverlay {
  private scene: Phaser.Scene;
  private root: Phaser.GameObjects.Container;
  private overlay: Phaser.GameObjects.Rectangle;
  private panel: Phaser.GameObjects.Rectangle;
  private messageText: Phaser.GameObjects.Text;
  private hintText: Phaser.GameObjects.Text;
  private progressText: Phaser.GameObjects.Text;
  private skipButton: Phaser.GameObjects.Container;
  private nextButton: Phaser.GameObjects.Container;
  private highlightGraphics: Phaser.GameObjects.Graphics;
  private highlightTween?: Phaser.Tweens.Tween;

  private callbacks: TutorialOverlayCallbacks;
  private currentStep: number = 0;

  constructor(scene: Phaser.Scene, callbacks: TutorialOverlayCallbacks) {
    this.scene = scene;
    this.callbacks = callbacks;

    const centerX = Math.round(scene.scale.width / 2);
    const bottomY = scene.scale.height - 120;

    // Root container
    this.root = scene.add.container(0, 0)
      .setDepth(UI_DEPTH.tutorial)
      .setScrollFactor(0)
      .setVisible(false);

    // No fullscreen overlay - allow player to interact with game
    // Just use a small background behind the panel
    this.overlay = scene.add.rectangle(
      centerX,
      bottomY,
      720,
      160,
      COLORS.overlay,
      0.7
    ).setScrollFactor(0);

    // Message panel at bottom
    this.panel = scene.add.rectangle(centerX, bottomY, 700, 140, COLORS.panel, 0.95)
      .setStrokeStyle(3, COLORS.border, 1)
      .setScrollFactor(0);

    // Message text
    this.messageText = scene.add.text(centerX, bottomY - 20, "", {
      fontFamily: FONT_FAMILY,
      fontSize: "22px",
      fontStyle: "bold",
      color: COLORS.textMain,
      resolution: 2,
      align: "center",
      lineSpacing: 6
    }).setOrigin(0.5).setScrollFactor(0);

    // Hint text (keyboard hint)
    this.hintText = scene.add.text(centerX, bottomY + 35, "", {
      fontFamily: FONT_FAMILY,
      fontSize: "16px",
      color: COLORS.textSoft,
      resolution: 2
    }).setOrigin(0.5).setScrollFactor(0);

    // Progress text (e.g., "3/10")
    this.progressText = scene.add.text(centerX + 300, bottomY - 50, "", {
      fontFamily: FONT_FAMILY,
      fontSize: "14px",
      color: COLORS.textSoft,
      resolution: 2
    }).setOrigin(0.5).setScrollFactor(0);

    // Skip button (top right of panel)
    this.skipButton = this.createButton(
      centerX + 250,
      bottomY + 40,
      100,
      36,
      "건너뛰기",
      () => this.callbacks.onSkip()
    );

    // Next button (hidden by default, for manual advance steps)
    this.nextButton = this.createButton(
      centerX + 130,
      bottomY + 40,
      100,
      36,
      "다음",
      () => this.callbacks.onNext()
    );
    this.nextButton.setVisible(false);

    // Highlight graphics for UI elements
    this.highlightGraphics = scene.add.graphics()
      .setDepth(UI_DEPTH.tutorial - 1)
      .setScrollFactor(0);

    // Add all to root
    this.root.add([
      this.overlay,
      this.panel,
      this.messageText,
      this.hintText,
      this.progressText,
      this.skipButton,
      this.nextButton
    ]);
  }

  private createButton(
    x: number,
    y: number,
    width: number,
    height: number,
    text: string,
    onClick: () => void
  ): Phaser.GameObjects.Container {
    const bg = this.scene.add.rectangle(0, 0, width, height, COLORS.button, 1)
      .setStrokeStyle(2, COLORS.border, 1)
      .setScrollFactor(0);

    const label = this.scene.add.text(0, -1, text, {
      fontFamily: FONT_FAMILY,
      fontSize: "14px",
      fontStyle: "bold",
      color: COLORS.textMain,
      resolution: 2
    }).setOrigin(0.5).setScrollFactor(0);

    const container = this.scene.add.container(x, y, [bg, label]).setScrollFactor(0);

    bg.setInteractive({ useHandCursor: true });
    bg.on("pointerover", () => bg.setFillStyle(COLORS.buttonHover, 1));
    bg.on("pointerout", () => bg.setFillStyle(COLORS.button, 1));
    bg.on("pointerdown", onClick);

    return container;
  }

  show(): void {
    this.root.setVisible(true);
  }

  hide(): void {
    this.root.setVisible(false);
    this.clearHighlight();
  }

  isVisible(): boolean {
    return this.root.visible;
  }

  updateStep(step: TutorialStep, stepIndex: number): void {
    this.currentStep = stepIndex;

    // Update message
    this.messageText.setText(step.message);

    // Update hint
    if (step.hint) {
      this.hintText.setText(`[ ${step.hint} ]`);
      this.hintText.setVisible(true);
    } else {
      this.hintText.setVisible(false);
    }

    // Update progress
    this.progressText.setText(`${stepIndex + 1}/${TUTORIAL_STEP_COUNT}`);

    // Show/hide next button based on completion type
    const showNextButton = step.completionType === "auto" && step.id !== "complete";
    this.nextButton.setVisible(showNextButton);

    // Update highlight
    this.updateHighlight(step.highlightTarget);
  }

  private updateHighlight(target: TutorialHighlightTarget): void {
    this.clearHighlight();

    if (target === "none") {
      return;
    }

    // Get highlight bounds based on target
    const bounds = this.getHighlightBounds(target);
    if (!bounds) {
      return;
    }

    // Draw pulsing highlight
    this.drawHighlight(bounds);
  }

  private getHighlightBounds(target: TutorialHighlightTarget): Phaser.Geom.Rectangle | null {
    switch (target) {
      case "hudLeft":
        return new Phaser.Geom.Rectangle(8, 8, 180, 110);
      case "hudRight":
        return new Phaser.Geom.Rectangle(this.scene.scale.width - 260, 8, 250, 115);
      case "nearestNpc":
      case "nearestPlace":
      case "transitionZone":
        // These require world coordinates - will be handled by TutorialManager
        return null;
      default:
        return null;
    }
  }

  private drawHighlight(bounds: Phaser.Geom.Rectangle): void {
    this.highlightGraphics.clear();
    this.highlightGraphics.lineStyle(3, COLORS.highlight, 1);
    this.highlightGraphics.strokeRect(
      bounds.x - 4,
      bounds.y - 4,
      bounds.width + 8,
      bounds.height + 8
    );

    // Create pulsing animation
    if (this.highlightTween) {
      this.highlightTween.stop();
    }

    this.highlightTween = this.scene.tweens.add({
      targets: this.highlightGraphics,
      alpha: { from: 1, to: 0.4 },
      duration: 600,
      yoyo: true,
      repeat: -1
    });
  }

  highlightWorldPosition(x: number, y: number, width: number, height: number): void {
    this.clearHighlight();

    // Convert world position to screen position
    const camera = this.scene.cameras.main;
    const screenX = x - camera.scrollX;
    const screenY = y - camera.scrollY;

    const bounds = new Phaser.Geom.Rectangle(screenX, screenY, width, height);
    this.drawHighlight(bounds);
  }

  private clearHighlight(): void {
    this.highlightGraphics.clear();
    if (this.highlightTween) {
      this.highlightTween.stop();
      this.highlightTween = undefined;
    }
    this.highlightGraphics.setAlpha(1);
  }

  destroy(): void {
    this.clearHighlight();
    this.highlightGraphics.destroy();
    this.root.destroy();
  }
}
