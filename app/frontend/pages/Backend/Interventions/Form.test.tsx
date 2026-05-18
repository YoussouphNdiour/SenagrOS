import { render, screen, fireEvent } from '@testing-library/react'
import { vi } from 'vitest'
import InterventionsForm from './Form'
import type { ProcedureSchema } from '../../../types/intervention'

const mockRouter = vi.hoisted(() => ({ post: vi.fn(), patch: vi.fn(), get: vi.fn() }))

vi.mock('@inertiajs/react', () => ({ router: mockRouter }))

vi.mock('../../../components/interventions/ProcedureFormBuilder', () => ({
  ProcedureFormBuilder: ({ schema }: { schema: ProcedureSchema }) => (
    <div data-testid="procedure-form-builder">Schema: {schema.label}</div>
  ),
}))

const procedures = [
  { label: 'Semis', name: 'sowing' },
  { label: 'Irrigation', name: 'irrigation' },
]

beforeEach(() => { vi.clearAllMocks() })

it('renders "Nouvelle intervention" for new form', () => {
  render(<InterventionsForm intervention={null} procedures={procedures} procedure_schema={null} errors={{}} />)
  expect(screen.getByText('Nouvelle intervention')).toBeInTheDocument()
})

it('renders "Modifier l\'intervention" for edit form', () => {
  const intervention = { id: 1, procedure_name: 'sowing', nature: 'record', state: 'in_progress', started_at: null, stopped_at: null, description: '', number: 'I-001' }
  render(<InterventionsForm intervention={intervention} procedures={procedures} procedure_schema={null} errors={{}} />)
  expect(screen.getByText("Modifier l'intervention")).toBeInTheDocument()
})

it('renders procedure select with options', () => {
  render(<InterventionsForm intervention={null} procedures={procedures} procedure_schema={null} errors={{}} />)
  expect(screen.getByRole('combobox', { name: /procédure/i })).toBeInTheDocument()
  expect(screen.getByRole('option', { name: 'Semis' })).toBeInTheDocument()
})

it('shows ProcedureFormBuilder when schema is provided', () => {
  const schema: ProcedureSchema = {
    procedure_name: 'sowing', label: 'Semis',
    groups: { target: [], tool: [], doer: [], input: [], output: [] },
  }
  render(<InterventionsForm intervention={null} procedures={procedures} procedure_schema={schema} errors={{}} />)
  expect(screen.getByTestId('procedure-form-builder')).toBeInTheDocument()
})

it('shows notice when no schema', () => {
  render(<InterventionsForm intervention={null} procedures={procedures} procedure_schema={null} errors={{}} />)
  expect(screen.getByText(/Sélectionnez une procédure/i)).toBeInTheDocument()
})

it('renders error messages', () => {
  render(<InterventionsForm intervention={null} procedures={procedures} procedure_schema={null} errors={{ procedure_name: 'est requise' }} />)
  expect(screen.getByText('est requise')).toBeInTheDocument()
})

it('calls router.post on new form submit', () => {
  render(<InterventionsForm intervention={null} procedures={procedures} procedure_schema={null} errors={{}} />)
  const form = screen.getByRole('button', { name: /créer/i }).closest('form')!
  fireEvent.submit(form)
  expect(mockRouter.post).toHaveBeenCalledWith('/backend/interventions', expect.any(Object), expect.any(Object))
})

it('calls router.patch on edit form submit', () => {
  const intervention = { id: 42, procedure_name: 'sowing', nature: 'record', state: 'in_progress', started_at: null, stopped_at: null, description: '', number: '' }
  render(<InterventionsForm intervention={intervention} procedures={procedures} procedure_schema={null} errors={{}} />)
  const form = screen.getByRole('button', { name: /enregistrer/i }).closest('form')!
  fireEvent.submit(form)
  expect(mockRouter.patch).toHaveBeenCalledWith('/backend/interventions/42', expect.any(Object), expect.any(Object))
})

it('calls router.get with procedure_name when procedure select changes', () => {
  render(<InterventionsForm intervention={null} procedures={procedures} procedure_schema={null} errors={{}} />)
  const select = screen.getByRole('combobox', { name: /procédure/i })
  fireEvent.change(select, { target: { value: 'irrigation' } })
  expect(mockRouter.get).toHaveBeenCalledWith('/backend/interventions/new', { procedure_name: 'irrigation' })
})

it('slices datetime strings to [0,16] for datetime-local input', () => {
  const intervention = {
    id: 1,
    procedure_name: 'sowing',
    nature: 'record',
    state: 'in_progress',
    started_at: '2024-05-18T14:30:00',
    stopped_at: null,
    description: '',
    number: 'I-001',
  }
  render(<InterventionsForm intervention={intervention} procedures={procedures} procedure_schema={null} errors={{}} />)
  expect(screen.getByDisplayValue('2024-05-18T14:30')).toBeInTheDocument()
})

it('disables submit button while submitting', async () => {
  render(<InterventionsForm intervention={null} procedures={procedures} procedure_schema={null} errors={{}} />)
  const button = screen.getByRole('button', { name: /créer/i })
  expect(button).not.toBeDisabled()
  fireEvent.submit(button.closest('form')!)
  expect(button).toBeDisabled()
})
