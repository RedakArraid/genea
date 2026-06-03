/**
 * Script de seed pour Prisma
 * Ajoute des données initiales à la base de données
 */

const prisma = require('../src/lib/prisma');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

async function main() {
  console.log('Start seeding database...');

  // Supprimer les données existantes pour éviter les doublons
  await prisma.relationship.deleteMany();
  await prisma.nodePosition.deleteMany();
  await prisma.edge.deleteMany();
  await prisma.person.deleteMany();
  await prisma.familyTree.deleteMany();
  await prisma.user.deleteMany();

  // Créer un utilisateur de test
  const hashedPassword = await bcrypt.hash('password123', 12);
  
  const user = await prisma.user.create({
    data: {
      name: 'Utilisateur Test',
      email: 'test@example.com',
      password: hashedPassword
    }
  });

  console.log(`Created user: ${user.email}`);

  // Créer un arbre généalogique de test
  const familyTree = await prisma.familyTree.create({
    data: {
      name: 'Ma Famille',
      description: 'Un arbre généalogique de démonstration',
      isPublic: true,
      ownerId: user.id
    }
  });

  console.log(`Created family tree: ${familyTree.name}`);

  // Créer quelques personnes
  const grandpere = await prisma.person.create({
    data: {
      firstName: 'Jean',
      lastName: 'Dupont',
      birthDate: new Date('1940-03-15'),
      birthPlace: 'Paris',
      gender: 'male',
      occupation: 'Ingénieur à la retraite',
      treeId: familyTree.id
    }
  });

  const grandmere = await prisma.person.create({
    data: {
      firstName: 'Marie',
      lastName: 'Dupont',
      birthDate: new Date('1942-06-20'),
      birthPlace: 'Lyon',
      gender: 'female',
      occupation: 'Enseignante à la retraite',
      treeId: familyTree.id
    }
  });

  const pere = await prisma.person.create({
    data: {
      firstName: 'Pierre',
      lastName: 'Dupont',
      birthDate: new Date('1970-09-10'),
      birthPlace: 'Paris',
      gender: 'male',
      occupation: 'Médecin',
      treeId: familyTree.id
    }
  });

  const mere = await prisma.person.create({
    data: {
      firstName: 'Sophie',
      lastName: 'Dupont',
      birthDate: new Date('1972-12-05'),
      birthPlace: 'Marseille',
      gender: 'female',
      occupation: 'Architecte',
      treeId: familyTree.id
    }
  });

  const enfant1 = await prisma.person.create({
    data: {
      firstName: 'Lucie',
      lastName: 'Dupont',
      birthDate: new Date('2000-02-25'),
      birthPlace: 'Paris',
      gender: 'female',
      occupation: 'Étudiante',
      treeId: familyTree.id
    }
  });

  const enfant2 = await prisma.person.create({
    data: {
      firstName: 'Thomas',
      lastName: 'Dupont',
      birthDate: new Date('2002-07-30'),
      birthPlace: 'Paris',
      gender: 'male',
      occupation: 'Étudiant',
      treeId: familyTree.id
    }
  });

  console.log(`Created 6 persons in the family tree.`);

  // Créer les positions des nœuds
  await prisma.nodePosition.createMany({
    data: [
      { nodeId: grandpere.id, x: 100, y: 100, treeId: familyTree.id },
      { nodeId: grandmere.id, x: 300, y: 100, treeId: familyTree.id },
      { nodeId: pere.id, x: 200, y: 250, treeId: familyTree.id },
      { nodeId: mere.id, x: 400, y: 250, treeId: familyTree.id },
      { nodeId: enfant1.id, x: 200, y: 400, treeId: familyTree.id },
      { nodeId: enfant2.id, x: 400, y: 400, treeId: familyTree.id }
    ]
  });

  console.log(`Created node positions.`);

  // Créer les relations (une seule direction par relation pour éviter la redondance)
  const relationships = [
    // Relations entre grands-parents
    { type: 'spouse', sourceId: grandpere.id, targetId: grandmere.id },
    
    // Relations parent-enfant (grands-parents -> père)
    { type: 'parent', sourceId: grandpere.id, targetId: pere.id },
    { type: 'parent', sourceId: grandmere.id, targetId: pere.id },
    
    // Relations entre parents
    { type: 'spouse', sourceId: pere.id, targetId: mere.id },
    
    // Relations parent-enfant (parents -> enfants)
    { type: 'parent', sourceId: pere.id, targetId: enfant1.id },
    { type: 'parent', sourceId: pere.id, targetId: enfant2.id },
    { type: 'parent', sourceId: mere.id, targetId: enfant1.id },
    { type: 'parent', sourceId: mere.id, targetId: enfant2.id },
    
    // Relations frère-sœur
    { type: 'sibling', sourceId: enfant1.id, targetId: enfant2.id }
  ];
  
  // Créer toutes les relations
  for (const rel of relationships) {
    await prisma.relationship.create({ data: rel });
  }

  // Créer les arêtes pour ReactFlow
  await prisma.edge.createMany({
    data: [
      {
        source: grandpere.id,
        target: grandmere.id,
        type: 'default',
        data: JSON.stringify({ type: 'spouse_connection' }),
        treeId: familyTree.id
      },
      {
        source: grandpere.id,
        target: pere.id,
        type: 'default',
        data: JSON.stringify({ type: 'parent_child_connection' }),
        treeId: familyTree.id
      },
      {
        source: grandmere.id,
        target: pere.id,
        type: 'default',
        data: JSON.stringify({ type: 'parent_child_connection' }),
        treeId: familyTree.id
      },
      {
        source: pere.id,
        target: mere.id,
        type: 'default',
        data: JSON.stringify({ type: 'spouse_connection' }),
        treeId: familyTree.id
      },
      {
        source: pere.id,
        target: enfant1.id,
        type: 'default',
        data: JSON.stringify({ type: 'parent_child_connection' }),
        treeId: familyTree.id
      },
      {
        source: pere.id,
        target: enfant2.id,
        type: 'default',
        data: JSON.stringify({ type: 'parent_child_connection' }),
        treeId: familyTree.id
      },
      {
        source: mere.id,
        target: enfant1.id,
        type: 'default',
        data: JSON.stringify({ type: 'parent_child_connection' }),
        treeId: familyTree.id
      },
      {
        source: mere.id,
        target: enfant2.id,
        type: 'default',
        data: JSON.stringify({ type: 'parent_child_connection' }),
        treeId: familyTree.id
      }
    ]
  });

  console.log(`Created relationships and edges.`);
  console.log(`Database has been seeded!`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
