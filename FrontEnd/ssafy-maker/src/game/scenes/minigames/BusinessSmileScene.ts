import BaseSmileScene from './BaseSmileScene';
import { LEGACY_BUSINESS_SMILE_CONFIG, LEGACY_SMILE_MAX_GAUGE } from '@features/minigame/legacy/legacySmileConfig';
import { LEGACY_BUSINESS_SMILE_SCENE_KEY } from '@features/minigame/minigameSceneKeys';

export default class BusinessSmileScene extends BaseSmileScene {
  protected readonly title = LEGACY_BUSINESS_SMILE_CONFIG.title;
  protected readonly subtitle = LEGACY_BUSINESS_SMILE_CONFIG.subtitle;
  protected readonly sceneLabel = LEGACY_BUSINESS_SMILE_CONFIG.sceneLabel;
  protected readonly theme = LEGACY_BUSINESS_SMILE_CONFIG.theme;

  constructor() {
    super(LEGACY_BUSINESS_SMILE_SCENE_KEY);
  }

  protected getInitialStatus(): string {
    return LEGACY_BUSINESS_SMILE_CONFIG.initialStatus;
  }

  protected updateGauge(state: { gauge: number; ratio: number; isSmiling: boolean }): 'success' | 'failure' | null {
    state.gauge += state.isSmiling ? 0.8 : -1.8;
    state.gauge = Math.max(0, Math.min(state.gauge, LEGACY_SMILE_MAX_GAUGE));
    this.statusText.setText(state.isSmiling ? '좋아요. 지금 웃음을 유지해 주세요.' : '게이지가 줄고 있습니다. 조금 더 웃어 주세요.');
    return state.gauge >= LEGACY_SMILE_MAX_GAUGE ? 'success' : null;
  }

  protected renderLiveOverlay(ctx: CanvasRenderingContext2D, state: { gauge: number; ratio: number; isSmiling: boolean }): void {
    this.drawRatio(ctx, state.isSmiling ? '#7df0ff' : '#ffd166');
    this.drawGauge(ctx, '#24e1ff');
    ctx.font = '16px Arial';
    ctx.fillStyle = '#edf7ff';
    ctx.fillText(state.isSmiling ? '웃음 인식됨' : '웃음 필요', 18, 66);
  }
}
