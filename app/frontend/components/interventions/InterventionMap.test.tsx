import { render, screen } from '@testing-library/react'
import { InterventionMap } from './InterventionMap'

const emptyCollection: GeoJSON.FeatureCollection = {
  type: 'FeatureCollection',
  features: [],
}

const oneFeature: GeoJSON.FeatureCollection = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      geometry: {
        type: 'Polygon',
        coordinates: [[[14.5, -14.5], [14.6, -14.5], [14.6, -14.4], [14.5, -14.5]]],
      },
      properties: { intervention_id: 1, name: 'Parcelle A' },
    },
  ],
}

describe('InterventionMap', () => {
  it('affiche le message "Aucune zone" quand features est vide', () => {
    render(<InterventionMap geojson={emptyCollection} />)
    expect(screen.getByText(/aucune zone/i)).toBeInTheDocument()
  })

  it('affiche le conteneur de carte quand il y a des features', () => {
    render(<InterventionMap geojson={oneFeature} />)
    expect(screen.getByTestId('map-container')).toBeInTheDocument()
  })

  it('rend un layer GeoJSON par feature', () => {
    render(<InterventionMap geojson={oneFeature} />)
    expect(screen.getByTestId('geojson-layer')).toBeInTheDocument()
  })
})
