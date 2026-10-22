import { test, expect, type Page, type TestInfo } from '@playwright/test'
import { normalizePersons } from '../frontend/src/utils/tree-layout'
import { computeUnionOverview } from '../frontend/src/utils/union-overview'
import { siblingGroups } from '../frontend/src/lib/family-model'
import { segmentHitsCard, segmentsOverlap } from '../frontend/src/utils/readable-connections'
import type { Person, Relationship } from '../frontend/src/types'

/** Exact requested scenario: one father, four partners, seven children per pair.
 * All browser API responses are synthetic. No production data or service is used.
 * Readability metrics are recorded separately: passing topology does not prove
 * that all 33 names are readable at the same time on a small screen.
 */
const treeId = 'test-four-partners-seven-children'
const partners = [
  { id: 'partner-a', firstName: 'Fatou', lastName: 'Kone' },
  { id: 'partner-b', firstName: 'Aicha', lastName: 'Coulibaly' },
  { id: 'partner-c', firstName: 'Mariam', lastName: 'Diarra' },
  { id: 'partner-d', firstName: 'Aminata', lastName: 'Keita' },
]
const firstNames = [
  ['Issa', 'Awa', 'Oumar', 'Kadiatou', 'Seydou', 'Fanta', 'Bakary'],
  ['Adama', 'Salimata', 'Ibrahim', 'Assitan', 'Yacouba', 'Rokia', 'Boubacar'],
  ['Mamadou', 'Bintou', 'Amadou', 'Djeneba', 'Lassana', 'Sira', 'Daouda'],
  ['Moussa Junior', 'Hawa', 'Samba', 'Nana', 'Abdoulaye', 'Aminata Junior', 'Malick'],
]
const childrenOf = (index: number) => Array.from({ length: 7 }, (_, child) => `child-${index}-${child}`)
const persons = [
  { id: 'father', firstName: 'Moussa', lastName: 'Traore', gender: 'male', treeId },
  ...partners.map(p => ({ ...p, gender: 'female', treeId })),
  ...partners.flatMap((_, index) => childrenOf(index).map((id, child) => ({ id, firstName: firstNames[index][child], lastName: 'Traore', treeId }))),
] as Person[]
const relationships = partners.flatMap((partner, index) => [
  { id: `spouse-${index}`, type: 'spouse', sourceId: 'father', targetId: partner.id },
  ...childrenOf(index).flatMap(child => ['father', partner.id].map(parent => ({ id: `${parent}-${child}`, type: 'parent', sourceId: parent, targetId: child }))),
]) as Relationship[]
const people = normalizePersons(persons, relationships)

for (const orientation of ['vertical', 'horizontal']) for (const style of ['square', 'round', 'minimal', 'horizontal']) {
  test(`4x7 geometry ${orientation}/${style}: exact parents, continuous lines, separated cards`, () => {
    const scene = computeUnionOverview(people, orientation, style)!
    expect(scene).not.toBeNull()
    expect(scene.unresolved).toBe(0)
    expect(Object.keys(scene.positions).sort()).toEqual(persons.map(p => p.id).sort())
    expect(scene.panels).toHaveLength(4)
    expect(scene.shared.map(p => [p.person.id, p.count])).toEqual([['father', 4]])
    const sizes = scene.cardSizes
    const cards = people.map(p => ({ id: p.id, left: scene.positions[p.id].x, right: scene.positions[p.id].x + sizes[p.id].w, top: scene.positions[p.id].y, bottom: scene.positions[p.id].y + sizes[p.id].h }))
    for (const [i, a] of cards.entries()) for (const b of cards.slice(i + 1)) {
      expect(a.right <= b.left || b.right <= a.left || a.bottom <= b.top || b.bottom <= a.top, `${a.id} overlaps ${b.id}`).toBe(true)
    }
    for (const [index, partner] of partners.entries()) {
      const panel = scene.panels.find(p => p.family.parents.some(parent => parent.id === partner.id))!
      expect(panel.family.parents.map(p => p.id).sort()).toEqual(['father', partner.id])
      expect(panel.family.children.map(p => p.id).sort()).toEqual(childrenOf(index))
      const routes = scene.connections.filter(c => c.family === panel.family.key)
      expect(routes.filter(c => c.role === 'parent')).toHaveLength(2)
      expect(routes.filter(c => c.role === 'child')).toHaveLength(7)
      for (const route of routes) {
        expect(route.role === 'parent' ? route.points.at(-1) : route.points[0]).toEqual(panel.junction)
        expect(route.parentIds?.slice().sort()).toEqual(['father', partner.id])
      }
      for (const child of panel.family.children) {
        expect(child.parentIds.slice().sort()).toEqual(['father', partner.id])
        const groups = siblingGroups(child, people)
        expect(groups.full).toHaveLength(6)
        expect(groups.half).toHaveLength(21)
        expect(groups.uncertain).toHaveLength(0)
        const pos = scene.positions[child.id]
        expect(pos.x >= panel.x && pos.x + sizes[child.id].w <= panel.x + panel.width && pos.y >= panel.y && pos.y + sizes[child.id].h <= panel.y + panel.height, `${child.id} outside its family`).toBe(true)
      }
    }
    for (const c of scene.connections) for (let i = 1; i < c.points.length; i++) for (const card of cards) {
      expect(segmentHitsCard(c.points[i - 1], c.points[i], card), `line through ${card.id}`).toBe(false)
    }
    for (const [i, a] of scene.connections.entries()) for (const b of scene.connections.slice(i + 1)) if (a.family !== b.family) {
      for (let j = 1; j < a.points.length; j++) for (let k = 1; k < b.points.length; k++) {
        expect(segmentsOverlap(a.points[j - 1], a.points[j], b.points[k - 1], b.points[k]), 'unrelated families share a segment').toBe(false)
      }
    }
    expect(computeUnionOverview([...people].reverse(), orientation, style)?.positions).toEqual(scene.positions)
  })
}

