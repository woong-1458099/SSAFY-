import { useEffect, useRef } from 'react';
import Phaser from 'phaser';
import AimScene from './features/game/scenes/AimScene';
import BusinessSmileScene from './features/game/scenes/BusinessSmileScene';
import BugScene from './features/game/scenes/BugScene';
import DontSmileScene from './features/game/scenes/DontSmileScene';
import DragScene from './features/game/scenes/DragScene';
import MenuScene from './features/game/scenes/MenuScene';
import MinigamePauseScene from './features/game/scenes/MinigamePauseScene';
import QuizScene from './features/game/scenes/QuizScene';
import RhythmScene from './features/game/scenes/RhythmScene';
import RunnerScene from './features/game/scenes/RunnerScene';
import TypingScene from './features/game/scenes/TypingScene';

const GAME_WIDTH = 800;
const GAME_HEIGHT = 600;

interface PhaserGameProps {
  playerName: string;
}

const scenes: Phaser.Types.Scenes.SceneType[] = [
  MenuScene,
  MinigamePauseScene,
  QuizScene,
  RhythmScene,
  DragScene,
  BugScene,
  RunnerScene,
  AimScene,
  TypingScene,
  BusinessSmileScene,
  DontSmileScene,
];

function PhaserGame({ playerName }: PhaserGameProps) {
  const gameRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!gameRef.current) {
      return undefined;
    }

    const game = new Phaser.Game({
      type: Phaser.AUTO,
      width: GAME_WIDTH,
      height: GAME_HEIGHT,
      parent: gameRef.current,
      backgroundColor: '#08111f',
      pixelArt: true,
      antialias: false,
      roundPixels: true,
      render: {
        antialias: false,
        pixelArt: true,
        roundPixels: true,
      },
      dom: {
        createContainer: true,
      },
      scene: scenes,
    });

    return () => {
      game.destroy(true);
    };
  }, [playerName]);

  return (
    <div className="phaser-frame">
      <div className="phaser-banner">
        <span>{playerName}님 로그인 완료</span>
        <strong>SSAFY 미니게임 센터</strong>
      </div>
      <div ref={gameRef} className="phaser-root" />
    </div>
  );
}

export default PhaserGame;
