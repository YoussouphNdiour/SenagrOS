import type { ReactNode } from 'react'
import { useState, useMemo } from 'react'
import { AppShell } from '../../../components/AppShell'
import type { ActivitesIndexProps, Activite } from '../../../types/activite'

/**
 * Note: Inline style attributes with CSS variables (e.g., style={{ color: 'var(--color-text)' }})
 * are used consistently across the SenagrOS frontend. This is an intentional project pattern
 * for applying design tokens defined in app/frontend/styles/tokens.css.
 */

type SortKey = 'name' | 'family' | 'nature' | 'suspended'
type SortDir = 'asc' | 'desc'

const FAMILY_LABELS: Record<string, string> = {
  plant_farming:  'Culture',
  animal_farming: 'Élevage',
  vine_farming:   'Viticulture',
}

const FAMILY_BADGE_STYLE: Record<string, { background: string; color: string }> = {
  plant_farming:  { background: '#e8f4ec', color: '#1B6B3A' },
  animal_farming: { background: '#fef3c7', color: '#92400e' },
  vine_farming:   { background: '#ede9fe', color: '#5b21b6' },
}

const NATURE_LABELS: Record<string, string> = {
  main:       'Principale',
  auxiliary:  'Auxiliaire',
  standalone: 'Autonome',
}

function FamilyBadge({ family }: { family: string }) {
  const label = FAMILY_LABELS[family] ?? family
  const style = FAMILY_BADGE_STYLE[family] ?? { background: '#f3f4f6', color: '#374151' }
  return (
    <span
      className="px-2 py-0.5 rounded-full text-xs font-semibold"
      style={style}
    >
      {label}
    </span>
  )
}

function StateBadge({ suspended }: { suspended: boolean }) {
  if (suspended) {
    return (
      <span className="px-2 py-0.5 rounded-full text-xs font-semibold" style={{ background: '#f3f4f6', color: '#6b7280' }}>
        Suspendue
      </span>
    )
  }
  return (
    <span className="px-2 py-0.5 rounded-full text-xs font-semibold" style={{ background: '#e8f4ec', color: '#1B6B3A' }}>
      Active
    </span>
  )
}

function SortIcon({ active, dir }: { active: boolean; dir: SortDir }) {
  if (!active) return <span style={{ opacity: 0.3, marginLeft: '4px', fontSize: '10px' }}>↕</span>
  return <span style={{ marginLeft: '4px', fontSize: '10px' }}>{dir === 'asc' ? '↑' : '↓'}</span>
}

function ActivitesIndex({ activites, meta }: ActivitesIndexProps) {
  const [sortKey, setSortKey] = useState<SortKey>('name')
  const [sortDir, setSortDir] = useState<SortDir>('asc')

  const sorted = useMemo<Activite[]>(() => {
    return [...activites].sort((a, b) => {
      let valA: string | number | boolean
      let valB: string | number | boolean

      if (sortKey === 'suspended') {
        valA = a.suspended ? 1 : 0
        valB = b.suspended ? 1 : 0
      } else {
        valA = a[sortKey]
        valB = b[sortKey]
      }

      if (valA < valB) return sortDir === 'asc' ? -1 : 1
      if (valA > valB) return sortDir === 'asc' ? 1 : -1
      return 0
    })
  }, [activites, sortKey, sortDir])

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(d => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  const thStyle = {
    padding: '10px 12px',
    textAlign: 'left' as const,
    fontSize: '11px',
    fontWeight: 600,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
    cursor: 'pointer',
    userSelect: 'none' as const,
    color: 'var(--color-text-muted)',
    whiteSpace: 'nowrap' as const,
  }

  return (
    <>
      <div className="mb-6">
        <h1
          className="text-2xl font-bold mb-1"
          style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-text)' }}
        >
          Activités
        </h1>
        <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
          {meta.total} activité{meta.total !== 1 ? 's' : ''}
        </p>
      </div>

      {activites.length === 0 ? (
        <p className="text-center py-12" style={{ color: 'var(--color-text-muted)' }}>
          Aucune activité enregistrée.
        </p>
      ) : (
        <div
          className="rounded-lg overflow-hidden border"
          style={{ background: 'var(--color-bg-card)', borderColor: 'var(--color-border)' }}
        >
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr
                className="border-b-2"
                style={{ background: 'var(--color-bg)', borderColor: 'var(--color-border)' }}
              >
                <th style={thStyle} onClick={() => handleSort('name')}>
                  Nom <SortIcon active={sortKey === 'name'} dir={sortDir} />
                </th>
                <th style={thStyle} onClick={() => handleSort('family')}>
                  Famille <SortIcon active={sortKey === 'family'} dir={sortDir} />
                </th>
                <th style={thStyle} onClick={() => handleSort('nature')}>
                  Nature <SortIcon active={sortKey === 'nature'} dir={sortDir} />
                </th>
                <th style={thStyle} onClick={() => handleSort('suspended')}>
                  État <SortIcon active={sortKey === 'suspended'} dir={sortDir} />
                </th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((a) => (
                <tr
                  key={a.id}
                  className="border-b"
                  style={{ borderColor: 'var(--color-border)' }}
                >
                  <td
                    className="px-3 py-2.5 font-medium"
                    style={{ color: 'var(--color-text)' }}
                  >
                    {a.name}
                  </td>
                  <td className="px-3 py-2.5">
                    <FamilyBadge family={a.family} />
                  </td>
                  <td className="px-3 py-2.5" style={{ color: 'var(--color-text-muted)' }}>
                    {NATURE_LABELS[a.nature] ?? a.nature}
                  </td>
                  <td className="px-3 py-2.5">
                    <StateBadge suspended={a.suspended} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  )
}

ActivitesIndex.layout = (page: ReactNode) => <AppShell>{page}</AppShell>

export default ActivitesIndex
