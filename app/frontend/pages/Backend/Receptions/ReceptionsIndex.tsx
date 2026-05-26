// app/frontend/pages/Backend/Receptions/ReceptionsIndex.tsx
import { type ReactNode, useState, useEffect } from 'react'
import { router } from '@inertiajs/react'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { AppShell } from '../../../components/AppShell'
import AchatsTabs from '../../../components/achats/AchatsTabs'
import { PageHeader, SectionCard, FilterBar, StateBadge, Pagination, PrimaryButton } from '../../../components/ui'
import type { ReceptionsIndexProps, ReceptionState, ReceptionReconciliationState } from '../../../types/reception'

const STATE_CONFIG: Record<ReceptionState, { label: string; color: string; bg: string }> = {
  draft: { label: 'Brouillon', color: 'var(--color-warning-text)', bg: 'var(--color-warning-bg)' },
  given: { label: 'Validée',   color: 'var(--color-primary)',      bg: 'var(--color-success-bg)' },
}

const RECONCILIATION_CONFIG: Record<ReceptionReconciliationState, { label: string; color: string; bg: string }> = {
  to_reconcile: { label: 'Non facturée', color: 'var(--color-warning-text)', bg: 'var(--color-warning-bg)' },
  reconcile:    { label: 'Facturée',     color: 'var(--color-primary)',      bg: 'var(--color-success-bg)' },
}

