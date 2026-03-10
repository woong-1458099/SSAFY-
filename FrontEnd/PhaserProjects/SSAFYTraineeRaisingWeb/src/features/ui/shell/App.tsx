import { useState } from 'react';
import '../styles/App.css';
import AuthScreen from '../auth/AuthScreen';
import { AUTH_VIEWS, type AuthenticatedUser, type AuthView } from '../auth/authConfig';
import GameScreen from '../game/GameScreen';

function App() {
  const [authView, setAuthView] = useState<AuthView>(AUTH_VIEWS.LOGIN);
  const [signedInUser, setSignedInUser] = useState<AuthenticatedUser | null>(null);
  const [suggestedLoginId, setSuggestedLoginId] = useState('');

  const handleLogin = (loginId: string) => {
    const safeId = loginId.trim();

    setSignedInUser({
      loginId: safeId,
      nickname: safeId,
    });
  };

  const handleSignupSuccess = (loginId: string) => {
    setSuggestedLoginId(loginId);
    setAuthView(AUTH_VIEWS.LOGIN);
  };

  const handleLogout = () => {
    setSignedInUser(null);
    setAuthView(AUTH_VIEWS.LOGIN);
  };

  return (
    <div className="app-shell">
      {signedInUser ? (
        <GameScreen user={signedInUser} onLogout={handleLogout} />
      ) : (
        <AuthScreen
          authView={authView}
          suggestedLoginId={suggestedLoginId}
          onLogin={handleLogin}
          onSignupSuccess={handleSignupSuccess}
          onViewChange={setAuthView}
        />
      )}
    </div>
  );
}

export default App;
