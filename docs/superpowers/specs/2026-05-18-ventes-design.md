# Ventes (Sales) Migration — React/Inertia Design Spec

> **For agentic workers:** Use `superpowers:subagent-driven-development` or `superpowers:executing-plans` to implement the plan derived from this spec.

**Goal:** Migrate the Sales module (Index, Show, Form) from Rails HAML to React 18 + TypeScript via Inertia.js v2, following the patterns established by Interventions and Campagnes.

**Architecture:** Controller sends typed props via `render inertia:`. React pages handle display and form state. Workflow actions (propose, confirm, invoice, etc.) remain Rails POST → redirect — the Show page renders buttons that submit to existing routes. No REST API added.

**Tech Stack:** React 18, TypeScript strict, Inertia.js v2 `@inertiajs/react`, Lucide React, CSS custom properties from `tokens.css`, Vitest + React Testing Library.

**Scope exclusions (YAGNI):**
- Subscriptions (abonnements) on sale items — rare in West Africa context
- Letter format fields (introduction, conclusion, function_title) — decorative
- OCR / document scanning
- Email client (email_client action stays as Rails redirect)
- PDF/ODT export (stays as Rails)
- Conditioning ratio dynamic fetch (use static quantity input only)

---

## File Structure

```
app/frontend/types/vente.ts                          ← all TS types for this module
app/frontend/pages/Backend/Ventes/Index.tsx          ← list + filters
app/frontend/pages/Backend/Ventes/Index.test.tsx
app/frontend/pages/Backend/Ventes/Show.tsx           ← detail + workflow actions
app/frontend/pages/Backend/Ventes/Show.test.tsx
app/frontend/pages/Backend/Ventes/Form.tsx           ← create/edit + item editor
app/frontend/pages/Backend/Ventes/Form.test.tsx
app/frontend/components/ventes/VenteItemsEditor.tsx  ← reusable items table
app/controllers/backend/sales_controller.rb          ← add render inertia: calls
```

---

## TypeScript Types — `types/vente.ts`

```typescript
export type VenteState = 'draft' | 'estimate' | 'aborted' | 'refused' | 'order' | 'invoice'

export interface VenteNature {
  id: number
  name: string
  currency: string
  payment_delay: string | null
}

export interface VenteTax {
  id: number
  name: string
  short_label: string
  amount: number  // rate as decimal e.g. 0.18 for 18%
}

export interface VenteItem {
  id: number | null          // null for new items
  variant_id: number | null
  variant_name: string | null
  conditioning_unit_id: number | null
  conditioning_unit_name: string | null
  conditioning_quantity: number
  unit_pretax_amount: number
  tax_id: number | null
  tax_rate: number           // decimal e.g. 0.18
  reduction_percentage: number
  pretax_amount: number
  amount: number
  label: string | null
  annotation: string | null
  _destroy?: boolean
}

export interface VenteClient {
  id: number
  full_name: string
  number: string | null
  default_mail_address_id: number | null
}

export interface VenteAffair {
  balance: number
  closed: boolean
  incoming_payments: Array<{
    id: number
    amount: number
    paid_at: string | null
    mode_name: string | null
  }>
}

export interface VenteAddress {
  id: number
  mail_coordinate: string
}

export interface VenteShipment {
  id: number
  number: string
  state: string
  human_state_name: string
  delivery_mode: string | null
  address_coordinate: string | null
}

export interface VenteCredit {
  id: number
  number: string
  amount: number
  pretax_amount: number
  currency: string
  created_at: string
}

export interface Vente {
  id: number
  number: string
  reference_number: string | null
  initial_number: string | null
  state: VenteState
  state_label: string
  currency: string
  pretax_amount: number
  amount: number
  affair_balance: number | null
  affair_closed: boolean | null
  invoiced_at: string | null
  confirmed_at: string | null
  created_at: string
  payment_delay: string | null
  description: string | null
  client: VenteClient
  client_number: string | null
  responsible_id: number | null
  responsible_name: string | null
  nature_id: number | null
  nature_name: string | null
  address: VenteAddress | null
  invoice_address: VenteAddress | null
  items: VenteItem[]
  affair: VenteAffair | null
  shipments: VenteShipment[]
  credits: VenteCredit[]
  // capability flags from model
  updateable: boolean
  destroyable: boolean
  cancellable: boolean
  can_generate_parcel: boolean
}

export interface VenteMeta {
  total: number
  page: number
  per_page: number
}

export interface VenteFilters {
  q: string | null
  state: VenteState[]
  period: string | null
  started_on: string | null
  stopped_on: string | null
  nature: 'all' | 'unpaid'
  responsible_id: number | null
}

export interface VenteResponsible {
  id: number
  label: string
}

// --- Page Props ---

export interface VentesIndexProps {
  sales: Array<{
    id: number
    number: string
    reference_number: string | null
    state: VenteState
    state_label: string
    client_name: string
    created_at: string
    invoiced_at: string | null
    pretax_amount: number
    amount: number
    currency: string
    updateable: boolean
    destroyable: boolean
    cancellable: boolean
  }>
  meta: VenteMeta
  filters: VenteFilters
  responsibles: VenteResponsible[]
  natures: VenteNature[]
}

export interface VentesShowProps {
  sale: Vente
}

export interface VentesFormProps {
  sale: {
    id: number | null
    number: string | null
    state: VenteState | null
    nature_id: number | null
    client_id: number | null
    client_name: string | null
    invoiced_at: string | null
    reference_number: string | null
    responsible_id: number | null
    responsible_name: string | null
    payment_delay: string | null
    description: string | null
    currency: string
    items: VenteItem[]
  }
  natures: VenteNature[]
  taxes: VenteTax[]
  errors: Record<string, string[]>
}
```

