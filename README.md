# PriceFunc

**Estimador de Pontos de Função para precificação de software.**

O PriceFunc ajuda software houses e consultorias a transformar o escopo de um
projeto em um orçamento rastreável. Em vez de estimar por intuição, a equipe
monta a proposta a partir de blocos funcionais já mapeados, e o sistema calcula
Pontos de Função, horas de esforço, custos, margens, impostos e o preço final,
mantendo a memória de cálculo de cada número.

---

## A ideia

Precificar software costuma ser inconsistente: duas pessoas estimam o mesmo
escopo com valores muito diferentes, as premissas se perdem e, meses depois,
ninguém sabe explicar de onde saiu o preço enviado ao cliente.

O PriceFunc parte de três princípios:

1. **Reaproveitar conhecimento.** Funcionalidades recorrentes (autenticação,
   CRUDs, integrações, dashboards, relatórios) viram **arquétipos** com
   componentes já contados, em vez de serem estimadas do zero a cada proposta.
2. **Medir antes de precificar.** O tamanho funcional é calculado com a
   Análise de Pontos de Função (APF), alinhada ao método IFPUG, e só depois
   convertido em horas e dinheiro.
3. **Rastrear tudo.** Cada estimativa guarda uma cópia fixa dos
   componentes, parâmetros comerciais e resultados. Mudanças futuras no
   catálogo ou no perfil de custo não alteram orçamentos já emitidos.

## Para quem é

- **Software houses e consultorias** que precisam padronizar propostas.
- **Engenheiros de vendas e executivos comerciais**, que precisam de rapidez
  e de um preço defensável diante do cliente.
- **Product Owners e Tech Leads**, que precisam enxergar a composição
  funcional do escopo e as premissas assumidas.

## Funcionalidades

### Catálogo de arquétipos

- Biblioteca com oito arquétipos funcionais (Landing Page, Autenticação, CRUD
  Simples, CRUD Complexo, API REST de Integração, Dashboard com Gráficos,
  Relatório PDF e Upload de Arquivos) e um serviço consultivo (Avaliação de
  Riscos).
- Cada arquétipo detalha seus componentes por tipo de função (ALI, AIE, EE, SE,
  CE), complexidade e quantidade, com a memória de cálculo visível no card.
- Cadastro de novos arquétipos por Pontos de Função ou por horas de serviço.
- Edição de arquétipos existentes, com inclusão e remoção de componentes ou
  atividades. Estimativas já salvas mantêm a versão anterior.

### Estimativas

- **Pontos de partida prontos:** Software completo, MVP, Software de vendas,
  Integração com legado, Landing page e Avaliação de riscos.
- **Lousa interativa** para combinar arquétipos, ajustar quantidades e incluir
  funcionalidades personalizadas ainda não catalogadas.
- **Cálculo ao vivo** de PF, horas, custo-base, risco, lucro, impostos e total.
- Registro de **fronteira do escopo e premissas** de cálculo.
- Estados **rascunho** e **enviado**, com histórico dos últimos orçamentos no
  dashboard.
- **Relatório auditável**, pronto para imprimir ou salvar em PDF.

### Perfis comerciais

- Perfil de custo individual: valor da hora, horas por PF, margem de risco,
  markup de lucro e alíquota de impostos.
- Perfil global definido pelo administrador; quando ativo, prevalece sobre os
  perfis individuais.
- Relatório do perfil comercial vigente.

### Assistente de IA (opcional)

- Apoio na análise de funcionalidades personalizadas, revisão da lousa e
  redação de premissas, usando qualquer provedor compatível com a API da
  OpenAI (por exemplo, Groq ou Google AI Studio).
- A chave fica apenas no backend, o histórico não é persistido e nenhuma
  sugestão altera a estimativa sem ação explícita do usuário.

### Segurança

- Autenticação com JWT e controle de acesso por papel (`admin`,
  `super_admin`).
- Limite de tentativas de login por IP e limite geral de requisições.
- Toda contagem e precificação é recalculada no servidor, que não confia
  nos totais calculados pelo navegador.

## Como o preço é calculado

```text
PF do componente   = peso(tipo, complexidade) × quantidade
Horas funcionais   = PF total × horas por PF
Horas totais       = horas funcionais + horas de serviços consultivos
Custo-base         = horas totais × valor da hora
Risco              = custo-base × margem de risco
Lucro              = (custo-base + risco) × markup de lucro
Impostos           = (custo-base + risco + lucro) × alíquota
Preço final        = custo-base + risco + lucro + impostos
```

Pesos utilizados (PF não ajustados):


