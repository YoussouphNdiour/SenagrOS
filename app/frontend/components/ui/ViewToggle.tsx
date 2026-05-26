import type { LucideIcon } from 'lucide-react'

interface ViewToggleProps {
  views: Array<{ key: string; label: string; icon: LucideIcon }>
  active: string
  onChange: (key: string) => void
}

export function ViewToggle({ views, active, onChange }: ViewToggleProps) {
  return (
    <div className="flex gap-1.5">
      {views.map(({ key, label, icon: Icon }) => {
        const isActive = active === key
        return (
          <button
            key={key}
            type="button"
            onClick={() => onChange(key)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border cursor-pointer"
            style={{
              background: isActive ? 'var(--color-bg-highlight)' : 'var(--color-bg-card)',
              borderColor: isActive ? 'var(--color-primary)' : 'var(--color-border)',
              color: isActive ? 'var(--color-primary)' : 'var(--color-text-muted)',
            }}
          >
            <Icon size={14} />
            {label}
          </button>
        )
      })}
    </div>
  )
}
