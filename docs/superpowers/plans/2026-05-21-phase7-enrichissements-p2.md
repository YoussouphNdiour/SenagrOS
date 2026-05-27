# Phase 7 — Enrichissements P2 : Filtres Catalogue + Relations Produit + Réceptions Budget

**Date:** 2026-05-21
**Branche:** `feat/phase7-enrichissements-p2`
**Auteur:** @ndiouryoussouph

---

## Goal

Enrichir les pages Catalogue et Budgets avec :
- E6 : Filtre état vivant/inactif dans CatalogueIndex
- E7 : Liste des interventions liées dans CatalogueShow
- E8 : Liste des problèmes (issues) dans CatalogueShow
- E9 : Lignes de réception dans BudgetShow

---

## Architecture

```
app/
  frontend/
    types/
      catalogue.ts         ← E6 (etat filter) + E7 (InterventionItem) + E8 (IssueItem)
      budget.ts            ← E9 (ReceptionLine)
    pages/Backend/
      Catalogue/
        Index.tsx          ← E6
        Index.test.tsx     ← E6
        Show.tsx           ← E7 + E8
        Show.test.tsx      ← E7 + E8
      Budgets/
        Show.tsx           ← E9
        Show.test.tsx      ← E9
  controllers/backend/
    products_controller.rb         ← E6 + E7 + E8
    project_budgets_controller.rb  ← E9
```

---

## Tech Stack

- Rails 6, Ruby 2.6 — `.select {}.map {}`, `.each_with_object` (NO filter_map/then/yield_self)
- React 18 + TypeScript strict (no `any`)
- Vitest + React Testing Library
- Inertia.js v2
- CSS: Tailwind className pour layout ; `style={{}}` pour CSS vars (`var(--color-*)`) ou hex

---

## File Structure

```
app/frontend/types/catalogue.ts                          (modifié)
app/frontend/types/budget.ts                             (modifié)
app/frontend/pages/Backend/Catalogue/Index.tsx           (modifié)
app/frontend/pages/Backend/Catalogue/Index.test.tsx      (modifié)
app/frontend/pages/Backend/Catalogue/Show.tsx            (modifié)
app/frontend/pages/Backend/Catalogue/Show.test.tsx       (modifié)
app/frontend/pages/Backend/Budgets/Show.tsx              (modifié)
app/frontend/pages/Backend/Budgets/Show.test.tsx         (modifié)
app/controllers/backend/products_controller.rb           (modifié)
app/controllers/backend/project_budgets_controller.rb    (modifié)
```

---

## Task 1 — E6 : Filtres avancés Catalogue (filtre état : vivant/inactif)

### Step 1.1 — Mettre à jour `types/catalogue.ts` : ajouter `etat` au filtre

Ouvrir `app/frontend/types/catalogue.ts` et modifier l'interface `CatalogueIndexProps` pour que `filters` accepte `etat`.

Contenu complet du fichier après modification :

```typescript
export type ProduitType = 'Matter' | 'Animal' | 'Equipment' | 'Plant' | 'Other'

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

export interface ProduitMovement {
  delta: number
  population: number
  started_at: string
  description: string | null
}

export interface CatalogueIndexProps {
  produits: Produit[]
  filters: { q?: string; produit_type?: ProduitType; etat?: 'alive' | 'dead' }
  meta: { total_count: number; current_page: number; total_pages: number }
}

export interface MovementFormErrors {
  delta?: string[]
  mouvement_type?: string[]
  started_at?: string[]
}

export interface MovementMeta {
  total: number
  page: number
  per_page: number
}

export interface InterventionItem {
  id: number
  name: string
  started_at: string | null
  nature: string
  parameter_type: string
}

export interface IssueItem {
  id: number
  name: string
  nature: string
  observed_at: string | null
  state: string
  gravity: number
}

export interface CatalogueShowProps {
  produit: Produit
  movements: ProduitMovement[]
  movement_errors?: MovementFormErrors
  movement_meta: MovementMeta
  movement_filter: string | null
  interventions: InterventionItem[]
  issues: IssueItem[]
}

export type MouvementType = 'purchase' | 'sale' | 'consumption' | 'birth' | 'death' | 'butchery' | 'loan'

export const MOUVEMENT_LABELS: Record<MouvementType, string> = {
  purchase: 'Achat',
  sale: 'Vente',
  consumption: 'Consommation',
  birth: 'Naissance',
  death: 'Décès',
  butchery: 'Abattage',
  loan: 'Prêt',
}
```

Commande de vérification :

```bash
yarn tsc --noEmit 2>&1 | tail -5
```

Sortie attendue :
```
(aucune erreur)
```

### Step 1.2 — Ajouter 2 tests échouants dans `Index.test.tsx`

Ouvrir `app/frontend/pages/Backend/Catalogue/Index.test.tsx` et ajouter les 2 nouveaux tests à la fin du bloc `describe('CatalogueIndex', ...)`, avant le `})` de fermeture.

Les 2 nouveaux tests à ajouter :

```typescript
  it('renders état filter select', () => {
    renderIndex()
    expect(screen.getByRole('combobox', { name: 'État du produit' })).toBeInTheDocument()
  })

  it('shows only Inactif produits when etat filter is "dead" in props', () => {
    renderIndex({ filters: { etat: 'dead' } })
    const select = screen.getByRole('combobox', { name: 'État du produit' }) as HTMLSelectElement
    expect(select.value).toBe('dead')
  })
```

