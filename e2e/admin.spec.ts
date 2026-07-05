import { test, expect } from "@playwright/test"
import { clearAuth, loginWithPassword, TEST_ADMIN, TEST_USER } from "./helpers/auth"

test.describe("Back-office admin", () => {
  test.beforeEach(async ({ page }) => {
    await clearAuth(page)
  })

  test("utilisateur non-admin redirigé depuis /admin", async ({ page }) => {
    await loginWithPassword(page, TEST_USER)
    await page.goto("/admin")
    await expect(page).toHaveURL(/\/dashboard/)
  })

  test("admin accède au dashboard", async ({ page }) => {
    await loginWithPassword(page, TEST_ADMIN)
    await page.goto("/admin")
    await expect(page.getByRole("heading", { name: "Tableau de bord" })).toBeVisible()
    await expect(page.getByText("Vue d'ensemble de la plateforme")).toBeVisible()
  })

  test("admin navigue vers utilisateurs et détail", async ({ page }) => {
    await loginWithPassword(page, TEST_ADMIN)
    await page.goto("/admin")
    await page.getByTestId("admin-nav-users").click()
    await expect(page).toHaveURL(/\/admin\/users/)
    await expect(page.getByRole("heading", { name: "Utilisateurs" })).toBeVisible()

    const userLink = page.getByRole("link", { name: TEST_USER.email })
    await expect(userLink).toBeVisible()
    await userLink.click()

    await expect(page).toHaveURL(/\/admin\/users\/[a-f0-9-]+/)
    await expect(page.getByText(TEST_USER.email)).toBeVisible()
    await page.getByTestId("admin-users-back").click()
    await expect(page).toHaveURL(/\/admin\/users/)
  })

  test("admin accède aux pages stockage, démo et forfaits", async ({ page }) => {
    await loginWithPassword(page, TEST_ADMIN)
    await page.goto("/admin")
    await page.getByTestId("admin-nav-storage").click()
    await expect(page.getByRole("heading", { name: "Stockage" })).toBeVisible()

    await page.getByTestId("admin-nav-demo").click()
    await expect(page.getByRole("heading", { name: "Arbre démo" })).toBeVisible()

    await page.getByTestId("admin-nav-plans").click()
    await expect(page.getByRole("heading", { name: "Forfaits" })).toBeVisible()
    await expect(page.getByText("Essai")).toBeVisible()
  })
})
