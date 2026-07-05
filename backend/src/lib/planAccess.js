const prisma = require('./prisma');
const { isPlanEntitlementActive } = require('./payments/fulfill');
const { getPlanLimits } = require('./plans');

async function countUserMediaAssets(ownerId) {
  const trees = await prisma.familyTree.findMany({
    where: { ownerId, isDemo: false },
    select: { id: true },
  });
  const treeIds = trees.map((t) => t.id);
  if (treeIds.length === 0) return 0;

  const [docCount, photoCount] = await Promise.all([
    prisma.personDocument.count({ where: { treeId: { in: treeIds } } }),
    prisma.person.count({ where: { treeId: { in: treeIds }, photoUrl: { not: null } } }),
  ]);
  return docCount + photoCount;
}

async function assertMediaAssetLimit(ownerUserId, { replacingExistingPhoto = false } = {}) {
  const user = await prisma.user.findUnique({ where: { id: ownerUserId } });
  if (!user) {
    const err = new Error('Utilisateur introuvable');
    err.statusCode = 404;
    throw err;
  }

  const limits = getEffectivePlanLimits(user);
  const max = limits.maxMediaAssets;
  if (max == null || max === Infinity) return;

  const current = await countUserMediaAssets(ownerUserId);
  const projected = replacingExistingPhoto ? current : current + 1;
  if (projected > max) {
    const err = new Error(
      `Limite de ${max} photos & documents atteinte pour le forfait ${limits.name}`,
    );
    err.statusCode = 403;
    throw err;
  }
}

function assertPlanEntitlement(user) {
  if (!isPlanEntitlementActive(user)) {
    const err = new Error('Forfait requis — choisissez un forfait sur la page Tarifs');
    err.statusCode = 402;
    throw err;
  }
}

function getEffectivePlanLimits(user) {
  if (!isPlanEntitlementActive(user)) {
    return {
      ...getPlanLimits('SOLO'),
      maxTrees: 0,
      maxPersonsPerTree: 0,
      maxCollaborators: 0,
    };
  }
  return getPlanLimits(user.plan);
}

module.exports = {
  assertPlanEntitlement,
  getEffectivePlanLimits,
  isPlanEntitlementActive,
  countUserMediaAssets,
  assertMediaAssetLimit,
};
