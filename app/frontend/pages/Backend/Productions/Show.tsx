import type { ReactNode } from 'react'
import { Info, Droplets, Wrench } from 'lucide-react'
import { AppShell } from '../../../components/AppShell'
import { BackLink, SectionCard, SectionTitle, DetailRow, StateBadge, PrimaryButton, DataTable } from '../../../components/ui'
import type { ProductionShowProps } from '../../../types/production'

const FAMILY_COLORS: Record<string, { bg: string; color: string; label: string }> = {
  plant_farming:      { bg: 'var(--color-success-bg)', color: 'var(--color-success-text)', label: 'Culture' },
  vine_farming:       { bg: '#ede9fe',                  color: '#4c1d95',                   label: 'Viticulture' },
  animal_farming:     { bg: 'var(--color-warning-bg)',  color: 'var(--color-warning-text)', label: 'Élevage' },
  tool_maintaining:   { bg: 'var(--color-info-bg)',     color: 'var(--color-info)',          label: 'Outillage' },
  service_delivering: { bg: 'var(--color-bg-subtle)',   color: 'var(--color-text-muted)',   label: 'Service' },
}

const STATE_COLORS: Record<string, { bg: string; color: string; label: string }> = {
  opened:  { bg: 'var(--color-success-bg)', color: 'var(--color-success-text)', label: 'Ouverte' },
  closed:  { bg: 'var(--color-danger-bg)',  color: 'var(--color-danger-text)',  label: 'Clôturée' },
  aborted: { bg: 'var(--color-warning-bg)', color: 'var(--color-warning-text)', label: 'Abandonnée' },
}

const INTERVENTION_STATE_LABELS: Record<string, string> = {
  in_progress: 'En cours',
  done:        'Terminée',
  validated:   'Validée',
}

const ProductionShow = ({ production, interventions }: ProductionShowProps) => {
  const state = STATE_COLORS[production.state] ?? { bg: 'var(--color-bg-subtle)', color: 'var(--color-text-muted)', label: production.state }
  const family = FAMILY_COLORS[production.activity_family] ?? { bg: 'var(--color-bg-subtle)', color: 'var(--color-text-muted)', label: production.activity_family }

  return (
    <>
      <BackLink href="/backend/activity_productions" label="Retour aux productions" />

      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-[26px] font-bold mb-2 m-0" style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-text)' }}>
            {production.name}
          </h1>
          <div className="flex gap-2 flex-wrap">
            <StateBadge label={state.label} color={state.color} bg={state.bg} />
            {production.activity_family && (
              <StateBadge label={family.label} color={family.color} bg={family.bg} dot={false} />
            )}
          </div>
        </div>
        <PrimaryButton href={`/backend/activity_productions/${production.id}/edit`} variant="secondary">Modifier</PrimaryButton>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <SectionCard>
          <SectionTitle icon={Info}>Détails</SectionTitle>
          <DetailRow cols={2} items={[
            { label: 'Activité', value: production.activity_id
              ? <a href={`/backend/activities/${production.activity_id}`} className="no-underline hover:underline" style={{ color: 'var(--color-primary)' }}>{production.activity_name || '—'}</a>
              : production.activity_name || '—' },
            { label: 'Campagne', value: production.campaign_id
              ? <a href={`/backend/campaigns/${production.campaign_id}`} className="no-underline hover:underline" style={{ color: 'var(--color-primary)' }}>{production.campaign_name || '—'}</a>
              : production.campaign_name || '—' },
            { label: 'Parcelle', value: production.cultivable_zone_id
              ? <a href={`/backend/cultivable-zones/${production.cultivable_zone_id}`} className="no-underline hover:underline" style={{ color: 'var(--color-primary)' }}>{production.cultivable_zone_name || '—'}</a>
              : production.cultivable_zone_name || '—' },
            { label: 'Début',     value: production.started_on ?? '—' },
            { label: 'Fin',       value: production.stopped_on ?? 'En cours' },
            { label: 'Superficie', value: production.size_value ? `${production.size_value} ${production.size_unit_name}` : '—' },
          ]} />
        </SectionCard>

        <SectionCard>
          <SectionTitle icon={Droplets}>Caractéristiques</SectionTitle>
          <div className="flex flex-col gap-3">
            <div>
              <dt className="text-xs mb-1" style={{ color: 'var(--color-text-muted)' }}>Irrigué</dt>
              <StateBadge
                label={production.irrigated ? 'Oui' : 'Non'}
                color={production.irrigated ? 'var(--color-info)' : 'var(--color-text-muted)'}
                bg={production.irrigated ? 'var(--color-info-bg)' : 'var(--color-bg-subtle)'}
                dot={false}
              />
            </div>
            <div>
              <dt className="text-xs mb-1" style={{ color: 'var(--color-text-muted)' }}>Fixation azote</dt>
              <StateBadge
                label={production.nitrate_fixing ? 'Oui' : 'Non'}
                color={production.nitrate_fixing ? 'var(--color-success-text)' : 'var(--color-text-muted)'}
                bg={production.nitrate_fixing ? 'var(--color-success-bg)' : 'var(--color-bg-subtle)'}
                dot={false}
              />
            </div>
            {production.usage && (
              <DetailRow cols={2} items={[{ label: 'Usage', value: production.usage }]} />
            )}
            {production.rank_number > 0 && (
              <DetailRow cols={2} items={[{ label: 'Rang', value: `#${production.rank_number}` }]} />
            )}
          </div>
        </SectionCard>
      </div>

      <SectionCard className="mt-4">
        <SectionTitle icon={Wrench}>Interventions ({interventions.length})</SectionTitle>
        <DataTable
          columns={[
            { key: 'name',  label: 'Intervention' },
            { key: 'date',  label: 'Date' },
            { key: 'state', label: 'État' },
          ]}
          data={interventions}
          emptyMessage="Aucune intervention enregistrée."
          renderRow={(iv) => (
            <tr key={iv.id} style={{ borderTop: '1px solid var(--color-border)' }}>
              <td className="px-3 py-3">
                <a href={`/backend/interventions/${iv.id}`} className="no-underline hover:underline" style={{ color: 'var(--color-primary)' }}>
                  {iv.name}
                </a>
              </td>
              <td className="px-3 py-3 text-sm" style={{ color: 'var(--color-text)' }}>
                {iv.started_at ? iv.started_at.slice(0, 10) : '—'}
              </td>
              <td className="px-3 py-3 text-sm" style={{ color: 'var(--color-text)' }}>
                {INTERVENTION_STATE_LABELS[iv.state] ?? iv.state}
              </td>
            </tr>
          )}
        />
      </SectionCard>
    </>
  )
}

ProductionShow.layout = (page: ReactNode) => <AppShell>{page}</AppShell>

export default ProductionShow
