# SenagrOS New Features Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Travailleurs and Animaux modules (Index + Show), a Gantt timeline view for Productions, and 2 new KPI cards on the Dashboard.

**Architecture:** Each new module follows the established Equipements pattern exactly — Rails controller renders Inertia props, TypeScript types file, React Index/Show pages with AppShell layout. The Gantt is a pure-frontend toggle on the existing Productions/Index. Dashboard KPIs add two counters (workers, productions) to the existing controller `home` action.

**Tech Stack:** Ruby on Rails 6, Inertia.js v2, React 18, TypeScript strict, Vitest, Tailwind + CSS vars tokens, Lucide React icons.

**Working directory:** `/Users/yusper/Downloads/SenagrOS/ekylibre-main/`

---

## File Map

### New files to create
- `app/controllers/backend/` — add Inertia `index`/`show` to `workers_controller.rb` and `animals_controller.rb`
- `app/frontend/types/travailleur.ts` — Worker types
- `app/frontend/types/animal.ts` — Animal types
- `app/frontend/pages/Backend/Travailleurs/Index.tsx` + `Index.test.tsx`
- `app/frontend/pages/Backend/Travailleurs/Show.tsx` + `Show.test.tsx`
- `app/frontend/pages/Backend/Animaux/Index.tsx` + `Index.test.tsx`
- `app/frontend/pages/Backend/Animaux/Show.tsx` + `Show.test.tsx`
- `app/frontend/components/productions/GanttView.tsx` + `GanttView.test.tsx`

### Files to modify
- `app/frontend/components/AppShell.tsx` — add nav links for Travailleurs + Animaux
- `app/frontend/pages/Backend/Productions/Index.tsx` — add Gantt toggle
- `app/frontend/pages/Backend/Productions/Index.test.tsx` — add Gantt toggle tests
- `app/controllers/backend/dashboards_controller.rb` — add `workers_count` + `productions_count` to kpis
- `app/frontend/types/dashboard.ts` — extend `KpiData`
- `app/frontend/pages/Backend/Dashboard/Home.tsx` — render 2 new KpiCards
- `app/frontend/pages/Backend/Dashboard/Home.test.tsx` — update tests

---

## Task A1: workers_controller.rb — Inertia index/show + AppShell nav

**Files:**
- Modify: `app/controllers/backend/workers_controller.rb`
- Modify: `app/frontend/components/AppShell.tsx`

### Context

`WorkersController < Backend::ProductsController`. Workers use the `products` table. Relevant columns: `id`, `name`, `number`, `work_number`, `born_at`, `dead_at`, `description`, `identification_number`.

The controller already has a custom `index` that responds to `:pdf` and delegates `:html` to `super`. We need to REPLACE that `index` with an Inertia render, and add a new `show`. Add `layout 'inertia', only: [:index, :show]` before the existing `index`.

`find_and_check` resolves `@worker` from the `id` param.

`InterventionParameter` with `type: 'InterventionDoer'` links workers to interventions.

- [ ] **Step 1: Add Inertia index/show to workers_controller.rb**

Replace the existing `def index ... end` block (lines ~83–95) and add `layout` + `show` before it:

```ruby
layout 'inertia', only: [:index, :show]

def index
  scope = Worker.includes(:variant).order(:name).page(params[:page]).per(50)

  travailleurs = scope.map do |w|
    {
      'id'          => w.id,
      'name'        => w.name.to_s,
      'number'      => w.number.to_s,
      'work_number' => w.work_number.to_s,
      'born_at'     => w.born_at&.iso8601,
      'dead_at'     => w.dead_at&.iso8601
    }
  end

  render inertia: 'Backend/Travailleurs/Index', props: {
    travailleurs: travailleurs,
    meta: {
      'total'    => scope.total_count,
      'page'     => (params[:page] || 1).to_i,
      'per_page' => 50
    }
  }
end

def show
  return unless @worker = find_and_check

  interventions = InterventionParameter
    .includes(:intervention)
    .where(product_id: @worker.id, type: 'InterventionDoer')
    .order('interventions.started_at DESC')
    .limit(20)
    .map do |ip|
      {
        'id'         => ip.intervention.id,
        'name'       => ip.intervention.name.to_s,
        'started_at' => ip.intervention.started_at&.iso8601,
        'state'      => ip.intervention.state.to_s
      }
    end

  render inertia: 'Backend/Travailleurs/Show', props: {
    travailleur: {
      'id'                    => @worker.id,
      'name'                  => @worker.name.to_s,
      'number'                => @worker.number.to_s,
      'work_number'           => @worker.work_number.to_s,
      'identification_number' => @worker.identification_number.to_s,
      'born_at'               => @worker.born_at&.iso8601,
      'dead_at'               => @worker.dead_at&.iso8601,
      'description'           => @worker.description.to_s
    },
    interventions: interventions
  }
end
```

- [ ] **Step 2: Add nav links to AppShell.tsx**

In `app/frontend/components/AppShell.tsx`, the `NAV_LINKS` array starts at line 8. Add `UserCog` and `PawPrint` to the lucide-react import, then add two entries:

```typescript
// In the import line, add UserCog and PawPrint:
import {
  LayoutDashboard, Wrench, Map, Sprout, BookOpen, Settings, Calendar, Users, Tractor,
  UserCog, PawPrint,
} from 'lucide-react'

// In NAV_LINKS array, add after Équipements:
  { href: '/backend/workers',  label: 'Travailleurs', icon: UserCog  },
  { href: '/backend/animals',  label: 'Animaux',      icon: PawPrint },
```

- [ ] **Step 3: Run TypeScript check**

```bash
cd /Users/yusper/Downloads/SenagrOS/ekylibre-main && yarn tsc --noEmit
```
Expected: 0 errors

- [ ] **Step 4: Commit**

```bash
git add app/controllers/backend/workers_controller.rb app/frontend/components/AppShell.tsx
git commit -m "feat: add Inertia index/show to WorkersController + nav links"
```

---

## Task A2: types/travailleur.ts

**Files:**
- Create: `app/frontend/types/travailleur.ts`

- [ ] **Step 1: Write the failing TypeScript test** (import check — TSC is the test here; just create the file)

Create `app/frontend/types/travailleur.ts`:

```typescript
export interface Travailleur {
  id: number
  name: string
  number: string
  work_number: string
  born_at: string | null
  dead_at: string | null
}

export interface Travailleurs IndexProps {
  travailleurs: Travailleur[]
  meta: { total: number; page: number; per_page: number }
}

export interface TravailleurDetail {
  id: number
  name: string
  number: string
  work_number: string
  identification_number: string
  born_at: string | null
  dead_at: string | null
  description: string
}

export interface TravailleurIntervention {
  id: number
  name: string
  started_at: string | null
  state: string
}

export interface TravailleurShowProps {
  travailleur: TravailleurDetail
  interventions: TravailleurIntervention[]
}
```

**IMPORTANT:** The interface name above has a typo (`Travailleurs IndexProps` with a space). The correct name is `Travailleurs**I**ndexProps` without a space — write it as one word: `TravailleursIndexProps`.

- [ ] **Step 2: Run TypeScript check**

```bash
cd /Users/yusper/Downloads/SenagrOS/ekylibre-main && yarn tsc --noEmit
```
Expected: 0 errors

- [ ] **Step 3: Commit**