async function fixture(page: Page, width: number, layout = 'vertical', dark = false) {
  const errors: string[] = [], writes: string[] = []
  page.on('pageerror', error => errors.push(error.message))
  await page.setViewportSize({ width, height: width < 600 ? 900 : 1000 })
  await page.addInitScript(({ treeId, layout, dark }) => {
    localStorage.setItem('geneamap_locale', 'fr')
    localStorage.setItem('geneamap-theme', dark ? 'dark' : 'light')
    localStorage.setItem('token', `e30.${btoa(JSON.stringify({ exp: 4102444800, id: 'four-partners-user' }))}.fixture`)
    localStorage.setItem(`geneamap:tree-presentation:v1:${treeId}`, 'graph')
    localStorage.setItem(`geneamap:tree-view:v1:${treeId}`, JSON.stringify({ layout, cardStyle: 'square', density: 'spacious', connStyle: 'elbow' }))
  }, { treeId, layout, dark })
  await page.route('**/api/**', async route => {
    const req = route.request(), path = new URL(req.url()).pathname.replace(/^\/api/, '')
    if (req.method() === 'OPTIONS') { await route.fulfill({ status: 204 }); return }
    if (req.method() !== 'GET') writes.push(path)
    let body: unknown = {}
    if (path === '/auth/me') body = { user: { id: 'four-partners-user', name: 'Test 4 x 7', role: 'USER', plan: 'PATRIMONY', planActive: true } }
    else if (path === `/family-trees/${treeId}`) body = {
      tree: { id: treeId, name: 'Moussa : 4 compagnes, 28 enfants', treeType: 'GENEALOGY', ownerId: 'four-partners-user', Person: persons, Relationship: relationships, NodePosition: [] },
      access: { canRead: true, canWrite: false, canEditPerson: false, canExport: false, canImport: false, canVersioning: false, role: 'viewer' },
    }
    else if (path.startsWith('/node-positions/tree/')) body = { nodePositions: [] }
    else if (path === '/uploads/status') body = { ready: false, enabled: false }
    await route.fulfill({ json: body })
  })
  await page.goto(`/tree/${treeId}`)
  await expect(page.getByTestId('tree-person-card')).toHaveCount(33)
  await expect(page.locator('[data-testid="tree-person-card"][data-compact="true"]')).toHaveCount(width < 768 ? 33 : 28)
  return { errors, writes }
}

