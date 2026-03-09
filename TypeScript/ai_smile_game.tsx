import React, { useEffect, useRef, useState } from 'react';

// --- 전역 타입 및 윈도우 객체 확장 ---
declare global {
  interface Window {
    FaceMesh: any;
    Camera: any;
  }
}

// MediaPipe 스크립트를 중복 로드하지 않도록 처리하는 헬퍼 함수
const loadMediaPipe = async () => {
  if (window.FaceMesh && window.Camera) return true;
  
  const scripts = [
    "https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js",
    "https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/face_mesh.js"
  ];

  for (const src of scripts) {
    if (document.querySelector(`script[src="${src}"]`)) continue;
    await new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = src;
      script.crossOrigin = "anonymous";
      script.onload = resolve;
      document.head.appendChild(script);
    });
  }
  return true;
};

// 두 점 사이 거리 계산 유틸리티
const getDistance = (p1: any, p2: any, w: number, h: number) => {
  const x1 = p1.x * w; const y1 = p1.y * h;
  const x2 = p2.x * w; const y2 = p2.y * h;
  return Math.hypot(x2 - x1, y2 - y1);
};


// =====================================================================
// [미니게임 1] 자본주의 미소 (미소를 유지해서 게이지 100 채우기)
// =====================================================================
interface KeepSmileGameProps {
  onExit: () => void;
  onGameEnd: (isSuccess: boolean) => void;
}

