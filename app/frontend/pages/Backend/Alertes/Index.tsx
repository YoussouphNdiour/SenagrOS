import type { ReactNode } from 'react'
import { useState } from 'react'
import { CheckCircle, Plus, AlertTriangle, Clock, UserX, PawPrint, ChevronRight } from 'lucide-react'
import { AppShell } from '../../../components/AppShell'
import { PageHeader, SectionCard, StateBadge, PrimaryButton } from '../../../components/ui'
import type { AlertesIndexProps } from '../../../types/alerte'
import type { IssueItem } from '../../../types/issue'
import { ISSUE_NATURE_LABELS } from '../../../types/issue'

const TYPE_CFG = {
  intervention_overdue: {
    label: 'Retard',
    color: 'var(--color-warning-text)',
    bg: 'var(--color-warning-bg)',
    border: '#fcd34d',
    Icon: Clock,
    sectionTitle: 'Interventions en retard',
  },
  animal_dead: {
    label: 'Décès',
    color: 'var(--color-danger-text)',
    bg: 'var(--color-danger-bg)',
    border: 'var(--color-danger-border)',
    Icon: PawPrint,
    sectionTitle: 'Animaux récemment décédés',
  },
  worker_departed: {
    label: 'Départ',
    color: '#5b21b6',
    bg: '#ede9fe',
    border: '#c4b5fd',
    Icon: UserX,
    sectionTitle: 'Travailleurs récemment partis',
  },
} as const

type AlertType = keyof typeof TYPE_CFG

const ALERT_ORDER: AlertType[] = ['intervention_overdue', 'animal_dead', 'worker_departed']

const SEVERITY_COLOR: Record<string, string> = {
  high:   'var(--color-danger)',
  medium: 'var(--color-warning)',
  low:    'var(--color-text-muted)',
}

function gravityColor(gravity: number): string {
  if (gravity >= 4) return 'var(--color-danger)'
  if (gravity === 3) return 'var(--color-warning)'
  return 'var(--color-text-muted)'
}

