/** Atomic family writes. All cooperating writers lock the tree before checking links. */
const { randomUUID } = require('node:crypto');

function fail(statusCode, code, message) {
  throw Object.assign(new Error(message), { statusCode, code });
}
const inverse = (type) => ({ parent: 'child', child: 'parent', spouse: 'spouse', sibling: 'sibling' })[type];

async function withTreeMutation(prisma, treeId, operation) {
  return prisma.$transaction(async (tx) => {
    // Parameterized SQL, not a dynamically interpolated query. Serializes checks and writes.
    const rows = await tx.$queryRaw`SELECT "id" FROM "FamilyTree" WHERE "id" = ${treeId} FOR UPDATE`;
    if (!rows.length) fail(404, 'TREE_NOT_FOUND', 'Arbre introuvable');
    const tree = await tx.familyTree.findUnique({ where: { id: treeId } });
    return operation(tx, tree);
  }, { maxWait: 10000, timeout: 20000 });
}

async function peopleInTree(tx, treeId, ids) {
  const unique = [...new Set(ids)];
  const people = await tx.person.findMany({ where: { id: { in: unique }, treeId } });
  if (people.length !== unique.length) fail(400, 'FAMILY_PERSON_OUTSIDE_TREE', 'Chaque personne doit appartenir au meme arbre');
  return people;
}

async function parentGraph(tx, treeId) {
  const people = await tx.person.findMany({ where: { treeId }, select: { id: true } });
  const ids = people.map((p) => p.id);
  const links = await tx.relationship.findMany({ where: { sourceId: { in: ids }, targetId: { in: ids }, type: { in: ['parent', 'child'] } } });
  const children = new Map(ids.map((id) => [id, new Set()]));
  const parents = new Map(ids.map((id) => [id, new Set()]));
  for (const link of links) {
    const parent = link.type === 'parent' ? link.sourceId : link.targetId;
    const child = link.type === 'parent' ? link.targetId : link.sourceId;
    children.get(parent)?.add(child);
    parents.get(child)?.add(parent);
  }
  return { children, parents };
}
function reaches(graph, from, to) {
  const seen = new Set(), pending = [from];
  for (let i = 0; i < pending.length; i++) {
    const id = pending[i];
    if (id === to) return true;
    if (seen.has(id)) continue;
    seen.add(id);
    pending.push(...(graph.get(id) || []));
  }
  return false;
}

async function writeLink(tx, tree, type, sourceId, targetId, allowExisting = false) {
  const reverse = inverse(type);
  if (!reverse) fail(400, 'INVALID_RELATIONSHIP', 'Type de relation invalide');
  if (sourceId === targetId) fail(400, 'SELF_RELATIONSHIP', 'Une personne ne peut pas etre liee a elle-meme');
  await peopleInTree(tx, tree.id, [sourceId, targetId]);
  if (tree.treeType === 'ORGANIZATION' && ['spouse', 'sibling'].includes(type)) {
    fail(400, 'INVALID_ORGANIZATION_RELATIONSHIP', 'Relation familiale interdite dans un organigramme');
  }
  const pair = [{ type, sourceId, targetId }, { type: reverse, sourceId: targetId, targetId: sourceId }];
  const existing = await tx.relationship.findMany({ where: { OR: pair } });
  if (existing.length && !allowExisting) fail(409, 'RELATIONSHIP_EXISTS', 'Cette relation existe deja');
  if (type === 'parent' || type === 'child') {
    const parent = type === 'parent' ? sourceId : targetId;
    const child = type === 'parent' ? targetId : sourceId;
    const { children } = await parentGraph(tx, tree.id);
    if (reaches(children, child, parent)) fail(409, 'ANCESTRY_CYCLE', 'Cette filiation creerait un cycle');
  }
  const missing = pair.filter((row) => !existing.some((r) => r.type === row.type && r.sourceId === row.sourceId && r.targetId === row.targetId));
  if (missing.length) await tx.relationship.createMany({ data: missing });
  return tx.relationship.findFirst({ where: pair[0] });
}

function memberData(body, treeId) {
  const firstName = typeof body.firstName === 'string' ? body.firstName.trim() : '';
  if (!firstName) fail(400, 'INVALID_PERSON', 'Le prenom est requis');
  const text = (key) => {
    if (body[key] != null && typeof body[key] !== 'string') fail(400, 'INVALID_PERSON', 'Champ texte invalide');
    return body[key] || null;
  };
  const date = (key) => {
    if (!body[key]) return null;
    const value = new Date(body[key]);
    if (!Number.isFinite(value.getTime())) fail(400, 'INVALID_PERSON_DATE', 'Date invalide');
    return value;
  };
  const birthDate = date('birthDate'), deathDate = date('deathDate');
  const today = new Date(); today.setHours(23, 59, 59, 999);
  if (birthDate && birthDate > today) fail(400, 'INVALID_PERSON_DATE', 'Date de naissance future');
  if (birthDate && deathDate && deathDate < birthDate) fail(400, 'INVALID_PERSON_DATE', 'La date de fin precede la date de naissance');
  const gender = text('gender');
  if (gender && !['male', 'female', 'other'].includes(gender)) fail(400, 'INVALID_PERSON', 'Genre invalide');
  const lastName = text('lastName');
  return { treeId, firstName, lastName: lastName?.trim() || '-', birthDate, deathDate,
    birthPlace: text('birthPlace'), occupation: text('occupation'), biography: text('biography'), gender, photoUrl: text('photoUrl') };
}

