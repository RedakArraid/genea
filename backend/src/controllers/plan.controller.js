const prisma = require('../lib/prisma');
const { PLANS, listPlansForApi } = require('../lib/plans');
const { getEffectivePlanLimits, isPlanEntitlementActive } = require('../lib/planAccess');

exports.listPlans = (req, res) => {
  res.json({ plans: listPlansForApi() });
};

exports.getMyPlan = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { plan: true, planActive: true, planExpiresAt: true },
    });
    const limits = getEffectivePlanLimits(user);
    res.json({
      plan: user.plan,
      planActive: isPlanEntitlementActive(user),
      planExpiresAt: user.planExpiresAt,
      limits,
      catalog: listPlansForApi(),
    });
  } catch (error) {
    next(error);
  }
};

exports.upgradePlan = async (req, res) => {
  res.status(402).json({
    message: 'Paiement requis — utilisez POST /api/billing/initialize',
    billingUrl: '/pricing',
  });
};
