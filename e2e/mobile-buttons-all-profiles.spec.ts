import { test, expect, type Page } from "@playwright/test"
import {
  clearAuth,
  getFirstTreeId,
  getPatrimonyTreeId,
  loginWithPassword,
  PATRIMONY_USER,
  TEST_ADMIN,
  TEST_USER,
} from "./helpers/auth"

const INACTIVE_USER = {
  phone: "0700000004",
  email: "testeur@geneamap.com",
  password: "password123",
}

test.describe("Mobile, tous profils, boutons sans crash", () => {
  test.use({ viewport: { width: 375, height: 812 } })

  test.beforeEach(async ({ page }) => {
    page.on("dialog", (d) => d.dismiss())
  })

  async function assertAppAlive(page: Page) {
    const count = await page.evaluate(() => document.getElementById("root")?.childElementCount ?? 0)
    expect(count).toBeGreaterThan(0)
  }

  async function openMarketingMenu(page: Page) {
    await page.getByRole("button", { name: /^menu$/i }).click()
    await expect(page.getByRole("heading", { name: /geneamap/i })).toBeVisible()
  }

  async function closeTopSheet(page: Page) {
    const close = page.getByRole("button", { name: /^close$/i })
    if (await close.isVisible()) {
      await close.click()
      return
    }
    await page.keyboard.press("Escape")
  }

  async function openTreeToolbar(page: Page) {
    await page.getByRole("button", { name: /options de l'arbre|tree options/i }).click()
    await expect(page.getByRole("heading", { name: /options de l'arbre|tree options/i })).toBeVisible()
  }

  async function openAppSidebar(page: Page) {
    await page.locator('[data-sidebar="trigger"]').click()
    await expect(page.getByRole("link", { name: /tableau de bord|dashboard/i })).toBeVisible()
  }

  async function getTreeIdFromDashboard(page: Page, namePattern: RegExp): Promise<string> {
    await page.goto("/dashboard")
    await page.locator('[data-sidebar="trigger"]').click()
    const href = await page.getByRole("link", { name: namePattern }).first().getAttribute("href")
    const treeId = href?.match(/family-tree\/([^/]+)/)?.[1]
    if (!treeId) throw new Error(`Arbre introuvable pour ${namePattern}`)
    return treeId
  }

  test("visiteur, accueil et démo", async ({ page }) => {
    await clearAuth(page)

    await page.goto("/")
    await assertAppAlive(page)
    await openMarketingMenu(page)
    await expect(page.getByRole("link", { name: /démo|demo/i })).toBeVisible()
    await closeTopSheet(page)
    await assertAppAlive(page)

    await page.goto("/demo")
    await expect(page.locator(".tree-person-card").first()).toBeVisible({ timeout: 20_000 })

    await openMarketingMenu(page)
    await closeTopSheet(page)
    await assertAppAlive(page)

    await openTreeToolbar(page)
    for (const label of [/vertical/i, /horizontal/i, /radial/i, /centrer/i, /paramètres/i]) {
      await expect(page.getByRole("button", { name: label }).first()).toBeVisible()
    }
    await closeTopSheet(page)
    await assertAppAlive(page)

    await page.getByRole("button", { name: "+" }).click()
    await page.getByRole("button", { name: "−" }).click()
    await page.getByRole("button", { name: /centrer l'arbre|center the tree/i }).click()
    await assertAppAlive(page)

    await page.locator(".tree-person-card").first().click()
    await expect(page.getByTestId("edit-first-name")).toBeVisible()
    await page.getByRole("button", { name: /^close$/i }).click()
    await assertAppAlive(page)
  })

  test("SOLO, dashboard et arbre", async ({ page }) => {
    await clearAuth(page)
    await loginWithPassword(page, TEST_USER)
    await assertAppAlive(page)

    await openAppSidebar(page)
    await page.getByRole("link", { name: /mon profil|my profile/i }).click()
    await expect(page).toHaveURL(/\/profile/)
    await assertAppAlive(page)

    const treeId = await getTreeIdFromDashboard(page, /ma famille|my family|famille/i)
    await page.goto(`/family-tree/${treeId}`)
    await expect(page.locator(".tree-person-card").first()).toBeVisible({ timeout: 20_000 })

    await openTreeToolbar(page)
    await expect(page.getByRole("button", { name: /partager|share/i })).toBeVisible()
    await expect(page.getByRole("button", { name: /ajouter|add/i })).toBeVisible()
    await page.getByRole("button", { name: /partager|share/i }).click()
    await expect(page.getByRole("dialog")).toBeVisible()
    await page.keyboard.press("Escape")
    await assertAppAlive(page)

    await openTreeToolbar(page)
    await page.getByRole("button", { name: /ajouter|add/i }).click()
    await expect(page.getByRole("dialog")).toBeVisible()
    await page.keyboard.press("Escape")
    await assertAppAlive(page)

    await page.locator(".tree-person-card").first().click()
    await expect(page.getByTestId("edit-first-name")).toBeVisible()
    await page.getByRole("button", { name: /centrer|center/i }).click()
    await page.getByTestId("child-add-menu-compact").click()
    await expect(page.getByTestId("child-add-new")).toBeVisible()
    await page.keyboard.press("Escape")
    await assertAppAlive(page)
    await page.getByRole("button", { name: /^close$/i }).click()
  })

  test("Patrimoine, import/export GEDCOM", async ({ page }) => {
    await clearAuth(page)
    await loginWithPassword(page, PATRIMONY_USER)
    const treeId = await getTreeIdFromDashboard(page, /traoré|traore/i)
    await page.goto(`/family-tree/${treeId}`)
    await expect(page.locator(".tree-person-card").first()).toBeVisible({ timeout: 25_000 })

    await openTreeToolbar(page)
    await expect(page.getByRole("button", { name: /gedcom/i }).first()).toBeVisible()
    await page.getByRole("button", { name: /paramètres|settings/i }).click()
    await expect(page.getByRole("dialog")).toBeVisible()
    await page.keyboard.press("Escape")
    await assertAppAlive(page)
  })

  test("plan inactif, accès limité sans crash", async ({ page }) => {
    await clearAuth(page)
    await loginWithPassword(page, INACTIVE_USER)
    await assertAppAlive(page)
    await page.goto("/pricing")
    await assertAppAlive(page)
    await expect(page.getByRole("heading", { name: /tarif|pricing|forfait|plan/i }).first()).toBeVisible()
  })

  test("admin, sidebar mobile et navigation", async ({ page }) => {
    await clearAuth(page)
    await loginWithPassword(page, TEST_ADMIN)
    await openAppSidebar(page)
    await page.getByRole("link", { name: /admin/i }).click()
    await expect(page).toHaveURL(/\/admin/)
    await assertAppAlive(page)

    await page.locator('[data-sidebar="trigger"]').click()
    for (const id of ["dashboard", "users", "trees", "plans"]) {
      await page.getByTestId(`admin-nav-${id}`).click()
      await assertAppAlive(page)
    }
  })
})