---

## Rails Controller Changes — `sales_controller.rb`

Add `render inertia:` to four places. All other actions (workflow, email, duplicate, cancel, contacts) keep their existing redirect/render logic untouched.

### `index` action

Replace:
```ruby
def index
  respond_to do |format|
    format.html
    format.xml { render xml: @sales }
    format.pdf { render pdf: @sales, with: params[:template] }
  end
end
```

With:
```ruby
def index
  respond_to do |format|
    format.html do
      sales = Sale.joins(:client, :affair)
                  .order(created_at: :desc, number: :desc)
                  .includes(:client, :affair)

      # apply search
      if (q = params[:q]).present?
        sales = sales.where(
          'sales.number ILIKE :q OR sales.reference_number ILIKE :q OR entities.full_name ILIKE :q',
          q: "%#{q}%"
        )
      end
      # apply state filter
      if params[:state].is_a?(Array) && params[:state].any?
        sales = sales.where(state: params[:state])
      end
      # apply unpaid filter
      if params[:nature] == 'unpaid'
        sales = sales.where('NOT affairs.closed')
      end
      # apply period filter
      if params[:period].present? && params[:period] != 'all'
        if params[:period] == 'interval'
          started = params[:started_on]
          stopped = params[:stopped_on]
        else
          parts = params[:period].split('_')
          started = parts[0]
          stopped = parts[1]
        end
        if started && stopped
          sales = sales.where(
            '(sales.invoiced_at IS NULL AND sales.created_at::DATE BETWEEN ? AND ?) OR (sales.invoiced_at::DATE BETWEEN ? AND ?)',
            started, stopped, started, stopped
          )
        end
      end
      # apply responsible filter
      if params[:responsible_id].to_i > 0
        sales = sales.where(responsible_id: params[:responsible_id])
      end

      page     = [params[:page].to_i, 1].max
      per_page = 25
      total    = sales.count
      sales    = sales.offset((page - 1) * per_page).limit(per_page)

      render inertia: 'Backend/Ventes/Index', props: {
        sales: sales.map { |s|
          {
            id:               s.id,
            number:           s.number,
            reference_number: s.reference_number,
            state:            s.state,
            state_label:      s.state_label,
            client_name:      s.client.full_name,
            created_at:       s.created_at.iso8601,
            invoiced_at:      s.invoiced_at&.iso8601,
            pretax_amount:    s.pretax_amount.to_f,
            amount:           s.amount.to_f,
            currency:         s.currency,
            updateable:       s.updateable?,
            destroyable:      s.destroyable?,
            cancellable:      s.cancellable?,
          }
        },
        meta: { total:, page:, per_page: },
        filters: {
          q:              params[:q],
          state:          params[:state].is_a?(Array) ? params[:state] : [],
          period:         params[:period],
          started_on:     params[:started_on],
          stopped_on:     params[:stopped_on],
          nature:         params[:nature] || 'all',
          responsible_id: params[:responsible_id]&.to_i,
        },
        responsibles: Entity.where(id: Sale.select(:responsible_id).distinct.pluck(:responsible_id).compact)
                            .map { |e| { id: e.id, label: e.label } },
        natures: SaleNature.actives.reorder(:name).map { |n| { id: n.id, name: n.name } },
      }
    end
    format.xml  { render xml: @sales }
    format.pdf  { render pdf: @sales, with: params[:template] }
  end
end
```