Commande pour lancer les tests et confirmer les 2 échecs :

```bash
cd /Users/yusper/Downloads/SenagrOS/ekylibre-main && yarn vitest run src/pages/Backend/Catalogue/Index.test.tsx 2>&1 | tail -20
```

Sortie attendue :
```
 FAIL  src/pages/Backend/Catalogue/Index.test.tsx
   × renders état filter select
   × shows only Inactif produits when etat filter is "dead" in props
 Tests  6 passed | 2 failed (8)
```

### Step 1.3 — Confirmer que les 2 tests échouent

```bash
cd /Users/yusper/Downloads/SenagrOS/ekylibre-main && yarn vitest run src/pages/Backend/Catalogue/Index.test.tsx --reporter=verbose 2>&1 | grep -E "(✓|×|PASS|FAIL|passed|failed)"
```

Sortie attendue :
```
  ✓ renders produits table
  ✓ renders filter input
  ✓ renders type filter pills
  ✓ calls router.get on search
  ✓ renders pagination
  ✓ renders empty state when no produits
  × renders état filter select
  × shows only Inactif produits when etat filter is "dead" in props
 Tests  6 passed | 2 failed (8)
```

### Step 1.4 — Implémenter le filtre état dans `Index.tsx`

Ouvrir `app/frontend/pages/Backend/Catalogue/Index.tsx`. Apporter les modifications suivantes :

1. Ajouter `const [etatFilter, setEtatFilter] = useState<'alive' | 'dead' | ''>(filters.etat ?? '')` avec les autres useState.
2. Mettre à jour `search()` pour inclure `etat: etatFilter`.
3. Mettre à jour les deux clics de pagination pour inclure `etat: etatFilter`.
4. Ajouter le select état dans la barre de filtres.

Contenu complet du fichier `Index.tsx` après modification :

```tsx
import { useState } from 'react'
import { router } from '@inertiajs/react'
import type { CatalogueIndexProps, ProduitType, Produit } from '../../../types/catalogue'

export default function CatalogueIndex({ produits, filters, meta }: CatalogueIndexProps) {
  const [q, setQ] = useState(filters.q ?? '')
  const [typeFilter, setTypeFilter] = useState<ProduitType | ''>(filters.produit_type ?? '')
  const [etatFilter, setEtatFilter] = useState<'alive' | 'dead' | ''>(filters.etat ?? '')

  function search() {
    router.get('/backend/products', { q, produit_type: typeFilter, etat: etatFilter }, { preserveState: true })
  }

  const types: Array<{ value: ProduitType | ''; label: string }> = [
    { value: '', label: 'Tous' },
    { value: 'Matter', label: 'Matière' },
    { value: 'Animal', label: 'Animal' },
    { value: 'Equipment', label: 'Équipement' },
    { value: 'Plant', label: 'Plante' },
    { value: 'Other', label: 'Autre' },
  ]

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold mb-4" style={{ color: 'var(--color-text)' }}>Catalogue produits</h1>

      {/* Filter bar */}
      <div className="flex flex-wrap gap-2 mb-4 items-center">
        <input
          type="text"
          value={q}
          onChange={e => setQ(e.target.value)}
          placeholder="Rechercher..."
          className="px-3 py-2 rounded-md border text-sm"
          style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg-card)', color: 'var(--color-text)' }}
        />

        {/* Type pills */}
        <div className="flex gap-1">
          {types.map(t => (
            <button
              key={t.value}
              onClick={() => setTypeFilter(t.value)}
              className="px-3 py-1 rounded-full text-sm font-medium border"
              style={{
                background: typeFilter === t.value ? 'var(--color-primary)' : 'var(--color-bg-card)',
                color: typeFilter === t.value ? '#fff' : 'var(--color-text)',
                borderColor: 'var(--color-border)',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* État select */}
        <select
          aria-label="État du produit"
          value={etatFilter}
          onChange={e => setEtatFilter(e.target.value as 'alive' | 'dead' | '')}
          className="px-3 py-2 rounded-md border text-sm"
          style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg-card)', color: 'var(--color-text)' }}
        >
          <option value="">Tous états</option>
          <option value="alive">Vivant / Actif</option>
          <option value="dead">Inactif</option>
        </select>

        <button
          onClick={search}
          className="px-4 py-2 rounded-md text-sm font-semibold"
          style={{ background: 'var(--color-primary)', color: '#fff' }}
        >
          Rechercher
        </button>
      </div>

      {/* Table */}
      {produits.length === 0 ? (
        <p className="text-center py-8 text-sm" style={{ color: 'var(--color-text-muted)' }}>
          Aucun produit trouvé.
        </p>
      ) : (
        <div style={{ background: 'var(--color-bg-card)', borderRadius: '0.5rem', border: '1px solid var(--color-border)', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--color-border)', background: 'var(--color-bg)' }}>
                {['Nom', 'Référence', 'Type', 'Population', 'Unité'].map(h => (
                  <th key={h} className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--color-text-muted)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {produits.map((p: Produit) => (
                <tr key={p.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <td className="px-4 py-2 font-medium">
                    <a href={`/backend/products/${p.id}`} style={{ color: 'var(--color-primary)', textDecoration: 'none' }}>{p.name}</a>
                  </td>
                  <td className="px-4 py-2" style={{ color: 'var(--color-text-muted)' }}>{p.number}</td>
                  <td className="px-4 py-2" style={{ color: 'var(--color-text-muted)' }}>{p.produit_type}</td>
                  <td className="px-4 py-2 tabular-nums" style={{ color: 'var(--color-text)' }}>{p.population}</td>
                  <td className="px-4 py-2" style={{ color: 'var(--color-text-muted)' }}>{p.unit_name}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {meta.total_pages > 1 && (
        <div className="flex gap-2 mt-4 justify-center">
          <button
            disabled={meta.current_page <= 1}
            onClick={() => router.get('/backend/products', { q, produit_type: typeFilter, etat: etatFilter, page: meta.current_page - 1 })}
            className="px-3 py-1 rounded border text-sm"
            style={{ borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
          >
            Précédent
          </button>
          <span className="px-3 py-1 text-sm" style={{ color: 'var(--color-text-muted)' }}>
            {meta.current_page} / {meta.total_pages}
          </span>
          <button
            disabled={meta.current_page >= meta.total_pages}
            onClick={() => router.get('/backend/products', { q, produit_type: typeFilter, etat: etatFilter, page: meta.current_page + 1 })}
            className="px-3 py-1 rounded border text-sm"
            style={{ borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
          >
            Suivant
          </button>
        </div>
      )}
    </div>
  )
}
```

