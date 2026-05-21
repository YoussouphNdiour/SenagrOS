# Phase 4C — Saisie de mouvements de stock depuis Catalogue : Design Spec

> **For agentic workers:** Use `superpowers:subagent-driven-development` or `superpowers:executing-plans` to implement the plan derived from this spec.

**Goal:** Permettre la saisie d'un mouvement de stock manuel depuis la page `CatalogueShow`. L'utilisateur entre un delta (positif = entrée, négatif = sortie), un type de mouvement (enum Ekylibre) et une date. Le serveur crée un `ProductMovement`. La page `CatalogueShow` est enrichie d'un formulaire inline au-dessous du tableau de mouvements.

**Architecture:** Formulaire inline dans `CatalogueShow.tsx` (pas de nouveau composant, pas de nouvelle page). Une nouvelle action `create_movement` dans `ProductsController`. Une nouvelle route POST custom (sans toucher aux resources :products existants). Nouveaux types TS ajoutés à `types/catalogue.ts`.

**Known limitation:** `ProductMovement#population` est calculé via `ProductPopulation` — un enregistrement créé manuellement affichera `population = 0` dans la colonne "Stock résultant". Le `delta` est enregistré correctement. C'est une contrainte des internals Ekylibre documentée dans ce spec.

**Tech Stack:** React 18, TypeScript strict, `@inertiajs/react`, Vitest + React Testing Library, Ruby on Rails 6 (Ruby 2.6).

---

## File Structure

```
app/frontend/types/catalogue.ts                          ← add MovementFormData + extend CatalogueShowProps
app/frontend/pages/Backend/Catalogue/Show.tsx            ← add inline movement form
app/frontend/pages/Backend/Catalogue/Show.test.tsx       ← add 4 new tests (existing 5 must still pass)
app/controllers/backend/products_controller.rb           ← add create_movement action
config/routes.rb                                         ← add POST route for movements
```

---

## TypeScript Types — `types/catalogue.ts`

Add at end of file:

```typescript
export type MouvementType =
  | 'purchase'
  | 'sale'
  | 'consumption'
  | 'birth'
  | 'death'
  | 'butchery'
  | 'loan'

export const MOUVEMENT_LABELS: Record<MouvementType, string> = {
  purchase:    'Achat',
  sale:        'Vente',
  consumption: 'Consommation',
  birth:       'Naissance',
  death:       'Décès',
  butchery:    'Abattage',
  loan:        'Prêt',
}

export interface MovementFormErrors {
  delta?: string[]
  mouvement_type?: string[]
  started_at?: string[]
}

export interface CatalogueShowProps {
  produit: Produit
  movements: ProduitMovement[]
  movement_errors?: MovementFormErrors  // ← new (optional, shown after failed submit)
}
```

---

## CatalogueShow — Changes to `pages/Backend/Catalogue/Show.tsx`

### New imports

```typescript
import { useState } from 'react'
import { router } from '@inertiajs/react'
import type { MouvementType, MovementFormErrors, MOUVEMENT_LABELS } from '../../../types/catalogue'
```

Import `MOUVEMENT_LABELS` constant too.

### Updated function signature

```tsx
export default function CatalogueShow({ produit, movements, movement_errors }: CatalogueShowProps) {
```

### New state (inside component body, after existing variables)

```typescript
const [delta, setDelta] = useState('')
const [mouvementType, setMouvementType] = useState<MouvementType>('purchase')
const [startedAt, setStartedAt] = useState(() => new Date().toISOString().slice(0, 10))
const [submitting, setSubmitting] = useState(false)
```

### New submit handler

```typescript
function handleSubmit(e: React.FormEvent) {
  e.preventDefault()
  setSubmitting(true)
  router.post(
    `/backend/products/${produit.id}/movements`,
    { delta, mouvement_type: mouvementType, started_at: startedAt },
    { onFinish: () => setSubmitting(false) }
  )
}
```

### New inline form — add after the movements section (after the closing `</div>` of movements block)

