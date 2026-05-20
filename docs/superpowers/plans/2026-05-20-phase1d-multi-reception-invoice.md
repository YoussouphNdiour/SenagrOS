# Phase 1d — Multi-réception → Facture groupée : Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Allow selecting multiple invoiceable receptions in `ReceptionsIndex` and generating a single consolidated invoice pre-filled with their uninvoiced items.

**Architecture:** Two files modified. `ReceptionsIndex.tsx` gains a checkbox column and a floating action bar (visible when ≥2 invoiceable receptions are checked). `purchase_invoices_controller.rb#new` gains a `reception_ids[]` branch inserted before the existing `reception_id` branch, using `InvoiceableItemsFilter` on an array. No new pages, no type changes.

**Tech Stack:** React 18, TypeScript strict, Vitest + React Testing Library, Ruby on Rails 6 (Ruby 2.6 — no `filter_map`/`then`/`yield_self`).

---

## File Structure

```
app/controllers/backend/purchase_invoices_controller.rb   ← add reception_ids[] branch in def new
app/frontend/pages/Backend/Receptions/ReceptionsIndex.tsx ← add selectedIds state + checkbox column + action bar
app/frontend/pages/Backend/Receptions/ReceptionsIndex.test.tsx ← add 4 new tests
```

---

## Task 1: Rails — extend `purchase_invoices#new` with `reception_ids[]`

**Files:**
- Modify: `app/controllers/backend/purchase_invoices_controller.rb` (around line 237–267)

- [ ] **Step 1: Write the failing test (manual verification step)**

  There is no existing controller spec file to add to. Do a quick sanity check instead — verify the current controller file at line 237:

  ```bash
  grep -n "def new\|reception_id\|reception_ids\|duplicate_of" app/controllers/backend/purchase_invoices_controller.rb
  ```

  Expected: `def new` at ~237, `params[:reception_id]` at ~241, `params[:duplicate_of]` at ~258. No `reception_ids` line yet.

- [ ] **Step 2: Replace `def new` with the extended version**

  In `app/controllers/backend/purchase_invoices_controller.rb`, replace the entire `def new` block (lines 237–279) with:

  ```ruby
  def new
    nature = PurchaseNature.find_by(id: params[:nature_id]) || PurchaseNature.by_default
    items_data = []

    if params[:reception_ids].present?
      receptions = Reception.where(id: params[:reception_ids])
                            .select { |r| r.reconciliation_state == 'to_reconcile' && r.given? }
      if receptions.any?
        raw_items = InvoiceableItemsFilter.new.filter(receptions)
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
    elsif params[:reception_id]
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
          { id: nil, variant_name: i.variant&.name, conditioning_quantity: i.conditioning_quantity.to_f,
            unit_pretax_amount: i.unit_pretax_amount.to_f, tax_id: i.tax_id,
            reduction_percentage: i.reduction_percentage.to_f, pretax_amount: i.pretax_amount.to_f, amount: i.amount.to_f }
        }
      end
    end

    respond_to do |format|
      format.html do
        render inertia: 'Backend/Achats/FacturesForm', props: {
          facture: { invoiced_at: Time.zone.today.iso8601, currency: nature&.currency || 'XOF', items: items_data },
          natures: PurchaseNature.all.as_json(only: %i[id name currency payment_delay]),
          taxes: Tax.all.as_json(only: %i[id name short_label amount]),
          errors: {}
        }
      end
    end
  end
  ```

- [ ] **Step 3: Verify Ruby syntax**

  ```bash
  bundle exec ruby -c app/controllers/backend/purchase_invoices_controller.rb
  ```

  Expected: `Syntax OK`

- [ ] **Step 4: Verify TypeScript is still clean**

  ```bash
  yarn tsc --noEmit 2>&1 | head -20
  ```

  Expected: no output (zero errors).

- [ ] **Step 5: Commit**

  ```bash
  git add app/controllers/backend/purchase_invoices_controller.rb
  git commit -m "feat: extend purchase_invoices#new with reception_ids[] for multi-reception invoice"
  ```

---

## Task 2: React — multi-selection UI in `ReceptionsIndex`

**Files:**
- Modify: `app/frontend/pages/Backend/Receptions/ReceptionsIndex.tsx`
- Modify: `app/frontend/pages/Backend/Receptions/ReceptionsIndex.test.tsx`

### Step 1 — Write the 4 new failing tests

