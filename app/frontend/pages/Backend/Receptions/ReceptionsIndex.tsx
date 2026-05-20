// app/frontend/pages/Backend/Receptions/ReceptionsIndex.tsx
import { type ReactNode, useState, useEffect } from 'react'
import { router } from '@inertiajs/react'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { AppShell } from '../../../components/AppShell'
import AchatsTabs from '../../../components/achats/AchatsTabs'
import type { ReceptionsIndexProps, ReceptionState, ReceptionReconciliationState } from '../../../types/reception'

const STATE_CONFIG: Record<ReceptionState, { label: string; bg: string; color: string }> = {
  draft: { label: 'Brouillon', bg: '#fef9c3', color: '#854d0e' },
  given: { label: 'Validée',   bg: '#dcfce7', color: '#166534' },
}

const RECONCILIATION_CONFIG: Record<ReceptionReconciliationState, { label: string; bg: string; color: string }> = {
  to_reconcile: { label: 'Non facturée', bg: '#fef3c7', color: '#92400e' },
  reconcile:    { label: 'Facturée',     bg: '#dcfce7', color: '#166534' },
}

export default function ReceptionsIndex({ receptions, filters, meta }: ReceptionsIndexProps) {
  const [q, setQ] = useState(filters.q ?? '')
  const [selectedStates, setSelectedStates] = useState<ReceptionState[]>(filters.state ?? [])

  useEffect(() => { setQ(filters.q ?? '') }, [filters.q])

  function search() {
    router.get('/backend/receptions', { q, state: selectedStates }, { preserveState: true })
  }

  function toggleState(state: ReceptionState) {
    setSelectedStates(prev =>
      prev.includes(state) ? prev.filter(s => s !== state) : [...prev, state]
    )
  }

  function handleDelete(id: number, number: string) {
    if (window.confirm(`Supprimer la réception ${number} ?`)) {
      router.delete(`/backend/receptions/${id}`)
    }
  }

  const card: React.CSSProperties = { background: 'var(--color-bg-card)', borderRadius: '0.5rem', border: '1px solid var(--color-border)' }
  const th: React.CSSProperties = { padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.8125rem', color: 'var(--color-text-muted)', fontWeight: 600, borderBottom: '1px solid var(--color-border)' }
  const td: React.CSSProperties = { padding: '0.75rem 1rem', borderBottom: '1px solid var(--color-border)', fontSize: '0.9375rem' }

  return (
    <div style={{ padding: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-text)', margin: 0 }}>Achats</h1>
        <a href="/backend/receptions/new" style={{ textDecoration: 'none' }}>
          <button type="button" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--color-primary)', color: '#fff', border: 'none', borderRadius: '0.5rem', padding: '0.5rem 1rem', cursor: 'pointer', fontWeight: 500 }}>
            <Plus size={16} /> Nouvelle réception
          </button>
        </a>
      </div>

      <AchatsTabs />

      {/* Filter bar */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.25rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <input
          type="text"
          value={q}
          onChange={e => setQ(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && search()}
          placeholder="Rechercher N°, référence, fournisseur…"
          style={{ flex: 1, minWidth: '220px', padding: '0.5rem 0.75rem', border: '1px solid var(--color-border)', borderRadius: '0.375rem', fontSize: '0.9375rem' }}
        />
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          {(['draft', 'given'] as ReceptionState[]).map(state => (
            <label key={state} style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', cursor: 'pointer', fontSize: '0.9rem' }}>
              <input
                type="checkbox"
                aria-label={`Filtrer par état : ${STATE_CONFIG[state].label}`}
                checked={selectedStates.includes(state)}
                onChange={() => toggleState(state)}
              />
              <span aria-hidden="true" style={{ userSelect: 'none' }}>
                {state === 'draft' ? 'Brouillons' : 'Validées'}
              </span>
            </label>
          ))}
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
              {['N° réception', 'Fournisseur', 'N° commande', 'État', 'Date prévue', 'Date réception', 'HT', 'Facturation', 'Actions'].map(h => (
                <th key={h} style={th}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {receptions.map(r => {
              const stateBadge = STATE_CONFIG[r.state] ?? { label: r.state, bg: '#f3f4f6', color: '#6b7280' }
              const reconcBadge = RECONCILIATION_CONFIG[r.reconciliation_state] ?? { label: r.reconciliation_state, bg: '#f3f4f6', color: '#6b7280' }
              return (
                <tr key={r.id}>
                  <td style={td}>
                    <a href={`/backend/receptions/${r.id}`} style={{ color: 'var(--color-primary)', textDecoration: 'none', fontWeight: 500 }}>{r.number}</a>
                  </td>
                  <td style={td}>{r.supplier.full_name}</td>
                  <td style={td}>
                    {r.purchase_order
                      ? <a href={`/backend/purchase_orders/${r.purchase_order.id}`} style={{ color: 'var(--color-primary)', textDecoration: 'none' }}>{r.purchase_order.number}</a>
                      : '—'}
                  </td>
                  <td style={td}>
                    <span style={{ background: stateBadge.bg, color: stateBadge.color, padding: '0.125rem 0.625rem', borderRadius: '9999px', fontSize: '0.8rem', fontWeight: 500 }}>
                      {stateBadge.label}
                    </span>
                  </td>
                  <td style={td}>{r.planned_at}</td>
                  <td style={td}>{r.given_at ?? '—'}</td>
                  <td style={{ ...td, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                    {r.pretax_amount.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}
                  </td>
                  <td style={td}>
                    <span style={{ background: reconcBadge.bg, color: reconcBadge.color, padding: '0.125rem 0.625rem', borderRadius: '9999px', fontSize: '0.8rem', fontWeight: 500 }}>
                      {reconcBadge.label}
                    </span>
                  </td>
                  <td style={td}>
                    <div style={{ display: 'flex', gap: '0.375rem' }}>
                      <a href={`/backend/receptions/${r.id}/edit`}>
                        <button type="button" title="Modifier" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', padding: '0.25rem' }}>
                          <Pencil size={15} />
                        </button>
                      </a>
                      {r.destroyable && (
                        <button
                          type="button"
                          aria-label="Supprimer"
                          onClick={() => handleDelete(r.id, r.number)}
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
          {meta.total_count} réception(s)
        </span>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {meta.current_page > 1 && (
            <button type="button" onClick={() => router.get('/backend/receptions', { q, state: selectedStates, page: meta.current_page - 1 })} style={{ padding: '0.25rem 0.75rem', border: '1px solid var(--color-border)', borderRadius: '0.375rem', cursor: 'pointer', background: 'var(--color-bg-card)' }}>
              Précédent
            </button>
          )}
          {meta.current_page < meta.total_pages && (
            <button type="button" onClick={() => router.get('/backend/receptions', { q, state: selectedStates, page: meta.current_page + 1 })} style={{ padding: '0.25rem 0.75rem', border: '1px solid var(--color-border)', borderRadius: '0.375rem', cursor: 'pointer', background: 'var(--color-bg-card)' }}>
              Suivant
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

ReceptionsIndex.layout = (page: ReactNode) => <AppShell>{page}</AppShell>
