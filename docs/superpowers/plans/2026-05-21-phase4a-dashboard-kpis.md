# Phase 4A — Dashboard KPIs enrichis + Alertes — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enrichir le Dashboard avec un KPI "Animaux vivants" et une section "Alertes" (interventions en retard + animaux récemment décédés).

**Architecture:** Extension pure — SafeQuery concern + dashboards_controller + types TS + Home.tsx. Pas de nouveau contrôleur.

**Tech Stack:** React 18, TypeScript strict, Inertia.js v2, Vitest, Ruby on Rails 6 (Ruby 2.6)

---

## File Structure

```
app/controllers/concerns/backend/safe_query.rb       ← add safe_animals_count + safe_alerts
app/controllers/backend/dashboards_controller.rb     ← add animals_count + alerts to props
app/frontend/types/dashboard.ts                      ← add DashboardAlert, extend KpiData + DashboardHomeProps
app/frontend/pages/Backend/Dashboard/Home.tsx        ← add 7th KpiCard + Alertes section
app/frontend/pages/Backend/Dashboard/Home.test.tsx   ← add 4 new tests, update defaultProps
```

---

## Task 1: TypeScript Types

**Files:**
- Modify: `app/frontend/types/dashboard.ts`

- [ ] **Step 1: Replace dashboard.ts with extended version**

Open `app/frontend/types/dashboard.ts`. Replace entire content with:

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
  workers_count: number
  productions_count: number
  animals_count: number
}

