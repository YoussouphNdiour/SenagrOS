# Phase 1 : Assets & Parcelles — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the full asset management subsystem — Zod validators, tRPC router (CRUD + pagination + archive), and App Router pages (list all, list land, detail, create) — so users can manage their farm assets (parcelles, cultures, equipment, etc.).

**Architecture:** Server Components for pages, `'use client'` only for interactive parts (DataTable, filters, modals, forms). tRPC `protectedProcedure` for all operations, Zod schemas shared between client forms and server validation. Drizzle ORM queries with existing schema.

**Tech Stack:** Next.js 16 (App Router), tRPC v11, Drizzle ORM, Zod v4, React Hook Form v7, Tailwind CSS v4, lucide-react

**Spec:** `docs/03_data_model.md` (schema), `docs/04_api_spec.md` (router contract), `docs/05_ui_spec.md` (UI patterns)

## Global Constraints

- TypeScript strict mode — no `any`, use `unknown` instead
- Path alias `@/` maps to `src/`
- Server Components by default — `'use client'` only for interactivity
- PK: UUID v4 everywhere, timestamps with timezone
- Soft delete via `archived_at` — never physical DELETE for assets
- Database columns: snake_case. JS vars: camelCase
- Conventional Commits: `feat:`, `fix:`, `refactor:`
- Existing UI components to reuse: `Button`, `Card`, `Input`, `Select`, `Modal`, `DataTable`, `KpiCard`, `Badge` (all in `src/components/ui/`)
- Session shape: `session.user.id`, `session.user.farmId`, `session.user.role`
- tRPC context provides `ctx.db` (Drizzle instance) and `ctx.session`
- Pagination pattern: `{ page?: number, limit?: number }` in, `{ items: T[], total, page, pages }` out
- Zod v4 (4.5.4) — import from `zod`, use `z.object()`, `z.string()`, etc.

---

### Task 1: Zod Validators

**Files:**
- Create: `src/lib/validators/asset.validator.ts`

**Interfaces:**
- Consumes: Nothing (first task)
- Produces: `createAssetSchema`, `updateAssetSchema`, `listAssetsSchema`, `landDataSchema`, `plantDataSchema`, `equipmentDataSchema`, `seedDataSchema`, `materialDataSchema` — all Zod schemas exported by name

- [ ] **Step 1: Create the validators directory and file**

```bash
mkdir -p src/lib/validators
```

Write `src/lib/validators/asset.validator.ts`:

```typescript
import { z } from 'zod';

// --- Asset type enum (mirrors Drizzle enum) ---

export const assetTypeValues = [
  'land', 'plant', 'animal', 'equipment', 'structure',
  'material', 'sensor', 'water', 'seed', 'product', 'compost', 'group',
] as const;

export const assetTypeSchema = z.enum(assetTypeValues);

// --- JSONB data sub-schemas per asset type ---

export const landDataSchema = z.object({
  surface_ha: z.number().positive().optional(),
  soil_type: z.string().optional(),
  irrigation_type: z.string().optional(),
  code_parcelle: z.string().optional(),
  ilot: z.string().optional(),
});

export const plantDataSchema = z.object({
  crop_type: z.string(),
  variety: z.string().optional(),
  family: z.string().optional(),
  planting_date: z.string().optional(),
  expected_harvest_date: z.string().optional(),
  row_spacing_cm: z.number().positive().optional(),
  plant_spacing_cm: z.number().positive().optional(),
  density_plants_ha: z.number().positive().optional(),
});

export const equipmentDataSchema = z.object({
  equipment_type: z.string(),
  brand: z.string().optional(),
  model: z.string().optional(),
  serial_number: z.string().optional(),
  purchase_date: z.string().optional(),
  purchase_price_xof: z.number().nonnegative().optional(),
  status_machine: z.string().optional(),
});

export const materialDataSchema = z.object({
  input_category: z.enum(['phyto', 'ferti', 'semence']),
  input_subcategory: z.string().optional(),
  commercial_name: z.string().optional(),
  active_ingredient: z.string().optional(),
  composition_npk: z.string().optional(),
  recommended_dose: z.string().optional(),
  dar_days: z.number().nonnegative().optional(),
  toxicity_class: z.string().optional(),
  form: z.string().optional(),
});

export const seedDataSchema = z.object({
  crop_type: z.string(),
  variety: z.string().optional(),
  lot_number: z.string().optional(),
  germination_rate: z.number().min(0).max(100).optional(),
  origin: z.string().optional(),
  seed_treatment: z.string().optional(),
  certification: z.string().optional(),
});

export const animalDataSchema = z.object({
  species: z.string(),
  breed: z.string().optional(),
  sex: z.enum(['male', 'female']).optional(),
  birth_date: z.string().optional(),
  tag_id: z.string().optional(),
});

// --- Create asset schema ---

export const createAssetSchema = z.object({
  type: assetTypeSchema,
  name: z.string().min(1).max(255),
  farmId: z.string().uuid(),
  parentId: z.string().uuid().optional(),
  notes: z.string().optional(),
  data: z.record(z.string(), z.unknown()).optional(),
  flags: z.array(z.string()).optional(),
  isLocation: z.boolean().optional(),
  isFixed: z.boolean().optional(),
  idTags: z.array(z.string()).optional(),
});

// --- Update asset schema ---

export const updateAssetSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(255).optional(),
  status: z.enum(['active', 'inactive', 'archived']).optional(),
  parentId: z.string().uuid().nullable().optional(),
  notes: z.string().nullable().optional(),
  data: z.record(z.string(), z.unknown()).optional(),
  flags: z.array(z.string()).optional(),
  isLocation: z.boolean().optional(),
  isFixed: z.boolean().optional(),
  idTags: z.array(z.string()).optional(),
});

// --- List assets schema (pagination + filters) ---

export const listAssetsSchema = z.object({
  farmId: z.string().uuid(),
  type: assetTypeSchema.optional(),
  status: z.enum(['active', 'inactive', 'archived']).optional(),
  search: z.string().optional(),
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(25),
});

// --- Get by ID ---

export const getAssetByIdSchema = z.object({
  id: z.string().uuid(),
});

// --- Archive / Restore ---

export const archiveAssetSchema = z.object({
  id: z.string().uuid(),
});
```

