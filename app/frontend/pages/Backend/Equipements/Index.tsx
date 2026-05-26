import type { ReactNode } from 'react'
import { router } from '@inertiajs/react'
import { Plus, Tractor } from 'lucide-react'
import { AppShell } from '../../../components/AppShell'
import { PageHeader, KpiCard, SectionCard, DataTable, StateBadge, Pagination, PrimaryButton } from '../../../components/ui'
import type { EquipementsIndexProps } from '../../../types/equipement'

function EquipementsIndex({ equipements, meta }: EquipementsIndexProps) {
  const totalPages = Math.ceil(meta.total / meta.per_page)
  const active = equipements.filter(e => e.born_at !== null).length

  return (
    <div className="min-h-screen" style={{ background: 'var(--color-bg)' }}>
      <PageHeader
        title="Équipements"
        subtitle={`${meta.total} équipement${meta.total !== 1 ? 's' : ''}`}
        action={
          <PrimaryButton href="/backend/equipments/new">
            <Plus size={14} /> Nouvel équipement
          </PrimaryButton>
        }
      />

      <div className="grid grid-cols-3 gap-3.5 mb-5">
        <KpiCard icon={<Tractor size={16} />} label="Total"      value={meta.total} color="var(--color-info)" />
        <KpiCard icon={<Tractor size={16} />} label="En service" value={active}      color="var(--color-primary)" />
        <KpiCard icon={<Tractor size={16} />} label="Page"       value={`${meta.page}/${totalPages}`} color="var(--color-text-muted)" />
      </div>

      <SectionCard noPadding>
        <DataTable
          columns={[
            { key: 'name', label: 'Nom' },
            { key: 'work_number', label: 'N° travail' },
            { key: 'variant_name', label: 'Modèle / Variété' },
            { key: 'state', label: 'État' },
          ]}
          data={equipements}
          emptyMessage="Aucun équipement enregistré"
          renderRow={(e, i) => {
            const isActive = e.born_at !== null
            return (
              <tr
                key={e.id}
                className="border-b"
                style={{
                  background: i % 2 === 0 ? 'transparent' : 'rgba(240,247,236,0.35)',
                  borderColor: 'var(--color-border)',
                }}
                onMouseEnter={ev => { (ev.currentTarget as HTMLElement).style.background = 'var(--color-bg-highlight)' }}
                onMouseLeave={ev => { (ev.currentTarget as HTMLElement).style.background = i % 2 === 0 ? 'transparent' : 'rgba(240,247,236,0.35)' }}
              >
                <td className="px-3.5 py-2.5 text-sm">
                  <div className="flex items-center gap-2.5">
                    <span
                      className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                      style={{ background: 'var(--color-info-bg)', color: 'var(--color-info)' }}
                    >
                      <Tractor size={13} />
                    </span>
                    <a href={`/backend/equipments/${e.id}`} className="font-semibold no-underline" style={{ color: 'var(--color-primary)' }}>
                      {e.name}
                    </a>
                  </div>
                </td>
                <td className="px-3.5 py-2.5 text-xs font-mono" style={{ color: 'var(--color-text-muted)' }}>{e.work_number || '—'}</td>
                <td className="px-3.5 py-2.5 text-sm" style={{ color: 'var(--color-text-muted)' }}>{e.variant_name || '—'}</td>
                <td className="px-3.5 py-2.5">
                  <StateBadge
                    label={isActive ? 'En service' : 'Inactif'}
                    color={isActive ? 'var(--color-primary)' : 'var(--color-text-muted)'}
                    bg={isActive ? 'var(--color-success-bg)' : 'var(--color-bg-subtle)'}
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
            onPrev={() => router.visit(`/backend/equipments?page=${meta.page - 1}`)}
            onNext={() => router.visit(`/backend/equipments?page=${meta.page + 1}`)}
          />
        )}
      </SectionCard>
    </div>
  )
}

EquipementsIndex.layout = (page: ReactNode) => <AppShell>{page}</AppShell>
export default EquipementsIndex