### `show` action

Inside the `format.html` block of `create_response`, after `t3e`, add:
```ruby
format.html do
  t3e @sale.attributes, client: @sale.client.full_name, state: @sale.state_label, label: @sale.label
  render inertia: 'Backend/Ventes/Show', props: {
    sale: {
      id:               @sale.id,
      number:           @sale.number,
      reference_number: @sale.reference_number,
      initial_number:   @sale.initial_number,
      state:            @sale.state,
      state_label:      @sale.state_label,
      currency:         @sale.currency,
      pretax_amount:    @sale.pretax_amount.to_f,
      amount:           @sale.amount.to_f,
      affair_balance:   @sale.affair&.balance&.to_f,
      affair_closed:    @sale.affair&.closed,
      invoiced_at:      @sale.invoiced_at&.iso8601,
      confirmed_at:     @sale.confirmed_at&.iso8601,
      created_at:       @sale.created_at.iso8601,
      payment_delay:    @sale.payment_delay,
      description:      @sale.description,
      client: {
        id:                     @sale.client.id,
        full_name:              @sale.client.full_name,
        number:                 @sale.client.number,
        default_mail_address_id: @sale.client.default_mail_address&.id,
      },
      responsible_id:   @sale.responsible_id,
      responsible_name: @sale.responsible&.full_name,
      nature_id:        @sale.nature_id,
      nature_name:      @sale.nature&.name,
      address:          @sale.address ? { id: @sale.address.id, mail_coordinate: @sale.address.mail_coordinate } : nil,
      invoice_address:  @sale.invoice_address ? { id: @sale.invoice_address.id, mail_coordinate: @sale.invoice_address.mail_coordinate } : nil,
      items: @sale.items.order(:id).map { |item|
        {
          id:                    item.id,
          variant_id:            item.variant_id,
          variant_name:          item.variant&.name,
          conditioning_unit_id:  item.conditioning_unit_id,
          conditioning_unit_name: item.conditioning_unit&.name,
          conditioning_quantity: item.conditioning_quantity.to_f,
          unit_pretax_amount:    item.unit_pretax_amount.to_f,
          tax_id:                item.tax_id,
          tax_rate:              item.tax ? (item.tax.usable_amount / 100.0) : 0.0,
          reduction_percentage:  item.reduction_percentage.to_f,
          pretax_amount:         item.pretax_amount.to_f,
          amount:                item.amount.to_f,
          label:                 item.label,
          annotation:            item.annotation,
        }
      },
      affair: @sale.affair ? {
        balance: @sale.affair.balance.to_f,
        closed:  @sale.affair.closed,
        incoming_payments: @sale.affair.incoming_payments.map { |p|
          { id: p.id, amount: p.amount.to_f, paid_at: p.paid_at&.iso8601, mode_name: p.mode&.name }
        }
      } : nil,
      shipments: @sale.parcels.map { |p|
        {
          id:               p.id,
          number:           p.number,
          state:            p.state,
          human_state_name: p.human_state_name,
          delivery_mode:    p.delivery_mode,
          address_coordinate: p.address&.coordinate,
        }
      },
      credits: @sale.credits.map { |c|
        { id: c.id, number: c.number, amount: c.amount.to_f, pretax_amount: c.pretax_amount.to_f, currency: c.currency, created_at: c.created_at.iso8601 }
      },
      updateable:         @sale.updateable?,
      destroyable:        @sale.destroyable?,
      cancellable:        @sale.cancellable?,
      can_generate_parcel: @sale.can_generate_parcel?,
    }
  }
end
```