- [ ] **Step 2: Verify types compile**

Run: `pnpm typecheck`
Expected: No errors related to `asset.validator.ts`

- [ ] **Step 3: Commit**

```bash
git add src/lib/validators/asset.validator.ts
git commit -m "feat(assets): add Zod validators for asset CRUD operations"
```

---

### Task 2: tRPC Asset Router

**Files:**
- Create: `src/server/routers/asset.ts`
- Modify: `src/server/routers/_app.ts`

**Interfaces:**
- Consumes: `createAssetSchema`, `updateAssetSchema`, `listAssetsSchema`, `getAssetByIdSchema`, `archiveAssetSchema` from Task 1
- Produces: tRPC router with procedures `asset.list`, `asset.getById`, `asset.create`, `asset.update`, `asset.archive`, `asset.restore` — available via `trpc.asset.*` on the client

- [ ] **Step 1: Create the asset router file**

Write `src/server/routers/asset.ts`:

```typescript
import { TRPCError } from '@trpc/server';
import { and, eq, ilike, isNull, sql, desc } from 'drizzle-orm';
import { protectedProcedure, router } from '../trpc';
import { assets } from '../db/schema';
import {
  createAssetSchema,
  updateAssetSchema,
  listAssetsSchema,
  getAssetByIdSchema,
  archiveAssetSchema,
} from '@/lib/validators/asset.validator';

export const assetRouter = router({
  list: protectedProcedure
    .input(listAssetsSchema)
    .query(async ({ ctx, input }) => {
      const { farmId, type, status, search, page, limit } = input;
      const offset = (page - 1) * limit;

      const conditions = [
        eq(assets.farmId, farmId),
        isNull(assets.archivedAt),
      ];

      if (type) {
        conditions.push(eq(assets.type, type));
      }

      if (status) {
        conditions.push(eq(assets.status, status));
      }

      if (search) {
        conditions.push(ilike(assets.name, `%${search}%`));
      }

      const where = and(...conditions);

      const [items, countResult] = await Promise.all([
        ctx.db
          .select()
          .from(assets)
          .where(where)
          .orderBy(desc(assets.createdAt))
          .limit(limit)
          .offset(offset),
        ctx.db
          .select({ count: sql<number>`count(*)::int` })
          .from(assets)
          .where(where),
      ]);

      const total = countResult[0]?.count ?? 0;

      return {
        items,
        total,
        page,
        pages: Math.ceil(total / limit),
      };
    }),

  getById: protectedProcedure
    .input(getAssetByIdSchema)
    .query(async ({ ctx, input }) => {
      const [asset] = await ctx.db
        .select()
        .from(assets)
        .where(eq(assets.id, input.id))
        .limit(1);

      if (!asset) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Asset not found' });
      }

      // Fetch children
      const children = await ctx.db
        .select()
        .from(assets)
        .where(and(eq(assets.parentId, input.id), isNull(assets.archivedAt)));

      return { ...asset, children };
    }),

  create: protectedProcedure
    .input(createAssetSchema)
    .mutation(async ({ ctx, input }) => {
      const [created] = await ctx.db
        .insert(assets)
        .values({
          type: input.type,
          name: input.name,
          farmId: input.farmId,
          parentId: input.parentId,
          notes: input.notes,
          data: input.data ?? {},
          flags: input.flags ?? [],
          isLocation: input.isLocation ?? false,
          isFixed: input.isFixed ?? false,
          idTags: input.idTags ?? [],
        })
        .returning();

      return created;
    }),

  update: protectedProcedure
    .input(updateAssetSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;

      const [updated] = await ctx.db
        .update(assets)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(assets.id, id))
        .returning();

      if (!updated) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Asset not found' });
      }

      return updated;
    }),

  archive: protectedProcedure
    .input(archiveAssetSchema)
    .mutation(async ({ ctx, input }) => {
      const [archived] = await ctx.db
        .update(assets)
        .set({ archivedAt: new Date(), updatedAt: new Date() })
        .where(eq(assets.id, input.id))
        .returning();

      if (!archived) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Asset not found' });
      }

      return archived;
    }),

  restore: protectedProcedure
    .input(archiveAssetSchema)
    .mutation(async ({ ctx, input }) => {
      const [restored] = await ctx.db
        .update(assets)
        .set({ archivedAt: null, updatedAt: new Date() })
        .where(eq(assets.id, input.id))
        .returning();

      if (!restored) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Asset not found' });
      }

      return restored;
    }),
});
```