- [ ] **Step 1: Add 4 tests to `ReceptionsIndex.test.tsx`**

  The file currently has 6 tests. Append 4 more inside the existing `describe('ReceptionsIndex', () => { ... })` block, before the closing `})`.

  First, add two invoiceable receptions to the test helpers. Replace the entire file content with:

  ```tsx
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

  const invoiceableProps: ReceptionsIndexProps = {
    receptions: [
      {
        id: 10, number: 'REC-010', reference_number: null, state: 'given',
        planned_at: '2025-06-01', given_at: '2025-06-02',
        supplier: { id: 20, full_name: 'Fournisseur A' },
        purchase_order: null,
        reconciliation_state: 'to_reconcile',
        pretax_amount: 80000, currency: 'XOF',
        items: [], destroyable: false, invoiceable: true,
      },
      {
        id: 11, number: 'REC-011', reference_number: null, state: 'given',
        planned_at: '2025-06-03', given_at: '2025-06-04',
        supplier: { id: 21, full_name: 'Fournisseur B' },
        purchase_order: null,
        reconciliation_state: 'to_reconcile',
        pretax_amount: 60000, currency: 'XOF',
        items: [], destroyable: false, invoiceable: true,
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

    it('renders enabled checkbox for invoiceable reception', () => {
      render(<ReceptionsIndex {...invoiceableProps} />)
      const checkboxes = screen.getAllByRole('checkbox', { name: /Sélectionner la réception REC-01/ })
      expect(checkboxes[0]).toBeEnabled()
    })

    it('renders disabled checkbox for non-invoiceable reception', () => {
      render(<ReceptionsIndex {...defaultProps} />)
      // defaultProps has invoiceable: false for both rows
      const checkboxes = screen.getAllByRole('checkbox', { name: /Sélectionner la réception/ })
      checkboxes.forEach(cb => expect(cb).toBeDisabled())
    })

    it('hides action bar when fewer than 2 receptions selected', () => {
      render(<ReceptionsIndex {...invoiceableProps} />)
      // Click only one checkbox
      const checkboxes = screen.getAllByRole('checkbox', { name: /Sélectionner la réception/ })
      fireEvent.click(checkboxes[0])
      expect(screen.queryByText(/Créer une facture groupée/)).not.toBeInTheDocument()
    })

    it('shows action bar with correct href when 2 invoiceable selected', () => {
      render(<ReceptionsIndex {...invoiceableProps} />)
      const checkboxes = screen.getAllByRole('checkbox', { name: /Sélectionner la réception/ })
      fireEvent.click(checkboxes[0])
      fireEvent.click(checkboxes[1])
      const link = screen.getByRole('link', { name: /Créer une facture groupée/ })
      const href = link.getAttribute('href') ?? ''
      expect(href).toContain('reception_ids[]=10')
      expect(href).toContain('reception_ids[]=11')
    })
  })
  ```

- [ ] **Step 2: Run tests to confirm 4 new ones fail**

  ```bash
  yarn vitest run app/frontend/pages/Backend/Receptions/ReceptionsIndex.test.tsx --reporter=verbose 2>&1 | tail -30
  ```

  Expected: 6 tests PASS (existing), 4 tests FAIL (checkbox/action bar not yet in component).

### Step 2 — Implement the selection UI

- [ ] **Step 3: Replace `ReceptionsIndex.tsx` with the updated version**

  Replace the full content of `app/frontend/pages/Backend/Receptions/ReceptionsIndex.tsx`:

  ```tsx
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
    const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())

    useEffect(() => { setQ(filters.q ?? '') }, [filters.q])

    function search() {
      router.get('/backend/receptions', { q, state: selectedStates }, { preserveState: true })
    }

    function toggleState(state: ReceptionState) {
      setSelectedStates(prev =>
        prev.includes(state) ? prev.filter(s => s !== state) : [...prev, state]
      )
    }

    function toggleSelect(id: number) {
      setSelectedIds(prev => {
        const next = new Set(prev)
        if (next.has(id)) { next.delete(id) } else { next.add(id) }
        return next
      })
    }

    function handleDelete(id: number, number: string) {
      if (window.confirm(`Supprimer la réception ${number} ?`)) {
        router.delete(`/backend/receptions/${id}`)
      }
    }

    const groupedInvoiceHref = `/backend/purchase_invoices/new?${[...selectedIds].map(id => `reception_ids[]=${id}`).join('&')}`

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
                <span aria-hidden="true" style={{ userSelect: 'none' }}>
                  {state === 'draft' ? 'Brouillons' : 'Validées'}
                </span>
              </label>
            ))}
          </div>
          <button type="button" onClick={search} style={{ padding: '0.5rem 1rem', background: 'var(--color-bg-card)', border: '1px solid var(--color-border)', borderRadius: '0.375rem', cursor: 'pointer' }}>
            Rechercher
          </button>
        </div>

        {/* Action bar — visible only when ≥2 invoiceable receptions are checked */}
        {selectedIds.size >= 2 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.75rem 1rem', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '0.5rem', marginBottom: '1rem' }}>
            <span style={{ fontSize: '0.9375rem', color: '#1e40af' }}>
              {selectedIds.size} réception(s) sélectionnée(s)
            </span>
            <a href={groupedInvoiceHref} style={{ textDecoration: 'none' }}>
              <button type="button" style={{ background: '#166534', color: '#fff', border: 'none', borderRadius: '0.5rem', padding: '0.5rem 1rem', cursor: 'pointer', fontWeight: 500, fontSize: '0.9rem' }}>
                Créer une facture groupée
              </button>
            </a>
          </div>
        )}

        {/* Table */}
        <div style={{ ...card, overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ ...th, width: '2.5rem' }}>Sélectionner</th>
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
                    <td style={{ ...td, textAlign: 'center' }}>
                      <input
                        type="checkbox"
                        aria-label={`Sélectionner la réception ${r.number}`}
                        checked={selectedIds.has(r.id)}
                        onChange={() => toggleSelect(r.id)}
                        disabled={!r.invoiceable}
                      />
                    </td>
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

- [ ] **Step 4: Run all 10 tests**

  ```bash
  yarn vitest run app/frontend/pages/Backend/Receptions/ReceptionsIndex.test.tsx --reporter=verbose 2>&1 | tail -30
  ```

  Expected: 10 tests PASS (6 original + 4 new).

- [ ] **Step 5: Run full Réceptions test suite**

  ```bash
  yarn vitest run app/frontend/pages/Backend/Receptions/ --reporter=verbose 2>&1 | tail -30
  ```

  Expected: All existing ReceptionsShow, ReceptionsForm, and ReceptionItemsEditor tests still pass.

- [ ] **Step 6: TypeScript check**

  ```bash
  yarn tsc --noEmit 2>&1 | head -20
  ```

  Expected: no output.

- [ ] **Step 7: Commit**

  ```bash
  git add app/frontend/pages/Backend/Receptions/ReceptionsIndex.tsx \
          app/frontend/pages/Backend/Receptions/ReceptionsIndex.test.tsx
  git commit -m "feat: add multi-reception selection and grouped invoice action to ReceptionsIndex"
  ```
