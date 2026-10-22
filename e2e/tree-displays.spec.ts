import { test, expect, type Page } from '@playwright/test'

type Options = { org?: boolean; layout?: string; style?: string; owner?: boolean; dark?: boolean }

/** Browser fixtures only: no live backend, no production data, no real credentials. */
async function fixture(page: Page, options: Options = {}) {
  const { org = false, layout = 'vertical', style = 'square', owner = false, dark = false } = options
  const id = org ? 'display-org' : 'display-family'
  const longRole = 'Direction des operations et accompagnement des equipes internationales. '.repeat(8)
  const people = [
    { id: 'root', firstName: 'Elodie', lastName: 'Martin', occupation: org ? longRole : '', treeId: id, birthPlace: 'Abidjan', birthDate: '1970-01-01' },
    ...Array.from({ length: 16 }, (_, i) => ({ id: `member-${i}`, firstName: `Membre ${i + 1}`, lastName: 'Martin', occupation: org && i % 3 === 0 ? longRole : 'Responsable', treeId: id, birthPlace: 'Paris', birthDate: '1995-03-21' })),
    { id: 'grandchild', firstName: 'Louise', lastName: 'Martin', occupation: 'Equipe', treeId: id },
  ]
  const relationships = people.slice(1, -1).map((person, i) => ({ id: `r${i}`, type: 'parent', sourceId: 'root', targetId: person.id }))
  relationships.push({ id: 'grand', type: 'parent', sourceId: 'member-0', targetId: 'grandchild' })
  if (!org) {
    people.push({ id: 'spouse', firstName: 'Jean', lastName: 'Martin', occupation: '', treeId: id })
    relationships.push({ id: 'marriage', type: 'spouse', sourceId: 'root', targetId: 'spouse' })
    people.slice(1, 17).forEach((p, i) => relationships.push({ id: `coparent-${i}`, type: 'parent', sourceId: 'spouse', targetId: p.id }))
  }
  const positions: Record<string, { id: string; nodeId: string; treeId: string; x: number; y: number }> = {}
  const writes: string[] = []
  const errors: string[] = []
  page.on('pageerror', error => errors.push(error.message))
  await page.addInitScript(({ id, layout, style, dark }) => {
    localStorage.setItem('geneamap_locale', 'fr')
    localStorage.setItem('geneamap-theme', dark ? 'dark' : 'light')
    // This token is decoded in the client only. Every API response is intercepted below.
    localStorage.setItem('token', `e30.${btoa(JSON.stringify({ exp: 4102444800, id: 'display-user' }))}.fixture`)
    if (!localStorage.getItem(`geneamap:tree-view:v1:${id}`)) localStorage.setItem(`geneamap:tree-view:v1:${id}`, JSON.stringify({ layout, cardStyle: style, density: 'spacious', connStyle: 'elbow' }))
  }, { id, layout, style, dark })
  await page.route('**/api/**', async route => {
    const request = route.request(), url = new URL(request.url()), path = url.pathname.replace(/^\/api/, '')
    if (request.method() === 'OPTIONS') { await route.fulfill({ status: 204 }); return }
    if (request.method() !== 'GET') writes.push(path)
    let body: unknown = {}
    if (path === '/auth/me') body = { user: { id: 'display-user', phone: '+2250700000001', name: 'Display fixture', role: 'USER', locale: 'fr', plan: 'PATRIMONY', planActive: true, createdAt: '2026-01-01' } }
    else if (path === `/family-trees/${id}`) body = {
      tree: { id, name: org ? 'Organigramme de test' : 'Famille de test', treeType: org ? 'ORGANIZATION' : 'GENEALOGY', isPublic: true, visibility: 'PUBLIC', ownerId: 'display-user', Person: people, Relationship: relationships, NodePosition: Object.values(positions) },
      access: { canRead: true, canWrite: owner, canEditPerson: owner, canExport: true, canImport: false, canVersioning: false, canManageCollaborators: false, isDemo: false, role: owner ? 'owner' : 'viewer' },
    }
    else if (path.startsWith('/node-positions/tree/')) body = { nodePositions: Object.values(positions) }
    else if (path === '/node-positions' && request.method() === 'POST') {
      const p = request.postDataJSON()
      positions[p.nodeId] = { ...p, id: `pos-${p.nodeId}` }; body = { nodePosition: positions[p.nodeId] }
    } else if (path.startsWith('/node-positions/') && request.method() === 'PUT') {
      const nodeId = path.split('/').pop()!.replace(/^pos-/, '')
      positions[nodeId] = { ...positions[nodeId], ...request.postDataJSON() }; body = { nodePosition: positions[nodeId] }
    } else if (path === '/uploads/status') body = { enabled: false, ready: false }
    await route.fulfill({ contentType: 'application/json', json: body, headers: { 'Access-Control-Allow-Origin': '*' } })
  })
  await page.goto(`/tree/${id}`)
  await expect(page.getByTestId('tree-person-card')).toHaveCount(people.length)
  await expect(page.locator('html')).toHaveClass(dark ? /\bdark\b/ : /\blight\b/)
  return { id, people, positions, writes, errors }
}

