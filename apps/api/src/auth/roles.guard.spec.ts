import type { ExecutionContext } from '@nestjs/common';
import type { Reflector } from '@nestjs/core';
import { describe, expect, it, vi } from 'vitest';
import { RolesGuard } from './roles.guard';

function contextFor(role: string): ExecutionContext {
  return {
    getHandler: vi.fn(),
    getClass: vi.fn(),
    switchToHttp: () => ({
      getRequest: () => ({ user: { role } }),
    }),
  } as unknown as ExecutionContext;
}

describe('RolesGuard', () => {
  it('rejects a regular user from administrator-only routes', () => {
    const reflector = {
      getAllAndOverride: vi.fn().mockReturnValue(['admin', 'super_admin']),
    };
    const guard = new RolesGuard(reflector as unknown as Reflector);

    expect(guard.canActivate(contextFor('user'))).toBe(false);
  });

  it('allows both administrator roles', () => {
    const reflector = {
      getAllAndOverride: vi.fn().mockReturnValue(['admin', 'super_admin']),
    };
    const guard = new RolesGuard(reflector as unknown as Reflector);

    expect(guard.canActivate(contextFor('admin'))).toBe(true);
    expect(guard.canActivate(contextFor('super_admin'))).toBe(true);
  });
});
