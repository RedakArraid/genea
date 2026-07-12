/**
 * Gestion des collaborateurs par l'admin plateforme (sans restriction propriétaire).
 */
const crypto = require('crypto');
const prisma = require('../lib/prisma');
const { getEffectivePlanLimits } = require('../lib/planAccess');
const { notifyTreeInviteEmail, notifyTreeAccessEmail } = require('../lib/treeInviteMail');

async function loadTree(treeId) {
  const tree = await prisma.familyTree.findUnique({ where: { id: treeId } });
  if (!tree) {
    const err = new Error('Arbre non trouvé');
    err.statusCode = 404;
    throw err;
  }
  return tree;
}

exports.listTreeCollaborators = async (req, res, next) => {
  try {
    await loadTree(req.params.id);
    const [collaborators, invites] = await Promise.all([
      prisma.treeCollaborator.findMany({
        where: { treeId: req.params.id },
        include: { User: { select: { id: true, email: true, name: true } } },
      }),
      prisma.treeInvite.findMany({
        where: { treeId: req.params.id, status: 'pending' },
        orderBy: { createdAt: 'desc' },
      }),
    ]);
    res.json({ collaborators, invites });
  } catch (error) {
    if (error.statusCode) return res.status(error.statusCode).json({ message: error.message });
    next(error);
  }
};

exports.inviteTreeCollaborator = async (req, res, next) => {
  try {
    const treeId = req.params.id;
    const { email, role = 'VIEWER', canManageCollaborators = false } = req.body;
    if (!email) return res.status(400).json({ message: 'Email requis' });
    if (!['VIEWER', 'EDITOR'].includes(role)) return res.status(400).json({ message: 'Rôle invalide' });

    const tree = await loadTree(treeId);
    if (tree.isDemo) return res.status(403).json({ message: 'Arbre démo' });

    const owner = await prisma.user.findUnique({ where: { id: tree.ownerId } });
    const limits = getEffectivePlanLimits(owner);
    const manageFlag = !!canManageCollaborators;
    const normalizedEmail = email.toLowerCase().trim();

    const existingUser = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (existingUser?.id === tree.ownerId) {
      return res.status(400).json({ message: 'Le propriétaire est déjà sur l\'arbre' });
    }

    const existingCollab = existingUser
      ? await prisma.treeCollaborator.findUnique({
          where: { treeId_userId: { treeId, userId: existingUser.id } },
        })
      : null;

    if (!existingCollab) {
      const collabCount = await prisma.treeCollaborator.count({ where: { treeId } });
      const pendingCount = await prisma.treeInvite.count({ where: { treeId, status: 'pending' } });
      if (collabCount + pendingCount >= limits.maxCollaborators) {
        return res.status(403).json({ message: `Limite de ${limits.maxCollaborators} collaborateurs atteinte` });
      }
    }

    if (existingUser) {
      await prisma.treeCollaborator.upsert({
        where: { treeId_userId: { treeId, userId: existingUser.id } },
        create: { treeId, userId: existingUser.id, role, canManageCollaborators: manageFlag },
        update: { role, canManageCollaborators: manageFlag },
      });
      return res.status(201).json({ message: 'Collaborateur ajouté' });
    }

    const token = crypto.randomUUID();
    const invite = await prisma.treeInvite.create({
      data: {
        treeId,
        email: normalizedEmail,
        role,
        canManageCollaborators: manageFlag,
        token,
        invitedById: req.user.id,
      },
    });

    await notifyTreeInviteEmail({
      to: normalizedEmail,
      treeName: tree.name,
      inviterName: owner?.name || 'Admin',
      role,
      token,
      locale: owner?.locale,
    }).catch(() => {});

    res.status(201).json({ message: 'Invitation créée', invite });
  } catch (error) {
    if (error.statusCode) return res.status(error.statusCode).json({ message: error.message });
    next(error);
  }
};

exports.updateTreeCollaborator = async (req, res, next) => {
  try {
    const { id: treeId, userId } = req.params;
    const { role, canManageCollaborators } = req.body;
    const tree = await loadTree(treeId);
    if (userId === tree.ownerId) {
      return res.status(400).json({ message: 'Le propriétaire ne peut pas être modifié' });
    }

    const data = {};
    if (role !== undefined) {
      if (!['VIEWER', 'EDITOR'].includes(role)) return res.status(400).json({ message: 'Rôle invalide' });
      data.role = role;
    }
    if (canManageCollaborators !== undefined) data.canManageCollaborators = !!canManageCollaborators;
    if (Object.keys(data).length === 0) return res.status(400).json({ message: 'Aucune modification' });

    const updated = await prisma.treeCollaborator.update({
      where: { treeId_userId: { treeId, userId } },
      data,
      include: { User: { select: { id: true, email: true, name: true } } },
    });
    res.json({ message: 'Collaborateur mis à jour', collaborator: updated });
  } catch (error) {
    if (error.code === 'P2025') return res.status(404).json({ message: 'Collaborateur introuvable' });
    if (error.statusCode) return res.status(error.statusCode).json({ message: error.message });
    next(error);
  }
};

exports.removeTreeCollaborator = async (req, res, next) => {
  try {
    await loadTree(req.params.id);
    await prisma.treeCollaborator.deleteMany({
      where: { treeId: req.params.id, userId: req.params.userId },
    });
    res.json({ message: 'Collaborateur retiré' });
  } catch (error) {
    if (error.statusCode) return res.status(error.statusCode).json({ message: error.message });
    next(error);
  }
};

exports.revokeTreeInvite = async (req, res, next) => {
  try {
    await loadTree(req.params.id);
    await prisma.treeInvite.update({
      where: { id: req.params.inviteId },
      data: { status: 'revoked' },
    });
    res.json({ message: 'Invitation révoquée' });
  } catch (error) {
    if (error.statusCode) return res.status(error.statusCode).json({ message: error.message });
    next(error);
  }
};
