# Dashboard Inertia + React — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Installer l'infrastructure Vite-ruby + Inertia-rails en parallèle de Webpacker, puis migrer `DashboardsController#home` vers une page React avec 4 KPI cards, mini-carte Leaflet, fil d'activité et widget météo.

**Architecture:** Vite-ruby (port 3036) cohabite avec Webpacker (port 3035) — le layout `inertia.html.haml` charge `vite_javascript_tag` uniquement pour les actions Inertia. `DashboardsController#home` passe des props JSON typées à `Backend/Dashboard/Home.tsx` via `render inertia:`. Chaque widget est un composant autonome avec son propre état loading/error.

**Tech Stack:** Rails 5.2, `inertia_rails ~> 2.0`, `vite_ruby ~> 3.0`, React 18, TypeScript strict, Tailwind CSS v4, TanStack Query v5, react-leaflet v4, Lucide React, Vitest + Testing Library, RSpec.

**Spec:** `docs/superpowers/specs/2026-05-15-dashboard-design.md`

---

## File Map

| Action | Fichier |
|---|---|
| Create | `app/frontend/entrypoints/application.tsx` |
| Create | `app/frontend/styles/tokens.css` |
| Create | `app/frontend/types/dashboard.ts` |
| Create | `app/frontend/pages/Backend/Dashboard/Home.tsx` |
| Create | `app/frontend/components/dashboard/KpiCard.tsx` |
| Create | `app/frontend/components/dashboard/WeatherWidget.tsx` |
| Create | `app/frontend/components/dashboard/ActivityFeed.tsx` |
| Create | `app/frontend/components/dashboard/ParcellesMap.tsx` |
| Create | `app/frontend/test/setup.ts` |
| Create | `app/frontend/components/dashboard/KpiCard.test.tsx` |
| Create | `app/frontend/components/dashboard/WeatherWidget.test.tsx` |
| Create | `app/frontend/components/dashboard/ActivityFeed.test.tsx` |
| Create | `app/frontend/components/dashboard/ParcellesMap.test.tsx` |
| Create | `app/frontend/pages/Backend/Dashboard/Home.test.tsx` |
| Create | `vite.config.ts` |
| Create | `config/vite.json` |
| Create | `app/frontend/tsconfig.json` |
| Create | `app/views/layouts/inertia.html.haml` |
| Modify | `Gemfile` (ajouter inertia_rails + vite_ruby) |
| Modify | `package.json` (ajouter scripts + dépendances) |
| Modify | `app/controllers/backend/dashboards_controller.rb` (layout + home action) |
| Create | `spec/controllers/backend/dashboards_controller_spec.rb` |

---

## Phase 1 : Infrastructure

---

### Task 1 : Branche Git + gems Ruby

**Files:**
- Modify: `Gemfile`

- [ ] **Créer la branche de travail**

```bash
cd ekylibre-main
git checkout -b feat/dashboard-inertia-react
```

Expected: `Switched to a new branch 'feat/dashboard-inertia-react'`

- [ ] **Ajouter les gems dans `Gemfile`** — après la ligne `gem 'webpacker', '~> 4.x'`

```ruby
# Inertia.js — bridge Rails → React (v2.x pour compatibilité Rails 5.2)
gem 'inertia_rails', '~> 2.0'

# Vite — bundler moderne en parallèle de Webpacker
gem 'vite_ruby', '~> 3.0'
```

- [ ] **Installer les gems**

```bash
bundle install
```

Expected: `Bundle complete!` — si erreur de compatibilité Rails 5.2 avec `inertia_rails ~> 2.0`, vérifier avec `bundle exec gem contents inertia_rails | head` et ajuster la contrainte de version.

- [ ] **Commit**

```bash
git add Gemfile Gemfile.lock
git commit -m "chore: add inertia_rails and vite_ruby gems"
```

---

### Task 2 : Packages npm

**Files:**
- Modify: `package.json`

- [ ] **Installer les dépendances de production**

```bash
yarn add \
  @inertiajs/react@^1.0 \
  react@^18 \
  react-dom@^18 \
  @tanstack/react-query@^5 \
  react-leaflet@^4 \
  leaflet@^1.9 \
  lucide-react \
  zustand@^4 \
  tailwindcss@^4 \
  @tailwindcss/vite@^4
```

- [ ] **Installer les dépendances de dev**

```bash
yarn add -D \
  vite@^4 \
  vite-plugin-ruby \
  @vitejs/plugin-react@^4 \
  @types/react@^18 \
  @types/react-dom@^18 \
  @types/leaflet@^1 \
  vitest@^1 \
  @testing-library/react@^14 \
  @testing-library/jest-dom@^6 \
  @testing-library/user-event@^14 \
  jsdom@^24
```

- [ ] **Ajouter les scripts Vite dans `package.json`** — dans la section `"dependencies"`, ajouter une section `"scripts"` si elle n'existe pas, ou compléter l'existante :

```json
"scripts": {
  "vite:dev": "vite",
  "vite:build": "vite build",
  "vitest": "vitest run",
  "vitest:watch": "vitest"
}
```

- [ ] **Commit**

```bash
git add package.json yarn.lock
git commit -m "chore: add React 18, Inertia, Vite, Tailwind and testing packages"
```

---

### Task 3 : Configuration Vite

**Files:**
- Create: `vite.config.ts`
- Create: `config/vite.json`

