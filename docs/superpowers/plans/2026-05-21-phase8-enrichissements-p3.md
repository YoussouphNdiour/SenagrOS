# Phase 8 — Enrichissements P3 : CRUD Actions + Export CSV + Carte + Données Animaux

**Date:** 2026-05-21
**Branche:** `feat/phase8-enrichissements-p3`
**Auteur:** @ndiouryoussouph

---

## Goal

Enrichir les pages Catalogue avec :
- E10 : Boutons d'action CRUD sur Index (Nouveau produit) et Show (Modifier, Supprimer)
- E11 : Export CSV du catalogue avec filtre courant
- E12 : Carte Leaflet de localisation produit dans Show (initial_geolocation)
- E13 : Données spécifiques animaux (sex, identification_number, filiation_status) dans Show

---

## Architecture

```
app/
  frontend/
    types/
      catalogue.ts               ← E12 (geolocation) + E13 (sex, identification_number, filiation_status)
    pages/Backend/
      Catalogue/
        Index.tsx                ← E10 (Nouveau produit) + E11 (Exporter CSV)
        Index.test.tsx           ← E10 + E11
        Show.tsx                 ← E10 (Modifier, Supprimer) + E12 (carte) + E13 (animal fields)
        Show.test.tsx            ← E10 + E12 + E13
  controllers/backend/
    products_controller.rb       ← E11 (format.csv) + E12 (geolocation) + E13 (animal fields)
```

---

## Tech Stack

- Rails 6, Ruby 2.6 — `.select {}.map {}`, `.each_with_object` (NO filter_map/then/yield_self)
- React 18 + TypeScript strict (no `any`)
- Vitest + React Testing Library
- Inertia.js v2
- react-leaflet v4, leaflet v1.9
- CSS: Tailwind className pour layout ; `style={{}}` pour CSS vars (`var(--color-*)`) ou hex

---

## File Structure

```
app/frontend/types/catalogue.ts                          (modifié)
app/frontend/pages/Backend/Catalogue/Index.tsx           (modifié)
app/frontend/pages/Backend/Catalogue/Index.test.tsx      (modifié)
app/frontend/pages/Backend/Catalogue/Show.tsx            (modifié)
app/frontend/pages/Backend/Catalogue/Show.test.tsx       (modifié)
app/controllers/backend/products_controller.rb           (modifié)
```

---

## Task 1 — E10 : Boutons d'action CRUD sur Index et Show

### Step 1.1 — Ajouter 1 test échouant dans `Index.test.tsx`

Ouvrir `app/frontend/pages/Backend/Catalogue/Index.test.tsx`. Ajouter le test suivant à la fin du bloc `describe('CatalogueIndex', ...)`, avant le `})` de fermeture :

```typescript
  it('renders Nouveau produit link', () => {
    renderIndex()
    expect(screen.getByRole('link', { name: /Nouveau produit/ })).toBeInTheDocument()
  })
```

Commande pour lancer les tests et confirmer 1 échec :

```bash
cd /Users/yusper/Downloads/SenagrOS/ekylibre-main && yarn vitest run src/pages/Backend/Catalogue/Index.test.tsx 2>&1 | tail -15
```

Sortie attendue :
```
 FAIL  src/pages/Backend/Catalogue/Index.test.tsx
   × renders Nouveau produit link
 Tests  8 passed | 1 failed (9)
```

### Step 1.2 — Confirmer l'échec

```bash
cd /Users/yusper/Downloads/SenagrOS/ekylibre-main && yarn vitest run src/pages/Backend/Catalogue/Index.test.tsx --reporter=verbose 2>&1 | grep -E "(✓|×|passed|failed)"
```

Sortie attendue :
```
  ✓ renders "Catalogue" heading
  ✓ renders produit name in table
  ✓ renders type badge with correct label for Matter
  ✓ shows "Épuisé" badge when population = 0 and dead_at is null
  ✓ shows "Inactif" badge when dead_at is set
  ✓ renders pagination info from meta.total_count
  ✓ renders état filter select
  ✓ initializes état filter to "dead" when filters.etat is "dead"
  × renders Nouveau produit link
 Tests  8 passed | 1 failed (9)
```

### Step 1.3 — Implémenter le bouton "Nouveau produit" dans `Index.tsx`

Ouvrir `app/frontend/pages/Backend/Catalogue/Index.tsx`. Remplacer le `<h1>` existant seul (ligne 35-37) par un header flex contenant le titre et le lien :

Ancien code :
```tsx
      <h1 className="text-2xl font-bold mb-6" style={{ color: 'var(--color-text)' }}>
        Catalogue
      </h1>
```

