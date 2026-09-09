import { resolve } from 'path';

export interface AdminSeedConfig {
  username: string;
  password: string;
  email: string;
}

export const rootEnvPath = resolve(__dirname, '../../../..', '.env');

const requiredRuntimeVariables = ['DATABASE_URL', 'JWT_SECRET'] as const;

function requireEnvironmentValue(
  value: unknown,
  variableName: string,
  trim = true,
): string {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error(`Missing required environment variable: ${variableName}`);
  }

  return trim ? value.trim() : value;
}

export function validateRuntimeEnvironment<T extends Record<string, unknown>>(
  environment: T,
): T {
  for (const variableName of requiredRuntimeVariables) {
    requireEnvironmentValue(environment[variableName], variableName);
  }

  return environment;
}

export function getAdminSeedConfig(env: NodeJS.ProcessEnv): AdminSeedConfig {
  return {
    username: requireEnvironmentValue(env.ADMIN_USERNAME, 'ADMIN_USERNAME'),
    password: requireEnvironmentValue(env.ADMIN_PASSWORD, 'ADMIN_PASSWORD', false),
    email: requireEnvironmentValue(env.ADMIN_EMAIL, 'ADMIN_EMAIL'),
  };
}
