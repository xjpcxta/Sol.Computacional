import { dirname, resolve } from 'path';
import { describe, expect, it } from 'vitest';
import {
  getAdminSeedConfig,
  getAiAssistantConfig,
  getCorsOrigins,
  rootEnvPath,
  validateRuntimeEnvironment,
} from './environment';

const validAdminEnvironment: NodeJS.ProcessEnv = {
  ADMIN_USERNAME: 'configured-admin',
  ADMIN_PASSWORD: 'configured-password',
  ADMIN_EMAIL: 'configured@example.com',
};

describe('environment configuration', () => {
  it('resolves the root .env independently of the process working directory', () => {
    expect(rootEnvPath).toBe(resolve(__dirname, '../../../..', '.env'));
    expect(dirname(rootEnvPath)).toBe(resolve(__dirname, '../../../..'));
  });

  it.each(['ADMIN_USERNAME', 'ADMIN_PASSWORD', 'ADMIN_EMAIL'] as const)(
    'rejects a missing %s for the administrator seed',
    (variableName) => {
      const environment = { ...validAdminEnvironment };
      delete environment[variableName];

      expect(() => getAdminSeedConfig(environment)).toThrow(variableName);
    },
  );

  it('rejects blank administrator values', () => {
    expect(() => getAdminSeedConfig({
      ...validAdminEnvironment,
      ADMIN_PASSWORD: '   ',
    })).toThrow('ADMIN_PASSWORD');
  });

  it('rejects an administrator password shorter than 12 characters', () => {
    expect(() => getAdminSeedConfig({
      ...validAdminEnvironment,
      ADMIN_PASSWORD: 'short-pass',
    })).toThrow('ADMIN_PASSWORD');
  });

  it('uses configured administrator values', () => {
    expect(getAdminSeedConfig(validAdminEnvironment)).toEqual({
      username: 'configured-admin',
      password: 'configured-password',
      email: 'configured@example.com',
    });
  });

  it.each(['DATABASE_URL', 'JWT_SECRET'] as const)(
    'rejects a missing runtime %s',
    (variableName) => {
      const environment: Record<string, unknown> = {
        DATABASE_URL: 'postgresql://user:password@localhost:5432/pricefunc',
        JWT_SECRET: 'a-long-random-secret-with-32-characters',
      };
      delete environment[variableName];

      expect(() => validateRuntimeEnvironment(environment)).toThrow(variableName);
    },
  );

  it('returns a valid runtime environment unchanged', () => {
    const environment = {
      DATABASE_URL: 'postgresql://user:password@localhost:5432/pricefunc',
      JWT_SECRET: 'a-long-random-secret-with-32-characters',
      PORT: '3333',
    };

    expect(validateRuntimeEnvironment(environment)).toBe(environment);
  });

  it('rejects a non-PostgreSQL database URL', () => {
    expect(() => validateRuntimeEnvironment({
      DATABASE_URL: 'file:./dev.db',
      JWT_SECRET: 'a-long-random-secret-with-32-characters',
    })).toThrow('DATABASE_URL');
  });

  it('rejects a JWT secret shorter than 32 characters', () => {
    expect(() => validateRuntimeEnvironment({
      DATABASE_URL: 'postgresql://user:password@localhost:5432/pricefunc',
      JWT_SECRET: 'short-secret',
    })).toThrow('JWT_SECRET');
  });

  it('allows the local frontend when CORS_ORIGINS is not configured', () => {
    expect(getCorsOrigins({})).toEqual(['http://localhost:5173']);
  });

  it('parses configured CORS origins and ignores blank entries', () => {
    expect(getCorsOrigins({
      CORS_ORIGINS: 'https://pricefunc.vercel.app, https://preview.vercel.app, ',
    })).toEqual([
      'https://pricefunc.vercel.app',
      'https://preview.vercel.app',
    ]);
  });

  it('requires configured CORS origins in production', () => {
    expect(() => getCorsOrigins({ NODE_ENV: 'production' })).toThrow('CORS_ORIGINS');
  });

  it('keeps the assistant disabled without provider secrets', () => {
    expect(getAiAssistantConfig({})).toEqual({
      enabled: false,
      timeoutMs: 30_000,
      maxOutputTokens: 1_200,
      maxHistoryMessages: 10,
    });
  });

  it('requires provider settings only when the assistant is enabled', () => {
    expect(() => getAiAssistantConfig({ AI_ASSISTANT_ENABLED: 'true' }))
      .toThrow('AI_API_BASE_URL');
  });

  it('normalizes an OpenAI-compatible base URL', () => {
    expect(getAiAssistantConfig({
      AI_ASSISTANT_ENABLED: 'true',
      AI_API_BASE_URL: 'https://provider.example/openai/v1/',
      AI_API_KEY: 'server-only-key',
      AI_MODEL: 'fast-model',
    })).toMatchObject({
      enabled: true,
      apiUrl: 'https://provider.example/openai/v1/chat/completions',
      model: 'fast-model',
    });
  });

  it('rejects invalid flags and insecure production provider URLs', () => {
    expect(() => getAiAssistantConfig({ AI_ASSISTANT_ENABLED: 'yes' }))
      .toThrow('AI_ASSISTANT_ENABLED');
    expect(() => getAiAssistantConfig({
      NODE_ENV: 'production',
      AI_ASSISTANT_ENABLED: 'true',
      AI_API_BASE_URL: 'http://provider.example/v1',
      AI_API_KEY: 'server-only-key',
      AI_MODEL: 'fast-model',
    })).toThrow('HTTPS');
  });
});
