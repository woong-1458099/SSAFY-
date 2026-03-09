import PhaserGame from '../../PhaserGame';
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
          <p className="eyebrow">Game Lobby</p>
          <h1>{user.nickname}님, 로컬 미니게임 센터에 입장했습니다.</h1>
          <p className="support-text">
            로그인 성공 후에는 `ssafy-maker` 내부로 옮긴 Phaser 미니게임 씬들을 직접 실행합니다.
          </p>
        </div>
        <button type="button" className="secondary-button" onClick={onLogout}>
          로그아웃
        </button>
      </section>

      <section className="game-panel">
        <div className="game-copy">
          <p className="eyebrow">Live Session</p>
          <h2>로그인 이후 실제 미니게임 허브가 실행됩니다.</h2>
          <p>
            메뉴에서 퀴즈, 리듬, 정렬, 버그잡기, 러너, 에임, 타이핑 미니게임으로 이동할 수 있습니다. 인증은 여전히 별도
            화면에서 관리되고, 게임 실행은 이 영역에서만 이뤄집니다.
          </p>
        </div>
        <PhaserGame playerName={user.nickname} />
      </section>
    </main>
  );
}

export default GameScreen;
