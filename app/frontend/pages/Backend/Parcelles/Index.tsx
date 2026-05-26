import type { ReactNode } from 'react'
import { useState } from 'react'
import { Plus, MapPin } from 'lucide-react'
import { AppShell } from '../../../components/AppShell'
import { ParcellesMap } from '../../../components/parcelles/ParcellesMap'
import { ParcellesTable } from '../../../components/parcelles/ParcellesTable'
import { PageHeader, SectionCard, PrimaryButton } from '../../../components/ui'
import type { ParcellesIndexProps } from '../../../types/parcelle'

function ParcellesIndex({ parcelles, meta }: ParcellesIndexProps) {
  const [highlightId, setHighlightId] = useState<number | null>(null)

  return (
    <div className="min-h-screen" style={{ background: 'var(--color-bg)' }}>
      <PageHeader
        title="Parcelles"
        subtitle={`${meta.total} parcelle${meta.total !== 1 ? 's' : ''} enregistrée${meta.total !== 1 ? 's' : ''}`}
        action={
          <PrimaryButton href="/backend/cultivable-zones/new">
            <Plus size={14} /> Nouvelle parcelle
          </PrimaryButton>
        }
      />

      <SectionCard noPadding className="mb-4">
        <ParcellesMap parcelles={parcelles} highlightId={highlightId} />
      </SectionCard>

      <SectionCard noPadding>
        <div className="flex items-center justify-between px-4 py-3.5 border-b" style={{ borderColor: 'var(--color-border)' }}>
          <span className="text-[11px] font-bold uppercase tracking-widest" style={{ color: 'var(--color-text-muted)' }}>
            <MapPin size={11} className="inline mr-1" style={{ verticalAlign: 'middle' }} />
            Liste des parcelles
          </span>
          {highlightId && (
            <button
              onClick={() => setHighlightId(null)}
              className="text-[11px] font-semibold bg-transparent border-none cursor-pointer"
              style={{ color: 'var(--color-primary)' }}
            >
              Effacer la sélection
            </button>
          )}
        </div>
        <ParcellesTable parcelles={parcelles} highlightId={highlightId} onRowClick={setHighlightId} />
      </SectionCard>
    </div>
  )
}

ParcellesIndex.layout = (page: ReactNode) => <AppShell>{page}</AppShell>
export default ParcellesIndex
