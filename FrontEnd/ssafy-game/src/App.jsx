import { useEffect, useRef } from 'react';
import Phaser from 'phaser';
import MenuScene from './scenes/MenuScene';
import QuizScene from './scenes/QuizScene';
import DragScene from './scenes/DragScene';
import RhythmScene from './scenes/RhythmScene';
import BugScene from './scenes/BugScene';
import RunnerScene from './scenes/RunnerScene';
import AimScene from './scenes/AimScene';
import TypingScene from './scenes/TypingScene';

function App() {
  const gameRef = useRef(null);

  useEffect(() => {
    const config = {
      type: Phaser.AUTO,
      width: 800,
      height: 600,
      parent: gameRef.current,
      backgroundColor: '#0a0a1f',
      pixelArt: true,
      antialias: false,
      roundPixels: true,
      render: { antialias: false, pixelArt: true, roundPixels: true },
      scene: [
        MenuScene, QuizScene, RhythmScene,
        DragScene, BugScene, RunnerScene,
        AimScene, TypingScene
      ]
    };

    const game = new Phaser.Game(config);
    return () => game.destroy(true);
  }, []);

  return (
    <div style={{
      display: 'flex', justifyContent: 'center',
      alignItems: 'center', height: '100vh',
      backgroundColor: '#0a0a1a'
    }}>
      <div ref={gameRef} />
    </div>
  );
}

export default App;