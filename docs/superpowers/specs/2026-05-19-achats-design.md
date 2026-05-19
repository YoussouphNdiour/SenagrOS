# Achats (Phase 1b) — React/Inertia Migration Design Spec

> **For agentic workers:** Use `superpowers:subagent-driven-development` or `superpowers:executing-plans` to implement the plan derived from this spec.

**Goal:** Migrate the Achats module (Commandes fournisseurs + Factures fournisseurs) from Rails HAML to React 18 + TypeScript via Inertia.js v2, following the patterns established by Ventes.

**Architecture:** Controller sends typed props via `render inertia:`. React pages handle display and form state. Workflow actions (`open`, `close`) remain Rails POST → redirect. No REST API added. Shared `AchatItemsEditor` component for line items on both Commandes and Factures forms.

**Tech Stack:** React 18, TypeScript strict, Inertia.js v2 `@inertiajs/react`, Lucide React, CSS custom properties from `tokens.css`, Vitest + React Testing Library.

**Scope exclusions (YAGNI):**
- Création facture depuis réceptions → Phase 1c
- Export PDF/ODT/CSV → reste Rails
- Email fournisseur (`email_supplier` action) → reste Rails
- Réconciliation manuelle des lignes → reste Rails
- OCR / document scanning → hors scope
- `command_mode` (letter/fax/mail/oral/sms) → non exposé en Phase 1b

---

## File Structure

```
app/frontend/types/achat.ts                              ← all TS types for this module
app/frontend/pages/Backend/Achats/
  CommandesIndex.tsx                                     ← purchase orders list + filters
  CommandesIndex.test.tsx
  CommandesShow.tsx                                      ← purchase order detail + workflow
  CommandesShow.test.tsx
  CommandesForm.tsx                                      ← purchase order create/edit
  CommandesForm.test.tsx
  FacturesIndex.tsx                                      ← purchase invoices list + filters
  FacturesIndex.test.tsx
  FacturesShow.tsx                                       ← purchase invoice detail
  FacturesShow.test.tsx
  FacturesForm.tsx                                       ← purchase invoice create/edit
  FacturesForm.test.tsx
app/frontend/components/achats/
  AchatItemsEditor.tsx                                   ← reusable line items editor
  AchatItemsEditor.test.tsx
app/controllers/backend/
  purchase_orders_controller.rb                          ← add explicit index/show/new/edit/create/update
  purchase_invoices_controller.rb                        ← add explicit index/show/new/edit/create/update
app/frontend/components/AppShell.tsx                     ← add Achats nav link + sub-tabs
```

---

## TypeScript Types — `types/achat.ts`

```typescript
export type CommandeState = 'opened' | 'closed'
export type ReconciliationState = 'to_reconcile' | 'reconcile' | 'accepted'

export interface AchatNature {
  id: number
  name: string
  currency: string
  payment_delay: string | null
}

export interface AchatTax {
  id: number
  name: string
  short_label: string
  amount: number  // rate as decimal e.g. 0.18 for 18%
}

export interface AchatItem {
  id: number | null
  variant_name: string | null
  conditioning_quantity: number
  unit_pretax_amount: number
  tax_id: number | null
  reduction_percentage: number
  pretax_amount: number   // computed client-side
  amount: number          // computed client-side
  _destroy?: boolean
}

export interface AchatSupplier {
  id: number
  full_name: string
}

// --- Commandes ---

export interface Commande {
  id: number
  number: string
  reference_number: string | null
  state: CommandeState
  ordered_at: string
  supplier: AchatSupplier
  nature_name: string | null
  pretax_amount: number
  amount: number
  currency: string
  description: string | null
  responsible_name: string | null
  items: AchatItem[]
  receptions_count: number
  destroyable: boolean
}

export interface CommandesIndexProps {
  commandes: Commande[]
  filters: { q?: string; state?: CommandeState[] }
  meta: { current_page: number; total_pages: number; total_count: number }
}

export interface CommandesShowProps {
  commande: Commande
}

export interface CommandesFormProps {
  commande: Partial<Commande> & { id?: number }
  natures: AchatNature[]
  taxes: AchatTax[]
  errors: Record<string, string[]>
}

// --- Factures ---

export interface Facture {
  id: number
  number: string
  reference_number: string | null
  invoiced_at: string
  supplier: AchatSupplier
  nature_name: string | null
  pretax_amount: number
  amount: number
  currency: string
  reconciliation_state: ReconciliationState
  unpaid: boolean
  description: string | null
  payment_delay: string | null
  responsible_name: string | null
  items: AchatItem[]
  destroyable: boolean
  updatable: boolean
}

export interface FacturesIndexProps {
  factures: Facture[]
  filters: { q?: string; reconciliation_state?: ReconciliationState[]; unpaid?: boolean }
  meta: { current_page: number; total_pages: number; total_count: number }
}

export interface FacturesShowProps {
  facture: Facture
}

export interface FacturesFormProps {
  facture: Partial<Facture> & { id?: number }
  natures: AchatNature[]
  taxes: AchatTax[]
  errors: Record<string, string[]>
}
```

