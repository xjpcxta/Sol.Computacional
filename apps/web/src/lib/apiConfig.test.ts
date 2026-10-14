import { describe, expect, it } from 'vitest';
import { resolveApiBaseUrl } from './apiConfig';

describe('resolveApiBaseUrl', () => {
  it('uses the configured API URL', () => {
    expect(resolveApiBaseUrl(' https://api.example.com/api ', true))
      .toBe('https://api.example.com/api');
  });

  it('uses localhost during development', () => {
    expect(resolveApiBaseUrl(undefined, false)).toBe('http://localhost:3333/api');
  });

  it('rejects a production build without VITE_API_URL', () => {
    expect(() => resolveApiBaseUrl(undefined, true)).toThrow('VITE_API_URL');
  });
});
