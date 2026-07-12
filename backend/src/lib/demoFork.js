/**
 * Copie personnelle de l'arbre démo — chaque utilisateur qui écrit sur la démo
 * obtient un clone privé (isDemo=false) au lieu de modifier l'arbre public partagé.
 */

const prisma = require('./prisma');

async function cloneDemoIntoFork(tx, demoTree, forkTreeId) {
  const [persons, positions, relationships] = await Promise.all([
    tx.person.findMany({ where: { treeId: demoTree.id } }),
    tx.nodePosition.findMany({ where: { treeId: demoTree.id } }),
    tx.relationship.findMany({
      where: { Person_Relationship_sourceIdToPerson: { treeId: demoTree.id } },
    }),
  ]);

  const personIdMap = new Map();
  for (const person of persons) {
    const clone = await tx.person.create({
      data: {
        firstName: person.firstName,
        lastName: person.lastName,
        birthDate: person.birthDate,
        birthPlace: person.birthPlace,
        deathDate: person.deathDate,
        occupation: person.occupation,
        biography: person.biography,
        gender: person.gender,
        photoUrl: person.photoUrl,
        treeId: forkTreeId,
      },
    });
    personIdMap.set(person.id, clone.id);
    await tx.demoForkMapping.create({
      data: { forkTreeId, entityType: 'person', originalId: person.id, forkedId: clone.id },
    });
  }

  for (const pos of positions) {
    const mappedNodeId = personIdMap.get(pos.nodeId);
    if (!mappedNodeId) continue;
    const clone = await tx.nodePosition.create({
      data: { nodeId: mappedNodeId, x: pos.x, y: pos.y, treeId: forkTreeId },
    });
    await tx.demoForkMapping.create({
      data: { forkTreeId, entityType: 'nodePosition', originalId: pos.id, forkedId: clone.id },
    });
  }

  for (const rel of relationships) {
    const mappedSource = personIdMap.get(rel.sourceId);
    const mappedTarget = personIdMap.get(rel.targetId);
    if (!mappedSource || !mappedTarget) continue;
    const clone = await tx.relationship.create({
      data: { type: rel.type, sourceId: mappedSource, targetId: mappedTarget },
    });
    await tx.demoForkMapping.create({
      data: { forkTreeId, entityType: 'relationship', originalId: rel.id, forkedId: clone.id },
    });
  }
}

/** Récupère ou crée la copie personnelle de la démo pour cet utilisateur. */
async function getOrCreateDemoFork(userId) {
  const existing = await prisma.familyTree.findUnique({ where: { demoForkOwnerId: userId } });
  if (existing) return existing;

  const demoTree = await prisma.familyTree.findFirst({ where: { isDemo: true } });
  if (!demoTree) {
    const err = new Error('Arbre démo introuvable');
    err.statusCode = 404;
    throw err;
  }

  return prisma.$transaction(
    async (tx) => {
      // Un autre onglet/requête concurrente a pu créer le fork entre-temps.
      const raceCheck = await tx.familyTree.findUnique({ where: { demoForkOwnerId: userId } });
      if (raceCheck) return raceCheck;

      const fork = await tx.familyTree.create({
        data: {
          name: `${demoTree.name} (votre copie)`,
          description: "Votre copie personnelle de la démo — vos modifications restent ici, l'arbre public n'est pas affecté.",
          isPublic: false,
          visibility: 'PRIVATE',
          isDemo: false,
          demoForkOwnerId: userId,
          treeType: demoTree.treeType,
          ownerId: userId,
        },
      });

      await cloneDemoIntoFork(tx, demoTree, fork.id);
      return fork;
    },
    { timeout: 15000 }
  );
}

/** Traduit l'id d'une entité de l'arbre démo canonique vers son équivalent dans le fork. */
async function translateDemoEntityId(forkTreeId, entityType, originalId) {
  const mapping = await prisma.demoForkMapping.findUnique({
    where: { forkTreeId_entityType_originalId: { forkTreeId, entityType, originalId } },
  });
  return mapping?.forkedId || null;
}

module.exports = { getOrCreateDemoFork, translateDemoEntityId };
