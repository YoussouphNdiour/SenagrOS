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

const SEVERITY_COLOR: Record<string, string> = {
  high:   '#dc2626',
  medium: '#f59e0b',
  low:    '#6b7280',
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
    </div>
  )
}

AlertesIndex.layout = (page: ReactNode) => <AppShell>{page}</AppShell>
