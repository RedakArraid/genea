/**
 * Contrôleur admin — back-office plateforme
 */

const prisma = require('../lib/prisma');
const storage = require('../lib/storage');
const { PLANS } = require('../lib/plans');
const { resetDemoTree, getDemoTreeInfo } = require('../lib/demoTree');

const userPublicSelect = {
  id: true,
  email: true,
  name: true,
  plan: true,
  role: true,
  createdAt: true,
  updatedAt: true,
};

exports.getStats = async (req, res, next) => {
  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const [
      usersTotal,
      treesTotal,
      personsTotal,
      documentsTotal,
      demoTrees,
      publicTrees,
      planGroups,
      recentUsers,
      photosWithUrl,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.familyTree.count(),
      prisma.person.count(),
      prisma.personDocument.count(),
      prisma.familyTree.count({ where: { isDemo: true } }),
      prisma.familyTree.count({ where: { OR: [{ visibility: 'PUBLIC' }, { isPublic: true }] } }),
      prisma.user.groupBy({ by: ['plan'], _count: { plan: true } }),
      prisma.user.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: userPublicSelect,
      }),
      prisma.person.count({ where: { photoUrl: { not: null } } }),
    ]);

    const newUsersWeek = await prisma.user.count({
      where: { createdAt: { gte: sevenDaysAgo } },
    });

    res.json({
      usersTotal,
      treesTotal,
      personsTotal,
      documentsTotal,
      photosTotal: photosWithUrl,
      demoTrees,
      publicTrees,
      privateTrees: treesTotal - publicTrees,
      newUsersWeek,
      planDistribution: planGroups.map((g) => ({
        plan: g.plan,
        count: g._count.plan,
      })),
      recentUsers,
    });
  } catch (error) {
    next(error);
  }
};

exports.listUsers = async (req, res, next) => {
  try {
    const { search = '', plan, page = '1', limit = '20' } = req.query;
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const take = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * take;

    const where = {};
    if (plan && ['SOLO', 'FAMILY', 'PATRIMONY'].includes(plan)) {
      where.plan = plan;
    }
    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        select: {
          ...userPublicSelect,
          _count: { select: { FamilyTree: true } },
        },
      }),
      prisma.user.count({ where }),
    ]);

    res.json({
      users: users.map(({ _count, ...u }) => ({ ...u, treeCount: _count.FamilyTree })),
      pagination: { page: pageNum, limit: take, total, pages: Math.ceil(total / take) },
    });
  } catch (error) {
    next(error);
  }
};

exports.getUser = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
      select: {
        ...userPublicSelect,
        FamilyTree: {
          select: {
            id: true,
            name: true,
            isDemo: true,
            visibility: true,
            createdAt: true,
            _count: { select: { Person: true } },
          },
        },
        _count: { select: { FamilyTree: true, TreeCollaborator: true } },
      },
    });
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }
    res.json({ user });
  } catch (error) {
    next(error);
  }
};

exports.updateUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, plan, role } = req.body;

    if (id === req.user.id && role === 'USER') {
      return res.status(400).json({ message: 'Vous ne pouvez pas retirer votre propre rôle admin' });
    }

    const data = {};
    if (name !== undefined) data.name = name;
    if (plan !== undefined) {
      if (!['SOLO', 'FAMILY', 'PATRIMONY'].includes(plan)) {
        return res.status(400).json({ message: 'Forfait invalide' });
      }
      data.plan = plan;
    }
    if (role !== undefined) {
      if (!['USER', 'ADMIN'].includes(role)) {
        return res.status(400).json({ message: 'Rôle invalide' });
      }
      data.role = role;
    }

    const user = await prisma.user.update({
      where: { id },
      data,
      select: userPublicSelect,
    });
    res.json({ message: 'Utilisateur mis à jour', user });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }
    next(error);
  }
};

exports.deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (id === req.user.id) {
      return res.status(400).json({ message: 'Vous ne pouvez pas supprimer votre propre compte' });
    }
    await prisma.user.delete({ where: { id } });
    res.json({ message: 'Utilisateur supprimé' });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }
    next(error);
  }
};

exports.listTrees = async (req, res, next) => {
  try {
    const { isDemo, visibility, page = '1', limit = '20' } = req.query;
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const take = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * take;

    const where = {};
    if (isDemo === 'true') where.isDemo = true;
    if (isDemo === 'false') where.isDemo = false;
    if (visibility && ['PRIVATE', 'SHARED', 'PUBLIC'].includes(visibility)) {
      where.visibility = visibility;
    }

    const [trees, total] = await Promise.all([
      prisma.familyTree.findMany({
        where,
        skip,
        take,
        orderBy: { updatedAt: 'desc' },
        include: {
          User: { select: { id: true, email: true, name: true } },
          _count: { select: { Person: true } },
        },
      }),
      prisma.familyTree.count({ where }),
    ]);

    res.json({
      trees,
      pagination: { page: pageNum, limit: take, total, pages: Math.ceil(total / take) },
    });
  } catch (error) {
    next(error);
  }
};

exports.deleteTree = async (req, res, next) => {
  try {
    const tree = await prisma.familyTree.findUnique({ where: { id: req.params.id } });
    if (!tree) {
      return res.status(404).json({ message: 'Arbre non trouvé' });
    }
    if (tree.isDemo) {
      return res.status(400).json({
        message: 'Utilisez la réinitialisation démo au lieu de supprimer l\'arbre démo',
      });
    }
    await prisma.familyTree.delete({ where: { id: req.params.id } });
    res.json({ message: 'Arbre supprimé' });
  } catch (error) {
    next(error);
  }
};

exports.resetDemo = async (req, res, next) => {
  try {
    const demoTree = await resetDemoTree();
    res.json({
      message: 'Arbre démo réinitialisé',
      tree: demoTree,
    });
  } catch (error) {
    next(error);
  }
};

exports.getDemoInfo = async (req, res, next) => {
  try {
    const tree = await getDemoTreeInfo();
    res.json({ tree });
  } catch (error) {
    next(error);
  }
};

exports.getStorage = async (req, res, next) => {
  try {
    const [documentsTotal, photosTotal, recentDocuments] = await Promise.all([
      prisma.personDocument.count(),
      prisma.person.count({ where: { photoUrl: { not: null } } }),
      prisma.personDocument.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          title: true,
          fileName: true,
          mimeType: true,
          sizeBytes: true,
          category: true,
          createdAt: true,
          Person: { select: { firstName: true, lastName: true } },
        },
      }),
    ]);

    res.json({
      storage: {
        enabled: storage.isEnabled(),
        ready: storage.isReady(),
        proxyUrl: storage.isReady() ? storage.getProxyBaseUrl?.() : null,
        publicConfig: storage.getPublicConfig?.(),
      },
      counts: {
        documents: documentsTotal,
        photos: photosTotal,
      },
      recentDocuments,
    });
  } catch (error) {
    next(error);
  }
};

exports.getPlans = async (req, res, next) => {
  try {
    const planGroups = await prisma.user.groupBy({
      by: ['plan'],
      _count: { plan: true },
    });
    const distribution = Object.fromEntries(planGroups.map((g) => [g.plan, g._count.plan]));
    res.json({
      plans: Object.values(PLANS),
      userCountByPlan: distribution,
      usersTotal: planGroups.reduce((s, g) => s + g._count.plan, 0),
    });
  } catch (error) {
    next(error);
  }
};
