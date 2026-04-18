import { test, expect, Page } from '@playwright/test'

async function loginEmployee(page: Page) {
  await page.goto('/login')
  await page.fill('#password', process.env.E2E_EMPLOYEE_PASSWORD!)
  await page.click('button[type="submit"]')
  await page.waitForURL('/')
}

test.describe('Employee UI', () => {
  test.beforeEach(async ({ page }) => {
    await loginEmployee(page)
  })

  test('homepage показва заглавие и dept карти', async ({ page }) => {
    await expect(page.locator('text=Документи и процеси')).toBeVisible()
    await expect(page.locator('.grid')).toBeVisible()
  })

  test('sidebar се показва на desktop', async ({ page }) => {
    await expect(page.locator('[data-sidebar="true"]')).toBeVisible()
    await expect(page.locator('text=Начало')).toBeVisible()
  })

  test('dept карта отваря dept overview', async ({ page }) => {
    await page.locator('.grid a').first().click()
    await expect(page).toHaveURL(/\?dept=/)
  })

  test('sidebar направление expand/collapse', async ({ page }) => {
    const deptBtn = page.locator('[data-sidebar="true"] button').first()
    await deptBtn.click()
    await page.waitForTimeout(300)
    await deptBtn.click()
    await page.waitForTimeout(300)
    // Sidebar still visible after toggle
    await expect(page.locator('[data-sidebar="true"]')).toBeVisible()
  })

  test('form group view зарежда', async ({ page }) => {
    const formLink = page.locator('[data-sidebar="true"] a:has-text("Въпросници")').first()
    if (await formLink.count() === 0) return
    await formLink.click()
    await expect(page).toHaveURL(/type=form/)
  })

  test('SOP документ viewer се зарежда', async ({ page }) => {
    const sopLink = page.locator('[data-sidebar="true"] a[href*="/documents/"]').first()
    if (await sopLink.count() === 0) return
    await sopLink.click()
    await expect(page).toHaveURL(/\/documents\//)
  })

  test('мобилен hamburger отваря sidebar', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    const sidebar = page.locator('[data-sidebar="true"]')
    await expect(sidebar).not.toBeInViewport()
    await page.locator('[data-mobile-header="true"] button').click()
    await expect(sidebar).toBeInViewport()
  })

  test('logout работи', async ({ page }) => {
    await page.locator('button:has-text("Изход")').click()
    await expect(page).toHaveURL(/login/)
  })
})
