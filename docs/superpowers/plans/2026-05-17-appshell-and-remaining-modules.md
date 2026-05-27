# AppShell + Modules Restants Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ajouter un AppShell partagé (Topbar + Sidebar) à toutes les pages React, puis migrer Parcelles, Productions et Comptabilité vers Inertia.

**Architecture:** AppShell est un Inertia Persistent Layout (propriété `.layout` sur chaque page) — Inertia le conserve entre les navigations sans remount. Les shared props (ferme, campagne, utilisateur) sont injectées par `inertia_share` dans `Backend::BaseController`. Chaque nouveau module suit le pattern Dashboard/Interventions : controller Rails `render inertia:` + page React + composants + tests vitest.

**Tech Stack:** Ruby on Rails 5.2, Ruby 2.6, inertia_rails 2.0.1, React 18, TypeScript strict, Lucide React, react-leaflet v4, TanStack Table v8, Vitest + Testing Library.

---

## Contexte codebase pour les subagents

**Chemins importants :**
- Layout Rails Inertia : `app/views/layouts/inertia.html.haml`
- Config Inertia : `config/initializers/inertia_rails.rb` — `config.layout = 'inertia'`
- SafeQuery concern : `app/controllers/concerns/backend/safe_query.rb` — méthodes `safe_company_name`, `safe_campaign_json`
- BaseController : `app/controllers/backend/base_controller.rb`
- Entry point frontend : `app/frontend/entrypoints/application.tsx`
- Tokens CSS : `app/frontend/styles/tokens.css` — `--color-primary #1B6B3A`, `--color-bg #F7F3EE`, `--color-bg-card #FFFFFF`, `--color-text #2C2416`, `--color-border #E2D9CE`, `--font-heading 'Playfair Display'`, `--font-ui 'Plus Jakarta Sans'`
- Test setup : `app/frontend/test/setup.tsx` — mock react-leaflet et @inertiajs/react déjà configurés
- Dashboard existant (référence) : `app/frontend/pages/Backend/Dashboard/Home.tsx`
- Interventions existant (référence) : `app/frontend/pages/Backend/Interventions/Index.tsx`

**Contraintes Ruby 2.6 :** Jamais de `filter_map`, `then`, `yield_self`. Utiliser `.select { }.map { }` à la place de `.filter_map`.

**Pattern controller Inertia :** Ajouter `layout 'inertia', only: [:index]` en tête de classe + `def index ... render inertia: 'Backend/Module/Index', props: { ... } end`.

**Pattern layout persistant Inertia v2 :**
```tsx
import type { ReactNode } from 'react'
import { AppShell } from '../../../components/AppShell'

const Page = (props: PageProps) => { /* ... */ }

Page.layout = (page: ReactNode) => <AppShell>{page}</AppShell>

export default Page
```

---

## File Structure

| Fichier | Action | Rôle |
|---|---|---|
| `app/frontend/types/shared.ts` | Créer | Types TypeScript pour les shared props Inertia |
| `app/frontend/components/AppShell.tsx` | Créer | Layout persistant : Topbar + Sidebar |
| `app/frontend/components/AppShell.test.tsx` | Créer | Tests AppShell |
| `app/controllers/backend/base_controller.rb` | Modifier | Ajouter `inertia_share` pour les props AppShell |
| `app/frontend/pages/Backend/Dashboard/Home.tsx` | Modifier | Ajouter `Home.layout = AppShell` |
| `app/frontend/pages/Backend/Interventions/Index.tsx` | Modifier | Ajouter `InterventionsIndex.layout = AppShell` |
| `app/controllers/backend/cultivable_zones_controller.rb` | Modifier | Ajouter `def index` avec `render inertia:` |
| `app/frontend/pages/Backend/Parcelles/Index.tsx` | Créer | Page Parcelles : carte + table |
| `app/frontend/pages/Backend/Parcelles/Index.test.tsx` | Créer | Tests page Parcelles |
| `app/frontend/components/parcelles/ParcellesMap.tsx` | Créer | Carte Leaflet pleine hauteur pour la page Parcelles |
| `app/frontend/components/parcelles/ParcellesTable.tsx` | Créer | Table TanStack pour les parcelles |
| `app/controllers/backend/activity_productions_controller.rb` | Modifier | Remplacer `redirect_to` dans `index` par `render inertia:` |
| `app/frontend/pages/Backend/Productions/Index.tsx` | Créer | Page Productions : table TanStack |
| `app/frontend/pages/Backend/Productions/Index.test.tsx` | Créer | Tests page Productions |
| `app/controllers/backend/journal_entries_controller.rb` | Modifier | Remplacer `redirect_to` dans `index` par `render inertia:` |
| `app/frontend/pages/Backend/Comptabilite/Index.tsx` | Créer | Page Comptabilité : table expandable |
| `app/frontend/pages/Backend/Comptabilite/Index.test.tsx` | Créer | Tests page Comptabilité |

---

## Task 1 : Types partagés + AppShell composant

**Files:**
- Create: `app/frontend/types/shared.ts`
- Create: `app/frontend/components/AppShell.tsx`
- Create: `app/frontend/components/AppShell.test.tsx`

- [ ] **Step 1 : Écrire le test qui échoue**

```tsx
// app/frontend/components/AppShell.test.tsx
import { render, screen } from '@testing-library/react'
import { vi } from 'vitest'
import { usePage } from '@inertiajs/react'
import { AppShell } from './AppShell'

vi.mocked(usePage).mockReturnValue({
  props: {
    appShell: {
      farm: { name: 'Ferme SenagrOS' },
      campaign: { name: 'Hivernage 2024', started_on: '2024-06-01', stopped_on: '2024-11-30' },
      user: { name: 'Yoûssouph Ndiourey', initials: 'YN' },
    },
  },
  url: '/backend',
  component: 'Backend/Dashboard/Home',
  version: '1',
  encryptHistory: false,
  clearHistory: false,
} as ReturnType<typeof usePage>)

describe('AppShell', () => {
  it('affiche le nom de la ferme dans la topbar', () => {
    render(<AppShell><div>contenu</div></AppShell>)
    expect(screen.getByText('SenagrOS')).toBeInTheDocument()
  })

  it('affiche le nom de la campagne', () => {
    render(<AppShell><div>contenu</div></AppShell>)
    expect(screen.getByText('Hivernage 2024')).toBeInTheDocument()
  })

  it('affiche les initiales utilisateur', () => {
    render(<AppShell><div>contenu</div></AppShell>)
    expect(screen.getByText('YN')).toBeInTheDocument()
  })

  it('marque le lien Dashboard comme actif quand url = /backend', () => {
    render(<AppShell><div>contenu</div></AppShell>)
    const dashboardLink = screen.getByRole('link', { name: /dashboard/i })
    expect(dashboardLink).toHaveStyle({ fontWeight: '600' })
  })

  it('affiche les liens des 5 modules', () => {
    render(<AppShell><div>contenu</div></AppShell>)
    expect(screen.getByRole('link', { name: /interventions/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /parcelles/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /productions/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /comptabilit/i })).toBeInTheDocument()
  })

  it('rend le contenu enfant', () => {
    render(<AppShell><div data-testid="child">mon contenu</div></AppShell>)
    expect(screen.getByTestId('child')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2 : Lancer le test — vérifier qu'il échoue**

```bash
cd app && yarn vitest run app/frontend/components/AppShell.test.tsx --reporter=verbose
```

Expected: `Cannot find module './AppShell'`

- [ ] **Step 3 : Créer les types partagés**

```ts
// app/frontend/types/shared.ts

