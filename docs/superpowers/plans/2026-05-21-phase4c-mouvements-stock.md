# Phase 4C — Saisie mouvements de stock — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Formulaire inline dans CatalogueShow pour créer des ProductMovement. Nouvelle action create_movement dans ProductsController.

**Architecture:** Extension de Show.tsx + products_controller.rb + route member. Pas de nouvelle page.

**Tech Stack:** React 18, TypeScript strict, Inertia.js v2, Vitest, Ruby on Rails 6 (Ruby 2.6)

---

## Known Limitation

`ProductMovement#population` is computed from the `ProductPopulation` table — manually created movements will show `population = 0` in the "Stock résultant" column. The `delta` value is recorded correctly. This behaviour is documented in the inline form UI note and in the tests.

---

## File Map

| File | Action |
|------|--------|
| `app/frontend/types/catalogue.ts` | Modify — add `MouvementType`, `MOUVEMENT_LABELS`, `MovementFormErrors`, extend `CatalogueShowProps` |
| `app/frontend/pages/Backend/Catalogue/Show.test.tsx` | Modify — add 4 new tests (existing 5 must still pass) |
| `app/frontend/pages/Backend/Catalogue/Show.tsx` | Modify — add `useState`, `handleSubmit`, inline movement form |
| `app/controllers/backend/products_controller.rb` | Modify — add `create_movement` action before `manage_restfully` |
| `config/routes.rb` | Modify — add `member { post :create_movement }` to products resources |

---

## Task 1: TypeScript Types (`catalogue.ts` additions)

**File:** `app/frontend/types/catalogue.ts`

- [ ] **Step 1.1 — Add `MouvementType` union type** after the existing `ProduitMovement` interface

```typescript
export type MouvementType =
  | 'purchase'
  | 'sale'
  | 'consumption'
  | 'birth'
  | 'death'
  | 'butchery'
  | 'loan'
```

- [ ] **Step 1.2 — Add `MOUVEMENT_LABELS` constant** immediately after the type

```typescript
export const MOUVEMENT_LABELS: Record<MouvementType, string> = {
  purchase:    'Achat',
  sale:        'Vente',
  consumption: 'Consommation',
  birth:       'Naissance',
  death:       'Décès',
  butchery:    'Abattage',
  loan:        'Prêt',
}
```

- [ ] **Step 1.3 — Add `MovementFormErrors` interface**

```typescript
export interface MovementFormErrors {
  delta?:         string[]
  mouvement_type?: string[]
  started_at?:    string[]
}
```

- [ ] **Step 1.4 — Extend `CatalogueShowProps`** to accept optional server-side validation errors

Replace the existing `CatalogueShowProps`:

```typescript
export interface CatalogueShowProps {
  produit:          Produit
  movements:        ProduitMovement[]
  movement_errors?: MovementFormErrors
}
```

- [ ] **Step 1.5 — Verify TypeScript** (run after Step 1.4):

```bash
cd /Users/yusper/Downloads/SenagrOS/ekylibre-main && npx tsc --noEmit
```

Expected output: no errors.

**Commit after Task 1:**

```bash
git add app/frontend/types/catalogue.ts
git commit -m "feat(types): add MouvementType, MOUVEMENT_LABELS, MovementFormErrors to catalogue types"
```

---

## Task 2: Failing Tests First (`Show.test.tsx` — 4 new tests)

**File:** `app/frontend/pages/Backend/Catalogue/Show.test.tsx`

The existing 5 tests MUST remain unchanged and passing. The 4 new tests are added inside the same `describe('CatalogueShow', ...)` block.

- [ ] **Step 2.1 — Update the `@inertiajs/react` mock** to also include `post`:

Replace the existing mock at the top of the file:

```typescript
vi.mock('@inertiajs/react', () => ({
  router: { get: vi.fn(), post: vi.fn() },
}))
```

- [ ] **Step 2.2 — Add import for `userEvent`** (already available via `@testing-library/user-event`):

Add at the top of the file:

```typescript
import userEvent from '@testing-library/user-event'
```

- [ ] **Step 2.3 — Add 4 new tests** inside `describe('CatalogueShow', ...)`, after the 5 existing tests:

