/**
 * Extraction et collage de sous-arbres (personnes + relations + positions).
 */

const prisma = require('./prisma');
const { assertPersonCapacity } = require('./planAccess');

const PERSON_SELECT = {
  firstName: true,
  lastName: true,
  birthDate: true,
  birthPlace: true,
  deathDate: true,
  occupation: true,
  biography: true,
  gender: true,
};

async function collectSubtreePersonIds(treeId, rootPersonId, mode = 'branch') {
  const root = await prisma.person.findFirst({ where: { id: rootPersonId, treeId } });
  if (!root) {
    const err = new Error('Personne introuvable dans cet arbre');
    err.statusCode = 404;
    throw err;
  }

  if (mode === 'entire') {
    const all = await prisma.person.findMany({ where: { treeId }, select: { id: true } });
    return new Set(all.map((p) => p.id));
  }

  const ids = new Set([rootPersonId]);
  const queue = [rootPersonId];

  while (queue.length > 0) {
    const current = queue.shift();
    const rels = await prisma.relationship.findMany({
      where: { OR: [{ sourceId: current }, { targetId: current }] },
    });

    for (const rel of rels) {
      if (rel.type === 'parent' && rel.sourceId === current) {
        const childId = rel.targetId;
        if (!ids.has(childId)) {
          ids.add(childId);
          queue.push(childId);
        }
      } else if (rel.type === 'child' && rel.targetId === current) {
        const childId = rel.sourceId;
        if (!ids.has(childId)) {
          ids.add(childId);
          queue.push(childId);
        }
      } else if (rel.type === 'spouse') {
        const other = rel.sourceId === current ? rel.targetId : rel.sourceId;
        ids.add(other);
      }
    }
  }

  const inTree = await prisma.person.findMany({
    where: { treeId, id: { in: [...ids] } },
    select: { id: true },
  });
  return new Set(inTree.map((p) => p.id));
}

function normalizeRelationshipsForClipboard(rels, personIdSet) {
  const result = [];
  const seen = new Set();

  for (const rel of rels) {
    if (!personIdSet.has(rel.sourceId) || !personIdSet.has(rel.targetId)) continue;
    if (rel.type === 'child' || rel.type === 'sibling') continue;

    if (rel.type === 'parent') {
      const key = `parent:${rel.sourceId}:${rel.targetId}`;
      if (seen.has(key)) continue;
      seen.add(key);
      result.push({ type: 'parent', sourceId: rel.sourceId, targetId: rel.targetId });
    } else if (rel.type === 'spouse') {
      const key = `spouse:${[rel.sourceId, rel.targetId].sort().join(':')}`;
      if (seen.has(key)) continue;
      seen.add(key);
      result.push({ type: 'spouse', sourceId: rel.sourceId, targetId: rel.targetId });
    }
  }

  return result;
}

async function createRelationshipWithMirror(tx, { type, sourceId, targetId }) {
  const existing = await tx.relationship.findFirst({
    where: { sourceId, targetId, type },
  });
  if (!existing) {
    await tx.relationship.create({ data: { type, sourceId, targetId } });
  }

  if (type === 'parent') {
    const reverse = await tx.relationship.findFirst({
      where: { type: 'child', sourceId: targetId, targetId: sourceId },
    });
    if (!reverse) {
      await tx.relationship.create({ data: { type: 'child', sourceId: targetId, targetId: sourceId } });
    }
  } else if (type === 'spouse') {
    const reverse = await tx.relationship.findFirst({
      where: { type: 'spouse', sourceId: targetId, targetId: sourceId },
    });
    if (!reverse) {
      await tx.relationship.create({ data: { type: 'spouse', sourceId: targetId, targetId: sourceId } });
    }
  }
}

async function extractSubtree(treeId, rootPersonId, { mode = 'branch' } = {}) {
  const personIdSet = await collectSubtreePersonIds(treeId, rootPersonId, mode);
  const personIds = [...personIdSet];

  const [persons, positions, relationships] = await Promise.all([
    prisma.person.findMany({
      where: { id: { in: personIds } },
      select: { id: true, ...PERSON_SELECT },
    }),
    prisma.nodePosition.findMany({
      where: { treeId, nodeId: { in: personIds } },
      select: { nodeId: true, x: true, y: true },
    }),
    prisma.relationship.findMany({
      where: {
        OR: [
          { sourceId: { in: personIds } },
          { targetId: { in: personIds } },
        ],
      },
    }),
  ]);

  return {
    rootPersonId,
    mode,
    personCount: persons.length,
    clipboard: {
      persons: persons.map((p) => ({ ...p, id: p.id })),
      relationships: normalizeRelationshipsForClipboard(relationships, personIdSet),
      positions: positions.map((pos) => ({ nodeId: pos.nodeId, x: pos.x, y: pos.y })),
    },
  };
}

