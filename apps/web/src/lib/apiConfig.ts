const LOCAL_API_URL = 'http://localhost:3333/api';

export function resolveApiBaseUrl(
  configuredUrl: string | undefined,
  production: boolean,
): string {
  const apiUrl = configuredUrl?.trim();

  if (apiUrl) {
    return apiUrl;
  }

  if (production) {
    throw new Error('Missing required build environment variable: VITE_API_URL');
  }

  return LOCAL_API_URL;
}
