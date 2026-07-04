import { test, expect } from "@playwright/test"

const ADMIN = { email: "admin@geneaia.app", password: "password123" }
const USER = { email: "test@example.com", password: "password123" }

async function login(page: import("@playwright/test").Page, creds: { email: string; password: string }) {
  await page.goto("/login")
  await page.getByLabel("Email").fill(creds.email)
  await page.getByLabel("Mot de passe").fill(creds.password)
  await page.getByRole("button", { name: "Se connecter" }).click()
  await page.waitForURL(/\/dashboard/, { timeout: 15_000 })
}

test.describe("Back-office admin", () => {
  test("utilisateur non-admin redirigé depuis /admin", async ({ page }) => {
    await login(page, USER)
    await page.goto("/admin")
    await expect(page).toHaveURL(/\/dashboard/)
  })

  test("admin accède au dashboard", async ({ page }) => {
    await login(page, ADMIN)
    await page.goto("/admin")
    await expect(page.getByRole("heading", { name: "Tableau de bord" })).toBeVisible()
    await expect(page.getByText("Vue d'ensemble de la plateforme")).toBeVisible()
  })

  test("admin navigue vers utilisateurs et détail", async ({ page }) => {
    await login(page, ADMIN)
    await page.goto("/admin/users")
    await expect(page.getByRole("heading", { name: "Utilisateurs" })).toBeVisible()

    const userLink = page.getByRole("link", { name: USER.email })
    await expect(userLink).toBeVisible()
    await userLink.click()

    await expect(page).toHaveURL(/\/admin\/users\/[a-f0-9-]+/)
    await expect(page.getByText(USER.email)).toBeVisible()
    await expect(page.getByRole("heading", { name: /Utilisateur Test|test@example.com/i })).toBeVisible()
  })

  test("admin accède aux pages stockage, démo et forfaits", async ({ page }) => {
    await login(page, ADMIN)
    await page.goto("/admin/storage")
    await expect(page.getByRole("heading", { name: "Stockage" })).toBeVisible()

    await page.goto("/admin/demo")
    await expect(page.getByRole("heading", { name: "Arbre démo" })).toBeVisible()

    await page.goto("/admin/plans")
    await expect(page.getByRole("heading", { name: "Forfaits" })).toBeVisible()
    await expect(page.getByText("Solo")).toBeVisible()
  })
})
