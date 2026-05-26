import type { ReactNode } from 'react'
import { Sprout, Tag, List } from 'lucide-react'
import { AppShell } from '../../../components/AppShell'
import { BackLink, SectionCard, SectionTitle, DetailRow, StateBadge, PrimaryButton, DataTable } from '../../../components/ui'
import type { ActiviteShowProps } from '../../../types/activite'

const FAMILY_CONFIG: Record<string, { label: string; bg: string; color: string }> = {
  plant_farming:      { label: 'Culture végétale',   bg: 'var(--color-success-bg)',  color: 'var(--color-success-text)' },
  vine_farming:       { label: 'Viticulture',         bg: '#ede9fe',                  color: '#4c1d95' },
  animal_farming:     { label: 'Élevage',             bg: 'var(--color-warning-bg)',  color: 'var(--color-warning-text)' },
  tool_maintaining:   { label: 'Entretien outillage', bg: 'var(--color-info-bg)',     color: 'var(--color-info)' },
  service_delivering: { label: 'Prestation service',  bg: 'var(--color-bg-subtle)',   color: 'var(--color-text-muted)' },
}

const NATURE_LABELS: Record<string, string> = {
  main:       'Principale',
  auxiliary:  'Auxiliaire',
  standalone: 'Autonome',
}

const STATE_COLORS: Record<string, { bg: string; color: string; label: string }> = {
  opened:  { bg: 'var(--color-success-bg)', color: 'var(--color-success-text)', label: 'Ouverte' },
  closed:  { bg: 'var(--color-danger-bg)',  color: 'var(--color-danger-text)',  label: 'Clôturée' },
  aborted: { bg: 'var(--color-warning-bg)', color: 'var(--color-warning-text)', label: 'Abandonnée' },
}

const ActiviteShow = ({ activite, productions }: ActiviteShowProps) => {
  const family = FAMILY_CONFIG[activite.family] ?? { label: activite.family, bg: 'var(--color-bg-subtle)', color: 'var(--color-text-muted)' }
  const natureLabel = NATURE_LABELS[activite.nature] ?? activite.nature

  return (
    <>
      <BackLink href="/backend/activities" label="Retour aux activités" />

      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-[26px] font-bold mb-2 m-0" style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-text)' }}>
            {activite.name}
          </h1>
          <div className="flex gap-2 flex-wrap">
            <StateBadge label={family.label} color={family.color} bg={family.bg} dot={false} />
            <StateBadge label={natureLabel} color="var(--color-text-muted)" bg="var(--color-bg-subtle)" border="var(--color-border)" dot={false} />
            {activite.suspended && (
              <StateBadge label="Suspendue" color="var(--color-danger-text)" bg="var(--color-danger-bg)" dot={false} />
            )}
          </div>
        </div>
        <PrimaryButton href={`/backend/activities/${activite.id}/edit`} variant="secondary">Modifier</PrimaryButton>
      </div>

      <div className="grid gap-4 mb-5" style={{ gridTemplateColumns: '2fr 1fr' }}>
        <SectionCard>
          <SectionTitle icon={Tag}>Caractéristiques</SectionTitle>
          <DetailRow items={[
            { label: 'Famille',             value: family.label },
            { label: 'Nature',              value: natureLabel },
            { label: 'Cycle de production', value: activite.production_cycle || '—' },
            { label: 'Avec supports',       value: activite.with_supports ? 'Oui' : 'Non' },
            { label: 'Avec cultures',       value: activite.with_cultivation ? 'Oui' : 'Non' },
            { label: 'Variété support',     value: activite.support_variety || '—' },
            { label: 'Variété cultivée',    value: activite.cultivation_variety || '—' },
            { label: 'Début production',    value: activite.production_started_on ?? '—' },
            { label: 'Fin production',      value: activite.production_stopped_on ?? '—' },
            ...(activite.description ? [{ label: 'Description', value: activite.description, fullWidth: true }] : []),
          ]} />
        </SectionCard>

        <SectionCard>
          <SectionTitle icon={Sprout}>Statistiques</SectionTitle>
          <div className="text-center py-4">
            <div className="text-3xl font-bold mb-1" style={{ color: 'var(--color-primary)' }}>
              {activite.productions_count}
            </div>
            <div className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
              Production{activite.productions_count !== 1 ? 's' : ''}
            </div>
          </div>
        </SectionCard>
      </div>

      <SectionCard>
        <SectionTitle icon={List}>Productions liées ({productions.length})</SectionTitle>
        <DataTable
          columns={[
            { key: 'name',     label: 'Production' },
            { key: 'campaign', label: 'Campagne' },
            { key: 'parcelle', label: 'Parcelle' },
            { key: 'debut',    label: 'Début' },
            { key: 'state',    label: 'État' },
          ]}
          data={productions}
          emptyMessage="Aucune production pour cette activité."
          renderRow={(p, i) => {
            const s = STATE_COLORS[p.state] ?? { bg: 'var(--color-bg-subtle)', color: 'var(--color-text-muted)', label: p.state }
            return (
              <tr key={p.id} style={{ borderTop: i > 0 ? '1px solid var(--color-border)' : undefined }}>
                <td className="px-3 py-3 font-medium">
                  <a href={`/backend/activity_productions/${p.id}`} className="no-underline hover:underline" style={{ color: 'var(--color-primary)' }}>
                    {p.name}
                  </a>
                </td>
                <td className="px-3 py-3 text-sm" style={{ color: 'var(--color-text-muted)' }}>{p.campaign_name || '—'}</td>
                <td className="px-3 py-3 text-sm" style={{ color: 'var(--color-text-muted)' }}>{p.cultivable_zone_name || '—'}</td>
                <td className="px-3 py-3 text-sm" style={{ color: 'var(--color-text-muted)' }}>{p.started_on ?? '—'}</td>
                <td className="px-3 py-3">
                  <StateBadge label={s.label} color={s.color} bg={s.bg} dot={false} />
                </td>
              </tr>
            )
          }}
        />
      </SectionCard>
    </>
  )
}

ActiviteShow.layout = (page: ReactNode) => <AppShell>{page}</AppShell>

export default ActiviteShow
