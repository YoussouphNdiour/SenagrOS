# Alertes + Issues Fusion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fusionner les Issues Ekylibre (problèmes terrain) dans le module Alertes existant : section "Problèmes signalés" dans AlertesIndex, plus pages IssueShow et IssueForm en React/Inertia.

**Architecture:** Le controller `alerts_controller.rb` passe les 10 issues ouvertes triées par gravité dans les props Inertia existantes. Le controller `issues_controller.rb` override `show/new/create/edit/update` pour rendre des pages React, tout en conservant `manage_restfully` pour les autres actions. Les 3 nouvelles pages React vivent dans `app/frontend/pages/Backend/Alertes/`.

**Tech Stack:** Rails 6 + Ruby 2.6 | React 18 + TypeScript strict | Inertia.js v2 | Tailwind CSS + CSS variables | Vitest + @testing-library/react

---

## File Map

| Fichier | Action |
|---|---|
| `app/frontend/types/issue.ts` | Créer — types IssueItem, IssueShowItem, IssueFormItem, IssueFormErrors, IssueShowProps, IssueFormProps, ISSUE_NATURE_LABELS, ISSUE_STATE_LABELS |
| `app/frontend/types/alerte.ts` | Modifier — ajouter `IssueItem` re-export + `issues: IssueItem[]` dans `AlertesIndexProps` |
| `app/frontend/pages/Backend/Alertes/Index.tsx` | Modifier — bouton "Signaler", section "Problèmes signalés" |
| `app/frontend/pages/Backend/Alertes/Index.test.tsx` | Modifier — ajouter tests issues |
| `app/frontend/pages/Backend/Alertes/IssueShow.tsx` | Créer — page détail issue |
| `app/frontend/pages/Backend/Alertes/IssueShow.test.tsx` | Créer — tests IssueShow |
| `app/frontend/pages/Backend/Alertes/IssueForm.tsx` | Créer — formulaire new/edit issue |
| `app/frontend/pages/Backend/Alertes/IssueForm.test.tsx` | Créer — tests IssueForm |
| `app/controllers/backend/alerts_controller.rb` | Modifier — ajouter prop `issues` |
| `app/controllers/backend/issues_controller.rb` | Modifier — ajouter `layout 'inertia'` + override 5 actions |

---

## Task 1: Types Issue

**Files:**
- Create: `app/frontend/types/issue.ts`

- [ ] **Step 1: Créer le fichier de types**

```typescript
// app/frontend/types/issue.ts

export interface IssueItem {
  id: number
  name: string
  nature: string
  gravity: number
  observed_at: string | null
  state: string
}

export interface IssueShowItem {
  id: number
  name: string
  nature: string
  gravity: number
  observed_at: string | null
  state: 'opened' | 'closed' | 'aborted'
  description: string | null
  target_type: string | null
  target_id: number | null
}

export interface IssueShowProps {
  issue: IssueShowItem
}

export interface IssueFormItem {
  id?: number
  name: string
  nature: string
  gravity: number
  observed_at: string
  description: string | null
  state?: string
}

export interface IssueFormErrors {
  name?: string
  nature?: string
  gravity?: string
  observed_at?: string
}

export interface IssueFormProps {
  issue: IssueFormItem | null
  errors: IssueFormErrors
}

export const ISSUE_NATURE_LABELS: Record<string, string> = {
  accident:                         'Accident',
  climate_issue:                    'Incident climatique',
  disease:                          'Maladie',
  drought:                          'Sécheresse',
  escape:                           'Fuite d\'animaux',
  equipment_crash:                  'Accident matériel',
  empty_fuel_tank:                  'Panne sèche',
  aphid:                            'Puceron',
  caterpillar:                      'Chenilles',
  cotton_bollworm:                  'Noctuelle défoliatrice',
  bacteria_disease:                 'Bactériose',
  bacterial_disease:                'Maladie bactérienne',
  bad_vegetative_growth_conditions: 'Mauvais état végétatif',
  diarrhea:                         'Diarrhée',
  cough:                            'Toux',
}

export const ISSUE_STATE_LABELS: Record<string, string> = {
  opened:  'Ouvert',
  closed:  'Fermé',
  aborted: 'Abandonné',
}
```

- [ ] **Step 2: Vérifier TypeScript**

```bash
cd /Users/yusper/Downloads/SenagrOS/ekylibre-main
yarn tsc --noEmit
```

Attendu : aucune erreur.

- [ ] **Step 3: Commit**

```bash
git add app/frontend/types/issue.ts
git commit -m "feat: add Issue types (IssueItem, IssueShowItem, IssueFormItem, labels)"
```

---

