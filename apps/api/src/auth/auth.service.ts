import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import type { User } from '@prisma/client';

type SafeUser = Omit<User, 'password'>;

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService
  ) {}

  private withoutPassword(user: User): SafeUser {
    const { password: _password, ...safeUser } = user;
    return safeUser;
  }

  async validateUser(username: string, pass: string): Promise<SafeUser | null> {
    const user = await this.usersService.findByUsername(username);
    if (user && await bcrypt.compare(pass, user.password)) {
      return this.withoutPassword(user);
    }
    return null;
  }

  async login(username: string, pass: string) {
    const user = await this.validateUser(username, pass);
    if (!user) {
      throw new UnauthorizedException('Usuário ou senha inválidos.');
    }
    const payload = { username: user.username, sub: user.id, role: user.role };
    return {
      accessToken: this.jwtService.sign(payload),
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    };
  }

  async getProfile(userId: string): Promise<SafeUser> {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new UnauthorizedException('Authenticated user no longer exists');
    }

    return this.withoutPassword(user);
  }
}
