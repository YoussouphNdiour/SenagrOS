// app/frontend/pages/Backend/Achats/FacturesIndex.tsx
import { type ReactNode, useState, useEffect } from 'react'
import { router, usePage } from '@inertiajs/react'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { AppShell } from '../../../components/AppShell'
import type { FacturesIndexProps, ReconciliationState } from '../../../types/achat'

const RECONCILIATION_CONFIG: Record<ReconciliationState, { label: string; bg: string; color: string }> = {
  to_reconcile: { label: 'À réconcilier', bg: '#fef3c7', color: '#92400e' },
  reconcile:    { label: 'Réconciliée',   bg: '#dcfce7', color: '#166534' },
  accepted:     { label: 'Acceptée',      bg: '#dbeafe', color: '#1e40af' },
}

function AchatsTabs() {
  const { url } = usePage()
  const tabs = [
    { href: '/backend/purchase_orders',   label: 'Commandes' },
    { href: '/backend/purchase_invoices', label: 'Factures' },
  ]
  return (
    <div style={{ display: 'flex', gap: '0', marginBottom: '1.5rem', borderBottom: '2px solid var(--color-border)' }}>
      {tabs.map(tab => {
        const active = url.startsWith(tab.href)
        return (
          <a key={tab.href} href={tab.href} style={{ padding: '0.5rem 1.25rem', fontWeight: active ? 600 : 400, borderBottom: active ? '2px solid var(--color-primary)' : '2px solid transparent', marginBottom: '-2px', color: active ? 'var(--color-primary)' : 'var(--color-text-muted)', textDecoration: 'none', fontSize: '0.9375rem' }}>
            {tab.label}
          </a>
        )
      })}
    </div>
  )
}

