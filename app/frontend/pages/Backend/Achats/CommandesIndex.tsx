// app/frontend/pages/Backend/Achats/CommandesIndex.tsx
import { type ReactNode, useState, useEffect } from 'react'
import { router } from '@inertiajs/react'
import { Plus, Pencil, Trash2, Search } from 'lucide-react'
import { AppShell } from '../../../components/AppShell'
import AchatsTabs from '../../../components/achats/AchatsTabs'
import { PageHeader, SectionCard, FilterBar, StateBadge, Pagination, PrimaryButton } from '../../../components/ui'
import type { CommandesIndexProps, CommandeState } from '../../../types/achat'

const STATE_CONFIG: Record<CommandeState, { label: string; color: string; bg: string; border: string }> = {
  opened: { label: 'En cours',  color: 'var(--color-warning)',    bg: 'var(--color-warning-bg)', border: 'var(--color-border)' },
  closed: { label: 'Clôturée', color: 'var(--color-text-muted)', bg: 'var(--color-bg-subtle)',  border: 'var(--color-border)' },
}

function formatXOF(n: number) {
  return n.toLocaleString('fr-FR').replace(/\u00A0/g, '\u2009') + ' XOF'
}

export default function CommandesIndex({ commandes, filters, meta }: CommandesIndexProps) {
  const [q, setQ] = useState(filters.q ?? '')

  useEffect(() => { setQ(filters.q ?? '') }, [filters.q])

  function search() {
    router.get('/backend/purchase_orders', { q, state: filters.state }, { preserveState: true })
  }

  function handleDelete(id: number, number: string) {
    if (window.confirm(`Supprimer la commande ${number} ?`)) {
      router.delete(`/backend/purchase_orders/${id}`)
    }
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--color-bg)' }}>
      <PageHeader
        title="Achats"
        subtitle={`${meta.total_count} commande${meta.total_count !== 1 ? 's' : ''} fournisseur`}
        action={
          <PrimaryButton href="/backend/purchase_orders/new">
            <Plus size={14} /> Nouvelle commande
          </PrimaryButton>
        }
      />

      <AchatsTabs />

      <FilterBar>
        <div className="relative flex-1 min-w-[200px]">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--color-text-muted)' }} />
          <input
            type="text"
            value={q}
            onChange={e => setQ(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && search()}
            placeholder="N°, référence, fournisseur…"
            className="w-full pl-8 pr-3 py-1.5 text-sm rounded-lg"
            style={{ border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)' }}
          />
        </div>
        <div className="flex gap-1.5">
          {(['opened', 'closed'] as CommandeState[]).map(state => {
            const cfg = STATE_CONFIG[state]
            const checked = (filters.state ?? []).includes(state)
            return (
              <button
                key={state}
                type="button"
                onClick={() => {
                  const cur = filters.state ?? []
                  const next = checked ? cur.filter(s => s !== state) : [...cur, state]
                  router.get('/backend/purchase_orders', { q, state: next }, { preserveState: true })
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
        <button
          type="button"
          onClick={search}
          className="px-3.5 py-1.5 rounded-lg text-sm font-semibold cursor-pointer border-none"
          style={{ background: 'var(--color-primary)', color: '#fff' }}
        >
          Chercher
        </button>
      </FilterBar>

      <SectionCard noPadding>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'var(--color-bg)' }}>
              {['N° commande', 'Référence', 'Fournisseur', 'État', 'Date commande', 'HT', 'TTC', ''].map(h => (
                <th
                  key={h}
                  className="px-3.5 py-2.5 text-[10px] font-semibold uppercase tracking-widest border-b"
                  style={{ textAlign: h === 'HT' || h === 'TTC' ? 'right' : 'left', borderColor: 'var(--color-border)', color: 'var(--color-text-muted)' }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {commandes.map((c, i) => {
              const cfg = STATE_CONFIG[c.state]
              return (
                <tr
                  key={c.id}
                  className="border-b"
                  style={{ background: i % 2 === 0 ? 'transparent' : 'rgba(240,247,236,0.35)', borderColor: 'var(--color-border)' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--color-bg-highlight)' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = i % 2 === 0 ? 'transparent' : 'rgba(240,247,236,0.35)' }}
                >
                  <td className="px-3.5 py-2.5 text-sm">
                    <a href={`/backend/purchase_orders/${c.id}`} className="font-semibold no-underline" style={{ color: 'var(--color-primary)' }}>{c.number}</a>
                  </td>
                  <td className="px-3.5 py-2.5 text-sm" style={{ color: 'var(--color-text-muted)' }}>{c.reference_number ?? '—'}</td>
                  <td className="px-3.5 py-2.5 text-sm font-medium" style={{ color: 'var(--color-text)' }}>{c.supplier.full_name}</td>
                  <td className="px-3.5 py-2.5">
                    {cfg && <StateBadge label={cfg.label} color={cfg.color} bg={cfg.bg} border={cfg.border} />}
                  </td>
                  <td className="px-3.5 py-2.5 text-sm whitespace-nowrap" style={{ color: 'var(--color-text-muted)' }}>
                    {new Date(c.ordered_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </td>
                  <td className="px-3.5 py-2.5 text-sm font-medium tabular-nums whitespace-nowrap text-right" style={{ color: 'var(--color-text)' }}>{formatXOF(c.pretax_amount)}</td>
                  <td className="px-3.5 py-2.5 text-sm font-bold tabular-nums whitespace-nowrap text-right" style={{ color: 'var(--color-text)' }}>{formatXOF(c.amount)}</td>
                  <td className="px-3.5 py-2.5">
                    <div className="flex gap-2 items-center">
                      <a href={`/backend/purchase_orders/${c.id}/edit`} title="Modifier" style={{ color: 'var(--color-text-muted)' }}>
                        <Pencil size={14} />
                      </a>
                      {c.destroyable && (
                        <button
                          type="button"
                          onClick={() => handleDelete(c.id, c.number)}
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
            {commandes.length === 0 && (
              <tr>
                <td colSpan={8} className="py-8 text-center text-sm" style={{ color: 'var(--color-text-muted)' }}>
                  Aucune commande fournisseur
                </td>
              </tr>
            )}
          </tbody>
        </table>
        {meta.total_pages > 1 && (
          <Pagination
            page={meta.current_page}
            totalPages={meta.total_pages}
            total={meta.total_count}
            onPrev={() => router.get('/backend/purchase_orders', { ...filters, page: meta.current_page - 1 })}
            onNext={() => router.get('/backend/purchase_orders', { ...filters, page: meta.current_page + 1 })}
          />
        )}
      </SectionCard>
    </div>
  )
}

CommandesIndex.layout = (page: ReactNode) => <AppShell>{page}</AppShell>
