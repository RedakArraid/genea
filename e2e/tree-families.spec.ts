import { test, expect, type Page } from '@playwright/test'
import { createRequire } from 'node:module'
import { randomUUID } from 'node:crypto'
import path from 'node:path'
const backendRequire = createRequire(path.resolve('backend/package.json'))
const { PrismaClient } = backendRequire('@prisma/client')
const jwt = backendRequire('jsonwebtoken')
const url = process.env.FAMILY_TEST_DATABASE_URL
if (!url || !['127.0.0.1', 'localhost'].includes(new URL(url).hostname) || new URL(url).pathname !== '/family_test') throw new Error('Local test database required')
const db = new PrismaClient({ datasources: { db: { url } } })
let user: any, tree: any, father: any, mothers: any[], children: any[], unknown: any, unlinked: any
let errors: string[]
test.beforeEach(async ({ page }) => {
  errors = []; page.on('pageerror', error => errors.push(error.message))
  user = await db.user.create({ data: { phone: `ui-${randomUUID()}`, password: 'unused', name: 'Family UI test', locale: 'fr', plan: 'PATRIMONY', planActive: true, planExpiresAt: new Date('2099-01-01') } })
  tree = await db.familyTree.create({ data: { name: 'Famille composee de test', ownerId: user.id } })
  const create = (firstName: string) => db.person.create({ data: { treeId: tree.id, firstName, lastName: 'Test' } })
  father = await create('Pere')
  mothers = await Promise.all(['MereA', 'MereB', 'MereC'].map(create))
  children = []
  for (const [index, mother] of mothers.entries()) {
    await db.relationship.createMany({ data: [
      { type: 'spouse', sourceId: father.id, targetId: mother.id }, { type: 'spouse', sourceId: mother.id, targetId: father.id },
    ] })
    for (let i = 0; i < 2; i++) {
      const child = await create(`Enfant${index}${i}`); children.push(child)
      await db.relationship.createMany({ data: [father, mother].flatMap(parent => [
        { type: 'parent', sourceId: parent.id, targetId: child.id }, { type: 'child', sourceId: child.id, targetId: parent.id },
      ]) })
    }
  }
  unknown = await create('FiliationIncomplete'); unlinked = await create('SansParents')
  await db.relationship.createMany({ data: [{ type: 'parent', sourceId: father.id, targetId: unknown.id }, { type: 'child', sourceId: unknown.id, targetId: father.id }] })
  const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '1h' })
  await page.addInitScript(({ token, treeId }) => {
    localStorage.setItem(`geneamap:tree-presentation:v1:${treeId}`, 'graph')
    localStorage.setItem('token', token); localStorage.setItem('geneamap_locale', 'fr'); localStorage.setItem('geneamap-theme', 'light')
  }, { token, treeId: tree.id })
  await page.setViewportSize({ width: 1600, height: 1000 })
})
test.afterEach(async () => {
  if (tree) await db.familyTree.deleteMany({ where: { id: tree.id } })
  if (user) await db.user.deleteMany({ where: { id: user.id } })
  expect(errors).toEqual([])
})
test.afterAll(async () => db.$disconnect())
async function open(page: Page) {
  await page.goto(`/family-tree/${tree.id}`)
  await expect(page.getByTestId('tree-person-card')).toHaveCount(12)
}
async function childMenu(page: Page, existing = false) {
  await page.locator(`[data-person-id="${father.id}"]`).click()
  const section = page.getByTestId('family-children')
  await section.getByRole('button', { name: /Ajouter/ }).first().click()
  await page.getByRole('menuitem', { name: existing ? /Lier une personne existante/ : /Nouvel enfant/ }).click()
}
async function parentsOf(name: string) {
  const p = await db.person.findFirst({ where: { treeId: tree.id, firstName: name } })
  if (!p) return []
  const links = await db.relationship.findMany({ where: { targetId: p.id, type: 'parent' } })
  return links.map((r: any) => r.sourceId).sort()
}
test('generic add requires a deliberate mother choice and persists it through reload', async ({ page }, info) => {
  await open(page); await childMenu(page)
  await expect(page.getByTestId('family-other-parent')).toHaveValue('')
  await page.getByTestId('family-firstName').fill('NouveauB')
  await expect(page.getByTestId('family-save')).toBeDisabled()
  await page.getByTestId('family-other-parent').selectOption(mothers[1].id)
  await expect(page.getByTestId('family-parent-summary')).toContainText('MereB')
  await page.screenshot({ path: info.outputPath('explicit-parent-selection.png'), fullPage: true })
  await page.getByTestId('family-save').click()
  await expect(page.getByRole('dialog')).toHaveCount(0)
  expect(await parentsOf('NouveauB')).toEqual([father.id, mothers[1].id].sort())
  await page.reload(); await expect(page.getByTestId('tree-person-card')).toHaveCount(13)
})
test('explicit unknown parent does not pick any of the three mothers', async ({ page }) => {
  await open(page); await childMenu(page)
  await page.getByTestId('family-other-parent').selectOption('__unknown__')
  await page.getByTestId('family-firstName').fill('Inconnu')
  await page.getByTestId('family-save').click()
  await expect(page.getByRole('dialog')).toHaveCount(0)
  expect(await parentsOf('Inconnu')).toEqual([father.id])
})
test('the selected partner shortcut names that exact mother', async ({ page }) => {
  await open(page); await page.locator(`[data-person-id="${father.id}"]`).click()
  const partner = page.locator(`[data-relative-id="${mothers[2].id}"]`)
  await partner.getByRole('button').nth(1).click()
  await page.getByRole('menuitem', { name: /Nouvel enfant/ }).click()
  await expect(page.getByTestId('family-other-parent')).toHaveValue(mothers[2].id)
  await expect(page.getByTestId('family-parent-summary')).toContainText('MereC')
})
test('link existing child requires the same explicit choice and writes both links in one request', async ({ page }) => {
  await open(page); await childMenu(page, true)
  await expect(page.getByTestId('family-other-parent')).toHaveValue('')
  await page.getByTestId('family-other-parent').selectOption(mothers[1].id)
  await page.getByTestId('family-existing-child').selectOption(unlinked.id)
  await page.getByTestId('family-link-save').click()
  await expect(page.getByRole('dialog')).toHaveCount(0)
  expect(await parentsOf('SansParents')).toEqual([father.id, mothers[1].id].sort())
})
test('failed creation retains the form, never announces success, and can be retried', async ({ page }) => {
  let attempts = 0
  await page.route('**/family-member', route => ++attempts === 1 ? route.fulfill({ status: 500, json: { message: 'Injected test failure' } }) : route.continue())
  await open(page); await childMenu(page)
  await page.getByTestId('family-other-parent').selectOption(mothers[2].id)
  await page.getByTestId('family-firstName').fill('AReessayer')
  await page.getByTestId('family-save').click()
  await expect(page.getByRole('dialog').getByRole('alert')).toBeVisible()
  await expect(page.getByTestId('family-firstName')).toHaveValue('AReessayer')
  expect(await parentsOf('AReessayer')).toEqual([])
  await page.getByTestId('family-save').click()
  await expect(page.getByRole('dialog')).toHaveCount(0)
  expect(await parentsOf('AReessayer')).toEqual([father.id, mothers[2].id].sort())
})
test('side panel separates full, half and incomplete sibling groups', async ({ page }, info) => {
  await open(page); await page.locator(`[data-person-id="${children[0].id}"]`).click()
  await expect(page.getByTestId('siblings-full')).toContainText('Enfant01')
  await expect(page.getByTestId('siblings-half')).toContainText('Enfant10')
  await expect(page.getByTestId('siblings-half')).toContainText('Enfant20')
  await expect(page.getByTestId('siblings-uncertain')).toContainText('FiliationIncomplete')
  await expect(page.getByTestId('siblings-half')).not.toContainText('FiliationIncomplete')
  await page.getByTestId('siblings-uncertain').scrollIntoViewIfNeeded()
  await page.screenshot({ path: info.outputPath('sibling-classification.png'), fullPage: true })
})
for (const width of [375, 1600]) for (const layout of ['vertical', 'horizontal', 'radial']) test(`real family display ${width}px ${layout}`, async ({ page }, info) => {
  await page.setViewportSize({ width, height: width === 375 ? 812 : 1000 })
  await page.addInitScript(({ id, layout }) => localStorage.setItem(`geneamap:tree-view:v1:${id}`, JSON.stringify({ layout, cardStyle: 'square' })), { id: tree.id, layout })
  await open(page)
  await expect.poll(async () => page.getByTestId('tree-viewport').evaluate(viewport => {
    const box = viewport.getBoundingClientRect(), toolbar = viewport.querySelector('[data-testid="tree-toolbar"]')!.getBoundingClientRect()
    return [...viewport.querySelectorAll('.tree-person-card')].every(card => {
      const r = card.getBoundingClientRect()
      return r.left >= box.left - 1 && r.right <= box.right + 1 && r.top >= toolbar.bottom - 1 && r.bottom <= box.bottom + 1
    })
  })).toBe(true)
  await page.screenshot({ path: info.outputPath(`half-siblings-${width}-${layout}.png`), fullPage: true })
})
