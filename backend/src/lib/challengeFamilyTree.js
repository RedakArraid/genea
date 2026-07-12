/**
 * Arbre test Challenge Family - carte racine + 5 promos × 7 membres.
 * La carte « Challenge Family » est la source ; chaque président parraine la promo suivante.
 */

const prisma = require('./prisma');
const { normalizeOrgLexicon } = require('./orgLexicon');
const {
  computeVerticalOrg,
  translatePositions,
} = require('./org-layout');

const TREE_NAME = 'Challenge Family';
const MEMBERS_PER_PROMO = 7;

const SUBJECTS = [
  'Mathématiques',
  'Physique',
  'Informatique',
  'Chimie',
  'SVT',
  'Anglais',
  'Philosophie',
  'Histoire',
  'Économie',
];

const ORG_LEXICON = normalizeOrgLexicon({
  preset: 'custom',
  levelTerm: 'Génération',
  levelAbbrev: 'G',
  levelOrder: 'TOP_HIGH',
  superiorLabel: 'Président(e) génération précédente',
  subordinateLabel: 'Promo',
  addSuperior: '+ Ajouter',
  addSubordinate: '+ Ajouter',
  newSubordinate: 'Nouveau membre de promo',
  linkExistingSubordinate: 'Lier un membre existant',
  asSuperior: 'président de la génération précédente',
  asSubordinate: 'membre de la promo',
  superiorOf: 'Parrain / Marraine de {{name}}',
  subordinateOf: 'Promo de {{name}}',
  roleLabel: 'Matières enseignées',
  addTitle: 'Ajouter un membre',
});

const ROOT_ENTITY = {
  firstName: 'Challenge',
  lastName: 'Family',
  role: 'Association',
  subjects: ['Source de toutes les promos'],
  birthMonth: 1,
  birthYear: 2018,
  biography: 'Association Challenge Family, source de toutes les générations et promos',
};

