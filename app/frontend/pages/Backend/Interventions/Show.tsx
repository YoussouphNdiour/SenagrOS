import type { ReactNode } from 'react'
import { Wrench, Users, Package, Target, Clock } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { router } from '@inertiajs/react'
import { AppShell } from '../../../components/AppShell'
import { BackLink, SectionCard, SectionTitle, DetailRow, StateBadge, PrimaryButton, ConfirmDeleteButton } from '../../../components/ui'
import type { InterventionShowProps, InterventionParticipant, InterventionInputItem } from '../../../types/intervention'

const STATE_COLORS: Record<string, { bg: string; color: string; label: string }> = {
  in_progress: { bg: 'var(--color-info-bg)',     color: 'var(--color-info)',          label: 'En cours' },
  done:        { bg: 'var(--color-success-bg)',   color: 'var(--color-success-text)',  label: 'Terminée' },
  validated:   { bg: 'var(--color-success-bg)',   color: 'var(--color-success-text)',  label: 'Validée' },
  rejected:    { bg: 'var(--color-danger-bg)',    color: 'var(--color-danger-text)',   label: 'Rejetée' },
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

function ParticipantList({ title, icon, items, extra }: ParticipantListProps) {
  if (items.length === 0) return null
  return (
    <SectionCard>
      <SectionTitle icon={icon}>{title} ({items.length})</SectionTitle>
      <ul>
        {items.map((item, i) => (
          <li
            key={item.id}
            className="flex items-center justify-between text-sm py-2"
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
    </SectionCard>
  )
}

function InterventionShow({ intervention, targets, inputs, doers, tools, canDestroy }: InterventionShowProps) {
  const stateConfig = STATE_COLORS[intervention.state] ?? { bg: 'var(--color-bg-subtle)', color: 'var(--color-text-muted)', label: intervention.state }

  return (
    <>
      <BackLink href="/backend/interventions" label="Retour aux interventions" />

      <div className="flex justify-between items-start mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-mono" style={{ color: 'var(--color-text-muted)' }}>
              {intervention.number}
            </span>
            <StateBadge label={stateConfig.label} color={stateConfig.color} bg={stateConfig.bg} />
            {intervention.nature === 'request' && (
              <StateBadge label="Planification" color="var(--color-warning-text)" bg="var(--color-warning-bg)" dot={false} />
            )}
          </div>
          <h1 className="text-[26px] font-bold m-0" style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-text)' }}>
            {intervention.procedure_name || 'Intervention'}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <PrimaryButton href={`/backend/interventions/${intervention.id}/edit`} variant="secondary">Modifier</PrimaryButton>
          <ConfirmDeleteButton
            onDelete={() => router.delete(`/backend/interventions/${intervention.id}`)}
            canDestroy={canDestroy}
            resourceName="cette intervention"
          />
        </div>
      </div>

      <SectionCard className="mb-5">
        <SectionTitle icon={Clock}>Chronologie</SectionTitle>
        <DetailRow cols={3} items={[
          { label: 'Début',              value: intervention.started_at ? new Date(intervention.started_at).toLocaleString('fr-FR') : '—' },
          { label: 'Fin',               value: intervention.stopped_at ? new Date(intervention.stopped_at).toLocaleString('fr-FR') : '—' },
          { label: 'Durée de travail',   value: formatDuration(intervention.working_duration) },
          { label: 'Durée totale',       value: formatDuration(intervention.whole_duration) },
          ...(intervention.description ? [{ label: 'Description', value: intervention.description, fullWidth: true }] : []),
        ]} />
      </SectionCard>

      <div className="grid grid-cols-2 gap-4">
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
