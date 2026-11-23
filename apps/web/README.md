# PriceFunc Web

Frontend em **React 19 + Vite + Tailwind CSS**. Consome a API do PriceFunc
pela URL definida em `VITE_API_URL`.

## Executar localmente

1. Na **raiz do monorepo**, instale as dependências:

   ```bash
   npm ci
   ```

2. Crie `apps/web/.env` a partir de `apps/web/.env.example`:

   ```env
   VITE_API_URL="http://localhost:3333/api"
   ```

3. Com a API rodando (veja [apps/api/README.md](../api/README.md)), suba o
   frontend a partir da raiz:

   ```bash
   npm run dev:web
   ```

4. Acesse <http://localhost:5173>.

### Comandos úteis

| Comando (na raiz) | O que faz |
| --- | --- |
| `npm test --workspace=@pricefunc/web` | Executa os testes |
| `npm run typecheck --workspace=@pricefunc/web` | Verifica os tipos |
| `npm run build --workspace=@pricefunc/web` | Gera o build de produção em `apps/web/dist` |

## Implantação

O frontend está publicado na **Vercel**, conectado à branch `main` deste
repositório. Cada push na `main` dispara um novo deploy.

| Campo | Valor |
| --- | --- |
| Root Directory | `apps/web` (com inclusão de arquivos fora da raiz habilitada) |
| Framework Preset | Vite |
| Build Command | `npm run build` |
| Output Directory | `dist` |

A única variável necessária é `VITE_API_URL`, com a URL pública da API no
Render terminando em `/api`. Ela é embutida no build, então qualquer alteração
exige um novo deploy. O `vercel.json` redireciona todas as rotas para o
`index.html`, permitindo abrir diretamente páginas como `/catalog`.

Passo a passo completo em [docs/DEPLOYMENT.md](../../docs/DEPLOYMENT.md).
