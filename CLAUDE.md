# SenagrOS — CLAUDE.md

## Project Overview
SenagrOS (Senegal Agriculture Operating System) is an open-source FMIS (Farm Management Information System) for West African farms. It digitizes field observation forms, crop calendars, input management, and production tracking.

## Stack
- **Framework**: Next.js 15 (App Router, Server Components + Server Actions)
- **API**: tRPC v11 (type-safe end-to-end)
- **ORM**: Drizzle ORM (PostgreSQL 16 + PostGIS 3.4)
- **Auth**: Auth.js v5 (NextAuth beta) with Credentials provider
- **UI**: Tailwind CSS v4, TailAdmin-inspired green palette, lucide-react icons
- **Charts**: Recharts
- **Maps**: MapLibre GL JS
- **i18n**: next-intl (FR/EN/WO)
- **Validation**: Zod (shared client/server schemas)
- **Tests**: Vitest (unit), Playwright (E2E)
- **Lint/Format**: Biome
- **Package manager**: pnpm

## Commands
```bash
pnpm dev            # Start dev server
pnpm build          # Production build
pnpm lint           # Biome lint
pnpm format         # Biome format
pnpm check          # Biome lint + format
pnpm typecheck      # tsc --noEmit
pnpm test           # Vitest unit tests
pnpm test:e2e       # Playwright E2E tests
pnpm db:generate    # Generate Drizzle migrations
pnpm db:migrate     # Run migrations
pnpm db:seed        # Seed database
pnpm db:studio      # Drizzle Studio
```

## Code Conventions

### TypeScript
- Strict mode enabled
- Types inferred from Drizzle schema — no duplication
- Path alias `@/` → `src/`
- Use `satisfies` over `as`
- No `any` — use `unknown`

### React / Next.js
- Server Components by default — `'use client'` only for interactivity
- Server Actions for form mutations
- tRPC for data fetching and non-form mutations
- Each route group has `loading.tsx` and `error.tsx`
- Forms: React Hook Form + Zod resolver

### Database
- Tables: plural snake_case
- Columns: snake_case
- PK: UUID v4 everywhere
- Timestamps: `created_at`, `updated_at`
- Soft delete: `archived_at` (no physical DELETE for assets/logs)
- Polymorphic fields: `JSONB data`

### Naming
- `PascalCase`: Components, Types, Interfaces
- `camelCase`: functions, variables, hooks
- `snake_case`: database columns, API params
- `SCREAMING_SNAKE`: constants

### Git
- Conventional Commits: `feat:`, `fix:`, `refactor:`, `test:`, `docs:`, `chore:`
- One feature per commit
- Branches: `feat/name`, `fix/name`, `refactor/name`

### File Structure
```
src/
├── app/                    # Pages (App Router)
│   ├── (auth)/             # Public routes (login, register)
│   ├── (dashboard)/        # Protected routes
│   └── api/                # tRPC + Auth handlers
├── components/
│   ├── ui/                 # Design system (Button, Card, Input, etc.)
│   ├── layout/             # DashboardShell, Sidebar, Topbar, BottomNav
│   ├── maps/               # MapLibre components
│   ├── charts/             # Recharts components
│   └── forms/              # Shared forms
├── server/
│   ├── db/
│   │   ├── schema/         # Drizzle schema (1 file per table)
│   │   └── migrations/     # Generated SQL
│   ├── routers/            # tRPC routers
│   ├── services/           # Business logic
│   ├── trpc.ts
│   └── auth.ts
├── lib/
│   ├── validators/         # Zod schemas
│   ├── i18n/               # Translations
│   └── utils/              # Utilities
├── hooks/                  # Custom React hooks
└── types/                  # Shared TypeScript types
```

## Specs
All specifications are in `/docs/` (16 .md files). Read `01_project_overview.md` first, then the relevant module docs before coding.

## Environment
- Database: `docker compose up -d` → PostgreSQL 16 + PostGIS 3.4
- Default credentials: `postgres/postgres` on `localhost:5432/senagros`
- Auth test account: `admin@senagros.local` / `admin123` (after seed)

## Context
- Country: Senegal | Currency: XOF (FCFA) | Timezone: Africa/Dakar (UTC+0)
- Languages: French (default), English, Wolof
- Seasons: Hivernage (Jun-Oct), Contre-saison chaude (Mar-Jun), Contre-saison froide (Nov-Feb)
- Target users: farm owners, managers, agronomist technicians, workers, viewers (read-only auditors/donors)

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