- [ ] **Step 2: Wire the router into `_app.ts`**

Modify `src/server/routers/_app.ts`:

```typescript
import { router, publicProcedure } from '../trpc';
import { assetRouter } from './asset';

export const appRouter = router({
  health: publicProcedure.query(() => ({ status: 'ok' })),
  asset: assetRouter,
});

export type AppRouter = typeof appRouter;
```

- [ ] **Step 3: Verify types compile**

Run: `pnpm typecheck`
Expected: No errors

- [ ] **Step 4: Commit**

```bash
git add src/server/routers/asset.ts src/server/routers/_app.ts
git commit -m "feat(assets): add tRPC asset router with CRUD + pagination + archive"
```

---

### Task 3: Assets List Page (all types)

**Files:**
- Create: `src/app/(dashboard)/assets/page.tsx`
- Create: `src/app/(dashboard)/assets/loading.tsx`
- Create: `src/app/(dashboard)/assets/error.tsx`
- Create: `src/components/assets/AssetListClient.tsx`

**Interfaces:**
- Consumes: `trpc.asset.list` and `trpc.asset.archive` from Task 2. UI components `DataTable`, `Badge`, `Button`, `Input`, `Select`, `Card`, `Modal` from `src/components/ui/`
- Produces: `/assets` page rendering a filterable, paginated list of assets. `AssetListClient` component reusable for type-specific pages.

- [ ] **Step 1: Create loading and error boundary files**

Write `src/app/(dashboard)/assets/loading.tsx`:

```typescript
export default function Loading() {
  return (
    <div className="flex h-64 items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-green-200 border-t-green-600" />
    </div>
  );
}
```

Write `src/app/(dashboard)/assets/error.tsx`:

```typescript
'use client';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex h-64 flex-col items-center justify-center gap-4">
      <p className="text-red-600">Une erreur est survenue</p>
      <button
        onClick={reset}
        className="rounded-lg bg-green-600 px-4 py-2 text-sm text-white hover:bg-green-700"
      >
        Reessayer
      </button>
    </div>
  );
}
```

- [ ] **Step 2: Create the `AssetListClient` component**

Write `src/components/assets/AssetListClient.tsx`:

