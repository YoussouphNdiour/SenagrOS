# Phase 5 — Migration Budgets Projet : Design Spec

> **For agentic workers:** Use `superpowers:subagent-driven-development` or `superpowers:executing-plans` to implement the plan derived from this spec.

**Goal:** Migrer le module `ProjectBudget` vers Inertia/React avec CRUD complet (Index + Show + Form). Ajouter un lien "Budgets" dans l'AppShell. `ActivityBudget` reste sur son comportement actuel (redirect vers Activities) — hors scope.

**Architecture:** Nouveau dossier `pages/Backend/Budgets/`, types dans `types/budget.ts`, controller `project_budgets_controller.rb` converti de `respond_to` ERB vers Inertia renders explicites. `manage_restfully` remplacé par actions CRUD explicites. Pattern identique à Travailleurs/Animaux.

**Tech Stack:** React 18, TypeScript strict, Inertia.js v2, Vitest + React Testing Library, Ruby on Rails 6 (Ruby 2.6).

---

## File Structure

```
app/frontend/types/budget.ts                              ← new
app/frontend/pages/Backend/Budgets/Index.tsx              ← new
app/frontend/pages/Backend/Budgets/Index.test.tsx         ← new (5 tests)
app/frontend/pages/Backend/Budgets/Show.tsx               ← new
app/frontend/pages/Backend/Budgets/Show.test.tsx          ← new (5 tests)
app/frontend/pages/Backend/Budgets/Form.tsx               ← new
app/frontend/pages/Backend/Budgets/Form.test.tsx          ← new (5 tests)
app/controllers/backend/project_budgets_controller.rb     ← modify
app/frontend/components/AppShell.tsx                      ← add Wallet + nav link
config/routes.rb                                          ← verify only (already correct)
```

---

## TypeScript Types — `types/budget.ts`

```typescript
export interface ProjectBudget {
  id: number
  name: string
  description: string | null
  isacompta_analytic_code: string | null
  purchase_items_count: number
  reception_items_count: number
}

export interface ProjectBudgetFormErrors {
  name?: string[]
  description?: string[]
  isacompta_analytic_code?: string[]
}

export interface BudgetsIndexProps {
  budgets: ProjectBudget[]
  meta: {
    total: number
    page: number
    per_page: number
  }
}

export interface BudgetShowProps {
  budget: ProjectBudget
}

export interface BudgetFormProps {
  budget: ProjectBudget
  errors: ProjectBudgetFormErrors
  mode: 'new' | 'edit'
}
```

---

## Index Page — `pages/Backend/Budgets/Index.tsx`

**Heading:** "Budgets projet"

**Header row:** Titre + compteur total + bouton "Nouveau budget" → `router.visit('/backend/project_budgets/new')`

**Table columns:**
| Colonne | Source | Notes |
|---------|--------|-------|
| Nom | `budget.name` | Lien vers Show |
| Description | `budget.description` | Tronquée à 60 chars, `—` si null |
| Code analytique | `budget.isacompta_analytic_code` | Badge orange "Manquant" si null |
| Actions | — | Voir / Modifier / Supprimer |

**Badge warning:** Si `isacompta_analytic_code === null`, afficher badge `<span>Manquant</span>` en orange (`bg: '#fef3c7', color: '#92400e'`). Reproduit le comportement du controller ERB original.

**Pagination:** 25 par page, boutons Précédent/Suivant via `router.visit` avec `?page=N`.

**Empty state:** "Aucun budget projet enregistré." centré.

**Suppression:** Bouton "Supprimer" → `router.delete('/backend/project_budgets/:id')` avec `window.confirm` avant.

### Full component structure

