import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { usePage } from '@inertiajs/react'
import { AppShell } from './AppShell'

const baseProps = {
  appShell: {
    farm: { name: 'Ferme Test' },
    campaign: null,
    user: { name: 'Alice', initials: 'A' },
  },
  flash: { notice: null, alert: null },
  errors: {},
}

describe('AppShell', () => {
  beforeEach(() => {
    vi.mocked(usePage).mockReturnValue({
      props: {
        appShell: {
          farm: { name: 'Ferme SenagrOS' },
          campaign: { name: 'Hivernage 2024', started_on: '2024-06-01', stopped_on: '2024-11-30' },
          user: { name: 'Yoûssouph Ndiourey', initials: 'YN' },
        },
        flash: { notice: null, alert: null },
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

const basePageMock = {
  url: '/backend',
  component: 'Backend/Dashboard/Home',
  version: '1',
  encryptHistory: false,
  clearHistory: false,
  scrollRegions: [],
  rememberedState: {},
}

describe('AppShell flash toasts', () => {
  it('renders notice toast when flash.notice is set', () => {
    vi.mocked(usePage).mockReturnValue({
      ...basePageMock,
      props: { ...baseProps, flash: { notice: 'Enregistré avec succès.', alert: null } },
    } as ReturnType<typeof usePage>)
    render(<AppShell><div>content</div></AppShell>)
    expect(screen.getByRole('status')).toHaveTextContent('Enregistré avec succès.')
  })

  it('does not render notice toast when flash.notice is null', () => {
    vi.mocked(usePage).mockReturnValue({
      ...basePageMock,
      props: baseProps,
    } as ReturnType<typeof usePage>)
    render(<AppShell><div>content</div></AppShell>)
    expect(screen.queryByRole('status')).toBeNull()
  })

  it('renders alert toast when flash.alert is set', () => {
    vi.mocked(usePage).mockReturnValue({
      ...basePageMock,
      props: { ...baseProps, flash: { notice: null, alert: 'Erreur de suppression.' } },
    } as ReturnType<typeof usePage>)
    render(<AppShell><div>content</div></AppShell>)
    expect(screen.getByRole('alert')).toHaveTextContent('Erreur de suppression.')
  })
})
