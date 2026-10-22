import { defineConfig } from '@playwright/test'
export default defineConfig({
  testDir: './e2e',
  testMatch: 'tree-families.spec.ts',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 40000,
  reporter: [['list']],
  outputDir: 'test-results/families',
  use: { baseURL: 'http://127.0.0.1:5173', browserName: 'chromium', locale: 'fr-FR', screenshot: 'only-on-failure', trace: 'retain-on-failure' },
  webServer: [
    { command: 'node scripts/serve-family-test-api.cjs', url: 'http://127.0.0.1:3001/health', reuseExistingServer: false },
    { command: 'npm --prefix frontend run preview -- --host 127.0.0.1 --port 5173', url: 'http://127.0.0.1:5173', reuseExistingServer: false },
  ],
})
