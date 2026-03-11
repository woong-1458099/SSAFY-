import type { FormEventHandler } from 'react';
import type { ResetFormValues } from './authConfig';

interface FindPasswordFormProps {
  form: ResetFormValues;
  onChange: (field: keyof ResetFormValues, value: string) => void;
  onSubmit: FormEventHandler<HTMLFormElement>;
}

function FindPasswordForm({ form, onChange, onSubmit }: FindPasswordFormProps) {
  return (
    <form className="auth-form" onSubmit={onSubmit}>
      <label>
        <span>아이디</span>
        <input
          type="text"
          value={form.loginId}
          onChange={(event) => onChange('loginId', event.target.value)}
          placeholder="비밀번호를 찾을 아이디"
        />
      </label>
      <label>
        <span>이메일</span>
        <input
          type="email"
          value={form.email}
          onChange={(event) => onChange('email', event.target.value)}
          placeholder="계정에 등록된 이메일"
        />
      </label>
      <button type="submit" className="primary-button">
        재설정 메일 보내기
      </button>
    </form>
  );
}

export default FindPasswordForm;
