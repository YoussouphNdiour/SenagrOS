import { render, screen } from '@testing-library/react'
import { vi } from 'vitest'
import { usePage } from '@inertiajs/react'
import { AppShell } from './AppShell'

describe('AppShell', () => {
  beforeEach(() => {
    vi.mocked(usePage).mockReturnValue({
      props: {
        appShell: {
          farm: { name: 'Ferme SenagrOS' },
          campaign: { name: 'Hivernage 2024', started_on: '2024-06-01', stopped_on: '2024-11-30' },
          user: { name: 'Yoûssouph Ndiourey', initials: 'YN' },
        },
        errors: {},
      },
      url: '/backend',
      component: 'Backend/Dashboard/Home',
      version: '1',
      encryptHistory: false,
      clearHistory: false,
      scrollRegions: [],
      rememberedState: {},
    } as ReturnType<typeof usePage>)
  })
  it('affiche le nom de la ferme dans la topbar', () => {
    render(<AppShell><div>contenu</div></AppShell>)
    expect(screen.getByText('SenagrOS')).toBeInTheDocument()
  })

  it('affiche le nom de la campagne', () => {
    render(<AppShell><div>contenu</div></AppShell>)
    expect(screen.getByText('Hivernage 2024')).toBeInTheDocument()
  })

  it('affiche les initiales utilisateur', () => {
    render(<AppShell><div>contenu</div></AppShell>)
    expect(screen.getByText('YN')).toBeInTheDocument()
  })

  it('marque le lien Dashboard comme actif quand url = /backend', () => {
    render(<AppShell><div>contenu</div></AppShell>)
    const dashboardLink = screen.getByRole('link', { name: /dashboard/i })
    expect(dashboardLink).toHaveStyle({ fontWeight: '600' })
  })

  it('affiche les liens des 5 modules', () => {
    render(<AppShell><div>contenu</div></AppShell>)
    expect(screen.getByRole('link', { name: /dashboard/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /interventions/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /parcelles/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /productions/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /comptabilit/i })).toBeInTheDocument()
  })

  it('rend le contenu enfant', () => {
    render(<AppShell><div data-testid="child">mon contenu</div></AppShell>)
    expect(screen.getByTestId('child')).toBeInTheDocument()
  })
})
