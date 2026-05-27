import type { ReactNode } from 'react'
import { User, Building2, FileText } from 'lucide-react'
import { router } from '@inertiajs/react'
import { AppShell } from '../../../components/AppShell'
import { BackLink, ConfirmDeleteButton, SectionCard, SectionTitle, DetailRow, StateBadge, PrimaryButton } from '../../../components/ui'
import type { EntiteShowProps } from '../../../types/entite'

function EntiteShow({ entite, canDestroy }: EntiteShowProps) {
  const isOrg = entite.nature === 'organization'

  const roleList: Array<{ label: string; bg: string; color: string }> = []
  if (entite.client)      roleList.push({ label: 'Client',      bg: 'var(--color-info-bg)',     color: 'var(--color-info)' })
  if (entite.supplier)    roleList.push({ label: 'Fournisseur', bg: 'var(--color-warning-bg)',  color: 'var(--color-warning-text)' })
  if (entite.transporter) roleList.push({ label: 'Transporteur', bg: 'var(--color-success-bg)', color: 'var(--color-success-text)' })
  if (entite.prospect)    roleList.push({ label: 'Prospect',    bg: '#fdf4ff',                  color: '#7e22ce' })

  return (
    <>
      <BackLink href="/backend/entities" label="Liste des entités" />

      <div className="flex justify-between items-start mb-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div
              className="flex items-center justify-center rounded-full shrink-0"
              style={{ width: 48, height: 48, background: isOrg ? 'var(--color-info-bg)' : 'var(--color-warning-bg)' }}
            >
              {isOrg
                ? <Building2 size={22} style={{ color: 'var(--color-info)' }} />
                : <User size={22} style={{ color: 'var(--color-warning-text)' }} />
              }
            </div>
            <div>
              <h1 className="text-[26px] font-bold m-0" style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-text)' }}>
                {entite.full_name}
              </h1>
              <StateBadge
                label={isOrg ? 'Organisation' : 'Contact'}
                color={isOrg ? 'var(--color-info)' : 'var(--color-warning-text)'}
                bg={isOrg ? 'var(--color-info-bg)' : 'var(--color-warning-bg)'}
                dot={false}
              />
            </div>
          </div>
          {roleList.length > 0 && (
            <div className="flex gap-2 flex-wrap mt-2">
              {roleList.map((r) => (
                <StateBadge key={r.label} label={r.label} color={r.color} bg={r.bg} dot={false} />
              ))}
            </div>
          )}
        </div>
        <div className="flex gap-2 items-start">
          {!entite.active && (
            <StateBadge label="Inactif" color="var(--color-danger-text)" bg="var(--color-danger-bg)" dot={false} />
          )}
          <PrimaryButton href={`/backend/entities/${entite.id}/edit`} variant="secondary">Modifier</PrimaryButton>
          <ConfirmDeleteButton
            onDelete={() => router.delete(`/backend/entities/${entite.id}`)}
            canDestroy={canDestroy}
            resourceName="cette entité"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <SectionCard>
          <SectionTitle icon={isOrg ? Building2 : User}>Identité</SectionTitle>
          <DetailRow cols={2} items={[
            { label: 'Numéro', value: entite.number || '—' },
            ...(!isOrg ? [{ label: 'Titre', value: entite.title || '—' }] : []),
            ...(!isOrg ? [{ label: 'Date de naissance', value: entite.born_at?.slice(0, 10) ?? '—' }] : []),
            { label: 'Pays',   value: entite.country || '—' },
            { label: 'Langue', value: entite.language || '—' },
            { label: 'Devise', value: entite.currency || '—' },
          ]} />
        </SectionCard>

        <SectionCard>
          <SectionTitle icon={FileText}>Fiscal & Commercial</SectionTitle>
          <DetailRow cols={2} items={[
            { label: 'N° TVA',       value: entite.vat_number || '—' },
            { label: 'SIRET',        value: entite.siret_number || '—' },
            { label: 'Assujetti TVA', value: entite.vat_subjected ? 'Oui' : 'Non' },
            ...(entite.description ? [{ label: 'Description', value: entite.description, fullWidth: true }] : []),
          ]} />
        </SectionCard>
      </div>
    </>
  )
}

EntiteShow.layout = (page: ReactNode) => <AppShell>{page}</AppShell>

export default EntiteShow