| Tipo de função                    | Baixa | Média | Alta |
| ------------------------------------- | ------- | -------- | ------ |
| ALI (Arquivo Lógico Interno)      | 7     | 10     | 15   |
| AIE (Arquivo de Interface Externa) | 5     | 7      | 10   |
| EE (Entrada Externa)               | 3     | 4      | 6    |
| SE (Saída Externa)                | 4     | 5      | 7    |
| CE (Consulta Externa)              | 3     | 4      | 6    |

> A contagem é alinhada à APF do IFPUG, mas não substitui uma contagem
> certificada para fins contratuais.

## Como foi construído

O projeto é um **monorepo** gerenciado com npm workspaces e Turborepo, com
frontend e backend desacoplados e tipos compartilhados entre eles.


| Camada                                   | Tecnologias                                                       | Hospedagem |
| ------------------------------------------ | ------------------------------------------------------------------- | ------------ |
| Frontend (`apps/web`)                    | React 19, TypeScript, Vite, Tailwind CSS, Zustand, React Router   | Vercel     |
| Backend (`apps/api`)                     | NestJS 11, Prisma ORM, Passport + JWT, class-validator, Throttler | Render     |
| Banco de dados                           | PostgreSQL                                                        | Supabase   |
| Tipos compartilhados (`packages/shared`) | TypeScript                                                        | -          |
| Testes                                   | Vitest                                                            | -          |

```text
Navegador ──► Frontend React (Vercel) ──► API NestJS (Render) ──► PostgreSQL (Supabase)
                                                  │
                                                  └──► Provedor de IA (opcional)
```

O modelo de dados está documentado em [docs/DADOS.md](docs/DADOS.md).

### Estrutura do repositório

```text
.
├── apps/
│   ├── api/                # API NestJS
│   │   ├── prisma/         # Schema, migrations e seed do catálogo
│   │   └── src/            # Módulos: auth, templates, estimates,
│   │                       # cost-profile, ai-assistant, health
│   └── web/                # Aplicação React
│       └── src/            # Páginas, componentes, store e regras de cálculo
├── packages/
│   └── shared/             # Tipos e contratos usados pelo frontend e pela API
├── docs/                   # Documentação complementar
├── render.yaml             # Referência de configuração do Render
└── turbo.json              # Pipeline de build, testes e lint
```

## Como rodar localmente

### Pré-requisitos

- Node.js 22, 23 ou 24
- npm 11
- Um banco PostgreSQL de desenvolvimento (local ou um projeto Supabase
  separado, nunca o banco de produção)

### Passo a passo

1. Instale as dependências:

   ```bash
   npm ci
   ```
2. Crie o arquivo `.env` na raiz a partir do exemplo e preencha os valores:

   ```bash
   cp .env.example .env
   ```


   | Variável                                         | Descrição                                                         |
   | --------------------------------------------------- | --------------------------------------------------------------------- |
   | `DATABASE_URL`                                    | Conexão PostgreSQL                                                 |
   | `JWT_SECRET`                                      | Segredo com no mínimo 32 caracteres                                |
   | `PORT`                                            | Porta da API (padrão `3333`)                                       |
   | `CORS_ORIGINS`                                    | Origens permitidas, separadas por vírgula                          |
   | `ADMIN_USERNAME`, `ADMIN_PASSWORD`, `ADMIN_EMAIL` | Administrador criado pelo seed (senha com no mínimo 12 caracteres) |
   | `AI_*`                                            | Opcionais; configuram o assistente de IA                            |
3. Crie `apps/web/.env` a partir de `apps/web/.env.example`
   (`VITE_API_URL="http://localhost:3333/api"`).
4. Suba o ambiente completo:

   ```bash
   npm run dev
   ```

   Esse comando compila os tipos compartilhados, gera o Prisma Client, aplica
   as migrations, executa o seed e inicia API e frontend.

   - Frontend: [http://localhost:5173](http://localhost:5173)
   - API: [http://localhost:3333/api](http://localhost:3333/api) (saúde em `/api/health`)

### Outros comandos


| Comando           | O que faz                                |
| ------------------- | ------------------------------------------ |
| `npm test`        | Executa os testes de todos os workspaces |
| `npm run lint`    | Verifica tipos em todos os workspaces    |
| `npm run build`   | Gera os builds de produção             |
| `npm run dev:api` | Sobe apenas a API                        |
| `npm run dev:web` | Sobe apenas o frontend                   |

## Deploy

O frontend é publicado na Vercel, a API no Render e o banco no Supabase. O
passo a passo completo, incluindo variáveis de ambiente e ordem de publicação,
está em [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md).

## Limitações conhecidas

- A contagem segue a APF do IFPUG, mas não é uma contagem certificada.
- A exportação em PDF usa o diálogo de impressão do navegador.
- Arquétipos ainda não podem ser excluídos pela interface.
- Estimativas salvas podem mudar de status, mas não ser editadas.
