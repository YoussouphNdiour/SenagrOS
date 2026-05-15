# Interventions Index — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrer la page `/backend/interventions` (index HAML) vers React 18 + Inertia.js, avec table filtrée, kanban counts et map overlay GeoJSON.

**Architecture:** Inertia router visits pour les filtres (URL bookmarkable, SQL réutilisé côté Rails). Page shell `Index.tsx` légère qui délègue à 4 composants dédiés. Un seul hook `useInterventionFilters` appelle `router.visit`.

**Tech Stack:** React 18, TypeScript strict, Inertia.js v2, TanStack Table v8, react-leaflet v4, Vitest + Testing Library, RSpec + FactoryBot.

---

## Fichiers touchés

| Action | Chemin |
|---|---|
| **Supprimer** | `app/frontend/pages/Interventions/types.ts` |
| **Créer** | `app/frontend/types/intervention.ts` |
| **Créer** | `app/frontend/hooks/useInterventionFilters.ts` |
| **Créer** | `app/frontend/components/interventions/InterventionFilterPanel.test.tsx` |
| **Créer** | `app/frontend/components/interventions/InterventionFilterPanel.tsx` |
| **Créer** | `app/frontend/components/interventions/InterventionTable.test.tsx` |
| **Créer** | `app/frontend/components/interventions/InterventionTable.tsx` |
| **Créer** | `app/frontend/components/interventions/InterventionKanban.test.tsx` |
| **Créer** | `app/frontend/components/interventions/InterventionKanban.tsx` |
| **Créer** | `app/frontend/components/interventions/InterventionMap.test.tsx` |
| **Créer** | `app/frontend/components/interventions/InterventionMap.tsx` |
| **Créer** | `app/frontend/pages/Backend/Interventions/Index.test.tsx` |
| **Créer** | `app/frontend/pages/Backend/Interventions/Index.tsx` |
| **Modifier** | `app/controllers/backend/interventions_controller.rb` |
| **Créer** | `spec/controllers/backend/interventions_controller_spec.rb` |

---

## Task 0 : Cleanup + Types

**Files:**
- Delete: `app/frontend/pages/Interventions/types.ts`
- Create: `app/frontend/types/intervention.ts`

- [ ] **Supprimer le fichier de types obsolète**

```bash
rm app/frontend/pages/Interventions/types.ts
# Vérifier
ls app/frontend/pages/Interventions/ 2>/dev/null || echo "Dossier vide/supprimé — OK"
```

- [ ] **Créer `app/frontend/types/intervention.ts`**

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
  page?: number
}

export interface InterventionIndexProps {
  interventions: Intervention[]
  kanban: {
    planned:     number
    in_progress: number
    done:        number
    validated:   number
  }
  map_geojson: GeoJSON.FeatureCollection
  filters: InterventionFilters
  meta: {
    total:      number
    page:       number
    per_page:   number
    procedures: Array<{ label: string; value: string }>
  }
}
```

- [ ] **TypeCheck**

```bash
yarn tsc --noEmit
# Attendu : aucune erreur
```

- [ ] **Commit**

```bash
git add app/frontend/types/intervention.ts
git rm app/frontend/pages/Interventions/types.ts
git commit -m "refactor: move intervention types to types/intervention.ts"
```

---

## Task 1 : Hook `useInterventionFilters`

**Files:**
- Create: `app/frontend/hooks/useInterventionFilters.ts`

> Pas de test unitaire pour ce hook — il est une fine couche sur `router.visit` (testé dans les tests d'intégration de la page Index).

- [ ] **Créer `app/frontend/hooks/useInterventionFilters.ts`**

```typescript
import { router } from '@inertiajs/react'
import type { InterventionFilters } from '../types/intervention'

export function useInterventionFilters(current: InterventionFilters) {
  const applyFilters = (patch: Partial<InterventionFilters>) => {
    router.visit(window.location.pathname, {
      method: 'get',
      data: { ...current, ...patch },
      preserveState:  true,
      preserveScroll: true,
      replace:        true,
    })
  }

  return { applyFilters }
}
```

- [ ] **TypeCheck**

```bash
yarn tsc --noEmit
# Attendu : aucune erreur
```

- [ ] **Commit**

```bash
git add app/frontend/hooks/useInterventionFilters.ts
git commit -m "feat: add useInterventionFilters hook"
```

---

## Task 2 : InterventionFilterPanel

**Files:**
- Create: `app/frontend/components/interventions/InterventionFilterPanel.test.tsx`
- Create: `app/frontend/components/interventions/InterventionFilterPanel.tsx`

- [ ] **Écrire le test (TDD — avant le composant)**

Créer `app/frontend/components/interventions/InterventionFilterPanel.test.tsx` :

```typescript
import { render, screen, fireEvent } from '@testing-library/react'
import { InterventionFilterPanel } from './InterventionFilterPanel'
import type { InterventionFilters } from '../../types/intervention'

const defaultMeta = {
  procedures: [
    { label: 'Semis', value: 'sowing' },
    { label: 'Traitement', value: 'spraying' },
  ],
}

