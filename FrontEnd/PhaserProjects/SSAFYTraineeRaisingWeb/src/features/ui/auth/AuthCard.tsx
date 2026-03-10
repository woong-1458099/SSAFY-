import { useState, type FormEvent } from 'react';
import FindIdForm from './FindIdForm';
import FindPasswordForm from './FindPasswordForm';
import LoginForm from './LoginForm';
import SignupForm from './SignupForm';
import StatusMessage from './StatusMessage';
import {
  AUTH_VIEWS,
  getAuthTitle,
  initialFindIdForm,
  initialResetForm,
  initialSignupForm,
  type AuthMessage,
  type AuthView,
  type FindIdFormValues,
  type LoginFormValues,
  type ResetFormValues,
  type SignupFormValues,
} from './authConfig';

interface AuthCardProps {
  authView: AuthView;
  suggestedLoginId: string;
  onLogin: (loginId: string) => void;
  onSignupSuccess: (loginId: string) => void;
  onViewChange: (view: AuthView) => void;
}

const infoMessages: Record<AuthView, string> = {
  [AUTH_VIEWS.LOGIN]: '로그인은 게임 접속 권한 확인용입니다.',
  [AUTH_VIEWS.SIGNUP]: '회원가입 정보를 입력하면 로그인 화면으로 돌아옵니다.',
  [AUTH_VIEWS.FIND_ID]: '가입 시 사용한 닉네임과 이메일로 아이디를 찾습니다.',
  [AUTH_VIEWS.FIND_PASSWORD]: '아이디와 이메일을 확인한 뒤 비밀번호 재설정 안내를 보냅니다.',
};

function AuthCard({ authView, suggestedLoginId, onLogin, onSignupSuccess, onViewChange }: AuthCardProps) {
  const [loginForm, setLoginForm] = useState<LoginFormValues>({
    loginId: suggestedLoginId,
    password: '',
  });
  const [signupForm, setSignupForm] = useState<SignupFormValues>(initialSignupForm);
  const [findIdForm, setFindIdForm] = useState<FindIdFormValues>(initialFindIdForm);
  const [resetForm, setResetForm] = useState<ResetFormValues>(initialResetForm);
  const [message, setMessage] = useState<AuthMessage>({
    type: 'info',
    text: '로그인 후 게임 접속 권한을 받을 수 있습니다.',
  });

  const updateLoginField = (field: keyof LoginFormValues, value: string) => {
    setLoginForm((current) => ({ ...current, [field]: value }));
  };

  const updateSignupField = (field: keyof SignupFormValues, value: string) => {
    setSignupForm((current) => ({ ...current, [field]: value }));
  };

  const updateFindIdField = (field: keyof FindIdFormValues, value: string) => {
    setFindIdForm((current) => ({ ...current, [field]: value }));
  };

  const updateResetField = (field: keyof ResetFormValues, value: string) => {
    setResetForm((current) => ({ ...current, [field]: value }));
  };

  const handleViewChange = (view: AuthView) => {
    setMessage({
      type: 'info',
      text: infoMessages[view],
    });
    onViewChange(view);
  };

  const handleLoginSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!loginForm.loginId.trim() || !loginForm.password.trim()) {
      setMessage({
        type: 'error',
        text: '아이디와 비밀번호를 모두 입력해주세요.',
      });
      return;
    }

    onLogin(loginForm.loginId);
  };

  const handleSignupSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const emailPattern = /\S+@\S+\.\S+/;
    if (Object.values(signupForm).some((value) => !value.trim())) {
      setMessage({
        type: 'error',
        text: '회원가입 항목을 모두 입력해주세요.',
      });
      return;
    }

    if (!emailPattern.test(signupForm.email)) {
      setMessage({
        type: 'error',
        text: '유효한 이메일 주소를 입력해주세요.',
      });
      return;
    }

    if (signupForm.password.length < 8) {
      setMessage({
        type: 'error',
        text: '비밀번호는 8자 이상이어야 합니다.',
      });
      return;
    }

    if (signupForm.password !== signupForm.confirmPassword) {
      setMessage({
        type: 'error',
        text: '비밀번호 확인이 일치하지 않습니다.',
      });
      return;
    }

    setMessage({
      type: 'success',
      text: `${signupForm.loginId} 계정이 생성되었습니다. 이제 로그인할 수 있습니다.`,
    });
    setLoginForm({
      loginId: signupForm.loginId,
      password: '',
    });
    onSignupSuccess(signupForm.loginId);
    setSignupForm(initialSignupForm);
  };

  const handleFindIdSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!findIdForm.nickname.trim() || !findIdForm.email.trim()) {
      setMessage({
        type: 'error',
        text: '닉네임과 이메일을 모두 입력해주세요.',
      });
      return;
    }

    setMessage({
      type: 'success',
      text: '일치하는 계정이 있다면 등록된 이메일로 아이디 안내를 발송했습니다.',
    });
    setFindIdForm(initialFindIdForm);
  };

  const handleResetSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!resetForm.loginId.trim() || !resetForm.email.trim()) {
      setMessage({
        type: 'error',
        text: '아이디와 이메일을 모두 입력해주세요.',
      });
      return;
    }

    setMessage({
      type: 'success',
      text: '비밀번호 재설정 링크를 확인용 이메일로 발송했습니다.',
    });
    setResetForm(initialResetForm);
  };

  return (
    <section className="auth-card">
      <div className="auth-card-header">
        <p className="eyebrow">Player Access</p>
        <h2>{getAuthTitle(authView)}</h2>
      </div>

      <div className="auth-tabs" role="tablist" aria-label="인증 메뉴">
        <button
          type="button"
          className={authView === AUTH_VIEWS.LOGIN ? 'tab-button is-active' : 'tab-button'}
          onClick={() => handleViewChange(AUTH_VIEWS.LOGIN)}
        >
          로그인
        </button>
        <button
          type="button"
          className={authView === AUTH_VIEWS.SIGNUP ? 'tab-button is-active' : 'tab-button'}
          onClick={() => handleViewChange(AUTH_VIEWS.SIGNUP)}
        >
          회원가입
        </button>
        <button
          type="button"
          className={authView === AUTH_VIEWS.FIND_ID ? 'tab-button is-active' : 'tab-button'}
          onClick={() => handleViewChange(AUTH_VIEWS.FIND_ID)}
        >
          아이디 찾기
        </button>
        <button
          type="button"
          className={authView === AUTH_VIEWS.FIND_PASSWORD ? 'tab-button is-active' : 'tab-button'}
          onClick={() => handleViewChange(AUTH_VIEWS.FIND_PASSWORD)}
        >
          비밀번호 찾기
        </button>
      </div>

      <StatusMessage message={message} />

      {authView === AUTH_VIEWS.LOGIN && (
        <LoginForm
          form={loginForm}
          onChange={updateLoginField}
          onSubmit={handleLoginSubmit}
          onViewChange={handleViewChange}
        />
      )}

      {authView === AUTH_VIEWS.SIGNUP && (
        <SignupForm form={signupForm} onChange={updateSignupField} onSubmit={handleSignupSubmit} />
      )}

      {authView === AUTH_VIEWS.FIND_ID && (
        <FindIdForm form={findIdForm} onChange={updateFindIdField} onSubmit={handleFindIdSubmit} />
      )}

      {authView === AUTH_VIEWS.FIND_PASSWORD && (
        <FindPasswordForm form={resetForm} onChange={updateResetField} onSubmit={handleResetSubmit} />
      )}
    </section>
  );
}

export default AuthCard;