## Task 2: Étendre `alerte.ts` + `alerts_controller.rb`

**Files:**
- Modify: `app/frontend/types/alerte.ts`
- Modify: `app/controllers/backend/alerts_controller.rb`

- [ ] **Step 1: Écrire le test qui va échouer (type check)**

Dans `app/frontend/pages/Backend/Alertes/Index.test.tsx`, ajouter `issues: []` au mock par défaut de `renderIndex`. Pour l'instant le compilateur va refuser car `AlertesIndexProps` ne contient pas encore `issues`.

```typescript
// Dans Index.test.tsx — modifier renderIndex :
function renderIndex(overrides: Partial<AlertesIndexProps> = {}) {
  return render(<AlertesIndex alertes={mockAlertes} counts={mockCounts} issues={[]} {...overrides} />)
}
```

- [ ] **Step 2: Vérifier que tsc échoue**

```bash
yarn tsc --noEmit 2>&1 | grep issues
```

Attendu : erreur TypeScript sur `issues` propriété inconnue.

- [ ] **Step 3: Mettre à jour `alerte.ts`**

Remplacer le contenu de `app/frontend/types/alerte.ts` :

```typescript
import type { IssueItem } from './issue'

export type { IssueItem }

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
  issues: IssueItem[]
}
```

- [ ] **Step 4: Vérifier que tsc passe**

```bash
yarn tsc --noEmit
```

Attendu : aucune erreur.

- [ ] **Step 5: Mettre à jour `alerts_controller.rb`**

Ouvrir `app/controllers/backend/alerts_controller.rb`. Dans l'action `index`, juste avant `render inertia:`, ajouter le bloc issues. Remplacer le bloc `render inertia:` existant (lignes 48–55) par :

```ruby
      issues = Issue.where(state: 'opened')
                    .order(gravity: :desc)
                    .limit(10)
                    .map { |i|
                      {
                        id:          i.id,
                        name:        i.name,
                        nature:      i.nature.to_s,
                        gravity:     i.gravity.to_i,
                        observed_at: i.observed_at&.to_date&.iso8601,
                        state:       i.state.to_s
                      }
                    }

      render inertia: 'Backend/Alertes/Index', props: {
        alertes: alertes,
        counts: {
          intervention_overdue: overdue.size,
          animal_dead: dead_animals.size,
          worker_departed: departed_workers.size
        },
        issues: issues
      }
```

Le `rescue` existant doit aussi retourner `issues: []` — remplacer le render dans le rescue :

```ruby
      render inertia: 'Backend/Alertes/Index', props: {
        alertes: [],
        counts: { intervention_overdue: 0, animal_dead: 0, worker_departed: 0 },
        issues: []
      }
```

Note Ruby 2.6 : pas de `filter_map`, pas de `then`. La chaîne `.where.order.limit.map` est correcte.

- [ ] **Step 6: Run tests**

```bash
cd /Users/yusper/Downloads/SenagrOS/ekylibre-main
yarn vitest run app/frontend/pages/Backend/Alertes/Index.test.tsx --reporter=verbose
```

Attendu : tous les tests passent (le renderIndex avec `issues={[]}` compile désormais).

- [ ] **Step 7: Commit**

```bash
git add app/frontend/types/alerte.ts app/controllers/backend/alerts_controller.rb app/frontend/pages/Backend/Alertes/Index.test.tsx
git commit -m "feat: extend AlertesIndexProps with issues prop + populate in alerts_controller"
```

---

## Task 3: AlertesIndex — section Issues + bouton Signaler

**Files:**
- Modify: `app/frontend/pages/Backend/Alertes/Index.tsx`
- Modify: `app/frontend/pages/Backend/Alertes/Index.test.tsx`

- [ ] **Step 1: Écrire les tests qui vont échouer**

Ajouter dans `Index.test.tsx` (après les tests existants) :

```typescript
import type { IssueItem } from '../../../types/issue'

const mockIssue: IssueItem = {
  id: 1,
  name: 'Attaque criquet',
  nature: 'aphid',
  gravity: 4,
  observed_at: '2026-05-10',
  state: 'opened',
}

it('affiche la section Problèmes signalés', () => {
  renderIndex({ issues: [] })
  expect(screen.getByText('Problèmes signalés')).toBeInTheDocument()
})

it('affiche "Aucun problème signalé" quand issues est vide', () => {
  renderIndex({ issues: [] })
  expect(screen.getByText('Aucun problème signalé')).toBeInTheDocument()
})

it('affiche un issue dans la liste', () => {
  renderIndex({ issues: [mockIssue] })
  expect(screen.getByText('Attaque criquet')).toBeInTheDocument()
})

it('affiche le bouton Signaler un problème', () => {
  renderIndex({ issues: [] })
  const link = screen.getByRole('link', { name: /Signaler un problème/ })
  expect(link).toHaveAttribute('href', '/backend/issues/new')
})
```

