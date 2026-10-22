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
function verify(people, orientation, style) {
  const scene=U.computeUnionOverview(people,orientation,style)
  assert.ok(scene); assert.equal(scene.unresolved,0,'Every recorded link must be routed')
  assert.deepEqual(Object.keys(scene.positions).sort(),people.map(p=>p.id).sort(),'No duplicates or lost people')
  const {w}=G.getCardDimensions(style), heights=G.buildCardHeights(people,style)
  const cards=people.map(p=>({id:p.id,left:scene.positions[p.id].x,right:scene.positions[p.id].x+w,top:scene.positions[p.id].y,bottom:scene.positions[p.id].y+heights[p.id]}))
  const labels=scene.panels.map(p=>({id:`union:${p.family.key}`,left:p.label.x,right:p.label.x+p.label.width,top:p.label.y,bottom:p.label.y+p.label.height}))
  for(const [i,a] of [...cards,...labels].entries()) {
    assert.ok(Number.isFinite(a.left)&&Number.isFinite(a.top))
    for(const b of [...cards,...labels].slice(i+1)) assert.ok(a.right<=b.left||b.right<=a.left||a.bottom<=b.top||b.bottom<=a.top,`${a.id} overlaps ${b.id}`)
  }
  for(const p of scene.panels) {
    const parentIds=p.family.parents.map(p=>p.id).sort()
    const parents=scene.connections.filter(c=>c.family===p.family.key&&c.role==='parent')
    assert.deepEqual(parents.flatMap(c=>c.ids).sort(),parentIds)
    const children=scene.connections.filter(c=>c.family===p.family.key&&c.role==='child')
    assert.deepEqual(children.map(c=>c.childId).sort(),p.family.children.map(p=>p.id).sort())
    for(const c of children)assert.deepEqual(c.parentIds.slice().sort(),parentIds)
  }
  for(const c of scene.connections)for(let i=1;i<c.points.length;i++)for(const r of [...cards,...labels])assert.equal(R.segmentHitsCard(c.points[i-1],c.points[i],r),false,`line through ${r.id}`)
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
