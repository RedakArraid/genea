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
function familyLane(page: Page, partnerId: string) {
  return page.locator(`[data-testid="union-lane"][data-parent-ids*="${partnerId}"]`)
}
async function checkPaths(page: Page) {
  expect(await page.evaluate(()=>{
    const cards=[...document.querySelectorAll('[data-testid="tree-person-card"],[data-testid="unknown-coparent"]')].map(e=>e.getBoundingClientRect())
    const paths=[...document.querySelectorAll<SVGPathElement>('[data-connection-kind]')]
    return paths.every(path=>{
      const matrix=path.getScreenCTM()!,length=path.getTotalLength()
      for(let d=0;d<=length;d+=1){const p=path.getPointAtLength(d).matrixTransform(matrix);if(cards.some(r=>p.x>r.left+1&&p.x<r.right-1&&p.y>r.top+1&&p.y<r.bottom-1))return false}
      return true
    })
  })).toBe(true)
  // The old box hid a gap between parent and child paths. Now every path must
  // actually meet at the same point in the rendered SVG, not just share IDs.
  expect(await page.getByTestId('union-lane').evaluateAll(lanes=>lanes.every(lane=>{
    const key=lane.getAttribute('data-family-key'),x=Number(lane.getAttribute('data-junction-x')),y=Number(lane.getAttribute('data-junction-y'))
    const paths=[...document.querySelectorAll<SVGPathElement>('path[data-union-role]')].filter(p=>p.getAttribute('data-family-key')===key)
    const parents=paths.filter(p=>p.getAttribute('data-union-role')==='parent'),children=paths.filter(p=>p.getAttribute('data-union-role')==='child')
    if(parents.length!==(lane.getAttribute('data-parent-ids')||'').split(',').filter(Boolean).length || children.length!==(lane.getAttribute('data-child-ids')||'').split(',').filter(Boolean).length)return false
    return paths.every(path=>{
      const p=path.getPointAtLength(path.getAttribute('data-union-role')==='parent'?path.getTotalLength():0)
      return Math.hypot(p.x-x,p.y-y)<.01
    })
  }))).toBe(true)
}
for(const layout of ['vertical','horizontal'])for(const width of [375,768,1600])for(const dark of [false,true])test(`all unions ${layout} ${width}px ${dark?'dark':'light'}`,async({page},info)=>{
 const state=await fixture(page,{layout,width,dark})
 await expect(page.getByTestId('graph-unions')).toHaveAttribute('aria-pressed','true')
 await expect(page.getByTestId('union-lane')).toHaveCount(4)
 await expect(page.getByTestId('union-junction')).toHaveCount(0)
 await expect(page.locator('[data-union-parent]')).toHaveCount(0)
 await expect(page.getByText('Union renseign\u00e9e',{exact:true})).toHaveCount(0)
 await expect(page.locator('[data-testid="tree-person-card"][data-person-id="common"]')).toHaveCount(1)
 for(const m of ['a','b','c']){
   const lane=familyLane(page,`partner-${m}`)
   expect((await lane.getAttribute('data-parent-ids'))!.split(',').sort()).toEqual(['common',`partner-${m}`])
   expect((await lane.getAttribute('data-child-ids'))!.split(',').sort()).toEqual([`${m}1`,`${m}2`])
 }
 await expect(page.getByTestId('unknown-coparent')).toHaveCount(1)
 await expect(page.getByText('Sans lien renseign\u00e9',{exact:true})).toHaveCount(1)
 await checkPaths(page)
 expect(await page.getByTestId('union-lane').evaluateAll(lanes=>lanes.every(lane=>{
   const box=lane.getBoundingClientRect()
   return (lane.getAttribute('data-child-ids')||'').split(',').filter(Boolean).every(id=>{
     const card=[...document.querySelectorAll('[data-testid="tree-person-card"]')].find(el=>el.getAttribute('data-person-id')===id)!.getBoundingClientRect()
     return card.left>=box.left-1 && card.right<=box.right+1 && card.top>=box.top-1 && card.bottom<=box.bottom+1
   })
 }))).toBe(true)
 if(width===1600) expect(await page.getByTestId('tree-search').evaluate(el=>el.getBoundingClientRect().width)).toBeGreaterThanOrEqual(160)
 if(width===375){await expect(page.getByTestId('union-navigation')).toBeVisible();expect(parseFloat(await page.getByTestId('tree-zoom').innerText())).toBeGreaterThanOrEqual(85)}
 if(width===375&&layout==='vertical') expect(await page.getByTestId('tree-zoom-controls').evaluate(controls=>{
   const box=controls.getBoundingClientRect()
   return [...document.querySelectorAll('[data-testid="tree-person-card"]')].every(card=>{
     const r=card.getBoundingClientRect()
     return r.right<=box.left || r.left>=box.right || r.bottom<=box.top || r.top>=box.bottom
   })
 })).toBe(true)
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true)
 expect(state.errors).toEqual([]);expect(state.writes).toEqual([])
 await page.screenshot({path:info.outputPath(`unions-${layout}-${width}-${dark?'dark':'light'}.png`),fullPage:true})
})
test('mobile navigation pans, without filtering other unions or losing the common parent',async({page},info)=>{
 const state=await fixture(page,{width:375})
 await page.getByTestId('union-navigation').getByRole('button',{name:'Mariam',exact:true}).click()
 await expect(page.getByTestId('tree-person-card')).toHaveCount(12);await expect(page.getByTestId('union-lane')).toHaveCount(4)
 const family=familyLane(page,'partner-c')
 await expect(family).toBeInViewport();await expect(family).toHaveAttribute('aria-label',/Moussa Traore/);await expect(family).toHaveAttribute('aria-label',/Mariam Diarra/)
 await expect(page.locator('[data-testid="tree-person-card"][data-person-id="partner-c"]')).toBeInViewport()
 expect(state.writes).toEqual([]);await page.screenshot({path:info.outputPath('mobile-next-union.png'),fullPage:true})
})
test('manual positions can be recovered exactly; no view preference writes to the API',async({page})=>{
 const state=await fixture(page)
 await page.getByTestId('graph-free').click();await expect(page.getByTestId('union-lane')).toHaveCount(0)
 const actual=await page.getByTestId('tree-person-card').evaluateAll(cards=>Object.fromEntries(cards.map(e=>[e.getAttribute('data-person-id'),{x:parseFloat((e as HTMLElement).style.left),y:parseFloat((e as HTMLElement).style.top)}])))
 for(const p of state.saved)expect(actual[p.nodeId]).toEqual({x:p.x,y:p.y})
 await page.getByTestId('graph-unions').click();await expect(page.getByTestId('union-lane')).toHaveCount(4)
 expect(state.writes).toEqual([])
})
test('mother with several partners is treated identically and read-only readers can navigate',async({page})=>{
 const state=await fixture(page,{maternal:true,readonly:true})
 await expect(page.getByTestId('union-lane')).toHaveCount(4)
 for(const lane of await page.getByTestId('union-lane').all())await expect(lane).toHaveAttribute('aria-label',/Aminata Traore/)
 await page.locator('[data-testid="tree-person-card"][data-person-id="common"]').click()
 await expect(page.locator('aside')).toContainText('Aminata')
 expect(state.writes).toEqual([]);expect(state.errors).toEqual([])
})
test('radial is still accessible explicitly, and By union returns to the clear vertical projection',async({page})=>{
 await fixture(page,{layout:'radial'})
 await expect(page.getByTestId('union-lane')).toHaveCount(0)
 expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('geneamap:tree-view:v1:union-overview-test')!).layout)).toBe('radial')
 await page.getByTestId('graph-unions').click();await expect(page.getByTestId('union-lane')).toHaveCount(4)
})
test('search highlights the match while retaining the real parental context',async({page})=>{
 const state=await fixture(page)
 await page.getByTestId('tree-search').fill('Bintou')
 await expect(page.getByTestId('tree-person-card')).toHaveCount(12);await expect(page.getByTestId('union-lane')).toHaveCount(4)
 await expect(page.getByText(/1 r.sultats ; contexte familial conserv/)).toBeVisible()
 expect(state.writes).toEqual([])
})