- [ ] **Step 2: Vérifier que les tests échouent**

```bash
yarn vitest run app/frontend/pages/Backend/Alertes/Index.test.tsx --reporter=verbose
```

Attendu : 4 nouveaux tests FAIL.

- [ ] **Step 3: Mettre à jour `Index.tsx`**

Remplacer le contenu complet de `app/frontend/pages/Backend/Alertes/Index.tsx` :

```tsx
import type { ReactNode } from 'react'
import { CheckCircle, Plus } from 'lucide-react'
import { AppShell } from '../../../components/AppShell'
import type { AlertesIndexProps } from '../../../types/alerte'
import type { IssueItem } from '../../../types/issue'
import { ISSUE_NATURE_LABELS } from '../../../types/issue'

const TYPE_CONFIG: Record<string, { label: string; bg: string; color: string; sectionTitle: string }> = {
  intervention_overdue: { label: 'Retard',  bg: '#fef9c3', color: '#854d0e', sectionTitle: 'Interventions en retard' },
  animal_dead:          { label: 'Décès',   bg: '#fee2e2', color: '#991b1b', sectionTitle: 'Animaux récemment décédés' },
  worker_departed:      { label: 'Départ',  bg: '#ede9fe', color: '#5b21b6', sectionTitle: 'Travailleurs récemment partis' },
}

const ALERT_ORDER = ['intervention_overdue', 'animal_dead', 'worker_departed']

const SEVERITY_COLOR: Record<string, string> = {
  high:   '#dc2626',
  medium: '#f59e0b',
  low:    '#6b7280',
}

function gravityColor(gravity: number): string {
  if (gravity >= 5) return '#dc2626'
  if (gravity === 4) return '#f97316'
  if (gravity === 3) return '#f59e0b'
  return '#6b7280'
}

export default function AlertesIndex({ alertes, counts, issues }: AlertesIndexProps) {
  const card: React.CSSProperties = {
    background: 'var(--color-bg-card)',
    borderRadius: '0.5rem',
    border: '1px solid var(--color-border)',
    padding: '1rem 1.25rem',
    marginBottom: '1rem',
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>
          Alertes
        </h1>
        <a
          href="/backend/issues/new"
          className="flex items-center gap-2 px-3 py-2 rounded text-sm font-medium no-underline"
          style={{
            background: 'var(--color-primary)',
            color: '#fff',
          }}
        >
          <Plus size={15} />
          Signaler un problème
        </a>
      </div>

      {/* Summary bar */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        {ALERT_ORDER.map(type => {
          const cfg = TYPE_CONFIG[type]
          const count = counts[type as keyof typeof counts]
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
                    <span
                      aria-label={`Sévérité ${alerte.severity}`}
                      style={{ width: '8px', height: '8px', borderRadius: '50%', flexShrink: 0, background: SEVERITY_COLOR[alerte.severity] ?? '#6b7280' }}
                    />
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

      {/* Section Problèmes signalés */}
      <div style={card}>
        <h2 className="text-sm font-semibold mb-3" style={{ color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Problèmes signalés
        </h2>
        {issues.length === 0 ? (
          <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>Aucun problème signalé</p>
        ) : (
          <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
            {issues.map((issue: IssueItem) => (
              <li key={issue.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    flexShrink: 0,
                    background: gravityColor(issue.gravity),
                  }}
                />
                <span
                  style={{
                    background: gravityColor(issue.gravity),
                    color: '#fff',
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    padding: '0.125rem 0.5rem',
                    borderRadius: '9999px',
                  }}
                >
                  {issue.gravity}
                </span>
                <a
                  href={`/backend/issues/${issue.id}`}
                  style={{ color: 'var(--color-primary)', textDecoration: 'none', fontWeight: 500, fontSize: '0.9rem' }}
                >
                  {issue.name}
                </a>
                <span style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>
                  {ISSUE_NATURE_LABELS[issue.nature] ?? issue.nature}
                  {issue.observed_at ? ` — ${issue.observed_at}` : ''}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

AlertesIndex.layout = (page: ReactNode) => <AppShell>{page}</AppShell>
```

- [ ] **Step 4: Vérifier que les tests passent**

```bash
yarn vitest run app/frontend/pages/Backend/Alertes/Index.test.tsx --reporter=verbose
```

Attendu : tous les tests PASS (anciens + 4 nouveaux).

- [ ] **Step 5: TypeCheck**

