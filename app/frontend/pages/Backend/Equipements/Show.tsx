import type { ReactNode } from 'react'
import { Tractor, Settings, Hash, Wrench, Shield, Link2 } from 'lucide-react'
import { router } from '@inertiajs/react'
import { AppShell } from '../../../components/AppShell'
import { BackLink, ConfirmDeleteButton, IconBox, SectionCard, SectionTitle, DetailRow, StateBadge, CodeBadge, PrimaryButton, DataTable } from '../../../components/ui'
import type { EquipementShowProps } from '../../../types/equipement'

const STATE_LABELS: Record<string, string> = {
  in_progress: 'En cours',
  done: 'Terminée',
  validated: 'Validée',
}

function EquipementShow({ equipement, interventions, maintenances, links, canDestroy }: EquipementShowProps) {
  const isActive = !equipement.dead_at

  return (
    <>
      <BackLink href="/backend/equipments" label="Retour aux équipements" />

      <div className="flex justify-between items-start mb-6">
        <div className="flex items-center gap-3">
          <IconBox icon={Tractor} color="var(--color-success-text)" bg="var(--color-success-bg)" />
          <div>
            <h1 className="text-[26px] font-bold m-0" style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-text)' }}>
              {equipement.name}
            </h1>
            <div className="flex gap-2 mt-1 flex-wrap">
              {equipement.work_number && (
                <CodeBadge value={equipement.work_number} />
              )}
              <StateBadge
                label={isActive ? 'Actif' : 'Retiré du service'}
                color={isActive ? 'var(--color-success-text)' : 'var(--color-danger-text)'}
                bg={isActive ? 'var(--color-success-bg)' : 'var(--color-danger-bg)'}
              />
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <PrimaryButton href={`/backend/equipments/${equipement.id}/edit`} variant="secondary">Modifier</PrimaryButton>
          <ConfirmDeleteButton
            onDelete={() => router.delete(`/backend/equipments/${equipement.id}`)}
            canDestroy={canDestroy}
            resourceName="cet équipement"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <SectionCard>
          <SectionTitle icon={Hash}>Identification</SectionTitle>
          <DetailRow cols={2} items={[
            { label: 'Nom',                 value: equipement.name },
            { label: 'Numéro de travail',   value: equipement.work_number || '—' },
            { label: 'Numéro interne',      value: equipement.number || '—' },
            { label: "N° d'identification", value: equipement.identification_number || '—' },
            { label: 'Variante',            value: equipement.variant_name || '—' },
            { label: 'Type',                value: equipement.type || '—' },
          ]} />
        </SectionCard>

        <SectionCard>
          <SectionTitle icon={Settings}>Cycle de vie</SectionTitle>
          <DetailRow cols={2} items={[
            { label: 'Mis en service',      value: equipement.born_at?.slice(0, 10) ?? '—' },
            { label: 'Retiré du service',   value: equipement.dead_at?.slice(0, 10) ?? '—' },
            ...(equipement.description ? [{ label: 'Description', value: equipement.description, fullWidth: true }] : []),
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
          renderRow={(intervention) => (
            <tr key={intervention.id} style={{ borderTop: '1px solid var(--color-border)' }}>
              <td className="px-3 py-3">
                <a href={`/backend/interventions/${intervention.id}`} className="no-underline font-medium" style={{ color: 'var(--color-primary)' }}>
                  {intervention.name}
                </a>
              </td>
              <td className="px-3 py-3 text-sm" style={{ color: 'var(--color-text-muted)' }}>
                {intervention.started_at ? new Date(intervention.started_at).toLocaleDateString('fr-FR') : '—'}
              </td>
              <td className="px-3 py-3 text-sm" style={{ color: 'var(--color-text)' }}>
                {STATE_LABELS[intervention.state] ?? intervention.state}
              </td>
            </tr>
          )}
        />
      </SectionCard>

      <SectionCard className="mt-4">
        <SectionTitle icon={Shield}>Maintenances ({maintenances.length})</SectionTitle>
        <DataTable
          columns={[
            { key: 'name', label: 'Intervention' },
            { key: 'date', label: 'Date' },
          ]}
          data={maintenances}
          emptyMessage="Aucune maintenance enregistrée."
          renderRow={(m) => (
            <tr key={m.id} style={{ borderTop: '1px solid var(--color-border)' }}>
              <td className="px-3 py-3">
                <a href={`/backend/interventions/${m.id}`} className="no-underline font-medium" style={{ color: 'var(--color-primary)' }}>
                  {m.description || `Maintenance #${m.id}`}
                </a>
              </td>
              <td className="px-3 py-3 text-sm" style={{ color: 'var(--color-text-muted)' }}>
                {m.started_at ? new Date(m.started_at).toLocaleDateString('fr-FR') : '—'}
              </td>
            </tr>
          )}
        />
      </SectionCard>

      {links.length > 0 && (
        <SectionCard className="mt-4">
          <SectionTitle icon={Link2}>Liens ({links.length})</SectionTitle>
          <DataTable
            columns={[
              { key: 'nature', label: 'Nature' },
              { key: 'linked', label: 'Lié à' },
            ]}
            data={links}
            renderRow={(link) => (
              <tr key={link.id} style={{ borderTop: '1px solid var(--color-border)' }}>
                <td className="px-3 py-3 text-sm font-medium" style={{ color: 'var(--color-text)' }}>
                  {link.nature}
                </td>
                <td className="px-3 py-3 text-sm" style={{ color: 'var(--color-text)' }}>
                  {link.linked_name}
                </td>
              </tr>
            )}
          />
        </SectionCard>
      )}
    </>
  )
}

EquipementShow.layout = (page: ReactNode) => <AppShell>{page}</AppShell>

export default EquipementShow
