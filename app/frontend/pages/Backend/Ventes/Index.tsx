import type { ReactNode } from 'react'
import { useState } from 'react'
import { router } from '@inertiajs/react'
import type { FormDataConvertible } from '@inertiajs/core'
import { ShoppingCart, Plus, Search, Trash2, Edit } from 'lucide-react'
import { AppShell } from '../../../components/AppShell'
import type { VentesIndexProps, VenteState } from '../../../types/vente'

const STATE_CONFIG: Record<VenteState, { label: string; bg: string; color: string }> = {
  draft:    { label: 'Brouillon', bg: '#f3f4f6', color: '#374151' },
  estimate: { label: 'Devis',     bg: '#dbeafe', color: '#1d4ed8' },
  aborted:  { label: 'Annulé',    bg: '#fee2e2', color: '#991b1b' },
  refused:  { label: 'Refusé',    bg: '#fef3c7', color: '#92400e' },
  order:    { label: 'Commande',  bg: '#d1fae5', color: '#065f46' },
  invoice:  { label: 'Facture',   bg: '#ede9fe', color: '#5b21b6' },
}

function StateBadge({ state, label }: { state: VenteState; label: string }) {
  const cfg = STATE_CONFIG[state] ?? { label, bg: '#f3f4f6', color: '#374151' }
  return (
    <span
      className="inline-block px-2 py-0.5 rounded-full text-xs font-semibold"
      style={{ background: cfg.bg, color: cfg.color }}
    >
      {cfg.label}
    </span>
  )
}

function formatAmount(amount: number, currency: string) {
  return new Intl.NumberFormat('fr-SN', { style: 'currency', currency, maximumFractionDigits: 0 }).format(amount)
}

