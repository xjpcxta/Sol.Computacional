import { create } from 'zustand';
import { api } from '../lib/api';
import type { User, LoginRequest, LoginResponse } from '@pricefunc/shared';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginRequest) => Promise<void>;
  logout: () => void;
  initialize: () => Promise<void>;
}

let initializationPromise: Promise<void> | null = null;

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,

  login: async (credentials: LoginRequest) => {
    const response = await api.post<LoginResponse>('/auth/login', credentials);
    const { accessToken, user } = response.data;

    localStorage.setItem('pricefunc_token', accessToken);

    set({
      user,
      token: accessToken,
      isAuthenticated: true,
      isLoading: false,
    });
  },

  logout: () => {
    localStorage.removeItem('pricefunc_token');
    set({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
    });
    window.location.href = '/login';
  },

  initialize: () => {
    if (initializationPromise) {
      return initializationPromise;
    }

    initializationPromise = (async () => {
      const token = localStorage.getItem('pricefunc_token');

      if (!token) {
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          isLoading: false,
        });
        return;
      }

      set({
        user: null,
        token,
        isAuthenticated: false,
        isLoading: true,
      });

      try {
        const response = await api.get<User>('/auth/me');
        set({
          user: response.data,
          token,
          isAuthenticated: true,
          isLoading: false,
        });
      } catch {
        localStorage.removeItem('pricefunc_token');
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          isLoading: false,
        });
      }
    })().finally(() => {
      initializationPromise = null;
    });

    return initializationPromise;
  },
}));
