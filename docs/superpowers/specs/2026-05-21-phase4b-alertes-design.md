# Phase 4B — Page Alertes système : Design Spec

> **For agentic workers:** Use `superpowers:subagent-driven-development` or `superpowers:executing-plans` to implement the plan derived from this spec.

**Goal:** Créer une page `/backend/alerts` dédiée aux alertes opérationnelles de la ferme — interventions en retard, animaux récemment décédés, travailleurs récemment partis. La page est read-only, calculée à chaque requête depuis les modèles existants. Pas de modèle `Alert` persisté (YAGNI). Lien "Alertes" ajouté dans l'AppShell.

**Architecture:** Nouveau contrôleur `AlertsController`, nouvelle page `AlertesIndex`, nouveau type `alerte.ts`. Le concern `SafeQuery` n'est pas utilisé ici (les requêtes sont propres au controller). AppShell reçoit un nouveau lien de navigation. Pas de badge dynamique (polling = YAGNI).

**Tech Stack:** React 18, TypeScript strict, `@inertiajs/react`, Vitest + React Testing Library, Ruby on Rails 6 (Ruby 2.6).

---

## File Structure

```
app/frontend/types/alerte.ts                              ← new
app/frontend/pages/Backend/Alertes/Index.tsx              ← new
app/frontend/pages/Backend/Alertes/Index.test.tsx         ← new (6 tests)
app/controllers/backend/alerts_controller.rb              ← new
app/frontend/components/AppShell.tsx                      ← add Alertes nav link
config/routes.rb                                          ← add get 'alerts'
```

---

## TypeScript Types — `types/alerte.ts`

```typescript
export type AlerteType =
  | 'intervention_overdue'
  | 'animal_dead'
  | 'worker_departed'

export interface Alerte {
  id: number
  type: AlerteType
  label: string
  href: string
  detail: string
  severity: 'high' | 'medium' | 'low'
}

export interface AlertesIndexProps {
  alertes: Alerte[]
  counts: {
    intervention_overdue: number
    animal_dead: number
    worker_departed: number
  }
}
```

---

## AlertesIndex — `pages/Backend/Alertes/Index.tsx`

**Heading:** "Alertes"

**Summary bar:** 3 count badges (Interventions en retard | Animaux décédés | Travailleurs partis).

**Type config:**

```typescript
const TYPE_CONFIG: Record<AlerteType, { label: string; bg: string; color: string; sectionTitle: string }> = {
  intervention_overdue: { label: 'Retard',    bg: '#fef9c3', color: '#854d0e', sectionTitle: 'Interventions en retard' },
  animal_dead:          { label: 'Décès',     bg: '#fee2e2', color: '#991b1b', sectionTitle: 'Animaux récemment décédés' },
  worker_departed:      { label: 'Départ',    bg: '#ede9fe', color: '#5b21b6', sectionTitle: 'Travailleurs récemment partis' },
}
```

**Layout:** Grouped by type. Each group = a card with section title, then a list of alert items.

Each alert item:
- Type badge (colored)
- Link to the record (`<a href={alerte.href}>`)
- Detail text (muted)

**Empty state:** When `alertes.length === 0`, show a green "Aucune alerte — tout va bien !" centered message with a `CheckCircle` icon.

**Layout:** `Index.layout = (page: ReactNode) => <AppShell>{page}</AppShell>`

### Full component structure

