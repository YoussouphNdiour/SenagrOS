import type { ReactNode } from 'react'
import { AppShell } from '../../../components/AppShell'
import type { ProductionsIndexProps } from '../../../types/production'

/**
 * Note: Inline style attributes with CSS variables (e.g., style={{ color: 'var(--color-text)' }})
 * are used consistently across the SenagrOS frontend. This is an intentional project pattern
 * for applying design tokens defined in app/frontend/styles/tokens.css.
 * See Dashboard and Interventions components for consistent usage.
 */

const STATE_LABELS: Record<string, string> = {
  opened:   'En cours',
  aborted:  'Abandonné',
  finished: 'Terminé',
}

const STATE_COLORS: Record<string, string> = {
  opened:   '#1B6B3A',
  aborted:  '#D4420A',
  finished: '#6B5E4E',
}

function formatDate(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function ProductionsIndex({ productions, meta }: ProductionsIndexProps) {
  return (
    <>
      <h1 className="text-2xl font-bold mb-5" style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-text)' }}>
        Productions
      </h1>

      {productions.length === 0 ? (
        <p className="text-center py-12" style={{ color: 'var(--color-text-muted)' }}>
          Aucune production enregistrée.
        </p>
      ) : (
        <div className="rounded-lg overflow-hidden border" style={{ background: 'var(--color-bg-card)', borderColor: 'var(--color-border)' }}>
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b-2" style={{ background: 'var(--color-bg)', borderColor: 'var(--color-border)' }}>
                {['Nom', 'Activité', 'Zone', 'Campagne', 'Début', 'Fin', 'État'].map((h) => (
                  <th key={h} className="px-3 py-2.5 text-left uppercase tracking-wide text-xs font-semibold" style={{ color: 'var(--color-text-muted)' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {productions.map((p) => (
                <tr key={p.id} className="border-b" style={{ borderColor: 'var(--color-border)' }}>
                  <td className="px-3 py-2.5 font-medium" style={{ color: 'var(--color-text)' }}>{p.name}</td>
                  <td className="px-3 py-2.5">
                    <span className="px-2 py-0.5 rounded-full text-xs font-semibold" style={{ background: '#e8f4ec', color: '#1B6B3A' }}>
                      {p.activity.name}
                    </span>
                  </td>
                  <td className="px-3 py-2.5" style={{ color: 'var(--color-text-muted)' }}>{p.cultivable_zone?.name ?? '—'}</td>
                  <td className="px-3 py-2.5" style={{ color: 'var(--color-text-muted)' }}>{p.campaign.name}</td>
                  <td className="px-3 py-2.5" style={{ color: 'var(--color-text-muted)' }}>{formatDate(p.started_on)}</td>
                  <td className="px-3 py-2.5" style={{ color: 'var(--color-text-muted)' }}>{formatDate(p.stopped_on)}</td>
                  <td className="px-3 py-2.5 text-xs font-semibold" style={{ color: STATE_COLORS[p.state] ?? '#6B5E4E' }}>
                    {STATE_LABELS[p.state] ?? p.state}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="mt-3 text-xs" style={{ color: 'var(--color-text-muted)' }}>
        {meta.total} production{meta.total !== 1 ? 's' : ''} — page {meta.page}
      </p>
    </>
  )
}

ProductionsIndex.layout = (page: ReactNode) => <AppShell>{page}</AppShell>

export default ProductionsIndex
