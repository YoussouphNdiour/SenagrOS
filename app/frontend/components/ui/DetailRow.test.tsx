import { render, screen } from '@testing-library/react'
import { DetailRow } from './DetailRow'
import { DataTable } from './DataTable'

test('DetailRow renders label/value pairs', () => {
  render(
    <DetailRow items={[
      { label: 'Nom', value: 'Bœuf Alpha' },
      { label: 'Race', value: 'Ndama' },
    ]} />
  )
  expect(screen.getByText('Nom')).toBeTruthy()
  expect(screen.getByText('Bœuf Alpha')).toBeTruthy()
  expect(screen.getByText('Ndama')).toBeTruthy()
})

test('DetailRow renders — for null/undefined', () => {
  render(<DetailRow items={[{ label: 'Date', value: null }]} />)
  expect(screen.getByText('—')).toBeTruthy()
})

test('DataTable renders column headers', () => {
  render(
    <table><DataTable
      columns={[{ key: 'name', label: 'Nom' }, { key: 'state', label: 'État' }]}
      data={[]}
      renderRow={() => null}
    /></table>
  )
  expect(screen.getByText('Nom')).toBeTruthy()
  expect(screen.getByText('État')).toBeTruthy()
})

test('DataTable renders empty message when no data', () => {
  render(
    <table><DataTable
      columns={[{ key: 'name', label: 'Nom' }]}
      data={[]}
      renderRow={() => null}
      emptyMessage="Aucun animal"
    /></table>
  )
  expect(screen.getByText('Aucun animal')).toBeTruthy()
})