- [ ] **Créer `vite.config.ts`** à la racine du projet

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import RubyPlugin from 'vite-plugin-ruby'

export default defineConfig({
  plugins: [
    RubyPlugin(),
    react(),
    tailwindcss(),
  ],
  test: {
    environment: 'jsdom',
    setupFiles: ['app/frontend/test/setup.ts'],
    globals: true,
  },
})
```

- [ ] **Créer `config/vite.json`**

```json
{
  "all": {
    "sourceCodeDir": "app/frontend",
    "watchAdditionalPaths": []
  },
  "development": {
    "autoBuild": true,
    "publicOutputDir": "vite-dev",
    "port": 3036
  },
  "test": {
    "autoBuild": false,
    "publicOutputDir": "vite-test"
  },
  "production": {
    "autoBuild": true,
    "publicOutputDir": "vite"
  }
}
```

- [ ] **Vérifier que la config est valide**

```bash
yarn vite:build --mode development 2>&1 | head -20
```

Expected: erreur sur entrypoint manquant (normal à ce stade) — pas d'erreur de syntaxe config.

- [ ] **Commit**

```bash
git add vite.config.ts config/vite.json
git commit -m "chore: configure vite-ruby alongside Webpacker"
```

---

### Task 4 : Entry point React + TypeScript config

**Files:**
- Create: `app/frontend/entrypoints/application.tsx`
- Create: `app/frontend/tsconfig.json`

- [ ] **Créer les répertoires**

```bash
mkdir -p app/frontend/entrypoints app/frontend/pages/Backend/Dashboard app/frontend/components/dashboard app/frontend/styles app/frontend/types app/frontend/test
```

- [ ] **Créer `app/frontend/tsconfig.json`** — config TS séparée du tsconfig Webpacker existant

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./*"]
    },
    "resolveJsonModule": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "skipLibCheck": true
  },
  "include": ["./**/*.ts", "./**/*.tsx"],
  "exclude": ["node_modules"]
}
```

- [ ] **Créer `app/frontend/entrypoints/application.tsx`**

```tsx
import { createInertiaApp } from '@inertiajs/react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import '../styles/tokens.css'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      retry: 1,
    },
  },
})

createInertiaApp({
  resolve: (name) => {
    const pages = import.meta.glob('../pages/**/*.tsx', { eager: true })
    const page = pages[`../pages/${name}.tsx`]
    if (!page) throw new Error(`Page not found: ${name}`)
    return page as never
  },
  setup({ el, App, props }) {
    createRoot(el).render(
      <QueryClientProvider client={queryClient}>
        <App {...props} />
      </QueryClientProvider>
    )
  },
})
```

- [ ] **Vérifier TypeScript sur l'entry point**

```bash
yarn tsc --project app/frontend/tsconfig.json --noEmit 2>&1
```

Expected: 0 erreur (les types Inertia et React sont installés).

- [ ] **Commit**

```bash
git add app/frontend/
git commit -m "chore: add React entry point and TypeScript config for Vite"
```

---

### Task 5 : Design tokens CSS

**Files:**
- Create: `app/frontend/styles/tokens.css`

- [ ] **Créer `app/frontend/styles/tokens.css`**

```css
/* SenagrOS Design Tokens — palette Afrique de l'Ouest */
@import "tailwindcss";

:root {
  /* Couleurs */
  --color-primary:       #1B6B3A;
  --color-primary-light: #4CAF72;
  --color-accent:        #E8A020;
  --color-bg:            #F7F3EE;
  --color-bg-card:       #FFFFFF;
  --color-text:          #2C2416;
  --color-text-muted:    #6B5E4E;
  --color-border:        #E2D9CE;
  --color-success:       #2D7A3A;
  --color-warning:       #D4841A;
  --color-danger:        #D4420A;

  /* Typographie */
  --font-ui:      'Plus Jakarta Sans', system-ui, sans-serif;
  --font-heading: 'Playfair Display', Georgia, serif;

  /* Espacement */
  --radius-card: 8px;
  --shadow-card: 0 1px 3px rgba(44, 36, 22, 0.08);
}

body {
  font-family: var(--font-ui);
  background-color: var(--color-bg);
  color: var(--color-text);
}
```

- [ ] **Commit**

```bash
git add app/frontend/styles/tokens.css
git commit -m "chore: add SenagrOS design tokens CSS"
```

---

### Task 6 : Layout Inertia HAML

**Files:**
- Create: `app/views/layouts/inertia.html.haml`

- [ ] **Créer `app/views/layouts/inertia.html.haml`**

```haml
!!! 5
%html{lang: I18n.locale, dir: t("i18n.dir")}
  %head
    %meta{charset: "utf-8"}
    %meta{name: "viewport", content: "width=device-width, initial-scale=1"}
    = csrf_meta_tags
    = title_tag
    = vite_client_tag
    = vite_javascript_tag "application", crossorigin: "anonymous"
  %body{style: "margin:0;background:var(--color-bg,#F7F3EE)"}
    = yield
```

- [ ] **Ajouter le layout override dans `app/controllers/backend/dashboards_controller.rb`** — juste après la ligne `module Backend` / `class DashboardsController`

```ruby
module Backend
  class DashboardsController < Backend::BaseController
    layout 'inertia', only: [:home]   # ← ajouter cette ligne

    manage_restfully destroy_to: :root_path
    # ... reste du code inchangé
```

