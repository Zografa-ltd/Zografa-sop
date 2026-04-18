import { test, expect } from '@playwright/test'

test.describe('Автентикация', () => {
  test('служител влиза и вижда homepage', async ({ page }) => {
    await page.goto('/login')
    await page.fill('#password', process.env.E2E_EMPLOYEE_PASSWORD!)
    await page.click('button[type="submit"]')
    await page.waitForURL('/')
    await expect(page.locator('text=Документи и процеси')).toBeVisible()
  })

  test('администратор влиза и вижда admin панел', async ({ page }) => {
    await page.goto('/login')
    await page.fill('#password', process.env.E2E_ADMIN_PASSWORD!)
    await page.click('button[type="submit"]')
    await page.waitForURL('/admin')
    await expect(page.locator('text=Admin панел')).toBeVisible()
  })

  test('грешна парола показва грешка', async ({ page }) => {
    await page.goto('/login')
    await page.fill('#password', 'wrong-password-xyz-123')
    await page.click('button[type="submit"]')
    await expect(page.locator('.bg-red-50')).toBeVisible()
  })

  test('неавтентикиран достъп пренасочва към login', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveURL(/login/)
  })

  test('неавтентикиран достъп до admin пренасочва към login', async ({ page }) => {
    await page.goto('/admin')
    await expect(page).toHaveURL(/login/)
  })
})
