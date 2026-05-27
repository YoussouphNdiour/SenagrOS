import { test, expect } from '@playwright/test'

const TS = Date.now()
const NAME = `Champ Test E2E ${TS}`
const NAME_EDITED = `Champ Test E2E Modifié ${TS}`
let parcelleUrl = ''

test.describe('Parcelles', () => {
  test('liste les parcelles', async ({ page }) => {
    await page.goto('/backend/cultivable-zones')
    await expect(page).toHaveURL(/cultivable-zones/)
    await expect(page.locator('h1, [data-testid="page-title"]').first()).toBeVisible()
  })

  test('crée une parcelle', async ({ page }) => {
    await page.goto('/backend/cultivable-zones/new')
    await expect(page.locator('#parcelle-name')).toBeVisible({ timeout: 15000 })
    await page.fill('#parcelle-name', NAME)
    await page.fill('#parcelle-work-number', `P-E2E-${TS}`)
    await page.fill('#parcelle-description', 'Description créée par test E2E')
    await page.click('button[type="submit"]')
    await expect(page).toHaveURL(/cultivable-zones/, { timeout: 10000 })
    parcelleUrl = page.url()
  })

  test('affiche le détail d\'une parcelle', async ({ page }) => {
    if (parcelleUrl && !parcelleUrl.endsWith('/cultivable-zones')) {
      await page.goto(parcelleUrl)
    } else {
      await page.goto('/backend/cultivable-zones')
      await page.waitForLoadState('networkidle')
      const link = page.locator('a', { hasText: NAME }).first()
      await expect(link).toBeVisible({ timeout: 5000 })
      await link.click()
    }
    await page.waitForLoadState('networkidle')
    await expect(page.getByText(NAME)).toBeVisible()
  })

  test('modifie une parcelle', async ({ page }) => {
    await page.goto('/backend/cultivable-zones')
    await page.waitForLoadState('networkidle')
    const link = page.locator('a', { hasText: NAME }).first()
    await expect(link).toBeVisible({ timeout: 5000 })
    await link.click()
    await page.waitForLoadState('networkidle')
    await page.getByRole('link', { name: /Modifier/i }).first().click()
    await expect(page.locator('#parcelle-name')).toBeVisible()
    await page.fill('#parcelle-name', NAME_EDITED)
    await page.click('button[type="submit"]')
    await expect(page).toHaveURL(/cultivable-zones/)
  })

  test('supprime une parcelle', async ({ page }) => {
    await page.goto('/backend/cultivable-zones')
    await page.waitForLoadState('networkidle')
    const link = page.locator('a', { hasText: NAME_EDITED }).or(page.locator('a', { hasText: NAME })).first()
    await expect(link).toBeVisible({ timeout: 5000 })
    await link.click()
    await page.waitForLoadState('networkidle')
    const deleteBtn = page.getByRole('button', { name: /Supprimer/i })
    await expect(deleteBtn).toBeVisible()
    await expect(deleteBtn).toBeEnabled()
    page.on('dialog', d => d.accept())
    await deleteBtn.click()
    await expect(page).toHaveURL(/cultivable-zones/, { timeout: 10000 })
  })
})
