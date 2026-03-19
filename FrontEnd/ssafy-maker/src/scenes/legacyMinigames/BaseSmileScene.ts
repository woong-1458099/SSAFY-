import Phaser from 'phaser';
import {
  getDistance,
  loadMediaPipe,
  type CameraInstance,
  type FaceMeshInstance,
  type FaceMeshResults,
} from './faceTracking';
import { installMinigamePause } from './installMinigamePause';
import { applyLegacyViewport } from './viewport';
import { returnToScene } from '@features/minigame/minigameLauncher';

const PIXEL_FONT = '"Press Start 2P"';
const CAMERA_WIDTH = 640;
const CAMERA_HEIGHT = 480;
const SMILE_THRESHOLD = 0.4;
const MAX_GAUGE = 100;

type SceneOutcome = 'success' | 'failure';

interface ThemeConfig {
  panel: number;
  border: number;
  accent: string;
  gauge: string;
  danger: string;
}

interface GaugeState {
  gauge: number;
  ratio: number;
  isSmiling: boolean;
}

abstract class BaseSmileScene extends Phaser.Scene {
  protected cameraInstance: CameraInstance | null = null;
  protected faceMeshInstance: FaceMeshInstance | null = null;
  protected domContainer: Phaser.GameObjects.DOMElement | null = null;
  protected videoElement: HTMLVideoElement | null = null;
  protected canvasElement: HTMLCanvasElement | null = null;
  protected canvasContext: CanvasRenderingContext2D | null = null;
  protected statusText!: Phaser.GameObjects.Text;
  protected helperText!: Phaser.GameObjects.Text;
  protected resultGroup: Phaser.GameObjects.GameObject[] = [];
  protected gaugeState: GaugeState = { gauge: 0, ratio: 0, isSmiling: false };
  protected completed = false;
  protected returnSceneKey = 'MainScene';

  protected abstract readonly title: string;
  protected abstract readonly subtitle: string;
  protected abstract readonly sceneLabel: string;
  protected abstract readonly theme: ThemeConfig;
  protected abstract getInitialStatus(): string;
  protected abstract updateGauge(state: GaugeState): SceneOutcome | null;
  protected abstract renderLiveOverlay(ctx: CanvasRenderingContext2D, state: GaugeState): void;

  constructor(sceneKey: string) {
    super({ key: sceneKey });
  }

  init(data: { returnSceneKey?: string }): void {
    this.returnSceneKey = data?.returnSceneKey || 'MainScene';
  }

  create(): void {
    applyLegacyViewport(this);
    installMinigamePause(this, this.returnSceneKey);
    this.completed = false;
    this.gaugeState = { gauge: 0, ratio: 0, isSmiling: false };

    this.drawShell();
    this.createCameraSurface();
    this.createStatusArea();
    this.registerCleanup();
    void this.initFaceTracking();
  }

  protected drawShell(): void {
    this.add.rectangle(400, 300, 800, 600, 0x060d17);
    this.add.rectangle(400, 4, 800, 8, this.theme.border);
    this.add.rectangle(400, 60, 800, 112, this.theme.panel, 0.96);
    this.add.rectangle(400, 116, 800, 3, this.theme.border, 0.9);
    this.add.text(400, 26, this.title, {
      fontSize: '18px',
      color: this.theme.accent,
      fontFamily: PIXEL_FONT,
    }).setOrigin(0.5, 0);
    this.add.text(400, 74, this.subtitle, {
      fontSize: '8px',
      color: '#d9e9ff',
      fontFamily: PIXEL_FONT,
      align: 'center',
      wordWrap: { width: 680 },
    }).setOrigin(0.5, 0.5);
    this.add.rectangle(400, 340, 700, 500, 0x000000, 0.42).setStrokeStyle(3, this.theme.border, 0.75);
  }

  protected createCameraSurface(): void {
    const container = document.createElement('div');
    container.style.width = `${CAMERA_WIDTH}px`;
    container.style.height = `${CAMERA_HEIGHT}px`;
    container.style.border = '4px solid rgba(255,255,255,0.12)';
    container.style.borderRadius = '18px';
    container.style.overflow = 'hidden';
    container.style.background = '#05070b';
    container.style.boxShadow = '0 18px 40px rgba(0,0,0,0.45)';

    const video = document.createElement('video');
    video.setAttribute('playsinline', 'true');
    video.style.display = 'none';

    const canvas = document.createElement('canvas');
    canvas.width = CAMERA_WIDTH;
    canvas.height = CAMERA_HEIGHT;
    canvas.style.display = 'block';
    canvas.style.width = `${CAMERA_WIDTH}px`;
    canvas.style.height = `${CAMERA_HEIGHT}px`;
    canvas.style.background = '#0d1117';

    container.append(video, canvas);

    this.videoElement = video;
    this.canvasElement = canvas;
    this.canvasContext = canvas.getContext('2d');
    this.domContainer = this.add.dom(400, 338, container);
  }

