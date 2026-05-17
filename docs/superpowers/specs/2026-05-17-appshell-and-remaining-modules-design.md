# AppShell + Modules Restants — Design Spec

**Date :** 2026-05-17
**Modules :** AppShell, Parcelles, Productions, Comptabilité

---

## Contexte

SenagrOS est un fork Ekylibre (Rails 5.2 + PostgreSQL/PostGIS) migrant progressivement vers React 18 + Inertia.js v2.

Dashboard (`/backend`) et Interventions (`/backend/interventions`) sont déjà migrés en React. Les pages migrées sont des composants React autonomes sans navigation inter-modules. Ce spec couvre :

1. **AppShell** — layout partagé (Topbar + Sidebar) qui entoure toutes les pages React
2. **Parcelles** — `/backend/cultivable-zones` → carte Leaflet + table
3. **Productions** — `/backend/activity_productions` → table TanStack
4. **Comptabilité** — `/backend/journal_entries` → table TanStack avec lignes expandables

---

## 1. AppShell

### Composant

**Fichier :** `app/frontend/components/AppShell.tsx`

Layout en deux niveaux :

```
┌─────────────────────────────────────────────┐
│  TOPBAR (44px, #1e3a16)                     │
│  [Logo SenagrOS] [Campagne ▾] ... [YN ▾]   │
├──────────────┬──────────────────────────────┤
│  SIDEBAR     │  CONTENU (flex:1, scrollable)│
│  200px       │  {children}                  │
│  #2D4A22     │                              │
│              │                              │
└──────────────┴──────────────────────────────┘
```

**Topbar** (hauteur 44px, fond `#1e3a16`) :
- Logo : carré vert `#6B9E3F` avec initiale "S" + texte "SenagrOS"
- Sélecteur campagne : fond `#2d5a20`, affiche `current_campaign.name` depuis shared props, non-cliquable pour v1
- Côté droit : bouton notifications (icône `Bell` de Lucide), avatar utilisateur (`current_user.name` initiales)

**Sidebar** (largeur 200px, fond `#2D4A22`) :
- Section "Navigation" (label uppercase) avec 5 liens :
  - Dashboard → `/backend` (icône `LayoutDashboard`)
  - Interventions → `/backend/interventions` (icône `Wrench`)
  - Parcelles → `/backend/cultivable-zones` (icône `Map`)
  - Productions → `/backend/activity_productions` (icône `Sprout`)
  - Comptabilité → `/backend/journal_entries` (icône `BookOpen`)
- Lien actif : fond `#3d6130`, texte blanc. Détection via `usePage().url.startsWith(href)`
- Section "Outils" séparée en bas (icône `Settings`) → `/backend/preferences`

**Zone contenu :** `flex: 1`, overflow-y auto, padding 24px.

### Pattern Inertia Persistent Layout

Chaque page React exporte son layout pour qu'Inertia le conserve entre navigations (pas de remount sidebar) :

```tsx
// Dans chaque page
import { AppShell } from '../../../components/AppShell'

export const layout = (page: ReactNode) => <AppShell>{page}</AppShell>
```

### Shared Props Rails

`Backend::BaseController` expose via `inertia_share` :

```ruby
inertia_share do
  {
    farm: { name: safe_company_name },
    current_campaign: safe_campaign_json,
    current_user: { name: current_user&.name, initials: current_user&.name&.split&.map(&:first)&.join }
  }
end
```

### Mise à jour pages existantes

- `app/frontend/pages/Backend/Dashboard/Home.tsx` : ajouter `export const layout`
- `app/frontend/pages/Backend/Interventions/Index.tsx` : ajouter `export const layout`
- Retirer le padding/background global du Dashboard (géré par AppShell)

### Tests

- `spec/frontend/components/AppShell.test.tsx` : rendu, lien actif, shared props

---

## 2. Parcelles (`/backend/cultivable-zones`)

### Controller

