const crypto = require('crypto');
const prisma = require('../lib/prisma');
const { getEffectivePlanLimits } = require('../lib/planAccess');
const { resolveTreeAccess, requireTreeRead } = require('../lib/treeAccess');
const { assertCanManageCollaborators } = require('../lib/collaborationAccess');
const { notifyTreeInviteEmail, notifyTreeAccessEmail } = require('../lib/treeInviteMail');

exports.getTreeAccess = async (req, res, next) => {
  try {
    const access = await resolveTreeAccess(req.user.id, req.params.id);
    res.json({ access });
  } catch (error) {
    next(error);
  }
};

const { ensureDemoTree } = require('../lib/demoTree');

exports.getDemoTree = async (req, res, next) => {
  try {
    const demo = await ensureDemoTree();
    res.json({ demoTree: demo });
  } catch (error) {
    next(error);
  }
};

exports.listCollaborators = async (req, res, next) => {
  try {
    await requireTreeRead(req.user.id, req.params.id);
    const [collaborators, invites] = await Promise.all([
      prisma.treeCollaborator.findMany({
        where: { treeId: req.params.id },
        include: {
          User: { select: { id: true, email: true, name: true } },
        },
      }),
      prisma.treeInvite.findMany({
        where: { treeId: req.params.id, status: 'pending' },
        orderBy: { createdAt: 'desc' },
      }),
    ]);
    res.json({ collaborators, invites });
  } catch (error) {
    next(error);
  }
};

exports.inviteCollaborator = async (req, res, next) => {
  try {
    const { id: treeId } = req.params;
    const { email, role = 'VIEWER', canManageCollaborators = false } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email requis' });
    }
    if (!['VIEWER', 'EDITOR'].includes(role)) {
      return res.status(400).json({ message: 'Rôle invalide' });
    }

    const tree = await prisma.familyTree.findUnique({ where: { id: treeId } });
    if (!tree || tree.isDemo) {
      return res.status(403).json({ message: 'Impossible d\'inviter sur cet arbre' });
    }
    await assertCanManageCollaborators(req.user.id, tree);

    const owner = await prisma.user.findUnique({ where: { id: tree.ownerId } });
    const limits = getEffectivePlanLimits(owner);
    const manageFlag = !!canManageCollaborators;

    const normalizedEmail = email.toLowerCase().trim();
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

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
      const pendingCount = await prisma.treeInvite.count({
        where: { treeId, status: 'pending' },
      });
      if (collabCount + pendingCount >= limits.maxCollaborators) {
        return res.status(403).json({
          message: `Limite de collaborateurs atteinte pour le forfait ${limits.name}`,
        });
      }
    }

    if (existingUser) {
      await prisma.treeCollaborator.upsert({
        where: {
          treeId_userId: { treeId, userId: existingUser.id },
        },
        create: { treeId, userId: existingUser.id, role, canManageCollaborators: manageFlag },
        update: { role, canManageCollaborators: manageFlag },
      });

      const emailResult = await notifyTreeAccessEmail({
        to: existingUser.email,
        treeName: tree.name,
        inviterName: owner.name,
        role,
        treeId,
        locale: existingUser.locale || owner.locale,
      });

      return res.status(201).json({
        message: 'Collaborateur ajouté',
        emailSent: emailResult.sent,
        collaborator: {
          userId: existingUser.id,
          email: existingUser.email,
          name: existingUser.name,
          role,
          canManageCollaborators: manageFlag,
        },
      });
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

    const emailResult = await notifyTreeInviteEmail({
      to: normalizedEmail,
      treeName: tree.name,
      inviterName: owner.name,
      role,
      token,
      locale: owner.locale,
    });

    res.status(201).json({
      message: 'Invitation créée',
      emailSent: emailResult.sent,
      invite: {
        id: invite.id,
        email: invite.email,
        role: invite.role,
        canManageCollaborators: invite.canManageCollaborators,
        token: invite.token,
      },
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ message: error.message });
    }
    next(error);
  }
};

exports.updateCollaborator = async (req, res, next) => {
  try {
    const { id: treeId, userId } = req.params;
    const { role, canManageCollaborators } = req.body;

    const tree = await prisma.familyTree.findUnique({ where: { id: treeId } });
    if (!tree || tree.isDemo) {
      return res.status(403).json({ message: 'Modification impossible' });
    }
    await assertCanManageCollaborators(req.user.id, tree);

    if (userId === tree.ownerId) {
      return res.status(400).json({ message: 'Le propriétaire ne peut pas être modifié' });
    }

    const data = {};
    if (role !== undefined) {
      if (!['VIEWER', 'EDITOR'].includes(role)) {
        return res.status(400).json({ message: 'Rôle invalide' });
      }
      data.role = role;
    }
    if (canManageCollaborators !== undefined) {
      data.canManageCollaborators = !!canManageCollaborators;
    }
    if (Object.keys(data).length === 0) {
      return res.status(400).json({ message: 'Aucune modification demandée' });
    }

    const updated = await prisma.treeCollaborator.update({
      where: { treeId_userId: { treeId, userId } },
      data,
      include: { User: { select: { id: true, email: true, name: true } } },
    });

    res.json({ message: 'Collaborateur mis à jour', collaborator: updated });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'Collaborateur introuvable' });
    }
    if (error.statusCode) {
      return res.status(error.statusCode).json({ message: error.message });
    }
    next(error);
  }
};

