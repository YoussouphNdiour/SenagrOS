import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import ParcelleShow from './Show'

vi.mock('@inertiajs/react', () => ({
  usePage: vi.fn(),
  router: { delete: vi.fn() },
  Link: ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}))

vi.mock('react-leaflet', () => ({
  MapContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="map">{children}</div>
  ),
  TileLayer: () => null,
  GeoJSON: () => null,
  useMap: () => ({ fitBounds: vi.fn() }),
}))

vi.mock('leaflet/dist/leaflet.css', () => ({}))

vi.mock('leaflet', () => ({
  default: {
    Icon: { Default: { mergeOptions: vi.fn() } },
    geoJSON: vi.fn(() => ({ getBounds: vi.fn() })),
  },
}))

vi.mock('leaflet/dist/images/marker-icon.png', () => ({ default: '' }))
vi.mock('leaflet/dist/images/marker-icon-2x.png', () => ({ default: '' }))
vi.mock('leaflet/dist/images/marker-shadow.png', () => ({ default: '' }))

import { usePage } from '@inertiajs/react'

const mockParcelle = {
  id: 1,
  name: 'Champ Nord - Louga',
  work_number: 'P001',
  description: 'Grande parcelle nord',
  soil_nature: 'sableux',
  production_system_name: '',
  area_ha: 12.5,
  geojson: null,
  owner_name: 'GIE Ndiaye',
  farmer_name: '',
  created_at: '2024-01-01T00:00:00Z',
}

const mockProductions = [
  {
    id: 1,
    name: 'Culture du mil 2024',
    state: 'opened',
    started_on: '2024-06-01',
    stopped_on: null,
  },
]

const sharedProps = {
  appShell: {
    campaign: { name: 'Hivernage 2024' },
    user: { name: 'Yoûssouph N.', initials: 'YN' },
  },
  errors: {},
}

beforeEach(() => {
  vi.mocked(usePage).mockReturnValue({
    props: sharedProps,
    url: '/backend/cultivable-zones/1',
    component: 'Backend/Parcelles/Show',
    version: '1',
    encryptHistory: false,
    clearHistory: false,
    scrollRegions: [],
    rememberedState: {},
  } as ReturnType<typeof usePage>)
})

describe('ParcelleShow', () => {
  it('renders parcelle name and work number', () => {
    render(<ParcelleShow parcelle={mockParcelle} productions={[]} canDestroy={true} />)
    expect(screen.getByText('Champ Nord - Louga')).toBeInTheDocument()
    expect(screen.getByText('P001')).toBeInTheDocument()
  })

  it('shows area in hectares', () => {
    render(<ParcelleShow parcelle={mockParcelle} productions={[]} canDestroy={true} />)
    expect(screen.getByText('12.5 ha')).toBeInTheDocument()
  })

  it('renders productions table', () => {
    render(<ParcelleShow parcelle={mockParcelle} productions={mockProductions} canDestroy={true} />)
    expect(screen.getByText('Culture du mil 2024')).toBeInTheDocument()
    expect(screen.getByText('Ouverte')).toBeInTheDocument()
  })

  it('does not render map when no geojson', () => {
    render(<ParcelleShow parcelle={mockParcelle} productions={[]} canDestroy={true} />)
    expect(screen.queryByTestId('map')).not.toBeInTheDocument()
  })
})
