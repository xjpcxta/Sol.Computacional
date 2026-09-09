import { beforeEach, describe, expect, it, vi } from 'vitest';
import { UserRole, type User } from '@pricefunc/shared';
import { api } from '../lib/api';
import { useAuthStore } from './authStore';

vi.mock('../lib/api', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

const restoredUser: User = {
  id: 'user-1',
  username: 'xjpcxta',
  email: 'xjpcxta@pricefunc.dev',
  role: UserRole.ADMIN,
  createdAt: '2026-08-31T00:00:00.000Z',
  updatedAt: '2026-08-31T00:00:00.000Z',
};

function createStorage(): Storage {
  const values = new Map<string, string>();

  return {
    getItem: vi.fn((key: string) => values.get(key) ?? null),
    setItem: vi.fn((key: string, value: string) => values.set(key, value)),
    removeItem: vi.fn((key: string) => values.delete(key)),
    clear: vi.fn(() => values.clear()),
    key: vi.fn((index: number) => Array.from(values.keys())[index] ?? null),
    get length() {
      return values.size;
    },
  };
}

describe('authStore.initialize', () => {
  let storage: Storage;

  beforeEach(() => {
    storage = createStorage();
    vi.stubGlobal('localStorage', storage);
    vi.mocked(api.get).mockReset();
    useAuthStore.setState({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: true,
    });
  });

  it('finishes unauthenticated when there is no stored token', async () => {
    await useAuthStore.getState().initialize();

    expect(useAuthStore.getState()).toMatchObject({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
    });
    expect(api.get).not.toHaveBeenCalled();
  });

  it('does not authenticate before the stored token is validated', async () => {
    storage.setItem('pricefunc_token', 'stored-token');

    let resolveRequest!: (value: { data: User }) => void;
    const request = new Promise<{ data: User }>((resolve) => {
      resolveRequest = resolve;
    });
    vi.mocked(api.get).mockReturnValue(request);

    const initialization = useAuthStore.getState().initialize();

    expect(useAuthStore.getState()).toMatchObject({
      token: 'stored-token',
      isAuthenticated: false,
      isLoading: true,
    });

    resolveRequest({ data: restoredUser });
    await initialization;

    expect(useAuthStore.getState()).toMatchObject({
      user: restoredUser,
      token: 'stored-token',
      isAuthenticated: true,
      isLoading: false,
    });
  });

  it('clears an invalid stored token', async () => {
    storage.setItem('pricefunc_token', 'invalid-token');
    vi.mocked(api.get).mockRejectedValue(new Error('Unauthorized'));

    await useAuthStore.getState().initialize();

    expect(storage.removeItem).toHaveBeenCalledWith('pricefunc_token');
    expect(useAuthStore.getState()).toMatchObject({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
    });
  });
});
