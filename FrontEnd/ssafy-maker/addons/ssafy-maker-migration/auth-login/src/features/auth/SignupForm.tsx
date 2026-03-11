import type { FormEventHandler } from 'react';
import type { SignupFormValues } from './authConfig';

interface SignupFormProps {
  form: SignupFormValues;
  onChange: (field: keyof SignupFormValues, value: string) => void;
  onSubmit: FormEventHandler<HTMLFormElement>;
}

function SignupForm({ form, onChange, onSubmit }: SignupFormProps) {
  return (
    <form className="auth-form" onSubmit={onSubmit}>
      <label>
        <span>아이디</span>
        <input
          type="text"
          value={form.loginId}
          onChange={(event) => onChange('loginId', event.target.value)}
          placeholder="로그인에 사용할 아이디"
        />
      </label>
      <label>
        <span>닉네임</span>
        <input
          type="text"
          value={form.nickname}
          onChange={(event) => onChange('nickname', event.target.value)}
          placeholder="게임 내 표시 이름"
        />
      </label>
      <label>
        <span>이메일</span>
        <input
          type="email"
          value={form.email}
          onChange={(event) => onChange('email', event.target.value)}
          placeholder="player@example.com"
        />
      </label>
      <label>
        <span>비밀번호</span>
        <input
          type="password"
          value={form.password}
          onChange={(event) => onChange('password', event.target.value)}
          placeholder="8자 이상 입력"
        />
      </label>
      <label>
        <span>비밀번호 확인</span>
        <input
          type="password"
          value={form.confirmPassword}
          onChange={(event) => onChange('confirmPassword', event.target.value)}
          placeholder="비밀번호 다시 입력"
        />
      </label>
      <button type="submit" className="primary-button">
        회원가입 완료
      </button>
    </form>
  );
}

export default SignupForm;