```typescript
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Search, Archive } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { DataTable } from '@/components/ui/DataTable';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';

const typeLabels: Record<string, string> = {
  land: 'Parcelle',
  plant: 'Culture',
  animal: 'Animal',
  equipment: 'Equipement',
  structure: 'Structure',
  material: 'Intrant',
  sensor: 'Capteur',
  water: 'Point d\'eau',
  seed: 'Semence',
  product: 'Produit',
  compost: 'Compost',
  group: 'Groupe',
};

const typeOptions = Object.entries(typeLabels).map(([value, label]) => ({
  value,
  label,
}));

const statusOptions = [
  { value: 'active', label: 'Actif' },
  { value: 'inactive', label: 'Inactif' },
];

const statusVariant: Record<string, 'success' | 'warning' | 'danger' | 'default'> = {
  active: 'success',
  inactive: 'warning',
  archived: 'danger',
};

interface AssetListClientProps {
  farmId: string;
  filterType?: string;
}

export function AssetListClient({ farmId, filterType }: AssetListClientProps) {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [selectedType, setSelectedType] = useState(filterType ?? '');
  const [selectedStatus, setSelectedStatus] = useState('');

  const { data, isLoading } = trpc.asset.list.useQuery({
    farmId,
    type: (selectedType || undefined) as any,
    status: (selectedStatus || undefined) as any,
    search: search || undefined,
    page,
    limit: 25,
  });

  const utils = trpc.useUtils();
  const archiveMutation = trpc.asset.archive.useMutation({
    onSuccess: () => utils.asset.list.invalidate(),
  });

  const columns = [
    {
      key: 'name',
      header: 'Nom',
      render: (row: any) => (
        <span className="font-medium text-gray-900">{row.name}</span>
      ),
    },
    {
      key: 'type',
      header: 'Type',
      render: (row: any) => (
        <Badge variant="info">{typeLabels[row.type] ?? row.type}</Badge>
      ),
    },
    {
      key: 'status',
      header: 'Statut',
      render: (row: any) => (
        <Badge variant={statusVariant[row.status] ?? 'default'}>
          {row.status}
        </Badge>
      ),
    },
    {
      key: 'createdAt',
      header: 'Cree le',
      render: (row: any) =>
        row.createdAt
          ? new Date(row.createdAt).toLocaleDateString('fr-FR')
          : '—',
    },
    {
      key: 'actions',
      header: '',
      render: (row: any) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (confirm('Archiver cet asset ?')) {
              archiveMutation.mutate({ id: row.id });
            }
          }}
          className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-500"
          title="Archiver"
        >
          <Archive className="h-4 w-4" />
        </button>
      ),
      className: 'w-12',
    },
  ];

  return (
    <div className="space-y-4">
      {/* Filters row */}
      <div className="flex flex-wrap items-end gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher un asset..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full rounded-lg border border-gray-300 py-2.5 pl-10 pr-4 text-sm focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-200"
          />
        </div>

        {!filterType && (
          <Select
            options={[{ value: '', label: 'Tous les types' }, ...typeOptions]}
            value={selectedType}
            onChange={(e) => {
              setSelectedType(e.target.value);
              setPage(1);
            }}
            className="w-44"
          />
        )}

        <Select
          options={[{ value: '', label: 'Tous les statuts' }, ...statusOptions]}
          value={selectedStatus}
          onChange={(e) => {
            setSelectedStatus(e.target.value);
            setPage(1);
          }}
          className="w-40"
        />

        <Button onClick={() => router.push('/assets/new')}>
          <Plus className="h-4 w-4" />
          Nouveau
        </Button>
      </div>

      {/* Data table */}
      {isLoading ? (
        <div className="flex h-40 items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-4 border-green-200 border-t-green-600" />
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={data?.items ?? []}
          emptyMessage="Aucun asset trouve"
          onRowClick={(row: any) => router.push(`/assets/${row.id}`)}
        />
      )}

      {/* Pagination */}
      {data && data.pages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">
            {data.total} resultat{data.total > 1 ? 's' : ''} — Page {data.page}/{data.pages}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              Precedent
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= data.pages}
              onClick={() => setPage((p) => p + 1)}
            >
              Suivant
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Create the assets list page**

Write `src/app/(dashboard)/assets/page.tsx`:

```typescript
import { auth } from '@/server/auth';
import { redirect } from 'next/navigation';
import { AssetListClient } from '@/components/assets/AssetListClient';

