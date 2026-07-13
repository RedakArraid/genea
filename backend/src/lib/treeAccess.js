const prisma = require('./prisma');
const {
  getEffectivePlanLimits,
  getOwnerMediaAccess,
  getUserMediaAccess,
} = require('./planAccess');
const { isOwnerWriteAllowed } = require('./collaborationAccess');

async function ownerCanImport(ownerId, isDemo) {
  if (isDemo) return false;
  const owner = await prisma.user.findUnique({ where: { id: ownerId } });
  if (!owner) return false;
  return !!getEffectivePlanLimits(owner).canImport;
}

async function ownerCanExport(ownerId, isDemo) {
  if (isDemo) return false;
  const owner = await prisma.user.findUnique({ where: { id: ownerId } });
  if (!owner) return false;
  return !!getEffectivePlanLimits(owner).canExport;
}

async function ownerCanVersion(ownerId, isDemo) {
  if (isDemo) return false;
  const owner = await prisma.user.findUnique({ where: { id: ownerId } });
  if (!owner) return false;
  return !!getEffectivePlanLimits(owner).canVersioning;
}

/**
 * Résout les droits d'un utilisateur sur un arbre.
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
    return {
      canRead: false,
      canWrite: false,
      canEditPerson: false,
      canManageCollaborators: false,
      canExport: false,
      canImport: false,
      canVersioning: false,
      canUploadPhotos: false,
      canUploadDocuments: false,
      role: 'none',
      isDemo: false,
      planExpired: false,
    };
  }

  const exportAllowed = userId ? await ownerCanExport(tree.ownerId, tree.isDemo) : false;
  const importAllowed = userId ? await ownerCanImport(tree.ownerId, tree.isDemo) : false;
  const versionAllowed = userId ? await ownerCanVersion(tree.ownerId, tree.isDemo) : false;
  const ownerWriteAllowed = await isOwnerWriteAllowed(tree.ownerId);
  const planExpired = !ownerWriteAllowed && !tree.isDemo;
  const ownerMedia = await getOwnerMediaAccess(tree.ownerId, tree.isDemo);
  const userMedia = tree.isDemo ? await getUserMediaAccess(userId) : ownerMedia;

  if (userId && tree.ownerId === userId) {
    return {
      canRead: true,
      canWrite: ownerWriteAllowed,
      canEditPerson: ownerWriteAllowed,
      canManageCollaborators: ownerWriteAllowed,
      canExport: exportAllowed,
      canImport: importAllowed,
      canVersioning: versionAllowed,
      canUploadPhotos: ownerMedia.canUploadPhotos,
      canUploadDocuments: ownerMedia.canUploadDocuments,
      role: 'owner',
      isDemo: false,
      planExpired,
    };
  }

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
        canManageCollaborators: true,
        canExport: exportAllowed,
        canImport: importAllowed,
        canVersioning: versionAllowed,
        canUploadPhotos: ownerMedia.canUploadPhotos,
        canUploadDocuments: ownerMedia.canUploadDocuments,
        role: 'admin',
        isDemo: false,
        planExpired: false,
      };
    }
  }

  if (tree.isDemo) {
    return {
      canRead: true,
      canWrite: !!userId,
      canEditPerson: false,
      canManageCollaborators: false,
      canExport: false,
      canImport: false,
      canVersioning: false,
      canUploadPhotos: userMedia.canUploadPhotos,
      canUploadDocuments: userMedia.canUploadDocuments,
      role: userId ? 'demo' : 'viewer',
      isDemo: true,
      planExpired: false,
    };
  }

  const collab = tree.TreeCollaborator[0];
  if (collab) {
    const canWrite = collab.role === 'EDITOR' && ownerWriteAllowed;
    const canManageCollaborators = !!collab.canManageCollaborators && ownerWriteAllowed;
    return {
      canRead: true,
      canWrite,
      canEditPerson: canWrite,
      canManageCollaborators,
      canExport: exportAllowed,
      canImport: importAllowed,
      canVersioning: versionAllowed,
      canUploadPhotos: ownerMedia.canUploadPhotos,
      canUploadDocuments: ownerMedia.canUploadDocuments,
      role: collab.role.toLowerCase(),
      isDemo: false,
      planExpired,
    };
  }

  if (tree.visibility === 'PUBLIC' || tree.isPublic) {
    return {
      canRead: true,
      canWrite: false,
      canEditPerson: false,
      canManageCollaborators: false,
      canExport: exportAllowed,
      canImport: importAllowed,
      canVersioning: versionAllowed,
      canUploadPhotos: false,
      canUploadDocuments: false,
      role: 'viewer',
      isDemo: false,
      planExpired: false,
    };
  }

  if (tree.visibility === 'SHARED') {
    return {
      canRead: false,
      canWrite: false,
      canEditPerson: false,
      canManageCollaborators: false,
      canExport: false,
      canImport: false,
      canVersioning: false,
      canUploadPhotos: false,
      canUploadDocuments: false,
      role: 'none',
      isDemo: false,
      planExpired: false,
    };
  }

  return {
    canRead: false,
    canWrite: false,
    canEditPerson: false,
    canManageCollaborators: false,
    canExport: false,
    canImport: false,
    canVersioning: false,
    canUploadPhotos: false,
    canUploadDocuments: false,
    role: 'none',
    isDemo: false,
    planExpired: false,
  };
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
    const err = new Error(
      access.planExpired
        ? 'Période d\'essai expirée. Passez à un forfait payant pour modifier votre arbre.'
        : access.isDemo && !access.canWrite
          ? 'Connectez-vous pour essayer la démo'
          : access.isDemo
            ? 'Modification non autorisée'
            : 'Vous n\'avez pas les droits de modification sur cet arbre',
    );
    err.statusCode = 403;
    err.code = access.planExpired ? 'PLAN_EXPIRED' : undefined;
    throw err;
  }
  return access;
}

module.exports = {
  resolveTreeAccess,
  requireTreeRead,
  requireTreeWrite,
};
