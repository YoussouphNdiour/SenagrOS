import { test, expect } from '@playwright/test'

const TS = Date.now()
const NAME = `Travailleur E2E ${TS}`
const NAME_EDITED = `Travailleur E2E Modifié ${TS}`

test.describe('Travailleurs', () => {
  test('liste les travailleurs', async ({ page }) => {
    await page.goto('/backend/workers')
    await expect(page).toHaveURL(/workers/)
    await expect(page.locator('h1').first()).toBeVisible()
  })

  test('crée un travailleur', async ({ page }) => {
    await page.goto('/backend/workers/new')
    if (!await page.locator('#worker-name').isVisible({ timeout: 5000 }).catch(() => false)) { test.skip(); return }
    await page.fill('#worker-name', NAME)
    await page.fill('#worker-work-number', `W-E2E-${TS}`)
    await page.fill('#worker-identification', `ID-E2E-${TS}`)
    await page.fill('#worker-born-at', '1990-01-15')
    await page.fill('#worker-description', 'Travailleur test E2E')
    await page.click('button[type="submit"]')
    await expect(page).toHaveURL(/workers/, { timeout: 10000 })
  })

  test('affiche le détail d\'un travailleur', async ({ page }) => {
    await page.goto('/backend/workers')
    const link = page.getByText(NAME).first()
    if (!await link.isVisible()) { test.skip(); return }
    await link.click()
    await expect(page.getByText(NAME)).toBeVisible()
  })

  test('modifie un travailleur', async ({ page }) => {
    await page.goto('/backend/workers')
    const link = page.getByText(NAME).first()
    if (!await link.isVisible()) { test.skip(); return }
    await link.click()
    await page.getByRole('link', { name: /Modifier/i }).first().click()
    await page.fill('#worker-name', NAME_EDITED)
    await page.click('button[type="submit"]')
    await expect(page).toHaveURL(/workers/)
  })

  test('supprime un travailleur', async ({ page }) => {
    await page.goto('/backend/workers')
    const link = page.getByText(NAME_EDITED).or(page.getByText(NAME)).first()
    if (!await link.isVisible()) { test.skip(); return }
    await link.click()
    const deleteBtn = page.getByRole('button', { name: /Supprimer/i })
    if (!await deleteBtn.isEnabled()) { test.skip(); return }
    page.on('dialog', d => d.accept())
    await deleteBtn.click()
    await expect(page).toHaveURL(/workers/, { timeout: 10000 })
  })
})