### `new` action — add at end (before `render locals:`)

```ruby
render inertia: 'Backend/Ventes/Form', props: {
  sale: {
    id: nil, number: nil, state: nil,
    nature_id:        @sale.nature_id,
    client_id:        @sale.client_id,
    client_name:      @sale.client&.full_name,
    invoiced_at:      @sale.invoiced_at&.iso8601,
    reference_number: nil,
    responsible_id:   @sale.responsible_id,
    responsible_name: @sale.responsible&.full_name,
    payment_delay:    @sale.payment_delay,
    description:      nil,
    currency:         @sale.currency,
    items: @sale.items.map { |item|
      {
        id: nil, variant_id: item.variant_id, variant_name: item.variant&.name,
        conditioning_unit_id: item.conditioning_unit_id, conditioning_unit_name: item.conditioning_unit&.name,
        conditioning_quantity: item.conditioning_quantity.to_f,
        unit_pretax_amount: item.unit_pretax_amount.to_f,
        tax_id: item.tax_id, tax_rate: item.tax ? (item.tax.usable_amount / 100.0) : 0.0,
        reduction_percentage: item.reduction_percentage.to_f,
        pretax_amount: item.pretax_amount.to_f, amount: item.amount.to_f,
        label: item.label, annotation: nil,
      }
    },
  },
  natures: SaleNature.actives.reorder(:name).map { |n| { id: n.id, name: n.name, currency: n.currency, payment_delay: n.payment_delay } },
  taxes: Tax.current.map { |t| { id: t.id, name: t.name, short_label: t.short_label, amount: t.usable_amount.to_f / 100.0 } },
  errors: {},
}
return  # prevent double render
```

### `edit` action (add via manage_restfully override or before render)

Add the same inertia render as `new` but with `@sale` populated from DB and `id: @sale.id`.

### `create` / `update` actions

On validation failure, re-render with `render inertia: 'Backend/Ventes/Form'` passing errors. On success, existing redirect logic unchanged.

---

## React Pages

### `Index.tsx`

**Responsibilities:**
- Display paginated table of sales
- Filter bar: text search, state multi-select, period selector, nature toggle (all/unpaid), responsible select
- "Nouvelle vente" button (dropdown if multiple natures)
- Row actions: show (link), edit (link if updateable), cancel (POST if cancellable), destroy (DELETE if destroyable)
- State badge with color per state

**State badges:**
```
draft    → grey    "Brouillon"
estimate → blue    "Devis"
aborted  → red     "Annulé"
refused  → orange  "Refusé"
order    → green   "Commande"
invoice  → purple  "Facture"
```

**Columns:** N° vente | Référence | Client | État | Date création | Date facturation | HT | TTC | Actions

**Key behaviours:**
- Filter changes trigger `router.get('/backend/sales', { ...filters })` — server re-renders with new data
- Pagination via `?page=N` query param
- Destroy asks `window.confirm` before `router.delete`

---

### `Show.tsx`