function VentesIndex({ sales, meta, filters, natures }: VentesIndexProps) {
  const [q, setQ] = useState(filters.q ?? '')

  function applyFilter(overrides: Record<string, FormDataConvertible>) {
    const params: Record<string, FormDataConvertible> = { ...filters, q, ...overrides }
    router.get('/backend/sales', params, { preserveState: true, replace: true })
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    applyFilter({ q, page: 1 })
  }

  function handleDestroy(id: number) {
    if (!window.confirm('Supprimer cette vente ?')) return
    router.delete(`/backend/sales/${id}`)
  }

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1
            className="text-2xl font-bold"
            style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-text)' }}
          >
            Ventes
          </h1>
          <p className="mt-1 text-sm" style={{ color: 'var(--color-text-muted)' }}>
            {meta.total} vente{meta.total !== 1 ? 's' : ''}
          </p>
        </div>
        <a
          href={natures.length === 1 ? `/backend/sales/new?sale[nature_id]=${natures[0].id}` : '/backend/sales/new'}
          className="flex items-center gap-2 px-3 py-2 rounded text-sm font-medium no-underline"
          style={{ background: 'var(--color-primary)', color: '#fff' }}
        >
          <Plus size={15} />
          Nouvelle vente
        </a>
      </div>

      {/* Filter bar */}
      <div
        className="rounded-lg p-4 mb-4 flex flex-wrap gap-3 items-end"
        style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)' }}
      >
        <form onSubmit={handleSearch} className="flex gap-2 flex-1 min-w-48">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--color-text-muted)' }} />
            <input
              type="text"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="N°, référence, client…"
              className="w-full rounded pl-8 pr-3 py-2 text-sm"
              style={{ border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)', outline: 'none' }}
            />
          </div>
          <button
            type="submit"
            className="px-3 py-2 rounded text-sm font-medium"
            style={{ background: 'var(--color-primary)', color: '#fff', border: 'none', cursor: 'pointer' }}
          >
            Chercher
          </button>
        </form>

        {/* State filter checkboxes — labels via title/aria-label to avoid duplicate text nodes */}
        <div className="flex flex-wrap gap-2" role="group" aria-label="Filtrer par état">
          {(Object.entries(STATE_CONFIG) as [VenteState, { label: string; bg: string; color: string }][]).map(([state, cfg]) => {
            const checked = filters.state.includes(state)
            return (
              <input
                key={state}
                type="checkbox"
                checked={checked}
                title={cfg.label}
                aria-label={cfg.label}
                style={{
                  accentColor: cfg.color,
                  cursor: 'pointer',
                  width: '14px',
                  height: '14px',
                }}
                onChange={() => {
                  const next = checked ? filters.state.filter((s) => s !== state) : [...filters.state, state]
                  applyFilter({ state: next, page: 1 })
                }}
              />
            )
          })}
        </div>

        {/* Unpaid toggle */}
        <label className="flex items-center gap-1 text-xs cursor-pointer" style={{ color: 'var(--color-text)' }}>
          <input
            type="checkbox"
            checked={filters.nature === 'unpaid'}
            onChange={() => applyFilter({ nature: filters.nature === 'unpaid' ? 'all' : 'unpaid', page: 1 })}
          />
          Non soldé
        </label>
      </div>

      {/* Table */}
      {sales.length === 0 ? (
        <div className="text-center py-16" style={{ color: 'var(--color-text-muted)' }}>
          <ShoppingCart size={32} className="mx-auto mb-3 opacity-30" />
          <p>Aucune vente trouvée.</p>
        </div>
      ) : (
        <div
          className="rounded-lg overflow-hidden border"
          style={{ background: 'var(--color-bg-card)', borderColor: 'var(--color-border)' }}
        >
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b" style={{ background: 'var(--color-bg)', borderColor: 'var(--color-border)' }}>
                {['N° vente', 'Référence', 'Client', 'État', 'Date création', 'Date facture', 'HT', 'TTC', 'Actions'].map((h) => (
                  <th
                    key={h}
                    className="px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide"
                    style={{ color: 'var(--color-text-muted)' }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sales.map((sale) => (
                <tr key={sale.id} className="border-b" style={{ borderColor: 'var(--color-border)' }}>
                  <td className="px-3 py-2.5">
                    <a
                      href={`/backend/sales/${sale.id}`}
                      className="font-medium no-underline hover:underline"
                      style={{ color: 'var(--color-primary)' }}
                    >
                      {sale.number}
                    </a>
                  </td>
                  <td className="px-3 py-2.5" style={{ color: 'var(--color-text-muted)' }}>
                    {sale.reference_number ?? '—'}
                  </td>
                  <td className="px-3 py-2.5" style={{ color: 'var(--color-text)' }}>
                    {sale.client_name}
                  </td>
                  <td className="px-3 py-2.5">
                    <StateBadge state={sale.state} label={sale.state_label} />
                  </td>
                  <td className="px-3 py-2.5" style={{ color: 'var(--color-text-muted)' }}>
                    {sale.created_at.slice(0, 10)}
                  </td>
                  <td className="px-3 py-2.5" style={{ color: 'var(--color-text-muted)' }}>
                    {sale.invoiced_at ? sale.invoiced_at.slice(0, 10) : '—'}
                  </td>
                  <td className="px-3 py-2.5 text-right font-medium" style={{ color: 'var(--color-text)' }}>
                    {formatAmount(sale.pretax_amount, sale.currency)}
                  </td>
                  <td className="px-3 py-2.5 text-right font-medium" style={{ color: 'var(--color-text)' }}>
                    {formatAmount(sale.amount, sale.currency)}
                  </td>
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-2">
                      {sale.updateable && (
                        <a
                          href={`/backend/sales/${sale.id}/edit`}
                          title="Modifier"
                          style={{ color: 'var(--color-text-muted)' }}
                        >
                          <Edit size={14} />
                        </a>
                      )}
                      {sale.destroyable && (
                        <button
                          onClick={() => handleDestroy(sale.id)}
                          title="Supprimer"
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626', padding: 0 }}
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pagination */}
          {meta.total > meta.per_page && (
            <div className="flex items-center justify-between px-4 py-3" style={{ borderTop: '1px solid var(--color-border)' }}>
              <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                Page {meta.page} — {meta.total} au total
              </p>
              <div className="flex gap-2">
                {meta.page > 1 && (
                  <button
                    onClick={() => applyFilter({ page: meta.page - 1 })}
                    className="px-3 py-1 rounded text-xs"
                    style={{ border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)', cursor: 'pointer' }}
                  >
                    Précédent
                  </button>
                )}
                {meta.page * meta.per_page < meta.total && (
                  <button
                    onClick={() => applyFilter({ page: meta.page + 1 })}
                    className="px-3 py-1 rounded text-xs"
                    style={{ border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)', cursor: 'pointer' }}
                  >
                    Suivant
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </>
  )
}

VentesIndex.layout = (page: ReactNode) => <AppShell>{page}</AppShell>
export default VentesIndex