**Fichier :** `app/controllers/backend/cultivable_zones_controller.rb`

Ajouter dans l'action `index` existante :

```ruby
def index
  # ... existing list() call conservé pour format HTML legacy
  respond_to do |format|
    format.html do
      if inertia_request?
        parcelles = CultivableZone
          .select("id, name, ROUND((ST_Area(shape::geography)/10000.0)::numeric,2) AS area_ha, ST_AsGeoJSON(shape) AS geojson")
          .map { |z| z.as_json(only: %i[id name]).merge('area_ha' => z.area_ha.to_f, 'geojson' => z.geojson) }

        render inertia: 'Backend/Parcelles/Index', props: {
          parcelles: parcelles,
          meta: { total: parcelles.size }
        }
      else
        # fallback HAML legacy
      end
    end
  end
end
```

**Alternative plus propre :** ajouter `layout 'inertia', only: [:index]` et render inertia directement dans l'`index` en tête de méthode (même pattern que DashboardsController).

### Props

```ts
interface ParcellesIndexProps {
  parcelles: Array<{
    id: number
    name: string
    area_ha: number
    geojson: string | null
  }>
  meta: { total: number }
}
```

### Page React

**Fichier :** `app/frontend/pages/Backend/Parcelles/Index.tsx`

Layout : carte Leaflet (hauteur 55vh) en haut, table TanStack en bas.

- **Carte** : réutilise `react-leaflet`, centre par défaut Sénégal `[14.5, -14.5]`, zoom 7. Chaque parcelle avec `geojson` → `GeoJSON layer` coloré. Clic sur couche → highlight ligne dans table. Clic sur ligne table → fitBounds sur la parcelle.
- **Table** (TanStack Table v8) : colonnes Nom, Surface (ha), Actions (lien "Voir" → `/backend/cultivable-zones/:id`). Tri côté client (données déjà chargées).

### Composants

- `app/frontend/components/parcelles/ParcellesMap.tsx` — carte Leaflet dédiée page Parcelles (différente de la mini-carte Dashboard)
- `app/frontend/components/parcelles/ParcellesTable.tsx` — table TanStack

### Tests

- `pages/Backend/Parcelles/Index.test.tsx` — rendu props, lien vers show
- `components/parcelles/ParcellesTable.test.tsx` — colonnes, tri

---

## 3. Productions (`/backend/activity_productions`)

### Controller

**Fichier :** `app/controllers/backend/activity_productions_controller.rb`

Ajouter `layout 'inertia', only: [:index]` + action `index` Inertia :

```ruby
def index
  scope = ActivityProduction
    .includes(:activity, :cultivable_zone, :campaign)
    .order(started_on: :desc)
    .page(params[:page]).per(25)

  render inertia: 'Backend/Productions/Index', props: {
    productions: scope.as_json(
      only: %i[id started_on stopped_on state],
      methods: %i[name],
      include: {
        activity: { only: %i[id name family] },
        cultivable_zone: { only: %i[id name] },
        campaign: { only: %i[id name harvest_year] }
      }
    ),
    meta: { total: scope.total_count, page: (params[:page] || 1).to_i, per_page: 25 }
  }
end
```

### Props

```ts
interface ProductionsIndexProps {
  productions: Array<{
    id: number
    name: string
    started_on: string
    stopped_on: string | null
    state: string
    activity: { id: number; name: string; family: string }
    cultivable_zone: { id: number; name: string } | null
    campaign: { id: number; name: string; harvest_year: number }
  }>
  meta: { total: number; page: number; per_page: number }
}
```

### Page React

**Fichier :** `app/frontend/pages/Backend/Productions/Index.tsx`

Table TanStack v8, pagination serveur via `router.visit`. Colonnes :

| Colonne | Source |
|---|---|
| Nom | `name` |
| Activité | `activity.name` (badge couleur par `family`) |
| Campagne | `campaign.name` |
| Zone cultivable | `cultivable_zone.name` |
| Début | `started_on` formaté |
| Fin | `stopped_on` ou "En cours" |
| État | badge coloré |

