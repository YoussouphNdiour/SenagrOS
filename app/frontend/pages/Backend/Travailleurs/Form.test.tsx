import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import Form from './Form'
import type { TravailleurFormProps } from '../../../types/travailleur'

vi.mock('@inertiajs/react', () => ({
  router: { post: vi.fn(), patch: vi.fn() },
}))

import { router } from '@inertiajs/react'

const mockTravailleur = {
  id: 1,
  name: 'Mamadou Diallo',
  number: 'TR-001',
  work_number: 'W-001',
  identification_number: 'ID-001',
  born_at: '1985-03-20',
  dead_at: null,
  description: 'Tractoriste principal',
}

function renderForm(props: TravailleurFormProps) {
  return render(<Form {...props} />)
}

describe('Travailleurs Form', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('shows "Nouveau travailleur" heading on create', () => {
    renderForm({ travailleur: null, errors: {} })
    expect(screen.getByRole('heading', { name: /Nouveau travailleur/i })).toBeInTheDocument()
  })

  it('shows "Modifier le travailleur {name}" heading on edit', () => {
    renderForm({ travailleur: mockTravailleur, errors: {} })
    expect(screen.getByRole('heading', { name: /Modifier le travailleur Mamadou Diallo/i })).toBeInTheDocument()
  })

  it('renders name input as required', () => {
    renderForm({ travailleur: null, errors: {} })
    const input = screen.getByLabelText(/^Nom/i)
    expect(input).toBeInTheDocument()
    expect(input).toBeRequired()
  })

  it('renders born_at date input', () => {
    renderForm({ travailleur: null, errors: {} })
    expect(screen.getByLabelText(/Date de naissance/i)).toBeInTheDocument()
  })

  it('calls router.post on new form submit', async () => {
    renderForm({ travailleur: null, errors: {} })
    fireEvent.change(screen.getByLabelText(/^Nom/i), { target: { value: 'Ibrahim Sow' } })
    fireEvent.submit(screen.getByRole('form'))
    expect(router.post).toHaveBeenCalledWith(
      '/backend/workers',
      expect.objectContaining({ 'worker[name]': 'Ibrahim Sow' }),
      expect.any(Object)
    )
  })

  it('calls router.patch on edit form submit', async () => {
    renderForm({ travailleur: mockTravailleur, errors: {} })
    fireEvent.submit(screen.getByRole('form'))
    expect(router.patch).toHaveBeenCalledWith(
      '/backend/workers/1',
      expect.objectContaining({ 'worker[name]': 'Mamadou Diallo' }),
      expect.any(Object)
    )
  })
})
