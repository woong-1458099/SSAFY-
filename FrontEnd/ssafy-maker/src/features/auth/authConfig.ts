export const AUTH_VIEWS = {
  LOGIN: 'login',
  SIGNUP: 'signup',
  FIND_ID: 'find-id',
  FIND_PASSWORD: 'find-password',
} as const;

export type AuthView = (typeof AUTH_VIEWS)[keyof typeof AUTH_VIEWS];

export interface AuthenticatedUser {
  loginId: string;
  nickname: string;
}

export interface AuthMessage {
  type: 'info' | 'success' | 'error';
  text: string;
}

export interface LoginFormValues {
  loginId: string;
  password: string;
}

export interface SignupFormValues {
  loginId: string;
  nickname: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface FindIdFormValues {
  nickname: string;
  email: string;
}

export interface ResetFormValues {
  loginId: string;
  email: string;
}

export const OAUTH_PROVIDERS = [
  {
    name: 'Kakao',
    label: '카카오로 로그인',
    href: '/oauth2/authorization/kakao',
    className: 'oauth-button oauth-button-kakao',
  },
  {
    name: 'Steam',
    label: 'Steam으로 로그인',
    href: '/oauth2/authorization/steam',
    className: 'oauth-button oauth-button-steam',
  },
] as const;

export const initialSignupForm: SignupFormValues = {
  loginId: '',
  nickname: '',
  email: '',
  password: '',
  confirmPassword: '',
};

export const initialFindIdForm: FindIdFormValues = {
  nickname: '',
  email: '',
};

export const initialResetForm: ResetFormValues = {
  loginId: '',
  email: '',
};

export function getAuthTitle(authView: AuthView) {
  switch (authView) {
    case AUTH_VIEWS.SIGNUP:
      return '회원가입';
    case AUTH_VIEWS.FIND_ID:
      return '아이디 찾기';
    case AUTH_VIEWS.FIND_PASSWORD:
      return '비밀번호 찾기';
    case AUTH_VIEWS.LOGIN:
    default:
      return '로그인';
  }
}
