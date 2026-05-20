# Phase 1c — Réceptions Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate the Réceptions module (list, detail, form) from Rails HAML to React 18 + TypeScript via Inertia.js v2, and wire the "Créer une facture" button using the existing `InvoiceableItemsFilter` service.

**Architecture:** `ReceptionsController` gains explicit `index`, `show`, `edit`, `new`, `create`, `update` actions with `render inertia:`. A shared `ReceptionItemsEditor` handles line-item editing (no tax calculation). `purchase_invoices#new` is extended with a `reception_id` param that pre-fills the `FacturesForm` via `InvoiceableItemsFilter`. The `give` action (POST → redirect) stays untouched.

**Tech Stack:** React 18, TypeScript strict, `@inertiajs/react`, `@inertiajs/core`, Lucide React, CSS custom properties from `tokens.css`, Vitest + React Testing Library.

---

## File Map

| Action | File |
|--------|------|
| Create | `app/frontend/types/reception.ts` |
| Create | `app/frontend/components/achats/AchatsTabs.tsx` |
| Modify (×6) | All pages in `app/frontend/pages/Backend/Achats/` — replace inline `AchatsTabs` |
| Create | `app/frontend/components/receptions/ReceptionItemsEditor.tsx` |
| Create | `app/frontend/components/receptions/ReceptionItemsEditor.test.tsx` |
| Create | `app/frontend/pages/Backend/Receptions/ReceptionsIndex.tsx` |
| Create | `app/frontend/pages/Backend/Receptions/ReceptionsIndex.test.tsx` |
| Create | `app/frontend/pages/Backend/Receptions/ReceptionsShow.tsx` |
| Create | `app/frontend/pages/Backend/Receptions/ReceptionsShow.test.tsx` |
| Create | `app/frontend/pages/Backend/Receptions/ReceptionsForm.tsx` |
| Create | `app/frontend/pages/Backend/Receptions/ReceptionsForm.test.tsx` |
| Modify | `app/controllers/backend/receptions_controller.rb` |
| Modify | `app/controllers/backend/purchase_invoices_controller.rb` |

---

## Task 1 — TypeScript types

**Files:**
- Create: `app/frontend/types/reception.ts`

- [ ] **Step 1: Create the types file**

```typescript
// app/frontend/types/reception.ts
export type ReceptionState = 'draft' | 'given'
export type ReceptionReconciliationState = 'to_reconcile' | 'reconcile'
export type ReceptionItemRole = 'merchandise' | 'fees' | 'service'

export interface ReceptionSupplier {
  id: number
  full_name: string
}

export interface ReceptionPurchaseOrder {
  id: number
  number: string
}

export interface ReceptionItem {
  id: number | null
  variant_name: string | null
  conditioning_quantity: number
  unit_pretax_amount: number
  role: ReceptionItemRole
  non_compliant: boolean
  annotation: string | null
  purchase_invoice_item_id: number | null  // null = uninvoiced
  _destroy?: boolean
}

export interface Reception {
  id: number
  number: string
  reference_number: string | null
  state: ReceptionState
  planned_at: string           // ISO date
  given_at: string | null      // ISO date — null when draft
  supplier: ReceptionSupplier
  purchase_order: ReceptionPurchaseOrder | null
  reconciliation_state: ReceptionReconciliationState
  pretax_amount: number
  currency: string
  items: ReceptionItem[]
  destroyable: boolean
  invoiceable: boolean         // = reconciliation_state === 'to_reconcile' && state === 'given'
}

export interface ReceptionsIndexProps {
  receptions: Reception[]
  filters: { q?: string; state?: ReceptionState[] }
  meta: { current_page: number; total_pages: number; total_count: number }
}

export interface ReceptionsShowProps {
  reception: Reception
}

export interface ReceptionsFormProps {
  reception: Partial<Reception> & { id?: number }
  purchase_orders: ReceptionPurchaseOrder[]
  errors: Record<string, string[]>
}
```

- [ ] **Step 2: Type-check**

```bash
cd app/frontend && yarn tsc --noEmit 2>&1 | head -20
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add app/frontend/types/reception.ts
git commit -m "feat: add TypeScript types for Réceptions module"
```

---

## Task 2 — Extract AchatsTabs shared component

**Context:** The inline `AchatsTabs` function is currently copy-pasted in all 6 Achats pages (`CommandesIndex`, `CommandesShow`, `CommandesForm`, `FacturesIndex`, `FacturesShow`, `FacturesForm`). This task extracts it to a shared component with a 3rd "Réceptions" tab, then replaces the inline copies.

**Files:**
- Create: `app/frontend/components/achats/AchatsTabs.tsx`
- Modify: `app/frontend/pages/Backend/Achats/CommandesIndex.tsx`
- Modify: `app/frontend/pages/Backend/Achats/CommandesShow.tsx`
- Modify: `app/frontend/pages/Backend/Achats/CommandesForm.tsx`
- Modify: `app/frontend/pages/Backend/Achats/FacturesIndex.tsx`
- Modify: `app/frontend/pages/Backend/Achats/FacturesShow.tsx`
- Modify: `app/frontend/pages/Backend/Achats/FacturesForm.tsx`

- [ ] **Step 1: Create the shared AchatsTabs component**

```typescript
// app/frontend/components/achats/AchatsTabs.tsx
import { usePage } from '@inertiajs/react'

export default function AchatsTabs() {
  const { url } = usePage()
  const tabs = [
    { href: '/backend/purchase_orders',   label: 'Commandes' },
    { href: '/backend/purchase_invoices', label: 'Factures' },
    { href: '/backend/receptions',        label: 'Réceptions' },
  ]
  return (
    <div style={{ display: 'flex', gap: '0', marginBottom: '1.5rem', borderBottom: '2px solid var(--color-border)' }}>
      {tabs.map(tab => {
        const active = url.startsWith(tab.href)
        return (
          <a
            key={tab.href}
            href={tab.href}
            style={{
              padding: '0.5rem 1.25rem',
              fontWeight: active ? 600 : 400,
              borderBottom: active ? '2px solid var(--color-primary)' : '2px solid transparent',
              marginBottom: '-2px',
              color: active ? 'var(--color-primary)' : 'var(--color-text-muted)',
              textDecoration: 'none',
              fontSize: '0.9375rem',
            }}
          >
            {tab.label}
          </a>
        )
      })}
    </div>
  )
}
```

- [ ] **Step 2: Replace inline AchatsTabs in CommandesIndex.tsx**

In `app/frontend/pages/Backend/Achats/CommandesIndex.tsx`:

1. Add import after existing imports:
```typescript
import AchatsTabs from '../../../components/achats/AchatsTabs'
```

2. Remove the entire inline `function AchatsTabs() { ... }` block (lines ~13–42).

3. Remove `usePage` from the `@inertiajs/react` import (still keep `router`):
```typescript
import { router } from '@inertiajs/react'
```

- [ ] **Step 3: Replace inline AchatsTabs in CommandesShow.tsx**

In `app/frontend/pages/Backend/Achats/CommandesShow.tsx`:

1. Add import:
```typescript
import AchatsTabs from '../../../components/achats/AchatsTabs'
```

2. Remove the inline `function AchatsTabs() { ... }` block.

3. Change `import { router, usePage } from '@inertiajs/react'` to:
```typescript
import { router } from '@inertiajs/react'
```

- [ ] **Step 4: Replace inline AchatsTabs in CommandesForm.tsx**

In `app/frontend/pages/Backend/Achats/CommandesForm.tsx`:

1. Add import:
```typescript
import AchatsTabs from '../../../components/achats/AchatsTabs'
```

2. Remove the inline `function AchatsTabs() { ... }` block.

3. Change `import { router, usePage } from '@inertiajs/react'` to:
```typescript
import { router } from '@inertiajs/react'
```

- [ ] **Step 5: Replace inline AchatsTabs in FacturesIndex.tsx**

In `app/frontend/pages/Backend/Achats/FacturesIndex.tsx`:

1. Add import:
```typescript
import AchatsTabs from '../../../components/achats/AchatsTabs'
```

2. Remove the inline `function AchatsTabs() { ... }` block.

3. Remove `usePage` from the `@inertiajs/react` import if it is only used for `AchatsTabs`.

- [ ] **Step 6: Replace inline AchatsTabs in FacturesShow.tsx**

In `app/frontend/pages/Backend/Achats/FacturesShow.tsx`:

1. Add import:
```typescript
import AchatsTabs from '../../../components/achats/AchatsTabs'
```

2. Remove the inline `function AchatsTabs() { ... }` block.