```tsx
import type { ReactNode } from 'react'
import { router } from '@inertiajs/react'
import { AppShell } from '../../../components/AppShell'
import type { BudgetsIndexProps } from '../../../types/budget'

export default function BudgetsIndex({ budgets, meta }: BudgetsIndexProps) {
  function handleDelete(id: number, name: string) {
    if (!window.confirm(`Supprimer le budget "${name}" ?`)) return
    router.delete(`/backend/project_budgets/${id}`)
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>
          Budgets projet
          <span className="ml-2 text-sm font-normal" style={{ color: 'var(--color-text-muted)' }}>
            ({meta.total})
          </span>
        </h1>
        <button
          onClick={() => router.visit('/backend/project_budgets/new')}
          style={{ background: 'var(--color-primary)', color: '#fff', border: 'none', borderRadius: '0.375rem', padding: '0.5rem 1rem', fontWeight: 500, fontSize: '0.875rem', cursor: 'pointer' }}
        >
          Nouveau budget
        </button>
      </div>

      {budgets.length === 0 ? (
        <p className="text-center py-12" style={{ color: 'var(--color-text-muted)' }}>
          Aucun budget projet enregistré.
        </p>
      ) : (
        <>
          <div style={{ background: 'var(--color-bg-card)', borderRadius: '0.5rem', border: '1px solid var(--color-border)', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                  {['Nom', 'Description', 'Code analytique', 'Actions'].map(h => (
                    <th key={h} className="text-left text-xs font-semibold px-4 py-3" style={{ color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {budgets.map(budget => (
                  <tr key={budget.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                    <td className="px-4 py-3">
                      <a href={`/backend/project_budgets/${budget.id}`} style={{ color: 'var(--color-primary)', textDecoration: 'none', fontWeight: 500 }}>
                        {budget.name}
                      </a>
                    </td>
                    <td className="px-4 py-3 text-sm" style={{ color: 'var(--color-text-muted)' }}>
                      {budget.description ? budget.description.slice(0, 60) + (budget.description.length > 60 ? '…' : '') : '—'}
                    </td>
                    <td className="px-4 py-3">
                      {budget.isacompta_analytic_code ?? (
                        <span style={{ background: '#fef3c7', color: '#92400e', fontSize: '0.75rem', fontWeight: 600, padding: '0.125rem 0.5rem', borderRadius: '9999px' }}>
                          Manquant
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <a href={`/backend/project_budgets/${budget.id}`} style={{ fontSize: '0.8rem', color: 'var(--color-primary)' }}>Voir</a>
                        <a href={`/backend/project_budgets/${budget.id}/edit`} style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Modifier</a>
                        <button onClick={() => handleDelete(budget.id, budget.name)} style={{ fontSize: '0.8rem', color: '#dc2626', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>Supprimer</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {meta.total > meta.per_page && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginTop: '1rem' }}>
              <button
                disabled={meta.page <= 1}
                onClick={() => router.visit(`/backend/project_budgets?page=${meta.page - 1}`)}
                style={{ padding: '0.375rem 0.875rem', borderRadius: '0.375rem', border: '1px solid var(--color-border)', background: 'var(--color-bg-card)', cursor: meta.page <= 1 ? 'not-allowed' : 'pointer', opacity: meta.page <= 1 ? 0.5 : 1 }}
              >
                Précédent
              </button>
              <span className="text-sm px-2 py-1" style={{ color: 'var(--color-text-muted)' }}>
                Page {meta.page}
              </span>
              <button
                disabled={meta.page * meta.per_page >= meta.total}
                onClick={() => router.visit(`/backend/project_budgets?page=${meta.page + 1}`)}
                style={{ padding: '0.375rem 0.875rem', borderRadius: '0.375rem', border: '1px solid var(--color-border)', background: 'var(--color-bg-card)', cursor: meta.page * meta.per_page >= meta.total ? 'not-allowed' : 'pointer', opacity: meta.page * meta.per_page >= meta.total ? 0.5 : 1 }}
              >
                Suivant
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}

BudgetsIndex.layout = (page: ReactNode) => <AppShell>{page}</AppShell>
```

---

## Tests Index — `Index.test.tsx` (5 tests)

