import { test, expect, type Page } from '@playwright/test'

/** All API traffic is intercepted: synthetic names, no server or production writes. */
async function fixture(page: Page, options: { width?: number; dark?: boolean; layout?: string; maternal?: boolean; readonly?: boolean } = {}) {
  const id='union-overview-test', hub=options.maternal ? 'Aminata' : 'Moussa'
  const names=[['common',hub,'Traore'],['partner-a','Fatou','Kone'],['partner-b','Aicha','Coulibaly'],['partner-c','Mariam','Diarra'],
    ['a1','Issa','Traore'],['a2','Awa','Traore'],['b1','Adama','Traore'],['b2','Salimata','Traore'],['c1','Mamadou','Traore'],['c2','Bintou','Traore'],['unknown','Amadou','Traore'],['isolated','Karim','Toure']]
  const people=names.map(([id,firstName,lastName])=>({id,firstName,lastName,treeId:'union-overview-test'}))
  const relationships=['a','b','c'].flatMap(m=>[{id:`s-${m}`,type:'spouse',sourceId:'common',targetId:`partner-${m}`},...[1,2].flatMap(i=>['common',`partner-${m}`].map(p=>({id:`${m}${i}${p}`,type:'parent',sourceId:p,targetId:`${m}${i}`})))])
  relationships.push({id:'one-parent',type:'parent',sourceId:'common',targetId:'unknown'})
  const saved=people.map((p,i)=>({id:`pos-${p.id}`,nodeId:p.id,treeId:id,x:i*190-300,y:i%2?460:80}))
  const writes:string[]=[],errors:string[]=[]
  page.on('pageerror',e=>errors.push(e.message))
  await page.setViewportSize({width:options.width||1600,height:options.width&&options.width<600?900:1000})
  await page.addInitScript(({id,dark,layout})=>{
    localStorage.setItem('geneamap_locale','fr');localStorage.setItem('geneamap-theme',dark?'dark':'light')
    localStorage.setItem('token',`e30.${btoa(JSON.stringify({exp:4102444800,id:'union-user'}))}.fixture`)
    if(!localStorage.getItem(`geneamap:tree-view:v1:${id}`))localStorage.setItem(`geneamap:tree-view:v1:${id}`,JSON.stringify({layout:layout||'vertical',cardStyle:'square',density:'spacious',connStyle:'elbow'}))
  },{id,...options})
  await page.route('**/api/**',async route=>{
    const req=route.request(),p=new URL(req.url()).pathname.replace(/^\/api/,'')
    if(req.method()==='OPTIONS'){await route.fulfill({status:204});return}
    if(req.method()!=='GET')writes.push(p)
    let data:unknown={}
    if(p==='/auth/me')data={user:{id:'union-user',role:'USER',name:'Union test',plan:'PATRIMONY',planActive:true}}
    if(p===`/family-trees/${id}`)data={tree:{id,name:'Les unions de Moussa Traore',treeType:'GENEALOGY',ownerId:'union-user',Person:people,Relationship:relationships,NodePosition:saved},access:{canRead:true,canWrite:!options.readonly,canEditPerson:!options.readonly,canExport:false,canImport:false,canVersioning:false,role:options.readonly?'viewer':'owner'}}
    if(p.startsWith('/node-positions/tree/'))data={nodePositions:saved}
    if(p==='/uploads/status')data={ready:false,enabled:false}
    await route.fulfill({json:data})
  })
  await page.goto(`/tree/${id}`)
  await expect(page.getByTestId('tree-person-card')).toHaveCount(12)
  return {id,writes,errors,saved,people}
}
async function checkPaths(page: Page) {
  expect(await page.evaluate(()=>{
    const cards=[...document.querySelectorAll('[data-testid="tree-person-card"],[data-testid="union-junction"],[data-testid="unknown-coparent"]')].map(e=>e.getBoundingClientRect())
    const paths=[...document.querySelectorAll<SVGPathElement>('[data-connection-kind]')]
    return paths.every(path=>{
      const matrix=path.getScreenCTM()!,length=path.getTotalLength()
      for(let d=0;d<=length;d+=1){const p=path.getPointAtLength(d).matrixTransform(matrix);if(cards.some(r=>p.x>r.left+1&&p.x<r.right-1&&p.y>r.top+1&&p.y<r.bottom-1))return false}
      return true
    })
  })).toBe(true)
}
for(const layout of ['vertical','horizontal'])for(const width of [375,768,1600])for(const dark of [false,true])test(`all unions ${layout} ${width}px ${dark?'dark':'light'}`,async({page},info)=>{
 const state=await fixture(page,{layout,width,dark})
 await expect(page.getByTestId('graph-unions')).toHaveAttribute('aria-pressed','true')
 await expect(page.getByTestId('union-junction')).toHaveCount(4)
 await expect(page.locator('[data-testid="tree-person-card"][data-person-id="common"]')).toHaveCount(1)
 for(const m of ['a','b','c']){
   const junction=page.getByTestId('union-junction').filter({has:page.locator(`[data-union-parent="partner-${m}"]`)})
   await expect(junction).toHaveAttribute('data-child-ids',new RegExp(`${m}1`));await expect(junction).toHaveAttribute('data-child-ids',new RegExp(`${m}2`))
 }
 await expect(page.getByTestId('unknown-coparent')).toHaveCount(1)
 await expect(page.getByText('Sans lien renseign\u00e9',{exact:true})).toHaveCount(1)
 await checkPaths(page)
 if(width===375){await expect(page.getByTestId('union-navigation')).toBeVisible();expect(parseFloat(await page.getByTestId('tree-zoom').innerText())).toBeGreaterThanOrEqual(85)}
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true)
 expect(state.errors).toEqual([]);expect(state.writes).toEqual([])
 await page.screenshot({path:info.outputPath(`unions-${layout}-${width}-${dark?'dark':'light'}.png`),fullPage:true})
})
test('mobile navigation pans, without filtering other unions or losing the common parent',async({page},info)=>{
 const state=await fixture(page,{width:375})
 await page.getByTestId('union-navigation').getByRole('button',{name:'Mariam',exact:true}).click()
 await expect(page.getByTestId('tree-person-card')).toHaveCount(12);await expect(page.getByTestId('union-junction')).toHaveCount(4)
 const family=page.getByTestId('union-junction').filter({has:page.locator('[data-union-parent="partner-c"]')})
 await expect(family).toBeInViewport();await expect(family).toContainText('Moussa Traore');await expect(family).toContainText('Mariam Diarra')
 expect(state.writes).toEqual([]);await page.screenshot({path:info.outputPath('mobile-next-union.png'),fullPage:true})
})
test('manual positions can be recovered exactly; no view preference writes to the API',async({page})=>{
 const state=await fixture(page)
 await page.getByTestId('graph-free').click();await expect(page.getByTestId('union-junction')).toHaveCount(0)
 const actual=await page.getByTestId('tree-person-card').evaluateAll(cards=>Object.fromEntries(cards.map(e=>[e.getAttribute('data-person-id'),{x:parseFloat((e as HTMLElement).style.left),y:parseFloat((e as HTMLElement).style.top)}])))
 for(const p of state.saved)expect(actual[p.nodeId]).toEqual({x:p.x,y:p.y})
 await page.getByTestId('graph-unions').click();await expect(page.getByTestId('union-junction')).toHaveCount(4)
 expect(state.writes).toEqual([])
})
test('mother with several partners is treated identically and read-only readers can navigate',async({page})=>{
 const state=await fixture(page,{maternal:true,readonly:true})
 await expect(page.getByTestId('union-junction')).toHaveCount(4)
 for(const j of await page.getByTestId('union-junction').all())await expect(j).toContainText('Aminata Traore')
 await page.getByTestId('union-junction').first().locator('[data-union-parent="common"]').click()
 await expect(page.locator('aside')).toContainText('Aminata')
 expect(state.writes).toEqual([]);expect(state.errors).toEqual([])
})
test('radial is still accessible explicitly, and By union returns to the clear vertical projection',async({page})=>{
 await fixture(page,{layout:'radial'})
 await expect(page.getByTestId('union-junction')).toHaveCount(0)
 expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('geneamap:tree-view:v1:union-overview-test')!).layout)).toBe('radial')
 await page.getByTestId('graph-unions').click();await expect(page.getByTestId('union-junction')).toHaveCount(4)
})
test('search highlights the match while retaining the real parental context',async({page})=>{
 const state=await fixture(page)
 await page.getByTestId('tree-search').fill('Bintou')
 await expect(page.getByTestId('tree-person-card')).toHaveCount(12);await expect(page.getByTestId('union-junction')).toHaveCount(4)
 await expect(page.getByText(/1 r.sultats ; contexte familial conserv/)).toBeVisible()
 expect(state.writes).toEqual([])
})