describe('InterventionFilterPanel', () => {
  it('affiche le champ de recherche texte', () => {
    render(
      <InterventionFilterPanel
        filters={{}}
        meta={defaultMeta}
        onChange={() => {}}
      />
    )
    expect(screen.getByPlaceholderText(/rechercher/i)).toBeInTheDocument()
  })

  it('affiche la valeur courante du filtre texte', () => {
    const filters: InterventionFilters = { q: 'semis' }
    render(
      <InterventionFilterPanel filters={filters} meta={defaultMeta} onChange={() => {}} />
    )
    expect(screen.getByDisplayValue('semis')).toBeInTheDocument()
  })

  it('affiche le sélecteur d\'état', () => {
    render(
      <InterventionFilterPanel filters={{}} meta={defaultMeta} onChange={() => {}} />
    )
    expect(screen.getByLabelText(/état/i)).toBeInTheDocument()
  })

  it('appelle onChange avec le nouvel état sélectionné', () => {
    const onChange = vi.fn()
    render(
      <InterventionFilterPanel filters={{}} meta={defaultMeta} onChange={onChange} />
    )
    fireEvent.change(screen.getByLabelText(/état/i), { target: { value: 'done' } })
    expect(onChange).toHaveBeenCalledWith({ state: ['done'], page: 1 })
  })

  it('appelle onChange avec nature vide quand "Toutes" est sélectionné', () => {
    const onChange = vi.fn()
    render(
      <InterventionFilterPanel
        filters={{ nature: ['record'] }}
        meta={defaultMeta}
        onChange={onChange}
      />
    )
    fireEvent.change(screen.getByLabelText(/nature/i), { target: { value: '' } })
    expect(onChange).toHaveBeenCalledWith({ nature: undefined, page: 1 })
  })

  it('affiche le bouton Réinitialiser quand un filtre est actif', () => {
    render(
      <InterventionFilterPanel
        filters={{ q: 'test' }}
        meta={defaultMeta}
        onChange={() => {}}
      />
    )
    expect(screen.getByText(/réinitialiser/i)).toBeInTheDocument()
  })

  it('n\'affiche pas Réinitialiser quand aucun filtre n\'est actif', () => {
    render(
      <InterventionFilterPanel filters={{}} meta={defaultMeta} onChange={() => {}} />
    )
    expect(screen.queryByText(/réinitialiser/i)).not.toBeInTheDocument()
  })

  it('appelle onChange avec tous les filtres vides au clic sur Réinitialiser', () => {
    const onChange = vi.fn()
    render(
      <InterventionFilterPanel
        filters={{ q: 'test', state: ['done'] }}
        meta={defaultMeta}
        onChange={onChange}
      />
    )
    fireEvent.click(screen.getByText(/réinitialiser/i))
    expect(onChange).toHaveBeenCalledWith({
      q: undefined, state: undefined, nature: undefined,
      procedure_name_id: undefined, page: 1,
    })
  })
})
```

- [ ] **Vérifier que le test échoue**

```bash
yarn vitest run app/frontend/components/interventions/InterventionFilterPanel.test.tsx
# Attendu : FAIL — "Cannot find module './InterventionFilterPanel'"
```

- [ ] **Implémenter `InterventionFilterPanel.tsx`**

```typescript
import { useState, useEffect } from 'react'
import type { InterventionFilters } from '../../types/intervention'

interface InterventionFilterPanelProps {
  filters: InterventionFilters
  meta: { procedures: Array<{ label: string; value: string }> }
  onChange: (patch: Partial<InterventionFilters>) => void
}

const hasActive = (f: InterventionFilters) =>
  !!(f.q || f.state?.length || f.nature?.length || f.procedure_name_id?.length)

