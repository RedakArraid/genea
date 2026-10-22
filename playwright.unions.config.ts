import { defineConfig } from '@playwright/test'
export default defineConfig({
  testDir: './e2e', testMatch: 'tree-unions.spec.ts', fullyParallel: true, workers: 2, retries: 0, timeout: 30000,
  reporter: [['list']], outputDir: 'test-results/unions',
  use: { baseURL: 'http://127.0.0.1:5173', browserName: 'chromium', locale: 'fr-FR', trace: 'retain-on-failure', screenshot: 'only-on-failure',
    launchOptions: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH } : {} },
  webServer: { command: 'npm --prefix frontend run preview -- --host 127.0.0.1 --port 5173', url: 'http://127.0.0.1:5173', reuseExistingServer: !process.env.CI },
})
