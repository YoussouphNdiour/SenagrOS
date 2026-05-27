# Phase 6 — Enrichissements Priorité 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Cinq enrichissements sur les modules existants — sévérité alertes, KPI dépenses dashboard, âge produit, pagination/filtre mouvements catalogue, lignes d'achat budget.

**Architecture:** Modifications chirurgicales de fichiers existants uniquement. Pas de nouveau fichier sauf les types ajoutés inline. Chaque tâche touche 2-3 fichiers maximum et produit des commits indépendants.

**Tech Stack:** React 18, TypeScript strict, Inertia.js v2, Vitest + React Testing Library, Ruby on Rails 6 (Ruby 2.6).

---

## File Structure

```
app/frontend/pages/Backend/Alertes/Index.test.tsx       ← +2 tests (sévérité)
app/frontend/pages/Backend/Alertes/Index.tsx            ← +dot sévérité par alerte
app/controllers/backend/alerts_controller.rb            ← +tri par sévérité

app/frontend/pages/Backend/Dashboard/Home.test.tsx      ← +2 tests (dépenses)
app/frontend/pages/Backend/Dashboard/Home.tsx           ← +KpiCard Dépenses (8ème)
app/controllers/backend/dashboards_controller.rb        ← implémente safe_expenses_xof

app/frontend/types/catalogue.ts                         ← +born_at dans Produit, +MovementMeta, update CatalogueShowProps
app/frontend/pages/Backend/Catalogue/Show.test.tsx      ← update renderShow + +5 tests
app/frontend/pages/Backend/Catalogue/Show.tsx           ← +âge, +filtre, +pagination, +aria-label select
app/controllers/backend/products_controller.rb          ← +born_at dans produit_json, +pagination mouvements

app/frontend/types/budget.ts                            ← +PurchaseLine, update BudgetShowProps
app/frontend/pages/Backend/Budgets/Show.test.tsx        ← update renderShow + +3 tests
app/frontend/pages/Backend/Budgets/Show.tsx             ← +tableau lignes d'achat
app/controllers/backend/project_budgets_controller.rb   ← +purchase_lines dans show
```

---

## Task 1: E1 — Alertes : sévérité visible + tri

**Files:**
- Modify: `app/frontend/pages/Backend/Alertes/Index.test.tsx`
- Modify: `app/frontend/pages/Backend/Alertes/Index.tsx`
- Modify: `app/controllers/backend/alerts_controller.rb`

- [ ] **Step 1: Add 2 failing tests to Index.test.tsx**

Append to the `describe('AlertesIndex', ...)` block in `app/frontend/pages/Backend/Alertes/Index.test.tsx`:

```typescript
  it('renders a severity dot for each alert', () => {
    renderIndex()
    const dots = screen.getAllByLabelText(/Sévérité/)
    expect(dots.length).toBeGreaterThanOrEqual(1)
  })

  it('renders severity dot with aria-label matching the severity level', () => {
    renderIndex()
    // mockAlertes[0] has severity 'high'
    expect(screen.getByLabelText('Sévérité high')).toBeInTheDocument()
  })
```

- [ ] **Step 2: Run — confirm 2 FAIL**

```bash
cd /Users/yusper/Downloads/SenagrOS/ekylibre-main && npx vitest run app/frontend/pages/Backend/Alertes/Index.test.tsx 2>&1 | tail -15
```

Expected: 2 tests failing (getAllByLabelText returns empty).

- [ ] **Step 3: Add severity dot to Index.tsx**

In `app/frontend/pages/Backend/Alertes/Index.tsx`, add after the `ALERT_ORDER` constant (line 12):

```typescript
const SEVERITY_COLOR: Record<string, string> = {
  high:   '#dc2626',
  medium: '#f59e0b',
  low:    '#6b7280',
}
```

Then in the `<li>` for each alert (currently line 62), add a dot **before** the existing badge `<span>`:

Replace:
```tsx
                  <li key={alerte.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <span style={{ background: cfg.bg, color: cfg.color, fontSize: '0.7rem', fontWeight: 600, padding: '0.125rem 0.5rem', borderRadius: '9999px' }}>
                      {cfg.label}
                    </span>
```

