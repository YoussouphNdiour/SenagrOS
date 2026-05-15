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
              margin:        '0 0 4px 0',
              fontSize:      '13px',
              fontWeight:    600,
              color:         'var(--color-text-muted)',
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