exports.removeCollaborator = async (req, res, next) => {
  try {
    const { id: treeId, userId } = req.params;
    const tree = await prisma.familyTree.findUnique({ where: { id: treeId } });
    if (!tree) {
      return res.status(404).json({ message: 'Arbre non trouvé' });
    }
    await assertCanManageCollaborators(req.user.id, tree);
    await prisma.treeCollaborator.deleteMany({ where: { treeId, userId } });
    res.json({ message: 'Collaborateur retiré' });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ message: error.message });
    }
    next(error);
  }
};

exports.revokeInvite = async (req, res, next) => {
  try {
    const { id: treeId, inviteId } = req.params;
    const tree = await prisma.familyTree.findUnique({ where: { id: treeId } });
    if (!tree) {
      return res.status(404).json({ message: 'Arbre non trouvé' });
    }
    await assertCanManageCollaborators(req.user.id, tree);
    await prisma.treeInvite.update({
      where: { id: inviteId },
      data: { status: 'revoked' },
    });
    res.json({ message: 'Invitation révoquée' });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ message: error.message });
    }
    next(error);
  }
};

exports.updateVisibility = async (req, res, next) => {
  try {
    const { id: treeId } = req.params;
    const { visibility } = req.body;

    if (!['PRIVATE', 'SHARED', 'PUBLIC'].includes(visibility)) {
      return res.status(400).json({ message: 'Visibilité invalide' });
    }

    const tree = await prisma.familyTree.findUnique({ where: { id: treeId } });
    if (!tree || tree.isDemo) {
      return res.status(403).json({ message: 'Modification impossible' });
    }
    if (tree.ownerId !== req.user.id) {
      return res.status(403).json({ message: 'Seul le propriétaire peut changer la visibilité' });
    }

    const owner = await prisma.user.findUnique({ where: { id: req.user.id } });
    const limits = getEffectivePlanLimits(owner);
    if (visibility === 'PUBLIC' && !limits.canPublicMatching) {
      return res.status(403).json({
        message: 'Les arbres publics nécessitent le forfait Famille ou Patrimoine',
      });
    }

    const updated = await prisma.familyTree.update({
      where: { id: treeId },
      data: {
        visibility,
        isPublic: visibility === 'PUBLIC',
      },
    });

    res.json({ message: 'Visibilité mise à jour', tree: updated });
  } catch (error) {
    next(error);
  }
};

exports.acceptInvite = async (req, res, next) => {
  try {
    const { token } = req.params;
    const invite = await prisma.treeInvite.findUnique({ where: { token } });
    if (!invite || invite.status !== 'pending') {
      return res.status(404).json({ message: 'Invitation invalide ou expirée' });
    }

    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (user.email.toLowerCase() !== invite.email.toLowerCase()) {
      return res.status(403).json({ message: 'Cette invitation est pour un autre email' });
    }

    const tree = await prisma.familyTree.findUnique({ where: { id: invite.treeId } });
    const owner = await prisma.user.findUnique({ where: { id: tree.ownerId } });
    const limits = getEffectivePlanLimits(owner);
    const collabCount = await prisma.treeCollaborator.count({ where: { treeId: invite.treeId } });
    if (collabCount >= limits.maxCollaborators) {
      return res.status(403).json({
        message: `Limite de ${limits.maxCollaborators} collaborateurs atteinte pour cet arbre`,
      });
    }

    await prisma.$transaction([
      prisma.treeCollaborator.upsert({
        where: {
          treeId_userId: { treeId: invite.treeId, userId: user.id },
        },
        create: {
          treeId: invite.treeId,
          userId: user.id,
          role: invite.role,
          canManageCollaborators: invite.canManageCollaborators,
        },
        update: {
          role: invite.role,
          canManageCollaborators: invite.canManageCollaborators,
        },
      }),
      prisma.treeInvite.update({
        where: { id: invite.id },
        data: { status: 'accepted' },
      }),
    ]);

    res.json({ message: 'Invitation acceptée', treeId: invite.treeId });
  } catch (error) {
    next(error);
  }
};
