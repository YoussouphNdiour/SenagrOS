import { test, expect } from '@playwright/test'

test.describe('Factures d\'achat', () => {
  test('liste les factures', async ({ page }) => {
    await page.goto('/backend/purchase_invoices')
    await expect(page).toHaveURL(/purchase_invoices/)
    await expect(page.locator('h1').first()).toBeVisible()
  })

  test('accède à la page de création', async ({ page }) => {
    await page.goto('/backend/purchase_invoices/new')
    await expect(page).toHaveURL(/purchase_invoices\/new/)
    await expect(page.locator('form')).toBeVisible()
  })

  test('affiche le détail d\'une facture', async ({ page }) => {
    await page.goto('/backend/purchase_invoices')
    const firstLink = page.locator('table a, td a').first()
    if (!await firstLink.isVisible()) { test.skip(); return }
    await firstLink.click()
    await expect(page).toHaveURL(/purchase_invoices\/\d+/)
  })

  test('supprime une facture', async ({ page }) => {
    await page.goto('/backend/purchase_invoices')
    const firstLink = page.locator('table a, td a').first()
    if (!await firstLink.isVisible()) { test.skip(); return }
    await firstLink.click()
    const deleteBtn = page.getByRole('button', { name: /Supprimer/i })
    if (!await deleteBtn.isVisible() || !await deleteBtn.isEnabled()) { test.skip(); return }
    page.on('dialog', d => d.accept())
    await deleteBtn.click()
    await expect(page).toHaveURL(/purchase_invoices/, { timeout: 10000 })
  })
})