```bash
git add app/frontend/types/travailleur.ts
git commit -m "feat: add Travailleur TypeScript types"
```

---

## Task A3: Travailleurs/Index.tsx + Index.test.tsx

**Files:**
- Create: `app/frontend/pages/Backend/Travailleurs/Index.tsx`
- Create: `app/frontend/pages/Backend/Travailleurs/Index.test.tsx`

### Context

Follow exactly the Equipements/Index.tsx pattern. Workers have: `name`, `work_number`, `born_at`, `dead_at`. Use `UserCog` icon from lucide-react for the empty state. Link each name to `/backend/workers/${w.id}`.

The "Nouveau travailleur" button links to `/backend/workers/new` — keep it simple (the HAML form still works for creation).

- [ ] **Step 1: Write failing test**

Create `app/frontend/pages/Backend/Travailleurs/Index.test.tsx`:

```typescript
import { render, screen, fireEvent } from '@testing-library/react'
import { vi } from 'vitest'
import Travailleurs Index from './Index'

const mockVisit = vi.fn()
vi.mock('@inertiajs/react', () => ({ router: { visit: mockVisit } }))

const travailleurs = [
  { id: 1, name: 'Mamadou Diop', number: 'T-001', work_number: 'W01', born_at: '1990-03-15T00:00:00Z', dead_at: null },
  { id: 2, name: 'Fatou Sow',    number: 'T-002', work_number: 'W02', born_at: null, dead_at: null },
]
const meta = { total: 2, page: 1, per_page: 50 }

it('renders travailleur names', () => {
  render(<TravailleursIndex travailleurs={travailleurs} meta={meta} />)
  expect(screen.getByText('Mamadou Diop')).toBeInTheDocument()
  expect(screen.getByText('Fatou Sow')).toBeInTheDocument()
})

it('renders total count', () => {
  render(<TravailleursIndex travailleurs={travailleurs} meta={meta} />)
  expect(screen.getByText(/2 travailleur/i)).toBeInTheDocument()
})

it('renders empty state when no travailleurs', () => {
  render(<TravailleursIndex travailleurs={[]} meta={{ total: 0, page: 1, per_page: 50 }} />)
  expect(screen.getByText(/aucun travailleur/i)).toBeInTheDocument()
})

it('name links to show page', () => {
  render(<TravailleursIndex travailleurs={travailleurs} meta={meta} />)
  const link = screen.getByRole('link', { name: 'Mamadou Diop' })
  expect(link).toHaveAttribute('href', '/backend/workers/1')
})

it('pagination: calls router.visit with page param', () => {
  const bigMeta = { total: 100, page: 1, per_page: 50 }
  render(<TravailleursIndex travailleurs={travailleurs} meta={bigMeta} />)
  fireEvent.click(screen.getByRole('button', { name: /suivant/i }))
  expect(mockVisit).toHaveBeenCalledWith('/backend/workers?page=2')
})
```

**NOTE:** The import line above has a space in `Travailleurs Index` — that is a formatting artifact. Write it without a space: `import TravailleursIndex from './Index'`.

- [ ] **Step 2: Run test to verify it fails**

```bash
cd /Users/yusper/Downloads/SenagrOS/ekylibre-main && yarn vitest run app/frontend/pages/Backend/Travailleurs/Index.test.tsx --reporter=verbose
```
Expected: FAIL — "Cannot find module './Index'"

- [ ] **Step 3: Create Index.tsx**

```typescript
import type { ReactNode } from 'react'
import { router } from '@inertiajs/react'
import { AppShell } from '../../../components/AppShell'
import type { TravailleursIndexProps } from '../../../types/travailleur'

function formatDate(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function TravailleursIndex({ travailleurs, meta }: TravailleursIndexProps) {
  const goToPage = (page: number) => {
    router.visit(`/backend/workers?page=${page}`)
  }
  const hasPrev = meta.page > 1
  const hasNext = meta.page * meta.per_page < meta.total

  return (
    <>
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-text)' }}>
            Travailleurs
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--color-text-muted)' }}>
            {meta.total} travailleur{meta.total !== 1 ? 's' : ''}
          </p>
        </div>
        <a
          href="/backend/workers/new"
          className="px-3 py-1.5 rounded text-sm font-medium no-underline"
          style={{ background: 'var(--color-primary)', color: '#fff' }}
        >
          + Nouveau
        </a>
      </div>

      {travailleurs.length === 0 ? (
        <p className="text-center py-12" style={{ color: 'var(--color-text-muted)' }}>
          Aucun travailleur enregistré.
        </p>
      ) : (
        <div className="rounded-lg overflow-hidden border" style={{ background: 'var(--color-bg-card)', borderColor: 'var(--color-border)' }}>
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b-2" style={{ background: 'var(--color-bg)', borderColor: 'var(--color-border)' }}>
                {['N° travail', 'Nom', 'Numéro', 'Né(e) le', 'Statut'].map((h) => (
                  <th key={h} className="px-3 py-2.5 text-left uppercase tracking-wide text-xs font-semibold" style={{ color: 'var(--color-text-muted)' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {travailleurs.map((w) => (
                <tr key={w.id} className="border-b" style={{ borderColor: 'var(--color-border)' }}>
                  <td className="px-3 py-2.5 font-mono text-xs" style={{ color: 'var(--color-text-muted)' }}>
                    {w.work_number || '—'}
                  </td>
                  <td className="px-3 py-2.5 font-medium">
                    <a href={`/backend/workers/${w.id}`} className="no-underline" style={{ color: 'var(--color-primary)' }}>
                      {w.name}
                    </a>
                  </td>
                  <td className="px-3 py-2.5 font-mono text-xs" style={{ color: 'var(--color-text-muted)' }}>
                    {w.number || '—'}
                  </td>
                  <td className="px-3 py-2.5" style={{ color: 'var(--color-text-muted)' }}>
                    {formatDate(w.born_at)}
                  </td>
                  <td className="px-3 py-2.5 text-xs font-semibold">
                    {w.dead_at ? (
                      <span style={{ color: 'var(--color-text-muted)' }}>Inactif</span>
                    ) : (
                      <span style={{ color: 'var(--color-success-text)' }}>Actif</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {(hasPrev || hasNext) && (
        <div className="flex items-center gap-3 mt-4">
          <button onClick={() => goToPage(meta.page - 1)} disabled={!hasPrev}
            className="px-3 py-1.5 text-xs rounded border disabled:opacity-40"
            style={{ borderColor: 'var(--color-border)', color: 'var(--color-text)', background: 'var(--color-bg-card)', cursor: hasPrev ? 'pointer' : 'default' }}>
            Précédent
          </button>
          <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Page {meta.page}</span>
          <button onClick={() => goToPage(meta.page + 1)} disabled={!hasNext}
            className="px-3 py-1.5 text-xs rounded border disabled:opacity-40"
            style={{ borderColor: 'var(--color-border)', color: 'var(--color-text)', background: 'var(--color-bg-card)', cursor: hasNext ? 'pointer' : 'default' }}>
            Suivant
          </button>
        </div>
      )}
    </>
  )
}

TravailleursIndex.layout = (page: ReactNode) => <AppShell>{page}</AppShell>
export default TravailleursIndex
```

- [ ] **Step 4: Run tests**

