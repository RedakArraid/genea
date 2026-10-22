/** Live PostgreSQL + real Express routes. Only an explicitly designated local test database is allowed. */
const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const url = process.env.FAMILY_TEST_DATABASE_URL;
if (!url || !['localhost', '127.0.0.1'].includes(new URL(url).hostname) || new URL(url).pathname !== '/family_test') {
  throw new Error('FAMILY_TEST_DATABASE_URL must explicitly target localhost/family_test');
}
process.env.DATABASE_URL = url;
process.env.JWT_SECRET = 'local-family-tests-only-not-a-deployment-secret';
const express = require(path.join(root, 'backend/node_modules/express'));
const request = require(path.join(root, 'backend/node_modules/supertest'));
const jwt = require(path.join(root, 'backend/node_modules/jsonwebtoken'));
const prisma = require('../backend/src/lib/prisma');
const mutations = require('../backend/src/lib/familyMutation');
const app = express();
app.use(express.json());
app.use('/api/persons', require('../backend/src/routes/person.routes'));
app.use('/api/relationships', require('../backend/src/routes/relationship.routes'));
app.use((error, _req, res, _next) => res.status(error.statusCode || 500).json({ code: error.code, message: error.message }));
let owner, reader, tree, otherTree, father, mothers, token;
const post = (route, body, auth = token) => request(app).post(route).set('Authorization', `Bearer ${auth}`).send(body);
const create = body => post(`/api/persons/tree/${tree.id}/family-member`, body);
const link = (childId, parentIds) => post(`/api/persons/tree/${tree.id}/link-child`, { childId, parentIds });
const field = (name, links = []) => ({ firstName: name, lastName: 'Test', clientRequestId: randomUUID(), links });
const parentsOf = async id => {
  const rows = await prisma.relationship.findMany({ where: { targetId: id, type: 'parent' } });
  return rows.map(r => r.sourceId).sort();
};
before(async () => {
  owner = await prisma.user.create({ data: { phone: `test-${randomUUID()}`, password: 'not-used', plan: 'PATRIMONY', planActive: true, planExpiresAt: new Date('2099-01-01') } });
  reader = await prisma.user.create({ data: { phone: `test-${randomUUID()}`, password: 'not-used' } });
  token = jwt.sign({ id: owner.id }, process.env.JWT_SECRET);
  tree = await prisma.familyTree.create({ data: { name: 'Family integrity test', ownerId: owner.id } });
  otherTree = await prisma.familyTree.create({ data: { name: 'Other test tree', ownerId: reader.id } });
  father = await prisma.person.create({ data: { firstName: 'Father', lastName: 'Test', treeId: tree.id } });
  mothers = await Promise.all([1, 2, 3].map(i => prisma.person.create({ data: { firstName: `Mother ${i}`, lastName: 'Test', treeId: tree.id } })));
});
after(async () => {
  if (tree) await prisma.familyTree.deleteMany({ where: { id: { in: [tree.id, otherTree.id] } } });
  if (owner) await prisma.user.deleteMany({ where: { id: { in: [owner.id, reader.id] } } });
  await prisma.$disconnect();
});
test('real API creates six half siblings with only their selected parents and reciprocal records', async () => {
  for (const mother of mothers) for (let i = 0; i < 2; i++) {
    const response = await create(field(`Child ${mother.id}-${i}`, [{ type: 'child', personId: father.id }, { type: 'child', personId: mother.id }]));
    assert.equal(response.status, 201, JSON.stringify(response.body));
    assert.deepEqual(await parentsOf(response.body.person.id), [father.id, mother.id].sort());
    assert.equal(await prisma.relationship.count({ where: { sourceId: response.body.person.id, type: 'child' } }), 2);
  }
});
test('unknown co-parent is not replaced by a spouse', async () => {
  const response = await create(field('One known parent', [{ type: 'child', personId: father.id }]));
  assert.equal(response.status, 201);
  assert.deepEqual(await parentsOf(response.body.person.id), [father.id]);
});
test('invalid second parent rejects the complete request without creating a person', async () => {
  const payload = field('Must not exist', [{ type: 'child', personId: father.id }, { type: 'child', personId: randomUUID() }]);
  const response = await create(payload);
  assert.equal(response.status, 400);
  assert.equal(await prisma.person.count({ where: { id: payload.clientRequestId } }), 0);
});
test('cross-tree parents are rejected even when the caller owns the child tree', async () => {
  const outsider = await prisma.person.create({ data: { firstName: 'Foreign', lastName: 'Test', treeId: otherTree.id } });
  const response = await create(field('Foreign attempt', [{ type: 'child', personId: father.id }, { type: 'child', personId: outsider.id }]));
  assert.equal(response.status, 400);
});
test('unauthenticated and read-only callers cannot mutate family links', async () => {
  assert.equal((await request(app).post(`/api/persons/tree/${tree.id}/family-member`).send(field('Anonymous'))).status, 401);
  await prisma.treeCollaborator.create({ data: { treeId: tree.id, userId: reader.id, role: 'VIEWER' } });
  const denied = await post(`/api/persons/tree/${tree.id}/family-member`, field('Reader'), jwt.sign({ id: reader.id }, process.env.JWT_SECRET));
  assert.equal(denied.status, 403);
});
test('retry/concurrent identical request creates exactly one person', async () => {
  const payload = field('Retry', [{ type: 'child', personId: father.id }, { type: 'child', personId: mothers[1].id }]);
  const responses = await Promise.all(Array.from({ length: 6 }, () => create(payload)));
  assert.equal(responses.filter(r => r.status === 201).length, 1, JSON.stringify(responses.map(r => r.body)));
  assert.ok(responses.every(r => [200, 201].includes(r.status)));
  assert.equal(await prisma.person.count({ where: { id: payload.clientRequestId } }), 1);
  assert.equal(await prisma.relationship.count({ where: { sourceId: payload.clientRequestId } }), 2);
});
test('reusing a request id with a different mother is rejected', async () => {
  const payload = field('Fixed request', [{ type: 'child', personId: father.id }, { type: 'child', personId: mothers[0].id }]);
  assert.equal((await create(payload)).status, 201);
  const changed = await create({ ...payload, links: [{ type: 'child', personId: father.id }, { type: 'child', personId: mothers[1].id }] });
  assert.equal(changed.status, 409);
  assert.deepEqual(await parentsOf(payload.clientRequestId), [father.id, mothers[0].id].sort());
});
test('linking an existing child is atomic and idempotent', async () => {
  const response = await create(field('Existing child'));
  const childId = response.body.person.id;
  const responses = await Promise.all(Array.from({ length: 4 }, () => link(childId, [father.id, mothers[2].id])));
  assert.ok(responses.every(r => r.status === 200), JSON.stringify(responses.map(r => r.body)));
  assert.deepEqual(await parentsOf(childId), [father.id, mothers[2].id].sort());
  const conflict = await link(childId, [father.id, mothers[0].id]);
  assert.equal(conflict.status, 409);
  assert.equal(conflict.body.code, 'PARENT_SET_CONFLICT');
  assert.deepEqual(await parentsOf(childId), [father.id, mothers[2].id].sort());
});
test('self-parenting and cycles are rejected by the legacy relationship endpoint', async () => {
  const response = await create(field('Descendant', [{ type: 'child', personId: father.id }]));
  const cycle = await post('/api/relationships', { type: 'parent', sourceId: response.body.person.id, targetId: father.id });
  assert.equal(cycle.status, 409);
  assert.equal(cycle.body.code, 'ANCESTRY_CYCLE');
  assert.equal((await post('/api/relationships', { type: 'parent', sourceId: father.id, targetId: father.id })).status, 400);
});
test('delete removes both directions of one filiation, not the other mother or other children', async () => {
  const response = await create(field('Deletion', [{ type: 'child', personId: father.id }, { type: 'child', personId: mothers[0].id }]));
  const childId = response.body.person.id;
  const relation = await prisma.relationship.findFirst({ where: { sourceId: mothers[0].id, targetId: childId, type: 'parent' } });
  assert.equal((await request(app).delete(`/api/relationships/${relation.id}`).set('Authorization', `Bearer ${token}`)).status, 200);
  assert.deepEqual(await parentsOf(childId), [father.id]);
  assert.equal(await prisma.relationship.count({ where: { sourceId: childId, targetId: mothers[0].id, type: 'child' } }), 0);
});
test('failure during second parent write rolls back person, first parent and node position', async () => {
  const payload = { ...field('Injected failure', [{ type: 'child', personId: father.id }, { type: 'child', personId: mothers[0].id }]), position: { x: 1, y: 2 } };
  let writes = 0;
  const injected = { $transaction: (operation, options) => prisma.$transaction(tx => operation(new Proxy(tx, { get(target, key) {
    if (key === 'relationship') return new Proxy(target.relationship, { get(model, method) {
      if (method === 'createMany') return async args => { if (++writes === 2) throw new Error('injected second-parent failure'); return model.createMany(args); };
      return model[method];
    } });
    return target[key];
  } })), options) };
  await assert.rejects(mutations.createMember(injected, tree.id, payload), /injected/);
  assert.equal(await prisma.person.count({ where: { id: payload.clientRequestId } }), 0);
  assert.equal(await prisma.relationship.count({ where: { OR: [{ sourceId: payload.clientRequestId }, { targetId: payload.clientRequestId }] } }), 0);
  assert.equal(await prisma.nodePosition.count({ where: { nodeId: payload.clientRequestId } }), 0);
});

