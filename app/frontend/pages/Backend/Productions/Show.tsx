import type { ReactNode } from 'react'
import { ArrowLeft, Info, Droplets, Wrench } from 'lucide-react'
import { AppShell } from '../../../components/AppShell'
import type { ProductionShowProps } from '../../../types/production'

const FAMILY_COLORS: Record<string, { bg: string; color: string; label: string }> = {
  plant_farming:      { bg: '#d1fae5', color: '#065f46', label: 'Culture' },
  vine_farming:       { bg: '#ede9fe', color: '#4c1d95', label: 'Viticulture' },
  animal_farming:     { bg: '#fef3c7', color: '#92400e', label: 'Élevage' },
  tool_maintaining:   { bg: '#e0e7ff', color: '#1e40af', label: 'Outillage' },
  service_delivering: { bg: '#f1f5f9', color: '#475569', label: 'Service' },
}

const STATE_COLORS: Record<string, { bg: string; color: string; label: string }> = {
  opened:  { bg: '#d1fae5', color: '#065f46', label: 'Ouverte' },
  closed:  { bg: '#fee2e2', color: '#991b1b', label: 'Clôturée' },
  aborted: { bg: '#fef3c7', color: '#92400e', label: 'Abandonnée' },
}

const INTERVENTION_STATE_LABELS: Record<string, string> = {
  in_progress: 'En cours',
  done:        'Terminée',
  validated:   'Validée',
}

