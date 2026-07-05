/**
 * Créer ou promouvoir le compte admin au démarrage (idempotent).
 * Variables : ADMIN_EMAIL, ADMIN_PASSWORD (optionnel), ADMIN_PHONE (optionnel).
 */
const bcrypt = require('bcryptjs');
const prisma = require('../src/lib/prisma');

async function main() {
  const email = process.env.ADMIN_EMAIL?.trim()?.toLowerCase();
  if (!email) {
    return;
  }

  const phone = process.env.ADMIN_PHONE?.trim() || '+2250700000010';
  const rawPassword = process.env.ADMIN_PASSWORD;
  const hashedPassword = rawPassword ? await bcrypt.hash(rawPassword, 12) : null;

  const byEmail = await prisma.user.findUnique({ where: { email } });
  if (byEmail) {
    await prisma.user.update({
      where: { id: byEmail.id },
      data: {
        role: 'ADMIN',
        plan: 'PATRIMONY',
        planActive: true,
        ...(hashedPassword ? { password: hashedPassword } : {}),
      },
    });
    console.log(`Compte admin ${email} mis à jour (rôle ADMIN)`);
    return;
  }

  const byPhone = await prisma.user.findUnique({ where: { phone } });
  if (byPhone) {
    await prisma.user.update({
      where: { id: byPhone.id },
      data: {
        email,
        role: 'ADMIN',
        plan: 'PATRIMONY',
        planActive: true,
        ...(hashedPassword ? { password: hashedPassword } : {}),
      },
    });
    console.log(`Compte ${phone} promu admin avec email ${email}`);
    return;
  }

  const password = hashedPassword || await bcrypt.hash('admin123', 12);
  await prisma.user.create({
    data: {
      name: 'Administrateur',
      phone,
      email,
      password,
      role: 'ADMIN',
      plan: 'PATRIMONY',
      planActive: true,
      planExpiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    },
  });
  console.log(`Compte admin créé : ${email} (${phone})`);
}

main()
  .catch((err) => {
    console.error('Erreur ensure-admin:', err.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
