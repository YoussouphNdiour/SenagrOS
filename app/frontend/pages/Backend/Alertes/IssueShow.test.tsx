import React from 'react'
import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import IssueShow from './IssueShow'
import type { IssueShowProps } from '../../../types/issue'

vi.mock('@inertiajs/react', () => ({
  router: { post: vi.fn() },
}))

const mockIssue: IssueShowProps['issue'] = {
  id: 1,
  name: 'Attaque criquet',
  nature: 'aphid',
  gravity: 4,
  observed_at: '2026-05-10',
  state: 'opened',
  description: 'Forte présence dans la parcelle nord.',
  target_type: null,
  target_id: null,
}

function renderShow(overrides: Partial<IssueShowProps['issue']> = {}) {
  return render(<IssueShow issue={{ ...mockIssue, ...overrides }} />)
}

describe('IssueShow', () => {
  it('affiche le nom de l\'issue', () => {
    renderShow()
    expect(screen.getByRole('heading', { name: 'Attaque criquet' })).toBeInTheDocument()
  })

  it('affiche le badge état Ouvert', () => {
    renderShow()
    expect(screen.getByText('Ouvert')).toBeInTheDocument()
  })

  it('affiche la description', () => {
    renderShow()
    expect(screen.getByText('Forte présence dans la parcelle nord.')).toBeInTheDocument()
  })

  it('affiche les boutons Fermer et Abandonner quand état = opened', () => {
    renderShow({ state: 'opened' })
    expect(screen.getByRole('button', { name: /Fermer/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Abandonner/ })).toBeInTheDocument()
  })

  it('n\'affiche pas Fermer si état = closed', () => {
    renderShow({ state: 'closed' })
    expect(screen.queryByRole('button', { name: /Fermer/ })).not.toBeInTheDocument()
  })

  it('affiche le lien Retour aux alertes', () => {
    renderShow()
    const link = screen.getByRole('link', { name: /Retour aux alertes/ })
    expect(link).toHaveAttribute('href', '/backend/alerts')
  })

  it('affiche le lien Modifier', () => {
    renderShow()
    const link = screen.getByRole('link', { name: /Modifier/ })
    expect(link).toHaveAttribute('href', '/backend/issues/1/edit')
  })
})