Nouveau code :
```tsx
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>
          Catalogue
        </h1>
        <a
          href="/backend/products/new"
          className="px-4 py-2 text-sm rounded-md font-medium"
          style={{ background: 'var(--color-primary)', color: '#fff', textDecoration: 'none' }}
        >
          + Nouveau produit
        </a>
      </div>
```

### Step 1.4 — Lancer les tests Index et confirmer 9 PASS

```bash
cd /Users/yusper/Downloads/SenagrOS/ekylibre-main && yarn vitest run src/pages/Backend/Catalogue/Index.test.tsx --reporter=verbose 2>&1 | tail -15
```

Sortie attendue :
```
  ✓ renders "Catalogue" heading
  ✓ renders produit name in table
  ✓ renders type badge with correct label for Matter
  ✓ shows "Épuisé" badge when population = 0 and dead_at is null
  ✓ shows "Inactif" badge when dead_at is set
  ✓ renders pagination info from meta.total_count
  ✓ renders état filter select
  ✓ initializes état filter to "dead" when filters.etat is "dead"
  ✓ renders Nouveau produit link
 Tests  9 passed (9)
```

### Step 1.5 — Ajouter 2 tests échouants dans `Show.test.tsx`

Ouvrir `app/frontend/pages/Backend/Catalogue/Show.test.tsx`. Ajouter les 2 nouveaux tests à la fin du bloc `describe('CatalogueShow', ...)`, avant le `})` de fermeture :

```typescript
  it('renders Modifier button', () => {
    renderShow()
    expect(screen.getByRole('link', { name: /Modifier/ })).toBeInTheDocument()
  })

  it('renders Supprimer button', () => {
    renderShow()
    expect(screen.getByRole('button', { name: /Supprimer/ })).toBeInTheDocument()
  })
```

Commande pour lancer les tests et confirmer les 2 échecs :

```bash
cd /Users/yusper/Downloads/SenagrOS/ekylibre-main && yarn vitest run src/pages/Backend/Catalogue/Show.test.tsx 2>&1 | tail -15
```

Sortie attendue :
```
 FAIL  src/pages/Backend/Catalogue/Show.test.tsx
   × renders Modifier button
   × renders Supprimer button
 Tests  18 passed | 2 failed (20)
```

### Step 1.6 — Confirmer les 2 échecs

```bash
cd /Users/yusper/Downloads/SenagrOS/ekylibre-main && yarn vitest run src/pages/Backend/Catalogue/Show.test.tsx --reporter=verbose 2>&1 | grep -E "(✓|×|passed|failed)"
```

Sortie attendue :
```
  ✓ ... (18 tests existants)
  × renders Modifier button
  × renders Supprimer button
 Tests  18 passed | 2 failed (20)
```

### Step 1.7 — Implémenter les boutons Modifier / Supprimer dans `Show.tsx`

Ouvrir `app/frontend/pages/Backend/Catalogue/Show.tsx`. Remplacer le bloc de navigation "← Retour" + titre (lignes 52-62) par un header structuré avec les boutons d'action. L'import `router` de `@inertiajs/react` est déjà présent.

Ancien code :
```tsx
      <a
        href="/backend/products"
        className="no-underline text-sm mb-6 inline-block"
        style={{ color: 'var(--color-primary)' }}
      >
        ← Retour au catalogue
      </a>

      <h1 className="text-2xl font-bold mb-4 mt-2" style={{ color: 'var(--color-text)' }}>
        {produit.name}
      </h1>
```

Nouveau code :
```tsx
      <div className="flex items-center justify-between mb-6">
        <a
          href="/backend/products"
          className="no-underline text-sm"
          style={{ color: 'var(--color-primary)' }}
        >
          ← Retour au catalogue
        </a>
        <div className="flex gap-2">
          <a
            href={`/backend/products/${produit.id}/edit`}
            className="px-4 py-2 text-sm rounded-md font-medium"
            style={{ background: 'var(--color-primary)', color: '#fff', textDecoration: 'none' }}
          >
            Modifier
          </a>
          <button
            onClick={() => {
              if (window.confirm('Supprimer ce produit ?')) {
                router.delete(`/backend/products/${produit.id}`)
              }
            }}
            className="px-4 py-2 text-sm rounded-md font-medium"
            style={{ background: '#dc2626', color: '#fff', border: 'none', cursor: 'pointer' }}
          >
            Supprimer
          </button>
        </div>
      </div>

      <h1 className="text-2xl font-bold mb-4 mt-2" style={{ color: 'var(--color-text)' }}>
        {produit.name}
      </h1>
```

### Step 1.8 — Lancer les tests Show et confirmer 20 PASS

```bash
cd /Users/yusper/Downloads/SenagrOS/ekylibre-main && yarn vitest run src/pages/Backend/Catalogue/Show.test.tsx --reporter=verbose 2>&1 | tail -25
```