3. Remove `usePage` from the `@inertiajs/react` import if unused after removal.

- [ ] **Step 7: Replace inline AchatsTabs in FacturesForm.tsx**

In `app/frontend/pages/Backend/Achats/FacturesForm.tsx`:

1. Add import:
```typescript
import AchatsTabs from '../../../components/achats/AchatsTabs'
```

2. Remove the inline `function AchatsTabs() { ... }` block.

3. Remove `usePage` from the `@inertiajs/react` import if unused after removal.

- [ ] **Step 8: Type-check**

```bash
yarn tsc --noEmit 2>&1 | head -20
```

Expected: no errors.

- [ ] **Step 9: Run existing Achats tests**

```bash
./node_modules/.bin/vitest run app/frontend/pages/Backend/Achats/ --reporter=verbose 2>&1 | tail -30
```

Expected: all tests pass (existing tests mock `usePage` already).

- [ ] **Step 10: Commit**

```bash
git add app/frontend/components/achats/AchatsTabs.tsx \
        app/frontend/pages/Backend/Achats/CommandesIndex.tsx \
        app/frontend/pages/Backend/Achats/CommandesShow.tsx \
        app/frontend/pages/Backend/Achats/CommandesForm.tsx \
        app/frontend/pages/Backend/Achats/FacturesIndex.tsx \
        app/frontend/pages/Backend/Achats/FacturesShow.tsx \
        app/frontend/pages/Backend/Achats/FacturesForm.tsx
git commit -m "refactor: extract AchatsTabs to shared component with Réceptions tab"
```

---

## Task 3 — ReceptionItemsEditor component

**Context:** Like `AchatItemsEditor` but simpler: no tax calculation, no reduction percentage. Fields: variant_name, conditioning_quantity, unit_pretax_amount, role (select), non_compliant (checkbox), annotation. Row total = `conditioning_quantity * unit_pretax_amount`. All buttons `type="button"`.

**Files:**
- Create: `app/frontend/components/receptions/ReceptionItemsEditor.tsx`
- Create: `app/frontend/components/receptions/ReceptionItemsEditor.test.tsx`

- [ ] **Step 1: Write the failing tests**

```typescript
// app/frontend/components/receptions/ReceptionItemsEditor.test.tsx
import { render, screen, fireEvent } from '@testing-library/react'
import ReceptionItemsEditor from './ReceptionItemsEditor'
import type { ReceptionItem } from '../../types/reception'

const baseItem: ReceptionItem = {
  id: 1,
  variant_name: 'Semences mil',
  conditioning_quantity: 10,
  unit_pretax_amount: 500,
  role: 'merchandise',
  non_compliant: false,
  annotation: null,
  purchase_invoice_item_id: null,
}

const newItem: ReceptionItem = {
  id: null,
  variant_name: 'Engrais NPK',
  conditioning_quantity: 5,
  unit_pretax_amount: 1000,
  role: 'fees',
  non_compliant: true,
  annotation: 'Commentaire',
  purchase_invoice_item_id: null,
}

describe('ReceptionItemsEditor', () => {
  it('renders existing row data', () => {
    const onChange = vi.fn()
    render(<ReceptionItemsEditor items={[baseItem]} onChange={onChange} />)
    expect(screen.getByDisplayValue('Semences mil')).toBeInTheDocument()
    expect(screen.getByDisplayValue('10')).toBeInTheDocument()
    expect(screen.getByDisplayValue('500')).toBeInTheDocument()
  })

  it('shows totals row', () => {
    const onChange = vi.fn()
    render(<ReceptionItemsEditor items={[baseItem, newItem]} onChange={onChange} />)
    // 10×500 + 5×1000 = 10000
    expect(screen.getByText('10\u202f000,00')).toBeInTheDocument()
  })

  it('add button calls onChange with new empty row', () => {
    const onChange = vi.fn()
    render(<ReceptionItemsEditor items={[baseItem]} onChange={onChange} />)
    fireEvent.click(screen.getByText(/ajouter/i))
    expect(onChange).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ id: null, conditioning_quantity: 1, unit_pretax_amount: 0 })
      ])
    )
  })

  it('remove persisted row sets _destroy: true', () => {
    const onChange = vi.fn()
    render(<ReceptionItemsEditor items={[baseItem]} onChange={onChange} />)
    fireEvent.click(screen.getByRole('button', { name: /supprimer/i }))
    expect(onChange).toHaveBeenCalledWith([{ ...baseItem, _destroy: true }])
  })

  it('remove new row splices the array', () => {
    const onChange = vi.fn()
    render(<ReceptionItemsEditor items={[newItem]} onChange={onChange} />)
    fireEvent.click(screen.getByRole('button', { name: /supprimer/i }))
    expect(onChange).toHaveBeenCalledWith([])
  })

  it('qty change updates totals', () => {
    const onChange = vi.fn()
    const { rerender } = render(<ReceptionItemsEditor items={[baseItem]} onChange={onChange} />)
    const qtyInput = screen.getAllByRole('spinbutton')[0]
    fireEvent.change(qtyInput, { target: { value: '20' } })
    // onChange is called; simulate controlled update
    rerender(<ReceptionItemsEditor items={[{ ...baseItem, conditioning_quantity: 20 }]} onChange={onChange} />)
    // 20×500 = 10000
    expect(screen.getByText('10\u202f000,00')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run tests — expect failure**

```bash
./node_modules/.bin/vitest run app/frontend/components/receptions/ReceptionItemsEditor.test.tsx --reporter=verbose 2>&1 | tail -20
```

Expected: FAIL — `ReceptionItemsEditor` not found.

- [ ] **Step 3: Implement ReceptionItemsEditor**

```typescript
// app/frontend/components/receptions/ReceptionItemsEditor.tsx
import { Trash2, Plus } from 'lucide-react'
import type { ReceptionItem, ReceptionItemRole } from '../../types/reception'

interface Props {
  items: ReceptionItem[]
  onChange: (items: ReceptionItem[]) => void
}

const ROLE_OPTIONS: { value: ReceptionItemRole; label: string }[] = [
  { value: 'merchandise', label: 'Marchandise' },
  { value: 'fees',        label: 'Frais' },
  { value: 'service',     label: 'Service' },
]

function emptyItem(): ReceptionItem {
  return {
    id: null,
    variant_name: null,
    conditioning_quantity: 1,
    unit_pretax_amount: 0,
    role: 'merchandise',
    non_compliant: false,
    annotation: null,
    purchase_invoice_item_id: null,
  }
}

