# Phase 4A — Dashboard KPIs enrichis + Alertes : Design Spec

> **For agentic workers:** Use `superpowers:subagent-driven-development` or `superpowers:executing-plans` to implement the plan derived from this spec.

**Goal:** Enrichir le Dashboard existant avec (1) un KPI "Animaux vivants", (2) une section "Alertes" affichant les interventions en retard et les animaux récemment décédés. Aucun nouveau module — tout se greffe sur `DashboardsController#home` et `Dashboard/Home.tsx`.

**Architecture:** Extension pure. On ajoute `safe_animals_count` et `safe_alerts` au concern `SafeQuery`, on enrichit les props Inertia de `home`, on étend les types TS, et on ajoute une section Alertes dans Home.tsx. Pas de nouveau contrôleur, pas de nouvelle page.

**Tech Stack:** React 18, TypeScript strict, `@inertiajs/react`, Vitest + React Testing Library, Ruby on Rails 6 (Ruby 2.6).

---

## File Structure

```
app/controllers/concerns/backend/safe_query.rb   ← add safe_animals_count + safe_alerts
app/controllers/backend/dashboards_controller.rb ← add animals_count + alerts to home props
app/frontend/types/dashboard.ts                  ← add DashboardAlert + extend KpiData + DashboardHomeProps
app/frontend/pages/Backend/Dashboard/Home.tsx    ← add Animaux KPI + Alertes section
app/frontend/pages/Backend/Dashboard/Home.test.tsx ← add 4 tests (existing 5 must still pass)
```

---

## TypeScript Types — `types/dashboard.ts`

Extend the existing file. Add at the end:

```typescript
export interface DashboardAlert {
  type: 'intervention_overdue' | 'animal_dead'
  label: string
  href: string
  detail: string  // human-readable context (e.g. "commencée il y a 12 jours")
}
```

Extend `KpiData` — add `animals_count` field:

```typescript
export interface KpiData {
  campaign: Campaign | null
  area_ha: number
  interventions: { active: number; scheduled: number }
  expenses_xof: number | null
  workers_count: number
  productions_count: number
  animals_count: number  // ← new
}
```

Extend `DashboardHomeProps` — add `alerts`:

```typescript
export interface DashboardHomeProps {
  kpis: KpiData
  parcelles: Parcelle[]
  recent_activity: RecentIntervention[]
  weather: WeatherData | null
  farm: FarmInfo
  alerts: DashboardAlert[]  // ← new
}
```

---

## Rails Concern — `safe_query.rb`

Add two new methods after `safe_campaign_json`:

```ruby
# Animaux vivants (dead_at IS NULL)
def safe_animals_count
  Animal.where(dead_at: nil).count
rescue ActiveRecord::StatementInvalid, PG::Error
  0
end

# Alertes combinées : interventions en retard + animaux récemment décédés
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

**Ruby 2.6 constraints:** No `filter_map`, `then`, `yield_self`. Use `.select { }.map { }` as shown.

---

## Rails Controller — `dashboards_controller.rb`

In the `home` action, extend the `kpis` hash and add `alerts` prop:

```ruby
render inertia: 'Backend/Dashboard/Home', props: {
  kpis: {
    campaign:          safe_campaign_json,
    area_ha:           safe_area_ha,
    interventions:     safe_intervention_counts,
    expenses_xof:      nil,
    workers_count:     safe_workers_count,
    productions_count: safe_productions_count,
    animals_count:     safe_animals_count  # ← new
  },
  parcelles:       parcelles,
  recent_activity: recent,
  weather:         weather_data,
  farm: {
    name:     safe_company_name,
    locale:   I18n.locale.to_s,
    timezone: Time.zone.name
  },
  alerts: safe_alerts  # ← new
}
```

---

## Home.tsx — Changes

### New import
```typescript
import { PawPrint, AlertTriangle } from 'lucide-react'
```
(Add `PawPrint` and `AlertTriangle` to the existing lucide-react import line.)

### New KpiCard — Animaux vivants

Add a 7th KpiCard in the existing 3-column grid (after "Productions"):

```tsx
<KpiCard
  title="Animaux vivants"
  value={kpis.animals_count}
  icon={<PawPrint size={16} />}