export default function ReceptionsIndex({ receptions, filters, meta }: ReceptionsIndexProps) {
  const [q, setQ] = useState(filters.q ?? '')
  const [selectedStates, setSelectedStates] = useState<ReceptionState[]>(filters.state ?? [])
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())

  useEffect(() => { setQ(filters.q ?? '') }, [filters.q])

  function search() {
    setSelectedIds(new Set())
    router.get('/backend/receptions', { q, state: selectedStates }, { preserveState: true })
  }

  function toggleState(state: ReceptionState) {
    setSelectedStates(prev =>
      prev.includes(state) ? prev.filter(s => s !== state) : [...prev, state]
    )
  }

  function toggleSelect(id: number) {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) { next.delete(id) } else { next.add(id) }
      return next
    })
  }

  function handleDelete(id: number, number: string) {
    if (window.confirm(`Supprimer la réception ${number} ?`)) {
      router.delete(`/backend/receptions/${id}`)
    }
  }

  const groupedInvoiceHref = selectedIds.size >= 2
    ? `/backend/purchase_invoices/new?${[...selectedIds].map(id => `reception_ids[]=${id}`).join('&')}`
    : '#'

  return (
    <div className="min-h-screen" style={{ background: 'var(--color-bg)' }}>
      <PageHeader
        title="Achats"
        subtitle={`${meta.total_count} réception${meta.total_count !== 1 ? 's' : ''} fournisseur`}
        action={
          <PrimaryButton href="/backend/receptions/new">
            <Plus size={14} /> Nouvelle réception
          </PrimaryButton>
        }
      />

      <AchatsTabs />

      <FilterBar>
        <input
          type="text"
          value={q}
          onChange={e => setQ(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && search()}
          placeholder="Rechercher N°, référence, fournisseur…"
          className="flex-1 min-w-[220px] px-3 py-1.5 text-sm rounded-lg"
          style={{ border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)' }}
        />
        <div className="flex gap-3 items-center">
          {(['draft', 'given'] as ReceptionState[]).map(state => (
            <label key={state} className="flex items-center gap-1.5 cursor-pointer text-sm" style={{ color: 'var(--color-text)' }}>
              <input
                type="checkbox"
                aria-label={`Filtrer par état : ${STATE_CONFIG[state].label}`}
                checked={selectedStates.includes(state)}
                onChange={() => toggleState(state)}
              />
              {state === 'draft' ? 'Brouillons' : 'Validées'}
            </label>
          ))}
        </div>
        <button
          type="button"
          onClick={search}
          className="px-3.5 py-1.5 rounded-lg text-sm font-semibold cursor-pointer border-none"
          style={{ background: 'var(--color-primary)', color: '#fff' }}
        >
          Chercher
        </button>
      </FilterBar>

      <div role="status" aria-live="polite" aria-atomic="true">
        {selectedIds.size >= 2 && (
          <div
            className="flex items-center gap-4 rounded-[10px] px-4 py-3 mb-4"
            style={{ background: 'var(--color-info-bg)', border: '1px solid var(--color-border)' }}
          >
            <span className="text-sm" style={{ color: 'var(--color-info-text)' }}>
              {selectedIds.size} réception(s) sélectionnée(s)
            </span>
            <PrimaryButton href={groupedInvoiceHref} size="sm">
              Créer une facture groupée
            </PrimaryButton>
          </div>
        )}
      </div>

      <SectionCard noPadding>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'var(--color-bg)' }}>
              <th className="px-3.5 py-2.5 text-[10px] font-semibold uppercase tracking-widest border-b text-left" style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-muted)', width: '2.5rem' }}>
                Sélectionner
              </th>
              {['N° réception', 'Fournisseur', 'N° commande', 'État', 'Date prévue', 'Date réception', 'HT', 'Facturation', 'Actions'].map(h => (
                <th key={h} className="px-3.5 py-2.5 text-left text-[10px] font-semibold uppercase tracking-widest border-b" style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-muted)' }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {receptions.map((r, i) => {
              const stateCfg = STATE_CONFIG[r.state]
              const reconcCfg = RECONCILIATION_CONFIG[r.reconciliation_state]
              return (
                <tr
                  key={r.id}
                  className="border-b"
                  style={{ background: i % 2 === 0 ? 'transparent' : 'rgba(240,247,236,0.35)', borderColor: 'var(--color-border)' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--color-bg-highlight)' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = i % 2 === 0 ? 'transparent' : 'rgba(240,247,236,0.35)' }}
                >
                  <td className="px-3.5 py-2.5 text-center">
                    <input
                      type="checkbox"
                      aria-label={`Sélectionner la réception ${r.number}`}
                      checked={selectedIds.has(r.id)}
                      onChange={() => toggleSelect(r.id)}
                      disabled={!r.invoiceable}
                    />
                  </td>
                  <td className="px-3.5 py-2.5 text-sm">
                    <a href={`/backend/receptions/${r.id}`} className="font-semibold no-underline" style={{ color: 'var(--color-primary)' }}>{r.number}</a>
                  </td>
                  <td className="px-3.5 py-2.5 text-sm" style={{ color: 'var(--color-text)' }}>{r.supplier.full_name}</td>
                  <td className="px-3.5 py-2.5 text-sm" style={{ color: 'var(--color-text-muted)' }}>
                    {r.purchase_order
                      ? <a href={`/backend/purchase_orders/${r.purchase_order.id}`} className="no-underline" style={{ color: 'var(--color-primary)' }}>{r.purchase_order.number}</a>
                      : '—'}
                  </td>
                  <td className="px-3.5 py-2.5">
                    {stateCfg && <StateBadge label={stateCfg.label} color={stateCfg.color} bg={stateCfg.bg} />}
                  </td>
                  <td className="px-3.5 py-2.5 text-sm" style={{ color: 'var(--color-text-muted)' }}>{r.planned_at}</td>
                  <td className="px-3.5 py-2.5 text-sm" style={{ color: 'var(--color-text-muted)' }}>{r.given_at ?? '—'}</td>
                  <td className="px-3.5 py-2.5 text-sm font-medium tabular-nums text-right" style={{ color: 'var(--color-text)' }}>
                    {r.pretax_amount.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-3.5 py-2.5">
                    {reconcCfg && <StateBadge label={reconcCfg.label} color={reconcCfg.color} bg={reconcCfg.bg} />}
                  </td>
                  <td className="px-3.5 py-2.5">
                    <div className="flex gap-1.5">
                      <a href={`/backend/receptions/${r.id}/edit`} title="Modifier" style={{ color: 'var(--color-text-muted)' }}>
                        <Pencil size={14} />
                      </a>
                      {r.destroyable && (
                        <button
                          type="button"
                          aria-label="Supprimer"
                          onClick={() => handleDelete(r.id, r.number)}
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
        {meta.total_pages > 1 && (
          <Pagination
            page={meta.current_page}
            totalPages={meta.total_pages}
            total={meta.total_count}
            onPrev={() => { setSelectedIds(new Set()); router.get('/backend/receptions', { q, state: selectedStates, page: meta.current_page - 1 }) }}
            onNext={() => { setSelectedIds(new Set()); router.get('/backend/receptions', { q, state: selectedStates, page: meta.current_page + 1 }) }}
          />
        )}
      </SectionCard>
    </div>
  )
}

ReceptionsIndex.layout = (page: ReactNode) => <AppShell>{page}</AppShell>
