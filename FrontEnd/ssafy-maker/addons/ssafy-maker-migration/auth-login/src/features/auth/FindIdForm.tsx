import type { FormEventHandler } from 'react';
import type { FindIdFormValues } from './authConfig';

interface FindIdFormProps {
  form: FindIdFormValues;
  onChange: (field: keyof FindIdFormValues, value: string) => void;
  onSubmit: FormEventHandler<HTMLFormElement>;
}

function FindIdForm({ form, onChange, onSubmit }: FindIdFormProps) {
  return (
    <form className="auth-form" onSubmit={onSubmit}>
      <label>
        <span>닉네임</span>
        <input
          type="text"
          value={form.nickname}
          onChange={(event) => onChange('nickname', event.target.value)}
          placeholder="가입 시 사용한 닉네임"
        />
      </label>
      <label>
        <span>이메일</span>
        <input
          type="email"
          value={form.email}
          onChange={(event) => onChange('email', event.target.value)}
          placeholder="가입 시 등록한 이메일"
        />
      </label>
      <button type="submit" className="primary-button">
        아이디 찾기
      </button>
    </form>
  );
}

export default FindIdForm;
