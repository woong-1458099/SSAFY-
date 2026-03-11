import type { FormEventHandler } from 'react';
import OAuthButtons from './OAuthButtons';
import { AUTH_VIEWS, type AuthView, type LoginFormValues } from './authConfig';

interface LoginFormProps {
  form: LoginFormValues;
  onChange: (field: keyof LoginFormValues, value: string) => void;
  onSubmit: FormEventHandler<HTMLFormElement>;
  onViewChange: (view: AuthView) => void;
}

function LoginForm({ form, onChange, onSubmit, onViewChange }: LoginFormProps) {
  return (
    <form className="auth-form" onSubmit={onSubmit}>
      <label>
        <span>아이디</span>
        <input
          type="text"
          value={form.loginId}
          onChange={(event) => onChange('loginId', event.target.value)}
          placeholder="player_id"
        />
      </label>
      <label>
        <span>비밀번호</span>
        <input
          type="password"
          value={form.password}
          onChange={(event) => onChange('password', event.target.value)}
          placeholder="비밀번호 입력"
        />
      </label>
      <button type="submit" className="primary-button">
        로그인
      </button>

      <OAuthButtons />

      <div className="inline-links">
        <button type="button" className="text-link" onClick={() => onViewChange(AUTH_VIEWS.SIGNUP)}>
          회원가입
        </button>
        <button type="button" className="text-link" onClick={() => onViewChange(AUTH_VIEWS.FIND_ID)}>
          아이디 찾기
        </button>
        <button type="button" className="text-link" onClick={() => onViewChange(AUTH_VIEWS.FIND_PASSWORD)}>
          비밀번호 찾기
        </button>
      </div>
    </form>
  );
}

export default LoginForm;