```bash
yarn tsc --noEmit
```

Attendu : aucune erreur.

- [ ] **Step 6: Commit**

```bash
git add app/frontend/pages/Backend/Alertes/Index.tsx app/frontend/pages/Backend/Alertes/Index.test.tsx
git commit -m "feat: add issues section and Signaler button to AlertesIndex"
```

---

## Task 4: IssueShow — page + tests

**Files:**
- Create: `app/frontend/pages/Backend/Alertes/IssueShow.tsx`
- Create: `app/frontend/pages/Backend/Alertes/IssueShow.test.tsx`

- [ ] **Step 1: Écrire les tests (fichier complet)**

Créer `app/frontend/pages/Backend/Alertes/IssueShow.test.tsx` :

```tsx
import React from 'react'
import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import IssueShow from './IssueShow'
import type { IssueShowProps } from '../../../types/issue'

vi.mock('@inertiajs/react', () => ({
  router: { post: vi.fn() },
}))

const mockIssue: IssueShowProps['issue'] = {
  id: 1,
  name: 'Attaque criquet',
  nature: 'aphid',
  gravity: 4,
  observed_at: '2026-05-10',
  state: 'opened',
  description: 'Forte présence dans la parcelle nord.',
  target_type: null,
  target_id: null,
}

function renderShow(overrides: Partial<IssueShowProps['issue']> = {}) {
  return render(<IssueShow issue={{ ...mockIssue, ...overrides }} />)
}

describe('IssueShow', () => {
  it('affiche le nom de l\'issue', () => {
    renderShow()
    expect(screen.getByRole('heading', { name: 'Attaque criquet' })).toBeInTheDocument()
  })

  it('affiche le badge état Ouvert', () => {
    renderShow()
    expect(screen.getByText('Ouvert')).toBeInTheDocument()
  })

  it('affiche la description', () => {
    renderShow()
    expect(screen.getByText('Forte présence dans la parcelle nord.')).toBeInTheDocument()
  })

  it('affiche les boutons Fermer et Abandonner quand état = opened', () => {
    renderShow({ state: 'opened' })
    expect(screen.getByRole('button', { name: /Fermer/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Abandonner/ })).toBeInTheDocument()
  })

  it('n\'affiche pas Fermer si état = closed', () => {
    renderShow({ state: 'closed' })
    expect(screen.queryByRole('button', { name: /Fermer/ })).not.toBeInTheDocument()
  })

  it('affiche le lien Retour aux alertes', () => {
    renderShow()
    const link = screen.getByRole('link', { name: /Retour aux alertes/ })
    expect(link).toHaveAttribute('href', '/backend/alerts')
  })

  it('affiche le lien Modifier', () => {
    renderShow()
    const link = screen.getByRole('link', { name: /Modifier/ })
    expect(link).toHaveAttribute('href', '/backend/issues/1/edit')
  })
})
```

- [ ] **Step 2: Vérifier que les tests échouent**

```bash
yarn vitest run app/frontend/pages/Backend/Alertes/IssueShow.test.tsx --reporter=verbose
```

Attendu : FAIL avec "Cannot find module './IssueShow'".

- [ ] **Step 3: Créer `IssueShow.tsx`**

Créer `app/frontend/pages/Backend/Alertes/IssueShow.tsx` :

