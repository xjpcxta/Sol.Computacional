import { resolve } from 'path';

export interface AdminSeedConfig {
  username: string;
  password: string;
  email: string;
}

export const rootEnvPath = resolve(__dirname, '../../../..', '.env');

const requiredRuntimeVariables = ['DATABASE_URL', 'JWT_SECRET'] as const;
const MINIMUM_JWT_SECRET_LENGTH = 32;
const MINIMUM_ADMIN_PASSWORD_LENGTH = 12;

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

  const databaseUrl = requireEnvironmentValue(environment.DATABASE_URL, 'DATABASE_URL');
  if (!/^postgres(?:ql)?:\/\//.test(databaseUrl)) {
    throw new Error('DATABASE_URL must be a PostgreSQL connection string');
  }

  const jwtSecret = requireEnvironmentValue(environment.JWT_SECRET, 'JWT_SECRET', false);
  if (jwtSecret.length < MINIMUM_JWT_SECRET_LENGTH) {
    throw new Error(`JWT_SECRET must have at least ${MINIMUM_JWT_SECRET_LENGTH} characters`);
  }

  getCorsOrigins(environment as NodeJS.ProcessEnv);

  return environment;
}

export function getAdminSeedConfig(env: NodeJS.ProcessEnv): AdminSeedConfig {
  const password = requireEnvironmentValue(env.ADMIN_PASSWORD, 'ADMIN_PASSWORD', false);
  if (password.length < MINIMUM_ADMIN_PASSWORD_LENGTH) {
    throw new Error(
      `ADMIN_PASSWORD must have at least ${MINIMUM_ADMIN_PASSWORD_LENGTH} characters`,
    );
  }

  return {
    username: requireEnvironmentValue(env.ADMIN_USERNAME, 'ADMIN_USERNAME'),
    password,
    email: requireEnvironmentValue(env.ADMIN_EMAIL, 'ADMIN_EMAIL'),
  };
}

export function getCorsOrigins(environment: NodeJS.ProcessEnv): string[] {
  const configuredOrigins = environment.CORS_ORIGINS?.trim();

  if (!configuredOrigins) {
    if (environment.NODE_ENV === 'production') {
      throw new Error('Missing required environment variable: CORS_ORIGINS');
    }

    return ['http://localhost:5173'];
  }

  return configuredOrigins
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
}
