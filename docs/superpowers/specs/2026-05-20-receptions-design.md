# Réceptions (Phase 1c) — React/Inertia Migration Design Spec

> **For agentic workers:** Use `superpowers:subagent-driven-development` or `superpowers:executing-plans` to implement the plan derived from this spec.

**Goal:** Migrate the Réceptions module (list, detail, form) from Rails HAML to React 18 + TypeScript via Inertia.js v2, and wire the "Créer une facture" button using the existing `InvoiceableItemsFilter` service.

**Architecture:** `ReceptionsController` gains explicit `index`, `show`, `new`, `edit`, `create`, `update` actions with `render inertia:`. A shared `ReceptionItemsEditor` handles line-item editing (simpler than `AchatItemsEditor` — no tax calculation). `purchase_invoices#new` is extended with a `reception_id` param that pre-fills the `FacturesForm` via `InvoiceableItemsFilter`. The `give` action (POST → redirect) stays untouched. No REST API added.

**Tech Stack:** React 18, TypeScript strict, `@inertiajs/react`, Lucide React, CSS custom properties from `tokens.css`, Vitest + React Testing Library.

**Scope exclusions (YAGNI):**
- Multi-reception → single invoice (Phase 1d)
- `give` action stays as POST redirect (no React form needed)
- Storings / `list_storings` → reste HAML pour l'instant
- `mergeable_matters` / `merge_matters` → JSON endpoints, pas de migration UI

---

## File Structure

```
app/frontend/types/reception.ts                              ← all TS types
app/frontend/components/receptions/
  ReceptionItemsEditor.tsx                                   ← line-items editor (no tax)
  ReceptionItemsEditor.test.tsx
app/frontend/pages/Backend/Receptions/
  ReceptionsIndex.tsx                                        ← list + filters
  ReceptionsIndex.test.tsx
  ReceptionsShow.tsx                                         ← detail + workflow buttons
  ReceptionsShow.test.tsx
  ReceptionsForm.tsx                                         ← new/edit form
  ReceptionsForm.test.tsx
app/controllers/backend/receptions_controller.rb             ← add explicit index/show/new/edit/create/update
app/controllers/backend/purchase_invoices_controller.rb      ← extend new with reception_id
app/frontend/components/AppShell.tsx                         ← add Réceptions sub-tab under Achats
```

---

## TypeScript Types — `types/reception.ts`

```typescript
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
  purchase_orders: ReceptionPurchaseOrder[]  // for selector
  errors: Record<string, string[]>
}
```

---

## ReceptionItemsEditor — `components/receptions/ReceptionItemsEditor.tsx`

Fully controlled. No tax calculation (unlike `AchatItemsEditor`).

**Props:**
```typescript
interface Props {
  items: ReceptionItem[]
  onChange: (items: ReceptionItem[]) => void
}
```

**Row fields:** variant_name (text), conditioning_quantity (number), unit_pretax_amount (number), role (select: merchandise/fees/service), non_compliant (checkbox), annotation (text).

**Row removal:** same pattern as AchatItemsEditor — persisted rows (`id !== null`) set `_destroy: true`; new rows (`id === null`) spliced.

**Keys:** `key={item.id !== null ? \`persisted-${item.id}\` : \`new-${index}\`}`

**Totals footer:** `pretax_amount = sum(conditioning_quantity * unit_pretax_amount)` over visible (non-destroyed) rows. Format with `toLocaleString('fr-FR', { minimumFractionDigits: 2 })`.

All buttons `type="button"`.

**Tests (6):**
1. Renders existing row data
2. Shows totals row
3. Add button calls onChange with new empty row
4. Remove persisted row sets `_destroy: true`
5. Remove new row splices array
6. Qty change updates totals

---

## ReceptionsIndex

**Filter bar:**
- Text search → `q`
- State checkboxes: `draft` (Brouillon) / `given` (Validée)
- `useEffect(() => { setQ(filters.q ?? '') }, [filters.q])`
- Search: `router.get('/backend/receptions', { q, state }, { preserveState: true })`

