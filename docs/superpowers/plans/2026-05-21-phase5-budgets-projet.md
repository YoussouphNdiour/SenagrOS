# Phase 5 — Migration ProjectBudgets Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrer le module `ProjectBudget` vers Inertia/React avec CRUD complet (Index + Show + Form) + lien AppShell.

**Architecture:** Nouveau dossier `pages/Backend/Budgets/`, types dans `types/budget.ts`, controller `project_budgets_controller.rb` converti de `respond_to` ERB vers renders Inertia explicites (`manage_restfully` retiré). Pattern identique à Travailleurs/Animaux existants.

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
app/controllers/backend/project_budgets_controller.rb     ← modify (full rewrite)
app/frontend/components/AppShell.tsx                      ← add Wallet icon + nav link
config/routes.rb                                          ← verify only (already correct)
```

---

## Task 1: TypeScript Types

**Files:**
- Create: `app/frontend/types/budget.ts`

- [ ] **Step 1: Create `budget.ts`**

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

- [ ] **Step 2: TypeScript check**

```bash
yarn tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add app/frontend/types/budget.ts
git commit -m "feat: add ProjectBudget TypeScript types"
```

---

## Task 2: TDD — Index Failing Tests

**Files:**
- Create: `app/frontend/pages/Backend/Budgets/Index.test.tsx`

- [ ] **Step 1: Create directory and test file**

```bash
mkdir -p app/frontend/pages/Backend/Budgets
```

Then create `app/frontend/pages/Backend/Budgets/Index.test.tsx`:

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
  {
    id: 1,
    name: 'Budget Maraîchage',
    description: 'Budget annuel maraîchage',
    isacompta_analytic_code: 'MA',
    purchase_items_count: 3,
    reception_items_count: 1,
  },
  {
    id: 2,
    name: 'Budget Élevage',
    description: null,
    isacompta_analytic_code: null,
    purchase_items_count: 0,
    reception_items_count: 0,
  },
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

- [ ] **Step 2: Run — confirm 5 FAIL**

```bash
yarn vitest run app/frontend/pages/Backend/Budgets/Index.test.tsx 2>&1 | tail -10
```

Expected: 5 failing (module not found).

- [ ] **Step 3: Commit failing tests**

```bash
git add app/frontend/pages/Backend/Budgets/Index.test.tsx
git commit -m "test: add 5 failing BudgetsIndex tests (TDD red)"
```

---

## Task 3: Index Component

**Files:**
- Create: `app/frontend/pages/Backend/Budgets/Index.tsx`

- [ ] **Step 1: Create `Index.tsx`**

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
          Budgets projet{' '}
          <span className="text-sm font-normal" style={{ color: 'var(--color-text-muted)' }}>
            ({meta.total})
          </span>
        </h1>
        <button
          onClick={() => router.visit('/backend/project_budgets/new')}
          style={{
            background: 'var(--color-primary)', color: '#fff', border: 'none',
            borderRadius: '0.375rem', padding: '0.5rem 1rem', fontWeight: 500,
            fontSize: '0.875rem', cursor: 'pointer',
          }}
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
                      <a
                        href={`/backend/project_budgets/${budget.id}`}
                        style={{ color: 'var(--color-primary)', textDecoration: 'none', fontWeight: 500 }}
                      >
                        {budget.name}
                      </a>
                    </td>
                    <td className="px-4 py-3 text-sm" style={{ color: 'var(--color-text-muted)' }}>
                      {budget.description
                        ? budget.description.slice(0, 60) + (budget.description.length > 60 ? '…' : '')
                        : '—'}
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
                        <button
                          onClick={() => handleDelete(budget.id, budget.name)}
                          style={{ fontSize: '0.8rem', color: '#dc2626', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                        >
                          Supprimer
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

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

- [ ] **Step 2: Run tests — confirm 5/5 PASS**

```bash
yarn vitest run app/frontend/pages/Backend/Budgets/Index.test.tsx --reporter=verbose
```

Expected: **5/5 PASS**

- [ ] **Step 3: TypeScript check**

```bash
yarn tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add app/frontend/pages/Backend/Budgets/Index.tsx
git commit -m "feat: implement BudgetsIndex page — 5/5 tests pass"
```

---

## Task 4: TDD — Show Failing Tests

**Files:**
- Create: `app/frontend/pages/Backend/Budgets/Show.test.tsx`

- [ ] **Step 1: Create `Show.test.tsx`**

```typescript
import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import BudgetShow from './Show'

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

