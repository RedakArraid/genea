const prisma = require('./prisma');
const { isPlanEntitlementActive } = require('./payments/fulfill');
const { getPlanLimits } = require('./plans');

async function getOwnerTreeIds(ownerId) {
  const trees = await prisma.familyTree.findMany({
    where: { ownerId, isDemo: false },
    select: { id: true },
  });
  return trees.map((t) => t.id);
}

async function countOwnerFiches(ownerId) {
  const treeIds = await getOwnerTreeIds(ownerId);
  if (treeIds.length === 0) return 0;
  return prisma.personDocument.count({ where: { treeId: { in: treeIds } } });
}

async function countOwnerPhotos(ownerId) {
  const treeIds = await getOwnerTreeIds(ownerId);
  if (treeIds.length === 0) return 0;
  return prisma.person.count({ where: { treeId: { in: treeIds }, photoUrl: { not: null } } });
}

async function countOwnerPersons(ownerId) {
  const treeIds = await getOwnerTreeIds(ownerId);
  if (treeIds.length === 0) return 0;
  return prisma.person.count({ where: { treeId: { in: treeIds } } });
}

/**
 * Vérifie le quota personnes (par arbre uniquement).
 * @returns {{ ok: true } | { ok: false, statusCode: number, code: string, message: string, maxPersons: number, planName: string }}
 */
function evaluatePersonCapacity(limits, { treePersonCount, additional = 1 }) {
  const perTreeMax = limits.maxPersonsPerTree;
  if (perTreeMax != null && perTreeMax !== Infinity && treePersonCount + additional > perTreeMax) {
    return {
      ok: false,
      statusCode: 403,
      code: 'PLAN_LIMIT_REACHED',
      message: `Limite de ${perTreeMax} personnes par arbre atteinte pour le forfait ${limits.name}`,
      maxPersons: perTreeMax,
      planName: limits.name,
    };
  }

  return { ok: true };
}

async function assertPersonCapacity(ownerId, treeId, { additional = 1, isDemo = false } = {}) {
  if (isDemo) return;

  const owner = await prisma.user.findUnique({ where: { id: ownerId } });
  if (!owner) {
    const err = new Error('Utilisateur introuvable');
    err.statusCode = 404;
    throw err;
  }

  const limits = getEffectivePlanLimits(owner);
  const treePersonCount = await prisma.person.count({ where: { treeId } });

  const result = evaluatePersonCapacity(limits, {
    treePersonCount,
    additional,
  });

  if (!result.ok) {
    const err = new Error(result.message);
    err.statusCode = result.statusCode;
    err.code = result.code;
    err.maxPersons = result.maxPersons;
    err.planName = result.planName;
    throw err;
  }
}

async function assertFicheLimit(ownerUserId) {
  const user = await prisma.user.findUnique({ where: { id: ownerUserId } });
  if (!user) {
    const err = new Error('Utilisateur introuvable');
    err.statusCode = 404;
    throw err;
  }

  const limits = getEffectivePlanLimits(user);
  const max = limits.maxFichesTotal;
  if (max == null || max === Infinity) return;
  if (max <= 0) {
    const err = new Error(`Fiches (documents) non incluses dans le forfait ${limits.name}`);
    err.statusCode = 403;
    err.code = 'PLAN_LIMIT_REACHED';
    throw err;
  }

  const current = await countOwnerFiches(ownerUserId);
  if (current + 1 > max) {
    const err = new Error(
      `Limite de ${max} fiches (documents) au total atteinte pour le forfait ${limits.name}`,
    );
    err.statusCode = 403;
    err.code = 'PLAN_LIMIT_REACHED';
    throw err;
  }
}

async function assertPhotoLimit(ownerUserId, { replacingExistingPhoto = false } = {}) {
  const user = await prisma.user.findUnique({ where: { id: ownerUserId } });
  if (!user) {
    const err = new Error('Utilisateur introuvable');
    err.statusCode = 404;
    throw err;
  }

  const limits = getEffectivePlanLimits(user);
  const max = limits.maxPhotosTotal;
  if (max == null || max === Infinity) return;
  if (max <= 0) {
    const err = new Error(`Photos de profil non incluses dans le forfait ${limits.name}`);
    err.statusCode = 403;
    err.code = 'PLAN_LIMIT_REACHED';
    throw err;
  }

  const current = await countOwnerPhotos(ownerUserId);
  const projected = replacingExistingPhoto ? current : current + 1;
  if (projected > max) {
    const err = new Error(
      `Limite de ${max} photos de profil au total atteinte pour le forfait ${limits.name}`,
    );
    err.statusCode = 403;
    err.code = 'PLAN_LIMIT_REACHED';
    throw err;
  }
}

function assertPlanEntitlement(user) {
  if (!isPlanEntitlementActive(user)) {
    const err = new Error('Forfait requis. Choisissez un forfait sur la page Tarifs');
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
      maxFichesTotal: 0,
      maxPhotosTotal: 0,
      maxCollaborators: 0,
      canImport: false,
    };
  }
  return getPlanLimits(user.plan);
}

function planAllowsPhotos(limits) {
  const max = limits.maxPhotosTotal;
  return max == null || max === Infinity || max > 0;
}

function planAllowsFiches(limits) {
  const max = limits.maxFichesTotal;
  return max == null || max === Infinity || max > 0;
}

async function getOwnerMediaAccess(ownerId, isDemo) {
  if (isDemo) {
    return { canUploadPhotos: false, canUploadDocuments: false };
  }
  const owner = await prisma.user.findUnique({ where: { id: ownerId } });
  if (!owner) {
    return { canUploadPhotos: false, canUploadDocuments: false };
  }
  const limits = getEffectivePlanLimits(owner);
  return {
    canUploadPhotos: planAllowsPhotos(limits),
    canUploadDocuments: planAllowsFiches(limits),
  };
}

async function getUserMediaAccess(userId) {
  if (!userId) {
    return { canUploadPhotos: false, canUploadDocuments: false };
  }
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    return { canUploadPhotos: false, canUploadDocuments: false };
  }
  const limits = getEffectivePlanLimits(user);
  return {
    canUploadPhotos: planAllowsPhotos(limits),
    canUploadDocuments: planAllowsFiches(limits),
  };
}

module.exports = {
  assertPlanEntitlement,
  getEffectivePlanLimits,
  isPlanEntitlementActive,
  countOwnerFiches,
  countOwnerPhotos,
  countOwnerPersons,
  evaluatePersonCapacity,
  assertPersonCapacity,
  assertFicheLimit,
  assertPhotoLimit,
  planAllowsPhotos,
  planAllowsFiches,
  getOwnerMediaAccess,
  getUserMediaAccess,
};
