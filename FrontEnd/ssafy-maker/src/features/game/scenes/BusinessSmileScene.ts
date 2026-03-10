import BaseSmileScene, { MAX_GAUGE } from './BaseSmileScene';

export default class BusinessSmileScene extends BaseSmileScene {
  protected readonly title = '비즈니스 웃음';
  protected readonly subtitle = '자연스럽게 웃음을 유지해 게이지를 끝까지 채우세요.';
  protected readonly sceneLabel = '웃음을 유지해서 게이지를 100까지 채우면 성공합니다.';
  protected readonly theme = {
    panel: 0x0a2544,
    border: 0x3ea3ff,
    accent: '#9fd8ff',
    gauge: '#24e1ff',
    danger: '#ff5e6c',
  };

  constructor() {
    super('BusinessSmileScene');
  }

  protected getInitialStatus(): string {
    return '자연스럽게 웃으세요. 웃음이 커질수록 게이지가 더 잘 찹니다.';
  }

  protected updateGauge(state: { gauge: number; ratio: number; isSmiling: boolean }): 'success' | 'failure' | null {
    state.gauge += state.isSmiling ? 0.8 : -1.8;
    state.gauge = Math.max(0, Math.min(state.gauge, MAX_GAUGE));
    this.statusText.setText(state.isSmiling ? '좋아요. 지금 웃음을 유지해 주세요.' : '게이지가 줄고 있습니다. 조금 더 웃어 주세요.');
    return state.gauge >= MAX_GAUGE ? 'success' : null;
  }

  protected renderLiveOverlay(ctx: CanvasRenderingContext2D, state: { gauge: number; ratio: number; isSmiling: boolean }): void {
    this.drawRatio(ctx, state.isSmiling ? '#7df0ff' : '#ffd166');
    this.drawGauge(ctx, '#24e1ff');
    ctx.font = '16px Arial';
    ctx.fillStyle = '#edf7ff';
    ctx.fillText(state.isSmiling ? '웃음 인식됨' : '웃음 필요', 18, 66);
  }
}
