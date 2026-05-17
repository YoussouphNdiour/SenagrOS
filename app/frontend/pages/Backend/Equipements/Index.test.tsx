import { render, screen } from '@testing-library/react'
import { vi } from 'vitest'
import { usePage } from '@inertiajs/react'
import EquipementsIndex from './Index'

vi.mocked(usePage).mockReturnValue({
  props: { appShell: { farm: { name: 'Ferme Test' }, campaign: null, user: { name: 'Test User', initials: 'TU' } }, errors: {} },
  url: '/backend/equipments',
  component: 'Backend/Equipements/Index',
  version: '1',
  encryptHistory: false,
  clearHistory: false,
  scrollRegions: [],
  rememberedState: {},
} as ReturnType<typeof usePage>)

const EQUIPEMENTS = [
  {
    id: 1,
    work_number: 'EQ000001',
    name: 'Tracteur Massey Ferguson',
    born_at: '2019-03-15T00:00:00Z',
    variant_name: 'Tracteur 110cv',
  },
  {
    id: 2,
    work_number: 'EQ000002',
    name: 'Semoir pneumatique',
    born_at: null,
    variant_name: '',
  },
]

describe('EquipementsIndex', () => {
  it('affiche le titre Équipements', () => {
    render(<EquipementsIndex equipements={EQUIPEMENTS} meta={{ total: 2, page: 1, per_page: 50 }} />)
    expect(screen.getByText('Équipements')).toBeInTheDocument()
  })

  it('affiche le sous-titre avec le total', () => {
    render(<EquipementsIndex equipements={EQUIPEMENTS} meta={{ total: 2, page: 1, per_page: 50 }} />)
    expect(screen.getByText(/2 équipements/i)).toBeInTheDocument()
  })

  it('affiche les noms des équipements', () => {
    render(<EquipementsIndex equipements={EQUIPEMENTS} meta={{ total: 2, page: 1, per_page: 50 }} />)
    expect(screen.getByText('Tracteur Massey Ferguson')).toBeInTheDocument()
    expect(screen.getByText('Semoir pneumatique')).toBeInTheDocument()
  })

  it('affiche les numéros de travail', () => {
    render(<EquipementsIndex equipements={EQUIPEMENTS} meta={{ total: 2, page: 1, per_page: 50 }} />)
    expect(screen.getByText('EQ000001')).toBeInTheDocument()
    expect(screen.getByText('EQ000002')).toBeInTheDocument()
  })

  it('affiche la date formatée pour born_at renseigné', () => {
    render(<EquipementsIndex equipements={EQUIPEMENTS} meta={{ total: 2, page: 1, per_page: 50 }} />)
    expect(screen.getByText('15/03/2019')).toBeInTheDocument()
  })

  it('affiche "—" pour born_at null', () => {
    render(<EquipementsIndex equipements={EQUIPEMENTS} meta={{ total: 2, page: 1, per_page: 50 }} />)
    const dashes = screen.getAllByText('—')
    expect(dashes.length).toBeGreaterThan(0)
  })

  it('affiche "—" pour variant_name vide', () => {
    render(<EquipementsIndex equipements={EQUIPEMENTS} meta={{ total: 2, page: 1, per_page: 50 }} />)
    const dashes = screen.getAllByText('—')
    expect(dashes.length).toBeGreaterThan(0)
  })

  it('affiche le nom de variante quand présent', () => {
    render(<EquipementsIndex equipements={EQUIPEMENTS} meta={{ total: 2, page: 1, per_page: 50 }} />)
    expect(screen.getByText('Tracteur 110cv')).toBeInTheDocument()
  })

  it('le layout persistant est défini', () => {
    expect(typeof EquipementsIndex.layout).toBe('function')
  })
})
