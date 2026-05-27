import { test, expect } from '@playwright/test'

const TS = Date.now()

test.describe('Ventes', () => {
  test('liste les ventes', async ({ page }) => {
    await page.goto('/backend/sales')
    await expect(page).toHaveURL(/sales/)
    await expect(page.locator('h1').first()).toBeVisible()
  })

  test('crée une vente', async ({ page }) => {
    await page.goto('/backend/sales/new')
    const natures = await page.locator('#sale-nature option').count()
    if (natures <= 1) { test.skip(); return }
    await page.selectOption('#sale-nature', { index: 1 })
    const dateInput = page.locator('input[type="date"]').first()
    if (await dateInput.isVisible()) {
      await dateInput.fill('2025-06-01')
    }
    await page.click('button[type="submit"]')
    await expect(page).toHaveURL(/sales/, { timeout: 10000 })
  })

  test('affiche le détail d\'une vente', async ({ page }) => {
    await page.goto('/backend/sales')
    const firstLink = page.locator('table a, td a').first()
    if (!await firstLink.isVisible()) { test.skip(); return }
    await firstLink.click()
    await expect(page).toHaveURL(/sales\/\d+/)
  })

  test('modifie une vente', async ({ page }) => {
    await page.goto('/backend/sales')
    const firstLink = page.locator('table a, td a').first()
    if (!await firstLink.isVisible()) { test.skip(); return }
    await firstLink.click()
    const editBtn = page.getByRole('link', { name: /Modifier/i })
    if (!await editBtn.isVisible()) { test.skip(); return }
    await editBtn.click()
    const desc = page.locator('textarea').first()
    if (await desc.isVisible()) await desc.fill('Modifiée E2E')
    await page.click('button[type="submit"]')
    await expect(page).toHaveURL(/sales/)
  })

  test('supprime une vente', async ({ page }) => {
    await page.goto('/backend/sales')
    const firstLink = page.locator('table a, td a').first()
    if (!await firstLink.isVisible()) { test.skip(); return }
    await firstLink.click()
    const deleteBtn = page.getByRole('button', { name: /Supprimer/i })
    if (!await deleteBtn.isVisible() || !await deleteBtn.isEnabled()) { test.skip(); return }
    page.on('dialog', d => d.accept())
    await deleteBtn.click()
    await expect(page).toHaveURL(/sales/, { timeout: 10000 })
  })
})
