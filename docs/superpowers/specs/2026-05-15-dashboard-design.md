# SenagrOS — Dashboard Home : Design Spec

**Date :** 2026-05-15  
**Module :** Dashboard (`/backend` → `DashboardsController#home`)  
**Priorité :** 1 (premier module migré)  
**Statut :** Validé

---

## Contexte

SenagrOS est un fork d'Ekylibre (Rails 5.2 + Webpacker 4 + HAML/CoffeeScript/SCSS) en cours de migration frontend vers React 18 + TypeScript via Inertia.js v2.

La vue actuelle `app/views/backend/dashboards/home.html.haml` utilise le système `beehive` d'Ekylibre avec deux cellules : `:parts` (navigation modules) et `:weather`. Cette spec couvre son remplacement par une page React, et la mise en place de toute l'infrastructure nécessaire.

---

## Scope

Cette session couvre **deux livrables** :

1. **Infrastructure** — Installation et configuration de Vite-ruby + Inertia-rails en parallèle de Webpacker (sans toucher au legacy)
2. **Dashboard Home** — Migration de `home.html.haml` vers une page React avec 4 KPI cards, mini-carte Leaflet, fil d'activité et widget météo

**Hors scope :**
- Dashboard configurable (`show.html.haml`) — itération suivante
- Autres dashboards thématiques (`production.html.haml`, `accountancy.html.haml`, etc.)
- Migration des pages Parcelles / Interventions (sessions dédiées)

---

## Décisions d'architecture

### Infrastructure : Vite en parallèle de Webpacker

**Choix :** `vite_ruby` + `inertia_rails` ajoutés sans toucher à Webpacker.

**Pourquoi :** Webpacker 4 sert encore le JS legacy (`land_parcels.ts`, `product_nature_variants.js`, packs CoffeeScript). Remplacer Webpacker globalement en Phase 1 représente un risque de régression inacceptable. La cohabitation est documentée et supportée par `vite_ruby`.

**Isolation :** Le layout `application.html.haml` et `javascript_pack_tag` restent intacts. Un nouveau layout `inertia.html.haml` est créé, chargé uniquement par les actions qui appelleront `render inertia:`. Le controller `Backend::BaseController` reçoit un `layout` conditionnel.

### Géométries PostGIS

Les géométries des parcelles passent via `st_asgeojson()` dans la query SQL — jamais via la sérialisation RGeo. Cela évite les conversions WKB → Ruby → JSON coûteuses et garantit un GeoJSON valide.

### Météo