Sortie attendue :
```
  ✓ renders produit name as heading
  ✓ renders type badge
  ✓ renders population with unit
  ✓ renders movement row with + prefix for positive delta
  ✓ shows empty state message when movements is empty
  ✓ renders movement form
  ✓ renders delta number input
  ✓ renders mouvement type select with Achat as default
  ✓ calls router.post on form submit
  ✓ shows age in header for Animal type when born_at is set
  ✓ does not show Âge label for Matter type even with born_at set
  ✓ renders movement filter select
  ✓ shows pagination when total exceeds per_page
  ✓ hides pagination when total fits in one page
  ✓ shows empty interventions message when interventions is empty
  ✓ renders intervention row when interventions are present
  ✓ shows empty issues message when issues is empty
  ✓ renders issue row when issues are present
  ✓ renders Modifier button
  ✓ renders Supprimer button
 Tests  20 passed (20)
```

### Step 1.9 — Vérifier TypeScript

```bash
cd /Users/yusper/Downloads/SenagrOS/ekylibre-main && yarn tsc --noEmit 2>&1 | tail -5
```

Sortie attendue :
```
(aucune erreur — sortie vide)
```

### Step 1.10 — Commit

```bash
cd /Users/yusper/Downloads/SenagrOS/ekylibre-main && git add app/frontend/pages/Backend/Catalogue/Index.tsx app/frontend/pages/Backend/Catalogue/Index.test.tsx app/frontend/pages/Backend/Catalogue/Show.tsx app/frontend/pages/Backend/Catalogue/Show.test.tsx && git commit -m "feat: add Nouveau produit / Modifier / Supprimer action buttons"
```

Sortie attendue :
```
[feat/phase8-enrichissements-p3 xxxxxxx] feat: add Nouveau produit / Modifier / Supprimer action buttons
 4 files changed, ...
```

---

## Task 2 — E11 : Export CSV Catalogue

### Step 2.1 — Ajouter 1 test échouant dans `Index.test.tsx`

Ouvrir `app/frontend/pages/Backend/Catalogue/Index.test.tsx`. Ajouter le test suivant à la fin du bloc `describe('CatalogueIndex', ...)`, avant le `})` de fermeture :

```typescript
  it('renders Exporter CSV link', () => {
    renderIndex()
    expect(screen.getByRole('link', { name: /Exporter CSV/ })).toBeInTheDocument()
  })
```

Commande pour lancer les tests et confirmer 1 échec :

```bash
cd /Users/yusper/Downloads/SenagrOS/ekylibre-main && yarn vitest run src/pages/Backend/Catalogue/Index.test.tsx 2>&1 | tail -15
```

Sortie attendue :
```
 FAIL  src/pages/Backend/Catalogue/Index.test.tsx
   × renders Exporter CSV link
 Tests  9 passed | 1 failed (10)
```

### Step 2.2 — Confirmer l'échec

```bash
cd /Users/yusper/Downloads/SenagrOS/ekylibre-main && yarn vitest run src/pages/Backend/Catalogue/Index.test.tsx --reporter=verbose 2>&1 | grep -E "(✓|×|passed|failed)"
```

Sortie attendue :
```
  ✓ renders "Catalogue" heading
  ✓ renders produit name in table
  ✓ renders type badge with correct label for Matter
  ✓ shows "Épuisé" badge when population = 0 and dead_at is null
  ✓ shows "Inactif" badge when dead_at is set
  ✓ renders pagination info from meta.total_count
  ✓ renders état filter select
  ✓ initializes état filter to "dead" when filters.etat is "dead"
  ✓ renders Nouveau produit link
  × renders Exporter CSV link
 Tests  9 passed | 1 failed (10)
```

### Step 2.3 — Implémenter le lien "Exporter CSV" dans `Index.tsx`

Ouvrir `app/frontend/pages/Backend/Catalogue/Index.tsx`. Dans la barre de filtres (`<div className="flex gap-3 mb-5 flex-wrap items-center">`), ajouter le lien CSV juste APRÈS le bouton "Rechercher" (après la balise `</button>` du bouton Rechercher, avant la balise `</div>` de fermeture de la barre de filtres) :

```tsx
        <a
          href={`/backend/products.csv?q=${encodeURIComponent(q)}&produit_type=${typeFilter}&etat=${etatFilter}`}
          className="px-4 py-2 text-sm rounded-md border"
          style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg-card)', color: 'var(--color-text)', textDecoration: 'none' }}
        >
          Exporter CSV
        </a>
```

### Step 2.4 — Lancer les tests Index et confirmer 10 PASS

```bash
cd /Users/yusper/Downloads/SenagrOS/ekylibre-main && yarn vitest run src/pages/Backend/Catalogue/Index.test.tsx --reporter=verbose 2>&1 | tail -15
```

