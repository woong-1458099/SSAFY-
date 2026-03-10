import BaseSmileScene, { MAX_GAUGE } from './BaseSmileScene';

const SURVIVAL_TICKS = 100;

export default class DontSmileScene extends BaseSmileScene {
  private remainingTicks = SURVIVAL_TICKS;

  protected readonly title = '웃음참기';
  protected readonly subtitle = '웃으면 위험 게이지가 오릅니다. 끝까지 표정을 유지하세요.';
  protected readonly sceneLabel = '정색을 유지한 채 제한 시간을 버티면 성공합니다.';
  protected readonly theme = {
    panel: 0x3a0b18,
    border: 0xff5f7c,
    accent: '#ffc7d4',
    gauge: '#ff6b6b',
    danger: '#ff2f57',
  };

  constructor() {
    super('DontSmileScene');
  }

  create(): void {
    this.remainingTicks = SURVIVAL_TICKS;
    super.create();
  }

  protected getInitialStatus(): string {
    return '표정을 최대한 유지하세요. 웃으면 위험 게이지가 빠르게 상승합니다.';
  }

  protected updateGauge(state: { gauge: number; ratio: number; isSmiling: boolean }): 'success' | 'failure' | null {
    state.gauge += state.isSmiling ? 1.4 + state.ratio * 10 : -0.5;
    state.gauge = Math.max(0, Math.min(state.gauge, MAX_GAUGE));

    if (!state.isSmiling) {
      this.remainingTicks = Math.max(0, this.remainingTicks - 1);
    }

    this.statusText.setText(
      state.isSmiling
        ? '위험도가 오르고 있습니다. 표정을 유지하세요.'
        : `좋습니다. ${(this.remainingTicks / 4).toFixed(1)}초만 더 버티면 됩니다.`,
    );

    if (state.gauge >= MAX_GAUGE) {
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
      ctx.fillStyle = `rgba(255, 32, 76, ${Math.min(0.42, state.gauge / MAX_GAUGE / 2)})`;
      ctx.fillRect(0, 0, 640, 480);
    }
  }
}
