/**
 * Promouvoir ADMIN_EMAIL en rôle ADMIN au démarrage (idempotent).
 */
const prisma = require('../src/lib/prisma');

async function main() {
  const email = process.env.ADMIN_EMAIL?.trim();
  if (!email) {
    return;
  }

  const result = await prisma.user.updateMany({
    where: { email },
    data: { role: 'ADMIN' },
  });

  if (result.count === 0) {
    console.log(`ADMIN_EMAIL=${email}, aucun compte trouvé, promotion ignorée`);
  } else {
    console.log(`Compte ${email} promu ADMIN (${result.count})`);
  }
}

main()
  .catch((err) => {
    console.error('Erreur promotion admin:', err.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
