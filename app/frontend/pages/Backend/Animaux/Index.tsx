import type { ReactNode } from 'react'
import { router } from '@inertiajs/react'
import { Plus, PawPrint, Heart, AlertCircle } from 'lucide-react'
import { AppShell } from '../../../components/AppShell'
import { PageHeader, KpiCard, SectionCard, DataTable, StateBadge, Pagination, PrimaryButton } from '../../../components/ui'
import type { AnimauxIndexProps } from '../../../types/animal'

function formatDate(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
}

function AnimauxIndex({ animaux, meta }: AnimauxIndexProps) {
  const totalPages = Math.ceil(meta.total / meta.per_page)
  const alive = animaux.filter(a => !a.dead_at).length
  const dead  = animaux.filter(a => !!a.dead_at).length

  return (
    <div className="min-h-screen" style={{ background: 'var(--color-bg)' }}>
      <PageHeader
        title="Animaux"
        subtitle={`${meta.total} animal${meta.total !== 1 ? 'aux' : ''}`}
        action={
          <PrimaryButton href="/backend/animals/new">
            <Plus size={14} /> Nouvel animal
          </PrimaryButton>
        }
      />

      <div className="grid grid-cols-4 gap-3.5 mb-5">
        <KpiCard icon={<PawPrint size={16} />} label="Total"   value={meta.total} color="var(--color-warning)" />
        <KpiCard icon={<Heart size={16} />}    label="Vivants" value={alive}       color="var(--color-primary)" />
        <KpiCard icon={<AlertCircle size={16} />} label="Décédés" value={dead}    color="var(--color-danger)" />
        <KpiCard icon={<PawPrint size={16} />} label="Page"    value={`${totalPages > 0 ? meta.page : 1}/${totalPages}`} color="var(--color-text-muted)" />
      </div>

      <SectionCard noPadding>
        <DataTable
          columns={[
            { key: 'name', label: 'Nom' },
            { key: 'work_number', label: 'N° travail' },
            { key: 'variety', label: 'Race / Variété' },
            { key: 'born_at', label: 'Né(e) le' },
            { key: 'state', label: 'État' },
          ]}
          data={animaux}
          emptyMessage="Aucun animal enregistré"
          renderRow={(a, i) => {
            const isAlive = !a.dead_at
            return (
              <tr
                key={a.id}
                className="border-b"
                style={{
                  background: i % 2 === 0 ? 'transparent' : 'rgba(240,247,236,0.35)',
                  borderColor: 'var(--color-border)',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--color-bg-highlight)' }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = i % 2 === 0 ? 'transparent' : 'rgba(240,247,236,0.35)' }}
              >
                <td className="px-3.5 py-2.5 text-sm">
                  <div className="flex items-center gap-2.5">
                    <span
                      className="w-[30px] h-[30px] rounded-lg flex items-center justify-center shrink-0"
                      style={{
                        background: isAlive ? 'var(--color-warning-bg)' : 'var(--color-danger-bg)',
                        color: isAlive ? 'var(--color-warning)' : 'var(--color-danger)',
                      }}
                    >
                      <PawPrint size={14} />
                    </span>
                    <a href={`/backend/animals/${a.id}`} className="font-semibold no-underline" style={{ color: 'var(--color-primary)' }}>
                      {a.name}
                    </a>
                  </div>
                </td>
                <td className="px-3.5 py-2.5 text-xs font-mono" style={{ color: 'var(--color-text-muted)' }}>{a.work_number || '—'}</td>
                <td className="px-3.5 py-2.5 text-sm" style={{ color: 'var(--color-text-muted)' }}>{a.variety || '—'}</td>
                <td className="px-3.5 py-2.5 text-sm whitespace-nowrap" style={{ color: 'var(--color-text-muted)' }}>{formatDate(a.born_at)}</td>
                <td className="px-3.5 py-2.5">
                  <StateBadge
                    label={isAlive ? 'Vivant' : 'Décédé'}
                    color={isAlive ? 'var(--color-primary)' : 'var(--color-danger)'}
                    bg={isAlive ? 'var(--color-success-bg)' : 'var(--color-danger-bg)'}
                  />
                </td>
              </tr>
            )
          }}
        />
        {totalPages > 1 && (
          <Pagination
            page={meta.page}
            totalPages={totalPages}
            total={meta.total}
            onPrev={() => router.visit(`/backend/animals?page=${meta.page - 1}`)}
            onNext={() => router.visit(`/backend/animals?page=${meta.page + 1}`)}
          />
        )}
      </SectionCard>
    </div>
  )
}

AnimauxIndex.layout = (page: ReactNode) => <AppShell>{page}</AppShell>
export default AnimauxIndex
