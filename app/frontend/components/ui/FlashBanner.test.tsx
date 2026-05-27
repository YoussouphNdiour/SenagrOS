import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { FlashBanner } from './FlashBanner'

describe('FlashBanner', () => {
  it('renders nothing when errors is empty', () => {
    const { container } = render(<FlashBanner errors={{}} />)
    expect(container.firstChild).toBeNull()
  })

  it('renders all error messages', () => {
    render(<FlashBanner errors={{ name: ['ne peut pas être vide'], email: ['est invalide'] }} />)
    expect(screen.getByText('ne peut pas être vide')).toBeInTheDocument()
    expect(screen.getByText('est invalide')).toBeInTheDocument()
  })

  it('has role=alert for accessibility', () => {
    render(<FlashBanner errors={{ name: ['erreur'] }} />)
    expect(screen.getByRole('alert')).toBeInTheDocument()
  })

  it('handles string error values (not just arrays)', () => {
    render(<FlashBanner errors={{ name: 'est requis' }} />)
    expect(screen.getByText('est requis')).toBeInTheDocument()
  })
})
