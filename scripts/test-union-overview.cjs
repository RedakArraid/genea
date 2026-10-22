const test = require('node:test'), assert = require('node:assert/strict')
const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm')
const root = path.resolve(__dirname, '..'), ts = require(path.join(root, 'frontend/node_modules/typescript'))
const cache = new Map()
function load(file) {
  file = path.resolve(root, file); if (!path.extname(file)) file += '.ts'
  if (cache.has(file)) return cache.get(file)
  const module = { exports: {} }; cache.set(file, module.exports)
  const source = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText
  vm.runInThisContext(`(function(require,module,exports){${source}\n})`, { filename: file })(name => load(path.resolve(path.dirname(file), name)), module, module.exports)
  return module.exports
}
const U=load('frontend/src/utils/union-overview.ts'), G=load('frontend/src/lib/tree-geometry.ts'), R=load('frontend/src/utils/readable-connections.ts')
function person(id, parents=[], spouses=[], generation=1) { return { id, given:id, sur:'Test', born:null, died:null, birthDate:null, deathDate:null, place:'', bio:{fr:'',en:''}, generation, tone:'stone', parentIds:parents, spouseIds:spouses, photoUrl:null,isAlive:true } }
function fixture(n=3,common='father') {
  const people=[person(common,[],Array.from({length:n},(_,i)=>`partner-${i}`))]
  for(let i=0;i<n;i++) { people.push(person(`partner-${i}`,[],[common])); for(let j=0;j<2;j++)people.push(person(`child-${i}-${j}`,[common,`partner-${i}`],[],2)) }
  people.push(person('unknown-child',[common],[],2),person('isolated'))
  return people
}
function verify(people, orientation, style, options) {
  const scene=U.computeUnionOverview(people,orientation,style,options)
  assert.ok(scene); assert.equal(scene.unresolved,0,'Every recorded link must be routed')
  assert.deepEqual(Object.keys(scene.positions).sort(),people.map(p=>p.id).sort(),'No duplicates or lost people')
  const sizes=scene.cardSizes
  const cards=people.map(p=>({id:p.id,left:scene.positions[p.id].x,right:scene.positions[p.id].x+sizes[p.id].w,top:scene.positions[p.id].y,bottom:scene.positions[p.id].y+sizes[p.id].h}))
  const unknowns=scene.panels.filter(p=>p.unknown).map(p=>({id:`unknown:${p.family.key}`,left:p.unknown.x,right:p.unknown.x+p.unknown.width,top:p.unknown.y,bottom:p.unknown.y+p.unknown.height}))
  const obstacles=[...cards,...unknowns]
  for(const [i,a] of obstacles.entries()) {
    assert.ok(Number.isFinite(a.left)&&Number.isFinite(a.top))
    for(const b of obstacles.slice(i+1)) assert.ok(a.right<=b.left||b.right<=a.left||a.bottom<=b.top||b.bottom<=a.top,`${a.id} overlaps ${b.id}`)
  }
  for(const p of scene.panels) {
    assert.equal('label' in p,false,'No intermediate label box remains in the layout')
    assert.ok(Number.isFinite(p.junction.x)&&Number.isFinite(p.junction.y))
    for(const r of obstacles) assert.ok(p.junction.x<=r.left||p.junction.x>=r.right||p.junction.y<=r.top||p.junction.y>=r.bottom,'A join must not lie inside a card')
    const parentIds=p.family.parents.map(p=>p.id).sort()
    const parents=scene.connections.filter(c=>c.family===p.family.key&&c.role==='parent')
    assert.deepEqual(parents.flatMap(c=>c.ids).sort(),parentIds)
    const children=scene.connections.filter(c=>c.family===p.family.key&&c.role==='child')
    assert.deepEqual(children.map(c=>c.childId).sort(),p.family.children.map(p=>p.id).sort())
    // Without the box, the rendered parent and child paths must meet exactly.
    for(const c of parents) assert.deepEqual(c.points.at(-1),p.junction,'Parent path is disconnected')
    for(const c of children) {
      assert.deepEqual(c.parentIds.slice().sort(),parentIds)
      assert.deepEqual(c.points[0],p.junction,'Child path is disconnected')
    }
    // Simple leaf fratries must fit inside their own visible family frame.
    if(p.family.children.every(child=>!scene.panels.some(other=>other.family.parents.some(parent=>parent.id===child.id)))) {
      for(const child of p.family.children) {
        const pos=scene.positions[child.id]
        assert.ok(pos.x>=p.x && pos.x+sizes[child.id].w<=p.x+p.width,`${child.id} outside family width`)
        assert.ok(pos.y>=p.y && pos.y+sizes[child.id].h<=p.y+p.height,`${child.id} outside family height`)
      }
    }
  }
  for(const c of scene.connections)for(let i=1;i<c.points.length;i++)for(const r of obstacles)assert.equal(R.segmentHitsCard(c.points[i-1],c.points[i],r),false,`line through ${r.id}`)
  for(const [i,a]of scene.connections.entries())for(const b of scene.connections.slice(i+1))if(a.family!==b.family)for(let j=1;j<a.points.length;j++)for(let k=1;k<b.points.length;k++)assert.equal(R.segmentsOverlap(a.points[j-1],a.points[j],b.points[k-1],b.points[k]),false,'different families share a segment')
  return scene
}
for(const n of [2,3,6,12])for(const common of ['father','mother'])for(const direction of ['vertical','horizontal'])for(const style of ['square','round','minimal','horizontal'])test(`${n} unions, ${common}, ${direction}, ${style}`,()=>verify(fixture(n,common),direction,style))
test('grandparents, a child with two unions, a childless partner and unmarried co-parents remain visible',()=>{
 const p=fixture();p[0].parentIds=['grandfather','grandmother'];p.push(person('grandfather',[],['grandmother']),person('grandmother',[],['grandfather']))
 p.find(p=>p.id==='child-0-0').spouseIds=['next-a','next-b'];p.push(person('next-a',[],['child-0-0'],2),person('next-b',[],['child-0-0'],2),person('grandchild',['child-0-0','next-a'],[],3));
 p[0].spouseIds.push('no-children');p.push(person('no-children',[],['father']))
 p.push(person('coparent'),person('other-child',['father','coparent'],[],2))
 verify(p,'vertical','square');verify(p,'horizontal','square')
})
test('input order cannot reorder unions or lose children',()=>{
 const p=fixture(), a=verify(p,'vertical','square'), b=verify([...p].reverse(),'vertical','square')
 assert.deepEqual(a.positions,b.positions);assert.deepEqual(a.panels.map(f=>f.family.key),b.panels.map(f=>f.family.key))
})
test('a cycle is reported as unsupported instead of freezing or deleting ancestry',()=>{
 const p=[person('a',['b']),person('b',['a'])]
 assert.equal(U.computeUnionOverview(p),null)
})
test('radial remains a separately selectable free graph, not an ignored setting',()=>assert.equal(U.computeUnionOverview(fixture(),'radial'),null))
test('empty tree is supported by the existing canvas',()=>assert.equal(U.computeUnionOverview([]),null))
for(const orientation of ['vertical','horizontal'])test(`removed union card leaves no reserved gap: ${orientation}`,()=>{
 const people=fixture(),scene=verify(people,orientation,'square')
 const horizontal=orientation==='horizontal',{w}=G.getCardDimensions('square'),heights=G.buildCardHeights(people,'square')
 const axis=horizontal?'x':'y'
 for(const panel of scene.panels) {
   const parentEdge=Math.max(...panel.family.parents.map(p=>scene.positions[p.id][axis]+(horizontal?w:heights[p.id])), panel.unknown ? panel.unknown[axis]+(horizontal?panel.unknown.width:panel.unknown.height) : -Infinity)
   const childEdge=Math.min(...panel.family.children.map(p=>scene.positions[p.id][axis]))
   const corridor=childEdge-parentEdge
   assert.ok(corridor>=96 && corridor<=180,`Routing corridor ${corridor}px must not reserve an intermediate card`)
 }
})