async function createMember(prisma, treeId, body, checkCapacity = async () => {}) {
  const links = body.links ?? [];
  if (!Array.isArray(links) || links.length > 2 || links.some((l) => !l || !['parent', 'child', 'spouse'].includes(l.type) || typeof l.personId !== 'string' || !l.personId)) {
    fail(400, 'INVALID_FAMILY_LINKS', 'Filiations invalides');
  }
  if (new Set(links.map((l) => l.personId)).size !== links.length || (links.length === 2 && links.some((l) => l.type !== 'child'))) {
    fail(400, 'INVALID_FAMILY_LINKS', 'Parents dupliques ou relations incompatibles');
  }
  if (body.clientRequestId != null && (typeof body.clientRequestId !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(body.clientRequestId))) {
    fail(400, 'INVALID_REQUEST_ID', 'Identifiant de requete invalide');
  }
  if (body.position && (!Number.isFinite(body.position.x) || !Number.isFinite(body.position.y))) fail(400, 'INVALID_POSITION', 'Position invalide');
  const data = memberData(body, treeId);
  return withTreeMutation(prisma, treeId, async (tx, tree) => {
    await peopleInTree(tx, treeId, links.map((l) => l.personId));
    const id = body.clientRequestId || randomUUID();
    const existing = await tx.person.findUnique({ where: { id } });
    if (existing) {
      const matches = Object.entries(data).every(([key, value]) => JSON.stringify(existing[key] ?? null) === JSON.stringify(value));
      if (!matches) fail(409, 'REQUEST_ID_REUSED', 'Cette requete a deja ete enregistree avec un autre contenu');
      const rels = await tx.relationship.findMany({ where: { sourceId: id } });
      if (!links.every((l) => rels.some((r) => r.type === l.type && r.targetId === l.personId))) fail(409, 'REQUEST_ID_REUSED', 'Filiations differentes pour cette requete');
      return { person: existing, created: false };
    }
    await checkCapacity(tx, tree);
    const person = await tx.person.create({ data: { id, ...data } });
    for (const link of links) await writeLink(tx, tree, link.type, id, link.personId, true);
    if (body.position) await tx.nodePosition.create({ data: { treeId, nodeId: id, x: body.position.x, y: body.position.y } });
    return { person, created: true };
  });
}

async function linkChild(prisma, treeId, childId, parentIds) {
  if (typeof childId !== 'string' || !Array.isArray(parentIds) || !parentIds.length || parentIds.length > 2 || parentIds.some((id) => typeof id !== 'string' || !id) || new Set(parentIds).size !== parentIds.length) {
    fail(400, 'INVALID_FAMILY_LINKS', 'Choisissez un ou deux parents distincts');
  }
  return withTreeMutation(prisma, treeId, async (tx, tree) => {
    await peopleInTree(tx, treeId, [childId, ...parentIds]);
    const { parents } = await parentGraph(tx, treeId);
    const known = parents.get(childId) || new Set();
    // This two-parent editor never silently replaces a mother or adds a third parent.
    if (tree.treeType !== 'ORGANIZATION' && new Set([...known, ...parentIds]).size > Math.max(2, known.size)) {
      fail(409, 'PARENT_SET_CONFLICT', 'Cet enfant a deja d autres parents. Corrigez explicitement sa filiation avant de le rattacher.');
    }
    for (const parentId of parentIds) await writeLink(tx, tree, 'parent', parentId, childId, true);
    return { parentIds: [...new Set([...known, ...parentIds])], childId };
  });
}

async function createRelationship(prisma, type, sourceId, targetId) {
  const source = await prisma.person.findUnique({ where: { id: sourceId } });
  if (!source) fail(404, 'PERSON_NOT_FOUND', 'Personne introuvable');
  return withTreeMutation(prisma, source.treeId, (tx, tree) => writeLink(tx, tree, type, sourceId, targetId));
}
async function deleteRelationship(prisma, id) {
  const link = await prisma.relationship.findUnique({ where: { id } });
  if (!link) fail(404, 'RELATIONSHIP_NOT_FOUND', 'Relation introuvable');
  const source = await prisma.person.findUnique({ where: { id: link.sourceId } });
  if (!source) fail(404, 'PERSON_NOT_FOUND', 'Personne introuvable');
  return withTreeMutation(prisma, source.treeId, async (tx) => {
    const reverse = inverse(link.type);
    return tx.relationship.deleteMany({ where: { OR: [
      { type: link.type, sourceId: link.sourceId, targetId: link.targetId },
      ...(reverse ? [{ type: reverse, sourceId: link.targetId, targetId: link.sourceId }] : []),
    ] } });
  });
}
module.exports = { createMember, linkChild, createRelationship, deleteRelationship, withTreeMutation, writeLink, parentGraph, reaches };
