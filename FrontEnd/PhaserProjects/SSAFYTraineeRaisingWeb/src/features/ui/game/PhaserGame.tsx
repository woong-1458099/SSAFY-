import { useEffect, useRef } from 'react';
import Phaser from 'phaser';
import AimScene from '@features/minigames/scenes/AimScene';
import BusinessSmileScene from '@features/minigames/scenes/BusinessSmileScene';
import BugScene from '@features/minigames/scenes/BugScene';
import DontSmileScene from '@features/minigames/scenes/DontSmileScene';
import DragScene from '@features/minigames/scenes/DragScene';
import MenuScene from '@features/minigames/scenes/MenuScene';
import MinigamePauseScene from '@features/minigames/scenes/MinigamePauseScene';
import QuizScene from '@features/minigames/scenes/QuizScene';
import RhythmScene from '@features/minigames/scenes/RhythmScene';
import RunnerScene from '@features/minigames/scenes/RunnerScene';
import TypingScene from '@features/minigames/scenes/TypingScene';

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
