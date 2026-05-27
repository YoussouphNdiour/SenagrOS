import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import EntitesForm from './Form'

vi.mock('@inertiajs/react', () => ({
  router: { post: vi.fn(), patch: vi.fn() },
  usePage: vi.fn(() => ({ props: { flash: {} } })),
}))

vi.mock('../../../components/AppShell', () => ({
  AppShell: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

import { router } from '@inertiajs/react'

const entite = {
  id: 7,
  nature: 'contact',
  title: 'M.',
  first_name: 'Mamadou',
  last_name: 'Diallo',
  born_at: '1985-03-15',
  dead_at: null,
  language: 'fra',
  description: 'Client fidèle',
  emails: [{ id: 1, coordinate: 'mamadou@farm.sn' }],
  phones: [{ id: 2, coordinate: '+221 77 000 0000' }],
  mails: [{ id: 3, mail_line_4: 'Rue 10', mail_line_6: 'Dakar', mail_country: 'SN' }],
}

const emptyErrors: Record<string, string> = {}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('EntitesForm', () => {
  // 1. Renders "Nouvelle entité" when entite is null
  it('renders "Nouvelle entité" when entite is null', () => {
    render(<EntitesForm entite={null} errors={emptyErrors} />)
    expect(screen.getByText('Nouvelle entité')).toBeInTheDocument()
  })

  // 2. Renders "Modifier l'entité" when editing
  it('renders "Modifier l\'entité" when editing', () => {
    render(<EntitesForm entite={entite} errors={emptyErrors} />)
    expect(screen.getByText("Modifier l'entité")).toBeInTheDocument()
  })

  // 3. Nature select defaults to "Organisation" (organization) when null
  it('nature select defaults to organization when entite is null', () => {
    render(<EntitesForm entite={null} errors={emptyErrors} />)
    const select = screen.getByLabelText(/nature/i) as HTMLSelectElement
    expect(select.value).toBe('organization')
  })

  // 4. Nature select defaults to existing value when editing (contact)
  it('nature select defaults to existing value when editing', () => {
    render(<EntitesForm entite={entite} errors={emptyErrors} />)
    const select = screen.getByLabelText(/nature/i) as HTMLSelectElement
    expect(select.value).toBe('contact')
  })

  // 5. Last name input is empty when null
  it('last name input is empty when entite is null', () => {
    render(<EntitesForm entite={null} errors={emptyErrors} />)
    const input = screen.getByLabelText(/^Nom/i) as HTMLInputElement
    expect(input.value).toBe('')
  })

  // 6. Last name shows entite.last_name when editing
  it('last name shows entite.last_name when editing', () => {
    render(<EntitesForm entite={entite} errors={emptyErrors} />)
    const input = screen.getByLabelText(/^Nom/i) as HTMLInputElement
    expect(input.value).toBe('Diallo')
  })

  // 7. Existing email shown in email list when editing
  it('existing email is shown when editing', () => {
    render(<EntitesForm entite={entite} errors={emptyErrors} />)
    const emailInput = screen.getByDisplayValue('mamadou@farm.sn') as HTMLInputElement
    expect(emailInput).toBeInTheDocument()
  })

  // 8. "Ajouter un email" adds an empty email input
  it('adds an empty email input when clicking Ajouter un email', async () => {
    const user = userEvent.setup()
    render(<EntitesForm entite={null} errors={emptyErrors} />)
    const addButton = screen.getByRole('button', { name: /ajouter un email/i })
    await user.click(addButton)
    const emailInputs = screen.getAllByRole('textbox', { name: /email/i })
    expect(emailInputs.length).toBeGreaterThanOrEqual(1)
  })

  // 9. Existing phone shown when editing
  it('existing phone is shown when editing', () => {
    render(<EntitesForm entite={entite} errors={emptyErrors} />)
    const phoneInput = screen.getByDisplayValue('+221 77 000 0000') as HTMLInputElement
    expect(phoneInput).toBeInTheDocument()
  })

  // 10. "Ajouter un téléphone" adds a phone input
  it('adds a phone input when clicking Ajouter un téléphone', async () => {
    const user = userEvent.setup()
    render(<EntitesForm entite={null} errors={emptyErrors} />)
    const addButton = screen.getByRole('button', { name: /ajouter un téléphone/i })
    await user.click(addButton)
    const phoneInputs = screen.getAllByRole('textbox', { name: /téléphone/i })
    expect(phoneInputs.length).toBeGreaterThanOrEqual(1)
  })

  // 11. Existing mail address shown when editing (mail_line_4 visible)
  it('existing mail address (mail_line_4) is shown when editing', () => {
    render(<EntitesForm entite={entite} errors={emptyErrors} />)
    const streetInput = screen.getByDisplayValue('Rue 10') as HTMLInputElement
    expect(streetInput).toBeInTheDocument()
  })

  // 12. "Ajouter une adresse" adds a mail entry
  it('adds a mail entry when clicking Ajouter une adresse', async () => {
    const user = userEvent.setup()
    render(<EntitesForm entite={null} errors={emptyErrors} />)
    const addButton = screen.getByRole('button', { name: /ajouter une adresse/i })
    await user.click(addButton)
    const streetInputs = screen.getAllByRole('textbox', { name: /rue \/ bp/i })
    expect(streetInputs.length).toBeGreaterThanOrEqual(1)
  })

  // 13. Submit calls router.post for new entity
  it('calls router.post when submitting a new entity', async () => {
    const user = userEvent.setup()
    render(<EntitesForm entite={null} errors={emptyErrors} />)
    const form = screen.getByRole('button', { name: /créer l'entité/i })
    await user.click(form)
    expect(router.post).toHaveBeenCalledWith(
      '/backend/entities',
      expect.any(FormData),
      expect.objectContaining({ onFinish: expect.any(Function) })
    )
  })

  // 14. Submit calls router.patch with entity id for edit
  it('calls router.patch with entity id when submitting an edit', async () => {
    const user = userEvent.setup()
    render(<EntitesForm entite={entite} errors={emptyErrors} />)
    const submitButton = screen.getByRole('button', { name: /enregistrer/i })
    await user.click(submitButton)
    expect(router.patch).toHaveBeenCalledWith(
      '/backend/entities/7',
      expect.any(FormData),
      expect.objectContaining({ onFinish: expect.any(Function) })
    )
  })
})
