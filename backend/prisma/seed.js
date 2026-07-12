/**
 * Script de seed — admin, test user, arbre perso, démo Famille Dupont
 * Comptes (téléphone = identifiant principal) :
 *   0700000010 / admin@geneamap.com — admin123 (admin)
 *   0700000001 / test@example.com — password123
 *   0700000002 / demo@geneamap.com — password123
 *   0700000003 / famille40@geneamap.com — password123 (famille 40 personnes)
 *   0700000004 / testeur@geneamap.com — password123 (testeur paiement, plan inactif)
 */

const prisma = require('../src/lib/prisma');
const bcrypt = require('bcryptjs');
const { createDemoTree } = require('../src/lib/demoTree');
const { createLargeFamilyTree } = require('../src/lib/largeFamilyTree');
const { createChallengeFamilyTree } = require('../src/lib/challengeFamilyTree');

async function main() {
  console.log('Start seeding database...');

  await prisma.otpCode.deleteMany();
  await prisma.payment.deleteMany();
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
  const adminHashedPassword = await bcrypt.hash('admin123', 12);

  const admin = await prisma.user.create({
    data: {
      name: 'Administrateur',
      phone: '+2250700000010',
      email: 'admin@geneamap.com',
      password: adminHashedPassword,
      plan: 'PATRIMONY',
      role: 'ADMIN',
      planActive: true,
      planExpiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    },
  });

  const demoOwner = await prisma.user.create({
    data: {
      name: 'geneamap Démo',
      phone: '+2250700000002',
      email: 'demo@geneamap.com',
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
      phone: '+2250700000001',
      email: 'test@example.com',
      password: hashedPassword,
      plan: 'SOLO',
      role: 'USER',
      planActive: true,
      planExpiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
    },
  });

  const testeur = await prisma.user.create({
    data: {
      name: 'Testeur Paiement',
      phone: '+2250700000004',
      email: 'testeur@geneamap.com',
      password: hashedPassword,
      plan: 'SOLO',
      role: 'USER',
      planActive: false,
    },
  });

  const famille40User = await prisma.user.create({
    data: {
      name: 'Famille 40 Test',
      phone: '+2250700000003',
      email: 'famille40@geneamap.com',
      password: hashedPassword,
      plan: 'PATRIMONY',
      role: 'USER',
      planActive: true,
      planExpiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    },
  });

  const adminEmail = process.env.ADMIN_EMAIL;
  if (adminEmail && adminEmail !== 'admin@geneamap.com') {
    await prisma.user.upsert({
      where: { email: adminEmail },
      update: { role: 'ADMIN' },
      create: {
        name: 'Admin',
        phone: '+2250700000099',
        email: adminEmail,
        password: hashedPassword,
        plan: 'PATRIMONY',
        role: 'ADMIN',
      },
    });
  }

  console.log(`Created users: ${admin.phone}, ${user.phone}, ${demoOwner.phone}, ${testeur.phone}, ${famille40User.phone}`);
  console.log('Testeur CI — tel: 0700000004 | email: testeur@geneamap.com | mdp: password123');
  console.log('Famille 40 — tel: 0700000003 | email: famille40@geneamap.com | mdp: password123');

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

  const { tree: largeTree, personCount } = await createLargeFamilyTree(famille40User.id);

  const { tree: challengeTree, personCount: challengeCount } = await createChallengeFamilyTree(
    famille40User.id
  );

  console.log('Created demo tree with 10 persons.');
  console.log(`Demo tree ID: ${demoTree.id}`);
  console.log(`Created large test tree with ${personCount} persons.`);
  console.log(`Large tree ID: ${largeTree.id}`);
  console.log(`Created Challenge Family org tree with ${challengeCount} persons.`);
  console.log(`Challenge Family tree ID: ${challengeTree.id}`);
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
