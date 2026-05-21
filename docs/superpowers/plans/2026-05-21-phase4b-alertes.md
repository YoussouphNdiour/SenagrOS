# Phase 4B — Page Alertes système — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Nouvelle page `/backend/alerts` avec alertes opérationnelles calculées + lien nav AppShell.

**Architecture:** Nouveau `AlertsController` + `AlertesIndex` page + types. AppShell enrichi. Pas de modèle Alert persisté.

**Tech Stack:** React 18, TypeScript strict, Inertia.js v2, Vitest, Ruby on Rails 6 (Ruby 2.6)

---

## File Structure

```
app/frontend/types/alerte.ts                              ← new
app/frontend/pages/Backend/Alertes/Index.test.tsx         ← new (6 tests, TDD first)
app/frontend/pages/Backend/Alertes/Index.tsx              ← new
app/controllers/backend/alerts_controller.rb              ← new
app/frontend/components/AppShell.tsx                      ← add Bell + Alertes nav link
config/routes.rb                                          ← add GET /backend/alerts
```

---

## Task 1: TypeScript Types

**Files:**
- Create: `app/frontend/types/alerte.ts`

- [ ] **Step 1: Create alerte.ts**

```typescript
export type AlerteType = 'intervention_overdue' | 'animal_dead' | 'worker_departed'

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

- [ ] **Step 2: TypeScript check**

```bash
yarn tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add app/frontend/types/alerte.ts
git commit -m "feat: add alerte TypeScript types"
```

---

## Task 2: TDD — Failing Tests First

**Files:**
- Create: `app/frontend/pages/Backend/Alertes/Index.test.tsx`

- [ ] **Step 1: Create test file**

```typescript
import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import AlertesIndex from './Index'
import type { AlertesIndexProps } from '../../../types/alerte'

vi.mock('@inertiajs/react', () => ({
  usePage: () => ({ props: {}, url: '/backend/alerts' }),
}))

const mockAlertes: AlertesIndexProps['alertes'] = [
  {
    id: 1,
    type: 'intervention_overdue',
    label: 'Semis mil',
    href: '/backend/interventions/1',
    detail: 'commencée il y a 10 jours',
    severity: 'medium',
  },
  {
    id: 2,
    type: 'animal_dead',
    label: 'Bœuf Zébu 01',
    href: '/backend/animals/2',
    detail: 'décédé le 01/05/2026',
    severity: 'medium',
  },
]

const mockCounts: AlertesIndexProps['counts'] = {
  intervention_overdue: 1,
  animal_dead: 1,
  worker_departed: 0,
}

