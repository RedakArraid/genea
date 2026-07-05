const prisma = require('../lib/prisma');
const { CURRENCY, getPlanPrice, getPlanLimits } = require('../lib/plans');
const { validatePromoCode, applyDiscount } = require('../lib/promo');
const { generateReference, fulfillPayment } = require('../lib/payments/fulfill');
const payments = require('../lib/payments');
const { sendError } = require('../lib/apiErrors');

function publicBaseUrl() {
  return process.env.FRONTEND_URL || process.env.CORS_ORIGIN?.split(',')[0] || 'http://localhost:5173';
}

exports.previewCheckout = async (req, res, next) => {
  try {
    const { plan, promoCode, billingInterval = 'yearly' } = req.body;
    if (!['SOLO', 'FAMILY', 'PATRIMONY'].includes(plan)) {
      return sendError(res, 400, 'INVALID_PLAN', 'Forfait invalide');
    }
    if (billingInterval === 'monthly' && plan !== 'PATRIMONY') {
      return sendError(res, 400, 'INVALID_BILLING_INTERVAL', 'Facturation mensuelle disponible uniquement pour Patrimoine');
    }
    const baseAmount = getPlanPrice(plan, billingInterval);
    let promo = null;
    if (promoCode) {
      const validated = await validatePromoCode(promoCode, plan);
      promo = validated.promo;
    }
    const finalAmount = applyDiscount(baseAmount, promo);
    res.json({
      plan,
      billingInterval,
      currency: CURRENCY,
      baseAmount,
      finalAmount,
      promo: promo ? { code: promo.code, discountType: promo.discountType, discountValue: promo.discountValue } : null,
      limits: getPlanLimits(plan),
    });
  } catch (error) {
    if (error.statusCode) return res.status(error.statusCode).json({ message: error.message });
    next(error);
  }
};

exports.initializeCheckout = async (req, res, next) => {
  try {
    const { plan, promoCode, billingInterval = 'yearly' } = req.body;
    if (!['SOLO', 'FAMILY', 'PATRIMONY'].includes(plan)) {
      return sendError(res, 400, 'INVALID_PLAN', 'Forfait invalide');
    }
    if (billingInterval === 'monthly' && plan !== 'PATRIMONY') {
      return sendError(res, 400, 'INVALID_BILLING_INTERVAL', 'Facturation mensuelle disponible uniquement pour Patrimoine');
    }

    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user.email) {
      return sendError(
        res,
        400,
        'EMAIL_REQUIRED_FOR_PAYMENT',
        'Ajoutez une adresse email à votre profil pour effectuer un paiement en ligne.',
      );
    }

    const baseAmount = getPlanPrice(plan, billingInterval);
    let promo = null;
    if (promoCode) {
      const validated = await validatePromoCode(promoCode, plan);
      promo = validated.promo;
    }
    const finalAmount = applyDiscount(baseAmount, promo);
    if (finalAmount <= 0) {
      return sendError(res, 400, 'INVALID_AMOUNT', 'Montant invalide après réduction');
    }

    const reference = generateReference('genea');
    const callbackUrl = `${publicBaseUrl()}/billing/callback?reference=${reference}`;

    const checkout = await payments.initializeCheckout({
      paystack: {
        email: user.email,
        amountUsd: finalAmount,
        reference,
        callbackUrl,
        metadata: { userId: user.id, plan, billingInterval, promoCodeId: promo?.id || null },
      },
    });

    await prisma.payment.create({
      data: {
        userId: user.id,
        reference,
        provider: checkout.provider,
        amount: finalAmount,
        currency: CURRENCY,
        plan,
        status: 'PENDING',
        promoCodeId: promo?.id || null,
        metadata: { baseAmount, promoCode: promo?.code || null, billingInterval },
      },
    });

    res.json({
      provider: checkout.provider,
      authorizationUrl: checkout.authorizationUrl,
      reference,
      amount: finalAmount,
      currency: CURRENCY,
    });
  } catch (error) {
    next(error);
  }
};

exports.verifyCheckout = async (req, res, next) => {
  try {
    const { reference } = req.params;
    const payment = await prisma.payment.findUnique({ where: { reference } });
    if (!payment) {
      return res.status(404).json({ message: 'Paiement introuvable' });
    }
    if (payment.userId !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Accès refusé' });
    }
    if (payment.status === 'SUCCESS') {
      return res.json({ status: 'success', payment, plan: payment.plan });
    }

    const verified = await payments.verifyCheckout(payment.provider, reference);
    if (verified.success && verified.amount >= payment.amount) {
      await fulfillPayment(payment.id);
      const updated = await prisma.payment.findUnique({ where: { id: payment.id } });
      const user = await prisma.user.findUnique({
        where: { id: payment.userId },
        select: { id: true, email: true, plan: true, planActive: true, planExpiresAt: true },
      });
      return res.json({ status: 'success', payment: updated, user, plan: payment.plan });
    }

    await prisma.payment.update({
      where: { id: payment.id },
      data: { status: 'FAILED' },
    });
    res.json({ status: 'failed', message: verified.message || 'Paiement non confirmé' });
  } catch (error) {
    next(error);
  }
};

exports.paystackWebhook = async (req, res, next) => {
  try {
    const signature = req.headers['x-paystack-signature'];
    const rawBody = req.rawBody || JSON.stringify(req.body);
    if (!payments.paystack.verifyWebhookSignature(rawBody, signature)) {
      return res.status(401).json({ message: 'Signature invalide' });
    }

    const event = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    if (event.event === 'charge.success') {
      const reference = event.data?.reference;
      const payment = await prisma.payment.findUnique({ where: { reference } });
      if (payment && payment.status !== 'SUCCESS') {
        await fulfillPayment(payment.id);
      }
    }
    res.sendStatus(200);
  } catch (error) {
    next(error);
  }
};

exports.getPublicConfig = (req, res) => {
  res.json({
    currency: CURRENCY,
    providers: {
      paystack: payments.paystack.isConfigured(),
    },
    paystackPublicKey: process.env.PAYSTACK_PUBLIC_KEY || null,
  });
};
