import { resolve } from 'path';

export interface AdminSeedConfig {
  username: string;
  password: string;
  email: string;
}

export interface AiAssistantConfig {
  enabled: boolean;
  apiUrl?: string;
  apiKey?: string;
  model?: string;
  timeoutMs: number;
  maxOutputTokens: number;
  maxHistoryMessages: number;
}

export const rootEnvPath = resolve(__dirname, '../../../..', '.env');

const requiredRuntimeVariables = ['DATABASE_URL', 'JWT_SECRET'] as const;
const MINIMUM_JWT_SECRET_LENGTH = 32;
const MINIMUM_ADMIN_PASSWORD_LENGTH = 12;
const DEFAULT_AI_TIMEOUT_MS = 30_000;
const DEFAULT_AI_MAX_OUTPUT_TOKENS = 1_200;
const DEFAULT_AI_MAX_HISTORY_MESSAGES = 10;

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
  getAiAssistantConfig(environment as NodeJS.ProcessEnv);

  return environment;
}

function parseBoundedInteger(
  rawValue: string | undefined,
  fallback: number,
  minimum: number,
  maximum: number,
  variableName: string,
): number {
  if (!rawValue?.trim()) return fallback;
  const value = Number(rawValue);
  if (!Number.isInteger(value) || value < minimum || value > maximum) {
    throw new Error(
      `${variableName} must be an integer between ${minimum} and ${maximum}`,
    );
  }
  return value;
}

function resolveChatCompletionsUrl(value: string): string {
  const url = new URL(value);
  const normalizedPath = url.pathname.replace(/\/+$/, '');
  if (!normalizedPath.endsWith('/chat/completions')) {
    url.pathname = `${normalizedPath}/chat/completions`;
  }
  return url.toString();
}

export function getAiAssistantConfig(env: NodeJS.ProcessEnv): AiAssistantConfig {
  const rawEnabled = env.AI_ASSISTANT_ENABLED?.trim().toLowerCase();
  if (rawEnabled && rawEnabled !== 'true' && rawEnabled !== 'false') {
    throw new Error('AI_ASSISTANT_ENABLED must be true or false');
  }

  const enabled = rawEnabled === 'true';
  const timeoutMs = parseBoundedInteger(
    env.AI_REQUEST_TIMEOUT_MS,
    DEFAULT_AI_TIMEOUT_MS,
    5_000,
    60_000,
    'AI_REQUEST_TIMEOUT_MS',
  );
  const maxOutputTokens = parseBoundedInteger(
    env.AI_MAX_OUTPUT_TOKENS,
    DEFAULT_AI_MAX_OUTPUT_TOKENS,
    200,
    2_000,
    'AI_MAX_OUTPUT_TOKENS',
  );

  if (!enabled) {
    return {
      enabled: false,
      timeoutMs,
      maxOutputTokens,
      maxHistoryMessages: DEFAULT_AI_MAX_HISTORY_MESSAGES,
    };
  }

  const rawApiUrl = requireEnvironmentValue(
    env.AI_API_BASE_URL ?? env.AI_API_URL,
    'AI_API_BASE_URL',
  );
  let apiUrl: URL;
  try {
    apiUrl = new URL(rawApiUrl);
  } catch {
    throw new Error('AI_API_BASE_URL must be a valid URL');
  }

  const isLocalDevelopmentUrl = env.NODE_ENV !== 'production'
    && ['localhost', '127.0.0.1'].includes(apiUrl.hostname);
  if (apiUrl.protocol !== 'https:' && !isLocalDevelopmentUrl) {
    throw new Error('AI_API_BASE_URL must use HTTPS');
  }

  return {
    enabled: true,
    apiUrl: resolveChatCompletionsUrl(rawApiUrl),
    apiKey: requireEnvironmentValue(env.AI_API_KEY, 'AI_API_KEY', false),
    model: requireEnvironmentValue(env.AI_MODEL, 'AI_MODEL'),
    timeoutMs,
    maxOutputTokens,
    maxHistoryMessages: DEFAULT_AI_MAX_HISTORY_MESSAGES,
  };
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
