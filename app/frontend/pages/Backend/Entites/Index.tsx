import type { ReactNode } from 'react'
import { router } from '@inertiajs/react'
import { AppShell } from '../../../components/AppShell'
import type { EntitesIndexProps, Entite } from '../../../types/entite'

const NATURE_LABELS: Record<string, string> = {
  organization: 'Organisation',
  contact:      'Contact',
}

function NatureBadge({ nature }: { nature: string }) {
  const label = NATURE_LABELS[nature] ?? nature
  const isOrg = nature === 'organization'
  return (
    <span
      className="px-2 py-0.5 rounded-full text-xs font-semibold"
      style={{
        background: isOrg ? '#e8f4ec' : '#f0f0f0',
        color: isOrg ? '#1B6B3A' : '#555',
      }}
    >
      {label}
    </span>
  )
}

function RolesTags({ entite }: { entite: Entite }) {
  if (!entite.client && !entite.supplier) {
    return <span style={{ color: 'var(--color-text-muted)' }}>—</span>
  }
  return (
    <span className="flex gap-1 flex-wrap">
      {entite.client && (
        <span
          className="px-2 py-0.5 rounded text-xs font-medium"
          style={{ background: '#f0f0f0', color: '#555' }}
        >
          Client
        </span>
      )}
      {entite.supplier && (
        <span
          className="px-2 py-0.5 rounded text-xs font-medium"
          style={{ background: '#f0f0f0', color: '#555' }}
        >
          Fournisseur
        </span>
      )}
    </span>
  )
}

function EntitesIndex({ entites, meta }: EntitesIndexProps) {
  const goToPage = (page: number) => {
    router.visit(`/backend/entities?page=${page}`)
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
          Entités
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--color-text-muted)' }}>
          {meta.total} entité{meta.total !== 1 ? 's' : ''}
        </p>
      </div>

      {entites.length === 0 ? (
        <p className="text-center py-12" style={{ color: 'var(--color-text-muted)' }}>
          Aucune entité enregistrée.
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
                {['N°', 'Nom', 'Nature', 'Rôles', 'État'].map((h) => (
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
              {entites.map((e) => (
                <tr
                  key={e.id}
                  className="border-b"
                  style={{ borderColor: 'var(--color-border)' }}
                >
                  <td
                    className="px-3 py-2.5 font-mono text-xs"
                    style={{ color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}
                  >
                    {e.number}
                  </td>
                  <td
                    className="px-3 py-2.5 font-medium"
                    style={{ color: 'var(--color-text)' }}
                  >
                    {e.full_name}
                  </td>
                  <td className="px-3 py-2.5">
                    <NatureBadge nature={e.nature} />
                  </td>
                  <td className="px-3 py-2.5">
                    <RolesTags entite={e} />
                  </td>
                  <td className="px-3 py-2.5 text-xs font-semibold">
                    {e.active ? (
                      <span style={{ color: '#1B6B3A' }}>Actif</span>
                    ) : (
                      <span style={{ color: '#999' }}>Inactif</span>
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

EntitesIndex.layout = (page: ReactNode) => <AppShell>{page}</AppShell>

export default EntitesIndex