test('exact 4x7 family persists 33 people and 56 parent links without crossing mothers', async () => {
  const largeTree = await prisma.familyTree.create({ data: { name: 'Four partners seven children', ownerId: owner.id } });
  try {
    const add = async (name, links = []) => {
      const payload = field(name, links);
      const response = await post(`/api/persons/tree/${largeTree.id}/family-member`, payload);
      assert.equal(response.status, 201, JSON.stringify(response.body));
      return { person: response.body.person, payload };
    };
    const { person: dad } = await add('Common father');
    const pairs = [];
    for (let i = 0; i < 4; i++) {
      const { person: mother } = await add(`Partner ${i}`, [{ type: 'spouse', personId: dad.id }]);
      const children = [];
      for (let j = 0; j < 7; j++) {
        const child = await add(`Child ${i}-${j}`, [{ type: 'child', personId: dad.id }, { type: 'child', personId: mother.id }]);
        children.push(child);
      }
      pairs.push({ mother, children });
    }
    assert.equal(await prisma.person.count({ where: { treeId: largeTree.id } }), 33);
    for (const pair of pairs) for (const { person } of pair.children) {
      assert.deepEqual(await parentsOf(person.id), [dad.id, pair.mother.id].sort());
      assert.equal(await prisma.relationship.count({ where: { sourceId: person.id, type: 'child' } }), 2);
    }
    const ids = (await prisma.person.findMany({ where: { treeId: largeTree.id }, select: { id: true } })).map(p => p.id);
    assert.equal(await prisma.relationship.count({ where: { sourceId: { in: ids }, type: 'parent' } }), 56);
    assert.equal(await prisma.relationship.count({ where: { sourceId: { in: ids }, type: 'spouse' } }), 8);
    const retry = await post(`/api/persons/tree/${largeTree.id}/family-member`, pairs[0].children[0].payload);
    assert.equal(retry.status, 200);
    const conflict = await post(`/api/persons/tree/${largeTree.id}/link-child`, { childId: pairs[0].children[0].person.id, parentIds: [dad.id, pairs[1].mother.id] });
    assert.equal(conflict.status, 409);
    assert.deepEqual(await parentsOf(pairs[0].children[0].person.id), [dad.id, pairs[0].mother.id].sort());
    assert.equal(await prisma.person.count({ where: { treeId: largeTree.id } }), 33);
  } finally {
    await prisma.familyTree.deleteMany({ where: { id: largeTree.id } });
  }
});