/** @type {Array<{ year: number, members: Array<{ firstName: string, lastName: string, role: string, subjects: string[], birthMonth: number }> }>} */
const PROMOS = [
  {
    year: 2020,
    members: [
      { firstName: 'Amadou', lastName: 'Diallo', role: 'Président', subjects: ['Mathématiques', 'Informatique'], birthMonth: 9 },
      { firstName: 'Fatou', lastName: 'Koné', role: 'Vice-présidente', subjects: ['Physique', 'Chimie'], birthMonth: 11 },
      { firstName: 'Sekou', lastName: 'Camara', role: 'Membre', subjects: ['Mathématiques'], birthMonth: 2 },
      { firstName: 'Awa', lastName: 'Touré', role: 'Membre', subjects: ['SVT', 'Anglais'], birthMonth: 4 },
      { firstName: 'Lassana', lastName: 'Fofana', role: 'Membre', subjects: ['Informatique'], birthMonth: 6 },
      { firstName: 'Maimouna', lastName: 'Sylla', role: 'Membre', subjects: ['Philosophie'], birthMonth: 8 },
      { firstName: 'Bakary', lastName: 'Doumbia', role: 'Membre', subjects: ['Histoire', 'Économie'], birthMonth: 12 },
    ],
  },
  {
    year: 2021,
    members: [
      { firstName: 'Ibrahim', lastName: 'Traoré', role: 'Président', subjects: ['Mathématiques', 'Physique'], birthMonth: 2 },
      { firstName: 'Aïcha', lastName: 'Coulibaly', role: 'Vice-présidente', subjects: ['Informatique', 'SVT'], birthMonth: 5 },
      { firstName: 'Ousmane', lastName: 'Kanté', role: 'Membre', subjects: ['Chimie'], birthMonth: 1 },
      { firstName: 'Rokia', lastName: 'Sangaré', role: 'Membre', subjects: ['Mathématiques', 'Anglais'], birthMonth: 3 },
      { firstName: 'Cheick', lastName: 'Diarra', role: 'Membre', subjects: ['Physique'], birthMonth: 7 },
      { firstName: 'Hawa', lastName: 'Dembélé', role: 'Membre', subjects: ['Informatique', 'Philosophie'], birthMonth: 9 },
      { firstName: 'Adama', lastName: 'Konaté', role: 'Membre', subjects: ['Économie'], birthMonth: 10 },
    ],
  },
  {
    year: 2022,
    members: [
      { firstName: 'Moussa', lastName: 'Sanogo', role: 'Président', subjects: ['Chimie', 'Mathématiques'], birthMonth: 1 },
      { firstName: 'Kadiatou', lastName: 'Ouattara', role: 'Vice-présidente', subjects: ['Physique', 'Anglais'], birthMonth: 4 },
      { firstName: 'Fanta', lastName: 'Cissoko', role: 'Membre', subjects: ['SVT'], birthMonth: 2 },
      { firstName: 'Drissa', lastName: 'Maïga', role: 'Membre', subjects: ['Informatique', 'Mathématiques'], birthMonth: 5 },
      { firstName: 'Nana', lastName: 'Berté', role: 'Membre', subjects: ['Histoire'], birthMonth: 6 },
      { firstName: 'Souleymane', lastName: 'Gaye', role: 'Membre', subjects: ['Physique', 'Chimie'], birthMonth: 8 },
      { firstName: 'Aminata', lastName: 'Sow', role: 'Membre', subjects: ['Philosophie', 'Anglais'], birthMonth: 11 },
    ],
  },
  {
    year: 2023,
    members: [
      { firstName: 'Oumar', lastName: 'Bamba', role: 'Président', subjects: ['Informatique', 'Mathématiques'], birthMonth: 8 },
      { firstName: 'Salimata', lastName: 'Diabaté', role: 'Vice-présidente', subjects: ['Physique', 'Chimie'], birthMonth: 10 },
      { firstName: 'Mamadou', lastName: 'Sissoko', role: 'Membre', subjects: ['Mathématiques'], birthMonth: 3 },
      { firstName: 'Bintou', lastName: 'Keita', role: 'Membre', subjects: ['SVT', 'Anglais'], birthMonth: 4 },
      { firstName: 'Thierno', lastName: 'Bah', role: 'Membre', subjects: ['Économie', 'Histoire'], birthMonth: 6 },
      { firstName: 'Ramatou', lastName: 'Diop', role: 'Membre', subjects: ['Informatique'], birthMonth: 7 },
      { firstName: 'Lamine', lastName: 'Ndiaye', role: 'Membre', subjects: ['Philosophie'], birthMonth: 12 },
    ],
  },
  {
    year: 2024,
    members: [
      { firstName: 'Youssouf', lastName: 'Cissé', role: 'Président', subjects: ['Mathématiques', 'Physique', 'Chimie'], birthMonth: 3 },
      { firstName: 'Mariam', lastName: 'Keita', role: 'Vice-présidente', subjects: ['Informatique', 'Philosophie'], birthMonth: 6 },
      { firstName: 'Idrissa', lastName: 'Ba', role: 'Membre', subjects: ['Anglais'], birthMonth: 1 },
      { firstName: 'Coumba', lastName: 'Fall', role: 'Membre', subjects: ['SVT', 'Mathématiques'], birthMonth: 2 },
      { firstName: 'Modibo', lastName: 'Sangho', role: 'Membre', subjects: ['Physique'], birthMonth: 5 },
      { firstName: 'Astou', lastName: 'Mbaye', role: 'Membre', subjects: ['Chimie', 'Informatique'], birthMonth: 9 },
      { firstName: 'Samba', lastName: 'Wane', role: 'Membre', subjects: ['Histoire', 'Économie'], birthMonth: 11 },
    ],
  },
];

const ORIGIN_X = 600;
const ORIGIN_Y = 80;

async function createRelationship(type, sourceId, targetId) {
  await prisma.relationship.create({ data: { type, sourceId, targetId } });
  if (type === 'parent') {
    await prisma.relationship.create({
      data: { type: 'child', sourceId: targetId, targetId: sourceId },
    });
  }
}

