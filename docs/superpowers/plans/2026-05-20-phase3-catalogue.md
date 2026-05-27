# Phase 3 — Catalogue / Inventaire Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a "Catalogue" module — a unified read-only inventory view of all farm products (seeds, fertilizers, animals, equipment, plants) with stock/population levels and movement history.

**Architecture:** Two new React pages (`CatalogueIndex`, `CatalogueShow`) wired to Inertia renders in `ProductsController`. No new routes — the existing `resources :products` already maps `/backend/products` and `/backend/products/:id`. The explicit `index`/`show` actions override what `manage_restfully` generates for those two actions only; `manage_restfully` is left intact for all other HAML actions. Nav link added to `AppShell`.

**Tech Stack:** React 18, TypeScript strict, `@inertiajs/react`, Vitest + React Testing Library, Ruby on Rails 6 (Ruby 2.6). CSS: Tailwind `className` for spacing/sizing; `style={{ }}` only for `var(--color-...)` CSS custom properties — never raw hex/px/rem in style props (badge colors in a config object are the one exception, matching the existing `ReceptionsIndex` pattern).

---

## File Map

| File | Action |
|------|--------|
| `app/frontend/types/catalogue.ts` | Create — all TS types |
| `app/frontend/components/AppShell.tsx` | Modify — add Catalogue nav link + `Package` import |
| `app/frontend/pages/Backend/Catalogue/Index.test.tsx` | Create — 6 tests (TDD first) |
| `app/frontend/pages/Backend/Catalogue/Index.tsx` | Create — index page implementation |
| `app/frontend/pages/Backend/Catalogue/Show.test.tsx` | Create — 5 tests (TDD first) |
| `app/frontend/pages/Backend/Catalogue/Show.tsx` | Create — show page implementation |
| `app/controllers/backend/products_controller.rb` | Modify — add layout + index + show + produit_json |

---

## Task 1: TypeScript Types + AppShell Nav Link

**Files:**
- Create: `app/frontend/types/catalogue.ts`
- Modify: `app/frontend/components/AppShell.tsx`

- [ ] **Step 1: Create `types/catalogue.ts`**

```typescript
// app/frontend/types/catalogue.ts
export type ProduitType =
  | 'Matter'
  | 'Animal'
  | 'Equipment'
  | 'Plant'
  | 'Other'

export interface Produit {
  id: number
  name: string
  number: string
  produit_type: ProduitType
  population: number
  unit_name: string
  description: string | null
  dead_at: string | null
}

export interface ProduitMovement {
  delta: number
  population: number
  started_at: string
  description: string | null
}

export interface CatalogueIndexProps {
  produits: Produit[]
  filters: { q?: string; produit_type?: ProduitType }
  meta: { total_count: number; current_page: number; total_pages: number }
}

export interface CatalogueShowProps {
  produit: Produit
  movements: ProduitMovement[]
}
```

- [ ] **Step 2: Add `Package` to AppShell lucide import**

In `app/frontend/components/AppShell.tsx`, the current import is:
```typescript
import {
  LayoutDashboard, Wrench, Map, Sprout, BookOpen, Settings, Calendar, Users, Tractor, UserCog, PawPrint, Activity, ShoppingCart, ShoppingBag,
} from 'lucide-react'
```

Replace with:
```typescript
import {
  LayoutDashboard, Wrench, Map, Sprout, BookOpen, Settings, Calendar, Users, Tractor, UserCog, PawPrint, Activity, ShoppingCart, ShoppingBag, Package,
} from 'lucide-react'
```

- [ ] **Step 3: Add Catalogue entry to NAV_LINKS**

The current last entry in `NAV_LINKS` is:
```typescript
  { href: '/backend/animals',              label: 'Animaux',      icon: PawPrint },
```

Append after it:
```typescript
  { href: '/backend/products',             label: 'Catalogue',    icon: Package },
```

- [ ] **Step 4: Run TypeScript check**

```bash
yarn tsc --noEmit
```

Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add app/frontend/types/catalogue.ts app/frontend/components/AppShell.tsx
git commit -m "feat: add catalogue types and AppShell nav link"
```

---

## Task 2: CatalogueIndex — TDD

**Files:**
- Create: `app/frontend/pages/Backend/Catalogue/Index.test.tsx`
- Create: `app/frontend/pages/Backend/Catalogue/Index.tsx`

- [ ] **Step 1: Create the test file**

```typescript
// app/frontend/pages/Backend/Catalogue/Index.test.tsx
import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import CatalogueIndex from './Index'
import type { CatalogueIndexProps } from '../../../types/catalogue'

