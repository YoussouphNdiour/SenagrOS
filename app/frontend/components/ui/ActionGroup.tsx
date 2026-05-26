import type { LucideIcon } from 'lucide-react'
import { PrimaryButton } from './PrimaryButton'

interface Action {
  label: string
  icon: LucideIcon
  onClick: () => void
  variant?: 'primary' | 'secondary' | 'danger'
  disabled?: boolean
}

interface ActionGroupProps {
  actions: Action[]
}

export function ActionGroup({ actions }: ActionGroupProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {actions.map(({ label, icon: Icon, onClick, variant = 'secondary', disabled }) => (
        <PrimaryButton key={label} variant={variant} onClick={onClick} disabled={disabled}>
          <Icon size={15} />
          {label}
        </PrimaryButton>
      ))}
    </div>
  )
}