**Table columns:** N° réception (link to show), Fournisseur, N° commande (link to purchase_order), État (badge), Date prévue, Date réception, HT, Facturation (badge), Actions (Modifier / Supprimer)

**State badge config:**
```typescript
const STATE_CONFIG: Record<ReceptionState, { label: string; bg: string; color: string }> = {
  draft:  { label: 'Brouillon', bg: '#fef9c3', color: '#854d0e' },
  given:  { label: 'Validée',   bg: '#dcfce7', color: '#166534' },
}
```

**Reconciliation badge config:**
```typescript
const RECONCILIATION_CONFIG: Record<ReceptionReconciliationState, { label: string; bg: string; color: string }> = {
  to_reconcile: { label: 'Non facturée', bg: '#fef3c7', color: '#92400e' },
  reconcile:    { label: 'Facturée',     bg: '#dcfce7', color: '#166534' },
}
```

**"Nouvelle réception"** button → `/backend/receptions/new`

**Pagination:** prev/next using current local state (`q`, `state`).

**Layout:** `ReceptionsIndex.layout = (page) => <AppShell>{page}</AppShell>`

**Sub-tabs:** Commandes | Factures | Réceptions (same `AchatsTabs` pattern, add Réceptions tab)

**Tests (6):**
1. Renders reception numbers
2. Renders supplier names
3. Renders state badge labels
4. "Nouvelle réception" button present
5. Shows total count in meta
6. Delete calls `router.delete` after confirm

---

## ReceptionsShow

**Header:** back link, number as `<h1>`, state badge, reconciliation badge.

**Workflow buttons:**
| Condition | Button | Action |
|-----------|--------|--------|
| `state === 'draft'` | Valider (primary) | POST `/backend/receptions/:id/give` |
| `state === 'draft'` | Modifier (secondary) | link to `/backend/receptions/:id/edit` |
| `invoiceable` | Créer une facture (success) | link to `/backend/purchase_invoices/new?reception_id=:id` |
| `destroyable` | Supprimer (danger) | DELETE `/backend/receptions/:id` |

**Attributes card (`<dl>`):** Date prévue, Date réception, Référence, Commande (link to show), Fournisseur.

**Items table (read-only):**
Désignation, Qté, Prix unitaire HT, Rôle, Non conforme, HT ligne. Footer with total pretax.

- `Role` display: `{ merchandise: 'Marchandise', fees: 'Frais', service: 'Service' }`
- Non conforme: ✓ / — (text, no emoji icons — use Lucide `Check` / dash text)
- Row keys: `item.id ?? \`new-${idx}\``

**Tests (6):**
1. Renders number and supplier
2. Renders item row
3. Shows "Valider" when state=draft
4. Shows "Créer une facture" when invoiceable=true
5. Hides "Créer une facture" when invoiceable=false
6. router.delete called on Supprimer click

---

## ReceptionsForm

**Heading:** "Nouvelle réception" (create) or "Modifier la réception N° :number" (edit).

**Fields:**
- Fournisseur (text input + hidden supplier_id)
- Commande liée (select from `purchase_orders`, optional)
- Date prévue (date input, required)
- Date de réception (date input, required)
- Référence (text input)

**Items editor:** `<ReceptionItemsEditor items={items} onChange={setItems} />`

**Submit:**
```typescript
// create
router.post('/backend/receptions', buildData())
// edit
router.patch(`/backend/receptions/${reception.id}`, buildData())
```

**`buildData()`** serializes with `reception[field]` keys, items as `reception[items_attributes][i][field]`.

**Per-field errors:** `FieldError` helper (same pattern as Achats forms).

**Form:** `aria-label="Formulaire réception"` for test `getByRole('form')`.

**`new` with `?purchase_order_id=:id`:** Controller pre-fills supplier and items from the purchase order using `ReceivableItemsFilter` (already exists).

**Layout:** `ReceptionsForm.layout = (page) => <AppShell>{page}</AppShell>`