export default function FacturesIndex({ factures, filters, meta }: FacturesIndexProps) {
  const [q, setQ] = useState(filters.q ?? '')
  const [selectedStates, setSelectedStates] = useState<ReconciliationState[]>(filters.reconciliation_state ?? [])
  const [unpaid, setUnpaid] = useState(filters.unpaid ?? false)

  useEffect(() => { setQ(filters.q ?? '') }, [filters.q])

  function search() {
    router.get('/backend/purchase_invoices', { q, reconciliation_state: selectedStates, unpaid }, { preserveState: true })
  }

  function handleDelete(id: number, number: string) {
    if (window.confirm(`Supprimer la facture ${number} ?`)) {
      router.delete(`/backend/purchase_invoices/${id}`)
    }
  }

  const card: React.CSSProperties = { background: 'var(--color-bg-card)', borderRadius: '0.5rem', border: '1px solid var(--color-border)' }
  const th: React.CSSProperties = { padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.8125rem', color: 'var(--color-text-muted)', fontWeight: 600, borderBottom: '1px solid var(--color-border)' }
  const td: React.CSSProperties = { padding: '0.75rem 1rem', borderBottom: '1px solid var(--color-border)', fontSize: '0.9375rem' }

  return (
    <div style={{ padding: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-text)', margin: 0 }}>Achats</h1>
        <a href="/backend/purchase_invoices/new" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'var(--color-primary)', color: '#fff', borderRadius: '0.5rem', padding: '0.5rem 1rem', cursor: 'pointer', fontWeight: 500, textDecoration: 'none' }}>
          <Plus size={16} /> Nouvelle facture
        </a>
      </div>

      <AchatsTabs />

      {/* Filters */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.25rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <input
          type="text"
          value={q}
          onChange={e => setQ(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && search()}
          placeholder="Rechercher N°, référence, fournisseur…"
          style={{ flex: 1, minWidth: '220px', padding: '0.5rem 0.75rem', border: '1px solid var(--color-border)', borderRadius: '0.375rem', fontSize: '0.9375rem' }}
        />
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <select
            aria-label="Filtrer par état de réconciliation"
            value={selectedStates[0] ?? ''}
            onChange={e => setSelectedStates(e.target.value ? [e.target.value as ReconciliationState] : [])}
            style={{ padding: '0.5rem 0.75rem', border: '1px solid var(--color-border)', borderRadius: '0.375rem', fontSize: '0.875rem', background: 'var(--color-bg-card)' }}
          >
            <option value="">Tous les états</option>
            <option value="to_reconcile">Filtre : à réconcilier</option>
            <option value="reconcile">Filtre : réconciliée</option>
            <option value="accepted">Filtre : acceptée</option>
          </select>
          <label htmlFor="filter-unpaid" style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', cursor: 'pointer', fontSize: '0.875rem' }}>
            <input id="filter-unpaid" type="checkbox" aria-label="Non payées uniquement" checked={unpaid} onChange={e => setUnpaid(e.target.checked)} />
            Non payées uniquement
          </label>
        </div>
        <button type="button" onClick={search} style={{ padding: '0.5rem 1rem', background: 'var(--color-bg-card)', border: '1px solid var(--color-border)', borderRadius: '0.375rem', cursor: 'pointer' }}>
          Rechercher
        </button>
      </div>

      {/* Table */}
      <div style={{ ...card, overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              {['N° facture', 'Référence', 'Fournisseur', 'Réconciliation', 'Date facture', 'HT', 'TTC', 'Actions'].map(h => (
                <th key={h} style={th}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {factures.map(f => {
              const badge = RECONCILIATION_CONFIG[f.reconciliation_state]
                ?? { label: f.reconciliation_state, bg: '#f3f4f6', color: '#6b7280' }
              return (
                <tr key={f.id}>
                  <td style={td}>
                    <a href={`/backend/purchase_invoices/${f.id}`} style={{ color: 'var(--color-primary)', textDecoration: 'none', fontWeight: 500 }}>{f.number}</a>
                  </td>
                  <td style={td}>{f.reference_number ?? '—'}</td>
                  <td style={td}>{f.supplier.full_name}</td>
                  <td style={td}>
                    <span style={{ background: badge.bg, color: badge.color, padding: '0.125rem 0.625rem', borderRadius: '9999px', fontSize: '0.8rem', fontWeight: 500 }}>
                      {badge.label}
                    </span>
                  </td>
                  <td style={td}>{f.invoiced_at}</td>
                  <td style={{ ...td, textAlign: 'right' }}>{f.pretax_amount.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}</td>
                  <td style={{ ...td, textAlign: 'right' }}>{f.amount.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}</td>
                  <td style={td}>
                    <div style={{ display: 'flex', gap: '0.375rem' }}>
                      {f.updatable && (
                        <a href={`/backend/purchase_invoices/${f.id}/edit`} title="Modifier" style={{ display: 'inline-flex', alignItems: 'center', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', padding: '0.25rem', textDecoration: 'none' }}>
                          <Pencil size={15} />
                        </a>
                      )}
                      {f.destroyable && (
                        <button
                          type="button"
                          aria-label="Supprimer"
                          onClick={() => handleDelete(f.id, f.number)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626', padding: '0.25rem' }}
                        >
                          <Trash2 size={15} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem' }}>
        <span style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
          {meta.total_count} facture(s)
        </span>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {meta.current_page > 1 && (
            <button type="button" onClick={() => router.get('/backend/purchase_invoices', { q, reconciliation_state: selectedStates, unpaid, page: meta.current_page - 1 }, { preserveState: true })} style={{ padding: '0.25rem 0.75rem', border: '1px solid var(--color-border)', borderRadius: '0.375rem', cursor: 'pointer', background: 'var(--color-bg-card)' }}>
              Précédent
            </button>
          )}
          {meta.current_page < meta.total_pages && (
            <button type="button" onClick={() => router.get('/backend/purchase_invoices', { q, reconciliation_state: selectedStates, unpaid, page: meta.current_page + 1 }, { preserveState: true })} style={{ padding: '0.25rem 0.75rem', border: '1px solid var(--color-border)', borderRadius: '0.375rem', cursor: 'pointer', background: 'var(--color-bg-card)' }}>
              Suivant
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

FacturesIndex.layout = (page: ReactNode) => <AppShell>{page}</AppShell>