  protected createStatusArea(): void {
    this.statusText = this.add.text(400, 573, this.getInitialStatus(), {
      fontSize: '8px',
      color: '#f3f8ff',
      fontFamily: PIXEL_FONT,
      align: 'center',
      wordWrap: { width: 700 },
    }).setOrigin(0.5);

    this.helperText = this.add.text(36, 130, 'CAMERA READYING...', {
      fontSize: '8px',
      color: this.theme.accent,
      fontFamily: PIXEL_FONT,
    });
  }

  protected registerCleanup(): void {
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.cleanup, this);
    this.events.once(Phaser.Scenes.Events.DESTROY, this.cleanup, this);
  }

  protected async initFaceTracking(): Promise<void> {
    try {
      await loadMediaPipe();

      if (!this.videoElement || !this.canvasElement || !this.canvasContext || !window.FaceMesh || !window.Camera) {
        throw new Error('Camera surface was not prepared.');
      }

      this.statusText.setText(this.getInitialStatus());
      this.helperText.setText('CAMERA CONNECTED');

      const faceMesh = new window.FaceMesh({
        locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`,
      });

      faceMesh.setOptions({
        maxNumFaces: 1,
        refineLandmarks: true,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5,
      });

      faceMesh.onResults((results) => {
        this.handleResults(results);
      });

      this.faceMeshInstance = faceMesh;
      this.cameraInstance = new window.Camera(this.videoElement, {
        onFrame: async () => {
          if (this.completed || !this.faceMeshInstance || !this.videoElement) {
            return;
          }

          await this.faceMeshInstance.send({ image: this.videoElement });
        },
        width: CAMERA_WIDTH,
        height: CAMERA_HEIGHT,
      });

      this.cameraInstance.start();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.helperText.setText('CAMERA FAILED');
      this.statusText.setText(`카메라 또는 MediaPipe 초기화에 실패했습니다: ${message}`);
      this.showResult('카메라 오류', '#ff667a', '카메라 권한을 허용한 뒤 다시 시도해 주세요.', 'failure');
    }
  }

  protected handleResults(results: FaceMeshResults): void {
    if (!this.canvasContext || !this.canvasElement) {
      return;
    }

    const ctx = this.canvasContext;
    const width = this.canvasElement.width;
    const height = this.canvasElement.height;

    ctx.save();
    ctx.clearRect(0, 0, width, height);
    ctx.translate(width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(results.image, 0, 0, width, height);
    ctx.restore();

    if (this.completed) {
      this.renderLiveOverlay(ctx, this.gaugeState);
      return;
    }

    if (!results.multiFaceLandmarks || results.multiFaceLandmarks.length === 0) {
      this.statusText.setText('얼굴이 인식되지 않았습니다. 카메라 중앙으로 이동해 주세요.');
      this.renderLiveOverlay(ctx, this.gaugeState);
      return;
    }

    const landmarks = results.multiFaceLandmarks[0];
    const mouthLeft = landmarks[61];
    const mouthRight = landmarks[291];
    const faceLeft = landmarks[234];
    const faceRight = landmarks[454];

    const mouthWidth = getDistance(mouthLeft, mouthRight, width, height);
    const faceWidth = getDistance(faceLeft, faceRight, width, height);
    const ratio = faceWidth > 0 ? mouthWidth / faceWidth : 0;

    this.gaugeState.ratio = ratio;
    this.gaugeState.isSmiling = ratio >= SMILE_THRESHOLD;

    const outcome = this.updateGauge(this.gaugeState);

    this.drawLandmark(ctx, mouthLeft, width, height);
    this.drawLandmark(ctx, mouthRight, width, height);
    this.renderLiveOverlay(ctx, this.gaugeState);

    if (outcome) {
      this.finishGame(outcome);
    }
  }

  protected drawLandmark(
    ctx: CanvasRenderingContext2D,
    point: { x: number; y: number },
    width: number,
    height: number,
  ): void {
    ctx.fillStyle = this.gaugeState.isSmiling ? '#2eff8b' : '#ff5570';
    ctx.beginPath();
    ctx.arc(width - point.x * width, point.y * height, 5, 0, Math.PI * 2);
    ctx.fill();
  }

  protected drawGauge(ctx: CanvasRenderingContext2D, color: string): void {
    const barWidth = 420;
    const barHeight = 28;
    const x = (CAMERA_WIDTH - barWidth) / 2;
    const y = CAMERA_HEIGHT - 54;

    ctx.fillStyle = '#2a3240';
    ctx.fillRect(x, y, barWidth, barHeight);
    ctx.fillStyle = color;
    ctx.fillRect(x, y, (this.gaugeState.gauge / MAX_GAUGE) * barWidth, barHeight);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, barWidth, barHeight);
  }

  protected drawRatio(ctx: CanvasRenderingContext2D, color: string): void {
    ctx.font = '18px Arial';
    ctx.fillStyle = color;
    ctx.strokeStyle = '#02050b';
    ctx.lineWidth = 5;
    const ratioText = `RATIO ${(this.gaugeState.ratio * 100).toFixed(1)}%`;
    ctx.strokeText(ratioText, 18, 34);
    ctx.fillText(ratioText, 18, 34);
  }

  protected finishGame(outcome: SceneOutcome): void {
    if (this.completed) {
      return;
    }

    this.completed = true;
    this.stopTracking();
    this.showResult(
      outcome === 'success' ? '성공' : '실패',
      outcome === 'success' ? this.theme.gauge : this.theme.danger,
      this.sceneLabel,
      outcome,
    );
  }

  protected showResult(title: string, titleColor: string, sceneLabel: string, outcome: SceneOutcome): void {
    const overlay = this.add.rectangle(400, 300, 800, 600, 0x02060d, 0.7).setDepth(30);
    const panel = this.add.rectangle(400, 300, 500, 250, this.theme.panel, 0.97).setDepth(31).setStrokeStyle(3, this.theme.border, 0.95);
    const titleText = this.add.text(400, 242, title, {
      fontSize: '24px',
      color: titleColor,
      fontFamily: PIXEL_FONT,
    }).setOrigin(0.5).setDepth(32);
    const subtitle = this.add.text(400, 288, sceneLabel, {
      fontSize: '10px',
      color: '#edf7ff',
      fontFamily: PIXEL_FONT,
      align: 'center',
      wordWrap: { width: 420 },
    }).setOrigin(0.5).setDepth(32);
    const rewardText = this.add.text(400, 320, outcome === 'success' ? '미션 완료' : '다시 도전해 보세요', {
      fontSize: '10px',
      color: '#9fd8ff',
      fontFamily: PIXEL_FONT,
    }).setOrigin(0.5).setDepth(32);
    const retryButton = this.createButton(300, 356, '다시하기', () => this.scene.restart());
    const menuButton = this.createButton(500, 356, '나가기', () => returnToScene(this, this.returnSceneKey));

    this.resultGroup = [overlay, panel, titleText, subtitle, rewardText, ...retryButton, ...menuButton];
  }

  protected createButton(x: number, y: number, label: string, onClick: () => void): Phaser.GameObjects.GameObject[] {
    const shadow = this.add.rectangle(x + 3, y + 3, 160, 44, 0x000000, 0.6).setDepth(32);
    const button = this.add.rectangle(x, y, 160, 44, this.theme.panel).setDepth(33).setInteractive().setStrokeStyle(3, this.theme.border, 0.95);
    const text = this.add.text(x, y, label, {
      fontSize: '10px',
      color: '#ffffff',
      fontFamily: PIXEL_FONT,
    }).setOrigin(0.5).setDepth(34);

    button.on('pointerover', () => button.setFillStyle(this.theme.border));
    button.on('pointerout', () => button.setFillStyle(this.theme.panel));
    button.on('pointerdown', () => {
      this.cameras.main.flash(120, 255, 255, 255, false);
      this.time.delayedCall(120, onClick);
    });

    return [shadow, button, text];
  }

  protected stopTracking(): void {
    this.cameraInstance?.stop();
    this.faceMeshInstance?.close();
    this.cameraInstance = null;
    this.faceMeshInstance = null;
  }

  protected cleanup(): void {
    this.stopTracking();
    this.resultGroup.forEach((item) => item.destroy());
    this.resultGroup = [];
    this.domContainer?.destroy();
    this.domContainer = null;
    this.videoElement = null;
    this.canvasElement = null;
    this.canvasContext = null;
  }
}

export { MAX_GAUGE };
export default BaseSmileScene;
