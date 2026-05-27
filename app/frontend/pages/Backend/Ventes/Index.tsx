import type { ReactNode } from 'react'
import { useState, useEffect } from 'react'
import { router } from '@inertiajs/react'
import type { FormDataConvertible } from '@inertiajs/core'
import { ShoppingCart, Plus, Search, Trash2, Edit, AlertCircle } from 'lucide-react'
import { AppShell } from '../../../components/AppShell'
import { PageHeader, SectionCard, FilterBar, StateBadge, Pagination, PrimaryButton } from '../../../components/ui'
import type { VentesIndexProps, VenteState } from '../../../types/vente'

const STATE_CONFIG: Record<VenteState, { label: string; color: string; bg: string; border: string }> = {
  draft:    { label: 'Brouillon', color: 'var(--color-text-muted)', bg: 'var(--color-bg-subtle)',  border: 'var(--color-border)' },
  estimate: { label: 'Devis',     color: 'var(--color-info)',       bg: 'var(--color-info-bg)',    border: 'var(--color-info)' },
  aborted:  { label: 'Annulé',    color: 'var(--color-danger)',     bg: 'var(--color-danger-bg)',  border: 'var(--color-danger-border)' },
  refused:  { label: 'Refusé',    color: 'var(--color-warning-text)', bg: 'var(--color-warning-bg)', border: 'var(--color-border)' },
  order:    { label: 'Commande',  color: 'var(--color-warning)',    bg: 'var(--color-warning-bg)', border: 'var(--color-border)' },
  invoice:  { label: 'Facture',   color: 'var(--color-primary)',    bg: 'var(--color-success-bg)', border: 'var(--color-primary)' },
}

function formatXOF(n: number) {
  return n.toLocaleString('fr-FR').replace(/\u00A0/g, '\u2009') + ' XOF'
}

function formatDate(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
}