```tsx
import type { ReactNode } from 'react'
import { ArrowLeft } from 'lucide-react'
import { router } from '@inertiajs/react'
import { AppShell } from '../../../components/AppShell'
import type { IssueShowProps } from '../../../types/issue'
import { ISSUE_NATURE_LABELS, ISSUE_STATE_LABELS } from '../../../types/issue'

function gravityColor(gravity: number): string {
  if (gravity >= 5) return '#dc2626'
  if (gravity === 4) return '#f97316'
  if (gravity === 3) return '#f59e0b'
  return '#6b7280'
}

function stateBg(state: string): string {
  if (state === 'opened') return '#fef9c3'
  if (state === 'closed') return '#dcfce7'
  return '#f3f4f6'
}

function stateColor(state: string): string {
  if (state === 'opened') return '#854d0e'
  if (state === 'closed') return '#166534'
  return '#4b5563'
}

export default function IssueShow({ issue }: IssueShowProps) {
  const card: React.CSSProperties = {
    background: 'var(--color-bg-card)',
    borderRadius: '0.5rem',
    border: '1px solid var(--color-border)',
    padding: '1rem 1.25rem',
    marginBottom: '1rem',
  }

  function handleClose() {
    router.post(`/backend/issues/${issue.id}/close`)
  }

  function handleAbort() {
    router.post(`/backend/issues/${issue.id}/abort`)
  }

  return (
    <div className="p-8 max-w-2xl">
      {/* Retour */}
      <div className="mb-4">
        <a
          href="/backend/alerts"
          className="flex items-center gap-1 text-sm no-underline"
          style={{ color: 'var(--color-text-muted)' }}
        >
          <ArrowLeft size={15} />
          Retour aux alertes
        </a>
      </div>

      {/* Titre + état */}
      <div className="flex items-center gap-3 mb-6">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>
          {issue.name}
        </h1>
        <span
          style={{
            background: stateBg(issue.state),
            color: stateColor(issue.state),
            fontSize: '0.75rem',
            fontWeight: 600,
            padding: '0.125rem 0.625rem',
            borderRadius: '9999px',
          }}
        >
          {ISSUE_STATE_LABELS[issue.state] ?? issue.state}
        </span>
      </div>

      {/* Header card */}
      <div style={card}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem' }}>
          <div>
            <p className="text-xs font-semibold uppercase" style={{ color: 'var(--color-text-muted)' }}>Nature</p>
            <p className="text-sm font-medium mt-0.5" style={{ color: 'var(--color-text)' }}>
              {ISSUE_NATURE_LABELS[issue.nature] ?? issue.nature}
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase" style={{ color: 'var(--color-text-muted)' }}>Gravité</p>
            <span
              style={{
                display: 'inline-block',
                marginTop: '0.125rem',
                background: gravityColor(issue.gravity),
                color: '#fff',
                fontSize: '0.75rem',
                fontWeight: 700,
                padding: '0.125rem 0.5rem',
                borderRadius: '9999px',
              }}
            >
              {issue.gravity}
            </span>
          </div>
          {issue.observed_at && (
            <div>
              <p className="text-xs font-semibold uppercase" style={{ color: 'var(--color-text-muted)' }}>Date observée</p>
              <p className="text-sm font-medium mt-0.5" style={{ color: 'var(--color-text)' }}>{issue.observed_at}</p>
            </div>
          )}
        </div>
      </div>

      {/* Description */}
      {issue.description && (
        <div style={card}>
          <p className="text-xs font-semibold uppercase mb-2" style={{ color: 'var(--color-text-muted)' }}>Description</p>
          <p className="text-sm" style={{ color: 'var(--color-text)' }}>{issue.description}</p>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-3 mt-4">
        <a
          href={`/backend/issues/${issue.id}/edit`}
          className="px-3 py-2 rounded text-sm font-medium no-underline"
          style={{
            background: 'var(--color-primary)',
            color: '#fff',
          }}
        >
          Modifier
        </a>
        {issue.state === 'opened' && (
          <>
            <button
              type="button"
              onClick={handleClose}
              className="px-3 py-2 rounded text-sm font-medium"
              style={{
                background: 'var(--color-success-bg)',
                color: 'var(--color-success-text)',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              Fermer
            </button>
            <button
              type="button"
              onClick={handleAbort}
              className="px-3 py-2 rounded text-sm font-medium"
              style={{
                background: 'var(--color-bg-card)',
                color: 'var(--color-text-muted)',
                border: '1px solid var(--color-border)',
                cursor: 'pointer',
              }}
            >
              Abandonner
            </button>
          </>
        )}
      </div>
    </div>
  )
}

IssueShow.layout = (page: ReactNode) => <AppShell>{page}</AppShell>
```

- [ ] **Step 4: Vérifier que les tests passent**

```bash
yarn vitest run app/frontend/pages/Backend/Alertes/IssueShow.test.tsx --reporter=verbose
```

Attendu : 7 tests PASS.

- [ ] **Step 5: TypeCheck**

```bash
yarn tsc --noEmit
```

- [ ] **Step 6: Commit**

```bash
git add app/frontend/pages/Backend/Alertes/IssueShow.tsx app/frontend/pages/Backend/Alertes/IssueShow.test.tsx
git commit -m "feat: add IssueShow page with state badge and action buttons"
```

---

## Task 5: IssueForm — formulaire new/edit + tests

**Files:**
- Create: `app/frontend/pages/Backend/Alertes/IssueForm.tsx`
- Create: `app/frontend/pages/Backend/Alertes/IssueForm.test.tsx`

- [ ] **Step 1: Écrire les tests**

Créer `app/frontend/pages/Backend/Alertes/IssueForm.test.tsx` :