const KeepSmileGame: React.FC<KeepSmileGameProps> = ({ onExit, onGameEnd }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isReady, setIsReady] = useState(false);
  const [gameState, setGameState] = useState<'PLAYING' | 'CLEARED'>('PLAYING');

  const SMILE_THRESHOLD = 0.40; 
  const MAX_GAUGE = 100.0;
  const FILL_SPEED = 0.6;
  const DROP_SPEED = 2.0;

  const gameData = useRef({ gauge: 0, ratio: 0, isSmiling: false });

  useEffect(() => {
    let camera: any = null;
    let faceMesh: any = null;

    const initGame = async () => {
      await loadMediaPipe();
      setIsReady(true);

      const videoElement = videoRef.current;
      const canvasElement = canvasRef.current;
      if (!videoElement || !canvasElement) return;
      const ctx = canvasElement.getContext('2d');
      if (!ctx) return;

      faceMesh = new window.FaceMesh({
        locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`
      });
      faceMesh.setOptions({ maxNumFaces: 1, refineLandmarks: true, minDetectionConfidence: 0.5, minTrackingConfidence: 0.5 });

      faceMesh.onResults((results: any) => {
        const w = canvasElement.width; const h = canvasElement.height;
        ctx.save(); ctx.clearRect(0, 0, w, h); ctx.translate(w, 0); ctx.scale(-1, 1);
        ctx.drawImage(results.image, 0, 0, w, h); ctx.restore();

        const gd = gameData.current;

        if (results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0 && gameState === 'PLAYING') {
          const landmarks = results.multiFaceLandmarks[0];
          const p61 = landmarks[61]; const p291 = landmarks[291]; // 입꼬리
          const p234 = landmarks[234]; const p454 = landmarks[454]; // 얼굴 끝

          const w_mouth = getDistance(p61, p291, w, h);
          const w_face = getDistance(p234, p454, w, h);
          
          gd.ratio = w_face > 0 ? w_mouth / w_face : 0;
          gd.isSmiling = gd.ratio >= SMILE_THRESHOLD;

          // 로직: 미소 지으면 차오르고 아니면 깎임
          if (gd.isSmiling) gd.gauge += FILL_SPEED;
          else gd.gauge -= DROP_SPEED;
          gd.gauge = Math.max(0, Math.min(gd.gauge, MAX_GAUGE));

          // 랜드마크 렌더링
          ctx.fillStyle = gd.isSmiling ? '#00FF00' : '#FF0000';
          [p61, p291].forEach(p => {
            ctx.beginPath(); ctx.arc(w - (p.x * w), p.y * h, 5, 0, 2 * Math.PI); ctx.fill();
          });

          if (gd.gauge >= MAX_GAUGE) {
            setGameState('CLEARED');
          }
        }

        // UI 렌더링
        ctx.font = '24px Arial'; ctx.fillStyle = '#FFFFFF'; ctx.strokeStyle = '#000000'; ctx.lineWidth = 3;
        ctx.strokeText(`Ratio: ${gd.ratio.toFixed(3)}`, 20, 40); ctx.fillText(`Ratio: ${gd.ratio.toFixed(3)}`, 20, 40);

        const barW = 400; const barH = 30; const barX = (w - barW) / 2; const barY = h - 60;
        ctx.fillStyle = '#444444'; ctx.fillRect(barX, barY, barW, barH);
        ctx.fillStyle = '#00D7FF'; ctx.fillRect(barX, barY, (gd.gauge / MAX_GAUGE) * barW, barH);
        ctx.strokeStyle = '#FFFFFF'; ctx.lineWidth = 2; ctx.strokeRect(barX, barY, barW, barH);
      });

      camera = new window.Camera(videoElement, {
        onFrame: async () => { await faceMesh.send({image: videoElement}); },
        width: 640, height: 480
      });
      camera.start();
    };

    initGame();
    return () => {
      if (camera) camera.stop();
      if (faceMesh) faceMesh.close();
    };
  }, [gameState]);

  return (
    <div className="flex flex-col items-center justify-center p-4 bg-blue-950 rounded-2xl border-4 border-blue-500 shadow-2xl relative">
      <h2 className="text-2xl font-bold text-blue-200 mb-4">😁 자본주의 미소 미니게임</h2>
      <div className="relative bg-black rounded-lg overflow-hidden">
        <video ref={videoRef} className="hidden" playsInline />
        {!isReady && <div className="absolute inset-0 flex items-center justify-center text-white">카메라 로딩중...</div>}
        <canvas ref={canvasRef} width="640" height="480" className="w-[640px] h-[480px] bg-neutral-900" />
        
        {gameState === 'CLEARED' && (
          <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center text-white">
            <h1 className="text-4xl font-black text-green-400 mb-6 drop-shadow-md">CLEAR!</h1>
            <button onClick={() => onGameEnd(true)} className="px-6 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg font-bold text-xl">메인 게임으로 복귀</button>
          </div>
        )}
      </div>
      <button onClick={onExit} className="absolute top-4 right-4 text-white/50 hover:text-white font-bold">✖ 닫기</button>
    </div>
  );
};


// =====================================================================
// [미니게임 2] 웃음 참기 (웃으면 페널티 누적, 게이지 다 차면 실패)
// =====================================================================
interface DontSmileGameProps {
  onExit: () => void;
  onGameEnd: (survived: boolean) => void;
}

const DontSmileGame: React.FC<DontSmileGameProps> = ({ onExit, onGameEnd }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isReady, setIsReady] = useState(false);
  const [gameState, setGameState] = useState<'PLAYING' | 'GAMEOVER'>('PLAYING');
  
  const SMILE_THRESHOLD = 0.40; 
  const MAX_GAUGE = 100.0;
  const PENALTY_MULTIPLIER = 10; 
  const RECOVERY_SPEED = 0.3;

  const gameData = useRef({ gauge: 0, ratio: 0, isSmiling: false });

  useEffect(() => {
    let camera: any = null;
    let faceMesh: any = null;

    const initGame = async () => {
      await loadMediaPipe();
      setIsReady(true);

      const videoElement = videoRef.current;
      const canvasElement = canvasRef.current;
      if (!videoElement || !canvasElement) return;
      const ctx = canvasElement.getContext('2d');
      if (!ctx) return;

      faceMesh = new window.FaceMesh({
        locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`
      });
      faceMesh.setOptions({ maxNumFaces: 1, refineLandmarks: true, minDetectionConfidence: 0.5, minTrackingConfidence: 0.5 });

      faceMesh.onResults((results: any) => {
        const w = canvasElement.width; const h = canvasElement.height;
        ctx.save(); ctx.clearRect(0, 0, w, h); ctx.translate(w, 0); ctx.scale(-1, 1);
        ctx.drawImage(results.image, 0, 0, w, h); ctx.restore();

        const gd = gameData.current;

        if (results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0 && gameState === 'PLAYING') {
          const landmarks = results.multiFaceLandmarks[0];
          const p61 = landmarks[61]; const p291 = landmarks[291];
          const p234 = landmarks[234]; const p454 = landmarks[454];

          const w_mouth = getDistance(p61, p291, w, h);
          const w_face = getDistance(p234, p454, w, h);
          
          gd.ratio = w_face > 0 ? w_mouth / w_face : 0;
          gd.isSmiling = gd.ratio >= SMILE_THRESHOLD;

          // 로직: 웃으면 페널티 누적
          if (gd.isSmiling) gd.gauge += 1.0 + (gd.ratio * PENALTY_MULTIPLIER);
          else gd.gauge -= RECOVERY_SPEED;
          gd.gauge = Math.max(0, Math.min(gd.gauge, MAX_GAUGE));

          // 붉은 경고 화면 효과
          if (gd.gauge > 0) {
            ctx.fillStyle = `rgba(255, 0, 0, ${gd.gauge / MAX_GAUGE * 0.5})`;
            ctx.fillRect(0, 0, w, h);
          }

          ctx.fillStyle = gd.isSmiling ? '#FF0000' : '#00FF00';
          [p61, p291].forEach(p => {
            ctx.beginPath(); ctx.arc(w - (p.x * w), p.y * h, 5, 0, 2 * Math.PI); ctx.fill();
          });

          if (gd.gauge >= MAX_GAUGE) {
            setGameState('GAMEOVER');
          }
        }

        // UI 렌더링
        ctx.font = '24px Arial'; ctx.fillStyle = '#FFFFFF'; ctx.strokeStyle = '#000000'; ctx.lineWidth = 3;
        ctx.strokeText(`Ratio: ${gd.ratio.toFixed(3)}`, 20, 40); ctx.fillText(`Ratio: ${gd.ratio.toFixed(3)}`, 20, 40);

        const barW = 400; const barH = 30; const barX = (w - barW) / 2; const barY = h - 60;
        ctx.fillStyle = '#444444'; ctx.fillRect(barX, barY, barW, barH);
        ctx.fillStyle = '#FF3333'; ctx.fillRect(barX, barY, (gd.gauge / MAX_GAUGE) * barW, barH);
        ctx.strokeStyle = '#FFFFFF'; ctx.lineWidth = 2; ctx.strokeRect(barX, barY, barW, barH);
      });

      camera = new window.Camera(videoElement, {
        onFrame: async () => { await faceMesh.send({image: videoElement}); },
        width: 640, height: 480
      });
      camera.start();
    };

    initGame();
    return () => {
      if (camera) camera.stop();
      if (faceMesh) faceMesh.close();
    };
  }, [gameState]);

  return (
    <div className="flex flex-col items-center justify-center p-4 bg-red-950 rounded-2xl border-4 border-red-500 shadow-2xl relative">
      <h2 className="text-2xl font-bold text-red-200 mb-4">😐 웃음 참기 미니게임</h2>
      <div className="relative bg-black rounded-lg overflow-hidden">
        <video ref={videoRef} className="hidden" playsInline />
        {!isReady && <div className="absolute inset-0 flex items-center justify-center text-white">카메라 로딩중...</div>}
        <canvas ref={canvasRef} width="640" height="480" className="w-[640px] h-[480px] bg-neutral-900" />
        
        {gameState === 'GAMEOVER' && (
          <div className="absolute inset-0 bg-red-900/80 flex flex-col items-center justify-center text-white">
            <h1 className="text-4xl font-black text-white mb-6 drop-shadow-md">GAME OVER</h1>
            <p className="mb-6 font-bold text-red-200">웃음을 참지 못했습니다!</p>
            <button onClick={() => onGameEnd(false)} className="px-6 py-2 bg-red-600 hover:bg-red-500 rounded-lg font-bold text-xl">메인 게임으로 복귀</button>
          </div>
        )}
      </div>
      <button onClick={onExit} className="absolute top-4 right-4 text-white/50 hover:text-white font-bold">✖ 닫기</button>
    </div>
  );
};


