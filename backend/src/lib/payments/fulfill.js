const crypto = require('crypto');
const prisma = require('../prisma');
const { getPlanLimits, getPlanDurationDays } = require('../plans');
const { incrementPromoUsage } = require('../promo');

async function fulfillPayment(paymentId) {
  const payment = await prisma.payment.findUnique({ where: { id: paymentId } });
  if (!payment || payment.status === 'SUCCESS') {
    return payment;
  }

  const user = await prisma.user.findUnique({ where: { id: payment.userId } });
  const limits = getPlanLimits(payment.plan);
  const billingInterval = payment.metadata?.billingInterval || 'yearly';
  const durationDays = getPlanDurationDays(payment.plan, billingInterval);
  const now = new Date();
  let expiresAt = durationDays
    ? new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000)
    : null;

  if (payment.plan !== 'SOLO' && user.planExpiresAt && new Date(user.planExpiresAt) > now) {
    expiresAt = new Date(new Date(user.planExpiresAt).getTime() + durationDays * 24 * 60 * 60 * 1000);
  }

  const [updatedPayment] = await prisma.$transaction([
    prisma.payment.update({
      where: { id: paymentId },
      data: { status: 'SUCCESS', paidAt: new Date() },
    }),
    prisma.user.update({
      where: { id: payment.userId },
      data: {
        plan: payment.plan,
        planActive: true,
        planExpiresAt: expiresAt,
      },
    }),
  ]);

  if (payment.promoCodeId) {
    await incrementPromoUsage(payment.promoCodeId);
  }

  return updatedPayment;
}

function generateReference(prefix = 'genea') {
  return `${prefix}_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
}

function isPlanEntitlementActive(user) {
  if (!user?.planActive) return false;
  if (!user.planExpiresAt) return true;
  return new Date(user.planExpiresAt) > new Date();
}

module.exports = { fulfillPayment, generateReference, isPlanEntitlementActive };
