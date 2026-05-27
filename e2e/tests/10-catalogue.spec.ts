import { test, expect } from '@playwright/test'

test.describe('Catalogue (Produits)', () => {
  test('liste le catalogue', async ({ page }) => {
    await page.goto('/backend/products')
    await expect(page).toHaveURL(/products/)
    await expect(page.locator('h1').first()).toBeVisible()
  })

  test('accède au détail d\'un produit', async ({ page }) => {
    await page.goto('/backend/products')
    await page.waitForLoadState('networkidle')
    const firstLink = page.locator('[href*="/backend/products/"]:not([href$="/new"]):not([href*="/new?"])').first()
    await expect(firstLink).toBeVisible({ timeout: 5000 })
    await firstLink.click()
    await expect(page).toHaveURL(/products\/\d+/)
  })

  test('modifie un produit', async ({ page }) => {
    await page.goto('/backend/products')
    await page.waitForLoadState('networkidle')
    const firstLink = page.locator('[href*="/backend/products/"]:not([href$="/new"]):not([href*="/new?"])').first()
    await expect(firstLink).toBeVisible({ timeout: 5000 })
    await firstLink.click()
    const editLink = page.getByRole('link', { name: /Modifier/i })
    await expect(editLink).toBeVisible({ timeout: 5000 })
    await editLink.click()
    await expect(page.locator('#product-name')).toBeVisible()
    await page.fill('#product-description', 'Modifié par test E2E')
    await page.click('button[type="submit"]')
    await expect(page).toHaveURL(/products/)
  })

  test('bouton supprimer présent sur le détail', async ({ page }) => {
    await page.goto('/backend/products')
    await page.waitForLoadState('networkidle')
    const firstLink = page.locator('[href*="/backend/products/"]:not([href$="/new"]):not([href*="/new?"])').first()
    await expect(firstLink).toBeVisible({ timeout: 5000 })
    await firstLink.click()
    const deleteBtn = page.getByRole('button', { name: /Supprimer/i })
    await expect(deleteBtn).toBeVisible()
  })

  test('saisit un mouvement de stock', async ({ page }) => {
    await page.goto('/backend/products')
    await page.waitForLoadState('networkidle')
    const firstLink = page.locator('[href*="/backend/products/"]:not([href$="/new"]):not([href*="/new?"])').first()
    await expect(firstLink).toBeVisible({ timeout: 5000 })
    await firstLink.click()
    const mvtForm = page.getByLabel('Formulaire mouvement')
    await expect(mvtForm).toBeVisible({ timeout: 5000 })
    await page.fill('input[type="number"][step]', '5')
    await page.click('button:has-text("Enregistrer le mouvement")')
    await expect(page).toHaveURL(/products\/\d+/)
  })
})