describe('AlertesIndex', () => {
  it('renders Alertes heading', () => {
    render(<AlertesIndex alertes={mockAlertes} counts={mockCounts} />)
    expect(screen.getByRole('heading', { name: /alertes/i })).toBeInTheDocument()
  })

  it('renders summary bar with counts per type', () => {
    render(<AlertesIndex alertes={mockAlertes} counts={mockCounts} />)
    expect(screen.getByText(/Interventions en retard\s*:\s*1/i)).toBeInTheDocument()
  })

  it('renders alert label as a link with correct href', () => {
    render(<AlertesIndex alertes={mockAlertes} counts={mockCounts} />)
    const link = screen.getByRole('link', { name: 'Semis mil' })
    expect(link).toHaveAttribute('href', '/backend/interventions/1')
  })

  it('renders alert detail text', () => {
    render(<AlertesIndex alertes={mockAlertes} counts={mockCounts} />)
    expect(screen.getByText('commencée il y a 10 jours')).toBeInTheDocument()
  })

  it('shows Retard badge for intervention_overdue alerts', () => {
    render(<AlertesIndex alertes={mockAlertes} counts={mockCounts} />)
    expect(screen.getByText('Retard')).toBeInTheDocument()
  })

  it('shows empty state when alertes array is empty', () => {
    render(<AlertesIndex alertes={[]} counts={{ intervention_overdue: 0, animal_dead: 0, worker_departed: 0 }} />)
    expect(screen.getByText(/Aucune alerte/)).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run tests — confirm all 6 FAIL**

```bash
yarn vitest run app/frontend/pages/Backend/Alertes/Index.test.tsx 2>&1 | tail -10
```

Expected: 6 failing (module not found).

- [ ] **Step 3: Commit failing tests**

```bash
git add app/frontend/pages/Backend/Alertes/Index.test.tsx
git commit -m "test: add 6 failing AlertesIndex tests (TDD red)"
```

---

## Task 3: AlertesIndex Component

**Files:**
- Create: `app/frontend/pages/Backend/Alertes/Index.tsx`

- [ ] **Step 1: Create Index.tsx**

```tsx
import type { ReactNode } from 'react'
import { CheckCircle } from 'lucide-react'
import { AppShell } from '../../../components/AppShell'
import type { AlerteType, AlertesIndexProps } from '../../../types/alerte'

const ALERT_ORDER: AlerteType[] = ['intervention_overdue', 'animal_dead', 'worker_departed']

const TYPE_CONFIG: Record<AlerteType, { label: string; sectionTitle: string; bg: string; color: string }> = {
  intervention_overdue: { label: 'Retard',  sectionTitle: 'Interventions en retard',       bg: '#fef9c3', color: '#854d0e' },
  animal_dead:          { label: 'Décès',   sectionTitle: 'Animaux récemment décédés',     bg: '#fee2e2', color: '#991b1b' },
  worker_departed:      { label: 'Départ',  sectionTitle: 'Travailleurs récemment partis', bg: '#ede9fe', color: '#5b21b6' },
}

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
          return (
            <span
              key={type}
              style={{ background: cfg.bg, color: cfg.color, padding: '0.25rem 0.875rem', borderRadius: '9999px', fontSize: '0.875rem', fontWeight: 600 }}
            >
              {cfg.sectionTitle} : {counts[type]}
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

- [ ] **Step 2: Run tests — confirm 6/6 pass**

```bash
yarn vitest run app/frontend/pages/Backend/Alertes/Index.test.tsx --reporter=verbose
```

Expected: **6/6 PASS**

- [ ] **Step 3: TypeScript check**

```bash
yarn tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add app/frontend/pages/Backend/Alertes/Index.tsx
git commit -m "feat: implement AlertesIndex page — 6/6 tests pass"
```

---

## Task 4: AppShell + Route

**Files:**
- Modify: `app/frontend/components/AppShell.tsx`
- Modify: `config/routes.rb`

- [ ] **Step 1: Add Bell to lucide-react import in AppShell.tsx**

Locate the lucide-react import (line 4). Add `Bell` to the existing import list:

```typescript
import {
  LayoutDashboard, Wrench, Map, Sprout, BookOpen, Settings, Calendar, Users,
  Tractor, UserCog, PawPrint, Activity, ShoppingCart, ShoppingBag, Package, Bell,
} from 'lucide-react'
```

- [ ] **Step 2: Add Alertes entry to NAV_LINKS**

After the Catalogue entry (line 22), add:

```typescript
{ href: '/backend/alerts', label: 'Alertes', icon: Bell },
```

- [ ] **Step 3: Add route in config/routes.rb**

Inside `namespace :backend do` block, add (e.g., after the `resources :products` line):

```ruby
get 'alerts', to: 'alerts#index', as: :backend_alerts_page
```

- [ ] **Step 4: Verify route**

```bash
bundle exec rails routes | grep alerts
```

Expected: line containing `backend_alerts_page GET /backend/alerts`

- [ ] **Step 5: TypeScript check**

```bash
yarn tsc --noEmit
```

Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add app/frontend/components/AppShell.tsx config/routes.rb
git commit -m "feat: add Alertes nav link to AppShell and /backend/alerts route"
```

---

## Task 5: Rails Controller

**Files:**
- Create: `app/controllers/backend/alerts_controller.rb`

- [ ] **Step 1: Create alerts_controller.rb**

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
                              { id: i.id, type: 'intervention_overdue', label: i.name,
                                href: "/backend/interventions/#{i.id}",
                                detail: "commencée il y a #{days} jour#{days > 1 ? 's' : ''}",
                                severity: days > 14 ? 'high' : 'medium' }
                            }

      dead_animals = Animal.where('dead_at IS NOT NULL')
                           .where('dead_at >= ?', 30.days.ago)
                           .order(dead_at: :desc)
                           .limit(10)
                           .select { |a| a.name.present? }
                           .map { |a|
                             { id: a.id, type: 'animal_dead', label: a.name,
                               href: "/backend/animals/#{a.id}",
                               detail: "décédé le #{a.dead_at.to_date.strftime('%d/%m/%Y')}",
                               severity: 'medium' }
                           }

      departed_workers = Worker.where('dead_at IS NOT NULL')
                               .where('dead_at >= ?', 30.days.ago)
                               .order(dead_at: :desc)
                               .limit(10)
                               .select { |w| w.name.present? }
                               .map { |w|
                                 { id: w.id, type: 'worker_departed', label: w.name,
                                   href: "/backend/workers/#{w.id}",
                                   detail: "parti le #{w.dead_at.to_date.strftime('%d/%m/%Y')}",
                                   severity: 'low' }
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

- [ ] **Step 2: Verify syntax**

```bash
ruby -c app/controllers/backend/alerts_controller.rb
```

Expected: `Syntax OK`

- [ ] **Step 3: Rubocop**

```bash
bundle exec rubocop app/controllers/backend/alerts_controller.rb -a
```

Expected: no remaining offenses.

- [ ] **Step 4: Full vitest run**

```bash
yarn vitest run 2>&1 | tail -10
```

Expected: all tests pass (no regressions).

- [ ] **Step 5: Final TypeScript check**

```bash
yarn tsc --noEmit
```

Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add app/controllers/backend/alerts_controller.rb
git commit -m "feat: add AlertsController with computed operational alerts"
```