`OpenWeatherMapClient` existant est appelé depuis un **job Sidekiq** (déjà présent dans l'app) et mis en cache Redis 30 min. Le controller lit le cache — si absent, retourne `nil` et le widget affiche "Météo indisponible" sans bloquer le rendu de la page.

---

## Contenu du Dashboard

Le dashboard home (`GET /backend`) affiche :

| Widget | Contenu |
|---|---|
| KPI 1 | Campagne en cours (nom + dates) |
| KPI 2 | Surfaces cultivées (ha) |
| KPI 3 | Interventions actives / planifiées |
| KPI 4 | Météo actuelle (température, icône) |
| Carte | Mini-carte Leaflet des parcelles (GeoJSON) |
| Activité | 5 dernières interventions (nom, état, date) |
| Météo | Widget complet : temp + description + forecast 5 jours |

---

## Rails : Props Inertia

```ruby
# app/controllers/backend/dashboards_controller.rb
def home
  render inertia: 'Backend/Dashboard/Home', props: {
    kpis: {
      campaign:      current_campaign&.as_json(only: %i[name started_on stopped_on]),
      area_ha:       CultivableZone.sum("ST_Area(shape::geography) / 10000.0").round(2),
      interventions: {
        active:    Intervention.of_campaign(current_campaign).in_progress.count,
        scheduled: Intervention.of_campaign(current_campaign).planned.count
      },
      expenses_xof: nil  # Phase 2 — FinancialYear intégration
    },
    parcelles: CultivableZone
      .select("id, name, ST_Area(shape::geography) / 10000.0 AS area_ha, ST_AsGeoJSON(shape) AS geojson")
      .as_json(only: %i[id name area_ha geojson]),
    recent_activity: Intervention
      .order(started_at: :desc)
      .limit(5)
      .as_json(only: %i[id name state started_at]),
    weather: Rails.cache.read('dashboard:weather'),
    farm: {
      name:     Entity.of_company.full_name,
      locale:   I18n.locale,
      timezone: Time.zone.name
    }
  }
end
```

**Règles props :**
- `as_json(only: [...])` partout — jamais `.to_json` brut
- `weather` peut être `nil` — le composant React gère ce cas

---

## Composants React

### Structure de fichiers

```
app/frontend/
├── app.tsx                          # Entry point InertiaApp + QueryClient
├── styles/
│   └── tokens.css                   # Design tokens SenagrOS
├── pages/
│   └── Backend/
│       └── Dashboard/
│           └── Home.tsx             # Page orchestratrice
└── components/
    ├── dashboard/
    │   ├── KpiCard.tsx
    │   ├── WeatherWidget.tsx
    │   ├── ParcellesMap.tsx
    │   └── ActivityFeed.tsx
    └── ui/                          # shadcn/ui components
```

### Architecture : Flat

`Home.tsx` orchestre directement les 4 widgets sans composants intermédiaires de section. Chaque widget est autonome, reçoit ses données en props, gère son propre état loading/error.

### Contrats de types

```typescript
// Types partagés — app/frontend/types/dashboard.ts

interface Campaign {
  name: string
  started_on: string
  stopped_on: string | null
}

interface KpiData {
  campaign: Campaign | null
  area_ha: number
  interventions: { active: number; scheduled: number }
  expenses_xof: number | null
}

interface Parcelle {
  id: number
  name: string
  area_ha: number
  geojson: string  // GeoJSON string — parser côté React
}

interface RecentIntervention {
  id: number
  name: string
  state: 'in_progress' | 'done' | 'planned'
  started_at: string
}

interface WeatherData {
  temperature: number
  description: string
  icon: string
  forecast: Array<{ day: string; temp_max: number; temp_min: number; icon: string }>
}

interface DashboardHomeProps {
  kpis: KpiData
  parcelles: Parcelle[]
  recent_activity: RecentIntervention[]
  weather: WeatherData | null
  farm: { name: string; locale: string; timezone: string }
}
```

### Comportement des widgets

**KpiCard :**
- Valeur `null` → affiche `—` (em dash), jamais NaN
- Props : `title`, `value`, `unit`, `icon` (Lucide)

**WeatherWidget :**
- `weather === null` → "Météo indisponible" (pas de crash)
- Forecast 5 jours en ligne horizontale

**ParcellesMap :**
- Zéro parcelles → placeholder "Aucune parcelle" + lien `/backend/cultivable_zones/new`
- `react-leaflet` v4, tiles OpenStreetMap (gratuit, pas de clé API)
- Parse `geojson` string → objet avec `JSON.parse()` dans le composant

**ActivityFeed :**
- Liste vide → "Aucune intervention récente"
- Badge de couleur par `state` : `in_progress` = ambre, `done` = vert, `planned` = gris

---

## Design tokens utilisés

```css
--color-primary:       #1B6B3A;  /* vert savane — KPI campagne */
--color-primary-light: #4CAF72;  /* feuillage — done badges */
--color-accent:        #E8A020;  /* ambre baobab — in_progress badges */
--color-bg:            #F7F3EE;  /* sable clair — fond page */
--color-bg-card:       #FFFFFF;  /* cartes */
--color-text:          #2C2416;  /* terre sombre */
--color-text-muted:    #6B5E4E;
--color-border:        #E2D9CE;
--color-danger:        #D4420A;  /* erreurs */
--font-ui:             'Plus Jakarta Sans', sans-serif;
--font-heading:        'Playfair Display', serif;
```

---

## Tests

### Frontend — Vitest + React Testing Library

| Fichier | Cas testés |
|---|---|
| `KpiCard.test.tsx` | Props valides, valeur null → `—`, unité manquante |
| `WeatherWidget.test.tsx` | Rendu normal, `weather=null` → message fallback |
| `ActivityFeed.test.tsx` | Liste vide, 5 items, badge par state |
| `ParcellesMap.test.tsx` | Mock react-leaflet, GeoJSON layers passés, zero parcelles → placeholder |

**Règle :** écrire le test **avant** le composant (TDD).

### Rails — RSpec

```ruby
# spec/controllers/backend/dashboards_controller_spec.rb
describe 'GET #home' do
  it 'returns 200 with Inertia component and expected props keys'
  it 'includes kpis, parcelles, recent_activity, weather, farm in props'
  it 'handles nil weather cache gracefully'
end
```

---

## Critères de succès (Definition of Done)

- [ ] `yarn tsc --noEmit` → 0 erreur
- [ ] `yarn vitest run` → tous les tests verts
- [ ] `bundle exec rspec spec/controllers/backend/dashboards_controller_spec.rb` → vert
- [ ] `GET /backend` affiche la page React (pas le HAML) — screenshot comparé fonctionnellement
- [ ] Aucune régression : les autres pages HAML (Parcelles, Interventions, etc.) s'affichent normalement
- [ ] Webpacker toujours fonctionnel : `yarn webpack --env production` passe sans erreur
- [ ] `bundle exec rubocop app/controllers/backend/dashboards_controller.rb` → 0 offense
- [ ] `yarn eslint app/frontend/` → 0 warning bloquant

---

## Branche Git

```
feat/dashboard-inertia-react
```

Un commit par tâche, format Conventional Commits (`feat:`, `chore:`, `test:`).
