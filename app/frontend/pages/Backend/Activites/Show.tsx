import type { ReactNode } from 'react'
import { ArrowLeft, Sprout, Tag, List } from 'lucide-react'
import { AppShell } from '../../../components/AppShell'
import type { ActiviteShowProps } from '../../../types/activite'

const FAMILY_CONFIG: Record<string, { label: string; bg: string; color: string }> = {
  plant_farming:      { label: 'Culture végétale',     bg: '#d1fae5', color: '#065f46' },
  vine_farming:       { label: 'Viticulture',           bg: '#ede9fe', color: '#4c1d95' },
  animal_farming:     { label: 'Élevage',               bg: '#fef3c7', color: '#92400e' },
  tool_maintaining:   { label: 'Entretien outillage',   bg: '#e0e7ff', color: '#1e40af' },
  service_delivering: { label: 'Prestation service',    bg: '#f1f5f9', color: '#475569' },
}

const NATURE_CONFIG: Record<string, { label: string }> = {
  main:       { label: 'Principale' },
  auxiliary:  { label: 'Auxiliaire' },
  standalone: { label: 'Autonome' },
}

const STATE_COLORS: Record<string, { bg: string; color: string; label: string }> = {
  opened:  { bg: '#d1fae5', color: '#065f46', label: 'Ouverte' },
  closed:  { bg: '#fee2e2', color: '#991b1b', label: 'Clôturée' },
  aborted: { bg: '#fef3c7', color: '#92400e', label: 'Abandonnée' },
}

const ActiviteShow = ({ activite, productions }: ActiviteShowProps) => {
  const family = FAMILY_CONFIG[activite.family] ?? { label: activite.family, bg: '#f3f4f6', color: '#374151' }
  const nature = NATURE_CONFIG[activite.nature] ?? { label: activite.nature }

  return (
    <>
      {/* Back */}
      <div className="mb-6">
        <a
          href="/backend/activities"
          className="flex items-center gap-1 text-sm no-underline"
          style={{ color: 'var(--color-text-muted)' }}
        >
          <ArrowLeft size={16} />
          Retour aux activités
        </a>
      </div>

      {/* Title */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1
            className="text-2xl font-bold mb-2"
            style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-text)' }}
          >
            {activite.name}
          </h1>
          <div className="flex gap-2 flex-wrap">
            <span
              className="inline-block px-2 py-0.5 rounded-full text-xs font-semibold"
              style={{ background: family.bg, color: family.color }}
            >
              {family.label}
            </span>
            <span
              className="inline-block px-2 py-0.5 rounded-full text-xs font-semibold"
              style={{
                background: 'var(--color-bg-subtle)',
                color: 'var(--color-text-muted)',
                border: '1px solid var(--color-border)',
              }}
            >
              {nature.label}
            </span>
            {activite.suspended && (
              <span
                className="inline-block px-2 py-0.5 rounded-full text-xs font-semibold"
                style={{ background: '#fee2e2', color: '#991b1b' }}
              >
                Suspendue
              </span>
            )}
          </div>
        </div>
        <a
          href={`/backend/activities/${activite.id}/edit`}
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

      {/* Info cards grid */}
      <div className="grid gap-4 mb-5" style={{ gridTemplateColumns: '2fr 1fr' }}>
        {/* Détails principaux */}
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
            <Tag size={14} /> Caractéristiques
          </h2>
          <dl className="grid grid-cols-2 gap-x-6 gap-y-3">
            {[
              { label: 'Famille',            value: family.label },
              { label: 'Nature',             value: nature.label },
              { label: 'Cycle de production', value: activite.production_cycle || '—' },
              { label: 'Avec supports',      value: activite.with_supports ? 'Oui' : 'Non' },
              { label: 'Avec cultures',      value: activite.with_cultivation ? 'Oui' : 'Non' },
              { label: 'Variété support',    value: activite.support_variety || '—' },
              { label: 'Variété cultivée',   value: activite.cultivation_variety || '—' },
              { label: 'Début production',   value: activite.production_started_on ?? '—' },
              { label: 'Fin production',     value: activite.production_stopped_on ?? '—' },
            ].map(({ label, value }) => (
              <div key={label}>
                <dt className="text-xs mb-0.5" style={{ color: 'var(--color-text-muted)' }}>
                  {label}
                </dt>
                <dd className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>
                  {value}
                </dd>
              </div>
            ))}
          </dl>
          {activite.description && (
            <div
              className="mt-4 pt-4"
              style={{ borderTop: '1px solid var(--color-border)' }}
            >
              <dt className="text-xs mb-1" style={{ color: 'var(--color-text-muted)' }}>
                Description
              </dt>
              <dd className="text-sm" style={{ color: 'var(--color-text)' }}>
                {activite.description}
              </dd>
            </div>
          )}
        </div>

        {/* Stats */}
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
            <Sprout size={14} /> Statistiques
          </h2>
          <div className="text-center py-4">
            <div
              className="text-3xl font-bold mb-1"
              style={{ color: 'var(--color-primary)' }}
            >
              {activite.productions_count}
            </div>
            <div className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
              Production{activite.productions_count !== 1 ? 's' : ''}
            </div>
          </div>
        </div>
      </div>

      {/* Productions table */}
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
          <List size={16} style={{ color: 'var(--color-primary)' }} />
          <h2 className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
            Productions liées ({productions.length})
          </h2>
        </div>
        {productions.length === 0 ? (
          <p
            className="px-5 py-8 text-sm text-center"
            style={{ color: 'var(--color-text-muted)' }}
          >
            Aucune production pour cette activité.
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: 'var(--color-bg-subtle)' }}>
                {['Production', 'Campagne', 'Parcelle', 'Début', 'État'].map((h) => (
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
                const s = STATE_COLORS[p.state] ?? { bg: '#f3f4f6', color: '#374151', label: p.state }
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
                      {p.campaign_name || '—'}
                    </td>
                    <td className="px-4 py-3" style={{ color: 'var(--color-text-muted)' }}>
                      {p.cultivable_zone_name || '—'}
                    </td>
                    <td className="px-4 py-3" style={{ color: 'var(--color-text-muted)' }}>
                      {p.started_on ?? '—'}
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

ActiviteShow.layout = (page: ReactNode) => <AppShell>{page}</AppShell>

export default ActiviteShow
