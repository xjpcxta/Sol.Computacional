# V1 Repository Readiness Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Prepare PriceFunc for its first user-managed commit without exposing local configuration, generated data, obsolete assets, insecure credential fallbacks, or a vulnerable dependency.

**Architecture:** Repository hygiene is enforced at the root `.gitignore`, while committed `.env.example` files document the API and web configuration boundaries. Runtime and seed configuration fail closed when required values are absent, and the existing npm lockfile records the patched transitive dependency.

**Tech Stack:** Git, npm workspaces, TypeScript, NestJS ConfigModule, Prisma, Vite, Vitest.

## Global Constraints

- Do not commit, push, or change the configured Git remote; the user owns the initial v1 publication.
- Keep real `.env` files and the local Prisma database untouched and ignored.
- Keep the three workflow videos under `apps/web/public/media/` versioned because they are runtime assets.
- Keep local raw media at the repository root ignored.
- Version the `SPEC/` directory because it contains project architecture and implementation decisions.
- Use only a non-breaking `npm audit fix`; never use `--force`.

---

### Task 1: Repository hygiene and environment templates

**Files:**
- Modify: `.gitignore`
- Create: `.env.example`
- Create: `apps/web/.env.example`

**Interfaces:**
- Consumes: the current npm workspace layout, Prisma SQLite path, API port, and Vite API URL.
- Produces: safe ignore rules and copyable configuration contracts for new clones.

- [x] **Step 1: Extend environment and generated-artifact rules**

Replace the specific environment patterns with a default-deny rule and explicit example allow-list:

```gitignore
.env*
!.env.example
!**/.env.example
```

Add SQLite sidecar, cache, test report, temporary file, Windows metadata, and root raw-media rules:

```gitignore
apps/api/prisma/*.db-*
apps/api/prisma/*.sqlite
apps/api/prisma/*.sqlite-*
.cache/
.eslintcache
playwright-report/
test-results/
*.tmp
*.temp
Desktop.ini
/*.mp4
/vintage_computer_chalk_doodle.png
```

Remove `SPEC` from `.gitignore`. Keep `.agents`, `.ui-craft`, and `reports` ignored.

- [x] **Step 2: Add the root API configuration example**

Create `.env.example` with non-secret placeholders:

```dotenv
DATABASE_URL="file:./dev.db"
JWT_SECRET="replace-with-a-long-random-secret"
PORT=3333
ADMIN_USERNAME="admin"
ADMIN_PASSWORD="replace-with-a-strong-password"
ADMIN_EMAIL="admin@example.com"
```

- [x] **Step 3: Add the Vite configuration example**

Create `apps/web/.env.example`:

```dotenv
VITE_API_URL="http://localhost:3333/api"
```

- [x] **Step 4: Verify ignore behavior**

Run `git check-ignore -v --no-index` for real `.env` files, SQLite sidecars, caches, reports, root media, `SPEC/`, and both example files. Expected: sensitive/generated files are ignored; `SPEC/` and `.env.example` files are not ignored.

---

### Task 2: Fail-closed API and seed configuration

**Files:**
- Modify: `apps/api/src/config/environment.spec.ts`
- Modify: `apps/api/src/config/environment.ts`
- Modify: `apps/api/src/app.module.ts`
- Modify: `apps/api/src/auth/auth.module.ts`
- Modify: `apps/api/src/auth/jwt.strategy.ts`

**Interfaces:**
- Consumes: `DATABASE_URL`, `JWT_SECRET`, `ADMIN_USERNAME`, `ADMIN_PASSWORD`, and `ADMIN_EMAIL` from process environment variables.
- Produces: `validateRuntimeEnvironment(config: Record<string, unknown>): Record<string, unknown>` and `getAdminSeedConfig(env: NodeJS.ProcessEnv): AdminSeedConfig`.

- [x] **Step 1: Write failing validation tests**

Replace the development-default assertion with tests that require every admin seed variable, reject blank values, and verify that runtime configuration requires `DATABASE_URL` and `JWT_SECRET`.

```ts
it.each(['ADMIN_USERNAME', 'ADMIN_PASSWORD', 'ADMIN_EMAIL'] as const)(
  'rejects a missing %s for the administrator seed',
  (variableName) => {
    const env = {
      ADMIN_USERNAME: 'admin',
      ADMIN_PASSWORD: 'strong-password',
      ADMIN_EMAIL: 'admin@example.com',
    };
    delete env[variableName];

    expect(() => getAdminSeedConfig(env)).toThrow(variableName);
  },
);

expect(() => validateRuntimeEnvironment({ DATABASE_URL: 'file:./dev.db' }))
  .toThrow('JWT_SECRET');
```

- [x] **Step 2: Run the focused tests and confirm failure**

Run `npm test --workspace=@pricefunc/api -- environment.spec.ts`. Expected: failure because defaults are still accepted and `validateRuntimeEnvironment` does not exist.

- [x] **Step 3: Implement required environment helpers**

Add a helper that rejects missing or whitespace-only values. Use it in `getAdminSeedConfig` without changing a configured password, and add runtime validation for `DATABASE_URL` and `JWT_SECRET`.

```ts
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
```

- [x] **Step 4: Wire fail-closed runtime configuration**

Pass `validateRuntimeEnvironment` to `ConfigModule.forRoot`. Replace JWT fallback strings with `configService.getOrThrow<string>('JWT_SECRET')` in both JWT module registration and strategy construction.

- [x] **Step 5: Run the focused tests and typecheck**

Run `npm test --workspace=@pricefunc/api -- environment.spec.ts` and `npm run lint --workspace=@pricefunc/api`. Expected: all environment tests and TypeScript checks pass.

---

### Task 3: Patch the transitive `qs` vulnerability

**Files:**
- Modify: `package-lock.json`

**Interfaces:**
- Consumes: the existing dependency ranges through NestJS, Express, and body-parser.
- Produces: a lockfile resolving `qs` to `6.16.0` or newer within compatible ranges.

- [x] **Step 1: Apply the safe audit fix**

Run `npm audit fix` without `--force`. Expected: only `qs` changes from `6.15.3` to `6.16.0`.

- [x] **Step 2: Verify the dependency graph and audit**

Run `npm explain qs` and `npm audit --json`. Expected: `qs@6.16.0` is resolved and the audit reports zero vulnerabilities.

---

### Task 4: Pre-commit verification

**Files:**
- Verify: all source, configuration, documentation, and lockfiles listed by Git.

**Interfaces:**
- Consumes: Tasks 1–3.
- Produces: evidence that the uncommitted v1 candidate is buildable and free of known committed secrets or ignored local artifacts.

- [x] **Step 1: Run the full quality suite**

Run `npm test`, `npm run lint`, and `npm run build`. Expected: all workspace tasks pass.

- [x] **Step 2: Run the security scanner**

Run `python .agents/skills/vulnerability-scanner/scripts/security_scan.py . --scan-type secrets --output json`. Review findings against Git ignore rules and confirm remaining matches are synthetic test fixtures rather than credentials.

- [x] **Step 3: Simulate the first commit**

Run `git status --short --ignored`, `git add --dry-run -A`, and a candidate-file secret/name scan. Expected: real `.env`, database, build, cache, local raw media, `.agents`, `.ui-craft`, and reports stay excluded; source, migrations, lockfile, specs, public workflow videos, and example environments are included.

- [x] **Step 4: Leave publication to the user**

Do not create a commit or push. Report the unchanged `origin` URL so the user can confirm it before publishing v1.
