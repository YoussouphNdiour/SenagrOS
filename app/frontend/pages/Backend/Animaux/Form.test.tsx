import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import Form from './Form'
import type { AnimalFormProps } from '../../../types/animal'

vi.mock('@inertiajs/react', () => ({
  router: { post: vi.fn(), patch: vi.fn() },
}))

import { router } from '@inertiajs/react'

const mockAnimal = {
  id: 1,
  name: 'Bœuf Alpha',
  number: 'AN-001',
  work_number: 'W-001',
  identification_number: 'ID-001',
  variety: 'Ndama',
  born_at: '2020-01-15',
  dead_at: null,
  description: 'Un bœuf robuste',
  interventions: [],
}

function renderForm(props: AnimalFormProps) {
  return render(<Form {...props} />)
}

describe('Animaux Form', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('shows "Nouvel animal" heading on create', () => {
    renderForm({ animal: null, errors: {} })
    expect(screen.getByRole('heading', { name: /Nouvel animal/i })).toBeInTheDocument()
  })

  it('shows "Modifier l\'animal {name}" heading on edit', () => {
    renderForm({ animal: mockAnimal, errors: {} })
    expect(screen.getByRole('heading', { name: /Modifier l'animal Bœuf Alpha/i })).toBeInTheDocument()
  })

  it('renders name input as required', () => {
    renderForm({ animal: null, errors: {} })
    const input = screen.getByLabelText(/^Nom/i)
    expect(input).toBeInTheDocument()
    expect(input).toBeRequired()
  })

  it('renders born_at date input', () => {
    renderForm({ animal: null, errors: {} })
    expect(screen.getByLabelText(/Date de naissance/i)).toBeInTheDocument()
  })

  it('calls router.post on new form submit', async () => {
    renderForm({ animal: null, errors: {} })
    fireEvent.change(screen.getByLabelText(/^Nom/i), { target: { value: 'Vache Bêta' } })
    fireEvent.submit(screen.getByRole('form'))
    expect(router.post).toHaveBeenCalledWith(
      '/backend/animals',
      expect.objectContaining({ 'animal[name]': 'Vache Bêta' }),
      expect.any(Object)
    )
  })

  it('calls router.patch on edit form submit', async () => {
    renderForm({ animal: mockAnimal, errors: {} })
    fireEvent.submit(screen.getByRole('form'))
    expect(router.patch).toHaveBeenCalledWith(
      '/backend/animals/1',
      expect.objectContaining({ 'animal[name]': 'Bœuf Alpha' }),
      expect.any(Object)
    )
  })
})