**Responsibilities:**
- Display all sale attributes in a two-column attributes grid
- Workflow action buttons (state-gated):
  - `draft/estimate` → "Proposer" (POST /backend/sales/:id/propose)
  - `estimate` → "Confirmer" (POST /backend/sales/:id/confirm)
  - `order` → "Facturer" (POST /backend/sales/:id/invoice) or "Proposer et facturer" (POST /propose_and_invoice)
  - `estimate/order` → "Annuler" (POST /backend/sales/:id/abort)
  - `estimate/refused` → "Refuser" (POST /backend/sales/:id/refuse) — only if estimate
  - "Dupliquer" (POST /backend/sales/:id/duplicate) — always
  - "Modifier" link → /backend/sales/:id/edit — if updateable
  - "Supprimer" (DELETE) — if destroyable
- Items table (read-only): variant | qty | unit | unit_price_HT | tax | reduction% | HT | TTC
- Affair / paiements section: balance + list of incoming payments
- Shipments section (if any)
- Credits section (if any)

**Amounts footer:** Total HT + Total TTC displayed below items table.

---

### `Form.tsx`

**Responsibilities:**
- Header: "Nouvelle vente" or "Modifier vente N°{number}"
- Nature selector (hidden input if only one nature)
- Client selector: text input + autocomplete via `fetch('/backend/entities/unroll?scope=clients&q=...')` returning JSON
- `invoiced_at` date input
- Responsible selector (same autocomplete pattern as client, scope=users)
- `payment_delay` display-only field (auto-filled from nature)
- `reference_number` text input
- `description` textarea
- **Items editor** (VenteItemsEditor component)
- Submit / Cancel buttons
- Error display per field

**Form submission:** `router.post('/backend/sales', { sale: { ...formData } })` for create, `router.patch('/backend/sales/:id', ...)` for update. Items sent as `sale[items_attributes][N][...]` structure.

---

### `VenteItemsEditor.tsx`

**Props:**
```typescript
interface VenteItemsEditorProps {
  items: VenteItem[]
  taxes: VenteTax[]
  currency: string
  onChange: (items: VenteItem[]) => void
}
```

**Responsibilities:**
- Add item row button
- Per row: variant name (text for now, no autocomplete in Phase 1a), conditioning_quantity, unit_pretax_amount, tax select, reduction_percentage
- Auto-calculate pretax_amount and amount on change:
  ```
  pretax_amount = conditioning_quantity * unit_pretax_amount * (1 - reduction_percentage / 100)
  amount = pretax_amount * (1 + tax_rate)
  ```
- Remove row button (sets `_destroy: true` for existing items, removes from array for new items)
- Totals footer: sum of pretax_amount, sum of amount

**Note:** Variant autocomplete (dynamic fetch from `/backend/product_nature_variants/unroll`) is deferred to Phase 2 (Stock) when variants are fully migrated. For Phase 1a, variant_name is a plain text input. This is acceptable for initial migration — the old HAML form can still be used for complex cases if needed.

---

## Tests

### `Index.test.tsx`
```typescript
// render with 2 sales → shows both numbers
// state badge renders correct label
// filter bar renders state checkboxes
// "Nouvelle vente" button renders
```

### `Show.test.tsx`
```typescript
// renders sale number and client name
// renders items table with line items
// renders "Proposer" button when state=draft
// renders "Facturer" button when state=order
// renders affair balance
```

### `Form.test.tsx`
```typescript
// renders "Nouvelle vente" heading for new sale
// renders client input field
// renders items editor
// add item button adds a row
// remove item button removes a row
// pretax_amount calculates when qty/price change
// submit calls router.post with correct shape
```

---

## AppShell Nav Update

Add "Ventes" link to `NAV_LINKS` in `AppShell.tsx`:
```typescript
{ href: '/backend/sales', label: 'Ventes', icon: ShoppingCart },
```

---

## Sequence

1. Types (`types/vente.ts`)
2. Controller `index` action + Index.tsx + Index.test.tsx
3. Controller `show` action + Show.tsx + Show.test.tsx
4. VenteItemsEditor.tsx + tests
5. Controller `new/edit/create/update` + Form.tsx + Form.test.tsx
6. AppShell nav update
7. Final: `yarn vitest`, `yarn tsc --noEmit`