```typescript
import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import BudgetsIndex from './Index'
import type { BudgetsIndexProps } from '../../../types/budget'

vi.mock('@inertiajs/react', () => ({
  router: { visit: vi.fn(), delete: vi.fn() },
  usePage: () => ({ props: {}, url: '/backend/project_budgets' }),
}))

const mockBudgets = [
  { id: 1, name: 'Budget Maraîchage', description: 'Budget annuel maraîchage', isacompta_analytic_code: 'MA', purchase_items_count: 3, reception_items_count: 1 },
  { id: 2, name: 'Budget Élevage', description: null, isacompta_analytic_code: null, purchase_items_count: 0, reception_items_count: 0 },
]

const defaultProps: BudgetsIndexProps = {
  budgets: mockBudgets,
  meta: { total: 2, page: 1, per_page: 25 },
}

describe('BudgetsIndex', () => {
  it('renders "Budgets projet" heading', () => {
    render(<BudgetsIndex {...defaultProps} />)
    expect(screen.getByRole('heading', { name: /Budgets projet/ })).toBeInTheDocument()
  })

  it('renders budget names as links', () => {
    render(<BudgetsIndex {...defaultProps} />)
    expect(screen.getByRole('link', { name: 'Budget Maraîchage' })).toBeInTheDocument()
  })

  it('shows Manquant badge when isacompta_analytic_code is null', () => {
    render(<BudgetsIndex {...defaultProps} />)
    expect(screen.getByText('Manquant')).toBeInTheDocument()
  })

  it('shows empty state when no budgets', () => {
    render(<BudgetsIndex budgets={[]} meta={{ total: 0, page: 1, per_page: 25 }} />)
    expect(screen.getByText(/Aucun budget projet/)).toBeInTheDocument()
  })

  it('renders Nouveau budget button', () => {
    render(<BudgetsIndex {...defaultProps} />)
    expect(screen.getByRole('button', { name: /Nouveau budget/ })).toBeInTheDocument()
  })
})
```

---

## Show Page — `pages/Backend/Budgets/Show.tsx`

**Heading:** Nom du budget

**Sections:**
- Carte info : Nom, Description (ou "—"), Code analytique (ou badge "Manquant")
- Compteurs liés : "X article(s) d'achat", "Y réception(s)" — lecture seule, sans lien (YAGNI)
- Boutons : "Modifier" → `/backend/project_budgets/:id/edit` | "Retour" → `/backend/project_budgets`

### Full component structure

```tsx
import type { ReactNode } from 'react'
import { router } from '@inertiajs/react'
import { AppShell } from '../../../components/AppShell'
import type { BudgetShowProps } from '../../../types/budget'

export default function BudgetShow({ budget }: BudgetShowProps) {
  const card: React.CSSProperties = {
    background: 'var(--color-bg-card)',
    borderRadius: '0.5rem',
    border: '1px solid var(--color-border)',
    padding: '1.5rem',
    marginBottom: '1rem',
  }

  const row = { display: 'flex', flexDirection: 'column' as const, gap: '0.25rem', marginBottom: '1rem' }
  const label = { fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase' as const, letterSpacing: '0.05em' }
  const value = { fontSize: '0.95rem', color: 'var(--color-text)' }

  return (
    <div className="p-8 max-w-2xl">
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => router.visit('/backend/project_budgets')} style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
          ← Retour
        </button>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>
          {budget.name}
        </h1>
      </div>

      <div style={card}>
        <div style={row}>
          <span style={label}>Nom</span>
          <span style={value}>{budget.name}</span>
        </div>
        <div style={row}>
          <span style={label}>Description</span>
          <span style={value}>{budget.description ?? '—'}</span>
        </div>
        <div style={row}>
          <span style={label}>Code analytique (isacompta)</span>
          {budget.isacompta_analytic_code ? (
            <span style={value}>{budget.isacompta_analytic_code}</span>
          ) : (
            <span style={{ background: '#fef3c7', color: '#92400e', fontSize: '0.75rem', fontWeight: 600, padding: '0.125rem 0.5rem', borderRadius: '9999px', display: 'inline-block' }}>
              Manquant
            </span>
          )}
        </div>
        <div style={{ display: 'flex', gap: '2rem', marginTop: '0.5rem' }}>
          <span className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
            {budget.purchase_items_count} article(s) d'achat
          </span>
          <span className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
            {budget.reception_items_count} réception(s)
          </span>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '0.75rem' }}>
        <button
          onClick={() => router.visit(`/backend/project_budgets/${budget.id}/edit`)}
          style={{ background: 'var(--color-primary)', color: '#fff', border: 'none', borderRadius: '0.375rem', padding: '0.5rem 1.25rem', fontWeight: 500, fontSize: '0.875rem', cursor: 'pointer' }}
        >
          Modifier
        </button>
        <button
          onClick={() => router.visit('/backend/project_budgets')}
          style={{ background: 'var(--color-bg-card)', color: 'var(--color-text)', border: '1px solid var(--color-border)', borderRadius: '0.375rem', padding: '0.5rem 1.25rem', fontWeight: 500, fontSize: '0.875rem', cursor: 'pointer' }}
        >
          Retour
        </button>
      </div>
    </div>
  )
}

BudgetShow.layout = (page: ReactNode) => <AppShell>{page}</AppShell>
```

