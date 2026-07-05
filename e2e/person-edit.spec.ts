import { test, expect } from "@playwright/test"
import { clearAuth, getFirstTreeId, loginWithPassword, TEST_USER } from "./helpers/auth"
import path from "node:path"
import fs from "node:fs"

const FIXTURE_PNG = path.join(__dirname, "fixtures", "test-photo.png")

test.describe("Édition fiche personne", () => {
  test.beforeAll(() => {
    fs.mkdirSync(path.dirname(FIXTURE_PNG), { recursive: true })
    if (!fs.existsSync(FIXTURE_PNG)) {
      // PNG 1x1 minimal
      const png = Buffer.from(
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
        "base64"
      )
      fs.writeFileSync(FIXTURE_PNG, png)
    }
  })

  test.beforeEach(async ({ page }) => {
    page.on("dialog", (d) => d.dismiss())
    await clearAuth(page)
    await loginWithPassword(page, TEST_USER)
  })

  test("modifie le prénom directement dans le panneau latéral", async ({ page }) => {
    const treeId = await getFirstTreeId(page)
    await page.goto(`/family-tree/${treeId}`)
    await expect(page.locator(".tree-person-card").first()).toBeVisible({ timeout: 20_000 })

    await expect(page.getByText("Mode lecture seule")).not.toBeVisible()

    await page.locator(".tree-person-card").first().click()
    const sidePanel = page.locator(".w-80.shrink-0")
    await expect(sidePanel.getByTestId("edit-first-name")).toBeVisible()
    const newName = `Test${Date.now().toString().slice(-4)}`
    await sidePanel.getByTestId("edit-first-name").fill(newName)
    await sidePanel.getByTestId("save-person-btn").click()

    await expect(page.getByText("Personne mise à jour")).toBeVisible({ timeout: 10_000 })
    await expect(sidePanel.getByTestId("edit-first-name")).toHaveValue(newName)
  })

  test("change la photo depuis le panneau latéral", async ({ page }) => {
    const treeId = await getFirstTreeId(page)
    await page.goto(`/family-tree/${treeId}`)
    await expect(page.locator(".tree-person-card").first()).toBeVisible({ timeout: 20_000 })

    await page.locator(".tree-person-card").first().click()
    const sidePanel = page.locator(".w-80.shrink-0")
    await expect(sidePanel.getByRole("button", { name: "Changer photo" })).toBeVisible()

    const fileInput = sidePanel.locator('input[type="file"][accept="image/*"]')
    await fileInput.setInputFiles(FIXTURE_PNG)

    await expect(page.getByText("Photo mise à jour")).toBeVisible({ timeout: 15_000 })
    await expect(sidePanel.locator("img")).toBeVisible({ timeout: 10_000 })
    await expect(page.locator(".tree-person-card").first().locator("img")).toBeVisible({ timeout: 10_000 })
  })
})
