import { render, screen } from '@testing-library/react'
import { vi } from 'vitest'
import { usePage } from '@inertiajs/react'
import EntitesIndex from './Index'

vi.mocked(usePage).mockReturnValue({
  props: { appShell: { farm: { name: 'Ferme Test' }, campaign: null, user: { name: 'Test User', initials: 'TU' } }, errors: {} },
  url: '/backend/entities',
  component: 'Backend/Entites/Index',
  version: '1',
  encryptHistory: false,
  clearHistory: false,
  scrollRegions: [],
  rememberedState: {},
} as ReturnType<typeof usePage>)

const ENTITES = [
  {
    id: 1,
    number: 'ENT000001',
    full_name: 'Coopérative Agricole du Nord',
    nature: 'organization',
    active: true,
    client: true,
    supplier: false,
  },
  {
    id: 2,
    number: 'ENT000002',
    full_name: 'Diallo Mamadou',
    nature: 'contact',
    active: true,
    client: false,
    supplier: true,
  },
  {
    id: 3,
    number: 'ENT000003',
    full_name: 'Ancien Partenaire',
    nature: 'organization',
    active: false,
    client: false,
    supplier: false,
  },
]

describe('EntitesIndex', () => {
  it('affiche le titre Entités', () => {
    render(<EntitesIndex entites={ENTITES} meta={{ total: 3, page: 1, per_page: 50 }} />)
    expect(screen.getByText('Entités')).toBeInTheDocument()
  })

  it('affiche le sous-titre avec le total', () => {
    render(<EntitesIndex entites={ENTITES} meta={{ total: 3, page: 1, per_page: 50 }} />)
    expect(screen.getByText(/3 entités/i)).toBeInTheDocument()
  })

  it('affiche les noms des entités', () => {
    render(<EntitesIndex entites={ENTITES} meta={{ total: 3, page: 1, per_page: 50 }} />)
    expect(screen.getByText('Coopérative Agricole du Nord')).toBeInTheDocument()
    expect(screen.getByText('Diallo Mamadou')).toBeInTheDocument()
    expect(screen.getByText('Ancien Partenaire')).toBeInTheDocument()
  })

  it('affiche le badge "Organisation" pour nature organization', () => {
    render(<EntitesIndex entites={ENTITES} meta={{ total: 3, page: 1, per_page: 50 }} />)
    const badges = screen.getAllByText('Organisation')
    expect(badges.length).toBeGreaterThan(0)
  })

  it('affiche le badge "Contact" pour nature contact', () => {
    render(<EntitesIndex entites={ENTITES} meta={{ total: 3, page: 1, per_page: 50 }} />)
    expect(screen.getByText('Contact')).toBeInTheDocument()
  })

  it('affiche le tag "Client" pour une entité cliente', () => {
    render(<EntitesIndex entites={ENTITES} meta={{ total: 3, page: 1, per_page: 50 }} />)
    expect(screen.getByText('Client')).toBeInTheDocument()
  })

  it('affiche le tag "Fournisseur" pour une entité fournisseur', () => {
    render(<EntitesIndex entites={ENTITES} meta={{ total: 3, page: 1, per_page: 50 }} />)
    expect(screen.getByText('Fournisseur')).toBeInTheDocument()
  })

  it('affiche "—" quand aucun rôle', () => {
    render(<EntitesIndex entites={ENTITES} meta={{ total: 3, page: 1, per_page: 50 }} />)
    const dashes = screen.getAllByText('—')
    expect(dashes.length).toBeGreaterThan(0)
  })

  it('affiche "Actif" pour une entité active', () => {
    render(<EntitesIndex entites={ENTITES} meta={{ total: 3, page: 1, per_page: 50 }} />)
    const badges = screen.getAllByText('Actif')
    expect(badges.length).toBeGreaterThan(0)
  })

  it('affiche "Inactif" pour une entité inactive', () => {
    render(<EntitesIndex entites={ENTITES} meta={{ total: 3, page: 1, per_page: 50 }} />)
    expect(screen.getByText('Inactif')).toBeInTheDocument()
  })

  it('le layout persistant est défini', () => {
    expect(typeof EntitesIndex.layout).toBe('function')
  })
})
