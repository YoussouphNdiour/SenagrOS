import type { ReactNode } from 'react'
import { Calendar, Sprout } from 'lucide-react'
import { router } from '@inertiajs/react'
import { AppShell } from '../../../components/AppShell'
import { BackLink, SectionCard, SectionTitle, DetailRow, StateBadge, PrimaryButton, DataTable, ConfirmDeleteButton } from '../../../components/ui'
import type { CampagneShowProps } from '../../../types/campagne'

const PRODUCTION_STATE: Record<string, { label: string; bg: string; color: string }> = {
  opened:  { label: 'Ouverte',    bg: 'var(--color-success-bg)', color: 'var(--color-success-text)' },
  closed:  { label: 'Clôturée',   bg: 'var(--color-danger-bg)',  color: 'var(--color-danger-text)' },
  aborted: { label: 'Abandonnée', bg: 'var(--color-warning-bg)', color: 'var(--color-warning-text)' },
}

function CampagneShow({ campagne, productions, canDestroy }: CampagneShowProps) {
  return (
    <>
      <BackLink href="/backend/campaigns" label="Retour aux campagnes" />

      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-[26px] font-bold mb-2 m-0" style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-text)' }}>
            {campagne.name}
          </h1>
          <StateBadge
            label={campagne.closed ? 'Clôturée' : 'En cours'}
            color={campagne.closed ? 'var(--color-danger-text)' : 'var(--color-success-text)'}
            bg={campagne.closed ? 'var(--color-danger-bg)' : 'var(--color-success-bg)'}
          />
        </div>
        <div className="flex items-center gap-2">
          <PrimaryButton href={`/backend/campaigns/${campagne.id}/edit`} variant="secondary">Modifier</PrimaryButton>
          <ConfirmDeleteButton
            onDelete={() => router.delete(`/backend/campaigns/${campagne.id}`)}
            canDestroy={canDestroy}
            resourceName="cette campagne"
          />
        </div>
      </div>

      <SectionCard className="mb-5">
        <SectionTitle icon={Calendar}>Informations</SectionTitle>
        <DetailRow items={[
          { label: 'Année de récolte', value: campagne.harvest_year },
          ...(campagne.closed_at ? [{ label: 'Date de clôture', value: campagne.closed_at.slice(0, 10) }] : []),
          ...(campagne.description ? [{ label: 'Description', value: campagne.description, fullWidth: true }] : []),
        ]} />
      </SectionCard>

      <SectionCard>
        <SectionTitle icon={Sprout}>Productions ({productions.length})</SectionTitle>
        <DataTable
          columns={[
            { key: 'name',     label: 'Production' },
            { key: 'activite', label: 'Activité' },
            { key: 'parcelle', label: 'Parcelle' },
            { key: 'debut',    label: 'Début' },
            { key: 'fin',      label: 'Fin' },
            { key: 'state',    label: 'État' },
          ]}
          data={productions}
          emptyMessage="Aucune production pour cette campagne."
          renderRow={(p, i) => {
            const s = PRODUCTION_STATE[p.state] ?? { label: p.state, bg: 'var(--color-bg-subtle)', color: 'var(--color-text-muted)' }
            return (
              <tr key={p.id} style={{ borderTop: i > 0 ? '1px solid var(--color-border)' : undefined }}>
                <td className="px-3 py-3 font-medium">
                  <a href={`/backend/activity_productions/${p.id}`} className="no-underline hover:underline" style={{ color: 'var(--color-primary)' }}>
                    {p.name}
                  </a>
                </td>
                <td className="px-3 py-3 text-sm" style={{ color: 'var(--color-text-muted)' }}>{p.activity_name || '—'}</td>
                <td className="px-3 py-3 text-sm" style={{ color: 'var(--color-text-muted)' }}>{p.cultivable_zone_name || '—'}</td>
                <td className="px-3 py-3 text-sm" style={{ color: 'var(--color-text-muted)' }}>{p.started_on ?? '—'}</td>
                <td className="px-3 py-3 text-sm" style={{ color: 'var(--color-text-muted)' }}>{p.stopped_on ?? '—'}</td>
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

CampagneShow.layout = (page: ReactNode) => <AppShell>{page}</AppShell>

export default CampagneShow
