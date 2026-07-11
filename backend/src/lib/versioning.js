const prisma = require('./prisma');
const { getEffectivePlanLimits } = require('./planAccess');

const MAX_REVISIONS = 50;

async function ownerCanVersion(treeId) {
  const tree = await prisma.familyTree.findUnique({ where: { id: treeId } });
  if (!tree) return false;
  const owner = await prisma.user.findUnique({ where: { id: tree.ownerId } });
  if (!owner) return false;
  return !!getEffectivePlanLimits(owner).canVersioning;
}

function personSnapshot(person) {
  return {
    firstName: person.firstName,
    lastName: person.lastName,
    birthDate: person.birthDate,
    birthPlace: person.birthPlace,
    deathDate: person.deathDate,
    occupation: person.occupation,
    biography: person.biography,
    gender: person.gender,
    photoUrl: person.photoUrl,
  };
}

async function recordPersonRevision(person, userId, action) {
  if (!person || !userId) return;
  const allowed = await ownerCanVersion(person.treeId);
  if (!allowed) return;

  await prisma.personRevision.create({
    data: {
      personId: person.id,
      treeId: person.treeId,
      userId,
      action,
      snapshot: personSnapshot(person),
    },
  });

  const old = await prisma.personRevision.findMany({
    where: { personId: person.id },
    orderBy: { createdAt: 'desc' },
    skip: MAX_REVISIONS,
    select: { id: true },
  });
  if (old.length) {
    await prisma.personRevision.deleteMany({ where: { id: { in: old.map((r) => r.id) } } });
  }
}

async function listPersonRevisions(personId) {
  const revisions = await prisma.personRevision.findMany({
    where: { personId },
    orderBy: { createdAt: 'desc' },
    take: MAX_REVISIONS,
  });
  return revisions;
}

module.exports = {
  ownerCanVersion,
  recordPersonRevision,
  listPersonRevisions,
  personSnapshot,
};