- [ ] **Vérifier que le fichier HAML est syntaxiquement valide**

```bash
bundle exec ruby -e "require 'haml'; Haml::Engine.new(File.read('app/views/layouts/inertia.html.haml')); puts 'OK'"
```

Expected: `OK`

- [ ] **Commit**

```bash
git add app/views/layouts/inertia.html.haml app/controllers/backend/dashboards_controller.rb
git commit -m "chore: add Inertia layout and layout override for dashboard home"
```

---

### Task 7 : Setup Vitest

**Files:**
- Create: `app/frontend/test/setup.ts`

- [ ] **Créer `app/frontend/test/setup.ts`**

```typescript
import '@testing-library/jest-dom'
import { vi } from 'vitest'
import 'leaflet'

// Mock react-leaflet — Leaflet nécessite un vrai DOM avec canvas
vi.mock('react-leaflet', () => ({
  MapContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="map-container">{children}</div>
  ),
  TileLayer: () => <div data-testid="tile-layer" />,
  GeoJSON: ({ data }: { data: unknown }) => (
    <div data-testid="geojson-layer" data-geojson={JSON.stringify(data)} />
  ),
  useMap: () => ({ fitBounds: vi.fn(), setView: vi.fn() }),
}))

// Mock @inertiajs/react pour les tests unitaires
vi.mock('@inertiajs/react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@inertiajs/react')>()
  return {
    ...actual,
    usePage: vi.fn(() => ({ props: {} })),
  }
})
```

- [ ] **Vérifier que Vitest démarre**

```bash
yarn vitest --run --reporter=verbose 2>&1 | head -20
```

Expected: `No test files found` ou `0 tests passed` — pas d'erreur de configuration.

- [ ] **Commit**

```bash
git add app/frontend/test/setup.ts
git commit -m "test: configure Vitest with jsdom and react-leaflet mock"
```

---

## Phase 2 : Couche de données Rails

---

### Task 8 : Types TypeScript du Dashboard

**Files:**
- Create: `app/frontend/types/dashboard.ts`

- [ ] **Créer `app/frontend/types/dashboard.ts`**

```typescript
export interface Campaign {
  name: string
  started_on: string
  stopped_on: string | null
}

export interface KpiData {
  campaign: Campaign | null
  area_ha: number
  interventions: { active: number; scheduled: number }
  expenses_xof: number | null
}

export interface Parcelle {
  id: number
  name: string
  area_ha: number
  geojson: string // GeoJSON string brut — parser avec JSON.parse() côté composant
}

export interface RecentIntervention {
  id: number
  name: string
  state: 'in_progress' | 'done' | 'planned'
  started_at: string
}

export interface WeatherDay {
  day: string
  temp_max: number
  temp_min: number
  icon: string
}

export interface WeatherData {
  temperature: number
  description: string
  icon: string
  forecast: WeatherDay[]
}

export interface FarmInfo {
  name: string
  locale: string
  timezone: string
}

export interface DashboardHomeProps {
  kpis: KpiData
  parcelles: Parcelle[]
  recent_activity: RecentIntervention[]
  weather: WeatherData | null
  farm: FarmInfo
}
```

- [ ] **Vérifier TypeScript**

```bash
yarn tsc --project app/frontend/tsconfig.json --noEmit
```

Expected: 0 erreur.

- [ ] **Commit**

```bash
git add app/frontend/types/dashboard.ts
git commit -m "feat: add TypeScript types for Dashboard props"
```

---

### Task 9 : RSpec + action `home` (TDD)

**Files:**
- Create: `spec/controllers/backend/dashboards_controller_spec.rb`
- Modify: `app/controllers/backend/dashboards_controller.rb`

- [ ] **Écrire le test RSpec**

```ruby
# spec/controllers/backend/dashboards_controller_spec.rb
require 'rails_helper'

RSpec.describe Backend::DashboardsController, type: :controller do
  let(:user) { create(:user) }

  before do
    sign_in user
    # Header X-Inertia → response JSON au lieu de HTML, plus simple à tester
    request.headers['X-Inertia'] = 'true'
    request.headers['X-Inertia-Version'] = '1'
    # Stub le cache météo pour éviter les appels réseau
    allow(Rails.cache).to receive(:read).with('dashboard:weather').and_return(nil)
    # Stub les modèles pour éviter les dépendances DB lourdes
    allow(CultivableZone).to receive(:select).and_return([])
    allow(CultivableZone).to receive(:sum).and_return(0.0)
    allow(Intervention).to receive_message_chain(:of_campaign, :in_progress, :count).and_return(0)
    allow(Intervention).to receive_message_chain(:of_campaign, :planned, :count).and_return(0)
    allow(Intervention).to receive_message_chain(:order, :limit, :as_json).and_return([])
    allow(Entity).to receive_message_chain(:of_company, :full_name).and_return('Ferme Test')
  end

  describe 'GET #home' do
    it 'retourne HTTP 200' do
      get :home
      expect(response).to have_http_status(:ok)
    end

    it 'rend le composant Inertia Backend/Dashboard/Home' do
      get :home
      data = JSON.parse(response.body)
      expect(data['component']).to eq('Backend/Dashboard/Home')
    end

    it 'expose les clés de props attendues' do
      get :home
      props = JSON.parse(response.body)['props']
      expect(props.keys).to include('kpis', 'parcelles', 'recent_activity', 'weather', 'farm')
    end

    it 'expose weather nil quand le cache est vide' do
      get :home
      props = JSON.parse(response.body)['props']
      expect(props['weather']).to be_nil
    end

    it 'expose farm.name' do
      get :home
      props = JSON.parse(response.body)['props']
      expect(props.dig('farm', 'name')).to eq('Ferme Test')
    end
  end
end
```

