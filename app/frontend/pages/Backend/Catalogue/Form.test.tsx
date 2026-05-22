import React from 'react'
import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import userEvent from '@testing-library/user-event'
import CatalogueForm from './Form'
import type { CatalogueFormItem } from '../../../types/catalogue'

vi.mock('@inertiajs/react', () => ({
  router: { patch: vi.fn() },
}))

const mockProduit: CatalogueFormItem = {
  id: 1,
  name: 'Engrais NPK',
  produit_type: 'Matter',
  work_number: 'W-001',
  description: 'Description test',
  born_at: null,
  dead_at: null,
  identification_number: null,
}

function renderForm(overrides: Partial<CatalogueFormItem> = {}, errors = {}) {
  return render(
    <CatalogueForm
      produit={{ ...mockProduit, ...overrides }}
      errors={errors}
    />
  )
}

describe('CatalogueForm', () => {
  it('affiche le titre Modifier — Engrais NPK', () => {
    renderForm()
    expect(screen.getByRole('heading', { name: /Modifier — Engrais NPK/ })).toBeInTheDocument()
  })

  it('pré-remplit le champ name', () => {
    renderForm()
    expect(screen.getByDisplayValue('Engrais NPK')).toBeInTheDocument()
  })

  it('appelle router.patch au submit', async () => {
    const { router } = await import('@inertiajs/react')
    renderForm()
    await userEvent.click(screen.getByRole('button', { name: /Enregistrer/ }))
    expect(router.patch).toHaveBeenCalledWith(
      '/backend/products/1',
      expect.any(Object),
      expect.any(Object)
    )
  })

  it('affiche le champ identification_number pour un Animal', () => {
    renderForm({ produit_type: 'Animal' })
    expect(screen.getByLabelText(/Numéro d'identification/)).toBeInTheDocument()
  })

  it("n'affiche pas le champ identification_number pour une Matière", () => {
    renderForm({ produit_type: 'Matter' })
    expect(screen.queryByLabelText(/Numéro d'identification/)).not.toBeInTheDocument()
  })

  it('affiche une erreur si name est vide (erreur serveur)', () => {
    renderForm({}, { name: 'Le nom est obligatoire' })
    expect(screen.getByText('Le nom est obligatoire')).toBeInTheDocument()
  })
})
