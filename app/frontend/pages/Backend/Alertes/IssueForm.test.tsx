import React from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import IssueForm from './IssueForm'
import type { IssueFormItem } from '../../../types/issue'

vi.mock('@inertiajs/react', () => ({
  router: { post: vi.fn(), patch: vi.fn() },
}))

const mockIssue: IssueFormItem = {
  id: 1,
  name: 'Attaque criquet',
  nature: 'aphid',
  gravity: 3,
  observed_at: '2026-05-10',
  description: 'Description test',
  state: 'opened',
}

function renderCreate() {
  return render(<IssueForm issue={null} errors={{}} />)
}

function renderEdit() {
  return render(<IssueForm issue={mockIssue} errors={{}} />)
}

describe('IssueForm — création', () => {
  it('affiche "Nouveau problème" en mode création', () => {
    renderCreate()
    expect(screen.getByRole('heading', { name: /Nouveau problème/ })).toBeInTheDocument()
  })

  it('affiche le champ Nom', () => {
    renderCreate()
    expect(screen.getByLabelText(/Nom/)).toBeInTheDocument()
  })

  it('le select nature contient Accident', () => {
    renderCreate()
    expect(screen.getByRole('option', { name: 'Accident' })).toBeInTheDocument()
  })

  it('affiche une erreur si name manquant (erreur serveur)', () => {
    render(<IssueForm issue={null} errors={{ name: 'est obligatoire' }} />)
    expect(screen.getByText('est obligatoire')).toBeInTheDocument()
  })

  it('appelle router.post au submit en mode création', async () => {
    const { router } = await import('@inertiajs/react')
    renderCreate()
    await userEvent.type(screen.getByLabelText(/Nom/), 'Test problème')
    await userEvent.click(screen.getByRole('button', { name: /Enregistrer/ }))
    expect(router.post).toHaveBeenCalledWith(
      '/backend/issues',
      expect.objectContaining({ issue: expect.objectContaining({ name: 'Test problème' }) }),
      expect.any(Object)
    )
  })
})

describe('IssueForm — édition', () => {
  it('affiche "Modifier" en mode édition', () => {
    renderEdit()
    expect(screen.getByRole('heading', { name: /Modifier/ })).toBeInTheDocument()
  })

  it('pré-remplit le champ name', () => {
    renderEdit()
    expect(screen.getByDisplayValue('Attaque criquet')).toBeInTheDocument()
  })

  it('appelle router.patch au submit en mode édition', async () => {
    const { router } = await import('@inertiajs/react')
    renderEdit()
    await userEvent.click(screen.getByRole('button', { name: /Enregistrer/ }))
    expect(router.patch).toHaveBeenCalledWith(
      '/backend/issues/1',
      expect.any(Object),
      expect.any(Object)
    )
  })
})