function fmt(n: number) {
  return n.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export default function ReceptionItemsEditor({ items, onChange }: Props) {
  const visible = items.filter(i => !i._destroy)

  function update(index: number, patch: Partial<ReceptionItem>) {
    onChange(items.map((item, i) => i !== index ? item : { ...item, ...patch }))
  }

  function addRow() {
    onChange([...items, emptyItem()])
  }

  function removeRow(index: number) {
    const item = items[index]
    if (item.id !== null) {
      onChange(items.map((it, i) => i === index ? { ...it, _destroy: true } : it))
    } else {
      onChange(items.filter((_, i) => i !== index))
    }
  }

  const total = visible.reduce((s, i) => s + i.conditioning_quantity * i.unit_pretax_amount, 0)

  const cell: React.CSSProperties = { padding: '0.5rem', border: '1px solid var(--color-border)' }
  const th: React.CSSProperties = { ...cell, background: 'var(--color-bg-subtle)', fontWeight: 600, fontSize: '0.875rem' }
  const input: React.CSSProperties = { width: '100%', padding: '0.25rem 0.375rem', border: '1px solid var(--color-border)', borderRadius: '0.25rem', fontSize: '0.875rem' }

  return (
    <div>
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '0.75rem' }}>
        <thead>
          <tr>
            <th style={th}>Désignation</th>
            <th style={{ ...th, width: '80px' }}>Qté</th>
            <th style={{ ...th, width: '110px' }}>PU HT</th>
            <th style={{ ...th, width: '110px' }}>Rôle</th>
            <th style={{ ...th, width: '80px', textAlign: 'center' }}>Non conf.</th>
            <th style={th}>Annotation</th>
            <th style={{ ...th, width: '100px', textAlign: 'right' }}>HT</th>
            <th style={{ ...th, width: '40px' }}></th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, index) => {
            if (item._destroy) return null
            return (
              <tr key={item.id !== null ? `persisted-${item.id}` : `new-${index}`}>
                <td style={cell}>
                  <input
                    style={input}
                    value={item.variant_name ?? ''}
                    onChange={e => update(index, { variant_name: e.target.value })}
                  />
                </td>
                <td style={cell}>
                  <input
                    style={input}
                    type="number"
                    min="0"
                    step="0.01"
                    value={item.conditioning_quantity}
                    onChange={e => update(index, { conditioning_quantity: parseFloat(e.target.value) || 0 })}
                  />
                </td>
                <td style={cell}>
                  <input
                    style={input}
                    type="number"
                    min="0"
                    step="0.01"
                    value={item.unit_pretax_amount}
                    onChange={e => update(index, { unit_pretax_amount: parseFloat(e.target.value) || 0 })}
                  />
                </td>
                <td style={cell}>
                  <select
                    style={input}
                    value={item.role}
                    onChange={e => update(index, { role: e.target.value as ReceptionItemRole })}
                  >
                    {ROLE_OPTIONS.map(o => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </td>
                <td style={{ ...cell, textAlign: 'center' }}>
                  <input
                    type="checkbox"
                    checked={item.non_compliant}
                    onChange={e => update(index, { non_compliant: e.target.checked })}
                  />
                </td>
                <td style={cell}>
                  <input
                    style={input}
                    value={item.annotation ?? ''}
                    onChange={e => update(index, { annotation: e.target.value || null })}
                  />
                </td>
                <td style={{ ...cell, textAlign: 'right', fontSize: '0.875rem' }}>
                  {item.conditioning_quantity * item.unit_pretax_amount}
                </td>
                <td style={cell}>
                  <button
                    type="button"
                    aria-label="Supprimer"
                    onClick={() => removeRow(index)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626', padding: '0.25rem' }}
                  >
                    <Trash2 size={14} />
                  </button>
                </td>
              </tr>
            )
          })}
        </tbody>
        <tfoot>
          <tr style={{ borderTop: '2px solid var(--color-border)', fontWeight: 600 }}>
            <td colSpan={6} style={{ ...cell, textAlign: 'right', fontSize: '0.875rem' }}>Total HT</td>
            <td style={{ ...cell, textAlign: 'right' }}>{fmt(total)}</td>
            <td style={cell}></td>
          </tr>
        </tfoot>
      </table>
      <button
        type="button"
        onClick={addRow}
        style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', padding: '0.375rem 0.75rem', border: '1px solid var(--color-border)', borderRadius: '0.375rem', background: 'var(--color-bg-card)', cursor: 'pointer', fontSize: '0.875rem' }}
      >
        <Plus size={14} /> Ajouter une ligne
      </button>
    </div>
  )
}
```

- [ ] **Step 4: Run tests — expect all pass**

```bash
./node_modules/.bin/vitest run app/frontend/components/receptions/ReceptionItemsEditor.test.tsx --reporter=verbose 2>&1 | tail -20
```

Expected: 6 tests pass.

- [ ] **Step 5: Type-check**

```bash
yarn tsc --noEmit 2>&1 | head -20
```

Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add app/frontend/components/receptions/ReceptionItemsEditor.tsx \
        app/frontend/components/receptions/ReceptionItemsEditor.test.tsx
git commit -m "feat: add ReceptionItemsEditor component with TDD"
```

---

## Task 4 — ReceptionsIndex page

**Context:** List page with text search + state checkboxes (draft/given), table with state badge and reconciliation badge. "Nouvelle réception" button. Pagination uses local state (not `...filters`). Layout wraps with AppShell. Uses extracted `AchatsTabs`.

**Files:**
- Create: `app/frontend/pages/Backend/Receptions/ReceptionsIndex.tsx`
- Create: `app/frontend/pages/Backend/Receptions/ReceptionsIndex.test.tsx`

- [ ] **Step 1: Write the failing tests**

```typescript
// app/frontend/pages/Backend/Receptions/ReceptionsIndex.test.tsx
import { render, screen, fireEvent } from '@testing-library/react'
import ReceptionsIndex from './ReceptionsIndex'
import type { ReceptionsIndexProps } from '../../../types/reception'

vi.mock('@inertiajs/react', () => ({
  router: { get: vi.fn(), delete: vi.fn() },
  usePage: () => ({ url: '/backend/receptions' }),
}))

const defaultProps: ReceptionsIndexProps = {
  receptions: [
    {
      id: 1, number: 'REC-001', reference_number: 'REF-A', state: 'draft',
      planned_at: '2025-06-01', given_at: null,
      supplier: { id: 10, full_name: 'Agro Sénégal' },
      purchase_order: { id: 5, number: 'CMD-005' },
      reconciliation_state: 'to_reconcile',
      pretax_amount: 50000, currency: 'XOF',
      items: [], destroyable: true, invoiceable: false,
    },
    {
      id: 2, number: 'REC-002', reference_number: null, state: 'given',
      planned_at: '2025-05-15', given_at: '2025-05-16',
      supplier: { id: 11, full_name: 'Fournisseur Dakar' },
      purchase_order: null,
      reconciliation_state: 'reconcile',
      pretax_amount: 120000, currency: 'XOF',
      items: [], destroyable: false, invoiceable: false,
    },
  ],
  filters: { q: '', state: [] },
  meta: { current_page: 1, total_pages: 1, total_count: 2 },
}

describe('ReceptionsIndex', () => {
  it('renders reception numbers', () => {
    render(<ReceptionsIndex {...defaultProps} />)
    expect(screen.getByText('REC-001')).toBeInTheDocument()
    expect(screen.getByText('REC-002')).toBeInTheDocument()
  })

  it('renders supplier names', () => {
    render(<ReceptionsIndex {...defaultProps} />)
    expect(screen.getByText('Agro Sénégal')).toBeInTheDocument()
    expect(screen.getByText('Fournisseur Dakar')).toBeInTheDocument()
  })

  it('renders state badge labels', () => {
    render(<ReceptionsIndex {...defaultProps} />)
    expect(screen.getByText('Brouillon')).toBeInTheDocument()
    expect(screen.getByText('Validée')).toBeInTheDocument()
  })

  it('renders "Nouvelle réception" link', () => {
    render(<ReceptionsIndex {...defaultProps} />)
    expect(screen.getByText(/Nouvelle réception/)).toBeInTheDocument()
  })

  it('shows total count in meta', () => {
    render(<ReceptionsIndex {...defaultProps} />)
    expect(screen.getByText(/2 réception/)).toBeInTheDocument()
  })

  it('calls router.delete after confirm on destroyable row', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    const { router } = await import('@inertiajs/react')
    render(<ReceptionsIndex {...defaultProps} />)
    fireEvent.click(screen.getAllByRole('button', { name: /supprimer/i })[0])
    expect(router.delete).toHaveBeenCalledWith('/backend/receptions/1')
  })
})
```

- [ ] **Step 2: Run tests — expect failure**

```bash
./node_modules/.bin/vitest run app/frontend/pages/Backend/Receptions/ReceptionsIndex.test.tsx --reporter=verbose 2>&1 | tail -20
```

Expected: FAIL — `ReceptionsIndex` not found.

- [ ] **Step 3: Implement ReceptionsIndex**

