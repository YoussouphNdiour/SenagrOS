import type { ReactNode } from 'react'
import { router } from '@inertiajs/react'
import { AppShell } from '../../../components/AppShell'
import type { BudgetShowProps, PurchaseLine, ReceptionLine } from '../../../types/budget'

export default function BudgetShow({ budget, purchase_lines, total_pretax_amount, reception_lines }: BudgetShowProps) {
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

      {/* Purchase lines */}
      <div style={{ marginTop: '2rem' }}>
        <h2 className="text-base font-semibold mb-3" style={{ color: 'var(--color-text)' }}>
          Lignes d'achat ({purchase_lines.length})
        </h2>
        {purchase_lines.length === 0 ? (
          <p className="text-sm py-4 text-center" style={{ color: 'var(--color-text-muted)' }}>
            Aucune ligne d'achat liée à ce budget.
          </p>
        ) : (
          <div style={{ background: 'var(--color-bg-card)', borderRadius: '0.5rem', border: '1px solid var(--color-border)', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--color-border)', background: 'var(--color-bg)' }}>
                  {['Désignation', 'Bon de commande', 'Quantité', 'Montant HT'].map(h => (
                    <th key={h} className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--color-text-muted)' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {purchase_lines.map((line: PurchaseLine) => (
                  <tr key={line.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                    <td className="px-4 py-2" style={{ color: 'var(--color-text)' }}>{line.label}</td>
                    <td className="px-4 py-2" style={{ color: 'var(--color-text-muted)' }}>{line.purchase_number || '—'}</td>
                    <td className="px-4 py-2 tabular-nums" style={{ color: 'var(--color-text)' }}>{line.quantity}</td>
                    <td className="px-4 py-2 tabular-nums font-medium" style={{ color: 'var(--color-text)' }}>
                      {line.pretax_amount.toLocaleString('fr-FR')} {line.currency}
                    </td>
                  </tr>
                ))}
                <tr style={{ borderTop: '2px solid var(--color-border)', background: 'var(--color-bg)' }}>
                  <td colSpan={3} className="px-4 py-2 font-semibold text-right" style={{ color: 'var(--color-text)' }}>
                    Total HT
                  </td>
                  <td className="px-4 py-2 tabular-nums font-bold" style={{ color: 'var(--color-text)' }}>
                    {total_pretax_amount.toLocaleString('fr-FR')} {purchase_lines[0]?.currency ?? 'XOF'}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Reception lines */}
      <div style={{ marginTop: '2rem' }}>
        <h2 className="text-base font-semibold mb-3" style={{ color: 'var(--color-text)' }}>
          Réceptions ({reception_lines.length})
        </h2>
        {reception_lines.length === 0 ? (
          <p className="text-sm py-4 text-center" style={{ color: 'var(--color-text-muted)' }}>
            Aucune réception liée à ce budget.
          </p>
        ) : (
          <div style={{ background: 'var(--color-bg-card)', borderRadius: '0.5rem', border: '1px solid var(--color-border)', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--color-border)', background: 'var(--color-bg)' }}>
                  {['Produit reçu', 'Bon de réception', 'Quantité'].map(h => (
                    <th key={h} className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--color-text-muted)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {reception_lines.map((line: ReceptionLine) => (
                  <tr key={line.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                    <td className="px-4 py-2" style={{ color: 'var(--color-text)' }}>{line.product_name || '—'}</td>
                    <td className="px-4 py-2" style={{ color: 'var(--color-text-muted)' }}>{line.parcel_number || '—'}</td>
                    <td className="px-4 py-2 tabular-nums" style={{ color: 'var(--color-text)' }}>{line.quantity}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

BudgetShow.layout = (page: ReactNode) => <AppShell>{page}</AppShell>
