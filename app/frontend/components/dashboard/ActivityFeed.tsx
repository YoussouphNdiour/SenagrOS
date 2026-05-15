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
      <h3
        style={{
          fontSize: '13px',
          fontWeight: 700,
          color: 'var(--color-text-muted)',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          margin: '0 0 12px 0',
        }}
      >
        Activité récente
      </h3>
      <ul
        style={{
          listStyle: 'none',
          margin: 0,
          padding: 0,
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
        }}
      >
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
            <span
              style={{
                fontSize: '14px',
                color: 'var(--color-text)',
                fontWeight: 500,
              }}
            >
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