With:
```tsx
                  <li key={alerte.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <span
                      aria-label={`Sévérité ${alerte.severity}`}
                      style={{ width: '8px', height: '8px', borderRadius: '50%', flexShrink: 0, background: SEVERITY_COLOR[alerte.severity] ?? '#6b7280' }}
                    />
                    <span style={{ background: cfg.bg, color: cfg.color, fontSize: '0.7rem', fontWeight: 600, padding: '0.125rem 0.5rem', borderRadius: '9999px' }}>
                      {cfg.label}
                    </span>
```

- [ ] **Step 4: Run — confirm all 8 PASS**

```bash
cd /Users/yusper/Downloads/SenagrOS/ekylibre-main && npx vitest run app/frontend/pages/Backend/Alertes/Index.test.tsx --reporter=verbose 2>&1 | tail -15
```

Expected: **8/8 PASS**

- [ ] **Step 5: Add severity sort to alerts_controller.rb**

In `app/controllers/backend/alerts_controller.rb`, add a constant just before `def index` (after line 3):

```ruby
    SEVERITY_ORDER = { 'high' => 0, 'medium' => 1, 'low' => 2 }.freeze
```

Then replace (line 43):
```ruby
      alertes = overdue + dead_animals + departed_workers
```

With:
```ruby
      alertes = (overdue + dead_animals + departed_workers)
                  .sort_by { |a| SEVERITY_ORDER[a[:severity].to_s] || 99 }
```

- [ ] **Step 6: Verify Ruby syntax**

```bash
cd /Users/yusper/Downloads/SenagrOS/ekylibre-main && ruby -c app/controllers/backend/alerts_controller.rb
```

Expected: `Syntax OK`

- [ ] **Step 7: TypeScript check**

```bash
cd /Users/yusper/Downloads/SenagrOS/ekylibre-main && yarn tsc --noEmit 2>&1 | tail -5
```

Expected: no errors.

- [ ] **Step 8: Commit**

```bash
cd /Users/yusper/Downloads/SenagrOS/ekylibre-main && git add app/frontend/pages/Backend/Alertes/Index.test.tsx app/frontend/pages/Backend/Alertes/Index.tsx app/controllers/backend/alerts_controller.rb && git commit -m "feat: display severity dot per alert and sort by severity (high first)"
```

---

## Task 2: E2 — Dashboard : KPI Dépenses campagne

**Files:**
- Modify: `app/frontend/pages/Backend/Dashboard/Home.test.tsx`
- Modify: `app/frontend/pages/Backend/Dashboard/Home.tsx`
- Modify: `app/controllers/backend/dashboards_controller.rb`

- [ ] **Step 1: Add 2 failing tests to Home.test.tsx**

Append to the `describe('Dashboard Home', ...)` block in `app/frontend/pages/Backend/Dashboard/Home.test.tsx`:

```typescript
  it('renders Dépenses KPI card when expenses_xof is a number', () => {
    render(<Home {...defaultProps} kpis={{ ...defaultProps.kpis, expenses_xof: 125000 }} />)
    expect(screen.getByText('Dépenses campagne')).toBeInTheDocument()
    expect(screen.getByText('125000')).toBeInTheDocument()
  })

  it('renders Dépenses KPI card with dash when expenses_xof is null', () => {
    render(<Home {...defaultProps} kpis={{ ...defaultProps.kpis, expenses_xof: null }} />)
    expect(screen.getByText('Dépenses campagne')).toBeInTheDocument()
    // KpiCard renders '—' for null values
    expect(screen.getByText('—')).toBeInTheDocument()
  })
```

- [ ] **Step 2: Run — confirm 2 FAIL**

```bash
cd /Users/yusper/Downloads/SenagrOS/ekylibre-main && npx vitest run app/frontend/pages/Backend/Dashboard/Home.test.tsx 2>&1 | tail -15
```

Expected: 2 tests failing ("Dépenses campagne" not found).

- [ ] **Step 3: Add Dépenses KpiCard to Home.tsx**

In `app/frontend/pages/Backend/Dashboard/Home.tsx`, add `Wallet` to the lucide-react import (line 2):

```typescript
import { Sprout, Map as MapIcon, Activity, CalendarClock, UserCog, Layers, PawPrint, AlertTriangle, Wallet } from 'lucide-react'
```

Then add the 8th KpiCard inside the grid (after line 39, the Animaux vivants card):

