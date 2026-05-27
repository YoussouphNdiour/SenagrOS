import { Trash2 } from 'lucide-react'
import { PrimaryButton } from './PrimaryButton'

interface ConfirmDeleteButtonProps {
  onDelete: () => void
  canDestroy: boolean
  resourceName: string
  message?: string
  label?: string
  size?: 'sm' | 'md'
}

export function ConfirmDeleteButton({
  onDelete,
  canDestroy,
  resourceName,
  message,
  label = 'Supprimer',
  size = 'md',
}: ConfirmDeleteButtonProps) {
  const confirmMessage = message ?? `Supprimer ${resourceName} ?`

  if (!canDestroy) {
    return (
      <button
        type="button"
        disabled
        title="Des enregistrements liés empêchent la suppression"
        className={`inline-flex items-center gap-1.5 rounded-lg border opacity-45 cursor-not-allowed ${size === 'sm' ? 'px-2.5 py-1 text-xs' : 'px-3.5 py-1.5 text-sm'}`}
        style={{ background: 'var(--color-danger-bg)', color: 'var(--color-danger-text)', borderColor: 'var(--color-danger-text)' }}
      >
        <Trash2 size={size === 'sm' ? 13 : 15} />
        {label}
      </button>
    )
  }

  function handleClick() {
    if (window.confirm(confirmMessage)) onDelete()
  }

  return (
    <PrimaryButton variant="danger" size={size} onClick={handleClick}>
      <Trash2 size={size === 'sm' ? 13 : 15} />
      {label}
    </PrimaryButton>
  )
}
