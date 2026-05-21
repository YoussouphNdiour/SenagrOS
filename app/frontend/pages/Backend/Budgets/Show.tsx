import type { ReactNode } from 'react'
import { router } from '@inertiajs/react'
import { AppShell } from '../../../components/AppShell'
import type { BudgetShowProps } from '../../../types/budget'

export default function BudgetShow({ budget }: BudgetShowProps) {
  const card: React.CSSProperties = {
    background: 'var(--color-bg-card)',
    borderRadius: '0.5rem',
    border: '1px solid var(--color-border)',
    padding: '1.5rem',
    marginBottom: '1rem',
  }

  const row: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: '0.25rem', marginBottom: '1rem' }
  const labelStyle: React.CSSProperties = { fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }
  const valueStyle: React.CSSProperties = { fontSize: '0.95rem', color: 'var(--color-text)' }

  return (
    <div className="p-8 max-w-2xl">
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => router.visit('/backend/project_budgets')}
          style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
        >
          ← Retour
        </button>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>
          {budget.name}
        </h1>
      </div>

      <div style={card}>
        <div style={row}>
          <span style={labelStyle}>Nom</span>
          <span style={valueStyle}>{budget.name}</span>
        </div>
        <div style={row}>
          <span style={labelStyle}>Description</span>
          <span style={valueStyle}>{budget.description ?? '—'}</span>
        </div>
        <div style={row}>
          <span style={labelStyle}>Code analytique (isacompta)</span>
          {budget.isacompta_analytic_code ? (
            <span style={valueStyle}>{budget.isacompta_analytic_code}</span>
          ) : (
            <span style={{ background: '#fef3c7', color: '#92400e', fontSize: '0.75rem', fontWeight: 600, padding: '0.125rem 0.5rem', borderRadius: '9999px', display: 'inline-block' }}>
              Manquant
            </span>
          )}
        </div>
        <div style={{ display: 'flex', gap: '2rem', marginTop: '0.5rem' }}>
          <span className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
            {budget.purchase_items_count} article(s) d'achat
          </span>
          <span className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
            {budget.reception_items_count} réception(s)
          </span>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '0.75rem' }}>
        <button
          onClick={() => router.visit(`/backend/project_budgets/${budget.id}/edit`)}
          style={{ background: 'var(--color-primary)', color: '#fff', border: 'none', borderRadius: '0.375rem', padding: '0.5rem 1.25rem', fontWeight: 500, fontSize: '0.875rem', cursor: 'pointer' }}
        >
          Modifier
        </button>
        <button
          onClick={() => router.visit('/backend/project_budgets')}
          style={{ background: 'var(--color-bg-card)', color: 'var(--color-text)', border: '1px solid var(--color-border)', borderRadius: '0.375rem', padding: '0.5rem 1.25rem', fontWeight: 500, fontSize: '0.875rem', cursor: 'pointer' }}
        >
          Retour
        </button>
      </div>
    </div>
  )
}

BudgetShow.layout = (page: ReactNode) => <AppShell>{page}</AppShell>
