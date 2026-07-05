const prisma = require('./prisma');

/**
 * Résout les droits d'un utilisateur sur un arbre.
 * @returns {{ canRead: boolean, canWrite: boolean, canEditPerson: boolean, role: string, isDemo: boolean }}
 */
async function resolveTreeAccess(userId, treeId) {
  const tree = await prisma.familyTree.findUnique({
    where: { id: treeId },
    include: {
      TreeCollaborator: {
        where: { userId },
        take: 1,
      },
    },
  });

  if (!tree) {
    return { canRead: false, canWrite: false, canEditPerson: false, role: 'none', isDemo: false };
  }

  // Propriétaire : accès total (y compris si compte ADMIN)
  if (userId && tree.ownerId === userId) {
    return { canRead: true, canWrite: true, canEditPerson: true, role: 'owner', isDemo: false };
  }

  // Admin plateforme : lecture seule sur les arbres des autres utilisateurs
  if (userId) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });
    if (user?.role === 'ADMIN') {
      return {
        canRead: true,
        canWrite: false,
        canEditPerson: false,
        role: 'admin',
        isDemo: false,
      };
    }
  }

  if (tree.isDemo) {
    return {
      canRead: true,
      canWrite: !!userId,
      canEditPerson: false,
      role: userId ? 'demo' : 'viewer',
      isDemo: true,
    };
  }

  const collab = tree.TreeCollaborator[0];
  if (collab) {
    const canWrite = collab.role === 'EDITOR';
    return {
      canRead: true,
      canWrite,
      canEditPerson: canWrite,
      role: collab.role.toLowerCase(),
      isDemo: false,
    };
  }

  if (tree.visibility === 'PUBLIC' || tree.isPublic) {
    return { canRead: true, canWrite: false, canEditPerson: false, role: 'viewer', isDemo: false };
  }

  if (tree.visibility === 'SHARED') {
    return { canRead: false, canWrite: false, canEditPerson: false, role: 'none', isDemo: false };
  }

  return { canRead: false, canWrite: false, canEditPerson: false, role: 'none', isDemo: false };
}

async function requireTreeRead(userId, treeId) {
  const access = await resolveTreeAccess(userId, treeId);
  if (!access.canRead) {
    const err = new Error('Accès refusé à cet arbre');
    err.statusCode = 403;
    throw err;
  }
  return access;
}

async function requireTreeWrite(userId, treeId) {
  const access = await requireTreeRead(userId, treeId);
  if (!access.canWrite) {
    const err = new Error(access.isDemo && !access.canWrite
      ? 'Connectez-vous pour essayer la démo'
      : access.isDemo
        ? 'Modification non autorisée'
        : 'Vous n\'avez pas les droits de modification sur cet arbre');
    err.statusCode = 403;
    throw err;
  }
  return access;
}

module.exports = {
  resolveTreeAccess,
  requireTreeRead,
  requireTreeWrite,
};