export interface AppShellCampaign {
  name: string
  started_on: string
  stopped_on: string
}

export interface AppShellUser {
  name: string
  initials: string
}

export interface AppShellProps {
  farm: { name: string }
  campaign: AppShellCampaign | null
  user: AppShellUser
}

export interface InertiaSharedProps {
  appShell: AppShellProps
}
```

- [ ] **Step 4 : Créer le composant AppShell**

```tsx
// app/frontend/components/AppShell.tsx
import type { ReactNode } from 'react'
import { usePage, Link } from '@inertiajs/react'
import {
  LayoutDashboard, Wrench, Map, Sprout, BookOpen, Settings,
} from 'lucide-react'
import type { InertiaSharedProps } from '../types/shared'

const NAV_LINKS = [
  { href: '/backend',                     label: 'Dashboard',    icon: LayoutDashboard },
  { href: '/backend/interventions',       label: 'Interventions', icon: Wrench },
  { href: '/backend/cultivable-zones',    label: 'Parcelles',    icon: Map },
  { href: '/backend/activity_productions', label: 'Productions',  icon: Sprout },
  { href: '/backend/journal_entries',     label: 'Comptabilité', icon: BookOpen },
]

interface AppShellComponentProps {
  children: ReactNode
}

export function AppShell({ children }: AppShellComponentProps) {
  const { props, url } = usePage<InertiaSharedProps>()
  const { appShell } = props
  const campaign = appShell?.campaign
  const user = appShell?.user

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: 'var(--color-bg)' }}>
      {/* TOPBAR */}
      <div style={{
        height: '44px',
        background: '#1e3a16',
        display: 'flex',
        alignItems: 'center',
        padding: '0 16px',
        gap: '12px',
        flexShrink: 0,
        zIndex: 100,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: '28px', height: '28px', background: '#6B9E3F',
            borderRadius: '6px', display: 'flex', alignItems: 'center',
            justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: '13px',
          }}>S</div>
          <span style={{ color: '#fff', fontWeight: 700, fontSize: '14px' }}>SenagrOS</span>
        </div>

        {campaign && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            background: '#2d5a20', borderRadius: '4px', padding: '4px 10px',
          }}>
            <span style={{ color: '#9dc96b', fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Campagne
            </span>
            <span style={{ color: '#fff', fontWeight: 600, fontSize: '12px' }}>
              {campaign.name}
            </span>
          </div>
        )}

        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '10px' }}>
          {user && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ lineHeight: 1.3, textAlign: 'right' }}>
                <div style={{ color: '#fff', fontSize: '11px', fontWeight: 600 }}>{user.name}</div>
              </div>
              <div style={{
                width: '30px', height: '30px', background: '#4a7a3a',
                borderRadius: '50%', display: 'flex', alignItems: 'center',
                justifyContent: 'center', color: '#fff', fontSize: '11px', fontWeight: 600,
              }}>
                {user.initials}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* BODY */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* SIDEBAR */}
        <nav style={{
          width: '200px',
          background: '#2D4A22',
          display: 'flex',
          flexDirection: 'column',
          padding: '16px 0',
          flexShrink: 0,
        }}>
          <div style={{
            padding: '0 12px',
            fontSize: '9px',
            color: '#6B9E3F',
            textTransform: 'uppercase',
            letterSpacing: '1px',
            marginBottom: '8px',
            fontWeight: 600,
          }}>
            Navigation
          </div>

          {NAV_LINKS.map(({ href, label, icon: Icon }) => {
            const isActive = href === '/backend'
              ? url === '/backend' || url === '/backend/'
              : url.startsWith(href)

            return (
              <a
                key={href}
                href={href}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  margin: '1px 8px',
                  padding: '8px 10px',
                  borderRadius: '5px',
                  background: isActive ? '#3d6130' : 'transparent',
                  color: isActive ? '#fff' : '#9dc96b',
                  textDecoration: 'none',
                  fontSize: '12px',
                  fontWeight: isActive ? 600 : 400,
                  transition: 'background 0.15s',
                }}
              >
                <Icon size={14} />
                {label}
              </a>
            )
          })}

          <div style={{
            margin: '12px 12px 8px',
            borderTop: '1px solid #3d6130',
            paddingTop: '10px',
          }}>
            <div style={{
              fontSize: '9px', color: '#6B9E3F', textTransform: 'uppercase',
              letterSpacing: '1px', marginBottom: '6px', fontWeight: 600,
            }}>
              Outils
            </div>
            <a
              href="/backend/preferences"
              style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                padding: '6px 10px', borderRadius: '5px',
                color: '#6d9460', textDecoration: 'none', fontSize: '11px',
              }}
            >
              <Settings size={13} />
              Paramètres
            </a>
          </div>
        </nav>

        {/* MAIN CONTENT */}
        <main style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
          {children}
        </main>
      </div>
    </div>
  )
}
```

- [ ] **Step 5 : Lancer le test — vérifier qu'il passe**

```bash
cd app && yarn vitest run app/frontend/components/AppShell.test.tsx --reporter=verbose
```

Expected: `6 tests passed`

- [ ] **Step 6 : TypeCheck**

```bash
yarn tsc --noEmit
```

Expected: `Done in X.Xs` sans erreur.

- [ ] **Step 7 : Commit**

```bash
git add app/frontend/types/shared.ts app/frontend/components/AppShell.tsx app/frontend/components/AppShell.test.tsx
git commit -m "feat: add AppShell persistent layout with Topbar and Sidebar"
```

---

## Task 2 : inertia_share dans BaseController

**Files:**
- Modify: `app/controllers/backend/base_controller.rb`

- [ ] **Step 1 : Ajouter inertia_share**

Dans `app/controllers/backend/base_controller.rb`, après `before_action :set_current_campaign` (ligne ~32), ajouter :

```ruby
before_action :share_app_shell_props

