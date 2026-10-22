/**
 * Targeted regression checks for the 2026-10-22 audit.
 * Uses the real source files with mocked I/O; no database or network is accessed.
 * Run: node --test scripts/test-audit-regressions.cjs
 * This is not a replacement for the project's integration and E2E suites.
 */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const crypto = require('node:crypto');
const root = process.env.GENEAMAP_TEST_ROOT || path.resolve(__dirname, '..');

function load(relativePath, mocks = {}) {
  const filename = path.join(root, relativePath);
  const module = { exports: {} };
  vm.runInNewContext(fs.readFileSync(filename, 'utf8'), {
    module,
    exports: module.exports,
    require(name) {
      if (Object.hasOwn(mocks, name)) return mocks[name];
      if (name === 'crypto' || name === 'node:crypto') return crypto;
      throw new Error(`Unexpected dependency in isolated test: ${name}`);
    },
    process: { env: { PAYSTACK_SECRET_KEY: 'audit-test-only-not-a-real-secret' } },
    Buffer,
    console,
  }, { filename, timeout: 1000 });
  return module.exports;
}

function response() {
  return {
    locals: {}, statusCode: 200, headers: {}, body: undefined,
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; },
    setHeader(name, value) { this.headers[name] = value; },
  };
}

function edgeHarness(options = {}) {
  const observed = { authorizedTrees: [], edgeLookups: [], mappings: [], nextCount: 0 };
  const edges = {
    'edge-a': { id: 'edge-a', treeId: 'tree-a' },
    'edge-b': { id: 'edge-b', treeId: 'tree-b' },
    'demo-edge': { id: 'demo-edge', treeId: 'demo-tree' },
  };
  const middleware = load('backend/src/middleware/treeAccess.middleware.js', {
    '../lib/prisma': {
      edge: { async findUnique({ where }) {
        observed.edgeLookups.push(where.id);
        return edges[where.id] || null;
      } },
      familyTree: { async findUnique({ where }) {
        return { id: where.id, isDemo: where.id === 'demo-tree' };
      } },
    },
    '../lib/treeAccess': {
      async resolveTreeAccess() { return { role: options.admin ? 'admin' : 'demo' }; },
      async requireTreeRead() { throw new Error('Not expected in edge mutation checks'); },
      async requireTreeWrite(_userId, treeId) {
        observed.authorizedTrees.push(treeId);
        if (!['tree-a', 'fork-tree'].includes(treeId)) {
          throw Object.assign(new Error('Forbidden'), { statusCode: 403 });
        }
        return { canWrite: true, role: 'owner' };
      },
    },
    '../lib/demoFork': {
      async getOrCreateDemoFork() { return { id: 'fork-tree' }; },
      async translateDemoEntityId(treeId, type, id) {
        observed.mappings.push([treeId, type, id]);
        if (options.mappingError) throw new Error('Mapping lookup failed');
        return options.missingMapping ? null : 'fork-edge';
      },
    },
    '../lib/apiErrors': {
      sendStatusError(res, error) { return res.status(error.statusCode || 500).json({ message: error.message }); },
    },
  });
  return {
    observed,
    async invoke(params, body, method = 'PUT', anonymous = false) {
      const req = { params: { ...params }, body, method, user: anonymous ? undefined : { id: 'user-a' } };
      const res = response();
      await middleware.canWriteEdge(req, res, () => { observed.nextCount++; });
      return { req, res, observed };
    },
  };
}

for (const method of ['PUT', 'DELETE']) {
  test(`${method}: reject a foreign edge even when body names an owned tree`, async () => {
    const { res, observed } = await edgeHarness().invoke({ id: 'edge-b' }, { treeId: 'tree-a' }, method);
    assert.equal(res.statusCode, 403);
    assert.equal(observed.nextCount, 0);
    assert.deepEqual(observed.authorizedTrees, ['tree-b']);
  });
}

test('Route treeId cannot override the stored parent of an existing edge', async () => {
  const { res, observed } = await edgeHarness().invoke({ id: 'edge-b', treeId: 'tree-a' }, {});
  assert.equal(res.statusCode, 403);
  assert.equal(observed.nextCount, 0);
});

test('Missing edge returns 404 even when an owned tree is supplied', async () => {
  const { res, observed } = await edgeHarness().invoke({ id: 'missing-edge' }, { treeId: 'tree-a' });
  assert.equal(res.statusCode, 404);
  assert.equal(observed.nextCount, 0);
});

test('Authorization for an owned edge ignores a conflicting body treeId', async () => {
  const { res, observed } = await edgeHarness().invoke({ id: 'edge-a' }, { treeId: 'tree-b' });
  assert.equal(res.statusCode, 200);
  assert.equal(observed.nextCount, 1);
  assert.deepEqual(observed.authorizedTrees, ['tree-a']);
});

test('Normal update of an owned edge remains allowed', async () => {
  const { res, observed } = await edgeHarness().invoke({ id: 'edge-a' }, {});
  assert.equal(res.statusCode, 200);
  assert.equal(observed.nextCount, 1);
});

test('Create an edge in an owned tree', async () => {
  const { res, observed } = await edgeHarness().invoke({}, { treeId: 'tree-a' }, 'POST');
  assert.equal(res.statusCode, 200);
  assert.equal(observed.nextCount, 1);
  assert.equal(observed.edgeLookups.length, 0);
});

test('Reject edge creation in a foreign tree', async () => {
  const { res, observed } = await edgeHarness().invoke({}, { treeId: 'tree-b' }, 'POST');
  assert.equal(res.statusCode, 403);
  assert.equal(observed.nextCount, 0);
});

