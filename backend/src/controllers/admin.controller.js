/**
 * Contrôleur admin — back-office plateforme
 */

const prisma = require('../lib/prisma');
const storage = require('../lib/storage');
const { PLANS } = require('../lib/plans');
const { resetDemoTree, getDemoTreeInfo } = require('../lib/demoTree');
const { getPublicSmtpSettings, updateSmtpSettings } = require('../lib/smtpSettings');
const { sendMail, verifySmtpConnection, resetTransporter } = require('../lib/mail');
const { getPublicOpenWaSettings, updateOpenWaSettings } = require('../lib/openWaSettings');
const { getSessionStatus, sendTextMessage, pingOpenWa } = require('../lib/openWa');
const { buildOtpTestMessage } = require('../lib/otpWhatsappTemplates');
const { normalizePhone, isValidPhone } = require('../lib/phone');

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

exports.listPromoCodes = async (req, res, next) => {
  try {
    const codes = await prisma.promoCode.findMany({ orderBy: { createdAt: 'desc' } });
    res.json({ promoCodes: codes });
  } catch (error) {
    next(error);
  }
};

exports.createPromoCode = async (req, res, next) => {
  try {
    const {
      code,
      description,
      discountType,
      discountValue,
      maxUses,
      validFrom,
      validUntil,
      applicablePlans = [],
      active = true,
    } = req.body;

    if (!code?.trim()) {
      return res.status(400).json({ message: 'Code requis' });
    }
    if (!['PERCENT', 'FIXED'].includes(discountType)) {
      return res.status(400).json({ message: 'Type de réduction invalide' });
    }
    if (!discountValue || discountValue < 1) {
      return res.status(400).json({ message: 'Valeur de réduction invalide' });
    }
    if (discountType === 'PERCENT' && discountValue > 100) {
      return res.status(400).json({ message: 'Pourcentage max 100' });
    }

    const promo = await prisma.promoCode.create({
      data: {
        code: code.trim().toUpperCase(),
        description,
        discountType,
        discountValue,
        maxUses: maxUses ?? null,
        validFrom: validFrom ? new Date(validFrom) : null,
        validUntil: validUntil ? new Date(validUntil) : null,
        applicablePlans: applicablePlans.filter((p) => ['SOLO', 'FAMILY', 'PATRIMONY'].includes(p)),
        active,
      },
    });
    res.status(201).json({ message: 'Code promo créé', promoCode: promo });
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(400).json({ message: 'Ce code existe déjà' });
    }
    next(error);
  }
};

exports.updatePromoCode = async (req, res, next) => {
  try {
    const { id } = req.params;
    const data = {};
    ['description', 'discountType', 'discountValue', 'maxUses', 'active'].forEach((f) => {
      if (req.body[f] !== undefined) data[f] = req.body[f];
    });
    if (req.body.validFrom !== undefined) data.validFrom = req.body.validFrom ? new Date(req.body.validFrom) : null;
    if (req.body.validUntil !== undefined) data.validUntil = req.body.validUntil ? new Date(req.body.validUntil) : null;
    if (req.body.applicablePlans !== undefined) {
      data.applicablePlans = req.body.applicablePlans.filter((p) => ['SOLO', 'FAMILY', 'PATRIMONY'].includes(p));
    }

    const promo = await prisma.promoCode.update({ where: { id: req.params.id }, data });
    res.json({ message: 'Code promo mis à jour', promoCode: promo });
  } catch (error) {
    if (error.code === 'P2025') return res.status(404).json({ message: 'Code introuvable' });
    next(error);
  }
};

exports.deletePromoCode = async (req, res, next) => {
  try {
    await prisma.promoCode.delete({ where: { id: req.params.id } });
    res.json({ message: 'Code promo supprimé' });
  } catch (error) {
    if (error.code === 'P2025') return res.status(404).json({ message: 'Code introuvable' });
    next(error);
  }
};

exports.getSmtpSettings = async (req, res, next) => {
  try {
    const smtp = await getPublicSmtpSettings();
    res.json({ smtp });
  } catch (error) {
    next(error);
  }
};

exports.updateSmtpSettings = async (req, res, next) => {
  try {
    const { host, port, secure, user, pass, from } = req.body;
    const smtp = await updateSmtpSettings({ host, port, secure, user, pass, from });
    resetTransporter();
    res.json({ message: 'Configuration SMTP enregistrée', smtp });
  } catch (error) {
    next(error);
  }
};

exports.testSmtpSettings = async (req, res, next) => {
  try {
    const to = req.body.to?.trim() || req.user.email;
    if (!to) {
      return res.status(400).json({ message: 'Adresse email de test requise' });
    }

    await verifySmtpConnection();
    await sendMail({
      to,
      subject: 'GeneaIA — test SMTP',
      text: 'Cet email confirme que la configuration SMTP GeneaIA fonctionne correctement.',
      html: '<p>Cet email confirme que la configuration SMTP <strong>GeneaIA</strong> fonctionne correctement.</p>',
    });

    res.json({ message: `Email de test envoyé à ${to}` });
  } catch (error) {
    res.status(400).json({
      message: error.message || 'Échec du test SMTP',
    });
  }
};

exports.getOpenWaSettings = async (req, res, next) => {
  try {
    const openwa = await getPublicOpenWaSettings();
    res.json({ openwa });
  } catch (error) {
    next(error);
  }
};

exports.updateOpenWaSettings = async (req, res, next) => {
  try {
    const { enabled, baseUrl, apiKey, sessionId } = req.body;
    const openwa = await updateOpenWaSettings({ enabled, baseUrl, apiKey, sessionId });
    res.json({ message: 'Configuration OpenWA enregistrée', openwa });
  } catch (error) {
    next(error);
  }
};

exports.getOpenWaStatus = async (req, res, next) => {
  try {
    const settings = await getPublicOpenWaSettings();
    if (!settings.configured) {
      return res.json({
        reachable: false,
        configured: false,
        message: 'OpenWA non configuré',
      });
    }

    try {
      await pingOpenWa();
      const session = await getSessionStatus();
      res.json({
        reachable: true,
        configured: true,
        session,
      });
    } catch (error) {
      res.json({
        reachable: false,
        configured: true,
        message: error.message || 'OpenWA injoignable',
      });
    }
  } catch (error) {
    next(error);
  }
};

exports.testOpenWaSettings = async (req, res, next) => {
  try {
    const rawPhone = req.body.phone?.trim();
    if (!rawPhone) {
      return res.status(400).json({ message: 'Numéro de téléphone de test requis' });
    }

    const phone = normalizePhone(rawPhone, req.body.phoneCountry || 'CI');
    if (!phone || !isValidPhone(phone)) {
      return res.status(400).json({ message: 'Numéro de téléphone invalide' });
    }

    const session = await getSessionStatus();
    if (!session.connected) {
      return res.status(400).json({
        message: `Session WhatsApp non connectée (statut : ${session.status})`,
      });
    }

    await sendTextMessage(phone, buildOtpTestMessage());
    res.json({ message: `Message de test WhatsApp envoyé au ${rawPhone}` });
  } catch (error) {
    res.status(400).json({
      message: error.message || 'Échec du test OpenWA',
    });
  }
};