> **Note :** si `JSON.parse(response.body)` échoue (response HTML), inertia_rails v2 n'a peut-être pas activé le mode JSON avec ce header. Alternative : parser le `data-page` de l'HTML avec `response.body.match(/data-page="([^"]+)"/)` et décoder les HTML entities.

- [ ] **Lancer le test pour confirmer qu'il échoue**

```bash
bundle exec rspec spec/controllers/backend/dashboards_controller_spec.rb --format documentation 2>&1 | tail -20
```

Expected: `NameError` ou `ActionController::UrlGenerationError` — le composant Inertia n'existe pas encore.

- [ ] **Vérifier que le job Sidekiq de météo existe** — chercher s'il y a un job qui appelle `OpenWeatherMapClient` et écrit dans `Rails.cache`

```bash
grep -r "OpenWeatherMapClient\|dashboard:weather" app/jobs/ 2>/dev/null | head -10
```

Si aucun résultat : le cache sera toujours `nil` en Phase 1 — le widget affichera "Météo indisponible". Créer ce job est hors scope de cette task mais doit être tracké comme dette technique.

- [ ] **Implémenter l'action `home` dans `app/controllers/backend/dashboards_controller.rb`** — remplacer la méthode `def home; end` existante

```ruby
def home
  weather_data = Rails.cache.read('dashboard:weather')

  parcelles = CultivableZone
    .select("id, name, ROUND((ST_Area(shape::geography) / 10000.0)::numeric, 2) AS area_ha, ST_AsGeoJSON(shape) AS geojson")
    .map { |z| z.as_json(only: %i[id name]).merge('area_ha' => z.area_ha.to_f, 'geojson' => z.geojson) }

  recent = Intervention
    .order(started_at: :desc)
    .limit(5)
    .as_json(only: %i[id name state started_at])

  render inertia: 'Backend/Dashboard/Home', props: {
    kpis: {
      campaign: current_campaign&.as_json(only: %i[name started_on stopped_on]),
      area_ha: CultivableZone.sum("ROUND((ST_Area(shape::geography) / 10000.0)::numeric, 2)").to_f,
      interventions: {
        active: Intervention.of_campaign(current_campaign).in_progress.count,
        scheduled: Intervention.of_campaign(current_campaign).planned.count
      },
      expenses_xof: nil
    },
    parcelles: parcelles,
    recent_activity: recent,
    weather: weather_data,
    farm: {
      name: Entity.of_company.full_name,
      locale: I18n.locale.to_s,
      timezone: Time.zone.name
    }
  }
end
```

- [ ] **Relancer le test**

```bash
bundle exec rspec spec/controllers/backend/dashboards_controller_spec.rb --format documentation
```

Expected: `5 examples, 0 failures`

- [ ] **Commit**

```bash
git add spec/controllers/backend/dashboards_controller_spec.rb app/controllers/backend/dashboards_controller.rb
git commit -m "feat: implement DashboardsController#home with Inertia render"
```

---

## Phase 3 : Composants React (TDD)

---

### Task 10 : KpiCard

**Files:**
- Create: `app/frontend/components/dashboard/KpiCard.test.tsx`
- Create: `app/frontend/components/dashboard/KpiCard.tsx`

- [ ] **Écrire le test**

```tsx
// app/frontend/components/dashboard/KpiCard.test.tsx
import { render, screen } from '@testing-library/react'
import { Leaf } from 'lucide-react'
import { KpiCard } from './KpiCard'

describe('KpiCard', () => {
  it('affiche le titre et la valeur', () => {
    render(<KpiCard title="Surfaces" value={12.5} unit="ha" icon={<Leaf size={20} />} />)
    expect(screen.getByText('Surfaces')).toBeInTheDocument()
    expect(screen.getByText('12.5')).toBeInTheDocument()
    expect(screen.getByText('ha')).toBeInTheDocument()
  })

  it('affiche — quand la valeur est null', () => {
    render(<KpiCard title="Dépenses" value={null} unit="FCFA" icon={<Leaf size={20} />} />)
    expect(screen.getByText('—')).toBeInTheDocument()
  })

  it("n'affiche pas d'unité quand elle est absente", () => {
    render(<KpiCard title="Campagne" value="Hivernage 2025" icon={<Leaf size={20} />} />)
    expect(screen.getByText('Hivernage 2025')).toBeInTheDocument()
    expect(screen.queryByRole('note')).not.toBeInTheDocument()
  })
})
```

- [ ] **Lancer le test pour confirmer qu'il échoue**

```bash
yarn vitest run app/frontend/components/dashboard/KpiCard.test.tsx --reporter=verbose
```

Expected: `FAIL` — `KpiCard` n'existe pas.

- [ ] **Créer `app/frontend/components/dashboard/KpiCard.tsx`**

