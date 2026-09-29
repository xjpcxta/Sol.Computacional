# Catalog and Estimates Implementation Plan

> **For agentic workers:** Execute this plan in the current PriceFunc workspace. Keep the existing graphite/mineral visual system and do not fabricate historical estimates.

**Goal:** Deliver a catalog with eight auditable archetypes and an estimation workspace that applies presets, accepts unmapped functionality, persists calculation snapshots, and exports a transparent client report.

**Architecture:** Preserve `Template` as the public catalog resource, add detailed `TemplateComponent` records, and derive each aggregate PF total from the official classic IFPUG weight matrix. Add user-owned `Estimate`, `EstimateItem`, and `EstimateItemComponent` snapshots so later catalog edits cannot rewrite historical proposals. The React estimate page loads catalog, presets, weights, and cost profile, then composes a board whose final calculation is repeated authoritatively by the API. The report is a dedicated printable HTML route; the browser print dialog supplies PDF export without a new rendering dependency.

**Tech Stack:** React 19, TypeScript, Vite, Tailwind CSS, NestJS 11, Prisma 6, SQLite, class-validator, Vitest.

## Product and calculation rules

- Use the five classic function types with Portuguese aliases: ALI/ILF, AIE/EIF, EE/EI, SE/EO, and CE/EQ.
- Use these low/medium/high weights: ALI `7/10/15`, AIE `5/7/10`, EE `3/4/6`, SE `4/5/7`, CE `3/4/6`.
- Require every catalog or custom component to have a name, a detailed description of at least 30 characters, a function type, a complexity, and a positive quantity.
- Treat the result as an estimate aligned with APF/IFPUG categories, not as a certified function-point count. The report must state that boundary, DET/FTR/RET interpretation, and review by a qualified counter remain project decisions.
- Calculate `totalPf`, then `estimatedHours = totalPf * hoursPerPf`, `baseCost = estimatedHours * hourlyRate`, `riskAmount = baseCost * riskMargin / 100`, and `totalPrice = baseCost + riskAmount`.
- Save the cost-profile values and every component description, complexity, unit weight, and quantity on the estimate snapshot.
- Keep estimates private to their authenticated creator.

## Task 1: Shared contracts and calculation vocabulary

**Files:**
- Modify: `packages/shared/src/types.ts`
- Create: `apps/api/src/estimates/function-point-calculator.ts`
- Create: `apps/api/src/estimates/function-point-calculator.spec.ts`

- [ ] Add `FunctionType`, estimate status/item-kind/preset enums, template-component contracts, create-template DTO contracts, preset/configuration contracts, estimate request/detail/summary contracts, and the weight-matrix shape.
- [ ] Implement the single authoritative API weight matrix and pure helpers for unit PF, component PF, aggregate-by-type totals, and commercial totals.
- [ ] Test every matrix weight, quantity multiplication, aggregate totals, and risk calculation.

## Task 2: Persist auditable catalog and estimate snapshots

**Files:**
- Modify: `apps/api/prisma/schema.prisma`
- Create: `apps/api/prisma/migrations/20260928120000_catalog_and_estimates/migration.sql`
- Modify: `apps/api/prisma/seed.ts`

- [ ] Add a unique name to `Template`, its one-to-many `TemplateComponent` relation, and user ownership for estimates.
- [ ] Add `Estimate`, `EstimateItem`, and `EstimateItemComponent` with cascade behavior for estimate snapshots and `SetNull` for catalog references.
- [ ] Migrate existing templates safely; do not delete existing rows or reset the database.
- [ ] Seed exactly the eight current archetypes by stable name, replace their component sets transactionally, and derive the legacy aggregate fields from those components.
- [ ] Give every seeded component a concrete Portuguese description of the counted user-recognizable function.

## Task 3: Catalog API

**Files:**
- Create: `apps/api/src/templates/dto/create-template.dto.ts`
- Modify: `apps/api/src/templates/templates.service.ts`
- Modify: `apps/api/src/templates/templates.controller.ts`

- [ ] Return components ordered by creation and totals calculated from persisted component weights.
- [ ] Add authenticated `POST /api/templates`; validate nested components, reject duplicate names, calculate all weights server-side, and create the template plus components in one transaction.
- [ ] Keep `GET /api/templates` and `GET /api/templates/:id` response-compatible with the dashboard.
- [ ] Add service tests covering creation, derived totals, duplicate-name conflict, and missing-template behavior.

## Task 4: Estimates API and presets

**Files:**
- Create: `apps/api/src/estimates/dto/create-estimate.dto.ts`
- Create: `apps/api/src/estimates/dto/list-estimates.dto.ts`
- Create: `apps/api/src/estimates/dto/update-estimate-status.dto.ts`
- Create: `apps/api/src/estimates/estimate-presets.ts`
- Create: `apps/api/src/estimates/estimates.service.ts`
- Create: `apps/api/src/estimates/estimates.controller.ts`
- Create: `apps/api/src/estimates/estimates.module.ts`
- Create: `apps/api/src/estimates/estimates.service.spec.ts`
- Modify: `apps/api/src/app.module.ts`