function rootPayload(treeId) {
  return {
    firstName: ROOT_ENTITY.firstName,
    lastName: ROOT_ENTITY.lastName,
    occupation: ROOT_ENTITY.subjects.join(' · '),
    biography: ROOT_ENTITY.biography,
    birthDate: new Date(ROOT_ENTITY.birthYear, ROOT_ENTITY.birthMonth - 1, 1),
    birthPlace: 'Association',
    treeId,
  };
}

function memberPayload(member, treeId, promoYear) {
  const subjects = member.subjects.join(' · ');
  return {
    firstName: member.firstName,
    lastName: member.lastName,
    occupation: subjects,
    biography: `${member.role}, promo ${promoYear}`,
    birthDate: new Date(2000 + (promoYear - 2020), member.birthMonth - 1, 15),
    birthPlace: `Promo ${promoYear}`,
    treeId,
  };
}

/**
 * @param {string} ownerId
 * @param {{ replace?: boolean }} [options]
 */
async function createChallengeFamilyTree(ownerId, options = {}) {
  const { replace = false } = options;

  const existing = await prisma.familyTree.findFirst({
    where: { ownerId, name: TREE_NAME, isDemo: false },
    select: { id: true },
  });

  if (existing) {
    if (!replace) {
      const full = await prisma.familyTree.findUnique({ where: { id: existing.id } });
      const count = await prisma.person.count({ where: { treeId: existing.id } });
      return { tree: full, personCount: count, skipped: true, promos: [] };
    }
    await prisma.familyTree.delete({ where: { id: existing.id } });
  }

  const tree = await prisma.familyTree.create({
    data: {
      name: TREE_NAME,
      description:
        'Association Challenge Family : carte source + 5 promos de 7 membres. Le président de chaque génération parraine la promo suivante.',
      isPublic: false,
      visibility: 'PRIVATE',
      treeType: 'ORGANIZATION',
      orgLexicon: ORG_LEXICON,
      ownerId,
    },
  });

  const root = await prisma.person.create({ data: rootPayload(tree.id) });

  const created = [];
  for (const promo of PROMOS) {
    const people = [];
    for (const member of promo.members) {
      const person = await prisma.person.create({
        data: memberPayload(member, tree.id, promo.year),
      });
      people.push(person);
    }
    created.push({ year: promo.year, people, president: people[0] });
  }

  // Source → toute la promo fondatrice 2020
  for (const person of created[0].people) {
    await createRelationship('parent', root.id, person.id);
  }

  // Président promo N → les 7 membres de la promo N+1
  for (let i = 1; i < created.length; i++) {
    const prevPresident = created[i - 1].president;
    for (const person of created[i].people) {
      await createRelationship('parent', prevPresident.id, person.id);
    }
  }

  const layoutPeople = [
    { id: root.id, generation: 1, parentIds: [] },
    ...created.flatMap((promo, promoIdx) =>
      promo.people.map((person) => ({
        id: person.id,
        generation: promoIdx + 2,
        parentIds: promoIdx === 0 ? [root.id] : [created[promoIdx - 1].president.id],
      }))
    ),
  ];

  const { positions: rawPositions } = computeVerticalOrg(layoutPeople, 'spacious');
  const translated = translatePositions(rawPositions, { originY: ORIGIN_Y, centerX: ORIGIN_X });
  const positions = Object.entries(translated).map(([nodeId, pos]) => ({
    nodeId,
    x: pos.x,
    y: pos.y,
    treeId: tree.id,
  }));

  await prisma.nodePosition.createMany({ data: positions });

  return {
    tree,
    rootPersonId: root.id,
    personCount: 1 + created.length * MEMBERS_PER_PROMO,
    skipped: false,
    promos: created.map((c) => ({
      year: c.year,
      presidentId: c.president.id,
      memberIds: c.people.map((p) => p.id),
    })),
  };
}

module.exports = {
  TREE_NAME,
  MEMBERS_PER_PROMO,
  ROOT_ENTITY,
  ORG_LEXICON,
  PROMOS,
  SUBJECTS,
  createChallengeFamilyTree,
};
