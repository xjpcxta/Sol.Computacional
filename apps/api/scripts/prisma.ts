import { spawnSync } from 'child_process';
import { resolve } from 'path';
import { config } from 'dotenv';
import { rootEnvPath } from '../src/config/environment';

config({ path: rootEnvPath, override: false, quiet: true });

const prismaCliPath = require.resolve('prisma/build/index.js');
const result = spawnSync(
  process.execPath,
  [prismaCliPath, ...process.argv.slice(2)],
  {
    cwd: resolve(__dirname, '..'),
    env: process.env,
    stdio: 'inherit',
  },
);

if (result.error) {
  throw result.error;
}

process.exitCode = result.status ?? 1;
