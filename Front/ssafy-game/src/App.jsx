import { useEffect, useRef } from 'react';
import Phaser from 'phaser';
import MenuScene from './scenes/MenuScene';
import QuizScene from './scenes/QuizScene';
import TypingScene from './scenes/TypingScene';
import DragScene from './scenes/DragScene';

function App() {
  const gameRef = useRef(null);

  useEffect(() => {
    const config = {
      type: Phaser.AUTO,
      width: 800,
      height: 600,
      parent: gameRef.current,
      backgroundColor: '#0a0a1f',
      // 픽셀 선명도 설정
      pixelArt: true,        // 픽셀 아트 모드 ON
      antialias: false,      // 안티앨리어싱 OFF (흐림 방지)
      roundPixels: true,     // 픽셀 반올림 (선명하게)
      zoom: 1,
      render: {
        antialias: false,
        pixelArt: true,
        roundPixels: true,
      },
  scene: [MenuScene, QuizScene, TypingScene, DragScene]
};

    const game = new Phaser.Game(config);
    return () => game.destroy(true);
  }, []);

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      backgroundColor: '#0a0a1a'
    }}>
      <div ref={gameRef} />
    </div>
  );
}

export default App;