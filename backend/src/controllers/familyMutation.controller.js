const { validationResult } = require('express-validator');
const prisma = require('../lib/prisma');
const family = require('../lib/familyMutation');
const { getEffectivePlanLimits } = require('../lib/planAccess');
const { translateDemoEntityId } = require('../lib/demoFork');
const storage = require('../lib/storage');

function respondError(res, next, error) {
  if (error.statusCode) return res.status(error.statusCode).json({ message: error.message, code: error.code });
  return next(error);
}

/** canWriteTree has already selected the writable tree (including a personal demo fork). */
async function resolveIds(req, ids) {
  const treeId = req.params.treeId;
  const tree = await prisma.familyTree.findUnique({ where: { id: treeId } });
  if (!tree) throw Object.assign(new Error('Arbre introuvable'), { statusCode: 404, code: 'TREE_NOT_FOUND' });
  return Promise.all(ids.map(async (id) => {
    if (typeof id !== 'string' || !id) throw Object.assign(new Error('Identifiant invalide'), { statusCode: 400, code: 'INVALID_FAMILY_LINKS' });
    const person = await prisma.person.findUnique({ where: { id }, include: { FamilyTree: true } });
    if (person?.treeId === treeId) return id;
    if (person?.FamilyTree?.isDemo && tree.demoForkOwnerId === req.user?.id) {
      const mapped = await translateDemoEntityId(treeId, 'person', id);
      if (mapped) return mapped;
    }
    throw Object.assign(new Error('Personne absente de cet arbre'), { statusCode: 400, code: 'FAMILY_PERSON_OUTSIDE_TREE' });
  }));
}

exports.createMember = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array(), code: 'VALIDATION_ERROR' });
    const links = req.body.links ?? [];
    if (!Array.isArray(links) || links.length > 2 || links.some((l) => !l)) {
      return res.status(400).json({ code: 'INVALID_FAMILY_LINKS', message: 'Filiations invalides' });
    }
    const mapped = await resolveIds(req, links.map((l) => l.personId));
    if (typeof req.body.photoUrl === 'string' && req.body.photoUrl.startsWith('data:') && storage.isReady()) {
      return res.status(400).json({ code: 'USE_UPLOAD_ENDPOINT', message: 'Utilisez le service de photos' });
    }
    const result = await family.createMember(prisma, req.params.treeId, {
      ...req.body, links: links.map((l, i) => ({ type: l.type, personId: mapped[i] })),
    }, async (tx, tree) => {
      if (tree.isDemo) return;
      // Use the transaction connection for quota reads; never exhaust the pool while holding a lock.
      await tx.$queryRaw`SELECT "id" FROM "User" WHERE "id" = ${tree.ownerId} FOR UPDATE`;
      const owner = await tx.user.findUnique({ where: { id: tree.ownerId } });
      const limits = getEffectivePlanLimits(owner);
      const count = await tx.person.count({ where: { treeId: tree.id } });
      if (limits.maxPersonsPerTree != null && count + 1 > limits.maxPersonsPerTree) {
        throw Object.assign(new Error('Limite de personnes atteinte'), { statusCode: 403, code: 'PLAN_LIMIT_REACHED' });
      }
      if (req.body.photoUrl && limits.maxPhotosTotal != null) {
        const trees = await tx.familyTree.findMany({ where: { ownerId: tree.ownerId, isDemo: false }, select: { id: true } });
        const photos = await tx.person.count({ where: { treeId: { in: trees.map(t => t.id) }, photoUrl: { not: null } } });
        if (photos + 1 > limits.maxPhotosTotal) throw Object.assign(new Error('Limite de photos atteinte'), { statusCode: 403, code: 'PLAN_LIMIT_REACHED' });
      }
    });
    res.status(result.created ? 201 : 200).json({ ...result, message: 'Personne et filiations enregistrees' });
  } catch (error) { respondError(res, next, error); }
};
exports.linkChild = async (req, res, next) => {
  try {
    const { parentIds, childId } = req.body;
    if (!Array.isArray(parentIds) || !parentIds.length || parentIds.length > 2) {
      return res.status(400).json({ code: 'INVALID_FAMILY_LINKS', message: 'Choisissez un ou deux parents' });
    }
    const [child, ...parents] = await resolveIds(req, [childId, ...parentIds]);
    const result = await family.linkChild(prisma, req.params.treeId, child, parents);
    res.json({ ...result, message: 'Filiations enregistrees' });
  } catch (error) { respondError(res, next, error); }
};
exports.createRelationship = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const { type, sourceId, targetId } = req.body;
    const relationship = await family.createRelationship(prisma, type, sourceId, targetId);
    res.status(201).json({ relationship, message: 'Relation creee avec succes' });
  } catch (error) { respondError(res, next, error); }
};
exports.deleteRelationship = async (req, res, next) => {
  try {
    await family.deleteRelationship(prisma, req.params.id);
    res.json({ message: 'Relation supprimee avec succes' });
  } catch (error) { respondError(res, next, error); }
};
