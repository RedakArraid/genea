import { defineConfig } from '@playwright/test'
export default defineConfig({
  testDir: './e2e', testMatch: 'tree-clarity.spec.ts', fullyParallel: true,
  workers: 2, retries: 0, timeout: 30000, reporter: 'list', outputDir: 'test-results/clarity',
  use: {
    baseURL: 'http://127.0.0.1:5173', browserName: 'chromium', locale: 'fr-FR',
    launchOptions: process.env.CLARITY_CHROMIUM_PATH ? { executablePath: process.env.CLARITY_CHROMIUM_PATH } : {},
    screenshot: 'only-on-failure', trace: 'retain-on-failure',
  },
  webServer: { command: 'npm --prefix frontend run preview -- --host 127.0.0.1 --port 5173', url: 'http://127.0.0.1:5173', reuseExistingServer: !process.env.CI },
})