```bash
cd /Users/yusper/Downloads/SenagrOS/ekylibre-main && yarn vitest run app/frontend/pages/Backend/Travailleurs/Index.test.tsx --reporter=verbose
```
Expected: 5/5 PASS

- [ ] **Step 5: Commit**

```bash
git add app/frontend/pages/Backend/Travailleurs/
git commit -m "feat: add Travailleurs Index page"
```

---

## Task A4: Travailleurs/Show.tsx + Show.test.tsx

**Files:**
- Create: `app/frontend/pages/Backend/Travailleurs/Show.tsx`
- Create: `app/frontend/pages/Backend/Travailleurs/Show.test.tsx`

### Context

Follow Equipements/Show.tsx pattern. Show: name, work_number, number, identification_number, born_at, dead_at, description, and a table of interventions. Use `UserCog` icon. Active = no `dead_at`.

- [ ] **Step 1: Write failing test**

Create `app/frontend/pages/Backend/Travailleurs/Show.test.tsx`:

```typescript
import { render, screen } from '@testing-library/react'
import TravailleurShow from './Show'
import type { TravailleurShowProps } from '../../../types/travailleur'

const travailleur = {
  id: 1,
  name: 'Mamadou Diop',
  number: 'T-001',
  work_number: 'W01',
  identification_number: 'ID-123',
  born_at: '1990-03-15T00:00:00Z',
  dead_at: null,
  description: 'Chauffeur principal',
}
const interventions = [
  { id: 10, name: 'Semis parcelle A', started_at: '2024-03-01T08:00:00Z', state: 'done' },
]

it('renders travailleur name', () => {
  render(<TravailleurShow travailleur={travailleur} interventions={[]} />)
  expect(screen.getByText('Mamadou Diop')).toBeInTheDocument()
})

it('renders actif badge when no dead_at', () => {
  render(<TravailleurShow travailleur={travailleur} interventions={[]} />)
  expect(screen.getByText('Actif')).toBeInTheDocument()
})

it('renders inactif badge when dead_at present', () => {
  render(<TravailleurShow travailleur={{ ...travailleur, dead_at: '2024-01-01T00:00:00Z' }} interventions={[]} />)
  expect(screen.getByText('Inactif')).toBeInTheDocument()
})

it('renders description', () => {
  render(<TravailleurShow travailleur={travailleur} interventions={[]} />)
  expect(screen.getByText('Chauffeur principal')).toBeInTheDocument()
})

it('renders intervention list', () => {
  render(<TravailleurShow travailleur={travailleur} interventions={interventions} />)
  expect(screen.getByText('Semis parcelle A')).toBeInTheDocument()
})

it('renders empty state when no interventions', () => {
  render(<TravailleurShow travailleur={travailleur} interventions={[]} />)
  expect(screen.getByText(/aucune intervention/i)).toBeInTheDocument()
})

it('shows edit link', () => {
  render(<TravailleurShow travailleur={travailleur} interventions={[]} />)
  const editLink = screen.getByRole('link', { name: /modifier/i })
  expect(editLink).toHaveAttribute('href', '/backend/workers/1/edit')
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd /Users/yusper/Downloads/SenagrOS/ekylibre-main && yarn vitest run app/frontend/pages/Backend/Travailleurs/Show.test.tsx --reporter=verbose
```
Expected: FAIL

- [ ] **Step 3: Create Show.tsx**

```typescript
import type { ReactNode } from 'react'
import { ArrowLeft, UserCog, Hash, Settings, Wrench } from 'lucide-react'
import { AppShell } from '../../../components/AppShell'
import type { TravailleurShowProps } from '../../../types/travailleur'

const STATE_LABELS: Record<string, string> = {
  in_progress: 'En cours',
  done: 'Terminée',
  validated: 'Validée',
}

function TravailleurShow({ travailleur, interventions }: TravailleurShowProps) {
  const isActive = !travailleur.dead_at

  return (
    <>
      <div className="mb-6">
        <a href="/backend/workers" className="flex items-center gap-1 text-sm no-underline" style={{ color: 'var(--color-text-muted)' }}>
          <ArrowLeft size={16} /> Retour aux travailleurs
        </a>
      </div>

      <div className="flex justify-between items-start mb-6">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center rounded-lg" style={{ width: 48, height: 48, background: 'var(--color-success-bg)', flexShrink: 0 }}>
            <UserCog size={22} style={{ color: 'var(--color-success-text)' }} />
          </div>
          <div>
            <h1 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-text)' }}>
              {travailleur.name}
            </h1>
            <div className="flex gap-2 mt-1">
              {travailleur.work_number && (
                <span className="inline-block px-2 py-0.5 rounded text-xs font-mono font-semibold"
                  style={{ background: 'var(--color-bg-subtle)', color: 'var(--color-text-muted)', border: '1px solid var(--color-border)' }}>
                  N° {travailleur.work_number}
                </span>
              )}
              <span className="inline-block px-2 py-0.5 rounded-full text-xs font-semibold"
                style={isActive
                  ? { background: 'var(--color-success-bg)', color: 'var(--color-success-text)' }
                  : { background: 'var(--color-danger-bg)', color: 'var(--color-danger-text)' }}>
                {isActive ? 'Actif' : 'Inactif'}
              </span>
            </div>
          </div>
        </div>
        <a href={`/backend/workers/${travailleur.id}/edit`}
          className="px-3 py-1.5 rounded text-sm font-medium no-underline"
          style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }}>
          Modifier
        </a>
      </div>

      <div className="grid gap-4" style={{ gridTemplateColumns: '1fr 1fr' }}>
        <div className="rounded-lg p-5" style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-card)' }}>
          <h2 className="text-sm font-semibold uppercase tracking-wide mb-4 flex items-center gap-2" style={{ color: 'var(--color-text-muted)' }}>
            <Hash size={14} /> Identification
          </h2>
          <dl className="grid grid-cols-1 gap-y-3">
            {[
              { label: 'Nom',              value: travailleur.name },
              { label: 'N° travail',       value: travailleur.work_number || '—' },
              { label: 'Numéro',           value: travailleur.number || '—' },
              { label: "N° identification", value: travailleur.identification_number || '—' },
            ].map(({ label, value }) => (
              <div key={label}>
                <dt className="text-xs mb-0.5" style={{ color: 'var(--color-text-muted)' }}>{label}</dt>
                <dd className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>{value}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="rounded-lg p-5" style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-card)' }}>
          <h2 className="text-sm font-semibold uppercase tracking-wide mb-4 flex items-center gap-2" style={{ color: 'var(--color-text-muted)' }}>
            <Settings size={14} /> Cycle de vie
          </h2>
          <dl className="grid grid-cols-1 gap-y-3">
            {[
              { label: 'Date de naissance', value: travailleur.born_at?.slice(0, 10) ?? '—' },
              { label: 'Date de départ',    value: travailleur.dead_at?.slice(0, 10) ?? '—' },
            ].map(({ label, value }) => (
              <div key={label}>
                <dt className="text-xs mb-0.5" style={{ color: 'var(--color-text-muted)' }}>{label}</dt>
                <dd className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>{value}</dd>
              </div>
            ))}
          </dl>
          {travailleur.description && (
            <div className="mt-4 pt-4" style={{ borderTop: '1px solid var(--color-border)' }}>
              <dt className="text-xs mb-1" style={{ color: 'var(--color-text-muted)' }}>Description</dt>
              <dd className="text-sm" style={{ color: 'var(--color-text)' }}>{travailleur.description}</dd>
            </div>
          )}
        </div>
      </div>

      <div className="mt-6 rounded-lg" style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-card)' }}>
        <div className="flex items-center gap-2 px-5 py-4" style={{ borderBottom: '1px solid var(--color-border)' }}>
          <Wrench size={16} style={{ color: 'var(--color-text-muted)' }} />
          <h2 className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
            Interventions ({interventions.length})
          </h2>
        </div>
        {interventions.length === 0 ? (
          <p className="px-5 py-4 text-sm" style={{ color: 'var(--color-text-muted)' }}>Aucune intervention enregistrée.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--color-text-muted)' }}>Intervention</th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--color-text-muted)' }}>Date</th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--color-text-muted)' }}>État</th>
              </tr>
            </thead>
            <tbody>
              {interventions.map((iv) => (
                <tr key={iv.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <td className="px-5 py-3">
                    <a href={`/backend/interventions/${iv.id}`} className="no-underline font-medium" style={{ color: 'var(--color-primary)' }}>
                      {iv.name}
                    </a>
                  </td>
                  <td className="px-5 py-3" style={{ color: 'var(--color-text-muted)' }}>
                    {iv.started_at ? new Date(iv.started_at).toLocaleDateString('fr-FR') : '—'}
                  </td>
                  <td className="px-5 py-3" style={{ color: 'var(--color-text)' }}>
                    {STATE_LABELS[iv.state] ?? iv.state}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  )
}

TravailleurShow.layout = (page: ReactNode) => <AppShell>{page}</AppShell>
export default TravailleurShow
```

