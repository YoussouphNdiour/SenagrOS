import { render, screen } from '@testing-library/react'
import { ProcedureFormBuilder } from './ProcedureFormBuilder'
import type { ProcedureSchema } from '../../types/intervention'

const schema: ProcedureSchema = {
  procedure_name: 'sowing',
  label: 'Semis',
  groups: {
    target: [{ name: 'land_parcel', label: 'Parcelle cible' }],
    tool:   [{ name: 'sower', label: 'Semoir' }],
    doer:   [{ name: 'worker', label: 'Travailleur' }],
    input:  [{ name: 'seed', label: 'Semence' }],
    output: [],
  },
}

it('renders section headings for non-empty groups', () => {
  render(<ProcedureFormBuilder schema={schema} />)
  expect(screen.getByText('Cibles')).toBeInTheDocument()
  expect(screen.getByText('Équipements')).toBeInTheDocument()
  expect(screen.getByText('Intervenants')).toBeInTheDocument()
  expect(screen.getByText('Intrants')).toBeInTheDocument()
  expect(screen.queryByText('Produits')).not.toBeInTheDocument()
})

it('renders param labels', () => {
  render(<ProcedureFormBuilder schema={schema} />)
  expect(screen.getByText('Parcelle cible')).toBeInTheDocument()
  expect(screen.getByText('Semence')).toBeInTheDocument()
})

it('renders product_name inputs with correct name attributes', () => {
  render(<ProcedureFormBuilder schema={schema} />)
  const targetInput = document.querySelector('[name="intervention[target_participants][land_parcel][product_name]"]')
  expect(targetInput).toBeInTheDocument()
})

it('renders quantity inputs only for input/output groups', () => {
  render(<ProcedureFormBuilder schema={schema} />)
  const qtyInputs = document.querySelectorAll('[type="number"]')
  // Only seed (input group) has quantity — output is empty
  expect(qtyInputs.length).toBe(1)
})

it('renders nothing when all groups are empty', () => {
  const emptySchema: ProcedureSchema = {
    procedure_name: 'test',
    label: 'Test',
    groups: { target: [], tool: [], doer: [], input: [], output: [] },
  }
  const { container } = render(<ProcedureFormBuilder schema={emptySchema} />)
  expect(container.firstChild).toBeNull()
})
