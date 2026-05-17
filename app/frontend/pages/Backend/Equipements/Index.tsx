import type { ReactNode } from 'react'
import { router } from '@inertiajs/react'
import { AppShell } from '../../../components/AppShell'
import type { EquipementsIndexProps } from '../../../types/equipement'

function formatDate(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function EquipementsIndex({ equipements, meta }: EquipementsIndexProps) {
  const goToPage = (page: number) => {
    router.visit(`/backend/equipments?page=${page}`)
  }

  const hasPrev = meta.page > 1
  const hasNext = meta.page * meta.per_page < meta.total

  return (
    <>
      <div className="mb-5">
        <h1
          className="text-2xl font-bold"
          style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-text)' }}
        >
          Équipements
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--color-text-muted)' }}>
          {meta.total} équipement{meta.total !== 1 ? 's' : ''}
        </p>
      </div>

      {equipements.length === 0 ? (
        <p className="text-center py-12" style={{ color: 'var(--color-text-muted)' }}>
          Aucun équipement enregistré.
        </p>
      ) : (
        <div
          className="rounded-lg overflow-hidden border"
          style={{ background: 'var(--color-bg-card)', borderColor: 'var(--color-border)' }}
        >
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr
                className="border-b-2"
                style={{ background: 'var(--color-bg)', borderColor: 'var(--color-border)' }}
              >
                {['N° travail', 'Nom', 'Variante', 'Mis en service'].map((h) => (
                  <th
                    key={h}
                    className="px-3 py-2.5 text-left uppercase tracking-wide text-xs font-semibold"
                    style={{ color: 'var(--color-text-muted)' }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {equipements.map((e) => (
                <tr
                  key={e.id}
                  className="border-b"
                  style={{ borderColor: 'var(--color-border)' }}
                >
                  <td
                    className="px-3 py-2.5 font-mono text-xs"
                    style={{ color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}
                  >
                    {e.work_number || '—'}
                  </td>
                  <td
                    className="px-3 py-2.5 font-medium"
                    style={{ color: 'var(--color-text)' }}
                  >
                    {e.name}
                  </td>
                  <td className="px-3 py-2.5" style={{ color: 'var(--color-text-muted)' }}>
                    {e.variant_name || '—'}
                  </td>
                  <td className="px-3 py-2.5" style={{ color: 'var(--color-text-muted)' }}>
                    {formatDate(e.born_at)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {(hasPrev || hasNext) && (
        <div className="flex items-center gap-3 mt-4">
          <button
            onClick={() => goToPage(meta.page - 1)}
            disabled={!hasPrev}
            className="px-3 py-1.5 text-xs rounded border disabled:opacity-40"
            style={{
              borderColor: 'var(--color-border)',
              color: 'var(--color-text)',
              background: 'var(--color-bg-card)',
              cursor: hasPrev ? 'pointer' : 'default',
            }}
          >
            Précédent
          </button>
          <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
            Page {meta.page}
          </span>
          <button
            onClick={() => goToPage(meta.page + 1)}
            disabled={!hasNext}
            className="px-3 py-1.5 text-xs rounded border disabled:opacity-40"
            style={{
              borderColor: 'var(--color-border)',
              color: 'var(--color-text)',
              background: 'var(--color-bg-card)',
              cursor: hasNext ? 'pointer' : 'default',
            }}
          >
            Suivant
          </button>
        </div>
      )}
    </>
  )
}

EquipementsIndex.layout = (page: ReactNode) => <AppShell>{page}</AppShell>

export default EquipementsIndex
