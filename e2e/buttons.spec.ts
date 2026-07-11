import { test, expect } from "@playwright/test"
import { clearAuth, getFirstTreeId, loginWithPassword, TEST_ADMIN, TEST_USER } from "./helpers/auth"

test.describe("Boutons — parcours principal", () => {
  test.beforeEach(async ({ page }) => {
    page.on("dialog", (d) => d.dismiss())
    await clearAuth(page)
  })

  test("connexion et inscription — liens", async ({ page }) => {
    await page.goto("/login")
    await expect(page.locator("#login")).toBeVisible()
    await expect(page.locator("#password")).toBeVisible()
    await page.getByRole("link", { name: /inscri|sign up|register/i }).click()
    await expect(page).toHaveURL(/\/register/)
    await page.getByRole("link", { name: /connexion|log in|sign in/i }).click()
    await expect(page).toHaveURL(/\/login/)
  })

  test("tableau de bord — nouvel arbre", async ({ page }) => {
    await loginWithPassword(page, TEST_USER)
    await page.getByRole("button", { name: "Nouvel arbre" }).click()
    await expect(page.getByRole("dialog")).toBeVisible()
    await page.getByRole("button", { name: "Annuler" }).click()
  })

  test("arbre — toolbar et panneau latéral", async ({ page }) => {
    await loginWithPassword(page, TEST_USER)
    const treeId = await getFirstTreeId(page)
    await page.goto(`/family-tree/${treeId}`)
    await expect(page.locator(".tree-person-card").first()).toBeVisible({ timeout: 20_000 })

    for (const label of ["Réorganiser", "Partager", "Ajouter", "+", "−", "Centrer l'arbre"]) {
      await page.getByRole("button", { name: label }).first().click()
      await page.keyboard.press("Escape")
    }

    await page.locator(".tree-person-card").first().click()
    const sidePanel = page.locator(".w-80.shrink-0")
    await expect(sidePanel.getByTestId("edit-first-name")).toBeVisible()
    await expect(sidePanel.getByTestId("save-person-btn")).toBeVisible()
    await sidePanel.getByRole("button", { name: "Centrer" }).click()
  })

  test("navigation — profil, chronologie, correspondances", async ({ page }) => {
    await loginWithPassword(page, TEST_USER)
    const treeId = await getFirstTreeId(page)

    await page.getByRole("link", { name: "Mon profil" }).click()
    await expect(page).toHaveURL(/\/profile/)

    await page.getByRole("link", { name: "Chronologie" }).click()
    await expect(page).toHaveURL(new RegExp(`/family-tree/${treeId}/timeline`))

    await page.getByRole("link", { name: "Correspondances" }).click()
    await expect(page).toHaveURL(new RegExp(`/family-tree/${treeId}/matches`))
  })

  test("accueil public — liens principaux", async ({ page }) => {
    await page.goto("/")
    await page.getByRole("link", { name: /Commencer|Créer|Create|Sign up|Get started/i }).first().click()
    await expect(page).toHaveURL(/\/(register|login)/)
    await page.goto("/demo")
    await expect(page.locator(".tree-person-card, [class*='skeleton']").first()).toBeVisible({
      timeout: 20_000,
    })
  })

  test("tarifs — bouton forfait actuel désactivé", async ({ page }) => {
    await loginWithPassword(page, TEST_USER)
    await page.goto("/pricing")
    const currentPlan = page.getByRole("button", { name: "Forfait actuel" })
    if (await currentPlan.count()) {
      await expect(currentPlan.first()).toBeDisabled()
    }
  })
})

test.describe("Boutons — admin", () => {
  test.beforeEach(async ({ page }) => {
    page.on("dialog", (d) => d.dismiss())
    await clearAuth(page)
    await loginWithPassword(page, TEST_ADMIN)
  })

  test("sidebar admin — liens uniques via data-testid", async ({ page }) => {
    await page.goto("/admin")
    const navItems = ["dashboard", "users", "trees", "storage", "demo", "plans", "promo"]
    for (const id of navItems) {
      await page.getByTestId(`admin-nav-${id}`).click()
      await expect(page.getByTestId(`admin-nav-${id}`)).toBeVisible()
    }
  })

  test("dashboard admin — raccourcis", async ({ page }) => {
    await page.goto("/admin")
    await page.getByTestId("admin-dashboard-manage-users").click()
    await expect(page).toHaveURL(/\/admin\/users/)
    await expect(page.getByRole("heading", { name: "Utilisateurs" })).toBeVisible()
  })
})
