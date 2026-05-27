import { chromium } from '@playwright/test'

export default async function globalSetup() {
  const browser = await chromium.launch({ headless: false })
  const context = await browser.newContext()
  const page = await context.newPage()

  await page.goto('http://localhost:3000/sign-in')
  await page.locator('input[name="user[email]"], input[type="email"]').fill('ndiouryoussouph@gmail.com')
  await page.locator('input[name="user[password]"], input[type="password"]').fill('P@sser123')
  await page.locator('input[type="submit"], button[type="submit"]').click()

  // Attendre le redirect vers /backend
  await page.waitForURL(/\/backend/, { timeout: 15000 })

  await context.storageState({ path: 'e2e/.auth/user.json' })
  await browser.close()
}
