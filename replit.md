# ULTRACARDIO ERP

ERP web completo (estilo Vendus/Cegid) para gestão de produtos, clientes, documentos fiscais e configurações da empresa ULTRACARDIO.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080, served at /api)
- `pnpm --filter @workspace/erp-app run dev` — run the frontend (port 23023, served at /)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string, `SESSION_SECRET`

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5 (artifact: api-server, port 8080, path: /api)
- Frontend: React + Vite (artifact: erp-app, port: 23023, path: /)
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `lib/api-spec/openapi.yaml` — OpenAPI contract (source of truth)
- `lib/api-client-react/src/generated/api.ts` — generated React Query hooks
- `lib/api-zod/src/generated/api.ts` — generated Zod schemas
- `lib/db/src/schema/` — Drizzle DB schemas (settings, products, clients, documents)
- `artifacts/api-server/src/routes/` — Express route handlers
- `artifacts/erp-app/src/pages/` — React pages
- `artifacts/erp-app/src/components/` — Layout, sidebar, topbar, UI components

## Architecture decisions

- Contract-first API: OpenAPI spec → Orval codegen → React Query hooks + Zod schemas
- All API routes at `/api/*` path prefix (handled by Express server)
- Document totals recalculated server-side via `recalcDocument()` on every item mutation
- Settings stored as single row in DB (upsert pattern); sidebar name+NIF loaded from `/api/settings`
- Dark sidebar (two-panel: icon rail #0e1520 + nav panel #131924) with white content area

## Product

- **Dashboard**: KPIs (receita, clientes, produtos, documentos), gráfico mensal, top produtos
- **Documentos**: lista com filtros tipo/estado, criação com seleção de cliente e itens, detalhe com mudança de estado (Rascunho → Emitido → Pago)
- **Produtos**: catálogo com SKU, categoria, preço, stock, IVA; CRUD completo
- **Clientes**: lista com NIF, email, telefone; CRUD completo
- **Configurações**: nome empresa, NIF, email, telefone, morada, moeda, país, taxa IVA — usados na barra lateral

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- Run `pnpm --filter @workspace/api-spec run codegen` after any OpenAPI spec changes before editing frontend hooks
- `recalcDocument(docId)` must be called after any item insert/update/delete
- Settings row is auto-created on first GET if missing
- Do NOT use `pnpm dev` at workspace root — use individual artifact workflows

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
