# Phase 3 — Module Catalogue / Inventaire : Design Spec

> **For agentic workers:** Use `superpowers:subagent-driven-development` or `superpowers:executing-plans` to implement the plan derived from this spec.

**Goal:** Add a "Catalogue" module to SenagrOS — a unified read-only inventory view of all farm assets (seeds, fertilizers, animals, equipment, plants, finished products) with current stock/population levels. Complements the existing dedicated modules (Animaux, Équipements) which manage individual records; the Catalogue is for cross-type inventory visibility.

**Architecture:** Same pattern as all previously migrated modules. `CatalogueIndex` + `CatalogueShow` pages, `ProductsController` extended with Inertia `index`/`show` (NOT MattersController — we want all Product subclasses), new `catalogue.ts` types file, "Catalogue" nav link in AppShell. No Form (YAGNI).

**Tech Stack:** React 18, TypeScript strict, `@inertiajs/react`, Vitest + React Testing Library, Ruby on Rails 6 (Ruby 2.6).

---

## File Structure

```
app/frontend/types/catalogue.ts                           ← new
app/frontend/pages/Backend/Catalogue/Index.tsx            ← new
app/frontend/pages/Backend/Catalogue/Index.test.tsx       ← new (6 tests)
app/frontend/pages/Backend/Catalogue/Show.tsx             ← new
app/frontend/pages/Backend/Catalogue/Show.test.tsx        ← new (5 tests)
app/controllers/backend/products_controller.rb            ← add layout + index/show Inertia actions
app/frontend/components/AppShell.tsx                      ← add Catalogue nav link
```

---

## TypeScript Types — `types/catalogue.ts`

```typescript
export type ProduitType =
  | 'Matter'
  | 'Animal'
  | 'Equipment'
  | 'Plant'
  | 'Other'

export interface Produit {
  id: number
  name: string
  number: string
  produit_type: ProduitType
  population: number
  unit_name: string
  description: string | null
  dead_at: string | null
}

export interface ProduitMovement {
  delta: number
  population: number
  started_at: string
  description: string | null
}

export interface CatalogueIndexProps {
  produits: Produit[]
  filters: { q?: string; produit_type?: ProduitType }
  meta: { total_count: number; current_page: number; total_pages: number }
}

export interface CatalogueShowProps {
  produit: Produit
  movements: ProduitMovement[]
}
```

---

## Type Labels and Colors

```typescript
const TYPE_CONFIG: Record<ProduitType, { label: string; bg: string; color: string }> = {
  Matter:    { label: 'Matière',    bg: '#dcfce7', color: '#166534' },
  Animal:    { label: 'Animal',     bg: '#fef9c3', color: '#854d0e' },
  Equipment: { label: 'Équipement', bg: '#dbeafe', color: '#1e40af' },
  Plant:     { label: 'Plante',     bg: '#ede9fe', color: '#5b21b6' },
  Other:     { label: 'Autre',      bg: '#f3f4f6', color: '#374151' },
}
```

---

## CatalogueIndex — `pages/Backend/Catalogue/Index.tsx`

**Heading:** "Catalogue"

**Filter bar:**
- Text search input (q) — filters on name client-side via URL param
- Type filter buttons: `Tous | Matière | Animal | Équipement | Plante | Autre` — active state highlighted
- "Rechercher" button → `router.get('/backend/products', { q, produit_type }, { preserveState: true })`

**Table columns:** Nom (link to show) | Type (badge) | N° | Stock | Unité | État

**État column:**
- `dead_at` non-null → badge gris "Inactif"
- `population = 0` → badge orange "Épuisé"
- Otherwise → nothing

**Pagination:** Same pattern as other Index pages (Précédent/Suivant, 20 per page).

**Layout:** `Index.layout = (page: ReactNode) => <AppShell>{page}</AppShell>`