```tsx
        <KpiCard title="Dépenses campagne"           value={kpis.expenses_xof}           unit="XOF" icon={<Wallet size={16} />} />
```

- [ ] **Step 4: Run — confirm all 11 PASS**

```bash
cd /Users/yusper/Downloads/SenagrOS/ekylibre-main && npx vitest run app/frontend/pages/Backend/Dashboard/Home.test.tsx --reporter=verbose 2>&1 | tail -15
```

Expected: **11/11 PASS**

- [ ] **Step 5: Implement safe_expenses_xof in dashboards_controller.rb**

Read the current `app/controllers/backend/dashboards_controller.rb` to find:
1. The `expenses_xof: nil,` line in `def index` — replace `nil` with `safe_expenses_xof`
2. The `private` section — add the new helper method

Replace the `expenses_xof: nil,` line with:
```ruby
          expenses_xof:      safe_expenses_xof,
```

Add the following method in the `private` section (after `safe_workers_count`):

```ruby
      def safe_expenses_xof
        started = current_campaign&.started_on
        return nil unless started

        stopped = current_campaign&.stopped_on || Time.zone.today
        PurchaseItem.joins(:purchase)
                    .where('purchases.invoiced_at::date BETWEEN ? AND ?', started, stopped)
                    .sum(:pretax_amount)
                    .to_f
      rescue ActiveRecord::StatementInvalid, PG::Error, NoMethodError
        nil
      end
```

- [ ] **Step 6: Verify Ruby syntax**

```bash
cd /Users/yusper/Downloads/SenagrOS/ekylibre-main && ruby -c app/controllers/backend/dashboards_controller.rb
```

Expected: `Syntax OK`

- [ ] **Step 7: TypeScript check**

```bash
cd /Users/yusper/Downloads/SenagrOS/ekylibre-main && yarn tsc --noEmit 2>&1 | tail -5
```

Expected: no errors.

- [ ] **Step 8: Commit**

```bash
cd /Users/yusper/Downloads/SenagrOS/ekylibre-main && git add app/frontend/pages/Backend/Dashboard/Home.test.tsx app/frontend/pages/Backend/Dashboard/Home.tsx app/controllers/backend/dashboards_controller.rb && git commit -m "feat: add Dépenses campagne KPI card to dashboard"
```

---

## Task 3: E4 — Catalogue : âge calculé pour animaux et plantes

**Files:**
- Modify: `app/frontend/types/catalogue.ts`
- Modify: `app/frontend/pages/Backend/Catalogue/Show.test.tsx`
- Modify: `app/frontend/pages/Backend/Catalogue/Show.tsx`
- Modify: `app/controllers/backend/products_controller.rb`

- [ ] **Step 1: Add born_at to Produit type in catalogue.ts**

In `app/frontend/types/catalogue.ts`, update the `Produit` interface — add `born_at: string | null` after `dead_at`:

```typescript
export interface Produit {
  id: number
  name: string
  number: string
  produit_type: ProduitType
  population: number
  unit_name: string
  description: string | null
  dead_at: string | null
  born_at: string | null
}
```

- [ ] **Step 2: Add 2 failing tests to Show.test.tsx**

In `app/frontend/pages/Backend/Catalogue/Show.test.tsx`, update `mockProduit` to add `born_at: null` (required by the new type):

```typescript
const mockProduit = {
  id: 1,
  name: 'Engrais NPK',
  number: 'P001',
  produit_type: 'Matter' as const,
  population: 42.5,
  unit_name: 'kg',
  description: null,
  dead_at: null,
  born_at: null,
}
```

Then append to the `describe('CatalogueShow', ...)` block:

```typescript
  it('shows age in header for Animal type when born_at is set', () => {
    renderShow({
      produit: { ...mockProduit, produit_type: 'Animal' as const, born_at: '2023-01-15T00:00:00Z' },
    })
    expect(screen.getByText(/Âge/)).toBeInTheDocument()
  })

  it('does not show Âge label for Matter type even with born_at set', () => {
    renderShow({
      produit: { ...mockProduit, produit_type: 'Matter' as const, born_at: '2023-01-15T00:00:00Z' },
    })
    expect(screen.queryByText(/Âge/)).not.toBeInTheDocument()
  })
```

- [ ] **Step 3: Run — confirm 2 FAIL (and existing 9 still PASS)**

