import { test, expect } from "@playwright/test"
import path from "node:path"
import {
  clearAuth,
  getPatrimonyTreeId,
  loginWithPassword,
  PATRIMONY_USER,
} from "./helpers/auth"

const IMPORT_GED = path.join(__dirname, "fixtures", "test-import.ged")

test.describe("Fonctionnalités Patrimoine & landing", () => {
  test.beforeEach(async ({ page }) => {
    page.on("dialog", (d) => d.dismiss())
  })

  test("landing, tarifs affichés en FCFA et USD", async ({ page }) => {
    await page.goto("/")
    await page.locator("#prix").scrollIntoViewIfNeeded()
    await expect(page.locator("#prix")).toBeVisible({ timeout: 15_000 })
    await expect(page.locator("#prix")).toContainText(/FCFA|F\s?CFA|XOF/)
    await expect(page.locator("#prix")).toContainText(/\$/)
  })

  test.describe("compte Patrimoine", () => {
    test.beforeEach(async ({ page }) => {
      await clearAuth(page)
      await loginWithPassword(page, PATRIMONY_USER)
    })

    test("page correspondances, opt-in et liste", async ({ page }) => {
      const treeId = await getPatrimonyTreeId(page)
      await page.goto(`/family-tree/${treeId}/matches`)
      await expect(page.getByRole("heading", { name: "Correspondances familiales" })).toBeVisible({
        timeout: 15_000,
      })

      const optInBtn = page.getByRole("button", { name: /Participer|Ne plus participer/i })
      await optInBtn.click()
      await expect(page.getByText(/Participation|désactivée/i)).toBeVisible({ timeout: 10_000 })
    })

    test("import GEDCOM depuis la toolbar", async ({ page }) => {
      const treeId = await getPatrimonyTreeId(page)
      await page.goto(`/family-tree/${treeId}`)
      await expect(page.locator(".tree-person-card").first()).toBeVisible({ timeout: 20_000 })

      const importBtn = page.getByRole("button", { name: "Importer GEDCOM" })
      await expect(importBtn).toBeVisible()

      const fileInput = page.locator('input[type="file"][accept*=".ged"]')
      await fileInput.setInputFiles(IMPORT_GED)

      await expect(page.getByText(/Import GEDCOM réussi/i)).toBeVisible({ timeout: 15_000 })
    })

    test("historique personne, révision après modification", async ({ page }) => {
      const treeId = await getPatrimonyTreeId(page)
      await page.goto(`/family-tree/${treeId}`)
      await expect(page.locator(".tree-person-card").first()).toBeVisible({ timeout: 20_000 })

      await page.locator(".tree-person-card").first().click()
      const sidePanel = page.locator(".w-80.shrink-0")
      await expect(sidePanel.getByText("Historique")).toBeVisible()

      const newName = `Hist${Date.now().toString().slice(-4)}`
      await sidePanel.getByTestId("edit-first-name").fill(newName)
      await sidePanel.getByTestId("save-person-btn").click()
      await expect(page.getByText("Personne mise à jour")).toBeVisible({ timeout: 10_000 })

      await expect(sidePanel.getByRole("button", { name: "Restaurer" }).first()).toBeVisible({
        timeout: 10_000,
      })
    })
  })
})
