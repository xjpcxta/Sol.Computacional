import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { TemplatesModule } from './templates/templates.module';
import { CostProfileModule } from './cost-profile/cost-profile.module';
import { rootEnvPath, validateRuntimeEnvironment } from './config/environment';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: rootEnvPath,
      validate: validateRuntimeEnvironment,
    }),
    PrismaModule,
    AuthModule,
    UsersModule,
    TemplatesModule,
    CostProfileModule,
  ],
})
export class AppModule {}
