import { UnauthorizedException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import type { UsersService } from '../users/users.service';
import type { JwtService } from '@nestjs/jwt';

vi.mock('bcrypt', () => ({
  compare: vi.fn(),
}));

const comparePassword = vi.mocked(
  bcrypt.compare as (plainText: string, hash: string) => Promise<boolean>,
);

const user = {
  id: 'user-1',
  username: 'test-admin',
  email: 'admin@example.com',
  password: 'hashed-password',
  role: 'admin',
  createdAt: new Date('2026-08-31T00:00:00.000Z'),
  updatedAt: new Date('2026-08-31T00:00:00.000Z'),
};

function createService(foundUser: typeof user | null = user) {
  const usersService = {
    findByUsername: vi.fn().mockResolvedValue(foundUser),
    findById: vi.fn().mockResolvedValue(foundUser),
  };
  const jwtService = {
    sign: vi.fn().mockReturnValue('signed-token'),
  };

  const service = new AuthService(
    usersService as unknown as UsersService,
    jwtService as unknown as JwtService,
  );

  return { service, usersService, jwtService };
}

describe('AuthService', () => {
  it('returns a signed token and never exposes the password', async () => {
    comparePassword.mockResolvedValue(true);
    const { service, jwtService } = createService();

    const result = await service.login(user.username, 'submitted-password');

    expect(result.accessToken).toBe('signed-token');
    expect(result.user).not.toHaveProperty('password');
    expect(result.user).toMatchObject({
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
    });
    expect(jwtService.sign).toHaveBeenCalledWith({
      username: user.username,
      sub: user.id,
      role: user.role,
    });
  });

  it('rejects invalid credentials', async () => {
    comparePassword.mockResolvedValue(false);
    const { service } = createService();

    await expect(service.login(user.username, 'wrong-password')).rejects.toMatchObject({
      constructor: UnauthorizedException,
      message: 'Usuário ou senha inválidos.',
    });
  });

  it('returns the complete safe profile for an authenticated user', async () => {
    const { service } = createService();

    const result = await service.getProfile(user.id);

    expect(result).toEqual({
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    });
  });

  it('rejects a token whose user no longer exists', async () => {
    const { service } = createService(null);

    await expect(service.getProfile(user.id)).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