// =====================================================================
// [메인 로비] 큰 게임에서 미니게임을 호출하는 가상의 부모 컴포넌트
// =====================================================================
export default function App() {
  const [activeMiniGame, setActiveMiniGame] = useState<'NONE' | 'KEEP_SMILE' | 'DONT_SMILE'>('NONE');
  const [lastResult, setLastResult] = useState<string | null>(null);

  const handleMiniGameEnd = (gameName: string, success: boolean) => {
    setActiveMiniGame('NONE');
    setLastResult(`${gameName} 미니게임 결과: ${success ? '성공🎉' : '실패💀'}`);
  };

  return (
    <div className="min-h-screen bg-neutral-800 flex flex-col items-center justify-center text-white font-sans p-8">
      
      {activeMiniGame === 'NONE' ? (
        // --- 가상의 메인 게임 화면 ---
        <div className="w-full max-w-2xl bg-neutral-900 p-10 rounded-3xl shadow-2xl text-center border border-neutral-700">
          <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600 mb-8">
            🎮 MY AWESOME MAIN GAME
          </h1>
          <p className="text-neutral-400 mb-8">
            이곳은 메인 게임 화면입니다. 특정 이벤트가 발생하면 미니게임을 시작합니다.
          </p>
          
          {lastResult && (
            <div className="mb-8 p-4 bg-neutral-800 rounded-lg text-yellow-400 font-bold border border-yellow-700">
              알림: {lastResult}
            </div>
          )}

          <div className="flex justify-center gap-6">
            <button 
              onClick={() => setActiveMiniGame('KEEP_SMILE')}
              className="px-6 py-4 bg-blue-600 hover:bg-blue-500 rounded-2xl font-bold shadow-lg transition-transform hover:scale-105"
            >
              😁 [미니게임] 자본주의 미소 실행
            </button>
            <button 
              onClick={() => setActiveMiniGame('DONT_SMILE')}
              className="px-6 py-4 bg-red-600 hover:bg-red-500 rounded-2xl font-bold shadow-lg transition-transform hover:scale-105"
            >
              😐 [미니게임] 웃음 참기 실행
            </button>
          </div>
        </div>
      ) : (
        // --- 미니게임 렌더링 영역 ---
        <div className="w-full flex justify-center animate-in fade-in zoom-in duration-300">
          {activeMiniGame === 'KEEP_SMILE' && (
            <KeepSmileGame 
              onExit={() => setActiveMiniGame('NONE')}
              onGameEnd={(success) => handleMiniGameEnd('자본주의 미소', success)} 
            />
          )}
          {activeMiniGame === 'DONT_SMILE' && (
            <DontSmileGame 
              onExit={() => setActiveMiniGame('NONE')}
              onGameEnd={(success) => handleMiniGameEnd('웃음 참기', success)} 
            />
          )}
        </div>
      )}
      
    </div>
  );
}