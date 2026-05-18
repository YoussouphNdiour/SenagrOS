import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { router, usePage } from '@inertiajs/react'
import AddressForm from './AddressForm'

vi.mock('@inertiajs/react', () => ({
  router: { post: vi.fn(), patch: vi.fn() },
  usePage: vi.fn(() => ({ props: { flash: {} } })),
}))

vi.mock('../../../components/AppShell', () => ({
  AppShell: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

const entity_id = 7

const address = {
  id: 5,
  canal: 'phone',
  coordinate: '+221 77 000 0000',
  mail_line_4: '',
  mail_line_6: '',
  mail_country: '',
}

beforeEach(() => {
  vi.mocked(usePage).mockReturnValue({
    props: {
      appShell: {
        farm: { name: 'Ferme Test' },
        campaign: null,
        user: { name: 'Test', initials: 'T' },
      },
    },
    url: `/backend/entities/${entity_id}/addresses/new`,
    component: 'Backend/Entites/AddressForm',
    version: '1',
    encryptHistory: false,
    clearHistory: false,
  } as unknown as ReturnType<typeof usePage>)

  vi.mocked(router.post).mockClear()
  vi.mocked(router.patch).mockClear()
})

describe('AddressForm — création (address null)', () => {
  it('1. affiche "Nouvelle adresse" quand address est null', () => {
    render(<AddressForm address={null} entity_id={entity_id} errors={{}} />)
    expect(screen.getByText(/nouvelle adresse/i)).toBeInTheDocument()
  })

  it('4. le canal par défaut est "email" quand address est null', () => {
    render(<AddressForm address={null} entity_id={entity_id} errors={{}} />)
    const select = screen.getByRole('combobox') as HTMLSelectElement
    expect(select.value).toBe('email')
  })

  it('3. le select de canal affiche bien les 6 options', () => {
    render(<AddressForm address={null} entity_id={entity_id} errors={{}} />)
    const options = screen.getAllByRole('option')
    expect(options).toHaveLength(6)
    const values = options.map((o) => (o as HTMLOptionElement).value)
    expect(values).toContain('email')
    expect(values).toContain('phone')
    expect(values).toContain('mobile')
    expect(values).toContain('fax')
    expect(values).toContain('mail')
    expect(values).toContain('website')
  })

  it('6. le champ coordinate est visible quand le canal est "email"', () => {
    render(<AddressForm address={null} entity_id={entity_id} errors={{}} />)
    expect(screen.getByLabelText(/valeur/i)).toBeInTheDocument()
  })

  it('7. le champ coordinate est caché quand le canal est "mail"', () => {
    render(<AddressForm address={null} entity_id={entity_id} errors={{}} />)
    const select = screen.getByRole('combobox')
    fireEvent.change(select, { target: { value: 'mail' } })
    expect(screen.queryByLabelText(/^valeur/i)).not.toBeInTheDocument()
  })

  it('8. les champs mail sont visibles quand le canal est "mail"', () => {
    render(<AddressForm address={null} entity_id={entity_id} errors={{}} />)
    const select = screen.getByRole('combobox')
    fireEvent.change(select, { target: { value: 'mail' } })
    expect(screen.getByLabelText(/rue \/ bp/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/ville \/ cp/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/code pays/i)).toBeInTheDocument()
  })

  it('9. submit appelle router.post avec le bon entity_id dans l\'URL', () => {
    render(<AddressForm address={null} entity_id={entity_id} errors={{}} />)
    const form = screen.getByRole('button', { name: /créer/i }).closest('form')!
    fireEvent.submit(form)
    expect(router.post).toHaveBeenCalledWith(
      `/backend/entities/${entity_id}/addresses`,
      expect.objectContaining({
        entity_address: expect.objectContaining({ canal: 'email' }),
      }),
      expect.any(Object)
    )
    expect(router.patch).not.toHaveBeenCalled()
  })
})

describe('AddressForm — édition (address non-null)', () => {
  it('2. affiche "Modifier l\'adresse" quand on édite', () => {
    render(<AddressForm address={address} entity_id={entity_id} errors={{}} />)
    expect(screen.getByText(/modifier l'adresse/i)).toBeInTheDocument()
  })

  it('5. le canal par défaut est address.canal quand on édite', () => {
    render(<AddressForm address={address} entity_id={entity_id} errors={{}} />)
    const select = screen.getByRole('combobox') as HTMLSelectElement
    expect(select.value).toBe('phone')
  })

  it('pré-remplit le champ coordinate avec la valeur existante', () => {
    render(<AddressForm address={address} entity_id={entity_id} errors={{}} />)
    expect(screen.getByDisplayValue('+221 77 000 0000')).toBeInTheDocument()
  })

  it('10. submit appelle router.patch avec entity_id et address.id dans l\'URL', () => {
    render(<AddressForm address={address} entity_id={entity_id} errors={{}} />)
    const form = screen.getByRole('button', { name: /enregistrer/i }).closest('form')!
    fireEvent.submit(form)
    expect(router.patch).toHaveBeenCalledWith(
      `/backend/entities/${entity_id}/addresses/${address.id}`,
      expect.objectContaining({
        entity_address: expect.objectContaining({ canal: 'phone' }),
      }),
      expect.any(Object)
    )
    expect(router.post).not.toHaveBeenCalled()
  })

  it('affiche les erreurs de validation du canal', () => {
    render(
      <AddressForm address={null} entity_id={entity_id} errors={{ canal: 'est invalide' }} />
    )
    expect(screen.getByText('est invalide')).toBeInTheDocument()
  })

  it('affiche les erreurs de validation de coordinate', () => {
    render(
      <AddressForm address={null} entity_id={entity_id} errors={{ coordinate: 'est vide' }} />
    )
    expect(screen.getByText('est vide')).toBeInTheDocument()
  })
})
