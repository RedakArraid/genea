const prisma = require('./prisma');
const { normalizePhone, looksLikePhone } = require('./phone');

async function findUserByLogin(login) {
  const trimmed = (login || '').trim();
  if (!trimmed) return null;

  if (looksLikePhone(trimmed)) {
    const phone = normalizePhone(trimmed);
    return prisma.user.findUnique({ where: { phone } });
  }

  if (trimmed.includes('@')) {
    return prisma.user.findUnique({
      where: { email: trimmed.toLowerCase() },
    });
  }

  return null;
}

module.exports = { findUserByLogin };
