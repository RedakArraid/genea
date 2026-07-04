const prisma = require('../lib/prisma');
const { PLANS } = require('../lib/plans');

exports.listPlans = (req, res) => {
  res.json({ plans: Object.values(PLANS) });
};

exports.getMyPlan = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { plan: true },
    });
    const plan = PLANS[user.plan] || PLANS.SOLO;
    res.json({ plan: user.plan, limits: plan });
  } catch (error) {
    next(error);
  }
};

exports.upgradePlan = async (req, res, next) => {
  try {
    const { plan } = req.body;
    if (!['SOLO', 'FAMILY', 'PATRIMONY'].includes(plan)) {
      return res.status(400).json({ message: 'Forfait invalide' });
    }
    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: { plan },
      select: { id: true, email: true, name: true, plan: true, createdAt: true, updatedAt: true },
    });
    res.json({
      message: `Forfait ${PLANS[plan].name} activé (simulation — sans paiement)`,
      user,
      limits: PLANS[plan],
    });
  } catch (error) {
    next(error);
  }
};