### Step 1.5 — Lancer les tests et confirmer 8 PASS

```bash
cd /Users/yusper/Downloads/SenagrOS/ekylibre-main && yarn vitest run src/pages/Backend/Catalogue/Index.test.tsx --reporter=verbose 2>&1 | tail -15
```

Sortie attendue :
```
  ✓ renders produits table
  ✓ renders filter input
  ✓ renders type filter pills
  ✓ calls router.get on search
  ✓ renders pagination
  ✓ renders empty state when no produits
  ✓ renders état filter select
  ✓ shows only Inactif produits when etat filter is "dead" in props
 Tests  8 passed (8)
```

### Step 1.6 — Mettre à jour `products_controller.rb` : ajouter filtre etat

Ouvrir `app/controllers/backend/products_controller.rb`. Dans l'action `index`, ajouter le filtre `etat` AVANT le bloc `if params[:q].present?`, et ajouter `etat: params[:etat]` au hash `filters:` du render.

Contenu complet de l'action `index` après modification :

```ruby
def index
  scope = Product.joins(:variant).includes(:variant)

  if params[:produit_type].present?
    case params[:produit_type]
    when 'Matter'    then scope = scope.where("products.type = ?", 'Matter')
    when 'Animal'    then scope = scope.where("products.type = ?", 'Animal')
    when 'Equipment' then scope = scope.where("products.type IN (?)", %w[Equipment Tool])
    when 'Plant'     then scope = scope.where("products.type = ?", 'Plant')
    else                  scope = scope.where("products.type NOT IN (?)", %w[Matter Animal Equipment Tool Plant Worker])
    end
  end

  if params[:etat] == 'alive'
    scope = scope.where(dead_at: nil)
  elsif params[:etat] == 'dead'
    scope = scope.where.not(dead_at: nil)
  end

  if params[:q].present?
    scope = scope.select { |p| p.name.to_s.downcase.include?(params[:q].downcase) }
  else
    scope = scope.to_a
  end

  per_page = 20
  total_count = scope.size
  current_page = [params[:page].to_i, 1].max
  total_pages = [(total_count.to_f / per_page).ceil, 1].max
  paginated = scope.sort_by(&:name)[(current_page - 1) * per_page, per_page] || []

  render inertia: 'Backend/Catalogue/Index', props: {
    produits: paginated.map { |p| produit_json(p) },
    filters: { q: params[:q], produit_type: params[:produit_type], etat: params[:etat] },
    meta: { total_count: total_count, current_page: current_page, total_pages: total_pages }
  }
end
```

### Step 1.7 — Vérifier la syntaxe Ruby

```bash
ruby -c /Users/yusper/Downloads/SenagrOS/ekylibre-main/app/controllers/backend/products_controller.rb
```

Sortie attendue :
```
Syntax OK
```

### Step 1.8 — Vérifier TypeScript

```bash
cd /Users/yusper/Downloads/SenagrOS/ekylibre-main && yarn tsc --noEmit 2>&1 | tail -5
```

Sortie attendue :
```
(aucune erreur — sortie vide)
```

### Step 1.9 — Commit

```bash
cd /Users/yusper/Downloads/SenagrOS/ekylibre-main && git add app/frontend/types/catalogue.ts app/frontend/pages/Backend/Catalogue/Index.tsx app/frontend/pages/Backend/Catalogue/Index.test.tsx app/controllers/backend/products_controller.rb && git commit -m "feat: add état filter (vivant/inactif) to CatalogueIndex"
```

Sortie attendue :
```
[feat/phase7-enrichissements-p2 xxxxxxx] feat: add état filter (vivant/inactif) to CatalogueIndex
 4 files changed, ...
```

---

## Task 2 — E7 : Interventions liées dans CatalogueShow

### Step 2.1 — Vérifier que `types/catalogue.ts` contient déjà `InterventionItem` et `interventions` dans `CatalogueShowProps`

