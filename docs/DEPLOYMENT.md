# Implantação do PriceFunc

O projeto permanece em um único monorepo. O frontend é publicado pela Vercel,
o backend pelo Render e o PostgreSQL é fornecido pelo Supabase.

## 1. Supabase — banco PostgreSQL

1. Crie um projeto vazio no Supabase.
2. Abra **Connect** e copie a URL do **Session Pooler** na porta `5432`.
3. Substitua a senha indicada na URL, codifique caracteres reservados da senha
   para URL e mantenha `sslmode=require`.
4. Use essa URL somente como `DATABASE_URL` no Render. Ela não deve ser criada
   na Vercel nem incluída no código.
5. Como todo acesso aos dados passa pela API NestJS e pelo Prisma, desabilite a
   Data API do Supabase se ela não for utilizada por outra integração.

O início do serviço executa `prisma migrate deploy` e o seed idempotente. A
migration cria ou amplia as tabelas, e o seed garante o administrador, os oito
arquétipos funcionais e o serviço consultivo de avaliação de riscos. Em cada
release, as credenciais do administrador são sincronizadas com as variáveis
`ADMIN_*`; arquétipos existentes não são sobrescritos.

> A baseline atual é destinada a um projeto Supabase vazio. O antigo arquivo
> SQLite local não é enviado nem convertido automaticamente.

## 2. Render — API NestJS

No plano gratuito, crie o backend pelo Dashboard em **New > Web Service** e
selecione o compute **Free**. O `render.yaml` permanece como referência da
configuração, mas não é necessário usar Blueprint.

Conecte o repositório e configure o serviço desta forma:

| Campo | Valor |
| --- | --- |
| Name | `pricefunc-api` ou outro nome disponível |
| Branch | `main` |
| Language | `Node` |
| Root Directory | deixar vazio, usando a raiz do monorepo |
| Compute | `Free` |
| Health Check Path | `/api/health` |

Não use `apps/api` como Root Directory: a instalação depende do workspace npm
e dos pacotes compartilhados que ficam na raiz do repositório.

Comandos para copiar nos campos **Build Command** e **Start Command**:

```text
Build: npm ci --include=dev && npm run build:api && npm prune --omit=dev
Start: npm run release:api && npm run start:api
Health: /api/health
```

Cadastre os valores destas variáveis no Render:

| Variável | Uso |
| --- | --- |
| `DATABASE_URL` | URL Session Pooler do Supabase |
| `JWT_SECRET` | Segredo longo e aleatório; o Blueprint pode gerá-lo |
| `ADMIN_USERNAME` | Usuário administrador inicial |
| `ADMIN_PASSWORD` | Senha forte do administrador inicial |
| `ADMIN_EMAIL` | E-mail do administrador inicial |
| `CORS_ORIGINS` | Origens exatas permitidas, separadas por vírgula |

O Render fornece `PORT` automaticamente. A aplicação escuta esse valor em
`0.0.0.0`. Depois do deploy, a API ficará disponível em uma URL semelhante a:

```text
https://pricefunc-api.onrender.com/api
```

Quando houver mais de uma origem autorizada, use:

```text
https://pricefunc.vercel.app,https://preview-autorizado.vercel.app
```

Não use `*` em produção porque a aplicação envia tokens JWT no cabeçalho
`Authorization`.

A etapa final do build remove ferramentas usadas apenas na compilação e nos
testes. Prisma, TypeScript e `ts-node` permanecem como dependências de runtime
porque o serviço executa migrations e o seed antes de iniciar a API.

Use no mínimo 32 caracteres aleatórios em `JWT_SECRET` e 12 caracteres em
`ADMIN_PASSWORD`. O endpoint de login aceita no máximo cinco tentativas por IP
a cada quinze minutos. O health check também consulta o PostgreSQL e só retorna
sucesso quando a API e o banco estão acessíveis.

## 3. Vercel — frontend React/Vite

Importe o mesmo repositório como um projeto separado e configure:

| Campo | Valor |
| --- | --- |
| Root Directory | `apps/web` |
| Framework Preset | Vite |
| Build Command | `npm run build` |
| Output Directory | `dist` |

Na seção de Root Directory, mantenha habilitada a inclusão de arquivos de fora
da raiz. O frontend importa tipos de `packages/shared` e essa pasta precisa
estar presente durante o build.

Cadastre na Vercel:

```text
VITE_API_URL=https://pricefunc-api.onrender.com/api
```

O valor é incorporado ao bundle durante o build. Sempre faça um novo deploy
depois de alterá-lo. Builds de produção sem `VITE_API_URL` falham de propósito,
evitando publicar um frontend que tente acessar `localhost`. O `vercel.json`
contém o fallback de SPA necessário para abrir ou atualizar diretamente rotas
como `/catalog`, `/estimates` e `/dashboard`.

## 4. Ordem recomendada

1. Criar o projeto vazio no Supabase e copiar a conexão.
2. Criar o serviço no Render e preencher todas as variáveis.
3. Confirmar `https://SEU_BACKEND.onrender.com/api/health` retornando
   `{ "status": "ok", "database": "reachable" }`.
4. Criar o projeto na Vercel e definir `VITE_API_URL` com a URL do Render.
5. Copiar a URL final da Vercel para `CORS_ORIGINS` no Render e redeployar a API.
6. Acessar o frontend e validar login, catálogo e estimativas.

## 5. Desenvolvimento local após a migração

O backend agora exige PostgreSQL. Para executar `npm run dev`, configure a
`DATABASE_URL` local com outro banco PostgreSQL ou com um projeto Supabase de
desenvolvimento. Não reutilize o banco de produção durante o desenvolvimento.

## 6. Release dos perfis comerciais e serviços por hora

A migration `20261014190000_commercial_profiles_and_services` é aditiva. O
comando de release já configurado no Render a executa antes do seed e antes da
subida da API. Ela preserva os preços de estimativas existentes e adiciona:

- perfil comercial global, inicialmente desativado;
- markup de lucro, impostos e origem do perfil usado;
- horas funcionais e horas de serviços consultivos separadas;
- atividades de serviço no catálogo e na fotografia de cada estimativa.

Não há nova variável de ambiente para a Vercel ou para o Render. O frontend
continua exigindo somente `VITE_API_URL`, e nenhuma credencial do Supabase deve
ser exposta ao Vite.

Depois do deploy, valide nesta ordem:

1. `/api/health` responde com banco acessível;
2. o login do administrador funciona com os valores atuais de `ADMIN_*`;
3. o catálogo contém `Avaliação de Riscos` com cálculo por horas;
4. um administrador consegue ativar e desativar o perfil global;
5. uma nova estimativa registra risco, lucro, impostos e a origem do perfil;
6. os dois relatórios podem ser impressos ou salvos em PDF.

Em caso de rollback, reverta apenas o código da aplicação para a versão
anterior. Não remova as colunas nem as tabelas adicionadas pela migration: os
campos possuem defaults compatíveis e sua remoção descartaria as fotografias
comerciais já salvas.