```typescript
it('renders movement form with correct aria-label', () => {
  renderShow()
  expect(screen.getByRole('form', { name: 'Formulaire mouvement' })).toBeInTheDocument()
})

it('renders delta number input with placeholder', () => {
  renderShow()
  expect(screen.getByPlaceholderText(/ex: 10 ou -5/)).toBeInTheDocument()
})

it('renders type select with "Achat" as default option', () => {
  renderShow()
  const select = screen.getByRole('combobox')
  expect((select as HTMLSelectElement).value).toBe('purchase')
})

it('calls router.post on form submit with correct URL and delta', async () => {
  const { router } = await import('@inertiajs/react')
  renderShow()
  const deltaInput = screen.getByPlaceholderText(/ex: 10 ou -5/)
  await userEvent.clear(deltaInput)
  await userEvent.type(deltaInput, '5')
  const submitButton = screen.getByRole('button', { name: /Enregistrer/i })
  await userEvent.click(submitButton)
  expect(router.post).toHaveBeenCalledWith(
    '/backend/products/1/create_movement',
    expect.objectContaining({ delta: '5' }),
    expect.any(Object)
  )
})
```

- [ ] **Step 2.4 — Run tests to confirm 4 new tests FAIL (red), existing 5 pass (green)**:

```bash
cd /Users/yusper/Downloads/SenagrOS/ekylibre-main && npx vitest run app/frontend/pages/Backend/Catalogue/Show.test.tsx
```

Expected output: 5 passed, 4 failed. The 4 failures are expected (TDD red phase).

**Commit after Task 2:**

```bash
git add app/frontend/pages/Backend/Catalogue/Show.test.tsx
git commit -m "test(catalogue): add 4 failing tests for inline movement form (TDD red phase)"
```

---

## Task 3: Show.tsx Form Implementation

**File:** `app/frontend/pages/Backend/Catalogue/Show.tsx`

- [ ] **Step 3.1 — Update imports** at the top of the file:

```typescript
import { useState } from 'react'
import type { ReactNode } from 'react'
import { router } from '@inertiajs/react'
import { AppShell } from '../../../components/AppShell'
import type {
  CatalogueShowProps,
  MouvementType,
  MovementFormErrors,
} from '../../../types/catalogue'
import { MOUVEMENT_LABELS } from '../../../types/catalogue'
```

- [ ] **Step 3.2 — Update function signature** to destructure `movement_errors`:

```typescript
export default function CatalogueShow({ produit, movements, movement_errors }: CatalogueShowProps) {
```

- [ ] **Step 3.3 — Add state declarations** at the top of the component body, before `const typeCfg`:

```typescript
const [delta, setDelta] = useState('')
const [mouvementType, setMouvementType] = useState<MouvementType>('purchase')
const [startedAt, setStartedAt] = useState(() => new Date().toISOString().slice(0, 10))
const [submitting, setSubmitting] = useState(false)
```

- [ ] **Step 3.4 — Add `handleSubmit` handler** after the state declarations:

```typescript
function handleSubmit(e: React.FormEvent) {
  e.preventDefault()
  setSubmitting(true)
  router.post(
    `/backend/products/${produit.id}/create_movement`,
    { delta, mouvement_type: mouvementType, started_at: startedAt },
    { onFinish: () => setSubmitting(false) }
  )
}
```

- [ ] **Step 3.5 — Add inline form JSX** in the return block, after the closing `</div>` of the movements section (before the closing `</div>` of the root `p-8` div):