```typescript
// app/frontend/pages/Backend/Receptions/ReceptionsIndex.tsx
import { type ReactNode, useState, useEffect } from 'react'
import { router } from '@inertiajs/react'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { AppShell } from '../../../components/AppShell'
import AchatsTabs from '../../../components/achats/AchatsTabs'
import type { ReceptionsIndexProps, ReceptionState, ReceptionReconciliationState } from '../../../types/reception'

const STATE_CONFIG: Record<ReceptionState, { label: string; bg: string; color: string }> = {
  draft: { label: 'Brouillon', bg: '#fef9c3', color: '#854d0e' },
  given: { label: 'Validée',   bg: '#dcfce7', color: '#166534' },
}

const RECONCILIATION_CONFIG: Record<ReceptionReconciliationState, { label: string; bg: string; color: string }> = {
  to_reconcile: { label: 'Non facturée', bg: '#fef3c7', color: '#92400e' },
  reconcile:    { label: 'Facturée',     bg: '#dcfce7', color: '#166534' },
}

export default function ReceptionsIndex({ receptions, filters, meta }: ReceptionsIndexProps) {
  const [q, setQ] = useState(filters.q ?? '')
  const [selectedStates, setSelectedStates] = useState<ReceptionState[]>(filters.state ?? [])

  useEffect(() => { setQ(filters.q ?? '') }, [filters.q])

  function search() {
    router.get('/backend/receptions', { q, state: selectedStates }, { preserveState: true })
  }

  function toggleState(state: ReceptionState) {
    setSelectedStates(prev =>
      prev.includes(state) ? prev.filter(s => s !== state) : [...prev, state]
    )
  }

  function handleDelete(id: number, number: string) {
    if (window.confirm(`Supprimer la réception ${number} ?`)) {
      router.delete(`/backend/receptions/${id}`)
    }
  }

  const card: React.CSSProperties = { background: 'var(--color-bg-card)', borderRadius: '0.5rem', border: '1px solid var(--color-border)' }
  const th: React.CSSProperties = { padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.8125rem', color: 'var(--color-text-muted)', fontWeight: 600, borderBottom: '1px solid var(--color-border)' }
  const td: React.CSSProperties = { padding: '0.75rem 1rem', borderBottom: '1px solid var(--color-border)', fontSize: '0.9375rem' }

  return (
    <div style={{ padding: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-text)', margin: 0 }}>Achats</h1>
        <a href="/backend/receptions/new" style={{ textDecoration: 'none' }}>
          <button type="button" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--color-primary)', color: '#fff', border: 'none', borderRadius: '0.5rem', padding: '0.5rem 1rem', cursor: 'pointer', fontWeight: 500 }}>
            <Plus size={16} /> Nouvelle réception
          </button>
        </a>
      </div>

      <AchatsTabs />

      {/* Filter bar */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.25rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <input
          type="text"
          value={q}
          onChange={e => setQ(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && search()}
          placeholder="Rechercher N°, référence, fournisseur…"
          style={{ flex: 1, minWidth: '220px', padding: '0.5rem 0.75rem', border: '1px solid var(--color-border)', borderRadius: '0.375rem', fontSize: '0.9375rem' }}
        />
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          {(['draft', 'given'] as ReceptionState[]).map(state => (
            <label key={state} style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', cursor: 'pointer', fontSize: '0.9rem' }}>
              <input
                type="checkbox"
                aria-label={`Filtrer par état : ${STATE_CONFIG[state].label}`}
                checked={selectedStates.includes(state)}
                onChange={() => toggleState(state)}
              />
              <span aria-hidden="true">{STATE_CONFIG[state].label}</span>
            </label>
          ))}
        </div>
        <button type="button" onClick={search} style={{ padding: '0.5rem 1rem', background: 'var(--color-bg-card)', border: '1px solid var(--color-border)', borderRadius: '0.375rem', cursor: 'pointer' }}>
          Rechercher
        </button>
      </div>

      {/* Table */}
      <div style={{ ...card, overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              {['N° réception', 'Fournisseur', 'N° commande', 'État', 'Date prévue', 'Date réception', 'HT', 'Facturation', 'Actions'].map(h => (
                <th key={h} style={th}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {receptions.map(r => {
              const stateBadge = STATE_CONFIG[r.state] ?? { label: r.state, bg: '#f3f4f6', color: '#6b7280' }
              const reconcBadge = RECONCILIATION_CONFIG[r.reconciliation_state] ?? { label: r.reconciliation_state, bg: '#f3f4f6', color: '#6b7280' }
              return (
                <tr key={r.id}>
                  <td style={td}>
                    <a href={`/backend/receptions/${r.id}`} style={{ color: 'var(--color-primary)', textDecoration: 'none', fontWeight: 500 }}>{r.number}</a>
                  </td>
                  <td style={td}>{r.supplier.full_name}</td>
                  <td style={td}>
                    {r.purchase_order
                      ? <a href={`/backend/purchase_orders/${r.purchase_order.id}`} style={{ color: 'var(--color-primary)', textDecoration: 'none' }}>{r.purchase_order.number}</a>
                      : '—'}
                  </td>
                  <td style={td}>
                    <span style={{ background: stateBadge.bg, color: stateBadge.color, padding: '0.125rem 0.625rem', borderRadius: '9999px', fontSize: '0.8rem', fontWeight: 500 }}>
                      {stateBadge.label}
                    </span>
                  </td>
                  <td style={td}>{r.planned_at}</td>
                  <td style={td}>{r.given_at ?? '—'}</td>
                  <td style={{ ...td, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                    {r.pretax_amount.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}
                  </td>
                  <td style={td}>
                    <span style={{ background: reconcBadge.bg, color: reconcBadge.color, padding: '0.125rem 0.625rem', borderRadius: '9999px', fontSize: '0.8rem', fontWeight: 500 }}>
                      {reconcBadge.label}
                    </span>
                  </td>
                  <td style={td}>
                    <div style={{ display: 'flex', gap: '0.375rem' }}>
                      <a href={`/backend/receptions/${r.id}/edit`}>
                        <button type="button" title="Modifier" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', padding: '0.25rem' }}>
                          <Pencil size={15} />
                        </button>
                      </a>
                      {r.destroyable && (
                        <button
                          type="button"
                          aria-label="Supprimer"
                          onClick={() => handleDelete(r.id, r.number)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626', padding: '0.25rem' }}
                        >
                          <Trash2 size={15} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem' }}>
        <span style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
          {meta.total_count} réception(s)
        </span>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {meta.current_page > 1 && (
            <button type="button" onClick={() => router.get('/backend/receptions', { q, state: selectedStates, page: meta.current_page - 1 })} style={{ padding: '0.25rem 0.75rem', border: '1px solid var(--color-border)', borderRadius: '0.375rem', cursor: 'pointer', background: 'var(--color-bg-card)' }}>
              Précédent
            </button>
          )}
          {meta.current_page < meta.total_pages && (
            <button type="button" onClick={() => router.get('/backend/receptions', { q, state: selectedStates, page: meta.current_page + 1 })} style={{ padding: '0.25rem 0.75rem', border: '1px solid var(--color-border)', borderRadius: '0.375rem', cursor: 'pointer', background: 'var(--color-bg-card)' }}>
              Suivant
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

ReceptionsIndex.layout = (page: ReactNode) => <AppShell>{page}</AppShell>
```

- [ ] **Step 4: Run tests — expect all pass**

```bash
./node_modules/.bin/vitest run app/frontend/pages/Backend/Receptions/ReceptionsIndex.test.tsx --reporter=verbose 2>&1 | tail -20
```

Expected: 6 tests pass.

- [ ] **Step 5: Type-check**

```bash
yarn tsc --noEmit 2>&1 | head -20
```

Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add app/frontend/pages/Backend/Receptions/ReceptionsIndex.tsx \
        app/frontend/pages/Backend/Receptions/ReceptionsIndex.test.tsx
git commit -m "feat: add ReceptionsIndex page with TDD"
```

---

## Task 5 — ReceptionsShow page

**Context:** Detail page with two badges (state + reconciliation), workflow buttons (Valider, Modifier, Créer une facture, Supprimer) conditionally rendered, read-only items table. "Créer une facture" is an `<a>` link (not a `<button>`) to `/backend/purchase_invoices/new?reception_id=:id`. No `<a><button>` nesting anywhere.

**Files:**
- Create: `app/frontend/pages/Backend/Receptions/ReceptionsShow.tsx`
- Create: `app/frontend/pages/Backend/Receptions/ReceptionsShow.test.tsx`

- [ ] **Step 1: Write the failing tests**

```typescript
// app/frontend/pages/Backend/Receptions/ReceptionsShow.test.tsx
import { render, screen, fireEvent } from '@testing-library/react'
import ReceptionsShow from './ReceptionsShow'
import type { ReceptionsShowProps } from '../../../types/reception'

vi.mock('@inertiajs/react', () => ({
  router: { post: vi.fn(), delete: vi.fn() },
  usePage: () => ({ url: '/backend/receptions/1' }),
}))

const baseReception = {
  id: 1, number: 'REC-001', reference_number: 'REF-42',
  state: 'draft' as const, planned_at: '2025-06-01', given_at: null,
  supplier: { id: 10, full_name: 'Agro Sénégal' },
  purchase_order: { id: 5, number: 'CMD-005' },
  reconciliation_state: 'to_reconcile' as const,
  pretax_amount: 50000, currency: 'XOF',
  items: [
    { id: 1, variant_name: 'Semences mil', conditioning_quantity: 10,
      unit_pretax_amount: 500, role: 'merchandise' as const,
      non_compliant: false, annotation: null, purchase_invoice_item_id: null }
  ],
  destroyable: true, invoiceable: false,
}