function largeFamily() {
 const p=[person('father',[],['a','b','c','d'])]
 for(const partner of ['a','b','c','d']) {
  p.push(person(partner,[],['father']))
  for(let i=0;i<7;i++) p.push(person(`${partner}-${i}`,['father',partner],[],2))
 }
 return p
}
function panelRows(scene, people, direction) {
 return [...new Set(people.map(p=>p.generation))].map(g=>{
  const row=people.filter(p=>p.generation===g)
  return new Set(row.map(p=>direction==='horizontal'?scene.positions[p.id].x:scene.positions[p.id].y)).size
 })
}
const V=load('frontend/src/utils/union-viewport.ts')
for(const direction of ['vertical','horizontal'])for(const style of ['square','round','minimal','horizontal'])for(const narrow of [false,true])test(`compact 4x7 ${direction}/${style}/${narrow?'narrow':'wide'}`,()=>{
 const people=largeFamily(), scene=verify(people,direction,style,{narrow})
 assert.equal(scene.panels.length,4)
 assert.equal(scene.compactIds.length,narrow?33:28)
 for(const panel of scene.panels) {
  assert.ok(panel.compact)
  const cross=p=>direction==='horizontal'?p.y:p.x
  const generationAxis=p=>direction==='horizontal'?p.x:p.y
  assert.equal(new Set(panel.family.children.map(p=>generationAxis(scene.positions[p.id]))).size,1,'One generation must stay on one visual axis')
  assert.equal(new Set(panel.family.children.map(p=>cross(scene.positions[p.id]))).size,7,'Compact siblings remain distinct along the generation row')
  assert.ok(panel.family.children.every(p=>p.generation===2),'Compaction cannot change a generation')
 }
 assert.deepEqual(U.computeUnionOverview([...people].reverse(),direction,style,{narrow}).positions,scene.positions)
 if(direction==='vertical' && style==='square' && !narrow) {
  assert.ok(scene.bounds.height<1000,JSON.stringify(scene.bounds))
  assert.deepEqual(panelRows(scene, people, direction), [1, 1], 'The wide canvas may scroll, but each generation keeps one axis')
 }
})