- [ ] **Step 4: Run tests**

```bash
cd /Users/yusper/Downloads/SenagrOS/ekylibre-main && yarn vitest run app/frontend/pages/Backend/Travailleurs/Show.test.tsx --reporter=verbose
```
Expected: 7/7 PASS

- [ ] **Step 5: Run TypeScript check**

```bash
cd /Users/yusper/Downloads/SenagrOS/ekylibre-main && yarn tsc --noEmit
```
Expected: 0 errors

- [ ] **Step 6: Commit**

```bash
git add app/frontend/pages/Backend/Travailleurs/
git commit -m "feat: add Travailleurs Show page"
```

---

## Task B1: animals_controller.rb — Inertia index/show

**Files:**
- Modify: `app/controllers/backend/animals_controller.rb`

### Context

`AnimalsController < Backend::MattersController`. Uses the `products` table. Key columns: `id`, `name`, `number`, `work_number`, `born_at`, `dead_at`, `identification_number`, `variety` (species/sex string).

The existing `index` (line ~165) responds with JSON. Replace it with an Inertia render. The existing `show` (line ~182) responds with JSON too — replace it.

`find_and_check` resolves `@animal`.

`InterventionParameter` with `type: 'InterventionTarget'` links animals to interventions as targets (animals are worked ON, not doers).

- [ ] **Step 1: Add Inertia index/show to animals_controller.rb**

Add `layout 'inertia', only: [:index, :show]` before the existing `def index`.

Replace the existing `def index` block:

```ruby
layout 'inertia', only: [:index, :show]

def index
  scope = Animal.order(:name).page(params[:page]).per(50)

  animaux = scope.map do |a|
    {
      'id'          => a.id,
      'name'        => a.name.to_s,
      'number'      => a.number.to_s,
      'work_number' => a.work_number.to_s,
      'variety'     => a.variety.to_s,
      'born_at'     => a.born_at&.iso8601,
      'dead_at'     => a.dead_at&.iso8601
    }
  end

  render inertia: 'Backend/Animaux/Index', props: {
    animaux: animaux,
    meta: {
      'total'    => scope.total_count,
      'page'     => (params[:page] || 1).to_i,
      'per_page' => 50
    }
  }
end
```

Replace the existing `def show` block:

```ruby
def show
  return unless @animal = find_and_check

  interventions = InterventionParameter
    .includes(:intervention)
    .where(product_id: @animal.id, type: 'InterventionTarget')
    .order('interventions.started_at DESC')
    .limit(20)
    .map do |ip|
      {
        'id'         => ip.intervention.id,
        'name'       => ip.intervention.name.to_s,
        'started_at' => ip.intervention.started_at&.iso8601,
        'state'      => ip.intervention.state.to_s
      }
    end

  render inertia: 'Backend/Animaux/Show', props: {
    animal: {
      'id'                    => @animal.id,
      'name'                  => @animal.name.to_s,
      'number'                => @animal.number.to_s,
      'work_number'           => @animal.work_number.to_s,
      'identification_number' => @animal.identification_number.to_s,
      'variety'               => @animal.variety.to_s,
      'born_at'               => @animal.born_at&.iso8601,
      'dead_at'               => @animal.dead_at&.iso8601,
      'description'           => @animal.description.to_s
    },
    interventions: interventions
  }
end
```

- [ ] **Step 2: Run TypeScript check (Rails file only changes, but verify no TS regressions)**

```bash
cd /Users/yusper/Downloads/SenagrOS/ekylibre-main && yarn tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add app/controllers/backend/animals_controller.rb
git commit -m "feat: add Inertia index/show to AnimalsController"
```

---

## Task B2: types/animal.ts

**Files:**
- Create: `app/frontend/types/animal.ts`

- [ ] **Step 1: Create the file**

```typescript
export interface Animal {
  id: number
  name: string
  number: string
  work_number: string
  variety: string
  born_at: string | null
  dead_at: string | null
}

export interface AnimauxIndexProps {
  animaux: Animal[]
  meta: { total: number; page: number; per_page: number }
}

export interface AnimalDetail {
  id: number
  name: string
  number: string
  work_number: string
  identification_number: string
  variety: string
  born_at: string | null
  dead_at: string | null
  description: string
}

export interface AnimalIntervention {
  id: number
  name: string
  started_at: string | null
  state: string
}

export interface AnimalShowProps {
  animal: AnimalDetail
  interventions: AnimalIntervention[]
}
```

- [ ] **Step 2: Run TypeScript check**

```bash
cd /Users/yusper/Downloads/SenagrOS/ekylibre-main && yarn tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add app/frontend/types/animal.ts
git commit -m "feat: add Animal TypeScript types"
```

---

## Task B3: Animaux/Index.tsx + Index.test.tsx

**Files:**
- Create: `app/frontend/pages/Backend/Animaux/Index.tsx`
- Create: `app/frontend/pages/Backend/Animaux/Index.test.tsx`

### Context

Identical pattern to Travailleurs/Index but for animals. Columns: `name`, `work_number`, `variety` (species string), `born_at`. Icon: `PawPrint`. Link to `/backend/animals/${a.id}`.

- [ ] **Step 1: Write failing test**

Create `app/frontend/pages/Backend/Animaux/Index.test.tsx`:

