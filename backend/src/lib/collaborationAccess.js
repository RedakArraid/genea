const prisma = require('./prisma');
const { isPlanEntitlementActive } = require('./payments/fulfill');

async function isOwnerWriteAllowed(ownerId) {
  const owner = await prisma.user.findUnique({
    where: { id: ownerId },
    select: { plan: true, planActive: true, planExpiresAt: true, createdAt: true },
  });
  if (!owner) return false;
  return isPlanEntitlementActive(owner);
}

/**
 * Peut gérer les collaborateurs (propriétaire, délégué, ou admin plateforme).
 */
async function canManageTreeCollaborators(userId, tree) {
  if (!userId || !tree || tree.isDemo) return false;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  if (user?.role === 'ADMIN') return true;

  if (tree.ownerId === userId) {
    return isOwnerWriteAllowed(tree.ownerId);
  }

  const ownerWriteAllowed = await isOwnerWriteAllowed(tree.ownerId);
  if (!ownerWriteAllowed) return false;

  const collab = await prisma.treeCollaborator.findUnique({
    where: { treeId_userId: { treeId: tree.id, userId } },
    select: { canManageCollaborators: true },
  });
  return !!collab?.canManageCollaborators;
}

async function assertCanManageCollaborators(userId, tree) {
  const allowed = await canManageTreeCollaborators(userId, tree);
  if (!allowed) {
    const err = new Error('Vous n\'avez pas les droits pour gérer les collaborateurs');
    err.statusCode = 403;
    throw err;
  }
}

module.exports = {
  isOwnerWriteAllowed,
  canManageTreeCollaborators,
  assertCanManageCollaborators,
};