```bash
cd /Users/yusper/Downloads/SenagrOS/ekylibre-main && npx vitest run app/frontend/pages/Backend/Catalogue/Show.test.tsx 2>&1 | tail -15
```

Expected: 2 new tests failing, 9 existing passing.

- [ ] **Step 4: Add computeAge helper and age display to Show.tsx**

In `app/frontend/pages/Backend/Catalogue/Show.tsx`, add the `computeAge` function just before the `CatalogueShow` component (after the `TYPE_CONFIG` and `formatDate` declarations):

```typescript
function computeAge(bornAtIso: string): string {
  const born = new Date(bornAtIso)
  const now = new Date()
  const months = (now.getFullYear() - born.getFullYear()) * 12 + (now.getMonth() - born.getMonth())
  if (months < 1) return "Moins d'1 mois"
  if (months < 12) return `${months} mois`
  const years = Math.floor(months / 12)
  const rem = months % 12
  return rem > 0
    ? `${years} an${years > 1 ? 's' : ''} ${rem} mois`
    : `${years} an${years > 1 ? 's' : ''}`
}
```

Then in the header card section (after the `N°` div, currently line 80-86), add:

```tsx
        {(produit.produit_type === 'Animal' || produit.produit_type === 'Plant') && produit.born_at && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: 'var(--color-text-muted)' }}>
              Âge
            </p>
            <p className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>
              {computeAge(produit.born_at)}
            </p>
          </div>
        )}
```

- [ ] **Step 5: Add born_at to produit_json in products_controller.rb**

In `app/controllers/backend/products_controller.rb`, find the `produit_json` method (around line 474). Add `born_at` after `dead_at`:

```ruby
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
          population: (product.population.to_f rescue 0.0),
          unit_name: product.conditioning_unit&.name || product.variant&.default_unit&.name || '',
          description: product.description,
          dead_at: product.dead_at&.to_date&.iso8601,
          born_at: product.born_at&.to_date&.iso8601
        }
      end
```

- [ ] **Step 6: Run — confirm all 11 PASS**

```bash
cd /Users/yusper/Downloads/SenagrOS/ekylibre-main && npx vitest run app/frontend/pages/Backend/Catalogue/Show.test.tsx --reporter=verbose 2>&1 | tail -15
```

Expected: **11/11 PASS**

- [ ] **Step 7: TypeScript check**

```bash
cd /Users/yusper/Downloads/SenagrOS/ekylibre-main && yarn tsc --noEmit 2>&1 | tail -5
```

Expected: no errors.

- [ ] **Step 8: Verify Ruby syntax**

```bash
cd /Users/yusper/Downloads/SenagrOS/ekylibre-main && ruby -c app/controllers/backend/products_controller.rb
```

Expected: `Syntax OK`

- [ ] **Step 9: Commit**

```bash
cd /Users/yusper/Downloads/SenagrOS/ekylibre-main && git add app/frontend/types/catalogue.ts app/frontend/pages/Backend/Catalogue/Show.test.tsx app/frontend/pages/Backend/Catalogue/Show.tsx app/controllers/backend/products_controller.rb && git commit -m "feat: display computed age for Animal and Plant products in CatalogueShow"
```

---

## Task 4: E3 — Catalogue : pagination + filtre par type de mouvement

**Files:**
- Modify: `app/frontend/types/catalogue.ts`
- Modify: `app/frontend/pages/Backend/Catalogue/Show.test.tsx`
- Modify: `app/frontend/pages/Backend/Catalogue/Show.tsx`
- Modify: `app/controllers/backend/products_controller.rb`

### Context important

After this task, `CatalogueShowProps` gains two required fields: `movement_meta` and `movement_filter`. The existing `renderShow()` helper in the test file must be updated to supply default values. Additionally, a second `<select>` (the filter select) will coexist with the form's mouvement type select — test 8 must be updated to use a specific query.

- [ ] **Step 1: Update CatalogueShowProps in catalogue.ts**

In `app/frontend/types/catalogue.ts`, add `MovementMeta` interface and update `CatalogueShowProps`:

```typescript
export interface MovementMeta {
  total: number
  page: number
  per_page: number
}

export interface CatalogueShowProps {
  produit: Produit
  movements: ProduitMovement[]
  movement_errors?: MovementFormErrors
  movement_meta: MovementMeta
  movement_filter: string | null
}
```

