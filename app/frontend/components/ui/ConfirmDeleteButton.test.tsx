import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ConfirmDeleteButton } from './ConfirmDeleteButton'

describe('ConfirmDeleteButton', () => {
  it('calls onDelete after confirmation', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    const onDelete = vi.fn()
    render(<ConfirmDeleteButton onDelete={onDelete} canDestroy={true} resourceName="cette parcelle" />)
    await userEvent.click(screen.getByRole('button'))
    expect(onDelete).toHaveBeenCalled()
  })

  it('does not call onDelete if confirm is cancelled', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(false)
    const onDelete = vi.fn()
    render(<ConfirmDeleteButton onDelete={onDelete} canDestroy={true} resourceName="cette parcelle" />)
    await userEvent.click(screen.getByRole('button'))
    expect(onDelete).not.toHaveBeenCalled()
  })

  it('renders disabled when canDestroy is false', () => {
    render(<ConfirmDeleteButton onDelete={vi.fn()} canDestroy={false} resourceName="cette parcelle" />)
    expect(screen.getByRole('button')).toBeDisabled()
  })

  it('shows tooltip title when disabled', () => {
    render(<ConfirmDeleteButton onDelete={vi.fn()} canDestroy={false} resourceName="cette parcelle" />)
    expect(screen.getByRole('button')).toHaveAttribute('title', 'Des enregistrements liés empêchent la suppression')
  })
})
