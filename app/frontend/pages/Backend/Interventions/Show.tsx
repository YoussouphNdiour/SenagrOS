import type { ReactNode } from 'react'
import { ArrowLeft, Wrench, Users, Package, Target, Clock } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { AppShell } from '../../../components/AppShell'
import type { InterventionShowProps, InterventionParticipant, InterventionInputItem } from '../../../types/intervention'

const STATE_COLORS: Record<string, { bg: string; color: string; label: string }> = {
  in_progress: { bg: '#dbeafe', color: '#1e40af', label: 'En cours' },
  done:        { bg: '#d1fae5', color: '#065f46', label: 'Terminée' },
  validated:   { bg: '#d1fae5', color: '#166534', label: 'Validée' },
  rejected:    { bg: '#fee2e2', color: '#991b1b', label: 'Rejetée' },
}

function formatDuration(seconds: number): string {
  if (!seconds || seconds === 0) return '—'
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  if (h > 0) return `${h}h ${m > 0 ? `${m}min` : ''}`.trim()
  return `${m} min`
}

interface ParticipantListProps {
  title: string
  icon: LucideIcon
  items: InterventionParticipant[]
  extra?: (item: InterventionParticipant) => ReactNode
}

function ParticipantList({ title, icon: Icon, items, extra }: ParticipantListProps) {
  if (items.length === 0) return null
  return (
    <div
      className="rounded-lg overflow-hidden"
      style={{
        background: 'var(--color-bg-card)',
        border: '1px solid var(--color-border)',
        boxShadow: 'var(--shadow-card)',
      }}
    >
      <div
        className="px-5 py-3 flex items-center gap-2"
        style={{ borderBottom: '1px solid var(--color-border)', background: 'var(--color-bg-subtle)' }}
      >
        <Icon size={14} style={{ color: 'var(--color-primary)' }} />
        <h3 className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
          {title} ({items.length})
        </h3>
      </div>
      <ul>
        {items.map((item, i) => (
          <li
            key={item.id}
            className="px-5 py-2.5 flex items-center justify-between text-sm"
            style={{
              borderTop: i > 0 ? '1px solid var(--color-border)' : undefined,
              color: 'var(--color-text)',
            }}
          >
            <span>{item.product_name || '—'}</span>
            {extra && extra(item)}
          </li>
        ))}
      </ul>
    </div>
  )
}

function InterventionShow({ intervention, targets, inputs, doers, tools }: InterventionShowProps) {
  const stateConfig =
    STATE_COLORS[intervention.state] ?? { bg: '#f3f4f6', color: '#374151', label: intervention.state }

  const chronoItems: Array<{ label: string; value: string }> = [
    {
      label: 'Début',
      value: intervention.started_at ? new Date(intervention.started_at).toLocaleString('fr-FR') : '—',
    },
    {
      label: 'Fin',
      value: intervention.stopped_at ? new Date(intervention.stopped_at).toLocaleString('fr-FR') : '—',
    },
    { label: 'Durée de travail', value: formatDuration(intervention.working_duration) },
    { label: 'Durée totale', value: formatDuration(intervention.whole_duration) },
  ]

  return (
    <>
      {/* Back */}
      <div className="mb-6">
        <a
          href="/backend/interventions"
          className="flex items-center gap-1 text-sm no-underline"
          style={{ color: 'var(--color-text-muted)' }}
        >
          <ArrowLeft size={16} />
          Retour aux interventions
        </a>
      </div>

      {/* Title */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-mono" style={{ color: 'var(--color-text-muted)' }}>
              {intervention.number}
            </span>
            <span
              className="inline-block px-2 py-0.5 rounded-full text-xs font-semibold"
              style={{ background: stateConfig.bg, color: stateConfig.color }}
            >
              {stateConfig.label}
            </span>
            {intervention.nature === 'request' && (
              <span
                className="inline-block px-2 py-0.5 rounded-full text-xs font-semibold"
                style={{ background: '#fef3c7', color: '#92400e' }}
              >
                Planification
              </span>
            )}
          </div>
          <h1
            className="text-2xl font-bold"
            style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-text)' }}
          >
            {intervention.procedure_name || 'Intervention'}
          </h1>
        </div>
        <a
          href={`/backend/interventions/${intervention.id}/edit`}
          className="px-3 py-1.5 rounded text-sm font-medium no-underline"
          style={{
            background: 'var(--color-bg-card)',
            border: '1px solid var(--color-border)',
            color: 'var(--color-text)',
          }}
        >
          Modifier
        </a>
      </div>

      {/* Main info card */}
      <div
        className="rounded-lg p-5 mb-5"
        style={{
          background: 'var(--color-bg-card)',
          border: '1px solid var(--color-border)',
          boxShadow: 'var(--shadow-card)',
        }}
      >
        <h2
          className="text-sm font-semibold uppercase tracking-wide mb-4 flex items-center gap-2"
          style={{ color: 'var(--color-text-muted)' }}
        >
          <Clock size={14} /> Chronologie
        </h2>
        <dl className="grid gap-x-8 gap-y-3" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
          {chronoItems.map(({ label, value }) => (
            <div key={label}>
              <dt className="text-xs mb-0.5" style={{ color: 'var(--color-text-muted)' }}>
                {label}
              </dt>
              <dd className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>
                {value}
              </dd>
            </div>
          ))}
        </dl>
        {intervention.description && (
          <div className="mt-4 pt-4" style={{ borderTop: '1px solid var(--color-border)' }}>
            <dt className="text-xs mb-1" style={{ color: 'var(--color-text-muted)' }}>
              Description
            </dt>
            <dd className="text-sm" style={{ color: 'var(--color-text)' }}>
              {intervention.description}
            </dd>
          </div>
        )}
      </div>

      {/* Participants grid */}
      <div className="grid gap-4" style={{ gridTemplateColumns: '1fr 1fr' }}>
        <ParticipantList title="Cibles" icon={Target} items={targets} />
        <ParticipantList
          title="Intrants"
          icon={Package}
          items={inputs}
          extra={(item) => {
            const inp = item as InterventionInputItem
            return inp.quantity_value != null ? (
              <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                {inp.quantity_value} {inp.quantity_unit}
              </span>
            ) : null
          }}
        />
        <ParticipantList title="Intervenants" icon={Users} items={doers} />
        <ParticipantList title="Outils" icon={Wrench} items={tools} />
      </div>
    </>
  )
}

InterventionShow.layout = (page: ReactNode) => <AppShell>{page}</AppShell>

export default InterventionShow