```tsx
{/* Nouveau mouvement */}
<h2 className="text-base font-semibold mb-3 mt-8" style={{ color: 'var(--color-text)' }}>
  Saisir un mouvement
</h2>

<p className="text-xs mb-4" style={{ color: 'var(--color-text-muted)' }}>
  Note : la colonne "Stock résultant" sera 0 pour les mouvements saisis manuellement.
</p>

<form
  aria-label="Formulaire mouvement"
  onSubmit={handleSubmit}
  className="rounded-lg border p-5"
  style={{ background: 'var(--color-bg-card)', borderColor: 'var(--color-border)' }}
>
  <div className="grid grid-cols-3 gap-4 mb-4">
    {/* Delta */}
    <div>
      <label
        htmlFor="mv-delta"
        className="block text-xs font-semibold uppercase tracking-wide mb-1.5"
        style={{ color: 'var(--color-text-muted)' }}
      >
        Delta (+ entrée / - sortie)
      </label>
      <input
        id="mv-delta"
        type="number"
        step="any"
        placeholder="ex: 10 ou -5"
        value={delta}
        onChange={e => setDelta(e.target.value)}
        required
        className="w-full rounded border px-3 py-2 text-sm"
        style={{ borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
      />
      {movement_errors?.delta && (
        <p className="text-xs mt-1" style={{ color: '#dc2626' }}>
          {movement_errors.delta.join(', ')}
        </p>
      )}
    </div>

    {/* Type */}
    <div>
      <label
        htmlFor="mv-type"
        className="block text-xs font-semibold uppercase tracking-wide mb-1.5"
        style={{ color: 'var(--color-text-muted)' }}
      >
        Type de mouvement
      </label>
      <select
        id="mv-type"
        value={mouvementType}
        onChange={e => setMouvementType(e.target.value as MouvementType)}
        className="w-full rounded border px-3 py-2 text-sm"
        style={{ borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
      >
        {(Object.keys(MOUVEMENT_LABELS) as MouvementType[]).map(k => (
          <option key={k} value={k}>{MOUVEMENT_LABELS[k]}</option>
        ))}
      </select>
      {movement_errors?.mouvement_type && (
        <p className="text-xs mt-1" style={{ color: '#dc2626' }}>
          {movement_errors.mouvement_type.join(', ')}
        </p>
      )}
    </div>

    {/* Date */}
    <div>
      <label
        htmlFor="mv-date"
        className="block text-xs font-semibold uppercase tracking-wide mb-1.5"
        style={{ color: 'var(--color-text-muted)' }}
      >
        Date
      </label>
      <input
        id="mv-date"
        type="date"
        value={startedAt}
        onChange={e => setStartedAt(e.target.value)}
        required
        className="w-full rounded border px-3 py-2 text-sm"
        style={{ borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
      />
      {movement_errors?.started_at && (
        <p className="text-xs mt-1" style={{ color: '#dc2626' }}>
          {movement_errors.started_at.join(', ')}
        </p>
      )}
    </div>
  </div>

  <button
    type="submit"
    disabled={submitting}
    className="px-4 py-2 rounded text-sm font-medium"
    style={{
      background: 'var(--color-primary)',
      color: '#fff',
      opacity: submitting ? 0.6 : 1,
    }}
  >
    {submitting ? 'Enregistrement…' : 'Enregistrer'}
  </button>
</form>
```

- [ ] **Step 3.6 — Run tests to confirm all 9 pass (green)**:

```bash
cd /Users/yusper/Downloads/SenagrOS/ekylibre-main && npx vitest run app/frontend/pages/Backend/Catalogue/Show.test.tsx
```

Expected output: 9 passed, 0 failed.

- [ ] **Step 3.7 — TypeScript check**:

```bash
cd /Users/yusper/Downloads/SenagrOS/ekylibre-main && npx tsc --noEmit
```

Expected output: no errors.

**Commit after Task 3:**

```bash
git add app/frontend/pages/Backend/Catalogue/Show.tsx
git commit -m "feat(catalogue): add inline stock movement creation form to CatalogueShow"
```

---

## Task 4: Rails Route + `create_movement` Action

### Step 4.1 — Add member route in `config/routes.rb`

**File:** `config/routes.rb`

Locate line 1153 (current content):

```ruby
resources :products, concerns: %i[products many]
```

Replace it with:

```ruby
resources :products, concerns: %i[products many] do
  member do
    post :create_movement
  end
end
```

This generates the route `POST /backend/products/:id/create_movement` with the named helper `create_movement_backend_product_path(@product)`.

- [ ] **Step 4.1 verified** — confirm the route exists:

```bash
cd /Users/yusper/Downloads/SenagrOS/ekylibre-main && bundle exec rails routes | grep create_movement
```

Expected output contains:

```
create_movement_backend_product POST /backend/products/:id/create_movement(.:format) backend/products#create_movement
```