export function InterventionFilterPanel({ filters, meta, onChange }: InterventionFilterPanelProps) {
  const [textValue, setTextValue] = useState(filters.q ?? '')

  // Debounce 300ms sur la recherche texte
  useEffect(() => {
    const timer = setTimeout(() => {
      if (textValue !== (filters.q ?? '')) {
        onChange({ q: textValue || undefined, page: 1 })
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [textValue])

  return (
    <div
      style={{
        background: 'var(--color-bg-card)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-card)',
        padding: '12px 16px',
        display: 'flex',
        flexWrap: 'wrap',
        gap: '8px',
        alignItems: 'center',
      }}
    >
      <input
        type="text"
        placeholder="Rechercher..."
        value={textValue}
        onChange={e => setTextValue(e.target.value)}
        style={{
          border: '1px solid var(--color-border)',
          borderRadius: '4px',
          padding: '6px 10px',
          fontSize: '13px',
          color: 'var(--color-text)',
          minWidth: '180px',
        }}
      />

      <label htmlFor="filter-state" style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px' }}>
        État
        <select
          id="filter-state"
          aria-label="État"
          value={filters.state?.[0] ?? ''}
          onChange={e =>
            onChange({ state: e.target.value ? [e.target.value] : undefined, page: 1 })
          }
          style={{ border: '1px solid var(--color-border)', borderRadius: '4px', padding: '6px 8px', fontSize: '13px' }}
        >
          <option value="">Tous</option>
          <option value="in_progress">En cours</option>
          <option value="done">Terminé</option>
          <option value="validated">Validé</option>
          <option value="rejected">Rejeté</option>
        </select>
      </label>

      <label htmlFor="filter-nature" style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px' }}>
        Nature
        <select
          id="filter-nature"
          aria-label="Nature"
          value={filters.nature?.[0] ?? ''}
          onChange={e =>
            onChange({ nature: e.target.value ? [e.target.value] : undefined, page: 1 })
          }
          style={{ border: '1px solid var(--color-border)', borderRadius: '4px', padding: '6px 8px', fontSize: '13px' }}
        >
          <option value="">Toutes</option>
          <option value="request">Planifiée</option>
          <option value="record">Réalisée</option>
        </select>
      </label>

      <label htmlFor="filter-procedure" style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px' }}>
        Procédure
        <select
          id="filter-procedure"
          aria-label="Procédure"
          value={filters.procedure_name_id?.[0] ?? ''}
          onChange={e =>
            onChange({ procedure_name_id: e.target.value ? [e.target.value] : undefined, page: 1 })
          }
          style={{ border: '1px solid var(--color-border)', borderRadius: '4px', padding: '6px 8px', fontSize: '13px' }}
        >
          <option value="">Toutes</option>
          {meta.procedures.map(p => (
            <option key={p.value} value={p.value}>{p.label}</option>
          ))}
        </select>
      </label>

      {hasActive(filters) && (
        <button
          onClick={() =>
            onChange({ q: undefined, state: undefined, nature: undefined, procedure_name_id: undefined, page: 1 })
          }
          style={{
            background: 'none',
            border: '1px solid var(--color-border)',
            borderRadius: '4px',
            padding: '6px 10px',
            fontSize: '12px',
            color: 'var(--color-text-muted)',
            cursor: 'pointer',
          }}
        >
          Réinitialiser
        </button>
      )}
    </div>
  )
}
```

- [ ] **Vérifier que les tests passent**

```bash
yarn vitest run app/frontend/components/interventions/InterventionFilterPanel.test.tsx
# Attendu : 7 tests PASS
```

- [ ] **TypeCheck**

```bash
yarn tsc --noEmit
# Attendu : aucune erreur
```

- [ ] **Commit**

```bash
git add app/frontend/components/interventions/InterventionFilterPanel.test.tsx \
        app/frontend/components/interventions/InterventionFilterPanel.tsx
git commit -m "feat: add InterventionFilterPanel component with TDD"
```

---

## Task 3 : InterventionTable

**Files:**
- Create: `app/frontend/components/interventions/InterventionTable.test.tsx`
- Create: `app/frontend/components/interventions/InterventionTable.tsx`

- [ ] **Écrire le test**

Créer `app/frontend/components/interventions/InterventionTable.test.tsx` :

```typescript
import { render, screen, fireEvent } from '@testing-library/react'
import { InterventionTable } from './InterventionTable'
import type { Intervention } from '../../types/intervention'

const makeRow = (overrides: Partial<Intervention> = {}): Intervention => ({
  id: 1,
  procedure_name: 'sowing',
  nature: 'record',
  state: 'done',
  started_at: '2026-01-15T08:00:00Z',
  stopped_at: '2026-01-15T12:00:00Z',
  name: 'Semis blé',
  human_activities_names: 'Céréales',
  human_target_names: 'Parcelle A',
  human_working_duration: '4h',
  human_working_zone_area: '2,50 ha',
  ...overrides,
})

describe('InterventionTable', () => {
  const meta = { total: 1, page: 1, per_page: 25 }

  it('affiche le nom de l\'intervention', () => {
    render(<InterventionTable rows={[makeRow()]} meta={meta} onPage={vi.fn()} />)
    expect(screen.getByText('Semis blé')).toBeInTheDocument()
  })

  it('affiche les activités', () => {
    render(<InterventionTable rows={[makeRow()]} meta={meta} onPage={vi.fn()} />)
    expect(screen.getByText('Céréales')).toBeInTheDocument()
  })

  it('affiche un badge pour l\'état "done"', () => {
    render(<InterventionTable rows={[makeRow({ state: 'done' })]} meta={meta} onPage={vi.fn()} />)
    expect(screen.getByText('Terminé')).toBeInTheDocument()
  })

  it('affiche un badge pour l\'état "in_progress"', () => {
    render(<InterventionTable rows={[makeRow({ state: 'in_progress' })]} meta={meta} onPage={vi.fn()} />)
    expect(screen.getByText('En cours')).toBeInTheDocument()
  })

  it('affiche la date de début formatée', () => {
    render(<InterventionTable rows={[makeRow()]} meta={meta} onPage={vi.fn()} />)
    expect(screen.getByText('15/01/2026')).toBeInTheDocument()
  })

  it('affiche "Aucune intervention" si le tableau est vide', () => {
    render(
      <InterventionTable rows={[]} meta={{ total: 0, page: 1, per_page: 25 }} onPage={vi.fn()} />
    )
    expect(screen.getByText(/aucune intervention/i)).toBeInTheDocument()
  })

  it('désactive le bouton Précédent à la première page', () => {
    render(<InterventionTable rows={[makeRow()]} meta={{ total: 50, page: 1, per_page: 25 }} onPage={vi.fn()} />)
    expect(screen.getByText(/précédent/i)).toBeDisabled()
  })

  it('appelle onPage avec page+1 au clic sur Suivant', () => {
    const onPage = vi.fn()
    render(
      <InterventionTable
        rows={[makeRow()]}
        meta={{ total: 50, page: 1, per_page: 25 }}
        onPage={onPage}
      />
    )
    fireEvent.click(screen.getByText(/suivant/i))
    expect(onPage).toHaveBeenCalledWith({ page: 2 })
  })

  it('désactive le bouton Suivant à la dernière page', () => {
    render(
      <InterventionTable rows={[makeRow()]} meta={{ total: 25, page: 1, per_page: 25 }} onPage={vi.fn()} />
    )
    expect(screen.getByText(/suivant/i)).toBeDisabled()
  })
})
```

- [ ] **Vérifier que le test échoue**

```bash
yarn vitest run app/frontend/components/interventions/InterventionTable.test.tsx
# Attendu : FAIL — "Cannot find module './InterventionTable'"
```

- [ ] **Implémenter `InterventionTable.tsx`**

```typescript
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table'
import type { Intervention, InterventionFilters } from '../../types/intervention'

const STATE_LABELS: Record<string, string> = {
  in_progress: 'En cours',
  done:        'Terminé',
  validated:   'Validé',
  rejected:    'Rejeté',
}

// Leaflet ne supporte pas les CSS vars — même principe ici pour la cohérence
const STATE_COLORS: Record<string, string> = {
  in_progress: '#D4841A',
  done:        '#2D7A3A',
  validated:   '#1B6B3A',
  rejected:    '#D4420A',
}

const columnHelper = createColumnHelper<Intervention>()

const columns = [
  columnHelper.accessor('name', {
    header: 'Nom',
    cell: info => (
      <a
        href={`/backend/interventions/${info.row.original.id}`}
        style={{ color: 'var(--color-primary)', fontWeight: 600, textDecoration: 'none' }}
      >
        {info.getValue()}
      </a>
    ),
  }),
  columnHelper.accessor('human_activities_names', { header: 'Activités' }),
  columnHelper.accessor('started_at', {
    header: 'Début',
    cell: info =>
      new Date(info.getValue()).toLocaleDateString('fr-FR', {
        day: '2-digit', month: '2-digit', year: 'numeric',
      }),
  }),
  columnHelper.accessor('human_working_duration', { header: 'Durée' }),
  columnHelper.accessor('state', {
    header: 'État',
    cell: info => {
      const state = info.getValue()
      return (
        <span
          style={{
            background:   STATE_COLORS[state] ?? '#6B5E4E',
            color:        '#fff',
            borderRadius: '4px',
            padding:      '2px 8px',
            fontSize:     '12px',
            fontWeight:   600,
          }}
        >
          {STATE_LABELS[state] ?? state}
        </span>
      )
    },
  }),
  columnHelper.accessor('human_target_names', { header: 'Cibles' }),
  columnHelper.accessor('human_working_zone_area', { header: 'Surface' }),
]

interface InterventionTableProps {
  rows: Intervention[]
  meta: { total: number; page: number; per_page: number }
  onPage: (patch: Partial<InterventionFilters>) => void
}

export function InterventionTable({ rows, meta, onPage }: InterventionTableProps) {
  const table = useReactTable({
    data:           rows,
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  const totalPages   = Math.ceil(meta.total / meta.per_page)
  const isFirstPage  = meta.page <= 1
  const isLastPage   = meta.page >= totalPages

  if (rows.length === 0) {
    return (
      <div
        style={{
          background:   'var(--color-bg-card)',
          border:       '1px solid var(--color-border)',
          borderRadius: 'var(--radius-card)',
          padding:      '40px',
          textAlign:    'center',
          color:        'var(--color-text-muted)',
        }}
      >
        Aucune intervention trouvée
      </div>
    )
  }

  return (
    <div
      style={{
        background:   'var(--color-bg-card)',
        border:       '1px solid var(--color-border)',
        borderRadius: 'var(--radius-card)',
        overflow:     'hidden',
      }}
    >
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          {table.getHeaderGroups().map(headerGroup => (
            <tr key={headerGroup.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
              {headerGroup.headers.map(header => (
                <th
                  key={header.id}
                  style={{
                    padding:   '10px 12px',
                    textAlign: 'left',
                    fontSize:  '12px',
                    fontWeight: 600,
                    color:     'var(--color-text-muted)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}
                >
                  {flexRender(header.column.columnDef.header, header.getContext())}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row, i) => (
            <tr
              key={row.id}
              style={{
                borderBottom: '1px solid var(--color-border)',
                background:   i % 2 === 0 ? 'var(--color-bg-card)' : 'var(--color-bg)',
              }}
            >
              {row.getVisibleCells().map(cell => (
                <td key={cell.id} style={{ padding: '10px 12px', fontSize: '13px', color: 'var(--color-text)' }}>
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      {/* Pagination */}
      <div
        style={{
          display:        'flex',
          justifyContent: 'space-between',
          alignItems:     'center',
          padding:        '10px 16px',
          borderTop:      '1px solid var(--color-border)',
          fontSize:       '13px',
          color:          'var(--color-text-muted)',
        }}
      >
        <span>{meta.total} résultat{meta.total > 1 ? 's' : ''}</span>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => onPage({ page: meta.page - 1 })}
            disabled={isFirstPage}
            style={{
              padding:    '4px 10px',
              border:     '1px solid var(--color-border)',
              borderRadius: '4px',
              cursor:     isFirstPage ? 'not-allowed' : 'pointer',
              background: 'var(--color-bg-card)',
              color:      isFirstPage ? 'var(--color-border)' : 'var(--color-text)',
            }}
          >
            Précédent
          </button>
          <span style={{ lineHeight: '30px' }}>
            Page {meta.page} / {totalPages}
          </span>
          <button
            onClick={() => onPage({ page: meta.page + 1 })}
            disabled={isLastPage}
            style={{
              padding:    '4px 10px',
              border:     '1px solid var(--color-border)',
              borderRadius: '4px',
              cursor:     isLastPage ? 'not-allowed' : 'pointer',
              background: 'var(--color-bg-card)',
              color:      isLastPage ? 'var(--color-border)' : 'var(--color-text)',
            }}
          >
            Suivant
          </button>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Vérifier que les tests passent**

```bash
yarn vitest run app/frontend/components/interventions/InterventionTable.test.tsx
# Attendu : 9 tests PASS
```

- [ ] **TypeCheck**

```bash
yarn tsc --noEmit
# Attendu : aucune erreur
```

- [ ] **Commit**

```bash
git add app/frontend/components/interventions/InterventionTable.test.tsx \
        app/frontend/components/interventions/InterventionTable.tsx
git commit -m "feat: add InterventionTable component with TDD"
```

---

## Task 4 : InterventionKanban

**Files:**
- Create: `app/frontend/components/interventions/InterventionKanban.test.tsx`
- Create: `app/frontend/components/interventions/InterventionKanban.tsx`

- [ ] **Écrire le test**

Créer `app/frontend/components/interventions/InterventionKanban.test.tsx` :

```typescript
import { render, screen, fireEvent } from '@testing-library/react'
import { InterventionKanban } from './InterventionKanban'

describe('InterventionKanban', () => {
  const counts = { planned: 5, in_progress: 2, done: 12, validated: 8 }

  it('affiche les 4 colonnes', () => {
    render(<InterventionKanban counts={counts} onFilter={() => {}} />)
    expect(screen.getByText(/planifié/i)).toBeInTheDocument()
    expect(screen.getByText(/en cours/i)).toBeInTheDocument()
    expect(screen.getByText(/terminé/i)).toBeInTheDocument()
    expect(screen.getByText(/validé/i)).toBeInTheDocument()
  })

  it('affiche le count "5" pour Planifié', () => {
    render(<InterventionKanban counts={counts} onFilter={() => {}} />)
    expect(screen.getByTestId('count-planned')).toHaveTextContent('5')
  })

  it('affiche le count "2" pour En cours', () => {
    render(<InterventionKanban counts={counts} onFilter={() => {}} />)
    expect(screen.getByTestId('count-in_progress')).toHaveTextContent('2')
  })

  it('affiche le count "0" sans erreur', () => {
    render(
      <InterventionKanban
        counts={{ planned: 0, in_progress: 0, done: 0, validated: 0 }}
        onFilter={() => {}}
      />
    )
    expect(screen.getAllByText('0')).toHaveLength(4)
  })

  it('appelle onFilter avec le bon filtre au clic sur "Voir" Planifié', () => {
    const onFilter = vi.fn()
    render(<InterventionKanban counts={counts} onFilter={onFilter} />)
    fireEvent.click(screen.getByTestId('voir-planned'))
    expect(onFilter).toHaveBeenCalledWith({ nature: ['request'], state: undefined, page: 1 })
  })

  it('appelle onFilter avec state "in_progress" au clic sur "Voir" En cours', () => {
    const onFilter = vi.fn()
    render(<InterventionKanban counts={counts} onFilter={onFilter} />)
    fireEvent.click(screen.getByTestId('voir-in_progress'))
    expect(onFilter).toHaveBeenCalledWith({ nature: ['record'], state: ['in_progress'], page: 1 })
  })
})
```

- [ ] **Vérifier que le test échoue**

```bash
yarn vitest run app/frontend/components/interventions/InterventionKanban.test.tsx
# Attendu : FAIL — "Cannot find module './InterventionKanban'"
```

- [ ] **Implémenter `InterventionKanban.tsx`**

```typescript
import type { InterventionFilters } from '../../types/intervention'

interface KanbanColumn {
  key:    keyof { planned: number; in_progress: number; done: number; validated: number }
  label:  string
  color:  string
  filter: Partial<InterventionFilters>
}

const COLUMNS: KanbanColumn[] = [
  {
    key:    'planned',
    label:  'Planifié',
    color:  '#6B5E4E',
    filter: { nature: ['request'], state: undefined },
  },
  {
    key:    'in_progress',
    label:  'En cours',
    color:  '#D4841A',
    filter: { nature: ['record'], state: ['in_progress'] },
  },
  {
    key:    'done',
    label:  'Terminé',
    color:  '#2D7A3A',
    filter: { nature: ['record'], state: ['done'] },
  },
  {
    key:    'validated',
    label:  'Validé',
    color:  '#1B6B3A',
    filter: { nature: ['record'], state: ['validated'] },
  },
]

interface InterventionKanbanProps {
  counts:   { planned: number; in_progress: number; done: number; validated: number }
  onFilter: (patch: Partial<InterventionFilters>) => void
}

export function InterventionKanban({ counts, onFilter }: InterventionKanbanProps) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
      {COLUMNS.map(col => (
        <div
          key={col.key}
          style={{
            background:   'var(--color-bg-card)',
            border:       `2px solid ${col.color}`,
            borderRadius: 'var(--radius-card)',
            padding:      '16px',
            textAlign:    'center',
          }}
        >
          <p
            style={{
              margin:     '0 0 4px 0',
              fontSize:   '13px',
              fontWeight: 600,
              color:      'var(--color-text-muted)',
              textTransform: 'uppercase',
            }}
          >
            {col.label}
          </p>
          <p
            data-testid={`count-${col.key}`}
            style={{
              margin:     '0 0 12px 0',
              fontSize:   '32px',
              fontWeight: 700,
              color:      col.color,
            }}
          >
            {counts[col.key]}
          </p>
          <button
            data-testid={`voir-${col.key}`}
            onClick={() => onFilter({ ...col.filter, page: 1 })}
            style={{
              background:   col.color,
              color:        '#fff',
              border:       'none',
              borderRadius: '4px',
              padding:      '4px 12px',
              fontSize:     '12px',
              cursor:       'pointer',
              fontWeight:   600,
            }}
          >
            Voir
          </button>
        </div>
      ))}
    </div>
  )
}
```

- [ ] **Vérifier que les tests passent**

```bash
yarn vitest run app/frontend/components/interventions/InterventionKanban.test.tsx
# Attendu : 6 tests PASS
```

- [ ] **TypeCheck**

```bash
yarn tsc --noEmit
# Attendu : aucune erreur
```

- [ ] **Commit**

```bash
git add app/frontend/components/interventions/InterventionKanban.test.tsx \
        app/frontend/components/interventions/InterventionKanban.tsx
git commit -m "feat: add InterventionKanban component with TDD"
```

---

## Task 5 : InterventionMap

**Files:**
- Create: `app/frontend/components/interventions/InterventionMap.test.tsx`
- Create: `app/frontend/components/interventions/InterventionMap.tsx`

> `react-leaflet` est globalement mocké dans `app/frontend/test/setup.tsx` — pas besoin de mock local. Le mock expose `data-testid="map-container"` et `data-testid="geojson-layer"`.

- [ ] **Écrire le test**

Créer `app/frontend/components/interventions/InterventionMap.test.tsx` :

```typescript
import { render, screen } from '@testing-library/react'
import { InterventionMap } from './InterventionMap'
import type { GeoJSON } from 'geojson'

const emptyCollection: GeoJSON.FeatureCollection = {
  type: 'FeatureCollection',
  features: [],
}

const oneFeature: GeoJSON.FeatureCollection = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      geometry: {
        type: 'Polygon',
        coordinates: [[[14.5, -14.5], [14.6, -14.5], [14.6, -14.4], [14.5, -14.5]]],
      },
      properties: { intervention_id: 1, name: 'Parcelle A' },
    },
  ],
}

describe('InterventionMap', () => {
  it('affiche le message "Aucune zone" quand features est vide', () => {
    render(<InterventionMap geojson={emptyCollection} />)
    expect(screen.getByText(/aucune zone/i)).toBeInTheDocument()
  })

  it('affiche le conteneur de carte quand il y a des features', () => {
    render(<InterventionMap geojson={oneFeature} />)
    expect(screen.getByTestId('map-container')).toBeInTheDocument()
  })

  it('rend un layer GeoJSON par feature', () => {
    render(<InterventionMap geojson={oneFeature} />)
    expect(screen.getByTestId('geojson-layer')).toBeInTheDocument()
  })
})
```

- [ ] **Vérifier que le test échoue**

```bash
yarn vitest run app/frontend/components/interventions/InterventionMap.test.tsx
# Attendu : FAIL — "Cannot find module './InterventionMap'"
```

- [ ] **Implémenter `InterventionMap.tsx`**

```typescript
import { MapContainer, TileLayer, GeoJSON } from 'react-leaflet'
import type { GeoJsonObject } from 'geojson'

// Leaflet ne supporte pas les CSS custom properties — valeurs miroir des tokens
const ZONE_STYLE = {
  color:       '#E8A020',   // --color-accent
  fillColor:   '#E8A020',
  fillOpacity: 0.25,
  weight:      2,
}

const IN_PROGRESS_STYLE = {
  color:       '#D4841A',   // --color-warning
  fillColor:   '#D4841A',
  fillOpacity: 0.25,
  weight:      2,
}

const DEFAULT_CENTER: [number, number] = [14.5, -14.5]  // Sénégal

interface InterventionMapProps {
  geojson: GeoJSON.FeatureCollection
}

export function InterventionMap({ geojson }: InterventionMapProps) {
  if (geojson.features.length === 0) {
    return (
      <div
        style={{
          background:   'var(--color-bg-card)',
          border:       '1px solid var(--color-border)',
          borderRadius: 'var(--radius-card)',
          padding:      '24px',
          textAlign:    'center',
          color:        'var(--color-text-muted)',
          fontSize:     '13px',
        }}
      >
        Aucune zone géographique disponible pour les interventions affichées
      </div>
    )
  }

  return (
    <div
      style={{
        borderRadius: 'var(--radius-card)',
        overflow:     'hidden',
        border:       '1px solid var(--color-border)',
        marginBottom: '16px',
      }}
    >
      <MapContainer
        center={DEFAULT_CENTER}
        zoom={8}
        style={{ height: '256px', width: '100%' }}
        scrollWheelZoom={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {geojson.features.map((feature, i) => (
          <GeoJSON
            key={i}
            data={feature as GeoJsonObject}
            style={ZONE_STYLE}
          />
        ))}
      </MapContainer>
    </div>
  )
}
```

- [ ] **Vérifier que les tests passent**

```bash
yarn vitest run app/frontend/components/interventions/InterventionMap.test.tsx
# Attendu : 3 tests PASS
```

- [ ] **TypeCheck**

```bash
yarn tsc --noEmit
# Attendu : aucune erreur
```

- [ ] **Commit**

```bash
git add app/frontend/components/interventions/InterventionMap.test.tsx \
        app/frontend/components/interventions/InterventionMap.tsx
git commit -m "feat: add InterventionMap component with TDD"
```

---

## Task 6 : Page Index (shell Inertia)

**Files:**
- Create: `app/frontend/pages/Backend/Interventions/Index.test.tsx`
- Create: `app/frontend/pages/Backend/Interventions/Index.tsx`

- [ ] **Écrire le test**

Créer `app/frontend/pages/Backend/Interventions/Index.test.tsx` :

```typescript
import { render, screen, fireEvent } from '@testing-library/react'
import InterventionsIndex from './Index'
import type { InterventionIndexProps } from '../../../types/intervention'

const defaultProps: InterventionIndexProps = {
  interventions: [],
  kanban: { planned: 3, in_progress: 1, done: 8, validated: 2 },
  map_geojson: { type: 'FeatureCollection', features: [] },
  filters: {},
  meta: { total: 0, page: 1, per_page: 25, procedures: [] },
}

describe('InterventionsIndex', () => {
  it('affiche le panneau de filtres', () => {
    render(<InterventionsIndex {...defaultProps} />)
    expect(screen.getByPlaceholderText(/rechercher/i)).toBeInTheDocument()
  })

  it('affiche la vue table par défaut', () => {
    render(<InterventionsIndex {...defaultProps} />)
    expect(screen.getByText(/aucune intervention/i)).toBeInTheDocument()
  })

  it('affiche les boutons de bascule de vue', () => {
    render(<InterventionsIndex {...defaultProps} />)
    expect(screen.getByText('Liste')).toBeInTheDocument()
    expect(screen.getByText('Tableau')).toBeInTheDocument()
    expect(screen.getByText('Carte')).toBeInTheDocument()
  })

  it('bascule vers la vue kanban au clic sur "Tableau"', () => {
    render(<InterventionsIndex {...defaultProps} />)
    fireEvent.click(screen.getByText('Tableau'))
    expect(screen.getByText(/planifié/i)).toBeInTheDocument()
  })

  it('affiche la carte au clic sur "Carte"', () => {
    render(<InterventionsIndex {...defaultProps} />)
    fireEvent.click(screen.getByText('Carte'))
    expect(screen.getByText(/aucune zone/i)).toBeInTheDocument()
  })

  it('cache la carte au second clic sur "Carte"', () => {
    render(<InterventionsIndex {...defaultProps} />)
    fireEvent.click(screen.getByText('Carte'))
    fireEvent.click(screen.getByText('Carte'))
    expect(screen.queryByText(/aucune zone/i)).not.toBeInTheDocument()
  })

  it('repasse en vue table au clic sur "Liste" depuis kanban', () => {
    render(<InterventionsIndex {...defaultProps} />)
    fireEvent.click(screen.getByText('Tableau'))
    fireEvent.click(screen.getByText('Liste'))
    expect(screen.getByText(/aucune intervention/i)).toBeInTheDocument()
  })
})
```

- [ ] **Vérifier que le test échoue**

```bash
yarn vitest run app/frontend/pages/Backend/Interventions/Index.test.tsx
# Attendu : FAIL — "Cannot find module './Index'"
```

- [ ] **Créer le répertoire et implémenter `Index.tsx`**

```bash
mkdir -p app/frontend/pages/Backend/Interventions
```

```typescript
import { useState } from 'react'
import { InterventionFilterPanel } from '../../../components/interventions/InterventionFilterPanel'
import { InterventionTable }       from '../../../components/interventions/InterventionTable'
import { InterventionKanban }      from '../../../components/interventions/InterventionKanban'
import { InterventionMap }         from '../../../components/interventions/InterventionMap'
import { useInterventionFilters }  from '../../../hooks/useInterventionFilters'
import type { InterventionIndexProps, InterventionFilters } from '../../../types/intervention'

type View = 'table' | 'kanban'

const TOGGLE_STYLE = (active: boolean) => ({
  padding:      '6px 16px',
  border:       '1px solid var(--color-border)',
  borderRadius: '4px',
  background:   active ? 'var(--color-primary)' : 'var(--color-bg-card)',
  color:        active ? '#fff' : 'var(--color-text)',
  cursor:       'pointer',
  fontWeight:   active ? 600 : 400,
  fontSize:     '13px',
})

export default function InterventionsIndex({
  interventions,
  kanban,
  map_geojson,
  filters,
  meta,
}: InterventionIndexProps) {
  const [view, setView]       = useState<View>('table')
  const [mapOpen, setMapOpen] = useState(false)
  const { applyFilters }      = useInterventionFilters(filters)

  const handleKanbanFilter = (patch: Partial<InterventionFilters>) => {
    applyFilters(patch)
    setView('table')
  }

  return (
    <div style={{ background: 'var(--color-bg)', minHeight: '100vh', padding: '24px' }}>
      <h1
        style={{
          fontFamily:   'var(--font-heading)',
          fontSize:     '22px',
          fontWeight:   700,
          color:        'var(--color-text)',
          marginBottom: '16px',
        }}
      >
        Interventions
      </h1>

      <InterventionFilterPanel filters={filters} meta={meta} onChange={applyFilters} />

      <div style={{ display: 'flex', gap: '8px', margin: '16px 0' }}>
        <button onClick={() => setView('table')}  style={TOGGLE_STYLE(view === 'table')}>Liste</button>
        <button onClick={() => setView('kanban')} style={TOGGLE_STYLE(view === 'kanban')}>Tableau</button>
        <button
          onClick={() => setMapOpen(v => !v)}
          style={TOGGLE_STYLE(mapOpen)}
        >
          Carte
        </button>
      </div>

      {mapOpen && <InterventionMap geojson={map_geojson} />}

      {view === 'table' && (
        <InterventionTable rows={interventions} meta={meta} onPage={applyFilters} />
      )}
      {view === 'kanban' && (
        <InterventionKanban counts={kanban} onFilter={handleKanbanFilter} />
      )}
    </div>
  )
}
```

- [ ] **Vérifier que les tests passent**

```bash
yarn vitest run app/frontend/pages/Backend/Interventions/Index.test.tsx
# Attendu : 7 tests PASS
```

- [ ] **Lancer la suite complète**

```bash
yarn vitest run
# Attendu : tous les tests PASS (InterventionFilterPanel + Table + Kanban + Map + Index)
```

- [ ] **TypeCheck**

```bash
yarn tsc --noEmit
# Attendu : aucune erreur
```

- [ ] **Commit**

```bash
git add app/frontend/pages/Backend/Interventions/Index.test.tsx \
        app/frontend/pages/Backend/Interventions/Index.tsx
git commit -m "feat: add Interventions Index page shell with TDD"
```

---

## Task 7 : Rails — RSpec + action `index`

**Files:**
- Create: `spec/controllers/backend/interventions_controller_spec.rb`
- Modify: `app/controllers/backend/interventions_controller.rb`

- [ ] **Écrire le RSpec (TDD — avant le controller)**

Créer `spec/controllers/backend/interventions_controller_spec.rb` :

```ruby
require 'rails_helper'

RSpec.describe Backend::InterventionsController, type: :controller do
  let(:user) { create(:user) }

  before do
    sign_in user
    request.headers['X-Inertia']         = 'true'
    request.headers['X-Inertia-Version'] = '1'
  end

  describe 'GET #index' do
    it 'retourne HTTP 200' do
      get :index
      expect(response).to have_http_status(:ok)
    end

    it 'rend le composant Inertia Backend/Interventions/Index' do
      get :index
      data = JSON.parse(response.body)
      expect(data['component']).to eq('Backend/Interventions/Index')
    end

    it 'expose les clés de props attendues' do
      get :index
      props = JSON.parse(response.body)['props']
      expect(props.keys).to include('interventions', 'kanban', 'map_geojson', 'filters', 'meta')
    end

    it 'expose un kanban avec les 4 colonnes' do
      get :index
      kanban = JSON.parse(response.body)['props']['kanban']
      expect(kanban.keys).to match_array(%w[planned in_progress done validated])
    end

    it 'expose un map_geojson de type FeatureCollection' do
      get :index
      map = JSON.parse(response.body)['props']['map_geojson']
      expect(map['type']).to eq('FeatureCollection')
      expect(map['features']).to be_an(Array)
    end

    it 'expose les filtres courants dans les props' do
      get :index, params: { state: 'done' }
      filters = JSON.parse(response.body)['props']['filters']
      expect(filters['state']).to eq('done')
    end

    it 'filtre les interventions par état' do
      create(:intervention, nature: :record, state: :done)
      create(:intervention, nature: :record, state: :in_progress)
      get :index, params: { state: 'done' }
      interventions = JSON.parse(response.body)['props']['interventions']
      expect(interventions.all? { |i| i['state'] == 'done' }).to be true
    end

    it 'filtre les interventions par nature' do
      create(:intervention, nature: :request)
      create(:intervention, nature: :record)
      get :index, params: { nature: 'request' }
      interventions = JSON.parse(response.body)['props']['interventions']
      expect(interventions.all? { |i| i['nature'] == 'request' }).to be true
    end

    it 'expose la pagination dans meta' do
      get :index
      meta = JSON.parse(response.body)['props']['meta']
      expect(meta.keys).to include('total', 'page', 'per_page', 'procedures')
    end
  end
end
```

- [ ] **Vérifier que les specs échouent**

```bash
bundle exec rspec spec/controllers/backend/interventions_controller_spec.rb
# Attendu : FAIL — l'action index rend du HTML, pas du JSON Inertia
```

- [ ] **Modifier `app/controllers/backend/interventions_controller.rb`**

Ajouter après la ligne `manage_restfully ...` (ligne 25-26) :

```ruby
layout 'inertia', only: [:index]
```

Ajouter avant `def show` (ligne 202) :

```ruby
def index
  conditions = list_conditions

  scope = Intervention
    .where(conditions)
    .includes(:activities, :targets, :participations, :receptions)
    .joins('LEFT OUTER JOIN interventions I ON interventions.id = I.request_intervention_id')
    .order(started_at: :desc)

  paginated = scope.page(params[:page]).per(25)

  kanban = {
    'planned'     => scope.where(nature: :request).count,
    'in_progress' => scope.where(nature: :record, state: :in_progress).count,
    'done'        => scope.where(nature: :record, state: :done).count,
    'validated'   => scope.where(nature: :record, state: :validated).count
  }

  zones = InterventionTarget
    .joins(:intervention)
    .where(intervention: paginated)
    .joins('JOIN products ON products.id = intervention_parameters.product_id')
    .select('intervention_parameters.intervention_id,
             ST_AsGeoJSON(intervention_parameters.working_zone) AS zone_geojson,
             products.name AS product_name')
    .filter_map do |t|
      next unless t.zone_geojson
      {
        'type'       => 'Feature',
        'geometry'   => JSON.parse(t.zone_geojson),
        'properties' => {
          'intervention_id' => t.intervention_id,
          'name'            => t.product_name
        }
      }
    end

  render inertia: 'Backend/Interventions/Index', props: {
    interventions: paginated.as_json(
      only:    %i[id procedure_name nature state started_at stopped_at],
      methods: %i[name human_activities_names human_target_names
                  human_working_duration human_working_zone_area]
    ),
    kanban:      kanban,
    map_geojson: { 'type' => 'FeatureCollection', 'features' => zones },
    filters:     params.permit(:q, :state, :nature, :cultivable_zone_id,
                               :procedure_name_id, :activity_id, :target_id,
                               :label_id, :worker_id, :equipment_id,
                               :period, :period_interval).to_h,
    meta:        {
      total:      scope.count,
      page:       (params[:page] || 1).to_i,
      per_page:   25,
      procedures: Intervention.used_procedures
                    .map { |p| { label: p.human_name, value: p.name.to_s } }
                    .sort_by { |p| p[:label] }
    }
  }
end
```

- [ ] **Vérifier que les specs passent**

```bash
bundle exec rspec spec/controllers/backend/interventions_controller_spec.rb
# Attendu : 9 exemples, 0 échecs
```

- [ ] **Commit**

```bash
git add spec/controllers/backend/interventions_controller_spec.rb \
        app/controllers/backend/interventions_controller.rb
git commit -m "feat: add InterventionsController#index with Inertia render"
```

---

## Task 8 : Vérification finale

- [ ] **Suite de tests complète**

```bash
yarn vitest run
# Attendu : tous les tests frontend PASS
```

- [ ] **TypeCheck final**

```bash
yarn tsc --noEmit
# Attendu : aucune erreur
```

- [ ] **RSpec complet**

```bash
bundle exec rspec spec/controllers/backend/interventions_controller_spec.rb \
                  spec/controllers/backend/dashboards_controller_spec.rb
# Attendu : tous les exemples PASS — aucune régression Dashboard
```

- [ ] **Vérifier que les vues HAML existantes ne sont pas cassées**

```bash
bundle exec rails routes | grep interventions
# Attendu : route GET /backend/interventions(.:format) → backend/interventions#index
```

```bash
# Démarrer le serveur et visiter /backend/interventions
bundle exec rails server -p 3000 &
# Ouvrir http://localhost:3000/backend/interventions
# Vérifier : page React s'affiche, filtres fonctionnent, toggle vue fonctionne
```

- [ ] **Commit final si tout est vert**

```bash
git add -A
git commit -m "feat: complete Interventions Index migration to React/Inertia"
```