const ProductionShow = ({ production, interventions }: ProductionShowProps) => {
  const state = STATE_COLORS[production.state] ?? { bg: '#f3f4f6', color: '#374151', label: production.state }
  const family = FAMILY_COLORS[production.activity_family] ?? { bg: '#f3f4f6', color: '#374151', label: production.activity_family }

  return (
    <>
      {/* Back */}
      <div className="mb-6">
        <a
          href="/backend/activity_productions"
          className="flex items-center gap-1 text-sm no-underline"
          style={{ color: 'var(--color-text-muted)' }}
        >
          <ArrowLeft size={16} />
          Retour aux productions
        </a>
      </div>

      {/* Title */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1
            className="text-2xl font-bold mb-2"
            style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-text)' }}
          >
            {production.name}
          </h1>
          <div className="flex gap-2 flex-wrap">
            <span
              className="inline-block px-2 py-0.5 rounded-full text-xs font-semibold"
              style={{ background: state.bg, color: state.color }}
            >
              {state.label}
            </span>
            {production.activity_family && (
              <span
                className="inline-block px-2 py-0.5 rounded-full text-xs font-semibold"
                style={{ background: family.bg, color: family.color }}
              >
                {family.label}
              </span>
            )}
          </div>
        </div>
        <a
          href={`/backend/activity_productions/${production.id}/edit`}
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

      {/* Info grid */}
      <div className="grid gap-4" style={{ gridTemplateColumns: '1fr 1fr' }}>
        {/* Détails */}
        <div
          className="rounded-lg p-5"
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
            <Info size={14} /> Détails
          </h2>
          <dl className="grid grid-cols-1 gap-y-3">
            {[
              {
                label: 'Activité',
                value: production.activity_name || '—',
                href: production.activity_id ? `/backend/activities/${production.activity_id}` : null,
              },
              {
                label: 'Campagne',
                value: production.campaign_name || '—',
                href: production.campaign_id ? `/backend/campaigns/${production.campaign_id}` : null,
              },
              {
                label: 'Parcelle',
                value: production.cultivable_zone_name || '—',
                href: production.cultivable_zone_id
                  ? `/backend/cultivable-zones/${production.cultivable_zone_id}`
                  : null,
              },
              { label: 'Début', value: production.started_on ?? '—', href: null },
              { label: 'Fin', value: production.stopped_on ?? 'En cours', href: null },
              {
                label: 'Superficie',
                value: production.size_value
                  ? `${production.size_value} ${production.size_unit_name}`
                  : '—',
                href: null,
              },
            ].map(({ label, value, href }) => (
              <div key={label}>
                <dt className="text-xs mb-0.5" style={{ color: 'var(--color-text-muted)' }}>
                  {label}
                </dt>
                <dd className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>
                  {href ? (
                    <a
                      href={href}
                      className="no-underline hover:underline"
                      style={{ color: 'var(--color-primary)' }}
                    >
                      {value}
                    </a>
                  ) : (
                    value
                  )}
                </dd>
              </div>
            ))}
          </dl>
        </div>

        {/* Caractéristiques */}
        <div
          className="rounded-lg p-5"
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
            <Droplets size={14} /> Caractéristiques
          </h2>
          <dl className="grid grid-cols-1 gap-y-3">
            <div>
              <dt className="text-xs mb-0.5" style={{ color: 'var(--color-text-muted)' }}>
                Irrigué
              </dt>
              <dd>
                <span
                  className="inline-block px-2 py-0.5 rounded-full text-xs font-semibold"
                  style={
                    production.irrigated
                      ? { background: '#dbeafe', color: '#1e40af' }
                      : {
                          background: 'var(--color-bg-subtle)',
                          color: 'var(--color-text-muted)',
                        }
                  }
                >
                  {production.irrigated ? 'Oui' : 'Non'}
                </span>
              </dd>
            </div>
            <div>
              <dt className="text-xs mb-0.5" style={{ color: 'var(--color-text-muted)' }}>
                Fixation azote
              </dt>
              <dd>
                <span
                  className="inline-block px-2 py-0.5 rounded-full text-xs font-semibold"
                  style={
                    production.nitrate_fixing
                      ? { background: '#d1fae5', color: '#065f46' }
                      : {
                          background: 'var(--color-bg-subtle)',
                          color: 'var(--color-text-muted)',
                        }
                  }
                >
                  {production.nitrate_fixing ? 'Oui' : 'Non'}
                </span>
              </dd>
            </div>
            {production.usage && (
              <div>
                <dt className="text-xs mb-0.5" style={{ color: 'var(--color-text-muted)' }}>
                  Usage
                </dt>
                <dd className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>
                  {production.usage}
                </dd>
              </div>
            )}
            {production.rank_number > 0 && (
              <div>
                <dt className="text-xs mb-0.5" style={{ color: 'var(--color-text-muted)' }}>
                  Rang
                </dt>
                <dd className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>
                  #{production.rank_number}
                </dd>
              </div>
            )}
          </dl>
        </div>
      </div>

      {/* Interventions */}
      <div
        className="rounded-lg p-5 mt-4"
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
          <Wrench size={14} /> Interventions ({interventions.length})
        </h2>
        {interventions.length === 0 ? (
          <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
            Aucune intervention enregistrée.
          </p>
        ) : (
          <table className="w-full text-sm" style={{ borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                <th className="text-left pb-2 font-medium" style={{ color: 'var(--color-text-muted)' }}>Intervention</th>
                <th className="text-left pb-2 font-medium" style={{ color: 'var(--color-text-muted)' }}>Date</th>
                <th className="text-left pb-2 font-medium" style={{ color: 'var(--color-text-muted)' }}>État</th>
              </tr>
            </thead>
            <tbody>
              {interventions.map(iv => (
                <tr key={iv.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <td className="py-2 pr-4">
                    <a
                      href={`/backend/interventions/${iv.id}`}
                      className="no-underline hover:underline"
                      style={{ color: 'var(--color-primary)' }}
                    >
                      {iv.name}
                    </a>
                  </td>
                  <td className="py-2 pr-4" style={{ color: 'var(--color-text)' }}>
                    {iv.started_at ? iv.started_at.slice(0, 10) : '—'}
                  </td>
                  <td className="py-2" style={{ color: 'var(--color-text)' }}>
                    {INTERVENTION_STATE_LABELS[iv.state] ?? iv.state}
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

ProductionShow.layout = (page: ReactNode) => <AppShell>{page}</AppShell>

export default ProductionShow
