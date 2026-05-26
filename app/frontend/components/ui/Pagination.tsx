import { ChevronLeft, ChevronRight } from 'lucide-react'

interface PaginationProps {
  page: number
  totalPages: number
  total: number
  onPrev: () => void
  onNext: () => void
}

export function Pagination({ page, totalPages, total, onPrev, onNext }: PaginationProps) {
  const hasPrev = page > 1
  const hasNext = page < totalPages

  return (
    <div
      className="flex items-center justify-between px-4 py-3 border-t"
      style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg)' }}
    >
      <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
        Page {page} sur {totalPages} — {total} résultats
      </span>
      <div className="flex gap-1.5">
        {(['prev', 'next'] as const).map((dir) => {
          const isActive = dir === 'prev' ? hasPrev : hasNext
          return (
            <button
              key={dir}
              onClick={dir === 'prev' ? onPrev : onNext}
              disabled={!isActive}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs border"
              style={{
                background: 'var(--color-bg-card)',
                borderColor: 'var(--color-border)',
                color: isActive ? 'var(--color-text)' : 'var(--color-text-muted)',
                cursor: isActive ? 'pointer' : 'not-allowed',
              }}
            >
              {dir === 'prev' ? (
                <>
                  <ChevronLeft size={13} /> Précédent
                </>
              ) : (
                <>
                  Suivant <ChevronRight size={13} />
                </>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
