const prisma = require('./prisma');
const { computeDiscountedAmount } = require('./plans');

async function validatePromoCode(code, planId) {
  if (!code?.trim()) return { valid: true, promo: null, finalAmount: null };

  const promo = await prisma.promoCode.findUnique({
    where: { code: code.trim().toUpperCase() },
  });

  if (!promo || !promo.active) {
    const err = new Error('Code promo invalide');
    err.statusCode = 400;
    throw err;
  }

  const now = new Date();
  if (promo.validFrom && now < promo.validFrom) {
    const err = new Error('Code promo pas encore actif');
    err.statusCode = 400;
    throw err;
  }
  if (promo.validUntil && now > promo.validUntil) {
    const err = new Error('Code promo expiré');
    err.statusCode = 400;
    throw err;
  }
  if (promo.maxUses != null && promo.usedCount >= promo.maxUses) {
    const err = new Error('Code promo épuisé');
    err.statusCode = 400;
    throw err;
  }

  if (promo.applicablePlans?.length && !promo.applicablePlans.includes(planId)) {
    const err = new Error('Code promo non applicable à ce forfait');
    err.statusCode = 400;
    throw err;
  }

  return { valid: true, promo };
}

function applyDiscount(baseXof, promo) {
  return computeDiscountedAmount(baseXof, promo);
}

async function incrementPromoUsage(promoId) {
  if (!promoId) return;
  await prisma.promoCode.update({
    where: { id: promoId },
    data: { usedCount: { increment: 1 } },
  });
}

module.exports = { validatePromoCode, applyDiscount, incrementPromoUsage };
