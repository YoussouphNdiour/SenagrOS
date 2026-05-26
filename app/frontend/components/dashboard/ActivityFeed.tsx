import { Check, Loader, Calendar } from 'lucide-react'
import type { RecentIntervention } from '../../types/dashboard'

const STATE_CONFIG: Record<RecentIntervention['state'], {
  label: string
  color: string
  bg: string
  textColor: string
  Icon: typeof Check
}> = {
  done: {
    label: 'Terminé',
    color: '#2D7A3A',
    bg: '#d1fae5',
    textColor: '#065f46',
    Icon: Check,
  },
  in_progress: {
    label: 'En cours',
    color: '#D4841A',
    bg: '#fef3c7',
    textColor: '#92400e',
    Icon: Loader,
  },
  planned: {
    label: 'Planifié',
    color: '#6B5E4E',
    bg: '#f1ece1',
    textColor: '#6B5E4E',
    Icon: Calendar,
  },
}

const TODAY = new Date('2026-05-26')

function daysAgo(dateStr: string): string {
  const diff = Math.max(1, Math.floor((TODAY.getTime() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24)))
  return `il y a ${diff} j`
}

interface ActivityFeedProps {
  interventions: RecentIntervention[]
}

export function ActivityFeed({ interventions }: ActivityFeedProps) {
  return (
    <div style={{
      background: 'var(--color-bg-card)',
      border: '1px solid var(--color-border)',
      borderRadius: '10px',
      boxShadow: 'var(--shadow-card)',
      padding: '18px 20px',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
        <h3 style={{
          fontSize: '12px',
          fontWeight: 700,
          color: 'var(--color-text-muted)',
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
          margin: 0,
          fontFamily: 'var(--font-ui)',
        }}>
          Activité récente
        </h3>
        <a
          href="/backend/interventions"
          style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-primary)', textDecoration: 'none' }}
        >
          Tout voir →
        </a>
      </div>

      {interventions.length === 0 ? (
        <p style={{ color: 'var(--color-text-muted)', fontSize: '14px', margin: 0 }}>
          Aucune intervention récente
        </p>
      ) : (
        <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
          {interventions.map((intervention, i) => {
            const cfg = STATE_CONFIG[intervention.state]
            const { Icon } = cfg
            const dateShort = new Date(intervention.started_at).toLocaleDateString('fr-FR', {
              month: 'short', day: 'numeric',
            })

            return (
              <li
                key={intervention.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '10px 0',
                  borderBottom: i < interventions.length - 1 ? '1px solid #f0e9dd' : 'none',
                }}
              >
                {/* State icon tile */}
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  background: cfg.bg,
                  color: cfg.textColor,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  <Icon size={14} />
                </div>

                {/* Name + date */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: '13px',
                    color: 'var(--color-text)',
                    fontWeight: 500,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}>
                    {intervention.name}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '1px' }}>
                    {dateShort} · {daysAgo(intervention.started_at)}
                  </div>
                </div>

                {/* Pill badge */}
                <span style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  background: `${cfg.color}1a`,
                  color: cfg.color,
                  border: `1px solid ${cfg.color}55`,
                  borderRadius: '999px',
                  padding: '2px 9px 2px 7px',
                  fontSize: '11px',
                  fontWeight: 600,
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                }}>
                  <span style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    background: cfg.color,
                    flexShrink: 0,
                  }} />
                  {cfg.label}
                </span>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