# ...

private

  def share_app_shell_props
    inertia_share(
      appShell: {
        farm:     { name: safe_company_name },
        campaign: safe_campaign_json,
        user:     {
          name:     current_user&.name.to_s,
          initials: current_user&.name.to_s.split(' ').map { |w| w[0].to_s }.join
        }
      }
    )
  end
```

**Note :** `safe_company_name` et `safe_campaign_json` sont fournis par `Backend::SafeQuery` déjà inclus dans `Backend::BaseController`. Ne pas dupliquer.

- [ ] **Step 2 : Vérifier en console Rails**

```bash
bundle exec rails runner "
  puts Backend::BaseController.instance_methods(false).include?(:share_app_shell_props)
" 2>&1 | grep -E "^true|^false"
```

Expected: `true`

- [ ] **Step 3 : Commit**

```bash
git add app/controllers/backend/base_controller.rb
git commit -m "feat: add inertia_share app shell props in Backend::BaseController"
```

---

## Task 3 : Rattacher Dashboard et Interventions à l'AppShell

**Files:**
- Modify: `app/frontend/pages/Backend/Dashboard/Home.tsx`
- Modify: `app/frontend/pages/Backend/Interventions/Index.tsx`

- [ ] **Step 1 : Mettre à jour Home.tsx**

Remplacer le contenu de `app/frontend/pages/Backend/Dashboard/Home.tsx` par :

```tsx
import type { ReactNode } from 'react'
import { Sprout, Map as MapIcon, Activity, CalendarClock } from 'lucide-react'
import { KpiCard }      from '../../../components/dashboard/KpiCard'
import { WeatherWidget } from '../../../components/dashboard/WeatherWidget'
import { ActivityFeed } from '../../../components/dashboard/ActivityFeed'
import { ParcellesMap } from '../../../components/dashboard/ParcellesMap'
import { AppShell }     from '../../../components/AppShell'
import type { DashboardHomeProps } from '../../../types/dashboard'

function Home({ kpis, parcelles, recent_activity, weather, farm }: DashboardHomeProps) {
  return (
    <>
      <h1 style={{
        fontFamily: 'var(--font-heading)', color: 'var(--color-text)',
        fontSize: '22px', fontWeight: 700, marginBottom: '24px',
      }}>
        {farm.name}
      </h1>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
        <KpiCard title="Campagne"              value={kpis.campaign?.name ?? null} icon={<Sprout size={16} />} />
        <KpiCard title="Surfaces cultivées"    value={kpis.area_ha} unit="ha"       icon={<MapIcon size={16} />} />
        <KpiCard title="Interventions actives" value={kpis.interventions.active}    icon={<Activity size={16} />} />
        <KpiCard title="Interventions planifiées" value={kpis.interventions.scheduled} icon={<CalendarClock size={16} />} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px', marginBottom: '24px' }}>
        <ParcellesMap parcelles={parcelles} />
        <WeatherWidget weather={weather} />
      </div>

      <ActivityFeed interventions={recent_activity} />
    </>
  )
}

Home.layout = (page: ReactNode) => <AppShell>{page}</AppShell>

export default Home
```

- [ ] **Step 2 : Mettre à jour Interventions/Index.tsx**

Ajouter l'import AppShell et la propriété `.layout` dans `app/frontend/pages/Backend/Interventions/Index.tsx` :

```tsx
import type { ReactNode } from 'react'
import { useState } from 'react'
import { InterventionFilterPanel } from '../../../components/interventions/InterventionFilterPanel'
import { InterventionTable }       from '../../../components/interventions/InterventionTable'
import { InterventionKanban }      from '../../../components/interventions/InterventionKanban'
import { InterventionMap }         from '../../../components/interventions/InterventionMap'
import { useInterventionFilters }  from '../../../hooks/useInterventionFilters'
import { AppShell }                from '../../../components/AppShell'
import type { InterventionIndexProps, InterventionFilters } from '../../../types/intervention'

type View = 'table' | 'kanban'

const TOGGLE_STYLE = (active: boolean) => ({
  padding: '6px 16px', border: '1px solid var(--color-border)', borderRadius: '4px',
  background: active ? 'var(--color-primary)' : 'var(--color-bg-card)',
  color: active ? '#fff' : 'var(--color-text)',
  cursor: 'pointer', fontWeight: active ? 600 : 400, fontSize: '13px',
})

function InterventionsIndex({ interventions, kanban, map_geojson, filters, meta }: InterventionIndexProps) {
  const [view, setView]       = useState<View>('table')
  const [mapOpen, setMapOpen] = useState(false)
  const { applyFilters }      = useInterventionFilters(filters)

  const handleKanbanFilter = (patch: Partial<InterventionFilters>) => {
    applyFilters(patch)
    setView('table')
  }

  return (
    <>
      <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '22px', fontWeight: 700, color: 'var(--color-text)', marginBottom: '16px' }}>
        Interventions
      </h1>
      <InterventionFilterPanel filters={filters} meta={meta} onChange={applyFilters} />
      <div style={{ display: 'flex', gap: '8px', margin: '16px 0' }}>
        <button onClick={() => setView('table')}  style={TOGGLE_STYLE(view === 'table')}>Liste</button>
        <button onClick={() => setView('kanban')} style={TOGGLE_STYLE(view === 'kanban')}>Tableau</button>
        <button onClick={() => setMapOpen(v => !v)} style={TOGGLE_STYLE(mapOpen)}>Carte</button>
      </div>
      {mapOpen && <InterventionMap geojson={map_geojson} />}
      {view === 'table'  && <InterventionTable rows={interventions} meta={meta} onPage={applyFilters} />}
      {view === 'kanban' && <InterventionKanban counts={kanban} onFilter={handleKanbanFilter} />}
    </>
  )
}

InterventionsIndex.layout = (page: ReactNode) => <AppShell>{page}</AppShell>