### Tests

- `pages/Backend/Productions/Index.test.tsx`

---

## 4. Comptabilité (`/backend/journal_entries`)

### Controller

**Fichier :** `app/controllers/backend/journal_entries_controller.rb`

Ajouter `layout 'inertia', only: [:index]` + action `index` Inertia :

```ruby
def index
  scope = JournalEntry
    .includes(:journal, :items)
    .order(printed_on: :desc)
    .page(params[:page]).per(50)

  render inertia: 'Backend/Comptabilite/Index', props: {
    entries: scope.map do |e|
      e.as_json(only: %i[id number printed_on state real_debit real_credit])
       .merge(
         'journal_name' => e.journal&.name,
         'items' => e.items.as_json(only: %i[id name account_number real_debit real_credit])
       )
    end,
    meta: { total: scope.total_count, page: (params[:page] || 1).to_i, per_page: 50 }
  }
end
```

### Props

```ts
interface ComptabiliteIndexProps {
  entries: Array<{
    id: number
    number: string
    printed_on: string
    state: string
    real_debit: number
    real_credit: number
    journal_name: string
    items: Array<{
      id: number
      name: string
      account_number: string
      real_debit: number
      real_credit: number
    }>
  }>
  meta: { total: number; page: number; per_page: number }
}
```

### Page React

**Fichier :** `app/frontend/pages/Backend/Comptabilite/Index.tsx`

TanStack Table avec `getExpandedRowModel()`. Ligne parent = écriture, expandée = sous-table des items.

Colonnes parent : Numéro, Date, Journal, Débit total, Crédit total, État, bouton expand `▶`.
Colonnes items : Libellé, Compte, Débit, Crédit.

Pagination serveur via `router.visit`.

### Tests

- `pages/Backend/Comptabilite/Index.test.tsx`

---

## Structure des fichiers créés/modifiés

| Fichier | Action |
|---|---|
| `app/frontend/components/AppShell.tsx` | Créer |
| `app/frontend/components/AppShell.test.tsx` | Créer |
| `app/frontend/pages/Backend/Dashboard/Home.tsx` | Modifier (ajouter layout) |
| `app/frontend/pages/Backend/Interventions/Index.tsx` | Modifier (ajouter layout) |
| `app/frontend/pages/Backend/Parcelles/Index.tsx` | Créer |
| `app/frontend/pages/Backend/Parcelles/Index.test.tsx` | Créer |
| `app/frontend/components/parcelles/ParcellesMap.tsx` | Créer |
| `app/frontend/components/parcelles/ParcellesTable.tsx` | Créer |
| `app/frontend/pages/Backend/Productions/Index.tsx` | Créer |
| `app/frontend/pages/Backend/Productions/Index.test.tsx` | Créer |
| `app/frontend/pages/Backend/Comptabilite/Index.tsx` | Créer |
| `app/frontend/pages/Backend/Comptabilite/Index.test.tsx` | Créer |
| `app/controllers/backend/cultivable_zones_controller.rb` | Modifier (ajouter index Inertia) |
| `app/controllers/backend/activity_productions_controller.rb` | Modifier (ajouter index Inertia) |
| `app/controllers/backend/journal_entries_controller.rb` | Modifier (ajouter index Inertia) |
| `app/controllers/backend/base_controller.rb` | Modifier (ajouter inertia_share) |

---

## Contraintes techniques

- **Ruby 2.6** : jamais de `filter_map`, `then`, ou `yield_self` dans les controllers Rails
- **TypeScript strict** : pas de `any`, pas de `as unknown`
- **CSS** : Tailwind + tokens CSS (`var(--color-bg)` etc.) — jamais de style inline dans les composants finaux (sauf AppShell wrapper)
- **Icônes** : Lucide React uniquement
- **Composants** : arrow functions, PAS de class components
