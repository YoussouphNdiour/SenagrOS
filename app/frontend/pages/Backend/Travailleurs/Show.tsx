import type { ReactNode } from 'react'
import { HardHat, Hash, Settings, Wrench } from 'lucide-react'
import { AppShell } from '../../../components/AppShell'
import { BackLink, IconBox, SectionCard, SectionTitle, DetailRow, StateBadge, CodeBadge, PrimaryButton, DataTable } from '../../../components/ui'
import type { TravailleurShowProps } from '../../../types/travailleur'

const STATE_LABELS: Record<string, string> = {
  in_progress: 'En cours',
  done: 'Terminée',
  validated: 'Validée',
}

function TravailleurShow({ travailleur, interventions }: TravailleurShowProps) {
  const isActive = !travailleur.dead_at

  return (
    <>
      <BackLink href="/backend/workers" label="Liste des travailleurs" />

      <div className="flex justify-between items-start mb-6">
        <div className="flex items-center gap-3">
          <IconBox icon={HardHat} color="var(--color-primary)" bg="var(--color-success-bg)" />
          <div>
            <h1 className="text-[26px] font-bold m-0" style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-text)' }}>
              {travailleur.name}
            </h1>
            <div className="flex gap-2 mt-1">
              {travailleur.work_number && (
                <CodeBadge value={travailleur.work_number} />
              )}
              <StateBadge
                label={isActive ? 'Actif' : 'Inactif'}
                color={isActive ? 'var(--color-success-text)' : 'var(--color-danger-text)'}
                bg={isActive ? 'var(--color-success-bg)' : 'var(--color-danger-bg)'}
              />
            </div>
          </div>
        </div>
        <PrimaryButton href={`/backend/workers/${travailleur.id}/edit`} variant="secondary">Modifier</PrimaryButton>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <SectionCard>
          <SectionTitle icon={Hash}>Identification</SectionTitle>
          <DetailRow cols={2} items={[
            { label: 'N° travail',        value: travailleur.work_number || '—' },
            { label: 'Numéro',            value: travailleur.number || '—' },
            { label: 'N° identification', value: travailleur.identification_number || '—' },
          ]} />
        </SectionCard>

        <SectionCard>
          <SectionTitle icon={Settings}>Cycle de vie</SectionTitle>
          <DetailRow cols={2} items={[
            { label: 'Date de naissance', value: travailleur.born_at?.slice(0, 10) ?? '—' },
            { label: 'Date de départ',    value: travailleur.dead_at?.slice(0, 10) ?? '—' },
            ...(travailleur.description ? [{ label: 'Description', value: travailleur.description, fullWidth: true }] : []),
          ]} />
        </SectionCard>
      </div>

      <SectionCard className="mt-4">
        <SectionTitle icon={Wrench}>Interventions ({interventions.length})</SectionTitle>
        <DataTable
          columns={[
            { key: 'name', label: 'Intervention' },
            { key: 'date', label: 'Date' },
            { key: 'state', label: 'État' },
          ]}
          data={interventions}
          emptyMessage="Aucune intervention enregistrée."
          renderRow={(iv) => (
            <tr key={iv.id} style={{ borderTop: '1px solid var(--color-border)' }}>
              <td className="px-3 py-3">
                <a href={`/backend/interventions/${iv.id}`} className="no-underline font-medium" style={{ color: 'var(--color-primary)' }}>
                  {iv.name}
                </a>
              </td>
              <td className="px-3 py-3 text-sm" style={{ color: 'var(--color-text-muted)' }}>
                {iv.started_at ? new Date(iv.started_at).toLocaleDateString('fr-FR') : '—'}
              </td>
              <td className="px-3 py-3 text-sm" style={{ color: 'var(--color-text)' }}>
                {STATE_LABELS[iv.state] ?? iv.state}
              </td>
            </tr>
          )}
        />
      </SectionCard>
    </>
  )
}

TravailleurShow.layout = (page: ReactNode) => <AppShell>{page}</AppShell>
export default TravailleurShow
