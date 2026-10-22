import { test, expect, type Page } from '@playwright/test'

/** Synthetic family: every API response is intercepted. No external data or credentials. */
async function fixture(page: Page, options: { width?: number; dark?: boolean; lang?: string; graph?: boolean; layout?: string } = {}) {
  const id = 'clarity-family'
  const names = [
    ['father', 'Moussa', 'Traore'], ['mother-a', 'Aminata', 'Diarra'], ['mother-b', 'Fatou', 'Kone'], ['mother-c', 'Aicha', 'Coulibaly'],
    ['a1', 'Adama', 'Traore'], ['a2', 'Mariam', 'Traore'], ['b1', 'Issa', 'Traore'], ['b2', 'Awa', 'Traore'],
    ['c1', 'Yacouba', 'Traore'], ['c2', 'Salimata', 'Traore'], ['unknown', 'Amadou', 'Traore'], ['isolated', 'Karim', 'Toure'],
  ]
  const people = names.map(([id, firstName, lastName]) => ({ id, firstName, lastName, treeId: 'clarity-family' }))
  const relationships = ['a', 'b', 'c'].flatMap((m, n) => [
    { id: `spouse-${m}`, type: 'spouse', sourceId: 'father', targetId: `mother-${m}` },
    ...[1, 2].flatMap(i => ['father', `mother-${m}`].map((p, j) => ({ id: `r${n}-${i}-${j}`, type: 'parent', sourceId: p, targetId: `${m}${i}` }))),
  ])
  relationships.push({ id: 'unknown-parent', type: 'parent', sourceId: 'father', targetId: 'unknown' })
  const errors: string[] = [], writes: string[] = []
  page.on('pageerror', error => errors.push(error.message))
  await page.setViewportSize({ width: options.width || 1600, height: options.width && options.width < 600 ? 900 : 1000 })
  await page.addInitScript(({ id, dark, lang, graph, layout }) => {
    localStorage.setItem('geneamap_locale', lang || 'fr')
    localStorage.setItem('geneamap-theme', dark ? 'dark' : 'light')
    localStorage.setItem('token', `e30.${btoa(JSON.stringify({ exp: 4102444800, id: 'clarity-user' }))}.fixture`)
    if (graph) localStorage.setItem(`geneamap:tree-presentation:v1:${id}`, 'graph')
    if (!localStorage.getItem(`geneamap:tree-view:v1:${id}`)) localStorage.setItem(`geneamap:tree-view:v1:${id}`, JSON.stringify({ layout: layout || 'vertical', cardStyle: 'square', density: 'spacious', connStyle: 'elbow' }))
  }, { id, ...options })
  await page.route('**/api/**', async route => {
    const request = route.request(), url = new URL(request.url()), path = url.pathname.replace(/^\/api/, '')
    if (request.method() === 'OPTIONS') { await route.fulfill({ status: 204 }); return }
    if (request.method() !== 'GET') writes.push(path)
    let body: unknown = {}
    if (path === '/auth/me') body = { user: { id: 'clarity-user', name: 'Clarity review', role: 'USER', plan: 'PATRIMONY', planActive: true } }
    else if (path === `/family-trees/${id}`) body = {
      tree: { id, name: 'Famille de demonstration', treeType: 'GENEALOGY', ownerId: 'clarity-user', Person: people, Relationship: relationships, NodePosition: [] },
      access: { canRead: true, canWrite: true, canEditPerson: true, canExport: false, canImport: false, canVersioning: false, role: 'owner' },
    }
    else if (path === '/uploads/status') body = { enabled: false, ready: false }
    else if (path.startsWith('/node-positions/tree')) body = { nodePositions: [] }
    else if (path === '/node-positions') body = { nodePosition: { ...request.postDataJSON(), id: `pos-${request.postDataJSON().nodeId}` } }
    await route.fulfill({ contentType: 'application/json', json: body })
  })
  await page.goto(`/tree/${id}`)
  await expect(page.getByTestId(options.graph ? 'tree-person-card' : 'reading-family')).toHaveCount(options.graph ? 12 : 4)
  return { errors, writes, people }
}