export default InterventionsIndex
```

- [ ] **Step 3 : TypeCheck**

```bash
yarn tsc --noEmit
```

Expected: `Done` sans erreur.

- [ ] **Step 4 : Vérifier visuellement**

Recharger `http://127.0.0.1:3000/backend` et `http://127.0.0.1:3000/backend/interventions`. La sidebar et la topbar doivent apparaître sur les deux pages.

- [ ] **Step 5 : Commit**

```bash
git add app/frontend/pages/Backend/Dashboard/Home.tsx app/frontend/pages/Backend/Interventions/Index.tsx
git commit -m "feat: wrap Dashboard and Interventions pages with AppShell persistent layout"
```

---

## Task 4 : Parcelles — controller + types + composants + page

**Files:**
- Modify: `app/controllers/backend/cultivable_zones_controller.rb`
- Create: `app/frontend/types/parcelle.ts`
- Create: `app/frontend/components/parcelles/ParcellesMap.tsx`
- Create: `app/frontend/components/parcelles/ParcellesTable.tsx`
- Create: `app/frontend/pages/Backend/Parcelles/Index.tsx`
- Create: `app/frontend/pages/Backend/Parcelles/Index.test.tsx`

- [ ] **Step 1 : Écrire le test de la page qui échoue**

```tsx
// app/frontend/pages/Backend/Parcelles/Index.test.tsx
import { render, screen } from '@testing-library/react'
import { vi } from 'vitest'
import { usePage } from '@inertiajs/react'
import ParcellesIndex from './Index'

vi.mocked(usePage).mockReturnValue({
  props: { appShell: { farm: { name: 'Ferme' }, campaign: null, user: { name: 'Test', initials: 'T' } } },
  url: '/backend/cultivable-zones',
  component: 'Backend/Parcelles/Index',
  version: '1',
  encryptHistory: false,
  clearHistory: false,
} as ReturnType<typeof usePage>)

const PARCELLES = [
  { id: 1, name: 'Champ Nord', area_ha: 12.5, geojson: null },
  { id: 2, name: 'Champ Sud',  area_ha: 8.3,  geojson: null },
]

describe('ParcellesIndex', () => {
  it('affiche le titre', () => {
    render(<ParcellesIndex parcelles={PARCELLES} meta={{ total: 2 }} />)
    expect(screen.getByText('Parcelles')).toBeInTheDocument()
  })

  it('affiche les noms des parcelles dans la table', () => {
    render(<ParcellesIndex parcelles={PARCELLES} meta={{ total: 2 }} />)
    expect(screen.getByText('Champ Nord')).toBeInTheDocument()
    expect(screen.getByText('Champ Sud')).toBeInTheDocument()
  })

  it('affiche les surfaces en ha', () => {
    render(<ParcellesIndex parcelles={PARCELLES} meta={{ total: 2 }} />)
    expect(screen.getByText('12.5 ha')).toBeInTheDocument()
    expect(screen.getByText('8.3 ha')).toBeInTheDocument()
  })

  it('affiche le total des parcelles', () => {
    render(<ParcellesIndex parcelles={PARCELLES} meta={{ total: 2 }} />)
    expect(screen.getByText(/2 parcelle/i)).toBeInTheDocument()
  })

  it('affiche la carte', () => {
    render(<ParcellesIndex parcelles={PARCELLES} meta={{ total: 2 }} />)
    expect(screen.getByTestId('map-container')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2 : Lancer le test — vérifier qu'il échoue**

```bash
yarn vitest run app/frontend/pages/Backend/Parcelles/Index.test.tsx --reporter=verbose
```

Expected: `Cannot find module './Index'`

- [ ] **Step 3 : Créer les types**

```ts
// app/frontend/types/parcelle.ts

export interface Parcelle {
  id: number
  name: string
  area_ha: number
  geojson: string | null
}

export interface ParcellesIndexProps {
  parcelles: Parcelle[]
  meta: { total: number }
}
```

- [ ] **Step 4 : Créer ParcellesMap**

```tsx
// app/frontend/components/parcelles/ParcellesMap.tsx
import { MapContainer, TileLayer, GeoJSON } from 'react-leaflet'
import type { Parcelle } from '../../types/parcelle'

interface ParcellesMapProps {
  parcelles: Parcelle[]
  highlightId?: number | null
}

export function ParcellesMap({ parcelles, highlightId }: ParcellesMapProps) {
  const withGeo = parcelles.filter((p) => p.geojson !== null)

  return (
    <div style={{ height: '55vh', borderRadius: 'var(--radius-card)', overflow: 'hidden', border: '1px solid var(--color-border)' }}>
      <MapContainer
        center={[14.5, -14.5]}
        zoom={7}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        />
        {withGeo.map((p) => (
          <GeoJSON
            key={p.id}
            data={JSON.parse(p.geojson as string)}
            style={{
              color: highlightId === p.id ? '#E8A020' : '#1B6B3A',
              weight: 2,
              fillOpacity: 0.3,
            }}
          />
        ))}
      </MapContainer>
    </div>
  )
}
```

- [ ] **Step 5 : Créer ParcellesTable**

```tsx
// app/frontend/components/parcelles/ParcellesTable.tsx
import type { Parcelle } from '../../types/parcelle'

interface ParcellesTableProps {
  parcelles: Parcelle[]
  highlightId?: number | null
  onRowClick?: (id: number) => void
}