```typescript
import { render, screen, fireEvent } from '@testing-library/react'
import { vi } from 'vitest'
import AnimauxIndex from './Index'

const mockVisit = vi.fn()
vi.mock('@inertiajs/react', () => ({ router: { visit: mockVisit } }))

const animaux = [
  { id: 1, name: 'Ndeye', number: 'A-001', work_number: '', variety: 'bos_taurus', born_at: '2020-01-10T00:00:00Z', dead_at: null },
  { id: 2, name: 'Moussa', number: 'A-002', work_number: '', variety: 'bos_taurus', born_at: null, dead_at: '2023-06-01T00:00:00Z' },
]
const meta = { total: 2, page: 1, per_page: 50 }

it('renders animal names', () => {
  render(<AnimauxIndex animaux={animaux} meta={meta} />)
  expect(screen.getByText('Ndeye')).toBeInTheDocument()
  expect(screen.getByText('Moussa')).toBeInTheDocument()
})

it('renders total count', () => {
  render(<AnimauxIndex animaux={animaux} meta={meta} />)
  expect(screen.getByText(/2 animal/i)).toBeInTheDocument()
})

it('renders empty state', () => {
  render(<AnimauxIndex animaux={[]} meta={{ total: 0, page: 1, per_page: 50 }} />)
  expect(screen.getByText(/aucun animal/i)).toBeInTheDocument()
})

it('name links to show page', () => {
  render(<AnimauxIndex animaux={animaux} meta={meta} />)
  const link = screen.getByRole('link', { name: 'Ndeye' })
  expect(link).toHaveAttribute('href', '/backend/animals/1')
})

it('pagination calls router.visit', () => {
  const bigMeta = { total: 100, page: 1, per_page: 50 }
  render(<AnimauxIndex animaux={animaux} meta={bigMeta} />)
  fireEvent.click(screen.getByRole('button', { name: /suivant/i }))
  expect(mockVisit).toHaveBeenCalledWith('/backend/animals?page=2')
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd /Users/yusper/Downloads/SenagrOS/ekylibre-main && yarn vitest run app/frontend/pages/Backend/Animaux/Index.test.tsx --reporter=verbose
```
Expected: FAIL

- [ ] **Step 3: Create Index.tsx**

```typescript
import type { ReactNode } from 'react'
import { router } from '@inertiajs/react'
import { AppShell } from '../../../components/AppShell'
import type { AnimauxIndexProps } from '../../../types/animal'

function formatDate(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function AnimauxIndex({ animaux, meta }: AnimauxIndexProps) {
  const goToPage = (page: number) => {
    router.visit(`/backend/animals?page=${page}`)
  }
  const hasPrev = meta.page > 1
  const hasNext = meta.page * meta.per_page < meta.total

  return (
    <>
      <div className="mb-5">
        <h1 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-text)' }}>
          Animaux
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--color-text-muted)' }}>
          {meta.total} animal{meta.total !== 1 ? 'aux' : ''}
        </p>
      </div>

      {animaux.length === 0 ? (
        <p className="text-center py-12" style={{ color: 'var(--color-text-muted)' }}>
          Aucun animal enregistré.
        </p>
      ) : (
        <div className="rounded-lg overflow-hidden border" style={{ background: 'var(--color-bg-card)', borderColor: 'var(--color-border)' }}>
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b-2" style={{ background: 'var(--color-bg)', borderColor: 'var(--color-border)' }}>
                {['Nom', 'Race / Variété', 'Né(e) le', 'Statut'].map((h) => (
                  <th key={h} className="px-3 py-2.5 text-left uppercase tracking-wide text-xs font-semibold" style={{ color: 'var(--color-text-muted)' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {animaux.map((a) => (
                <tr key={a.id} className="border-b" style={{ borderColor: 'var(--color-border)' }}>
                  <td className="px-3 py-2.5 font-medium">
                    <a href={`/backend/animals/${a.id}`} className="no-underline" style={{ color: 'var(--color-primary)' }}>
                      {a.name}
                    </a>
                  </td>
                  <td className="px-3 py-2.5" style={{ color: 'var(--color-text-muted)' }}>
                    {a.variety || '—'}
                  </td>
                  <td className="px-3 py-2.5" style={{ color: 'var(--color-text-muted)' }}>
                    {formatDate(a.born_at)}
                  </td>
                  <td className="px-3 py-2.5 text-xs font-semibold">
                    {a.dead_at ? (
                      <span style={{ color: 'var(--color-text-muted)' }}>Décédé</span>
                    ) : (
                      <span style={{ color: 'var(--color-success-text)' }}>Vivant</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {(hasPrev || hasNext) && (
        <div className="flex items-center gap-3 mt-4">
          <button onClick={() => goToPage(meta.page - 1)} disabled={!hasPrev}
            className="px-3 py-1.5 text-xs rounded border disabled:opacity-40"
            style={{ borderColor: 'var(--color-border)', color: 'var(--color-text)', background: 'var(--color-bg-card)', cursor: hasPrev ? 'pointer' : 'default' }}>
            Précédent
          </button>
          <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Page {meta.page}</span>
          <button onClick={() => goToPage(meta.page + 1)} disabled={!hasNext}
            className="px-3 py-1.5 text-xs rounded border disabled:opacity-40"
            style={{ borderColor: 'var(--color-border)', color: 'var(--color-text)', background: 'var(--color-bg-card)', cursor: hasNext ? 'pointer' : 'default' }}>
            Suivant
          </button>
        </div>
      )}
    </>
  )
}

AnimauxIndex.layout = (page: ReactNode) => <AppShell>{page}</AppShell>
export default AnimauxIndex
```

- [ ] **Step 4: Run tests**

```bash
cd /Users/yusper/Downloads/SenagrOS/ekylibre-main && yarn vitest run app/frontend/pages/Backend/Animaux/Index.test.tsx --reporter=verbose
```
Expected: 5/5 PASS

- [ ] **Step 5: Commit**

```bash
git add app/frontend/pages/Backend/Animaux/
git commit -m "feat: add Animaux Index page"
```

---

## Task B4: Animaux/Show.tsx + Show.test.tsx

**Files:**
- Create: `app/frontend/pages/Backend/Animaux/Show.tsx`
- Create: `app/frontend/pages/Backend/Animaux/Show.test.tsx`

### Context

Follow TravailleurShow pattern exactly but for Animal. Show: name, number, work_number, identification_number, variety, born_at, dead_at, description, interventions. Active = `!animal.dead_at`. Status label: "Vivant" / "Décédé". Icon: `PawPrint`.

- [ ] **Step 1: Write failing test**

Create `app/frontend/pages/Backend/Animaux/Show.test.tsx`:

```typescript
import { render, screen } from '@testing-library/react'
import AnimalShow from './Show'

const animal = {
  id: 1,
  name: 'Ndeye',
  number: 'A-001',
  work_number: '',
  identification_number: 'FR123',
  variety: 'bos_taurus',
  born_at: '2020-01-10T00:00:00Z',
  dead_at: null,
  description: 'Vache laitière',
}

it('renders animal name', () => {
  render(<AnimalShow animal={animal} interventions={[]} />)
  expect(screen.getByText('Ndeye')).toBeInTheDocument()
})

it('renders vivant badge', () => {
  render(<AnimalShow animal={animal} interventions={[]} />)
  expect(screen.getByText('Vivant')).toBeInTheDocument()
})

it('renders décédé badge when dead_at present', () => {
  render(<AnimalShow animal={{ ...animal, dead_at: '2024-01-01T00:00:00Z' }} interventions={[]} />)
  expect(screen.getByText('Décédé')).toBeInTheDocument()
})

it('renders description', () => {
  render(<AnimalShow animal={animal} interventions={[]} />)
  expect(screen.getByText('Vache laitière')).toBeInTheDocument()
})

it('renders variety', () => {
  render(<AnimalShow animal={animal} interventions={[]} />)
  expect(screen.getByText('bos_taurus')).toBeInTheDocument()
})

it('empty state when no interventions', () => {
  render(<AnimalShow animal={animal} interventions={[]} />)
  expect(screen.getByText(/aucune intervention/i)).toBeInTheDocument()
})

it('edit link points to correct URL', () => {
  render(<AnimalShow animal={animal} interventions={[]} />)
  expect(screen.getByRole('link', { name: /modifier/i })).toHaveAttribute('href', '/backend/animals/1/edit')
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd /Users/yusper/Downloads/SenagrOS/ekylibre-main && yarn vitest run app/frontend/pages/Backend/Animaux/Show.test.tsx --reporter=verbose
```
Expected: FAIL