for (const width of [375, 768, 1600]) for (const dark of [false, true]) {
  test(`readable default families at ${width}px ${dark ? 'dark' : 'light'}`, async ({ page }, info) => {
    const state = await fixture(page, { width, dark })
    await expect(page.getByTestId('view-families')).toHaveAttribute('aria-pressed', 'true')
    const groups = page.getByTestId('reading-family')
    for (const [suffix, mother] of [['a', 'Aminata'], ['b', 'Fatou'], ['c', 'Aicha']]) {
      const group = groups.filter({ has: page.locator(`[data-testid="reader-parents"] [data-person-id="mother-${suffix}"]`) })
      await expect(group).toHaveCount(1)
      await expect(group.getByTestId('reader-parents')).toContainText(mother)
      await expect(group.getByTestId('reader-children').getByTestId('family-reader-person')).toHaveCount(2)
    }
    await expect(page.getByTestId('reader-unlinked')).toContainText('Karim')
    expect(await page.getByTestId('reader-person-name').evaluateAll(names => names.every(name => parseFloat(getComputedStyle(name).fontSize) >= 14))).toBe(true)
    expect(await page.getByTestId('family-reader-person').evaluateAll(buttons => buttons.every(button => button.getBoundingClientRect().height >= 44 && button.scrollWidth <= button.clientWidth + 1))).toBe(true)
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true)
    expect(state.errors).toEqual([])
    await page.screenshot({ path: info.outputPath(`families-${width}-${dark ? 'dark' : 'light'}.png`), fullPage: true })
  })
}

test('search keeps the true parents and does not infer a different mother', async ({ page }) => {
  await fixture(page)
  await page.getByTestId('tree-search').fill('Issa')
  await expect(page.getByTestId('reading-family')).toHaveCount(1)
  await expect(page.getByTestId('reader-parents')).toContainText('Fatou')
  await expect(page.getByTestId('reader-parents')).not.toContainText('Aminata')
  await expect(page.getByTestId('family-reader').getByRole('status')).toBeVisible()
  await page.getByTestId('tree-search').fill('zz-no-match')
  await expect(page.getByTestId('reading-family')).toHaveCount(0)
})

test('a family action confirms the exact pair and contextual child title', async ({ page }, info) => {
  await fixture(page)
  const group = page.getByTestId('reading-family').filter({ has: page.locator('[data-testid="reader-parents"] [data-person-id="mother-b"]') })
  await group.getByRole('button', { name: 'Ajouter un enfant', exact: true }).click()
  await expect(page.getByRole('dialog').getByRole('heading')).toHaveText('Ajouter un enfant')
  await expect(page.getByTestId('family-parent-summary')).toContainText('Fatou')
  await expect(page.getByTestId('family-parent-summary')).toContainText('Moussa')
  await expect(page.getByRole('button', { name: 'Choisir une photo' })).toBeVisible()
  await page.screenshot({ path: info.outputPath('add-child-context.png'), fullPage: true })
})

test('selected identity stays visible while relationships scroll; buttons do not overflow', async ({ page }, info) => {
  await fixture(page)
  await page.locator('[data-testid="reader-children"] [data-person-id="a1"]').click()
  await page.getByTestId('siblings-half').scrollIntoViewIfNeeded()
  await expect(page.getByTestId('person-panel-heading')).toBeVisible()
  await expect(page.getByTestId('person-panel-heading')).toContainText('Adama Traore')
  expect(await page.locator('aside button').evaluateAll(buttons => buttons.every(button => button.scrollWidth <= button.clientWidth + 1))).toBe(true)
  await page.screenshot({ path: info.outputPath('persistent-person-context.png'), fullPage: true })
})