async function expectFitted(page: Page) {
  await expect.poll(async () => page.getByTestId('tree-viewport').evaluate(viewport => {
    const view = viewport.getBoundingClientRect(), bar = viewport.querySelector('[data-testid="tree-toolbar"]')!.getBoundingClientRect()
    const cards = [...viewport.querySelectorAll<HTMLElement>('.tree-person-card')]
    return cards.length > 0 && cards.every(card => {
      const r = card.getBoundingClientRect()
      return r.left >= view.left - 1 && r.right <= view.right + 1 && r.top >= bar.bottom - 1 && r.bottom <= view.bottom + 1
    })
  })).toBe(true)
}

for (const org of [false, true]) for (const width of [375, 1440]) for (const layout of ['vertical', 'horizontal', 'radial']) for (const style of ['square', 'round', 'horizontal', 'minimal']) {
  test(`${org ? 'organization' : 'genealogy'} ${width}px ${layout} ${style}`, async ({ page }, info) => {
    await page.setViewportSize({ width, height: width === 375 ? 812 : 1000 })
    const result = await fixture(page, { org, layout, style })
    await expectFitted(page)
    expect(await page.getByTestId('tree-person-card').evaluateAll(cards => cards.every(card => card.scrollHeight <= card.clientHeight + 2))).toBe(true)
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true)
    expect(result.errors).toEqual([])
    expect(result.writes).toEqual([])
    if (style === 'square') await page.screenshot({ path: info.outputPath(`${org ? 'org' : 'family'}-${width}-${layout}.png`), fullPage: true })
  })
}

test('search hides matching edges and fit uses only the visible graph', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await fixture(page)
  await page.getByTestId('tree-search').fill('elodie')
  await expect(page.getByTestId('tree-person-card')).toHaveCount(1)
  await expect(page.locator('[data-connection-kind]')).toHaveCount(0)
  await expectFitted(page)
  await page.getByTestId('tree-search').fill('no-such-person')
  await expect(page.getByTestId('tree-person-card')).toHaveCount(0)
  await expect(page.locator('[data-connection-kind]')).toHaveCount(0)
})

for (const width of [375, 1600]) test(`organization PDF remains available without GEDCOM at ${width}px`, async ({ page }) => {
  await page.setViewportSize({ width, height: 900 })
  await fixture(page, { org: true })
  const compact = await page.getByTestId('tree-toolbar').getAttribute('data-toolbar-mode') === 'compact'
  await page.getByTestId(compact ? 'tree-toolbar-menu' : 'tree-export-menu').click()
  await expect(page.getByTestId('tree-export-pdf')).toBeVisible()
  await expect(page.getByText('GEDCOM', { exact: false })).toHaveCount(0)
})

