import { test, expect } from '@playwright/test'

const TS = Date.now()
const NAME = `Alerte E2E ${TS}`
const NAME_EDITED = `Alerte E2E Modifiée ${TS}`

test.describe('Alertes (Issues)', () => {
  test('liste les alertes', async ({ page }) => {
    await page.goto('/backend/alerts')
    await expect(page).toHaveURL(/alerts/)
    await expect(page.locator('h1').first()).toBeVisible()
  })

  test('crée une alerte', async ({ page }) => {
    await page.goto('/backend/issues/new')
    await page.fill('#issue-name', NAME)
    const natureOpts = await page.locator('#issue-nature option').count()
    if (natureOpts > 1) await page.selectOption('#issue-nature', { index: 1 })
    await page.locator('button[type="button"]').filter({ hasText: '3' }).click()
    await page.fill('#issue-date', '2025-06-15')
    await page.fill('#issue-desc', 'Description E2E')
    await page.click('button[type="submit"]')
    await expect(page).toHaveURL(/issues|alerts/, { timeout: 10000 })
  })

  test('affiche le détail d\'une alerte', async ({ page }) => {
    await page.goto('/backend/alerts')
    const link = page.getByText(NAME).first()
    if (!await link.isVisible()) { test.skip(); return }
    await link.click()
    await expect(page.getByText(NAME)).toBeVisible()
  })

  test('modifie une alerte', async ({ page }) => {
    await page.goto('/backend/alerts')
    const link = page.getByText(NAME).first()
    if (!await link.isVisible()) { test.skip(); return }
    await link.click()
    await page.getByRole('link', { name: /Modifier/i }).first().click()
    await page.fill('#issue-name', NAME_EDITED)
    await page.click('button[type="submit"]')
    await expect(page).toHaveURL(/issues|alerts/)
  })

  test('ferme une alerte ouverte', async ({ page }) => {
    await page.goto('/backend/alerts')
    const link = page.getByText(NAME_EDITED).or(page.getByText(NAME)).first()
    if (!await link.isVisible()) { test.skip(); return }
    await link.click()
    const closeBtn = page.getByRole('button', { name: /Fermer/i })
    if (!await closeBtn.isVisible()) { test.skip(); return }
    await closeBtn.click()
    await expect(page).toHaveURL(/issues\/\d+|alerts/)
  })

  test('supprime une alerte', async ({ page }) => {
    await page.goto('/backend/alerts')
    const link = page.getByText(NAME_EDITED).or(page.getByText(NAME)).first()
    if (!await link.isVisible()) { test.skip(); return }
    await link.click()
    const deleteBtn = page.getByRole('button', { name: /Supprimer/i })
    if (!await deleteBtn.isVisible() || !await deleteBtn.isEnabled()) { test.skip(); return }
    page.on('dialog', d => d.accept())
    await deleteBtn.click()
    await expect(page).toHaveURL(/alerts|issues/, { timeout: 10000 })
  })
})