for(const direction of ['vertical','horizontal']) test(`every linked person in the same generation shares one visual axis: ${direction}`,()=>{
 const people=largeFamily(), scene=verify(people,direction,'square')
 const axis=p=>direction==='horizontal'?scene.positions[p.id].x:scene.positions[p.id].y
 for(const generation of [...new Set(people.map(p=>p.generation))]) {
  const row=people.filter(p=>p.generation===generation)
  assert.equal(new Set(row.map(axis)).size,1,`generation ${generation} is not aligned`)
 }
})

test('compact mobile navigation keeps one common parent above each chosen family',()=>{
 const people=largeFamily(), initial=U.computeUnionOverview(people,'vertical','square',{narrow:true})
 for(const family of initial.panels) {
  const scene=verify(people,'vertical','square',{narrow:true,focusedFamily:family.family.key})
  const view=V.unionReadingView(scene,375,766,172,family.family.key)
  assert.ok(view.scale>=.85)
  const visible = id => {
   const pos=scene.positions[id],size=scene.cardSizes[id]
   return pos.x*view.scale+view.pan.x>=0 && (pos.x+size.w)*view.scale+view.pan.x<=375
     && pos.y*view.scale+view.pan.y>=172 && (pos.y+size.h)*view.scale+view.pan.y<=714
  }
  for(const p of family.family.parents) assert.ok(visible(p.id),'Both recorded parents remain the mobile anchor')
  const childAxis = new Set(family.family.children.map(p=>scene.positions[p.id].y))
  assert.equal(childAxis.size,1,'Children stay aligned even when the row requires horizontal panning')
  assert.ok(family.family.children.some(p=>visible(p.id)),'At least one child remains in the readable starting viewport')
  }
})
test('full card opt-out preserves all links and restores the normal card sizes',()=>{
 const people=largeFamily(), scene=verify(people,'vertical','square',{compactSiblings:false})
 assert.equal(scene.compactIds.length,0)
 for(const p of people)assert.deepEqual(scene.cardSizes[p.id],G.getCardDimensions('square'))
 assert.equal(scene.connections.length,36)
})
test('a sibling with descendants is never wrapped into a false intermediate generation',()=>{
 const p=largeFamily();p.push(person('grandchild',['a-0'],[],3))
 const scene=verify(p,'vertical','square')
 assert.ok(!scene.compactIds.includes('a-0'))
 assert.equal(scene.panels.find(p=>p.family.parents.some(p=>p.id==='a')).compact,false)
 assert.equal(scene.panels.find(p=>p.family.parents.some(p=>p.id==='b')).compact,true)
})
