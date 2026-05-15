# Design Spec — Interventions Index (Module Priorité 2)

**Date** : 2026-05-15  
**Statut** : Approuvé  
**Session** : Interventions (parallèle au Dashboard)

---

## Contexte

Migration de la vue HAML `app/views/backend/interventions/index.html.haml` vers React 18 + Inertia.js v2. Le module Interventions est le deuxième module migré après le Dashboard.

### État du codebase au moment du design

- Stack installée par la session initiale : Inertia.js v2, Vite 5, React 18, TypeScript strict, Tailwind CSS, TanStack Query v5, Vitest
- Dashboard entièrement migré (référence de patterns)
- `pages/Interventions/types.ts` créé par une session parallèle — **à supprimer** (remplacé par `types/intervention.ts`)

---

## Périmètre

### IN (ce sprint)

- Table paginée avec tri par `started_at`
- 8 filtres + sélecteur de période (remplacement du `kujaku` HAML)
- Kanban 4 colonnes en lecture seule (counts par état)
- Map overlay GeoJSON des working_zones des interventions affichées
- Types TypeScript stricts (`types/intervention.ts`)
- Tests Vitest TDD (test avant composant)
- RSpec pour l'action `index` Inertia

### OUT (sprints suivants)

- Drag-and-drop Kanban
- Actions bulk edit/delete
- Vue show (détail intervention)
- Export PDF/CSV (conservé en HAML)

---

## Décisions d'architecture

| Décision | Choix | Raison |
|---|---|---|
| Data fetching | Inertia router visits | Réutilise `list_conditions` SQL, URL bookmarkable, cohérence avec Dashboard |
| Vues | Table + Kanban + Map (Option C) | Périmètre complet demandé |
| Map sur l'index | Zones des interventions affichées (cohérent avec filtres) | Cohérence filtre ↔ carte |
| CSS | Inline styles avec CSS custom properties | Cohérence avec le Dashboard existant |
| Types | `types/intervention.ts` | Cohérence avec `types/dashboard.ts` |
| Imports | Relatifs (pas `@/`) | Cohérence avec le Dashboard existant |
| Leaflet colors | Constantes miroir des tokens (pas CSS vars) | Leaflet ne supporte pas les CSS custom properties |
| Inertia page name | `'Backend/Interventions/Index'` | Cohérence avec `'Backend/Dashboard/Home'` |

---

## Section 1 — Couche Rails

### Modification du controller

Fichier : `app/controllers/backend/interventions_controller.rb`