async function record(page: Page, info: TestInfo, name: string) {
  const metrics = await page.evaluate(() => {
    const viewport = document.querySelector('[data-testid="tree-viewport"]')!.getBoundingClientRect()
    const toolbar = document.querySelector('[data-testid="tree-toolbar"]')!.getBoundingClientRect()
    const zoom = parseFloat(document.querySelector('[data-testid="tree-zoom"]')!.textContent!) / 100
    const cards = [...document.querySelectorAll<HTMLElement>('[data-testid="tree-person-card"]')].map(el => {
      const r = el.getBoundingClientRect()
      return { id: el.dataset.personId, fullyVisible: r.left >= viewport.left && r.right <= viewport.right && r.top >= toolbar.bottom && r.bottom <= viewport.bottom,
        intersects: r.right > viewport.left && r.left < viewport.right && r.bottom > toolbar.bottom && r.top < viewport.bottom, width: r.width, height: r.height }
    })
    return { zoom, cards, fullyVisible: cards.filter(c => c.fullyVisible).length, partiallyOrFullyVisible: cards.filter(c => c.intersects).length,
      fatherFullyVisible: cards.find(c => c.id === 'father')?.fullyVisible,
      warnings: [...document.querySelectorAll('[role="status"]')].map(el => el.textContent), viewport: { width: viewport.width, height: viewport.height, toolbarHeight: toolbar.height } }
  })
  console.log(`FOUR_BY_SEVEN ${JSON.stringify({ name, ...metrics })}`)
  await info.attach(name, { body: JSON.stringify(metrics, null, 2), contentType: 'application/json' })
  await page.screenshot({ path: info.outputPath(`${name}.png`), fullPage: true })
  return metrics
}

async function checkRenderedGraph(page: Page) {
  await expect(page.getByTestId('tree-person-card')).toHaveCount(33)
  await expect(page.getByTestId('union-lane')).toHaveCount(4)
  await expect(page.getByTestId('union-junction')).toHaveCount(0)
  await expect(page.getByText('Union renseignée', { exact: true })).toHaveCount(0)
  await expect(page.locator('[data-testid="tree-person-card"][data-person-id="father"]')).toHaveCount(1)
  for (const [index, partner] of partners.entries()) {
    const lane = page.locator(`[data-testid="union-lane"][data-parent-ids*="${partner.id}"]`)
    expect((await lane.getAttribute('data-parent-ids'))!.split(',').sort()).toEqual(['father', partner.id])
    expect((await lane.getAttribute('data-child-ids'))!.split(',').sort()).toEqual(childrenOf(index))
  }
  const defects = await page.evaluate(() => {
    const failures: string[] = [], allCards = [...document.querySelectorAll<HTMLElement>('[data-testid="tree-person-card"]')]
    const cards = allCards.map(el => ({ id: el.dataset.personId!, rect: el.getBoundingClientRect() }))
    for (const [i, a] of cards.entries()) for (const b of cards.slice(i + 1)) {
      if (a.rect.right > b.rect.left + 1 && b.rect.right > a.rect.left + 1 && a.rect.bottom > b.rect.top + 1 && b.rect.bottom > a.rect.top + 1) failures.push(`overlap:${a.id}:${b.id}`)
    }
    for (const lane of document.querySelectorAll<HTMLElement>('[data-testid="union-lane"]')) {
      const key = lane.dataset.familyKey, x = Number(lane.dataset.junctionX), y = Number(lane.dataset.junctionY), box = lane.getBoundingClientRect()
      const paths = [...document.querySelectorAll<SVGPathElement>('path[data-union-role]')].filter(path => path.dataset.familyKey === key)
      if (paths.filter(p => p.dataset.unionRole === 'parent').length !== 2 || paths.filter(p => p.dataset.unionRole === 'child').length !== 7) failures.push(`missing-links:${key}`)
      for (const path of paths) {
        const join = path.getPointAtLength(path.dataset.unionRole === 'parent' ? path.getTotalLength() : 0)
        if (Math.hypot(join.x - x, join.y - y) > .01) failures.push(`disconnected:${key}`)
        const matrix = path.getScreenCTM()!, length = path.getTotalLength()
        for (let d = 1; d < length; d += 3) {
          const p = path.getPointAtLength(d).matrixTransform(matrix)
          for (const card of cards) if (p.x > card.rect.left + 1 && p.x < card.rect.right - 1 && p.y > card.rect.top + 1 && p.y < card.rect.bottom - 1) failures.push(`line-through:${card.id}`)
        }
      }
      for (const id of lane.dataset.childIds!.split(',')) {
        const card = cards.find(c => c.id === id)!.rect
        if (card.left < box.left - 1 || card.right > box.right + 1 || card.top < box.top - 1 || card.bottom > box.bottom + 1) failures.push(`outside-family:${id}`)
      }
    }
    return [...new Set(failures)]
  })
  expect(defects).toEqual([])
}