describe('ReceptionsShow', () => {
  it('renders number and supplier', () => {
    render(<ReceptionsShow reception={baseReception} />)
    expect(screen.getByText('REC-001')).toBeInTheDocument()
    expect(screen.getByText('Agro Sénégal')).toBeInTheDocument()
  })

  it('renders item row', () => {
    render(<ReceptionsShow reception={baseReception} />)
    expect(screen.getByText('Semences mil')).toBeInTheDocument()
  })

  it('shows "Valider" when state is draft', () => {
    render(<ReceptionsShow reception={baseReception} />)
    expect(screen.getByRole('button', { name: /valider/i })).toBeInTheDocument()
  })

  it('shows "Créer une facture" when invoiceable is true', () => {
    render(<ReceptionsShow reception={{ ...baseReception, state: 'given', invoiceable: true }} />)
    const link = screen.getByRole('link', { name: /créer une facture/i })
    expect(link).toHaveAttribute('href', '/backend/purchase_invoices/new?reception_id=1')
  })

  it('hides "Créer une facture" when invoiceable is false', () => {
    render(<ReceptionsShow reception={baseReception} />)
    expect(screen.queryByText(/créer une facture/i)).not.toBeInTheDocument()
  })

  it('calls router.delete on Supprimer click', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    const { router } = await import('@inertiajs/react')
    render(<ReceptionsShow reception={baseReception} />)
    fireEvent.click(screen.getByRole('button', { name: /supprimer/i }))
    expect(router.delete).toHaveBeenCalledWith('/backend/receptions/1')
  })
})
```

- [ ] **Step 2: Run tests — expect failure**

```bash
./node_modules/.bin/vitest run app/frontend/pages/Backend/Receptions/ReceptionsShow.test.tsx --reporter=verbose 2>&1 | tail -20
```

Expected: FAIL — `ReceptionsShow` not found.

- [ ] **Step 3: Implement ReceptionsShow**

```typescript
// app/frontend/pages/Backend/Receptions/ReceptionsShow.tsx
import { type ReactNode } from 'react'
import { router } from '@inertiajs/react'
import { ArrowLeft, Pencil, Trash2, FileText, CheckCircle } from 'lucide-react'
import { AppShell } from '../../../components/AppShell'
import AchatsTabs from '../../../components/achats/AchatsTabs'
import type { ReceptionsShowProps, ReceptionState, ReceptionReconciliationState } from '../../../types/reception'

const STATE_CONFIG: Record<ReceptionState, { label: string; bg: string; color: string }> = {
  draft: { label: 'Brouillon', bg: '#fef9c3', color: '#854d0e' },
  given: { label: 'Validée',   bg: '#dcfce7', color: '#166534' },
}

const RECONCILIATION_CONFIG: Record<ReceptionReconciliationState, { label: string; bg: string; color: string }> = {
  to_reconcile: { label: 'Non facturée', bg: '#fef3c7', color: '#92400e' },
  reconcile:    { label: 'Facturée',     bg: '#dcfce7', color: '#166534' },
}

const ROLE_LABEL: Record<string, string> = {
  merchandise: 'Marchandise',
  fees: 'Frais',
  service: 'Service',
}