function renderShow(overrides: Partial<typeof mockBudget> = {}) {
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

- [ ] **Step 2: Run — confirm 5 FAIL**

```bash
yarn vitest run app/frontend/pages/Backend/Budgets/Show.test.tsx 2>&1 | tail -10
```

Expected: 5 failing (module not found).

- [ ] **Step 3: Commit failing tests**

```bash
git add app/frontend/pages/Backend/Budgets/Show.test.tsx
git commit -m "test: add 5 failing BudgetShow tests (TDD red)"
```

---

## Task 5: Show Component

**Files:**
- Create: `app/frontend/pages/Backend/Budgets/Show.tsx`

- [ ] **Step 1: Create `Show.tsx`**

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

  const row: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: '0.25rem', marginBottom: '1rem' }
  const labelStyle: React.CSSProperties = { fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }
  const valueStyle: React.CSSProperties = { fontSize: '0.95rem', color: 'var(--color-text)' }

  return (
    <div className="p-8 max-w-2xl">
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => router.visit('/backend/project_budgets')}
          style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
        >
          ← Retour
        </button>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>
          {budget.name}
        </h1>
      </div>

      <div style={card}>
        <div style={row}>
          <span style={labelStyle}>Nom</span>
          <span style={valueStyle}>{budget.name}</span>
        </div>
        <div style={row}>
          <span style={labelStyle}>Description</span>
          <span style={valueStyle}>{budget.description ?? '—'}</span>
        </div>
        <div style={row}>
          <span style={labelStyle}>Code analytique (isacompta)</span>
          {budget.isacompta_analytic_code ? (
            <span style={valueStyle}>{budget.isacompta_analytic_code}</span>
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

- [ ] **Step 2: Run tests — confirm 5/5 PASS**

```bash
yarn vitest run app/frontend/pages/Backend/Budgets/Show.test.tsx --reporter=verbose
```

Expected: **5/5 PASS**

- [ ] **Step 3: TypeScript check**

```bash
yarn tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add app/frontend/pages/Backend/Budgets/Show.tsx
git commit -m "feat: implement BudgetShow page — 5/5 tests pass"
```

---

## Task 6: TDD — Form Failing Tests

**Files:**
- Create: `app/frontend/pages/Backend/Budgets/Form.test.tsx`

- [ ] **Step 1: Create `Form.test.tsx`**

```typescript
import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import BudgetForm from './Form'

vi.mock('@inertiajs/react', () => ({
  router: { post: vi.fn(), patch: vi.fn(), visit: vi.fn() },
  usePage: () => ({ props: {}, url: '/backend/project_budgets/new' }),
}))

const emptyBudget = {
  id: 0,
  name: '',
  description: null,
  isacompta_analytic_code: null,
  purchase_items_count: 0,
  reception_items_count: 0,
}

const existingBudget = {
  id: 1,
  name: 'Budget Maraîchage',
  description: 'Desc',
  isacompta_analytic_code: 'MA',
  purchase_items_count: 0,
  reception_items_count: 0,
}

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

- [ ] **Step 2: Run — confirm 5 FAIL**

```bash
yarn vitest run app/frontend/pages/Backend/Budgets/Form.test.tsx 2>&1 | tail -10
```

Expected: 5 failing (module not found).

- [ ] **Step 3: Commit failing tests**

```bash
git add app/frontend/pages/Backend/Budgets/Form.test.tsx
git commit -m "test: add 5 failing BudgetForm tests (TDD red)"
```

---

## Task 7: Form Component

**Files:**
- Create: `app/frontend/pages/Backend/Budgets/Form.tsx`

- [ ] **Step 1: Create `Form.tsx`**

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
    const data = {
      project_budget: {
        name,
        description,
        isacompta_analytic_code: analytique || null,
      },
    }
    if (mode === 'new') {
      router.post('/backend/project_budgets', data, { onFinish: () => setSubmitting(false) })
    } else {
      router.patch(`/backend/project_budgets/${budget.id}`, data, { onFinish: () => setSubmitting(false) })
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    border: '1px solid var(--color-border)',
    borderRadius: '0.375rem',
    padding: '0.5rem 0.75rem',
    fontSize: '0.875rem',
    background: 'var(--color-bg)',
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
          <input
            id="budget-name"
            type="text"
            required
            value={name}
            onChange={e => setName(e.target.value)}
            style={inputStyle}
          />
          {errors.name && <p className="text-xs mt-1" style={{ color: '#dc2626' }}>{errors.name[0]}</p>}
        </div>

        {/* Description */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text)' }}>
            Description
          </label>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            rows={4}
            style={{ ...inputStyle, resize: 'vertical' }}
          />
          {errors.description && <p className="text-xs mt-1" style={{ color: '#dc2626' }}>{errors.description[0]}</p>}
        </div>

        {/* Code analytique */}
        <div className="mb-6">
          <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text)' }}>
            Code analytique isacompta{' '}
            <span className="text-xs font-normal" style={{ color: 'var(--color-text-muted)' }}>(2 caractères max)</span>
          </label>
          <input
            type="text"
            maxLength={2}
            value={analytique}
            onChange={e => setAnalytique(e.target.value)}
            placeholder="ex: MA"
            style={{ ...inputStyle, width: '6rem' }}
          />
          {errors.isacompta_analytic_code && (
            <p className="text-xs mt-1" style={{ color: '#dc2626' }}>{errors.isacompta_analytic_code[0]}</p>
          )}
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            type="submit"
            disabled={submitting}
            style={{
              background: 'var(--color-primary)', color: '#fff', border: 'none',
              borderRadius: '0.375rem', padding: '0.5rem 1.25rem', fontWeight: 500,
              fontSize: '0.875rem', cursor: submitting ? 'not-allowed' : 'pointer',
              opacity: submitting ? 0.7 : 1,
            }}
          >
            {submitting ? 'Enregistrement…' : 'Enregistrer'}
          </button>
          <button
            type="button"
            onClick={() => router.visit(
              mode === 'edit'
                ? `/backend/project_budgets/${budget.id}`
                : '/backend/project_budgets'
            )}
            style={{
              background: 'var(--color-bg-card)', color: 'var(--color-text)',
              border: '1px solid var(--color-border)', borderRadius: '0.375rem',
              padding: '0.5rem 1.25rem', fontWeight: 500, fontSize: '0.875rem', cursor: 'pointer',
            }}
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

- [ ] **Step 2: Run tests — confirm 5/5 PASS**

```bash
yarn vitest run app/frontend/pages/Backend/Budgets/Form.test.tsx --reporter=verbose
```

Expected: **5/5 PASS**

- [ ] **Step 3: TypeScript check**

```bash
yarn tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add app/frontend/pages/Backend/Budgets/Form.tsx
git commit -m "feat: implement BudgetForm page — 5/5 tests pass"
```

---

## Task 8: Rails Controller

**Files:**
- Modify: `app/controllers/backend/project_budgets_controller.rb`

- [ ] **Step 1: Read current file**

```bash
cat app/controllers/backend/project_budgets_controller.rb
```

Note the current structure (uses `manage_restfully` and `respond_to`). Replace entirely.

- [ ] **Step 2: Rewrite controller**

Replace the full content of `app/controllers/backend/project_budgets_controller.rb` with:

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

- [ ] **Step 3: Verify Ruby syntax**

```bash
ruby -c app/controllers/backend/project_budgets_controller.rb
```

Expected: `Syntax OK`

- [ ] **Step 4: Rubocop**

```bash
bundle exec rubocop app/controllers/backend/project_budgets_controller.rb -a
```

Expected: no remaining offenses (or auto-fixed).

- [ ] **Step 5: Verify routes**

```bash
bundle exec rails routes | grep project_budget
```

Expected: lines including `backend_project_budgets GET /backend/project_budgets`, `backend_project_budget GET /backend/project_budgets/:id`, `new_backend_project_budget GET /backend/project_budgets/new`, `edit_backend_project_budget GET /backend/project_budgets/:id/edit`.

- [ ] **Step 6: Commit**

```bash
git add app/controllers/backend/project_budgets_controller.rb
git commit -m "feat: migrate ProjectBudgetsController to Inertia renders"
```

---

## Task 9: AppShell Nav Link

**Files:**
- Modify: `app/frontend/components/AppShell.tsx`

- [ ] **Step 1: Read current AppShell**

Read `app/frontend/components/AppShell.tsx` to find the lucide-react import line and the NAV_LINKS array.

- [ ] **Step 2: Add `Wallet` to lucide-react import**

Locate the import line (starts with `import {` and contains `Bell`). Add `Wallet` to it. Example result:

```typescript
import {
  LayoutDashboard, Wrench, Map, Sprout, BookOpen, Settings, Calendar, Users,
  Tractor, UserCog, PawPrint, Activity, ShoppingCart, ShoppingBag, Package, Bell, Wallet,
} from 'lucide-react'
```

- [ ] **Step 3: Add Budgets to NAV_LINKS**

After the Alertes entry (`{ href: '/backend/alerts', label: 'Alertes', icon: Bell }`), add:

```typescript
{ href: '/backend/project_budgets', label: 'Budgets', icon: Wallet },
```

- [ ] **Step 4: TypeScript check**

```bash
yarn tsc --noEmit
```

Expected: no errors.

- [ ] **Step 5: Full vitest run**

```bash
npx vitest run 2>&1 | tail -10
```

Expected: all tests pass (15 new + existing = no regressions).

- [ ] **Step 6: Commit**

```bash
git add app/frontend/components/AppShell.tsx
git commit -m "feat: add Budgets nav link to AppShell"
```
