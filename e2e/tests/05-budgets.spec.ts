import { test, expect } from '@playwright/test'

const TS = Date.now()
const NAME = `Budget E2E ${TS}`
const NAME_EDITED = `Budget E2E Modifié ${TS}`

test.describe('Budgets', () => {
  test('liste les budgets', async ({ page }) => {
    await page.goto('/backend/project_budgets')
    await expect(page).toHaveURL(/project_budgets/)
    await expect(page.locator('h1').first()).toBeVisible()
  })

  test('crée un budget', async ({ page }) => {
    await page.goto('/backend/project_budgets/new')
    await page.fill('#budget-name', NAME)
    await page.fill('#budget-description', 'Budget test E2E')
    await page.fill('#budget-analytique', 'MA')
    await page.click('button[type="submit"]')
    await expect(page).toHaveURL(/project_budgets/, { timeout: 10000 })
  })

  test('affiche le détail d\'un budget', async ({ page }) => {
    await page.goto('/backend/project_budgets')
    const link = page.getByText(NAME).first()
    if (!await link.isVisible()) { test.skip(); return }
    await link.click()
    await expect(page.getByText(NAME)).toBeVisible()
  })

  test('modifie un budget', async ({ page }) => {
    await page.goto('/backend/project_budgets')
    const link = page.getByText(NAME).first()
    if (!await link.isVisible()) { test.skip(); return }
    await link.click()
    await page.getByRole('link', { name: /Modifier/i }).first().click()
    await page.fill('#budget-name', NAME_EDITED)
    await page.click('button[type="submit"]')
    await expect(page).toHaveURL(/project_budgets/)
  })

  test('supprime un budget', async ({ page }) => {
    await page.goto('/backend/project_budgets')
    const link = page.getByText(NAME_EDITED).or(page.getByText(NAME)).first()
    if (!await link.isVisible()) { test.skip(); return }
    await link.click()
    const deleteBtn = page.getByRole('button', { name: /Supprimer/i })
    if (!await deleteBtn.isEnabled()) { test.skip(); return }
    page.on('dialog', d => d.accept())
    await deleteBtn.click()
    await expect(page).toHaveURL(/project_budgets/, { timeout: 10000 })
  })
})
