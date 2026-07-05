import { test, expect } from "@playwright/test"
import { clearAuth, loginWithPassword, TEST_USER } from "./helpers/auth"

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
    await loginWithPassword(page, TEST_USER)
    await page.goto("/dashboard")
    await page.getByRole("link", { name: /Famille|Diarrassouba|Ma Famille/i }).first().click()
    await page.waitForURL(/\/family-tree\/[a-f0-9-]+$/)

    await expect(page.getByRole("button", { name: "Partager" })).toBeVisible({ timeout: 20_000 })
    await page.getByRole("button", { name: "Partager" }).click()
    await expect(page.getByRole("heading", { name: "Partager l'arbre" })).toBeVisible()
    await expect(page.getByRole("dialog").getByText("Visibilité", { exact: true })).toBeVisible()
  })
})