export default async function AssetsPage() {
  const session = await auth();
  if (!session?.user?.farmId) {
    redirect('/dashboard');
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Assets</h1>
        <p className="text-sm text-gray-500">Gerez votre patrimoine agricole</p>
      </div>
      <AssetListClient farmId={session.user.farmId} />
    </div>
  );
}
```

- [ ] **Step 4: Verify types compile**

Run: `pnpm typecheck`
Expected: No errors

- [ ] **Step 5: Commit**

```bash
git add src/app/\(dashboard\)/assets/ src/components/assets/AssetListClient.tsx
git commit -m "feat(assets): add assets list page with filters, search, and pagination"
```

---

### Task 4: Land (Parcelles) List Page with KPIs

**Files:**
- Create: `src/app/(dashboard)/assets/land/page.tsx`
- Create: `src/components/assets/LandKpis.tsx`

**Interfaces:**
- Consumes: `trpc.asset.list` from Task 2, `AssetListClient` from Task 3, `KpiCard` from `src/components/ui/KpiCard.tsx`
- Produces: `/assets/land` page with 3 KPI cards (total parcelles, surface totale ha, parcelles actives) + filtered DataTable

- [ ] **Step 1: Create the `LandKpis` component**

Write `src/components/assets/LandKpis.tsx`:

```typescript
'use client';

import { MapPin, Ruler, CheckCircle } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { KpiCard } from '@/components/ui/KpiCard';

interface LandKpisProps {
  farmId: string;
}

export function LandKpis({ farmId }: LandKpisProps) {
  const { data } = trpc.asset.list.useQuery({
    farmId,
    type: 'land',
    limit: 100,
  });

  const items = data?.items ?? [];
  const total = items.length;
  const active = items.filter((a: any) => a.status === 'active').length;

  const totalSurface = items.reduce((sum: number, a: any) => {
    const d = a.data as Record<string, unknown> | null;
    const surface = d && typeof d === 'object' && 'surface_ha' in d
      ? Number(d.surface_ha) || 0
      : 0;
    return sum + surface;
  }, 0);

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <KpiCard
        title="Total parcelles"
        value={total}
        icon={MapPin}
        color="green"
      />
      <KpiCard
        title="Surface totale (ha)"
        value={totalSurface.toFixed(2)}
        icon={Ruler}
        color="blue"
      />
      <KpiCard
        title="Parcelles actives"
        value={active}
        icon={CheckCircle}
        color="orange"
      />
    </div>
  );
}
```

- [ ] **Step 2: Create the land list page**

Write `src/app/(dashboard)/assets/land/page.tsx`:

```typescript
import { auth } from '@/server/auth';
import { redirect } from 'next/navigation';
import { AssetListClient } from '@/components/assets/AssetListClient';
import { LandKpis } from '@/components/assets/LandKpis';

export default async function LandPage() {
  const session = await auth();
  if (!session?.user?.farmId) {
    redirect('/dashboard');
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Parcelles</h1>
        <p className="text-sm text-gray-500">Gerez vos parcelles et ilots</p>
      </div>
      <div className="mb-6">
        <LandKpis farmId={session.user.farmId} />
      </div>
      <AssetListClient farmId={session.user.farmId} filterType="land" />
    </div>
  );
}
```

- [ ] **Step 3: Verify types compile**

Run: `pnpm typecheck`
Expected: No errors

- [ ] **Step 4: Commit**

```bash
git add src/app/\(dashboard\)/assets/land/ src/components/assets/LandKpis.tsx
git commit -m "feat(assets): add parcelles page with KPI cards (total, surface, actives)"
```

---

### Task 5: Asset Detail Page

**Files:**
- Create: `src/app/(dashboard)/assets/[id]/page.tsx`
- Create: `src/components/assets/AssetDetailClient.tsx`

**Interfaces:**
- Consumes: `trpc.asset.getById` from Task 2. UI components `Card`, `Badge`, `Button` from `src/components/ui/`
- Produces: `/assets/[id]` page showing asset info, JSONB data fields, children list, and an edit button linking to `/assets/[id]/edit` (edit page is out of scope for this task)

- [ ] **Step 1: Create the `AssetDetailClient` component**

Write `src/components/assets/AssetDetailClient.tsx`:

```typescript
'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft, Pencil, Archive } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

const typeLabels: Record<string, string> = {
  land: 'Parcelle',
  plant: 'Culture',
  animal: 'Animal',
  equipment: 'Equipement',
  structure: 'Structure',
  material: 'Intrant',
  sensor: 'Capteur',
  water: 'Point d\'eau',
  seed: 'Semence',
  product: 'Produit',
  compost: 'Compost',
  group: 'Groupe',
};

