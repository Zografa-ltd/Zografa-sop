import { test, expect, Page } from '@playwright/test'

async function loginAdmin(page: Page) {
  await page.goto('/login')
  await page.fill('#password', process.env.E2E_ADMIN_PASSWORD!)
  await page.click('button[type="submit"]')
  await page.waitForURL('/admin')
}

test.describe('Admin панел', () => {
  test.beforeEach(async ({ page }) => {
    await loginAdmin(page)
  })

  test('таблицата с документи се зарежда', async ({ page }) => {
    await expect(page.locator('table')).toBeVisible()
    await expect(page.locator('tbody tr').first()).toBeVisible()
  })

  test('header показва брой документи', async ({ page }) => {
    await expect(page.locator('text=/\\d+ документа?/')).toBeVisible()
  })

  test('линк към upload страница', async ({ page }) => {
    await page.click('a:has-text("Качи документ")')
    await page.waitForURL('/admin/upload')
    await expect(page.locator('text=Качи документ')).toBeVisible()
  })

  test('upload страница — двата режима', async ({ page }) => {
    await page.goto('/admin/upload')
    await expect(page.locator('text=Формуляр (HTML)')).toBeVisible()
    await expect(page.locator('text=SOP / Имейл (AI)')).toBeVisible()
  })

  test('publish/unpublish toggle сменя статуса', async ({ page }) => {
    const toggleBtn = page.locator('button:has-text("Публикувай"), button:has-text("Скрий")').first()
    const before = await toggleBtn.textContent()
    await toggleBtn.click()
    await page.waitForTimeout(1500)
    const after = await toggleBtn.textContent()
    expect(after).not.toBe(before)
  })

  test('линк към продуктови модели', async ({ page }) => {
    await page.click('a:has-text("Продуктови модели")')
    await page.waitForURL('/admin/product-models')
    await expect(page.locator('text=Продуктови модели')).toBeVisible()
  })

  test('product-models — направленията се показват', async ({ page }) => {
    await page.goto('/admin/product-models')
    await expect(page.locator('text=Продажби')).toBeVisible()
    await expect(page.locator('text=Логистика')).toBeVisible()
    await expect(page.locator('text=Рекламации')).toBeVisible()
  })

  test('product-models — добавяне и изтриване на модел', async ({ page }) => {
    await page.goto('/admin/product-models')
    await page.locator('button:has-text("+ Добави модел")').first().click()
    await page.fill('input[placeholder="Име на модела"]', 'Автотест Модел')
    await page.click('button:has-text("Добави")')
    await expect(page.locator('text=Автотест Модел')).toBeVisible()
    page.on('dialog', dialog => dialog.accept())
    await page.locator('button[title="Изтрий"]').last().click()
    await expect(page.locator('text=Автотест Модел')).not.toBeVisible()
  })

  test('document edit страница се зарежда', async ({ page }) => {
    await page.locator('a:has-text("Редактирай")').first().click()
    await expect(page.locator('text=Редактирай документ')).toBeVisible()
    await expect(page.locator('input[type="text"]')).toBeVisible()
  })
})
