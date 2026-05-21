import type { ReactNode } from 'react'
import { router } from '@inertiajs/react'
import { AppShell } from '../../../components/AppShell'
import type { BudgetsIndexProps } from '../../../types/budget'

export default function BudgetsIndex({ budgets, meta }: BudgetsIndexProps) {
  function handleDelete(id: number, name: string) {
    if (!window.confirm(`Supprimer le budget "${name}" ?`)) return
    router.delete(`/backend/project_budgets/${id}`)
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>
          Budgets projet{' '}
          <span className="text-sm font-normal" style={{ color: 'var(--color-text-muted)' }}>
            ({meta.total})
          </span>
        </h1>
        <button
          onClick={() => router.visit('/backend/project_budgets/new')}
          style={{
            background: 'var(--color-primary)', color: '#fff', border: 'none',
            borderRadius: '0.375rem', padding: '0.5rem 1rem', fontWeight: 500,
            fontSize: '0.875rem', cursor: 'pointer',
          }}
        >
          Nouveau budget
        </button>
      </div>

      {budgets.length === 0 ? (
        <p className="text-center py-12" style={{ color: 'var(--color-text-muted)' }}>
          Aucun budget projet enregistré.
        </p>
      ) : (
        <>
          <div style={{ background: 'var(--color-bg-card)', borderRadius: '0.5rem', border: '1px solid var(--color-border)', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                  {['Nom', 'Description', 'Code analytique', 'Actions'].map(h => (
                    <th key={h} className="text-left text-xs font-semibold px-4 py-3" style={{ color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {budgets.map(budget => (
                  <tr key={budget.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                    <td className="px-4 py-3">
                      <a
                        href={`/backend/project_budgets/${budget.id}`}
                        style={{ color: 'var(--color-primary)', textDecoration: 'none', fontWeight: 500 }}
                      >
                        {budget.name}
                      </a>
                    </td>
                    <td className="px-4 py-3 text-sm" style={{ color: 'var(--color-text-muted)' }}>
                      {budget.description
                        ? budget.description.slice(0, 60) + (budget.description.length > 60 ? '…' : '')
                        : '—'}
                    </td>
                    <td className="px-4 py-3">
                      {budget.isacompta_analytic_code ?? (
                        <span style={{ background: '#fef3c7', color: '#92400e', fontSize: '0.75rem', fontWeight: 600, padding: '0.125rem 0.5rem', borderRadius: '9999px' }}>
                          Manquant
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <a href={`/backend/project_budgets/${budget.id}`} style={{ fontSize: '0.8rem', color: 'var(--color-primary)' }}>Voir</a>
                        <a href={`/backend/project_budgets/${budget.id}/edit`} style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Modifier</a>
                        <button
                          onClick={() => handleDelete(budget.id, budget.name)}
                          style={{ fontSize: '0.8rem', color: '#dc2626', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                        >
                          Supprimer
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {meta.total > meta.per_page && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginTop: '1rem' }}>
              <button
                disabled={meta.page <= 1}
                onClick={() => router.visit(`/backend/project_budgets?page=${meta.page - 1}`)}
                style={{ padding: '0.375rem 0.875rem', borderRadius: '0.375rem', border: '1px solid var(--color-border)', background: 'var(--color-bg-card)', cursor: meta.page <= 1 ? 'not-allowed' : 'pointer', opacity: meta.page <= 1 ? 0.5 : 1 }}
              >
                Précédent
              </button>
              <span className="text-sm px-2 py-1" style={{ color: 'var(--color-text-muted)' }}>
                Page {meta.page}
              </span>
              <button
                disabled={meta.page * meta.per_page >= meta.total}
                onClick={() => router.visit(`/backend/project_budgets?page=${meta.page + 1}`)}
                style={{ padding: '0.375rem 0.875rem', borderRadius: '0.375rem', border: '1px solid var(--color-border)', background: 'var(--color-bg-card)', cursor: meta.page * meta.per_page >= meta.total ? 'not-allowed' : 'pointer', opacity: meta.page * meta.per_page >= meta.total ? 0.5 : 1 }}
              >
                Suivant
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}

BudgetsIndex.layout = (page: ReactNode) => <AppShell>{page}</AppShell>