function VentesIndex({ sales, meta, filters, natures }: VentesIndexProps) {
  const [q, setQ] = useState(filters.q ?? '')
  const unpaidCount = sales.filter(s => s.state === 'invoice').length

  useEffect(() => { setQ(filters.q ?? '') }, [filters.q])

  function applyFilter(overrides: Record<string, FormDataConvertible>) {
    router.get('/backend/sales', { ...filters, q, ...overrides }, { preserveState: true, replace: true })
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    applyFilter({ q, page: 1 })
  }

  function handleDestroy(id: number) {
    if (!window.confirm('Supprimer cette vente ?')) return
    router.delete(`/backend/sales/${id}`)
  }

  const totalPages = Math.ceil(meta.total / meta.per_page)

  return (
    <div className="min-h-screen" style={{ background: 'var(--color-bg)' }}>
      <PageHeader
        title="Ventes"
        subtitle={`${meta.total} vente${meta.total !== 1 ? 's' : ''}`}
        action={
          <PrimaryButton href={natures.length === 1 ? `/backend/sales/new?sale[nature_id]=${natures[0]!.id}` : '/backend/sales/new'}>
            <Plus size={14} /> Nouvelle vente
          </PrimaryButton>
        }
      />

      {(filters.nature === 'unpaid' || unpaidCount > 0) && (
        <div
          className="flex items-center gap-2.5 rounded-[10px] px-4 py-3 mb-4"
          style={{ background: 'var(--color-warning-bg)', border: '1px solid var(--color-border)' }}
        >
          <AlertCircle size={16} style={{ color: 'var(--color-warning-text)' }} />
          <span className="text-sm font-semibold" style={{ color: 'var(--color-warning-text)' }}>
            {unpaidCount} vente{unpaidCount !== 1 ? 's' : ''} non soldée{unpaidCount !== 1 ? 's' : ''}
          </span>
          <button
            onClick={() => applyFilter({ nature: filters.nature === 'unpaid' ? 'all' : 'unpaid', page: 1 })}
            className="ml-auto text-[12px] font-semibold bg-transparent border-none cursor-pointer underline"
            style={{ color: 'var(--color-warning-text)' }}
          >
            {filters.nature === 'unpaid' ? 'Tout afficher' : 'Afficher uniquement'}
          </button>
        </div>
      )}

      <FilterBar>
        <form onSubmit={handleSearch} className="flex gap-2 flex-1 min-w-[200px]">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--color-text-muted)' }} />
            <input
              type="text"
              value={q}
              onChange={e => setQ(e.target.value)}
              placeholder="N°, référence, client…"
              className="w-full pl-8 pr-3 py-1.5 text-sm rounded-lg"
              style={{ border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)' }}
            />
          </div>
          <PrimaryButton type="submit" size="sm">Chercher</PrimaryButton>
        </form>

        <div className="flex gap-1.5 flex-wrap">
          {(Object.entries(STATE_CONFIG) as [VenteState, (typeof STATE_CONFIG)[VenteState]][]).map(([state, cfg]) => {
            const checked = filters.state.includes(state)
            return (
              <button
                key={state}
                type="button"
                onClick={() => {
                  const next = checked ? filters.state.filter(s => s !== state) : [...filters.state, state]
                  applyFilter({ state: next, page: 1 })
                }}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold border cursor-pointer"
                style={{
                  background: checked ? cfg.bg : 'var(--color-bg)',
                  borderColor: checked ? cfg.border : 'var(--color-border)',
                  color: checked ? cfg.color : 'var(--color-text-muted)',
                }}
              >
                {cfg.label}
              </button>
            )
          })}
        </div>
      </FilterBar>

      {sales.length === 0 ? (
        <div className="text-center py-12" style={{ color: 'var(--color-text-muted)' }}>
          <ShoppingCart size={32} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm">Aucune vente trouvée</p>
        </div>
      ) : (
        <SectionCard noPadding>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--color-bg)' }}>
                {['N° vente', 'Référence', 'Client', 'État', 'Créée le', 'Facturée le', 'HT', 'TTC', ''].map(h => (
                  <th
                    key={h}
                    className="px-3.5 py-2.5 text-[10px] font-semibold uppercase tracking-widest border-b text-left"
                    style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-muted)', textAlign: h === 'HT' || h === 'TTC' ? 'right' : 'left' }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sales.map((sale, i) => {
                const cfg = STATE_CONFIG[sale.state]
                return (
                  <tr
                    key={sale.id}
                    className="border-b"
                    style={{ background: i % 2 === 0 ? 'transparent' : 'rgba(240,247,236,0.35)', borderColor: 'var(--color-border)' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--color-bg-highlight)' }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = i % 2 === 0 ? 'transparent' : 'rgba(240,247,236,0.35)' }}
                  >
                    <td className="px-3.5 py-2.5 text-sm">
                      <a href={`/backend/sales/${sale.id}`} className="font-semibold no-underline" style={{ color: 'var(--color-primary)' }}>
                        {sale.number}
                      </a>
                    </td>
                    <td className="px-3.5 py-2.5 text-sm" style={{ color: 'var(--color-text-muted)' }}>{sale.reference_number ?? '—'}</td>
                    <td className="px-3.5 py-2.5 text-sm font-medium" style={{ color: 'var(--color-text)' }}>{sale.client_name}</td>
                    <td className="px-3.5 py-2.5">
                      {cfg ? (
                        <StateBadge label={cfg.label} color={cfg.color} bg={cfg.bg} border={cfg.border} />
                      ) : (
                        <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{sale.state_label}</span>
                      )}
                    </td>
                    <td className="px-3.5 py-2.5 text-sm whitespace-nowrap" style={{ color: 'var(--color-text-muted)' }}>{formatDate(sale.created_at)}</td>
                    <td className="px-3.5 py-2.5 text-sm whitespace-nowrap" style={{ color: 'var(--color-text-muted)' }}>{formatDate(sale.invoiced_at)}</td>
                    <td className="px-3.5 py-2.5 text-sm font-medium tabular-nums whitespace-nowrap text-right" style={{ color: 'var(--color-text)' }}>{formatXOF(sale.pretax_amount)}</td>
                    <td className="px-3.5 py-2.5 text-sm font-bold tabular-nums whitespace-nowrap text-right" style={{ color: 'var(--color-text)' }}>{formatXOF(sale.amount)}</td>
                    <td className="px-3.5 py-2.5">
                      <div className="flex gap-2 items-center">
                        {sale.updateable && (
                          <a href={`/backend/sales/${sale.id}/edit`} title="Modifier" style={{ color: 'var(--color-text-muted)' }}>
                            <Edit size={14} />
                          </a>
                        )}
                        {sale.canDestroy && (
                          <button
                            type="button"
                            onClick={() => handleDestroy(sale.id)}
                            title="Supprimer"
                            className="bg-transparent border-none cursor-pointer p-0"
                            style={{ color: 'var(--color-danger)' }}
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          {totalPages > 1 && (
            <Pagination
              page={meta.page}
              totalPages={totalPages}
              total={meta.total}
              onPrev={() => applyFilter({ page: meta.page - 1 })}
              onNext={() => applyFilter({ page: meta.page + 1 })}
            />
          )}
        </SectionCard>
      )}
    </div>
  )
}

VentesIndex.layout = (page: ReactNode) => <AppShell>{page}</AppShell>
export default VentesIndex