function fmt(n: number) {
  return n.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export default function ReceptionsShow({ reception }: ReceptionsShowProps) {
  const stateBadge = STATE_CONFIG[reception.state] ?? { label: reception.state, bg: '#f3f4f6', color: '#6b7280' }
  const reconcBadge = RECONCILIATION_CONFIG[reception.reconciliation_state] ?? { label: reception.reconciliation_state, bg: '#f3f4f6', color: '#6b7280' }

  const visibleItems = reception.items.filter(i => !i._destroy)
  const total = visibleItems.reduce((s, i) => s + i.conditioning_quantity * i.unit_pretax_amount, 0)

  const card: React.CSSProperties = { background: 'var(--color-bg-card)', borderRadius: '0.5rem', border: '1px solid var(--color-border)', padding: '1.5rem', marginBottom: '1.25rem' }
  const dl: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem', margin: 0 }
  const dt: React.CSSProperties = { fontSize: '0.8125rem', color: 'var(--color-text-muted)', marginBottom: '0.25rem' }
  const dd: React.CSSProperties = { fontSize: '0.9375rem', fontWeight: 500, margin: 0 }
  const th: React.CSSProperties = { padding: '0.625rem 0.875rem', textAlign: 'left', fontSize: '0.8125rem', color: 'var(--color-text-muted)', fontWeight: 600, borderBottom: '1px solid var(--color-border)' }
  const td: React.CSSProperties = { padding: '0.625rem 0.875rem', borderBottom: '1px solid var(--color-border)' }

  return (
    <div style={{ padding: '2rem' }}>
      <AchatsTabs />

      {/* Header */}
      <div style={{ marginBottom: '1.5rem' }}>
        <a href="/backend/receptions" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem', color: 'var(--color-text-muted)', textDecoration: 'none', fontSize: '0.875rem', marginBottom: '0.75rem' }}>
          <ArrowLeft size={14} /> Réceptions
        </a>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-text)', margin: 0 }}>{reception.number}</h1>
          <span style={{ background: stateBadge.bg, color: stateBadge.color, padding: '0.25rem 0.75rem', borderRadius: '9999px', fontSize: '0.8rem', fontWeight: 600 }}>
            {stateBadge.label}
          </span>
          <span style={{ background: reconcBadge.bg, color: reconcBadge.color, padding: '0.25rem 0.75rem', borderRadius: '9999px', fontSize: '0.8rem', fontWeight: 600 }}>
            {reconcBadge.label}
          </span>
        </div>
        <div style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', marginTop: '0.25rem' }}>{reception.supplier.full_name}</div>
      </div>

      {/* Workflow buttons */}
      <div style={{ display: 'flex', gap: '0.625rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        {reception.state === 'draft' && (
          <button
            type="button"
            onClick={() => router.post(`/backend/receptions/${reception.id}/give`)}
            style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', background: 'var(--color-primary)', color: '#fff', border: 'none', padding: '0.5rem 1rem', borderRadius: '0.375rem', cursor: 'pointer', fontWeight: 500 }}
          >
            <CheckCircle size={14} /> Valider
          </button>
        )}
        {reception.state === 'draft' && (
          <a href={`/backend/receptions/${reception.id}/edit`} style={{ textDecoration: 'none' }}>
            <button type="button" style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', background: 'var(--color-bg-card)', color: 'var(--color-text)', border: '1px solid var(--color-border)', padding: '0.5rem 1rem', borderRadius: '0.375rem', cursor: 'pointer', fontWeight: 500 }}>
              <Pencil size={14} /> Modifier
            </button>
          </a>
        )}
        {reception.invoiceable && (
          <a
            href={`/backend/purchase_invoices/new?reception_id=${reception.id}`}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem', background: '#166534', color: '#fff', padding: '0.5rem 1rem', borderRadius: '0.375rem', fontWeight: 500, textDecoration: 'none', fontSize: '0.9375rem' }}
          >
            <FileText size={14} /> Créer une facture
          </a>
        )}
        {reception.destroyable && (
          <button
            type="button"
            aria-label="Supprimer"
            onClick={() => { if (window.confirm('Supprimer cette réception ?')) router.delete(`/backend/receptions/${reception.id}`) }}
            style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', background: '#fee2e2', color: '#991b1b', border: '1px solid #fca5a5', padding: '0.5rem 1rem', borderRadius: '0.375rem', cursor: 'pointer', fontWeight: 500 }}
          >
            <Trash2 size={14} /> Supprimer
          </button>
        )}
      </div>

      {/* Attributes card */}
      <div style={card}>
        <dl style={dl}>
          <div>
            <dt style={dt}>Date prévue</dt>
            <dd style={dd}>{reception.planned_at}</dd>
          </div>
          <div>
            <dt style={dt}>Date réception</dt>
            <dd style={dd}>{reception.given_at ?? '—'}</dd>
          </div>
          <div>
            <dt style={dt}>Référence</dt>
            <dd style={dd}>{reception.reference_number ?? '—'}</dd>
          </div>
          {reception.purchase_order && (
            <div>
              <dt style={dt}>Commande</dt>
              <dd style={dd}>
                <a href={`/backend/purchase_orders/${reception.purchase_order.id}`} style={{ color: 'var(--color-primary)', textDecoration: 'none' }}>
                  {reception.purchase_order.number}
                </a>
              </dd>
            </div>
          )}
          <div>
            <dt style={dt}>Fournisseur</dt>
            <dd style={dd}>{reception.supplier.full_name}</dd>
          </div>
        </dl>
      </div>

      {/* Items table (read-only) */}
      <div style={{ ...card, padding: 0, overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              {['Désignation', 'Qté', 'Prix unitaire HT', 'Rôle', 'Non conforme', 'HT ligne'].map(h => (
                <th key={h} style={{ ...th, textAlign: h === 'HT ligne' ? 'right' : 'left' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visibleItems.map((item, idx) => (
              <tr key={item.id ?? `new-${idx}`}>
                <td style={td}>{item.variant_name ?? '—'}</td>
                <td style={td}>{item.conditioning_quantity}</td>
                <td style={td}>{fmt(item.unit_pretax_amount)}</td>
                <td style={td}>{ROLE_LABEL[item.role] ?? item.role}</td>
                <td style={td}>{item.non_compliant ? '✓' : '—'}</td>
                <td style={{ ...td, textAlign: 'right' }}>{fmt(item.conditioning_quantity * item.unit_pretax_amount)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr style={{ borderTop: '2px solid var(--color-border)', fontWeight: 600 }}>
              <td colSpan={5} style={{ ...td, textAlign: 'right' }}>Total HT</td>
              <td style={{ ...td, textAlign: 'right' }}>{fmt(total)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  )
}

ReceptionsShow.layout = (page: ReactNode) => <AppShell>{page}</AppShell>
```

- [ ] **Step 4: Run tests — expect all pass**

```bash
./node_modules/.bin/vitest run app/frontend/pages/Backend/Receptions/ReceptionsShow.test.tsx --reporter=verbose 2>&1 | tail -20
```

Expected: 6 tests pass.

- [ ] **Step 5: Type-check**

```bash
yarn tsc --noEmit 2>&1 | head -20
```

Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add app/frontend/pages/Backend/Receptions/ReceptionsShow.tsx \
        app/frontend/pages/Backend/Receptions/ReceptionsShow.test.tsx
git commit -m "feat: add ReceptionsShow page with TDD"
```

---

## Task 6 — ReceptionsForm page

**Context:** Create/edit form. Fields: supplier text + hidden sender_id, purchase_order select (optional), planned_at (required), given_at (required), reference_number. Uses `ReceptionItemsEditor`. Submit keys: `reception[...]`. `buildData()` serializes items as `reception[items_attributes][i][field]`. Layout wraps with AppShell.

**Files:**
- Create: `app/frontend/pages/Backend/Receptions/ReceptionsForm.tsx`
- Create: `app/frontend/pages/Backend/Receptions/ReceptionsForm.test.tsx`

- [ ] **Step 1: Write the failing tests**

```typescript
// app/frontend/pages/Backend/Receptions/ReceptionsForm.test.tsx
import { render, screen, fireEvent } from '@testing-library/react'
import ReceptionsForm from './ReceptionsForm'
import type { ReceptionsFormProps } from '../../../types/reception'

vi.mock('@inertiajs/react', () => ({
  router: { post: vi.fn(), patch: vi.fn() },
  usePage: () => ({ url: '/backend/receptions/new' }),
}))

const purchaseOrders = [
  { id: 5, number: 'CMD-005' },
  { id: 6, number: 'CMD-006' },
]

const createProps: ReceptionsFormProps = {
  reception: { items: [] },
  purchase_orders: purchaseOrders,
  errors: {},
}

const editProps: ReceptionsFormProps = {
  reception: {
    id: 1, number: 'REC-001',
    supplier: { id: 10, full_name: 'Agro Sénégal' },
    purchase_order: { id: 5, number: 'CMD-005' },
    planned_at: '2025-06-01', given_at: '2025-06-02',
    reference_number: 'REF-42',
    state: 'draft', reconciliation_state: 'to_reconcile',
    pretax_amount: 50000, currency: 'XOF',
    items: [], destroyable: true, invoiceable: false,
  },
  purchase_orders: purchaseOrders,
  errors: {},
}

describe('ReceptionsForm', () => {
  it('shows "Nouvelle réception" heading on create', () => {
    render(<ReceptionsForm {...createProps} />)
    expect(screen.getByText('Nouvelle réception')).toBeInTheDocument()
  })

  it('shows "Modifier" heading with number on edit', () => {
    render(<ReceptionsForm {...editProps} />)
    expect(screen.getByText(/Modifier la réception N° REC-001/)).toBeInTheDocument()
  })

  it('renders supplier input', () => {
    render(<ReceptionsForm {...createProps} />)
    expect(screen.getByPlaceholderText(/fournisseur/i)).toBeInTheDocument()
  })

  it('renders ReceptionItemsEditor', () => {
    render(<ReceptionsForm {...createProps} />)
    expect(screen.getByText(/Ajouter une ligne/i)).toBeInTheDocument()
  })

  it('calls router.post on new form submit', async () => {
    const { router } = await import('@inertiajs/react')
    render(<ReceptionsForm {...createProps} />)
    fireEvent.submit(screen.getByRole('form'))
    expect(router.post).toHaveBeenCalledWith('/backend/receptions', expect.any(Object))
  })

  it('calls router.patch on edit form submit', async () => {
    const { router } = await import('@inertiajs/react')
    render(<ReceptionsForm {...editProps} />)
    fireEvent.submit(screen.getByRole('form'))
    expect(router.patch).toHaveBeenCalledWith('/backend/receptions/1', expect.any(Object))
  })
})
```

- [ ] **Step 2: Run tests — expect failure**

```bash
./node_modules/.bin/vitest run app/frontend/pages/Backend/Receptions/ReceptionsForm.test.tsx --reporter=verbose 2>&1 | tail -20
```

Expected: FAIL — `ReceptionsForm` not found.

- [ ] **Step 3: Implement ReceptionsForm**

```typescript
// app/frontend/pages/Backend/Receptions/ReceptionsForm.tsx
import { type ReactNode, useState } from 'react'
import { router } from '@inertiajs/react'
import type { FormDataConvertible } from '@inertiajs/core'
import { AppShell } from '../../../components/AppShell'
import AchatsTabs from '../../../components/achats/AchatsTabs'
import ReceptionItemsEditor from '../../../components/receptions/ReceptionItemsEditor'
import type { ReceptionsFormProps, ReceptionItem } from '../../../types/reception'

function FieldError({ errors, field }: { errors: Record<string, string[]>; field: string }) {
  const messages = errors[field]
  if (!messages?.length) return null
  return <p style={{ color: '#dc2626', fontSize: '0.875rem', margin: '0.25rem 0 0' }}>{messages[0]}</p>
}

export default function ReceptionsForm({ reception, purchase_orders, errors }: ReceptionsFormProps) {
  const isEdit = Boolean(reception.id)
  const [supplierName, setSupplierName] = useState(reception.supplier?.full_name ?? '')
  const [senderId, setSenderId] = useState(String(reception.supplier?.id ?? ''))
  const [purchaseId, setPurchaseId] = useState(String(reception.purchase_order?.id ?? ''))
  const [plannedAt, setPlannedAt] = useState(reception.planned_at ?? '')
  const [givenAt, setGivenAt] = useState(reception.given_at ?? '')
  const [referenceNumber, setReferenceNumber] = useState(reception.reference_number ?? '')
  const [items, setItems] = useState<ReceptionItem[]>(reception.items ?? [])

  function buildItemsAttributes(): Record<string, FormDataConvertible> {
    const attrs: Record<string, FormDataConvertible> = {}
    items.forEach((item, i) => {
      attrs[`${i}[id]`]                    = String(item.id ?? '')
      attrs[`${i}[variant_name]`]          = item.variant_name ?? ''
      attrs[`${i}[conditioning_quantity]`] = String(item.conditioning_quantity)
      attrs[`${i}[unit_pretax_amount]`]    = String(item.unit_pretax_amount)
      attrs[`${i}[role]`]                  = item.role
      attrs[`${i}[non_compliant]`]         = item.non_compliant ? '1' : '0'
      attrs[`${i}[annotation]`]            = item.annotation ?? ''
      if (item._destroy) attrs[`${i}[_destroy]`] = '1'
    })
    return attrs
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const data: Record<string, FormDataConvertible> = {
      'reception[sender_id]':       senderId,
      'reception[purchase_id]':     purchaseId,
      'reception[planned_at]':      plannedAt,
      'reception[given_at]':        givenAt,
      'reception[reference_number]': referenceNumber,
    }
    const itemsAttrs = buildItemsAttributes()
    Object.entries(itemsAttrs).forEach(([k, v]) => {
      data[`reception[items_attributes][${k}]`] = v
    })
    if (isEdit) {
      router.patch(`/backend/receptions/${reception.id}`, data)
    } else {
      router.post('/backend/receptions', data)
    }
  }

  const label: React.CSSProperties = { display: 'block', fontSize: '0.875rem', fontWeight: 500, color: 'var(--color-text)', marginBottom: '0.375rem' }
  const inp: React.CSSProperties = { width: '100%', padding: '0.5rem 0.75rem', border: '1px solid var(--color-border)', borderRadius: '0.375rem', fontSize: '0.9375rem', boxSizing: 'border-box' }
  const fieldStyle: React.CSSProperties = { marginBottom: '1.25rem' }
  const card: React.CSSProperties = { background: 'var(--color-bg-card)', borderRadius: '0.5rem', border: '1px solid var(--color-border)', padding: '1.5rem', marginBottom: '1.25rem' }

  return (
    <div style={{ padding: '2rem', maxWidth: '860px' }}>
      <AchatsTabs />
      <h1 style={{ fontSize: '1.375rem', fontWeight: 700, color: 'var(--color-text)', marginBottom: '1.5rem' }}>
        {isEdit ? `Modifier la réception N° ${reception.number}` : 'Nouvelle réception'}
      </h1>

      <form aria-label="Formulaire réception" onSubmit={handleSubmit}>
        <div style={card}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.25rem' }}>
            <div style={fieldStyle}>
              <label style={label}>Fournisseur</label>
              <input
                style={inp}
                value={supplierName}
                onChange={e => setSupplierName(e.target.value)}
                placeholder="Nom du fournisseur"
                required
              />
              <input type="hidden" value={senderId} onChange={e => setSenderId(e.target.value)} />
              <FieldError errors={errors} field="sender_id" />
            </div>

            <div style={fieldStyle}>
              <label style={label}>Commande liée</label>
              <select style={inp} value={purchaseId} onChange={e => setPurchaseId(e.target.value)}>
                <option value="">— Aucune —</option>
                {purchase_orders.map(po => (
                  <option key={po.id} value={po.id}>{po.number}</option>
                ))}
              </select>
              <FieldError errors={errors} field="purchase_id" />
            </div>

            <div style={fieldStyle}>
              <label style={label}>Date prévue *</label>
              <input type="date" style={inp} value={plannedAt} onChange={e => setPlannedAt(e.target.value)} required />
              <FieldError errors={errors} field="planned_at" />
            </div>

            <div style={fieldStyle}>
              <label style={label}>Date de réception *</label>
              <input type="date" style={inp} value={givenAt} onChange={e => setGivenAt(e.target.value)} required />
              <FieldError errors={errors} field="given_at" />
            </div>

            <div style={fieldStyle}>
              <label style={label}>Référence</label>
              <input style={inp} value={referenceNumber} onChange={e => setReferenceNumber(e.target.value)} />
              <FieldError errors={errors} field="reference_number" />
            </div>
          </div>
        </div>

        <div style={card}>
          <h2 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem', color: 'var(--color-text)' }}>Lignes de réception</h2>
          <ReceptionItemsEditor items={items} onChange={setItems} />
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button type="submit" style={{ background: 'var(--color-primary)', color: '#fff', border: 'none', borderRadius: '0.5rem', padding: '0.625rem 1.25rem', cursor: 'pointer', fontWeight: 600, fontSize: '0.9375rem' }}>
            {isEdit ? 'Enregistrer' : 'Créer la réception'}
          </button>
          <a href="/backend/receptions" style={{ textDecoration: 'none' }}>
            <button type="button" style={{ background: 'var(--color-bg-card)', color: 'var(--color-text)', border: '1px solid var(--color-border)', borderRadius: '0.5rem', padding: '0.625rem 1.25rem', cursor: 'pointer', fontSize: '0.9375rem' }}>
              Annuler
            </button>
          </a>
        </div>
      </form>
    </div>
  )
}

ReceptionsForm.layout = (page: ReactNode) => <AppShell>{page}</AppShell>
```

- [ ] **Step 4: Run tests — expect all pass**

```bash
./node_modules/.bin/vitest run app/frontend/pages/Backend/Receptions/ReceptionsForm.test.tsx --reporter=verbose 2>&1 | tail -20
```

Expected: 6 tests pass.

- [ ] **Step 5: Type-check**

```bash
yarn tsc --noEmit 2>&1 | head -20
```

Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add app/frontend/pages/Backend/Receptions/ReceptionsForm.tsx \
        app/frontend/pages/Backend/Receptions/ReceptionsForm.test.tsx
git commit -m "feat: add ReceptionsForm page with TDD"
```

---

## Task 7 — ReceptionsController explicit Inertia actions

**Context:** The existing controller has `manage_restfully except: %i[new create update]` — so `index`, `show`, `edit`, `destroy` come from `manage_restfully`, and `new`, `create`, `update` are already explicit but render HAML. Add `def index`, `def show`, `def edit` to override `manage_restfully`, and replace `new`/`create`/`update` with Inertia-compatible versions. Add private `reception_params` method. The `give`, `mergeable_matters`, `merge_matters` actions stay untouched.

**File:**
- Modify: `app/controllers/backend/receptions_controller.rb`

- [ ] **Step 1: Add explicit `index` action**

Insert this method before the existing `def new`:

```ruby
def index
  @receptions = Reception.joins('INNER JOIN entities ON entities.id = parcels.sender_id')

  if params[:q].present?
    q = "%#{params[:q].downcase}%"
    @receptions = @receptions.where(
      'LOWER(parcels.number) ILIKE ? OR LOWER(parcels.reference_number) ILIKE ? OR LOWER(entities.full_name) ILIKE ?',
      q, q, q
    )
  end

  if params[:state].is_a?(Array) && params[:state].any?
    @receptions = @receptions.where(workflow_state: params[:state])
  end

  @receptions = @receptions.order(planned_at: :desc)

  per_page    = 25
  page        = [params[:page].to_i, 1].max
  total_count = @receptions.count
  total_pages = (total_count.to_f / per_page).ceil
  @receptions = @receptions.offset((page - 1) * per_page).limit(per_page)

  respond_to do |format|
    format.html do
      render inertia: 'Backend/Receptions/ReceptionsIndex', props: {
        receptions: @receptions.map { |r|
          {
            id: r.id,
            number: r.number,
            reference_number: r.reference_number,
            state: r.state,
            planned_at: r.planned_at&.to_date&.iso8601,
            given_at: r.given_at&.to_date&.iso8601,
            supplier: { id: r.sender.id, full_name: r.sender.full_name },
            purchase_order: r.purchase ? { id: r.purchase.id, number: r.purchase.number } : nil,
            reconciliation_state: r.reconciliation_state,
            pretax_amount: r.pretax_amount.to_f,
            currency: r.currency,
            items: [],
            destroyable: r.destroyable?,
            invoiceable: r.reconciliation_state == 'to_reconcile' && r.given?
          }
        },
        filters: { q: params[:q], state: params[:state] },
        meta: { current_page: page, total_pages: total_pages, total_count: total_count }
      }
    end
  end
end
```

- [ ] **Step 2: Add explicit `show` action**

Insert after the `index` action:

```ruby
def show
  return unless (@reception = find_and_check(:reception))

  t3e(@reception.attributes)

  respond_to do |format|
    format.html do
      render inertia: 'Backend/Receptions/ReceptionsShow', props: {
        reception: {
          id: @reception.id,
          number: @reception.number,
          reference_number: @reception.reference_number,
          state: @reception.state,
          planned_at: @reception.planned_at&.to_date&.iso8601,
          given_at: @reception.given_at&.to_date&.iso8601,
          supplier: { id: @reception.sender.id, full_name: @reception.sender.full_name },
          purchase_order: @reception.purchase ? { id: @reception.purchase.id, number: @reception.purchase.number } : nil,
          reconciliation_state: @reception.reconciliation_state,
          pretax_amount: @reception.pretax_amount.to_f,
          currency: @reception.currency,
          items: @reception.items.map { |i|
            {
              id: i.id,
              variant_name: i.variant&.name,
              conditioning_quantity: i.conditioning_quantity.to_f,
              unit_pretax_amount: i.unit_pretax_amount.to_f,
              role: i.role,
              non_compliant: i.non_compliant?,
              annotation: i.annotation,
              purchase_invoice_item_id: i.purchase_invoice_item_id
            }
          },
          destroyable: @reception.destroyable?,
          invoiceable: @reception.reconciliation_state == 'to_reconcile' && @reception.given?
        }
      }
    end
  end
end
```

- [ ] **Step 3: Add explicit `edit` action**

Insert after the `show` action:

```ruby
def edit
  return unless (@reception = find_and_check(:reception))

  t3e(@reception.attributes)

  respond_to do |format|
    format.html do
      render inertia: 'Backend/Receptions/ReceptionsForm', props: {
        reception: {
          id: @reception.id,
          number: @reception.number,
          reference_number: @reception.reference_number,
          state: @reception.state,
          planned_at: @reception.planned_at&.to_date&.iso8601,
          given_at: @reception.given_at&.to_date&.iso8601,
          supplier: { id: @reception.sender.id, full_name: @reception.sender.full_name },
          purchase_order: @reception.purchase ? { id: @reception.purchase.id, number: @reception.purchase.number } : nil,
          reconciliation_state: @reception.reconciliation_state,
          pretax_amount: @reception.pretax_amount.to_f,
          currency: @reception.currency,
          items: @reception.items.map { |i|
            {
              id: i.id,
              variant_name: i.variant&.name,
              conditioning_quantity: i.conditioning_quantity.to_f,
              unit_pretax_amount: i.unit_pretax_amount.to_f,
              role: i.role,
              non_compliant: i.non_compliant?,
              annotation: i.annotation,
              purchase_invoice_item_id: i.purchase_invoice_item_id
            }
          },
          destroyable: @reception.destroyable?,
          invoiceable: @reception.reconciliation_state == 'to_reconcile' && @reception.given?
        },
        purchase_orders: purchase_orders_for_select,
        errors: {}
      }
    end
  end
end
```

- [ ] **Step 4: Replace `def new` with Inertia version**

Replace the entire existing `def new ... end` block with:

```ruby
def new
  purchase_orders = []
  reception_attrs = { given_at: Date.today, items: [] }

  if params[:purchase_order_ids]
    pos = PurchaseOrder.where(id: params[:purchase_order_ids].split(','))
    supplier_ids = pos.pluck(:supplier_id).uniq
    farest_date = pos.pluck(:ordered_at).compact.min
    reception_attrs = {
      sender_id: supplier_ids.length > 1 ? nil : supplier_ids.first,
      given_at: farest_date || Date.today,
      reconciliation_state: 'reconcile',
      items: ReceivableItemsFilter.new.filter(
        pos.includes(items: [parcels_purchase_orders_items: :reception])
           .references(items: [parcels_purchase_orders_items: :reception])
      ).map { |i|
        { id: nil, variant_name: i.variant&.name,
          conditioning_quantity: i.conditioning_quantity.to_f,
          unit_pretax_amount: i.unit_pretax_amount.to_f,
          role: i.role, non_compliant: false, annotation: nil, purchase_invoice_item_id: nil }
      }
    }
    sender = supplier_ids.length == 1 ? Entity.find_by(id: supplier_ids.first) : nil
    reception_attrs[:supplier] = sender ? { id: sender.id, full_name: sender.full_name } : nil
  end

  respond_to do |format|
    format.html do
      render inertia: 'Backend/Receptions/ReceptionsForm', props: {
        reception: reception_attrs,
        purchase_orders: purchase_orders_for_select,
        errors: {}
      }
    end
  end
end
```

- [ ] **Step 5: Replace `def create` with Inertia version**

Replace the entire existing `def create ... end` block with:

```ruby
def create
  @reception = Reception.new(reception_params)

  if @reception.save
    redirect_to backend_reception_path(@reception)
  else
    respond_to do |format|
      format.html do
        render inertia: 'Backend/Receptions/ReceptionsForm', props: {
          reception: { items: [] },
          purchase_orders: purchase_orders_for_select,
          errors: @reception.errors.to_hash
        }, status: :unprocessable_entity
      end
    end
  end
end
```

- [ ] **Step 6: Replace `def update` with Inertia version**

Replace the entire existing `def update ... end` block with:

```ruby
def update
  return unless (@reception = find_and_check(:reception))

  t3e(@reception.attributes)

  if @reception.update(reception_params)
    redirect_to backend_reception_path(@reception)
  else
    respond_to do |format|
      format.html do
        render inertia: 'Backend/Receptions/ReceptionsForm', props: {
          reception: { id: @reception.id, number: @reception.number, items: [] },
          purchase_orders: purchase_orders_for_select,
          errors: @reception.errors.to_hash
        }, status: :unprocessable_entity
      end
    end
  end
end
```

- [ ] **Step 7: Add private helpers at the bottom of the `private` section**

Add inside the `private` block (before the closing `end` of the class):

```ruby
def reception_params
  params.require(:reception).permit(
    :sender_id, :purchase_id, :planned_at, :given_at,
    :reference_number, :delivery_mode,
    items_attributes: %i[id variant_name conditioning_quantity unit_pretax_amount
                         role non_compliant annotation _destroy]
  )
end

def purchase_orders_for_select
  PurchaseOrder.order(:number).map { |po| { id: po.id, number: po.number } }
end
```

- [ ] **Step 8: Syntax check**

```bash
ruby -c app/controllers/backend/receptions_controller.rb
```

Expected: `Syntax OK`

- [ ] **Step 9: Commit**

```bash
git add app/controllers/backend/receptions_controller.rb
git commit -m "feat: add explicit Inertia actions to ReceptionsController"
```

---

## Task 8 — Extend purchase_invoices#new with reception_id

**Context:** `InvoiceableItemsFilter` already exists at `app/services/invoiceable_items_filter.rb`. It takes an array of receptions and returns unsaved `PurchaseItem` objects for uninvoiced items. We extend the existing `def new` action to check `params[:reception_id]` before `params[:duplicate_of]`, and pre-fill items_data when a valid, uninvoiced reception is found.

**File:**
- Modify: `app/controllers/backend/purchase_invoices_controller.rb`

- [ ] **Step 1: Locate the `def new` action**

Open `app/controllers/backend/purchase_invoices_controller.rb`. Find `def new` — it currently handles `params[:duplicate_of]` and then renders `FacturesForm`.

- [ ] **Step 2: Add `reception_id` branch before `duplicate_of`**

Replace the `def new` action with this version (the `duplicate_of` branch is preserved unchanged):

```ruby
def new
  nature = PurchaseNature.find_by(id: params[:nature_id]) || PurchaseNature.by_default
  items_data = []

  if params[:reception_id]
    reception = Reception.find_by(id: params[:reception_id])
    if reception && reception.reconciliation_state == 'to_reconcile'
      raw_items = InvoiceableItemsFilter.new.filter([reception])
      items_data = raw_items.map { |i|
        {
          id: nil,
          variant_name: i.variant&.name,
          conditioning_quantity: i.conditioning_quantity.to_f,
          unit_pretax_amount: i.unit_pretax_amount.to_f,
          tax_id: i.tax_id,
          reduction_percentage: 0,
          pretax_amount: i.pretax_amount.to_f,
          amount: i.amount.to_f
        }
      }
    end
  elsif params[:duplicate_of]
    source = PurchaseInvoice.find_by(id: params[:duplicate_of])
    if source
      items_data = source.items.map { |i|
        {
          id: nil,
          variant_name: i.variant&.name,
          conditioning_quantity: i.conditioning_quantity.to_f,
          unit_pretax_amount: i.unit_pretax_amount.to_f,
          tax_id: i.tax_id,
          reduction_percentage: i.reduction_percentage.to_f,
          pretax_amount: i.pretax_amount.to_f,
          amount: i.amount.to_f
        }
      }
    end
  end

  respond_to do |format|
    format.html do
      render inertia: 'Backend/Achats/FacturesForm', props: {
        facture: {
          invoiced_at: Time.zone.today.iso8601,
          currency: nature&.currency || 'XOF',
          items: items_data
        },
        natures: PurchaseNature.all.as_json(only: %i[id name currency payment_delay]),
        taxes: Tax.all.as_json(only: %i[id name short_label amount]),
        errors: {}
      }
    end
  end
end
```

- [ ] **Step 3: Syntax check**

```bash
ruby -c app/controllers/backend/purchase_invoices_controller.rb
```

Expected: `Syntax OK`

- [ ] **Step 4: Commit**

```bash
git add app/controllers/backend/purchase_invoices_controller.rb
git commit -m "feat: extend purchase_invoices#new with reception_id via InvoiceableItemsFilter"
```

---

## Final verification

- [ ] **Run all new tests**

```bash
./node_modules/.bin/vitest run \
  app/frontend/components/receptions/ \
  app/frontend/pages/Backend/Receptions/ \
  --reporter=verbose 2>&1 | tail -40
```

Expected: 24 tests pass (6 per file × 4 files).

- [ ] **Run full Achats test suite to catch regressions**

```bash
./node_modules/.bin/vitest run app/frontend/pages/Backend/Achats/ --reporter=verbose 2>&1 | tail -20
```

Expected: all existing Achats tests still pass.

- [ ] **Final type-check**

```bash
yarn tsc --noEmit 2>&1 | head -20
```

Expected: no errors.