- [ ] **Step 2: Update Show.test.tsx — fix renderShow + add 3 failing tests**

In `app/frontend/pages/Backend/Catalogue/Show.test.tsx`:

1. Update the `renderShow` helper to include the new required props:

```typescript
function renderShow(overrides: Partial<CatalogueShowProps> = {}) {
  const props: CatalogueShowProps = {
    produit: mockProduit,
    movements: [mockMovement],
    movement_meta: { total: 1, page: 1, per_page: 20 },
    movement_filter: null,
    ...overrides,
  }
  return render(<CatalogueShow {...props} />)
}
```

2. Update test 8 (currently uses `screen.getByRole('combobox')`) to target the form select specifically, because after this task there will be two selects. Replace:

```typescript
  it('renders mouvement type select with Achat as default', () => {
    renderShow()
    const select = screen.getByRole('combobox')
    expect(select).toBeInTheDocument()
    expect((select as HTMLSelectElement).value).toBe('purchase')
  })
```

With:

```typescript
  it('renders mouvement type select with Achat as default', () => {
    renderShow()
    const select = screen.getByRole('combobox', { name: 'Type de mouvement' })
    expect(select).toBeInTheDocument()
    expect((select as HTMLSelectElement).value).toBe('purchase')
  })
```

3. Append 3 new failing tests:

```typescript
  it('renders movement filter select', () => {
    renderShow()
    expect(screen.getByRole('combobox', { name: 'Filtrer les mouvements par type' })).toBeInTheDocument()
  })

  it('shows pagination when total exceeds per_page', () => {
    renderShow({ movement_meta: { total: 25, page: 1, per_page: 20 } })
    expect(screen.getByRole('button', { name: 'Suivant' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Précédent' })).toBeInTheDocument()
  })

  it('hides pagination when total fits in one page', () => {
    renderShow({ movement_meta: { total: 5, page: 1, per_page: 20 } })
    expect(screen.queryByRole('button', { name: 'Suivant' })).not.toBeInTheDocument()
  })
```

- [ ] **Step 3: Run — confirm 3 new tests FAIL, existing 11 PASS (except test 8 which is now updated)**

```bash
cd /Users/yusper/Downloads/SenagrOS/ekylibre-main && npx vitest run app/frontend/pages/Backend/Catalogue/Show.test.tsx 2>&1 | tail -15
```

