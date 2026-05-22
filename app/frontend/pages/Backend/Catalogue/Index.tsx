import type { ReactNode } from 'react'
import { useState } from 'react'
import { router } from '@inertiajs/react'
import { AppShell } from '../../../components/AppShell'
import type { CatalogueIndexProps, ProduitType } from '../../../types/catalogue'

const TYPE_CONFIG: Record<ProduitType, { label: string; bg: string; color: string }> = {
  Matter:    { label: 'Matière',    bg: '#dcfce7', color: '#166534' },
  Animal:    { label: 'Animal',     bg: '#fef9c3', color: '#854d0e' },
  Equipment: { label: 'Équipement', bg: '#dbeafe', color: '#1e40af' },
  Plant:     { label: 'Plante',     bg: '#ede9fe', color: '#5b21b6' },
  Other:     { label: 'Autre',      bg: '#f3f4f6', color: '#374151' },
}

const TYPE_FILTERS: { value: ProduitType | ''; label: string }[] = [
  { value: '',          label: 'Tous' },
  { value: 'Matter',    label: 'Matière' },
  { value: 'Animal',    label: 'Animal' },
  { value: 'Equipment', label: 'Équipement' },
  { value: 'Plant',     label: 'Plante' },
  { value: 'Other',     label: 'Autre' },
]

export default function CatalogueIndex({ produits, filters, meta }: CatalogueIndexProps) {
  const [q, setQ] = useState(filters.q ?? '')
  const [typeFilter, setTypeFilter] = useState<ProduitType | ''>(filters.produit_type ?? '')
  const [etatFilter, setEtatFilter] = useState<'alive' | 'dead' | ''>(filters.etat ?? '')

  function search() {
    router.get('/backend/products', { q, produit_type: typeFilter, etat: etatFilter }, { preserveState: true })
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6" style={{ color: 'var(--color-text)' }}>
        Catalogue
      </h1>

      {/* Filter bar */}
      <div className="flex gap-3 mb-5 flex-wrap items-center">
        <input
          type="text"
          value={q}
          onChange={e => setQ(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && search()}
          placeholder="Rechercher par nom…"
          className="flex-1 min-w-52 px-3 py-2 rounded-md border text-sm outline-none"
          style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg-card)', color: 'var(--color-text)' }}
        />
        <div className="flex gap-2 flex-wrap">
          {TYPE_FILTERS.map(f => (
            <button
              key={f.value}
              type="button"
              onClick={() => setTypeFilter(f.value)}
              className="px-3 py-1.5 text-xs rounded-full border font-medium"
              style={{
                borderColor: typeFilter === f.value ? 'var(--color-primary)' : 'var(--color-border)',
                background: typeFilter === f.value ? 'var(--color-primary)' : 'var(--color-bg-card)',
                color: typeFilter === f.value ? '#fff' : 'var(--color-text)',
              }}
            >
              {f.label}
            </button>
          ))}
        </div>
        <select
          aria-label="État du produit"
          value={etatFilter}
          onChange={e => setEtatFilter(e.target.value as 'alive' | 'dead' | '')}
          className="px-3 py-2 rounded-md border text-sm"
          style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg-card)', color: 'var(--color-text)' }}
        >
          <option value="">Tous états</option>
          <option value="alive">Vivant / Actif</option>
          <option value="dead">Inactif</option>
        </select>
        <button
          type="button"
          onClick={search}
          className="px-4 py-2 text-sm rounded-md border"
          style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg-card)', color: 'var(--color-text)' }}
        >
          Rechercher
        </button>
      </div>

      {/* Table */}
      <div className="rounded-lg overflow-hidden border" style={{ background: 'var(--color-bg-card)', borderColor: 'var(--color-border)' }}>
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b" style={{ background: 'var(--color-bg)', borderColor: 'var(--color-border)' }}>
              {['Nom', 'Type', 'N°', 'Stock', 'Unité', 'État'].map(h => (
                <th
                  key={h}
                  className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide"
                  style={{ color: 'var(--color-text-muted)' }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {produits.map(p => {
              const typeCfg = TYPE_CONFIG[p.produit_type]
              return (
                <tr key={p.id} className="border-b" style={{ borderColor: 'var(--color-border)' }}>
                  <td className="px-4 py-3 font-medium">
                    <a
                      href={`/backend/products/${p.id}`}
                      className="no-underline"
                      style={{ color: 'var(--color-primary)' }}
                    >
                      {p.name}
                    </a>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className="px-2.5 py-0.5 rounded-full text-xs font-medium"
                      style={{ background: typeCfg.bg, color: typeCfg.color }}
                    >
                      {typeCfg.label}
                    </span>
                  </td>
                  <td className="px-4 py-3" style={{ color: 'var(--color-text-muted)' }}>{p.number}</td>
                  <td className="px-4 py-3 tabular-nums">{p.population}</td>
                  <td className="px-4 py-3" style={{ color: 'var(--color-text-muted)' }}>{p.unit_name}</td>
                  <td className="px-4 py-3">
                    {p.dead_at ? (
                      <span
                        className="px-2.5 py-0.5 rounded-full text-xs font-medium"
                        style={{ background: '#f3f4f6', color: '#374151' }}
                      >
                        Inactif
                      </span>
                    ) : p.population === 0 ? (
                      <span
                        className="px-2.5 py-0.5 rounded-full text-xs font-medium"
                        style={{ background: '#fff7ed', color: '#c2410c' }}
                      >
                        Épuisé
                      </span>
                    ) : null}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex justify-between items-center mt-4">
        <span className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
          {meta.total_count} produit(s)
        </span>
        <div className="flex gap-2">
          {meta.current_page > 1 && (
            <button
              type="button"
              onClick={() => router.get('/backend/products', { q, produit_type: typeFilter, etat: etatFilter, page: meta.current_page - 1 })}
              className="px-3 py-1.5 text-xs rounded border"
              style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg-card)', color: 'var(--color-text)' }}
            >
              Précédent
            </button>
          )}
          {meta.current_page < meta.total_pages && (
            <button
              type="button"
              onClick={() => router.get('/backend/products', { q, produit_type: typeFilter, etat: etatFilter, page: meta.current_page + 1 })}
              className="px-3 py-1.5 text-xs rounded border"
              style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg-card)', color: 'var(--color-text)' }}
            >
              Suivant
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

CatalogueIndex.layout = (page: ReactNode) => <AppShell>{page}</AppShell>