const statusVariant: Record<string, 'success' | 'warning' | 'danger' | 'default'> = {
  active: 'success',
  inactive: 'warning',
  archived: 'danger',
};

interface AssetDetailClientProps {
  assetId: string;
}

export function AssetDetailClient({ assetId }: AssetDetailClientProps) {
  const router = useRouter();
  const { data: asset, isLoading } = trpc.asset.getById.useQuery({ id: assetId });

  const utils = trpc.useUtils();
  const archiveMutation = trpc.asset.archive.useMutation({
    onSuccess: () => router.push('/assets'),
  });

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-green-200 border-t-green-600" />
      </div>
    );
  }

  if (!asset) {
    return (
      <div className="flex h-64 items-center justify-center text-gray-500">
        Asset introuvable
      </div>
    );
  }

  const dataEntries = asset.data && typeof asset.data === 'object'
    ? Object.entries(asset.data as Record<string, unknown>).filter(
        ([, v]) => v !== null && v !== undefined && v !== ''
      )
    : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="rounded-lg p-2 text-gray-400 hover:bg-gray-100"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-gray-800">{asset.name}</h1>
              <Badge variant={statusVariant[asset.status ?? ''] ?? 'default'}>
                {asset.status}
              </Badge>
              <Badge variant="info">
                {typeLabels[asset.type] ?? asset.type}
              </Badge>
            </div>
            {asset.notes && (
              <p className="mt-1 text-sm text-gray-500">{asset.notes}</p>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => {
              if (confirm('Archiver cet asset ?')) {
                archiveMutation.mutate({ id: asset.id });
              }
            }}
          >
            <Archive className="h-4 w-4" />
            Archiver
          </Button>
        </div>
      </div>

      {/* Info cards */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Main info */}
        <Card>
          <h3 className="mb-3 text-lg font-semibold text-gray-800">Informations</h3>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-gray-500">Type</dt>
              <dd className="font-medium">{typeLabels[asset.type] ?? asset.type}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Statut</dt>
              <dd className="font-medium">{asset.status}</dd>
            </div>
            {asset.isLocation && (
              <div className="flex justify-between">
                <dt className="text-gray-500">Emplacement</dt>
                <dd className="font-medium">Oui</dd>
              </div>
            )}
            <div className="flex justify-between">
              <dt className="text-gray-500">Cree le</dt>
              <dd className="font-medium">
                {asset.createdAt
                  ? new Date(asset.createdAt).toLocaleDateString('fr-FR')
                  : '—'}
              </dd>
            </div>
          </dl>
        </Card>

        {/* JSONB data fields */}
        {dataEntries.length > 0 && (
          <Card>
            <h3 className="mb-3 text-lg font-semibold text-gray-800">Donnees specifiques</h3>
            <dl className="space-y-2 text-sm">
              {dataEntries.map(([key, value]) => (
                <div key={key} className="flex justify-between">
                  <dt className="text-gray-500">{key.replace(/_/g, ' ')}</dt>
                  <dd className="font-medium">{String(value)}</dd>
                </div>
              ))}
            </dl>
          </Card>
        )}
      </div>

      {/* Children */}
      {asset.children && asset.children.length > 0 && (
        <Card>
          <h3 className="mb-3 text-lg font-semibold text-gray-800">
            Sous-assets ({asset.children.length})
          </h3>
          <ul className="divide-y divide-gray-100">
            {asset.children.map((child: any) => (
              <li
                key={child.id}
                className="flex cursor-pointer items-center justify-between py-2 hover:bg-gray-50"
                onClick={() => router.push(`/assets/${child.id}`)}
              >
                <span className="font-medium text-gray-800">{child.name}</span>
                <Badge variant={statusVariant[child.status ?? ''] ?? 'default'}>
                  {child.status}
                </Badge>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Create the detail page**

Write `src/app/(dashboard)/assets/[id]/page.tsx`:

```typescript
import { AssetDetailClient } from '@/components/assets/AssetDetailClient';

export default async function AssetDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <AssetDetailClient assetId={id} />;
}
```

Note: Next.js 16 `params` is a Promise — must be awaited.

- [ ] **Step 3: Verify types compile**

Run: `pnpm typecheck`
Expected: No errors

- [ ] **Step 4: Commit**

```bash
git add src/app/\(dashboard\)/assets/\[id\]/ src/components/assets/AssetDetailClient.tsx
git commit -m "feat(assets): add asset detail page with info cards, data fields, and children"
```

---

### Task 6: Asset Create Page (Modal Form)

**Files:**
- Create: `src/app/(dashboard)/assets/new/page.tsx`
- Create: `src/components/assets/AssetCreateForm.tsx`

**Interfaces:**
- Consumes: `trpc.asset.create` from Task 2, `createAssetSchema` from Task 1. UI components `Input`, `Select`, `Button`, `Card` from `src/components/ui/`
- Produces: `/assets/new` page with a form to create any asset type. Redirects to `/assets/[id]` on success.

- [ ] **Step 1: Create the `AssetCreateForm` component**

Write `src/components/assets/AssetCreateForm.tsx`:

```typescript
'use client';

import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { trpc } from '@/lib/trpc';
import { createAssetSchema } from '@/lib/validators/asset.validator';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import type { z } from 'zod';

type CreateAssetInput = z.infer<typeof createAssetSchema>;

const typeOptions = [
  { value: 'land', label: 'Parcelle' },
  { value: 'plant', label: 'Culture' },
  { value: 'animal', label: 'Animal' },
  { value: 'equipment', label: 'Equipement' },
  { value: 'structure', label: 'Structure' },
  { value: 'material', label: 'Intrant' },
  { value: 'sensor', label: 'Capteur' },
  { value: 'water', label: 'Point d\'eau' },
  { value: 'seed', label: 'Semence' },
  { value: 'product', label: 'Produit' },
  { value: 'compost', label: 'Compost' },
  { value: 'group', label: 'Groupe' },
];

interface AssetCreateFormProps {
  farmId: string;
}

export function AssetCreateForm({ farmId }: AssetCreateFormProps) {
  const router = useRouter();
  const createMutation = trpc.asset.create.useMutation({
    onSuccess: (data) => {
      router.push(`/assets/${data.id}`);
    },
  });

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<CreateAssetInput>({
    resolver: zodResolver(createAssetSchema),
    defaultValues: {
      farmId,
      type: 'land',
      name: '',
      isLocation: false,
      isFixed: false,
    },
  });

  const selectedType = watch('type');

  const onSubmit = (values: CreateAssetInput) => {
    createMutation.mutate(values);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Card>
        <h3 className="mb-4 text-lg font-semibold text-gray-800">Informations generales</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <Select
            label="Type d'asset"
            options={typeOptions}
            error={errors.type?.message}
            {...register('type')}
          />
          <Input
            label="Nom"
            placeholder="Ex: Parcelle Nord A"
            error={errors.name?.message}
            {...register('name')}
          />
        </div>

        <div className="mt-4">
          <Input
            label="Notes"
            placeholder="Description ou remarques..."
            error={errors.notes?.message}
            {...register('notes')}
          />
        </div>

        <div className="mt-4 flex gap-4">
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input type="checkbox" {...register('isLocation')} className="rounded" />
            Emplacement
          </label>
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input type="checkbox" {...register('isFixed')} className="rounded" />
            Fixe
          </label>
        </div>
      </Card>

      {/* Type-specific data fields */}
      {selectedType === 'land' && (
        <Card>
          <h3 className="mb-4 text-lg font-semibold text-gray-800">Donnees parcelle</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Surface (ha)"
              type="number"
              step="0.01"
              placeholder="Ex: 2.30"
              {...register('data.surface_ha' as any)}
            />
            <Input
              label="Type de sol"
              placeholder="Ex: argileux"
              {...register('data.soil_type' as any)}
            />
            <Input
              label="Type d'irrigation"
              placeholder="Ex: goutte_a_goutte"
              {...register('data.irrigation_type' as any)}
            />
            <Input
              label="Code parcelle"
              placeholder="Ex: 2P5D2-5374"
              {...register('data.code_parcelle' as any)}
            />
            <Input
              label="Ilot"
              placeholder="Ex: DIAMA"
              {...register('data.ilot' as any)}
            />
          </div>
        </Card>
      )}

      {selectedType === 'plant' && (
        <Card>
          <h3 className="mb-4 text-lg font-semibold text-gray-800">Donnees culture</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Type de culture"
              placeholder="Ex: haricot_vert"
              {...register('data.crop_type' as any)}
            />
            <Input
              label="Variete"
              placeholder="Ex: Euforia"
              {...register('data.variety' as any)}
            />
            <Input
              label="Date de plantation"
              type="date"
              {...register('data.planting_date' as any)}
            />
            <Input
              label="Date de recolte prevue"
              type="date"
              {...register('data.expected_harvest_date' as any)}
            />
            <Input
              label="Ecart entre rangs (cm)"
              type="number"
              {...register('data.row_spacing_cm' as any)}
            />
            <Input
              label="Ecart entre plants (cm)"
              type="number"
              {...register('data.plant_spacing_cm' as any)}
            />
            <Input
              label="Densite (plants/ha)"
              type="number"
              {...register('data.density_plants_ha' as any)}
            />
          </div>
        </Card>
      )}

      {selectedType === 'equipment' && (
        <Card>
          <h3 className="mb-4 text-lg font-semibold text-gray-800">Donnees equipement</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Type d'equipement"
              placeholder="Ex: semoir"
              {...register('data.equipment_type' as any)}
            />
            <Input
              label="Marque"
              placeholder="Ex: John Deere"
              {...register('data.brand' as any)}
            />
            <Input
              label="Modele"
              placeholder="Ex: 1750"
              {...register('data.model' as any)}
            />
            <Input
              label="Numero de serie"
              {...register('data.serial_number' as any)}
            />
            <Input
              label="Date d'achat"
              type="date"
              {...register('data.purchase_date' as any)}
            />
            <Input
              label="Prix d'achat (FCFA)"
              type="number"
              {...register('data.purchase_price_xof' as any)}
            />
          </div>
        </Card>
      )}

      {/* Actions */}
      <div className="flex justify-end gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
        >
          Annuler
        </Button>
        <Button
          type="submit"
          disabled={createMutation.isPending}
        >
          {createMutation.isPending ? 'Creation...' : 'Creer l\'asset'}
        </Button>
      </div>

      {createMutation.isError && (
        <p className="text-sm text-red-500">
          Erreur: {createMutation.error.message}
        </p>
      )}
    </form>
  );
}
```

- [ ] **Step 2: Create the new asset page**

Write `src/app/(dashboard)/assets/new/page.tsx`:

```typescript
import { auth } from '@/server/auth';
import { redirect } from 'next/navigation';
import { AssetCreateForm } from '@/components/assets/AssetCreateForm';

export default async function NewAssetPage() {
  const session = await auth();
  if (!session?.user?.farmId) {
    redirect('/dashboard');
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Nouvel asset</h1>
        <p className="text-sm text-gray-500">Ajoutez un nouvel element a votre patrimoine</p>
      </div>
      <AssetCreateForm farmId={session.user.farmId} />
    </div>
  );
}
```

- [ ] **Step 3: Verify types compile**

Run: `pnpm typecheck`
Expected: No errors

- [ ] **Step 4: Commit**

```bash
git add src/app/\(dashboard\)/assets/new/ src/components/assets/AssetCreateForm.tsx
git commit -m "feat(assets): add asset creation page with type-specific form fields"
```

---

### Task 7: Sidebar Navigation + Smoke Test

**Files:**
- Modify: `src/components/layout/DashboardShell.tsx` (add Parcelles and Assets links to sidebar)

**Interfaces:**
- Consumes: Existing `DashboardShell` component, pages from Tasks 3-6
- Produces: Sidebar links to `/assets` and `/assets/land` visible in the dashboard layout

- [ ] **Step 1: Read the current DashboardShell**

Read `src/components/layout/DashboardShell.tsx` to understand the sidebar structure.

- [ ] **Step 2: Add navigation links**

Add items to the sidebar navigation array. The exact edit depends on the current file structure, but add these two entries in the "EXPLOITATION" section:

```typescript
{ href: '/assets', label: 'Assets', icon: Package },
{ href: '/assets/land', label: 'Parcelles', icon: MapPin },
```

Import `Package` and `MapPin` from `lucide-react`.

- [ ] **Step 3: Verify types compile**

Run: `pnpm typecheck`
Expected: No errors

- [ ] **Step 4: Start dev server and smoke test**

Run: `pnpm dev`

Navigate to:
1. `/assets` — should show empty list with filters and "Nouveau" button
2. `/assets/land` — should show 3 KPI cards (all zeros) + filtered list
3. `/assets/new` — should show creation form, select "Parcelle", fill fields, submit
4. After creation, redirects to `/assets/[id]` — should show detail page
5. Back to `/assets` — new asset should appear in the list
6. Click archive button — asset should disappear from list

- [ ] **Step 5: Commit**

```bash
git add src/components/layout/DashboardShell.tsx
git commit -m "feat(assets): add assets and parcelles links to sidebar navigation"
```
