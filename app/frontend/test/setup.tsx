import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Mock react-leaflet — Leaflet requires real DOM with canvas
vi.mock('react-leaflet', () => ({
  MapContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="map-container">{children}</div>
  ),
  TileLayer: () => <div data-testid="tile-layer" />,
  GeoJSON: ({ data }: { data: unknown }) => (
    <div data-testid="geojson-layer" data-geojson={JSON.stringify(data)} />
  ),
  useMap: () => ({ fitBounds: vi.fn(), setView: vi.fn() }),
}))

// Mock @inertiajs/react for unit tests
vi.mock('@inertiajs/react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@inertiajs/react')>()
  return {
    ...actual,
    usePage: vi.fn(() => ({ props: {} })),
  }
})
