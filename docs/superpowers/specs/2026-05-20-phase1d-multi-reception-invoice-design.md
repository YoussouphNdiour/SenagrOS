# Phase 1d — Multi-réception → Facture groupée : Design Spec

> **For agentic workers:** Use `superpowers:subagent-driven-development` or `superpowers:executing-plans` to implement the plan derived from this spec.

**Goal:** From `ReceptionsIndex`, allow the user to select multiple invoiceable receptions and generate a single consolidated `PurchaseInvoice` pre-filled with all their uninvoiced items via `InvoiceableItemsFilter`.

**Architecture:** Two files modified, no new pages. `ReceptionsIndex.tsx` gains a checkbox column + action bar. `purchase_invoices_controller.rb#new` gains a `reception_ids[]` array branch that runs `InvoiceableItemsFilter` on multiple receptions. All other components (`FacturesForm`, `AchatItemsEditor`, types) are untouched.

**Tech Stack:** React 18, TypeScript strict, `@inertiajs/react`, Vitest + React Testing Library, Ruby on Rails 6 (Ruby 2.6).

---

## File Structure

```
app/frontend/pages/Backend/Receptions/ReceptionsIndex.tsx         ← add selection UI
app/frontend/pages/Backend/Receptions/ReceptionsIndex.test.tsx    ← add 4 new tests
app/controllers/backend/purchase_invoices_controller.rb           ← add reception_ids branch
spec/controllers/backend/purchase_invoices_controller_spec.rb     ← add 1 new example (if file exists)
```

---

## ReceptionsIndex — Selection UI

### New state

```typescript
const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())

function toggleSelect(id: number) {
  setSelectedIds(prev => {
    const next = new Set(prev)
    if (next.has(id)) { next.delete(id) } else { next.add(id) }
    return next
  })
}
```

### Checkbox column

Add a leading column `Sélectionner` to the table header.

For each row:
- If `reception.invoiceable === true`: render `<input type="checkbox" checked={selectedIds.has(reception.id)} onChange={() => toggleSelect(reception.id)} aria-label={`Sélectionner la réception ${reception.number}`} />`
- Otherwise: render `<input type="checkbox" disabled aria-disabled="true" />`

### Action bar

Rendered **above the table**, visible only when `selectedIds.size >= 2`:

```tsx
{selectedIds.size >= 2 && (
  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.75rem 1rem', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '0.5rem', marginBottom: '1rem' }}>
    <span style={{ fontSize: '0.9375rem', color: '#1e40af' }}>
      {selectedIds.size} réception(s) sélectionnée(s)
    </span>
    <a href={`/backend/purchase_invoices/new?${[...selectedIds].map(id => `reception_ids[]=${id}`).join('&')}`} style={{ textDecoration: 'none' }}>
      <button type="button" style={{ background: '#166534', color: '#fff', border: 'none', borderRadius: '0.5rem', padding: '0.5rem 1rem', cursor: 'pointer', fontWeight: 500, fontSize: '0.9rem' }}>
        Créer une facture groupée
      </button>
    </a>
  </div>
)}
```

The action bar does **not** appear when `selectedIds.size === 1` — for a single reception the user should use "Créer une facture" on the Show page.

### URL construction

`/backend/purchase_invoices/new?reception_ids[]=X&reception_ids[]=Y`

Built via: `[...selectedIds].map(id => \`reception_ids[]=${id}\`).join('&')`

---

## Rails Controller — `purchase_invoices_controller.rb`

Extend the existing `new` action. The `reception_ids` branch is inserted **before** the `reception_id` and `duplicate_of` branches:

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
        { id: nil, variant_name: i.variant&.name,
          conditioning_quantity: i.conditioning_quantity.to_f,
          unit_pretax_amount: i.unit_pretax_amount.to_f,
          tax_id: i.tax_id,
          reduction_percentage: 0,
          pretax_amount: i.pretax_amount.to_f,
          amount: i.amount.to_f }
      }
    end
  elsif params[:reception_id]
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

**Ruby 2.6 constraints:** No `filter_map`, `then`, `yield_self`. Use `.select { }.map { }` as shown above.

---

## Testing Strategy

### ReceptionsIndex.test.tsx — 4 new tests (added to existing 6)

All existing 6 tests must still pass. Add these 4:

**Test 7:** Checkbox renders for invoiceable reception
```typescript
it('renders checkbox for invoiceable reception', () => {
  render(<ReceptionsIndex receptions={[{ ...mockReception, invoiceable: true }]} filters={{}} meta={mockMeta} />)
  expect(screen.getByRole('checkbox', { name: /Sélectionner la réception/ })).toBeEnabled()
})
```

**Test 8:** Checkbox disabled for non-invoiceable reception
```typescript
it('renders disabled checkbox for non-invoiceable reception', () => {
  render(<ReceptionsIndex receptions={[{ ...mockReception, invoiceable: false }]} filters={{}} meta={mockMeta} />)
  expect(screen.getByRole('checkbox', { name: /Sélectionner la réception/ })).toBeDisabled()
})
```

**Test 9:** Action bar hidden when fewer than 2 selected
```typescript
it('hides action bar when fewer than 2 receptions selected', () => {
  render(<ReceptionsIndex receptions={invoiceableReceptions.slice(0, 1)} filters={{}} meta={mockMeta} />)
  expect(screen.queryByText(/Créer une facture groupée/)).not.toBeInTheDocument()
})
```

**Test 10:** Action bar appears with correct href when ≥2 selected
```typescript
it('shows action bar with correct href when 2+ invoiceable selected', async () => {
  render(<ReceptionsIndex receptions={invoiceableReceptions} filters={{}} meta={mockMeta} />)
  const checkboxes = screen.getAllByRole('checkbox', { name: /Sélectionner/ })
  await userEvent.click(checkboxes[0])
  await userEvent.click(checkboxes[1])
  const link = screen.getByRole('link', { name: /Créer une facture groupée/ })
  expect(link.getAttribute('href')).toMatch(/reception_ids\[\]=/)
  expect(link.getAttribute('href')).toContain('reception_ids[]=1')
  expect(link.getAttribute('href')).toContain('reception_ids[]=2')
})
```

### RSpec — 1 new example

In `spec/controllers/backend/purchase_invoices_controller_spec.rb` (or create if absent):

```ruby
describe 'GET #new with reception_ids' do
  let!(:reception) { create(:reception, :given, reconciliation_state: :to_reconcile) }

  it 'pre-fills items from multiple receptions' do
    get :new, params: { reception_ids: [reception.id] }
    expect(response).to have_http_status(:ok)
  end
end
```

---

## Scope Exclusions (YAGNI)

- No "select all" checkbox
- No cross-page selection persistence (state resets on navigate/filter)
- No supplier-homogeneity validation (InvoiceableItemsFilter handles mixing naturally)
- No visual indicator on rows already invoiced (reconcile state) beyond the existing badge
- No changes to routes (existing `new` action handles the new param)
