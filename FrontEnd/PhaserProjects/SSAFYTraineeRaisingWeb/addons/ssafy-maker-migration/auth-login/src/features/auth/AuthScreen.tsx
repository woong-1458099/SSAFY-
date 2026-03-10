import AuthCard from './AuthCard';
import type { AuthView } from './authConfig';

interface AuthScreenProps {
  authView: AuthView;
  suggestedLoginId: string;
  onLogin: (loginId: string) => void;
  onSignupSuccess: (loginId: string) => void;
  onViewChange: (view: AuthView) => void;
}

function AuthScreen({ authView, suggestedLoginId, onLogin, onSignupSuccess, onViewChange }: AuthScreenProps) {
  return (
    <main className="landing-shell">
      <section className="promo-panel">
        <p className="eyebrow">SSAFY Maker</p>
        <h1>게임 시작 전, 계정을 먼저 연결하세요.</h1>
        <p className="promo-text">
          이 화면은 게임 진입 전 인증 전용 영역입니다. 로그인은 접속 권한을 확인하는 역할만 담당하고, 게임 렌더링과는 분리되어
          동작합니다.
        </p>
        <div className="promo-grid">
          <article>
            <span>01</span>
            <strong>권한 확인</strong>
            <p>아이디와 비밀번호로 접속 권한 인증</p>
          </article>
          <article>
            <span>02</span>
            <strong>OAuth2</strong>
            <p>카카오와 Steam 인증 진입 버튼 제공</p>
          </article>
          <article>
            <span>03</span>
            <strong>계정 복구</strong>
            <p>회원가입과 계정 복구 플로우 분리 구현</p>
          </article>
        </div>
      </section>

      <AuthCard
        authView={authView}
        suggestedLoginId={suggestedLoginId}
        onLogin={onLogin}
        onSignupSuccess={onSignupSuccess}
        onViewChange={onViewChange}
      />
    </main>
  );
}

export default AuthScreen;
