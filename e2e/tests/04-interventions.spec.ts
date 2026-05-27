import { test, expect } from '@playwright/test'

const TS = Date.now()

test.describe('Interventions', () => {
  test('liste les interventions', async ({ page }) => {
    await page.goto('/backend/interventions')
    await expect(page).toHaveURL(/interventions/)
    await expect(page.locator('h1').first()).toBeVisible()
  })

  test('crée une intervention', async ({ page }) => {
    await page.goto('/backend/interventions/new')
    await expect(page.locator('form, #int-nature')).toBeVisible({ timeout: 15000 })
    const procedureOpts = await page.locator('#int-procedure option').count()
    if (procedureOpts > 1) {
      await page.selectOption('#int-procedure', { index: 1 })
      await page.waitForTimeout(1000)
    }
    await page.selectOption('#int-nature', 'record')
    await page.selectOption('#int-state', 'in_progress')
    await page.fill('#int-started', '2025-06-01T08:00')
    await page.fill('#int-stopped', '2025-06-01T10:00')
    await page.fill('#int-number', `INT-E2E-${TS}`)
    await page.fill('#int-desc', 'Intervention test E2E')
    await page.click('button[type="submit"]')
    await expect(page).toHaveURL(/interventions/, { timeout: 10000 })
  })

  test('affiche le détail d\'une intervention', async ({ page }) => {
    await page.goto('/backend/interventions')
    await page.waitForLoadState('networkidle')
    const firstLink = page.locator('table a, td a, a[href*="/interventions/"]').first()
    await expect(firstLink).toBeVisible({ timeout: 5000 })
    await firstLink.click()
    await expect(page).toHaveURL(/interventions\/\d+/)
  })

  test('modifie une intervention', async ({ page }) => {
    await page.goto('/backend/interventions')
    await page.waitForLoadState('networkidle')
    const firstLink = page.locator('table a, td a, a[href*="/interventions/"]').first()
    await expect(firstLink).toBeVisible({ timeout: 5000 })
    await firstLink.click()
    const editBtn = page.getByRole('link', { name: /Modifier/i })
    await expect(editBtn).toBeVisible({ timeout: 5000 })
    await editBtn.click()
    if (await page.locator('#int-desc').isVisible()) {
      await page.fill('#int-desc', 'Modifiée par E2E')
    }
    await page.click('button[type="submit"]')
    await expect(page).toHaveURL(/interventions/)
  })

  test('supprime une intervention', async ({ page }) => {
    await page.goto('/backend/interventions')
    await page.waitForLoadState('networkidle')
    const firstLink = page.locator('table a, td a, a[href*="/interventions/"]').first()
    await expect(firstLink).toBeVisible({ timeout: 5000 })
    await firstLink.click()
    const deleteBtn = page.getByRole('button', { name: /Supprimer/i })
    await expect(deleteBtn).toBeVisible({ timeout: 5000 })
    await expect(deleteBtn).toBeEnabled()
    page.on('dialog', d => d.accept())
    await deleteBtn.click()
    await expect(page).toHaveURL(/interventions/, { timeout: 10000 })
  })
})