test('layout switches in the UI and survives reload without writes for a reader', async ({ page }) => {
  await page.setViewportSize({ width: 1600, height: 900 })
  const result = await fixture(page)
  await page.getByTestId('layout-horizontal').click()
  await expectFitted(page)
  await expect.poll(() => page.evaluate(id => JSON.parse(localStorage.getItem(`geneamap:tree-view:v1:${id}`)!).layout, result.id)).toBe('horizontal')
  await page.reload()
  await expect(page.getByTestId('tree-person-card')).toHaveCount(result.people.length)
  await expectFitted(page)
  const rootX = await page.locator('[data-person-id="root"]').evaluate(el => parseFloat((el as HTMLElement).style.left))
  const childX = await page.locator('[data-person-id="member-0"]').evaluate(el => parseFloat((el as HTMLElement).style.left))
  expect(childX).toBeGreaterThan(rootX)
  expect(result.writes).toEqual([])
})

test('opening the side panel does not subtract its width twice', async ({ page }) => {
  await page.setViewportSize({ width: 1600, height: 1000 })
  await fixture(page)
  const before = await page.getByTestId('tree-viewport').boundingBox()
  await page.locator('[data-person-id="root"]').click()
  await expect.poll(async () => (await page.getByTestId('tree-viewport').boundingBox())!.width).toBeLessThan(before!.width)
  await expectFitted(page)
})

test('dark mode and mobile viewport retain the full tree', async ({ page }, info) => {
  await page.setViewportSize({ width: 375, height: 812 })
  const result = await fixture(page, { org: true, dark: true, style: 'horizontal' })
  await expectFitted(page)
  expect(result.errors).toEqual([])
  await page.screenshot({ path: info.outputPath('org-mobile-dark.png'), fullPage: true })
})


test('manual card coordinates persist through drag, save and reload', async ({ page }) => {
  await page.setViewportSize({ width: 1600, height: 1000 })
  const result = await fixture(page, { owner: true })
  await expect.poll(() => Object.keys(result.positions).length).toBe(result.people.length)
  const root = page.locator('[data-person-id="root"]')
  const box = (await root.boundingBox())!
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
  await page.mouse.down()
  await page.mouse.move(box.x - 140, box.y - 20, { steps: 12 })
  await page.mouse.up()
  const moved = await root.evaluate(el => ({ x: parseFloat((el as HTMLElement).style.left), y: parseFloat((el as HTMLElement).style.top) }))
  await expect.poll(() => Math.abs(result.positions.root.x - moved.x) < 1 && Math.abs(result.positions.root.y - moved.y) < 1).toBe(true)
  await page.reload()
  await expect(root).toBeVisible()
  await expect.poll(() => root.evaluate(el => ({ x: parseFloat((el as HTMLElement).style.left), y: parseFloat((el as HTMLElement).style.top) }))).toEqual(moved)
  await expectFitted(page)
  expect(result.errors).toEqual([])
})

test('generation filter displays its translated label before opening', async ({ page }) => {
  await page.setViewportSize({ width: 1600, height: 900 })
  await fixture(page)
  const filter = page.getByTestId('tree-generation-filter')
  await expect(filter).not.toHaveText(/^all$/)
  await expect(filter).toContainText(/générations/i)
  await filter.click()
  await page.getByRole('option').filter({ hasText: /2/ }).first().click()
  await expect(page.getByTestId('tree-person-card')).toHaveCount(16)
  await expect(page.locator('[data-connection-kind]')).toHaveCount(0)
  await expectFitted(page)
})

for (const url of ['/', '/organisation']) for (const width of [375, 1440]) {
  test(`marketing preview ${url} ${width}px`, async ({ page }, info) => {
    await page.setViewportSize({ width, height: 1000 })
    const result = await fixture(page)
    await page.goto(url)
    const preview = page.getByTestId('marketing-tree-preview').first()
    await expect(preview).toBeVisible()
    await preview.scrollIntoViewIfNeeded()
    await expect.poll(() => preview.evaluate(el => {
      const r = el.getBoundingClientRect()
      const cards = [...el.querySelectorAll<HTMLElement>('.tree-person-card')]
      return cards.length > 1 && cards.every(card => {
        const c = card.getBoundingClientRect()
        return c.left >= r.left - 1 && c.right <= r.right + 1 && c.top >= r.top - 1 && c.bottom <= r.bottom + 1
      })
    })).toBe(true)
    expect(result.errors).toEqual([])
    await preview.screenshot({ path: info.outputPath(`marketing-${url === '/' ? 'family' : 'org'}-${width}.png`) })
  })
}