```tsx
import React from 'react'
import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import IssueForm from './IssueForm'
import type { IssueFormItem } from '../../../types/issue'

vi.mock('@inertiajs/react', () => ({
  router: { post: vi.fn(), patch: vi.fn() },
}))

const mockIssue: IssueFormItem = {
  id: 1,
  name: 'Attaque criquet',
  nature: 'aphid',
  gravity: 3,
  observed_at: '2026-05-10',
  description: 'Description test',
  state: 'opened',
}

describe('IssueForm — création', () => {
  it('affiche "Nouveau problème" en mode création', () => {
    render(<IssueForm issue={null} errors={{}} />)
    expect(screen.getByRole('heading', { name: /Nouveau problème/ })).toBeInTheDocument()
  })

  it('affiche le champ Nom', () => {
    render(<IssueForm issue={null} errors={{}} />)
    expect(screen.getByLabelText(/Nom/)).toBeInTheDocument()
  })

  it('le select nature contient Accident', () => {
    render(<IssueForm issue={null} errors={{}} />)
    expect(screen.getByRole('option', { name: 'Accident' })).toBeInTheDocument()
  })

  it('affiche une erreur si name manquant (erreur serveur)', () => {
    render(<IssueForm issue={null} errors={{ name: 'est obligatoire' }} />)
    expect(screen.getByText('est obligatoire')).toBeInTheDocument()
  })
})

describe('IssueForm — édition', () => {
  it('affiche "Modifier" en mode édition', () => {
    render(<IssueForm issue={mockIssue} errors={{}} />)
    expect(screen.getByRole('heading', { name: /Modifier/ })).toBeInTheDocument()
  })

  it('pré-remplit le champ name', () => {
    render(<IssueForm issue={mockIssue} errors={{}} />)
    expect(screen.getByDisplayValue('Attaque criquet')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Vérifier que les tests échouent**

```bash
yarn vitest run app/frontend/pages/Backend/Alertes/IssueForm.test.tsx --reporter=verbose
```

Attendu : FAIL "Cannot find module './IssueForm'".

- [ ] **Step 3: Créer `IssueForm.tsx`**

Créer `app/frontend/pages/Backend/Alertes/IssueForm.tsx` :

```tsx
import type { ReactNode } from 'react'
import { useState } from 'react'
import { router } from '@inertiajs/react'
import { ArrowLeft, Save } from 'lucide-react'
import { AppShell } from '../../../components/AppShell'
import type { IssueFormProps } from '../../../types/issue'
import { ISSUE_NATURE_LABELS } from '../../../types/issue'

const today = new Date().toISOString().split('T')[0]

const errorStyle: React.CSSProperties = {
  fontSize: '11px',
  color: 'var(--color-danger)',
  marginTop: '4px',
}

const GRAVITY_COLOR: Record<number, string> = {
  1: '#6b7280',
  2: '#6b7280',
  3: '#f59e0b',
  4: '#f97316',
  5: '#dc2626',
}