- [ ] **Step 3: Create Show.tsx**

Identical structure to `Travailleurs/Show.tsx` but:
- Import `PawPrint` instead of `UserCog`
- Prop name: `animal` (type `AnimalDetail`) + `interventions` (`AnimalIntervention[]`) from `../../../types/animal`
- Show `variety` field in the identification card
- Back link: `/backend/animals` — "Retour aux animaux"
- Status: "Vivant" / "Décédé"
- Edit link: `/backend/animals/${animal.id}/edit`
- `AnimalShow.layout = (page: ReactNode) => <AppShell>{page}</AppShell>`

```typescript
import type { ReactNode } from 'react'
import { ArrowLeft, PawPrint, Hash, Settings, Wrench } from 'lucide-react'
import { AppShell } from '../../../components/AppShell'
import type { AnimalShowProps } from '../../../types/animal'

const STATE_LABELS: Record<string, string> = {
  in_progress: 'En cours',
  done: 'Terminée',
  validated: 'Validée',
}

function AnimalShow({ animal, interventions }: AnimalShowProps) {
  const isAlive = !animal.dead_at

  return (
    <>
      <div className="mb-6">
        <a href="/backend/animals" className="flex items-center gap-1 text-sm no-underline" style={{ color: 'var(--color-text-muted)' }}>
          <ArrowLeft size={16} /> Retour aux animaux
        </a>
      </div>

      <div className="flex justify-between items-start mb-6">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center rounded-lg" style={{ width: 48, height: 48, background: 'var(--color-success-bg)', flexShrink: 0 }}>
            <PawPrint size={22} style={{ color: 'var(--color-success-text)' }} />
          </div>
          <div>
            <h1 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-text)' }}>
              {animal.name}
            </h1>
            <div className="flex gap-2 mt-1">
              <span className="inline-block px-2 py-0.5 rounded-full text-xs font-semibold"
                style={isAlive
                  ? { background: 'var(--color-success-bg)', color: 'var(--color-success-text)' }
                  : { background: 'var(--color-danger-bg)', color: 'var(--color-danger-text)' }}>
                {isAlive ? 'Vivant' : 'Décédé'}
              </span>
            </div>
          </div>
        </div>
        <a href={`/backend/animals/${animal.id}/edit`}
          className="px-3 py-1.5 rounded text-sm font-medium no-underline"
          style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }}>
          Modifier
        </a>
      </div>

      <div className="grid gap-4" style={{ gridTemplateColumns: '1fr 1fr' }}>
        <div className="rounded-lg p-5" style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-card)' }}>
          <h2 className="text-sm font-semibold uppercase tracking-wide mb-4 flex items-center gap-2" style={{ color: 'var(--color-text-muted)' }}>
            <Hash size={14} /> Identification
          </h2>
          <dl className="grid grid-cols-1 gap-y-3">
            {[
              { label: 'Nom',               value: animal.name },
              { label: 'Numéro',            value: animal.number || '—' },
              { label: "N° identification", value: animal.identification_number || '—' },
              { label: 'Race / Variété',    value: animal.variety || '—' },
            ].map(({ label, value }) => (
              <div key={label}>
                <dt className="text-xs mb-0.5" style={{ color: 'var(--color-text-muted)' }}>{label}</dt>
                <dd className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>{value}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="rounded-lg p-5" style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-card)' }}>
          <h2 className="text-sm font-semibold uppercase tracking-wide mb-4 flex items-center gap-2" style={{ color: 'var(--color-text-muted)' }}>
            <Settings size={14} /> Cycle de vie
          </h2>
          <dl className="grid grid-cols-1 gap-y-3">
            {[
              { label: 'Date de naissance', value: animal.born_at?.slice(0, 10) ?? '—' },
              { label: 'Date de décès',     value: animal.dead_at?.slice(0, 10) ?? '—' },
            ].map(({ label, value }) => (
              <div key={label}>
                <dt className="text-xs mb-0.5" style={{ color: 'var(--color-text-muted)' }}>{label}</dt>
                <dd className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>{value}</dd>
              </div>
            ))}
          </dl>
          {animal.description && (
            <div className="mt-4 pt-4" style={{ borderTop: '1px solid var(--color-border)' }}>
              <dt className="text-xs mb-1" style={{ color: 'var(--color-text-muted)' }}>Description</dt>
              <dd className="text-sm" style={{ color: 'var(--color-text)' }}>{animal.description}</dd>
            </div>
          )}
        </div>
      </div>

      <div className="mt-6 rounded-lg" style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-card)' }}>
        <div className="flex items-center gap-2 px-5 py-4" style={{ borderBottom: '1px solid var(--color-border)' }}>
          <Wrench size={16} style={{ color: 'var(--color-text-muted)' }} />
          <h2 className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
            Interventions ({interventions.length})
          </h2>
        </div>
        {interventions.length === 0 ? (
          <p className="px-5 py-4 text-sm" style={{ color: 'var(--color-text-muted)' }}>Aucune intervention enregistrée.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--color-text-muted)' }}>Intervention</th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--color-text-muted)' }}>Date</th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--color-text-muted)' }}>État</th>
              </tr>
            </thead>
            <tbody>
              {interventions.map((iv) => (
                <tr key={iv.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <td className="px-5 py-3">
                    <a href={`/backend/interventions/${iv.id}`} className="no-underline font-medium" style={{ color: 'var(--color-primary)' }}>
                      {iv.name}
                    </a>
                  </td>
                  <td className="px-5 py-3" style={{ color: 'var(--color-text-muted)' }}>
                    {iv.started_at ? new Date(iv.started_at).toLocaleDateString('fr-FR') : '—'}
                  </td>
                  <td className="px-5 py-3" style={{ color: 'var(--color-text)' }}>
                    {STATE_LABELS[iv.state] ?? iv.state}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  )
}

AnimalShow.layout = (page: ReactNode) => <AppShell>{page}</AppShell>
export default AnimalShow
```

- [ ] **Step 4: Run tests**

```bash
cd /Users/yusper/Downloads/SenagrOS/ekylibre-main && yarn vitest run app/frontend/pages/Backend/Animaux/Show.test.tsx --reporter=verbose
```
Expected: 7/7 PASS

- [ ] **Step 5: TypeScript check**

```bash
cd /Users/yusper/Downloads/SenagrOS/ekylibre-main && yarn tsc --noEmit
```

- [ ] **Step 6: Commit**

```bash
git add app/frontend/pages/Backend/Animaux/
git commit -m "feat: add Animaux Show page"
```