```tsx
import type { ReactNode } from 'react'

interface KpiCardProps {
  title: string
  value: string | number | null
  unit?: string
  icon: ReactNode
}

export function KpiCard({ title, value, unit, icon }: KpiCardProps) {
  const displayValue = value === null || value === undefined ? '—' : String(value)

  return (
    <div
      style={{
        background: 'var(--color-bg-card)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-card)',
        boxShadow: 'var(--shadow-card)',
        padding: '16px 20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-text-muted)' }}>
        {icon}
        <span style={{ fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          {title}
        </span>
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
        <span style={{ fontSize: '28px', fontWeight: 700, color: 'var(--color-text)', fontFamily: 'var(--font-heading)' }}>
          {displayValue}
        </span>
        {unit && value !== null && (
          <span style={{ fontSize: '14px', color: 'var(--color-text-muted)' }}>{unit}</span>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Relancer le test**

```bash
yarn vitest run app/frontend/components/dashboard/KpiCard.test.tsx --reporter=verbose
```

Expected: `3 tests passed`

- [ ] **Commit**

```bash
git add app/frontend/components/dashboard/KpiCard.tsx app/frontend/components/dashboard/KpiCard.test.tsx
git commit -m "feat: add KpiCard component with TDD"
```

---

### Task 11 : WeatherWidget

**Files:**
- Create: `app/frontend/components/dashboard/WeatherWidget.test.tsx`
- Create: `app/frontend/components/dashboard/WeatherWidget.tsx`

- [ ] **Écrire le test**

```tsx
// app/frontend/components/dashboard/WeatherWidget.test.tsx
import { render, screen } from '@testing-library/react'
import type { WeatherData } from '../../types/dashboard'
import { WeatherWidget } from './WeatherWidget'

const mockWeather: WeatherData = {
  temperature: 34,
  description: 'Ensoleillé',
  icon: '01d',
  forecast: [
    { day: 'Jeu', temp_max: 36, temp_min: 28, icon: '01d' },
    { day: 'Ven', temp_max: 29, temp_min: 24, icon: '10d' },
  ],
}

describe('WeatherWidget', () => {
  it('affiche la température et la description', () => {
    render(<WeatherWidget weather={mockWeather} />)
    expect(screen.getByText('34°C')).toBeInTheDocument()
    expect(screen.getByText('Ensoleillé')).toBeInTheDocument()
  })

  it('affiche le forecast', () => {
    render(<WeatherWidget weather={mockWeather} />)
    expect(screen.getByText('Jeu')).toBeInTheDocument()
    expect(screen.getByText('36°')).toBeInTheDocument()
  })

  it('affiche un message fallback quand weather est null', () => {
    render(<WeatherWidget weather={null} />)
    expect(screen.getByText('Météo indisponible')).toBeInTheDocument()
  })
})
```

- [ ] **Lancer le test pour confirmer qu'il échoue**

```bash
yarn vitest run app/frontend/components/dashboard/WeatherWidget.test.tsx --reporter=verbose
```

Expected: `FAIL`

- [ ] **Créer `app/frontend/components/dashboard/WeatherWidget.tsx`**

```tsx
import type { WeatherData } from '../../types/dashboard'

interface WeatherWidgetProps {
  weather: WeatherData | null
}

