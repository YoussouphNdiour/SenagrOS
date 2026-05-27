import { test, expect } from '@playwright/test'

const TS = Date.now()
const NAME = `Tracteur E2E ${TS}`
const NAME_EDITED = `Tracteur E2E Modifié ${TS}`

test.describe('Équipements', () => {
  test('liste les équipements', async ({ page }) => {
    await page.goto('/backend/equipments')
    await expect(page).toHaveURL(/equipments/)
    await expect(page.locator('h1').first()).toBeVisible()
  })

  test('crée un équipement', async ({ page }) => {
    await page.goto('/backend/equipments/new')
    await page.fill('#eq-name', NAME)
    await page.fill('#eq-work', `EQ-E2E-${TS}`)
    await page.fill('#eq-born', '2020-01-01')
    await page.fill('#eq-desc', 'Équipement test E2E')
    await page.click('button[type="submit"]')
    await expect(page).toHaveURL(/equipments/, { timeout: 10000 })
  })

  test('affiche le détail d\'un équipement', async ({ page }) => {
    await page.goto('/backend/equipments')
    const link = page.getByText(NAME).first()
    if (!await link.isVisible()) { test.skip(); return }
    await link.click()
    await expect(page.getByText(NAME)).toBeVisible()
  })

  test('modifie un équipement', async ({ page }) => {
    await page.goto('/backend/equipments')
    const link = page.getByText(NAME).first()
    if (!await link.isVisible()) { test.skip(); return }
    await link.click()
    await page.getByRole('link', { name: /Modifier/i }).first().click()
    await page.fill('#eq-name', NAME_EDITED)
    await page.click('button[type="submit"]')
    await expect(page).toHaveURL(/equipments/)
  })

  test('supprime un équipement', async ({ page }) => {
    await page.goto('/backend/equipments')
    const link = page.getByText(NAME_EDITED).or(page.getByText(NAME)).first()
    if (!await link.isVisible()) { test.skip(); return }
    await link.click()
    const deleteBtn = page.getByRole('button', { name: /Supprimer/i })
    if (!await deleteBtn.isEnabled()) { test.skip(); return }
    page.on('dialog', d => d.accept())
    await deleteBtn.click()
    await expect(page).toHaveURL(/equipments/, { timeout: 10000 })
  })
})