**Tests (6):**
1. Renders "Catalogue" heading
2. Renders produit name in table
3. Renders type badge with correct label ("Matière" for Matter)
4. Shows "Épuisé" badge when population = 0 and dead_at null
5. Shows "Inactif" badge when dead_at is set
6. Renders pagination info from meta.total_count

---

## CatalogueShow — `pages/Backend/Catalogue/Show.tsx`

**Heading:** `produit.name`

**Header card:** Name + type badge + population in large (e.g. `42.5 kg`) + N°

**Movements table:** 20 most recent movements
- Columns: Date | Variation (delta: green `+X` if > 0, red `-X` if < 0) | Stock résultant | Motif
- Empty state: "Aucun mouvement enregistré"

**Back link:** `<a href="/backend/products">← Retour au catalogue</a>`

**Layout:** `Show.layout = (page: ReactNode) => <AppShell>{page}</AppShell>`

**Tests (5):**
1. Renders produit name as heading
2. Renders type badge
3. Renders population with unit
4. Renders movement rows (delta positive shown with + prefix)
5. Shows empty state message when movements is empty array

---

## Rails Controller — `products_controller.rb`

Add at top of class body (before `manage_restfully`):

```ruby
layout 'inertia', only: [:index, :show]
```

Add explicit Inertia `index` and `show` actions **before** `manage_restfully` takes over (override pattern). Add them as public methods, then add private helpers at end of class:

```ruby
def index
  scope = Product.joins(:variant).includes(:variant)

  if params[:produit_type].present?
    case params[:produit_type]
    when 'Matter'
      scope = scope.where("products.type = ?", 'Matter')
    when 'Animal'
      scope = scope.where("products.type = ?", 'Animal')
    when 'Equipment'
      scope = scope.where("products.type IN (?)", %w[Equipment Tool])
    when 'Plant'
      scope = scope.where("products.type = ?", 'Plant')
    else
      scope = scope.where("products.type NOT IN (?)", %w[Matter Animal Equipment Tool Plant Worker])
    end
  end

  if params[:q].present?
    q = "%#{params[:q].downcase}%"
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
    filters: { q: params[:q], produit_type: params[:produit_type] },
    meta: { total_count: total_count, current_page: current_page, total_pages: total_pages }
  }
end

def show
  return unless @product = find_and_check(:product)
  movements = ProductMovement.where(product_id: @product.id)
                             .order(started_at: :desc)
                             .limit(20)
                             .map { |mv|
                               {
                                 delta: mv.delta.to_f,
                                 population: mv.population.to_f,
                                 started_at: mv.started_at.iso8601,
                                 description: mv.description
                               }
                             }
  render inertia: 'Backend/Catalogue/Show', props: {
    produit: produit_json(@product),
    movements: movements
  }
end

private

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
    population: product.population.to_f,
    unit_name: product.conditioning_unit&.name || product.variant&.default_unit&.name || '',
    description: product.description,
    dead_at: product.dead_at&.to_date&.iso8601
  }
end
```

**Ruby 2.6 constraints:** No `filter_map`, `then`, `yield_self`. Use `.select { }.map { }` as shown.

**Important:** `manage_restfully` in the parent class handles other HTML actions (new/create/edit/update) via HAML — do NOT remove it. Our explicit `index`/`show` override only those two actions for Inertia.

---

## AppShell Navigation — `components/AppShell.tsx`

Add to `NAV_LINKS` array, after the Animaux entry:

```typescript
{ href: '/backend/products', label: 'Catalogue', icon: Package },
```

Add `Package` to the lucide-react import.

---

## Testing Strategy

- Vitest + React Testing Library
- 6 tests Index + 5 tests Show = 11 total new tests
- TDD: write failing tests first, then implement

## Scope Exclusions (YAGNI)

- No Form (creating products requires Ekylibre variant workflow)
- No stock movement creation from UI
- No export PDF/CSV
- No price/valuation column (catalog prices live in a separate table)
- No duplicate of Animals/Equipements detail — the dedicated modules remain the authoritative pages
- Worker/Travailleur type excluded from Catalogue (already has dedicated module)
