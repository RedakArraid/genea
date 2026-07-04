import { test, expect } from "@playwright/test"

const OWNER = { email: "test@example.com", password: "password123" }

async function clearAuth(page: import("@playwright/test").Page) {
  await page.goto("/")
  await page.evaluate(() => localStorage.clear())
}

async function login(page: import("@playwright/test").Page, creds: { email: string; password: string }) {
  await page.goto("/login")
  await page.getByLabel("Email").fill(creds.email)
  await page.getByLabel("Mot de passe").fill(creds.password)
  await page.getByRole("button", { name: "Se connecter" }).click()
  await page.waitForURL(/\/dashboard/, { timeout: 15_000 })
}

test.describe("Collaboration", () => {
  test.beforeEach(async ({ page }) => {
    await clearAuth(page)
  })

  test("page invitation invite à se connecter", async ({ page }) => {
    await page.goto("/invite/00000000-0000-0000-0000-000000000000")
    await expect(page.getByRole("link", { name: "Se connecter" })).toBeVisible({ timeout: 15_000 })
    await expect(page.getByText(/Invitation/i)).toBeVisible()
  })

  test("propriétaire ouvre dialogue partage", async ({ page }) => {
    await login(page, OWNER)
    await page.goto("/dashboard")
    await page.getByRole("link", { name: "Ma Famille" }).first().click()
    await page.waitForURL(/\/family-tree\/[a-f0-9-]+$/)

    await expect(page.getByRole("button", { name: "Partager" })).toBeVisible({ timeout: 20_000 })
    await page.getByRole("button", { name: "Partager" }).click()
    await expect(page.getByRole("heading", { name: "Partager l'arbre" })).toBeVisible()
    await expect(page.getByText("Visibilité")).toBeVisible()
  })
})