Deux changements :
1. Ajouter `layout 'inertia', only: [:index]`
2. Définir `def index` explicitement (remplace l'action auto-générée par le DSL `list`)

```ruby
layout 'inertia', only: [:index]

def index
  conditions = list_conditions

  scope = Intervention
    .where(conditions)
    .includes(:activities, :targets, :participations, :receptions)
    .joins('LEFT OUTER JOIN interventions I ON interventions.id = I.request_intervention_id')
    .order(started_at: :desc)

  paginated = scope.page(params[:page]).per(25)

  kanban = {
    planned:     scope.where(nature: :request).count,
    in_progress: scope.where(nature: :record, state: :in_progress).count,
    done:        scope.where(nature: :record, state: :done).count,
    validated:   scope.where(nature: :record, state: :validated).count
  }

  zones = InterventionTarget
    .joins(:intervention)
    .where(intervention: paginated)
    .joins("JOIN products ON products.id = intervention_parameters.product_id")
    .select("intervention_parameters.intervention_id,
             ST_AsGeoJSON(intervention_parameters.working_zone) AS zone_geojson,
             products.name AS product_name")
    .filter_map do |t|
      next unless t.zone_geojson
      { type: 'Feature',
        geometry: JSON.parse(t.zone_geojson),
        properties: { intervention_id: t.intervention_id, name: t.product_name } }
    end

  render inertia: 'Backend/Interventions/Index', props: {
    interventions: paginated.as_json(
      only: %i[id procedure_name nature state started_at stopped_at],
      methods: %i[name human_activities_names human_target_names
                  human_working_duration human_working_zone_area]
    ),
    kanban: kanban,
    map_geojson: { type: 'FeatureCollection', features: zones },
    filters: params.permit(:q, :state, :nature, :cultivable_zone_id,
                           :procedure_name_id, :activity_id, :target_id,
                           :label_id, :worker_id, :equipment_id,
                           :period, :period_interval).to_h,
    meta: {
      total:    scope.count,
      page:     (params[:page] || 1).to_i,
      per_page: 25,
      procedures: Intervention.used_procedures
                    .map { |p| { label: p.human_name, value: p.name.to_s } }
                    .sort_by { |p| p[:label] }
    }
  }
end
```

### Props shape (contrat Rails → React)

```typescript
interface InterventionIndexProps {
  interventions: Intervention[]
  kanban: { planned: number; in_progress: number; done: number; validated: number }
  map_geojson: GeoJSON.FeatureCollection
  filters: InterventionFilters
  meta: {
    total: number
    page: number
    per_page: number
    procedures: Array<{ label: string; value: string }>
  }
}
```

---

## Section 2 — Structure React

### Arbre de fichiers

```
app/frontend/
├── pages/
│   └── Backend/
│       └── Interventions/
│           └── Index.tsx                    ← shell Inertia (léger)
├── components/
│   └── interventions/
│       ├── InterventionFilterPanel.tsx
│       ├── InterventionFilterPanel.test.tsx
│       ├── InterventionTable.tsx
│       ├── InterventionTable.test.tsx
│       ├── InterventionKanban.tsx
│       ├── InterventionKanban.test.tsx
│       ├── InterventionMap.tsx
│       └── InterventionMap.test.tsx
├── hooks/
│   └── useInterventionFilters.ts
└── types/
    └── intervention.ts                      ← remplace pages/Interventions/types.ts
```

**Supprimer** : `app/frontend/pages/Interventions/types.ts`

### Page shell `Index.tsx`

```tsx
import { useState } from 'react'
import { InterventionFilterPanel } from '../../../components/interventions/InterventionFilterPanel'
import { InterventionTable }       from '../../../components/interventions/InterventionTable'
import { InterventionKanban }      from '../../../components/interventions/InterventionKanban'
import { InterventionMap }         from '../../../components/interventions/InterventionMap'
import { useInterventionFilters }  from '../../../hooks/useInterventionFilters'
import type { InterventionIndexProps } from '../../../types/intervention'

type View = 'table' | 'kanban'

export default function InterventionsIndex({
  interventions, kanban, map_geojson, filters, meta
}: InterventionIndexProps) {
  const [view, setView]       = useState<View>('table')
  const [mapOpen, setMapOpen] = useState(false)
  const { applyFilters }      = useInterventionFilters(filters)

  return (
    <div style={{ background: 'var(--color-bg)', minHeight: '100vh', padding: '24px' }}>
      <InterventionFilterPanel filters={filters} meta={meta} onChange={applyFilters} />

      <div style={{ display: 'flex', gap: '8px', margin: '16px 0' }}>
        <button onClick={() => setView('table')}>Liste</button>
        <button onClick={() => setView('kanban')}>Tableau</button>
        <button onClick={() => setMapOpen(v => !v)}>Carte</button>
      </div>

      {mapOpen && <InterventionMap geojson={map_geojson} />}

      {view === 'table'  && <InterventionTable  rows={interventions} meta={meta} onPage={applyFilters} />}
      {view === 'kanban' && <InterventionKanban counts={kanban} />}
    </div>
  )
}
```

### Hook `useInterventionFilters.ts`

Point unique d'appel à `router.visit` :

```typescript
import { router } from '@inertiajs/react'
import type { InterventionFilters } from '../types/intervention'

export function useInterventionFilters(current: InterventionFilters) {
  const applyFilters = (patch: Partial<InterventionFilters>) => {
    router.visit(window.location.pathname, {
      method: 'get',
      data: { ...current, ...patch },
      preserveState: true,
      preserveScroll: true,
      replace: true,
    })
  }
  return { applyFilters }
}
```

---

## Section 3 — Composants

### `types/intervention.ts`

```typescript
export type InterventionState  = 'in_progress' | 'done' | 'validated' | 'rejected'
export type InterventionNature = 'request' | 'record'

export interface Intervention {
  id: number
  procedure_name: string
  nature: InterventionNature
  state: InterventionState
  started_at: string
  stopped_at: string | null
  name: string
  human_activities_names: string
  human_target_names: string
  human_working_duration: string
  human_working_zone_area: string
}

export interface InterventionFilters {
  q?: string
  state?: string[]
  nature?: string[]
  cultivable_zone_id?: string
  procedure_name_id?: string[]
  activity_id?: string
  target_id?: string
  label_id?: string
  worker_id?: string
  equipment_id?: string
  period?: string
  period_interval?: 'day' | 'week' | 'month' | 'year'
}

export interface InterventionIndexProps {
  interventions: Intervention[]
  kanban: { planned: number; in_progress: number; done: number; validated: number }
  map_geojson: GeoJSON.FeatureCollection
  filters: InterventionFilters
  meta: {
    total: number
    page: number
    per_page: number
    procedures: Array<{ label: string; value: string }>
  }
}
```

### `InterventionFilterPanel`

Props :
```typescript
interface InterventionFilterPanelProps {
  filters: InterventionFilters
  meta: { procedures: Array<{ label: string; value: string }> }
  onChange: (patch: Partial<InterventionFilters>) => void
}
```

8 filtres en 2 rangées + bouton "Réinitialiser". Debounce 300ms sur le champ texte.

### `InterventionTable`

Props :
```typescript
interface InterventionTableProps {
  rows: Intervention[]
  meta: { total: number; page: number; per_page: number }
  onPage: (patch: { page: number }) => void
}
```

Colonnes : `name` (lien show), `human_activities_names`, `started_at`, `human_working_duration`, `state` (badge coloré), `human_target_names`, `human_working_zone_area`.  
Pagination : boutons Précédent / Suivant → `onPage({ page: n })`.

### `InterventionKanban`

Props :
```typescript
interface InterventionKanbanProps {
  counts: { planned: number; in_progress: number; done: number; validated: number }
}
```

4 colonnes en lecture seule. Chaque bouton "voir" applique un filtre via `onChange`.  
Drag-and-drop hors périmètre.

### `InterventionMap`

Props :
```typescript
interface InterventionMapProps {
  geojson: GeoJSON.FeatureCollection
}
```

Pattern `ParcellesMap` du Dashboard :
- `MapContainer` + `TileLayer` OSM
- Centre par défaut : `[14.5, -14.5]` (Sénégal)
- `LAYER_STYLE` : constantes miroir des tokens (pas de CSS vars — non supporté par Leaflet)
- `parseGeoJSON` : helper safe JSON.parse
- Hauteur `256px` (overlay compact)
- `Popup` au clic : nom de l'intervention

---

## Section 4 — Tests et gestion d'erreurs

### Stratégie TDD

Ordre strict :
1. `types/intervention.ts` (pas de test)
2. `InterventionFilterPanel.test.tsx` → `InterventionFilterPanel.tsx`
3. `InterventionTable.test.tsx` → `InterventionTable.tsx`
4. `InterventionKanban.test.tsx` → `InterventionKanban.tsx`
5. `InterventionMap.test.tsx` → `InterventionMap.tsx`
6. `pages/Backend/Interventions/Index.test.tsx` → `Index.tsx`
7. `spec/controllers/backend/interventions_controller_spec.rb` → `def index`

Tests en français, même pattern que Dashboard.

### Gestion d'erreurs

| Cas | Comportement |
|---|---|
| Feature GeoJSON avec geometry nulle | `parseGeoJSON` retourne `null` → skip silencieux |
| `interventions` tableau vide | Table affiche "Aucune intervention" |
| Filtre sans résultat | Kanban à 0, table et carte vides |
| `working_zone` absente sur une target | Filtrée côté Rails via `filter_map` |

---

## Vérifications de succès

- [ ] `yarn tsc --noEmit` sans erreur après chaque fichier TS
- [ ] `yarn vitest run` : tous les tests verts
- [ ] `bundle exec rspec spec/controllers/backend/interventions_controller_spec.rb`
- [ ] Page `/backend/interventions` s'affiche sans erreur JS
- [ ] Changement de filtre → URL mise à jour + table rechargée
- [ ] Aucune régression sur les vues HAML existantes
