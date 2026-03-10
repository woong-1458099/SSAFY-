import PhaserGame from './PhaserGame';
import type { AuthenticatedUser } from '../auth/authConfig';

interface GameScreenProps {
  user: AuthenticatedUser;
  onLogout: () => void;
}

function GameScreen({ user, onLogout }: GameScreenProps) {
  return (
    <main className="game-shell">
      <section className="game-header-card">
        <div>
          <p className="eyebrow">게임 로비</p>
          <h1>{user.nickname}님, 미니게임 센터에 입장했습니다.</h1>
          <p className="support-text">
            로그인 이후에는 `ssafy-maker` 내부에서 바로 필드 허브와 Phaser 미니게임이 실행됩니다.
          </p>
        </div>
        <button type="button" className="secondary-button" onClick={onLogout}>
          로그아웃
        </button>
      </section>

      <section className="game-panel">
        <div className="game-copy">
          <p className="eyebrow">실시간 플레이</p>
          <h2>필드에서 NPC와 상호작용해 미니게임을 시작할 수 있습니다.</h2>
          <p>
            퀴즈, 리듬, 정렬, 버그잡기, 러너, 에임, 타이핑, 비즈니스 웃음, 웃음참기까지 9종의 미니게임을 NPC
            패널에서 선택할 수 있습니다. 게임 중에는 `ESC`로 일시정지하고, `E`로 재개하거나 `ESC`로 허브로
            돌아갈 수 있습니다.
          </p>
        </div>
        <PhaserGame playerName={user.nickname} />
      </section>
    </main>
  );
}

export default GameScreen;
