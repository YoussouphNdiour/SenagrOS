import { render, screen } from '@testing-library/react'
import { vi } from 'vitest'
import { usePage } from '@inertiajs/react'
import ParametresAbout from './About'

vi.mocked(usePage).mockReturnValue({
  props: {
    appShell: { farm: { name: 'Ferme' }, campaign: null, user: { name: 'Test', initials: 'T' } },
  },
  url: '/backend/settings/about',
  component: 'Backend/Parametres/About',
  version: '1',
  encryptHistory: false,
  clearHistory: false,
} as unknown as ReturnType<typeof usePage>)

const APP_INFO = {
  ekylibre_version: '2.5.0',
  db_version: '20240101',
  lexicon_version: '3.0',
  tenant: 'senagros',
  language: 'fra',
  country: 'SN',
}

describe('ParametresAbout', () => {
  it('affiche le titre Paramètres', () => {
    render(<ParametresAbout app_info={APP_INFO} />)
    expect(screen.getByText('Paramètres')).toBeInTheDocument()
  })

  it('affiche la version ekylibre', () => {
    render(<ParametresAbout app_info={APP_INFO} />)
    expect(screen.getByText('2.5.0')).toBeInTheDocument()
  })

  it('affiche le tenant', () => {
    render(<ParametresAbout app_info={APP_INFO} />)
    expect(screen.getByText('senagros')).toBeInTheDocument()
  })

  it('affiche la section À propos de SenagrOS', () => {
    render(<ParametresAbout app_info={APP_INFO} />)
    expect(screen.getByText(/à propos de senagros/i)).toBeInTheDocument()
  })

  it('affiche les infos de localisation', () => {
    render(<ParametresAbout app_info={APP_INFO} />)
    expect(screen.getByText('SN')).toBeInTheDocument()
  })
})
