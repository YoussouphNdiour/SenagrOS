import type { ReactNode } from 'react'
import { useState } from 'react'
import { router } from '@inertiajs/react'
import { Download, Plus, Search, Package, PawPrint, Tractor, Sprout, Box } from 'lucide-react'
import { AppShell } from '../../../components/AppShell'
import { PageHeader, SectionCard, DataTable, StateBadge, Pagination, PrimaryButton, FilterBar } from '../../../components/ui'
import type { CatalogueIndexProps, ProduitType } from '../../../types/catalogue'

const TYPE_CFG: Record<ProduitType, { label: string; color: string; bg: string; Icon: typeof Package }> = {
  Matter:    { label: 'Matière',     color: 'var(--color-primary)',    bg: 'var(--color-success-bg)', Icon: Package },
  Animal:    { label: 'Animal',      color: 'var(--color-warning)',    bg: 'var(--color-warning-bg)', Icon: PawPrint },
  Equipment: { label: 'Équipement',  color: 'var(--color-info)',       bg: 'var(--color-info-bg)',    Icon: Tractor },
  Plant:     { label: 'Plante',      color: '#7c3aed',                 bg: '#ede9fe',                 Icon: Sprout },
  Other:     { label: 'Autre',       color: 'var(--color-text-muted)', bg: 'var(--color-bg-subtle)',  Icon: Box },
}

const TYPE_FILTERS: { value: ProduitType | ''; label: string }[] = [
  { value: '',          label: 'Tous' },
  { value: 'Matter',    label: 'Matière' },
  { value: 'Animal',    label: 'Animal' },
  { value: 'Equipment', label: 'Équipement' },
  { value: 'Plant',     label: 'Plante' },
  { value: 'Other',     label: 'Autre' },
]

