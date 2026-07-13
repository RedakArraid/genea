import { test, expect } from "@playwright/test"

test.describe("Responsive mobile", () => {
  test.use({ viewport: { width: 375, height: 812 } })

  test("landing, menu mobile et sections empilées", async ({ page }) => {
    await page.goto("/")
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible()
    await page.getByRole("button", { name: /menu/i }).click()
    await expect(page.getByRole("heading", { name: /geneamap/i })).toBeVisible()
    await expect(page.getByRole("link", { name: /démo|demo/i })).toBeVisible()
    await expect(page.getByRole("link", { name: /tarifs|pricing/i })).toBeVisible()
  })

  test("login, formulaire sans débordement horizontal", async ({ page }) => {
    await page.goto("/login")
    await expect(page.locator("#password")).toBeVisible()
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth)
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth)
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 1)
  })

  test("demo, canvas visible sur mobile", async ({ page }) => {
    await page.goto("/demo")
    await expect(page.locator(".tree-person-card, [class*='skeleton']").first()).toBeVisible({ timeout: 15_000 })
  })

  test("demo, menu toolbar ne crash pas sur mobile", async ({ page }) => {
    await page.goto("/demo")
    await expect(page.locator(".tree-person-card").first()).toBeVisible({ timeout: 15_000 })
    await page.getByRole("button", { name: /options de l'arbre|tree options/i }).click()
    await expect(page.getByRole("heading", { name: /options de l'arbre|tree options/i })).toBeVisible()
    await expect(page.getByRole("button", { name: /vertical/i })).toBeVisible()
    await expect(page.locator(".tree-person-card").first()).toBeVisible()
  })
})
