import { render, screen } from '@testing-library/react'
import { vi } from 'vitest'
import { usePage } from '@inertiajs/react'
import ParcellesIndex from './Index'

vi.mocked(usePage).mockReturnValue({
  props: { appShell: { farm: { name: 'Ferme' }, campaign: null, user: { name: 'Test', initials: 'T' } }, errors: {} },
  url: '/backend/cultivable-zones',
  component: 'Backend/Parcelles/Index',
  version: '1',
  encryptHistory: false,
  clearHistory: false,
  scrollRegions: [],
  rememberedState: {},
} as ReturnType<typeof usePage>)

const PARCELLES = [
  { id: 1, name: 'Champ Nord', area_ha: 12.5, geojson: null },
  { id: 2, name: 'Champ Sud',  area_ha: 8.3,  geojson: null },
]

describe('ParcellesIndex', () => {
  it('affiche le titre', () => {
    render(<ParcellesIndex parcelles={PARCELLES} meta={{ total: 2 }} />)
    expect(screen.getByText('Parcelles')).toBeInTheDocument()
  })

  it('affiche les noms des parcelles dans la table', () => {
    render(<ParcellesIndex parcelles={PARCELLES} meta={{ total: 2 }} />)
    expect(screen.getByText('Champ Nord')).toBeInTheDocument()
    expect(screen.getByText('Champ Sud')).toBeInTheDocument()
  })

  it('affiche les surfaces en ha', () => {
    render(<ParcellesIndex parcelles={PARCELLES} meta={{ total: 2 }} />)
    expect(screen.getByText('12.5 ha')).toBeInTheDocument()
    expect(screen.getByText('8.3 ha')).toBeInTheDocument()
  })

  it('affiche le total des parcelles', () => {
    render(<ParcellesIndex parcelles={PARCELLES} meta={{ total: 2 }} />)
    expect(screen.getByText(/2 parcelle/i)).toBeInTheDocument()
  })

  it('affiche la carte', () => {
    render(<ParcellesIndex parcelles={PARCELLES} meta={{ total: 2 }} />)
    expect(screen.getByTestId('map-container')).toBeInTheDocument()
  })
})