Expected: 3 new tests failing, 11 existing passing (including updated test 8 which now fails because the filter select doesn't exist yet and the existing form select has no aria-label).

Note: If test 8 now fails because the aria-label is not yet on the form select, that is expected — it will be fixed in Step 4.

- [ ] **Step 4: Update Show.tsx — add filter select, pagination, aria-labels**

In `app/frontend/pages/Backend/Catalogue/Show.tsx`:

**4a — Update component signature** (line 20):

```tsx
export default function CatalogueShow({ produit, movements, movement_errors, movement_meta, movement_filter }: CatalogueShowProps) {
```

**4b — Add `aria-label` to the existing form's movement type `<select>`** (currently has no aria-label, around line 176):

```tsx
              <select
                aria-label="Type de mouvement"
                value={mouvementType}
                onChange={e => setMouvementType(e.target.value as MouvementType)}
                className="w-full border rounded px-3 py-2 text-sm"
                style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg)' }}
              >
```

**4c — Replace the `<h2>Mouvements récents</h2>` block** (currently line 89-91) with:

```tsx
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-base font-semibold" style={{ color: 'var(--color-text)' }}>
          Mouvements récents
        </h2>
        <div className="flex items-center gap-2">
          <label className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
            Type :
          </label>
          <select
            aria-label="Filtrer les mouvements par type"
            value={movement_filter ?? ''}
            onChange={e => {
              const val = e.target.value
              router.get(`/backend/products/${produit.id}`, val ? { movement_type: val } : {})
            }}
            className="border rounded px-2 py-1 text-sm"
            style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)' }}
          >
            <option value="">Tous</option>
            {(Object.keys(MOUVEMENT_LABELS) as MouvementType[]).map(k => (
              <option key={k} value={k}>{MOUVEMENT_LABELS[k]}</option>
            ))}
          </select>
        </div>
      </div>
```

**4d — Add pagination below the movements table** (after the closing `</div>` of the movements section, before `{/* Movement form */}`):

```tsx
      {movement_meta.total > movement_meta.per_page && (
        <div className="flex justify-center items-center gap-2 mt-3">
          <button
            aria-label="Précédent"
            disabled={movement_meta.page <= 1}
            onClick={() => router.get(`/backend/products/${produit.id}`, {
              movement_page: String(movement_meta.page - 1),
              ...(movement_filter ? { movement_type: movement_filter } : {}),
            })}
            style={{
              padding: '0.375rem 0.875rem', borderRadius: '0.375rem',
              border: '1px solid var(--color-border)', background: 'var(--color-bg-card)',
              cursor: movement_meta.page <= 1 ? 'not-allowed' : 'pointer',
              opacity: movement_meta.page <= 1 ? 0.5 : 1,
              color: 'var(--color-text)',
            }}
          >
            Précédent
          </button>
          <span className="text-sm px-2" style={{ color: 'var(--color-text-muted)' }}>
            Page {movement_meta.page} / {Math.ceil(movement_meta.total / movement_meta.per_page)}
          </span>
          <button
            aria-label="Suivant"
            disabled={movement_meta.page * movement_meta.per_page >= movement_meta.total}
            onClick={() => router.get(`/backend/products/${produit.id}`, {
              movement_page: String(movement_meta.page + 1),
              ...(movement_filter ? { movement_type: movement_filter } : {}),
            })}
            style={{
              padding: '0.375rem 0.875rem', borderRadius: '0.375rem',
              border: '1px solid var(--color-border)', background: 'var(--color-bg-card)',
              cursor: movement_meta.page * movement_meta.per_page >= movement_meta.total ? 'not-allowed' : 'pointer',
              opacity: movement_meta.page * movement_meta.per_page >= movement_meta.total ? 0.5 : 1,
              color: 'var(--color-text)',
            }}
          >
            Suivant
          </button>
        </div>
      )}
```

- [ ] **Step 5: Run — confirm all 14 PASS**

```bash
cd /Users/yusper/Downloads/SenagrOS/ekylibre-main && npx vitest run app/frontend/pages/Backend/Catalogue/Show.test.tsx --reporter=verbose 2>&1 | tail -20
```

Expected: **14/14 PASS**

- [ ] **Step 6: Update products_controller.rb show action**

In `app/controllers/backend/products_controller.rb`, replace the entire `show` action (lines 61-79) with:

```ruby
    def show
      return unless @product = find_and_check(:product)

      page           = [params[:movement_page].to_i, 1].max
      per_page       = 20
      movement_filter = params[:movement_type].presence

      mvt_scope = ProductMovement.where(product_id: @product.id)
      mvt_scope = mvt_scope.where(description: movement_filter) if movement_filter
      mvt_scope = mvt_scope.order(started_at: :desc)

      total_movements = mvt_scope.count
      movements = mvt_scope.offset((page - 1) * per_page).limit(per_page).map { |mv|
        {
          delta:       mv.delta.to_f,
          population:  mv.population.to_f,
          started_at:  mv.started_at.iso8601,
          description: mv.description
        }
      }

      render inertia: 'Backend/Catalogue/Show', props: {
        produit:         produit_json(@product),
        movements:       movements,
        movement_meta:   { total: total_movements, page: page, per_page: per_page },
        movement_filter: movement_filter
      }
    end
```

Also update the `create_movement` action — it re-renders Show on error. Add the missing props there too (replace the error render block, around line 113):

```ruby
        render inertia: 'Backend/Catalogue/Show', props: {
          produit:         produit_json(@product),
          movements:       movements,
          movement_meta:   { total: movements.size, page: 1, per_page: 20 },
          movement_filter: nil,
          movement_errors: movement.errors.messages.each_with_object({}) { |(k, v), h| h[k.to_s] = v }
        }, status: :unprocessable_entity
```

- [ ] **Step 7: Verify Ruby syntax**

```bash
cd /Users/yusper/Downloads/SenagrOS/ekylibre-main && ruby -c app/controllers/backend/products_controller.rb
```

Expected: `Syntax OK`

- [ ] **Step 8: TypeScript check**

```bash
cd /Users/yusper/Downloads/SenagrOS/ekylibre-main && yarn tsc --noEmit 2>&1 | tail -5
```

Expected: no errors.

- [ ] **Step 9: Commit**

```bash
cd /Users/yusper/Downloads/SenagrOS/ekylibre-main && git add app/frontend/types/catalogue.ts app/frontend/pages/Backend/Catalogue/Show.test.tsx app/frontend/pages/Backend/Catalogue/Show.tsx app/controllers/backend/products_controller.rb && git commit -m "feat: add movement type filter and pagination to CatalogueShow"
```

---

## Task 5: E5 — Budget : lignes d'achat + total HT

**Files:**
- Modify: `app/frontend/types/budget.ts`
- Modify: `app/frontend/pages/Backend/Budgets/Show.test.tsx`
- Modify: `app/frontend/pages/Backend/Budgets/Show.tsx`
- Modify: `app/controllers/backend/project_budgets_controller.rb`

### Context important

`BudgetShowProps` gains two required fields: `purchase_lines` and `total_pretax_amount`. The existing `renderShow()` helper must supply defaults.

- [ ] **Step 1: Update budget.ts**

In `app/frontend/types/budget.ts`, add `PurchaseLine` interface and update `BudgetShowProps`:

```typescript
export interface PurchaseLine {
  id: number
  label: string
  quantity: number
  pretax_amount: number
  currency: string
  purchase_number: string
}

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
  purchase_lines: PurchaseLine[]
  total_pretax_amount: number
}

export interface BudgetFormProps {
  budget: ProjectBudget
  errors: ProjectBudgetFormErrors
  mode: 'new' | 'edit'
}
```

- [ ] **Step 2: Update Show.test.tsx — fix renderShow + add 3 failing tests**

In `app/frontend/pages/Backend/Budgets/Show.test.tsx`:

1. Update `renderShow` to supply defaults for new required props:

```typescript
function renderShow(overrides: Partial<typeof mockBudget> = {}) {
  return render(
    <BudgetShow
      budget={{ ...mockBudget, ...overrides }}
      purchase_lines={[]}
      total_pretax_amount={0}
    />
  )
}
```

2. Append 3 new failing tests:

```typescript
  it('shows empty state when no purchase lines', () => {
    render(<BudgetShow budget={mockBudget} purchase_lines={[]} total_pretax_amount={0} />)
    expect(screen.getByText(/Aucune ligne d'achat/)).toBeInTheDocument()
  })

  it('renders purchase lines table when lines are present', () => {
    const lines = [
      { id: 1, label: 'Engrais NPK', quantity: 50, pretax_amount: 25000, currency: 'XOF', purchase_number: 'BC-001' },
    ]
    render(<BudgetShow budget={mockBudget} purchase_lines={lines} total_pretax_amount={25000} />)
    expect(screen.getByText('Engrais NPK')).toBeInTheDocument()
    expect(screen.getByText('BC-001')).toBeInTheDocument()
  })

  it('renders total pretax amount row', () => {
    const lines = [
      { id: 1, label: 'Semences', quantity: 10, pretax_amount: 15000, currency: 'XOF', purchase_number: 'BC-002' },
    ]
    render(<BudgetShow budget={mockBudget} purchase_lines={lines} total_pretax_amount={15000} />)
    expect(screen.getByText('Total HT')).toBeInTheDocument()
  })
```

- [ ] **Step 3: Run — confirm 3 new FAIL, existing 5 PASS**

```bash
cd /Users/yusper/Downloads/SenagrOS/ekylibre-main && npx vitest run app/frontend/pages/Backend/Budgets/Show.test.tsx 2>&1 | tail -15
```

Expected: 3 new tests failing, 5 existing passing.

- [ ] **Step 4: Update Show.tsx — add purchase lines section**

In `app/frontend/pages/Backend/Budgets/Show.tsx`:

**4a — Update imports and signature**:

```tsx
import type { BudgetShowProps, PurchaseLine } from '../../../types/budget'

export default function BudgetShow({ budget, purchase_lines, total_pretax_amount }: BudgetShowProps) {
```

**4b — Add purchase lines section after the bottom buttons** (after the closing `</div>` of the buttons row):

```tsx
      {/* Purchase lines */}
      <div style={{ marginTop: '2rem' }}>
        <h2 className="text-base font-semibold mb-3" style={{ color: 'var(--color-text)' }}>
          Lignes d'achat ({purchase_lines.length})
        </h2>
        {purchase_lines.length === 0 ? (
          <p className="text-sm py-4 text-center" style={{ color: 'var(--color-text-muted)' }}>
            Aucune ligne d'achat liée à ce budget.
          </p>
        ) : (
          <div style={{ background: 'var(--color-bg-card)', borderRadius: '0.5rem', border: '1px solid var(--color-border)', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--color-border)', background: 'var(--color-bg)' }}>
                  {['Désignation', 'Bon de commande', 'Quantité', 'Montant HT'].map(h => (
                    <th key={h} className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--color-text-muted)' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {purchase_lines.map((line: PurchaseLine) => (
                  <tr key={line.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                    <td className="px-4 py-2" style={{ color: 'var(--color-text)' }}>{line.label}</td>
                    <td className="px-4 py-2" style={{ color: 'var(--color-text-muted)' }}>{line.purchase_number || '—'}</td>
                    <td className="px-4 py-2 tabular-nums" style={{ color: 'var(--color-text)' }}>{line.quantity}</td>
                    <td className="px-4 py-2 tabular-nums font-medium" style={{ color: 'var(--color-text)' }}>
                      {line.pretax_amount.toLocaleString('fr-FR')} {line.currency}
                    </td>
                  </tr>
                ))}
                <tr style={{ borderTop: '2px solid var(--color-border)', background: 'var(--color-bg)' }}>
                  <td colSpan={3} className="px-4 py-2 font-semibold text-right" style={{ color: 'var(--color-text)' }}>
                    Total HT
                  </td>
                  <td className="px-4 py-2 tabular-nums font-bold" style={{ color: 'var(--color-text)' }}>
                    {total_pretax_amount.toLocaleString('fr-FR')} {purchase_lines[0]?.currency ?? 'XOF'}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>
```

- [ ] **Step 5: Run — confirm all 8 PASS**

```bash
cd /Users/yusper/Downloads/SenagrOS/ekylibre-main && npx vitest run app/frontend/pages/Backend/Budgets/Show.test.tsx --reporter=verbose 2>&1 | tail -15
```

Expected: **8/8 PASS**

- [ ] **Step 6: Update project_budgets_controller.rb show action**

In `app/controllers/backend/project_budgets_controller.rb`, replace the `show` action:

```ruby
    def show
      purchase_lines = @budget.purchase_items.includes(:purchase, :variant).map { |item|
        {
          id:              item.id,
          label:           item.label.presence || item.variant_name.to_s,
          quantity:        item.quantity.to_f,
          pretax_amount:   item.pretax_amount.to_f,
          currency:        item.currency.to_s,
          purchase_number: item.purchase&.number.to_s
        }
      }
      total_pretax = @budget.purchase_items.sum(:pretax_amount).to_f

      render inertia: 'Backend/Budgets/Show', props: {
        budget:              budget_json(@budget),
        purchase_lines:      purchase_lines,
        total_pretax_amount: total_pretax
      }
    rescue ActiveRecord::StatementInvalid, PG::Error => e
      Rails.logger.error("[ProjectBudgetsController#show] DB error: #{e.message}")
      render inertia: 'Backend/Budgets/Show', props: {
        budget:              budget_json(@budget),
        purchase_lines:      [],
        total_pretax_amount: 0.0
      }
    end
```

- [ ] **Step 7: Verify Ruby syntax**

```bash
cd /Users/yusper/Downloads/SenagrOS/ekylibre-main && ruby -c app/controllers/backend/project_budgets_controller.rb
```

Expected: `Syntax OK`

- [ ] **Step 8: Full vitest run — no regressions**

```bash
cd /Users/yusper/Downloads/SenagrOS/ekylibre-main && npx vitest run 2>&1 | tail -5
```

Expected: all tests pass.

- [ ] **Step 9: TypeScript check**

```bash
cd /Users/yusper/Downloads/SenagrOS/ekylibre-main && yarn tsc --noEmit 2>&1 | tail -5
```

Expected: no errors.

- [ ] **Step 10: Commit**

```bash
cd /Users/yusper/Downloads/SenagrOS/ekylibre-main && git add app/frontend/types/budget.ts app/frontend/pages/Backend/Budgets/Show.test.tsx app/frontend/pages/Backend/Budgets/Show.tsx app/controllers/backend/project_budgets_controller.rb && git commit -m "feat: show purchase lines and total HT in BudgetShow"
```