Le fichier a déjà été mis à jour à l'étape 1.1. Vérifier :

```bash
grep -n "InterventionItem\|interventions:" /Users/yusper/Downloads/SenagrOS/ekylibre-main/app/frontend/types/catalogue.ts
```

Sortie attendue :
```
34:export interface InterventionItem {
41:  interventions: InterventionItem[]
```

### Step 2.2 — Mettre à jour `renderShow` dans `Show.test.tsx` et ajouter 2 tests échouants

Ouvrir `app/frontend/pages/Backend/Catalogue/Show.test.tsx`. Ajouter `interventions: []` aux defaults de `renderShow`, et ajouter les 2 nouveaux tests.

Exemple de mise à jour du helper `renderShow` (ajouter `interventions: []` et `issues: []` aux props par défaut) :

```typescript
function renderShow(overrides: Partial<CatalogueShowProps> = {}) {
  const defaults: CatalogueShowProps = {
    produit: mockProduit,
    movements: [],
    movement_meta: { total: 0, page: 1, per_page: 20 },
    movement_filter: null,
    interventions: [],
    issues: [],
    ...overrides,
  }
  return render(<CatalogueShow {...defaults} />)
}
```

Les 2 nouveaux tests à ajouter dans le `describe` :

```typescript
  it('shows empty interventions message when interventions is empty', () => {
    renderShow()
    expect(screen.getByText(/Aucune intervention/)).toBeInTheDocument()
  })

  it('renders intervention row when interventions are present', () => {
    renderShow({
      interventions: [
        {
          id: 1,
          name: 'Traitement herbicide',
          started_at: '2024-03-01T00:00:00Z',
          nature: 'record',
          parameter_type: 'input',
        },
      ],
    })
    expect(screen.getByText('Traitement herbicide')).toBeInTheDocument()
  })
```

Commande pour lancer les tests et confirmer les 2 échecs :

```bash
cd /Users/yusper/Downloads/SenagrOS/ekylibre-main && yarn vitest run src/pages/Backend/Catalogue/Show.test.tsx 2>&1 | tail -15
```

Sortie attendue :
```
 FAIL  src/pages/Backend/Catalogue/Show.test.tsx
   × shows empty interventions message when interventions is empty
   × renders intervention row when interventions are present
 Tests  N passed | 2 failed
```

### Step 2.3 — Confirmer les 2 échecs

```bash
cd /Users/yusper/Downloads/SenagrOS/ekylibre-main && yarn vitest run src/pages/Backend/Catalogue/Show.test.tsx --reporter=verbose 2>&1 | grep -E "(✓|×|passed|failed)"
```

Sortie attendue :
```
  ✓ ... (tests existants)
  × shows empty interventions message when interventions is empty
  × renders intervention row when interventions are present
 Tests  N passed | 2 failed
```

### Step 2.4 — Implémenter la section interventions dans `Show.tsx`

Ouvrir `app/frontend/pages/Backend/Catalogue/Show.tsx`. Apporter les modifications suivantes :

1. Mettre à jour l'import : `import type { CatalogueShowProps, InterventionItem } from '../../../types/catalogue'`
2. Destructurer `interventions` dans les props de la fonction.
3. Ajouter la section interventions après la section movements et avant le formulaire de mouvement.

Contenu de la section interventions à insérer :

