import { dirname, resolve } from 'path';
import { describe, expect, it } from 'vitest';
import {
  getAdminSeedConfig,
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
        DATABASE_URL: 'file:./dev.db',
        JWT_SECRET: 'a-long-random-secret',
      };
      delete environment[variableName];

      expect(() => validateRuntimeEnvironment(environment)).toThrow(variableName);
    },
  );

  it('returns a valid runtime environment unchanged', () => {
    const environment = {
      DATABASE_URL: 'file:./dev.db',
      JWT_SECRET: 'a-long-random-secret',
      PORT: '3333',
    };

    expect(validateRuntimeEnvironment(environment)).toBe(environment);
  });
});
