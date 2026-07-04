/**
 * Script de seed — utilisateur test, arbre perso, arbre démo Famille Dupont (10 personnes)
 * Démo : lecture publique ; écriture structurelle si connecté ; fiches texte verrouillées
 */

const prisma = require('../src/lib/prisma');
const bcrypt = require('bcryptjs');

async function createRelationship(type, sourceId, targetId) {
  await prisma.relationship.create({ data: { type, sourceId, targetId } });
  if (type === 'parent') {
    await prisma.relationship.create({
      data: { type: 'child', sourceId: targetId, targetId: sourceId },
    });
  } else if (type === 'spouse' || type === 'sibling') {
    await prisma.relationship.create({
      data: { type, sourceId: targetId, targetId: sourceId },
    });
  }
}

async function main() {
  console.log('Start seeding database...');

  await prisma.treeInvite.deleteMany();
  await prisma.treeCollaborator.deleteMany();
  await prisma.relationship.deleteMany();
  await prisma.nodePosition.deleteMany();
  await prisma.edge.deleteMany();
  await prisma.person.deleteMany();
  await prisma.familyTree.deleteMany();
  await prisma.user.deleteMany();

  const hashedPassword = await bcrypt.hash('password123', 12);

  const demoOwner = await prisma.user.create({
    data: {
      name: 'GeneaIA Démo',
      email: 'demo@geneaia.app',
      password: hashedPassword,
      plan: 'PATRIMONY',
    },
  });

  const user = await prisma.user.create({
    data: {
      name: 'Utilisateur Test',
      email: 'test@example.com',
      password: hashedPassword,
      plan: 'SOLO',
    },
  });

  console.log(`Created users: ${user.email}, ${demoOwner.email}`);

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

  const demoTree = await prisma.familyTree.create({
    data: {
      name: 'Famille Dupont — Démo',
      description: 'Arbre de démonstration (10 personnes, lecture seule)',
      isPublic: true,
      visibility: 'PUBLIC',
      isDemo: true,
      ownerId: demoOwner.id,
    },
  });

  const people = {};
  const defs = [
    { key: 'jean', firstName: 'Jean', lastName: 'Dupont', birthDate: '1940-03-15', birthPlace: 'Paris', gender: 'male', occupation: 'Ingénieur retraité' },
    { key: 'marie', firstName: 'Marie', lastName: 'Dupont', birthDate: '1942-06-20', birthPlace: 'Lyon', gender: 'female', occupation: 'Enseignante retraitée' },
    { key: 'pierre', firstName: 'Pierre', lastName: 'Dupont', birthDate: '1970-09-10', birthPlace: 'Paris', gender: 'male', occupation: 'Médecin' },
    { key: 'sophie', firstName: 'Sophie', lastName: 'Dupont', birthDate: '1972-12-05', birthPlace: 'Marseille', gender: 'female', occupation: 'Architecte' },
    { key: 'paul', firstName: 'Paul', lastName: 'Dupont', birthDate: '1968-04-18', birthPlace: 'Paris', gender: 'male', occupation: 'Avocat' },
    { key: 'claire', firstName: 'Claire', lastName: 'Dupont', birthDate: '1971-11-22', birthPlace: 'Bordeaux', gender: 'female', occupation: 'Journaliste' },
    { key: 'lucie', firstName: 'Lucie', lastName: 'Dupont', birthDate: '2000-02-25', birthPlace: 'Paris', gender: 'female', occupation: 'Étudiante' },
    { key: 'thomas', firstName: 'Thomas', lastName: 'Dupont', birthDate: '2002-07-30', birthPlace: 'Paris', gender: 'male', occupation: 'Étudiant' },
    { key: 'emma', firstName: 'Emma', lastName: 'Dupont', birthDate: '2004-05-12', birthPlace: 'Paris', gender: 'female', occupation: 'Lycéenne' },
    { key: 'hugo', firstName: 'Hugo', lastName: 'Dupont', birthDate: '2006-09-08', birthPlace: 'Paris', gender: 'male', occupation: 'Collégien' },
  ];

  for (const def of defs) {
    people[def.key] = await prisma.person.create({
      data: {
        firstName: def.firstName,
        lastName: def.lastName,
        birthDate: new Date(def.birthDate),
        birthPlace: def.birthPlace,
        gender: def.gender,
        occupation: def.occupation,
        treeId: demoTree.id,
      },
    });
  }

  const positions = [
    // G1 — Jean & Marie centrés au-dessus des deux branches
    { key: 'jean', x: 400, y: 40 },
    { key: 'marie', x: 560, y: 40 },
    // G2 — branche Pierre (gauche) + branche Paul (droite)
    { key: 'pierre', x: 80, y: 290 },
    { key: 'sophie', x: 240, y: 290 },
    { key: 'paul', x: 720, y: 290 },
    { key: 'claire', x: 880, y: 290 },
    // G3 — enfants de Pierre & Sophie
    { key: 'lucie', x: 40, y: 540 },
    { key: 'thomas', x: 200, y: 540 },
    { key: 'emma', x: 360, y: 540 },
    { key: 'hugo', x: 520, y: 540 },
  ];

  await prisma.nodePosition.createMany({
    data: positions.map(({ key, x, y }) => ({
      nodeId: people[key].id,
      x,
      y,
      treeId: demoTree.id,
    })),
  });

  await createRelationship('spouse', people.jean.id, people.marie.id);
  await createRelationship('parent', people.jean.id, people.pierre.id);
  await createRelationship('parent', people.marie.id, people.pierre.id);
  await createRelationship('parent', people.jean.id, people.paul.id);
  await createRelationship('parent', people.marie.id, people.paul.id);
  await createRelationship('spouse', people.paul.id, people.claire.id);
  await createRelationship('spouse', people.pierre.id, people.sophie.id);
  await createRelationship('parent', people.pierre.id, people.lucie.id);
  await createRelationship('parent', people.sophie.id, people.lucie.id);
  await createRelationship('parent', people.pierre.id, people.thomas.id);
  await createRelationship('parent', people.sophie.id, people.thomas.id);
  await createRelationship('parent', people.pierre.id, people.emma.id);
  await createRelationship('parent', people.sophie.id, people.emma.id);
  await createRelationship('parent', people.pierre.id, people.hugo.id);
  await createRelationship('parent', people.sophie.id, people.hugo.id);
  await createRelationship('sibling', people.lucie.id, people.thomas.id);
  await createRelationship('sibling', people.emma.id, people.hugo.id);

  console.log('Created demo tree with 10 persons (read-only).');
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
