import type { ReactNode } from 'react'
import { ArrowLeft, Calendar, Sprout } from 'lucide-react'
import { AppShell } from '../../../components/AppShell'
import type { CampagneShowProps } from '../../../types/campagne'

function CampagneShow({ campagne, productions }: CampagneShowProps) {
  const productionStateLabel = (state: string): { label: string; bg: string; color: string } => {
    const map: Record<string, { label: string; bg: string; color: string }> = {
      opened:  { label: 'Ouverte',     bg: '#d1fae5', color: '#065f46' },
      closed:  { label: 'Clôturée',    bg: '#fee2e2', color: '#991b1b' },
      aborted: { label: 'Abandonnée',  bg: '#fef3c7', color: '#92400e' },
    }
    return map[state] ?? { label: state, bg: '#f3f4f6', color: '#374151' }
  }

  return (
    <>
      {/* Back link */}
      <div className="flex items-center gap-3 mb-6">
        <a
          href="/backend/campaigns"
          className="flex items-center gap-1 text-sm no-underline"
          style={{ color: 'var(--color-text-muted)' }}
        >
          <ArrowLeft size={16} />
          Retour aux campagnes
        </a>
      </div>

      {/* Title row */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1
            className="text-2xl font-bold mb-1"
            style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-text)' }}
          >
            {campagne.name}
          </h1>
          <span
            className="inline-block px-2 py-0.5 rounded-full text-xs font-semibold"
            style={
              campagne.closed
                ? { background: '#fee2e2', color: '#991b1b' }
                : { background: '#d1fae5', color: '#065f46' }
            }
          >
            {campagne.closed ? 'Clôturée' : 'En cours'}
          </span>
        </div>
        <a
          href={`/backend/campaigns/${campagne.id}/edit`}
          className="px-3 py-1.5 rounded text-sm font-medium no-underline"
          style={{
            background: 'var(--color-bg-card)',
            border: '1px solid var(--color-border)',
            color: 'var(--color-text)',
          }}
        >
          Modifier
        </a>
      </div>

      {/* Info card */}
      <div
        className="rounded-lg p-5 mb-5"
        style={{
          background: 'var(--color-bg-card)',
          border: '1px solid var(--color-border)',
          boxShadow: 'var(--shadow-card)',
        }}
      >
        <h2
          className="text-sm font-semibold uppercase tracking-wide mb-4 flex items-center gap-2"
          style={{ color: 'var(--color-text-muted)' }}
        >
          <Calendar size={14} /> Informations
        </h2>
        <dl className="grid grid-cols-2 gap-x-6 gap-y-3">
          <div>
            <dt className="text-xs mb-0.5" style={{ color: 'var(--color-text-muted)' }}>
              Année de récolte
            </dt>
            <dd className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>
              {campagne.harvest_year}
            </dd>
          </div>
          {campagne.closed_at && (
            <div>
              <dt className="text-xs mb-0.5" style={{ color: 'var(--color-text-muted)' }}>
                Date de clôture
              </dt>
              <dd className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>
                {campagne.closed_at.slice(0, 10)}
              </dd>
            </div>
          )}
        </dl>
        {campagne.description && (
          <div
            className="mt-4 pt-4"
            style={{ borderTop: '1px solid var(--color-border)' }}
          >
            <dt className="text-xs mb-1" style={{ color: 'var(--color-text-muted)' }}>
              Description
            </dt>
            <dd className="text-sm" style={{ color: 'var(--color-text)' }}>
              {campagne.description}
            </dd>
          </div>
        )}
      </div>

      {/* Productions */}
      <div
        className="rounded-lg overflow-hidden"
        style={{
          background: 'var(--color-bg-card)',
          border: '1px solid var(--color-border)',
          boxShadow: 'var(--shadow-card)',
        }}
      >
        <div
          className="px-5 py-4 flex items-center gap-2"
          style={{ borderBottom: '1px solid var(--color-border)' }}
        >
          <Sprout size={16} style={{ color: 'var(--color-primary)' }} />
          <h2 className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
            Productions ({productions.length})
          </h2>
        </div>
        {productions.length === 0 ? (
          <p className="px-5 py-8 text-sm text-center" style={{ color: 'var(--color-text-muted)' }}>
            Aucune production pour cette campagne.
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: 'var(--color-bg-subtle)' }}>
                {['Production', 'Activité', 'Parcelle', 'Début', 'Fin', 'État'].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide"
                    style={{ color: 'var(--color-text-muted)' }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {productions.map((p, i) => {
                const s = productionStateLabel(p.state)
                return (
                  <tr
                    key={p.id}
                    style={{ borderTop: i > 0 ? '1px solid var(--color-border)' : undefined }}
                  >
                    <td className="px-4 py-3 font-medium" style={{ color: 'var(--color-text)' }}>
                      <a
                        href={`/backend/activity_productions/${p.id}`}
                        className="no-underline hover:underline"
                        style={{ color: 'var(--color-primary)' }}
                      >
                        {p.name}
                      </a>
                    </td>
                    <td className="px-4 py-3" style={{ color: 'var(--color-text-muted)' }}>
                      {p.activity_name || '—'}
                    </td>
                    <td className="px-4 py-3" style={{ color: 'var(--color-text-muted)' }}>
                      {p.cultivable_zone_name || '—'}
                    </td>
                    <td className="px-4 py-3" style={{ color: 'var(--color-text-muted)' }}>
                      {p.started_on ?? '—'}
                    </td>
                    <td className="px-4 py-3" style={{ color: 'var(--color-text-muted)' }}>
                      {p.stopped_on ?? '—'}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className="inline-block px-2 py-0.5 rounded-full text-xs font-semibold"
                        style={{ background: s.bg, color: s.color }}
                      >
                        {s.label}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </>
  )
}

CampagneShow.layout = (page: ReactNode) => <AppShell>{page}</AppShell>

export default CampagneShow