---

## Tests Show — `Show.test.tsx` (5 tests)

```typescript
import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import BudgetShow from './Show'
import type { BudgetShowProps } from '../../../types/budget'

vi.mock('@inertiajs/react', () => ({
  router: { visit: vi.fn() },
  usePage: () => ({ props: {}, url: '/backend/project_budgets/1' }),
}))

const mockBudget = {
  id: 1,
  name: 'Budget Maraîchage',
  description: 'Budget annuel pour le maraîchage',
  isacompta_analytic_code: 'MA',
  purchase_items_count: 3,
  reception_items_count: 1,
}

function renderShow(overrides = {}) {
  return render(<BudgetShow budget={{ ...mockBudget, ...overrides }} />)
}

describe('BudgetShow', () => {
  it('renders budget name as heading', () => {
    renderShow()
    expect(screen.getByRole('heading', { name: 'Budget Maraîchage' })).toBeInTheDocument()
  })

  it('renders description', () => {
    renderShow()
    expect(screen.getByText('Budget annuel pour le maraîchage')).toBeInTheDocument()
  })

  it('renders isacompta_analytic_code', () => {
    renderShow()
    expect(screen.getByText('MA')).toBeInTheDocument()
  })

  it('shows Manquant badge when no analytic code', () => {
    renderShow({ isacompta_analytic_code: null })
    expect(screen.getByText('Manquant')).toBeInTheDocument()
  })

  it('renders purchase_items_count and reception_items_count', () => {
    renderShow()
    expect(screen.getByText(/3 article\(s\) d'achat/)).toBeInTheDocument()
    expect(screen.getByText(/1 réception\(s\)/)).toBeInTheDocument()
  })
})
```

---

## Form Page — `pages/Backend/Budgets/Form.tsx`

**Heading contextuel :** "Nouveau budget" (mode `new`) ou "Modifier le budget" (mode `edit`)

**Champs :**
| Champ | Input | Validation |
|-------|-------|-----------|
| Nom | `<input type="text" required>` | Obligatoire |
| Description | `<textarea>` | Optionnel |
| Code analytique | `<input type="text" maxLength={2}>` | Optionnel, max 2 chars |

**Erreurs serveur :** affichées sous chaque champ (`errors.name?.[0]`, etc.)

**Submit :** `router.post('/backend/project_budgets', data)` (new) ou `router.patch('/backend/project_budgets/:id', data)` (edit)

**Annuler :** → `router.visit('/backend/project_budgets/:id')` (edit) ou `/backend/project_budgets` (new)

### Full component structure