**Tests (6):**
1. "Nouvelle réception" heading on create
2. "Modifier" heading with number on edit
3. Supplier input rendered
4. ReceptionItemsEditor rendered
5. router.post on new form submit
6. router.patch on edit form submit

---

## AppShell — Sub-tabs update

The `AchatsTabs` component (duplicated in each Achats/Réceptions page) gains a third tab:

```typescript
const tabs = [
  { href: '/backend/purchase_orders',  label: 'Commandes' },
  { href: '/backend/purchase_invoices', label: 'Factures' },
  { href: '/backend/receptions',        label: 'Réceptions' },
]
```

This component is currently inlined in each page. Extract it to `components/achats/AchatsTabs.tsx` to avoid further duplication (all 8 existing Achats pages + 3 new Réceptions pages = 11 pages using it).

---

## Rails Controller — `receptions_controller.rb`

Add explicit actions before the private `new`, `create`, `update`:

**`index`:** Filter by `q` (ILIKE on `parcels.number`, `parcels.reference_number`, `entities.full_name`), `state[]` array. Join `entities` on `sender_id`. Paginate 25/page. `render inertia: 'Backend/Receptions/ReceptionsIndex'`.

**`show`:** `find_and_check(:reception)`, `t3e`, `render inertia: 'Backend/Receptions/ReceptionsShow'` with full reception hash including items, `destroyable: @reception.destroyable?`, `invoiceable: @reception.reconciliation_state == 'to_reconcile' && @reception.given?`.

**`new`:** Keep existing `purchase_order_ids` / `ReceivableItemsFilter` logic. Replace `render locals:` with `render inertia: 'Backend/Receptions/ReceptionsForm'`.

**`edit`:** `find_and_check(:reception)`, `render inertia: 'Backend/Receptions/ReceptionsForm'` with full reception data.

**`create`:** On success `redirect_to backend_reception_path(@reception)`. On failure `render inertia: 'Backend/Receptions/ReceptionsForm', status: :unprocessable_entity`.

**`update`:** Same pattern.

**`reception_params`:** Explicit `permit` replacing `permitted_params`:
```ruby
def reception_params
  params.require(:reception).permit(
    :sender_id, :purchase_id, :planned_at, :given_at,
    :reference_number, :delivery_mode,
    items_attributes: %i[id variant_id conditioning_quantity conditioning_unit_id
                         unit_pretax_amount role non_compliant annotation _destroy]
  )
end
```

---

## Rails Controller — `purchase_invoices_controller.rb`

Extend the existing `new` action to handle `reception_id`:

```ruby
def new
  nature = PurchaseNature.find_by(id: params[:nature_id]) || PurchaseNature.by_default
  items_data = []

  if params[:reception_id]
    reception = Reception.find_by(id: params[:reception_id])
    if reception && reception.reconciliation_state == 'to_reconcile'
      raw_items = InvoiceableItemsFilter.new.filter([reception])
      items_data = raw_items.map { |i|
        { id: nil, variant_name: i.variant&.name,
          conditioning_quantity: i.conditioning_quantity.to_f,
          unit_pretax_amount: i.unit_pretax_amount.to_f,
          tax_id: i.tax_id,
          reduction_percentage: 0,
          pretax_amount: i.pretax_amount.to_f,
          amount: i.amount.to_f }
      }
    end
  elsif params[:duplicate_of]
    # existing duplicate_of logic unchanged
    source = PurchaseInvoice.find_by(id: params[:duplicate_of])
    if source
      items_data = source.items.map { |i|
        { id: nil, variant_name: i.variant&.name,
          conditioning_quantity: i.conditioning_quantity.to_f,
          unit_pretax_amount: i.unit_pretax_amount.to_f,
          tax_id: i.tax_id, reduction_percentage: i.reduction_percentage.to_f,
          pretax_amount: i.pretax_amount.to_f, amount: i.amount.to_f }
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

---

## Testing Strategy

- Vitest + React Testing Library
- Mock `@inertiajs/react` router in each file
- 6 tests per component/page (except ReceptionItemsEditor: 6)
- Total new tests: 6 × 4 files = 24 tests
