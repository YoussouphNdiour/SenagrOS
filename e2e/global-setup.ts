import { test as setup, expect } from '@playwright/test'
import path from 'path'

const authFile = path.join(__dirname, '.auth/user.json')

setup('authenticate', async ({ page }) => {
  await page.goto('/sign-in')
  // Devise login form
  await page.locator('input[name="user[email]"], input[type="email"]').fill('ndiouryoussouph@gmail.com')
  await page.locator('input[name="user[password]"], input[type="password"]').fill('P@sser123')
  await page.locator('input[type="submit"], button[type="submit"]').click()
  // Wait for redirect to backend dashboard
  await expect(page).toHaveURL(/\/backend/, { timeout: 15000 })
  await page.context().storageState({ path: authFile })
})
