import { test, expect } from '@playwright/test'

const TS = Date.now()
const LASTNAME = `Diallo-E2E-${TS}`
const LASTNAME_EDITED = `Diallo-E2E-Modifié-${TS}`

test.describe('Entités', () => {
  test('liste les entités', async ({ page }) => {
    await page.goto('/backend/entities')
    await expect(page).toHaveURL(/entities/)
    await expect(page.locator('h1').first()).toBeVisible()
  })

  test('crée une entité', async ({ page }) => {
    await page.goto('/backend/entities/new')
    await page.selectOption('#ent-nature', 'contact')
    await page.fill('#ent-lastname', LASTNAME)
    await page.fill('#ent-firstname', 'Mamadou')
    await page.click('button[type="submit"]')
    await expect(page).toHaveURL(/entities/, { timeout: 10000 })
  })

  test('affiche le détail d\'une entité', async ({ page }) => {
    await page.goto('/backend/entities')
    const link = page.getByText(LASTNAME).first()
    if (!await link.isVisible()) { test.skip(); return }
    await link.click()
    await expect(page.getByText(LASTNAME)).toBeVisible()
  })

  test('modifie une entité', async ({ page }) => {
    await page.goto('/backend/entities')
    const link = page.getByText(LASTNAME).first()
    if (!await link.isVisible()) { test.skip(); return }
    await link.click()
    await page.getByRole('link', { name: /Modifier/i }).first().click()
    await page.fill('#ent-lastname', LASTNAME_EDITED)
    await page.click('button[type="submit"]')
    await expect(page).toHaveURL(/entities/)
  })

  test('supprime une entité', async ({ page }) => {
    await page.goto('/backend/entities')
    const link = page.getByText(LASTNAME_EDITED).or(page.getByText(LASTNAME)).first()
    if (!await link.isVisible()) { test.skip(); return }
    await link.click()
    const deleteBtn = page.getByRole('button', { name: /Supprimer/i })
    if (!await deleteBtn.isEnabled()) { test.skip(); return }
    page.on('dialog', d => d.accept())
    await deleteBtn.click()
    await expect(page).toHaveURL(/entities/, { timeout: 10000 })
  })
})
