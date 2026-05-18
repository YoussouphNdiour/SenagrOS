import type { ReactNode } from 'react'
import { ArrowLeft, PawPrint, Hash, Settings, Wrench } from 'lucide-react'
import { AppShell } from '../../../components/AppShell'
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
      <div className="mb-6">
        <a href="/backend/animals" className="flex items-center gap-1 text-sm no-underline" style={{ color: 'var(--color-text-muted)' }}>
          <ArrowLeft size={16} /> Retour aux animaux
        </a>
      </div>

      <div className="flex justify-between items-start mb-6">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center rounded-lg" style={{ width: 48, height: 48, background: 'var(--color-success-bg)', flexShrink: 0 }}>
            <PawPrint size={22} style={{ color: 'var(--color-success-text)' }} />
          </div>
          <div>
            <h1 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-text)' }}>
              {animal.name}
            </h1>
            <div className="flex gap-2 mt-1">
              <span className="inline-block px-2 py-0.5 rounded-full text-xs font-semibold"
                style={isAlive
                  ? { background: 'var(--color-success-bg)', color: 'var(--color-success-text)' }
                  : { background: 'var(--color-danger-bg)', color: 'var(--color-danger-text)' }}>
                {isAlive ? 'Vivant' : 'Décédé'}
              </span>
            </div>
          </div>
        </div>
        <a href={`/backend/animals/${animal.id}/edit`}
          className="px-3 py-1.5 rounded text-sm font-medium no-underline"
          style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }}>
          Modifier
        </a>
      </div>

      <div className="grid gap-4" style={{ gridTemplateColumns: '1fr 1fr' }}>
        <div className="rounded-lg p-5" style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-card)' }}>
          <h2 className="text-sm font-semibold uppercase tracking-wide mb-4 flex items-center gap-2" style={{ color: 'var(--color-text-muted)' }}>
            <Hash size={14} /> Identification
          </h2>
          <dl className="grid grid-cols-1 gap-y-3">
            {[
              { label: 'Numéro',            value: animal.number || '—' },
              { label: "N° identification", value: animal.identification_number || '—' },
              { label: 'Race / Variété',    value: animal.variety || '—' },
            ].map(({ label, value }) => (
              <div key={label}>
                <dt className="text-xs mb-0.5" style={{ color: 'var(--color-text-muted)' }}>{label}</dt>
                <dd className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>{value}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="rounded-lg p-5" style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-card)' }}>
          <h2 className="text-sm font-semibold uppercase tracking-wide mb-4 flex items-center gap-2" style={{ color: 'var(--color-text-muted)' }}>
            <Settings size={14} /> Cycle de vie
          </h2>
          <dl className="grid grid-cols-1 gap-y-3">
            {[
              { label: 'Date de naissance', value: animal.born_at?.slice(0, 10) ?? '—' },
              { label: 'Date de décès',     value: animal.dead_at?.slice(0, 10) ?? '—' },
            ].map(({ label, value }) => (
              <div key={label}>
                <dt className="text-xs mb-0.5" style={{ color: 'var(--color-text-muted)' }}>{label}</dt>
                <dd className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>{value}</dd>
              </div>
            ))}
          </dl>
          {animal.description && (
            <div className="mt-4 pt-4" style={{ borderTop: '1px solid var(--color-border)' }}>
              <dt className="text-xs mb-1" style={{ color: 'var(--color-text-muted)' }}>Description</dt>
              <dd className="text-sm" style={{ color: 'var(--color-text)' }}>{animal.description}</dd>
            </div>
          )}
        </div>
      </div>

      <div className="mt-6 rounded-lg" style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-card)' }}>
        <div className="flex items-center gap-2 px-5 py-4" style={{ borderBottom: '1px solid var(--color-border)' }}>
          <Wrench size={16} style={{ color: 'var(--color-text-muted)' }} />
          <h2 className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
            Interventions ({interventions.length})
          </h2>
        </div>
        {interventions.length === 0 ? (
          <p className="px-5 py-4 text-sm" style={{ color: 'var(--color-text-muted)' }}>Aucune intervention enregistrée.</p>
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
              {interventions.map((iv) => (
                <tr key={iv.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <td className="px-5 py-3">
                    <a href={`/backend/interventions/${iv.id}`} className="no-underline font-medium" style={{ color: 'var(--color-primary)' }}>
                      {iv.name}
                    </a>
                  </td>
                  <td className="px-5 py-3" style={{ color: 'var(--color-text-muted)' }}>
                    {iv.started_at ? new Date(iv.started_at).toLocaleDateString('fr-FR') : '—'}
                  </td>
                  <td className="px-5 py-3" style={{ color: 'var(--color-text)' }}>
                    {STATE_LABELS[iv.state] ?? iv.state}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  )
}

AnimalShow.layout = (page: ReactNode) => <AppShell>{page}</AppShell>
export default AnimalShow
