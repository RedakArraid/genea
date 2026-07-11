import type { Page } from "@playwright/test"

export const TEST_USER = {
  phone: "0700000001",
  email: "test@example.com",
  password: "password123",
}

export const TEST_ADMIN = {
  phone: "0700000010",
  email: "admin@geneamap.com",
  password: "admin123",
}

export async function clearAuth(page: Page) {
  await page.goto("/")
  await page.evaluate(() => localStorage.clear())
}

/** Connexion par téléphone ou email + mot de passe */
export async function loginWithPassword(
  page: Page,
  creds: { phone?: string; email?: string; password: string }
) {
  const loginId = creds.phone ?? creds.email ?? ""
  await page.goto("/login")
  await page.getByRole("tab", { name: "Mot de passe" }).click()
  await page.locator("#login").fill(loginId)
  await page.locator("#password").fill(creds.password)
  await page.getByRole("button", { name: "Se connecter" }).click()
  await page.waitForURL(/\/dashboard/, { timeout: 15_000 })
}

export async function getFirstTreeId(page: Page): Promise<string> {
  await page.goto("/dashboard")
  const href = await page
    .getByRole("link", { name: /Famille|Diarrassouba|Ma Famille/i })
    .first()
    .getAttribute("href")
  const treeId = href?.split("/").pop()
  if (!treeId) throw new Error("Aucun arbre trouvé sur le tableau de bord")
  return treeId
}