Sortie attendue :
```
  ✓ renders "Catalogue" heading
  ✓ renders produit name in table
  ✓ renders type badge with correct label for Matter
  ✓ shows "Épuisé" badge when population = 0 and dead_at is null
  ✓ shows "Inactif" badge when dead_at is set
  ✓ renders pagination info from meta.total_count
  ✓ renders état filter select
  ✓ initializes état filter to "dead" when filters.etat is "dead"
  ✓ renders Nouveau produit link
  ✓ renders Exporter CSV link
 Tests  10 passed (10)
```

### Step 2.5 — Mettre à jour `products_controller.rb` : ajouter `require 'csv'` et `format.csv`

Ouvrir `app/controllers/backend/products_controller.rb`. Ajouter `require 'csv'` sur la première ligne du fichier (avant `module Backend`).

Ancien début de fichier :
```ruby
module Backend
```

Nouveau début de fichier :
```ruby
require 'csv'

module Backend
```

Ensuite, dans l'action `index`, remplacer le `render inertia:` final par un bloc `respond_to` qui couvre à la fois le format HTML et le format CSV. L'action `index` se termine actuellement avec ce render (à l'intérieur du bloc `def index`… `end`) :

Ancien code dans `index` (dernier render) :
```ruby
      render inertia: 'Backend/Catalogue/Index', props: {
        produits: paginated.map { |p| produit_json(p) },
        filters: { q: params[:q], produit_type: params[:produit_type], etat: params[:etat] },
        meta: { total_count: total_count, current_page: current_page, total_pages: total_pages }
      }
```

Nouveau code :
```ruby
      respond_to do |format|
        format.html do
          render inertia: 'Backend/Catalogue/Index', props: {
            produits: paginated.map { |p| produit_json(p) },
            filters: { q: params[:q], produit_type: params[:produit_type], etat: params[:etat] },
            meta: { total_count: total_count, current_page: current_page, total_pages: total_pages }
          }
        end
        format.csv do
          csv_data = CSV.generate(col_sep: ';') do |csv|
            csv << ['Nom', 'Type', 'Numéro', 'Stock', 'Unité', 'État']
            scope.sort_by(&:name).each { |p|
              etat_label = p.respond_to?(:dead_at) && p.dead_at ? 'Inactif' : 'Actif'
              csv << [p.name.to_s, p.type.to_s, p.number.to_s, p.population.to_f, '', etat_label]
            }
          end
          send_data csv_data, filename: 'catalogue.csv', type: 'text/csv; charset=utf-8', disposition: 'attachment'
        end
      end
```

### Step 2.6 — Vérifier la syntaxe Ruby

```bash
ruby -c /Users/yusper/Downloads/SenagrOS/ekylibre-main/app/controllers/backend/products_controller.rb
```

Sortie attendue :
```
Syntax OK
```

### Step 2.7 — Vérifier TypeScript

```bash
cd /Users/yusper/Downloads/SenagrOS/ekylibre-main && yarn tsc --noEmit 2>&1 | tail -5
```

Sortie attendue :
```
(aucune erreur — sortie vide)
```

### Step 2.8 — Commit

```bash
cd /Users/yusper/Downloads/SenagrOS/ekylibre-main && git add app/frontend/pages/Backend/Catalogue/Index.tsx app/frontend/pages/Backend/Catalogue/Index.test.tsx app/controllers/backend/products_controller.rb && git commit -m "feat: add CSV export to CatalogueIndex"
```

Sortie attendue :
```
[feat/phase8-enrichissements-p3 xxxxxxx] feat: add CSV export to CatalogueIndex
 3 files changed, ...
```

---

## Task 3 — E12 : Localisation produit sur carte

### Step 3.1 — Mettre à jour `types/catalogue.ts` : ajouter `geolocation` à `Produit`

Ouvrir `app/frontend/types/catalogue.ts`. Ajouter le champ `geolocation` à l'interface `Produit`. Remplacer l'interface `Produit` existante :

Ancien code :
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

Nouveau code :
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
  geolocation: { lat: number; lng: number } | null
}
```

Commande de vérification TypeScript :

```bash
cd /Users/yusper/Downloads/SenagrOS/ekylibre-main && yarn tsc --noEmit 2>&1 | tail -10
```

Sortie attendue (des erreurs TypeScript apparaîtront car mockProduit dans les tests n'a pas encore `geolocation`) :
```
error TS2345: Argument of type '...' is not assignable to parameter of type 'CatalogueIndexProps'.
  Type '{ id: number; name: string; ... born_at: null; }' is not assignable to type 'Produit'.
    Property 'geolocation' is missing in type ...
