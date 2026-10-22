/** Real API routers against an explicitly designated disposable local database. No storage/bootstrap jobs. */
const path = require('node:path');
const url = process.env.FAMILY_TEST_DATABASE_URL;
if (!url || !['localhost', '127.0.0.1'].includes(new URL(url).hostname) || new URL(url).pathname !== '/family_test') throw new Error('Local family_test database required');
process.env.DATABASE_URL = url;
const root = path.resolve(__dirname, '..');
const express = require(path.join(root, 'backend/node_modules/express'));
const cors = require(path.join(root, 'backend/node_modules/cors'));
const prisma = require('../backend/src/lib/prisma');
const app = express();
app.use(cors({ origin: 'http://127.0.0.1:5173', credentials: true }));
app.use(express.json());
app.use((req, res, next) => {
  const json = res.json.bind(res);
  res.json = body => json(res.locals.demoForkTreeId && body && typeof body === 'object' ? { ...body, demoForkTreeId: res.locals.demoForkTreeId } : body);
  next();
});
for (const [prefix, file] of [['auth', 'auth'], ['family-trees', 'familyTree'], ['persons', 'person'], ['relationships', 'relationship'], ['node-positions', 'nodePosition'], ['uploads', 'upload']]) {
  app.use(`/api/${prefix}`, require(`../backend/src/routes/${file}.routes`));
}
app.get('/health', (_req, res) => res.json({ testDatabase: true }));
app.use((error, _req, res, _next) => res.status(error.statusCode || 500).json({ code: error.code, message: error.message }));
prisma.$connect().then(() => {
  const server = app.listen(3001, '127.0.0.1');
  process.on('SIGTERM', () => server.close(() => prisma.$disconnect().finally(() => process.exit(0))));
}).catch(error => { console.error(error); process.exit(1); });
