import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  outputDir: 'e2e/screenshots',
  use: {
    baseURL: process.env.BASE_URL ?? 'http://localhost:3000',
    screenshot: 'only-on-failure',
    video: 'off',
    actionTimeout: 10_000,
  },
  retries: 0,
  workers: 1,
})