---

## Task C1: GanttView component + Productions Index toggle

**Files:**
- Create: `app/frontend/components/productions/GanttView.tsx`
- Create: `app/frontend/components/productions/GanttView.test.tsx`
- Modify: `app/frontend/pages/Backend/Productions/Index.tsx`
- Modify: `app/frontend/pages/Backend/Productions/Index.test.tsx`

### Context

The Productions Index currently shows a flat table. We add a toggle button (Table / Gantt) in the header. The Gantt view renders each production as a horizontal colored bar, positioned proportionally between the earliest `started_on` and latest `stopped_on` across all productions.

**GanttView algorithm:**
1. Compute `minDate = min(all started_on)` and `maxDate = max(all stopped_on ?? started_on + 30days)`
2. Total span in days = `(maxDate - minDate) / msPerDay`
3. For each production: `leftPct = (started - min) / span * 100`, `widthPct = max(2, (end - start) / span * 100)`
4. Render a row: label on left, bar on right using `position: absolute` inside a `position: relative` container

State colors match the existing `STATE_COLORS` in Index.tsx: opened→`#1B6B3A`, aborted→`#D4420A`, finished→`#6B5E4E`.

**Toggle state:** use a `useState<'table' | 'gantt'>` in `ProductionsIndex`. Add two buttons in the header to switch views.

- [ ] **Step 1: Write failing tests for GanttView**

Create `app/frontend/components/productions/GanttView.test.tsx`:

```typescript
import { render, screen } from '@testing-library/react'
import { GanttView } from './GanttView'
import type { Production } from '../../../types/production'

const productions: Production[] = [
  {
    id: 1, name: 'Semis Mil',
    started_on: '2024-01-01', stopped_on: '2024-06-30', state: 'finished',
    activity: { id: 1, name: 'Mil', family: 'plant_farming' },
    cultivable_zone: { id: 1, name: 'Parcelle A' },
    campaign: { id: 1, name: '2024', harvest_year: 2024 },
  },
  {
    id: 2, name: 'Semis Sorgho',
    started_on: '2024-03-01', stopped_on: null, state: 'opened',
    activity: { id: 2, name: 'Sorgho', family: 'plant_farming' },
    cultivable_zone: null,
    campaign: { id: 1, name: '2024', harvest_year: 2024 },
  },
]

it('renders production names', () => {
  render(<GanttView productions={productions} />)
  expect(screen.getByText('Semis Mil')).toBeInTheDocument()
  expect(screen.getByText('Semis Sorgho')).toBeInTheDocument()
})

it('renders a bar for each production', () => {
  render(<GanttView productions={productions} />)
  const bars = document.querySelectorAll('[data-testid="gantt-bar"]')
  expect(bars.length).toBe(2)
})

it('renders empty state when no productions', () => {
  render(<GanttView productions={[]} />)
  expect(screen.getByText(/aucune production/i)).toBeInTheDocument()
})

it('bar for first production has left style', () => {
  render(<GanttView productions={productions} />)
  const bars = document.querySelectorAll('[data-testid="gantt-bar"]')
  const firstBar = bars[0] as HTMLElement
  // First production starts at the beginning — left should be ~0%
  expect(firstBar.style.left).toBe('0%')
})
```

- [ ] **Step 2: Run to verify failure**

```bash
cd /Users/yusper/Downloads/SenagrOS/ekylibre-main && yarn vitest run app/frontend/components/productions/GanttView.test.tsx --reporter=verbose
```
Expected: FAIL

- [ ] **Step 3: Create GanttView.tsx**

```typescript
import type { Production } from '../../types/production'

const MS_PER_DAY = 1000 * 60 * 60 * 24
const FALLBACK_DAYS = 30

const STATE_COLORS: Record<string, string> = {
  opened:   '#1B6B3A',
  aborted:  '#D4420A',
  finished: '#6B5E4E',
}

interface GanttViewProps {
  productions: Production[]
}

export function GanttView({ productions }: GanttViewProps) {
  if (productions.length === 0) {
    return (
      <p className="text-center py-12" style={{ color: 'var(--color-text-muted)' }}>
        Aucune production enregistrée.
      </p>
    )
  }

  const starts = productions.map((p) => new Date(p.started_on).getTime())
  const ends = productions.map((p) =>
    p.stopped_on
      ? new Date(p.stopped_on).getTime()
      : new Date(p.started_on).getTime() + FALLBACK_DAYS * MS_PER_DAY
  )

  const minMs = Math.min(...starts)
  const maxMs = Math.max(...ends)
  const spanMs = maxMs - minMs || MS_PER_DAY

  const toLeftPct = (ms: number) => `${((ms - minMs) / spanMs) * 100}%`
  const toWidthPct = (startMs: number, endMs: number) =>
    `${Math.max(2, ((endMs - startMs) / spanMs) * 100)}%`

  return (
    <div className="rounded-lg overflow-hidden border" style={{ background: 'var(--color-bg-card)', borderColor: 'var(--color-border)' }}>
      {/* Header row */}
      <div className="grid px-3 py-2 border-b" style={{ gridTemplateColumns: '200px 1fr', borderColor: 'var(--color-border)', background: 'var(--color-bg)' }}>
        <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--color-text-muted)' }}>Production</span>
        <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--color-text-muted)' }}>Calendrier</span>
      </div>

      {productions.map((p) => {
        const startMs = new Date(p.started_on).getTime()
        const endMs = p.stopped_on
          ? new Date(p.stopped_on).getTime()
          : startMs + FALLBACK_DAYS * MS_PER_DAY
        const color = STATE_COLORS[p.state] ?? '#6B5E4E'

        return (
          <div
            key={p.id}
            className="grid px-3 py-2 border-b items-center"
            style={{ gridTemplateColumns: '200px 1fr', borderColor: 'var(--color-border)' }}
          >
            <div>
              <div className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>{p.name}</div>
              {p.cultivable_zone && (
                <div className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{p.cultivable_zone.name}</div>
              )}
            </div>
            <div style={{ position: 'relative', height: '24px' }}>
              <div
                data-testid="gantt-bar"
                style={{
                  position: 'absolute',
                  top: '4px',
                  height: '16px',
                  left: toLeftPct(startMs),
                  width: toWidthPct(startMs, endMs),
                  background: color,
                  borderRadius: '3px',
                  opacity: 0.85,
                }}
                title={`${p.started_on} → ${p.stopped_on ?? '…'}`}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}
```

- [ ] **Step 4: Run GanttView tests**

```bash
cd /Users/yusper/Downloads/SenagrOS/ekylibre-main && yarn vitest run app/frontend/components/productions/GanttView.test.tsx --reporter=verbose
```
Expected: 4/4 PASS

- [ ] **Step 5: Update Productions/Index.tsx to add toggle**

In `app/frontend/pages/Backend/Productions/Index.tsx`, add:
1. `import { useState } from 'react'`
2. `import { GanttView } from '../../../components/productions/GanttView'`
3. `import { List, BarChart2 } from 'lucide-react'` (add to existing import or create)
4. Inside `ProductionsIndex`, add: `const [view, setView] = useState<'table' | 'gantt'>('table')`
5. In the header div, add view toggle buttons next to the title
6. Conditionally render table or `<GanttView productions={productions} />`

The updated header and content section:

```typescript
// Add to imports:
import { useState } from 'react'
import { List, BarChart2 } from 'lucide-react'
import { GanttView } from '../../../components/productions/GanttView'

// Inside component, after existing state/variables:
const [view, setView] = useState<'table' | 'gantt'>('table')

// Replace the <h1> block with:
<div className="mb-5 flex items-center justify-between">
  <div>
    <h1 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-text)' }}>
      Productions
    </h1>
    <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>
      {meta.total} production{meta.total !== 1 ? 's' : ''} — page {meta.page}
    </p>
  </div>
  <div className="flex items-center gap-1 rounded border p-0.5" style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg-card)' }}>
    <button
      onClick={() => setView('table')}
      aria-label="Vue tableau"
      className="flex items-center gap-1 px-2 py-1 rounded text-xs"
      style={{
        background: view === 'table' ? 'var(--color-primary)' : 'transparent',
        color: view === 'table' ? '#fff' : 'var(--color-text-muted)',
      }}
    >
      <List size={13} /> Tableau
    </button>
    <button
      onClick={() => setView('gantt')}
      aria-label="Vue Gantt"
      className="flex items-center gap-1 px-2 py-1 rounded text-xs"
      style={{
        background: view === 'gantt' ? 'var(--color-primary)' : 'transparent',
        color: view === 'gantt' ? '#fff' : 'var(--color-text-muted)',
      }}
    >
      <BarChart2 size={13} /> Gantt
    </button>
  </div>
</div>

// Replace the conditional render block with:
{view === 'gantt' ? (
  <GanttView productions={productions} />
) : (
  /* existing table JSX */
)}
```

- [ ] **Step 6: Update Productions/Index.test.tsx to add toggle tests**

Add these tests to the existing file:

```typescript
it('shows table view by default', () => {
  render(<ProductionsIndex productions={prods} meta={meta} />)
  expect(screen.getByRole('button', { name: /vue tableau/i })).toBeInTheDocument()
  expect(screen.getByRole('button', { name: /vue gantt/i })).toBeInTheDocument()
  // Table should be visible by default (check column header)
  expect(screen.getByText('Activité')).toBeInTheDocument()
})

it('switches to gantt view on click', () => {
  render(<ProductionsIndex productions={prods} meta={meta} />)
  fireEvent.click(screen.getByRole('button', { name: /vue gantt/i }))
  expect(document.querySelector('[data-testid="gantt-bar"]')).toBeInTheDocument()
})
```

(You'll need to import `fireEvent` from `@testing-library/react` if not already imported, and have a `prods` fixture with at least one production with `started_on` set.)

- [ ] **Step 7: Run all tests**

```bash
cd /Users/yusper/Downloads/SenagrOS/ekylibre-main && yarn vitest run app/frontend/components/productions/ app/frontend/pages/Backend/Productions/ --reporter=verbose
```
Expected: all PASS

- [ ] **Step 8: TypeScript check**

```bash
cd /Users/yusper/Downloads/SenagrOS/ekylibre-main && yarn tsc --noEmit
```

- [ ] **Step 9: Commit**

```bash
git add app/frontend/components/productions/ app/frontend/pages/Backend/Productions/
git commit -m "feat: add Gantt timeline view to Productions Index"
```

---

## Task D1: Dashboard — 2 new KPIs (workers + productions counts)

**Files:**
- Modify: `app/controllers/backend/dashboards_controller.rb`
- Modify: `app/frontend/types/dashboard.ts`
- Modify: `app/frontend/pages/Backend/Dashboard/Home.tsx`
- Modify: `app/frontend/pages/Backend/Dashboard/Home.test.tsx`

### Context

Add `workers_count` (total active workers) and `productions_count` (productions in current campaign) to the kpis hash. Display them as two new `KpiCard` components on the Dashboard. Icons: `UserCog` and `Sprout` (already imported or add).

**Active workers** = workers with no `dead_at`: `Worker.where(dead_at: nil).count`
**Productions in campaign** = `ActivityProduction.of_campaign(current_campaign).count` — the `of_campaign` scope is defined on `ActivityProduction`.

The `current_campaign` helper is available in `Backend::BaseController`.

- [ ] **Step 1: Update dashboards_controller.rb**

In the `home` action, add to the `kpis` hash:

```ruby
kpis: {
  campaign:          safe_campaign_json,
  area_ha:           safe_area_ha,
  interventions:     safe_intervention_counts,
  expenses_xof:      nil,
  workers_count:     Worker.where(dead_at: nil).count,
  productions_count: begin
                       ActivityProduction.of_campaign(current_campaign).count
                     rescue
                       0
                     end
}
```

- [ ] **Step 2: Update types/dashboard.ts**

In `KpiData`, add two fields:

```typescript
export interface KpiData {
  campaign: Campaign | null
  area_ha: number
  interventions: { active: number; scheduled: number }
  expenses_xof: number | null
  workers_count: number
  productions_count: number
}
```

- [ ] **Step 3: Update Dashboard/Home.tsx**

Add `UserCog` to the lucide-react import. Add two more `KpiCard` entries after the existing 4:

```typescript
// Add to import:
import { Sprout, Map as MapIcon, Activity, CalendarClock, UserCog, Layers } from 'lucide-react'

// Add after the 4th KpiCard:
<KpiCard
  title="Travailleurs actifs"
  value={kpis.workers_count}
  icon={<UserCog size={16} />}
/>
<KpiCard
  title="Productions"
  value={kpis.productions_count}
  icon={<Layers size={16} />}
/>
```

Also update the grid from `repeat(4, 1fr)` to `repeat(3, 1fr)` so 6 cards fit in 2 rows of 3, or keep `repeat(4, 1fr)` if 6 cards per row is fine. Use `repeat(3, 1fr)` for better readability:

```typescript
gridTemplateColumns: 'repeat(3, 1fr)',
```

- [ ] **Step 4: Update Dashboard/Home.test.tsx**

Find the existing test file. The test probably checks for the 4 existing KpiCard titles. Update the mock props to include `workers_count` and `productions_count`, then add two new assertions:

```typescript
// In the props passed to Home:
kpis: {
  campaign: { name: '2024', started_on: '2024-01-01', stopped_on: null },
  area_ha: 150,
  interventions: { active: 3, scheduled: 5 },
  expenses_xof: null,
  workers_count: 12,
  productions_count: 8,
}

// New assertions:
expect(screen.getByText('Travailleurs actifs')).toBeInTheDocument()
expect(screen.getByText('Productions')).toBeInTheDocument()
expect(screen.getByText('12')).toBeInTheDocument()
expect(screen.getByText('8')).toBeInTheDocument()
```

- [ ] **Step 5: Run tests**

```bash
cd /Users/yusper/Downloads/SenagrOS/ekylibre-main && yarn vitest run app/frontend/pages/Backend/Dashboard/ --reporter=verbose
```
Expected: all PASS

- [ ] **Step 6: TypeScript check**

```bash
cd /Users/yusper/Downloads/SenagrOS/ekylibre-main && yarn tsc --noEmit
```
Expected: 0 errors

- [ ] **Step 7: Commit**

```bash
git add app/controllers/backend/dashboards_controller.rb app/frontend/types/dashboard.ts app/frontend/pages/Backend/Dashboard/
git commit -m "feat: add workers_count and productions_count KPIs to Dashboard"
```