- [ ] Define presets for Software completo, MVP, Software de vendas, and Integração com legado using the stable names of the eight seeded archetypes.
- [ ] Add `GET /api/estimates/configuration` returning resolved presets and the authoritative weight matrix.
- [ ] Add `POST /api/estimates`; resolve archetype records, validate custom items, snapshot components, calculate totals from the authenticated user's cost profile, and optionally mark the estimate sent.
- [ ] Add user-scoped `GET /api/estimates`, `GET /api/estimates/:id`, and `PATCH /api/estimates/:id/status` endpoints.
- [ ] Test preset resolution, archetype/custom snapshotting, commercial totals, user scoping, and sent timestamps.

## Task 5: Catalog interface

**Files:**
- Create: `apps/web/src/pages/CatalogPage.tsx`
- Create: `apps/web/src/components/catalog/ArchetypeForm.tsx`
- Create: `apps/web/src/components/catalog/ArchetypeCard.tsx`
- Modify: `apps/web/src/App.tsx`
- Modify: `apps/web/src/components/layout/AppShell.tsx`

- [ ] Add the protected `/catalog` route and enable its sidebar entry.
- [ ] Render loading, error-with-retry, empty, and populated states; show the live record count and expandable component details.
- [ ] Build a keyboard-accessible creation form with repeatable component rows, inline validation, disabled/submitting states, API error feedback, and success confirmation.
- [ ] Append a successful create response locally so the visible count updates immediately; the dashboard will read the same API count on its next load.

## Task 6: Estimation board

**Files:**
- Create: `apps/web/src/lib/estimateMath.ts`
- Create: `apps/web/src/lib/estimateMath.test.ts`
- Create: `apps/web/src/pages/EstimatesPage.tsx`
- Create: `apps/web/src/components/estimates/CustomFunctionForm.tsx`
- Create: `apps/web/src/components/estimates/EstimateBoard.tsx`
- Modify: `apps/web/src/App.tsx`
- Modify: `apps/web/src/components/layout/AppShell.tsx`

- [ ] Add the protected `/estimates` route and enable its sidebar entry.
- [ ] Load templates, cost profile, and estimate configuration with explicit loading, retry, and partial-data safety states.
- [ ] Render the four presets as single-choice accelerators; applying a preset replaces the archetype portion of the board only after an explicit confirmation if the current board is non-empty.
- [ ] Let users add catalog archetypes, change item quantities, remove items, and add repeatable custom functions with detailed descriptions and IFPUG type/complexity.
- [ ] Show a responsive “lousa” with selected items, component-level PF detail, live PF/hours/base/risk/final totals, an empty state, and accessible focus/selected/disabled states.
- [ ] Capture title, client, scope/application boundary, and project-specific calculation notes; submit as draft or sent and navigate to the saved report.
- [ ] Test the client preview math and preset/item transformations as pure functions.

## Task 7: Report and dashboard integration

**Files:**
- Create: `apps/web/src/pages/EstimateReportPage.tsx`
- Modify: `apps/web/src/pages/DashboardPage.tsx`
- Modify: `apps/web/src/components/dashboard/LatestBudgets.tsx`
- Modify: `apps/web/src/styles/globals.css`

- [ ] Add the protected `/estimates/:id/report` route with loading, forbidden/not-found/error, and populated states.
- [ ] Render client/project metadata, scope boundary, selected archetypes and custom functions, component calculation table, cost-profile snapshot, formulas, methodology notes, and the APF/IFPUG qualification notice.
- [ ] Add “Imprimir ou salvar em PDF” using `window.print()` and print CSS that hides application navigation and produces a white, legible document.
- [ ] Load the three latest sent estimates on the dashboard and map their persisted totals/dates into `LatestBudgets`; preserve an honest empty/error state.

## Task 8: Verification and state coverage

**Files:**
- Create: `reports/catalog-estimates-state-matrix.md`
- Create: `reports/catalog-estimates-implementation-report.md`
- Modify only defects found in files above.

- [ ] Generate Prisma Client, deploy the non-destructive migration, and run the idempotent seed.
- [ ] Run `npm test`, `npm run lint`, and `npm run build` from the workspace root.
- [ ] Run the webapp state-coverage checker against the catalog, estimate, board, and report files; record any manual exceptions caused by unavailable skill references.
- [ ] Start the API and web app only for browser QA, validate desktop and narrow widths for catalog creation, preset composition, custom-function composition, sent report, dashboard count/history, and print preview, then stop both servers.

## Self-review

- Scope coverage: catalog records, mandatory detailed components, eight seeds, live dashboard count, presets, custom functions, lousa behavior, persistence, transparent calculations, report export, and dashboard sent-history are each mapped to an implementation task.
- Contract consistency: template aggregate fields remain available; every new producer and consumer uses the shared request/response names defined in Task 1.
- Data integrity: server-side calculation, authenticated ownership, transactions, and immutable estimate snapshots prevent client tampering and historical drift.
- UX states: loading, empty, error, retry, hover, focus, selected, disabled, submitting, success, and print states are explicitly covered.
- Placeholder scan: this plan contains no deferred placeholder route, fake customer record, or unresolved `TBD`.