```tsx
import type { ReactNode } from 'react'
import { CheckCircle } from 'lucide-react'
import { AppShell } from '../../../components/AppShell'
import type { AlertesIndexProps, AlerteType } from '../../../types/alerte'

const TYPE_CONFIG: Record<AlerteType, { label: string; bg: string; color: string; sectionTitle: string }> = {
  intervention_overdue: { label: 'Retard',  bg: '#fef9c3', color: '#854d0e', sectionTitle: 'Interventions en retard' },
  animal_dead:          { label: 'Décès',   bg: '#fee2e2', color: '#991b1b', sectionTitle: 'Animaux récemment décédés' },
  worker_departed:      { label: 'Départ',  bg: '#ede9fe', color: '#5b21b6', sectionTitle: 'Travailleurs récemment partis' },
}

const ALERT_ORDER: AlerteType[] = ['intervention_overdue', 'animal_dead', 'worker_departed']

export default function AlertesIndex({ alertes, counts }: AlertesIndexProps) {
  const card: React.CSSProperties = {
    background: 'var(--color-bg-card)',
    borderRadius: '0.5rem',
    border: '1px solid var(--color-border)',
    padding: '1rem 1.25rem',
    marginBottom: '1rem',
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4" style={{ color: 'var(--color-text)' }}>
        Alertes
      </h1>

      {/* Summary bar */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        {ALERT_ORDER.map(type => {
          const cfg = TYPE_CONFIG[type]
          const count = counts[type]
          return (
            <span
              key={type}
              style={{ background: cfg.bg, color: cfg.color, padding: '0.25rem 0.875rem', borderRadius: '9999px', fontSize: '0.875rem', fontWeight: 600 }}
            >
              {cfg.sectionTitle} : {count}
            </span>
          )
        })}
      </div>

      {alertes.length === 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem', padding: '3rem 0', color: '#16a34a' }}>
          <CheckCircle size={40} />
          <p className="text-base font-medium">Aucune alerte — tout va bien !</p>
        </div>
      ) : (
        ALERT_ORDER.map(type => {
          const cfg = TYPE_CONFIG[type]
          const group = alertes.filter(a => a.type === type)
          if (group.length === 0) return null
          return (
            <div key={type} style={card}>
              <h2 className="text-sm font-semibold mb-3" style={{ color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {cfg.sectionTitle}
              </h2>
              <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                {group.map(alerte => (
                  <li key={alerte.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <span style={{ background: cfg.bg, color: cfg.color, fontSize: '0.7rem', fontWeight: 600, padding: '0.125rem 0.5rem', borderRadius: '9999px' }}>
                      {cfg.label}
                    </span>
                    <a href={alerte.href} style={{ color: 'var(--color-primary)', textDecoration: 'none', fontWeight: 500, fontSize: '0.9rem' }}>
                      {alerte.label}
                    </a>
                    <span style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>{alerte.detail}</span>
                  </li>
                ))}
              </ul>
            </div>
          )
        })
      )}
    </div>
  )
}

AlertesIndex.layout = (page: ReactNode) => <AppShell>{page}</AppShell>
```

---

## Tests — `pages/Backend/Alertes/Index.test.tsx` (6 tests)

```typescript
import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import AlertesIndex from './Index'
import type { AlertesIndexProps } from '../../../types/alerte'

vi.mock('@inertiajs/react', () => ({ usePage: () => ({ props: {}, url: '/backend/alerts' }) }))

const mockCounts = { intervention_overdue: 1, animal_dead: 1, worker_departed: 0 }

const mockAlertes = [
  { id: 1, type: 'intervention_overdue' as const, label: 'Semis mil', href: '/backend/interventions/1', detail: 'commencée il y a 8 jours', severity: 'high' as const },
  { id: 2, type: 'animal_dead' as const, label: 'Bœuf Zébu 01', href: '/backend/animals/2', detail: 'décédé le 10/05/2026', severity: 'medium' as const },
]

function renderIndex(overrides: Partial<AlertesIndexProps> = {}) {
  return render(<AlertesIndex alertes={mockAlertes} counts={mockCounts} {...overrides} />)
}
```

**Test 1:** Renders "Alertes" heading
```typescript
it('renders Alertes heading', () => {
  renderIndex()
  expect(screen.getByRole('heading', { name: 'Alertes' })).toBeInTheDocument()
})
```

**Test 2:** Renders summary bar counts
```typescript
it('renders summary bar with type counts', () => {
  renderIndex()
  expect(screen.getByText(/Interventions en retard : 1/)).toBeInTheDocument()
  expect(screen.getByText(/Animaux récemment décédés : 1/)).toBeInTheDocument()
})
```

**Test 3:** Renders alert label as link
```typescript
it('renders alert label as link', () => {
  renderIndex()
  const link = screen.getByRole('link', { name: 'Semis mil' })
  expect(link.getAttribute('href')).toBe('/backend/interventions/1')
})
```

**Test 4:** Renders alert detail text
```typescript
it('renders alert detail text', () => {
  renderIndex()
  expect(screen.getByText('commencée il y a 8 jours')).toBeInTheDocument()
})
```

**Test 5:** Renders "Retard" badge for overdue intervention
```typescript
it('renders Retard badge for overdue intervention', () => {
  renderIndex()
  expect(screen.getByText('Retard')).toBeInTheDocument()
})
```

