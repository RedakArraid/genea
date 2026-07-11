/**
 * Arbre démo Famille Dupont — création et réinitialisation
 */

const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const prisma = require('./prisma');

const DEMO_OWNER_EMAIL = 'demo@geneamap.com';
const DEMO_OWNER_PHONE = '+2250700000002';

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

const PERSON_DEFS = [
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

const POSITIONS = [
  { key: 'jean', x: 400, y: 40 },
  { key: 'marie', x: 560, y: 40 },
  { key: 'pierre', x: 80, y: 290 },
  { key: 'sophie', x: 240, y: 290 },
  { key: 'paul', x: 720, y: 290 },
  { key: 'claire', x: 880, y: 290 },
  { key: 'lucie', x: 40, y: 540 },
  { key: 'thomas', x: 200, y: 540 },
  { key: 'emma', x: 360, y: 540 },
  { key: 'hugo', x: 520, y: 540 },
];

async function populateDemoTree(demoTreeId) {
  const people = {};
  for (const def of PERSON_DEFS) {
    people[def.key] = await prisma.person.create({
      data: {
        firstName: def.firstName,
        lastName: def.lastName,
        birthDate: new Date(def.birthDate),
        birthPlace: def.birthPlace,
        gender: def.gender,
        occupation: def.occupation,
        treeId: demoTreeId,
      },
    });
  }

  await prisma.nodePosition.createMany({
    data: POSITIONS.map(({ key, x, y }) => ({
      nodeId: people[key].id,
      x,
      y,
      treeId: demoTreeId,
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

  return { personCount: PERSON_DEFS.length };
}

async function createDemoTree(ownerId) {
  const demoTree = await prisma.familyTree.create({
    data: {
      name: 'Famille Dupont — Démo',
      description: 'Arbre de démonstration (10 personnes)',
      isPublic: true,
      visibility: 'PUBLIC',
      isDemo: true,
      ownerId,
    },
  });
  await populateDemoTree(demoTree.id);
  return demoTree;
}

async function getOrCreateDemoOwner() {
  let owner = await prisma.user.findUnique({ where: { email: DEMO_OWNER_EMAIL } });
  if (owner) return owner;

  owner = await prisma.user.findFirst({
    where: { role: 'ADMIN' },
    orderBy: { createdAt: 'asc' },
  });
  if (owner) return owner;

  const phoneTaken = await prisma.user.findUnique({ where: { phone: DEMO_OWNER_PHONE } });
  const password = await bcrypt.hash(crypto.randomBytes(32).toString('hex'), 12);

  owner = await prisma.user.create({
    data: {
      name: 'geneamap Démo',
      phone: phoneTaken ? `+999${String(Date.now()).slice(-10)}` : DEMO_OWNER_PHONE,
      email: DEMO_OWNER_EMAIL,
      password,
      plan: 'PATRIMONY',
      role: 'USER',
      planActive: true,
      planExpiresAt: new Date(Date.now() + 10 * 365 * 24 * 60 * 60 * 1000),
      locale: 'fr',
    },
  });
  console.log('[demo] Compte propriétaire démo créé automatiquement');
  return owner;
}

const DEMO_TREE_SELECT = { id: true, name: true, description: true };

async function ensureDemoTree() {
  let tree = await prisma.familyTree.findFirst({
    where: { isDemo: true },
    select: DEMO_TREE_SELECT,
  });
  if (tree) return tree;

  try {
    const owner = await getOrCreateDemoOwner();
    const created = await createDemoTree(owner.id);
    console.log('[demo] Arbre démo créé automatiquement:', created.id);
    return { id: created.id, name: created.name, description: created.description };
  } catch (err) {
    tree = await prisma.familyTree.findFirst({
      where: { isDemo: true },
      select: DEMO_TREE_SELECT,
    });
    if (tree) return tree;
    throw err;
  }
}

async function resetDemoTree() {
  const existing = await prisma.familyTree.findFirst({ where: { isDemo: true } });
  if (existing) {
    await prisma.familyTree.delete({ where: { id: existing.id } });
  }

  const owner = await getOrCreateDemoOwner();
  const demoTree = await createDemoTree(owner.id);
  return demoTree;
}

async function getDemoTreeInfo() {
  const tree = await prisma.familyTree.findFirst({
    where: { isDemo: true },
    include: {
      User: { select: { id: true, email: true, name: true } },
      _count: { select: { Person: true } },
    },
  });
  return tree;
}

module.exports = {
  createDemoTree,
  populateDemoTree,
  ensureDemoTree,
  getOrCreateDemoOwner,
  resetDemoTree,
  getDemoTreeInfo,
};
