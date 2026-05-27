# Interventions — Table filtrée + Overlay carte

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrer la page `/backend/interventions` (liste + filtres + carte des zones cibles) vers React 18 + Inertia.js v2, en remplaçant le couple HAML/list-DSL d'Ekylibre par une page React avec TanStack Table v8, un panneau de filtres côté serveur, et un overlay Leaflet affichant les `working_zone` PostGIS des cibles.

**Architecture:** Le controller Rails construit les données filtrées et les sérialise en props Inertia (JSON strict via `as_json`). Un second endpoint `GET /backend/interventions/targets_geojson` retourne une FeatureCollection pour la carte, chargée à la demande par TanStack Query. Les filtres vivent dans les query params URL (via `router.get` d'Inertia) — aucun état client côté serveur.

**Tech Stack:** Ruby on Rails 5.2 (Rails 6 prévu plus tard), Kaminari (pagination), inertia-rails ~> 2.0 (v3 quand Rails sera upgradé), React 18, TypeScript strict, @tanstack/react-table v8, @tanstack/react-query v5, react-leaflet v4, Tailwind CSS, Vitest + @testing-library/react, RSpec + FactoryBot.

---

## Prérequis — Infrastructure (à faire si la migration Dashboard n'est pas encore faite)

Si les éléments suivants ne sont **pas** en place, exécuter les commandes ci-dessous avant toute autre tâche.

**Vérification rapide :**
```bash
grep "inertia_rails" Gemfile           # doit retourner une ligne
grep "@inertiajs/react" package.json   # doit retourner une ligne
ls app/frontend/app.tsx                # doit exister
ls spec/rails_helper.rb                # doit exister
```

**Si manquants — setup infrastructure :**

> ⚠️ Rails 5.2.8.1 détecté (Ruby 2.6.10). Utiliser `inertia_rails ~> 2.0` (compatible Rails 5.2).
> `inertia_rails ~> 3.0` requiert Rails 6+. Upgrade Rails = sprint séparé.

```ruby
# Gemfile — ajouter
gem 'inertia_rails', '~> 2.0'   # compatible Rails 5.2
gem 'vite_ruby', '~> 3.5'

group :development, :test do
  gem 'rspec-rails', '~> 6.1'
  gem 'factory_bot_rails', '~> 6.4'
end
```

```bash
bundle install
bundle exec rails generate rspec:install
bundle exec vite install
```

```bash
# SDK JS compatible inertia_rails v2 (ancien SDK Inertia v0.11)
yarn add @inertiajs/inertia @inertiajs/inertia-react @inertiajs/progress
yarn add react react-dom
yarn add @tanstack/react-table @tanstack/react-query zustand
yarn add react-leaflet leaflet geojson
yarn add -D @types/react @types/react-dom @types/leaflet
yarn add -D vitest @vitejs/plugin-react @testing-library/react @testing-library/jest-dom jsdom
```

```tsx
// app/frontend/app.tsx  — bootstrap pour inertia_rails v2
import { createInertiaApp } from '@inertiajs/inertia-react'
import { InertiaProgress } from '@inertiajs/progress'
import { render } from 'react-dom'

createInertiaApp({
  resolve: name => {
    const pages = import.meta.glob('./pages/**/*.tsx', { eager: true })
    return pages[`./pages/${name}.tsx`] as never
  },
  setup({ el, App, props }) {
    render(<App {...props} />, el)
  },
})
InertiaProgress.init()
```

```ruby
# config/initializers/inertia_rails.rb
InertiaRails.configure do |config|
  config.layout = 'application'
end
```

```haml
-# app/views/layouts/application.html.haml — ajouter dans <head>
= vite_client_tag
= vite_javascript_tag 'app'
```

---

## Fichiers impliqués

| Fichier | Action |
|---|---|
| `app/controllers/backend/interventions_controller.rb` | Modifier — override `def index`, ajouter `def targets_geojson`, `def serialize_interventions`, `def build_filter_conditions`, `def current_filters` |
| `config/routes.rb` | Modifier — ajouter `get :targets_geojson` dans la collection `:interventions` |
| `app/frontend/pages/Interventions/types.ts` | Créer — tous les types TypeScript du module |
| `app/frontend/pages/Interventions/Index.tsx` | Créer — page principale (assemblage) |
| `app/frontend/pages/Interventions/InterventionFilters.tsx` | Créer — panneau filtres |
| `app/frontend/pages/Interventions/InterventionTable.tsx` | Créer — table TanStack |
| `app/frontend/pages/Interventions/InterventionMap.tsx` | Créer — overlay Leaflet |
| `app/frontend/pages/Interventions/useInterventionMap.ts` | Créer — hook TanStack Query pour le GeoJSON |
| `spec/controllers/backend/interventions_controller_spec.rb` | Créer — tests RSpec du controller |
| `app/frontend/pages/Interventions/__tests__/InterventionTable.test.tsx` | Créer |
| `app/frontend/pages/Interventions/__tests__/InterventionFilters.test.tsx` | Créer |

---

## Task 1 : Types TypeScript

**Files:**
- Create: `app/frontend/pages/Interventions/types.ts`

- [ ] **Step 1 : Créer le fichier de types**

```typescript
// app/frontend/pages/Interventions/types.ts

export type InterventionState = 'in_progress' | 'done' | 'validated' | 'rejected'
export type InterventionNature = 'request' | 'record'

export interface Activity {
  id: number
  name: string
}

export interface Intervention {
  id: number
  number: string
  procedure_name: string
  /** Libellé humain de la procédure (ex: "Semis", "Traitement") */
  procedure_label: string
  state: InterventionState
  nature: InterventionNature
  /** ISO 8601 */
  started_at: string
  /** ISO 8601 */
  stopped_at: string
  /** Durée de travail en secondes */
  working_duration: number
  activities: Activity[]
  /** Noms des cibles, pré-formatés côté Rails */
  human_target_names: string
}

export interface InterventionFilters {
  q?: string
  state?: InterventionState[]
  nature?: InterventionNature
  activity_id?: string
  started_at_from?: string
  started_at_to?: string
  page?: number
}

export interface PaginationMeta {
  total_count: number
  current_page: number
  total_pages: number
  per_page: number
}

export interface InterventionsPageProps {
  interventions: Intervention[]
  meta: PaginationMeta
  filters: InterventionFilters
  activities: Activity[]
}
```

- [ ] **Step 2 : Vérifier TypeScript**

```bash
yarn tsc --noEmit
```

Expected: 0 erreurs.

- [ ] **Step 3 : Commit**

```bash
git add app/frontend/pages/Interventions/types.ts
git commit -m "feat(interventions): add TypeScript types for Interventions module"
```

---

## Task 2 : Controller — action `index` avec rendu Inertia (TDD)

**Files:**
- Create: `spec/controllers/backend/interventions_controller_spec.rb`
- Modify: `app/controllers/backend/interventions_controller.rb`

### 2a — Écrire les tests RSpec (failing first)

- [ ] **Step 1 : Créer le spec**

```ruby
# spec/controllers/backend/interventions_controller_spec.rb
require 'rails_helper'

RSpec.describe Backend::InterventionsController, type: :controller do
  let(:user) { create(:user) }

  before { sign_in user }

  describe 'GET #index' do
    let!(:intervention_done)    { create(:intervention, state: :done) }
    let!(:intervention_request) { create(:intervention, :request) }
    let!(:intervention_rejected){ create(:intervention, state: :rejected) }

    context 'avec une requête Inertia (X-Inertia header)' do
      before { request.headers['X-Inertia'] = 'true' }

      it 'répond 200 et retourne du JSON Inertia' do
        get :index
        expect(response).to have_http_status(:ok)
        expect(response.content_type).to include('application/json')
      end

      it 'inclut le composant Interventions/Index dans la réponse' do
        get :index
        body = JSON.parse(response.body)
        expect(body['component']).to eq('Interventions/Index')
      end

      it 'expose les interventions non-rejetées dans les props' do
        get :index
        props = JSON.parse(response.body)['props']
        ids = props['interventions'].map { |i| i['id'] }
        expect(ids).to include(intervention_done.id)
        expect(ids).to include(intervention_request.id)
        expect(ids).not_to include(intervention_rejected.id)
      end

      it 'filtre par state quand params[:state] est fourni' do
        get :index, params: { state: ['done'] }
        props = JSON.parse(response.body)['props']
        states = props['interventions'].map { |i| i['state'] }.uniq
        expect(states).to eq(['done'])
      end

      it 'filtre par activity_id quand params[:activity_id] est fourni' do
        activity = create(:activity)
        intervention_done.activities << activity
        get :index, params: { activity_id: activity.id }
        props = JSON.parse(response.body)['props']
        ids = props['interventions'].map { |i| i['id'] }
        expect(ids).to include(intervention_done.id)
      end

      it 'expose les clés meta de pagination' do
        get :index
        props = JSON.parse(response.body)['props']
        expect(props['meta'].keys).to include('total_count', 'current_page', 'total_pages', 'per_page')
      end

      it 'expose les filters actuels' do
        get :index, params: { q: 'test', state: ['done'] }
        props = JSON.parse(response.body)['props']
        expect(props['filters']['q']).to eq('test')
      end

      it 'expose la liste des activités disponibles' do
        create(:activity, name: 'Maïs')
        get :index
        props = JSON.parse(response.body)['props']
        expect(props['activities']).to be_an(Array)
        expect(props['activities'].first.keys).to include('id', 'name')
      end
    end

    context 'avec une requête HTML classique (sans Inertia)' do
      it 'répond 200' do
        get :index
        expect(response).to have_http_status(:ok)
      end
    end
  end
end
```

- [ ] **Step 2 : Lancer les tests et vérifier qu'ils échouent**

```bash
bundle exec rspec spec/controllers/backend/interventions_controller_spec.rb
```

Expected: 9 examples, 9 failures (NameError ou NoMethodError car `index` ne rend pas encore Inertia).

### 2b — Implémenter l'action `index`

- [ ] **Step 3 : Ajouter les méthodes privées et override `index` dans le controller**

Ouvrir `app/controllers/backend/interventions_controller.rb`. Juste avant la dernière ligne `end` de la classe (avant le `end` du `module Backend`), ajouter :

```ruby
    # === INERTIA MIGRATION — override du list DSL Ekylibre ===

    def index
      conditions = build_filter_conditions

      @interventions = Intervention
        .joins('LEFT OUTER JOIN interventions I ON interventions.id = I.request_intervention_id')
        .includes(:activities, :targets, :receptions)
        .where(conditions)
        .where.not(state: Intervention.state.rejected)
        .where(
          "(interventions.nature = 'request' AND I.request_intervention_id IS NULL) " \
          "OR interventions.nature = 'record'"
        )
        .order(started_at: :desc)
        .page(params[:page]).per(50)

      respond_to do |format|
        format.html do
          render inertia: 'Interventions/Index', props: {
            interventions: serialize_interventions(@interventions),
            meta: {
              total_count: @interventions.total_count,
              current_page: @interventions.current_page,
              total_pages: @interventions.total_pages,
              per_page: 50
            },
            filters: current_filters,
            activities: Activity.all.as_json(only: %i[id name])
          }
        end
      end
    end

    private

    def build_filter_conditions
      conditions = ['1=1']

      if params[:q].present?
        conditions[0] += ' AND (interventions.procedure_name ILIKE ? OR interventions.number ILIKE ?)'
        conditions << "%#{params[:q]}%"
        conditions << "%#{params[:q]}%"
      end

      if params[:state].present?
        conditions[0] += ' AND interventions.state IN (?)'
        conditions << Array(params[:state])
      end

      if params[:nature].present?
        conditions[0] += ' AND interventions.nature = ?'
        conditions << params[:nature]
      end

      if params[:activity_id].present?
        conditions[0] += ' AND interventions.id IN (SELECT intervention_id FROM activities_interventions WHERE activity_id = ?)'
        conditions << params[:activity_id].to_i
      end

      if params[:started_at_from].present?
        conditions[0] += ' AND interventions.started_at >= ?'
        conditions << params[:started_at_from].to_date.beginning_of_day
      end

      if params[:started_at_to].present?
        conditions[0] += ' AND interventions.started_at <= ?'
        conditions << params[:started_at_to].to_date.end_of_day
      end

      conditions
    end

    def current_filters
      params.permit(:q, :nature, :activity_id, :started_at_from, :started_at_to, :page, state: []).to_h
    end

    def serialize_interventions(interventions)
      interventions.map do |i|
        {
          id: i.id,
          number: i.number,
          procedure_name: i.procedure_name,
          procedure_label: i.procedure&.human_name || i.procedure_name.humanize,
          state: i.state,
          nature: i.nature,
          started_at: i.started_at&.iso8601,
          stopped_at: i.stopped_at&.iso8601,
          working_duration: i.working_duration,
          activities: i.activities.as_json(only: %i[id name]),
          human_target_names: i.targets.map { |t| t.product&.name }.compact.join(', ')
        }
      end
    end
```

**Important :** Supprimer le mot-clé `private` du bas du fichier s'il entre en conflit (ou placer `public` avant le `def index` override si nécessaire, selon la position dans le fichier).

- [ ] **Step 4 : Lancer les tests et vérifier qu'ils passent**

```bash
bundle exec rspec spec/controllers/backend/interventions_controller_spec.rb
```

Expected: 9 examples, 0 failures.

- [ ] **Step 5 : Commit**

```bash
git add app/controllers/backend/interventions_controller.rb \
        spec/controllers/backend/interventions_controller_spec.rb
git commit -m "feat(interventions): override index action with Inertia render and server-side filters"
```

---

## Task 3 : Controller — endpoint `targets_geojson` (TDD) + route

**Files:**
- Modify: `app/controllers/backend/interventions_controller.rb`
- Modify: `config/routes.rb`
- Modify (test): `spec/controllers/backend/interventions_controller_spec.rb`

### 3a — Tests GeoJSON (failing first)

- [ ] **Step 1 : Ajouter le describe GeoJSON dans le spec existant**

Dans `spec/controllers/backend/interventions_controller_spec.rb`, ajouter après le `describe 'GET #index'` :

```ruby
  describe 'GET #targets_geojson' do
    before { request.headers['Accept'] = 'application/json' }

    it 'répond 200' do
      get :targets_geojson
      expect(response).to have_http_status(:ok)
    end

    it 'retourne un GeoJSON FeatureCollection' do
      get :targets_geojson
      body = JSON.parse(response.body)
      expect(body['type']).to eq('FeatureCollection')
      expect(body['features']).to be_an(Array)
    end

    it 'filtre par started_at_from' do
      get :targets_geojson, params: { started_at_from: '2024-01-01' }
      expect(response).to have_http_status(:ok)
    end
  end
```

- [ ] **Step 2 : Lancer les tests — ils doivent échouer**

```bash
bundle exec rspec spec/controllers/backend/interventions_controller_spec.rb \
  --example "targets_geojson"
```

Expected: 3 failures (routing error — action n'existe pas encore).

### 3b — Ajouter la route

- [ ] **Step 3 : Ajouter `get :targets_geojson` dans les routes**

Dans `config/routes.rb`, trouver le bloc `collection do` sous `resources :interventions` (ligne ~785) et ajouter :

```ruby
        get :targets_geojson
```

Le bloc doit ressembler à :
```ruby
      collection do
        patch :compute
        get :modal
        get :targets_geojson   # ← ajouté
        # ... reste des routes existantes ...
      end
```

### 3c — Implémenter l'action

- [ ] **Step 4 : Ajouter `def targets_geojson` dans le controller**

Dans la section `private` (après `serialize_interventions`), ajouter **avant** le dernier `end` de la classe :

```ruby
    public

    def targets_geojson
      scope = InterventionParameter
        .where(type: 'InterventionTarget')
        .joins(:intervention)
        .where.not(working_zone: nil)

      if params[:started_at_from].present?
        scope = scope.where('interventions.started_at >= ?', params[:started_at_from].to_date.beginning_of_day)
      end

      if params[:started_at_to].present?
        scope = scope.where('interventions.started_at <= ?', params[:started_at_to].to_date.end_of_day)
      end

      features = scope
        .select(:id, :intervention_id, 'ST_AsGeoJSON(working_zone)::json AS geom_json')
        .map do |target|
          {
            type: 'Feature',
            geometry: target.geom_json,
            properties: { intervention_id: target.intervention_id }
          }
        end

      render json: { type: 'FeatureCollection', features: features }
    end

    private
```

- [ ] **Step 5 : Lancer les tests et vérifier qu'ils passent**

```bash
bundle exec rspec spec/controllers/backend/interventions_controller_spec.rb
```

Expected: 12 examples, 0 failures.

- [ ] **Step 6 : Commit**

```bash
git add app/controllers/backend/interventions_controller.rb config/routes.rb \
        spec/controllers/backend/interventions_controller_spec.rb
git commit -m "feat(interventions): add targets_geojson endpoint for Leaflet map overlay"
```

---

## Task 4 : Composant `InterventionFilters.tsx` (TDD)

**Files:**
- Create: `app/frontend/pages/Interventions/InterventionFilters.tsx`
- Create: `app/frontend/pages/Interventions/__tests__/InterventionFilters.test.tsx`

### 4a — Tests Vitest (failing first)

- [ ] **Step 1 : Créer le test**

```tsx
// app/frontend/pages/Interventions/__tests__/InterventionFilters.test.tsx
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { InterventionFilters } from '../InterventionFilters'
import type { Activity, InterventionFilters as Filters } from '../types'

const activities: Activity[] = [
  { id: 1, name: 'Maïs' },
  { id: 2, name: 'Mil' },
]

const emptyFilters: Filters = {}

describe('InterventionFilters', () => {
  it('affiche le champ de recherche', () => {
    render(
      <InterventionFilters
        filters={emptyFilters}
        activities={activities}
        onChange={vi.fn()}
      />
    )
    expect(screen.getByPlaceholderText(/rechercher/i)).toBeInTheDocument()
  })

  it('affiche les options de statut', () => {
    render(
      <InterventionFilters
        filters={emptyFilters}
        activities={activities}
        onChange={vi.fn()}
      />
    )
    expect(screen.getByText(/en cours/i)).toBeInTheDocument()
    expect(screen.getByText(/terminé/i)).toBeInTheDocument()
    expect(screen.getByText(/validé/i)).toBeInTheDocument()
  })

  it('affiche les activités dans le select', () => {
    render(
      <InterventionFilters
        filters={emptyFilters}
        activities={activities}
        onChange={vi.fn()}
      />
    )
    expect(screen.getByText('Maïs')).toBeInTheDocument()
    expect(screen.getByText('Mil')).toBeInTheDocument()
  })

  it('appelle onChange quand la recherche change', () => {
    const onChange = vi.fn()
    render(
      <InterventionFilters
        filters={emptyFilters}
        activities={activities}
        onChange={onChange}
      />
    )
    fireEvent.change(screen.getByPlaceholderText(/rechercher/i), {
      target: { value: 'semis' },
    })
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ q: 'semis' }))
  })

  it('affiche la valeur de filtre courante dans le champ recherche', () => {
    render(
      <InterventionFilters
        filters={{ q: 'traitement' }}
        activities={activities}
        onChange={vi.fn()}
      />
    )
    expect(screen.getByDisplayValue('traitement')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2 : Lancer — doit échouer**

```bash
yarn vitest run src/pages/Interventions/__tests__/InterventionFilters.test.tsx
```

Expected: Cannot find module `../InterventionFilters`.

### 4b — Implémenter le composant

- [ ] **Step 3 : Créer `InterventionFilters.tsx`**

```tsx
// app/frontend/pages/Interventions/InterventionFilters.tsx
import type { Activity, InterventionFilters as Filters, InterventionState } from './types'

const STATE_LABELS: Record<InterventionState, string> = {
  in_progress: 'En cours',
  done: 'Terminé',
  validated: 'Validé',
  rejected: 'Rejeté',
}

const VISIBLE_STATES: InterventionState[] = ['in_progress', 'done', 'validated']

interface InterventionFiltersProps {
  filters: Filters
  activities: Activity[]
  onChange: (filters: Filters) => void
}

export function InterventionFilters({ filters, activities, onChange }: InterventionFiltersProps) {
  const handleStateToggle = (state: InterventionState) => {
    const current = filters.state ?? []
    const next = current.includes(state)
      ? current.filter(s => s !== state)
      : [...current, state]
    onChange({ ...filters, state: next.length > 0 ? next : undefined })
  }

  return (
    <aside className="w-64 shrink-0 space-y-5 rounded-lg border border-stone-200 bg-white p-4">
      {/* Recherche texte */}
      <div className="space-y-1">
        <label className="text-xs font-medium uppercase tracking-wide text-stone-500">
          Recherche
        </label>
        <input
          type="text"
          placeholder="Rechercher une intervention…"
          value={filters.q ?? ''}
          onChange={e => onChange({ ...filters, q: e.target.value || undefined })}
          className="w-full rounded-md border border-stone-300 px-3 py-1.5 text-sm text-stone-800 placeholder-stone-400 focus:border-green-600 focus:outline-none focus:ring-1 focus:ring-green-600"
        />
      </div>

      {/* Filtres par état */}
      <div className="space-y-1">
        <p className="text-xs font-medium uppercase tracking-wide text-stone-500">État</p>
        <div className="space-y-1.5">
          {VISIBLE_STATES.map(state => (
            <label key={state} className="flex cursor-pointer items-center gap-2">
              <input
                type="checkbox"
                checked={filters.state?.includes(state) ?? false}
                onChange={() => handleStateToggle(state)}
                className="h-4 w-4 rounded border-stone-300 text-green-600 focus:ring-green-500"
              />
              <span className="text-sm text-stone-700">{STATE_LABELS[state]}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Activité */}
      <div className="space-y-1">
        <label className="text-xs font-medium uppercase tracking-wide text-stone-500">
          Activité
        </label>
        <select
          value={filters.activity_id ?? ''}
          onChange={e =>
            onChange({ ...filters, activity_id: e.target.value || undefined })
          }
          className="w-full rounded-md border border-stone-300 px-3 py-1.5 text-sm text-stone-800 focus:border-green-600 focus:outline-none focus:ring-1 focus:ring-green-600"
        >
          <option value="">Toutes les activités</option>
          {activities.map(a => (
            <option key={a.id} value={String(a.id)}>
              {a.name}
            </option>
          ))}
        </select>
      </div>

      {/* Plage de dates */}
      <div className="space-y-1">
        <p className="text-xs font-medium uppercase tracking-wide text-stone-500">Période</p>
        <div className="space-y-1.5">
          <input
            type="date"
            value={filters.started_at_from ?? ''}
            onChange={e =>
              onChange({ ...filters, started_at_from: e.target.value || undefined })
            }
            className="w-full rounded-md border border-stone-300 px-3 py-1.5 text-sm text-stone-800 focus:border-green-600 focus:outline-none focus:ring-1 focus:ring-green-600"
          />
          <input
            type="date"
            value={filters.started_at_to ?? ''}
            onChange={e =>
              onChange({ ...filters, started_at_to: e.target.value || undefined })
            }
            className="w-full rounded-md border border-stone-300 px-3 py-1.5 text-sm text-stone-800 focus:border-green-600 focus:outline-none focus:ring-1 focus:ring-green-600"
          />
        </div>
      </div>

      {/* Réinitialiser */}
      {Object.values(filters).some(Boolean) && (
        <button
          type="button"
          onClick={() => onChange({})}
          className="w-full rounded-md border border-stone-300 px-3 py-1.5 text-sm text-stone-600 hover:bg-stone-50"
        >
          Réinitialiser les filtres
        </button>
      )}
    </aside>
  )
}
```

- [ ] **Step 4 : Lancer les tests — doivent passer**

```bash
yarn vitest run app/frontend/pages/Interventions/__tests__/InterventionFilters.test.tsx
```

Expected: 5 tests, 0 failures.

- [ ] **Step 5 : TypeCheck**

```bash
yarn tsc --noEmit
```

Expected: 0 erreurs.

- [ ] **Step 6 : Commit**

```bash
git add app/frontend/pages/Interventions/InterventionFilters.tsx \
        app/frontend/pages/Interventions/__tests__/InterventionFilters.test.tsx
git commit -m "feat(interventions): add InterventionFilters sidebar component"
```

---

## Task 5 : Composant `InterventionTable.tsx` (TDD)

**Files:**
- Create: `app/frontend/pages/Interventions/InterventionTable.tsx`
- Create: `app/frontend/pages/Interventions/__tests__/InterventionTable.test.tsx`

### 5a — Tests (failing first)

- [ ] **Step 1 : Créer le test**

```tsx
// app/frontend/pages/Interventions/__tests__/InterventionTable.test.tsx
import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { InterventionTable } from '../InterventionTable'
import type { Intervention } from '../types'

const mockInterventions: Intervention[] = [
  {
    id: 1,
    number: 'INT-001',
    procedure_name: 'sowing',
    procedure_label: 'Semis',
    state: 'done',
    nature: 'record',
    started_at: '2024-03-15T08:00:00Z',
    stopped_at: '2024-03-15T10:00:00Z',
    working_duration: 7200,
    activities: [{ id: 1, name: 'Maïs' }],
    human_target_names: 'Parcelle A',
  },
  {
    id: 2,
    number: 'INT-002',
    procedure_name: 'harvesting',
    procedure_label: 'Récolte',
    state: 'in_progress',
    nature: 'record',
    started_at: '2024-04-10T06:00:00Z',
    stopped_at: '2024-04-10T14:00:00Z',
    working_duration: 28800,
    activities: [{ id: 1, name: 'Maïs' }],
    human_target_names: 'Parcelle B',
  },
]

describe('InterventionTable', () => {
  it('affiche les en-têtes de colonnes', () => {
    render(<InterventionTable interventions={mockInterventions} isLoading={false} />)
    expect(screen.getByText(/numéro/i)).toBeInTheDocument()
    expect(screen.getByText(/procédure/i)).toBeInTheDocument()
    expect(screen.getByText(/activités/i)).toBeInTheDocument()
    expect(screen.getByText(/durée/i)).toBeInTheDocument()
    expect(screen.getByText(/état/i)).toBeInTheDocument()
  })

  it('affiche les données des interventions', () => {
    render(<InterventionTable interventions={mockInterventions} isLoading={false} />)
    expect(screen.getByText('INT-001')).toBeInTheDocument()
    expect(screen.getByText('Semis')).toBeInTheDocument()
    expect(screen.getByText('Parcelle A')).toBeInTheDocument()
  })

  it('affiche un skeleton quand isLoading est true', () => {
    render(<InterventionTable interventions={[]} isLoading={true} />)
    expect(screen.getByRole('status')).toBeInTheDocument()
  })

  it('affiche le badge de statut coloré', () => {
    render(<InterventionTable interventions={mockInterventions} isLoading={false} />)
    expect(screen.getByText('Terminé')).toBeInTheDocument()
    expect(screen.getByText('En cours')).toBeInTheDocument()
  })

  it('formate la durée en heures', () => {
    render(<InterventionTable interventions={mockInterventions} isLoading={false} />)
    expect(screen.getByText('2 h')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2 : Lancer — doit échouer**

```bash
yarn vitest run app/frontend/pages/Interventions/__tests__/InterventionTable.test.tsx
```

Expected: Cannot find module `../InterventionTable`.

### 5b — Implémenter

- [ ] **Step 3 : Créer `InterventionTable.tsx`**

```tsx
// app/frontend/pages/Interventions/InterventionTable.tsx
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
} from '@tanstack/react-table'
import { useState } from 'react'
import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react'
import type { Intervention, InterventionState } from './types'

const STATE_LABELS: Record<InterventionState, string> = {
  in_progress: 'En cours',
  done: 'Terminé',
  validated: 'Validé',
  rejected: 'Rejeté',
}

const STATE_COLORS: Record<InterventionState, string> = {
  in_progress: 'bg-blue-100 text-blue-800',
  done: 'bg-stone-100 text-stone-700',
  validated: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-700',
}

function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  if (minutes === 0) return `${hours} h`
  return `${hours} h ${minutes} min`
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('fr-SN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

function TableSkeleton({ columns }: { columns: number }) {
  return (
    <div role="status" className="animate-pulse space-y-2 p-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex gap-4">
          {Array.from({ length: columns }).map((_, j) => (
            <div key={j} className="h-4 flex-1 rounded bg-stone-200" />
          ))}
        </div>
      ))}
    </div>
  )
}

interface InterventionTableProps {
  interventions: Intervention[]
  isLoading: boolean
}

export function InterventionTable({ interventions, isLoading }: InterventionTableProps) {
  const [sorting, setSorting] = useState<SortingState>([])

  const columns: ColumnDef<Intervention>[] = [
    {
      id: 'number',
      header: 'Numéro',
      accessorKey: 'number',
      cell: ({ row }) => (
        <a
          href={`/backend/interventions/${row.original.id}`}
          className="font-medium text-green-700 hover:underline"
        >
          {row.original.number}
        </a>
      ),
    },
    {
      id: 'procedure_label',
      header: 'Procédure',
      accessorKey: 'procedure_label',
    },
    {
      id: 'activities',
      header: 'Activités',
      accessorFn: row => row.activities.map(a => a.name).join(', '),
    },
    {
      id: 'started_at',
      header: 'Date',
      accessorKey: 'started_at',
      cell: ({ getValue }) => formatDate(getValue() as string),
    },
    {
      id: 'working_duration',
      header: 'Durée',
      accessorKey: 'working_duration',
      cell: ({ getValue }) => formatDuration(getValue() as number),
    },
    {
      id: 'human_target_names',
      header: 'Cibles',
      accessorKey: 'human_target_names',
    },
    {
      id: 'state',
      header: 'État',
      accessorKey: 'state',
      cell: ({ getValue }) => {
        const state = getValue() as InterventionState
        return (
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATE_COLORS[state]}`}
          >
            {STATE_LABELS[state]}
          </span>
        )
      },
    },
  ]

  const table = useReactTable({
    data: interventions,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  })

  if (isLoading) return <TableSkeleton columns={columns.length} />

  return (
    <div className="overflow-hidden rounded-lg border border-stone-200 bg-white">
      <table className="w-full text-sm">
        <thead className="border-b border-stone-200 bg-stone-50">
          {table.getHeaderGroups().map(hg => (
            <tr key={hg.id}>
              {hg.headers.map(header => (
                <th
                  key={header.id}
                  className="px-4 py-3 text-left font-medium text-stone-600"
                  onClick={header.column.getToggleSortingHandler()}
                >
                  <span className="flex cursor-pointer items-center gap-1 select-none">
                    {flexRender(header.column.columnDef.header, header.getContext())}
                    {header.column.getIsSorted() === 'asc' ? (
                      <ChevronUp className="h-3 w-3" />
                    ) : header.column.getIsSorted() === 'desc' ? (
                      <ChevronDown className="h-3 w-3" />
                    ) : (
                      <ChevronsUpDown className="h-3 w-3 text-stone-400" />
                    )}
                  </span>
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody className="divide-y divide-stone-100">
          {table.getRowModel().rows.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className="px-4 py-12 text-center text-stone-400"
              >
                Aucune intervention trouvée.
              </td>
            </tr>
          ) : (
            table.getRowModel().rows.map(row => (
              <tr key={row.id} className="transition-colors duration-100 hover:bg-stone-50">
                {row.getVisibleCells().map(cell => (
                  <td key={cell.id} className="px-4 py-3 text-stone-800">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}
```

- [ ] **Step 4 : Lancer les tests — doivent passer**

```bash
yarn vitest run app/frontend/pages/Interventions/__tests__/InterventionTable.test.tsx
```

Expected: 5 tests, 0 failures.

- [ ] **Step 5 : TypeCheck**

```bash
yarn tsc --noEmit
```

Expected: 0 erreurs.

- [ ] **Step 6 : Commit**

```bash
git add app/frontend/pages/Interventions/InterventionTable.tsx \
        app/frontend/pages/Interventions/__tests__/InterventionTable.test.tsx
git commit -m "feat(interventions): add InterventionTable component with TanStack Table v8"
```

---

## Task 6 : Hook `useInterventionMap` + Composant `InterventionMap.tsx`

**Files:**
- Create: `app/frontend/pages/Interventions/useInterventionMap.ts`
- Create: `app/frontend/pages/Interventions/InterventionMap.tsx`

> **Note sur Leaflet + SSR :** `MapContainer` n'est pas compatible SSR. Si Vite fait du SSR, wrapper dans un `dynamic()` ou un `useEffect`. Dans ce projet (CSR pur), l'import direct est suffisant.

- [ ] **Step 1 : Créer le hook TanStack Query**

```typescript
// app/frontend/pages/Interventions/useInterventionMap.ts
import { useQuery } from '@tanstack/react-query'
import type { FeatureCollection } from 'geojson'
import type { InterventionFilters } from './types'

async function fetchTargetsGeoJSON(filters: InterventionFilters): Promise<FeatureCollection> {
  const params = new URLSearchParams()
  if (filters.started_at_from) params.set('started_at_from', filters.started_at_from)
  if (filters.started_at_to) params.set('started_at_to', filters.started_at_to)

  const url = `/backend/interventions/targets_geojson?${params.toString()}`
  const response = await fetch(url, {
    headers: { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
  })

  if (!response.ok) throw new Error(`GeoJSON fetch failed: ${response.status}`)
  return response.json() as Promise<FeatureCollection>
}

export function useInterventionMap(filters: InterventionFilters, enabled: boolean) {
  return useQuery({
    queryKey: ['interventions', 'geojson', filters.started_at_from, filters.started_at_to],
    queryFn: () => fetchTargetsGeoJSON(filters),
    enabled,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}
```

- [ ] **Step 2 : Créer le composant `InterventionMap.tsx`**

```tsx
// app/frontend/pages/Interventions/InterventionMap.tsx
import { MapContainer, TileLayer, GeoJSON, useMap } from 'react-leaflet'
import type { FeatureCollection, Feature } from 'geojson'
import type { Layer } from 'leaflet'

/** Centre Sénégal par défaut */
const SENEGAL_CENTER: [number, number] = [14.4974, -14.4524]

function AutoFit({ data }: { data: FeatureCollection }) {
  const map = useMap()

  if (data.features.length > 0) {
    const { L } = window as typeof window & { L: typeof import('leaflet') }
    if (L) {
      const geoJsonLayer = L.geoJSON(data)
      const bounds = geoJsonLayer.getBounds()
      if (bounds.isValid()) map.fitBounds(bounds, { padding: [20, 20] })
    }
  }

  return null
}

interface InterventionMapProps {
  data: FeatureCollection | undefined
  isLoading: boolean
  height?: string
  onFeatureClick?: (feature: Feature) => void
}

export function InterventionMap({
  data,
  isLoading,
  height = '400px',
  onFeatureClick,
}: InterventionMapProps) {
  const emptyCollection: FeatureCollection = { type: 'FeatureCollection', features: [] }
  const geojson = data ?? emptyCollection

  return (
    <div className="relative overflow-hidden rounded-lg border border-stone-200" style={{ height }}>
      {isLoading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/60">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-green-600 border-t-transparent" />
        </div>
      )}
      <MapContainer
        center={SENEGAL_CENTER}
        zoom={7}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="© OpenStreetMap"
        />
        <GeoJSON
          key={JSON.stringify(geojson.features.length)}
          data={geojson}
          style={{ color: '#1B6B3A', weight: 2, fillOpacity: 0.3, fillColor: '#4CAF72' }}
          onEachFeature={(feature: Feature, layer: Layer) => {
            if (onFeatureClick) {
              layer.on('click', () => onFeatureClick(feature))
            }
          }}
        />
        {geojson.features.length > 0 && <AutoFit data={geojson} />}
      </MapContainer>
      {geojson.features.length === 0 && !isLoading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center">
          <p className="text-sm text-stone-400">
            Aucune zone cible à afficher pour cette période.
          </p>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 3 : TypeCheck**

```bash
yarn tsc --noEmit
```

Expected: 0 erreurs.

- [ ] **Step 4 : Commit**

```bash
git add app/frontend/pages/Interventions/useInterventionMap.ts \
        app/frontend/pages/Interventions/InterventionMap.tsx
git commit -m "feat(interventions): add InterventionMap component and useInterventionMap hook"
```

---

## Task 7 : Page `Interventions/Index.tsx` — assemblage final

**Files:**
- Create: `app/frontend/pages/Interventions/Index.tsx`

- [ ] **Step 1 : Créer la page principale**

```tsx
// app/frontend/pages/Interventions/Index.tsx
import { Inertia } from '@inertiajs/inertia'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'
import { LayoutList, Map } from 'lucide-react'
import { InterventionFilters } from './InterventionFilters'
import { InterventionTable } from './InterventionTable'
import { InterventionMap } from './InterventionMap'
import { useInterventionMap } from './useInterventionMap'
import type { InterventionsPageProps, InterventionFilters as Filters } from './types'

const queryClient = new QueryClient()

type ViewMode = 'table' | 'map'

function InterventionsContent({
  interventions,
  meta,
  filters,
  activities,
}: InterventionsPageProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('table')
  const mapQuery = useInterventionMap(filters, viewMode === 'map')

  const applyFilters = (newFilters: Filters) => {
    // Inertia navigate — Rails recharge la page avec les nouveaux params
    Inertia.get(
      '/backend/interventions',
      { ...newFilters, page: undefined } as Record<string, unknown>,
      { preserveState: true, preserveScroll: true, replace: true }
    )
  }

  const goToPage = (page: number) => {
    Inertia.get(
      '/backend/interventions',
      { ...filters, page } as Record<string, unknown>,
      { preserveState: true, preserveScroll: true }
    )
  }

  return (
    <div className="min-h-screen bg-stone-50 p-6">
      {/* En-tête */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-stone-900">Interventions</h1>
          <p className="mt-1 text-sm text-stone-500">
            {meta.total_count} intervention{meta.total_count > 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Toggle vue */}
          <div className="flex rounded-lg border border-stone-200 bg-white p-1">
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm transition-colors ${
                viewMode === 'table'
                  ? 'bg-green-600 text-white'
                  : 'text-stone-600 hover:bg-stone-50'
              }`}
            >
              <LayoutList className="h-4 w-4" />
              Liste
            </button>
            <button
              type="button"
              onClick={() => setViewMode('map')}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm transition-colors ${
                viewMode === 'map'
                  ? 'bg-green-600 text-white'
                  : 'text-stone-600 hover:bg-stone-50'
              }`}
            >
              <Map className="h-4 w-4" />
              Carte
            </button>
          </div>
          {/* Nouvelle intervention */}
          <a
            href="/backend/interventions/new"
            className="flex items-center gap-1.5 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
          >
            + Nouvelle intervention
          </a>
        </div>
      </div>

      {/* Contenu principal */}
      <div className="flex gap-5">
        <InterventionFilters
          filters={filters}
          activities={activities}
          onChange={applyFilters}
        />

        <div className="flex-1 space-y-4">
          {viewMode === 'table' ? (
            <>
              <InterventionTable
                interventions={interventions}
                isLoading={false}
              />
              {/* Pagination */}
              {meta.total_pages > 1 && (
                <div className="flex items-center justify-between text-sm text-stone-600">
                  <span>
                    Page {meta.current_page} / {meta.total_pages}
                  </span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      disabled={meta.current_page <= 1}
                      onClick={() => goToPage(meta.current_page - 1)}
                      className="rounded-md border border-stone-300 px-3 py-1.5 hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      ← Précédent
                    </button>
                    <button
                      type="button"
                      disabled={meta.current_page >= meta.total_pages}
                      onClick={() => goToPage(meta.current_page + 1)}
                      className="rounded-md border border-stone-300 px-3 py-1.5 hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Suivant →
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <InterventionMap
              data={mapQuery.data}
              isLoading={mapQuery.isLoading}
              height="600px"
            />
          )}
        </div>
      </div>
    </div>
  )
}

export default function Index(props: InterventionsPageProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <InterventionsContent {...props} />
    </QueryClientProvider>
  )
}
```

- [ ] **Step 2 : TypeCheck complet**

```bash
yarn tsc --noEmit
```

Expected: 0 erreurs.

- [ ] **Step 3 : ESLint**

```bash
yarn eslint app/frontend/pages/Interventions/ --fix
```

Expected: 0 erreurs après auto-fix.

- [ ] **Step 4 : Commit**

```bash
git add app/frontend/pages/Interventions/Index.tsx
git commit -m "feat(interventions): assemble Interventions/Index page with table, filters, and map overlay"
```

---

## Task 8 : Tests d'intégration Rails (smoke test)

**Files:**
- Modify: `spec/controllers/backend/interventions_controller_spec.rb`

- [ ] **Step 1 : Ajouter un test d'intégration end-to-end (serialisation complète)**

Ajouter dans le spec existant, dans le `describe 'GET #index'` / `context 'avec une requête Inertia'` :

```ruby
      it 'sérialise correctement tous les champs requis par le frontend' do
        intervention = create(:intervention, state: :done)
        get :index
        props = JSON.parse(response.body)['props']
        item = props['interventions'].find { |i| i['id'] == intervention.id }
        expect(item).to include(
          'id', 'number', 'procedure_name', 'procedure_label',
          'state', 'nature', 'started_at', 'stopped_at',
          'working_duration', 'activities', 'human_target_names'
        )
        expect(item['started_at']).to match(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)
        expect(item['activities']).to be_an(Array)
      end
```

- [ ] **Step 2 : Lancer la suite complète du spec**

```bash
bundle exec rspec spec/controllers/backend/interventions_controller_spec.rb --format documentation
```

Expected: 13 examples, 0 failures.

- [ ] **Step 3 : Commit final**

```bash
git add spec/controllers/backend/interventions_controller_spec.rb
git commit -m "test(interventions): add serialization integration test for Inertia props"
```

---

## Vérification finale

- [ ] Lancer tous les specs du controller :
  ```bash
  bundle exec rspec spec/controllers/backend/interventions_controller_spec.rb
  ```
  Expected: **13 examples, 0 failures**

- [ ] Lancer tous les tests Vitest du module :
  ```bash
  yarn vitest run app/frontend/pages/Interventions/
  ```
  Expected: **10 examples, 0 failures**

- [ ] TypeCheck global :
  ```bash
  yarn tsc --noEmit
  ```
  Expected: **0 erreurs**

- [ ] Démarrer le serveur et naviguer vers `/backend/interventions` :
  ```bash
  foreman start
  ```
  Vérifier : table affichée, filtres fonctionnels, toggle carte/liste opérationnel.

---

## Self-Review

**Spec coverage :**
- ✅ Table filtrée : InterventionTable + InterventionFilters + controller index avec params
- ✅ Filtres côté serveur : `build_filter_conditions` couvre state, nature, activity, dates, q
- ✅ Overlay carte : InterventionMap + useInterventionMap + targets_geojson endpoint
- ✅ Pagination : Kaminari dans le controller, contrôles dans la page
- ✅ TypeScript strict : types explicites, aucun `any`
- ✅ TDD : tests écrits avant le code pour controller (RSpec) et composants (Vitest)

**Placeholders :** Aucun — tout le code est complet et exécutable.

**Cohérence des types :**
- `InterventionFilters` défini dans `types.ts`, utilisé par `InterventionFilters.tsx`, `Index.tsx`, `useInterventionMap.ts` ✅
- `Intervention` défini dans `types.ts`, utilisé par `InterventionTable.tsx`, `Index.tsx` ✅
- `InterventionsPageProps` correspond exactement aux props sérialisées dans le controller ✅
