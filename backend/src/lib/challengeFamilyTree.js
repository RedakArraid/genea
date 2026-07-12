/**
 * Arbre test Challenge Family — 5 promos, président + vice-président par génération.
 * Chaîne : le président de la promo N est supérieur (parent) du binôme promo N+1.
 */

const prisma = require('./prisma');
const { normalizeOrgLexicon } = require('./orgLexicon');

const TREE_NAME = 'Challenge Family';
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

/** @type {Array<{ year: number, president: object, vicePresident: object }>} */
const PROMOS = [
  {
    year: 2020,
    president: {
      firstName: 'Amadou',
      lastName: 'Diallo',
      occupation: 'Mathématiques · Informatique',
      biography: 'Président — Promo 2020 (génération fondatrice)',
      birthDate: '2002-09-14',
    },
    vicePresident: {
      firstName: 'Fatou',
      lastName: 'Koné',
      occupation: 'Physique · Chimie',
      biography: 'Vice-présidente — Promo 2020',
      birthDate: '2002-11-03',
    },
  },
  {
    year: 2021,
    president: {
      firstName: 'Ibrahim',
      lastName: 'Traoré',
      occupation: 'Mathématiques · Physique',
      biography: 'Président — Promo 2021',
      birthDate: '2003-02-18',
    },
    vicePresident: {
      firstName: 'Aïcha',
      lastName: 'Coulibaly',
      occupation: 'Informatique · SVT',
      biography: 'Vice-présidente — Promo 2021',
      birthDate: '2003-05-22',
    },
  },
  {
    year: 2022,
    president: {
      firstName: 'Moussa',
      lastName: 'Sanogo',
      occupation: 'Chimie · Mathématiques',
      biography: 'Président — Promo 2022',
      birthDate: '2004-01-07',
    },
    vicePresident: {
      firstName: 'Kadiatou',
      lastName: 'Ouattara',
      occupation: 'Physique · Anglais',
      biography: 'Vice-présidente — Promo 2022',
      birthDate: '2004-04-12',
    },
  },
  {
    year: 2023,
    president: {
      firstName: 'Oumar',
      lastName: 'Bamba',
      occupation: 'Informatique · Mathématiques',
      biography: 'Président — Promo 2023',
      birthDate: '2005-08-30',
    },
    vicePresident: {
      firstName: 'Salimata',
      lastName: 'Diabaté',
      occupation: 'Physique · Chimie',
      biography: 'Vice-présidente — Promo 2023',
      birthDate: '2005-10-15',
    },
  },
  {
    year: 2024,
    president: {
      firstName: 'Youssouf',
      lastName: 'Cissé',
      occupation: 'Mathématiques · Physique · Chimie',
      biography: 'Président — Promo 2024',
      birthDate: '2006-03-25',
    },
    vicePresident: {
      firstName: 'Mariam',
      lastName: 'Keita',
      occupation: 'Informatique · Philosophie',
      biography: 'Vice-présidente — Promo 2024',
      birthDate: '2006-06-08',
    },
  },
];

const CARD_W = 140;
const CARD_H = 200;
const H_GAP = 48;
const V_GAP = 120;
const ORIGIN_X = 320;
const ORIGIN_Y = 80;

async function createRelationship(type, sourceId, targetId) {
  await prisma.relationship.create({ data: { type, sourceId, targetId } });
  if (type === 'parent') {
    await prisma.relationship.create({
      data: { type: 'child', sourceId: targetId, targetId: sourceId },
    });
  }
}

function personPayload(def, treeId, promoYear) {
  return {
    firstName: def.firstName,
    lastName: def.lastName,
    occupation: def.occupation,
    biography: def.biography,
    birthDate: def.birthDate ? new Date(def.birthDate) : null,
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
      return { tree: full, personCount: 10, skipped: true, promos: [] };
    }
    await prisma.familyTree.delete({ where: { id: existing.id } });
  }

  const tree = await prisma.familyTree.create({
    data: {
      name: TREE_NAME,
      description:
        'Association Challenge Family — 5 promos. Chaque promo a un président et un vice-président. Le président de la génération précédente parraine la promo suivante.',
      isPublic: false,
      visibility: 'PRIVATE',
      treeType: 'ORGANIZATION',
      orgLexicon: ORG_LEXICON,
      ownerId,
    },
  });

  const created = [];
  for (let i = 0; i < PROMOS.length; i++) {
    const promo = PROMOS[i];
    const pres = await prisma.person.create({
      data: personPayload(promo.president, tree.id, promo.year),
    });
    const vp = await prisma.person.create({
      data: personPayload(promo.vicePresident, tree.id, promo.year),
    });
    created.push({ year: promo.year, pres, vp });
  }

  // Chaîne : président promo N → président + VP promo N+1
  for (let i = 1; i < created.length; i++) {
    const prevPres = created[i - 1].pres;
    const { pres, vp } = created[i];
    await createRelationship('parent', prevPres.id, pres.id);
    await createRelationship('parent', prevPres.id, vp.id);
  }

  // Positions initiales (layout org vertical)
  const positions = [];
  for (let i = 0; i < created.length; i++) {
    const y = ORIGIN_Y + i * (CARD_H + V_GAP);
    const rowW = CARD_W * 2 + H_GAP;
    const x0 = ORIGIN_X - rowW / 2 + CARD_W / 2;
    positions.push(
      { nodeId: created[i].pres.id, x: x0, y, treeId: tree.id },
      { nodeId: created[i].vp.id, x: x0 + CARD_W + H_GAP, y, treeId: tree.id }
    );
  }
  await prisma.nodePosition.createMany({ data: positions });

  return {
    tree,
    personCount: created.length * 2,
    skipped: false,
    promos: created.map((c) => ({
      year: c.year,
      presidentId: c.pres.id,
      vicePresidentId: c.vp.id,
    })),
  };
}

module.exports = {
  TREE_NAME,
  ORG_LEXICON,
  PROMOS,
  createChallengeFamilyTree,
};
