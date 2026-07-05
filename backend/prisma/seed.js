/**
 * Script de seed — admin, test user, arbre perso, démo Famille Dupont
 * Comptes : admin@geneaia.app / test@example.com / demo@geneaia.app — password123
 */

const prisma = require('../src/lib/prisma');
const bcrypt = require('bcryptjs');
const { createDemoTree } = require('../src/lib/demoTree');

async function main() {
  console.log('Start seeding database...');

  await prisma.personDocument.deleteMany();
  await prisma.treeInvite.deleteMany();
  await prisma.treeCollaborator.deleteMany();
  await prisma.relationship.deleteMany();
  await prisma.nodePosition.deleteMany();
  await prisma.edge.deleteMany();
  await prisma.person.deleteMany();
  await prisma.familyTree.deleteMany();
  await prisma.user.deleteMany();

  const hashedPassword = await bcrypt.hash('password123', 12);

  const admin = await prisma.user.create({
    data: {
      name: 'Administrateur',
      email: 'admin@geneaia.app',
      password: hashedPassword,
      plan: 'PATRIMONY',
      role: 'ADMIN',
      planActive: true,
      planExpiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    },
  });

  const demoOwner = await prisma.user.create({
    data: {
      name: 'GeneaIA Démo',
      email: 'demo@geneaia.app',
      password: hashedPassword,
      plan: 'PATRIMONY',
      role: 'USER',
      planActive: true,
      planExpiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    },
  });

  const user = await prisma.user.create({
    data: {
      name: 'Utilisateur Test',
      email: 'test@example.com',
      password: hashedPassword,
      plan: 'SOLO',
      role: 'USER',
      planActive: true,
      planExpiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
    },
  });

  const adminEmail = process.env.ADMIN_EMAIL;
  if (adminEmail && adminEmail !== 'admin@geneaia.app') {
    await prisma.user.upsert({
      where: { email: adminEmail },
      update: { role: 'ADMIN' },
      create: {
        name: 'Admin',
        email: adminEmail,
        password: hashedPassword,
        plan: 'PATRIMONY',
        role: 'ADMIN',
      },
    });
  }

  console.log(`Created users: ${admin.email}, ${user.email}, ${demoOwner.email}`);

  const personalTree = await prisma.familyTree.create({
    data: {
      name: 'Ma Famille',
      description: 'Mon arbre personnel',
      isPublic: false,
      visibility: 'PRIVATE',
      isDemo: false,
      ownerId: user.id,
    },
  });

  await prisma.person.create({
    data: {
      firstName: 'Personne',
      lastName: 'Racine',
      gender: 'other',
      biography: 'Personne racine — modifiez ces informations.',
      treeId: personalTree.id,
    },
  });

  const demoTree = await createDemoTree(demoOwner.id);

  console.log('Created demo tree with 10 persons.');
  console.log(`Demo tree ID: ${demoTree.id}`);
  console.log('Database has been seeded!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