```

Ces erreurs seront corrigées aux étapes suivantes.

### Step 3.2 — Mettre à jour `mockProduit` dans `Index.test.tsx` : ajouter `geolocation: null`

Ouvrir `app/frontend/pages/Backend/Catalogue/Index.test.tsx`. Dans le `mockProduit`, ajouter `geolocation: null` :

Ancien code :
```typescript
const mockProduit = {
  id: 1,
  name: 'Maïs local',
  number: 'P001',
  produit_type: 'Matter' as const,
  population: 50,
  unit_name: 'kg',
  description: null,
  dead_at: null,
  born_at: null,
}
```

Nouveau code :
```typescript
const mockProduit = {
  id: 1,
  name: 'Maïs local',
  number: 'P001',
  produit_type: 'Matter' as const,
  population: 50,
  unit_name: 'kg',
  description: null,
  dead_at: null,
  born_at: null,
  geolocation: null,
}
```

### Step 3.3 — Ajouter le mock `react-leaflet` et mettre à jour `mockProduit` dans `Show.test.tsx`

Ouvrir `app/frontend/pages/Backend/Catalogue/Show.test.tsx`.

1. Ajouter l'import `React` en haut du fichier (avant les autres imports) si absent, puis ajouter le mock `react-leaflet` juste après le mock `@inertiajs/react` existant :

Après le bloc existant :
```typescript
vi.mock('@inertiajs/react', () => ({
  router: { get: vi.fn(), post: vi.fn() },
}))
```

Ajouter :
```typescript
vi.mock('react-leaflet', () => ({
  MapContainer: ({ children }: { children: React.ReactNode }) => <div data-testid="map">{children}</div>,
  TileLayer: () => null,
  Marker: () => <div data-testid="marker" />,
  Popup: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))
```

2. Dans le `mockProduit`, ajouter `geolocation: null` :

Ancien code :
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

Nouveau code :
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
  geolocation: null,
}
```

3. Ajouter 2 nouveaux tests à la fin du bloc `describe('CatalogueShow', ...)`, avant le `})` de fermeture :

```typescript
  it('renders location section when geolocation is set', () => {
    renderShow({ produit: { ...mockProduit, geolocation: { lat: 14.6928, lng: -17.4467 } } })
    expect(screen.getByText(/Localisation/)).toBeInTheDocument()
  })

  it('hides location section when geolocation is null', () => {
    renderShow({ produit: { ...mockProduit, geolocation: null } })
    expect(screen.queryByText(/Localisation/)).not.toBeInTheDocument()
  })
```

Commande pour lancer les tests et confirmer les 2 échecs :

```bash
cd /Users/yusper/Downloads/SenagrOS/ekylibre-main && yarn vitest run src/pages/Backend/Catalogue/Show.test.tsx 2>&1 | tail -15
```

Sortie attendue :
```
 FAIL  src/pages/Backend/Catalogue/Show.test.tsx
   × renders location section when geolocation is set
   × hides location section when geolocation is null
 Tests  20 passed | 2 failed (22)
```

### Step 3.4 — Confirmer les 2 échecs

```bash
cd /Users/yusper/Downloads/SenagrOS/ekylibre-main && yarn vitest run src/pages/Backend/Catalogue/Show.test.tsx --reporter=verbose 2>&1 | grep -E "(✓|×|passed|failed)"
```

Sortie attendue :
```
  ✓ ... (20 tests existants)
  × renders location section when geolocation is set
  × hides location section when geolocation is null
 Tests  20 passed | 2 failed (22)
```

### Step 3.5 — Implémenter la carte dans `Show.tsx`

Ouvrir `app/frontend/pages/Backend/Catalogue/Show.tsx`.

1. Ajouter les imports react-leaflet et leaflet CSS en haut du fichier, après les imports existants :

Après la ligne :
```typescript
import { MOUVEMENT_LABELS } from '../../../types/catalogue'
```

Ajouter :
```typescript
import { MapContainer, TileLayer, Marker } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
```

2. Ajouter la section carte APRÈS le header card (après la `</div>` fermant `{/* Header card */}`) et AVANT la section `{/* Movements */}`. Insérer après :
```tsx
      </div>

      {/* Movements */}
```

La section à insérer :
```tsx
      {/* Localisation */}
      {produit.geolocation && (
        <div className="mb-6">
          <h2 className="text-base font-semibold mb-3" style={{ color: 'var(--color-text)' }}>
            Localisation
          </h2>
          <div style={{ height: '220px', borderRadius: '0.5rem', overflow: 'hidden', border: '1px solid var(--color-border)' }}>
            <MapContainer
              center={[produit.geolocation.lat, produit.geolocation.lng]}
              zoom={13}
              style={{ height: '100%', width: '100%' }}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution="© OpenStreetMap contributors"
              />
              <Marker position={[produit.geolocation.lat, produit.geolocation.lng]} />
            </MapContainer>
          </div>
        </div>
      )}

      {/* Movements */}
```

### Step 3.6 — Lancer les tests Show et confirmer 22 PASS

```bash
cd /Users/yusper/Downloads/SenagrOS/ekylibre-main && yarn vitest run src/pages/Backend/Catalogue/Show.test.tsx --reporter=verbose 2>&1 | tail -30
```

Sortie attendue :
```
  ✓ renders produit name as heading
  ✓ renders type badge
  ✓ renders population with unit
  ✓ renders movement row with + prefix for positive delta
  ✓ shows empty state message when movements is empty
  ✓ renders movement form
  ✓ renders delta number input
  ✓ renders mouvement type select with Achat as default
  ✓ calls router.post on form submit
  ✓ shows age in header for Animal type when born_at is set
  ✓ does not show Âge label for Matter type even with born_at set
  ✓ renders movement filter select
  ✓ shows pagination when total exceeds per_page
  ✓ hides pagination when total fits in one page
  ✓ shows empty interventions message when interventions is empty
  ✓ renders intervention row when interventions are present
  ✓ shows empty issues message when issues is empty
  ✓ renders issue row when issues are present
  ✓ renders Modifier button
  ✓ renders Supprimer button
  ✓ renders location section when geolocation is set
  ✓ hides location section when geolocation is null
 Tests  22 passed (22)
```

### Step 3.7 — Mettre à jour `produit_json` dans `products_controller.rb` : ajouter `geolocation`

Ouvrir `app/controllers/backend/products_controller.rb`. Dans la méthode privée `produit_json`, ajouter le champ `geolocation` au hash de retour.

Ancien code dans `produit_json` (hash de retour) :
```ruby
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
```

Nouveau code :
```ruby
        {
          id: product.id,
          name: product.name,
          number: product.number,
          produit_type: produit_type,
          population: (product.population.to_f rescue 0.0),
          unit_name: product.conditioning_unit&.name || product.variant&.default_unit&.name || '',
          description: product.description,
          dead_at: product.dead_at&.to_date&.iso8601,
          born_at: product.born_at&.to_date&.iso8601,
          geolocation: begin
                         g = product.initial_geolocation
                         g ? { lat: g.y.to_f, lng: g.x.to_f } : nil
                       rescue
                         nil
                       end
        }
```

### Step 3.8 — Vérifier la syntaxe Ruby

```bash
ruby -c /Users/yusper/Downloads/SenagrOS/ekylibre-main/app/controllers/backend/products_controller.rb
```

Sortie attendue :
```
Syntax OK
```

### Step 3.9 — Vérifier TypeScript

```bash
cd /Users/yusper/Downloads/SenagrOS/ekylibre-main && yarn tsc --noEmit 2>&1 | tail -5
```

Sortie attendue :
```
(aucune erreur — sortie vide)
```

### Step 3.10 — Commit

```bash
cd /Users/yusper/Downloads/SenagrOS/ekylibre-main && git add app/frontend/types/catalogue.ts app/frontend/pages/Backend/Catalogue/Index.test.tsx app/frontend/pages/Backend/Catalogue/Show.tsx app/frontend/pages/Backend/Catalogue/Show.test.tsx app/controllers/backend/products_controller.rb && git commit -m "feat: show geolocation map in CatalogueShow"
```

Sortie attendue :
```
[feat/phase8-enrichissements-p3 xxxxxxx] feat: show geolocation map in CatalogueShow
 5 files changed, ...
```

---

## Task 4 — E13 : Données spécifiques animaux (sex, ID, filiation)

### Step 4.1 — Mettre à jour `types/catalogue.ts` : ajouter champs animal à `Produit`

Ouvrir `app/frontend/types/catalogue.ts`. Ajouter les 3 champs optionnels à l'interface `Produit`.

Ancien code :
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
  geolocation: { lat: number; lng: number } | null
}
```

Nouveau code :
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
  geolocation: { lat: number; lng: number } | null
  sex: string | null
  identification_number: string | null
  filiation_status: string | null
}
```

