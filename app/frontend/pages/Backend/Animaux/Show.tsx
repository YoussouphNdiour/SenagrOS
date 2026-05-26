import type { ReactNode } from 'react'
import { PawPrint, Hash, Settings, Wrench } from 'lucide-react'
import { AppShell } from '../../../components/AppShell'
import { BackLink, IconBox, SectionCard, SectionTitle, DetailRow, StateBadge, PrimaryButton, DataTable } from '../../../components/ui'
import type { AnimalShowProps } from '../../../types/animal'

const STATE_LABELS: Record<string, string> = {
  in_progress: 'En cours',
  done: 'Terminée',
  validated: 'Validée',
}

function AnimalShow({ animal, interventions }: AnimalShowProps) {
  const isAlive = !animal.dead_at

  return (
    <>
      <BackLink href="/backend/animals" label="Retour aux animaux" />

      <div className="flex justify-between items-start mb-6">
        <div className="flex items-center gap-3">
          <IconBox icon={PawPrint} color="var(--color-success-text)" bg="var(--color-success-bg)" />
          <div>
            <h1 className="text-[26px] font-bold m-0" style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-text)' }}>
              {animal.name}
            </h1>
            <div className="flex gap-2 mt-1">
              <StateBadge
                label={isAlive ? 'Vivant' : 'Décédé'}
                color={isAlive ? 'var(--color-success-text)' : 'var(--color-danger-text)'}
                bg={isAlive ? 'var(--color-success-bg)' : 'var(--color-danger-bg)'}
              />
            </div>
          </div>
        </div>
        <PrimaryButton href={`/backend/animals/${animal.id}/edit`} variant="secondary">Modifier</PrimaryButton>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <SectionCard>
          <SectionTitle icon={Hash}>Identification</SectionTitle>
          <DetailRow cols={2} items={[
            { label: 'Numéro',            value: animal.number || '—' },
            { label: 'N° identification', value: animal.identification_number || '—' },
            { label: 'Race / Variété',    value: animal.variety || '—' },
          ]} />
        </SectionCard>

        <SectionCard>
          <SectionTitle icon={Settings}>Cycle de vie</SectionTitle>
          <DetailRow cols={2} items={[
            { label: 'Date de naissance', value: animal.born_at?.slice(0, 10) ?? '—' },
            { label: 'Date de décès',     value: animal.dead_at?.slice(0, 10) ?? '—' },
            ...(animal.description ? [{ label: 'Description', value: animal.description, fullWidth: true }] : []),
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

AnimalShow.layout = (page: ReactNode) => <AppShell>{page}</AppShell>
export default AnimalShow
