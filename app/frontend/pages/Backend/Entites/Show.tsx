import type { ReactNode } from 'react'
import { ArrowLeft, User, Building2, FileText } from 'lucide-react'
import { AppShell } from '../../../components/AppShell'
import type { EntiteShowProps } from '../../../types/entite'

function EntiteShow({ entite }: EntiteShowProps) {
  const isOrg = entite.nature === 'organization'

  const roleList: Array<{ label: string; bg: string; color: string }> = []
  if (entite.client)      roleList.push({ label: 'Client',       bg: '#dbeafe', color: '#1e40af' })
  if (entite.supplier)    roleList.push({ label: 'Fournisseur',   bg: '#fef3c7', color: '#92400e' })
  if (entite.transporter) roleList.push({ label: 'Transporteur',  bg: '#f0fdf4', color: '#166534' })
  if (entite.prospect)    roleList.push({ label: 'Prospect',      bg: '#fdf4ff', color: '#7e22ce' })

  return (
    <>
      {/* Back */}
      <div className="mb-6">
        <a
          href="/backend/entities"
          className="flex items-center gap-1 text-sm no-underline"
          style={{ color: 'var(--color-text-muted)' }}
        >
          <ArrowLeft size={16} />
          Retour aux entités
        </a>
      </div>

      {/* Title row */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div
              className="flex items-center justify-center rounded-full"
              style={{ width: '48px', height: '48px', background: isOrg ? '#dbeafe' : '#fef3c7', flexShrink: 0 }}
            >
              {isOrg
                ? <Building2 size={22} style={{ color: '#1e40af' }} />
                : <User size={22} style={{ color: '#92400e' }} />
              }
            </div>
            <div>
              <h1 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-text)' }}>
                {entite.full_name}
              </h1>
              <span
                className="inline-block px-2 py-0.5 rounded-full text-xs font-semibold"
                style={isOrg
                  ? { background: '#dbeafe', color: '#1e40af' }
                  : { background: '#fef3c7', color: '#92400e' }
                }
              >
                {isOrg ? 'Organisation' : 'Contact'}
              </span>
            </div>
          </div>
          {roleList.length > 0 && (
            <div className="flex gap-2 flex-wrap mt-2">
              {roleList.map((r) => (
                <span
                  key={r.label}
                  className="inline-block px-2 py-0.5 rounded-full text-xs font-semibold"
                  style={{ background: r.bg, color: r.color }}
                >
                  {r.label}
                </span>
              ))}
            </div>
          )}
        </div>
        <div className="flex gap-2">
          {!entite.active && (
            <span
              className="px-2 py-1 rounded text-xs font-semibold self-start"
              style={{ background: '#fee2e2', color: '#991b1b' }}
            >
              Inactif
            </span>
          )}
          <a
            href={`/backend/entities/${entite.id}/edit`}
            className="px-3 py-1.5 rounded text-sm font-medium no-underline"
            style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }}
          >
            Modifier
          </a>
        </div>
      </div>

      {/* Info grid */}
      <div className="grid gap-4" style={{ gridTemplateColumns: '1fr 1fr' }}>
        {/* Identité */}
        <div className="rounded-lg p-5" style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-card)' }}>
          <h2 className="text-sm font-semibold uppercase tracking-wide mb-4 flex items-center gap-2" style={{ color: 'var(--color-text-muted)' }}>
            {isOrg ? <Building2 size={14} /> : <User size={14} />}
            Identité
          </h2>
          <dl className="grid grid-cols-1 gap-y-3">
            {[
              { label: 'Numéro', value: entite.number || '—' },
              !isOrg ? { label: 'Titre', value: entite.title || '—' } : null,
              !isOrg ? { label: 'Date de naissance', value: entite.born_at?.slice(0, 10) ?? '—' } : null,
              { label: 'Pays', value: entite.country || '—' },
              { label: 'Langue', value: entite.language || '—' },
              { label: 'Devise', value: entite.currency || '—' },
            ].filter((item): item is { label: string; value: string } => item !== null).map((item) => (
              <div key={item.label}>
                <dt className="text-xs mb-0.5" style={{ color: 'var(--color-text-muted)' }}>{item.label}</dt>
                <dd className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>{item.value}</dd>
              </div>
            ))}
          </dl>
        </div>

        {/* Fiscal */}
        <div className="rounded-lg p-5" style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-card)' }}>
          <h2 className="text-sm font-semibold uppercase tracking-wide mb-4 flex items-center gap-2" style={{ color: 'var(--color-text-muted)' }}>
            <FileText size={14} /> Fiscal & Commercial
          </h2>
          <dl className="grid grid-cols-1 gap-y-3">
            {[
              { label: 'N° TVA', value: entite.vat_number || '—' },
              { label: 'SIRET', value: entite.siret_number || '—' },
              { label: 'Assujetti TVA', value: entite.vat_subjected ? 'Oui' : 'Non' },
            ].map(({ label, value }) => (
              <div key={label}>
                <dt className="text-xs mb-0.5" style={{ color: 'var(--color-text-muted)' }}>{label}</dt>
                <dd className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>{value}</dd>
              </div>
            ))}
          </dl>
          {entite.description && (
            <div className="mt-4 pt-4" style={{ borderTop: '1px solid var(--color-border)' }}>
              <dt className="text-xs mb-1" style={{ color: 'var(--color-text-muted)' }}>Description</dt>
              <dd className="text-sm" style={{ color: 'var(--color-text)' }}>{entite.description}</dd>
            </div>
          )}
        </div>
      </div>
    </>
  )
}

EntiteShow.layout = (page: ReactNode) => <AppShell>{page}</AppShell>

export default EntiteShow