export default function IssueForm({ issue, errors }: IssueFormProps) {
  const isEdit = issue !== null

  const [name, setName] = useState(issue?.name ?? '')
  const [nature, setNature] = useState(issue?.nature ?? '')
  const [gravity, setGravity] = useState<number>(issue?.gravity ?? 1)
  const [observedAt, setObservedAt] = useState(issue?.observed_at ?? today)
  const [description, setDescription] = useState(issue?.description ?? '')
  const [submitting, setSubmitting] = useState(false)

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSubmitting(true)
    const data = {
      issue: {
        name,
        nature,
        gravity,
        observed_at: observedAt,
        description: description || null,
      },
    }
    if (isEdit) {
      router.patch(`/backend/issues/${issue!.id}`, data, { onFinish: () => setSubmitting(false) })
    } else {
      router.post('/backend/issues', data, { onFinish: () => setSubmitting(false) })
    }
  }

  const inputStyle: React.CSSProperties = {
    border: '1px solid var(--color-border)',
    background: 'var(--color-bg)',
    color: 'var(--color-text)',
    outline: 'none',
  }

  return (
    <div className="p-8 max-w-xl">
      {/* Retour */}
      <div className="mb-4">
        <a
          href="/backend/alerts"
          className="flex items-center gap-1 text-sm no-underline"
          style={{ color: 'var(--color-text-muted)' }}
        >
          <ArrowLeft size={15} />
          Retour aux alertes
        </a>
      </div>

      <h1 className="text-2xl font-bold mb-6" style={{ color: 'var(--color-text)' }}>
        {isEdit ? `Modifier — ${issue!.name}` : 'Nouveau problème'}
      </h1>

      <div
        className="rounded-lg p-6"
        style={{
          background: 'var(--color-bg-card)',
          border: '1px solid var(--color-border)',
          boxShadow: 'var(--shadow-card)',
        }}
      >
        <form onSubmit={handleSubmit} noValidate>
          <div className="flex flex-col gap-5">
            {/* Nom */}
            <div>
              <label htmlFor="issue-name" className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text)' }}>
                Nom <span style={{ color: 'var(--color-danger)' }}>*</span>
              </label>
              <input
                id="issue-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full rounded px-3 py-2 text-sm"
                style={inputStyle}
                placeholder="ex. Attaque criquet"
              />
              {errors.name && <p style={errorStyle}>{errors.name}</p>}
            </div>

            {/* Nature */}
            <div>
              <label htmlFor="issue-nature" className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text)' }}>
                Nature <span style={{ color: 'var(--color-danger)' }}>*</span>
              </label>
              <select
                id="issue-nature"
                value={nature}
                onChange={(e) => setNature(e.target.value)}
                className="w-full rounded px-3 py-2 text-sm"
                style={inputStyle}
              >
                <option value="">— Choisir une nature —</option>
                {Object.entries(ISSUE_NATURE_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
              {errors.nature && <p style={errorStyle}>{errors.nature}</p>}
            </div>

            {/* Gravité */}
            <div>
              <p className="text-sm font-medium mb-2" style={{ color: 'var(--color-text)' }}>
                Gravité <span style={{ color: 'var(--color-danger)' }}>*</span>
              </p>
              <div className="flex gap-2">
                {([1, 2, 3, 4, 5] as const).map(g => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setGravity(g)}
                    className="w-10 h-10 rounded-full text-sm font-bold"
                    style={{
                      background: gravity === g ? GRAVITY_COLOR[g] : 'var(--color-bg-card)',
                      color: gravity === g ? '#fff' : GRAVITY_COLOR[g],
                      border: `2px solid ${GRAVITY_COLOR[g]}`,
                      cursor: 'pointer',
                    }}
                  >
                    {g}
                  </button>
                ))}
              </div>
              {errors.gravity && <p style={errorStyle}>{errors.gravity}</p>}
            </div>

            {/* Date observée */}
            <div>
              <label htmlFor="issue-date" className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text)' }}>
                Date observée <span style={{ color: 'var(--color-danger)' }}>*</span>
              </label>
              <input
                id="issue-date"
                type="date"
                value={observedAt}
                onChange={(e) => setObservedAt(e.target.value)}
                className="w-full rounded px-3 py-2 text-sm"
                style={inputStyle}
              />
              {errors.observed_at && <p style={errorStyle}>{errors.observed_at}</p>}
            </div>

            {/* Description */}
            <div>
              <label htmlFor="issue-desc" className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text)' }}>
                Description
              </label>
              <textarea
                id="issue-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full rounded px-3 py-2 text-sm"
                style={{ ...inputStyle, resize: 'vertical' }}
                placeholder="Description optionnelle…"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 mt-6 pt-5" style={{ borderTop: '1px solid var(--color-border)' }}>
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-2 px-4 py-2 rounded text-sm font-medium"
              style={{
                background: 'var(--color-primary)',
                color: '#fff',
                border: 'none',
                cursor: submitting ? 'not-allowed' : 'pointer',
                opacity: submitting ? 0.7 : 1,
              }}
            >
              <Save size={15} />
              Enregistrer
            </button>
            <a
              href="/backend/alerts"
              className="px-4 py-2 rounded text-sm font-medium no-underline"
              style={{
                background: 'var(--color-bg-card)',
                border: '1px solid var(--color-border)',
                color: 'var(--color-text)',
              }}
            >
              Annuler
            </a>
          </div>
        </form>
      </div>
    </div>
  )
}

IssueForm.layout = (page: ReactNode) => <AppShell>{page}</AppShell>
```

- [ ] **Step 4: Vérifier que les tests passent**

```bash
yarn vitest run app/frontend/pages/Backend/Alertes/IssueForm.test.tsx --reporter=verbose
```

Attendu : 6 tests PASS.

- [ ] **Step 5: TypeCheck**

```bash
yarn tsc --noEmit
```

- [ ] **Step 6: Commit**

```bash
git add app/frontend/pages/Backend/Alertes/IssueForm.tsx app/frontend/pages/Backend/Alertes/IssueForm.test.tsx
git commit -m "feat: add IssueForm page (new/edit) with nature select and gravity picker"
```

---

## Task 6: `issues_controller.rb` — override Inertia actions

**Files:**
- Modify: `app/controllers/backend/issues_controller.rb`

Aucun test Ruby nécessaire ici (pas de RSpec pour les controllers Inertia dans ce projet). La validation est faite en vérifiant les types TypeScript côté frontend.

**Important :** Ne PAS supprimer `manage_restfully`, `manage_restfully_picture`, `list`, `unroll` — ils sont nécessaires pour la vue HAML index et l'action `destroy`. On ajoute nos overrides APRÈS `manage_restfully` (c'est le pattern du fichier : `def new` existant était déjà après `manage_restfully`). En Ruby, la dernière définition de méthode gagne.

- [ ] **Step 1: Ajouter `layout 'inertia'` après la déclaration de classe**

Ouvrir `app/controllers/backend/issues_controller.rb`. Après la ligne `class IssuesController < Backend::BaseController`, ajouter :

```ruby
    layout 'inertia', only: %i[show new edit]