```tsx
import type { ReactNode } from 'react'
import { useState } from 'react'
import { router } from '@inertiajs/react'
import { AppShell } from '../../../components/AppShell'
import type { BudgetFormProps } from '../../../types/budget'

export default function BudgetForm({ budget, errors, mode }: BudgetFormProps) {
  const [name, setName] = useState(budget.name ?? '')
  const [description, setDescription] = useState(budget.description ?? '')
  const [analytique, setAnalytique] = useState(budget.isacompta_analytic_code ?? '')
  const [submitting, setSubmitting] = useState(false)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    const data = { project_budget: { name, description, isacompta_analytic_code: analytique || null } }
    if (mode === 'new') {
      router.post('/backend/project_budgets', data, { onFinish: () => setSubmitting(false) })
    } else {
      router.patch(`/backend/project_budgets/${budget.id}`, data, { onFinish: () => setSubmitting(false) })
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', border: '1px solid var(--color-border)', borderRadius: '0.375rem',
    padding: '0.5rem 0.75rem', fontSize: '0.875rem', background: 'var(--color-bg)',
    color: 'var(--color-text)',
  }

  return (
    <div className="p-8 max-w-lg">
      <h1 className="text-2xl font-bold mb-6" style={{ color: 'var(--color-text)' }}>
        {mode === 'new' ? 'Nouveau budget' : 'Modifier le budget'}
      </h1>

      <form
        aria-label={mode === 'new' ? 'Nouveau budget' : 'Modifier le budget'}
        onSubmit={handleSubmit}
        style={{ background: 'var(--color-bg-card)', borderRadius: '0.5rem', border: '1px solid var(--color-border)', padding: '1.5rem' }}
      >
        {/* Nom */}
        <div className="mb-4">
          <label htmlFor="budget-name" className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text)' }}>
            Nom <span style={{ color: '#dc2626' }}>*</span>
          </label>
          <input id="budget-name" type="text" required value={name} onChange={e => setName(e.target.value)} style={inputStyle} />
          {errors.name && <p className="text-xs mt-1" style={{ color: '#dc2626' }}>{errors.name[0]}</p>}
        </div>

        {/* Description */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text)' }}>
            Description
          </label>
          <textarea value={description} onChange={e => setDescription(e.target.value)} rows={4} style={{ ...inputStyle, resize: 'vertical' }} />
          {errors.description && <p className="text-xs mt-1" style={{ color: '#dc2626' }}>{errors.description[0]}</p>}
        </div>

        {/* Code analytique */}
        <div className="mb-6">
          <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text)' }}>
            Code analytique isacompta <span className="text-xs font-normal" style={{ color: 'var(--color-text-muted)' }}>(2 caractères max)</span>
          </label>
          <input
            type="text"
            maxLength={2}
            value={analytique}
            onChange={e => setAnalytique(e.target.value)}
            placeholder="ex: MA"
            style={{ ...inputStyle, width: '6rem' }}
          />
          {errors.isacompta_analytic_code && <p className="text-xs mt-1" style={{ color: '#dc2626' }}>{errors.isacompta_analytic_code[0]}</p>}
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            type="submit"
            disabled={submitting}
            style={{ background: 'var(--color-primary)', color: '#fff', border: 'none', borderRadius: '0.375rem', padding: '0.5rem 1.25rem', fontWeight: 500, fontSize: '0.875rem', cursor: submitting ? 'not-allowed' : 'pointer', opacity: submitting ? 0.7 : 1 }}
          >
            {submitting ? 'Enregistrement…' : 'Enregistrer'}
          </button>
          <button
            type="button"
            onClick={() => router.visit(mode === 'edit' ? `/backend/project_budgets/${budget.id}` : '/backend/project_budgets')}
            style={{ background: 'var(--color-bg-card)', color: 'var(--color-text)', border: '1px solid var(--color-border)', borderRadius: '0.375rem', padding: '0.5rem 1.25rem', fontWeight: 500, fontSize: '0.875rem', cursor: 'pointer' }}
          >
            Annuler
          </button>
        </div>
      </form>
    </div>
  )
}

BudgetForm.layout = (page: ReactNode) => <AppShell>{page}</AppShell>
```

---

## Tests Form — `Form.test.tsx` (5 tests)

```typescript
import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import BudgetForm from './Form'
import type { BudgetFormProps } from '../../../types/budget'

vi.mock('@inertiajs/react', () => ({
  router: { post: vi.fn(), patch: vi.fn(), visit: vi.fn() },
  usePage: () => ({ props: {}, url: '/backend/project_budgets/new' }),
}))

const emptyBudget = { id: 0, name: '', description: null, isacompta_analytic_code: null, purchase_items_count: 0, reception_items_count: 0 }
const existingBudget = { id: 1, name: 'Budget Maraîchage', description: 'Desc', isacompta_analytic_code: 'MA', purchase_items_count: 0, reception_items_count: 0 }

describe('BudgetForm', () => {
  it('renders "Nouveau budget" heading in new mode', () => {
    render(<BudgetForm budget={emptyBudget} errors={{}} mode="new" />)
    expect(screen.getByRole('heading', { name: 'Nouveau budget' })).toBeInTheDocument()
  })

  it('renders "Modifier le budget" heading in edit mode', () => {
    render(<BudgetForm budget={existingBudget} errors={{}} mode="edit" />)
    expect(screen.getByRole('heading', { name: 'Modifier le budget' })).toBeInTheDocument()
  })

  it('renders name input as required', () => {
    render(<BudgetForm budget={emptyBudget} errors={{}} mode="new" />)
    const input = screen.getByLabelText(/Nom/)
    expect(input).toBeRequired()
  })

  it('renders analytic code input with maxLength 2', () => {
    render(<BudgetForm budget={emptyBudget} errors={{}} mode="new" />)
    const input = screen.getByPlaceholderText('ex: MA')
    expect(input).toHaveAttribute('maxLength', '2')
  })

  it('shows server error under name field', () => {
    render(<BudgetForm budget={emptyBudget} errors={{ name: ['est obligatoire'] }} mode="new" />)
    expect(screen.getByText('est obligatoire')).toBeInTheDocument()
  })
})
```

