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
      backgroundColor: '#1a1a2e',
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