Commande de vérification TypeScript (des erreurs TypeScript apparaîtront sur les mockProduit) :

```bash
cd /Users/yusper/Downloads/SenagrOS/ekylibre-main && yarn tsc --noEmit 2>&1 | tail -10
```

Sortie attendue (erreurs temporaires sur mockProduit) :
```
error TS2345: ... Property 'sex' is missing ...
error TS2345: ... Property 'identification_number' is missing ...
error TS2345: ... Property 'filiation_status' is missing ...
```

Ces erreurs seront corrigées aux étapes suivantes.

### Step 4.2 — Mettre à jour `mockProduit` dans `Index.test.tsx` : ajouter champs animal

Ouvrir `app/frontend/pages/Backend/Catalogue/Index.test.tsx`. Dans le `mockProduit`, ajouter les 3 nouveaux champs :

Ancien code :
```typescript
const mockProduit = {
  id: 1,
  name: 'Maïs local',
  number: 'P001',
  produit_type: 'Matter' as const,
  population: 50,
  unit_name: 'kg',
  description: null,
  dead_at: null,
  born_at: null,
  geolocation: null,
}
```

Nouveau code :
```typescript
const mockProduit = {
  id: 1,
  name: 'Maïs local',
  number: 'P001',
  produit_type: 'Matter' as const,
  population: 50,
  unit_name: 'kg',
  description: null,
  dead_at: null,
  born_at: null,
  geolocation: null,
  sex: null,
  identification_number: null,
  filiation_status: null,
}
```

