# PriceFunc API

Backend em **NestJS 11 + Prisma** com banco **PostgreSQL** (Supabase). Expõe
todas as rotas sob o prefixo `/api`.

## Executar localmente

Os comandos são executados na **raiz do monorepo**, pois a API depende do
workspace npm e do pacote `packages/shared`.

1. Instale as dependências:

   ```bash
   npm ci
   ```

2. Crie o `.env` **na raiz** a partir do `.env.example`. A API lê esse arquivo
   (não existe `.env` dentro de `apps/api`). O mínimo é `DATABASE_URL`,
   `JWT_SECRET` (32+ caracteres) e as variáveis `ADMIN_*` usadas pelo seed.
   Use um banco de desenvolvimento, nunca o de produção.

3. Suba a API:

   ```bash
   npm run dev:api
   ```

   O comando compila `packages/shared`, gera o Prisma Client, aplica as
   migrations, executa o seed e inicia a API em modo watch.

4. Confira em <http://localhost:3333/api/health>.

### Comandos úteis

| Comando (na raiz) | O que faz |
| --- | --- |
| `npm test --workspace=@pricefunc/api` | Executa os testes |
| `npm run lint --workspace=@pricefunc/api` | Verifica os tipos |
| `npm run build:api` | Gera o build de produção em `apps/api/dist` |

## Implantação

A API está publicada no **Render** como Web Service Node, conectada à branch
`main` deste repositório. Cada push na `main` dispara um novo deploy.

| Campo | Valor |
| --- | --- |
| Root Directory | vazio (raiz do monorepo) |
| Build Command | `npm ci --include=dev && npm run build:api && npm prune --omit=dev` |
| Start Command | `npm run release:api && npm run start:api` |
| Health Check | `/api/health` |

O `release:api` aplica as migrations e o seed antes de iniciar o servidor. As
variáveis de ambiente (`DATABASE_URL`, `JWT_SECRET`, `ADMIN_*`,
`CORS_ORIGINS` e, opcionalmente, `AI_*`) são cadastradas no painel do Render.

Passo a passo completo em [docs/DEPLOYMENT.md](../../docs/DEPLOYMENT.md).
