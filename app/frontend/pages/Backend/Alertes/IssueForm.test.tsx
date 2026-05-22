import React from 'react'
import { render, screen } from '@testing-library/react'
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

describe('IssueForm — création', () => {
  it('affiche "Nouveau problème" en mode création', () => {
    render(<IssueForm issue={null} errors={{}} />)
    expect(screen.getByRole('heading', { name: /Nouveau problème/ })).toBeInTheDocument()
  })

  it('affiche le champ Nom', () => {
    render(<IssueForm issue={null} errors={{}} />)
    expect(screen.getByLabelText(/Nom/)).toBeInTheDocument()
  })

  it('le select nature contient Accident', () => {
    render(<IssueForm issue={null} errors={{}} />)
    expect(screen.getByRole('option', { name: 'Accident' })).toBeInTheDocument()
  })

  it('affiche une erreur si name manquant (erreur serveur)', () => {
    render(<IssueForm issue={null} errors={{ name: 'est obligatoire' }} />)
    expect(screen.getByText('est obligatoire')).toBeInTheDocument()
  })
})

describe('IssueForm — édition', () => {
  it('affiche "Modifier" en mode édition', () => {
    render(<IssueForm issue={mockIssue} errors={{}} />)
    expect(screen.getByRole('heading', { name: /Modifier/ })).toBeInTheDocument()
  })

  it('pré-remplit le champ name', () => {
    render(<IssueForm issue={mockIssue} errors={{}} />)
    expect(screen.getByDisplayValue('Attaque criquet')).toBeInTheDocument()
  })
})
