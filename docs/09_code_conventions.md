# 09 - Code Conventions

## TypeScript
- Strict mode active (`"strict": true`)
- Types inferes depuis le schema Drizzle — pas de duplication
- Path alias `@/` pour `src/`
- Utiliser `satisfies` plutot que `as` pour les assertions
- Pas de `any` — utiliser `unknown` si necessaire

## React / Next.js
- **Server Components par defaut** — ajouter `'use client'` uniquement pour l'interactivite
- **Server Actions** pour les mutations de formulaires
- **tRPC** pour le data fetching et les mutations non-formulaire
- Chaque route group a `loading.tsx` (Suspense) et `error.tsx` (Error Boundary)
- Formulaires avec **React Hook Form + Zod resolver**

## Base de donnees
- Colonnes : `snake_case`
- Tables : pluriel `snake_case`
- PK : UUID v4 partout
- Timestamps : `created_at`, `updated_at` sur toutes les tables
- Soft delete : `archived_at` (pas de DELETE physique pour assets/logs)
- Champs polymorphiques : `JSONB data`

## Migrations
- **Dev** : modifier schema → `pnpm db:generate` → `pnpm db:migrate`
- **Prod** : migrations auto au demarrage container
- **JAMAIS `db:push` en production**
- Fichiers SQL dans `src/server/db/migrations/` commites
- Dossier `migrations/meta/` aussi commite

## Composants React
- PascalCase pour les fichiers et noms
- Un composant par fichier
- Props interface dans le meme fichier
- Composants TailAdmin dans `components/ui/` — adapter, pas forker

## Nommage
- `PascalCase` : Components, Types, Interfaces
- `camelCase` : functions, variables, hooks
- `snake_case` : database columns, API params
- `SCREAMING_SNAKE` : constants

## Tests
- **Vitest** pour unit/integration
- **Playwright** pour E2E
- Fichiers de test colocalises : `ComponentName.test.tsx`
- E2E dans `e2e/` directory
- Pattern TDD : test avant composant

## Git
- **Conventional Commits** : `feat:`, `fix:`, `refactor:`, `test:`, `docs:`, `chore:`
- Un feature par commit
- Branches : `feat/nom`, `fix/nom`, `refactor/nom`
- Main branch : `main`

## i18n
- Fichiers de traduction next-intl dans `src/lib/i18n/`
- Cles de traduction en dot notation : `module.section.key`
- Francais comme langue de reference
- Toute chaine visible par l'utilisateur doit etre traduite

## Qualite
```bash
pnpm lint          # Biome lint
pnpm format        # Biome format
pnpm check         # lint + format
pnpm typecheck     # tsc --noEmit
pnpm test          # Vitest
pnpm test:e2e      # Playwright
```

## Structure des fichiers

```
src/
├── app/                    # Pages (App Router)
│   ├── (auth)/             # Routes publiques
│   ├── (dashboard)/        # Routes protegees
│   └── api/                # tRPC + Auth handlers
├── components/
│   ├── ui/                 # Design system TailAdmin
│   ├── maps/               # Composants MapLibre
│   ├── charts/             # Composants Recharts
│   ├── forms/              # Formulaires partages (observations, etc.)
│   └── {module}/           # Composants specifiques au module
├── server/
│   ├── db/
│   │   ├── schema/         # Schema Drizzle (1 fichier par table)
│   │   └── migrations/     # SQL genere
│   ├── routers/            # tRPC routers (1 par module)
│   ├── services/           # Business logic
│   ├── trpc.ts
│   └── auth.ts
├── lib/
│   ├── validators/         # Schemas Zod
│   ├── i18n/               # Traductions
│   └── utils/              # Utilitaires
├── hooks/                  # Custom React hooks
└── types/                  # Types TypeScript partages
```

## Variables d'environnement
```bash
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/senagros
NEXTAUTH_SECRET=...
NEXTAUTH_URL=http://localhost:3000
```

---

*Ce fichier definit les standards de code. Tout PR doit respecter ces conventions.*
