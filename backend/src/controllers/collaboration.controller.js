const crypto = require('crypto');
const prisma = require('../lib/prisma');
const { getEffectivePlanLimits } = require('../lib/planAccess');
const { resolveTreeAccess, requireTreeRead, requireTreeWrite } = require('../lib/treeAccess');

exports.getTreeAccess = async (req, res, next) => {
  try {
    const access = await resolveTreeAccess(req.user.id, req.params.id);
    res.json({ access });
  } catch (error) {
    next(error);
  }
};

exports.getDemoTree = async (req, res, next) => {
  try {
    const demo = await prisma.familyTree.findFirst({
      where: { isDemo: true },
      select: { id: true, name: true, description: true },
    });
    if (!demo) {
      return res.status(404).json({ message: 'Arbre démo non disponible' });
    }
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
    const { email, role = 'VIEWER' } = req.body;

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
    if (tree.ownerId !== req.user.id) {
      return res.status(403).json({ message: 'Seul le propriétaire peut inviter' });
    }

    const owner = await prisma.user.findUnique({ where: { id: req.user.id } });
    const limits = getEffectivePlanLimits(owner);

    const collabCount = await prisma.treeCollaborator.count({ where: { treeId } });
    const pendingCount = await prisma.treeInvite.count({
      where: { treeId, status: 'pending' },
    });
    if (collabCount + pendingCount >= limits.maxCollaborators) {
      return res.status(403).json({
        message: `Limite de collaborateurs atteinte pour le forfait ${limits.name}`,
      });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser?.id === tree.ownerId) {
      return res.status(400).json({ message: 'Le propriétaire est déjà sur l\'arbre' });
    }

    if (existingUser) {
      await prisma.treeCollaborator.upsert({
        where: {
          treeId_userId: { treeId, userId: existingUser.id },
        },
        create: { treeId, userId: existingUser.id, role },
        update: { role },
      });
      return res.status(201).json({
        message: 'Collaborateur ajouté',
        collaborator: {
          userId: existingUser.id,
          email: existingUser.email,
          name: existingUser.name,
          role,
        },
      });
    }

    const token = crypto.randomUUID();
    const invite = await prisma.treeInvite.create({
      data: {
        treeId,
        email: normalizedEmail,
        role,
        token,
        invitedById: req.user.id,
      },
    });

    res.status(201).json({
      message: 'Invitation créée',
      invite: {
        id: invite.id,
        email: invite.email,
        role: invite.role,
        token: invite.token,
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.removeCollaborator = async (req, res, next) => {
  try {
    const { id: treeId, userId } = req.params;
    const tree = await prisma.familyTree.findUnique({ where: { id: treeId } });
    if (!tree || tree.ownerId !== req.user.id) {
      return res.status(403).json({ message: 'Action non autorisée' });
    }
    await prisma.treeCollaborator.deleteMany({ where: { treeId, userId } });
    res.json({ message: 'Collaborateur retiré' });
  } catch (error) {
    next(error);
  }
};

exports.revokeInvite = async (req, res, next) => {
  try {
    const { id: treeId, inviteId } = req.params;
    const tree = await prisma.familyTree.findUnique({ where: { id: treeId } });
    if (!tree || tree.ownerId !== req.user.id) {
      return res.status(403).json({ message: 'Action non autorisée' });
    }
    await prisma.treeInvite.update({
      where: { id: inviteId },
      data: { status: 'revoked' },
    });
    res.json({ message: 'Invitation révoquée' });
  } catch (error) {
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
        },
        update: { role: invite.role },
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