test('Reject edge creation without a tree', async () => {
  const { res, observed } = await edgeHarness().invoke({}, {}, 'POST');
  assert.equal(res.statusCode, 400);
  assert.equal(observed.nextCount, 0);
});

test('Demo edge mutation targets the personal clone, not the canonical demo', async () => {
  const { req, res, observed } = await edgeHarness().invoke({ id: 'demo-edge' }, {});
  assert.equal(res.statusCode, 200);
  assert.equal(req.params.id, 'fork-edge');
  assert.equal(req.params.treeId, 'fork-tree');
  assert.equal(observed.nextCount, 1);
  assert.deepEqual(observed.mappings, [['fork-tree', 'edge', 'demo-edge']]);
});

test('Missing demo edge mapping fails closed', async () => {
  const { res, observed } = await edgeHarness({ missingMapping: true }).invoke({ id: 'demo-edge' }, {});
  assert.equal(res.statusCode, 404);
  assert.equal(observed.nextCount, 0);
});

test('A demo mapping error does not reach the mutation controller', async () => {
  const { res, observed } = await edgeHarness({ mappingError: true }).invoke({ id: 'demo-edge' }, {});
  assert.equal(res.statusCode, 500);
  assert.equal(observed.nextCount, 0);
});

test('Anonymous demo mutation remains rejected', async () => {
  const { res, observed } = await edgeHarness().invoke({ id: 'demo-edge' }, {}, 'PUT', true);
  assert.equal(res.statusCode, 401);
  assert.equal(observed.nextCount, 0);
});

test('Preserve existing administrator demo routing behavior', async () => {
  const { req, observed } = await edgeHarness({ admin: true }).invoke({ id: 'demo-edge' }, {});
  assert.equal(req.params.id, 'demo-edge');
  assert.equal(observed.nextCount, 1);
  assert.equal(observed.mappings.length, 0);
});

test('Startup registers payment webhooks before both global body parsers (static)', () => {
  const source = fs.readFileSync(path.join(root, 'backend/src/index.js'), 'utf8');
  const webhook = source.indexOf("app.use('/api/billing/webhooks', billingWebhookRoutes)");
  assert.ok(webhook >= 0);
  assert.ok(webhook < source.indexOf('app.use(express.json('));
  assert.ok(webhook < source.indexOf('app.use(express.urlencoded('));
});

function webhookHarness(body) {
  let handlers;
  let received;
  const paystack = load('backend/src/lib/payments/paystack.js', {
    '../plans': { CURRENCY: 'USD', toPaystackAmount: value => Math.round(value * 100) },
  });
  load('backend/src/routes/billing-webhook.routes.js', {
    express: {
      Router: () => ({ post(_path, ...routeHandlers) { handlers = routeHandlers; } }),
      raw: () => function rawParserPlaceholder() {},
    },
    '../controllers/billing.controller': {
      paystackWebhook(req) { received = { raw: req.rawBody, event: req.body }; },
    },
  });
  handlers.at(-1)({ body }, response(), error => { throw error; });
  return { received, paystack };
}

const rawWebhook = '{ "event": "charge.success", "data": { "reference": "unit-test" } }';
const signature = crypto.createHmac('sha512', 'audit-test-only-not-a-real-secret').update(rawWebhook).digest('hex');

test('Webhook handler preserves signed raw bytes and decodes the event', () => {
  const { received, paystack } = webhookHarness(Buffer.from(rawWebhook));
  assert.equal(received.raw, rawWebhook);
  assert.equal(received.event.event, 'charge.success');
  assert.equal(paystack.verifyWebhookSignature(received.raw, signature), true);
});

test('Reproduction: parsing before the route destroys the expected signature input', () => {
  const { received, paystack } = webhookHarness(JSON.parse(rawWebhook));
  assert.equal(received.raw, '[object Object]');
  assert.equal(paystack.verifyWebhookSignature(received.raw, signature), false);
});

test('Webhook signatures reject tampering and missing signatures', () => {
  const { paystack } = webhookHarness(Buffer.from(rawWebhook));
  assert.equal(paystack.verifyWebhookSignature(rawWebhook + ' ', signature), false);
  assert.equal(paystack.verifyWebhookSignature(rawWebhook, undefined), false);
});

async function servePhoto() {
  let streamed = false;
  const controller = load('backend/src/controllers/upload.controller.js', {
    '../lib/prisma': {},
    '../lib/storage': {
      isReady: () => true,
      async getObjectStream() {
        return { contentType: 'image/png', contentLength: 12, stream: { pipe() { streamed = true; } } };
      },
    },
    '../lib/treeAccess': {},
    '../lib/planAccess': {},
    '../config/storage.config': { storageConfig: {} },
  });
  const res = response();
  await controller.serveFile({ path: '/photos/tree-a/photo.png' }, res, error => { throw error; });
  return { res, streamed };
}

test('Access-controlled media is not marked public or cacheable', async () => {
  const { res } = await servePhoto();
  assert.equal(res.headers['Cache-Control'], 'private, no-store');
});

test('Media streaming and content headers are preserved', async () => {
  const { res, streamed } = await servePhoto();
  assert.equal(streamed, true);
  assert.equal(res.headers['Content-Type'], 'image/png');
  assert.equal(res.headers['Content-Length'], 12);
});

test('Backend provides the build script called by the root package (static)', () => {
  const pkg = JSON.parse(fs.readFileSync(path.join(root, 'backend/package.json'), 'utf8'));
  assert.equal(pkg.scripts.build, 'npm run lint');
  assert.ok(pkg.scripts.lint);
});
