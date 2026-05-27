import { test, expect } from '@playwright/test'

test.describe('Productions', () => {
  test('liste les productions', async ({ page }) => {
    await page.goto('/backend/activity_productions')
    await expect(page).toHaveURL(/activity_productions/)
    await expect(page.locator('h1').first()).toBeVisible()
  })

  test('crée une production', async ({ page }) => {
    await page.goto('/backend/activity_productions/new')
    await expect(page.locator('#prod-activity, #prod-campaign, form')).toBeVisible({ timeout: 15000 })
    const activityOpts = await page.locator('#prod-activity option').count()
    const campaignOpts = await page.locator('#prod-campaign option').count()
    expect(activityOpts, 'Des activités doivent exister pour créer une production').toBeGreaterThan(1)
    expect(campaignOpts, 'Des campagnes doivent exister pour créer une production').toBeGreaterThan(1)
    await page.selectOption('#prod-activity', { index: 1 })
    await page.selectOption('#prod-campaign', { index: 1 })
    await page.fill('#prod-start', '2025-01-01')
    await page.fill('#prod-stop', '2025-12-31')
    await page.click('button[type="submit"]')
    await expect(page).toHaveURL(/activity_productions/, { timeout: 10000 })
  })

  test('affiche le détail d\'une production', async ({ page }) => {
    await page.goto('/backend/activity_productions')
    await page.waitForLoadState('networkidle')
    const firstLink = page.locator('table a, [role="link"], a[href*="/activity_productions/"]').first()
    await expect(firstLink).toBeVisible({ timeout: 5000 })
    await firstLink.click()
    await expect(page).toHaveURL(/activity_productions\/\d+/)
  })

  test('modifie une production', async ({ page }) => {
    await page.goto('/backend/activity_productions')
    await page.waitForLoadState('networkidle')
    const firstLink = page.locator('table a, a[href*="/activity_productions/"]').first()
    await expect(firstLink).toBeVisible({ timeout: 5000 })
    await firstLink.click()
    const editBtn = page.getByRole('link', { name: /Modifier/i })
    await expect(editBtn).toBeVisible({ timeout: 5000 })
    await editBtn.click()
    await expect(page.locator('#prod-start')).toBeVisible()
    await page.fill('#prod-stop', '2025-11-30')
    await page.click('button[type="submit"]')
    await expect(page).toHaveURL(/activity_productions/)
  })

  test('supprime une production', async ({ page }) => {
    await page.goto('/backend/activity_productions')
    await page.waitForLoadState('networkidle')
    const firstLink = page.locator('table a, a[href*="/activity_productions/"]').first()
    await expect(firstLink).toBeVisible({ timeout: 5000 })
    await firstLink.click()
    const deleteBtn = page.getByRole('button', { name: /Supprimer/i })
    await expect(deleteBtn).toBeVisible({ timeout: 5000 })
    await expect(deleteBtn).toBeEnabled()
    page.on('dialog', d => d.accept())
    await deleteBtn.click()
    await expect(page).toHaveURL(/activity_productions/, { timeout: 10000 })
  })
})