---

## Rails Controller — `project_budgets_controller.rb`

Remplacer le controller existant par :

```ruby
module Backend
  class ProjectBudgetsController < Backend::BaseController
    layout 'inertia', only: %i[index show new edit]

    before_action :set_budget, only: %i[show edit update destroy]

    def index
      scope = ProjectBudget.order(:name).page(params[:page]).per(25)
      budgets = scope.map { |b|
        {
          id:                      b.id,
          name:                    b.name.to_s,
          description:             b.description,
          isacompta_analytic_code: b.isacompta_analytic_code,
          purchase_items_count:    b.purchase_items.count,
          reception_items_count:   b.reception_items.count
        }
      }
      render inertia: 'Backend/Budgets/Index', props: {
        budgets: budgets,
        meta: {
          total:    scope.total_count,
          page:     (params[:page] || 1).to_i,
          per_page: 25
        }
      }
    end

    def show
      render inertia: 'Backend/Budgets/Show', props: { budget: budget_json(@budget) }
    end

    def new
      @budget = ProjectBudget.new
      render inertia: 'Backend/Budgets/Form', props: {
        budget: budget_json(@budget),
        errors: {},
        mode:   'new'
      }
    end

    def edit
      render inertia: 'Backend/Budgets/Form', props: {
        budget: budget_json(@budget),
        errors: {},
        mode:   'edit'
      }
    end

    def create
      @budget = ProjectBudget.new(budget_params)
      if @budget.save
        redirect_to backend_project_budget_path(@budget)
      else
        render inertia: 'Backend/Budgets/Form', props: {
          budget: budget_json(@budget),
          errors: @budget.errors.messages.each_with_object({}) { |(k, v), h| h[k.to_s] = v },
          mode:   'new'
        }, status: :unprocessable_entity
      end
    end

    def update
      if @budget.update(budget_params)
        redirect_to backend_project_budget_path(@budget)
      else
        render inertia: 'Backend/Budgets/Form', props: {
          budget: budget_json(@budget),
          errors: @budget.errors.messages.each_with_object({}) { |(k, v), h| h[k.to_s] = v },
          mode:   'edit'
        }, status: :unprocessable_entity
      end
    end

    def destroy
      @budget.destroy
      redirect_to backend_project_budgets_path
    end

    private

    def set_budget
      @budget = ProjectBudget.find(params[:id])
    end

    def budget_params
      params.require(:project_budget).permit(:name, :description, :isacompta_analytic_code)
    end

    def budget_json(budget)
      {
        id:                      budget.id || 0,
        name:                    budget.name.to_s,
        description:             budget.description,
        isacompta_analytic_code: budget.isacompta_analytic_code,
        purchase_items_count:    budget.persisted? ? budget.purchase_items.count : 0,
        reception_items_count:   budget.persisted? ? budget.reception_items.count : 0
      }
    end
  end
end
```

**Ruby 2.6 constraints :** No `filter_map`, no `then`, no `yield_self`. `.each_with_object` pour les erreurs.

---

## AppShell Navigation — `components/AppShell.tsx`

Ajouter `Wallet` à l'import lucide-react. Ajouter après Alertes dans `NAV_LINKS` :

```typescript
{ href: '/backend/project_budgets', label: 'Budgets', icon: Wallet },
```

---

## Routes — `config/routes.rb`

Vérifier uniquement — `resources :project_budgets, concerns: %i[list unroll]` est déjà déclaré. Aucune modification requise.

---

## Scope Exclusions (YAGNI)

- Pas de lien depuis les articles d'achat/réceptions vers le budget (YAGNI)
- Pas de filtres sur l'index (liste courte, max quelques dizaines)
- Pas d'import CSV
- Pas d'historique des modifications
- `ActivityBudgets` hors scope — redirect vers Activities conservé
