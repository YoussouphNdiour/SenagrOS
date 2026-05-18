import type { ReactNode } from 'react'
import { ArrowLeft, Tractor, Settings, Hash, Wrench, Shield, Link2 } from 'lucide-react'
import { AppShell } from '../../../components/AppShell'
import type { EquipementShowProps } from '../../../types/equipement'

const STATE_LABELS: Record<string, string> = {
  in_progress: 'En cours',
  done: 'Terminée',
  validated: 'Validée',
}

function EquipementShow({ equipement, interventions, maintenances, links }: EquipementShowProps) {
  const isActive = !equipement.dead_at

  return (
    <>
      {/* Back */}
      <div className="mb-6">
        <a
          href="/backend/equipments"
          className="flex items-center gap-1 text-sm no-underline"
          style={{ color: 'var(--color-text-muted)' }}
        >
          <ArrowLeft size={16} />
          Retour aux équipements
        </a>
      </div>

      {/* Title */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div
              className="flex items-center justify-center rounded-lg"
              style={{ width: '48px', height: '48px', background: '#d1fae5', flexShrink: 0 }}
            >
              <Tractor size={22} style={{ color: '#065f46' }} />
            </div>
            <div>
              <h1 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-text)' }}>
                {equipement.name}
              </h1>
              <div className="flex gap-2 mt-1 flex-wrap">
                {equipement.work_number && (
                  <span
                    className="inline-block px-2 py-0.5 rounded text-xs font-mono font-semibold"
                    style={{ background: 'var(--color-bg-subtle)', color: 'var(--color-text-muted)', border: '1px solid var(--color-border)' }}
                  >
                    N° {equipement.work_number}
                  </span>
                )}
                <span
                  className="inline-block px-2 py-0.5 rounded-full text-xs font-semibold"
                  style={isActive
                    ? { background: '#d1fae5', color: '#065f46' }
                    : { background: '#fee2e2', color: '#991b1b' }
                  }
                >
                  {isActive ? 'Actif' : 'Retiré du service'}
                </span>
              </div>
            </div>
          </div>
        </div>
        <a
          href={`/backend/equipments/${equipement.id}/edit`}
          className="px-3 py-1.5 rounded text-sm font-medium no-underline"
          style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }}
        >
          Modifier
        </a>
      </div>

      {/* Info grid */}
      <div className="grid gap-4" style={{ gridTemplateColumns: '1fr 1fr' }}>
        {/* Identification */}
        <div className="rounded-lg p-5" style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-card)' }}>
          <h2 className="text-sm font-semibold uppercase tracking-wide mb-4 flex items-center gap-2" style={{ color: 'var(--color-text-muted)' }}>
            <Hash size={14} /> Identification
          </h2>
          <dl className="grid grid-cols-1 gap-y-3">
            {[
              { label: 'Nom', value: equipement.name },
              { label: 'Numéro de travail', value: equipement.work_number || '—' },
              { label: 'Numéro interne', value: equipement.number || '—' },
              { label: "N° d'identification", value: equipement.identification_number || '—' },
              { label: 'Variante', value: equipement.variant_name || '—' },
              { label: 'Type', value: equipement.type || '—' },
            ].map(({ label, value }) => (
              <div key={label}>
                <dt className="text-xs mb-0.5" style={{ color: 'var(--color-text-muted)' }}>{label}</dt>
                <dd className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>{value}</dd>
              </div>
            ))}
          </dl>
        </div>

        {/* Cycle de vie */}
        <div className="rounded-lg p-5" style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-card)' }}>
          <h2 className="text-sm font-semibold uppercase tracking-wide mb-4 flex items-center gap-2" style={{ color: 'var(--color-text-muted)' }}>
            <Settings size={14} /> Cycle de vie
          </h2>
          <dl className="grid grid-cols-1 gap-y-3">
            {[
              { label: 'Mis en service', value: equipement.born_at?.slice(0, 10) ?? '—' },
              { label: 'Retiré du service', value: equipement.dead_at?.slice(0, 10) ?? '—' },
            ].map(({ label, value }) => (
              <div key={label}>
                <dt className="text-xs mb-0.5" style={{ color: 'var(--color-text-muted)' }}>{label}</dt>
                <dd className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>{value}</dd>
              </div>
            ))}
          </dl>
          {equipement.description && (
            <div className="mt-4 pt-4" style={{ borderTop: '1px solid var(--color-border)' }}>
              <dt className="text-xs mb-1" style={{ color: 'var(--color-text-muted)' }}>Description</dt>
              <dd className="text-sm" style={{ color: 'var(--color-text)' }}>{equipement.description}</dd>
            </div>
          )}
        </div>
      </div>

      {/* Interventions */}
      <div className="mt-6 rounded-lg" style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-card)' }}>
        <div className="flex items-center gap-2 px-5 py-4" style={{ borderBottom: '1px solid var(--color-border)' }}>
          <Wrench size={16} style={{ color: 'var(--color-text-muted)' }} />
          <h2 className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
            Interventions ({interventions.length})
          </h2>
        </div>
        {interventions.length === 0 ? (
          <p className="px-5 py-4 text-sm" style={{ color: 'var(--color-text-muted)' }}>
            Aucune intervention enregistrée.
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--color-text-muted)' }}>Intervention</th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--color-text-muted)' }}>Date</th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--color-text-muted)' }}>État</th>
              </tr>
            </thead>
            <tbody>
              {interventions.map((intervention) => (
                <tr key={intervention.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <td className="px-5 py-3">
                    <a
                      href={`/backend/interventions/${intervention.id}`}
                      className="no-underline font-medium"
                      style={{ color: 'var(--color-primary)' }}
                    >
                      {intervention.name}
                    </a>
                  </td>
                  <td className="px-5 py-3" style={{ color: 'var(--color-text-muted)' }}>
                    {intervention.started_at
                      ? new Date(intervention.started_at).toLocaleDateString('fr-FR')
                      : '—'}
                  </td>
                  <td className="px-5 py-3" style={{ color: 'var(--color-text)' }}>
                    {STATE_LABELS[intervention.state] ?? intervention.state}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Maintenances */}
      <div className="mt-4 rounded-lg" style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-card)' }}>
        <div className="flex items-center gap-2 px-5 py-4" style={{ borderBottom: '1px solid var(--color-border)' }}>
          <Shield size={16} style={{ color: 'var(--color-text-muted)' }} />
          <h2 className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
            Maintenances ({maintenances.length})
          </h2>
        </div>
        {maintenances.length === 0 ? (
          <p className="px-5 py-4 text-sm" style={{ color: 'var(--color-text-muted)' }}>
            Aucune maintenance enregistrée.
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--color-text-muted)' }}>Intervention</th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--color-text-muted)' }}>Date</th>
              </tr>
            </thead>
            <tbody>
              {maintenances.map((m) => (
                <tr key={m.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <td className="px-5 py-3">
                    <a
                      href={`/backend/interventions/${m.id}`}
                      className="no-underline font-medium"
                      style={{ color: 'var(--color-primary)' }}
                    >
                      {m.description || `Maintenance #${m.id}`}
                    </a>
                  </td>
                  <td className="px-5 py-3" style={{ color: 'var(--color-text-muted)' }}>
                    {m.started_at
                      ? new Date(m.started_at).toLocaleDateString('fr-FR')
                      : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Liens — only when non-empty */}
      {links.length > 0 && (
        <div className="mt-4 rounded-lg" style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-card)' }}>
          <div className="flex items-center gap-2 px-5 py-4" style={{ borderBottom: '1px solid var(--color-border)' }}>
            <Link2 size={16} style={{ color: 'var(--color-text-muted)' }} />
            <h2 className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
              Liens ({links.length})
            </h2>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--color-text-muted)' }}>Nature</th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--color-text-muted)' }}>Lié à</th>
              </tr>
            </thead>
            <tbody>
              {links.map((link) => (
                <tr key={link.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <td className="px-5 py-3 font-medium" style={{ color: 'var(--color-text)' }}>
                    {link.nature}
                  </td>
                  <td className="px-5 py-3" style={{ color: 'var(--color-text)' }}>
                    {link.linked_name}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  )
}

EquipementShow.layout = (page: ReactNode) => <AppShell>{page}</AppShell>

export default EquipementShow