### Step 4.3 — Mettre à jour `mockProduit` dans `Show.test.tsx` et ajouter 2 tests échouants

Ouvrir `app/frontend/pages/Backend/Catalogue/Show.test.tsx`.

1. Dans le `mockProduit`, ajouter les 3 nouveaux champs :

Ancien code :
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
  geolocation: null,
}
```

Nouveau code :
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
  geolocation: null,
  sex: null,
  identification_number: null,
  filiation_status: null,
}
```

2. Ajouter 2 nouveaux tests à la fin du bloc `describe('CatalogueShow', ...)`, avant le `})` de fermeture :

```typescript
  it('shows animal fields for Animal type when values are set', () => {
    renderShow({
      produit: { ...mockProduit, produit_type: 'Animal' as const, sex: 'male', identification_number: 'FR12345678', filiation_status: 'certified' },
    })
    expect(screen.getByText('FR12345678')).toBeInTheDocument()
  })

  it('hides animal fields for Matter type', () => {
    renderShow({
      produit: { ...mockProduit, produit_type: 'Matter' as const, sex: 'male' },
    })
    expect(screen.queryByText(/Identification/)).not.toBeInTheDocument()
  })
```

Commande pour lancer les tests et confirmer les 2 échecs :

```bash
cd /Users/yusper/Downloads/SenagrOS/ekylibre-main && yarn vitest run src/pages/Backend/Catalogue/Show.test.tsx 2>&1 | tail -15
```

Sortie attendue :
```
 FAIL  src/pages/Backend/Catalogue/Show.test.tsx
   × shows animal fields for Animal type when values are set
   × hides animal fields for Matter type
 Tests  22 passed | 2 failed (24)
```

### Step 4.4 — Confirmer les 2 échecs

```bash
cd /Users/yusper/Downloads/SenagrOS/ekylibre-main && yarn vitest run src/pages/Backend/Catalogue/Show.test.tsx --reporter=verbose 2>&1 | grep -E "(✓|×|passed|failed)"
```

Sortie attendue :
```
  ✓ ... (22 tests existants)
  × shows animal fields for Animal type when values are set
  × hides animal fields for Matter type
 Tests  22 passed | 2 failed (24)
```

### Step 4.5 — Implémenter les champs animaux dans `Show.tsx`

