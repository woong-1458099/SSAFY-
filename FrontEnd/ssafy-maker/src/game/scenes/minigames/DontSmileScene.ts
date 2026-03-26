import BaseSmileScene from './BaseSmileScene';
import {
  LEGACY_DONT_SMILE_CONFIG,
  LEGACY_DONT_SMILE_SURVIVAL_TICKS,
  LEGACY_SMILE_MAX_GAUGE
} from '@features/minigame/legacy/legacySmileConfig';
import { LEGACY_DONT_SMILE_SCENE_KEY } from '@features/minigame/minigameSceneKeys';

// 🌟 invert 제거됨
type FilterMode = 'blackhole' | 'mirror' | 'wave' | 'fish_eye' | 'none';

export default class DontSmileScene extends BaseSmileScene {
  private remainingTicks = LEGACY_DONT_SMILE_SURVIVAL_TICKS;

  private currentFilter: FilterMode = 'none';
  private lastFilterChangeTime = 0;
  
  // 🌟 스로틀링을 위한 타이머 및 캐시
  private lastProcessTime = 0;
  private lastImageData: ImageData | null = null;

  protected readonly title = LEGACY_DONT_SMILE_CONFIG.title;
  protected readonly subtitle = LEGACY_DONT_SMILE_CONFIG.subtitle;
  protected readonly sceneLabel = LEGACY_DONT_SMILE_CONFIG.sceneLabel;
  protected readonly theme = LEGACY_DONT_SMILE_CONFIG.theme;

  constructor() {
    super(LEGACY_DONT_SMILE_SCENE_KEY);
  }

  protected startGame(): void {
    this.remainingTicks = LEGACY_DONT_SMILE_SURVIVAL_TICKS;
    this.currentFilter = 'none';
    this.lastFilterChangeTime = Date.now();
    super.startGame();
  }

  protected getInitialStatus(): string {
    return LEGACY_DONT_SMILE_CONFIG.initialStatus;
  }

  /**
   * 왜곡 필터 엔진 (수동 픽셀 매핑)
   */
  private applyDistortFilter(ctx: CanvasRenderingContext2D, mode: FilterMode): void {
    if (mode === 'none') {
      this.lastImageData = null;
      return;
    }

    const now = Date.now();
    if (now - this.lastProcessTime < 33) {
      if (this.lastImageData) {
        ctx.putImageData(this.lastImageData, 0, 0);
      }
      return;
    }
    this.lastProcessTime = now;

    const width = ctx.canvas.width;
    const height = ctx.canvas.height;
    
    if (width === 0 || height === 0) return;

    const imageData = ctx.getImageData(0, 0, width, height);
    const src = new Uint8ClampedArray(imageData.data); 
    const dst = imageData.data;

    const cx = width / 2;
    const cy = height / 2;
    const maxR = Math.sqrt(cx * cx + cy * cy);

    // Wave 필터를 위한 시간 변수
    const timeOffset = Date.now() / 150; 

    // 🌟 invert 로직 완전히 삭제됨

    // 좌표 왜곡 필터 처리
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const dx = x - cx;
        const dy = y - cy;
        let srcX = x;
        let srcY = y;

        if (mode === 'blackhole') {
          const r = Math.sqrt(dx * dx + (dy * 1.5) ** 2);
          const rNorm = r / maxR;
          const factor = Math.pow(rNorm, 0.25); 
          srcX = cx + dx * factor;
          srcY = cy + dy * factor * 0.7;
        } 
        else if (mode === 'mirror') {
          // 데칼코마니: 타겟의 x좌표가 중앙을 넘어가면, 소스의 왼쪽 픽셀을 반전해서 가져옴
          srcX = x < cx ? x : width - 1 - x;
          srcY = y;
        }
        else if (mode === 'wave') {
          // 흐물흐물 오징어: Y좌표와 시간에 따라 X좌표가 좌우로 물결치듯 진동함
          const amplitude = 20; // 출렁임 강도
          const frequency = 0.05; // 물결 촘촘함
          srcX = x + Math.sin(y * frequency + timeOffset) * amplitude;
          srcY = y;
        }
        else if (mode === 'fish_eye') {
          const r = Math.sqrt(dx * dx + dy * dy);
          const rNorm = r / maxR;
          const factor = Math.pow(rNorm, 1.8);
          srcX = cx + dx * factor;
          srcY = cy + dy * factor;
        }

        // 캔버스 범위를 벗어나지 않도록 좌표 제한
        const ix = Math.max(0, Math.min(width - 1, Math.floor(srcX)));
        const iy = Math.max(0, Math.min(height - 1, Math.floor(srcY)));

        // 1차원 배열 인덱스 매핑 (RGBA)
        const targetIdx = (y * width + x) * 4;
        const srcIdx = (iy * width + ix) * 4;

        dst[targetIdx] = src[srcIdx];
        dst[targetIdx + 1] = src[srcIdx + 1];
        dst[targetIdx + 2] = src[srcIdx + 2];
        dst[targetIdx + 3] = src[srcIdx + 3];
      }
    }
    this.lastImageData = imageData;
    ctx.putImageData(imageData, 0, 0);
  }

  protected updateGauge(state: { gauge: number; ratio: number; isSmiling: boolean }): 'success' | 'failure' | null {
    // 5초마다 랜덤 필터 변경
    const now = Date.now();
    if (now - this.lastFilterChangeTime > 5000) {
      // 🌟 배열에서 invert 제거됨
      const filters: FilterMode[] = ['blackhole', 'mirror', 'wave', 'fish_eye', 'none'];
      this.currentFilter = filters[Math.floor(Math.random() * filters.length)];
      this.lastFilterChangeTime = now;
    }

    state.gauge += state.isSmiling ? 1.4 + state.ratio * 10 : -0.5;
    state.gauge = Math.max(0, Math.min(state.gauge, LEGACY_SMILE_MAX_GAUGE));

    if (!state.isSmiling) {
      this.remainingTicks = Math.max(0, this.remainingTicks - 1);
    }

    this.statusText.setText(
      state.isSmiling
        ? '위험도가 오르고 있습니다. 표정을 유지하세요.'
        : `좋습니다. ${(this.remainingTicks / 4).toFixed(1)}초만 더 버티면 됩니다.`
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
    // 1. 왜곡 필터를 렌더링 최상단에 적용
    this.applyDistortFilter(ctx, this.currentFilter);

    // 2. UI 렌더링
    this.drawRatio(ctx, state.isSmiling ? '#ff92a7' : '#8cffc7');
    this.drawGauge(ctx, '#ff4668');
    
    ctx.font = '16px Arial';
    ctx.fillStyle = '#edf7ff';
    ctx.fillText(state.isSmiling ? '웃음 감지됨' : `버티기 ${(this.remainingTicks / 4).toFixed(1)}초`, 18, 66);
    
    // 현재 적용 중인 필터 정보 UI
    if (this.currentFilter !== 'none') {
      ctx.fillStyle = '#fbff00';
      ctx.font = 'bold 14px Arial';
      ctx.fillText(`MODE: ${this.currentFilter.toUpperCase()}`, 18, 90);
    }

    // 화면 붉은색 경고 오버레이
    if (state.gauge > 0) {
      ctx.fillStyle = `rgba(255, 32, 76, ${Math.min(0.42, state.gauge / LEGACY_SMILE_MAX_GAUGE / 2)})`;
      ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    }
  }
}