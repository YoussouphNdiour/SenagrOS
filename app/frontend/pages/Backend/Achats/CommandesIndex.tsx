// app/frontend/pages/Backend/Achats/CommandesIndex.tsx
import { type ReactNode, useState, useEffect } from 'react'
import { router, usePage } from '@inertiajs/react'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { AppShell } from '../../../components/AppShell'
import type { CommandesIndexProps, CommandeState } from '../../../types/achat'

const STATE_CONFIG: Record<CommandeState, { label: string; bg: string; color: string }> = {
  opened: { label: 'En cours',  bg: '#dcfce7', color: '#166534' },
  closed: { label: 'Clôturée',  bg: '#f1f5f9', color: '#475569' },
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
          <a
            key={tab.href}
            href={tab.href}
            style={{
              padding: '0.5rem 1.25rem',
              fontWeight: active ? 600 : 400,
              borderBottom: active ? '2px solid var(--color-primary)' : '2px solid transparent',
              marginBottom: '-2px',
              color: active ? 'var(--color-primary)' : 'var(--color-text-muted)',
              textDecoration: 'none',
              fontSize: '0.9375rem',
            }}
          >
            {tab.label}
          </a>
        )
      })}
    </div>
  )
}

export default function CommandesIndex({ commandes, filters, meta }: CommandesIndexProps) {
  const [q, setQ] = useState(filters.q ?? '')
  const [selectedStates, setSelectedStates] = useState<CommandeState[]>(filters.state ?? [])

  useEffect(() => { setQ(filters.q ?? '') }, [filters.q])

  function search() {
    router.get('/backend/purchase_orders', { q, state: selectedStates }, { preserveState: true })
  }

  function toggleState(state: CommandeState) {
    setSelectedStates(prev =>
      prev.includes(state) ? prev.filter(s => s !== state) : [...prev, state]
    )
  }

  function handleDelete(id: number, number: string) {
    if (window.confirm(`Supprimer la commande ${number} ?`)) {
      router.delete(`/backend/purchase_orders/${id}`)
    }
  }

  const card: React.CSSProperties = { background: 'var(--color-bg-card)', borderRadius: '0.5rem', border: '1px solid var(--color-border)' }
  const th: React.CSSProperties = { padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.8125rem', color: 'var(--color-text-muted)', fontWeight: 600, borderBottom: '1px solid var(--color-border)' }
  const td: React.CSSProperties = { padding: '0.75rem 1rem', borderBottom: '1px solid var(--color-border)', fontSize: '0.9375rem' }

  return (
    <div style={{ padding: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-text)', margin: 0 }}>Achats</h1>
        <a href="/backend/purchase_orders/new" style={{ textDecoration: 'none' }}>
          <button type="button" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--color-primary)', color: '#fff', border: 'none', borderRadius: '0.5rem', padding: '0.5rem 1rem', cursor: 'pointer', fontWeight: 500 }}>
            <Plus size={16} /> Nouvelle commande
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
          {(['opened', 'closed'] as CommandeState[]).map(state => (
            <label key={state} style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', cursor: 'pointer', fontSize: '0.9rem' }}>
              <input
                type="checkbox"
                aria-label={`Filtrer par état : ${STATE_CONFIG[state].label}`}
                checked={selectedStates.includes(state)}
                onChange={() => toggleState(state)}
              />
              <span aria-hidden="true" style={{ userSelect: 'none' }}>
                {state === 'opened' ? 'Ouvertes' : 'Clôturées'}
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
              {['N° commande', 'Référence', 'Fournisseur', 'État', 'Date commande', 'HT', 'TTC', 'Actions'].map(h => (
                <th key={h} style={th}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {commandes.map(c => {
              const badge = STATE_CONFIG[c.state]
              return (
                <tr key={c.id}>
                  <td style={td}>
                    <a href={`/backend/purchase_orders/${c.id}`} style={{ color: 'var(--color-primary)', textDecoration: 'none', fontWeight: 500 }}>{c.number}</a>
                  </td>
                  <td style={td}>{c.reference_number ?? '—'}</td>
                  <td style={td}>{c.supplier.full_name}</td>
                  <td style={td}>
                    <span style={{ background: badge.bg, color: badge.color, padding: '0.125rem 0.625rem', borderRadius: '9999px', fontSize: '0.8rem', fontWeight: 500 }}>
                      {badge.label}
                    </span>
                  </td>
                  <td style={td}>{c.ordered_at}</td>
                  <td style={{ ...td, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{c.pretax_amount.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}</td>
                  <td style={{ ...td, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{c.amount.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}</td>
                  <td style={td}>
                    <div style={{ display: 'flex', gap: '0.375rem' }}>
                      <a href={`/backend/purchase_orders/${c.id}/edit`}>
                        <button type="button" title="Modifier" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', padding: '0.25rem' }}>
                          <Pencil size={15} />
                        </button>
                      </a>
                      {c.destroyable && (
                        <button
                          type="button"
                          aria-label="Supprimer"
                          onClick={() => handleDelete(c.id, c.number)}
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
          {meta.total_count} commande(s)
        </span>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {meta.current_page > 1 && (
            <button type="button" onClick={() => router.get('/backend/purchase_orders', { ...filters, page: meta.current_page - 1 })} style={{ padding: '0.25rem 0.75rem', border: '1px solid var(--color-border)', borderRadius: '0.375rem', cursor: 'pointer', background: 'var(--color-bg-card)' }}>
              Précédent
            </button>
          )}
          {meta.current_page < meta.total_pages && (
            <button type="button" onClick={() => router.get('/backend/purchase_orders', { ...filters, page: meta.current_page + 1 })} style={{ padding: '0.25rem 0.75rem', border: '1px solid var(--color-border)', borderRadius: '0.375rem', cursor: 'pointer', background: 'var(--color-bg-card)' }}>
              Suivant
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

CommandesIndex.layout = (page: ReactNode) => <AppShell>{page}</AppShell>
