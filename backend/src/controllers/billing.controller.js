const prisma = require('../lib/prisma');
const { PLANS, CURRENCY, getPlanPriceXof, getPlanLimits } = require('../lib/plans');
const { validatePromoCode, applyDiscount } = require('../lib/promo');
const { generateReference, fulfillPayment } = require('../lib/payments/fulfill');
const payments = require('../lib/payments');

function publicBaseUrl() {
  return process.env.FRONTEND_URL || process.env.CORS_ORIGIN?.split(',')[0] || 'http://localhost:5173';
}

function apiBaseUrl() {
  return process.env.API_PUBLIC_URL || `http://localhost:${process.env.PORT || 3001}`;
}

exports.previewCheckout = async (req, res, next) => {
  try {
    const { plan, promoCode } = req.body;
    if (!['SOLO', 'FAMILY', 'PATRIMONY'].includes(plan)) {
      return res.status(400).json({ message: 'Forfait invalide' });
    }
    const baseAmount = getPlanPriceXof(plan);
    let promo = null;
    if (promoCode) {
      const validated = await validatePromoCode(promoCode, plan);
      promo = validated.promo;
    }
    const finalAmount = applyDiscount(baseAmount, promo);
    res.json({
      plan,
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
    const { plan, promoCode } = req.body;
    if (!['SOLO', 'FAMILY', 'PATRIMONY'].includes(plan)) {
      return res.status(400).json({ message: 'Forfait invalide' });
    }

    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    const baseAmount = getPlanPriceXof(plan);
    let promo = null;
    if (promoCode) {
      const validated = await validatePromoCode(promoCode, plan);
      promo = validated.promo;
    }
    const finalAmount = applyDiscount(baseAmount, promo);
    if (finalAmount <= 0) {
      return res.status(400).json({ message: 'Montant invalide après réduction' });
    }

    const reference = generateReference('genea');
    const callbackUrl = `${publicBaseUrl()}/billing/callback?reference=${reference}`;
    const notifyUrl = `${apiBaseUrl()}/api/billing/webhooks/cinetpay`;

    const checkout = await payments.initializeCheckout({
      paystack: {
        email: user.email,
        amountXof: finalAmount,
        reference,
        callbackUrl,
        metadata: { userId: user.id, plan, promoCodeId: promo?.id || null },
      },
      cinetpay: {
        transactionId: reference,
        amountXof: finalAmount,
        description: `GeneaIA — Forfait ${PLANS[plan].name}`,
        notifyUrl,
        returnUrl: callbackUrl,
        customerName: user.name || user.email,
        customerEmail: user.email,
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
        metadata: { baseAmount, promoCode: promo?.code || null },
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

exports.cinetpayWebhook = async (req, res, next) => {
  try {
    const transactionId = req.body?.cpm_trans_id || req.body?.transaction_id || req.query?.transaction_id;
    if (!transactionId) {
      return res.status(200).send('OK');
    }
    const payment = await prisma.payment.findUnique({ where: { reference: transactionId } });
    if (!payment) {
      return res.status(200).send('OK');
    }
    if (payment.status === 'SUCCESS') {
      return res.status(200).send('OK');
    }

    const verified = await payments.cinetpay.verifyPayment(transactionId);
    if (verified.success) {
      await fulfillPayment(payment.id);
    }
    res.status(200).send('OK');
  } catch (error) {
    console.error('CinetPay webhook:', error.message);
    res.status(200).send('OK');
  }
};

exports.getPublicConfig = (req, res) => {
  res.json({
    currency: CURRENCY,
    country: 'CI',
    providers: {
      paystack: payments.paystack.isConfigured(),
      cinetpay: payments.cinetpay.isConfigured(),
    },
    paystackPublicKey: process.env.PAYSTACK_PUBLIC_KEY || null,
  });
};