```tsx
{/* Interventions liées */}
<div className="mb-6">
  <h2 className="text-base font-semibold mb-3" style={{ color: 'var(--color-text)' }}>
    Interventions liées ({interventions.length})
  </h2>
  {interventions.length === 0 ? (
    <p className="text-sm py-4 text-center" style={{ color: 'var(--color-text-muted)' }}>
      Aucune intervention liée à ce produit.
    </p>
  ) : (
    <div style={{ background: 'var(--color-bg-card)', borderRadius: '0.5rem', border: '1px solid var(--color-border)', overflow: 'hidden' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid var(--color-border)', background: 'var(--color-bg)' }}>
            {['Nom', 'Date', 'Rôle'].map(h => (
              <th key={h} className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--color-text-muted)' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {interventions.map((intv: InterventionItem) => (
            <tr key={intv.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
              <td className="px-4 py-2 font-medium">
                <a href={`/backend/interventions/${intv.id}`} style={{ color: 'var(--color-primary)', textDecoration: 'none' }}>{intv.name || `#${intv.id}`}</a>
              </td>
              <td className="px-4 py-2 tabular-nums" style={{ color: 'var(--color-text-muted)' }}>
                {intv.started_at ? new Date(intv.started_at).toLocaleDateString('fr-FR') : '—'}
              </td>
              <td className="px-4 py-2" style={{ color: 'var(--color-text-muted)', textTransform: 'capitalize' }}>{intv.parameter_type || '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )}
</div>
```

### Step 2.5 — Lancer les tests et confirmer tous PASS

```bash
cd /Users/yusper/Downloads/SenagrOS/ekylibre-main && yarn vitest run src/pages/Backend/Catalogue/Show.test.tsx --reporter=verbose 2>&1 | tail -15
```

Sortie attendue :
```
  ✓ ... (tous les tests existants)
  ✓ shows empty interventions message when interventions is empty
  ✓ renders intervention row when interventions are present
 Tests  N passed (N)
```

### Step 2.6 — Mettre à jour `products_controller.rb` : ajouter interventions au show

Ouvrir `app/controllers/backend/products_controller.rb`. Dans l'action `show`, ajouter la requête interventions AVANT le `render inertia:`, et ajouter `interventions: interventions` aux props.

Contenu complet de l'action `show` après modification :

```ruby
def show
  return unless @product = find_and_check(:product)

  page            = [params[:movement_page].to_i, 1].max
  per_page        = 20
  movement_filter = params[:movement_type].presence

  mvt_scope = ProductMovement.where(product_id: @product.id)
  mvt_scope = mvt_scope.where(description: movement_filter) if movement_filter
  mvt_scope = mvt_scope.order(started_at: :desc)

  total_movements = mvt_scope.count
  movements = mvt_scope.offset((page - 1) * per_page).limit(per_page).map { |mv|
    { delta: mv.delta.to_f, population: mv.population.to_f, started_at: mv.started_at.iso8601, description: mv.description }
  }

  intv_params = @product.intervention_product_parameters.includes(:intervention).limit(20)
  interventions = intv_params
    .select { |p| p.intervention.present? }
    .sort_by { |p| p.intervention.started_at || Time.zone.now }
    .reverse
    .first(10)
    .map { |param|
      i = param.intervention
      {
        id:             i.id,
        name:           i.name.to_s,
        started_at:     i.started_at&.iso8601,
        nature:         i.nature.to_s,
        parameter_type: param.type.to_s.gsub('Intervention', '').downcase
      }
    }

  issues = Issue.where(target_type: 'Product', target_id: @product.id)
                .order(observed_at: :desc)
                .limit(10)
                .map { |issue|
                  {
                    id:          issue.id,
                    name:        issue.name.to_s,
                    nature:      issue.nature.to_s,
                    observed_at: issue.observed_at&.to_date&.iso8601,
                    state:       issue.state.to_s,
                    gravity:     issue.gravity.to_i
                  }
                }

  render inertia: 'Backend/Catalogue/Show', props: {
    produit:         produit_json(@product),
    movements:       movements,
    movement_meta:   { total: total_movements, page: page, per_page: per_page },
    movement_filter: movement_filter,
    interventions:   interventions,
    issues:          issues
  }
end
```

### Step 2.7 — Vérifier la syntaxe Ruby

```bash
ruby -c /Users/yusper/Downloads/SenagrOS/ekylibre-main/app/controllers/backend/products_controller.rb
```

Sortie attendue :
```
Syntax OK
```

### Step 2.8 — Vérifier TypeScript

```bash
cd /Users/yusper/Downloads/SenagrOS/ekylibre-main && yarn tsc --noEmit 2>&1 | tail -5
```

Sortie attendue :
```
(aucune erreur — sortie vide)
```

### Step 2.9 — Commit

```bash
cd /Users/yusper/Downloads/SenagrOS/ekylibre-main && git add app/frontend/types/catalogue.ts app/frontend/pages/Backend/Catalogue/Show.tsx app/frontend/pages/Backend/Catalogue/Show.test.tsx app/controllers/backend/products_controller.rb && git commit -m "feat: show linked interventions in CatalogueShow"
```

Sortie attendue :
```
[feat/phase7-enrichissements-p2 xxxxxxx] feat: show linked interventions in CatalogueShow
 4 files changed, ...
```

---

## Task 3 — E8 : Issues/Problèmes dans CatalogueShow

### Step 3.1 — Vérifier que `types/catalogue.ts` contient déjà `IssueItem` et `issues` dans `CatalogueShowProps`

Le fichier a déjà été mis à jour à l'étape 1.1. Vérifier :

```bash
grep -n "IssueItem\|issues:" /Users/yusper/Downloads/SenagrOS/ekylibre-main/app/frontend/types/catalogue.ts
```

Sortie attendue :
```
44:export interface IssueItem {
52:  issues: IssueItem[]
```

### Step 3.2 — Ajouter 2 tests échouants dans `Show.test.tsx`

Ouvrir `app/frontend/pages/Backend/Catalogue/Show.test.tsx`. Ajouter les 2 nouveaux tests pour les issues dans le `describe`, après les tests d'interventions :

```typescript
  it('shows empty issues message when issues is empty', () => {
    renderShow()
    expect(screen.getByText(/Aucun problème/)).toBeInTheDocument()
  })

  it('renders issue row when issues are present', () => {
    renderShow({
      issues: [
        {
          id: 1,
          name: 'Attaque criquet',
          nature: 'pest',
          observed_at: '2024-04-10',
          state: 'opened',
          gravity: 4,
        },
      ],
    })
    expect(screen.getByText('Attaque criquet')).toBeInTheDocument()
  })
```

Commande pour lancer les tests et confirmer les 2 échecs :

```bash
cd /Users/yusper/Downloads/SenagrOS/ekylibre-main && yarn vitest run src/pages/Backend/Catalogue/Show.test.tsx 2>&1 | tail -15
```

Sortie attendue :
```
 FAIL  src/pages/Backend/Catalogue/Show.test.tsx
   × shows empty issues message when issues is empty
   × renders issue row when issues are present
 Tests  N passed | 2 failed
```

### Step 3.3 — Confirmer les 2 échecs

```bash
cd /Users/yusper/Downloads/SenagrOS/ekylibre-main && yarn vitest run src/pages/Backend/Catalogue/Show.test.tsx --reporter=verbose 2>&1 | grep -E "(✓|×|passed|failed)"
```

Sortie attendue :
```
  ✓ ... (tests existants + tests interventions)
  × shows empty issues message when issues is empty
  × renders issue row when issues are present
 Tests  N passed | 2 failed
```

### Step 3.4 — Implémenter la section issues dans `Show.tsx`

Ouvrir `app/frontend/pages/Backend/Catalogue/Show.tsx`. Apporter les modifications suivantes :

1. Mettre à jour l'import : `import type { CatalogueShowProps, InterventionItem, IssueItem } from '../../../types/catalogue'`
2. Destructurer `issues` dans les props de la fonction.
3. Ajouter la section issues APRÈS la section interventions.

Contenu de la section issues à insérer :

```tsx
{/* Problèmes */}
<div className="mb-6">
  <h2 className="text-base font-semibold mb-3" style={{ color: 'var(--color-text)' }}>
    Problèmes ({issues.length})
  </h2>
  {issues.length === 0 ? (
    <p className="text-sm py-4 text-center" style={{ color: 'var(--color-text-muted)' }}>
      Aucun problème signalé sur ce produit.
    </p>
  ) : (
    <div style={{ background: 'var(--color-bg-card)', borderRadius: '0.5rem', border: '1px solid var(--color-border)', overflow: 'hidden' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid var(--color-border)', background: 'var(--color-bg)' }}>
            {['Problème', 'Nature', 'Observé le', 'Gravité', 'État'].map(h => (
              <th key={h} className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--color-text-muted)' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {issues.map((issue: IssueItem) => (
            <tr key={issue.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
              <td className="px-4 py-2 font-medium" style={{ color: 'var(--color-text)' }}>{issue.name}</td>
              <td className="px-4 py-2" style={{ color: 'var(--color-text-muted)' }}>{issue.nature}</td>
              <td className="px-4 py-2 tabular-nums" style={{ color: 'var(--color-text-muted)' }}>
                {issue.observed_at ? new Date(issue.observed_at).toLocaleDateString('fr-FR') : '—'}
              </td>
              <td className="px-4 py-2 tabular-nums" style={{ color: 'var(--color-text)' }}>{issue.gravity}/5</td>
              <td className="px-4 py-2">
                <span style={{
                  fontSize: '0.7rem', fontWeight: 600, padding: '0.125rem 0.5rem', borderRadius: '9999px',
                  background: issue.state === 'opened' ? '#fef3c7' : issue.state === 'closed' ? '#dcfce7' : '#f3f4f6',
                  color:      issue.state === 'opened' ? '#92400e' : issue.state === 'closed' ? '#166534' : '#374151',
                }}>
                  {issue.state === 'opened' ? 'Ouvert' : issue.state === 'closed' ? 'Fermé' : 'Abandonné'}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )}
</div>
```

### Step 3.5 — Lancer les tests et confirmer tous PASS

```bash
cd /Users/yusper/Downloads/SenagrOS/ekylibre-main && yarn vitest run src/pages/Backend/Catalogue/Show.test.tsx --reporter=verbose 2>&1 | tail -15
```

Sortie attendue :
```
  ✓ ... (tous les tests existants + interventions)
  ✓ shows empty issues message when issues is empty
  ✓ renders issue row when issues are present
 Tests  N passed (N)
```

### Step 3.6 — Vérifier que `products_controller.rb` contient déjà la requête issues

La requête `issues` a déjà été ajoutée à l'étape 2.6 (dans la version complète de `show`). Vérifier :

```bash
grep -n "Issue.where\|issues:" /Users/yusper/Downloads/SenagrOS/ekylibre-main/app/controllers/backend/products_controller.rb
```

Sortie attendue :
```
XX:  issues = Issue.where(target_type: 'Product', target_id: @product.id)
XX:    issues:          issues
```

### Step 3.7 — Vérifier la syntaxe Ruby

```bash
ruby -c /Users/yusper/Downloads/SenagrOS/ekylibre-main/app/controllers/backend/products_controller.rb
```

Sortie attendue :
```
Syntax OK
```

### Step 3.8 — Vérifier TypeScript

```bash
cd /Users/yusper/Downloads/SenagrOS/ekylibre-main && yarn tsc --noEmit 2>&1 | tail -5
```

Sortie attendue :
```
(aucune erreur — sortie vide)
```

### Step 3.9 — Commit

```bash
cd /Users/yusper/Downloads/SenagrOS/ekylibre-main && git add app/frontend/types/catalogue.ts app/frontend/pages/Backend/Catalogue/Show.tsx app/frontend/pages/Backend/Catalogue/Show.test.tsx app/controllers/backend/products_controller.rb && git commit -m "feat: show linked issues in CatalogueShow"
```

Sortie attendue :
```
[feat/phase7-enrichissements-p2 xxxxxxx] feat: show linked issues in CatalogueShow
 4 files changed, ...
```

---

## Task 4 — E9 : Budget : lignes de réception + comparatif

### Step 4.1 — Mettre à jour `types/budget.ts` : ajouter `ReceptionLine` et mettre à jour `BudgetShowProps`

Ouvrir `app/frontend/types/budget.ts`. Contenu complet du fichier après modification :

```typescript
export interface PurchaseLine {
  id: number
  label: string
  quantity: number
  pretax_amount: number
  currency: string
  purchase_number: string
}

export interface ReceptionLine {
  id: number
  product_name: string
  quantity: number
  parcel_number: string
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
  meta: { total: number; page: number; per_page: number }
}

export interface BudgetShowProps {
  budget: ProjectBudget
  purchase_lines: PurchaseLine[]
  total_pretax_amount: number
  reception_lines: ReceptionLine[]
}

export interface BudgetFormProps {
  budget: ProjectBudget
  errors: ProjectBudgetFormErrors
  mode: 'new' | 'edit'
}
```

Commande de vérification :

```bash
yarn tsc --noEmit 2>&1 | tail -5
```

Sortie attendue :
```
(aucune erreur — sortie vide)
```

### Step 4.2 — Ajouter 3 tests échouants dans `Show.test.tsx` (Budgets)

Ouvrir `app/frontend/pages/Backend/Budgets/Show.test.tsx`. Ajouter `reception_lines={[]}` aux renders existants qui utilisent `BudgetShow`, et ajouter les 3 nouveaux tests.

Exemple du `mockBudget` (inchangé) et des nouveaux tests à ajouter dans le `describe` :

```typescript
  it('shows empty reception state when reception_lines is empty', () => {
    render(
      <BudgetShow
        budget={mockBudget}
        purchase_lines={[]}
        total_pretax_amount={0}
        reception_lines={[]}
      />
    )
    expect(screen.getByText(/Aucune réception/)).toBeInTheDocument()
  })

  it('renders reception line when reception_lines is present', () => {
    const lines: ReceptionLine[] = [
      { id: 1, product_name: 'Semences mil', quantity: 25, parcel_number: 'REC-001' },
    ]
    render(
      <BudgetShow
        budget={mockBudget}
        purchase_lines={[]}
        total_pretax_amount={0}
        reception_lines={lines}
      />
    )
    expect(screen.getByText('Semences mil')).toBeInTheDocument()
    expect(screen.getByText('REC-001')).toBeInTheDocument()
  })

  it('renders Réceptions heading', () => {
    render(
      <BudgetShow
        budget={mockBudget}
        purchase_lines={[]}
        total_pretax_amount={0}
        reception_lines={[]}
      />
    )
    expect(screen.getByText(/Réceptions/)).toBeInTheDocument()
  })
```

Aussi mettre à jour l'import dans le fichier de test pour inclure `ReceptionLine` :

```typescript
import type { BudgetShowProps, ReceptionLine } from '../../../types/budget'
```

Commande pour lancer les tests et confirmer les 3 échecs :

```bash
cd /Users/yusper/Downloads/SenagrOS/ekylibre-main && yarn vitest run src/pages/Backend/Budgets/Show.test.tsx 2>&1 | tail -15
```

Sortie attendue :
```
 FAIL  src/pages/Backend/Budgets/Show.test.tsx
   × shows empty reception state when reception_lines is empty
   × renders reception line when reception_lines is present
   × renders Réceptions heading
 Tests  N passed | 3 failed
```

### Step 4.3 — Confirmer les 3 échecs

```bash
cd /Users/yusper/Downloads/SenagrOS/ekylibre-main && yarn vitest run src/pages/Backend/Budgets/Show.test.tsx --reporter=verbose 2>&1 | grep -E "(✓|×|passed|failed)"
```

Sortie attendue :
```
  ✓ ... (tests existants)
  × shows empty reception state when reception_lines is empty
  × renders reception line when reception_lines is present
  × renders Réceptions heading
 Tests  N passed | 3 failed
```

### Step 4.4 — Implémenter la section réceptions dans `Show.tsx` (Budgets)

Ouvrir `app/frontend/pages/Backend/Budgets/Show.tsx`. Apporter les modifications suivantes :

1. Mettre à jour l'import : `import type { BudgetShowProps, PurchaseLine, ReceptionLine } from '../../../types/budget'`
2. Destructurer `reception_lines` dans les props de la fonction.
3. Ajouter la section réceptions APRÈS la section des lignes d'achat.

Contenu de la section réceptions à insérer :

```tsx
{/* Reception lines */}
<div style={{ marginTop: '2rem' }}>
  <h2 className="text-base font-semibold mb-3" style={{ color: 'var(--color-text)' }}>
    Réceptions ({reception_lines.length})
  </h2>
  {reception_lines.length === 0 ? (
    <p className="text-sm py-4 text-center" style={{ color: 'var(--color-text-muted)' }}>
      Aucune réception liée à ce budget.
    </p>
  ) : (
    <div style={{ background: 'var(--color-bg-card)', borderRadius: '0.5rem', border: '1px solid var(--color-border)', overflow: 'hidden' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid var(--color-border)', background: 'var(--color-bg)' }}>
            {['Produit reçu', 'Bon de réception', 'Quantité'].map(h => (
              <th key={h} className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--color-text-muted)' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {reception_lines.map((line: ReceptionLine) => (
            <tr key={line.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
              <td className="px-4 py-2" style={{ color: 'var(--color-text)' }}>{line.product_name || '—'}</td>
              <td className="px-4 py-2" style={{ color: 'var(--color-text-muted)' }}>{line.parcel_number || '—'}</td>
              <td className="px-4 py-2 tabular-nums" style={{ color: 'var(--color-text)' }}>{line.quantity}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )}
</div>
```

### Step 4.5 — Lancer les tests et confirmer tous PASS

```bash
cd /Users/yusper/Downloads/SenagrOS/ekylibre-main && yarn vitest run src/pages/Backend/Budgets/Show.test.tsx --reporter=verbose 2>&1 | tail -15
```

Sortie attendue :
```
  ✓ ... (tous les tests existants)
  ✓ shows empty reception state when reception_lines is empty
  ✓ renders reception line when reception_lines is present
  ✓ renders Réceptions heading
 Tests  N passed (N)
```

### Step 4.6 — Mettre à jour `project_budgets_controller.rb` : ajouter reception_lines

Ouvrir `app/controllers/backend/project_budgets_controller.rb`. Dans l'action `show`, ajouter la requête `reception_lines` AVANT le bloc `rescue`, et ajouter `reception_lines: reception_lines` aux props du render. Aussi mettre à jour le render dans le bloc `rescue` pour inclure `reception_lines: []`.

Contenu complet de l'action `show` après modification :

```ruby
def show
  purchase_lines = @budget.purchase_items.includes(:purchase, :variant).map { |item|
    { id: item.id, label: item.label.presence || item.variant_name.to_s, quantity: item.quantity.to_f,
      pretax_amount: item.pretax_amount.to_f, currency: item.currency.to_s, purchase_number: item.purchase&.number.to_s }
  }
  total_pretax = @budget.purchase_items.sum(:pretax_amount).to_f

  reception_lines = @budget.reception_items.includes(:parcel, :product).map { |item|
    {
      id:            item.id,
      product_name:  item.product&.name.to_s,
      quantity:      item.population.to_f,
      parcel_number: item.parcel&.number.to_s
    }
  }

  render inertia: 'Backend/Budgets/Show', props: {
    budget: budget_json(@budget),
    purchase_lines: purchase_lines,
    total_pretax_amount: total_pretax,
    reception_lines: reception_lines
  }
rescue ActiveRecord::StatementInvalid, PG::Error => e
  Rails.logger.error("[ProjectBudgetsController#show] DB error: #{e.message}")
  render inertia: 'Backend/Budgets/Show', props: {
    budget: budget_json(@budget),
    purchase_lines: [],
    total_pretax_amount: 0.0,
    reception_lines: []
  }
end
```

### Step 4.7 — Vérifier la syntaxe Ruby

```bash
ruby -c /Users/yusper/Downloads/SenagrOS/ekylibre-main/app/controllers/backend/project_budgets_controller.rb
```

Sortie attendue :
```
Syntax OK
```

### Step 4.8 — Vérifier TypeScript

```bash
cd /Users/yusper/Downloads/SenagrOS/ekylibre-main && yarn tsc --noEmit 2>&1 | tail -5
```

Sortie attendue :
```
(aucune erreur — sortie vide)
```

### Step 4.9 — Lancer tous les tests frontend pour vérification globale

```bash
cd /Users/yusper/Downloads/SenagrOS/ekylibre-main && yarn vitest run src/pages/Backend/Catalogue/Index.test.tsx src/pages/Backend/Catalogue/Show.test.tsx src/pages/Backend/Budgets/Show.test.tsx --reporter=verbose 2>&1 | tail -20
```

Sortie attendue :
```
 Tests  N passed (N)
 Duration  ...
```

### Step 4.10 — Commit

```bash
cd /Users/yusper/Downloads/SenagrOS/ekylibre-main && git add app/frontend/types/budget.ts app/frontend/pages/Backend/Budgets/Show.tsx app/frontend/pages/Backend/Budgets/Show.test.tsx app/controllers/backend/project_budgets_controller.rb && git commit -m "feat: show reception lines in BudgetShow"
```

Sortie attendue :
```
[feat/phase7-enrichissements-p2 xxxxxxx] feat: show reception lines in BudgetShow
 4 files changed, ...
```

---

## Vérification finale

### Lancer tous les tests de la phase 7

```bash
cd /Users/yusper/Downloads/SenagrOS/ekylibre-main && yarn vitest run src/pages/Backend/Catalogue/ src/pages/Backend/Budgets/ --reporter=verbose 2>&1 | tail -30
```

Sortie attendue :
```
 Tests  N passed (N)
 Duration  ...
```

### Vérification TypeScript globale

```bash
cd /Users/yusper/Downloads/SenagrOS/ekylibre-main && yarn tsc --noEmit 2>&1 | tail -5
```

Sortie attendue :
```
(aucune erreur — sortie vide)
```

### Vérification syntaxe Ruby des deux controllers

```bash
ruby -c /Users/yusper/Downloads/SenagrOS/ekylibre-main/app/controllers/backend/products_controller.rb && ruby -c /Users/yusper/Downloads/SenagrOS/ekylibre-main/app/controllers/backend/project_budgets_controller.rb
```

Sortie attendue :
```
Syntax OK
Syntax OK
```

### Résumé des commits de la phase 7

```bash
cd /Users/yusper/Downloads/SenagrOS/ekylibre-main && git log --oneline -4
```

Sortie attendue :
```
xxxxxxx feat: show reception lines in BudgetShow
xxxxxxx feat: show linked issues in CatalogueShow
xxxxxxx feat: show linked interventions in CatalogueShow
xxxxxxx feat: add état filter (vivant/inactif) to CatalogueIndex
```
