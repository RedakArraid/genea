const prisma = require('./prisma');
const { isEnabled, isReady } = require('./storage');

async function collectHealthChecks() {
  const checks = {
    api: 'ok',
    database: 'unknown',
    storage: 'unknown',
  };

  try {
    await prisma.$queryRaw`SELECT 1`;
    checks.database = 'ok';
  } catch {
    checks.database = 'error';
  }

  if (!isEnabled()) {
    checks.storage = 'disabled';
  } else if (isReady()) {
    checks.storage = 'ok';
  } else {
    checks.storage = 'error';
  }

  const storageOk = checks.storage === 'ok' || checks.storage === 'disabled';
  const ok = checks.database === 'ok' && storageOk;

  return { ok, checks };
}

module.exports = { collectHealthChecks };