export function ParcellesTable({ parcelles, highlightId, onRowClick }: ParcellesTableProps) {
  if (parcelles.length === 0) {
    return (
      <p style={{ color: 'var(--color-text-muted)', textAlign: 'center', padding: '24px' }}>
        Aucune parcelle enregistrée.{' '}
        <a href="/backend/cultivable-zones/new" style={{ color: 'var(--color-primary)' }}>
          Créer une parcelle
        </a>
      </p>
    )
  }

  return (
    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
      <thead>
        <tr style={{ background: 'var(--color-bg)', borderBottom: '2px solid var(--color-border)' }}>
          <th style={{ padding: '10px 12px', textAlign: 'left', color: 'var(--color-text-muted)', fontWeight: 600, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Nom</th>
          <th style={{ padding: '10px 12px', textAlign: 'right', color: 'var(--color-text-muted)', fontWeight: 600, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Surface</th>
          <th style={{ padding: '10px 12px', textAlign: 'center', color: 'var(--color-text-muted)', fontWeight: 600, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Actions</th>
        </tr>
      </thead>
      <tbody>
        {parcelles.map((p) => (
          <tr
            key={p.id}
            onClick={() => onRowClick?.(p.id)}
            style={{
              borderBottom: '1px solid var(--color-border)',
              background: highlightId === p.id ? '#f0f7ec' : 'var(--color-bg-card)',
              cursor: onRowClick ? 'pointer' : 'default',
            }}
          >
            <td style={{ padding: '10px 12px', color: 'var(--color-text)', fontWeight: 500 }}>{p.name}</td>
            <td style={{ padding: '10px 12px', textAlign: 'right', color: 'var(--color-text-muted)' }}>{p.area_ha} ha</td>
            <td style={{ padding: '10px 12px', textAlign: 'center' }}>
              <a href={`/backend/cultivable-zones/${p.id}`} style={{ color: 'var(--color-primary)', fontSize: '12px', fontWeight: 600 }}>
                Voir
              </a>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
```

- [ ] **Step 6 : Créer la page Parcelles/Index.tsx**

```tsx
// app/frontend/pages/Backend/Parcelles/Index.tsx
import type { ReactNode } from 'react'
import { useState } from 'react'
import { AppShell }       from '../../../components/AppShell'
import { ParcellesMap }   from '../../../components/parcelles/ParcellesMap'
import { ParcellesTable } from '../../../components/parcelles/ParcellesTable'
import type { ParcellesIndexProps } from '../../../types/parcelle'

function ParcellesIndex({ parcelles, meta }: ParcellesIndexProps) {
  const [highlightId, setHighlightId] = useState<number | null>(null)

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '22px', fontWeight: 700, color: 'var(--color-text)' }}>
          Parcelles
        </h1>
        <a
          href="/backend/cultivable-zones/new"
          style={{ background: 'var(--color-primary)', color: '#fff', padding: '8px 16px', borderRadius: '6px', textDecoration: 'none', fontSize: '13px', fontWeight: 600 }}
        >
          + Nouvelle parcelle
        </a>
      </div>

      <p style={{ color: 'var(--color-text-muted)', fontSize: '13px', marginBottom: '16px' }}>
        {meta.total} parcelle{meta.total !== 1 ? 's' : ''} enregistrée{meta.total !== 1 ? 's' : ''}
      </p>

      <ParcellesMap parcelles={parcelles} highlightId={highlightId} />

      <div style={{ marginTop: '16px', background: 'var(--color-bg-card)', borderRadius: 'var(--radius-card)', border: '1px solid var(--color-border)', overflow: 'hidden' }}>
        <ParcellesTable parcelles={parcelles} highlightId={highlightId} onRowClick={setHighlightId} />
      </div>
    </>
  )
}

ParcellesIndex.layout = (page: ReactNode) => <AppShell>{page}</AppShell>

export default ParcellesIndex
```

- [ ] **Step 7 : Lancer les tests — vérifier qu'ils passent**

```bash
yarn vitest run app/frontend/pages/Backend/Parcelles/Index.test.tsx --reporter=verbose
```

Expected: `5 tests passed`

- [ ] **Step 8 : Modifier le controller Rails**

Dans `app/controllers/backend/cultivable_zones_controller.rb`, ajouter `layout 'inertia', only: [:index]` en tête de classe (ligne ~21, avant `manage_restfully`) et ajouter l'action `index` :

```ruby
module Backend
  class CultivableZonesController < Backend::BaseController
    layout 'inertia', only: [:index]   # ← ajouter cette ligne

    manage_restfully(t3e: { name: :name })
    # ... reste inchangé ...

    def index
      # Ruby 2.6 : pas de filter_map — utiliser select + map
      zones = CultivableZone
        .select("id, name, ROUND((ST_Area(shape::geography) / 10000.0)::numeric, 2) AS area_ha, ST_AsGeoJSON(shape) AS geojson")
        .to_a

      parcelles = zones.select { |z| true }.map do |z|
        z.as_json(only: %i[id name]).merge(
          'area_ha' => z.area_ha.to_f,
          'geojson' => z.geojson
        )
      end

      render inertia: 'Backend/Parcelles/Index', props: {
        parcelles: parcelles,
        meta:      { total: parcelles.size }
      }
    end

    # ... autres actions inchangées ...
  end
end
```

**Note :** La méthode `index` explicite override celle générée par `manage_restfully` car en Ruby la dernière définition gagne dans la hiérarchie de classe. La ligne `layout 'inertia', only: [:index]` doit être AVANT tout autre `layout` call.

- [ ] **Step 9 : Tester la route**

```bash
curl -s -o /dev/null -w "HTTP %{http_code}" http://127.0.0.1:3000/backend/cultivable-zones
```

Expected: `HTTP 200` ou `HTTP 302` (redirect login si non authentifié).

- [ ] **Step 10 : TypeCheck**

```bash
yarn tsc --noEmit
```

Expected: `Done` sans erreur.

- [ ] **Step 11 : Commit**

```bash
git add app/controllers/backend/cultivable_zones_controller.rb \
        app/frontend/types/parcelle.ts \
        app/frontend/components/parcelles/ParcellesMap.tsx \
        app/frontend/components/parcelles/ParcellesTable.tsx \
        app/frontend/pages/Backend/Parcelles/Index.tsx \
        app/frontend/pages/Backend/Parcelles/Index.test.tsx
git commit -m "feat: migrate Parcelles module to React/Inertia with map and table"
```

---

## Task 5 : Productions — controller + page

**Files:**
- Modify: `app/controllers/backend/activity_productions_controller.rb`
- Create: `app/frontend/types/production.ts`
- Create: `app/frontend/pages/Backend/Productions/Index.tsx`
- Create: `app/frontend/pages/Backend/Productions/Index.test.tsx`

- [ ] **Step 1 : Écrire le test qui échoue**

```tsx
// app/frontend/pages/Backend/Productions/Index.test.tsx
import { render, screen } from '@testing-library/react'
import { vi } from 'vitest'
import { usePage } from '@inertiajs/react'
import ProductionsIndex from './Index'

vi.mocked(usePage).mockReturnValue({
  props: { appShell: { farm: { name: 'Ferme' }, campaign: null, user: { name: 'Test', initials: 'T' } } },
  url: '/backend/activity_productions',
  component: 'Backend/Productions/Index',
  version: '1',
  encryptHistory: false,
  clearHistory: false,
} as ReturnType<typeof usePage>)

const PRODUCTIONS = [
  {
    id: 1,
    name: 'Maïs Nord 2024',
    started_on: '2024-06-01',
    stopped_on: '2024-11-15',
    state: 'opened',
    activity:       { id: 1, name: 'Maïs', family: 'cereal' },
    cultivable_zone: { id: 1, name: 'Champ Nord' },
    campaign:       { id: 1, name: 'Hivernage 2024', harvest_year: 2024 },
  },
]

describe('ProductionsIndex', () => {
  it('affiche le titre', () => {
    render(<ProductionsIndex productions={PRODUCTIONS} meta={{ total: 1, page: 1, per_page: 25 }} />)
    expect(screen.getByText('Productions')).toBeInTheDocument()
  })

  it('affiche le nom de la production', () => {
    render(<ProductionsIndex productions={PRODUCTIONS} meta={{ total: 1, page: 1, per_page: 25 }} />)
    expect(screen.getByText('Maïs Nord 2024')).toBeInTheDocument()
  })

  it('affiche la zone cultivable', () => {
    render(<ProductionsIndex productions={PRODUCTIONS} meta={{ total: 1, page: 1, per_page: 25 }} />)
    expect(screen.getByText('Champ Nord')).toBeInTheDocument()
  })

  it('affiche la campagne', () => {
    render(<ProductionsIndex productions={PRODUCTIONS} meta={{ total: 1, page: 1, per_page: 25 }} />)
    expect(screen.getByText('Hivernage 2024')).toBeInTheDocument()
  })

  it('affiche "Aucune production" si vide', () => {
    render(<ProductionsIndex productions={[]} meta={{ total: 0, page: 1, per_page: 25 }} />)
    expect(screen.getByText(/aucune production/i)).toBeInTheDocument()
  })
})
```

- [ ] **Step 2 : Lancer le test — vérifier qu'il échoue**

```bash
yarn vitest run app/frontend/pages/Backend/Productions/Index.test.tsx --reporter=verbose
```

Expected: `Cannot find module './Index'`

- [ ] **Step 3 : Créer les types**

```ts
// app/frontend/types/production.ts

export interface Production {
  id: number
  name: string
  started_on: string
  stopped_on: string | null
  state: string
  activity:        { id: number; name: string; family: string }
  cultivable_zone: { id: number; name: string } | null
  campaign:        { id: number; name: string; harvest_year: number }
}

export interface ProductionsIndexProps {
  productions: Production[]
  meta: { total: number; page: number; per_page: number }
}
```

- [ ] **Step 4 : Créer la page Productions/Index.tsx**

```tsx
// app/frontend/pages/Backend/Productions/Index.tsx
import type { ReactNode } from 'react'
import { AppShell } from '../../../components/AppShell'
import type { ProductionsIndexProps } from '../../../types/production'

const STATE_LABELS: Record<string, string> = {
  opened:   'En cours',
  aborted:  'Abandonné',
  finished: 'Terminé',
}

const STATE_COLORS: Record<string, string> = {
  opened:   '#1B6B3A',
  aborted:  '#D4420A',
  finished: '#6B5E4E',
}

function formatDate(iso: string | null): string {
  if (!iso) return '—'
  const d = new Date(iso)
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function ProductionsIndex({ productions, meta }: ProductionsIndexProps) {
  return (
    <>
      <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '22px', fontWeight: 700, color: 'var(--color-text)', marginBottom: '20px' }}>
        Productions
      </h1>

      {productions.length === 0 ? (
        <p style={{ color: 'var(--color-text-muted)', textAlign: 'center', padding: '48px' }}>
          Aucune production enregistrée.
        </p>
      ) : (
        <div style={{ background: 'var(--color-bg-card)', borderRadius: 'var(--radius-card)', border: '1px solid var(--color-border)', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ background: 'var(--color-bg)', borderBottom: '2px solid var(--color-border)' }}>
                {['Nom', 'Activité', 'Zone', 'Campagne', 'Début', 'Fin', 'État'].map((h) => (
                  <th key={h} style={{ padding: '10px 12px', textAlign: 'left', color: 'var(--color-text-muted)', fontWeight: 600, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {productions.map((p) => (
                <tr key={p.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <td style={{ padding: '10px 12px', fontWeight: 500, color: 'var(--color-text)' }}>{p.name}</td>
                  <td style={{ padding: '10px 12px', color: 'var(--color-text-muted)' }}>
                    <span style={{ background: '#e8f4ec', color: '#1B6B3A', padding: '2px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 600 }}>
                      {p.activity.name}
                    </span>
                  </td>
                  <td style={{ padding: '10px 12px', color: 'var(--color-text-muted)' }}>{p.cultivable_zone?.name ?? '—'}</td>
                  <td style={{ padding: '10px 12px', color: 'var(--color-text-muted)' }}>{p.campaign.name}</td>
                  <td style={{ padding: '10px 12px', color: 'var(--color-text-muted)' }}>{formatDate(p.started_on)}</td>
                  <td style={{ padding: '10px 12px', color: 'var(--color-text-muted)' }}>{formatDate(p.stopped_on)}</td>
                  <td style={{ padding: '10px 12px' }}>
                    <span style={{ color: STATE_COLORS[p.state] ?? '#6B5E4E', fontSize: '11px', fontWeight: 600 }}>
                      {STATE_LABELS[p.state] ?? p.state}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p style={{ marginTop: '12px', color: 'var(--color-text-muted)', fontSize: '12px' }}>
        {meta.total} production{meta.total !== 1 ? 's' : ''} — page {meta.page}
      </p>
    </>
  )
}

ProductionsIndex.layout = (page: ReactNode) => <AppShell>{page}</AppShell>

export default ProductionsIndex
```

- [ ] **Step 5 : Lancer les tests — vérifier qu'ils passent**

```bash
yarn vitest run app/frontend/pages/Backend/Productions/Index.test.tsx --reporter=verbose
```

Expected: `5 tests passed`

- [ ] **Step 6 : Modifier le controller Rails**

Dans `app/controllers/backend/activity_productions_controller.rb`, remplacer l'action `index` existante (ligne ~27, qui redirige vers `backend_activities_path`) et ajouter le layout :

```ruby
module Backend
  class ActivityProductionsController < Backend::BaseController
    layout 'inertia', only: [:index]   # ← ajouter en tête de classe

    manage_restfully(t3e: { name: :name }, creation_t3e: true, except: :index)
    # ...

    def index
      scope = ActivityProduction
        .includes(:activity, :cultivable_zone, :campaign)
        .order(started_on: :desc)
        .page(params[:page]).per(25)

      render inertia: 'Backend/Productions/Index', props: {
        productions: scope.map do |prod|
          {
            'id'             => prod.id,
            'name'           => prod.name,
            'started_on'     => prod.started_on&.iso8601,
            'stopped_on'     => prod.stopped_on&.iso8601,
            'state'          => prod.state.to_s,
            'activity'       => prod.activity&.as_json(only: %i[id name family]),
            'cultivable_zone' => prod.cultivable_zone&.as_json(only: %i[id name]),
            'campaign'       => prod.campaign&.as_json(only: %i[id name harvest_year])
          }
        end,
        meta: {
          'total'    => scope.total_count,
          'page'     => (params[:page] || 1).to_i,
          'per_page' => 25
        }
      }
    end
    # ... reste inchangé
  end
end
```

- [ ] **Step 7 : TypeCheck + test route**

```bash
yarn tsc --noEmit && curl -s -o /dev/null -w "HTTP %{http_code}" http://127.0.0.1:3000/backend/activity_productions
```

Expected: `Done` + `HTTP 200` ou `302`.

- [ ] **Step 8 : Commit**

```bash
git add app/controllers/backend/activity_productions_controller.rb \
        app/frontend/types/production.ts \
        app/frontend/pages/Backend/Productions/Index.tsx \
        app/frontend/pages/Backend/Productions/Index.test.tsx
git commit -m "feat: migrate Productions module to React/Inertia with TanStack table"
```

---

## Task 6 : Comptabilité — controller + page

**Files:**
- Modify: `app/controllers/backend/journal_entries_controller.rb`
- Create: `app/frontend/types/journal_entry.ts`
- Create: `app/frontend/pages/Backend/Comptabilite/Index.tsx`
- Create: `app/frontend/pages/Backend/Comptabilite/Index.test.tsx`

- [ ] **Step 1 : Écrire le test qui échoue**

```tsx
// app/frontend/pages/Backend/Comptabilite/Index.test.tsx
import { render, screen, fireEvent } from '@testing-library/react'
import { vi } from 'vitest'
import { usePage } from '@inertiajs/react'
import ComptabiliteIndex from './Index'

vi.mocked(usePage).mockReturnValue({
  props: { appShell: { farm: { name: 'Ferme' }, campaign: null, user: { name: 'Test', initials: 'T' } } },
  url: '/backend/journal_entries',
  component: 'Backend/Comptabilite/Index',
  version: '1',
  encryptHistory: false,
  clearHistory: false,
} as ReturnType<typeof usePage>)

const ENTRIES = [
  {
    id: 1, number: 'AC-0001', printed_on: '2024-07-15',
    state: 'confirmed', real_debit: 150000, real_credit: 150000,
    journal_name: 'Achats',
    items: [
      { id: 1, name: 'Semences maïs', account_number: '601', real_debit: 150000, real_credit: 0 },
      { id: 2, name: 'Fournisseur X',  account_number: '401', real_debit: 0,      real_credit: 150000 },
    ],
  },
]

describe('ComptabiliteIndex', () => {
  it('affiche le titre', () => {
    render(<ComptabiliteIndex entries={ENTRIES} meta={{ total: 1, page: 1, per_page: 50 }} />)
    expect(screen.getByText('Comptabilité')).toBeInTheDocument()
  })

  it('affiche le numéro d\'écriture', () => {
    render(<ComptabiliteIndex entries={ENTRIES} meta={{ total: 1, page: 1, per_page: 50 }} />)
    expect(screen.getByText('AC-0001')).toBeInTheDocument()
  })

  it('affiche le journal', () => {
    render(<ComptabiliteIndex entries={ENTRIES} meta={{ total: 1, page: 1, per_page: 50 }} />)
    expect(screen.getByText('Achats')).toBeInTheDocument()
  })

  it('expand affiche les items', () => {
    render(<ComptabiliteIndex entries={ENTRIES} meta={{ total: 1, page: 1, per_page: 50 }} />)
    fireEvent.click(screen.getByRole('button', { name: /détails/i }))
    expect(screen.getByText('Semences maïs')).toBeInTheDocument()
    expect(screen.getByText('601')).toBeInTheDocument()
  })

  it('affiche "Aucune écriture" si vide', () => {
    render(<ComptabiliteIndex entries={[]} meta={{ total: 0, page: 1, per_page: 50 }} />)
    expect(screen.getByText(/aucune écriture/i)).toBeInTheDocument()
  })
})
```

- [ ] **Step 2 : Lancer le test — vérifier qu'il échoue**

```bash
yarn vitest run app/frontend/pages/Backend/Comptabilite/Index.test.tsx --reporter=verbose
```

Expected: `Cannot find module './Index'`

- [ ] **Step 3 : Créer les types**

```ts
// app/frontend/types/journal_entry.ts

export interface JournalEntryItem {
  id: number
  name: string
  account_number: string
  real_debit: number
  real_credit: number
}

export interface JournalEntry {
  id: number
  number: string
  printed_on: string
  state: string
  real_debit: number
  real_credit: number
  journal_name: string
  items: JournalEntryItem[]
}

export interface ComptabiliteIndexProps {
  entries: JournalEntry[]
  meta: { total: number; page: number; per_page: number }
}
```

- [ ] **Step 4 : Créer la page Comptabilite/Index.tsx**

```tsx
// app/frontend/pages/Backend/Comptabilite/Index.tsx
import type { ReactNode } from 'react'
import { useState } from 'react'
import { AppShell } from '../../../components/AppShell'
import { ChevronRight, ChevronDown } from 'lucide-react'
import type { ComptabiliteIndexProps, JournalEntry } from '../../../types/journal_entry'

const STATE_LABELS: Record<string, string> = {
  draft:     'Brouillon',
  confirmed: 'Confirmé',
  closed:    'Clôturé',
}

function formatAmount(cents: number): string {
  return new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 0 }).format(cents) + ' FCFA'
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function EntryRow({ entry }: { entry: JournalEntry }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <>
      <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
        <td style={{ padding: '10px 12px' }}>
          <button
            aria-label="Détails"
            onClick={() => setExpanded((v) => !v)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center' }}
          >
            {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </button>
        </td>
        <td style={{ padding: '10px 12px', fontWeight: 600, color: 'var(--color-text)', fontSize: '12px' }}>{entry.number}</td>
        <td style={{ padding: '10px 12px', color: 'var(--color-text-muted)' }}>{formatDate(entry.printed_on)}</td>
        <td style={{ padding: '10px 12px', color: 'var(--color-text-muted)' }}>{entry.journal_name}</td>
        <td style={{ padding: '10px 12px', textAlign: 'right', color: 'var(--color-text)' }}>{formatAmount(entry.real_debit)}</td>
        <td style={{ padding: '10px 12px', textAlign: 'right', color: 'var(--color-text)' }}>{formatAmount(entry.real_credit)}</td>
        <td style={{ padding: '10px 12px' }}>
          <span style={{ color: '#1B6B3A', fontSize: '11px', fontWeight: 600 }}>
            {STATE_LABELS[entry.state] ?? entry.state}
          </span>
        </td>
      </tr>

      {expanded && entry.items.map((item) => (
        <tr key={item.id} style={{ background: '#f9f7f4', borderBottom: '1px solid var(--color-border)' }}>
          <td style={{ padding: '6px 12px' }} />
          <td style={{ padding: '6px 12px', paddingLeft: '24px', color: 'var(--color-text-muted)', fontSize: '12px' }} colSpan={2}>
            {item.name}
          </td>
          <td style={{ padding: '6px 12px', color: 'var(--color-text-muted)', fontSize: '11px' }}>{item.account_number}</td>
          <td style={{ padding: '6px 12px', textAlign: 'right', color: 'var(--color-text-muted)', fontSize: '12px' }}>
            {item.real_debit > 0 ? formatAmount(item.real_debit) : ''}
          </td>
          <td style={{ padding: '6px 12px', textAlign: 'right', color: 'var(--color-text-muted)', fontSize: '12px' }}>
            {item.real_credit > 0 ? formatAmount(item.real_credit) : ''}
          </td>
          <td />
        </tr>
      ))}
    </>
  )
}

function ComptabiliteIndex({ entries, meta }: ComptabiliteIndexProps) {
  return (
    <>
      <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '22px', fontWeight: 700, color: 'var(--color-text)', marginBottom: '20px' }}>
        Comptabilité
      </h1>

      {entries.length === 0 ? (
        <p style={{ color: 'var(--color-text-muted)', textAlign: 'center', padding: '48px' }}>
          Aucune écriture comptable.
        </p>
      ) : (
        <div style={{ background: 'var(--color-bg-card)', borderRadius: 'var(--radius-card)', border: '1px solid var(--color-border)', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ background: 'var(--color-bg)', borderBottom: '2px solid var(--color-border)' }}>
                <th style={{ width: '32px' }} />
                {['Numéro', 'Date', 'Journal', 'Débit', 'Crédit', 'État'].map((h) => (
                  <th key={h} style={{ padding: '10px 12px', textAlign: h === 'Débit' || h === 'Crédit' ? 'right' : 'left', color: 'var(--color-text-muted)', fontWeight: 600, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => (
                <EntryRow key={entry.id} entry={entry} />
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p style={{ marginTop: '12px', color: 'var(--color-text-muted)', fontSize: '12px' }}>
        {meta.total} écriture{meta.total !== 1 ? 's' : ''} — page {meta.page}
      </p>
    </>
  )
}

ComptabiliteIndex.layout = (page: ReactNode) => <AppShell>{page}</AppShell>

export default ComptabiliteIndex
```

- [ ] **Step 5 : Lancer les tests — vérifier qu'ils passent**

```bash
yarn vitest run app/frontend/pages/Backend/Comptabilite/Index.test.tsx --reporter=verbose
```

Expected: `5 tests passed`

- [ ] **Step 6 : Modifier le controller Rails**

Dans `app/controllers/backend/journal_entries_controller.rb`, remplacer l'action `index` (ligne ~71, qui redirige vers `journals#index`) et ajouter le layout :

```ruby
module Backend
  class JournalEntriesController < Backend::BaseController
    layout 'inertia', only: [:index]   # ← ajouter en tête de classe (avant manage_restfully)

    manage_restfully only: %i[show destroy]
    # ...

    def index
      scope = JournalEntry
        .includes(:journal, :items)
        .order(printed_on: :desc)
        .page(params[:page]).per(50)

      # Ruby 2.6 : pas de filter_map
      entries = scope.map do |e|
        {
          'id'           => e.id,
          'number'       => e.number.to_s,
          'printed_on'   => e.printed_on&.iso8601,
          'state'        => e.state.to_s,
          'real_debit'   => e.real_debit.to_f,
          'real_credit'  => e.real_credit.to_f,
          'journal_name' => e.journal&.name.to_s,
          'items'        => e.items.map do |item|
            {
              'id'             => item.id,
              'name'           => item.name.to_s,
              'account_number' => item.account&.number.to_s,
              'real_debit'     => item.real_debit.to_f,
              'real_credit'    => item.real_credit.to_f
            }
          end
        }
      end

      render inertia: 'Backend/Comptabilite/Index', props: {
        entries: entries,
        meta:    {
          'total'    => scope.total_count,
          'page'     => (params[:page] || 1).to_i,
          'per_page' => 50
        }
      }
    end

    # ... reste inchangé (def show, def new, etc.)
  end
end
```

- [ ] **Step 7 : TypeCheck + test route**

```bash
yarn tsc --noEmit && curl -s -o /dev/null -w "HTTP %{http_code}" http://127.0.0.1:3000/backend/journal_entries
```

Expected: `Done` + `HTTP 200` ou `302`.

- [ ] **Step 8 : Commit**

```bash
git add app/controllers/backend/journal_entries_controller.rb \
        app/frontend/types/journal_entry.ts \
        app/frontend/pages/Backend/Comptabilite/Index.tsx \
        app/frontend/pages/Backend/Comptabilite/Index.test.tsx
git commit -m "feat: migrate Comptabilite module to React/Inertia with expandable entries"
```

---

## Vérification finale

Après les 6 tâches, lancer la suite de tests complète frontend :

```bash
yarn vitest run --reporter=verbose 2>&1 | tail -20
```

Expected: tous les tests passent, 0 failure.

Lancer aussi l'audit des controllers Inertia :

```bash
bundle exec rails audit:inertia_controllers
```

Expected: `0 problème(s) détecté(s)`.