---

## AchatItemsEditor — `components/achats/AchatItemsEditor.tsx`

Fully controlled component — no internal `useState`. All changes flow through `onChange` callback.

**Props:**
```typescript
interface Props {
  items: AchatItem[]
  taxes: AchatTax[]
  currency: string
  onChange: (items: AchatItem[]) => void
}
```

**Amount calculation (same formula as VenteItemsEditor):**
```typescript
function calcAmounts(item: AchatItem): AchatItem {
  const pretax = Math.round(item.conditioning_quantity * item.unit_pretax_amount * (1 - item.reduction_percentage / 100) * 100) / 100
  const tax = taxes.find(t => t.id === item.tax_id)
  const amount = Math.round(pretax * (1 + (tax?.amount ?? 0)) * 100) / 100
  return { ...item, pretax_amount: pretax, amount }
}
```

**Row removal:**
- Persisted row (`id !== null`): set `_destroy: true`
- New row (`id === null`): splice from array

**Totals footer:** computed over `visible` items (non-destroyed) using `reduce`.

All buttons must have `type="button"` to prevent accidental form submission.

---

## Commandes Fournisseurs

### CommandesIndex

**Filter bar:**
- Text search input bound to local `q` state
- `useEffect(() => { setQ(filters.q ?? '') }, [filters.q])` for Inertia prop sync
- State checkboxes: `opened` (En cours) / `closed` (Clôturée)
- Search triggers `router.get('/backend/purchase_orders', { q, state }, { preserveState: true })`

**Table columns:** N° commande (link to show), Référence, Fournisseur, État (badge), Date commande, HT, TTC, Actions (Edit / Delete)

**State badge config:**
```typescript
const STATE_CONFIG: Record<CommandeState, { label: string; bg: string; color: string }> = {
  opened: { label: 'En cours',  bg: '#dcfce7', color: '#166534' },
  closed: { label: 'Clôturée',  bg: '#f1f5f9', color: '#475569' },
}
```

**Pagination:** same pattern as Ventes (prev/next links).

**"Nouvelle commande"** button links to `/backend/purchase_orders/new`.

Delete button: `window.confirm()` → `router.delete('/backend/purchase_orders/:id')`, `type="button"`.

### CommandesShow

**Header:** back link, number as `<h1>`, state badge.

**Workflow buttons:**
| Condition | Button | Action |
|-----------|--------|--------|
| state === 'opened' | Clôturer (danger) | POST `/backend/purchase_orders/:id/close` |
| state === 'closed' | Rouvrir (secondary) | POST `/backend/purchase_orders/:id/open` |
| always | Modifier (secondary) | link to `/backend/purchase_orders/:id/edit` |
| destroyable | Supprimer (danger) | DELETE `/backend/purchase_orders/:id` |

**Attributes card (`<dl>` grid):** Date commande, Référence, Description.

**Items table (read-only):** Désignation, Qté, Prix unitaire HT, Réduction, HT ligne, TTC ligne. Footer with totals.

**Receptions link:** if `receptions_count > 0`, show link to `/backend/receptions?purchase_order_id=:id`.