```

- [ ] **Step 2: Remplacer `def new` existant et ajouter les autres overrides**

Dans le même fichier, remplacer le bloc `def new ... end` existant (lignes 49–78) par les 5 méthodes suivantes. Placer après les macros `list(:interventions...)` et avant `def close` :

```ruby
    def show
      return unless @issue = find_and_check(:issue)
      render inertia: 'Backend/Alertes/IssueShow', props: {
        issue: issue_json(@issue)
      }
    end

    def new
      render inertia: 'Backend/Alertes/IssueForm', props: {
        issue: nil,
        errors: {}
      }
    end

    def create
      @issue = Issue.new(
        name:        params.dig(:issue, :name),
        nature:      params.dig(:issue, :nature),
        gravity:     params.dig(:issue, :gravity).to_i,
        observed_at: params.dig(:issue, :observed_at).presence || Time.zone.now,
        description: params.dig(:issue, :description).presence,
        state:       'opened'
      )
      if @issue.save
        redirect_to backend_issue_path(@issue)
      else
        render inertia: 'Backend/Alertes/IssueForm', props: {
          issue: nil,
          errors: @issue.errors.messages.each_with_object({}) { |(k, v), h| h[k.to_s] = v.first }
        }, status: :unprocessable_entity
      end
    end

    def edit
      return unless @issue = find_and_check(:issue)
      render inertia: 'Backend/Alertes/IssueForm', props: {
        issue: issue_json(@issue),
        errors: {}
      }
    end

    def update
      return unless @issue = find_and_check(:issue)
      @issue.name        = params.dig(:issue, :name) if params.dig(:issue, :name).present?
      @issue.nature      = params.dig(:issue, :nature) if params.dig(:issue, :nature).present?
      @issue.gravity     = params.dig(:issue, :gravity).to_i
      @issue.observed_at = params.dig(:issue, :observed_at).presence || @issue.observed_at
      @issue.description = params.dig(:issue, :description).presence
      if @issue.save
        redirect_to backend_issue_path(@issue)
      else
        render inertia: 'Backend/Alertes/IssueForm', props: {
          issue: issue_json(@issue),
          errors: @issue.errors.messages.each_with_object({}) { |(k, v), h| h[k.to_s] = v.first }
        }, status: :unprocessable_entity
      end
    end
```

- [ ] **Step 3: Ajouter `issue_json` dans la section `private`**

À la fin du fichier, juste avant le `end` final de la classe, ajouter :

```ruby
    private

      def issue_json(issue)
        {
          id:          issue.id,
          name:        issue.name,
          nature:      issue.nature.to_s,
          gravity:     issue.gravity.to_i,
          observed_at: issue.observed_at&.to_date&.iso8601,
          state:       issue.state.to_s,
          description: issue.description,
          target_type: issue.target_type,
          target_id:   issue.target_id
        }
      end
```

Note Ruby 2.6 : `params.dig(:issue, :name)` ✅, `.presence` ✅, `.each_with_object` ✅. Pas de `filter_map`, pas de `then`.

> ⚠️ Si le projet a des specs RSpec pour ce controller, vérifier qu'elles passent :
> `bundle exec rspec spec/controllers/backend/issues_controller_spec.rb`
> Sinon ignorer.

- [ ] **Step 2: TypeCheck final + tous les tests frontend**

```bash
yarn tsc --noEmit
yarn vitest run app/frontend/pages/Backend/Alertes/ --reporter=verbose
```

Attendu : 0 erreurs TypeScript, tous les tests Alertes/ PASS.

- [ ] **Step 3: Commit**

```bash
git add app/controllers/backend/issues_controller.rb
git commit -m "feat: override IssuesController show/new/create/edit/update to render Inertia pages"
```

---

## Task 7: Suite de tests complète

- [ ] **Step 1: Lancer tous les tests frontend**

```bash
yarn vitest run --reporter=verbose 2>&1 | tail -30
```

Attendu : tous les tests PASS, 0 failures.

- [ ] **Step 2: TypeCheck global**

```bash
yarn tsc --noEmit
```

Attendu : aucune erreur.
