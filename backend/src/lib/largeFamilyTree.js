/**
 * Arbre de test — 40 personnes sur 5 générations (Famille Traoré)
 */

const prisma = require('./prisma');

async function createRelationship(type, sourceId, targetId) {
  await prisma.relationship.create({ data: { type, sourceId, targetId } });
  if (type === 'parent') {
    await prisma.relationship.create({
      data: { type: 'child', sourceId: targetId, targetId: sourceId },
    });
  } else if (type === 'spouse') {
    await prisma.relationship.create({
      data: { type, sourceId: targetId, targetId: sourceId },
    });
  }
}

const MALE_NAMES = [
  'Amadou', 'Ibrahim', 'Moussa', 'Ousmane', 'Seydou',
  'Bakary', 'Lamine', 'Kader', 'Youssouf', 'Mamadou',
];
const FEMALE_NAMES = [
  'Fatou', 'Aïssata', 'Mariam', 'Aminata', 'Kadiatou',
  'Salimata', 'Rokia', 'Fanta', 'Hawa', 'Assetou',
];
const PLACES = ['Abidjan', 'Bouaké', 'Yamoussoukro', 'Korhogo', 'Daloa', 'San-Pédro', 'Man', 'Gagnoa'];

let maleIdx = 0;
let femaleIdx = 0;

function pickMale() {
  return MALE_NAMES[maleIdx++ % MALE_NAMES.length];
}

function pickFemale() {
  return FEMALE_NAMES[femaleIdx++ % FEMALE_NAMES.length];
}

function pickPlace(i) {
  return PLACES[i % PLACES.length];
}

function toBirthDate(year, month = 6, day = 15) {
  return new Date(Date.UTC(year, month - 1, day));
}

async function createPerson(treeId, { firstName, lastName, gender, year, place }) {
  return prisma.person.create({
    data: {
      firstName,
      lastName,
      gender,
      birthDate: toBirthDate(year),
      birthPlace: place,
      treeId,
    },
  });
}

async function createCouple(treeId, yearH, yearW, placeIndex) {
  const husband = await createPerson(treeId, {
    firstName: pickMale(),
    lastName: 'Traoré',
    gender: 'male',
    year: yearH,
    place: pickPlace(placeIndex),
  });
  const wife = await createPerson(treeId, {
    firstName: pickFemale(),
    lastName: 'Traoré',
    gender: 'female',
    year: yearW,
    place: pickPlace(placeIndex + 1),
  });
  await createRelationship('spouse', husband.id, wife.id);
  return [husband, wife];
}

async function createChild(treeId, parents, year, placeIndex, gender) {
  const childGender = gender || (year % 2 === 0 ? 'male' : 'female');
  const child = await createPerson(treeId, {
    firstName: childGender === 'male' ? pickMale() : pickFemale(),
    lastName: 'Traoré',
    gender: childGender,
    year,
    place: pickPlace(placeIndex),
  });
  for (const parent of parents) {
    await createRelationship('parent', parent.id, child.id);
  }
  return child;
}

async function createSpouse(treeId, person, year, placeIndex) {
  const spouseGender = person.gender === 'male' ? 'female' : 'male';
  const spouse = await createPerson(treeId, {
    firstName: spouseGender === 'male' ? pickMale() : pickFemale(),
    lastName: 'Traoré',
    gender: spouseGender,
    year,
    place: pickPlace(placeIndex),
  });
  await createRelationship('spouse', person.id, spouse.id);
  return spouse;
}

async function populateLargeTree(treeId) {
  maleIdx = 0;
  femaleIdx = 0;
  const all = [];
  const positions = [];
  let y = 40;

  const [g1h, g1w] = await createCouple(treeId, 1935, 1938, 0);
  all.push(g1h, g1w);
  positions.push({ x: 400, y }, { x: 560, y });
  y += 250;

  const g2Couples = [];
  for (let i = 0; i < 4; i++) {
    const child = await createChild(treeId, [g1h, g1w], 1960 + i * 2, i, i % 2 === 0 ? 'male' : 'female');
    const spouse = await createSpouse(treeId, child, 1962 + i * 2, i + 2);
    g2Couples.push([child, spouse]);
    all.push(child, spouse);
    positions.push({ x: 80 + i * 320, y }, { x: 200 + i * 320, y });
  }
  y += 250;

  const g3Couples = [];
  for (let i = 0; i < 3; i++) {
    const [parent1, parent2] = g2Couples[i];
    for (let j = 0; j < 2; j++) {
      const child = await createChild(
        treeId,
        [parent1, parent2],
        1990 + i * 3 + j,
        i + j,
        j % 2 === 0 ? 'male' : 'female'
      );
      const spouse = await createSpouse(treeId, child, 1991 + i * 3 + j, i + j + 3);
      g3Couples.push([child, spouse]);
      all.push(child, spouse);
      const idx = g3Couples.length - 1;
      positions.push({ x: 60 + idx * 200, y }, { x: 140 + idx * 200, y });
    }
  }
  y += 250;

  const g4Couples = [];
  for (let i = 0; i < 3; i++) {
    const [parent1, parent2] = g3Couples[i];
    for (let j = 0; j < 2; j++) {
      const child = await createChild(
        treeId,
        [parent1, parent2],
        2015 + i + j,
        i,
        j % 2 === 0 ? 'male' : 'female'
      );
      const spouse = await createSpouse(treeId, child, 2016 + i + j, i + j);
      g4Couples.push([child, spouse]);
      all.push(child, spouse);
      const idx = g4Couples.length - 1;
      positions.push({ x: 60 + idx * 200, y }, { x: 140 + idx * 200, y });
    }
  }
  y += 250;

  for (let i = 0; i < 3; i++) {
    const [parent1, parent2] = g4Couples[i];
    for (let j = 0; j < 2; j++) {
      const child = await createChild(
        treeId,
        [parent1, parent2],
        2020 + i + j,
        i,
        j % 2 === 0 ? 'male' : 'female'
      );
      all.push(child);
      const idx = i * 2 + j;
      positions.push({ x: 120 + idx * 160, y });
    }
  }

  await prisma.nodePosition.createMany({
    data: all.map((person, index) => ({
      nodeId: person.id,
      x: positions[index]?.x ?? 100,
      y: positions[index]?.y ?? 40,
      treeId,
    })),
  });

  return { personCount: all.length };
}

async function createLargeFamilyTree(ownerId) {
  const tree = await prisma.familyTree.create({
    data: {
      name: 'Famille Traoré',
      description: 'Arbre de test — 40 personnes sur 5 générations',
      isPublic: false,
      visibility: 'PRIVATE',
      isDemo: false,
      ownerId,
    },
  });
  const { personCount } = await populateLargeTree(tree.id);
  return { tree, personCount };
}

module.exports = { createLargeFamilyTree, populateLargeTree };
