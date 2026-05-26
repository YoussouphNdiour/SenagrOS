import { Trash2 } from 'lucide-react'
import { PrimaryButton } from './PrimaryButton'

interface ConfirmDeleteButtonProps {
  onDelete: () => void
  message?: string
  label?: string
  size?: 'sm' | 'md'
}

export function ConfirmDeleteButton({
  onDelete,
  message = 'Supprimer cet élément ?',
  label = 'Supprimer',
  size = 'md',
}: ConfirmDeleteButtonProps) {
  function handleClick() {
    if (window.confirm(message)) onDelete()
  }

  return (
    <PrimaryButton variant="danger" size={size} onClick={handleClick}>
      <Trash2 size={size === 'sm' ? 13 : 15} />
      {label}
    </PrimaryButton>
  )
}