### CommandesForm

**Heading:** "Nouvelle commande" (create) or "Modifier la commande N° :number" (edit).

**Fields:**
- Nature selector (hidden if `natures.length === 1`)
- Fournisseur (text input with `supplier_name` + hidden `supplier_id`)
- Date commande (date input, required)
- Référence fournisseur (text input)
- Responsable (text input)
- Description (textarea)

**Items editor:** `<AchatItemsEditor>` with `items`, `taxes`, `currency`, `onChange`.

**Submit:**
```typescript
// create
router.post('/backend/purchase_orders', buildData())
// edit
router.patch(`/backend/purchase_orders/${commande.id}`, buildData())
```

**Per-field errors** via `FieldError` helper component:
```tsx
function FieldError({ errors, field }: { errors: Record<string, string[]>; field: string }) {
  const messages = errors[field]
  if (!messages?.length) return null
  return <p style={{ color: '#dc2626', fontSize: '0.875rem' }}>{messages[0]}</p>
}
```

Form element: `aria-label="Formulaire commande"` for test `getByRole('form')`.

---

## Factures Fournisseurs

### FacturesIndex

**Filter bar:**
- Text search (N°, référence, fournisseur)
- `useEffect` for `q` sync
- Reconciliation checkboxes: `to_reconcile` (À réconcilier) / `reconcile` (Réconciliée) / `accepted` (Acceptée)
- Toggle "Non payées uniquement" (boolean `unpaid` filter)

**Table columns:** N° facture (link to show), Référence, Fournisseur, Réconciliation (badge), Date facture, HT, TTC, Actions (Edit / Delete)

**Reconciliation badge config:**
```typescript
const RECONCILIATION_CONFIG: Record<ReconciliationState, { label: string; bg: string; color: string }> = {
  to_reconcile: { label: 'À réconcilier', bg: '#fef3c7', color: '#92400e' },
  reconcile:    { label: 'Réconciliée',   bg: '#dcfce7', color: '#166534' },
  accepted:     { label: 'Acceptée',      bg: '#dbeafe', color: '#1e40af' },
}
```

**"Nouvelle facture"** button links to `/backend/purchase_invoices/new`.

### FacturesShow

**Header:** back link, number as `<h1>`, reconciliation badge, paid/unpaid badge.

**Workflow buttons:**
| Condition | Button | Action |
|-----------|--------|--------|
| updatable | Modifier (secondary) | link to `/backend/purchase_invoices/:id/edit` |
| always | Dupliquer (secondary) | link to `/backend/purchase_invoices/new?duplicate_of=:id` |
| destroyable | Supprimer (danger) | DELETE `/backend/purchase_invoices/:id` |

**Paid/unpaid badge:**
```typescript
unpaid
  ? { label: 'Non payée', bg: '#fee2e2', color: '#991b1b' }
  : { label: 'Payée',     bg: '#dcfce7', color: '#166534' }
```

**Attributes card:** Date facture, Référence, Délai paiement, Description.

**Items table (read-only):** Désignation, Qté, Prix unitaire HT, Réduction, HT ligne, TTC ligne. Footer with totals.

### FacturesForm

**Heading:** "Nouvelle facture" or "Modifier la facture N° :number".

**Fields:**
- Nature selector (hidden if `natures.length === 1`)
- Fournisseur (text input)
- Date facture (date input, required)
- Référence fournisseur (text input)
- Délai paiement (text input)
- Responsable (text input)
- Description (textarea)

**Items editor:** `<AchatItemsEditor>`.

**Submit:**
```typescript
router.post('/backend/purchase_invoices', buildData())
router.patch(`/backend/purchase_invoices/${facture.id}`, buildData())
```

Form element: `aria-label="Formulaire facture"`.

---

## Navigation — AppShell

Add `ShoppingBag` to Lucide imports. Add nav entry after Ventes:

```typescript
{ href: '/backend/purchase_orders', label: 'Achats', icon: ShoppingBag }
```

**Sub-tabs** on Achats pages — detect active tab via `usePage().url`:

```tsx
// In CommandesIndex, CommandesShow, CommandesForm, FacturesIndex, FacturesShow, FacturesForm
const { url } = usePage()
const tabs = [
  { href: '/backend/purchase_orders',  label: 'Commandes' },
  { href: '/backend/purchase_invoices', label: 'Factures' },
]
// render tab bar below page header
```

---

## Rails Controllers

### `purchase_orders_controller.rb`

Add explicit actions (override `manage_restfully`):

**`index`:** Filter by `q` (ILIKE on number, reference_number, supplier full_name), `state[]` array, `period` date range on `ordered_at`. Paginate 25/page. `render inertia: 'Backend/Achats/CommandesIndex'`.

**`show`:** `find_and_check`, `t3e`, `render inertia: 'Backend/Achats/CommandesShow'` with commande hash including items, `receptions_count`, `destroyable: @purchase_order.destroyable?`.

**`new` / `edit`:** `render inertia: 'Backend/Achats/CommandesForm'` with natures, taxes, errors: {}.

**`create` / `update`:** On success redirect to show. On failure `render inertia: ... , status: :unprocessable_entity` with `errors: @purchase_order.errors.to_hash`.

**`purchase_order_params`:** permit `:nature_id, :supplier_id, :ordered_at, :reference_number, :responsible_id, :description, items_attributes: [:id, :variant_name, :conditioning_quantity, :unit_pretax_amount, :tax_id, :reduction_percentage, :_destroy, :position]`

### `purchase_invoices_controller.rb`

Same pattern:

**`index`:** Filter by `q`, `reconciliation_state[]`, `unpaid` toggle (joins affair, filters `NOT affair.closed`), `period` on `invoiced_at`. Paginate 25/page.

**`show`:** `find_and_check`, `t3e`, render with facture hash including `unpaid: @purchase_invoice.unpaid?`, `updatable: !@purchase_invoice.linked_to_tax_declaration?`, `destroyable: @purchase_invoice.destroyable?`.

**`new` / `edit` / `create` / `update`:** Same pattern as purchase_orders.

**`purchase_invoice_params`:** permit `:nature_id, :supplier_id, :invoiced_at, :reference_number, :payment_delay, :responsible_id, :description, items_attributes: [:id, :variant_name, :conditioning_quantity, :unit_pretax_amount, :tax_id, :reduction_percentage, :_destroy, :position]`

---

## Testing Strategy

Each file gets 6–7 Vitest tests with React Testing Library. Mock `@inertiajs/react` router in each test file.

**AchatItemsEditor (6 tests):**
- Renders existing row data
- Shows totals row
- Add button calls onChange with new empty row
- Remove persisted row sets `_destroy: true`
- Remove new row splices array
- Qty change recalculates pretax_amount and amount

**CommandesIndex (6 tests):**
- Renders order numbers
- Renders supplier names
- Renders state badge labels
- "Nouvelle commande" button present
- Shows total count
- Delete calls `router.delete` after confirm

**CommandesShow (6 tests):**
- Renders number and supplier
- Renders item row
- Shows "Clôturer" when state=opened
- Shows "Rouvrir" when state=closed
- router.post called on "Clôturer" click
- Shows receptions link when receptions_count > 0

**CommandesForm (6 tests):**
- "Nouvelle commande" heading on create
- "Modifier" heading with number on edit
- Supplier input rendered
- AchatItemsEditor rendered
- router.post on new form submit
- router.patch on edit form submit

**FacturesIndex (6 tests):**
- Renders invoice numbers
- Renders supplier names
- Renders reconciliation badge labels
- "Nouvelle facture" button present
- "Non payées uniquement" toggle present
- Delete calls `router.delete` after confirm

**FacturesShow (6 tests):**
- Renders number and supplier
- Renders item row
- Shows paid/unpaid badge
- Shows "Modifier" when updatable
- Shows "Dupliquer" always
- router.delete called on "Supprimer" click

**FacturesForm (6 tests):**
- "Nouvelle facture" heading on create
- "Modifier" heading with number on edit
- Supplier input rendered
- AchatItemsEditor rendered
- router.post on new form submit
- router.patch on edit form submit
