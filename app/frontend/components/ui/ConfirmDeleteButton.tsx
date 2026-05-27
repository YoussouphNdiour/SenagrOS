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
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          padding: size === 'sm' ? '4px 10px' : '7px 14px',
          borderRadius: '8px',
          fontSize: size === 'sm' ? '12px' : '14px',
          background: 'var(--color-danger-bg)',
          color: 'var(--color-danger-text)',
          border: '1px solid var(--color-danger-text)',
          opacity: 0.45,
          cursor: 'not-allowed',
        }}
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