for (const layout of ['vertical', 'horizontal', 'radial']) test(`graph ${layout}: no line travels through a card`, async ({ page }, info) => {
  const state = await fixture(page, { graph: true, layout })
  const collisions = await page.getByTestId('tree-world').evaluate(world => {
    const cards = [...world.querySelectorAll<HTMLElement>('[data-person-id]')].map(el => ({ id: el.dataset.personId, x: parseFloat(el.style.left), y: parseFloat(el.style.top), w: parseFloat(el.style.width), h: parseFloat(el.style.height) }))
    const failures: string[] = []
    for (const path of world.querySelectorAll<SVGPathElement>('path[data-connection-kind]')) {
      const length = path.getTotalLength()
      for (let d = 1; d < length; d += 3) {
        const p = path.getPointAtLength(d)
        for (const card of cards) if (p.x > card.x + .1 && p.x < card.x + card.w - .1 && p.y > card.y + .1 && p.y < card.y + card.h - .1) failures.push(card.id || '?')
      }
    }
    return [...new Set(failures)]
  })
  expect(collisions).toEqual([])
  await expect(page.getByText('Certains liens ne peuvent', { exact: false })).toHaveCount(0)
  expect(state.errors).toEqual([])
  await page.screenshot({ path: info.outputPath(`graph-${layout}.png`), fullPage: true })
})

test('graph family focus keeps only the intended parents and children', async ({ page }, info) => {
  await fixture(page, { width: 375 })
  await page.getByTestId('view-graph').click()
  const originalPositions = await page.getByTestId('tree-person-card').evaluateAll(cards => Object.fromEntries(cards.map(card => [card.getAttribute('data-person-id'), [(card as HTMLElement).style.left, (card as HTMLElement).style.top]])))
  const filter = page.getByTestId('graph-family-filter')
  await filter.selectOption(JSON.stringify(['father', 'mother-b']))
  await expect(page.getByTestId('tree-person-card')).toHaveCount(4)
  await expect(page.locator('.tree-person-card[data-person-id="mother-b"]')).toBeVisible()
  await expect(page.locator('.tree-person-card[data-person-id="mother-a"]')).toHaveCount(0)
  await expect.poll(() => page.getByTestId('tree-zoom').innerText()).toMatch(/^(9[0-9]|[1-9][0-9]{2})%$/)
  await page.screenshot({ path: info.outputPath('mobile-focused-family.png'), fullPage: true })
  await filter.selectOption('all')
  await expect(page.getByTestId('tree-person-card')).toHaveCount(12)
  expect(await page.getByTestId('tree-person-card').evaluateAll(cards => Object.fromEntries(cards.map(card => [card.getAttribute('data-person-id'), [(card as HTMLElement).style.left, (card as HTMLElement).style.top]])))).toEqual(originalPositions)
  await page.getByTestId('view-families').click()
  await expect(page.getByTestId('reading-family')).toHaveCount(4)
  await page.reload()
  await expect(page.getByTestId('reading-family')).toHaveCount(4)
  await page.screenshot({ path: info.outputPath('mobile-family-reader.png'), fullPage: true })
})

test('English labels do not expose translation keys', async ({ page }) => {
  await fixture(page, { lang: 'en' })
  await expect(page.getByTestId('family-reader')).toContainText('Read by family')
  await expect(page.getByTestId('family-reader')).not.toContainText('reader.')
})


test('centering a person from Families opens the graph and clears incompatible filters', async ({ page }) => {
  const state = await fixture(page)
  await page.getByTestId('tree-search').fill('Issa')
  await page.locator('[data-testid="reader-children"] [data-person-id="b1"]').click()
  await page.locator('aside').getByRole('button', { name: 'Centrer', exact: true }).click()
  await expect(page.getByTestId('view-graph')).toHaveAttribute('aria-pressed', 'true')
  await expect(page.getByTestId('tree-search')).toHaveValue('')
  await expect(page.getByTestId('tree-person-card')).toHaveCount(12)
  await expect(page.getByTestId('person-panel-heading')).toContainText('Issa Traore')
  await expect.poll(() => page.getByTestId('tree-zoom').innerText()).toMatch(/^(9[0-9]|[1-9][0-9]{2})%$/)
  await expect.poll(() => page.locator('.tree-person-card[data-person-id="b1"]').evaluate(card => {
    const viewport = document.querySelector('[data-testid="tree-viewport"]')!.getBoundingClientRect()
    const toolbar = document.querySelector('[data-testid="tree-toolbar"]')!.getBoundingClientRect()
    const rect = card.getBoundingClientRect()
    return Math.abs((rect.left + rect.right) / 2 - (viewport.left + viewport.right) / 2) < 2 && rect.top >= toolbar.bottom && rect.bottom <= viewport.bottom
  })).toBe(true)
  expect(state.errors).toEqual([])
})
