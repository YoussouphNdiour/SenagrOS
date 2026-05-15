import { render, screen } from '@testing-library/react'
import type { Parcelle } from '../../types/dashboard'
import { ParcellesMap } from './ParcellesMap'

const mockParcelles: Parcelle[] = [
  {
    id: 1,
    name: 'Parcelle Nord',
    area_ha: 3.5,
    geojson: '{"type":"Polygon","coordinates":[[[14.5,14.8],[14.6,14.8],[14.6,14.9],[14.5,14.9],[14.5,14.8]]]}',
  },
  {
    id: 2,
    name: 'Parcelle Sud',
    area_ha: 2.1,
    geojson: '{"type":"Polygon","coordinates":[[[14.5,14.7],[14.6,14.7],[14.6,14.8],[14.5,14.8],[14.5,14.7]]]}',
  },
]

describe('ParcellesMap', () => {
  it('rend le conteneur de carte', () => {
    render(<ParcellesMap parcelles={mockParcelles} />)
    expect(screen.getByTestId('map-container')).toBeInTheDocument()
  })

  it('rend un layer GeoJSON par parcelle', () => {
    render(<ParcellesMap parcelles={mockParcelles} />)
    expect(screen.getAllByTestId('geojson-layer')).toHaveLength(2)
  })

  it("affiche un placeholder quand il n'y a aucune parcelle", () => {
    render(<ParcellesMap parcelles={[]} />)
    expect(screen.getByText('Aucune parcelle enregistrée')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Créer une parcelle/i })).toBeInTheDocument()
  })

  it('passe le GeoJSON parsé au layer', () => {
    render(<ParcellesMap parcelles={[mockParcelles[0]]} />)
    const layer = screen.getByTestId('geojson-layer')
    const parsed = JSON.parse(layer.getAttribute('data-geojson') ?? '{}')
    expect(parsed.type).toBe('Polygon')
  })
})