**Test 6:** Shows empty state when no alerts
```typescript
it('shows empty state when no alertes', () => {
  renderIndex({ alertes: [], counts: { intervention_overdue: 0, animal_dead: 0, worker_departed: 0 } })
  expect(screen.getByText(/Aucune alerte/)).toBeInTheDocument()
})
```

---

## Rails Controller — `alerts_controller.rb`

```ruby
module Backend
  class AlertsController < Backend::BaseController
    layout 'inertia', only: [:index]

    def index
      overdue = Intervention.where(state: 'in_progress')
                            .where('started_at < ?', 7.days.ago)
                            .order(started_at: :asc)
                            .limit(10)
                            .select { |i| i.name.present? }
                            .map { |i|
                              days = ((Time.zone.now - i.started_at) / 86400).round
                              {
                                id: i.id,
                                type: 'intervention_overdue',
                                label: i.name,
                                href: "/backend/interventions/#{i.id}",
                                detail: "commencée il y a #{days} jour#{days > 1 ? 's' : ''}",
                                severity: days > 14 ? 'high' : 'medium'
                              }
                            }

      dead_animals = Animal.where('dead_at IS NOT NULL')
                           .where('dead_at >= ?', 30.days.ago)
                           .order(dead_at: :desc)
                           .limit(10)
                           .select { |a| a.name.present? }
                           .map { |a|
                             {
                               id: a.id,
                               type: 'animal_dead',
                               label: a.name,
                               href: "/backend/animals/#{a.id}",
                               detail: "décédé le #{a.dead_at.to_date.strftime('%d/%m/%Y')}",
                               severity: 'medium'
                             }
                           }

      departed_workers = Worker.where('dead_at IS NOT NULL')
                               .where('dead_at >= ?', 30.days.ago)
                               .order(dead_at: :desc)
                               .limit(10)
                               .select { |w| w.name.present? }
                               .map { |w|
                                 {
                                   id: w.id,
                                   type: 'worker_departed',
                                   label: w.name,
                                   href: "/backend/workers/#{w.id}",
                                   detail: "parti le #{w.dead_at.to_date.strftime('%d/%m/%Y')}",
                                   severity: 'low'
                                 }
                               }

      alertes = overdue + dead_animals + departed_workers

      render inertia: 'Backend/Alertes/Index', props: {
        alertes: alertes,
        counts: {
          intervention_overdue: overdue.size,
          animal_dead: dead_animals.size,
          worker_departed: departed_workers.size
        }
      }
    rescue ActiveRecord::StatementInvalid, PG::Error
      render inertia: 'Backend/Alertes/Index', props: {
        alertes: [],
        counts: { intervention_overdue: 0, animal_dead: 0, worker_departed: 0 }
      }
    end
  end
end
```

**Ruby 2.6 constraints:** No `filter_map`, `then`, `yield_self`. Use `.select { }.map { }` as shown.

---

## Routes — `config/routes.rb`

Find the `namespace :backend do` block. Add **before** the closing `end` of the backend namespace (after the existing `resources :workers` line, anywhere within the namespace):

```ruby
get 'alerts', to: 'alerts#index', as: :backend_alerts_page
```

**Note:** Cannot use `as: :backend_alerts` because Rails may auto-generate that name from `resources :alerts`. Using `as: :backend_alerts_page` avoids collision.

---

## AppShell Navigation — `components/AppShell.tsx`

Add `Bell` to the lucide-react import:

```typescript
import {
  LayoutDashboard, Wrench, Map, Sprout, BookOpen, Settings, Calendar, Users,
  Tractor, UserCog, PawPrint, Activity, ShoppingCart, ShoppingBag, Package, Bell,
} from 'lucide-react'
```

Add to `NAV_LINKS` array, after the Catalogue entry:

```typescript
{ href: '/backend/alerts', label: 'Alertes', icon: Bell },
```

---

## Scope Exclusions (YAGNI)

- Pas de badge de comptage sur le lien "Alertes" dans la nav (nécessiterait shared props ou polling)
- Pas de filtres ou de tri sur la page Alertes
- Pas de notification push / temps réel
- Pas de model `Alert` persisté — calculé à chaque requête
- `severity` est inclus dans les props mais pas utilisé pour le tri (YAGNI)
- Pas de pagination (limité à 10 par type = max 30 alertes affichées)
- Stock épuisé exclu (complexité ProductPopulation hors scope)