Ouvrir `app/frontend/pages/Backend/Catalogue/Show.tsx`. Dans le header card (`{/* Header card */}`), ajouter le bloc animal APRÈS le bloc `{(produit.produit_type === 'Animal' || produit.produit_type === 'Plant') && produit.born_at && (...)}` (le bloc d'âge), et AVANT la balise `</div>` fermant le header card.

Localiser la fin du header card :
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
      </div>
```

Remplacer par :
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

        {produit.produit_type === 'Animal' && (
          <>
            {produit.identification_number && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: 'var(--color-text-muted)' }}>
                  Identification
                </p>
                <p className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>
                  {produit.identification_number}
                </p>
              </div>
            )}
            {produit.sex && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: 'var(--color-text-muted)' }}>
                  Sexe
                </p>
                <p className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>
                  {produit.sex === 'male' ? 'Mâle' : produit.sex === 'female' ? 'Femelle' : produit.sex}
                </p>
              </div>
            )}
            {produit.filiation_status && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: 'var(--color-text-muted)' }}>
                  Filiation
                </p>
                <p className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>
                  {produit.filiation_status === 'certified' ? 'Certifiée' : produit.filiation_status === 'uncertified' ? 'Non certifiée' : 'Inconnue'}
                </p>
              </div>
            )}
          </>
        )}
      </div>
```

### Step 4.6 — Lancer les tests Show et confirmer 24 PASS

```bash
cd /Users/yusper/Downloads/SenagrOS/ekylibre-main && yarn vitest run src/pages/Backend/Catalogue/Show.test.tsx --reporter=verbose 2>&1 | tail -30
```

Sortie attendue :
```
  ✓ renders produit name as heading
  ✓ renders type badge
  ✓ renders population with unit
  ✓ renders movement row with + prefix for positive delta
  ✓ shows empty state message when movements is empty
  ✓ renders movement form
  ✓ renders delta number input
  ✓ renders mouvement type select with Achat as default
  ✓ calls router.post on form submit
  ✓ shows age in header for Animal type when born_at is set
  ✓ does not show Âge label for Matter type even with born_at set
  ✓ renders movement filter select
  ✓ shows pagination when total exceeds per_page
  ✓ hides pagination when total fits in one page
  ✓ shows empty interventions message when interventions is empty
  ✓ renders intervention row when interventions are present
  ✓ shows empty issues message when issues is empty
  ✓ renders issue row when issues are present
  ✓ renders Modifier button
  ✓ renders Supprimer button
  ✓ renders location section when geolocation is set
  ✓ hides location section when geolocation is null
  ✓ shows animal fields for Animal type when values are set
  ✓ hides animal fields for Matter type
 Tests  24 passed (24)
```

### Step 4.7 — Mettre à jour `produit_json` dans `products_controller.rb` : ajouter champs animal

Ouvrir `app/controllers/backend/products_controller.rb`. Dans la méthode privée `produit_json`, ajouter les 3 champs animal au hash de retour.

Ancien code (fin du hash dans `produit_json`) :
```ruby
          geolocation: begin
                         g = product.initial_geolocation
                         g ? { lat: g.y.to_f, lng: g.x.to_f } : nil
                       rescue
                         nil
                       end
        }
```

Nouveau code :
```ruby
          geolocation: begin
                         g = product.initial_geolocation
                         g ? { lat: g.y.to_f, lng: g.x.to_f } : nil
                       rescue
                         nil
                       end,
          sex:                    (product.respond_to?(:sex) ? product.sex.to_s.presence : nil),
          identification_number:  (product.respond_to?(:identification_number) ? product.identification_number.to_s.presence : nil),
          filiation_status:       (product.respond_to?(:filiation_status) ? product.filiation_status.to_s.presence : nil)
        }
```

### Step 4.8 — Vérifier la syntaxe Ruby

```bash
ruby -c /Users/yusper/Downloads/SenagrOS/ekylibre-main/app/controllers/backend/products_controller.rb
```

Sortie attendue :
```
Syntax OK
```

### Step 4.9 — Vérifier TypeScript global

```bash
cd /Users/yusper/Downloads/SenagrOS/ekylibre-main && yarn tsc --noEmit 2>&1 | tail -5
```

Sortie attendue :
```
(aucune erreur — sortie vide)
```

### Step 4.10 — Lancer tous les tests Catalogue pour vérification globale

```bash
cd /Users/yusper/Downloads/SenagrOS/ekylibre-main && yarn vitest run src/pages/Backend/Catalogue/Index.test.tsx src/pages/Backend/Catalogue/Show.test.tsx --reporter=verbose 2>&1 | tail -40
```

Sortie attendue :
```
 Tests  34 passed (34)
 Duration  ...
```

### Step 4.11 — Commit

```bash
cd /Users/yusper/Downloads/SenagrOS/ekylibre-main && git add app/frontend/types/catalogue.ts app/frontend/pages/Backend/Catalogue/Index.test.tsx app/frontend/pages/Backend/Catalogue/Show.tsx app/frontend/pages/Backend/Catalogue/Show.test.tsx app/controllers/backend/products_controller.rb && git commit -m "feat: show sex, identification_number, filiation_status for Animal in CatalogueShow"
```

Sortie attendue :
```
[feat/phase8-enrichissements-p3 xxxxxxx] feat: show sex, identification_number, filiation_status for Animal in CatalogueShow
 5 files changed, ...
```

---

## Vérification finale

### Lancer tous les tests de la phase 8

```bash
cd /Users/yusper/Downloads/SenagrOS/ekylibre-main && yarn vitest run src/pages/Backend/Catalogue/ --reporter=verbose 2>&1 | tail -40
```

Sortie attendue :
```
 Tests  34 passed (34)
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

### Vérification syntaxe Ruby du controller

```bash
ruby -c /Users/yusper/Downloads/SenagrOS/ekylibre-main/app/controllers/backend/products_controller.rb
```

Sortie attendue :
```
Syntax OK
```

### Résumé des commits de la phase 8

```bash
cd /Users/yusper/Downloads/SenagrOS/ekylibre-main && git log --oneline -4
```

Sortie attendue :
```
xxxxxxx feat: show sex, identification_number, filiation_status for Animal in CatalogueShow
xxxxxxx feat: show geolocation map in CatalogueShow
xxxxxxx feat: add CSV export to CatalogueIndex
xxxxxxx feat: add Nouveau produit / Modifier / Supprimer action buttons
```