export function WeatherWidget({ weather }: WeatherWidgetProps) {
  if (!weather) {
    return (
      <div
        style={{
          background: 'var(--color-bg-card)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-card)',
          padding: '16px 20px',
          color: 'var(--color-text-muted)',
          fontSize: '14px',
        }}
      >
        Météo indisponible
      </div>
    )
  }

  return (
    <div
      style={{
        background: 'var(--color-bg-card)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-card)',
        boxShadow: 'var(--shadow-card)',
        padding: '16px 20px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
        <img
          src={`https://openweathermap.org/img/wn/${weather.icon}@2x.png`}
          alt={weather.description}
          width={48}
          height={48}
        />
        <div>
          <div style={{ fontSize: '32px', fontWeight: 700, color: 'var(--color-text)', lineHeight: 1 }}>
            {weather.temperature}°C
          </div>
          <div style={{ fontSize: '14px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
            {weather.description}
          </div>
        </div>
      </div>
      <div style={{ display: 'flex', gap: '8px' }}>
        {weather.forecast.map((day) => (
          <div
            key={day.day}
            style={{
              flex: 1,
              textAlign: 'center',
              background: 'var(--color-bg)',
              borderRadius: '6px',
              padding: '6px 4px',
            }}
          >
            <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', fontWeight: 600 }}>{day.day}</div>
            <img src={`https://openweathermap.org/img/wn/${day.icon}.png`} alt="" width={24} height={24} />
            <div style={{ fontSize: '12px', color: 'var(--color-text)', fontWeight: 600 }}>{day.temp_max}°</div>
            <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>{day.temp_min}°</div>
          </div>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Relancer le test**

```bash
yarn vitest run app/frontend/components/dashboard/WeatherWidget.test.tsx --reporter=verbose
```

Expected: `3 tests passed`

- [ ] **Commit**

```bash
git add app/frontend/components/dashboard/WeatherWidget.tsx app/frontend/components/dashboard/WeatherWidget.test.tsx
git commit -m "feat: add WeatherWidget component with TDD"
```

---

### Task 12 : ActivityFeed

**Files:**
- Create: `app/frontend/components/dashboard/ActivityFeed.test.tsx`
- Create: `app/frontend/components/dashboard/ActivityFeed.tsx`

- [ ] **Écrire le test**

```tsx
// app/frontend/components/dashboard/ActivityFeed.test.tsx
import { render, screen } from '@testing-library/react'
import type { RecentIntervention } from '../../types/dashboard'
import { ActivityFeed } from './ActivityFeed'

const mockInterventions: RecentIntervention[] = [
  { id: 1, name: 'Semis mil', state: 'done', started_at: '2025-05-14T08:00:00Z' },
  { id: 2, name: 'Irrigation parcelle Nord', state: 'in_progress', started_at: '2025-05-15T06:00:00Z' },
  { id: 3, name: 'Désherbage', state: 'planned', started_at: '2025-05-16T07:00:00Z' },
]

describe('ActivityFeed', () => {
  it('affiche les interventions', () => {
    render(<ActivityFeed interventions={mockInterventions} />)
    expect(screen.getByText('Semis mil')).toBeInTheDocument()
    expect(screen.getByText('Irrigation parcelle Nord')).toBeInTheDocument()
  })

  it('affiche un badge pour chaque état', () => {
    render(<ActivityFeed interventions={mockInterventions} />)
    expect(screen.getByText('done')).toBeInTheDocument()
    expect(screen.getByText('in_progress')).toBeInTheDocument()
    expect(screen.getByText('planned')).toBeInTheDocument()
  })

  it('affiche un message vide quand la liste est vide', () => {
    render(<ActivityFeed interventions={[]} />)
    expect(screen.getByText('Aucune intervention récente')).toBeInTheDocument()
  })
})
```

- [ ] **Lancer le test pour confirmer qu'il échoue**

```bash
yarn vitest run app/frontend/components/dashboard/ActivityFeed.test.tsx --reporter=verbose
```

Expected: `FAIL`

- [ ] **Créer `app/frontend/components/dashboard/ActivityFeed.tsx`**

```tsx
import type { RecentIntervention } from '../../types/dashboard'

const STATE_COLORS: Record<RecentIntervention['state'], string> = {
  done: 'var(--color-primary-light)',
  in_progress: 'var(--color-accent)',
  planned: 'var(--color-text-muted)',
}

interface ActivityFeedProps {
  interventions: RecentIntervention[]
}

export function ActivityFeed({ interventions }: ActivityFeedProps) {
  if (interventions.length === 0) {
    return (
      <div
        style={{
          background: 'var(--color-bg-card)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-card)',
          padding: '16px 20px',
          color: 'var(--color-text-muted)',
          fontSize: '14px',
        }}
      >
        Aucune intervention récente
      </div>
    )
  }

  return (
    <div
      style={{
        background: 'var(--color-bg-card)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-card)',
        boxShadow: 'var(--shadow-card)',
        padding: '16px 20px',
      }}
    >
      <h3 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 12px 0' }}>
        Activité récente
      </h3>
      <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {interventions.map((intervention) => (
          <li
            key={intervention.id}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '8px 12px',
              background: 'var(--color-bg)',
              borderRadius: '6px',
            }}
          >
            <span style={{ fontSize: '14px', color: 'var(--color-text)', fontWeight: 500 }}>
              {intervention.name}
            </span>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 600,
                padding: '2px 8px',
                borderRadius: '12px',
                background: STATE_COLORS[intervention.state],
                color: 'white',
              }}
            >
              {intervention.state}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
```

- [ ] **Relancer le test**

```bash
yarn vitest run app/frontend/components/dashboard/ActivityFeed.test.tsx --reporter=verbose
```

Expected: `3 tests passed`

- [ ] **Commit**

```bash
git add app/frontend/components/dashboard/ActivityFeed.tsx app/frontend/components/dashboard/ActivityFeed.test.tsx
git commit -m "feat: add ActivityFeed component with TDD"
```

---

### Task 13 : ParcellesMap

**Files:**
- Create: `app/frontend/components/dashboard/ParcellesMap.test.tsx`
- Create: `app/frontend/components/dashboard/ParcellesMap.tsx`

- [ ] **Écrire le test**

```tsx
// app/frontend/components/dashboard/ParcellesMap.test.tsx
import { render, screen } from '@testing-library/react'
import type { Parcelle } from '../../types/dashboard'
import { ParcellesMap } from './ParcellesMap'

const mockParcelles: Parcelle[] = [
  {
    id: 1,
    name: 'Parcelle Nord',
    area_ha: 3.5,
    geojson: '{"type":"Polygon","coordinates":[[[14.5,14.8],[14.6,14.8],[14.6,14.9],[14.5,14.9],[14.5,14.8]]]}',
  },
  {
    id: 2,
    name: 'Parcelle Sud',
    area_ha: 2.1,
    geojson: '{"type":"Polygon","coordinates":[[[14.5,14.7],[14.6,14.7],[14.6,14.8],[14.5,14.8],[14.5,14.7]]]}',
  },
]

describe('ParcellesMap', () => {
  it('rend le conteneur de carte', () => {
    render(<ParcellesMap parcelles={mockParcelles} />)
    expect(screen.getByTestId('map-container')).toBeInTheDocument()
  })

  it('rend un layer GeoJSON par parcelle', () => {
    render(<ParcellesMap parcelles={mockParcelles} />)
    expect(screen.getAllByTestId('geojson-layer')).toHaveLength(2)
  })

  it('affiche un placeholder quand il n\'y a aucune parcelle', () => {
    render(<ParcellesMap parcelles={[]} />)
    expect(screen.getByText('Aucune parcelle enregistrée')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Créer une parcelle/i })).toBeInTheDocument()
  })

  it('passe le GeoJSON parsé au layer', () => {
    render(<ParcellesMap parcelles={[mockParcelles[0]]} />)
    const layer = screen.getByTestId('geojson-layer')
    const parsed = JSON.parse(layer.getAttribute('data-geojson') ?? '{}')
    expect(parsed.type).toBe('Polygon')
  })
})
```

- [ ] **Lancer le test pour confirmer qu'il échoue**

```bash
yarn vitest run app/frontend/components/dashboard/ParcellesMap.test.tsx --reporter=verbose
```

Expected: `FAIL`

- [ ] **Créer `app/frontend/components/dashboard/ParcellesMap.tsx`**

```tsx
import { MapContainer, TileLayer, GeoJSON } from 'react-leaflet'
import type { Parcelle } from '../../types/dashboard'

interface ParcellesMapProps {
  parcelles: Parcelle[]
}

export function ParcellesMap({ parcelles }: ParcellesMapProps) {
  if (parcelles.length === 0) {
    return (
      <div
        style={{
          background: 'var(--color-bg-card)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-card)',
          padding: '32px 20px',
          textAlign: 'center',
          color: 'var(--color-text-muted)',
        }}
      >
        <p style={{ margin: '0 0 12px 0', fontSize: '14px' }}>Aucune parcelle enregistrée</p>
        <a
          href="/backend/cultivable_zones/new"
          style={{
            fontSize: '13px',
            fontWeight: 600,
            color: 'var(--color-primary)',
            textDecoration: 'underline',
          }}
        >
          Créer une parcelle
        </a>
      </div>
    )
  }

  // Centre approximatif du Sénégal par défaut
  const defaultCenter: [number, number] = [14.5, -14.5]

  return (
    <div style={{ borderRadius: 'var(--radius-card)', overflow: 'hidden', border: '1px solid var(--color-border)' }}>
      <MapContainer
        center={defaultCenter}
        zoom={8}
        style={{ height: '280px', width: '100%' }}
        scrollWheelZoom={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {parcelles.map((parcelle) => (
          <GeoJSON
            key={parcelle.id}
            data={JSON.parse(parcelle.geojson)}
            style={{ color: '#1B6B3A', fillColor: '#4CAF72', fillOpacity: 0.3, weight: 2 }}
          />
        ))}
      </MapContainer>
    </div>
  )
}
```

- [ ] **Relancer le test**

```bash
yarn vitest run app/frontend/components/dashboard/ParcellesMap.test.tsx --reporter=verbose
```

Expected: `4 tests passed`

- [ ] **Commit**

```bash
git add app/frontend/components/dashboard/ParcellesMap.tsx app/frontend/components/dashboard/ParcellesMap.test.tsx
git commit -m "feat: add ParcellesMap component with TDD"
```

---

### Task 14 : Page Home.tsx

**Files:**
- Create: `app/frontend/pages/Backend/Dashboard/Home.test.tsx`
- Create: `app/frontend/pages/Backend/Dashboard/Home.tsx`

- [ ] **Écrire le test d'intégration de la page**

```tsx
// app/frontend/pages/Backend/Dashboard/Home.test.tsx
import { render, screen } from '@testing-library/react'
import type { DashboardHomeProps } from '../../../types/dashboard'
import Home from './Home'

const defaultProps: DashboardHomeProps = {
  kpis: {
    campaign: { name: 'Hivernage 2025', started_on: '2025-06-01', stopped_on: null },
    area_ha: 12.5,
    interventions: { active: 3, scheduled: 2 },
    expenses_xof: null,
  },
  parcelles: [
    {
      id: 1,
      name: 'Parcelle Nord',
      area_ha: 3.5,
      geojson: '{"type":"Polygon","coordinates":[[[14.5,14.8],[14.6,14.8],[14.6,14.9],[14.5,14.9],[14.5,14.8]]]}',
    },
  ],
  recent_activity: [
    { id: 1, name: 'Semis mil', state: 'done', started_at: '2025-05-14T08:00:00Z' },
  ],
  weather: {
    temperature: 34,
    description: 'Ensoleillé',
    icon: '01d',
    forecast: [],
  },
  farm: { name: 'Ferme Ndiaye', locale: 'fr', timezone: 'Africa/Dakar' },
}

describe('Dashboard Home', () => {
  it('affiche le nom de la ferme', () => {
    render(<Home {...defaultProps} />)
    expect(screen.getByText('Ferme Ndiaye')).toBeInTheDocument()
  })

  it('affiche les 4 blocs KPI', () => {
    render(<Home {...defaultProps} />)
    expect(screen.getByText('Campagne')).toBeInTheDocument()
    expect(screen.getByText('Surfaces')).toBeInTheDocument()
    expect(screen.getByText('Interventions')).toBeInTheDocument()
    expect(screen.getByText('Météo')).toBeInTheDocument()
  })

  it('affiche la carte', () => {
    render(<Home {...defaultProps} />)
    expect(screen.getByTestId('map-container')).toBeInTheDocument()
  })

  it('affiche le fil d\'activité', () => {
    render(<Home {...defaultProps} />)
    expect(screen.getByText('Semis mil')).toBeInTheDocument()
  })
})
```

- [ ] **Lancer le test pour confirmer qu'il échoue**

```bash
yarn vitest run app/frontend/pages/Backend/Dashboard/Home.test.tsx --reporter=verbose
```

Expected: `FAIL`

- [ ] **Créer `app/frontend/pages/Backend/Dashboard/Home.tsx`**

```tsx
import { Cloud, Layers, MapPin, Sprout } from 'lucide-react'
import type { DashboardHomeProps } from '../../../types/dashboard'
import { ActivityFeed } from '../../../components/dashboard/ActivityFeed'
import { KpiCard } from '../../../components/dashboard/KpiCard'
import { ParcellesMap } from '../../../components/dashboard/ParcellesMap'
import { WeatherWidget } from '../../../components/dashboard/WeatherWidget'

export default function Home({ kpis, parcelles, recent_activity, weather, farm }: DashboardHomeProps) {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg)', padding: '24px' }}>
      {/* En-tête */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ margin: 0, fontFamily: 'var(--font-heading)', fontSize: '24px', color: 'var(--color-text)' }}>
          {farm.name}
        </h1>
        {kpis.campaign && (
          <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: 'var(--color-text-muted)' }}>
            {kpis.campaign.name}
          </p>
        )}
      </div>

      {/* KPI cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '16px',
          marginBottom: '24px',
        }}
      >
        <KpiCard
          title="Campagne"
          value={kpis.campaign?.name ?? null}
          icon={<Sprout size={18} color="var(--color-primary)" />}
        />
        <KpiCard
          title="Surfaces"
          value={kpis.area_ha}
          unit="ha"
          icon={<MapPin size={18} color="var(--color-primary)" />}
        />
        <KpiCard
          title="Interventions"
          value={kpis.interventions.active}
          unit="actives"
          icon={<Layers size={18} color="var(--color-accent)" />}
        />
        <KpiCard
          title="Météo"
          value={weather ? `${weather.temperature}°C` : null}
          icon={<Cloud size={18} color="var(--color-primary)" />}
        />
      </div>

      {/* Carte + Météo */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '2fr 1fr',
          gap: '16px',
          marginBottom: '24px',
        }}
      >
        <ParcellesMap parcelles={parcelles} />
        <WeatherWidget weather={weather} />
      </div>

      {/* Fil d'activité */}
      <ActivityFeed interventions={recent_activity} />
    </div>
  )
}
```

- [ ] **Relancer le test**

```bash
yarn vitest run app/frontend/pages/Backend/Dashboard/Home.test.tsx --reporter=verbose
```

Expected: `4 tests passed`

- [ ] **Commit**

```bash
git add app/frontend/pages/Backend/Dashboard/Home.tsx app/frontend/pages/Backend/Dashboard/Home.test.tsx
git commit -m "feat: add Dashboard Home page with all widgets"
```

---

## Phase 4 : Vérification finale

---

### Task 15 : Vérification complète

- [ ] **TypeScript — zéro erreur**

```bash
yarn tsc --project app/frontend/tsconfig.json --noEmit
```

Expected: aucune sortie (0 erreur)

- [ ] **Tous les tests Vitest**

```bash
yarn vitest run --reporter=verbose
```

Expected: tous les tests verts — si un test échoue, corriger avant de continuer.

- [ ] **RSpec controller**

```bash
bundle exec rspec spec/controllers/backend/dashboards_controller_spec.rb --format documentation
```

Expected: `5 examples, 0 failures`

- [ ] **Linter Ruby**

```bash
bundle exec rubocop app/controllers/backend/dashboards_controller.rb
```

Expected: `no offenses detected` — corriger avec `-a` si nécessaire.

- [ ] **Linter JS/TS** (si eslint est configuré pour `app/frontend/`)

```bash
yarn eslint app/frontend/ --ext .ts,.tsx 2>&1 | tail -10
```

Expected: 0 erreur bloquante.

- [ ] **Vérifier que Webpacker fonctionne toujours** (pas de régression)

```bash
yarn webpack --env production 2>&1 | tail -5
```

Expected: `compiled successfully` — Webpacker ne doit pas être cassé.

- [ ] **Démarrer les deux serveurs et vérifier `/backend` dans le navigateur**

```bash
# Terminal 1
bundle exec rails server

# Terminal 2
yarn vite:dev
```

Ouvrir http://localhost:3000/backend — la page React doit s'afficher avec les 4 KPI cards, la carte Leaflet, le widget météo et le fil d'activité.

- [ ] **Vérifier qu'une autre page HAML ne régresse pas** — ouvrir http://localhost:3000/backend/interventions (page Webpacker legacy) et vérifier qu'elle s'affiche normalement.

- [ ] **Commit final de la branche**

```bash
git add .
git status  # vérifier qu'il n'y a pas de fichier non voulu (ex: .env, secrets)
git commit -m "chore: final verification — dashboard React + infrastructure ready"
```

---

## Critères de Done

| Critère | Commande |
|---|---|
| TypeScript strict | `yarn tsc --project app/frontend/tsconfig.json --noEmit` → 0 erreur |
| Tests React | `yarn vitest run` → tous verts |
| Tests Rails | `bundle exec rspec spec/controllers/backend/dashboards_controller_spec.rb` → 0 failure |
| Linter Ruby | `bundle exec rubocop app/controllers/backend/dashboards_controller.rb` → 0 offense |
| Webpacker intact | `yarn webpack --env production` → compiled successfully |
| Dashboard visible | `GET /backend` → page React avec 4 widgets |
| Pas de régression | Pages HAML existantes toujours fonctionnelles |