function computePositionOffset(clipboard, anchor) {
  const positions = clipboard.positions || [];
  if (!positions.length) {
    return { dx: anchor?.x ?? 100, dy: anchor?.y ?? 100 };
  }
  const minX = Math.min(...positions.map((p) => p.x));
  const minY = Math.min(...positions.map((p) => p.y));
  return {
    dx: (anchor?.x ?? 100) - minX,
    dy: (anchor?.y ?? 100) - minY,
  };
}

async function pasteSubtree(targetTreeId, ownerId, clipboard, options = {}) {
  const { anchor, attachToPersonId, attachAs, rootPersonId } = options;
  const persons = clipboard?.persons || [];
  if (persons.length === 0) {
    const err = new Error('Presse-papiers vide');
    err.statusCode = 400;
    throw err;
  }

  const targetTree = await prisma.familyTree.findUnique({ where: { id: targetTreeId } });
  if (!targetTree) {
    const err = new Error('Arbre cible introuvable');
    err.statusCode = 404;
    throw err;
  }

  await assertPersonCapacity(ownerId, targetTreeId, {
    additional: persons.length,
    isDemo: targetTree.isDemo,
  });

  if (attachToPersonId) {
    const anchorPerson = await prisma.person.findFirst({
      where: { id: attachToPersonId, treeId: targetTreeId },
    });
    if (!anchorPerson) {
      const err = new Error('Personne d\'ancrage introuvable dans l\'arbre cible');
      err.statusCode = 404;
      throw err;
    }
  }

  let resolvedAnchor = anchor;
  if (attachToPersonId && !resolvedAnchor) {
    const attachPos = await prisma.nodePosition.findFirst({
      where: { nodeId: attachToPersonId, treeId: targetTreeId },
    });
    resolvedAnchor = {
      x: attachPos?.x ?? 100,
      y: (attachPos?.y ?? 100) + 220,
    };
  }

  const { dx, dy } = computePositionOffset(clipboard, resolvedAnchor);
  const idMap = new Map();
  const oldRootId = rootPersonId || persons[0]?.id;

  const result = await prisma.$transaction(async (tx) => {
    const createdPersons = [];

    for (const person of persons) {
      const created = await tx.person.create({
        data: {
          treeId: targetTreeId,
          firstName: person.firstName,
          lastName: person.lastName,
          birthDate: person.birthDate ? new Date(person.birthDate) : null,
          birthPlace: person.birthPlace || null,
          deathDate: person.deathDate ? new Date(person.deathDate) : null,
          occupation: person.occupation || null,
          biography: person.biography || null,
          gender: person.gender || null,
        },
      });
      idMap.set(person.id, created.id);
      createdPersons.push(created);
    }

    for (const rel of clipboard.relationships || []) {
      const sourceId = idMap.get(rel.sourceId);
      const targetId = idMap.get(rel.targetId);
      if (!sourceId || !targetId) continue;
      await createRelationshipWithMirror(tx, { type: rel.type, sourceId, targetId });
    }

    for (const pos of clipboard.positions || []) {
      const newNodeId = idMap.get(pos.nodeId);
      if (!newNodeId) continue;
      await tx.nodePosition.create({
        data: {
          treeId: targetTreeId,
          nodeId: newNodeId,
          x: pos.x + dx,
          y: pos.y + dy,
        },
      });
    }

    let fallbackIdx = 0;
    for (const person of persons) {
      const newId = idMap.get(person.id);
      if (!newId) continue;
      const hasPos = (clipboard.positions || []).some((p) => p.nodeId === person.id);
      if (!hasPos) {
        await tx.nodePosition.create({
          data: {
            treeId: targetTreeId,
            nodeId: newId,
            x: (resolvedAnchor?.x ?? 100) + fallbackIdx * 48,
            y: (resolvedAnchor?.y ?? 100) + fallbackIdx * 48,
          },
        });
        fallbackIdx += 1;
      }
    }

    if (attachToPersonId && attachAs) {
      const pastedRootId = idMap.get(oldRootId);
      if (pastedRootId) {
        if (attachAs === 'child') {
          await createRelationshipWithMirror(tx, {
            type: 'parent',
            sourceId: attachToPersonId,
            targetId: pastedRootId,
          });
        } else if (attachAs === 'spouse') {
          await createRelationshipWithMirror(tx, {
            type: 'spouse',
            sourceId: attachToPersonId,
            targetId: pastedRootId,
          });
        }
      }
    }

    return { createdPersons, pastedRootId: idMap.get(oldRootId) || null };
  });

  const idMapObject = Object.fromEntries(idMap.entries());
  return {
    pastedPersonCount: result.createdPersons.length,
    pastedRootId: result.pastedRootId,
    idMap: idMapObject,
  };
}

module.exports = {
  extractSubtree,
  pasteSubtree,
  collectSubtreePersonIds,
};
