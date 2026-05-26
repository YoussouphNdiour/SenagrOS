import type { ReactNode } from 'react'
import { router } from '@inertiajs/react'
import { Plus, Search, Building2, User, ChevronRight } from 'lucide-react'
import { AppShell } from '../../../components/AppShell'
import { PageHeader, SectionCard, StateBadge, Pagination, PrimaryButton, FilterBar } from '../../../components/ui'
import type { EntitesIndexProps } from '../../../types/entite'

function EntitesIndex({ entites, meta }: EntitesIndexProps) {
  const totalPages = Math.ceil(meta.total / meta.per_page)

  function handleSearch(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const q = (e.currentTarget.elements.namedItem('q') as HTMLInputElement).value
    router.get('/backend/entities', { q }, { preserveState: true })
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--color-bg)' }}>
      <PageHeader
        title="Entités"
        subtitle={`${meta.total} entité${meta.total !== 1 ? 's' : ''}`}
        action={
          <PrimaryButton href="/backend/entities/new">
            <Plus size={14} /> Nouvelle entité
          </PrimaryButton>
        }
      />

      <FilterBar>
        <form onSubmit={handleSearch} className="flex gap-2.5 flex-1 min-w-0">
          <div className="relative flex-1 min-w-0">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--color-text-muted)' }} />
            <input
              name="q"
              type="text"
              defaultValue=""
              placeholder="Rechercher par nom…"
              className="w-full pl-8 pr-3 py-1.5 text-sm rounded-lg"
              style={{ border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)' }}
            />
          </div>
          <PrimaryButton type="submit" size="sm">Chercher</PrimaryButton>
        </form>
      </FilterBar>

      <SectionCard noPadding>
        <ul className="list-none m-0 p-0">
          {entites.length === 0 && (
            <li className="p-8 text-center text-sm" style={{ color: 'var(--color-text-muted)' }}>
              Aucune entité trouvée
            </li>
          )}
          {entites.map((entite, idx) => {
            const isOrg = entite.nature === 'organization'
            const isActive = entite.active
            return (
              <li
                key={entite.id}
                className="flex items-center gap-3 px-4 py-3 border-b"
                style={{ borderColor: idx < entites.length - 1 ? 'var(--color-border)' : 'transparent' }}
              >
                <span
                  className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                  style={{
                    background: isOrg ? 'var(--color-info-bg)' : 'var(--color-warning-bg)',
                    color: isOrg ? 'var(--color-info)' : 'var(--color-warning)',
                  }}
                >
                  {isOrg ? <Building2 size={15} /> : <User size={15} />}
                </span>
                <div className="flex-1 min-w-0">
                  <a href={`/backend/entities/${entite.id}`} className="text-sm font-semibold no-underline" style={{ color: 'var(--color-primary)' }}>
                    {entite.full_name}
                  </a>
                  {entite.number && (
                    <div className="text-xs mt-0.5 font-mono" style={{ color: 'var(--color-text-muted)' }}>
                      {entite.number}
                    </div>
                  )}
                </div>
                <div className="flex gap-1.5 shrink-0">
                  {entite.client && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold" style={{ background: 'var(--color-success-bg)', color: 'var(--color-success-text)' }}>Client</span>
                  )}
                  {entite.supplier && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold" style={{ background: 'var(--color-warning-bg)', color: 'var(--color-warning-text)' }}>Fournisseur</span>
                  )}
                </div>
                <StateBadge
                  label={isActive ? 'Actif' : 'Inactif'}
                  color={isActive ? 'var(--color-primary)' : 'var(--color-text-muted)'}
                  bg={isActive ? 'var(--color-success-bg)' : 'var(--color-bg-subtle)'}
                />
                <a href={`/backend/entities/${entite.id}`} className="shrink-0" style={{ color: 'var(--color-text-muted)' }}>
                  <ChevronRight size={14} />
                </a>
              </li>
            )
          })}
        </ul>
        {totalPages > 1 && (
          <Pagination
            page={meta.page}
            totalPages={totalPages}
            total={meta.total}
            onPrev={() => router.visit(`/backend/entities?page=${meta.page - 1}`)}
            onNext={() => router.visit(`/backend/entities?page=${meta.page + 1}`)}
          />
        )}
      </SectionCard>
    </div>
  )
}

EntitesIndex.layout = (page: ReactNode) => <AppShell>{page}</AppShell>
export default EntitesIndex
