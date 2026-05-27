import { test, expect } from '@playwright/test'

const TS = Date.now()
const NAME = `Bœuf E2E ${TS}`
const NAME_EDITED = `Bœuf E2E Modifié ${TS}`

test.describe('Animaux', () => {
  test('liste les animaux', async ({ page }) => {
    await page.goto('/backend/animals')
    await expect(page).toHaveURL(/animals/)
    await expect(page.locator('h1').first()).toBeVisible()
  })

  test('crée un animal', async ({ page }) => {
    await page.goto('/backend/animals/new')
    await expect(page.locator('#animal-name')).toBeVisible({ timeout: 15000 })
    await page.fill('#animal-name', NAME)
    await page.fill('#animal-work-number', `A-E2E-${TS}`)
    await page.fill('#animal-variety', 'Ndama')
    await page.fill('#animal-identification', `AID-E2E-${TS}`)
    await page.fill('#animal-born-at', '2022-03-01')
    await page.fill('#animal-description', 'Animal test E2E')
    await page.click('button[type="submit"]')
    await expect(page).toHaveURL(/animals/, { timeout: 10000 })
  })

  test('affiche le détail d\'un animal', async ({ page }) => {
    await page.goto('/backend/animals')
    await page.waitForLoadState('networkidle')
    const link = page.getByText(NAME).first()
    await expect(link).toBeVisible({ timeout: 5000 })
    await link.click()
    await expect(page.getByText(NAME)).toBeVisible()
  })

  test('modifie un animal', async ({ page }) => {
    await page.goto('/backend/animals')
    await page.waitForLoadState('networkidle')
    const link = page.getByText(NAME).first()
    await expect(link).toBeVisible({ timeout: 5000 })
    await link.click()
    await page.getByRole('link', { name: /Modifier/i }).first().click()
    await expect(page.locator('#animal-name')).toBeVisible()
    await page.fill('#animal-name', NAME_EDITED)
    await page.click('button[type="submit"]')
    await expect(page).toHaveURL(/animals/)
  })

  test('supprime un animal', async ({ page }) => {
    await page.goto('/backend/animals')
    await page.waitForLoadState('networkidle')
    const link = page.getByText(NAME_EDITED).or(page.getByText(NAME)).first()
    await expect(link).toBeVisible({ timeout: 5000 })
    await link.click()
    const deleteBtn = page.getByRole('button', { name: /Supprimer/i })
    await expect(deleteBtn).toBeVisible()
    await expect(deleteBtn).toBeEnabled()
    page.on('dialog', d => d.accept())
    await deleteBtn.click()
    await expect(page).toHaveURL(/animals/, { timeout: 10000 })
  })
})
