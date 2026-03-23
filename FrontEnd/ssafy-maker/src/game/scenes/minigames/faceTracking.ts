interface FacePoint {
  x: number;
  y: number;
}

interface FaceMeshInstance {
  setOptions: (options: Record<string, unknown>) => void;
  onResults: (callback: (results: FaceMeshResults) => void) => void;
  send: (payload: { image: HTMLVideoElement }) => Promise<void>;
  close: () => void;
}

interface CameraInstance {
  start: () => void;
  stop: () => void;
}

interface FaceMeshResults {
  image: CanvasImageSource;
  multiFaceLandmarks?: FacePoint[][];
}

interface FaceMeshConstructor {
  new (config: { locateFile: (file: string) => string }): FaceMeshInstance;
}

interface CameraConstructor {
  new (
    video: HTMLVideoElement,
    config: {
      onFrame: () => Promise<void>;
      width: number;
      height: number;
    },
  ): CameraInstance;
}

declare global {
  interface Window {
    FaceMesh?: FaceMeshConstructor;
    Camera?: CameraConstructor;
  }
}

let mediaPipePromise: Promise<void> | null = null;

export async function loadMediaPipe(): Promise<void> {
  if (window.FaceMesh && window.Camera) {
    return;
  }

  if (!mediaPipePromise) {
    mediaPipePromise = (async () => {
      const scripts = [
        'https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js',
        'https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/face_mesh.js',
      ];

      for (const src of scripts) {
        if (document.querySelector(`script[src="${src}"]`)) {
          continue;
        }

        await new Promise<void>((resolve, reject) => {
          const script = document.createElement('script');
          script.src = src;
          script.crossOrigin = 'anonymous';
          script.onload = () => resolve();
          script.onerror = () => reject(new Error(`Failed to load ${src}`));
          document.head.appendChild(script);
        });
      }
    })();
  }

  return mediaPipePromise;
}

export function getDistance(p1: FacePoint, p2: FacePoint, width: number, height: number): number {
  const x1 = p1.x * width;
  const y1 = p1.y * height;
  const x2 = p2.x * width;
  const y2 = p2.y * height;

  return Math.hypot(x2 - x1, y2 - y1);
}

export type { CameraInstance, FaceMeshInstance, FaceMeshResults };