function CatalogueIndex({ produits, filters, meta }: CatalogueIndexProps) {
  const [q, setQ] = useState(filters.q ?? '')
  const [typeFilter, setTypeFilter] = useState<ProduitType | ''>(filters.produit_type ?? '')
  const [etatFilter, setEtatFilter] = useState<'alive' | 'dead' | ''>(filters.etat ?? '')

  function search(overrides?: { type?: ProduitType | ''; etat?: 'alive' | 'dead' | '' }) {
    router.get('/backend/products', {
      q,
      produit_type: overrides?.type !== undefined ? overrides.type : typeFilter,
      etat: overrides?.etat !== undefined ? overrides.etat : etatFilter,
    }, { preserveState: true })
  }

  const csvParams = new URLSearchParams(
    Object.fromEntries(
      Object.entries({ q, produit_type: typeFilter, etat: etatFilter }).filter(([, v]) => v !== '')
    )
  )
  const csvHref = `/backend/products.csv?${csvParams}`

  return (
    <div className="min-h-screen" style={{ background: 'var(--color-bg)' }}>
      <PageHeader
        title="Catalogue"
        subtitle={`${meta.total_count} produit${meta.total_count !== 1 ? 's' : ''}`}
        action={
          <div className="flex gap-2">
            <a
              href={csvHref}
              download
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-semibold no-underline border"
              style={{ background: 'var(--color-bg-card)', color: 'var(--color-text)', borderColor: 'var(--color-border)' }}
            >
              <Download size={14} /> CSV
            </a>
            <PrimaryButton href="/backend/products/new">
              <Plus size={14} /> Nouveau produit
            </PrimaryButton>
          </div>
        }
      />

      <FilterBar>
        <div className="relative" style={{ minWidth: 200 }}>
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--color-text-muted)' }} />
          <input
            type="text"
            value={q}
            onChange={e => setQ(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && search()}
            placeholder="Rechercher par nom…"
            className="w-full pl-8 pr-3 py-1.5 text-sm rounded-lg"
            style={{ border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)' }}
          />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {TYPE_FILTERS.map(f => {
            const cfg = f.value ? TYPE_CFG[f.value] : null
            const active = typeFilter === f.value
            return (
              <button
                key={f.value || '_all'}
                type="button"
                onClick={() => { setTypeFilter(f.value); search({ type: f.value }) }}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold border cursor-pointer"
                style={{
                  background: active ? (cfg?.bg ?? 'var(--color-bg-highlight)') : 'var(--color-bg)',
                  borderColor: active ? (cfg?.color ?? 'var(--color-primary)') : 'var(--color-border)',
                  color: active ? (cfg?.color ?? 'var(--color-primary)') : 'var(--color-text-muted)',
                }}
              >
                {f.label}
              </button>
            )
          })}
        </div>
        <select
          value={etatFilter}
          onChange={e => { const v = e.target.value as 'alive' | 'dead' | ''; setEtatFilter(v); search({ etat: v }) }}
          className="px-2.5 py-1.5 text-sm rounded-lg"
          style={{ border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)' }}
        >
          <option value="">Tous états</option>
          <option value="alive">Vivant / Actif</option>
          <option value="dead">Inactif</option>
        </select>
        <button
          type="button"
          onClick={() => search()}
          className="px-3.5 py-1.5 rounded-lg text-sm font-semibold cursor-pointer border-none"
          style={{ background: 'var(--color-primary)', color: '#fff' }}
        >
          Chercher
        </button>
      </FilterBar>

      <SectionCard noPadding>
        <DataTable
          columns={[
            { key: 'name',   label: 'Nom' },
            { key: 'type',   label: 'Type' },
            { key: 'number', label: 'N°' },
            { key: 'stock',  label: 'Stock' },
            { key: 'unit',   label: 'Unité' },
            { key: 'state',  label: 'État' },
          ]}
          data={produits}
          emptyMessage="Aucun produit trouvé"
          renderRow={(p, i) => {
            const cfg = TYPE_CFG[p.produit_type]
            const { Icon } = cfg
            const isLow = p.population === 0
            const isInactive = !!p.dead_at
            return (
              <tr
                key={p.id}
                className="border-b"
                style={{ background: i % 2 === 0 ? 'transparent' : 'rgba(240,247,236,0.35)', borderColor: 'var(--color-border)' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--color-bg-highlight)' }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = i % 2 === 0 ? 'transparent' : 'rgba(240,247,236,0.35)' }}
              >
                <td className="px-3.5 py-2.5 text-sm">
                  <div className="flex items-center gap-2.5">
                    <span className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: cfg.bg, color: cfg.color }}>
                      <Icon size={13} />
                    </span>
                    <a href={`/backend/products/${p.id}`} className="font-semibold no-underline" style={{ color: 'var(--color-primary)' }}>{p.name}</a>
                  </div>
                </td>
                <td className="px-3.5 py-2.5">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold" style={{ background: cfg.bg, color: cfg.color }}>{cfg.label}</span>
                </td>
                <td className="px-3.5 py-2.5 text-xs font-mono" style={{ color: 'var(--color-text-muted)' }}>{p.number}</td>
                <td className="px-3.5 py-2.5 text-sm font-semibold tabular-nums" style={{ color: isLow ? 'var(--color-danger)' : 'var(--color-text)' }}>{p.population}</td>
                <td className="px-3.5 py-2.5 text-sm" style={{ color: 'var(--color-text-muted)' }}>{p.unit_name}</td>
                <td className="px-3.5 py-2.5">
                  {isInactive
                    ? <StateBadge label="Inactif"   color="var(--color-text-muted)" bg="var(--color-bg-subtle)" />
                    : isLow
                      ? <StateBadge label="Épuisé"   color="var(--color-danger)"     bg="var(--color-danger-bg)" />
                      : <StateBadge label="En stock"  color="var(--color-primary)"    bg="var(--color-success-bg)" />
                  }
                </td>
              </tr>
            )
          }}
        />
        {meta.total_pages > 1 && (
          <Pagination
            page={meta.current_page}
            totalPages={meta.total_pages}
            total={meta.total_count}
            onPrev={() => router.get('/backend/products', { q, produit_type: typeFilter, etat: etatFilter, page: meta.current_page - 1 })}
            onNext={() => router.get('/backend/products', { q, produit_type: typeFilter, etat: etatFilter, page: meta.current_page + 1 })}
          />
        )}
      </SectionCard>
    </div>
  )
}

CatalogueIndex.layout = (page: ReactNode) => <AppShell>{page}</AppShell>
export default CatalogueIndex