export interface Parcelle {
  id: number
  name: string
  area_ha: number
  geojson: string
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

export interface DashboardAlert {
  type: 'intervention_overdue' | 'animal_dead'
  label: string
  href: string
  detail: string
}

export interface DashboardHomeProps {
  kpis: KpiData
  parcelles: Parcelle[]
  recent_activity: RecentIntervention[]
  weather: WeatherData | null
  farm: FarmInfo
  alerts: DashboardAlert[]
}
```

- [ ] **Step 2: TypeScript check (expect errors in Home.tsx — OK)**

```bash
cd /path/to/ekylibre-main && yarn tsc --noEmit 2>&1 | head -20
```

Expected: errors in `Home.tsx` about missing `animals_count`/`alerts` — this is expected, will be fixed in Task 3.

- [ ] **Step 3: Commit types**

```bash
git add app/frontend/types/dashboard.ts
git commit -m "feat: extend dashboard types with animals_count KPI and DashboardAlert"
```

---

## Task 2: TDD — Failing Tests First

**Files:**
- Modify: `app/frontend/pages/Backend/Dashboard/Home.test.tsx`

- [ ] **Step 1: Update defaultProps and add 4 new tests**

Open `app/frontend/pages/Backend/Dashboard/Home.test.tsx`. Replace entire content:

```typescript
import { render, screen } from '@testing-library/react'
import Home from './Home'
import type { DashboardHomeProps, DashboardAlert } from '../../../types/dashboard'

const defaultProps: DashboardHomeProps = {
  kpis: {
    campaign: { name: 'Hivernage 2025', started_on: '2025-06-01', stopped_on: null },
    area_ha: 12.5,
    interventions: { active: 3, scheduled: 2 },
    expenses_xof: null,
    workers_count: 5,
    productions_count: 3,
    animals_count: 8,
  },
  parcelles: [
    {
      id: 1,
      name: 'Parcelle Nord',
      area_ha: 5.2,
      geojson: '{"type":"Feature","geometry":{"type":"Polygon","coordinates":[]}}',
    },
  ],
  recent_activity: [
    { id: 1, name: 'Semis mil', state: 'done', started_at: '2025-06-10T08:00:00Z' },
  ],
  weather: {
    temperature: 34,
    description: 'Ensoleillé',
    icon: '01d',
    forecast: [{ day: 'Jeu', temp_max: 36, temp_min: 28, icon: '01d' }],
  },
  farm: { name: 'Ferme Baobab', locale: 'fr', timezone: 'Africa/Dakar' },
  alerts: [],
}

describe('Dashboard Home', () => {
  it('renders farm name', () => {
    render(<Home {...defaultProps} />)
    expect(screen.getByText('Ferme Baobab')).toBeInTheDocument()
  })

  it('renders 6 KPI cards', () => {
    render(<Home {...defaultProps} />)
    expect(screen.getByText('Campagne')).toBeInTheDocument()
    expect(screen.getByText('Surfaces cultivées')).toBeInTheDocument()
    expect(screen.getByText('Interventions actives')).toBeInTheDocument()
    expect(screen.getByText('Interventions planifiées')).toBeInTheDocument()
    expect(screen.getByText('Travailleurs actifs')).toBeInTheDocument()
    expect(screen.getByText('Productions')).toBeInTheDocument()
  })

  it('renders KPI values', () => {
    render(<Home {...defaultProps} />)
    expect(screen.getByText('Hivernage 2025')).toBeInTheDocument()
    expect(screen.getByText('12.5')).toBeInTheDocument()
    expect(screen.getAllByText('3').length).toBeGreaterThanOrEqual(1)
  })

  it('renders new KPI cards', () => {
    render(<Home {...defaultProps} />)
    expect(screen.getByText('Travailleurs actifs')).toBeInTheDocument()
    expect(screen.getByText('Productions')).toBeInTheDocument()
    expect(screen.getByText('5')).toBeInTheDocument()
    expect(screen.getAllByText('3').length).toBeGreaterThanOrEqual(1)
  })

  it('renders map and activity feed', () => {
    render(<Home {...defaultProps} />)
    expect(screen.getByTestId('map-container')).toBeInTheDocument()
    expect(screen.getByText('Semis mil')).toBeInTheDocument()
  })

  // --- NEW TESTS ---

  it('renders Animaux vivants KPI with animals_count value', () => {
    render(<Home {...defaultProps} />)
    expect(screen.getByText('Animaux vivants')).toBeInTheDocument()
    expect(screen.getByText('8')).toBeInTheDocument()
  })

  it('hides alertes section when alerts is empty', () => {
    render(<Home {...defaultProps} />)
    expect(screen.queryByText('Alertes')).not.toBeInTheDocument()
  })

  it('shows alertes section with alert items when alerts is non-empty', () => {
    const alerts: DashboardAlert[] = [
      {
        type: 'animal_dead',
        label: 'Vache Bêta',
        href: '/backend/animals/42',
        detail: 'décédé le 15/05/2026',
      },
    ]
    render(<Home {...defaultProps} alerts={alerts} />)
    expect(screen.getByText('Alertes')).toBeInTheDocument()
    expect(screen.getByText('Vache Bêta')).toBeInTheDocument()
    expect(screen.getByText('décédé le 15/05/2026')).toBeInTheDocument()
  })

  it('shows Retard badge for intervention_overdue alert type', () => {
    const alerts: DashboardAlert[] = [
      {
        type: 'intervention_overdue',
        label: 'Traitement herbicide',
        href: '/backend/interventions/7',
        detail: 'commencée il y a 10 jours',
      },
    ]
    render(<Home {...defaultProps} alerts={alerts} />)
    expect(screen.getByText('Retard')).toBeInTheDocument()
    expect(screen.getByText('Traitement herbicide')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run tests — confirm new 4 FAIL**

```bash
yarn vitest run app/frontend/pages/Backend/Dashboard/Home.test.tsx --reporter=verbose
```

Expected: 5 existing pass, 4 new fail (Home.tsx not yet updated).

- [ ] **Step 3: Commit failing tests**

```bash
git add app/frontend/pages/Backend/Dashboard/Home.test.tsx
git commit -m "test: add 4 failing Dashboard tests for animals_count and alerts (TDD red)"
```

---

## Task 3: Home.tsx — 7th KpiCard + Alertes section

**Files:**
- Modify: `app/frontend/pages/Backend/Dashboard/Home.tsx`

- [ ] **Step 1: Replace Home.tsx**

```tsx
import type { ReactNode } from 'react'
import { Sprout, Map as MapIcon, Activity, CalendarClock, UserCog, Layers, PawPrint, AlertTriangle } from 'lucide-react'
import { AppShell } from '../../../components/AppShell'
import { KpiCard } from '../../../components/dashboard/KpiCard'
import { WeatherWidget } from '../../../components/dashboard/WeatherWidget'
import { ActivityFeed } from '../../../components/dashboard/ActivityFeed'
import { ParcellesMap } from '../../../components/dashboard/ParcellesMap'
import type { DashboardHomeProps, DashboardAlert } from '../../../types/dashboard'

function AlerteBadge({ type }: { type: DashboardAlert['type'] }) {
  if (type === 'intervention_overdue') {
    return (
      <span style={{ background: '#fef9c3', color: '#854d0e', borderRadius: '4px', padding: '2px 8px', fontSize: '11px', fontWeight: 600 }}>
        Retard
      </span>
    )
  }
  return (
    <span style={{ background: '#fee2e2', color: '#991b1b', borderRadius: '4px', padding: '2px 8px', fontSize: '11px', fontWeight: 600 }}>
      Décès
    </span>
  )
}

function Home({ kpis, parcelles, recent_activity, weather, farm, alerts }: DashboardHomeProps) {
  return (
    <div style={{ background: 'var(--color-bg)', minHeight: '100vh', padding: '24px' }}>
      <h1 style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-text)', fontSize: '24px', fontWeight: 700, marginBottom: '24px' }}>
        {farm.name}
      </h1>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }}>
        <KpiCard title="Campagne"               value={kpis.campaign?.name ?? null} icon={<Sprout size={16} />} />
        <KpiCard title="Surfaces cultivées"     value={kpis.area_ha}                unit="ha" icon={<MapIcon size={16} />} />
        <KpiCard title="Interventions actives"  value={kpis.interventions.active}   icon={<Activity size={16} />} />
        <KpiCard title="Interventions planifiées" value={kpis.interventions.scheduled} icon={<CalendarClock size={16} />} />
        <KpiCard title="Travailleurs actifs"    value={kpis.workers_count}          icon={<UserCog size={16} />} />
        <KpiCard title="Productions"            value={kpis.productions_count}      icon={<Layers size={16} />} />
        <KpiCard title="Animaux vivants"        value={kpis.animals_count}          icon={<PawPrint size={16} />} />
      </div>

      {alerts.length > 0 && (
        <div style={{ border: '1px solid #fca5a5', borderRadius: '8px', background: '#fff5f5', padding: '16px', marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <AlertTriangle size={18} color="#dc2626" />
            <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#dc2626', margin: 0 }}>
              Alertes
            </h2>
          </div>
          <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {alerts.map((alert, idx) => (
              <li key={idx} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 0', borderBottom: idx < alerts.length - 1 ? '1px solid #fecaca' : 'none' }}>
                <AlerteBadge type={alert.type} />
                <a href={alert.href} style={{ fontWeight: 600, color: 'var(--color-text)', textDecoration: 'none', flexGrow: 1 }}>
                  {alert.label}
                </a>
                <span style={{ fontSize: '12px', color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>
                  {alert.detail}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px', marginBottom: '24px' }}>
        <ParcellesMap parcelles={parcelles} />
        <WeatherWidget weather={weather} />
      </div>

      <ActivityFeed interventions={recent_activity} />
    </div>
  )
}

Home.layout = (page: ReactNode) => <AppShell>{page}</AppShell>
export default Home
```

- [ ] **Step 2: Run tests — confirm 9/9 pass**

```bash
yarn vitest run app/frontend/pages/Backend/Dashboard/Home.test.tsx --reporter=verbose
```

Expected: **9/9 PASS**

- [ ] **Step 3: TypeScript check**

```bash
yarn tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add app/frontend/pages/Backend/Dashboard/Home.tsx
git commit -m "feat: add Animaux vivants KPI and Alertes section to Dashboard Home"
```

---

## Task 4: SafeQuery concern — safe_animals_count + safe_alerts

**Files:**
- Modify: `app/controllers/concerns/backend/safe_query.rb`

- [ ] **Step 1: Add safe_animals_count and safe_alerts**

Open `app/controllers/concerns/backend/safe_query.rb`. The current file ends after `safe_campaign_json`. Add these two methods before the closing `end` of the module:

```ruby
# Nombre d'animaux vivants (dead_at IS NULL).
def safe_animals_count
  Animal.where(dead_at: nil).count
rescue ActiveRecord::StatementInvalid, PG::Error
  0
end

# Alertes dashboard : interventions en retard + animaux récemment décédés.
# Ruby 2.6 compatible : pas de filter_map, pas de then, pas de yield_self.
def safe_alerts
  overdue = Intervention.where(state: 'in_progress')
                        .where('started_at < ?', 7.days.ago)
                        .order(started_at: :asc)
                        .limit(5)
                        .select { |i| i.name.present? }
                        .map { |i|
                          days = ((Time.zone.now - i.started_at) / 86400).round
                          {
                            type: 'intervention_overdue',
                            label: i.name,
                            href: "/backend/interventions/#{i.id}",
                            detail: "commencée il y a #{days} jour#{days > 1 ? 's' : ''}"
                          }
                        }

  dead_animals = Animal.where('dead_at IS NOT NULL')
                       .where('dead_at >= ?', 30.days.ago)
                       .order(dead_at: :desc)
                       .limit(5)
                       .select { |a| a.name.present? }
                       .map { |a|
                         {
                           type: 'animal_dead',
                           label: a.name,
                           href: "/backend/animals/#{a.id}",
                           detail: "décédé le #{a.dead_at.to_date.strftime('%d/%m/%Y')}"
                         }
                       }

  overdue + dead_animals
rescue ActiveRecord::StatementInvalid, PG::Error
  []
end
```

- [ ] **Step 2: Verify syntax**

```bash
ruby -c app/controllers/concerns/backend/safe_query.rb
```

Expected: `Syntax OK`

- [ ] **Step 3: Rubocop**

```bash
bundle exec rubocop app/controllers/concerns/backend/safe_query.rb -a
```

Expected: no remaining offenses.

- [ ] **Step 4: Commit**

```bash
git add app/controllers/concerns/backend/safe_query.rb
git commit -m "feat: add safe_animals_count and safe_alerts to SafeQuery concern"
```

---

## Task 5: DashboardsController — Wire new props

**Files:**
- Modify: `app/controllers/backend/dashboards_controller.rb`

- [ ] **Step 1: Update the render inertia call in home action**

In `app/controllers/backend/dashboards_controller.rb`, locate the `render inertia:` block inside the `home` method (around line 52). Replace the entire `render inertia:` call with:

```ruby
render inertia: 'Backend/Dashboard/Home', props: {
  kpis: {
    campaign:          safe_campaign_json,
    area_ha:           safe_area_ha,
    interventions:     safe_intervention_counts,
    expenses_xof:      nil,
    workers_count:     safe_workers_count,
    productions_count: safe_productions_count,
    animals_count:     safe_animals_count
  },
  parcelles:       parcelles,
  recent_activity: recent,
  weather:         weather_data,
  farm: {
    name:     safe_company_name,
    locale:   I18n.locale.to_s,
    timezone: Time.zone.name
  },
  alerts: safe_alerts
}
```

- [ ] **Step 2: Verify Ruby syntax**

```bash
ruby -c app/controllers/backend/dashboards_controller.rb
```

Expected: `Syntax OK`

- [ ] **Step 3: Full vitest suite check**

```bash
yarn vitest run app/frontend/pages/Backend/Dashboard/ --reporter=verbose
```

Expected: **9/9 PASS**

- [ ] **Step 4: Full TypeScript check**

```bash
yarn tsc --noEmit
```

Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add app/controllers/backend/dashboards_controller.rb
git commit -m "feat: wire animals_count and alerts props into DashboardsController#home"
```
