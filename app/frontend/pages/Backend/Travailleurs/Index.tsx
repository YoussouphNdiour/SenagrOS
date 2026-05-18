import type { ReactNode } from 'react'
import { router } from '@inertiajs/react'
import { AppShell } from '../../../components/AppShell'
import type { TravailleursIndexProps } from '../../../types/travailleur'

function formatDate(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function TravailleursIndex({ travailleurs, meta }: TravailleursIndexProps) {
  const goToPage = (page: number) => {
    router.visit(`/backend/workers?page=${page}`)
  }
  const hasPrev = meta.page > 1
  const hasNext = meta.page * meta.per_page < meta.total

  return (
    <>
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-text)' }}>
            Travailleurs
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--color-text-muted)' }}>
            {meta.total} travailleur{meta.total !== 1 ? 's' : ''}
          </p>
        </div>
        <a
          href="/backend/workers/new"
          className="px-3 py-1.5 rounded text-sm font-medium no-underline"
          style={{ background: 'var(--color-primary)', color: '#fff' }}
        >
          + Nouveau
        </a>
      </div>

      {travailleurs.length === 0 ? (
        <p className="text-center py-12" style={{ color: 'var(--color-text-muted)' }}>
          Aucun travailleur enregistré.
        </p>
      ) : (
        <div className="rounded-lg overflow-hidden border" style={{ background: 'var(--color-bg-card)', borderColor: 'var(--color-border)' }}>
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b-2" style={{ background: 'var(--color-bg)', borderColor: 'var(--color-border)' }}>
                {['N° travail', 'Nom', 'Numéro', 'Né(e) le', 'Statut'].map((h) => (
                  <th key={h} className="px-3 py-2.5 text-left uppercase tracking-wide text-xs font-semibold" style={{ color: 'var(--color-text-muted)' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {travailleurs.map((w) => (
                <tr key={w.id} className="border-b" style={{ borderColor: 'var(--color-border)' }}>
                  <td className="px-3 py-2.5 font-mono text-xs" style={{ color: 'var(--color-text-muted)' }}>
                    {w.work_number || '—'}
                  </td>
                  <td className="px-3 py-2.5 font-medium">
                    <a href={`/backend/workers/${w.id}`} className="no-underline" style={{ color: 'var(--color-primary)' }}>
                      {w.name}
                    </a>
                  </td>
                  <td className="px-3 py-2.5 font-mono text-xs" style={{ color: 'var(--color-text-muted)' }}>
                    {w.number || '—'}
                  </td>
                  <td className="px-3 py-2.5" style={{ color: 'var(--color-text-muted)' }}>
                    {formatDate(w.born_at)}
                  </td>
                  <td className="px-3 py-2.5 text-xs font-semibold">
                    {w.dead_at ? (
                      <span style={{ color: 'var(--color-text-muted)' }}>Inactif</span>
                    ) : (
                      <span style={{ color: 'var(--color-success-text)' }}>Actif</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {(hasPrev || hasNext) && (
        <div className="flex items-center gap-3 mt-4">
          <button onClick={() => goToPage(meta.page - 1)} disabled={!hasPrev}
            className="px-3 py-1.5 text-xs rounded border disabled:opacity-40"
            style={{ borderColor: 'var(--color-border)', color: 'var(--color-text)', background: 'var(--color-bg-card)', cursor: hasPrev ? 'pointer' : 'default' }}>
            Précédent
          </button>
          <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Page {meta.page}</span>
          <button onClick={() => goToPage(meta.page + 1)} disabled={!hasNext}
            className="px-3 py-1.5 text-xs rounded border disabled:opacity-40"
            style={{ borderColor: 'var(--color-border)', color: 'var(--color-text)', background: 'var(--color-bg-card)', cursor: hasNext ? 'pointer' : 'default' }}>
            Suivant
          </button>
        </div>
      )}
    </>
  )
}

TravailleursIndex.layout = (page: ReactNode) => <AppShell>{page}</AppShell>
export default TravailleursIndex
