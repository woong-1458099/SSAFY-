import BaseSmileScene from './BaseSmileScene';
import {
  LEGACY_DONT_SMILE_CONFIG,
  LEGACY_DONT_SMILE_SURVIVAL_TICKS,
  LEGACY_SMILE_MAX_GAUGE
} from '@features/minigame/legacy/legacySmileConfig';

export default class DontSmileScene extends BaseSmileScene {
  private remainingTicks = LEGACY_DONT_SMILE_SURVIVAL_TICKS;

  protected readonly title = LEGACY_DONT_SMILE_CONFIG.title;
  protected readonly subtitle = LEGACY_DONT_SMILE_CONFIG.subtitle;
  protected readonly sceneLabel = LEGACY_DONT_SMILE_CONFIG.sceneLabel;
  protected readonly theme = LEGACY_DONT_SMILE_CONFIG.theme;

  constructor() {
    super('DontSmileScene');
  }

  create(): void {
    this.remainingTicks = LEGACY_DONT_SMILE_SURVIVAL_TICKS;
    super.create();
  }

  protected getInitialStatus(): string {
    return LEGACY_DONT_SMILE_CONFIG.initialStatus;
  }

  protected updateGauge(state: { gauge: number; ratio: number; isSmiling: boolean }): 'success' | 'failure' | null {
    state.gauge += state.isSmiling ? 1.4 + state.ratio * 10 : -0.5;
    state.gauge = Math.max(0, Math.min(state.gauge, LEGACY_SMILE_MAX_GAUGE));

    if (!state.isSmiling) {
      this.remainingTicks = Math.max(0, this.remainingTicks - 1);
    }

    this.statusText.setText(
      state.isSmiling
        ? '위험도가 오르고 있습니다. 표정을 유지하세요.'
        : `좋습니다. ${(this.remainingTicks / 4).toFixed(1)}초만 더 버티면 됩니다.`,
    );

    if (state.gauge >= LEGACY_SMILE_MAX_GAUGE) {
      return 'failure';
    }

    if (this.remainingTicks <= 0) {
      return 'success';
    }

    return null;
  }

  protected renderLiveOverlay(ctx: CanvasRenderingContext2D, state: { gauge: number; ratio: number; isSmiling: boolean }): void {
    this.drawRatio(ctx, state.isSmiling ? '#ff92a7' : '#8cffc7');
    this.drawGauge(ctx, '#ff4668');
    ctx.font = '16px Arial';
    ctx.fillStyle = '#edf7ff';
    ctx.fillText(state.isSmiling ? '웃음 감지됨' : `버티기 ${(this.remainingTicks / 4).toFixed(1)}초`, 18, 66);

    if (state.gauge > 0) {
      ctx.fillStyle = `rgba(255, 32, 76, ${Math.min(0.42, state.gauge / LEGACY_SMILE_MAX_GAUGE / 2)})`;
      ctx.fillRect(0, 0, 640, 480);
    }
  }
}