### Step 4.2 — Add `create_movement` action in `products_controller.rb`

**File:** `app/controllers/backend/products_controller.rb`

Insert the following method **immediately before the `manage_restfully` call** (currently on line 81):

```ruby
def create_movement
  return unless @product = find_and_check(:product)

  delta       = params[:delta].to_f
  description = params[:mouvement_type].to_s
  started_at  = params[:started_at].present? ? Time.zone.parse(params[:started_at]) : Time.zone.now

  allowed = %w[birth purchase loan butchery consumption sale death]
  description = 'purchase' unless allowed.include?(description)

  movement = ProductMovement.new(
    product_id:  @product.id,
    delta:        delta,
    started_at:   started_at,
    description:  description
  )

  if movement.save
    redirect_to backend_product_path(@product)
  else
    movements = ProductMovement.where(product_id: @product.id)
                               .order(started_at: :desc)
                               .limit(20)
                               .map { |mv|
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
      movement_errors: movement.errors.messages.each_with_object({}) { |(k, v), h| h[k.to_s] = v }
    }, status: :unprocessable_entity
  end
end
```

Note on Ruby 2.6 compatibility:
- No `filter_map`, no `then`, no `yield_self` — the above uses only `map` and `each_with_object`, which are Ruby 2.6 safe.
- `each_with_object` iterates over `movement.errors.messages` (a Hash of `Symbol => Array<String>`) and converts Symbol keys to String keys for the JSON payload.

- [ ] **Step 4.2 verified** — check syntax:

```bash
cd /Users/yusper/Downloads/SenagrOS/ekylibre-main && bundle exec ruby -c app/controllers/backend/products_controller.rb
```

Expected output: `Syntax OK`

**Commit after Task 4:**

```bash
git add config/routes.rb app/controllers/backend/products_controller.rb
git commit -m "feat(products): add create_movement action and member route for inline stock movement form"
```

---

## Task 5: Final TypeScript Check + Full Test Suite + Commit

- [ ] **Step 5.1 — Full TypeScript check**:

```bash
cd /Users/yusper/Downloads/SenagrOS/ekylibre-main && npx tsc --noEmit
```

Expected output: no errors.

- [ ] **Step 5.2 — Run full Vitest suite**:

```bash
cd /Users/yusper/Downloads/SenagrOS/ekylibre-main && npx vitest run
```

Expected output: all tests pass, no regressions.

- [ ] **Step 5.3 — Run Rails syntax check on full controller**:

```bash
cd /Users/yusper/Downloads/SenagrOS/ekylibre-main && bundle exec ruby -c app/controllers/backend/products_controller.rb
```

Expected output: `Syntax OK`

- [ ] **Step 5.4 — Final commit if not already committed**:

```bash
git add app/frontend/types/catalogue.ts \
        app/frontend/pages/Backend/Catalogue/Show.test.tsx \
        app/frontend/pages/Backend/Catalogue/Show.tsx \
        app/controllers/backend/products_controller.rb \
        config/routes.rb
git commit -m "feat(phase4c): inline stock movement form in CatalogueShow — TDD, types, route, controller"
```

---

## Summary of Changes

| Layer | Change |
|-------|--------|
| TypeScript types | `MouvementType`, `MOUVEMENT_LABELS`, `MovementFormErrors` added; `CatalogueShowProps` extended with `movement_errors?` |
| React component | `Show.tsx` gains 4 state vars, `handleSubmit` POSTing to `create_movement`, 3-column inline form with error display and limitation note |
| Tests | 4 new tests in `Show.test.tsx` (form renders, delta input, default select value, `router.post` call); all 9 tests pass green |
| Rails controller | `create_movement` action added before `manage_restfully`; on success redirects to show; on failure re-renders with `movement_errors` |
| Rails routes | `resources :products` gains a member block with `post :create_movement` |

### UI Limitation Note (in-app)

The form displays the following note below the section heading:

> Note : la colonne "Stock résultant" sera 0 pour les mouvements saisis manuellement.

This is intentional. `ProductMovement#population` is computed from the `ProductPopulation` table which is updated by Ekylibre's internal intervention pipeline, not by direct `ProductMovement` inserts. The `delta` value is always persisted correctly.
