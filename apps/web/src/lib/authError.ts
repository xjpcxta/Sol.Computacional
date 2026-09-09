import axios from 'axios';

const INVALID_CREDENTIALS_MESSAGE = 'Usuário ou senha inválidos.';
const API_UNAVAILABLE_MESSAGE =
  'Não foi possível conectar à API. Inicie o projeto com “npm run dev” e tente novamente.';
const GENERIC_LOGIN_MESSAGE = 'Não foi possível realizar o login. Tente novamente.';

export function getLoginErrorMessage(error: unknown): string {
  if (!axios.isAxiosError(error)) {
    return GENERIC_LOGIN_MESSAGE;
  }

  if (error.response?.status === 401) {
    return INVALID_CREDENTIALS_MESSAGE;
  }

  if (error.request && !error.response) {
    return API_UNAVAILABLE_MESSAGE;
  }

  return GENERIC_LOGIN_MESSAGE;
}
