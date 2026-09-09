import { describe, expect, it } from 'vitest';
import { getLoginErrorMessage } from './authError';

describe('getLoginErrorMessage', () => {
  it('returns a safe message for invalid credentials', () => {
    expect(getLoginErrorMessage({
      isAxiosError: true,
      response: { status: 401 },
    })).toBe('Usuário ou senha inválidos.');
  });

  it('explains how to start the API when the server is unreachable', () => {
    expect(getLoginErrorMessage({
      isAxiosError: true,
      request: {},
    })).toBe(
      'Não foi possível conectar à API. Inicie o projeto com “npm run dev” e tente novamente.',
    );
  });

  it('returns a generic retry message for unexpected failures', () => {
    expect(getLoginErrorMessage(new Error('Unexpected failure'))).toBe(
      'Não foi possível realizar o login. Tente novamente.',
    );
  });
});