/>
```

The grid now has 7 cards — 3+3+1. The last row will have 1 card occupying 1/3 width (natural CSS grid behaviour, no change needed).

### New Alertes section

Add below the ActivityFeed, only when `alerts.length > 0`:

```tsx
{alerts.length > 0 && (
  <div
    style={{
      background: 'var(--color-bg-card)',
      borderRadius: '0.5rem',
      border: '1px solid #fca5a5',
      padding: '1rem 1.25rem',
      marginTop: '16px',
    }}
  >
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.75rem' }}>
      <AlertTriangle size={16} color="#dc2626" />
      <h2 style={{ fontSize: '0.9375rem', fontWeight: 600, color: '#dc2626', margin: 0 }}>
        Alertes ({alerts.length})
      </h2>
    </div>
    <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      {alerts.map((alert, i) => (
        <li key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span
            style={{
              fontSize: '0.7rem',
              fontWeight: 600,
              padding: '0.125rem 0.5rem',
              borderRadius: '9999px',
              background: alert.type === 'intervention_overdue' ? '#fef9c3' : '#fee2e2',
              color: alert.type === 'intervention_overdue' ? '#854d0e' : '#991b1b',
            }}
          >
            {alert.type === 'intervention_overdue' ? 'Retard' : 'Décès'}
          </span>
          <a href={alert.href} style={{ color: 'var(--color-primary)', textDecoration: 'none', fontWeight: 500, fontSize: '0.9rem' }}>
            {alert.label}
          </a>
          <span style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>{alert.detail}</span>
        </li>
      ))}
    </ul>
  </div>
)}
```

### Updated function signature

```tsx
function Home({ kpis, parcelles, recent_activity, weather, farm, alerts }: DashboardHomeProps) {
```

---

## Tests — `Home.test.tsx` (4 new tests, existing 5 must pass)

Update `defaultProps` to add the new required fields:

```typescript
const defaultProps: DashboardHomeProps = {
  kpis: {
    campaign: { name: 'Hivernage 2025', started_on: '2025-06-01', stopped_on: null },
    area_ha: 12.5,
    interventions: { active: 3, scheduled: 2 },
    expenses_xof: null,
    workers_count: 5,
    productions_count: 3,
    animals_count: 8,   // ← new
  },
  // ...
  alerts: [],           // ← new (empty → section hidden)
}
```

**Test 6:** KPI "Animaux vivants" renders
```typescript
it('renders Animaux vivants KPI', () => {
  render(<Home {...defaultProps} />)
  expect(screen.getByText('Animaux vivants')).toBeInTheDocument()
  expect(screen.getByText('8')).toBeInTheDocument()
})
```

**Test 7:** Alertes section hidden when alerts is empty
```typescript
it('hides alertes section when alerts is empty', () => {
  render(<Home {...defaultProps} />)
  expect(screen.queryByText(/Alertes/)).not.toBeInTheDocument()
})
```

**Test 8:** Alertes section renders when alerts provided
```typescript
it('renders alertes section with alert items', () => {
  const propsWithAlerts: DashboardHomeProps = {
    ...defaultProps,
    alerts: [
      { type: 'intervention_overdue', label: 'Semis mil', href: '/backend/interventions/1', detail: 'commencée il y a 8 jours' },
    ],
  }
  render(<Home {...propsWithAlerts} />)
  expect(screen.getByText(/Alertes/)).toBeInTheDocument()
  expect(screen.getByText('Semis mil')).toBeInTheDocument()
  expect(screen.getByText('commencée il y a 8 jours')).toBeInTheDocument()
})
```

**Test 9:** Alert badge shows correct type label
```typescript
it('shows Retard badge for intervention_overdue alert', () => {
  const propsWithAlerts: DashboardHomeProps = {
    ...defaultProps,
    alerts: [
      { type: 'intervention_overdue', label: 'Sarclage', href: '/backend/interventions/2', detail: 'commencée il y a 10 jours' },
    ],
  }
  render(<Home {...propsWithAlerts} />)
  expect(screen.getByText('Retard')).toBeInTheDocument()
})
```

---

## Scope Exclusions (YAGNI)

- Pas de KPI "stock épuisé" (complexité ProductPopulation — hors scope)
- Pas de lien "Voir toutes les alertes" (page Alertes = Phase 4B, indépendante)
- Pas de comptage d'alertes dans le badge AppShell
- Pas de filtre ou tri des alertes sur le dashboard
- `expenses_xof` reste `nil` (pas de comptabilité analytique dans cette phase)