vi.mock('@inertiajs/react', () => ({
  router: { get: vi.fn() },
}))

const mockMeta = { total_count: 1, current_page: 1, total_pages: 1 }

const mockProduit = {
  id: 1,
  name: 'Maïs local',
  number: 'P001',
  produit_type: 'Matter' as const,
  population: 50,
  unit_name: 'kg',
  description: null,
  dead_at: null,
}

function renderIndex(overrides: Partial<CatalogueIndexProps> = {}) {
  const props: CatalogueIndexProps = {
    produits: [mockProduit],
    filters: {},
    meta: mockMeta,
    ...overrides,
  }
  return render(<CatalogueIndex {...props} />)
}

describe('CatalogueIndex', () => {
  it('renders "Catalogue" heading', () => {
    renderIndex()
    expect(screen.getByRole('heading', { name: 'Catalogue' })).toBeInTheDocument()
  })

  it('renders produit name in table', () => {
    renderIndex()
    expect(screen.getByText('Maïs local')).toBeInTheDocument()
  })

  it('renders type badge with correct label for Matter', () => {
    renderIndex()
    expect(screen.getByText('Matière')).toBeInTheDocument()
  })

  it('shows "Épuisé" badge when population = 0 and dead_at is null', () => {
    renderIndex({ produits: [{ ...mockProduit, population: 0, dead_at: null }] })
    expect(screen.getByText('Épuisé')).toBeInTheDocument()
  })

  it('shows "Inactif" badge when dead_at is set', () => {
    renderIndex({ produits: [{ ...mockProduit, dead_at: '2024-01-01' }] })
    expect(screen.getByText('Inactif')).toBeInTheDocument()
  })

  it('renders pagination info from meta.total_count', () => {
    renderIndex({ meta: { total_count: 42, current_page: 1, total_pages: 3 } })
    expect(screen.getByText(/42/)).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run tests — verify they all fail**

```bash
yarn vitest run app/frontend/pages/Backend/Catalogue/Index.test.tsx --reporter=verbose
```

Expected: 6 tests FAIL (module not found).

- [ ] **Step 3: Create `Index.tsx`**

```typescript
// app/frontend/pages/Backend/Catalogue/Index.tsx
import type { ReactNode } from 'react'
import { useState } from 'react'
import { router } from '@inertiajs/react'
import { AppShell } from '../../../components/AppShell'
import type { CatalogueIndexProps, ProduitType } from '../../../types/catalogue'

const TYPE_CONFIG: Record<ProduitType, { label: string; bg: string; color: string }> = {
  Matter:    { label: 'Matière',    bg: '#dcfce7', color: '#166534' },
  Animal:    { label: 'Animal',     bg: '#fef9c3', color: '#854d0e' },
  Equipment: { label: 'Équipement', bg: '#dbeafe', color: '#1e40af' },
  Plant:     { label: 'Plante',     bg: '#ede9fe', color: '#5b21b6' },
  Other:     { label: 'Autre',      bg: '#f3f4f6', color: '#374151' },
}

const TYPE_FILTERS: { value: ProduitType | ''; label: string }[] = [
  { value: '',          label: 'Tous' },
  { value: 'Matter',    label: 'Matière' },
  { value: 'Animal',    label: 'Animal' },
  { value: 'Equipment', label: 'Équipement' },
  { value: 'Plant',     label: 'Plante' },
  { value: 'Other',     label: 'Autre' },
]

export default function CatalogueIndex({ produits, filters, meta }: CatalogueIndexProps) {
  const [q, setQ] = useState(filters.q ?? '')
  const [typeFilter, setTypeFilter] = useState<ProduitType | ''>(filters.produit_type ?? '')

  function search() {
    router.get('/backend/products', { q, produit_type: typeFilter }, { preserveState: true })
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6" style={{ color: 'var(--color-text)' }}>
        Catalogue
      </h1>

      {/* Filter bar */}
      <div className="flex gap-3 mb-5 flex-wrap items-center">
        <input
          type="text"
          value={q}
          onChange={e => setQ(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && search()}
          placeholder="Rechercher par nom…"
          className="flex-1 min-w-52 px-3 py-2 rounded-md border text-sm outline-none"
          style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg-card)', color: 'var(--color-text)' }}
        />
        <div className="flex gap-2 flex-wrap">
          {TYPE_FILTERS.map(f => (
            <button
              key={f.value}
              type="button"
              onClick={() => setTypeFilter(f.value)}
              className="px-3 py-1.5 text-xs rounded-full border font-medium"
              style={{
                borderColor: typeFilter === f.value ? 'var(--color-primary)' : 'var(--color-border)',
                background: typeFilter === f.value ? 'var(--color-primary)' : 'var(--color-bg-card)',
                color: typeFilter === f.value ? '#fff' : 'var(--color-text)',
              }}
            >
              {f.label}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={search}
          className="px-4 py-2 text-sm rounded-md border"
          style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg-card)', color: 'var(--color-text)' }}
        >
          Rechercher
        </button>
      </div>

      {/* Table */}
      <div className="rounded-lg overflow-hidden border" style={{ background: 'var(--color-bg-card)', borderColor: 'var(--color-border)' }}>
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b" style={{ background: 'var(--color-bg)', borderColor: 'var(--color-border)' }}>
              {['Nom', 'Type', 'N°', 'Stock', 'Unité', 'État'].map(h => (
                <th
                  key={h}
                  className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide"
                  style={{ color: 'var(--color-text-muted)' }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {produits.map(p => {
              const typeCfg = TYPE_CONFIG[p.produit_type]
              return (
                <tr key={p.id} className="border-b" style={{ borderColor: 'var(--color-border)' }}>
                  <td className="px-4 py-3 font-medium">
                    <a
                      href={`/backend/products/${p.id}`}
                      className="no-underline"
                      style={{ color: 'var(--color-primary)' }}
                    >
                      {p.name}
                    </a>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className="px-2.5 py-0.5 rounded-full text-xs font-medium"
                      style={{ background: typeCfg.bg, color: typeCfg.color }}
                    >
                      {typeCfg.label}
                    </span>
                  </td>
                  <td className="px-4 py-3" style={{ color: 'var(--color-text-muted)' }}>{p.number}</td>
                  <td className="px-4 py-3 tabular-nums">{p.population}</td>
                  <td className="px-4 py-3" style={{ color: 'var(--color-text-muted)' }}>{p.unit_name}</td>
                  <td className="px-4 py-3">
                    {p.dead_at ? (
                      <span
                        className="px-2.5 py-0.5 rounded-full text-xs font-medium"
                        style={{ background: '#f3f4f6', color: '#374151' }}
                      >
                        Inactif
                      </span>
                    ) : p.population === 0 ? (
                      <span
                        className="px-2.5 py-0.5 rounded-full text-xs font-medium"
                        style={{ background: '#fff7ed', color: '#c2410c' }}
                      >
                        Épuisé
                      </span>
                    ) : null}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex justify-between items-center mt-4">
        <span className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
          {meta.total_count} produit(s)
        </span>
        <div className="flex gap-2">
          {meta.current_page > 1 && (
            <button
              type="button"
              onClick={() => router.get('/backend/products', { q, produit_type: typeFilter, page: meta.current_page - 1 })}
              className="px-3 py-1.5 text-xs rounded border"
              style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg-card)', color: 'var(--color-text)' }}
            >
              Précédent
            </button>
          )}
          {meta.current_page < meta.total_pages && (
            <button
              type="button"
              onClick={() => router.get('/backend/products', { q, produit_type: typeFilter, page: meta.current_page + 1 })}
              className="px-3 py-1.5 text-xs rounded border"
              style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg-card)', color: 'var(--color-text)' }}
            >
              Suivant
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

CatalogueIndex.layout = (page: ReactNode) => <AppShell>{page}</AppShell>
```

- [ ] **Step 4: Run tests — verify all 6 pass**

```bash
yarn vitest run app/frontend/pages/Backend/Catalogue/Index.test.tsx --reporter=verbose
```

Expected: 6/6 PASS.

- [ ] **Step 5: TypeScript check**

```bash
yarn tsc --noEmit
```

Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add app/frontend/pages/Backend/Catalogue/Index.test.tsx app/frontend/pages/Backend/Catalogue/Index.tsx
git commit -m "feat: add CatalogueIndex page with TDD (6/6 tests)"
```

---

## Task 3: CatalogueShow — TDD

**Files:**
- Create: `app/frontend/pages/Backend/Catalogue/Show.test.tsx`
- Create: `app/frontend/pages/Backend/Catalogue/Show.tsx`

- [ ] **Step 1: Create the test file**

```typescript
// app/frontend/pages/Backend/Catalogue/Show.test.tsx
import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import CatalogueShow from './Show'
import type { CatalogueShowProps } from '../../../types/catalogue'

vi.mock('@inertiajs/react', () => ({
  router: { get: vi.fn() },
}))

const mockProduit = {
  id: 1,
  name: 'Engrais NPK',
  number: 'P001',
  produit_type: 'Matter' as const,
  population: 42.5,
  unit_name: 'kg',
  description: null,
  dead_at: null,
}

const mockMovement = {
  delta: 10,
  population: 42.5,
  started_at: '2024-03-15T00:00:00Z',
  description: 'Réception fournisseur',
}

function renderShow(overrides: Partial<CatalogueShowProps> = {}) {
  const props: CatalogueShowProps = {
    produit: mockProduit,
    movements: [mockMovement],
    ...overrides,
  }
  return render(<CatalogueShow {...props} />)
}

describe('CatalogueShow', () => {
  it('renders produit name as heading', () => {
    renderShow()
    expect(screen.getByRole('heading', { name: 'Engrais NPK' })).toBeInTheDocument()
  })

  it('renders type badge', () => {
    renderShow()
    expect(screen.getByText('Matière')).toBeInTheDocument()
  })

  it('renders population with unit', () => {
    renderShow()
    expect(screen.getByText(/42\.5.*kg/)).toBeInTheDocument()
  })

  it('renders movement row with + prefix for positive delta', () => {
    renderShow()
    expect(screen.getByText('+10')).toBeInTheDocument()
  })

  it('shows empty state message when movements is empty', () => {
    renderShow({ movements: [] })
    expect(screen.getByText('Aucun mouvement enregistré')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run tests — verify they all fail**

```bash
yarn vitest run app/frontend/pages/Backend/Catalogue/Show.test.tsx --reporter=verbose
```

Expected: 5 tests FAIL (module not found).

- [ ] **Step 3: Create `Show.tsx`**

```typescript
// app/frontend/pages/Backend/Catalogue/Show.tsx
import type { ReactNode } from 'react'
import { AppShell } from '../../../components/AppShell'
import type { CatalogueShowProps, ProduitType } from '../../../types/catalogue'

const TYPE_CONFIG: Record<ProduitType, { label: string; bg: string; color: string }> = {
  Matter:    { label: 'Matière',    bg: '#dcfce7', color: '#166534' },
  Animal:    { label: 'Animal',     bg: '#fef9c3', color: '#854d0e' },
  Equipment: { label: 'Équipement', bg: '#dbeafe', color: '#1e40af' },
  Plant:     { label: 'Plante',     bg: '#ede9fe', color: '#5b21b6' },
  Other:     { label: 'Autre',      bg: '#f3f4f6', color: '#374151' },
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export default function CatalogueShow({ produit, movements }: CatalogueShowProps) {
  const typeCfg = TYPE_CONFIG[produit.produit_type]

  return (
    <div className="p-8">
      <a
        href="/backend/products"
        className="no-underline text-sm mb-6 inline-block"
        style={{ color: 'var(--color-primary)' }}
      >
        ← Retour au catalogue
      </a>

      <h1 className="text-2xl font-bold mb-4 mt-2" style={{ color: 'var(--color-text)' }}>
        {produit.name}
      </h1>

      {/* Header card */}
      <div
        className="rounded-lg border p-5 mb-6 flex flex-wrap gap-8 items-start"
        style={{ background: 'var(--color-bg-card)', borderColor: 'var(--color-border)' }}
      >
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: 'var(--color-text-muted)' }}>
            Type
          </p>
          <span
            className="px-2.5 py-0.5 rounded-full text-xs font-medium"
            style={{ background: typeCfg.bg, color: typeCfg.color }}
          >
            {typeCfg.label}
          </span>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: 'var(--color-text-muted)' }}>
            Stock
          </p>
          <p className="text-2xl font-bold tabular-nums" style={{ color: 'var(--color-text)' }}>
            {produit.population}{' '}
            <span className="text-base font-normal" style={{ color: 'var(--color-text-muted)' }}>
              {produit.unit_name}
            </span>
          </p>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: 'var(--color-text-muted)' }}>
            N°
          </p>
          <p className="text-sm" style={{ color: 'var(--color-text)' }}>{produit.number}</p>
        </div>
      </div>

      {/* Movements */}
      <h2 className="text-base font-semibold mb-3" style={{ color: 'var(--color-text)' }}>
        Mouvements récents
      </h2>

      {movements.length === 0 ? (
        <p className="text-sm py-6 text-center" style={{ color: 'var(--color-text-muted)' }}>
          Aucun mouvement enregistré
        </p>
      ) : (
        <div
          className="rounded-lg overflow-hidden border"
          style={{ background: 'var(--color-bg-card)', borderColor: 'var(--color-border)' }}
        >
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b" style={{ background: 'var(--color-bg)', borderColor: 'var(--color-border)' }}>
                {['Date', 'Variation', 'Stock résultant', 'Motif'].map(h => (
                  <th
                    key={h}
                    className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide"
                    style={{ color: 'var(--color-text-muted)' }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {movements.map((mv, i) => (
                <tr key={i} className="border-b" style={{ borderColor: 'var(--color-border)' }}>
                  <td className="px-4 py-3" style={{ color: 'var(--color-text-muted)' }}>
                    {formatDate(mv.started_at)}
                  </td>
                  <td
                    className="px-4 py-3 font-semibold tabular-nums"
                    style={{ color: mv.delta > 0 ? 'var(--color-success-text)' : '#dc2626' }}
                  >
                    {mv.delta > 0 ? `+${mv.delta}` : `${mv.delta}`}
                  </td>
                  <td className="px-4 py-3 tabular-nums">{mv.population}</td>
                  <td className="px-4 py-3" style={{ color: 'var(--color-text-muted)' }}>
                    {mv.description ?? '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

CatalogueShow.layout = (page: ReactNode) => <AppShell>{page}</AppShell>
```

- [ ] **Step 4: Run tests — verify all 5 pass**

```bash
yarn vitest run app/frontend/pages/Backend/Catalogue/Show.test.tsx --reporter=verbose
```

Expected: 5/5 PASS.

- [ ] **Step 5: Run all catalogue tests together**

```bash
yarn vitest run app/frontend/pages/Backend/Catalogue/ --reporter=verbose
```

Expected: 11/11 PASS.

- [ ] **Step 6: TypeScript check**

```bash
yarn tsc --noEmit
```

Expected: no errors.

- [ ] **Step 7: Commit**

```bash
git add app/frontend/pages/Backend/Catalogue/Show.test.tsx app/frontend/pages/Backend/Catalogue/Show.tsx
git commit -m "feat: add CatalogueShow page with TDD (5/5 tests)"
```

---

## Task 4: Rails ProductsController — Inertia index + show

**Files:**
- Modify: `app/controllers/backend/products_controller.rb`

**Context:** `ProductsController` opens with `manage_restfully` on line 22. We add a `layout` declaration and explicit `index`/`show` methods that Rails will use instead of any manage_restfully-generated ones (explicit method definitions always win). We do NOT remove `manage_restfully` — it handles `new/create/edit/update/destroy` via HAML. The private `produit_json` method goes at the end of the class.

- [ ] **Step 1: Read the file first**

Read `app/controllers/backend/products_controller.rb` to locate:
- The opening `class ProductsController < Backend::BaseController` line
- The closing `end` of the class (to know where to add private helpers)
- Whether a `private` section already exists at the bottom

- [ ] **Step 2: Add `layout` declaration**

Insert immediately after the class declaration line (`class ProductsController < Backend::BaseController`), before `manage_restfully`:

```ruby
layout 'inertia', only: [:index, :show]
```

- [ ] **Step 3: Add `index` action**

Insert as a public method directly after the `layout` line (still before `manage_restfully`):

```ruby
def index
  scope = Product.joins(:variant).includes(:variant)

  if params[:produit_type].present?
    case params[:produit_type]
    when 'Matter'
      scope = scope.where("products.type = ?", 'Matter')
    when 'Animal'
      scope = scope.where("products.type = ?", 'Animal')
    when 'Equipment'
      scope = scope.where("products.type IN (?)", %w[Equipment Tool])
    when 'Plant'
      scope = scope.where("products.type = ?", 'Plant')
    else
      scope = scope.where("products.type NOT IN (?)", %w[Matter Animal Equipment Tool Plant Worker])
    end
  end

  if params[:q].present?
    scope = scope.select { |p| p.name.to_s.downcase.include?(params[:q].downcase) }
  else
    scope = scope.to_a
  end

  per_page = 20
  total_count = scope.size
  current_page = [params[:page].to_i, 1].max
  total_pages = [(total_count.to_f / per_page).ceil, 1].max
  paginated = scope.sort_by(&:name)[(current_page - 1) * per_page, per_page] || []

  render inertia: 'Backend/Catalogue/Index', props: {
    produits: paginated.map { |p| produit_json(p) },
    filters: { q: params[:q], produit_type: params[:produit_type] },
    meta: { total_count: total_count, current_page: current_page, total_pages: total_pages }
  }
end
```

- [ ] **Step 4: Add `show` action**

Insert immediately after the `index` method (still before `manage_restfully`):

```ruby
def show
  return unless @product = find_and_check(:product)
  movements = ProductMovement.where(product_id: @product.id)
                             .order(started_at: :desc)
                             .limit(20)
                             .map { |mv|
                               {
                                 delta: mv.delta.to_f,
                                 population: mv.population.to_f,
                                 started_at: mv.started_at.iso8601,
                                 description: mv.description
                               }
                             }
  render inertia: 'Backend/Catalogue/Show', props: {
    produit: produit_json(@product),
    movements: movements
  }
end
```

- [ ] **Step 5: Add private `produit_json` at end of class**

Just before the final `end` that closes the class body, add:

```ruby
private

def produit_json(product)
  type_str = product.type.to_s
  produit_type = case type_str
                 when 'Matter'             then 'Matter'
                 when 'Animal'             then 'Animal'
                 when 'Equipment', 'Tool'  then 'Equipment'
                 when 'Plant'              then 'Plant'
                 else                           'Other'
                 end
  {
    id: product.id,
    name: product.name,
    number: product.number,
    produit_type: produit_type,
    population: product.population.to_f,
    unit_name: product.conditioning_unit&.name || product.variant&.default_unit&.name || '',
    description: product.description,
    dead_at: product.dead_at&.to_date&.iso8601
  }
end
```

**Note:** If the file already has a `private` section at the bottom, add `produit_json` inside that existing `private` block instead of creating a second `private` declaration.

- [ ] **Step 6: Run Rubocop**

```bash
bundle exec rubocop app/controllers/backend/products_controller.rb -a
```

Expected: no offenses (or auto-corrected).

- [ ] **Step 7: Smoke-test Rails boots**

```bash
bundle exec rails runner "puts ProductsController.instance_methods(false).include?(:index)"
```

Expected output: `true`

- [ ] **Step 8: Commit**

```bash
git add app/controllers/backend/products_controller.rb
git commit -m "feat: add Inertia index/show to ProductsController for Catalogue module"
```

---

## Self-Review

**Spec coverage check:**

| Spec requirement | Task |
|-----------------|------|
| `types/catalogue.ts` with all 4 interfaces + `ProduitType` | Task 1 |
| AppShell Catalogue nav link + `Package` icon | Task 1 |
| `CatalogueIndex` heading "Catalogue" | Task 2 |
| Type filter buttons (Tous/Matière/Animal/Équipement/Plante/Autre) | Task 2 |
| Table columns: Nom / Type badge / N° / Stock / Unité / État | Task 2 |
| "Épuisé" badge when population=0 and dead_at null | Task 2 |
| "Inactif" badge when dead_at set | Task 2 |
| Pagination (Précédent/Suivant + total_count) | Task 2 |
| 6 Index tests | Task 2 |
| `CatalogueShow` heading = produit.name | Task 3 |
| Header card with type badge + population + N° | Task 3 |
| Movements table: Date / Variation (+/- colored) / Stock résultant / Motif | Task 3 |
| Empty state "Aucun mouvement enregistré" | Task 3 |
| Back link to `/backend/products` | Task 3 |
| 5 Show tests | Task 3 |
| `layout 'inertia', only: [:index, :show]` | Task 4 |
| `index` with type filter + q filter + pagination (Ruby 2.6 safe) | Task 4 |
| `show` with `find_and_check` + last 20 ProductMovements | Task 4 |
| `produit_json` private helper | Task 4 |
| `manage_restfully` NOT removed | Task 4 (explicit instruction) |

**Type consistency check:** `ProduitType`, `Produit`, `ProduitMovement`, `CatalogueIndexProps`, `CatalogueShowProps` are defined once in Task 1 and imported in Tasks 2, 3, 4.

**Ruby 2.6 constraints:** No `filter_map`, `then`, or `yield_self` used. `.select { }.map { }` pattern used in `index`. `.each_with_object` not needed here.
