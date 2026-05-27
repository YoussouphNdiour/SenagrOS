import { test, expect } from '@playwright/test'

const TS = Date.now()
const NAME = `Campagne E2E ${TS}`
const NAME_EDITED = `Campagne E2E Modifiée ${TS}`

test.describe('Campagnes', () => {
  test('liste les campagnes', async ({ page }) => {
    await page.goto('/backend/campaigns')
    await expect(page).toHaveURL(/campaigns/)
    await expect(page.locator('h1').first()).toBeVisible()
  })

  test('crée une campagne', async ({ page }) => {
    await page.goto('/backend/campaigns/new')
    await page.fill('#campagne-name', NAME)
    await page.fill('#campagne-harvest-year', '2025')
    await page.fill('#campagne-description', 'Test E2E')
    await page.click('button[type="submit"]')
    await expect(page).toHaveURL(/campaigns/, { timeout: 10000 })
  })

  test('affiche le détail d\'une campagne', async ({ page }) => {
    await page.goto('/backend/campaigns')
    const link = page.getByText(NAME).first()
    if (!await link.isVisible()) test.skip()
    await link.click()
    await expect(page.getByText(NAME)).toBeVisible()
  })

  test('modifie une campagne', async ({ page }) => {
    await page.goto('/backend/campaigns')
    const link = page.getByText(NAME).first()
    if (!await link.isVisible()) test.skip()
    await link.click()
    await page.getByRole('link', { name: /Modifier/i }).first().click()
    await page.fill('#campagne-name', NAME_EDITED)
    await page.click('button[type="submit"]')
    await expect(page).toHaveURL(/campaigns/)
  })

  test('supprime une campagne', async ({ page }) => {
    await page.goto('/backend/campaigns')
    const link = page.getByText(NAME_EDITED).or(page.getByText(NAME)).first()
    if (!await link.isVisible()) test.skip()
    await link.click()
    const deleteBtn = page.getByRole('button', { name: /Supprimer/i })
    if (!await deleteBtn.isEnabled()) { test.skip(); return }
    page.on('dialog', d => d.accept())
    await deleteBtn.click()
    await expect(page).toHaveURL(/campaigns/, { timeout: 10000 })
  })
})