function AlertesIndex({ alertes, counts, issues }: AlertesIndexProps) {
  const [activeType, setActiveType] = useState<AlertType | null>(null)
  const totalAlerts = alertes.length
  const visibleAlerts = activeType ? alertes.filter(a => a.type === activeType) : alertes

  return (
    <div className="min-h-screen" style={{ background: 'var(--color-bg)' }}>
      <PageHeader
        title="Alertes"
        subtitle={`${totalAlerts} alerte${totalAlerts !== 1 ? 's' : ''} active${totalAlerts !== 1 ? 's' : ''}`}
        action={
          <PrimaryButton href="/backend/issues/new">
            <Plus size={14} /> Signaler un problème
          </PrimaryButton>
        }
      />

      <div className="grid grid-cols-3 gap-3.5 mb-5">
        {ALERT_ORDER.map(type => {
          const cfg = TYPE_CFG[type]
          const count = counts[type]
          const active = activeType === type
          const { Icon } = cfg
          return (
            <button
              key={type}
              onClick={() => setActiveType(active ? null : type)}
              className="flex items-center gap-3.5 rounded-[var(--radius-card)] p-4 border text-left w-full cursor-pointer"
              style={{
                background: active ? cfg.bg : 'var(--color-bg-card)',
                borderColor: active ? cfg.border : 'var(--color-border)',
                boxShadow: 'var(--shadow-card)',
                transition: 'all 0.15s',
              }}
            >
              <span
                className="w-10 h-10 rounded-[10px] flex items-center justify-center shrink-0"
                style={{ background: `${cfg.color}1a`, color: cfg.color }}
              >
                <Icon size={18} />
              </span>
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: active ? cfg.color : 'var(--color-text-muted)' }}>
                  {cfg.sectionTitle}
                </div>
                <div className="text-[24px] font-bold leading-tight" style={{ fontFamily: 'var(--font-heading)', color: active ? cfg.color : 'var(--color-text)' }}>
                  {count}
                </div>
              </div>
            </button>
          )
        })}
      </div>

      {alertes.length === 0 ? (
        <SectionCard>
          <div className="flex flex-col items-center gap-3 py-12">
            <CheckCircle size={40} style={{ color: 'var(--color-primary)' }} />
            <p className="text-sm font-semibold m-0" style={{ color: 'var(--color-primary)' }}>Aucune alerte — tout va bien !</p>
          </div>
        </SectionCard>
      ) : (
        <>
          <SectionCard noPadding className="mb-4">
            <div className="px-4 py-3.5 flex items-center justify-between border-b" style={{ borderColor: 'var(--color-border)' }}>
              <span className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: 'var(--color-text-muted)' }}>
                {activeType ? TYPE_CFG[activeType].sectionTitle : 'Toutes les alertes'}
              </span>
              {activeType && (
                <button onClick={() => setActiveType(null)} className="text-[11px] font-semibold bg-transparent border-none cursor-pointer" style={{ color: 'var(--color-primary)' }}>
                  Tout afficher
                </button>
              )}
            </div>
            <ul className="list-none m-0 p-0">
              {visibleAlerts.map((alerte, idx) => {
                const cfg = TYPE_CFG[alerte.type] ?? TYPE_CFG['intervention_overdue']
                const { Icon } = cfg
                return (
                  <li
                    key={alerte.id}
                    className="flex items-center gap-3 px-4 py-3 border-b"
                    style={{ borderColor: idx < visibleAlerts.length - 1 ? 'var(--color-border)' : 'transparent' }}
                  >
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ background: SEVERITY_COLOR[alerte.severity] ?? 'var(--color-text-muted)' }} />
                    <span className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: cfg.bg, color: cfg.color }}>
                      <Icon size={13} />
                    </span>
                    <StateBadge label={cfg.label} color={cfg.color} bg={cfg.bg} border={cfg.border} dot={false} />
                    <a href={alerte.href} className="flex-1 font-semibold no-underline text-sm min-w-0 truncate" style={{ color: 'var(--color-text)' }}>
                      {alerte.label}
                    </a>
                    <span className="text-xs whitespace-nowrap shrink-0" style={{ color: 'var(--color-text-muted)' }}>{alerte.detail}</span>
                    <a href={alerte.href} className="shrink-0" style={{ color: 'var(--color-text-muted)' }}><ChevronRight size={14} /></a>
                  </li>
                )
              })}
            </ul>
          </SectionCard>

          {issues.length > 0 && (
            <SectionCard noPadding>
              <div className="px-4 py-3.5 border-b" style={{ borderColor: 'var(--color-border)' }}>
                <span className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: 'var(--color-text-muted)' }}>Problèmes signalés</span>
              </div>
              <ul className="list-none m-0 p-0">
                {issues.map((issue: IssueItem, idx) => (
                  <li key={issue.id} className="flex items-center gap-3 px-4 py-3 border-b" style={{ borderColor: idx < issues.length - 1 ? 'var(--color-border)' : 'transparent' }}>
                    <span className="w-6 h-6 rounded-md flex items-center justify-center text-[11px] font-bold shrink-0" style={{ background: gravityColor(issue.gravity), color: '#fff' }}>
                      {issue.gravity}
                    </span>
                    <a href={`/backend/issues/${issue.id}`} className="flex-1 font-semibold no-underline text-sm" style={{ color: 'var(--color-text)' }}>
                      {issue.name}
                    </a>
                    <span className="text-xs whitespace-nowrap" style={{ color: 'var(--color-text-muted)' }}>
                      {ISSUE_NATURE_LABELS[issue.nature] ?? issue.nature}
                      {issue.observed_at ? ` · ${issue.observed_at}` : ''}
                    </span>
                    <a href={`/backend/issues/${issue.id}`} className="shrink-0" style={{ color: 'var(--color-text-muted)' }}><ChevronRight size={14} /></a>
                  </li>
                ))}
              </ul>
            </SectionCard>
          )}
        </>
      )}
    </div>
  )
}

AlertesIndex.layout = (page: ReactNode) => <AppShell>{page}</AppShell>
export default AlertesIndex