```tsx
{/* Movement form */}
<div className="mt-8">
  <h2 className="text-base font-semibold mb-3" style={{ color: 'var(--color-text)' }}>
    Saisir un mouvement
  </h2>
  <form
    aria-label="Formulaire mouvement"
    onSubmit={handleSubmit}
    className="rounded-lg border p-5"
    style={{ background: 'var(--color-bg-card)', borderColor: 'var(--color-border)' }}
  >
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1rem' }}>
      {/* Delta */}
      <div>
        <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text)' }}>
          Variation (+ entrée / - sortie) <span style={{ color: '#dc2626' }}>*</span>
        </label>
        <input
          type="number"
          step="any"
          required
          value={delta}
          onChange={e => setDelta(e.target.value)}
          placeholder="ex: 10 ou -5"
          className="w-full border rounded px-3 py-2 text-sm"
          style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg)' }}
        />
        {movement_errors?.delta && (
          <p className="text-xs mt-1" style={{ color: '#dc2626' }}>{movement_errors.delta[0]}</p>
        )}
      </div>

      {/* Type */}
      <div>
        <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text)' }}>
          Type de mouvement
        </label>
        <select
          value={mouvementType}
          onChange={e => setMouvementType(e.target.value as MouvementType)}
          className="w-full border rounded px-3 py-2 text-sm"
          style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg)' }}
        >
          {(Object.keys(MOUVEMENT_LABELS) as MouvementType[]).map(k => (
            <option key={k} value={k}>{MOUVEMENT_LABELS[k]}</option>
          ))}
        </select>
      </div>

      {/* Date */}
      <div>
        <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text)' }}>
          Date
        </label>
        <input
          type="date"
          value={startedAt}
          onChange={e => setStartedAt(e.target.value)}
          className="w-full border rounded px-3 py-2 text-sm"
          style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg)' }}
        />
      </div>
    </div>

    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
      <button
        type="submit"
        disabled={submitting}
        style={{
          background: 'var(--color-primary)',
          color: '#fff',
          border: 'none',
          borderRadius: '0.375rem',
          padding: '0.5rem 1.25rem',
          fontWeight: 500,
          fontSize: '0.875rem',
          cursor: submitting ? 'not-allowed' : 'pointer',
          opacity: submitting ? 0.7 : 1,
        }}
      >
        {submitting ? 'Enregistrement…' : 'Enregistrer le mouvement'}
      </button>
      <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
        Note : la colonne "Stock résultant" sera 0 pour les mouvements saisis manuellement.
      </p>
    </div>
  </form>
</div>
```

---

## Tests — `Show.test.tsx` (4 new tests, existing 5 must pass)

Add mocks and new tests to the existing file:

```typescript
import userEvent from '@testing-library/user-event'
import { vi } from 'vitest'

// Already present at top of file:
vi.mock('@inertiajs/react', () => ({
  router: { get: vi.fn(), post: vi.fn() },
}))
```

**Important:** The existing mock only has `router: { get: vi.fn() }`. Update it to also include `post: vi.fn()`.

**Test 6:** Renders movement form
```typescript
it('renders movement form', () => {
  renderShow()
  expect(screen.getByRole('form', { name: 'Formulaire mouvement' })).toBeInTheDocument()
})
```

**Test 7:** Renders delta input
```typescript
it('renders delta number input', () => {
  renderShow()
  expect(screen.getByPlaceholderText(/ex: 10 ou -5/)).toBeInTheDocument()
})
```

**Test 8:** Renders type select with "Achat" as default
```typescript
it('renders mouvement type select with Achat as default', () => {
  renderShow()
  const select = screen.getByRole('combobox')
  expect(select).toBeInTheDocument()
  expect((select as HTMLSelectElement).value).toBe('purchase')
})
```

**Test 9:** Calls router.post on form submit
```typescript
it('calls router.post on form submit', async () => {
  const { router } = await import('@inertiajs/react')
  renderShow()
  const deltaInput = screen.getByPlaceholderText(/ex: 10 ou -5/)
  await userEvent.type(deltaInput, '5')
  await userEvent.click(screen.getByRole('button', { name: /Enregistrer le mouvement/ }))
  expect(router.post).toHaveBeenCalledWith(
    '/backend/products/1/movements',
    expect.objectContaining({ delta: '5' }),
    expect.any(Object)
  )
})
```

---

## Rails Controller — `products_controller.rb`

Add `create_movement` as a **public method** before `manage_restfully`. Add it right after the `show` method:

```ruby
def create_movement
  return unless @product = find_and_check(:product)

  delta       = params[:delta].to_f
  description = params[:mouvement_type].to_s
  started_at  = params[:started_at].present? ? Time.zone.parse(params[:started_at]) : Time.zone.now

  # Validate description against allowed enum values
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
      produit:          produit_json(@product),
      movements:        movements,
      movement_errors:  movement.errors.messages.each_with_object({}) { |(k, v), h| h[k.to_s] = v }
    }, status: :unprocessable_entity
  end
end
```

**Ruby 2.6 constraints:** No `filter_map`, `then`, `yield_self`. Use `.each_with_object` as shown.

**Important:** Do NOT remove `manage_restfully` — the `create_movement` action must be defined BEFORE `manage_restfully` in the file so it takes precedence.

---

## Routes — `config/routes.rb`

Locate `resources :products, concerns: %i[products many]` (line ~1153). Replace with:

```ruby
resources :products, concerns: %i[products many] do
  member do
    post :create_movement
  end
end
```

This generates route: `POST /backend/products/:id/create_movement` → helper `create_movement_backend_product_path(@product)`.

**Alternative** if the block form conflicts with existing concerns: add a standalone route **inside** the `namespace :backend do` block:

```ruby
post 'products/:id/movements', to: 'products#create_movement', as: :backend_product_movements
```

Use the `member do` approach first. Fall back to the standalone route if manage_restfully or the concerns block causes a conflict.

---

## Scope Exclusions (YAGNI)

- Pas de ProductPopulation update (internals Ekylibre — hors scope)
- Pas de validation de cohérence delta/population (ex: sortie > stock disponible)
- Pas de mouvement de suppression ou édition depuis l'UI
- Pas d'upload en masse (CSV import)
- La colonne "Stock résultant" affichera 0 pour les mouvements manuels (limitation documentée)
- Pas d'UI de confirmation avant soumission