for (const layout of ['vertical', 'horizontal']) for (const width of [375, 768, 1600]) {
  test(`4x7 browser ${layout} ${width}px: every family remains intact`, async ({ page }, info) => {
    const state = await fixture(page, width, layout)
    await checkRenderedGraph(page)
    const initial = await record(page, info, `four-by-seven-${layout}-${width}-initial`)
    expect(initial.fatherFullyVisible, 'The common parent must be visible on opening').toBe(true)
    expect(initial.zoom).toBeGreaterThanOrEqual(.85)
    if (layout === 'vertical' && width === 1600) expect(initial.fullyVisible).toBe(33)
    if (layout === 'vertical' && width === 375) expect(initial.fullyVisible).toBeGreaterThanOrEqual(9)
    await page.getByTestId('tree-zoom-controls').getByRole('button').last().click()
    const overview = await record(page, info, `four-by-seven-${layout}-${width}-overview`)
    expect(overview.fullyVisible).toBe(33)
    expect(state.errors).toEqual([])
    expect(state.writes).toEqual([])
  })
}
for (const width of [375, 1600]) test(`4x7 dark ${width}px: no layout regressions`, async ({ page }, info) => {
  const state = await fixture(page, width, 'vertical', true)
  await checkRenderedGraph(page)
  await record(page, info, `four-by-seven-dark-${width}`)
  expect(state.errors).toEqual([])
  expect(state.writes).toEqual([])
})

test('4x7 mobile navigation reaches each mother without filtering children', async ({ page }, info) => {
  const state = await fixture(page, 375)
  for (const partner of partners) {
    await page.getByTestId('union-navigation').getByRole('button', { name: partner.firstName, exact: true }).click()
    await expect(page.locator(`[data-testid="tree-person-card"][data-person-id="${partner.id}"]`)).toBeInViewport()
    await checkRenderedGraph(page)
    const current = await record(page, info, `four-by-seven-mobile-${partner.id}`)
    const expected = ['father', partner.id, ...childrenOf(partners.indexOf(partner))]
    for (const id of expected) expect(current.cards.find(c => c.id === id)?.fullyVisible, `${id} must be visible with both parents`).toBe(true)
    expect(current.zoom).toBeGreaterThanOrEqual(.85)
  }
  expect(state.errors).toEqual([])
  expect(state.writes).toEqual([])
})

test('4x7 Families mode lists seven children under each exact parent pair', async ({ page }, info) => {
  const state = await fixture(page, 1600)
  await page.getByTestId('view-families').click()
  await expect(page.getByTestId('reading-family')).toHaveCount(4)
  for (const [index, partner] of partners.entries()) {
    const group = page.getByTestId('reading-family').filter({ has: page.locator(`[data-testid="reader-parents"] [data-person-id="${partner.id}"]`) })
    expect(await group.getByTestId('reader-parents').getByTestId('family-reader-person').evaluateAll(elements => elements.map(e => e.getAttribute('data-person-id')).sort())).toEqual(['father', partner.id])
    expect(await group.getByTestId('reader-children').getByTestId('family-reader-person').evaluateAll(elements => elements.map(e => e.getAttribute('data-person-id')).sort())).toEqual(childrenOf(index))
  }
  await page.screenshot({ path: info.outputPath('four-by-seven-family-reader.png'), fullPage: true })
  expect(state.errors).toEqual([])
  expect(state.writes).toEqual([])
})


test('4x7 full-card switch and narrow resize preserve all people without saving coordinates', async ({ page }) => {
  const state = await fixture(page, 1600)
  await page.getByTestId('compact-siblings').click()
  await expect(page.locator('[data-compact="true"]')).toHaveCount(0)
  await checkRenderedGraph(page)
  await page.getByTestId('compact-siblings').click()
  await expect(page.locator('[data-compact="true"]')).toHaveCount(28)
  await page.setViewportSize({ width: 375, height: 900 })
  await expect(page.locator('[data-compact="true"]')).toHaveCount(33)
  await checkRenderedGraph(page)
  await expect(page.locator('[data-testid="tree-person-card"][data-person-id="father"]')).toBeInViewport()
  expect(state.writes).toEqual([]); expect(state.errors).toEqual([])
})

test('compact sibling cards keep legible names and keyboard access to their original person', async ({ page }) => {
  await fixture(page, 1600)
  const names = page.locator('[data-compact="true"] [data-person-name]')
  await expect(names).toHaveCount(28)
  expect(await names.evaluateAll(elements => elements.every(el => {
    const card = el.closest('[data-testid="tree-person-card"]') as HTMLElement
    const scale = card.getBoundingClientRect().width / card.offsetWidth
    return parseFloat(getComputedStyle(el).fontSize) * scale >= 11
  }))).toBe(true)
  const child = page.locator('[data-testid="tree-person-card"][data-person-id="child-0-0"]')
  await child.focus(); await page.keyboard.press('Enter')
  await expect(page.locator('aside')).toContainText('Issa')
})
