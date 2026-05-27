import { test, expect } from '@playwright/test'

test.describe('Authentification', () => {
  test('accède au dashboard après login', async ({ page }) => {
    await page.goto('/backend')
    await expect(page).toHaveURL(/\/backend/)
    // Le storageState doit contenir la session — pas de redirect vers /sign-in
    await expect(page).not.toHaveURL(/sign-in/)
  })

  test('affiche la navigation principale', async ({ page }) => {
    await page.goto('/backend')
    // L'AppShell doit être présent
    await expect(page.locator('nav, [role="navigation"], header')).toBeVisible()
  })
})
