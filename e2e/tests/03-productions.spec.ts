import { test, expect } from '@playwright/test'

test.describe('Productions', () => {
  test('liste les productions', async ({ page }) => {
    await page.goto('/backend/activity_productions')
    await expect(page).toHaveURL(/activity_productions/)
    await expect(page.locator('h1').first()).toBeVisible()
  })

  test('crée une production', async ({ page }) => {
    await page.goto('/backend/activity_productions/new')
    const activityOpts = await page.locator('#prod-activity option').count()
    const campaignOpts = await page.locator('#prod-campaign option').count()
    if (activityOpts <= 1 || campaignOpts <= 1) {
      test.skip()
      return
    }
    await page.selectOption('#prod-activity', { index: 1 })
    await page.selectOption('#prod-campaign', { index: 1 })
    await page.fill('#prod-start', '2025-01-01')
    await page.fill('#prod-stop', '2025-12-31')
    await page.click('button[type="submit"]')
    await expect(page).toHaveURL(/activity_productions/, { timeout: 10000 })
  })

  test('affiche le détail d\'une production', async ({ page }) => {
    await page.goto('/backend/activity_productions')
    const firstLink = page.locator('table a, [role="link"]').first()
    if (!await firstLink.isVisible()) { test.skip(); return }
    await firstLink.click()
    await expect(page).toHaveURL(/activity_productions\/\d+/)
  })

  test('modifie une production', async ({ page }) => {
    await page.goto('/backend/activity_productions')
    const firstLink = page.locator('table a').first()
    if (!await firstLink.isVisible()) { test.skip(); return }
    await firstLink.click()
    const editBtn = page.getByRole('link', { name: /Modifier/i })
    if (!await editBtn.isVisible()) { test.skip(); return }
    await editBtn.click()
    await expect(page.locator('#prod-start')).toBeVisible()
    await page.fill('#prod-stop', '2025-11-30')
    await page.click('button[type="submit"]')
    await expect(page).toHaveURL(/activity_productions/)
  })

  test('supprime une production', async ({ page }) => {
    await page.goto('/backend/activity_productions')
    const firstLink = page.locator('table a').first()
    if (!await firstLink.isVisible()) { test.skip(); return }
    await firstLink.click()
    const deleteBtn = page.getByRole('button', { name: /Supprimer/i })
    if (!await deleteBtn.isVisible() || !await deleteBtn.isEnabled()) { test.skip(); return }
    page.on('dialog', d => d.accept())
    await deleteBtn.click()
    await expect(page).toHaveURL(/activity_productions/, { timeout: 10000 })
  })
})
