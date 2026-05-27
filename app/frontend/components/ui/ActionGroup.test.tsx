import { render, screen, fireEvent } from '@testing-library/react'
import { Edit } from 'lucide-react'
import { ActionGroup } from './ActionGroup'
import { ConfirmDeleteButton } from './ConfirmDeleteButton'
import { FormField } from './FormField'
import { TabNav } from './TabNav'

test('ActionGroup renders buttons', () => {
  const onClick = vi.fn()
  render(
    <ActionGroup actions={[{ label: 'Modifier', icon: Edit, onClick, variant: 'secondary' }]} />
  )
  fireEvent.click(screen.getByText('Modifier'))
  expect(onClick).toHaveBeenCalledOnce()
})

test('ConfirmDeleteButton shows confirm dialog', () => {
  vi.spyOn(window, 'confirm').mockReturnValue(true)
  const onDelete = vi.fn()
  render(<ConfirmDeleteButton onDelete={onDelete} canDestroy={true} resourceName="cet élément" />)
  fireEvent.click(screen.getByText('Supprimer'))
  expect(window.confirm).toHaveBeenCalled()
  expect(onDelete).toHaveBeenCalledOnce()
  vi.restoreAllMocks()
})

test('ConfirmDeleteButton does not call onDelete when cancelled', () => {
  vi.spyOn(window, 'confirm').mockReturnValue(false)
  const onDelete = vi.fn()
  render(<ConfirmDeleteButton onDelete={onDelete} canDestroy={true} resourceName="cet élément" />)
  fireEvent.click(screen.getByText('Supprimer'))
  expect(onDelete).not.toHaveBeenCalled()
  vi.restoreAllMocks()
})

test('FormField renders label and children', () => {
  render(
    <FormField label="Nom" htmlFor="name">
      <input id="name" />
    </FormField>
  )
  expect(screen.getByText('Nom')).toBeTruthy()
})

test('FormField renders error', () => {
  render(
    <FormField label="Nom" error="Ce champ est requis">
      <input />
    </FormField>
  )
  expect(screen.getByText('Ce champ est requis')).toBeTruthy()
})

test('FormField renders required asterisk', () => {
  render(<FormField label="Nom" required><input /></FormField>)
  expect(screen.getByText('*')).toBeTruthy()
})

test('TabNav renders active tab', () => {
  render(
    <TabNav tabs={[
      { href: '/commandes', label: 'Commandes', active: true },
      { href: '/factures', label: 'Factures', active: false },
    ]} />
  )
  expect(screen.getByText('Commandes')).toBeTruthy()
  expect(screen.getByText('Factures')).toBeTruthy()
})
